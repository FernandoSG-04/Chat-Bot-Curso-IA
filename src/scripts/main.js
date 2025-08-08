// Configuración del chatbot
const CHATBOT_CONFIG = {
    name: 'Asistente Educativo',
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
    dbConnection: null
};

// Elementos del DOM
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

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
    initializeDatabase();
    playChatOpenAnimation().then(() => {
        initializeChat();
    });
    setupEventListeners();
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
        utterance.volume = CHATBOT_CONFIG.welcomeAudio.volume;
        
        const voices = speechSynthesis.getVoices();
        const spanishVoice = voices.find(voice => voice.lang.includes('es'));
        if (spanishVoice) {
            utterance.voice = spanishVoice;
        }
        
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
        audio.volume = CHATBOT_CONFIG.welcomeAudio.volume;
        
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

    sendButton.addEventListener('click', sendMessage);

    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });
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
    showTypingIndicator();
    setHeaderTyping(true);
    const delay = computeTypingDelay(clean);
    await new Promise(r => setTimeout(r, delay));
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
                <button class="keyboard-button" onclick="showTopics()">📚 Temas del Curso</button>
            </div>
            <div class="keyboard-row">
                <button class="keyboard-button" onclick="showExercises()">🧠 Ejercicios Prácticos</button>
            </div>
            <div class="keyboard-row">
                <button class="keyboard-button" onclick="showHelp()">❓ Ayuda</button>
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
    const keyboard = `
        <div class="inline-keyboard">
            <div class="keyboard-row">
                <button class="keyboard-button" onclick="showTopic('fundamentos')">🤖 Fundamentos de IA</button>
            </div>
            <div class="keyboard-row">
                <button class="keyboard-button" onclick="showTopic('ml')">📊 Machine Learning</button>
            </div>
            <div class="keyboard-row">
                <button class="keyboard-button" onclick="showTopic('deep')">🧠 Deep Learning</button>
            </div>
            <div class="keyboard-row">
                <button class="keyboard-button" onclick="showTopic('aplicaciones')">🎯 Aplicaciones Prácticas</button>
            </div>
            ${getBackButton()}
        </div>
    `;
    
    // Edita el último mensaje para evitar saturación
    replaceLastBotMessage("📚 TEMAS DISPONIBLES\n\nSelecciona el tema que te interesa:", keyboard);
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
                <button class="keyboard-button" onclick="openTopicSession('${topic}', 1)">📘 Sesión 1</button>
                <button class="keyboard-button" onclick="openTopicSession('${topic}', 2)">📗 Sesión 2</button>
            </div>
            <div class="keyboard-row">
                <button class="keyboard-button" onclick="openTopicSession('${topic}', 3)">📙 Sesión 3</button>
                <button class="keyboard-button" onclick="openTopicSession('${topic}', 4)">📕 Sesión 4</button>
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
                <button class="keyboard-button" onclick="showSessionsForTopic('${topic}')">⬅️ Volver a Sesiones</button>
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

// Función para hacer llamadas a OpenAI de forma segura
async function callOpenAI(prompt, context = '') {
    try {
        const response = await fetch('/api/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': getApiKey(),
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
    openTopicSession
}; 