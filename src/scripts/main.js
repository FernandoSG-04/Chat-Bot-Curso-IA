// Configuración del chatbot según PROMPT_CLAUDE.md
const CHATBOT_CONFIG = {
    name: 'Lia IA',
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

// Estructura del curso: solo títulos de sesiones y módulos
const COURSE_SESSIONS = {
    '1': { title: 'Sesión 1: Descubriendo la IA para Profesionales' },
    '2': { title: 'Sesión 2: Fundamentos de Machine Learning' },
    '3': { title: 'Sesión 3: Deep Learning y Casos Prácticos' },
    '4': { title: 'Sesión 4: Aplicaciones, Ética y Proyecto Final' }
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
            <div class="avatar-circle">
                <img src="assets/images/AprendeIA.png" alt="Lia IA" onerror="this.onerror=null;this.src='assets/images/AprendeIA.jpg'" />
            </div>
        </div>
    `;
}

function getUserAvatarHTML() {
    return `
        <div class="msg-avatar user">
            <div class="avatar-circle"><i class='bx bx-user'></i></div>
        </div>
    `;
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // EventBus y UI API para el nuevo layout tipo NotebookLM
    setupEventBusAndUI();
    initializeSecurity();
    initializeAudio();
    loadAudioPreference();
    initializeDatabase();
    playChatOpenAnimation().then(() => {
    initializeChat();
    });
    setupEventListeners();
    setupResizableLeft();
    setupVideoPicker();
    setupAvatarLightbox();
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
            ? `¡Hola, ${chatState.userName}!  Bienvenido a Lia IA.\n\nSoy tu asistente virtual y estaré aquí para acompañarte durante tu aprendizaje en IA.`
            : `¡Hola!  Bienvenido a Lia IA.\n\nSoy tu asistente virtual y estaré aquí para acompañarte durante tu aprendizaje en IA.`;

        await sendBotMessage(greeting, null, false, true);
        await showWelcomeInstructions();
        // Menú inline eliminado: ahora el panel izquierdo contiene las herramientas
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
        const welcomeText = "¡Hola! Bienvenido a Lia IA. Soy tu asistente virtual y estaré aquí para acompañarte durante tu aprendizaje en IA.";
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
    if (audioToggle) {
        audioToggle.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const newState = toggleAudio();
            if (!newState) audioToggle.classList.add('muted'); else audioToggle.classList.remove('muted');
            try { localStorage.setItem('chat_audio_enabled', JSON.stringify(newState)); } catch(_){ }
        });
    }

    // Cargar preferencia de audio (sin forzar toggle de lógica)
    try {
        const saved = localStorage.getItem('chat_audio_enabled');
        if (saved !== null) {
            const enabled = JSON.parse(saved);
            chatState.audioEnabled = !!enabled;
            if (audioToggle) { if (!enabled) audioToggle.classList.add('muted'); else audioToggle.classList.remove('muted'); }
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

    // Conectar botones del panel izquierdo (tool-list)
    try {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-action');
                switch(action) {
                    case 'open-notes': EventBus.emit('ui:openNotes'); break;
                    case 'open-glossary': EventBus.emit('ui:openGlossary'); break;
                    case 'open-audio': EventBus.emit('ui:openAudio'); break;
                    case 'open-video': EventBus.emit('ui:openVideo'); break;
                    case 'open-report': EventBus.emit('ui:openReport'); break;
                    case 'copy-prompts': EventBus.emit('ui:copyPrompts'); break;
                    case 'open-quizzes': EventBus.emit('ui:openQuizzes'); break;
                    case 'open-faq': EventBus.emit('ui:openFAQ'); break;
                    case 'open-zoom': EventBus.emit('ui:openZoom'); break;
                    case 'open-teachers': EventBus.emit('ui:openTeachers'); break;
                }
            });
        });
        // Toggles de colapso
        const root = document.body;
        document.getElementById('collapseLeft')?.addEventListener('click', () => {
            root.classList.toggle('left-collapsed');
        });
        document.getElementById('collapseRight')?.addEventListener('click', () => {
            root.classList.toggle('right-collapsed');
        });
        // Acciones del rail (si visible)
        const railButtons = document.querySelectorAll('.studio-rail .rail-btn');
        if (railButtons && railButtons.length) {
            railButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.getAttribute('data-action');
                    switch(action) {
                        case 'open-audio': EventBus.emit('ui:openAudio'); break;
                        case 'open-video': EventBus.emit('ui:openVideo'); break;
                        case 'open-report': EventBus.emit('ui:openReport'); break;
                        case 'open-notes': EventBus.emit('ui:openNotes'); break;
                        case 'open-zoom': EventBus.emit('ui:openZoom'); break;
                        case 'open-teachers': EventBus.emit('ui:openTeachers'); break;
                    }
                });
            });
        }
        // Asegurar eventos para tiles del panel derecho (aún cuando colapsa/expande)
        document.querySelectorAll('.studio-tiles .tile').forEach(tile => {
            tile.addEventListener('click', () => {
                const action = tile.getAttribute('data-action');
                switch(action) {
                    case 'open-audio': EventBus.emit('ui:openAudio'); break;
                    case 'open-video': EventBus.emit('ui:openVideo'); break;
                    case 'open-report': EventBus.emit('ui:openReport'); break;
                    case 'open-notes': EventBus.emit('ui:openNotes'); break;
                    case 'open-zoom': EventBus.emit('ui:openZoom'); break;
                    case 'open-teachers': EventBus.emit('ui:openTeachers'); break;
                }
            });
        });
    } catch(_){}

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

    // Botón + de sesiones
    const sessionBtn = document.getElementById('sessionMenuButton');
    if (sessionBtn) {
        sessionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Asegurar que el contenido esté cargado antes de mostrar
            renderSessionPicker();
            toggleSessionMenu();
        });
    }
}

// ===== Nuevo: EventBus y UI API =====
function setupEventBusAndUI() {
    if (window.EventBus) return;
    const listeners = {};
    window.EventBus = {
        on: (evt, cb) => { (listeners[evt] ||= []).push(cb); },
        off: (evt, cb) => { listeners[evt] = (listeners[evt]||[]).filter(f => f!==cb); },
        emit: (evt, payload) => { (listeners[evt]||[]).forEach(f => { try { f(payload); } catch(_){} }); }
    };

    // Studio helpers
    const cardsEl = () => document.getElementById('studioCards');
    const addCard = (title, contentHTML) => {
        const el = document.createElement('div');
        el.className = 'studio-card';
        el.innerHTML = `<h4 style="margin:0 0 8px 0">${title}</h4>` + contentHTML;
        cardsEl()?.prepend(el);
        return el;
    };

    window.UI = {
        openNotes(initial = '') { addCard('Notas', `<textarea style="width:100%;height:160px">${initial}</textarea>`); },
        openGlossary() { addCard('Glosario', `<div id="glossaryPanelMount">Usa las letras para explorar términos.</div>`); showGlossary(); },
        openAudioSummary() { addCard('Resumen de audio', '<div>Sube audio desde el botón de micrófono y lo resumiré aquí.</div>'); },
        openZoomSessions() { 
            addCard('Sesiones Zoom', `
                <div style="display:grid;gap:12px">
                    <div style="background:rgba(68,229,255,.1);padding:12px;border-radius:8px">
                        <h5 style="margin:0 0 8px">📅 Próximas sesiones</h5>
                        <p style="margin:0;font-size:14px;color:var(--text-muted)">Miércoles 14/08 - 19:00 hrs<br/>Tema: Fundamentos de IA</p>
                        <button class="keyboard-button" style="margin-top:8px;padding:6px 12px;font-size:14px">Unirse a Zoom</button>
                    </div>
                    <div style="border:1px solid rgba(68,229,255,.15);padding:12px;border-radius:8px">
                        <h5 style="margin:0 0 8px">🔗 Enlaces permanentes</h5>
                        <input type="url" placeholder="https://zoom.us/j/..." style="width:100%;padding:6px;margin:4px 0;border-radius:6px;border:1px solid rgba(68,229,255,.25);background:rgba(255,255,255,.04);color:var(--text-on-dark)">
                        <button class="keyboard-button" style="padding:6px 12px;font-size:14px">Agregar enlace</button>
                    </div>
                </div>
            `); 
        },
        openTeachers() { 
            addCard('Docentes del curso', `
                <div class="teacher-profile">
                    <div class="teacher-photo" style="background-image:url('assets/images/Ernesto.jpg')"></div>
                    <div class="teacher-head">
                        <h3 class="teacher-name">Ernesto Hernández Martínez | Renato Verum, "El Pastor Cibernético"</h3>
                        <p class="teacher-title">Ingeniero en Comunicaciones y Electrónica | Líder en IA Generativa y Transformación Digital | "El Pastor Cibernético"</p>
                        <div class="teacher-section">
                            <h4 class="section-title">Perfil Profesional</h4>
                            <p class="section-text">Soy un líder visionario dedicado a transformar organizaciones mediante la integración ética y estratégica de la inteligencia artificial generativa con principios profundamente humanos como el amor, la sabiduría y el servicio.</p>
                        </div>
                    </div>
                </div>

                <div class="teacher-section">
                    <p class="section-text">A través del Liderazgo Áureo, mi enfoque promueve decisiones conscientes y colaborativas, fortaleciendo la productividad e innovación desde una perspectiva ágil y práctica. Creo firmemente en una tecnología centrada en las personas, potenciando su talento y creatividad para construir empresas humanas y altamente competitivas en la era digital.</p>
                </div>

                <div class="teacher-section">
                    <h4 class="section-title">Experiencia Destacada</h4>
                    <h5 class="role">Cofundador | Aprende y Aplica IA</h5>
                    <ul class="section-list">
                        <li>Lidero formaciones ágiles y prácticas en inteligencia artificial generativa, capacitando a líderes empresariales para aplicar IA de inmediato en sus organizaciones.</li>
                        <li>Incremento promedio del 40% en productividad y eficiencia operativa en empresas participantes desde el primer día.</li>
                        <li>Desarrollo de metodologías exclusivas que permiten resultados visibles en toma de decisiones y ventaja competitiva.</li>
                        <li>Establecimiento de hábitos de aprendizaje continuo con impacto real en proyectos.</li>
                    </ul>
                    <h5 class="role">Fundador | Ecos de Liderazgo & Fundación Ecos de Liderazgo</h5>
                    <ul class="section-list">
                        <li>Diseño e implementación de ecosistemas inteligentes de colaboración digital impulsados por IA generativa.</li>
                        <li>Más de 50 empresas impactadas positivamente, transformando la cultura organizacional hacia un liderazgo humanista.</li>
                        <li>Establecimiento de programas que convierten conocimiento tácito en explícito, optimizando procesos clave hasta en un 35%.</li>
                        <li>Mentoría a equipos directivos para decisiones éticas y efectivas en transformación digital.</li>
                    </ul>
                    <h5 class="role">Creador y Líder | PulseHub</h5>
                    <ul class="section-list">
                        <li>Desarrollo de una plataforma innovadora que utiliza IA predictiva para anticipar desafíos organizacionales y mejorar la toma de decisiones.</li>
                        <li>Incremento del compromiso del equipo en más del 60%, optimizando procesos críticos y reduciendo tiempos operativos.</li>
                        <li>Reconocimiento por la creación de entornos laborales altamente productivos y emocionalmente saludables.</li>
                    </ul>
                    <h5 class="role">Cofundador | Alfasoluciones & Mercadata | Mentor Estratégico</h5>
                    <ul class="section-list">
                        <li>Implementación exitosa de soluciones tecnológicas avanzadas (ERP, análisis de datos) en más de 200 proyectos empresariales.</li>
                        <li>Mentoría personalizada a más de 100 líderes ejecutivos en transformación digital y liderazgo consciente.</li>
                        <li>Mejora del rendimiento comercial en promedio del 50% mediante estrategias digitales y automatización inteligente.</li>
                    </ul>
                </div>

                <div class="teacher-section">
                    <h4 class="section-title">Habilidades Estratégicas</h4>
                    <ul class="section-list">
                        <li><strong>Inteligencia Artificial Generativa:</strong> Aplicación inmediata y práctica en contextos empresariales.</li>
                        <li><strong>Liderazgo Áureo:</strong> Integración efectiva del amor, sabiduría y servicio en la gestión empresarial.</li>
                        <li><strong>Gestión del Cambio:</strong> Facilitación ágil y humanista en procesos de transformación digital.</li>
                        <li><strong>Diseño de Ecosistemas Inteligentes:</strong> Creación de plataformas colaborativas predictivas.</li>
                        <li><strong>Pensamiento Innovador y Ético:</strong> Decisiones conscientes y estratégicamente disruptivas.</li>
                        <li><strong>Resiliencia y Adaptabilidad:</strong> Competencia clave para liderar en entornos altamente dinámicos.</li>
                    </ul>
                </div>

                <div class="teacher-section">
                    <h4 class="section-title">Metas y Visión</h4>
                    <ul class="section-list">
                        <li>Expandir Aprende y Aplica IA en Latinoamérica, consolidándolo como referente global en formación ágil y práctica en IA generativa.</li>
                        <li>Desarrollar nuevas herramientas tecnológicas que potencien aún más PulseHub y Mente Convergente.</li>
                        <li>Creación de un comunidad internacional de líderes conscientes capaces de transformar organizaciones a través de IA ética y efectiva.</li>
                    </ul>
                </div>

                <div class="teacher-section">
                    <h4 class="section-title">Más Allá de lo Profesional</h4>
                    <ul class="section-list">
                        <li>Apasionado del crecimiento espiritual y personal.</li>
                        <li>Deportista comprometido: running, natación y fitness.</li>
                        <li>Orador motivacional enfocado en inspirar transformaciones positivas y liderazgo auténtico.</li>
                    </ul>
                </div>

                <div class="teacher-section">
                    <h4 class="section-title">Datos Personales</h4>
                    <p class="section-text">Email: <a href="mailto:ernesto@aprendeyaplica.ai">ernesto@aprendeyaplica.ai</a><br/>LinkedIn: <a href="#" target="_blank" rel="noopener noreferrer">[Insertar enlace aquí]</a></p>
                </div>

                <hr style="border-color: rgba(68,229,255,0.2); margin:16px 0"/>

                <div class="teacher-profile">
                    <div class="teacher-photo" style="background-image:url('assets/images/Alejandra.jpg')"></div>
                    <div class="teacher-head">
                        <h3 class="teacher-name">Alejandra Rodríguez Escobar | "La Arquitecta Audiovisual"</h3>
                        <p class="teacher-title">Licenciada en Ciencias de la Comunicación | Maestría en Diseño Multimedia (en curso) | Especialización en Creación de Contenido Audiovisual | Estrategia Digital | Certificación en Social Media Management</p>
                        <div class="teacher-section">
                            <h4 class="section-title">Perfil Profesional</h4>
                            <p class="section-text">Soy Licenciada en Ciencias de la Comunicación y actualmente curso una Maestría en Diseño Multimedia, especializándome en integrar técnicas avanzadas de inteligencia artificial en proyectos audiovisuales.</p>
                        </div>
                    </div>
                </div>

                <div class="teacher-section">
                    <p class="section-text">Mi pasión por la innovación digital me impulsa a explorar nuevas herramientas que potencien la creatividad y permitan ofrecer contenidos interactivos, inmersivos y relevantes para diferentes audiencias. Combino pensamiento estratégico con dominio tecnológico para crear experiencias visuales y narrativas digitales únicas, optimizando el engagement y fortaleciendo la identidad corporativa en plataformas digitales.</p>
                </div>

                <div class="teacher-section">
                    <h4 class="section-title">Experiencia Destacada</h4>
                    <h5 class="role">Diseñadora Gráfica y Community Manager | CAM Centro de Artes y Música</h5>
                    <ul class="section-list">
                        <li>Lideró la creación integral de contenido gráfico y multimedia, potenciando la presencia digital de la organización en diversas plataformas.</li>
                        <li>Implementó campañas de social media que aumentaron en 45% el alcance orgánico y 30% la interacción.</li>
                        <li>Optimizó procesos de producción y postproducción audiovisual con herramientas avanzadas, reduciendo 25% tiempos de entrega.</li>
                    </ul>
                    <h5 class="role">Editora de Contenido Audiovisual | Latin Media Group</h5>
                    <ul class="section-list">
                        <li>Gestión integral de edición profesional de videos y fotografía, asegurando calidad visual y coherencia narrativa.</li>
                        <li>Desarrolló estrategias digitales que incrementaron la visibilidad en un 40% durante el primer año.</li>
                        <li>Eficiencia operativa: reducción del 20% en tiempos de publicación en plataformas digitales.</li>
                    </ul>
                    <h5 class="role">Gestora de Contenido Multimedia (Servicio Social) | Grupo Fórmula</h5>
                    <ul class="section-list">
                        <li>Identificación estratégica de contenidos noticiosos y producción audiovisual para maximizar atención en YouTube.</li>
                        <li>Supervisión de edición y postproducción, incrementando 35% la retención promedio de espectadores.</li>
                        <li>Optimización del alcance mediante contenidos enfocados en relevancia y valor para la audiencia.</li>
                    </ul>
                </div>

                <div class="teacher-section">
                    <h4 class="section-title">Habilidades Estratégicas</h4>
                    <ul class="section-list">
                        <li>Creación y edición avanzada de contenido multimedia.</li>
                        <li>Gestión efectiva de redes sociales y estrategias de engagement.</li>
                        <li>Diseño gráfico, fotografía, retoque y postproducción.</li>
                        <li>Redacción creativa de guiones y storytelling.</li>
                        <li>Adaptabilidad, trabajo en equipo y empatía.</li>
                    </ul>
                </div>

                <div class="teacher-section">
                    <h4 class="section-title">Metas y Visión</h4>
                    <p class="section-text">A corto y mediano plazo, posicionarme como referente en diseño multimedia y comunicación digital, integrando IA en narrativas visuales impactantes con tecnologías emergentes. A largo plazo, liderar iniciativas que fortalezcan la comunicación de las marcas y transformen positivamente la experiencia de audiencias diversas.</p>
                </div>

                <div class="teacher-section">
                    <h4 class="section-title">Más Allá de lo Profesional</h4>
                    <ul class="section-list">
                        <li>Apasionada por la fotografía creativa y el retoque como medio de expresión.</li>
                        <li>Exploradora constante de tendencias audiovisuales.</li>
                        <li>Promotora del trabajo colaborativo y la innovación multidisciplinaria.</li>
                    </ul>
                </div>
            `); 
        },
        openVideoSummary() {
            // Reutilizar una única tarjeta de resumen
            let card = document.querySelector('.studio-card[data-kind="video-summary"]');
            if (!card) {
                card = addCard('Resumen de video', `
                    <div id="videoSummary" style="color:var(--text-muted)">
                        ${currentVideo ? 'Generando resumen con IA…' : 'Selecciona un video en el panel izquierdo para habilitar el resumen.'}
                    </div>
                    <div style="display:flex;gap:8px;margin-top:8px">
                        <button id="refreshVideoSummary" class="keyboard-button" style="max-width:160px">Actualizar</button>
                    </div>
                `);
                card.setAttribute('data-kind', 'video-summary');
            } else {
                const header = card.querySelector('h4');
                if (header) header.textContent = currentVideo ? `Resumen de video — ${currentVideo.label}` : 'Resumen de video';
                const body = card.querySelector('#videoSummary');
                if (body) body.textContent = currentVideo ? 'Generando resumen con IA…' : 'Selecciona un video en el panel izquierdo para habilitar el resumen.';
            }
            // Si hay video seleccionado, pedir resumen a la IA
            setTimeout(async () => {
                const el = card.querySelector('#videoSummary');
                const btn = card.querySelector('#refreshVideoSummary');
                const runSummary = async () => {
                    if (!currentVideo || !el) return;
                    el.textContent = 'Generando resumen con IA…';
                    const prompt = `Resume el video actual de YouTube en español con 5 viñetas, tono claro y aplicable. Incluye propósito, puntos clave y una acción práctica.\n\nVideo: ${currentVideo.label} (${currentVideo.url})`;
                    const response = await processUserMessageWithAI(prompt);
                    el.textContent = response || 'No fue posible generar el resumen.';
                };
                if (btn) btn.addEventListener('click', runSummary);
                if (currentVideo) await runSummary();
            }, 0);
        },
        openReport(opts={}) { 
            addCard('Informes y Resúmenes', `
                <div style="display:grid;gap:16px">
                    <div style="display:flex;flex-direction:column;gap:8px">
                        <h5 style="margin:0">📝 Generar informe con IA</h5>
                        <div style="display:grid;gap:8px">
                            <textarea placeholder="Pega aquí el texto a resumir o analizar..." style="width:100%;height:100px;padding:10px;border-radius:8px;border:1px solid rgba(68,229,255,.25);background:rgba(255,255,255,.04);color:var(--text-on-dark);font-family:inherit;resize:vertical"></textarea>
                            <input type="file" accept=".txt,.md,.pdf" style="padding:8px;border-radius:8px;border:1px solid rgba(68,229,255,.25);background:rgba(255,255,255,.04);color:var(--text-on-dark)" placeholder="O sube un archivo">
                        </div>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:8px">
                        <h5 style="margin:0">🎯 Tipo de informe</h5>
                        <select style="padding:8px;border-radius:8px;border:1px solid rgba(68,229,255,.25);background:rgba(255,255,255,.04);color:var(--text-on-dark)">
                            <option>Resumen ejecutivo</option>
                            <option>Informe técnico</option>
                            <option>Minuta de reunión</option>
                            <option>Plan de estudio</option>
                            <option>Análisis de contenido</option>
                        </select>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                        <button class="keyboard-button" style="padding:10px;font-size:14px">📄 Generar PDF</button>
                        <button class="keyboard-button" style="padding:10px;font-size:14px">📝 Generar Markdown</button>
                    </div>
                </div>
            `); 
        },
        copyPrompts() { copyPrompts('fundamentos', 1); },
        openFAQ() { addCard('FAQ', '<div>Preguntas frecuentes disponibles por sesión.</div>'); },
        openQuizzes() { addCard('Cuestionarios', '<div>Selecciona una sesión y responde.</div>'); }
    };

    // Wiring: eventos -> UI
    EventBus.on('ui:openNotes', () => UI.openNotes());
    EventBus.on('ui:openGlossary', () => UI.openGlossary());
    EventBus.on('ui:openAudio', () => UI.openAudioSummary());
    EventBus.on('ui:openVideo', () => UI.openVideoSummary());
    EventBus.on('ui:openReport', () => UI.openReport());
    EventBus.on('ui:copyPrompts', () => UI.copyPrompts());
    EventBus.on('ui:openFAQ', () => UI.openFAQ());
    EventBus.on('ui:openQuizzes', () => UI.openQuizzes());
    EventBus.on('ui:openZoom', () => UI.openZoomSessions());
    EventBus.on('ui:openTeachers', () => UI.openTeachers());
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
        const res = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'X-API-Key': getApiKey(), ...getUserAuthHeaders(), 'X-Requested-With': 'XMLHttpRequest' },
            body: form
        });
        if (!res.ok) throw new Error('No se pudo transcribir el audio');
        const data = await res.json();
        const text = data.text || '(Transcripción en proceso)';
        // Mostrar como tarjeta en el panel derecho
        const card = document.createElement('div');
        card.className = 'studio-card';
        card.innerHTML = `<h4 style="margin:0 0 8px 0">Transcripción (AssemblyAI)</h4><div style="white-space:pre-wrap">${text}</div>`;
        document.getElementById('studioCards')?.prepend(card);
        // También enviar al chat como mensaje del usuario para poder continuar el flujo
        if (text && text !== '(Transcripción en proceso)') {
            addUserMessage(text);
        }
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
// showMainMenu eliminado; navegación ahora desde el panel izquierdo/Studio

// Mostrar instrucciones de bienvenida divididas
async function showWelcomeInstructions() {
    await sendBotMessage("📝 ESCRIBE EN EL CHAT\n\nHaz tus preguntas y presiona Enter. Las herramientas ahora están en los paneles laterales (Notas, Glosario, Resumen de audio/video, Informes).");
    await sendBotMessage("🎯 SUGERENCIAS\n\nCuando corresponda, te propondré acciones como 'Enviar a Notas' o 'Crear Informe'; el panel Studio de la derecha las mostrará como tarjetas.");
}

// Mensaje guía para dirigir a sesiones del curso
async function showSessionGuide() {
    const guide = `
        <div class="inline-keyboard">
            <div class="keyboard-row">
                <button class="keyboard-button" onclick="Chatbot.showSessionsForTopic('fundamentos')">🤖 Fundamentos</button>
                <button class="keyboard-button" onclick="Chatbot.showSessionsForTopic('ml')">📊 ML</button>
            </div>
            <div class="keyboard-row">
                <button class="keyboard-button" onclick="Chatbot.showSessionsForTopic('deep')">🧠 Deep</button>
                <button class="keyboard-button" onclick="Chatbot.showSessionsForTopic('aplicaciones')">🎯 Aplicaciones</button>
            </div>
            <div class="keyboard-row">
                <button class="keyboard-button" onclick="Chatbot.openTopicSession('fundamentos', 1)">📘 Sesión 1</button>
                <button class="keyboard-button" onclick="Chatbot.openTopicSession('fundamentos', 2)">📗 Sesión 2</button>
            </div>
            <div class="keyboard-row">
                <button class="keyboard-button" onclick="Chatbot.openTopicSession('fundamentos', 3)">📙 Sesión 3</button>
                <button class="keyboard-button" onclick="Chatbot.openTopicSession('fundamentos', 4)">📕 Sesión 4</button>
            </div>
        </div>
    `;
    await sendBotMessage("🏁 Elige un tema o entra directo por sesión (Fundamentos):", guide, false, false);
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

    const keyboard = getSessionActionsKeyboard(topic, session);

    replaceLastBotMessage(`${title} — Sesión ${session}\n\nSelecciona una acción:`, keyboard);
}

function getSessionActionsKeyboard(topic, session) {
    return `
        <div class="inline-keyboard">
            <div class="keyboard-row">
                <button class="keyboard-button" onclick="Chatbot.showCollaborativeActivities('${topic}', ${session})">🤝 Actividades Colaborativas</button>
                <button class="keyboard-button" onclick="Chatbot.startQuiz('${topic}', ${session})">📝 Cuestionario</button>
            </div>
            <div class="keyboard-row">
                <button class="keyboard-button" onclick="Chatbot.showFAQ('${topic}', ${session})">❓ FAQ</button>
                <button class="keyboard-button" onclick="Chatbot.copyPrompts('${topic}', ${session})">📋 Copiar Prompts</button>
            </div>
            <div class="keyboard-row">
                <button class="keyboard-button" onclick="Chatbot.showSessionsForTopic('${topic}')">⬅️ Volver a Sesiones</button>
            </div>
            ${getBackButton()}
        </div>
    `;
}

function showCollaborativeActivities(topic, session) {
    const activities = `
• Debate guiado: Ventajas y límites de ${topic} (Sesión ${session})
• Parejas: Explica el concepto y comparte ejemplo real
• Mini-proyecto: Diseña un caso de uso y métricas de éxito
`; 
    sendBotMessage(`🤝 ACTIVIDADES COLABORATIVAS — Sesión ${session}\n\n${activities}`, getSessionActionsKeyboard(topic, session), false, false);
}

function startQuiz(topic, session) {
    const quizIntro = `📝 CUESTIONARIO — Sesión ${session}\n\nResponde brevemente (1–2 líneas).`;
    const q = `
1) Define en tus palabras el objetivo principal de esta sesión.
2) Pon un ejemplo práctico del concepto clave visto.
3) ¿Qué métrica usarías para evaluar el éxito?
`;
    sendBotMessage(`${quizIntro}\n\n${q}`, getSessionActionsKeyboard(topic, session), false, false);
}

function showFAQ(topic, session) {
    const faq = `
• ¿Cuándo usar ${topic}?\n• ¿Qué errores comunes debo evitar?\n• ¿Qué recursos recomiendas para profundizar?`;
    sendBotMessage(`❓ FAQ — Sesión ${session}\n\n${faq}`, getSessionActionsKeyboard(topic, session), false, false);
}

async function copyPrompts(topic, session) {
    // Si es la primera sesión, mostrar panel lateral con instrucciones y botón copiar
    if (session === 1) {
        const promptText = `Actúa como un analista experto en inteligencia artificial generativa. Realiza una investigación exhaustiva con el título "Gen AI El Despertar de una Nueva Era Humana del miedo al entusiasmo" para identificar y analizar los siguientes puntos clave:\n\n- Evolución de la percepción: Describe el cambio en la percepción de la IA generativa desde su aparición masiva, incluyendo la reacción inicial y la mentalidad actual en la alta dirección.\n\n- Impacto transformador y ejemplos de uso actuales: Identifica cómo la IA generativa está redefiniendo la productividad humana y transformando modelos de negocio en diversas industrias. Proporciona ejemplos específicos de empresas y sectores que ya están utilizando la IA generativa, detallando las aplicaciones y los beneficios obtenidos.\n\n- Avances tecnológicos y ecosistema: Detalla las nuevas generaciones de modelos de IA generativa (Finales 2024-2025) y sus capacidades mejoradas. Describe el ecosistema de proveedores líderes y sus herramientas para entornos corporativos. Explica las estrategias de adopción de la IA generativa por parte de las empresas, incluyendo la elección entre modelos públicos y la construcción de IP propia.\n\n- Implicaciones humanas y sociales: Analiza cómo la IA generativa está democratizando el conocimiento, amplificando la creatividad y reimaginando el trabajo, destacando el valor humano en este nuevo escenario.\n\n- Casos de uso en finanzas y banca: Desglosa los casos de uso recientes de la IA generativa en el sector financiero y bancario, incluyendo asistentes virtuales, optimización de riesgos y cumplimiento, y personalización/eficiencia. Menciona las proyecciones de McKinsey para el futuro del trabajo en relación con la IA generativa.\n\n- Desafíos y consideraciones estratégicas para líderes: Extrae las recomendaciones clave para los CEOs y C-levels en la adopción e integración de la IA generativa, incluyendo la necesidad de ética, visión, valentía e inversión en talento.\n\nAsegúrate de citar cada dato o afirmación con el número de fuente correspondiente. Organiza tu respuesta de manera clara y concisa, utilizando un formato de investigación formal.`;
        showPromptOverlay({
            title: `Paso 1: Prompt de Investigación — Sesión ${session}`,
            htmlIntro: `1. Abre <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer">Gemini</a> y, en la caja de chat, copia y pega el siguiente prompt en su totalidad.<br/>2. Activa la herramienta <strong>deep research</strong> y ejecuta.`,
            promptText,
        });
        return;
    }

    const prompts = [
        `Explícame el concepto central de la sesión ${session} de ${topic} con un ejemplo simple`,
        `Dame 3 ejercicios prácticos breves sobre la sesión ${session} de ${topic}`,
        `Propón un mini‑proyecto aplicando lo visto en la sesión ${session} de ${topic}`
    ].join('\n');
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(prompts);
            sendBotMessage('📋 Prompts copiados al portapapeles.', getSessionActionsKeyboard(topic, session), false, false);
        } else {
            const ta = document.createElement('textarea');
            ta.value = prompts; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
            sendBotMessage('📋 Prompts copiados al portapapeles.', getSessionActionsKeyboard(topic, session), false, false);
        }
    } catch (e) {
        sendBotMessage('⚠️ No se pudo copiar automáticamente. Aquí tienes los prompts:\n\n' + prompts, getSessionActionsKeyboard(topic, session), false, false);
    }
}

// Panel lateral para prompts (similar al glosario)
function showPromptOverlay({ title, htmlIntro, promptText }) {
    let overlay = document.getElementById('promptOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'promptOverlay';
        overlay.className = 'prompt-overlay';
        overlay.innerHTML = `
            <div class="prompt-panel">
                <div class="prompt-header">
                    <h3>📑 <span id="promptTitle"></span></h3>
                    <button class="prompt-close" aria-label="Cerrar">×</button>
                </div>
                <div class="prompt-body">
                    <div id="promptIntro" class="prompt-intro"></div>
                    <div class="prompt-actions">
                        <button id="copyPromptBtn" class="keyboard-button" style="max-width:200px">📋 Copiar Prompt</button>
                    </div>
                    <pre id="promptText" class="prompt-text"></pre>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelector('.prompt-close').addEventListener('click', () => hidePromptOverlay());
        overlay.querySelector('#copyPromptBtn').addEventListener('click', async () => {
            const text = overlay.querySelector('#promptText').textContent;
            try {
                await navigator.clipboard.writeText(text);
                overlay.querySelector('#copyPromptBtn').textContent = '✅ Copiado';
                setTimeout(() => overlay.querySelector('#copyPromptBtn').textContent = '📋 Copiar Prompt', 1200);
            } catch (_) {}
        });
    }
    overlay.querySelector('#promptTitle').textContent = title || 'Prompt';
    overlay.querySelector('#promptIntro').innerHTML = htmlIntro || '';
    overlay.querySelector('#promptText').textContent = promptText || '';

    const container = document.querySelector('.telegram-container');
    const glossary = document.getElementById('glossaryOverlay');
    const panel = overlay.querySelector('.prompt-panel');
    if (glossary && glossary.classList.contains('open')) {
        // si el prompt estaba a la derecha, animarlo hacia la izquierda suavemente
        panel.classList.add('left');
        if (container) {
            container.classList.remove('shift-left');
            container.style.transform = 'translateX(0) scale(0.975)';
        }
    } else {
        panel.classList.remove('left');
        if (container) {
            container.classList.add('shift-left');
            container.style.removeProperty('transform');
        }
    }
    setTimeout(() => overlay.classList.add('open'), 80);
}

function hidePromptOverlay() {
    const overlay = document.getElementById('promptOverlay');
    const container = document.querySelector('.telegram-container');
    if (overlay) overlay.classList.remove('open');
    setTimeout(() => {
        const glossary = document.getElementById('glossaryOverlay');
        if (glossary && glossary.classList.contains('open')) {
            if (container) {
                container.classList.add('shift-left');
                container.style.removeProperty('transform');
            }
        } else {
            container?.classList.remove('shift-left');
            container?.style.removeProperty('transform');
        }
    }, 150);
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

    // Animación: si el panel de prompts está abierto, centrar chat; si no, mover a la izquierda
    const container = document.querySelector('.telegram-container');
    const promptOverlay = document.getElementById('promptOverlay');
    if (container) {
        if (promptOverlay && promptOverlay.classList.contains('open')) {
            container.classList.remove('shift-left');
            container.style.transform = 'translateX(0) scale(0.975)';
        } else {
            container.classList.add('shift-left');
            container.style.removeProperty('transform');
        }
    }
    setTimeout(() => overlay.classList.add('open'), 120);
}

function hideGlossary() {
    const overlay = document.getElementById('glossaryOverlay');
    const container = document.querySelector('.telegram-container');
    if (overlay) overlay.classList.remove('open');
    // Ajustar posición del chat según si el panel de prompts sigue abierto
    setTimeout(() => {
        const promptOverlay = document.getElementById('promptOverlay');
        if (promptOverlay && promptOverlay.classList.contains('open')) {
            if (container) {
                container.classList.remove('shift-left');
                container.style.transform = 'translateX(0) scale(0.975)';
            }
        } else {
            if (container) {
                container.classList.remove('shift-left');
                container.style.removeProperty('transform');
            }
        }
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
    // Para desarrollo, retorna una clave fija
    return 'dev-api-key';
}

// Función para generar una clave de sesión temporal
function generateSessionKey() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return btoa(`${timestamp}-${random}`).replace(/[^a-zA-Z0-9]/g, '');
}

// Encabezados de autenticación de usuario
function getUserAuthHeaders() {
    // Para desarrollo, retorna headers vacíos ya que la autenticación está deshabilitada en el servidor
    return {};
}

// Procesar mensaje del usuario con IA
async function processUserMessageWithAI(message) {
    try {
        // Obtener contexto de la base de datos (si está disponible)
        const dbContext = await getDatabaseContext(message);
        
        // Construir contexto de BD de forma más legible
        let contextInfo = '';
        if (dbContext.length > 0) {
            contextInfo = '\n\nInformación relevante de la base de datos:\n';
            dbContext.forEach(item => {
                switch (item.source) {
                    case 'glossary':
                        contextInfo += `📖 Glosario: ${item.term} - ${item.definition}\n`;
                        break;
                    case 'faq':
                        contextInfo += `❓ FAQ (${item.session_title}): ${item.question} - ${item.answer}\n`;
                        break;
                    case 'activity':
                        contextInfo += `🎯 Actividad (${item.session_title}): ${item.title} - ${item.description || ''}\n`;
                        break;
                    case 'question':
                        contextInfo += `🤔 Pregunta (${item.session_title}): ${item.text}\n`;
                        break;
                }
            });
        }
        
        // Prompt completo siguiendo PROMPT_CLAUDE.md al pie de la letra
        const systemPrompt = `Sistema — Claude (ES)

Rol y alcance
- Eres "Asistente de Aprende y Aplica IA": experto en IA que guía a estudiantes en español con tono profesional, cercano y nada robotizado.
- Límite estricto: céntrate en contenidos del curso de IA, ejercicios, glosario y actividades. Si algo está fuera de alcance, redirige amablemente con 2–4 opciones del temario.

Objetivo general
- Entregar respuestas claras, accionables y verificables; generar casos de uso y prompts listos para copiar cuando aporten valor.

Manejo de preguntas largas
- Acepta entradas extensas sin recortar contenido. Resume el objetivo en 1–2 líneas, divide en sub‑tareas y responde por secciones. Si la consulta es muy amplia, propone un plan paso a paso y entrega un primer bloque útil; ofrece continuar con "¿sigo con la parte B/C…?)".

Detección de ánimo (obligatoria)
- Clasifica el ánimo del usuario en: entusiasta | neutral | confundido | frustrado | molesto | troll/"pregunta tonta".
- Adapta el tono en consecuencia: breve‑enérgico (entusiasta), calmado y paso a paso (confundido/frustrado), firme y respetuoso (molesto). Si detectas troll/pregunta tonta, usa sarcasmo ligero y pertinente al curso sin atacar a la persona.

Política de sarcasmo (seguro y útil)
- Solo cuando la intención sea claramente trivial/troll y manteniendo el foco educativo.
- Hazlo en una línea, ingenioso y relacionado con IA/curso. Evita insultos, estereotipos o humillaciones.

Desambiguación y complejidad
- Si la consulta es ambigua o falta contexto, formula 1–2 preguntas de aclaración o continúa bajo supuestos explícitos.
- Para preguntas complejas, divide en secciones con pasos y ejemplos; termina con una mini‑conclusión.
- Si hay cifras o estado del arte cambiante, márcalo como aproximado/sujeto a cambios.

Casos de uso (cuando aplique)
- Entrega 3–5 casos con: propósito, pasos clave, herramientas/recursos, métrica de éxito y riesgo/consideración.

Prompts (cuando aplique)
- Ofrece 2–4 prompts listos para copiar orientados a estudio/práctica o evaluación, alineados al temario.

Formato de respuesta
- 1 línea inicial que responda directo a la intención.
- 3–6 viñetas con lo esencial (usa **negritas** para conceptos clave).
- Cierra con una pregunta breve que proponga el siguiente paso u opciones del curso.
- Español neutro, claro y preciso. Evita párrafos largos; usa listas.

Límites y seguridad
- No inventes enlaces ni bibliografía. No des instrucciones peligrosas.
- Si no sabes algo, admítelo y sugiere cómo investigarlo dentro del marco del curso.

Nunca pidas el nombre/apellido del usuario ni bloquees la conversación por identificación.

${contextInfo}

Responde siguiendo exactamente el formato especificado:`;
        
        const fullPrompt = `${systemPrompt}\n\nUsuario: ${message}\n\nAsistente:`;
        
        // Llamar a OpenAI
        const aiResponse = await callOpenAI(fullPrompt, contextInfo);
        return aiResponse;
    } catch (error) {
        console.error('Error procesando mensaje con IA:', error);
        
        console.error('❌ Error completo:', error);
        
        // Mostrar detalles del error en consola para debugging
        if (error.response) {
            try {
                const errorData = await error.response.json();
                console.error('📋 Error details:', errorData);
            } catch (e) {
                console.error('📋 Error text:', await error.response.text());
            }
        }
        
        // Mensaje de error siguiendo formato PROMPT_CLAUDE.md
        return `Hubo un problema temporal con el servicio, pero sigo disponible para ayudarte.

• **Problema técnico**: Conexión temporalmente interrumpida
• **Alternativas**: Puedo ayudarte con conceptos básicos de IA como **prompts**, **LLMs** o **tokens**
• **Ejercicios**: Disponibles algoritmos de clasificación, redes neuronales básicas
• **Navegación**: Usa el menú principal para acceder a temas organizados

¿Prefieres explorar fundamentos de IA, ejercicios prácticos o consultar el glosario?`;
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
    if (chatState.currentState === 'start' && !chatState.userName) {
        // Ya no se requiere capturar nombre; ir directo al procesamiento IA
        chatState.currentState = 'main_menu';
        showMainMenu();
        const response = await processUserMessageWithAI(message);
        await sendBotMessage(response, null, false, false);
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
function getBackButton() { return ``; }

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

// ===== Sistema de gestión de sesiones =====
let sessionManager = {
    sessions: new Map(),
    currentSession: null,
    nextId: 1
};

function initializeSessionManager() {
    // Cargar sesiones desde localStorage
    try {
        const saved = localStorage.getItem('chat_sessions');
        if (saved) {
            const data = JSON.parse(saved);
            sessionManager.sessions = new Map(data.sessions || []);
            sessionManager.currentSession = data.currentSession || null;
            sessionManager.nextId = data.nextId || 1;
        }
    } catch (_) {}
    
    // Crear sesión inicial si no existe
    if (sessionManager.sessions.size === 0) {
        createNewSession();
    }
    
    updateSessionUI();
}

function saveSessions() {
    try {
        const data = {
            sessions: Array.from(sessionManager.sessions.entries()),
            currentSession: sessionManager.currentSession,
            nextId: sessionManager.nextId
        };
        localStorage.setItem('chat_sessions', JSON.stringify(data));
    } catch (_) {}
}

function createNewSession() {
    const sessionId = `sess_${sessionManager.nextId++}`;
    const session = {
        id: sessionId,
        title: `Nueva sesión ${sessionManager.sessions.size + 1}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: []
    };
    
    sessionManager.sessions.set(sessionId, session);
    sessionManager.currentSession = sessionId;
    
    // Limpiar chat actual
    chatState.conversationHistory = [];
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) chatMessages.innerHTML = '';
    
    saveSessions();
    updateSessionUI();
    initializeChat(); // Reiniciar chat con mensaje de bienvenida
}

function switchToSession(sessionId) {
    if (!sessionManager.sessions.has(sessionId)) return;
    
    // Guardar mensajes de sesión actual
    if (sessionManager.currentSession) {
        const currentSession = sessionManager.sessions.get(sessionManager.currentSession);
        if (currentSession) {
            currentSession.messages = [...chatState.conversationHistory];
            currentSession.updatedAt = Date.now();
        }
    }
    
    // Cambiar a nueva sesión
    sessionManager.currentSession = sessionId;
    const session = sessionManager.sessions.get(sessionId);
    
    // Restaurar mensajes
    chatState.conversationHistory = [...(session.messages || [])];
    
    // Actualizar UI del chat
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
        chatState.conversationHistory.forEach(msg => {
            if (msg.type === 'bot') {
                addBotMessage(msg.content, null, false, false);
            } else {
                addUserMessage(msg.content);
            }
        });
    }
    
    saveSessions();
    updateSessionUI();
    hideSessionMenu();
}

function renameSession(sessionId, newTitle) {
    const session = sessionManager.sessions.get(sessionId);
    if (session) {
        session.title = newTitle;
        session.updatedAt = Date.now();
        saveSessions();
        updateSessionUI();
    }
}

function duplicateSession(sessionId) {
    const originalSession = sessionManager.sessions.get(sessionId);
    if (!originalSession) return;
    
    const newSessionId = `sess_${sessionManager.nextId++}`;
    const duplicatedSession = {
        id: newSessionId,
        title: `${originalSession.title} (copia)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [...originalSession.messages]
    };
    
    sessionManager.sessions.set(newSessionId, duplicatedSession);
    saveSessions();
    updateSessionUI();
}

function archiveSession(sessionId) {
    if (sessionManager.sessions.size <= 1) {
        alert('No puedes archivar la última sesión');
        return;
    }
    
    sessionManager.sessions.delete(sessionId);
    
    // Si era la sesión actual, cambiar a otra
    if (sessionManager.currentSession === sessionId) {
        const firstSession = sessionManager.sessions.keys().next().value;
        if (firstSession) {
            switchToSession(firstSession);
        } else {
            createNewSession();
        }
    }
    
    saveSessions();
    updateSessionUI();
}

function updateSessionUI() {
    const currentSessionTitle = document.getElementById('currentSessionTitle');
    const sessionList = document.getElementById('sessionList');
    
    if (currentSessionTitle && sessionManager.currentSession) {
        const currentSession = sessionManager.sessions.get(sessionManager.currentSession);
        currentSessionTitle.textContent = currentSession?.title || 'Nueva sesión';
    }
    
    if (sessionList) {
        sessionList.innerHTML = '';
        sessionManager.sessions.forEach((session, id) => {
            const item = document.createElement('div');
            item.className = `session-item ${id === sessionManager.currentSession ? 'active' : ''}`;
            item.innerHTML = `
                <div class="session-item-title">${session.title}</div>
                <div class="session-item-meta">
                    <span>${new Date(session.updatedAt).toLocaleDateString()}</span>
                    <span>${session.messages.length} mensajes</span>
                </div>
            `;
            item.addEventListener('click', () => switchToSession(id));
            sessionList.appendChild(item);
        });
    }
}

function toggleSessionMenu() {
    const sessionMenu = document.getElementById('sessionMenu');
    const sessionMenuButton = document.getElementById('sessionMenuButton');
    
    if (sessionMenu && sessionMenuButton) {
        const isOpen = sessionMenu.classList.contains('show');
        
        if (isOpen) {
            hideSessionMenu();
        } else {
            showSessionMenu();
        }
    }
}

function showSessionMenu() {
    const sessionMenu = document.getElementById('sessionMenu');
    const sessionMenuButton = document.getElementById('sessionMenuButton');
    
    if (sessionMenu && sessionMenuButton) {
        sessionMenu.classList.add('show');
        sessionMenuButton.classList.add('active');
        updateSessionUI();
    }
}

function hideSessionMenu() {
    const sessionMenu = document.getElementById('sessionMenu');
    const sessionMenuButton = document.getElementById('sessionMenuButton');
    
    if (sessionMenu && sessionMenuButton) {
        sessionMenu.classList.remove('show');
        sessionMenuButton.classList.remove('active');
    }
}

function handleSessionAction(action) {
    const currentSessionId = sessionManager.currentSession;
    
    switch (action) {
        case 'new':
            createNewSession();
            hideSessionMenu();
            break;
            
        case 'rename':
            if (currentSessionId) {
                const currentSession = sessionManager.sessions.get(currentSessionId);
                const newTitle = prompt('Nuevo título para la sesión:', currentSession?.title || '');
                if (newTitle && newTitle.trim()) {
                    renameSession(currentSessionId, newTitle.trim());
                }
            }
            break;
            
        case 'duplicate':
            if (currentSessionId) {
                duplicateSession(currentSessionId);
            }
            break;
            
        case 'archive':
            if (currentSessionId && confirm('¿Estás seguro de que quieres archivar esta sesión?')) {
                archiveSession(currentSessionId);
                hideSessionMenu();
            }
            break;
    }
}

// Inicializar sistema de sesiones al cargar
document.addEventListener('DOMContentLoaded', () => {
    initializeSessionManager();
    setupResizableRight();
});

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
    // Navegación de sesiones
    showSessionsForTopic,
    openTopicSession,
    // Gestión de sesiones
    sessionManager,
    createNewSession,
    switchToSession,
    renameSession,
    duplicateSession,
    archiveSession
}; 

// Render del selector de sesiones/módulos dentro del menú
function renderSessionPicker() {
    const picker = document.getElementById('sessionPicker');
    if (!picker) return;
    const html = Object.entries(COURSE_SESSIONS).map(([num, s]) => `
        <button class=\"session-item\" data-session=\"${num}\" data-module=\"0\">\n            <span class=\"module-index\">S${num}</span>\n            <span class=\"module-title\">${s.title}</span>\n        </button>
    `).join('');
    picker.innerHTML = `<div class=\"module-list\">${html}</div>`;
}

// Barra de redimensionado del panel izquierdo
function setupResizableLeft() {
    const resizer = document.getElementById('leftResizer');
    if (!resizer) return;
    let startX = 0;
    let startWidth = 0;
    const onMove = (e) => {
        const delta = (e.clientX || (e.touches && e.touches[0].clientX) || 0) - startX;
        // Evitar solaparse con el panel derecho: ancho total minus right-col mín.
        const rightCol = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--right-col') || '360', 10);
        const maxByLayout = Math.max(220, Math.min(520, startWidth + delta));
        const maxAllowed = Math.min(maxByLayout, window.innerWidth - rightCol - 400); // deja espacio mínimo para el chat
        const newWidth = Math.max(220, maxAllowed);
        document.documentElement.style.setProperty('--left-col', newWidth + 'px');
        try { localStorage.setItem('ui_left_col', String(newWidth)); } catch(_) {}
    };
    const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onUp);
    };
    const onDown = (e) => {
        e.preventDefault();
        startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
        const leftCol = getComputedStyle(document.documentElement).getPropertyValue('--left-col').trim();
        startWidth = parseInt(leftCol || '300', 10);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onUp);
    };
    resizer.addEventListener('mousedown', onDown);
    resizer.addEventListener('touchstart', onDown, { passive: false });

    // Restaurar último ancho
    try {
        const saved = parseInt(localStorage.getItem('ui_left_col') || '0', 10);
        if (saved) document.documentElement.style.setProperty('--left-col', saved + 'px');
    } catch(_) {}
}

// Barra de redimensionado del panel derecho
function setupResizableRight() {
    const resizer = document.getElementById('rightResizer');
    if (!resizer) return;
    let startX = 0;
    let startWidth = 0;
    const onMove = (e) => {
        const x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
        // Como el resizer está en el borde interno, mover a la izquierda (x menor) debe AUMENTAR el ancho
        const delta = startX - x;
        const newWidth = Math.max(260, Math.min(520, startWidth + delta));
        document.documentElement.style.setProperty('--right-col', newWidth + 'px');
        try { localStorage.setItem('ui_right_col', String(newWidth)); } catch(_) {}
    };
    const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onUp);
    };
    const onDown = (e) => {
        e.preventDefault();
        startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
        const rightCol = getComputedStyle(document.documentElement).getPropertyValue('--right-col').trim();
        startWidth = parseInt(rightCol || '360', 10);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onUp);
    };
    resizer.addEventListener('mousedown', onDown);
    resizer.addEventListener('touchstart', onDown, { passive: false });

    // Restaurar último ancho
    try {
        const saved = parseInt(localStorage.getItem('ui_right_col') || '0', 10);
        if (saved) document.documentElement.style.setProperty('--right-col', saved + 'px');
    } catch(_) {}
}

// ===== Videos integrados en panel izquierdo =====
let currentVideo = null; // { label, url, id }
function setupVideoPicker() {
    try {
        // Toggle colapsable
        const sec = document.getElementById('videosSection');
        const btnToggle = document.getElementById('videosToggle');
        if (sec && btnToggle) {
            btnToggle.addEventListener('click', () => {
                const isOpen = sec.classList.toggle('open');
                btnToggle.setAttribute('aria-expanded', String(isOpen));
            });
        }

        // Botones de selección
        document.querySelectorAll('.video-select').forEach(btn => {
            btn.addEventListener('click', () => {
                const label = btn.getAttribute('data-video-label');
                const url = new URL(btn.getAttribute('data-video-url'));
                let id = url.searchParams.get('v');
                if (!id && url.pathname) { id = url.pathname.split('/').pop(); }
                currentVideo = { label, url: url.toString(), id };
                const mount = document.getElementById('leftVideoPlayerContainer');
                if (mount) {
                    mount.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}" allowfullscreen title="${label}"></iframe>`;
                    mount.classList.add('active');
                }
                // Habilitar el tile de resumen de video
                const tile = document.getElementById('videoSummaryTile');
                if (tile) tile.classList.remove('disabled');
                // Si ya hay una tarjeta de resumen abierta, refrescar su contenido
                const summaryCard = document.querySelector('.studio-card[data-kind="video-summary"]');
                if (summaryCard) {
                    const text = summaryCard.querySelector('#videoSummary');
                    if (text) text.textContent = 'Generando resumen con IA…';
                    EventBus.emit('ui:openVideo');
                }
            });
        });
 
        // Hook para botón de resumen desde el panel derecho
        const tile = document.getElementById('videoSummaryTile');
        if (tile) {
            tile.addEventListener('click', () => {
                // Abrir la tarjeta de resumen dentro del panel derecho
                EventBus.emit('ui:openVideo');
            });
        }

        // Toggle glosario en panel izquierdo
        const gsec = document.getElementById('glossarySection');
        const gtoggle = document.getElementById('glossaryToggle');
        if (gsec && gtoggle) {
            gtoggle.addEventListener('click', () => {
                const isOpen = gsec.classList.toggle('open');
                gtoggle.setAttribute('aria-expanded', String(isOpen));
                if (isOpen) renderLeftGlossary();
            });
        }

        // Livestream: Meet incrustado (si el navegador lo permite)
        const lsec = document.getElementById('livestreamSection');
        const ltoggle = document.getElementById('livestreamToggle');
        if (lsec && ltoggle) {
            ltoggle.addEventListener('click', () => {
                const isOpen = lsec.classList.toggle('open');
                ltoggle.setAttribute('aria-expanded', String(isOpen));
                if (isOpen) {
                    const liveMount = document.getElementById('leftLivestreamPlayer');
                    const notice = document.getElementById('livestreamNotice');
                    if (liveMount) {
                        liveMount.innerHTML = '';
                        liveMount.classList.add('active');
                        // Zoom Web Client (iframe a zoom.us/wc) — requiere meeting ID y passcode
                        // Para demo incrustamos el web client con parámetros que el host comparta (meeting id y pwd)
                        // Nota: Para producción se recomienda Zoom Web SDK con firma generada en backend
                        const meetingId = (window.ZOOM_MEETING_ID || '').replaceAll('-', '');
                        const pwd = window.ZOOM_MEETING_PWD || '';
                        if (!meetingId) {
                            if (notice) {
                                notice.style.display = 'block';
                                notice.textContent = 'Configura window.ZOOM_MEETING_ID y window.ZOOM_MEETING_PWD para cargar el Web Client de Zoom dentro de la app.';
                            }
                            return;
                        }
                        const zoomUrl = `https://zoom.us/wc/${meetingId}/join?pwd=${encodeURIComponent(pwd)}`;
                        const iframe = document.createElement('iframe');
                        iframe.src = zoomUrl;
                        iframe.allow = 'camera; microphone; display-capture; clipboard-write; autoplay; fullscreen;';
                        iframe.referrerPolicy = 'no-referrer';
                        iframe.style.width = '100%';
                        iframe.style.height = '100%';
                        iframe.style.border = '0';
                        // Intento cargar; si falla por X-Frame-Options, aviso
                        const timer = setTimeout(() => {
                            if (notice) {
                                notice.style.display = 'block';
                                notice.textContent = 'No se pudo cargar el cliente Web de Zoom embebido. Haz clic aquí para abrirlo en esta misma pestaña.';
                                notice.onclick = () => { window.location.href = zoomUrl; };
                            }
                        }, 2000);
                        iframe.onload = () => { clearTimeout(timer); if (notice) notice.style.display = 'none'; };
                        liveMount.appendChild(iframe);
                    }
                }
            });
        }
    } catch (_) {}
}

function renderLeftGlossary() {
    const mount = document.getElementById('glossaryLeftMount');
    if (!mount) return;
    mount.innerHTML = `
        <div class="glossary-header"><h5 style="margin:0">Glosario de Términos</h5></div>
        <div class="glossary-subtitle">Selecciona una letra:</div>
        <div class="alphabet-grid" id="gAlpha"></div>
        <div class="glossary-results" id="gResults"><div class="glossary-empty">Selecciona una letra</div></div>
    `;
    const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const gAlpha = mount.querySelector('#gAlpha');
    alpha.forEach(letter => {
        const b = document.createElement('button');
        b.className = 'alpha-btn'; b.textContent = letter;
        b.addEventListener('click', () => {
            const entries = GLOSSARY[letter] || [];
            const gRes = mount.querySelector('#gResults');
            if (!entries.length) {
                gRes.innerHTML = `<div class="glossary-empty">No hay términos para la letra ${letter}</div>`;
            } else {
                gRes.innerHTML = entries.map(e => `
                    <div class="glossary-item"><div class="term">${e.term}</div><div class="def">${e.def}</div></div>
                `).join('');
            }
        });
        gAlpha.appendChild(b);
    });
}

function setupAvatarLightbox() {
    const img = document.getElementById('botAvatarImg');
    const lightbox = document.getElementById('avatarLightbox');
    const lbImg = document.getElementById('avatarLightboxImg');
    const lbClose = document.getElementById('avatarLightboxClose');
    if (!img || !lightbox || !lbImg) return;
    const open = () => { lightbox.classList.add('show'); };
    const close = () => { lightbox.classList.remove('show'); };
    img.addEventListener('click', open);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox || e.target === lbClose) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}