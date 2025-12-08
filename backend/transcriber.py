import os
import re
import warnings
from datetime import timedelta
import subprocess

warnings.filterwarnings("ignore")

import torch
import whisper
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from moviepy.editor import VideoFileClip
import srt
import imageio_ffmpeg

# Descarga YouTube
try:
    import yt_dlp
except ImportError:
    yt_dlp = None

try:
    from pytube import YouTube
except ImportError:
    YouTube = None


class YouTubeTranscriber:
    """
    Sistema de Transcripción y Traducción de Videos de YouTube
    Soporta: Español, Inglés y Quechua
    Salida: SRT o MP4 con subtítulos incrustados

    Perfiles:
    - Perfil "600m":
        * Whisper: medium
        * NLLB: facebook/nllb-200-distilled-600M
    - Perfil "1.3b":
        * Whisper: large-v3
        * NLLB: facebook/nllb-200-1.3B

    Traducción:
        * Si el video está en el mismo idioma que el destino -> NO traduce (solo transcribe).
        * es ↔ en: traducción directa.
        * es ↔ qu: traducción directa.
        * en → qu: primero en → es, luego es → qu.
    """

    def __init__(self, profile: str = "600m"):
        # Dispositivo
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"⚙️  Usando dispositivo: {self.device}")

        # Modelos (se cargan vía set_profile)
        self.whisper_model = None
        self.whisper_model_name = None

        self.translation_model_size = None  # "600m" | "1.3b"
        self.nllb_model_name = None
        self.tokenizer = None
        self.translation_model = None

        # Mapeo de idiomas a códigos NLLB
        self.lang_code_map = {
            "es": "spa_Latn",
            "en": "eng_Latn",
            "qu": "quy_Latn",  # Quechua
        }

        # Cargar perfil inicial
        self.set_profile(profile)

    # ------------------------------------------------------------------
    # Perfiles (cambia Whisper + NLLB a la vez)
    # ------------------------------------------------------------------
    def set_profile(self, profile: str):
        """
        Cambia el perfil completo de calidad:
        - "600m": Whisper medium + NLLB 600M
        - "1.3b": Whisper large-v3 + NLLB 1.3B
        """
        norm = str(profile).lower().strip()
        if norm in ("600", "600m", "small", "fast", "rapido", "rápido"):
            norm = "600m"
            whisper_name = "medium"
            nllb_name = "facebook/nllb-200-distilled-600M"
            readable = "Perfil rápido (Whisper medium + NLLB 600M)"
        elif norm in ("1300", "1300m", "1.3b", "1b3", "large", "quality"):
            norm = "1.3b"
            whisper_name = "large-v3"
            nllb_name = "facebook/nllb-200-1.3B"
            readable = "Perfil alta calidad (Whisper large-v3 + NLLB 1.3B)"
        else:
            raise ValueError("Perfil inválido. Usa '600m' o '1.3b'.")

        print(f"\n🔁 Cambiando perfil de modelos: {readable}")

        # Cargar Whisper adecuado
        self._load_whisper_model(whisper_name)
        # Cargar NLLB adecuado
        self._load_translation_model(norm, nllb_name)

    def _load_whisper_model(self, model_name: str):
        """
        Carga Whisper solo si hace falta. Libera la GPU si cambia.
        """
        if self.whisper_model is not None and self.whisper_model_name == model_name:
            # Ya está cargado este modelo
            return

        if self.whisper_model is not None:
            try:
                del self.whisper_model
                torch.cuda.empty_cache()
                print("🧹 Memoria GPU de Whisper liberada.")
            except Exception:
                pass

        print(f"📥 Cargando modelo Whisper: {model_name} ...")
        self.whisper_model = whisper.load_model(model_name, device=self.device)
        self.whisper_model_name = model_name
        print("✅ Whisper listo.")

    def _load_translation_model(self, size_key: str, model_name: str):
        """
        Carga el modelo de traducción NLLB de tamaño size_key (600m o 1.3b).
        """
        if (
            self.translation_model is not None
            and self.translation_model_size == size_key
            and self.nllb_model_name == model_name
        ):
            return

        if self.translation_model is not None:
            try:
                del self.translation_model
                torch.cuda.empty_cache()
                print("🧹 Memoria GPU de NLLB liberada.")
            except Exception:
                pass

        print(f"📥 Cargando modelo de traducción NLLB: {model_name} ...")
        self.nllb_model_name = model_name
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.translation_model = AutoModelForSeq2SeqLM.from_pretrained(
            model_name
        ).to(self.device)

        self.translation_model_size = size_key
        print("✅ Modelo de traducción listo.")

    # ------------------------------------------------------------------
    # Utilidades de nombres / duración
    # ------------------------------------------------------------------
    def _slugify(self, text, max_len=15):
        text = text.strip()
        text = re.sub(r"\s+", "_", text)
        text = re.sub(r"[^A-Za-z0-9_]+", "", text)
        if not text:
            text = "video"
        return text[:max_len]

    def _build_output_path(self, base_name, src_lang, tgt_lang, output_format):
        os.makedirs("output", exist_ok=True)

        slug = self._slugify(base_name)

        if tgt_lang == "none" or tgt_lang is None:
            lang_tag = src_lang or "orig"
        else:
            lang_tag = f"{src_lang}-{tgt_lang}"

        if output_format == "srt":
            ext = "srt"
            fmt_tag = "srt"
        else:
            ext = "mp4"
            fmt_tag = "sub"

        filename = f"{slug}_{lang_tag}_{fmt_tag}.{ext}"
        output_path = os.path.join("output", filename)

        if os.path.exists(output_path):
            version = 2
            while True:
                filename = f"{slug}_{lang_tag}_{fmt_tag}_v{version}.{ext}"
                output_path = os.path.join("output", filename)
                if not os.path.exists(output_path):
                    break
                version += 1

        return output_path

    @staticmethod
    def format_duration(seconds):
        if seconds is None:
            return "desconocida"
        seconds = int(seconds)
        h = seconds // 3600
        m = (seconds % 3600) // 60
        s = seconds % 60
        return f"{h:02d}:{m:02d}:{s:02d}"

    # ------------------------------------------------------------------
    # Descarga YouTube
    # ------------------------------------------------------------------
    def download_youtube_video(self, url):
        os.makedirs("downloads", exist_ok=True)

        # 1) yt-dlp
        if yt_dlp is not None:
            print("⬇️  Intentando descargar con yt-dlp...")
            try:
                ydl_opts = {
                    "format": "mp4",
                    "outtmpl": os.path.join("downloads", "%(title)s.%(ext)s"),
                    "quiet": False,
                    "noplaylist": True,
                }
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=True)
                    filename = ydl.prepare_filename(info)
                    title = info.get("title") or "Video de YouTube"
                    if not filename.endswith(".mp4"):
                        base, _ = os.path.splitext(filename)
                        filename_mp4 = base + ".mp4"
                        if os.path.exists(filename_mp4):
                            filename = filename_mp4
                    print(f"✅ Video descargado: {filename}")
                    return filename, title
            except Exception as e:
                print(f"⚠️  Falló yt-dlp: {e}")

        # 2) pytube
        if YouTube is not None:
            print("⬇️  Intentando descargar con pytube...")
            try:
                yt = YouTube(url)
                stream = (
                    yt.streams.filter(progressive=True, file_extension="mp4")
                    .order_by("resolution")
                    .desc()
                    .first()
                )
                filename = stream.download(output_path="downloads")
                title = yt.title or "Video de YouTube"
                print(f"✅ Video descargado: {filename}")
                return filename, title
            except Exception as e:
                print(f"❌ Error con pytube: {e}")

        raise RuntimeError(
            "No se pudo descargar el video. Instala correctamente 'yt-dlp' o 'pytube'."
        )

    # ------------------------------------------------------------------
    # Limpieza de repeticiones
    # ------------------------------------------------------------------
    def _reduce_repetitions(self, text, max_word_repeat=3):
        if not text:
            return text

        tokens = text.split()
        new_tokens = []
        last = None
        count = 0

        for tok in tokens:
            if tok == last:
                count += 1
                if count <= max_word_repeat:
                    new_tokens.append(tok)
            else:
                last = tok
                count = 1
                new_tokens.append(tok)

        text1 = " ".join(new_tokens)

        pattern = r'(\b\w+(?:\s+\w+){0,3}\b)(?:\s+\1){2,}'
        text2 = re.sub(pattern, r'\1 \1', text1)

        return text2

    # ------------------------------------------------------------------
    # Transcripción con Whisper
    # ------------------------------------------------------------------
    def transcribe_video(self, video_path):
        print(
            f"\n🎙️  Iniciando transcripción con Whisper ({self.whisper_model_name})..."
        )

        transcribe_kwargs = {
            "task": "transcribe",
            "verbose": False,
            "temperature": 0.0,
            "condition_on_previous_text": False,
            "language": None,
        }

        result = self.whisper_model.transcribe(video_path, **transcribe_kwargs)
        detected = result.get("language", "es")
        print(f"🌐 Idioma detectado por Whisper: {detected}")
        return result

    # ------------------------------------------------------------------
    # Traducción con NLLB
    # ------------------------------------------------------------------
    def translate_text(self, text, source_lang, target_lang):
        text = text.strip()
        if not text:
            return text

        if target_lang == "none" or source_lang == target_lang:
            return text

        # en -> qu via es
        if source_lang == "en" and target_lang == "qu":
            intermediate = self.translate_text(text, "en", "es")
            return self.translate_text(intermediate, "es", "qu")

        if source_lang not in self.lang_code_map or target_lang not in self.lang_code_map:
            print(
                f"⚠️  Traducción {source_lang} -> {target_lang} no soportada por NLLB. Devolviendo texto original."
            )
            return text

        if self.translation_model is None or self.tokenizer is None:
            raise RuntimeError("Modelo de traducción no cargado.")

        src_code = self.lang_code_map[source_lang]
        tgt_code = self.lang_code_map[target_lang]

        try:
            self.tokenizer.src_lang = src_code
            encoded = self.tokenizer(
                text,
                return_tensors="pt",
                truncation=True,
                max_length=512,
            ).to(self.device)

            lang_code_to_id = getattr(self.tokenizer, "lang_code_to_id", None)
            if isinstance(lang_code_to_id, dict) and tgt_code in lang_code_to_id:
                forced_bos_token_id = lang_code_to_id[tgt_code]
            else:
                forced_bos_token_id = self.tokenizer.convert_tokens_to_ids(tgt_code)

            generated_tokens = self.translation_model.generate(
                **encoded,
                forced_bos_token_id=forced_bos_token_id,
                max_length=196,
                num_beams=6,
                no_repeat_ngram_size=5,
                repetition_penalty=1.3,
                length_penalty=0.9,
            )

            translated = self.tokenizer.batch_decode(
                generated_tokens, skip_special_tokens=True
            )[0]
            translated = translated.strip()
            translated = self._reduce_repetitions(translated)

            return translated
        except Exception as e:
            print(f"⚠️  Error al traducir segmento: {e}")
            return text

    def translate_transcription(self, transcription, source_lang, target_lang):
        if target_lang == "none" or source_lang == target_lang:
            return transcription

        print(
            f"\n🌐 Traduciendo de {source_lang} a {target_lang} usando modelo NLLB {self.translation_model_size}..."
        )

        new_transcription = dict(transcription)
        new_segments = []

        for i, seg in enumerate(transcription.get("segments", []), start=1):
            original_text = seg.get("text", "")
            translated_text = self.translate_text(
                original_text, source_lang, target_lang
            )
            new_seg = dict(seg)
            new_seg["text"] = translated_text
            new_segments.append(new_seg)

            if i % 20 == 0:
                print(f"   Progreso: {i} segmentos traducidos...")

        new_transcription["segments"] = new_segments
        new_transcription["language"] = target_lang
        print("✅ Traducción completa.")
        return new_transcription

    # ------------------------------------------------------------------
    # Creación de SRT
    # ------------------------------------------------------------------
    def create_srt(self, segments, output_path):
        print(f"\n📝 Generando archivo SRT: {output_path}")

        subtitles = []
        for i, seg in enumerate(segments, start=1):
            start = timedelta(seconds=float(seg["start"]))
            end = timedelta(seconds=float(seg["end"]))
            text = seg["text"].strip()
            subtitles.append(
                srt.Subtitle(index=i, start=start, end=end, content=text)
            )

        srt_content = srt.compose(subtitles)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(srt_content)

        print("✅ SRT generado correctamente.")
        return output_path

    # ------------------------------------------------------------------
    # Video con subtítulos
    # ------------------------------------------------------------------
    def create_video_with_subtitles(self, video_path, segments, output_path):
        print(f"\n🎥 Generando video con subtítulos (ffmpeg): {output_path}")

        os.makedirs("output", exist_ok=True)
        temp_srt_path = os.path.join("output", "_temp_subs.srt")

        subtitles = []
        for i, seg in enumerate(segments, start=1):
            start = timedelta(seconds=float(seg["start"]))
            end = timedelta(seconds=float(seg["end"]))
            text = seg["text"].strip()
            subtitles.append(
                srt.Subtitle(index=i, start=start, end=end, content=text)
            )

        srt_content = srt.compose(subtitles)
        with open(temp_srt_path, "w", encoding="utf-8") as f:
            f.write(srt_content)

        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        safe_srt_path = temp_srt_path.replace("\\", "/")

        cmd = [
            ffmpeg_exe,
            "-y",
            "-i",
            video_path,
            "-vf",
            f"subtitles={safe_srt_path}",
            "-c:v",
            "libx264",
            "-c:a",
            "copy",
            "-map",
            "0:v:0",
            "-map",
            "0:a:0",
            output_path,
        ]

        try:
            subprocess.run(cmd, check=True)
            print("✅ Video con subtítulos generado correctamente.")
        except subprocess.CalledProcessError as e:
            print("❌ Error al ejecutar ffmpeg para incrustar subtítulos:", e)
            raise

        try:
            os.remove(temp_srt_path)
        except OSError:
            pass

        return output_path

    # ------------------------------------------------------------------
    # Flujo principal para backend web
    # ------------------------------------------------------------------
    def process_video(
        self, video_path, target_language="none", output_format="srt"
    ):
        transcription = self.transcribe_video(video_path)

        detected_language = transcription.get("language", "es")
        if detected_language not in ("es", "en", "qu"):
            print(
                f"⚠️  Idioma detectado ({detected_language}) no es es/en/qu. Asumiendo español para la lógica."
            )
            detected_language = "es"

        translation_applied = False
        translation_path = None

        if target_language == detected_language or target_language == "none":
            target_language_effective = "none"
            print(
                f"\nℹ️ Sin traducción (destino={target_language}, detectado={detected_language})."
            )
        else:
            target_language_effective = target_language
            translation_applied = True
            if detected_language == "en" and target_language == "qu":
                translation_path = "en→es→qu"
            else:
                translation_path = f"{detected_language}→{target_language}"

        if target_language_effective != "none":
            transcription = self.translate_transcription(
                transcription, detected_language, target_language_effective
            )

        segments = transcription.get("segments", [])
        segments_count = len(segments)

        base_name = os.path.splitext(os.path.basename(video_path))[0]
        output_path = self._build_output_path(
            base_name=base_name,
            src_lang=detected_language,
            tgt_lang=target_language_effective,
            output_format=output_format,
        )

        if output_format == "srt":
            self.create_srt(segments, output_path)
        else:
            self.create_video_with_subtitles(video_path, segments, output_path)

        try:
            clip = VideoFileClip(video_path)
            duration_seconds = clip.duration
            clip.close()
        except Exception:
            duration_seconds = None

        return {
            "output_path": output_path,
            "detected_language": detected_language,
            "segments_count": segments_count,
            "translation_applied": translation_applied,
            "translation_path": translation_path,
            "duration_seconds": duration_seconds,
            "translation_model_size": self.translation_model_size,   # 600m | 1.3b
            "whisper_model_name": self.whisper_model_name,           # medium | large-v3
        }
