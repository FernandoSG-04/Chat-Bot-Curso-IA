// Configuración del chatbot
const CHATBOT_CONFIG = {
    name: 'Asistente Educativo',
    welcomeMessage: '¡Hola! Soy tu asistente educativo. Estoy aquí para ayudarte con cualquier pregunta que tengas sobre el curso. ¿En qué puedo ayudarte hoy?',
    typingSpeed: 50,
    responseDelay: 1000
};

// Estado del chatbot
let chatState = {
    isTyping: false,
    conversationHistory: [],
    currentTopic: null
};

// Elementos del DOM
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeChat();
    setupEventListeners();
});

// Inicializar el chat
function initializeChat() {
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
        addBotMessage(response);
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
        
        // Preguntas sobre el curso
        'curso': 'El curso está diseñado para ser interactivo y personalizado. ¿Hay algún tema específico que te interese?',
        'temas': 'Los temas principales incluyen: fundamentos de IA, machine learning, deep learning, y aplicaciones prácticas. ¿Cuál te interesa más?',
        'contenido': 'El contenido se adapta a tu nivel y progreso. ¿Te gustaría que revisemos algún tema en particular?',
        
        // Preguntas sobre IA
        'inteligencia artificial': 'La inteligencia artificial es un campo fascinante que combina computación, matemáticas y lógica. ¿Qué aspecto te interesa más?',
        'ia': 'La IA está transformando nuestro mundo. ¿Te gustaría aprender sobre sus aplicaciones prácticas?',
        'machine learning': 'Machine Learning es una rama de la IA que permite a las computadoras aprender sin ser programadas explícitamente. ¿Quieres que profundicemos en esto?',
        
        // Ayuda
        'ayuda': 'Estoy aquí para ayudarte. Puedes preguntarme sobre cualquier tema del curso, pedir explicaciones, o solicitar ejercicios prácticos.',
        'ayúdame': 'Por supuesto, estoy aquí para ayudarte. ¿Qué necesitas?',
        
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
        '¡Buena pregunta! Te ayudo a comprender este concepto.'
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// Agregar mensaje del bot
function addBotMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = text;
    
    messageDiv.appendChild(bubble);
    chatMessages.appendChild(messageDiv);
    
    // Scroll al final
    scrollToBottom();
    
    // Agregar al historial
    chatState.conversationHistory.push({
        type: 'bot',
        content: text,
        timestamp: new Date()
    });
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

// Exportar funciones para uso externo
window.Chatbot = {
    sendMessage,
    addBotMessage,
    addUserMessage,
    getConversationHistory: () => chatState.conversationHistory
}; 