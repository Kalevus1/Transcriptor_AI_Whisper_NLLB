# 🎧 Sistema Web de Transcripción y Traducción de YouTube (es/en/qu)

Aplicación web para:

- Descargar videos de YouTube
- Transcribir el audio usando Whisper
- Traducir entre Español, Inglés y Quechua usando NLLB
- Generar:
  - Archivos de subtítulos `.srt`
  - Videos `.mp4` con subtítulos incrustados

Incluye:

- Frontend en **React + Vite** (con modo claro/oscuro).
- Backend en **Python + Flask**.
- Exposición al mundo usando **ngrok** (puedes entrar desde otra ciudad o dispositivo).

---

## ✨ Características principales

### Transcripción

- Usa **Whisper medium** (modelo de OpenAI) para transcribir audio.
- Detección de idioma **automática** (no se pregunta al usuario).
- Soporta al menos: Español, Inglés (y se trata Quechua en la lógica de negocio).

### Traducción (NLLB)

- Usa modelos **NLLB-200** de Meta:
  - `facebook/nllb-200-distilled-600M` (rápido, menor peso)
  - `facebook/nllb-200-1.3B` (más grande, mejor calidad, más consumo)
- Desde el frontend puedes elegir:
  - ⚡ **Rápido (600M)**
  - 🎯 **Alta calidad (1.3B)**

### Reglas de traducción

- Si el idioma del video y el idioma destino son iguales → **solo transcribe**.
- Soporta:
  - `es ↔ en` (traducción directa).
  - `es ↔ qu` (traducción directa).
  - `en → qu` (se hace vía español: `en → es → qu`).
- También tiene lógica para evitar repeticiones raras del modelo (limpieza de texto).

### Generación de archivos

- Nombres de archivos:
  - Cortos (slug del título o nombre del video).
  - Incluyen los idiomas (`es`, `es-en`, `en-qu`, etc).
  - No se sobreescriben: si existe, usan sufijo `_v2`, `_v3`, etc.
- Tipos de salida:
  - `SRT` → `mi_video_es-en_srt.srt`
  - `MP4` con subtítulos incrustados usando **ffmpeg**.

### Interfaz web

- Wizard de 3 pasos:
  1. URL de YouTube
  2. Configuración de traducción + modelo (600M / 1.3B)
  3. Formato de salida (SRT / MP4 con subtítulos)
- Modo **Claro / Oscuro** con botones:
  - ☀️ Claro
  - 🌙 Oscuro
- Pantalla de resultados con:
  - Título del video
  - Idioma detectado
  - Duración
  - Cantidad de segmentos procesados
  - Ruta/archivo generado
  - Modelo de traducción usado

---

## 🧱 Arquitectura y estructura de carpetas

Estructura base del proyecto:

```text
youtube-transcriber/
├─ backend/
│  ├─ app.py             # Servidor Flask (API REST)
│  ├─ transcriber.py     # Lógica principal de transcribir/traducir/generar salida
│  └─ requirements.txt   # Dependencias de Python
└─ frontend/
   ├─ index.html
   ├─ vite.config.js     # Configuración de Vite (proxy + allowedHosts para ngrok)
   ├─ package.json
   └─ src/
      ├─ main.jsx
      └─ App.jsx         # Interfaz React (wizard, temas, etc.)

```
---
💻 Requisitos
Hardware

Recomendado: GPU con al menos 8 GB de VRAM si quieres usar:

Whisper medium

NLLB 600M y especialmente 1.3B

Si solo usas CPU, puede funcionar, pero será:

Mucho más lento

Posiblemente insuficiente para videos largos

Software

Python 3.9+ (recomendado)

Node.js 18+ (para el frontend)

ffmpeg instalado y accesible en el PATH

ngrok instalado (para exponer la web públicamente)

pip, npm, etc.

📦 Backend (Flask + modelos)
1. Instalar dependencias

Desde la carpeta backend/:

cd backend
pip install -r requirements.txt


El archivo requirements.txt incluye:

torch

openai-whisper

transformers

sentencepiece

yt-dlp, pytube

moviepy, imageio, imageio-ffmpeg

flask, flask-cors

y otras utilidades necesarias.

2. Archivos importantes del backend
backend/transcriber.py

Clase YouTubeTranscriber:

Carga Whisper (medium por defecto).

Gestiona la carga dinámica de NLLB 600M / 1.3B:

set_translation_model_size("600m")

set_translation_model_size("1.3b")

Descarga videos de YouTube (yt_dlp y pytube).

Transcribe, traduce y genera:

.srt (con srt)

.mp4 (con ffmpeg + imageio-ffmpeg)

Devuelve un diccionario con info del procesamiento:

output_path, detected_language, segments_count, translation_applied, translation_path, duration_seconds, translation_model_size.

backend/app.py

Servidor Flask con CORS.

Endpoints principales:

GET /api/health
Para comprobar que el backend está vivo.

GET /api/output/<filename>
Sirve el archivo generado en la carpeta output/.

POST /api/process-youtube
Recibe JSON:

{
  "youtubeUrl": "https://www.youtube.com/watch?v=...",
  "targetLanguage": "none|es|en|qu",
  "outputFormat": "srt|mp4",
  "translationModel": "600m|1.3b"
}


Y devuelve:

{
  "success": true,
  "detectedLanguage": "es|en|qu",
  "videoTitle": "Título del video",
  "duration": "hh:mm:ss",
  "segments": 123,
  "outputFile": "mi_video_es-en_srt.srt",
  "downloadUrl": "/api/output/mi_video_es-en_srt.srt",
  "translationApplied": true,
  "translationPath": "es→en",
  "translationModel": "600m|1.3b",
  "message": "Procesamiento completado correctamente."
}

🌐 Frontend (React + Vite)
1. Instalar dependencias

Desde la carpeta frontend/:

cd frontend
npm install

2. Configuración de Vite (vite.config.js)

Este archivo es clave porque:

Define el puerto del dev server (5173).

Configura el proxy de /api hacia el backend en localhost:8000.

Permite que ngrok sea un host válido (evita error “Blocked request. This host is not allowed”).

Ejemplo completo recomendado:

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

3. Archivo principal de UI (src/App.jsx)

Implementa el wizard de 3 pasos:

URL del video

Traducción + selección de modelo (600M / 1.3B)

Formato de salida (SRT / MP4)

Usa fetch("/api/process-youtube") para hablar con el backend.

Recibe el JSON de respuesta y muestra:

Idioma detectado

Modelo usado

Duración

Enlace de descarga

Tiene modo claro/oscuro con un useState("light" | "dark").

Botones:

☀️ Claro

🌙 Oscuro

Cambia colores de fondo, tarjetas y textos según el tema.

🌍 Exponer la app al mundo con ngrok

La idea es:

Backend Flask corriendo en localhost:8000.

Frontend Vite corriendo en localhost:5173.

ngrok exponiendo localhost:5173 a una URL pública HTTPS.

1. Instalar y configurar ngrok (una sola vez)

Crea una cuenta gratis en: https://ngrok.com

En el dashboard obtén tu Auth Token.

Configura ngrok:

En Windows

Asumiendo que pusiste ngrok.exe en C:\ngrok:

cd C:\ngrok
ngrok config add-authtoken TU_TOKEN_AQUI

En Linux / macOS
./ngrok config add-authtoken TU_TOKEN_AQUI

🚀 Pasos para ejecutar TODO (backend + frontend + ngrok)

Estos son los pasos clave que usarás siempre que quieras dejar la app accesible desde internet.
Funcionan con la configuración actual que ya probaste.

2.1 Backend

En una terminal:

cd backend
python app.py


Esto levanta Flask en http://0.0.0.0:8000.

2.2 Frontend

En otra terminal (si ya estaba corriendo, primero Ctrl+C):

cd frontend
npm run dev


Esto levanta Vite en http://localhost:5173.

2.3 ngrok

En una tercera terminal (si ya estaba corriendo, primero Ctrl+C y vuelve a lanzar):

En Windows, si ngrok está en C:\ngrok:

cd C:\ngrok 
ngrok http 5173


La consola de ngrok mostrará algo como:

Forwarding  https://uncheerful-larae-symphonic.ngrok-free.dev -> http://localhost:5173


✨ Esa URL pública (por ejemplo https://uncheerful-larae-symphonic.ngrok-free.dev) es la que puedes abrir desde:

Otra ciudad

Otro país

Tu celular

Cualquier dispositivo con internet

La app funcionará exactamente igual que en local:

Pegas una URL de YouTube

Eliges idioma de traducción (o sin traducción)

Eliges modelo NLLB (600M o 1.3B)

Eliges formato (SRT o MP4)

Esperas a que termine el procesamiento

Descargas el archivo generado

Mientras tanto, tu PC es la que realmente está:

Descargando el video

Procesando con Whisper + NLLB

Generando archivos

🧪 Flujo de uso resumido

Entras a la URL pública de ngrok (ejemplo):

https://uncheerful-larae-symphonic.ngrok-free.dev

Paso 1:

Pegar URL de YouTube válida

Paso 2:

Elegir:

Sin traducción / Español / Inglés / Quechua

Modelo de traducción:

⚡ Rápido (600M)

🎯 Alta calidad (1.3B)

Paso 3:

Elegir formato:

Archivo SRT

Video MP4 con subtítulos

Click en Procesar Video

Esperar a que termine

Descargar el archivo desde el link que aparece en la pantalla de resultado.

🛠️ Problemas comunes y soluciones
❌ Error: Blocked request. This host ("xxx.ngrok-free.dev") is not allowed.

Solución: asegurarse de que vite.config.js tenga:

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


Y luego reiniciar:

npm run dev

ngrok http 5173

❌ Problemas de memoria RAM / VRAM

Si tu GPU/CPU no aguanta:

Considera:

Cambiar Whisper medium → base o small.

Usar solo NLLB 600M en vez de 1.3B.

Procesar videos más cortos para las pruebas.

❌ Muy lento

Usa el modelo de traducción 600m en lugar de 1.3b.

Evita procesar videos de más de ~30–40 minutos si estás en CPU o GPU modesta.

Cierra otras apps que consuman GPU (juegos, etc.).

📌 Notas finales

Este proyecto está pensado como una solución auto-hosted:

Tú controlas tu PC + GPU

Expones la web temporalmente con ngrok

Para hacerlo 24/7 en la nube necesitarías:

Un servidor con GPU (RunPod, Paperspace, etc.)

Subir backend allí y apuntar el frontend a esa URL.
