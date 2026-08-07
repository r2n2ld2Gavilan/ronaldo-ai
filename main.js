// ====================== MAIN.JS - MASTER OMEGA V15.2 (VOICE FIX FINAL) ======================
// Desarrollado por: Ing. Ronaldo Abreu
// Solo se corrigió el sistema de voz. Gráficos y todo lo demás intacto.

const MODELS_LIST = [
  // Nivel 1: Modelos insignia actuales (Máxima velocidad y razonamiento)
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  
  // Nivel 2: Modelos Pro de respaldo (Si requieres razonamiento denso, sujetos a cuota estricta/429)
  "gemini-3.1-pro-preview",
  "gemini-3-pro-preview",
  
  // Nivel 3: Modelos Lite ultrarrápidos (Ideales para tareas sencillas si los principales fallan)
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  
  // Nivel 4: Último recurso (Modelos heredados pero aún activos)
  "gemini-flash-latest",
  "gemini-2.0-flash"
];

Chart.register(ChartDataLabels);

const chartDefinitions = new Map();
const chartInstances = new Map();

function cloneChartValue(value) {
    try {
        return structuredClone(value);
    } catch (error) {
        return value;
    }
}


const SYSTEM_PROMPT = `Eres RONALDO AI, un asistente inteligente desarrollado por Ronaldo Abreu.
ERES UN ANALISTA DE DATOS SENIOR Y ARQUITECTO VISUAL.

REGLAS DE FORMATO DE TEXTO (CRÍTICO):
1. ESTRUCTURA: Usa siempre Títulos (##) y Subtítulos (###) para organizar la información.
2. RESALTADO: Aplica negritas (**palabra**) a términos clave, nombres propios y conceptos importantes.
3. DATOS: Aplica SIEMPRE formato de código (\`valor\`) a números, porcentajes (%), fechas y valores monetarios (ej: \`$1,250.00\`, \`25%\`).
4. TONO: Profesional, técnico y directo. Usa emojis de tecnología de forma moderada.

MISIÓN CRÍTICA DE GRÁFICOS:
1. ANÁLISIS DE ARCHIVOS: Analiza con precisión técnica cualquier archivo adjunto.
2. VISUALIZACIÓN MÚLTIPLE: Si el usuario pide VARIOS gráficos, crea bloques [CHART_DATA: {...}] TOTALMENTE SEPARADOS.
3. REGLAS DE CHART.JS (¡ESTRICTO!): 
   - NUNCA uses puntos suspensivos (...) en los arrays.
   - Usa SIEMPRE números reales.
   - NO envuelvas el bloque en markdown.
4. ESTILO: Cyberpunk neón vibrante.`;

// --- CONFIGURACIÓN DE API KEY (.env Priority) ---
let rawKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem("GEMINI_PRO_KEY") || "";
let API_KEY = rawKey.trim();

const THEME_STORAGE_KEY = "ronaldo_ai_theme";
let currentTheme = localStorage.getItem(THEME_STORAGE_KEY) === "light"
    ? "light"
    : "cyberpunk";

// --- MEMORIA Y ESTADO ---
let globalHistory = [];
try { globalHistory = JSON.parse(localStorage.getItem('cyberpunk_history_v15')) || []; } catch(e) { globalHistory = []; }
let currentSessionStartIndex = globalHistory.length; 

let uploadedFilesData = [];
let selectedModel = localStorage.getItem("selectedGeminiModel") || MODELS_LIST[0];
let isAudioEnabled = localStorage.getItem("cyberpunk_audio") !== "false"; 
let voiceTimer = null;
let globalUtterance = null; 

// --- REFERENCIAS AL DOM ---
const chatBox           = document.getElementById('chat-box');
const promptInput       = document.getElementById('prompt-input');
const chatForm          = document.getElementById('chat-form');
const sidebar           = document.getElementById('sidebar');
const modelStatus       = document.getElementById('model-status');
const historyList       = document.getElementById('history-list');
const sttBtn            = document.getElementById('stt-btn');
const fileUpload        = document.getElementById('file-upload');
const toggleAudioBtn    = document.getElementById('toggle-audio-global');
const newChatBtn        = document.getElementById('new-chat-btn');
const btnDownloadSession= document.getElementById('btn-download-session');
const clearMemoryBtn    = document.getElementById('clear-btn');
const themeToggleBtn     = document.getElementById('theme-toggle');
const themeIcon          = document.getElementById('theme-icon');


// ====================== DOBLE TEMA VISUAL ======================
function getChartThemeColors() {
    const isLight =
        currentTheme === "light" ||
        document.body.dataset.theme === "light" ||
        document.body.classList.contains("light-theme");

    return {
        text: isLight ? "#111318" : "#e0faff",
        secondaryText: isLight ? "#34373d" : "#b8f8ff",
        grid: isLight
            ? "rgba(17, 19, 24, 0.18)"
            : "rgba(224, 250, 255, 0.15)",
        label: "#ffffff",
        canvasBackground: isLight ? "#f7f7f8" : "#20252a"
    };
}


// PEGA LA NUEVA FUNCIÓN AQUÍ, DEBAJO

function applyChartThemeToOptions(options = {}) {
    const colors = getChartThemeColors();

    options.responsive = true;
    options.maintainAspectRatio = false;
    options.color = colors.text;

    options.plugins = options.plugins || {};

    options.plugins.title =
        options.plugins.title || {};

    if (options.plugins.title.display !== false) {
        options.plugins.title.color = colors.text;
    }

    if (options.plugins.subtitle) {
        options.plugins.subtitle.color =
            colors.secondaryText;
    }

    options.plugins.legend =
        options.plugins.legend || {};

    options.plugins.legend.labels =
        options.plugins.legend.labels || {};

    options.plugins.legend.labels.color =
        colors.text;

    options.plugins.datalabels = {
        ...(options.plugins.datalabels || {}),
        color: colors.label,
        font: {
            weight: "bold",
            size: 11,
            ...(options.plugins.datalabels?.font || {})
        },
        formatter: (value) => value,
        display: true
    };

    options.scales = options.scales || {
        x: {},
        y: {
            beginAtZero: true
        }
    };

    Object.values(options.scales).forEach((scale) => {
        scale.ticks = scale.ticks || {};
        scale.grid = scale.grid || {};
        scale.border = scale.border || {};

        scale.ticks.color = colors.text;
        scale.grid.color = colors.grid;
        scale.border.color = colors.grid;

        if (scale.title) {
            scale.title.color = colors.text;
        }
    });

    return options;
}

function renderChartById(id, config) {
    const canvas = document.getElementById(id);

    if (!canvas) return;

    // Si el gráfico ya existe, lo destruimos antes de volverlo a dibujar.
    const previousChart = chartInstances.get(id);

    if (previousChart) {
        previousChart.destroy();
    }

    const chartTheme = getChartThemeColors();

    Chart.defaults.color = chartTheme.text;
    Chart.defaults.borderColor = chartTheme.grid;
    Chart.defaults.font.family = "'Share Tech Mono'";

    // Conservamos exactamente los mismos datos.
    const chartData = cloneChartValue(
        config.data || {
            labels: config.labels || [],
            datasets: config.datasets || []
        }
    );

    if (!Array.isArray(chartData.labels)) {
        throw new Error(
            "El gráfico no contiene un arreglo válido de labels."
        );
    }

    if (
        !Array.isArray(chartData.datasets) ||
        chartData.datasets.length === 0
    ) {
        throw new Error(
            "El gráfico no contiene conjuntos de datos."
        );
    }

    // Colores de las barras.
    const palette = [
        "#00d7e8",
        "#ff278f",
        "#a72cff",
        "#21e8a7",
        "#ffb020",
        "#3578ff"
    ];

    chartData.datasets.forEach((dataset, index) => {
        if (!dataset.backgroundColor) {
            dataset.backgroundColor =
                palette[index % palette.length];
        }

        if (!dataset.borderColor) {
            dataset.borderColor =
                dataset.backgroundColor;
        }

        if (dataset.borderWidth == null) {
            dataset.borderWidth = 1;
        }
    });

    // Copia independiente de las opciones.
    let optionsFinales =
        cloneChartValue(config.options || {});

    // Aquí se aplican los colores del tema ACTUAL.
    optionsFinales =
        applyChartThemeToOptions(optionsFinales);

    const newChart = new Chart(
        canvas.getContext("2d"),
        {
            type: config.type || "bar",
            data: chartData,
            options: optionsFinales,
            plugins: [ChartDataLabels]
        }
    );

    // Guardamos los datos originales para poder reconstruirlo
    // cuando el usuario cambie de tema.
    chartDefinitions.set(id, config);
    chartInstances.set(id, newChart);
}

function updateExistingChartsTheme() {
    const savedCharts =
        [...chartDefinitions.entries()];

    savedCharts.forEach(([id, config]) => {
        if (document.getElementById(id)) {
            try {
                renderChartById(id, config);
            } catch (error) {
                console.error(
                    "Error actualizando tema del gráfico:",
                    error
                );
            }
        }
    });
}

function applyTheme(theme, savePreference = true) {
    currentTheme = theme === 'light' ? 'light' : 'cyberpunk';
    const isLight = currentTheme === 'light';

    document.body.classList.toggle('light-theme', isLight);
    document.body.dataset.theme = currentTheme;
    document.documentElement.style.colorScheme = isLight ? 'light' : 'dark';

    if (themeIcon) {
        themeIcon.className = isLight
            ? 'fa-solid fa-moon'
            : 'fa-solid fa-sun';
    }

    if (themeToggleBtn) {
        const nextThemeLabel = isLight
            ? 'Activar modo cyberpunk'
            : 'Activar modo claro minimalista';

        themeToggleBtn.title = nextThemeLabel;
        themeToggleBtn.setAttribute('aria-label', nextThemeLabel);
        themeToggleBtn.setAttribute('aria-pressed', String(isLight));
    }

    if (savePreference) {
        localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
    }

   requestAnimationFrame(updateExistingChartsTheme);
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        const nextTheme = currentTheme === 'light' ? 'cyberpunk' : 'light';
        applyTheme(nextTheme);
    });
}

function initApp() {
    applyTheme(currentTheme, false);
    renderHistorySidebar();
    modelStatus.innerHTML = `<i class='fa-solid fa-microchip'></i> LINK: ${selectedModel}`;
    updateAudioBtnStyle();
    createModelSelector();
    ajustarInput();
    
    window.speechSynthesis.getVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
}

function ajustarInput() { 
    if (!promptInput) return;
    promptInput.style.height = 'auto'; 
    promptInput.style.height = promptInput.scrollHeight + 'px'; 
}
promptInput.addEventListener('input', ajustarInput);

promptInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); 
        if (promptInput.value.trim() || uploadedFilesData.length > 0) {
            chatForm.requestSubmit(); 
        }
    }
});

if (btnDownloadSession) {
    btnDownloadSession.onclick = () => {
        let log = "=== REPORTE DE CONVERSACIÓN - RONALDO AI ===\n\n";
        document.querySelectorAll('#chat-box .message').forEach(m => {
            const role = m.classList.contains('user-msg') ? "USUARIO" : "RONALDO AI";
            let textOnly = m.innerText.replace(/Copiar|Bajar/g, '').trim();
            log += `[${role}]:\n${textOnly}\n\n------------------\n\n`;
        });
        const blob = new Blob([log], { type: 'text/plain' });
        const link = document.createElement('a'); 
        link.href = URL.createObjectURL(blob);
        link.download = `Sesion_RONALDO_AI_${Date.now()}.txt`; 
        link.click();
    };
}

if (newChatBtn) {
    newChatBtn.onclick = () => {
        chatBox.innerHTML = '<div class="message system-msg"><div class="msg-content text-success"><i class="fa-solid fa-check"></i> Pantalla limpia. Neural Link Reiniciado.</div></div>';
        currentSessionStartIndex = globalHistory.length; 
        promptInput.value = ''; 
        ajustarInput(); 
        uploadedFilesData = [];
        document.getElementById('file-preview-zone').classList.add('d-none'); 
        window.speechSynthesis.cancel();
    };
}

if (clearMemoryBtn) {
    clearMemoryBtn.onclick = () => {
        if(confirm("¿Estás seguro de que quieres BORRAR TODA LA MEMORIA del navegador?")) {
            localStorage.removeItem('cyberpunk_history_v15');
            location.reload();
        }
    };
}

// --- STT (MICRÓFONO) ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
    recognition.lang = 'es-ES'; recognition.continuous = true; recognition.interimResults = true;
    recognition.onresult = (event) => {
        clearTimeout(voiceTimer);
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) transcript += event.results[i][0].transcript;
        promptInput.value = transcript; ajustarInput();
        voiceTimer = setTimeout(() => { 
            if (promptInput.value.trim()) { recognition.stop(); chatForm.requestSubmit(); } 
        }, 3000);
    };
    recognition.onend = () => sttBtn.classList.remove('neon-text-red');
}
sttBtn.onclick = () => {
    if (!recognition) return alert("Navegador no soporta dictado por voz.");
    if (sttBtn.classList.contains('neon-text-red')) recognition.stop();
    else { sttBtn.classList.add('neon-text-red'); recognition.start(); }
};

// ====================== SISTEMA DE VOZ CORREGIDO ======================
function getPreferredSpanishFemaleVoice() {
    const voices = window.speechSynthesis.getVoices();

    // SOLO aceptar voces cuyo idioma sea español
    const spanishVoices = voices.filter((voice) => {
        const lang = (voice.lang || "").toLowerCase();

        return (
            lang === "es" ||
            lang.startsWith("es-") ||
            lang.startsWith("es_")
        );
    });

    // Si Brave no ofrece ninguna voz española,
    // no permitimos que use una voz inglesa.
    if (spanishVoices.length === 0) {
        console.warn(
            "No hay voces en español disponibles en este navegador."
        );

        return null;
    }

    // Nombres habituales de voces femeninas
    const femaleHints = [
        "female",
        "sabina",
        "helena",
        "elvira",
        "dalia",
        "paulina",
        "paloma",
        "monica",
        "mónica",
        "sofia",
        "sofía",
        "luciana",
        "lupe",
        "conchita",
        "maria",
        "maría",
        "ximena",
        "isabela",
        "isabella",
        "carolina",
        "camila",
        "valentina"
    ];

    // 1. Prioridad: española femenina
    const femaleSpanish = spanishVoices.find((voice) => {
        const name = voice.name.toLowerCase();

        return femaleHints.some((hint) =>
            name.includes(hint)
        );
    });

    if (femaleSpanish) {
        return femaleSpanish;
    }

    // 2. Prioridad: español latinoamericano
    const latinSpanish = spanishVoices.find((voice) => {
        const lang = voice.lang.toLowerCase();

        return (
            lang === "es-do" ||
            lang === "es-mx" ||
            lang === "es-us" ||
            lang === "es-419"
        );
    });

    if (latinSpanish) {
        return latinSpanish;
    }

    // 3. Cualquier voz española disponible
    return spanishVoices[0];
}

function speak(text) {
    if (!isAudioEnabled || !text) return;

    window.speechSynthesis.cancel();   // Apaga cualquier voz anterior inmediatamente
    window.speechSynthesis.resume();   // Desbloquea el estado de pausa del navegador

    let clean = text
        .replace(/\[CHART_DATA[\s\S]*?\]/gs, ' Gráfico generado en pantalla. ')
        .replace(/```[\s\S]*?```/gs, ' Bloque de código omitido. ')
        .replace(/<[^>]*>?/gm, '')
        .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
        .replace(/[#*`_~→←↑↓↔︎\-]/g, ' ')
        // Preparamos el texto para pausas naturales separando por signos de puntuación
        .replace(/([.?!:;])\s*/g, '$1|') 
        .replace(/\s+/g, ' ')
        .trim();

    if (!clean) return;

    // Dividimos el texto usando el marcador '|' para lectura por fragmentos (chunking)
    let chunks = clean.split('|').filter(c => c.trim().length > 0);
    let chunkIndex = 0;

    function playNextChunk() {
        if (chunkIndex >= chunks.length) return;

        globalUtterance = new SpeechSynthesisUtterance(chunks[chunkIndex].trim()); 
        globalUtterance.lang = "es-DO";
globalUtterance.rate = 1.05;
globalUtterance.pitch = 1.05;

const selectedVoice =
    getPreferredSpanishFemaleVoice();

if (!selectedVoice) {
    console.warn(
        "RONALDO AI: voz desactivada porque este navegador no dispone de una voz en español."
    );

    return;
}

globalUtterance.voice = selectedVoice;
globalUtterance.lang = selectedVoice.lang;

        globalUtterance.onend = () => {
            chunkIndex++;
            playNextChunk();
        };
        
        globalUtterance.onerror = (e) => {
            console.error("Voz interrumpida:", e);
            window.speechSynthesis.cancel();
        };

        window.speechSynthesis.speak(globalUtterance);
        
        // Mantiene el motor despierto forzando un resume
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.resume();
        }
    }

    setTimeout(() => {
        playNextChunk();
    }, 80);
}

function updateAudioBtnStyle() {
    toggleAudioBtn.innerHTML = isAudioEnabled ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
    toggleAudioBtn.classList.toggle('active', isAudioEnabled);
}

// BOTÓN PARA ACTIVAR / DESACTIVAR VOZ
toggleAudioBtn.onclick = () => {
    isAudioEnabled = !isAudioEnabled;
    localStorage.setItem("cyberpunk_audio", isAudioEnabled);
    updateAudioBtnStyle();
    
    if (!isAudioEnabled) {
        window.speechSynthesis.cancel(); // Apaga completamente
    } else {
        window.speechSynthesis.cancel(); // Limpia cualquier estado previo
        window.speechSynthesis.resume(); // Despierta el motor
        speak("Sistema de voz activado.");
    }
};

// ====================== EL RESTO DEL CÓDIGO (INTACTO - NO TOCADO) ======================
function procesarEstructuraVisual(text) {
    let processedText = text;
    let extractedConfigs = [];
    
    processedText = processedText.replace(/```(?:json|javascript|html)?\s*(\[CHART_DATA:[\s\S]*?\])\s*```/gi, '$1');

    const TAG = '[CHART_DATA:';

    while (processedText.includes(TAG)) {
        let tagIndex = processedText.indexOf(TAG);
        let jsonStart = processedText.indexOf('{', tagIndex);

        if (jsonStart === -1) {
            processedText = processedText.replace(TAG, '[CHART_DATA_INVALIDO]');
            continue;
        }

        let depth = 0; let jsonEnd = -1; let found = false;
        for (let i = jsonStart; i < processedText.length; i++) {
            if (processedText[i] === '{') { depth++; found = true; }
            else if (processedText[i] === '}') { depth--; if (found && depth === 0) { jsonEnd = i; break; } }
        }

        if (jsonEnd !== -1) {
            let closingBracket = processedText.indexOf(']', jsonEnd);
            let endOfBlock = (closingBracket !== -1 && closingBracket - jsonEnd < 15) ? closingBracket + 1 : jsonEnd + 1;
            let fullMatch = processedText.substring(tagIndex, endOfBlock);
            let jsonStr = processedText.substring(jsonStart, jsonEnd + 1).trim();
            
            try {
                const config = new Function(`return (${jsonStr})`)();
                const cid = `chart-${Date.now()}-${extractedConfigs.length}`;
                extractedConfigs.push({ id: cid, config });
                processedText = processedText.replace(fullMatch, `\n\n%%%CHART_${extractedConfigs.length-1}%%%\n\n`);
            } catch (e) { 
                const errorBox = `\n\n<div class="cyber-card border border-danger p-3 my-3 bg-dark text-danger rounded"><i class="fa-solid fa-bug"></i> <strong>Error:</strong> La IA omitió datos numéricos.</div>\n\n`;
                processedText = processedText.replace(fullMatch, errorBox);
            }
        } else {
            processedText = processedText.replace(TAG, '[CHART_INCOMPLETO]');
        }
    }

    let finalHtml = marked.parse(processedText);

    extractedConfigs.forEach((ch, idx) => {
        const container = `
        <div class="cyber-card p-3 my-4 border border-info rounded bg-dark shadow-neon w-100">
            <div class="d-flex justify-content-between align-items-center mb-2 border-bottom border-info pb-2">
                <span class="neon-text-blue small fw-bold"><i class="fa-solid fa-chart-pie me-1"></i> GRÁFICO VISUAL</span>
                <button class="btn btn-sm cyber-btn-icon" onclick="descargarCanvas('${ch.id}')" title="Descargar PNG"><i class="fa-solid fa-camera"></i></button>
            </div>
            <div style="position:relative; width:100%; height:350px;">
                <canvas id="${ch.id}"></canvas>
            </div>
        </div>`;
        finalHtml = finalHtml.replace(`%%%CHART_${idx}%%%`, container);
    });

    return { html: finalHtml, charts: extractedConfigs };
}

window.descargarCanvas = async (id) => {
    const canvas = document.getElementById(id);

    if (!canvas) {
        alert("No se encontró el gráfico para descargar.");
        return;
    }

    // Crea otro canvas para agregarle un fondo visible al PNG.
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;

    const ctx = exportCanvas.getContext("2d");
    const isLight = document.body.classList.contains("light-theme");

    // Fondo según el tema actual.
    ctx.fillStyle = isLight ? "#f7f7f8" : "#050508";
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Copia el gráfico original sobre el fondo.
    ctx.drawImage(canvas, 0, 0);

    const link = document.createElement("a");
    link.download = `Grafico_${id}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
};

function appendMessage(role, html, charts = []) {
    const id = 'msg-' + Date.now() + Math.floor(Math.random()*1000);
    const div = document.createElement('div'); 
    div.className = `message ${role}-msg animate__animated animate__fadeIn`; 
    div.id = id;
    div.innerHTML = `<div class="msg-content position-relative">${html}</div>`;
    
    const copyBtn = document.createElement('button'); 
    copyBtn.className = 'btn btn-sm cyber-btn-icon position-absolute top-0 end-0 m-1 opacity-50';
    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
    copyBtn.onclick = () => { 
        navigator.clipboard.writeText(div.innerText); 
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>'; 
        setTimeout(()=>copyBtn.innerHTML='<i class="fa-regular fa-copy"></i>', 2000); 
    };
    div.querySelector('.msg-content').appendChild(copyBtn);

    chatBox.appendChild(div); 
    chatBox.scrollTop = chatBox.scrollHeight;

    if (role === 'model') {
        div.querySelectorAll('pre').forEach(pre => {
            pre.style.position = 'relative';
            const codeContainer = document.createElement('div');
            codeContainer.className = 'd-flex justify-content-end gap-2 position-absolute top-0 end-0 p-1';
            
            const bC = document.createElement('button'); bC.className = 'btn btn-sm cyber-btn-blue'; bC.innerHTML = '<i class="fa-regular fa-copy"></i> Copiar';
            bC.onclick = () => { navigator.clipboard.writeText(pre.innerText); bC.innerHTML = '<i class="fa-solid fa-check"></i>'; setTimeout(()=>bC.innerHTML='<i class="fa-regular fa-copy"></i> Copiar', 2000); };
            
            const bD = document.createElement('button'); bD.className = 'btn btn-sm cyber-btn-pink'; bD.innerHTML = '<i class="fa-solid fa-download"></i> Bajar';
            bD.onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([pre.innerText], {type:'text/plain'})); a.download = `script_${Date.now()}.txt`; a.click(); };
            
            codeContainer.appendChild(bC); codeContainer.appendChild(bD);
            pre.appendChild(codeContainer);
        });
        Prism.highlightAllUnder(div);

       if (charts.length > 0) {
    setTimeout(() => {
        charts.forEach((ch) => {
            try {
                renderChartById(
                    ch.id,
                    ch.config
                );
            } catch (error) {
                console.error(
                    "Error al dibujar el gráfico:",
                    error
                );

                const canvas =
                    document.getElementById(ch.id);

                const chartArea =
                    canvas?.parentElement;

                if (chartArea) {
                    chartArea.innerHTML = `
                        <div
                            class="d-flex h-100
                                   align-items-center
                                   justify-content-center
                                   text-center p-4"
                        >
                            <div>
                                <i
                                    class="fa-solid
                                           fa-triangle-exclamation
                                           text-warning mb-2"
                                ></i>

                                <div>
                                    No se pudo dibujar
                                    este gráfico.
                                </div>

                                <small
                                    style="
                                        color:
                                        var(--text-muted);
                                    "
                                >
                                    ${error.message}
                                </small>
                            </div>
                        </div>
                    `;
                }
            }
        });
    }, 300);
}
    }
    return id;
}

chatForm.onsubmit = async (e) => {
    e.preventDefault(); 
    const text = promptInput.value.trim(); 
    if (!text && uploadedFilesData.length === 0) return;
    
    appendMessage('user', marked.parse(text));
    globalHistory.push({ role: "user", text: text });
    promptInput.value = ''; ajustarInput();
    const loadingId = appendMessage('system', '<i class="fa-solid fa-brain fa-fade"></i> RONALDO AI ESTÁ PROCESANDO...');
    try {
        const responseData = await executeModelFallback(text, [...uploadedFilesData]);
        document.getElementById(loadingId).remove();
        
        let rawText = ""; 
        responseData.candidates?.[0]?.content?.parts.forEach(p => { if (p.text) rawText += p.text; });
        
        const res = procesarEstructuraVisual(rawText);
        appendMessage('model', res.html, res.charts);
        
        speak(rawText);   // ← Voz corregida

        globalHistory.push({ role: "model", text: rawText });
        localStorage.setItem('cyberpunk_history_v15', JSON.stringify(globalHistory));
        renderHistorySidebar();
        
        uploadedFilesData = []; 
        document.getElementById('file-preview-zone').classList.add('d-none');
    } catch (err) { 
        document.getElementById(loadingId).innerText = "ERROR: " + err.message; 
        if (err.message.includes('403')||err.message.includes('429')) triggerProModal(); 
    }
};

async function executeModelFallback(promptText, files, index = 0) {
    const model = MODELS_LIST[index] || MODELS_LIST[0]; 
    modelStatus.innerHTML = `LINK: ${model}`;
    let sessionCtx = globalHistory.slice(currentSessionStartIndex).map(h => ({ role: h.role, parts: [{ text: h.text }] })).slice(-8);
    let userPart = { role: "user", parts: [{ text: promptText }] };
    files.forEach(f => { 
        if (f.isBase64) userPart.parts.push({ inlineData: { mimeType: f.mimeType, data: f.data } }); 
        else userPart.parts[0].text += `\n\n[ARCHIVO ADJUNTO: ${f.name}]\n${f.data}`; 
    });
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ contents: [...sessionCtx, userPart], systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] } }) 
    });
    if (!res.ok) { 
        if (index < MODELS_LIST.length - 1) return executeModelFallback(promptText, files, index + 1); 
        throw new Error(res.status); 
    }
    return await res.json();
}

function renderHistorySidebar() {
    historyList.innerHTML = '';
    globalHistory.forEach((h, i) => {
        if (h.role === 'user') {
            const li = document.createElement('li'); 
            li.className = 'history-item p-2 mb-2 border border-info rounded small text-truncate';
            li.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> ${h.text.substring(0, 30)}...`;
            li.onclick = () => {
                chatBox.innerHTML = ''; 
                currentSessionStartIndex = i;
                appendMessage('user', marked.parse(h.text));
                if (globalHistory[i+1] && globalHistory[i+1].role === 'model') {
                    const ia = globalHistory[i+1];
                    const restored = procesarEstructuraVisual(ia.text); 
                    appendMessage('model', restored.html, restored.charts);
                }
            };
            historyList.appendChild(li);
        }
    });
}

fileUpload.onchange = async (e) => {
    uploadedFilesData = []; 
    const preview = document.getElementById('file-preview-zone'); 
    preview.innerHTML = ''; 
    preview.classList.remove('d-none');
    for (let file of e.target.files) {
        const ext = file.name.split('.').pop().toLowerCase();
        const tag = document.createElement('span'); 
        tag.className = 'file-tag'; 
        tag.innerHTML = `<i class="fa-solid fa-sync fa-spin"></i> ${file.name}`; 
        preview.appendChild(tag);
        try {
            if (['xlsx','xls'].includes(ext)) {
                const d = await file.arrayBuffer(); 
                const wb = XLSX.read(d); 
                let t = "";
                wb.SheetNames.forEach(n => { t += `[HOJA: ${n}]\n${XLSX.utils.sheet_to_csv(wb.Sheets[n])}\n`; });
                uploadedFilesData.push({ name: file.name, data: t, isBase64: false });
            } else if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
                const b64 = await (f => new Promise((rs, rj) => { 
                    const r = new FileReader(); 
                    r.readAsDataURL(f); 
                    r.onload = () => rs(r.result); 
                    r.onerror = e => rj(e); 
                }))(file);
                uploadedFilesData.push({ name: file.name, data: b64.split(',')[1], mimeType: file.type, isBase64: true });
            } else { 
                const t = await file.text(); 
                uploadedFilesData.push({ name: file.name, data: t, isBase64: false }); 
            }
            tag.innerHTML = `<i class="fa-solid fa-check text-neon-green"></i> ${file.name}`;
        } catch (err) { 
            tag.innerHTML = `<i class="fa-solid fa-times text-danger"></i> ${file.name}`; 
        }
    }
};

function createModelSelector() {
    const sel = document.createElement('select'); 
    sel.className = 'form-select cyber-input mt-3';
    sel.innerHTML = MODELS_LIST.map(m => `<option value="${m}" ${m === selectedModel ? 'selected' : ''}>${m}</option>`).join('');
    sel.onchange = (e) => { 
        selectedModel = e.target.value; 
        localStorage.setItem("selectedGeminiModel", selectedModel); 
        modelStatus.innerHTML = `LINK: ${selectedModel}`; 
    }; 
    sidebar.appendChild(sel);
}

function triggerProModal() { 
    new bootstrap.Modal(document.getElementById('proModal')).show(); 
}
document.getElementById('submit-pro-key').onclick = () => {
    const key = document.getElementById('pro-api-key').value; 
    if (key) { 
        API_KEY = key; 
        localStorage.setItem("GEMINI_PRO_KEY", key); 
        location.reload(); 
    }
};

document.getElementById('toggle-sidebar').onclick = () => sidebar.classList.toggle('collapsed');
document.getElementById('close-sidebar').onclick = () => sidebar.classList.add('collapsed');

initApp();
