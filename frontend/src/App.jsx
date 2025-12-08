import React, { useState } from "react";
import {
  Download,
  Youtube,
  FileText,
  Video,
  Globe,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Zap,
  Target,
  Sun,
  Moon
} from "lucide-react";

const YouTubeTranscriptionSystem = () => {
  const [step, setStep] = useState(1);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("none");
  const [outputFormat, setOutputFormat] = useState("");
  const [translationModel, setTranslationModel] = useState("600m");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [theme, setTheme] = useState("light"); // "light" | "dark"

  const handleProcess = async () => {
    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/process-youtube", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          youtubeUrl,
          targetLanguage,
          outputFormat,
          translationModel
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al procesar el video");
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Error al procesar el video");
    } finally {
      setProcessing(false);
    }
  };

  const canProceed = () => {
    if (step === 1)
      return youtubeUrl.includes("youtube.com") || youtubeUrl.includes("youtu.be");
    if (step === 2) return targetLanguage !== "";
    if (step === 3) return outputFormat !== "";
    return false;
  };

  const resetForm = () => {
    setStep(1);
    setYoutubeUrl("");
    setTargetLanguage("none");
    setOutputFormat("");
    setTranslationModel("600m");
    setResult(null);
    setError(null);
  };

  const translationModelLabel =
    translationModel === "600m"
      ? "NLLB 600M (rápido)"
      : "NLLB 1.3B (alta calidad)";

  // ---- clases según tema ----
  const rootBg =
    theme === "light"
      ? "bg-gradient-to-br from-blue-50 to-indigo-50"
      : "bg-gradient-to-br from-slate-900 via-slate-950 to-black";

  const cardBase = "rounded-lg shadow-lg";
  const cardMain =
    theme === "light"
      ? "bg-white"
      : "bg-slate-900 border border-slate-700";
  const textPrimary = theme === "light" ? "text-gray-800" : "text-slate-100";
  const textSecondary = theme === "light" ? "text-gray-600" : "text-slate-300";
  const textMuted = theme === "light" ? "text-gray-500" : "text-slate-400";

  const stepCardClass = `${cardBase} ${
    theme === "light"
      ? "bg-white"
      : "bg-slate-900 border border-slate-700"
  } p-6 mb-6`;

  const errorCardClass = `${cardBase} ${
    theme === "light"
      ? "bg-red-50 border-2 border-red-200"
      : "bg-red-900/30 border border-red-500/60"
  } p-6`;

  const footerInfoCardClass = `${cardBase} ${
    theme === "light"
      ? "bg-blue-50 border-2 border-blue-200"
      : "bg-slate-800 border border-slate-700"
  } p-6 mt-6`;

  // ----------------- RESULT VIEW -----------------
  if (result) {
    const resultInfoBg =
      theme === "light" ? "bg-gray-50" : "bg-slate-800";
    const resultInfoText = textSecondary;

    const resultMessageBg =
      theme === "light"
        ? "bg-blue-50 border-2 border-blue-200"
        : "bg-slate-800 border border-slate-700";
    const resultMessageText = textSecondary;

    return (
      <div className={`${rootBg} min-h-screen p-6`}>
        <div className="max-w-4xl mx-auto">
          <div
            className={`${cardBase} ${
              theme === "light"
                ? "bg-white"
                : "bg-slate-900 border border-slate-700"
            } p-8`}
          >
            {/* Header con toggle de tema */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <Youtube className="w-8 h-8 text-red-600" />
                <h1 className={`text-3xl font-bold ${textPrimary}`}>
                  Sistema de Transcripción y Traducción
                </h1>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme("light")}
                  className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 ${
                    theme === "light"
                      ? "bg-yellow-400 text-black"
                      : "bg-slate-700 text-slate-100"
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  Claro
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 ${
                    theme === "dark"
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-200 text-slate-800"
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  Oscuro
                </button>
              </div>
            </div>

            <div className="text-center mb-6">
              {result.success ? (
                <>
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h2 className={`text-3xl font-bold ${textPrimary} mb-2`}>
                    ¡Proceso Completado!
                  </h2>
                </>
              ) : (
                <>
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h2 className={`text-3xl font-bold ${textPrimary} mb-2`}>
                    Error en el Proceso
                  </h2>
                </>
              )}
            </div>

            <div className={`rounded-lg p-6 mb-6 ${resultInfoBg}`}>
              <h3 className={`font-bold text-lg mb-4 ${textPrimary}`}>
                Detalles del procesamiento:
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className={resultInfoText}>Video:</span>
                  <span className="font-semibold text-indigo-500">
                    {result.videoTitle}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={resultInfoText}>Idioma detectado:</span>
                  <span className="font-semibold">
                    {result.detectedLanguage === "es"
                      ? "🇪🇸 Español"
                      : result.detectedLanguage === "en"
                      ? "🇺🇸 Inglés"
                      : "🏔️ Quechua"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={resultInfoText}>Duración:</span>
                  <span className="font-semibold">{result.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className={resultInfoText}>Segmentos procesados:</span>
                  <span className="font-semibold">{result.segments}</span>
                </div>
                {result.translationApplied && (
                  <div className="flex justify-between">
                    <span className={resultInfoText}>Traducción aplicada:</span>
                    <span className="font-semibold">
                      {result.translationPath}
                    </span>
                  </div>
                )}
                {result.translationModel && (
                  <div className="flex justify-between">
                    <span className={resultInfoText}>
                      Modelo de traducción:
                    </span>
                    <span className="font-semibold">
                      {result.translationModel === "600m"
                        ? "NLLB 600M (rápido)"
                        : "NLLB 1.3B (alta calidad)"}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className={resultInfoText}>Archivo generado:</span>
                  <span className="font-semibold text-indigo-400">
                    {result.outputFile}
                  </span>
                </div>
                {result.downloadUrl && (
                  <div className="flex justify-between mt-2">
                    <span className={resultInfoText}>Descargar:</span>
                    <a
                      href={result.downloadUrl}
                      className="font-semibold text-indigo-400 underline"
                    >
                      Descargar archivo
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className={`rounded-lg p-4 mb-6 ${resultMessageBg}`}>
              <p className={`text-sm ${resultMessageText}`}>{result.message}</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={resetForm}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2"
              >
                <Youtube className="w-5 h-5" />
                Procesar otro video
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------- MAIN WIZARD -----------------
  return (
    <div className={`${rootBg} min-h-screen p-6`}>
      <div className="max-w-4xl mx-auto">
        {/* HEADER principal con toggle de tema */}
        <div className={stepCardClass}>
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <Youtube className="w-8 h-8 text-red-600" />
              <div>
                <h1 className={`text-3xl font-bold ${textPrimary}`}>
                  Sistema de Transcripción y Traducción
                </h1>
                <p className={textSecondary}>
                  Transcribe y traduce videos de YouTube a español, inglés o
                  quechua
                </p>
                <p className={`text-sm mt-2 ${textMuted}`}>
                  ✨ Detección automática de idioma con Whisper
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme("light")}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 ${
                  theme === "light"
                    ? "bg-yellow-400 text-black"
                    : "bg-slate-700 text-slate-100"
                }`}
              >
                <Sun className="w-4 h-4" />
                Claro
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 ${
                  theme === "dark"
                    ? "bg-indigo-500 text-white"
                    : "bg-slate-200 text-slate-800"
                }`}
              >
                <Moon className="w-4 h-4" />
                Oscuro
              </button>
            </div>
          </div>
        </div>

        {/* STEPPER */}
        <div className={stepCardClass}>
          <div className="flex justify-between items-center">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step >= num
                      ? "bg-indigo-600 text-white"
                      : theme === "light"
                      ? "bg-gray-200 text-gray-500"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {num}
                </div>
                {num < 3 && (
                  <div
                    className={`h-1 w-32 mx-2 ${
                      step > num
                        ? "bg-indigo-600"
                        : theme === "light"
                        ? "bg-gray-200"
                        : "bg-slate-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span
              className={
                step >= 1
                  ? "text-indigo-500 font-semibold"
                  : textMuted
              }
            >
              URL del video
            </span>
            <span
              className={
                step >= 2
                  ? "text-indigo-500 font-semibold"
                  : textMuted
              }
            >
              Traducción
            </span>
            <span
              className={
                step >= 3
                  ? "text-indigo-500 font-semibold"
                  : textMuted
              }
            >
              Formato
            </span>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className={`${cardBase} ${cardMain} p-8`}>
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Youtube className="w-6 h-6 text-red-600" />
                <h2 className={`text-2xl font-bold ${textPrimary}`}>
                  Paso 1: URL del Video
                </h2>
              </div>
              <p className={`${textSecondary} mb-4`}>
                Ingresa la URL del video de YouTube que deseas transcribir
              </p>
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className={`w-full p-4 border-2 rounded-lg focus:border-indigo-600 focus:outline-none text-lg ${
                  theme === "light"
                    ? "border-gray-300 bg-white text-gray-900"
                    : "border-slate-600 bg-slate-800 text-slate-100"
                }`}
              />
              {youtubeUrl &&
                !youtubeUrl.includes("youtube.com") &&
                !youtubeUrl.includes("youtu.be") && (
                  <div className="flex items-center gap-2 text-red-500 mt-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>URL inválida. Debe ser un enlace de YouTube</span>
                  </div>
                )}
              <div
                className={`rounded-lg p-4 mt-4 ${
                  theme === "light"
                    ? "bg-yellow-50 border-2 border-yellow-200"
                    : "bg-yellow-900/30 border border-yellow-500/60"
                }`}
              >
                <p
                  className={`text-sm ${
                    theme === "light"
                      ? "text-yellow-800"
                      : "text-yellow-100"
                  }`}
                >
                  <strong>ℹ️ Nota:</strong> El idioma del video se detectará
                  automáticamente usando Whisper. No necesitas especificarlo.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-6 h-6 text-indigo-600" />
                  <h2 className={`text-2xl font-bold ${textPrimary}`}>
                    Paso 2: ¿Deseas traducir?
                  </h2>
                </div>
                <p className={textSecondary}>
                  El idioma del video se detectará automáticamente. Elige si
                  quieres traducir la transcripción.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setTargetLanguage("none")}
                    className={`p-6 border-2 rounded-lg transition-all ${
                      targetLanguage === "none"
                        ? "border-indigo-600 bg-indigo-50/70"
                        : theme === "light"
                        ? "border-gray-300 hover:border-indigo-400"
                        : "border-slate-600 hover:border-indigo-400"
                    }`}
                  >
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <div className={`font-bold text-lg ${textPrimary}`}>
                      Sin traducción
                    </div>
                    <div className={`text-sm ${textSecondary}`}>
                      Solo transcribir
                    </div>
                  </button>

                  <button
                    onClick={() => setTargetLanguage("es")}
                    className={`p-6 border-2 rounded-lg transition-all ${
                      targetLanguage === "es"
                        ? "border-indigo-600 bg-indigo-50/70"
                        : theme === "light"
                        ? "border-gray-300 hover:border-indigo-400"
                        : "border-slate-600 hover:border-indigo-400"
                    }`}
                  >
                    <div className="text-4xl mb-2">🇪🇸</div>
                    <div className={`font-bold text-lg ${textPrimary}`}>
                      Español
                    </div>
                    <div className={`text-sm ${textSecondary}`}>
                      Traducir a español
                    </div>
                  </button>

                  <button
                    onClick={() => setTargetLanguage("en")}
                    className={`p-6 border-2 rounded-lg transition-all ${
                      targetLanguage === "en"
                        ? "border-indigo-600 bg-indigo-50/70"
                        : theme === "light"
                        ? "border-gray-300 hover:border-indigo-400"
                        : "border-slate-600 hover:border-indigo-400"
                    }`}
                  >
                    <div className="text-4xl mb-2">🇺🇸</div>
                    <div className={`font-bold text-lg ${textPrimary}`}>
                      Inglés
                    </div>
                    <div className={`text-sm ${textSecondary}`}>
                      Traducir a inglés
                    </div>
                  </button>

                  <button
                    onClick={() => setTargetLanguage("qu")}
                    className={`p-6 border-2 rounded-lg transition-all ${
                      targetLanguage === "qu"
                        ? "border-indigo-600 bg-indigo-50/70"
                        : theme === "light"
                        ? "border-gray-300 hover:border-indigo-400"
                        : "border-slate-600 hover:border-indigo-400"
                    }`}
                  >
                    <div className="text-4xl mb-2">🏔️</div>
                    <div className={`font-bold text-lg ${textPrimary}`}>
                      Quechua
                    </div>
                    <div className={`text-sm ${textSecondary}`}>
                      Traducir a quechua
                    </div>
                  </button>
                </div>
              </div>

              {/* Selector de modelo de traducción */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  <h3 className={`font-bold text-lg ${textPrimary}`}>
                    Modelo de traducción
                  </h3>
                </div>
                <p className={`text-sm ${textSecondary}`}>
                  Elige entre velocidad (600M) o mayor calidad (1.3B). El modelo
                  más grande consume más memoria y tiempo.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setTranslationModel("600m")}
                    className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-all ${
                      translationModel === "600m"
                        ? "border-indigo-600 bg-indigo-50/70"
                        : theme === "light"
                        ? "border-gray-300 hover:border-indigo-400"
                        : "border-slate-600 hover:border-indigo-400"
                    }`}
                  >
                    <Zap className="w-6 h-6 text-yellow-500" />
                    <div className="text-left">
                      <div className={`font-bold text-sm ${textPrimary}`}>
                        Rápido (600M)
                      </div>
                      <div className={`text-xs ${textSecondary}`}>
                        Menor uso de GPU / más ágil
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setTranslationModel("1.3b")}
                    className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-all ${
                      translationModel === "1.3b"
                        ? "border-indigo-600 bg-indigo-50/70"
                        : theme === "light"
                        ? "border-gray-300 hover:border-indigo-400"
                        : "border-slate-600 hover:border-indigo-400"
                    }`}
                  >
                    <Target className="w-6 h-6 text-indigo-500" />
                    <div className="text-left">
                      <div className={`font-bold text-sm ${textPrimary}`}>
                        Alta calidad (1.3B)
                      </div>
                      <div className={`text-xs ${textSecondary}`}>
                        Mejor traducción / más pesado
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div
                className={`rounded-lg p-4 mt-2 ${
                  theme === "light"
                    ? "bg-blue-50 border-2 border-blue-200"
                    : "bg-slate-800 border border-slate-700"
                }`}
              >
                <p className={`text-sm ${textSecondary}`}>
                  <strong>ℹ️ Reglas de traducción:</strong> Si el video está en
                  el mismo idioma que seleccionaste, solo se transcribirá. Para
                  inglés → quechua, se traduce vía español como idioma puente.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Video className="w-6 h-6 text-indigo-600" />
                <h2 className={`text-2xl font-bold ${textPrimary}`}>
                  Paso 3: Formato de Salida
                </h2>
              </div>
              <p className={`${textSecondary} mb-6`}>
                Elige cómo deseas recibir el resultado
              </p>
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => setOutputFormat("srt")}
                  className={`p-6 border-2 rounded-lg transition-all flex items-center gap-4 ${
                    outputFormat === "srt"
                      ? "border-indigo-600 bg-indigo-50/70"
                      : theme === "light"
                      ? "border-gray-300 hover:border-indigo-400"
                      : "border-slate-600 hover:border-indigo-400"
                  }`}
                >
                  <FileText className="w-12 h-12 text-indigo-600" />
                  <div className="text-left flex-1">
                    <div className={`font-bold text-lg ${textPrimary}`}>
                      Archivo SRT
                    </div>
                    <div className={`text-sm ${textSecondary}`}>
                      Descarga solo el archivo de subtítulos (.srt) para usar en
                      cualquier reproductor
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setOutputFormat("mp4")}
                  className={`p-6 border-2 rounded-lg transition-all flex items-center gap-4 ${
                    outputFormat === "mp4"
                      ? "border-indigo-600 bg-indigo-50/70"
                      : theme === "light"
                      ? "border-gray-300 hover:border-indigo-400"
                      : "border-slate-600 hover:border-indigo-400"
                  }`}
                >
                  <Video className="w-12 h-12 text-indigo-600" />
                  <div className="text-left flex-1">
                    <div className={`font-bold text-lg ${textPrimary}`}>
                      Video MP4 con subtítulos
                    </div>
                    <div className={`text-sm ${textSecondary}`}>
                      Video completo con subtítulos incrustados
                      permanentemente usando ffmpeg
                    </div>
                  </div>
                </button>
              </div>

              <div
                className={`mt-8 p-6 rounded-lg border-2 ${
                  theme === "light"
                    ? "bg-gray-50 border-gray-200"
                    : "bg-slate-800 border-slate-700"
                }`}
              >
                <h3 className={`font-bold text-lg mb-3 ${textPrimary}`}>
                  Resumen de tu selección:
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Youtube className="w-4 h-4" />
                    <span className={textSecondary}>
                      <strong className={textPrimary}>URL:</strong>{" "}
                      {youtubeUrl
                        ? youtubeUrl.substring(0, 50) + "..."
                        : "No definida"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span className={textSecondary}>
                      <strong className={textPrimary}>Detección:</strong>{" "}
                      Automática con Whisper
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span className={textSecondary}>
                      <strong className={textPrimary}>Traducción:</strong>{" "}
                      {targetLanguage === "none"
                        ? "Sin traducción"
                        : targetLanguage === "en"
                        ? "Inglés"
                        : targetLanguage === "es"
                        ? "Español"
                        : "Quechua"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span className={textSecondary}>
                      <strong className={textPrimary}>Modelo:</strong>{" "}
                      {translationModelLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    <span className={textSecondary}>
                      <strong className={textPrimary}>Formato:</strong>{" "}
                      {outputFormat === "srt"
                        ? "Archivo SRT"
                        : outputFormat === "mp4"
                        ? "Video MP4 con subtítulos"
                        : "No definido"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botones de navegación */}
          <div className="flex justify-between mt-8 pt-6 border-t-2 border-gray-200/40">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className={`px-6 py-3 rounded-lg font-semibold ${
                step === 1
                  ? "bg-gray-200/60 text-gray-400 cursor-not-allowed"
                  : "bg-gray-300 text-gray-700 hover:bg-gray-400"
              }`}
            >
              ← Anterior
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className={`px-6 py-3 rounded-lg font-semibold ${
                  canProceed()
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-gray-200/60 text-gray-400 cursor-not-allowed"
                }`}
              >
                Siguiente →
              </button>
            ) : (
              <button
                onClick={handleProcess}
                disabled={!canProceed() || processing}
                className={`px-8 py-3 rounded-lg font-semibold flex items-center gap-2 ${
                  canProceed() && !processing
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-200/60 text-gray-400 cursor-not-allowed"
                }`}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Procesar Video
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className={errorCardClass}>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
              <div
                className={`text-sm ${
                  theme === "light" ? "text-red-800" : "text-red-200"
                }`}
              >
                <p className="font-bold mb-2">Error:</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Info final */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="text-sm text-blue-800">
              <p className="font-bold mb-2">Información importante:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  La transcripción usa Whisper <strong>medium</strong> o{" "}
                  <strong>large-v3</strong> según el modelo de traducción que
                  elijas (600M ó 1.3B)
                </li>
                <li>
                  La traducción usa NLLB-200-distilled-600M o NLLB-200-1.3B
                  según tu selección
                </li>
                <li>Detección automática de idioma (español/inglés/quechua)</li>
                <li>
                  Inglés → Quechua se traduce vía Español como idioma puente
                </li>
                <li>
                  Los archivos no se sobreescriben (usa sufijos _v2, _v3, etc.)
                </li>
                <li>
                  El perfil 1.3B usa más memoria y puede tardar más, pero da
                  mejor calidad de traducción
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubeTranscriptionSystem;
