# 🎧 Sistema Web de Transcripción y Traducción de YouTube (es/en/qu)

Aplicación web para:

- Descargar videos de YouTube  
- Transcribir el audio usando Whisper  
- Traducir entre Español, Inglés y Quechua usando NLLB  
- Generar:  
  - Archivos de subtítulos `.srt`  
  - Videos `.mp4` con subtítulos incrustados  

Incluye:

- Frontend en **React + Vite** (con modo claro/oscuro)  
- Backend en **Python + Flask**  
- Exposición al mundo usando **ngrok**  

---

## ✨ Características principales

### 🔊 Transcripción

- Usa **Whisper medium** (OpenAI).  
- Detección de idioma automática.  
- Funciona muy bien con español e inglés.  
- Se procesa Quechua en la lógica de negocio.

---

### 🌍 Traducción (NLLB)

Modelos disponibles:

- ⚡ **NLLB 600M** — rápido, menor peso  
- 🎯 **NLLB 1.3B** — mayor calidad, más recursos

Reglas:

- Si idioma origen = idioma destino → solo transcribe  
- `es ↔ en` traducción directa  
- `es ↔ qu` traducción directa  
- `en → qu` → vía `en → es → qu`  
- Limpieza de repeticiones extrañas generadas por el modelo  

---

### 🎬 Generación de archivos

- Nombres de archivo cortos y limpios (slug)  
- Incluyen idiomas (`es-en`, `en-qu`, etc.)  
- No se sobreescriben (usan `_v2`, `_v3`, etc.)  
- Tipos de salida:
  - `SRT`
  - `MP4` con subtítulos incrustados vía ffmpeg  

---

### 🖥️ Interfaz web

Wizard de 3 pasos:

1. URL del video  
2. Idioma de traducción + modelo (600M / 1.3B)  
3. Formato de salida (SRT / MP4)

Modo visual:

- ☀️ Claro  
- 🌙 Oscuro  

Vista de resultados:

- Idioma detectado  
- Segmentos procesados  
- Duración  
- Modelo usado  
- Archivo generado y link de descarga  

---

## 🧱 Arquitectura del Proyecto

```text
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
```

---

## 💻 Requisitos

### 🔧 Hardware

Recomendado:

- GPU con **8 GB VRAM o más**  
- Necesaria para:
  - Whisper medium  
  - NLLB 600M / 1.3B  

Si usas **CPU**:

- Funciona, pero muy lento  
- Recomendado solo para pruebas o videos cortos  

---

### 🧰 Software

- Python 3.9+  
- Node.js 18+  
- ffmpeg (instalado y en PATH)  
- ngrok  
- pip / npm  

---

## 📦 Backend (Flask + Modelos)

### 1️⃣ Instalar dependencias

```bash
cd backend
pip install -r requirements.txt
```

---

### 2️⃣ Componentes importantes del backend

### 📄 `transcriber.py`

La clase `YouTubeTranscriber`:

- Carga Whisper medium  
- Carga dinámica de NLLB (600M / 1.3B)  
- Descarga video con `yt_dlp`  
- Transcribe y traduce  
- Genera `.srt` y `.mp4`  

Valores devueltos:

- `detected_language`
- `segments_count`
- `translation_applied`
- `output_path`
- `translation_model_size`

---

### 🌐 `app.py`

Endpoints:

```
GET /api/health
GET /api/output/<filename>
POST /api/process-youtube
```

Ejemplo de request:

```json
{
  "youtubeUrl": "https://www.youtube.com/watch?v=xxxx",
  "targetLanguage": "none|es|en|qu",
  "outputFormat": "srt|mp4",
  "translationModel": "600m|1.3b"
}
```

Ejemplo de respuesta:

```json
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
```

---

## 🌐 Frontend (React + Vite)

### 1️⃣ Instalar dependencias

```bash
cd frontend
npm install
```

---

### 2️⃣ Configuración de Vite

Archivo: `vite.config.js`

```js
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
```

---

### 3️⃣ UI (`App.jsx`)

Incluye:

- Wizard de 3 pasos  
- Selección de modelo NLLB  
- Modo claro/oscuro  
- Procesamiento y visualización del resultado  

Llamada principal:

```js
fetch("/api/process-youtube", { method: "POST", body: ... })
```

---

## 🌍 Exponer al mundo usando ngrok

Backend → `localhost:8000`  
Frontend → `localhost:5173`  
ngrok expone → `localhost:5173` a internet

---

### 🛠️ Configurar ngrok (una vez)

#### Windows:

```bash
cd C:\ngrok
ngrok config add-authtoken TU_TOKEN
```

#### Linux / macOS:

```bash
./ngrok config add-authtoken TU_TOKEN
```

---

## 🚀 Pasos para ejecutar TODO

### 2.1 ▶️ Backend

```bash
cd backend
python app.py
```

### 2.2 ▶️ Frontend

```bash
cd frontend
npm run dev
```

### 2.3 🌍 ngrok

```bash
cd C:\ngrok
ngrok http 5173
```

Ejemplo de salida:

```
Forwarding  https://uncheerful-larae-symphonic.ngrok-free.dev -> http://localhost:5173
```

👉 Esa URL es la aplicación **online**.

---

## 🧪 Flujo de uso resumido

1. Entra a la URL pública de ngrok  
2. Pega una URL de YouTube  
3. Selecciona idioma destino  
4. Selecciona modelo NLLB (600M / 1.3B)  
5. Selecciona formato  
6. Procesa  
7. Descarga el archivo final  

---

## 🛠️ Problemas comunes

### ❌ *"Blocked request. This host is not allowed."*

Solución:

```js
allowedHosts: [".ngrok-free.app", ".ngrok-free.dev"]
```

Reiniciar:

```bash
npm run dev
ngrok http 5173
```

---

### ❌ Memoria insuficiente

- Usar modelo 600M  
- Cambiar Whisper a base  
- Procesar videos cortos  

---

### ❌ Procesamiento muy lento

- Usar modelo 600M  
- Cerrar apps que usen GPU  
- Evitar videos > 30 minutos  

---

## 📌 Notas finales

Este proyecto:

- Corre en tu PC  
- Usa tu GPU para transcribir y traducir  
- ngrok permite acceso desde cualquier ciudad  

Para un deploy 24/7:

- Usa servidores con GPU:
  - RunPod
  - Paperspace
  - LambdaLabs  

---

**¡Disfruta tu plataforma profesional de transcripción y traducción! 🚀**
