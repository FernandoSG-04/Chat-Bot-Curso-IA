// Configuración del chatbot
const CHATBOT_CONFIG = {
    name: 'Asistente Educativo',
    welcomeMessage: `¡Hola! Soy tu asistente educativo. Te doy la bienvenida al curso de inteligencia artificial.

INSTRUCCIONES DE USO:

1. ESCRIBIR MENSAJES: Puedes escribir cualquier pregunta en el campo de texto y presionar Enter o hacer clic en el botón enviar.

2. TIPOS DE PREGUNTAS: Puedes preguntarme sobre:
   • Temas del curso (IA, machine learning, deep learning)
   • Explicaciones de conceptos
   • Ejercicios prácticos
   • Dudas específicas sobre el contenido

3. COMANDOS ESPECIALES:
   • "ayuda" - Para ver estas instrucciones nuevamente
   • "temas" - Para ver los temas disponibles
   • "ejercicios" - Para solicitar ejercicios prácticos

4. AUDIO: El chatbot reproduce audio automáticamente. Puedes activar o desactivar el audio usando la función toggleAudio().

5. HISTORIAL: Todas las conversaciones se guardan automáticamente.

¿En qué puedo ayudarte hoy? ¡Estoy aquí para hacer tu aprendizaje más fácil y divertido!`,
    typingSpeed: 50,
    responseDelay: 1000,
    audioEnabled: true,
    welcomeAudio: {
        src: 'assets/audio/welcome.mp3',
        volume: 0.7
    }
};

// Estado del chatbot
let chatState = {
    isTyping: false,
    conversationHistory: [],
    currentTopic: null,
    audioContext: null,
    audioEnabled: true
};

// Elementos del DOM
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeAudio();
    initializeChat();
    setupEventListeners();
});

// Inicializar sistema de audio
function initializeAudio() {
    try {
        // Crear contexto de audio
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            chatState.audioContext = new AudioContext();
        }
    } catch (error) {
        console.warn('Audio no soportado:', error);
        chatState.audioEnabled = false;
    }
}

// Reproducir audio de bienvenida
function playWelcomeAudio() {
    if (!chatState.audioEnabled || !CHATBOT_CONFIG.audioEnabled) return;

    // Intentar usar Web Speech API primero
    if ('speechSynthesis' in window) {
        playWelcomeSpeech();
    } else {
        // Fallback: intentar reproducir archivo de audio
        playWelcomeAudioFile();
    }
}

// Reproducir audio usando Web Speech API
function playWelcomeSpeech() {
    try {
        const utterance = new SpeechSynthesisUtterance(CHATBOT_CONFIG.welcomeMessage);
        utterance.lang = 'es-ES';
        utterance.rate = 0.85; // Velocidad más lenta para instrucciones
        utterance.pitch = 1.0;
        utterance.volume = CHATBOT_CONFIG.welcomeAudio.volume;
        
        // Configurar voz en español si está disponible
        const voices = speechSynthesis.getVoices();
        const spanishVoice = voices.find(voice => voice.lang.includes('es'));
        if (spanishVoice) {
            utterance.voice = spanishVoice;
        }
        
        // Agregar pausas para mejor comprensión
        utterance.onboundary = function(event) {
            if (event.name === 'sentence') {
                // Pequeña pausa al final de cada oración
                utterance.rate = 0.85;
            }
        };
        
        speechSynthesis.speak(utterance);
        console.log('Audio de bienvenida con instrucciones reproducido con Web Speech API');
    } catch (error) {
        console.warn('Error reproduciendo audio con Web Speech API:', error);
        // Fallback al archivo de audio
        playWelcomeAudioFile();
    }
}

// Reproducir archivo de audio de bienvenida
function playWelcomeAudioFile() {
    try {
        const audio = new Audio(CHATBOT_CONFIG.welcomeAudio.src);
        audio.volume = CHATBOT_CONFIG.welcomeAudio.volume;
        
        // Intentar reproducir el audio
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('Audio de bienvenida reproducido exitosamente');
                })
                .catch(error => {
                    console.warn('Error reproduciendo audio de bienvenida:', error);
                    // Si falla el audio, continuar sin él
                });
        }
    } catch (error) {
        console.warn('Error inicializando audio de bienvenida:', error);
    }
}

// Reproducir audio genérico
function playAudio(audioSrc, volume = 0.7) {
    if (!chatState.audioEnabled) return;

    try {
        const audio = new Audio(audioSrc);
        audio.volume = volume;
        
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('Audio reproducido exitosamente');
                })
                .catch(error => {
                    console.warn('Error reproduciendo audio:', error);
                });
        }
    } catch (error) {
        console.warn('Error reproduciendo audio:', error);
    }
}

// Inicializar el chat
function initializeChat() {
    // Reproducir audio de bienvenida
    playWelcomeAudio();
    
    // Mostrar mensaje de bienvenida
    setTimeout(() => {
        addBotMessage(CHATBOT_CONFIG.welcomeMessage);
    }, 500);
}

// Configurar event listeners
function setupEventListeners() {
    // Enviar mensaje con Enter
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Enviar mensaje con botón
    sendButton.addEventListener('click', sendMessage);

    // Auto-resize del input
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });
}

// Enviar mensaje
function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || chatState.isTyping) return;

    // Agregar mensaje del usuario
    addUserMessage(message);
    
    // Limpiar input
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // Simular respuesta del bot
    setTimeout(() => {
        processUserMessage(message);
    }, CHATBOT_CONFIG.responseDelay);
}

// Procesar mensaje del usuario
function processUserMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    // Mostrar indicador de escritura
    showTypingIndicator();

    // Simular procesamiento
    setTimeout(() => {
        hideTypingIndicator();
        
        // Generar respuesta basada en el contenido del mensaje
        const response = generateResponse(lowerMessage);
        addBotMessage(response, true); // Habilitar audio para respuestas
    }, 1500 + Math.random() * 1000);
}

// Generar respuesta
function generateResponse(message) {
    const responses = {
        // Saludos
        'hola': '¡Hola! Me alegra verte. ¿Cómo estás hoy?',
        'buenos días': '¡Buenos días! Espero que tengas un excelente día. ¿En qué puedo ayudarte?',
        'buenas tardes': '¡Buenas tardes! ¿Cómo va tu día?',
        'buenas noches': '¡Buenas noches! ¿Listo para aprender algo nuevo?',
        
        // Comandos especiales (mencionados en las instrucciones)
        'ayuda': `¡Por supuesto! Aquí tienes las instrucciones de uso:

1. ESCRIBIR MENSAJES: Escribe cualquier pregunta y presiona Enter o haz clic en enviar.

2. TIPOS DE PREGUNTAS: Puedes preguntarme sobre:
   • Temas del curso (IA, machine learning, deep learning)
   • Explicaciones de conceptos
   • Ejercicios prácticos
   • Dudas específicas sobre el contenido

3. COMANDOS ESPECIALES:
   • "ayuda" - Para ver estas instrucciones
   • "temas" - Para ver los temas disponibles
   • "ejercicios" - Para solicitar ejercicios prácticos

4. AUDIO: El chatbot reproduce audio automáticamente.

5. HISTORIAL: Todas las conversaciones se guardan automáticamente.

¿En qué puedo ayudarte específicamente?`,
        
        'temas': `¡Excelente! Aquí tienes los temas principales del curso:

📚 TEMAS DISPONIBLES:

1. FUNDAMENTOS DE IA:
   • ¿Qué es la inteligencia artificial?
   • Historia y evolución de la IA
   • Tipos de inteligencia artificial

2. MACHINE LEARNING:
   • Conceptos básicos de ML
   • Algoritmos de aprendizaje supervisado
   • Algoritmos de aprendizaje no supervisado

3. DEEP LEARNING:
   • Redes neuronales artificiales
   • Redes neuronales convolucionales (CNN)
   • Redes neuronales recurrentes (RNN)

4. APLICACIONES PRÁCTICAS:
   • Procesamiento de lenguaje natural
   • Visión por computadora
   • Sistemas de recomendación

¿Cuál de estos temas te interesa más? ¡Puedo explicarte cualquier concepto en detalle!`,
        
        'ejercicios': `¡Perfecto! Te ayudo con ejercicios prácticos. Aquí tienes algunas opciones:

🧠 EJERCICIOS DISPONIBLES:

1. EJERCICIOS BÁSICOS:
   • Implementar un algoritmo de clasificación simple
   • Crear un modelo de regresión lineal
   • Análisis exploratorio de datos

2. EJERCICIOS INTERMEDIOS:
   • Construir una red neuronal básica
   • Implementar un sistema de recomendación
   • Procesamiento de texto con NLP

3. PROYECTOS PRÁCTICOS:
   • Clasificador de imágenes
   • Sistema de análisis de sentimientos
   • Chatbot simple

4. DESAFÍOS AVANZADOS:
   • Optimización de hiperparámetros
   • Implementación de algoritmos complejos
   • Análisis de datos en tiempo real

¿Qué tipo de ejercicio te gustaría realizar? Puedo guiarte paso a paso.`,
        
        // Preguntas sobre el curso
        'curso': 'El curso está diseñado para ser interactivo y personalizado. ¿Hay algún tema específico que te interese?',
        'contenido': 'El contenido se adapta a tu nivel y progreso. ¿Te gustaría que revisemos algún tema en particular?',
        
        // Preguntas sobre IA
        'inteligencia artificial': 'La inteligencia artificial es un campo fascinante que combina computación, matemáticas y lógica. ¿Qué aspecto te interesa más?',
        'ia': 'La IA está transformando nuestro mundo. ¿Te gustaría aprender sobre sus aplicaciones prácticas?',
        'machine learning': 'Machine Learning es una rama de la IA que permite a las computadoras aprender sin ser programadas explícitamente. ¿Quieres que profundicemos en esto?',
        
        // Ayuda general
        'ayúdame': 'Por supuesto, estoy aquí para ayudarte. ¿Qué necesitas? Puedes preguntarme sobre cualquier tema del curso o usar comandos como "ayuda", "temas" o "ejercicios".',
        
        // Despedidas
        'adiós': '¡Hasta luego! Ha sido un placer ayudarte. ¡Que tengas un excelente día!',
        'gracias': '¡De nada! Me alegra haber podido ayudarte. ¿Hay algo más en lo que pueda asistirte?',
        'chao': '¡Chao! Espero verte pronto. ¡Sigue aprendiendo!'
    };

    // Buscar respuesta exacta
    for (const [key, response] of Object.entries(responses)) {
        if (message.includes(key)) {
            return response;
        }
    }

    // Respuestas por defecto
    const defaultResponses = [
        'Interesante pregunta. Déjame pensar en la mejor manera de explicártelo...',
        'Esa es una excelente pregunta. Te ayudo a entenderlo mejor.',
        'Me gusta tu curiosidad. Vamos a explorar ese tema juntos.',
        'Excelente pregunta. Te explico de manera clara y sencilla.',
        '¡Buena pregunta! Te ayudo a comprender este concepto.',
        'Esa es una pregunta muy interesante. Déjame explicarte de manera sencilla...',
        '¡Excelente! Me gusta tu enfoque. Te ayudo a entender este tema.',
        'Buena pregunta. Te explico paso a paso para que lo entiendas perfectamente.'
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// Agregar mensaje del bot
function addBotMessage(text, playAudio = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = text;
    
    messageDiv.appendChild(bubble);
    chatMessages.appendChild(messageDiv);
    
    // Reproducir audio si está habilitado
    if (playAudio && chatState.audioEnabled) {
        playBotResponseAudio(text);
    }
    
    // Scroll al final
    scrollToBottom();
    
    // Agregar al historial
    chatState.conversationHistory.push({
        type: 'bot',
        content: text,
        timestamp: new Date()
    });
}

// Reproducir audio para respuestas del bot
function playBotResponseAudio(text) {
    if (!chatState.audioEnabled) return;

    // Usar Web Speech API para respuestas del bot
    if ('speechSynthesis' in window) {
        try {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-ES';
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 0.5; // Volumen más bajo para respuestas
            
            // Configurar voz en español si está disponible
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

// Agregar mensaje del usuario
function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = text;
    
    messageDiv.appendChild(bubble);
    chatMessages.appendChild(messageDiv);
    
    // Scroll al final
    scrollToBottom();
    
    // Agregar al historial
    chatState.conversationHistory.push({
        type: 'user',
        content: text,
        timestamp: new Date()
    });
}

// Mostrar indicador de escritura
function showTypingIndicator() {
    if (chatState.isTyping) return;
    
    chatState.isTyping = true;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-indicator';
    typingDiv.id = 'typingIndicator';
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'typing-dot';
        typingDiv.appendChild(dot);
    }
    
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

// Scroll al final del chat
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Utilidades
function formatTimestamp(date) {
    return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
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
    playAudio
}; 