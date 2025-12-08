import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from transcriber import YouTubeTranscriber

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

os.makedirs("downloads", exist_ok=True)
os.makedirs("output", exist_ok=True)

# Perfil inicial: rápido (Whisper medium + NLLB 600M)
transcriber = YouTubeTranscriber(profile="600m")


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/output/<path:filename>", methods=["GET"])
def download_file(filename):
    return send_from_directory("output", filename, as_attachment=True)


@app.route("/api/process-youtube", methods=["POST"])
def process_youtube():
    data = request.get_json() or {}
    youtube_url = data.get("youtubeUrl")
    target_language = data.get("targetLanguage", "none")
    output_format = data.get("outputFormat", "srt")
    translation_model_size = data.get("translationModel", "600m")  # "600m" | "1.3b"

    if not youtube_url or (
        "youtube.com" not in youtube_url and "youtu.be" not in youtube_url
    ):
        return (
            jsonify(
                {
                    "success": False,
                    "message": "URL inválida. Debe ser un enlace de YouTube.",
                }
            ),
            400,
        )

    if target_language not in ("none", "es", "en", "qu"):
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Idioma destino no soportado. Usa none, es, en o qu.",
                }
            ),
            400,
        )

    if output_format not in ("srt", "mp4"):
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Formato de salida no soportado. Usa srt o mp4.",
                }
            ),
            400,
        )

    # Cambiar perfil (Whisper + NLLB) según el modelo elegido
    try:
        transcriber.set_profile(translation_model_size)
    except ValueError as e:
        return jsonify({"success": False, "message": str(e)}), 400

    try:
        # 1) Descargar video
        video_path, video_title = transcriber.download_youtube_video(youtube_url)

        # 2) Procesar video
        info = transcriber.process_video(
            video_path=video_path,
            target_language=target_language,
            output_format=output_format,
        )

        output_path = info["output_path"]
        file_name = os.path.basename(output_path)
        duration_str = transcriber.format_duration(info["duration_seconds"])
        download_url = f"/api/output/{file_name}"

        detected_lang = info["detected_language"]
        lang_flag = (
            "es"
            if detected_lang == "es"
            else "en"
            if detected_lang == "en"
            else "qu"
        )

        translation_applied = info["translation_applied"]
        translation_path = info["translation_path"]

        return jsonify(
            {
                "success": True,
                "detectedLanguage": lang_flag,
                "videoTitle": video_title,
                "duration": duration_str,
                "segments": info["segments_count"],
                "outputFile": file_name,
                "downloadUrl": download_url,
                "translationApplied": translation_applied,
                "translationPath": translation_path,
                "translationModel": info["translation_model_size"],  # "600m" | "1.3b"
                "whisperModel": info["whisper_model_name"],          # "medium" | "large-v3"
                "message": "Procesamiento completado correctamente.",
            }
        )

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
