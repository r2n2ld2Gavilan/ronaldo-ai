# 🤖 RONALDO AI

RONALDO AI es un asistente de inteligencia artificial desarrollado con JavaScript, Vite y Google Gemini API.

El proyecto permite interactuar con una IA mediante texto y voz, analizar archivos, generar código, visualizar datos mediante gráficos y conservar un historial de conversaciones.

Además, incluye dos temas visuales intercambiables: una interfaz Cyberpunk y una interfaz clara minimalista.

---

## 🚀 Funcionalidades

- 💬 Chat con Google Gemini.
- 🎙️ Dictado mediante micrófono.
- 🔊 Lectura por voz de las respuestas.
- 📎 Carga y análisis de archivos.
- 📊 Generación de gráficos con Chart.js.
- 💻 Generación y resaltado de código.
- 📋 Copiar respuestas y bloques de código.
- 📥 Descargar código generado.
- 📷 Descargar gráficos en formato PNG.
- 🧠 Historial de conversaciones.
- 🗑️ Eliminación de memoria almacenada.
- 📁 Exportación de sesiones.
- 🔄 Sistema de respaldo entre modelos Gemini.
- 🌙 Tema Cyberpunk.
- ☀️ Tema claro minimalista.
- 💾 Memoria del tema seleccionado mediante LocalStorage.
- 📱 Diseño responsive.

---

## 🧠 Inteligencia Artificial

RONALDO AI utiliza la API de Google Gemini para procesar las consultas realizadas por el usuario.

La aplicación dispone de un sistema de modelos de respaldo que intenta utilizar diferentes modelos Gemini cuando uno de ellos no está disponible.

La API Key no se incluye directamente en el código fuente ni debe publicarse en GitHub.

---

## 🔐 Variables de entorno

Para ejecutar el proyecto localmente se debe crear un archivo:

```text
.env
```

Dentro se configura:

```env
VITE_GEMINI_API_KEY=TU_API_KEY_DE_GEMINI
```

**Importante:** esa línea es solamente un ejemplo de configuración. Nunca se debe escribir la API Key real dentro del README.

El archivo `.env` está incluido en `.gitignore` y no debe subirse al repositorio de GitHub.

---

## 🛠️ Tecnologías utilizadas

- HTML5
- CSS3
- JavaScript
- Vite
- Bootstrap 5
- Google Gemini API
- Chart.js
- Chart.js DataLabels
- Prism.js
- Marked.js
- SheetJS / XLSX
- jsPDF
- html2canvas
- Font Awesome
- Web Speech API

---

## 📂 Estructura principal

```text
RONALDO_AI/
│
├── .env
├── .gitignore
├── index.html
├── main.js
├── style.css
├── package.json
├── package-lock.json
└── README.md
```

La carpeta `node_modules` se genera automáticamente mediante npm y no se incluye en GitHub.

---

## ⚙️ Instalación

Para instalar las dependencias del proyecto se utiliza:

```bash
npm install
```

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

Vite proporcionará una dirección local similar a:

```text
http://localhost:5173/
```

---

## 🎨 Temas visuales

RONALDO AI dispone de dos interfaces visuales.

### 🌙 Modo Cyberpunk

- Fondo oscuro.
- Tonos cian y magenta.
- Efectos neón.
- Estética tecnológica.

### ☀️ Modo claro minimalista

- Fondo blanco y gris.
- Texto oscuro.
- Sombras suaves.
- Diseño limpio y profesional.

El usuario puede cambiar entre ambos temas mediante un botón.

La selección queda almacenada en el navegador para conservar el último tema utilizado.

---

## 📊 Análisis de datos

RONALDO AI puede interpretar datos proporcionados por el usuario y generar visualizaciones mediante Chart.js.

Los gráficos se adaptan automáticamente al tema visual seleccionado sin alterar los datos originales.

También pueden descargarse como imágenes en formato PNG.

---

## 💻 Generación de código

La aplicación puede generar código en diferentes lenguajes de programación.

Los bloques de código utilizan Prism.js para ofrecer resaltado de sintaxis.

El usuario puede:

- Copiar el código.
- Descargar el código generado.
- Solicitar explicaciones sobre el funcionamiento del código.

---

## 🎙️ Sistema de voz

RONALDO AI utiliza Web Speech API para ofrecer funciones de voz.

Permite:

- Convertir voz a texto mediante el micrófono.
- Leer las respuestas generadas por la inteligencia artificial.

La aplicación prioriza voces disponibles en español.

La disponibilidad de voces puede variar dependiendo del navegador y del sistema operativo.

---

## 📁 Procesamiento de archivos

La aplicación permite adjuntar y analizar diferentes tipos de archivos.

Entre ellos:

- TXT
- CSV
- Excel
- PDF
- Imágenes
- Archivos de código

Los archivos compatibles son procesados y enviados a Gemini para su análisis.

---

## 🧠 Memoria e historial

RONALDO AI puede conservar un historial de las conversaciones realizadas.

El historial se almacena localmente en el navegador mediante LocalStorage.

El usuario puede:

- Consultar conversaciones anteriores.
- Iniciar una nueva conversación.
- Exportar una sesión.
- Eliminar la memoria almacenada.

---

## 🔄 Sistema de modelos Gemini

La aplicación dispone de un sistema de respaldo entre diferentes modelos Gemini.

Si un modelo no está disponible o presenta un problema, la aplicación puede intentar utilizar otro modelo compatible.

También dispone de un selector para elegir el modelo que se desea utilizar.

---

## 🔐 Seguridad

La API Key de Google Gemini no debe escribirse directamente dentro de:

- `index.html`
- `main.js`
- `style.css`
- `README.md`

Durante el desarrollo local se utiliza el archivo `.env`.

El archivo `.env` está excluido de Git mediante `.gitignore`.

Para la publicación en Vercel, la variable de entorno debe configurarse desde la configuración del proyecto.

---

## 🌐 Publicación

El proyecto será publicado utilizando:

- GitHub para almacenar el código fuente.
- Vercel para alojar la aplicación web.

La API Key no será publicada directamente en GitHub.

---

## 🔗 Enlaces del proyecto

### 📂 GitHub

https://github.com/r2n2ld2Gavilan/ronaldo-ai

### 🌐 Vercel

https://ronaldo-ai.vercel.app

### 🎥 Video de demostración

https://www.youtube.com/watch?v=IRN_goPv0W8
---

## 📚 Aprendizajes

Durante el desarrollo de este proyecto se aplicaron conocimientos relacionados con:

- Consumo de APIs de inteligencia artificial.
- Uso de Google Gemini API.
- Variables de entorno.
- JavaScript asíncrono.
- Procesamiento de archivos.
- Inteligencia artificial generativa.
- Visualización de datos.
- Generación de gráficos.
- Síntesis de voz.
- Reconocimiento de voz.
- Diseño responsive.
- LocalStorage.
- Git.
- GitHub.
- Vite.
- Vercel.

---

## 🔮 Mejoras futuras

Entre las mejoras que podrían incorporarse se encuentran:

- Autenticación de usuarios.
- Base de datos en la nube.
- Sincronización del historial entre diferentes dispositivos.
- Mayor soporte de formatos de archivos.
- Más opciones de personalización.
- Nuevos temas visuales.
- Voces independientes del navegador.
- Mayor cantidad de modelos de inteligencia artificial.
- Procesamiento de la API completamente del lado del servidor.
- Mayor seguridad de la API Key.

---

## 👨‍💻 Autor

**Ronaldo Abreu**

Proyecto académico de Inteligencia Artificial.