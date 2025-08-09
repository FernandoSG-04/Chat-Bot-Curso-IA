// Configuración del chatbot
const CHATBOT_CONFIG = {
    name: 'Asistente de Aprende y Aplica IA',
    typingSpeed: 50,
    responseDelay: 1000,
    audioEnabled: true,
    welcomeAudio: {
        src: 'assets/audio/welcome.mp3',
        volume: 0.7
    },
    // Configuración de OpenAI (se cargará desde variables de entorno)
    openai: {
        apiKey: null, // Se cargará dinámicamente
        model: 'gpt-4',
        maxTokens: 1000,
        temperature: 0.7
    },
    // Configuración de base de datos (se cargará desde variables de entorno)
    database: {
        url: null // Se cargará dinámicamente
    }
};

// Estado del chatbot
let chatState = {
    isTyping: false,
    conversationHistory: [],
    currentTopic: null,
    audioContext: null,
    audioEnabled: true,
    userName: '',
    currentState: 'start',
    dbConnection: null,
    // Token para cancelar escritura simulada en curso
    typingToken: 0,
    // Referencia a audio en reproducción (bienvenida u otros)
    currentAudio: null
};

// Elementos del DOM
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const actionButton = document.getElementById('actionButton');
const audioToggle = document.getElementById('audioToggle');
const inputContainer = document.getElementById('inputContainer');

// HTML helpers para avatares estilo Messenger
function getBotAvatarHTML() {
    return `
        <div class="msg-avatar bot">
            <div class="avatar-circle">🤖</div>
        </div>
    `;
}

function getUserAvatarHTML() {
    // Si en el futuro hay foto del usuario, podríamos traerla de session/local
    return `
        <div class="msg-avatar user">
            <div class="avatar-circle">🧑</div>
        </div>
    `;
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeSecurity();
    initializeAudio();
    loadAudioPreference();
    initializeDatabase();
    playChatOpenAnimation().then(() => {
        initializeChat();
    });
    setupEventListeners();
    // Sincronizar estado inicial del botón de acción
    if (messageInput.value.trim().length > 0) {
        inputContainer.classList.add('input-has-text');
    } else {
        inputContainer.classList.remove('input-has-text');
    }
});

// Animación de apertura del contenedor de chat
function playChatOpenAnimation() {
    return new Promise((resolve) => {
        try {
            const container = document.querySelector('.telegram-container');
            if (!container) return resolve();

            // Respetar preferencias de accesibilidad
            const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReducedMotion) return resolve();

            // Animación simple y limpia: fade + scale del contenedor
            container.classList.add('chat-open-start');
            // forzar reflow
            void container.offsetWidth;
            container.classList.add('chat-open-animate');

            const onEnd = () => {
                container.removeEventListener('animationend', onEnd);
                container.classList.remove('chat-open-start', 'chat-open-animate');
                resolve();
            };

            container.addEventListener('animationend', onEnd);
            setTimeout(onEnd, 1200);
        } catch (_) {
            resolve();
        }
    });
}

// Inicializar configuración de seguridad
async function initializeSecurity() {
    try {
        // Cargar configuración desde el servidor de forma segura
        const configResponse = await fetch('/api/config', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': getApiKey(),
                ...getUserAuthHeaders(),
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });

        if (configResponse.ok) {
            const config = await configResponse.json();
            CHATBOT_CONFIG.openai.model = config.openaiModel || 'gpt-4';
            CHATBOT_CONFIG.openai.maxTokens = config.maxTokens || 1000;
            CHATBOT_CONFIG.openai.temperature = config.temperature || 0.7;
            CHATBOT_CONFIG.audioEnabled = config.audioEnabled !== false;
            console.log('Configuración cargada de forma segura');
        } else {
            console.warn('No se pudo cargar la configuración del servidor');
        }
    } catch (error) {
        console.warn('Error cargando configuración:', error);
    }
}

// Inicializar sistema de audio
function initializeAudio() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            chatState.audioContext = new AudioContext();
        }
    } catch (error) {
        console.warn('Audio no soportado:', error);
        chatState.audioEnabled = false;
    }
}

// Cargar preferencia de audio tempranamente para que afecte la bienvenida
function loadAudioPreference() {
    try {
        const saved = localStorage.getItem('chat_audio_enabled');
        if (saved !== null) {
            const enabled = JSON.parse(saved);
            chatState.audioEnabled = !!enabled;
            if (!enabled && audioToggle) audioToggle.classList.add('muted');
        }
    } catch(_) {}
}

// Inicializar conexión a base de datos
async function initializeDatabase() {
    try {
        if (!CHATBOT_CONFIG.database.url) {
            console.warn('URL de base de datos no configurada');
            return;
        }
        console.log('Configuración de base de datos cargada');
    } catch (error) {
        console.warn('Error inicializando base de datos:', error);
    }
}

// Inicializar el chat
function initializeChat() {
    // Secuencia con escritura simulada
    (async () => {
        // Obtener nombre del usuario desde session/local storage
        try {
            const storedName = sessionStorage.getItem('loggedUser') || localStorage.getItem('rememberedUser');
            if (storedName) {
                chatState.userName = storedName;
            }
        } catch (_) {}

        const greeting = chatState.userName
            ? `¡Hola, ${chatState.userName}!  Bienvenido al Chatbot Educativo de Inteligencia Artificial.\n\nSoy tu asistente virtual y estaré aquí para acompañarte durante todo el curso de IA profesional.`
            : `¡Hola!  Bienvenido al Chatbot Educativo de Inteligencia Artificial.\n\nSoy tu asistente virtual y estaré aquí para acompañarte durante todo el curso de IA profesional.`;

        await sendBotMessage(greeting, null, false, true);
        await showWelcomeInstructions();
        if (!chatState.userName) {
            await sendBotMessage("Para comenzar, por favor proporciona tu nombre y apellido:", null, true, false);
        }
    })();
}

// Reproducir audio de bienvenida
function playWelcomeAudio() {
    if (!chatState.audioEnabled || !CHATBOT_CONFIG.audioEnabled) return;

    if ('speechSynthesis' in window) {
        playWelcomeSpeech();
    } else {
        playWelcomeAudioFile();
    }
}

// Reproducir audio usando Web Speech API
function playWelcomeSpeech() {
    try {
        const welcomeText = "¡Hola! Bienvenido al Chatbot Educativo de Inteligencia Artificial. Soy tu asistente virtual y estaré aquí para acompañarte durante todo el curso.";
        const utterance = new SpeechSynthesisUtterance(welcomeText);
        utterance.lang = 'es-ES';
        utterance.rate = 0.85;
        utterance.pitch = 1.0;
        utterance.volume = chatState.audioEnabled ? CHATBOT_CONFIG.welcomeAudio.volume : 0;
        
        const voices = speechSynthesis.getVoices();
        const spanishVoice = voices.find(voice => voice.lang.includes('es'));
        if (spanishVoice) {
            utterance.voice = spanishVoice;
        }
        
        // Guardar referencia para poder cancelar o silenciar dinámicamente
        chatState.currentAudio = utterance;
        speechSynthesis.cancel(); // asegurar que no haya colas
        speechSynthesis.speak(utterance);
        console.log('Audio de bienvenida reproducido con Web Speech API');
    } catch (error) {
        console.warn('Error reproduciendo audio con Web Speech API:', error);
        playWelcomeAudioFile();
    }
}

// Reproducir archivo de audio de bienvenida
function playWelcomeAudioFile() {
    try {
        const audio = new Audio(CHATBOT_CONFIG.welcomeAudio.src);
        audio.volume = chatState.audioEnabled ? CHATBOT_CONFIG.welcomeAudio.volume : 0;
        chatState.currentAudio = audio;
        
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('Audio de bienvenida reproducido exitosamente');
                })
                .catch(error => {
                    console.warn('Error reproduciendo audio de bienvenida:', error);
                });
        }
    } catch (error) {
        console.warn('Error inicializando audio de bienvenida:', error);
    }
}

// Configurar event listeners
function setupEventListeners() {
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Ya no hay sendButton; se usa actionButton

    // Mostrar botón enviar si hay texto; micrófono si está vacío
    const updateActionState = () => {
        if (messageInput.value.trim().length > 0) {
            inputContainer.classList.add('input-has-text');
        } else {
            inputContainer.classList.remove('input-has-text');
        }
    };
    messageInput.addEventListener('input', updateActionState);
    messageInput.addEventListener('keyup', updateActionState);
    messageInput.addEventListener('change', updateActionState);

    // Toggle de audio y persistencia
    audioToggle.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const newState = toggleAudio();
        if (!newState) audioToggle.classList.add('muted'); else audioToggle.classList.remove('muted');
        try { localStorage.setItem('chat_audio_enabled', JSON.stringify(newState)); } catch(_){}
    });

    // Cargar preferencia de audio (sin forzar toggle de lógica)
    try {
        const saved = localStorage.getItem('chat_audio_enabled');
        if (saved !== null) {
            const enabled = JSON.parse(saved);
            chatState.audioEnabled = !!enabled;
            if (!enabled) audioToggle.classList.add('muted'); else audioToggle.classList.remove('muted');
        }
    } catch(_){ }

    // Micrófono: placeholder para reconocimiento de voz
    // Acción dual: enviar cuando hay texto; grabar voz cuando está vacío
    actionButton.addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        // Cancelar cualquier escritura simulada pendiente del bot
        chatState.typingToken++;
        hideTypingIndicator();
        setHeaderTyping(false);
        chatState.isTyping = false;
        if (messageInput.value.trim().length === 0) {
            document.getElementById('inputContainer')?.classList.add('recording');
            startVoiceInputUI();
        }
    });

    actionButton.addEventListener('mouseup', () => {
        // Si está grabando, detener
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
    });

    actionButton.addEventListener('click', (ev) => {
        // Con texto: enviar (click estándar)
        if (messageInput.value.trim().length > 0) {
            ev.preventDefault();
            sendMessage();
        }
    });

    // Forzar primer estado
    if (messageInput.value.trim().length > 0) {
        inputContainer.classList.add('input-has-text');
    } else {
        inputContainer.classList.remove('input-has-text');
    }

    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });
}

// Reconocimiento de voz básico (si disponible)
function startVoiceInput() {
    try {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SR();
        rec.lang = 'es-ES';
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        rec.onresult = (e) => {
            const text = e.results[0][0].transcript;
            messageInput.value = text;
            inputContainer.classList.add('input-has-text');
            stopVoiceInputUI();
            document.getElementById('inputContainer')?.classList.remove('recording');
        };
        rec.onerror = () => { stopVoiceInputUI(); document.getElementById('inputContainer')?.classList.remove('recording'); };
        rec.onend = () => { stopVoiceInputUI(); document.getElementById('inputContainer')?.classList.remove('recording'); };
        rec.start();
    } catch (err) {
        console.warn('Reconocimiento de voz no disponible:', err);
    }
}

// UI de grabación estilo WhatsApp (simple barra/estado)
let recordingOverlayEl = null;
let mediaRecorder = null;
let recordedChunks = [];
let recProgressTimer = null;
let recSeconds = 0;
function startVoiceInputUI() {
    // Crear overlay visual si no existe
    if (!recordingOverlayEl) {
        recordingOverlayEl = document.createElement('div');
        recordingOverlayEl.className = 'recording-overlay';
        recordingOverlayEl.innerHTML = `
            <div class="recording-bar">
                <div class="recording-pulse"></div>
                <div class="recording-text">Grabando… Mantén presionado para hablar</div>
                <div class="recording-timer" id="recordingTimer">0:00</div>
            </div>
        `;
        document.body.appendChild(recordingOverlayEl);
    }
    recordingOverlayEl.classList.add('show');

    // Iniciar grabación con MediaRecorder (push-to-talk)
    startRecording();

    // Timer simple
    const timerEl = document.getElementById('recordingTimer');
    recSeconds = 0;
    recordingOverlayEl.dataset.timer = setInterval(() => {
        recSeconds += 1;
        const m = Math.floor(recSeconds / 60);
        const s = (recSeconds % 60).toString().padStart(2, '0');
        if (timerEl) timerEl.textContent = `${m}:${s}`;
    }, 1000);

    // Progreso visual en el anillo del botón
    const container = document.getElementById('inputContainer');
    const setProgress = () => {
        const max = 60; // 60s máx por defecto
        const progress = Math.min(recSeconds / max, 1);
        container?.style.setProperty('--rec-progress', `${progress * 100}%`);
        container?.style.setProperty('--rec-visible', `1`);
    };
    recProgressTimer = setInterval(setProgress, 200);
}

function stopVoiceInputUI() {
    if (!recordingOverlayEl) return;
    recordingOverlayEl.classList.remove('show');
    const t = recordingOverlayEl.dataset.timer;
    if (t) { clearInterval(t); delete recordingOverlayEl.dataset.timer; }
    if (recProgressTimer) { clearInterval(recProgressTimer); recProgressTimer = null; }
    const container = document.getElementById('inputContainer');
    container?.style.removeProperty('--rec-visible');
    container?.style.removeProperty('--rec-progress');
}

// Iniciar grabación con MediaRecorder
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recordedChunks = [];
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
        mediaRecorder.onstop = async () => {
            try {
                const blob = new Blob(recordedChunks, { type: 'audio/webm' });
                await uploadAudio(blob);
            } finally {
                stopVoiceInputUI();
                document.getElementById('inputContainer')?.classList.remove('recording');
                stream.getTracks().forEach(t => t.stop());
            }
        };
        mediaRecorder.start();
        // Auto-stop a los 60s
        setTimeout(() => { if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop(); }, 60000);
    } catch (err) {
        console.warn('No se pudo iniciar grabación:', err);
        stopVoiceInputUI();
        document.getElementById('inputContainer')?.classList.remove('recording');
    }
}

// Subir audio al backend
async function uploadAudio(blob) {
    try {
        const form = new FormData();
        form.append('audio', blob, 'voz.webm');
        const res = await fetch('/api/audio/upload', {
            method: 'POST',
            headers: { 'X-API-Key': getApiKey() },
            body: form
        });
        if (!res.ok) throw new Error('Fallo subiendo audio');
        const data = await res.json();
        // Puedes mostrar un mensaje en el chat con el enlace del audio o procesarlo
        addUserMessage('🎙️ Audio enviado');
    } catch (e) {
        console.warn('Error subiendo audio:', e);
    }
}

// Utilidades de mensajería con escritura simulada
function sanitizeBotText(text) {
    return String(text || '').replace(/\*\*/g, '');
}

function setHeaderTyping(isTyping) {
    try {
        const statusEl = document.querySelector('.chat-info p');
        if (statusEl) statusEl.textContent = isTyping ? 'Escribiendo...' : 'En línea';
    } catch (_) {}
}

function computeTypingDelay(text) {
    const length = (text || '').length;
    if (length <= 60) return 3000;         // Corto: 3s
    if (length <= 220) return 4500;       // Mediano: 4.5s
    return 7000;                           // Largo: 7s
}

async function sendBotMessage(text, keyboard = null, needsUserInput = false, playAudio = false) {
    const clean = sanitizeBotText(text);
    // Generar token de escritura y respetarlo para poder cancelar
    const myToken = ++chatState.typingToken;
    showTypingIndicator();
    setHeaderTyping(true);
    const delay = computeTypingDelay(clean);
    await new Promise(r => setTimeout(r, delay));
    // Si otro evento (p.ej., clic en enviar) canceló esta escritura, abortar
    if (myToken !== chatState.typingToken) {
        hideTypingIndicator();
        setHeaderTyping(false);
        return;
    }
    hideTypingIndicator();
    setHeaderTyping(false);
    // Si el último mensaje es del bot y estamos mostrando opciones, edítalo
    if (keyboard && chatMessages.querySelectorAll('.message.bot-message:not(.typing-indicator)').length > 0) {
        replaceLastBotMessage(clean, keyboard);
    } else {
        addBotMessage(clean, keyboard, needsUserInput, playAudio);
    }
}

// Agregar mensaje del bot
function addBotMessage(text, keyboard = null, needsUserInput = false, playAudio = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';

    const avatarHTML = getBotAvatarHTML();
    let messageContent = `
        ${avatarHTML}
        <div class="message-bubble">
            ${String(text).replace(/\*\*/g, '')}
            ${keyboard ? keyboard : ''}
        </div>
    `;

    messageDiv.innerHTML = messageContent;
    chatMessages.appendChild(messageDiv);
    
    // Reproducir audio solo si está habilitado y se solicita específicamente
    if (playAudio && chatState.audioEnabled) {
        playBotResponseAudio(text);
    }
    
    scrollToBottom();
    
    // Agregar al historial
    chatState.conversationHistory.push({
        type: 'bot',
        content: text,
        timestamp: new Date()
    });

    // Evitar mostrar automáticamente el menú principal aquí.
    // El menú se mostrará explícitamente al final del flujo de bienvenida
    // o después de capturar el nombre del usuario.
}

// Reemplazar el último mensaje del bot para no saturar el chat
function replaceLastBotMessage(text, keyboard = null) {
    // Mantener glosario abierto si está visible
    const hasGlossary = document.getElementById('glossaryOverlay')?.classList.contains('open');
    const botMessages = Array.from(chatMessages.querySelectorAll('.message.bot-message'))
        .filter(el => !el.classList.contains('typing-indicator'));
    const last = botMessages[botMessages.length - 1];
    if (!last) {
        addBotMessage(text, keyboard, false, false);
        return;
    }
    const avatarHTML = getBotAvatarHTML();
    last.innerHTML = `
        ${avatarHTML}
        <div class="message-bubble">
            ${String(text).replace(/\*\*/g, '')}
            ${keyboard ? keyboard : ''}
        </div>
    `;
    scrollToBottom();
    // Actualizar último registro en historial
    for (let i = chatState.conversationHistory.length - 1; i >= 0; i--) {
        if (chatState.conversationHistory[i].type === 'bot') {
            chatState.conversationHistory[i].content = text;
            break;
        }
    }
}

// Agregar mensaje del usuario
function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    const avatarHTML = getUserAvatarHTML();
    messageDiv.innerHTML = `
        <div class="message-bubble">${text}</div>
        ${avatarHTML}
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
    
    // Agregar al historial
    chatState.conversationHistory.push({
        type: 'user',
        content: text,
        timestamp: new Date()
    });
}

// Reproducir audio para respuestas del bot (solo cuando se solicita específicamente)
function playBotResponseAudio(text) {
    if (!chatState.audioEnabled) return;

    if ('speechSynthesis' in window) {
        try {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-ES';
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 0.5;
            
            const voices = speechSynthesis.getVoices();
            const spanishVoice = voices.find(voice => voice.lang.includes('es'));
            if (spanishVoice) {
                utterance.voice = spanishVoice;
            }
            
            speechSynthesis.speak(utterance);
        } catch (error) {
            console.warn('Error reproduciendo audio de respuesta:', error);
        }
    }
}

// Mostrar menú principal
function showMainMenu() {
    const keyboard = `
        <div class="inline-keyboard">
            <div class="keyboard-row">
                <button class="keyboard-button" onclick="Chatbot.showSessionsForTopic('fundamentos')">📚 Temas del Curso</button>
            </div>
            <div class="keyboard-row">
                <button class="keyboard-button" onclick="Chatbot.showExercises()">🧠 Ejercicios Prácticos</button>
            </div>
            <div class="keyboard-row">
                <button class="keyboard-button" onclick="Chatbot.showHelp()">❓ Ayuda</button>
            </div>
            <div class="keyboard-row">
                <button class="keyboard-button" onclick="Chatbot.showGlossary()">📖 Glosario</button>
            </div>
        </div>
    `;
    
    // Evitar duplicados: comprobar último mensaje si ya es un menú
    const last = chatState.conversationHistory[chatState.conversationHistory.length - 1];
    const header = '¡Perfecto! 🎯\n\nAquí tienes el menú principal. Puedes navegar por las diferentes secciones:';
    const name = chatState.userName ? `, ${chatState.userName}` : '';
    const text = `¡Perfecto${name}! 🎯\n\nAquí tienes el menú principal. Puedes navegar por las diferentes secciones:`;
    if (!last || typeof last.content !== 'string' || !last.content.includes('Aquí tienes el menú principal')) {
        addBotMessage(text, keyboard, false, false);
    }
    chatState.currentState = 'main_menu';
}

// Mostrar instrucciones de bienvenida divididas
async function showWelcomeInstructions() {
    await sendBotMessage("📝 INSTRUCCIONES DE ESCRITURA\n\nPuedes escribir cualquier pregunta y presionar Enter o hacer clic en el botón enviar.");
    await sendBotMessage("❓ TIPOS DE PREGUNTAS\n\nPuedes preguntarme sobre:\n• Temas del curso (IA, machine learning, deep learning)\n• Explicaciones de conceptos\n• Ejercicios prácticos\n• Dudas específicas sobre el contenido");
    await sendBotMessage("⌨️ COMANDOS ESPECIALES\n\n• 'ayuda' - Para ver estas instrucciones nuevamente\n• 'temas' - Para ver los temas disponibles\n• 'ejercicios' - Para solicitar ejercicios prácticos");
    await sendBotMessage("📊 HISTORIAL DE CONVERSACIONES\n\nTodas las conversaciones se guardan automáticamente para tu seguimiento.");
    // Mostrar el menú principal al final de toda la información
    showMainMenu();
}

// Mostrar temas
function showTopics() {
    // Saltar directamente al selector de sesiones del tema por defecto
    showSessionsForTopic('fundamentos');
}

// Mostrar tema específico
function showTopic(topic) {
    showSessionsForTopic(topic);
}

// Mostrar selector de sesiones 1..4 para un tema
function showSessionsForTopic(topic) {
    const topicTitles = {
        'fundamentos': '🤖 Fundamentos de IA',
        'ml': '📊 Machine Learning',
        'deep': '🧠 Deep Learning',
        'aplicaciones': '🎯 Aplicaciones Prácticas'
    };

    const keyboard = `
        <div class="inline-keyboard">
            <div class="keyboard-row">
                <button class="keyboard-button" onclick="Chatbot.openTopicSession('${topic}', 1)">📘 Sesión 1</button>
                <button class="keyboard-button" onclick="Chatbot.openTopicSession('${topic}', 2)">📗 Sesión 2</button>
            </div>
            <div class="keyboard-row">
                <button class="keyboard-button" onclick="Chatbot.openTopicSession('${topic}', 3)">📙 Sesión 3</button>
                <button class="keyboard-button" onclick="Chatbot.openTopicSession('${topic}', 4)">📕 Sesión 4</button>
            </div>
            ${getBackButton()}
        </div>
    `;

    replaceLastBotMessage(`${topicTitles[topic] || '📚 Tema'}\n\nSelecciona la sesión a la que quieres ir:`, keyboard);
}

// Acción al seleccionar una sesión
function openTopicSession(topic, session) {
    const titles = {
        'fundamentos': '🤖 Fundamentos de IA',
        'ml': '📊 Machine Learning',
        'deep': '🧠 Deep Learning',
        'aplicaciones': '🎯 Aplicaciones Prácticas'
    };
    const title = titles[topic] || '📚 Tema';

    const keyboard = `
        <div class="inline-keyboard">
            <div class="keyboard-row">
                <button class="keyboard-button" onclick="Chatbot.showSessionsForTopic('${topic}')">⬅️ Volver a Sesiones</button>
            </div>
            ${getBackButton()}
        </div>
    `;

    replaceLastBotMessage(`${title} — Sesión ${session}\n\nCargando contenido…`, keyboard);
}

// Mostrar ejercicios
function showExercises() {
    const keyboard = `
        <div class="inline-keyboard">
            <div class="keyboard-row">
                <button class="keyboard-button" onclick="showExerciseLevel('basicos')">🔰 Ejercicios Básicos</button>
            </div>
            <div class="keyboard-row">
                <button class="keyboard-button" onclick="showExerciseLevel('intermedios')">⚡ Ejercicios Intermedios</button>
            </div>
            <div class="keyboard-row">
                <button class="keyboard-button" onclick="showExerciseLevel('proyectos')">🚀 Proyectos Prácticos</button>
            </div>
            <div class="keyboard-row">
                <button class="keyboard-button" onclick="showExerciseLevel('desafios')">🏆 Desafíos Avanzados</button>
            </div>
            ${getBackButton()}
        </div>
    `;
    
    sendBotMessage("🧠 EJERCICIOS DISPONIBLES\n\nSelecciona el nivel de dificultad:", keyboard, false, false);
}

// Mostrar nivel de ejercicios
function showExerciseLevel(level) {
    const exercises = {
        'basicos': {
            title: '🔰 Ejercicios Básicos',
            content: '• Implementar un algoritmo de clasificación simple\n• Crear un modelo de regresión lineal\n• Análisis exploratorio de datos\n• Visualización de datos básica'
        },
        'intermedios': {
            title: '⚡ Ejercicios Intermedios',
            content: '• Construir una red neuronal básica\n• Implementar un sistema de recomendación\n• Procesamiento de texto con NLP\n• Optimización de hiperparámetros'
        },
        'proyectos': {
            title: '🚀 Proyectos Prácticos',
            content: '• Clasificador de imágenes\n• Sistema de análisis de sentimientos\n• Chatbot simple\n• Sistema de recomendación completo'
        },
        'desafios': {
            title: '🏆 Desafíos Avanzados',
            content: '• Optimización de hiperparámetros\n• Implementación de algoritmos complejos\n• Análisis de datos en tiempo real\n• Modelos de ensemble'
        }
    };
    
    const selectedExercise = exercises[level];
    sendBotMessage(`${selectedExercise.title}\n\n${selectedExercise.content}`, getBackButton(), false, false);
}

// Mostrar ayuda
function showHelp() {
    sendBotMessage("❓ AYUDA Y SOPORTE\n\nAquí tienes las instrucciones de uso completas:", null, false, false);
    
    setTimeout(() => {
        sendBotMessage("📝 ESCRIBIR MENSAJES\n\nEscribe cualquier pregunta y presiona Enter o haz clic en enviar.", null, false, false);
    }, 1500);
    
    setTimeout(() => {
        sendBotMessage("🎯 TIPOS DE PREGUNTAS\n\nPuedes preguntarme sobre:\n• Temas del curso (IA, machine learning, deep learning)\n• Explicaciones de conceptos\n• Ejercicios prácticos\n• Dudas específicas sobre el contenido", null, false, false);
    }, 3000);
    
    setTimeout(() => {
        sendBotMessage("⌨️ COMANDOS ESPECIALES\n\n• 'ayuda' - Para ver estas instrucciones\n• 'temas' - Para ver los temas disponibles\n• 'ejercicios' - Para solicitar ejercicios prácticos", null, false, false);
    }, 4500);
    
    setTimeout(() => {
        sendBotMessage("🎧 AUDIO\n\nEl chatbot reproduce audio automáticamente solo en el mensaje de bienvenida.", null, false, false);
    }, 6000);
    
    setTimeout(() => {
        sendBotMessage("📊 HISTORIAL\n\nTodas las conversaciones se guardan automáticamente.", getBackButton(), false, false);
    }, 7500);
}

// Mostrar glosario
// Mostrar glosario como panel lateral (no dentro del chat)
function showGlossary() {
    // Crear overlay si no existe
    let overlay = document.getElementById('glossaryOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'glossaryOverlay';
        overlay.className = 'glossary-overlay';
        overlay.innerHTML = `
            <div class="glossary-panel">
                <div class="glossary-header">
                    <h3>📖 Glosario de Términos de IA</h3>
                    <button class="glossary-close" aria-label="Cerrar">×</button>
                </div>
                <p class="glossary-subtitle" id="glossarySubtitle">Selecciona una letra para ver los términos disponibles:</p>
                <div class="glossary-back" id="glossaryBack" style="display:none">
                    <button class="back-btn" aria-label="Volver al glosario">⬅️ Volver al glosario</button>
                </div>
                <div class="alphabet-grid" id="alphabetGrid"></div>
                <div class="glossary-results" id="glossaryResults">
                    <div class="glossary-empty">Selecciona una letra</div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Eventos
        overlay.querySelector('.glossary-close').addEventListener('click', hideGlossary);
        overlay.querySelector('#glossaryBack').addEventListener('click', glossaryBackToMenu);

        // Construir alfabeto
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const grid = overlay.querySelector('#alphabetGrid');
        alphabet.forEach((letter) => {
            const btn = document.createElement('button');
            btn.className = 'alpha-btn';
            btn.textContent = letter;
            btn.addEventListener('click', () => renderGlossaryLetter(letter));
            grid.appendChild(btn);
        });
    }

    // Animación: mover chat a la izquierda y mostrar panel (ligero escalonado)
    const container = document.querySelector('.telegram-container');
    if (container) container.classList.add('shift-left');
    setTimeout(() => overlay.classList.add('open'), 120);
}

function hideGlossary() {
    const overlay = document.getElementById('glossaryOverlay');
    const container = document.querySelector('.telegram-container');
    if (overlay) overlay.classList.remove('open');
    // Retirar el desplazamiento del chat tras un pequeño retraso para que la salida sea más natural
    setTimeout(() => {
        if (container) container.classList.remove('shift-left');
    }, 150);
}

// Diccionario simple de términos
const GLOSSARY = {
    A: [ { term: 'Algoritmo', def: 'Conjunto de reglas o instrucciones para resolver un problema.' } ],
    B: [ { term: 'Big Data', def: 'Conjuntos de datos muy grandes y complejos.' } ],
    C: [ { term: 'CNN', def: 'Red neuronal convolucional.' } ],
    D: [ { term: 'Deep Learning', def: 'Aprendizaje profundo con redes neuronales.' } ],
    M: [ { term: 'Machine Learning', def: 'Aprendizaje automático de máquinas.' } ],
    N: [ { term: 'NLP', def: 'Procesamiento de lenguaje natural.' } ]
};

function renderGlossaryLetter(letter) {
    const overlay = document.getElementById('glossaryOverlay');
    if (!overlay) return;
    const results = overlay.querySelector('#glossaryResults');
    const grid = overlay.querySelector('#alphabetGrid');
    const back = overlay.querySelector('#glossaryBack');
    const subtitle = overlay.querySelector('#glossarySubtitle');
    if (grid) grid.style.display = 'none';
    if (back) back.style.display = 'block';
    if (subtitle) subtitle.textContent = `Términos disponibles — Letra ${letter}`;
    const entries = GLOSSARY[letter] || [];
    if (entries.length === 0) {
        results.innerHTML = `<h4 class=\"glossary-letter\">Letra ${letter}</h4><div class=\"glossary-empty\">No hay términos para la letra ${letter}</div>`;
        return;
    }
    const items = entries
        .map(e => `<div class="glossary-item"><div class="term">${e.term}</div><div class="def">${e.def}</div></div>`)
        .join('');
    results.innerHTML = `<h4 class=\"glossary-letter\">Letra ${letter}</h4>${items}`;
}

function glossaryBackToMenu() {
    const overlay = document.getElementById('glossaryOverlay');
    if (!overlay) return;
    const grid = overlay.querySelector('#alphabetGrid');
    const back = overlay.querySelector('#glossaryBack');
    const results = overlay.querySelector('#glossaryResults');
    const subtitle = overlay.querySelector('#glossarySubtitle');
    if (grid) grid.style.display = 'grid';
    if (back) back.style.display = 'none';
    if (subtitle) subtitle.textContent = 'Selecciona una letra para ver los términos disponibles:';
    if (results) results.innerHTML = '<div class="glossary-empty">Selecciona una letra</div>';
}

// Función para hacer llamadas a OpenAI de forma segura
async function callOpenAI(prompt, context = '') {
    try {
        const response = await fetch('/api/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': getApiKey(),
                ...getUserAuthHeaders(),
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin',
            body: JSON.stringify({ prompt, context })
        });

        if (!response.ok) {
            throw new Error(`Error en la API: ${response.status}`);
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Error llamando a OpenAI:', error);
        return null;
    }
}

// Función para consultar la base de datos de forma segura
async function queryDatabase(query, params = []) {
    try {
        const response = await fetch('/api/database', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': getApiKey(),
                ...getUserAuthHeaders(),
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin',
            body: JSON.stringify({ query, params })
        });

        if (!response.ok) {
            throw new Error(`Error en la API: ${response.status}`);
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error consultando base de datos:', error);
        return [];
    }
}

// Función para obtener contexto de la base de datos de forma segura
async function getDatabaseContext(userQuestion) {
    try {
        const response = await fetch('/api/context', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': getApiKey(),
                ...getUserAuthHeaders(),
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin',
            body: JSON.stringify({ userQuestion })
        });

        if (!response.ok) {
            throw new Error(`Error en la API: ${response.status}`);
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error obteniendo contexto de BD:', error);
        return [];
    }
}

// Función para obtener la API key de forma segura
function getApiKey() {
    // En producción, esto debería venir de una sesión segura o token JWT
    // Por ahora, usamos una clave generada dinámicamente basada en la sesión
    const sessionKey = sessionStorage.getItem('apiKey') || generateSessionKey();
    sessionStorage.setItem('apiKey', sessionKey);
    return sessionKey;
}

// Función para generar una clave de sesión temporal
function generateSessionKey() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return btoa(`${timestamp}-${random}`).replace(/[^a-zA-Z0-9]/g, '');
}

// Encabezados de autenticación de usuario
function getUserAuthHeaders() {
    try {
        const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
        const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
        if (token && userId) {
            return { 'Authorization': `Bearer ${token}`, 'X-User-Id': userId };
        }
    } catch (_) {}
    return {};
}

// Procesar mensaje del usuario con IA
async function processUserMessageWithAI(message) {
    try {
        // Obtener contexto de la base de datos
        const dbContext = await getDatabaseContext(message);
        
        // Construir el prompt con contexto
        const contextInfo = dbContext.length > 0 ? 
            `\n\nInformación adicional de la base de datos:\n${JSON.stringify(dbContext, null, 2)}` : '';
        
        const fullPrompt = `Usuario: ${message}${contextInfo}\n\nResponde de manera educativa y útil en español.`;
        
        // Llamar a OpenAI
        const aiResponse = await callOpenAI(fullPrompt, contextInfo);
        
        if (aiResponse) {
            return aiResponse;
        } else {
            // Fallback a respuestas predefinidas
            return generateResponse(message.toLowerCase());
        }
    } catch (error) {
        console.error('Error procesando mensaje con IA:', error);
        return generateResponse(message.toLowerCase());
    }
}

// Enviar mensaje
function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || chatState.isTyping) return;

    addUserMessage(message);
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // Mostrar indicador de escritura
    showTypingIndicator();

    setTimeout(async () => {
        hideTypingIndicator();
        await handleUserMessage(message);
    }, 300);
}

// Procesar mensaje del usuario
async function handleUserMessage(message) {
    if (!chatState.userName && chatState.currentState === 'start') {
        // Primer mensaje es el nombre del usuario
        if (message.split(' ').length >= 2) {
            chatState.userName = message;
            await sendBotMessage(`¡Excelente, ${chatState.userName}! 👏\n\nTu identidad ha sido registrada correctamente.`, null, false, false);
            
            setTimeout(() => {
                showMainMenu();
            }, 1500);
        } else {
            await sendBotMessage("⚠️ Por favor proporciona tu nombre y apellido completos.", null, true, false);
        }
    } else {
        // Procesar otros mensajes con IA
        const response = await processUserMessageWithAI(message);
        await sendBotMessage(response, null, false, false);
    }
}

// Generar respuesta
function generateResponse(message) {
    const responses = {
        'hola': '¡Hola! Me alegra verte. ¿Cómo estás hoy?',
        'buenos días': '¡Buenos días! Espero que tengas un excelente día. ¿En qué puedo ayudarte?',
        'buenas tardes': '¡Buenas tardes! ¿Cómo va tu día?',
        'buenas noches': '¡Buenas noches! ¿Listo para aprender algo nuevo?',
        'ayuda': 'Usa los botones del menú principal para navegar o escribe "ayuda" para ver las instrucciones completas.',
        'temas': 'Usa el botón "📚 Temas del Curso" en el menú principal para explorar todos los temas disponibles.',
        'ejercicios': 'Usa el botón "🧠 Ejercicios Prácticos" en el menú principal para ver todos los ejercicios disponibles.',
        'adiós': '¡Hasta luego! Ha sido un placer ayudarte. ¡Que tengas un excelente día!',
        'gracias': '¡De nada! Me alegra haber podido ayudarte. ¿Hay algo más en lo que pueda asistirte?',
        'chao': '¡Chao! Espero verte pronto. ¡Sigue aprendiendo!'
    };

    for (const [key, response] of Object.entries(responses)) {
        if (message.includes(key)) {
            return response;
        }
    }

    const defaultResponses = [
        'Interesante pregunta. Déjame pensar en la mejor manera de explicártelo...',
        'Esa es una excelente pregunta. Te ayudo a entenderlo mejor.',
        'Me gusta tu curiosidad. Vamos a explorar ese tema juntos.',
        'Excelente pregunta. Te explico de manera clara y sencilla.',
        '¡Buena pregunta! Te ayudo a comprender este concepto.'
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// Funciones de utilidad para botones
function getBackButton() {
    return `
        <div class="keyboard-row">
            <button class="keyboard-button" onclick="showMainMenu()">⬅️ Menú Principal</button>
        </div>
    `;
}

// Scroll al final del chat
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Controlar audio
function toggleAudio() {
    chatState.audioEnabled = !chatState.audioEnabled;
    // Si se desactiva durante una reproducción, detenerla inmediatamente
    try {
        if (!chatState.audioEnabled) {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            if (chatState.currentAudio && typeof chatState.currentAudio.pause === 'function') {
                chatState.currentAudio.pause();
                chatState.currentAudio.currentTime = 0;
            }
        }
    } catch(_) {}
    console.log('Audio ' + (chatState.audioEnabled ? 'activado' : 'desactivado'));
    return chatState.audioEnabled;
}

// Obtener estado del audio
function getAudioStatus() {
    return chatState.audioEnabled;
}

// Configurar volumen
function setAudioVolume(volume) {
    if (volume >= 0 && volume <= 1) {
        CHATBOT_CONFIG.welcomeAudio.volume = volume;
        console.log('Volumen configurado a:', volume);
    }
}

// Mostrar indicador de escritura
function showTypingIndicator() {
    if (chatState.isTyping) return;
    
    chatState.isTyping = true;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-indicator';
    typingDiv.id = 'typingIndicator';
    
    typingDiv.innerHTML = `
        <div class="typing-avatar">
            <div class="avatar-circle"><span class="avatar-emoji">🤖</span></div>
            <div class="typing-dots">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
}

// Ocultar indicador de escritura
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
    chatState.isTyping = false;
}

// Exportar funciones para uso externo
window.Chatbot = {
    sendMessage,
    addBotMessage,
    addUserMessage,
    getConversationHistory: () => chatState.conversationHistory,
    toggleAudio,
    getAudioStatus,
    setAudioVolume,
    playWelcomeAudio,
    // Exponer funciones usadas por botones inline
    showTopics,
    showTopic,
    showSessionsForTopic,
    openTopicSession,
    showExercises,
    showHelp,
    showGlossary
}; 