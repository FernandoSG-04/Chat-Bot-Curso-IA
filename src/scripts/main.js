// Configuración del chatbot
const CHATBOT_CONFIG = {
    name: 'Asistente Educativo',
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
    audioEnabled: true,
    userName: '',
    currentState: 'start'
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
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            chatState.audioContext = new AudioContext();
        }
    } catch (error) {
        console.warn('Audio no soportado:', error);
        chatState.audioEnabled = false;
    }
}

// Inicializar el chat
function initializeChat() {
    // Mensaje de bienvenida inicial con audio
    addBotMessage("¡Hola! 👋 Bienvenido al Chatbot Educativo de Inteligencia Artificial.\n\nSoy tu asistente virtual y estaré aquí para acompañarte durante todo el curso de IA profesional.", null, false, true);
    
    // Mostrar instrucciones divididas después del mensaje de bienvenida
    setTimeout(() => {
        showWelcomeInstructions();
    }, 2000);
    
    // Pedir nombre después de mostrar todas las instrucciones
    setTimeout(() => {
        if (!chatState.userName) {
            addBotMessage("Para comenzar, por favor proporciona tu nombre y apellido:", null, true, false);
        }
    }, 15000); // 15 segundos después para dar tiempo a las instrucciones
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

// Agregar mensaje del bot
function addBotMessage(text, keyboard = null, needsUserInput = false, playAudio = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';

    let messageContent = `
        <div class="message-bubble">
            ${text}
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

    if (!needsUserInput && !keyboard) {
        setTimeout(() => {
            if (chatState.currentState === 'start' && !chatState.userName) {
                // No hacer nada, esperar input del usuario
            } else if (chatState.currentState === 'start') {
                showMainMenu();
            }
        }, 1000);
    }
}

// Agregar mensaje del usuario
function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.innerHTML = `<div class="message-bubble">${text}</div>`;
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
                <button class="keyboard-button" onclick="showWelcomeInstructions()">🎵 Bienvenida e Instrucciones</button>
            </div>
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
    
    addBotMessage(`¡Perfecto, ${chatState.userName}! 🎯\n\nAquí tienes el menú principal. Puedes navegar por las diferentes secciones:`, keyboard, false, false);
    chatState.currentState = 'main_menu';
}

// Mostrar instrucciones de bienvenida divididas
function showWelcomeInstructions() {
    // Mensaje 1: Saludo
    addBotMessage("🎵 **AUDIO DE BIENVENIDA**\n\n¡Hola! Soy tu asistente educativo. Te doy la bienvenida al curso de inteligencia artificial.", null, false, false);
    
    setTimeout(() => {
        // Mensaje 2: Instrucciones de escritura
        addBotMessage("📝 **INSTRUCCIONES DE ESCRITURA**\n\nPuedes escribir cualquier pregunta en el campo de texto y presionar Enter o hacer clic en el botón enviar.", null, false, false);
    }, 2000);
    
    setTimeout(() => {
        // Mensaje 3: Tipos de preguntas
        addBotMessage("❓ **TIPOS DE PREGUNTAS**\n\nPuedes preguntarme sobre:\n• Temas del curso (IA, machine learning, deep learning)\n• Explicaciones de conceptos\n• Ejercicios prácticos\n• Dudas específicas sobre el contenido", null, false, false);
    }, 4000);
    
    setTimeout(() => {
        // Mensaje 4: Comandos especiales
        addBotMessage("⌨️ **COMANDOS ESPECIALES**\n\n• \"ayuda\" - Para ver estas instrucciones nuevamente\n• \"temas\" - Para ver los temas disponibles\n• \"ejercicios\" - Para solicitar ejercicios prácticos", null, false, false);
    }, 6000);
    
    setTimeout(() => {
        // Mensaje 5: Información sobre audio
        addBotMessage("🎧 **INFORMACIÓN SOBRE AUDIO**\n\nEl chatbot reproduce audio automáticamente en el mensaje de bienvenida. Puedes activar o desactivar el audio usando la función toggleAudio().", null, false, false);
    }, 8000);
    
    setTimeout(() => {
        // Mensaje 6: Información sobre historial
        addBotMessage("📊 **HISTORIAL DE CONVERSACIONES**\n\nTodas las conversaciones se guardan automáticamente para tu seguimiento.", null, false, false);
    }, 10000);
    
    setTimeout(() => {
        // Mensaje 7: Invitación final
        addBotMessage("🚀 **¡LISTO PARA COMENZAR!**\n\n¿En qué puedo ayudarte hoy? ¡Estoy aquí para hacer tu aprendizaje más fácil y divertido!", getBackButton(), false, false);
    }, 12000);
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
    
    addBotMessage("📚 **TEMAS DISPONIBLES**\n\nSelecciona el tema que te interesa:", keyboard, false, false);
}

// Mostrar tema específico
function showTopic(topic) {
    const topics = {
        'fundamentos': {
            title: '🤖 Fundamentos de IA',
            content: '• ¿Qué es la inteligencia artificial?\n• Historia y evolución de la IA\n• Tipos de inteligencia artificial\n• Aplicaciones básicas de IA'
        },
        'ml': {
            title: '📊 Machine Learning',
            content: '• Conceptos básicos de ML\n• Algoritmos de aprendizaje supervisado\n• Algoritmos de aprendizaje no supervisado\n• Evaluación de modelos'
        },
        'deep': {
            title: '🧠 Deep Learning',
            content: '• Redes neuronales artificiales\n• Redes neuronales convolucionales (CNN)\n• Redes neuronales recurrentes (RNN)\n• Frameworks populares'
        },
        'aplicaciones': {
            title: '🎯 Aplicaciones Prácticas',
            content: '• Procesamiento de lenguaje natural\n• Visión por computadora\n• Sistemas de recomendación\n• Chatbots y asistentes virtuales'
        }
    };
    
    const selectedTopic = topics[topic];
    addBotMessage(`**${selectedTopic.title}**\n\n${selectedTopic.content}`, getBackButton(), false, false);
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
    
    addBotMessage("🧠 **EJERCICIOS DISPONIBLES**\n\nSelecciona el nivel de dificultad:", keyboard, false, false);
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
    addBotMessage(`**${selectedExercise.title}**\n\n${selectedExercise.content}`, getBackButton(), false, false);
}

// Mostrar ayuda
function showHelp() {
    addBotMessage("❓ **AYUDA Y SOPORTE**\n\nAquí tienes las instrucciones de uso completas:", null, false, false);
    
    setTimeout(() => {
        addBotMessage("📝 **ESCRIBIR MENSAJES**\n\nEscribe cualquier pregunta y presiona Enter o haz clic en enviar.", null, false, false);
    }, 1500);
    
    setTimeout(() => {
        addBotMessage("🎯 **TIPOS DE PREGUNTAS**\n\nPuedes preguntarme sobre:\n• Temas del curso (IA, machine learning, deep learning)\n• Explicaciones de conceptos\n• Ejercicios prácticos\n• Dudas específicas sobre el contenido", null, false, false);
    }, 3000);
    
    setTimeout(() => {
        addBotMessage("⌨️ **COMANDOS ESPECIALES**\n\n• \"ayuda\" - Para ver estas instrucciones\n• \"temas\" - Para ver los temas disponibles\n• \"ejercicios\" - Para solicitar ejercicios prácticos", null, false, false);
    }, 4500);
    
    setTimeout(() => {
        addBotMessage("🎧 **AUDIO**\n\nEl chatbot reproduce audio automáticamente solo en el mensaje de bienvenida.", null, false, false);
    }, 6000);
    
    setTimeout(() => {
        addBotMessage("📊 **HISTORIAL**\n\nTodas las conversaciones se guardan automáticamente.", getBackButton(), false, false);
    }, 7500);
}

// Enviar mensaje
function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || chatState.isTyping) return;

    addUserMessage(message);
    messageInput.value = '';
    messageInput.style.height = 'auto';

    setTimeout(() => {
        handleUserMessage(message);
    }, 500);
}

// Procesar mensaje del usuario
function handleUserMessage(message) {
    if (!chatState.userName && chatState.currentState === 'start') {
        // Primer mensaje es el nombre del usuario
        if (message.split(' ').length >= 2) {
            chatState.userName = message;
            addBotMessage(`¡Excelente, ${chatState.userName}! 👏\n\nTu identidad ha sido registrada correctamente.`, null, false, false);
            
            setTimeout(() => {
                showMainMenu();
            }, 1500);
        } else {
            addBotMessage("⚠️ Por favor proporciona tu nombre y apellido completos.", null, true, false);
        }
    } else {
        // Procesar otros mensajes
        const lowerMessage = message.toLowerCase();
        const response = generateResponse(lowerMessage);
        addBotMessage(response, null, false, false);
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

// Exportar funciones para uso externo
window.Chatbot = {
    sendMessage,
    addBotMessage,
    addUserMessage,
    getConversationHistory: () => chatState.conversationHistory,
    toggleAudio,
    getAudioStatus,
    setAudioVolume,
    playWelcomeAudio
}; 