🎧 Sistema Web de Transcripción y Traducción de YouTube (es/en/qu)

Aplicación web para:

Descargar videos de YouTube

Transcribir el audio usando Whisper

Traducir entre Español, Inglés y Quechua usando NLLB

Generar:

Archivos de subtítulos .srt

Videos .mp4 con subtítulos incrustados

Incluye:

Frontend en React + Vite (con modo claro/oscuro)

Backend en Python + Flask

Exposición al mundo usando ngrok (acceso desde cualquier ciudad o dispositivo)

✨ Características principales
🔊 Transcripción

Usa Whisper medium (OpenAI).

Detección de idioma automática.

Funciona muy bien con español e inglés.

Se procesa Quechua en la lógica de negocio.

🌍 Traducción (NLLB)

Modelos disponibles:

⚡ NLLB 600M — rápido, menor peso

🎯 NLLB 1.3B — más calidad, más consumo

Reglas:

Si idioma origen = idioma destino → solo transcribe

es ↔ en traducción directa

es ↔ qu traducción directa

en → qu se realiza como en → es → qu

También incluye limpieza de repeticiones para evitar loops del modelo.

🎬 Generación de archivos

Nombres de archivo cortos y limpios (slug).

Incluyen idiomas (es-en, en-qu, etc.)

No se sobreescriben → usan sufijos _v2, _v3, etc.

Salidas compatibles:

SRT: archivos estándar de subtítulos

MP4: video con subtítulos incrustados vía ffmpeg

🖥️ Interfaz web

Wizard de 3 pasos:

URL del video

Idioma de traducción + selección de modelo (600M / 1.3B)

Formato de salida (SRT / MP4)

Modo visual:

☀️ Claro

🌙 Oscuro

Vista de resultados:

Idioma detectado

Duración

Segmentos procesados

Modelo de traducción usado

Enlace de descarga del archivo final

🧱 Arquitectura del Proyecto
youtube-transcriber/
├─ backend/
│  ├─ app.py
│  ├─ transcriber.py
│  └─ requirements.txt
└─ frontend/
   ├─ index.html
   ├─ vite.config.js
   ├─ package.json
   └─ src/
      ├─ main.jsx
      └─ App.jsx

💻 Requisitos
🔧 Hardware

Recomendado:

GPU con 8 GB VRAM o más
Necesaria para:

Whisper medium

NLLB 600M y especialmente 1.3B

Si ejecutas en CPU:

Funciona, pero muy lento

Úsalo solo para pruebas o videos cortos

🧰 Software

Python 3.9+

Node.js 18+

ffmpeg (instalado y en el PATH)

ngrok (para exponer la web)

pip / npm

📦 Backend (Flask + modelos)
1️⃣ Instalar dependencias

Desde la carpeta backend/:

cd backend
pip install -r requirements.txt

2️⃣ Componentes importantes del backend
📄 transcriber.py

La clase YouTubeTranscriber:

Carga Whisper medium

Carga dinámicamente el modelo NLLB (600M / 1.3B)

Descarga el video con yt_dlp

Transcribe y traduce

Genera archivos .srt y .mp4

Devuelve datos como:

detected_language

segments_count

translation_applied

output_path

translation_model_size

🌐 app.py

Servidor Flask que expone:

GET /api/health

GET /api/output/<filename>

POST /api/process-youtube

Ejemplo de request:

{
  "youtubeUrl": "https://www.youtube.com/watch?v=xxxx",
  "targetLanguage": "none|es|en|qu",
  "outputFormat": "srt|mp4",
  "translationModel": "600m|1.3b"
}


Ejemplo de respuesta:

{
  "success": true,
  "detectedLanguage": "es",
  "videoTitle": "Título detectado",
  "duration": "00:10:31",
  "segments": 132,
  "outputFile": "video_es-en_srt.srt",
  "downloadUrl": "/api/output/video_es-en_srt.srt",
  "translationApplied": true,
  "translationPath": "es→en",
  "translationModel": "600m",
  "message": "Procesamiento completado correctamente."
}

🌐 Frontend (React + Vite)
1️⃣ Instalar dependencias
cd frontend
npm install

2️⃣ Configuración Vite (vite.config.js)

Incluye:

Proxy /api → backend

Hosts permitidos para ngrok

Puerto 5173

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: [
      ".ngrok-free.app",
      ".ngrok-free.dev"
    ],
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true
      }
    }
  }
});

3️⃣ UI (App.jsx)

Contiene:

Wizard de 3 pasos

Selección de modelo NLLB

Modo claro/oscuro

Manejo de resultados

Llamada:

fetch("/api/process-youtube", { method: "POST", body: ... })

🌍 Exponer al mundo usando ngrok

El flujo es:

Backend en localhost:8000

Frontend en localhost:5173

ngrok expone localhost:5173 a internet

🛠️ Configurar ngrok (una vez)

Crear cuenta: https://ngrok.com

Obtener Auth Token

Configurar:

Windows:

cd C:\ngrok
ngrok config add-authtoken TU_TOKEN


Linux/macOS:

./ngrok config add-authtoken TU_TOKEN

🚀 Pasos para ejecutar TODO

Estos son los pasos que usarás siempre:

2.1 ▶️ Backend

En una terminal:

cd backend
python app.py

2.2 ▶️ Frontend

En otra terminal:

cd frontend
npm run dev

2.3 🌍 ngrok

En una tercera terminal:

Windows:

cd C:\ngrok
ngrok http 5173


Aparecerá algo como:

Forwarding  https://uncheerful-larae-symphonic.ngrok-free.dev -> http://localhost:5173


👉 Esa URL pública es tu app web online.
Funciona en:

Otra ciudad

Otro país

Tu celular

Cualquier PC

🧪 Flujo de uso resumido

Entras a la URL pública de ngrok

Pegas una URL de YouTube

Seleccionas idioma de destino

Seleccionas modelo NLLB (600M / 1.3B)

Seleccionas formato (SRT / MP4)

Procesas el video

Descargas el archivo final

🛠️ Problemas comunes
❌ "Blocked request. This host is not allowed."

Solución → agregar en vite.config.js:

allowedHosts: [".ngrok-free.app", ".ngrok-free.dev"]


Reiniciar:

npm run dev
ngrok http 5173

❌ Memoria insuficiente

Usa modelo 600M en vez de 1.3B

Usa Whisper base si necesitas aún menos consumo

Procesa videos cortos si estás en CPU

❌ Procesamiento muy lento

Cambiar modelo a 600M

Cerrar apps que usen GPU

Evitar videos de más de 30 minutos

📌 Notas finales

Este proyecto está pensado como una solución auto-hosted:

Tu PC + tu GPU hacen todo el procesamiento

ngrok permite exponer la web temporalmente

Para ponerlo 24/7 en internet, necesitarías:

Servidor con GPU (RunPod, Paperspace, LambdaLabs, etc.)

Deployar backend allí

Servir frontend desde Vite o Nginx
