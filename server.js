const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DEV_MODE = process.env.NODE_ENV !== 'production';

// Configuración de seguridad
app.disable('x-powered-by');
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com', 'https://source.zoom.us'],
            // En desarrollo permitimos inline scripts (onclick) para compatibilidad rápida
            scriptSrc: DEV_MODE ? ["'self'", "'unsafe-inline'", 'https://source.zoom.us'] : ["'self'", 'https://source.zoom.us'],
            // Permitir atributos inline (onclick) explícitamente en CSP nivel 3 durante desarrollo
            scriptSrcAttr: DEV_MODE ? ["'unsafe-inline'"] : [],
            // Permitir iframes de YouTube/Vimeo para reproducir videos
            frameSrc: [
                "'self'",
                'https://www.youtube.com',
                'https://www.youtube-nocookie.com',
                'https://player.vimeo.com',
                'https://meet.google.com',
                'https://meet.jit.si',
                'https://zoom.us',
                'https://*.zoom.us',
                'https://source.zoom.us'
            ],
            childSrc: [
                "'self'",
                'https://www.youtube.com',
                'https://www.youtube-nocookie.com',
                'https://player.vimeo.com',
                'https://meet.google.com',
                'https://meet.jit.si',
                'https://zoom.us',
                'https://*.zoom.us',
                'https://source.zoom.us'
            ],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'https://api.openai.com', 'https://api.assemblyai.com', 'https://meet.google.com', 'https://zoom.us', 'https://*.zoom.us', 'https://source.zoom.us'],
            mediaSrc: ["'self'", 'blob:', 'data:', 'https:'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://unpkg.com', 'data:'],
            frameAncestors: ["'none'"],
            objectSrc: ["'none'"]
        }
    },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'same-origin' },
    noSniff: true,
    xssFilter: true,
    hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false
}));

// Rate limiting para prevenir abuso
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por ventana
    message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
});
app.use('/api/', limiter);

// CORS configurado de forma segura
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.static('src'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Servir prompts para depuración/inspección (protegido por API en endpoints abajo)
app.use('/prompts', express.static(path.join(__dirname, 'prompts')));

// Carpeta temporal de audios (entradas del micro)
const tempDir = path.join(__dirname, 'tmp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

// Página de bienvenida (antes del inicio de sesión)
app.get('/', (req, res) => {
    try {
        // Intentar servir la nueva página de bienvenida primero
        const newWelcomePath = path.join(__dirname, 'src', 'welcome-new.html');
        if (fs.existsSync(newWelcomePath)) {
            res.sendFile(newWelcomePath);
        } else {
            res.sendFile(path.join(__dirname, 'src', 'welcome.html'));
        }
    } catch (_) {
        // Fallback en caso de que no exista la landing: redirigir a login
        res.redirect('/login/login.html');
    }
});

// Pool de conexiones a PostgreSQL
let pool;
if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
}

// Middleware de autenticación básica
function authenticateRequest(req, res, next) {
    if (DEV_MODE) return next();
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.API_SECRET_KEY) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    next();
}

// Verificación de origen/Referer para reducir CSRF cuando se usen cookies (defensa adicional)
function verifyOrigin(req, res, next) {
    try {
        const allowed = (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000']).map(o => o.trim());
        const origin = req.headers.origin || '';
        const referer = req.headers.referer || '';
        if (origin && !allowed.includes(origin)) return res.status(403).json({ error: 'Origen no permitido' });
        if (referer && !allowed.some(a => referer.startsWith(a))) return res.status(403).json({ error: 'Referer no permitido' });
        next();
    } catch (_) { next(); }
}
if (!DEV_MODE) app.use('/api/', verifyOrigin);

// Exigir cabecera AJAX personalizada en métodos inseguros para mitigar CSRF
function requireAjaxHeader(req, res, next) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const xr = req.headers['x-requested-with'];
    if (xr !== 'XMLHttpRequest') return res.status(403).json({ error: 'Solicitud no válida' });
    next();
}
if (!DEV_MODE) app.use('/api/', requireAjaxHeader);

// Sesiones temporales (hasta integrar BD)
const USER_JWT_SECRET = process.env.USER_JWT_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días
const sessions = new Map(); // userId -> { username, fp, exp }

function getFingerprint(req) {
    try {
        const ua = req.headers['user-agent'] || '';
        const lang = req.headers['accept-language'] || '';
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';
        return crypto.createHash('sha256').update(`${ua}|${lang}|${ip}`).digest('hex');
    } catch (_) {
        return '';
    }
}

function requireUserSession(req, res, next) {
    if (DEV_MODE) {
        req.user = { userId: 'dev-user-id', username: 'dev-user' };
        return next();
    }
    try {
        const auth = req.headers['authorization'] || '';
        const userId = req.headers['x-user-id'];
        if (!auth.startsWith('Bearer ') || !userId) {
            return res.status(401).json({ error: 'Sesión requerida' });
        }
        const token = auth.slice(7);
        const payload = jwt.verify(token, USER_JWT_SECRET);
        if (payload.sub !== userId) return res.status(401).json({ error: 'Token inválido' });
        const fpNow = getFingerprint(req);
        if (payload.fp && payload.fp !== fpNow) return res.status(401).json({ error: 'Dispositivo no autorizado' });
        const s = sessions.get(userId);
        if (!s || s.username !== payload.username || s.fp !== fpNow || s.exp < Date.now()) {
            return res.status(401).json({ error: 'Sesión expirada o inválida' });
        }
        // renovar TTL (deslizante)
        s.exp = Date.now() + SESSION_TTL_MS;
        sessions.set(userId, s);
        req.user = { userId, username: payload.username };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Sesión inválida' });
    }
}

// Utilidades para cargar prompts de /prompts
function safeRead(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (_) {
        return '';
    }
}

function getPrompts() {
    const base = path.join(__dirname, 'prompts');
    const system = safeRead(path.join(base, 'system.es.md'));
    const style = safeRead(path.join(base, 'style.es.md'));
    const tools = safeRead(path.join(base, 'tools.es.md'));
    const safety = safeRead(path.join(base, 'safety.es.md'));
    const examples = safeRead(path.join(base, 'examples.es.md'));
    const useCases = safeRead(path.join(base, 'use_cases.es.md'));
    const combined = [system, style, safety, tools, useCases]
        .filter(Boolean)
        .join('\n\n')
        .trim();
    return { system, style, tools, safety, useCases, examples, combined };
}

// Configuración de almacenamiento para audio (Multer)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname || '.webm') || '.webm';
        cb(null, `audio_${uuidv4()}${ext}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = ['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/wav', 'video/webm'];
        if (allowed.includes(file.mimetype)) return cb(null, true);
        cb(new Error('Tipo de archivo no permitido'));
    }
});

// ====== AssemblyAI: transcripción ======
app.post('/api/transcribe', authenticateRequest, requireUserSession, upload.single('audio'), async (req, res) => {
    try {
        const apiKey = process.env.ASSEMBLYAI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'ASSEMBLYAI_API_KEY no configurada' });
        // Soportar 2 modos: archivo (multipart) o URL pregrabada (JSON body { audio_url })
        let audioUrl = (req.body && req.body.audio_url) ? String(req.body.audio_url) : null;
        if (!audioUrl) {
            if (!req.file) return res.status(400).json({ error: 'Archivo de audio o audio_url requerido' });
            // 1) Subir el archivo binario a AssemblyAI
            const audioPath = path.join(uploadsDir, req.file.filename);
            const audioData = fs.readFileSync(audioPath);
            const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
                method: 'POST',
                headers: {
                    'authorization': apiKey,
                    'content-type': 'application/octet-stream'
                },
                body: audioData
            });
            if (!uploadRes.ok) {
                const t = await uploadRes.text();
                return res.status(500).json({ error: 'Fallo subiendo audio a AssemblyAI', details: t.slice(0,200) });
            }
            const uploadJson = await uploadRes.json();
            audioUrl = uploadJson.upload_url;
        }

        // 2) Crear trabajo de transcripción
        const transcribeRes = await fetch('https://api.assemblyai.com/v2/transcript', {
            method: 'POST',
            headers: {
                'authorization': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify({ audio_url: audioUrl, language_code: 'es' })
        });
        if (!transcribeRes.ok) {
            const t = await transcribeRes.text();
            return res.status(500).json({ error: 'Fallo creando transcripción', details: t.slice(0,200) });
        }
        const job = await transcribeRes.json();

        // 3) Polling simple hasta completar
        let status = job.status;
        let transcript = null;
        const endpoint = `https://api.assemblyai.com/v2/transcript/${job.id}`;
        const started = Date.now();
        while (status && ['queued','processing','submitted'].includes(status)) {
            if (Date.now() - started > 120000) break; // 2 min máx
            await new Promise(r=>setTimeout(r, 2500));
            const st = await fetch(endpoint, { headers: { 'authorization': apiKey } });
            const js = await st.json();
            status = js.status;
            if (status === 'completed') transcript = js.text;
            if (status === 'error') return res.status(500).json({ error: 'Transcripción falló', details: js.error });
        }
        if (!transcript) return res.status(202).json({ status: status || 'processing' });
        res.json({ text: transcript, status: 'completed' });
    } catch (err) {
        console.error('AssemblyAI error:', err);
        res.status(500).json({ error: 'Error transcribiendo audio', details: err.message });
    }
});

// Registro de usuarios (simple) — requiere BD
app.post('/api/register', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Base de datos no configurada' });
        }
        const { full_name, username, email, password } = req.body || {};
        if (!full_name || !username) {
            return res.status(400).json({ error: 'Nombre completo y usuario son requeridos' });
        }
        // Intentar detectar si existe la columna password_hash en users
        let hasPassword = false;
        try {
            const col = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash' LIMIT 1");
            hasPassword = col.rows.length > 0;
        } catch (_) {}

        let query, params;
        if (hasPassword && password) {
            // Hash básico (bcryptjs)
            const bcrypt = require('bcryptjs');
            const hash = await bcrypt.hash(String(password), 10);
            query = `INSERT INTO users (full_name, username, email, password_hash) VALUES ($1,$2,$3,$4) RETURNING id, username, full_name, email`;
            params = [full_name, username, email || null, hash];
        } else {
            query = `INSERT INTO users (full_name, username, email) VALUES ($1,$2,$3) RETURNING id, username, full_name, email`;
            params = [full_name, username, email || null];
        }

        const result = await pool.query(query, params);
        res.status(201).json({ user: result.rows[0] });
    } catch (error) {
        console.error('Error registrando usuario:', error);
        // Duplicado de username
        if (String(error.message||'').includes('duplicate')) {
            return res.status(409).json({ error: 'El usuario ya existe' });
        }
        res.status(500).json({ error: 'Error registrando usuario' });
    }
});

// Endpoint para subir audio (push-to-talk)
app.post('/api/audio/upload', authenticateRequest, requireUserSession, upload.single('audio'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Archivo de audio requerido' });
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ url: fileUrl, size: req.file.size, mimetype: req.file.mimetype });
    } catch (error) {
        console.error('Error subiendo audio:', error);
        res.status(500).json({ error: 'Error subiendo audio' });
    }
});

// Endpoint de salud para verificar configuración
app.get('/api/health', (req, res) => {
    try {
        const health = {
            ok: true,
            timestamp: new Date().toISOString(),
            modelEnUso: process.env.CHATBOT_MODEL || 'gpt-4o-mini',
            nodeVersion: process.version,
            env: process.env.NODE_ENV || 'development'
        };

        // Verificar configuración crítica (sin exponer valores)
        const checks = {
            openaiConfigured: !!process.env.OPENAI_API_KEY,
            databaseConfigured: !!process.env.DATABASE_URL,
            secretsConfigured: !!(process.env.API_SECRET_KEY && process.env.USER_JWT_SECRET)
        };

        health.checks = checks;
        health.allGreen = Object.values(checks).every(Boolean);

        res.json(health);
    } catch (error) {
        console.error('Error en health check:', error);
        res.status(500).json({ ok: false, error: 'Health check failed' });
    }
});

// Endpoint seguro para obtener configuración
app.get('/api/config', authenticateRequest, (req, res) => {
    try {
        // Solo devolver configuración no sensible
        const prompts = getPrompts();
        res.json({
            openaiModel: process.env.CHATBOT_MODEL || 'gpt-4o-mini',
            maxTokens: process.env.CHATBOT_MAX_TOKENS || 700,
            temperature: process.env.CHATBOT_TEMPERATURE || 0.7,
            audioEnabled: process.env.AUDIO_ENABLED === 'true',
            audioVolume: process.env.AUDIO_VOLUME || 0.7,
            prompts
        });
    } catch (error) {
        console.error('Error obteniendo configuración:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint seguro para obtener los prompts actuales
app.get('/api/prompts', authenticateRequest, (req, res) => {
    try {
        const prompts = getPrompts();
        res.json(prompts);
    } catch (error) {
        console.error('Error obteniendo prompts:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Emitir userId único + token (sin BD). El token está ligado a fingerprint del dispositivo
app.post('/api/auth/issue', authenticateRequest, (req, res) => {
    try {
        const { username } = req.body || {};
        if (!username || typeof username !== 'string' || username.trim().length < 3) {
            return res.status(400).json({ error: 'Usuario inválido' });
        }
        const userId = uuidv4();
        const fp = getFingerprint(req);
        const payload = { sub: userId, username: username.trim(), fp };
        const token = jwt.sign(payload, USER_JWT_SECRET, { expiresIn: '30d' });
        sessions.set(userId, { username: username.trim(), fp, exp: Date.now() + SESSION_TTL_MS });
        res.json({ userId, token, expiresInDays: 30 });
    } catch (error) {
        console.error('Error emitiendo sesión:', error);
        res.status(500).json({ error: 'Error emitiendo sesión' });
    }
});

// Endpoint seguro para llamadas a OpenAI
app.post('/api/openai', authenticateRequest, requireUserSession, async (req, res) => {
    try {
        const { prompt, context } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt requerido' });
        }

        // Validar que existe la API key de OpenAI
        if (!process.env.OPENAI_API_KEY) {
            console.error('OPENAI_API_KEY no configurada en variables de entorno');
            return res.status(500).json({ 
                error: 'Configuración de OpenAI faltante', 
                details: 'OPENAI_API_KEY no está configurada en el servidor' 
            });
        }

        const { combined, examples } = getPrompts();
        
        // System prompt robusto con fallback
        let systemContent = combined || `Eres un asistente educativo especializado en inteligencia artificial. 

Respondes preguntas sobre:
- Conceptos básicos de IA: prompt, LLM, token, fine-tuning, etc.
- Diferencias entre modelos (GPT, BERT, transformers)
- Ejemplos prácticos de IA
- Fundamentos de machine learning y deep learning

Siempre das respuestas educativas útiles, no genéricas. Si no tienes contexto específico, explicas el concepto básico y sugieres explorar el glosario o FAQ.`;

        // Añadir contexto si existe
        if (context && context.trim()) {
            systemContent += `\n\nContexto adicional de la base de datos:\n${context}`;
        }
        
        console.log('📝 System prompt length:', systemContent.length);
        console.log('🎯 User prompt:', prompt?.substring(0, 100) + '...');

        // Compatibilidad con Node < 18 (usar node-fetch si global.fetch no existe)
        let fetchImpl;
        if (typeof fetch !== 'undefined') {
            fetchImpl = fetch;
        } else {
            try {
                const nodeFetch = await import('node-fetch');
                fetchImpl = nodeFetch.default;
            } catch (error) {
                return res.status(500).json({ 
                    error: 'Fetch no disponible', 
                    details: 'Node.js < 18 requiere node-fetch instalado: npm install node-fetch' 
                });
            }
        }

        // Construcción de messages: system + examples (opcional) + user
        const messages = [
            {
                role: 'system',
                content: systemContent
            }
        ];

        // Añadir examples como system message adicional si existe
        if (examples && examples.trim()) {
            messages.push({
                role: 'system',
                content: `Ejemplos de estilo y formato:\n\n${examples.substring(0, 4000)}`
            });
        }

        // Mensaje del usuario (ya incluye [ÁMBITO] y contexto de BD)
        messages.push({
            role: 'user',
            content: prompt
        });

        const requestBody = {
            model: process.env.CHATBOT_MODEL || 'gpt-4o-mini',
            messages: messages,
            max_tokens: parseInt(process.env.CHATBOT_MAX_TOKENS) || 900,
            temperature: parseFloat(process.env.CHATBOT_TEMPERATURE) || 0.5,
            top_p: 0.9
        };

        console.log('🚀 OpenAI Request:', {
            model: requestBody.model,
            messages_count: messages.length,
            max_tokens: requestBody.max_tokens,
            temperature: requestBody.temperature
        });

        const response = await fetchImpl('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`Error OpenAI API ${response.status}:`, errText);
            return res.status(500).json({ 
                error: 'Error en la API de OpenAI', 
                details: `Status ${response.status}: ${errText.substring(0, 200)}` 
            });
        }

        const data = await response.json();
        console.log('📨 OpenAI Response:', {
            choices_count: data?.choices?.length || 0,
            usage: data?.usage || 'no usage data',
            has_content: !!data?.choices?.[0]?.message?.content
        });

        const content = data?.choices?.[0]?.message?.content;
        
        if (!content || content.trim() === '') {
            console.error('⚠️ Respuesta vacía de OpenAI. Full response:', JSON.stringify(data, null, 2));
            
            // Fallback directo si OpenAI no responde
            const fallbackResponse = `Lo siento, hubo un problema técnico con la respuesta. 

Sin embargo, puedo ayudarte con conceptos básicos de IA. Por ejemplo:
- **Prompt**: Es la instrucción o pregunta que le das a un modelo de IA
- **LLM**: Large Language Model, como GPT, que entiende y genera texto
- **Token**: Unidad básica de texto que procesa el modelo

¿Te gustaría explorar algún tema específico del curso de IA?`;
            
            return res.json({ response: fallbackResponse });
        }

        console.log('✅ Respuesta exitosa, longitud:', content.length);
        res.json({ response: content.trim() });
    } catch (error) {
        console.error('Error llamando a OpenAI:', error);
        res.status(500).json({ 
            error: 'Error procesando la solicitud', 
            details: error.message || String(error) 
        });
    }
});

// Endpoint seguro para consultas a la base de datos
app.post('/api/database', authenticateRequest, requireUserSession, async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Base de datos no configurada' });
        }

        const { query, params } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Query requerida' });
        }

        const result = await pool.query(query, params || []);
        res.json({ data: result.rows });
    } catch (error) {
        console.error('Error consultando base de datos:', error);
        res.status(500).json({ error: 'Error consultando la base de datos' });
    }
});

// Endpoint para obtener contexto de la base de datos con consultas optimizadas
app.post('/api/context', authenticateRequest, requireUserSession, async (req, res) => {
    try {
        if (!pool) {
            return res.json({ data: [] });
        }

        const { userQuestion } = req.body;
        
        if (!userQuestion || typeof userQuestion !== 'string') {
            return res.status(400).json({ error: 'userQuestion requerido como string' });
        }

        // Normalizar la pregunta del usuario para búsqueda
        const searchTerm = `%${userQuestion.toLowerCase().trim()}%`;
        
        // Query combinada para obtener contexto relevante de múltiples tablas
        const contextQuery = `
            -- Términos del glosario que coinciden
            SELECT 
                'glossary' as source,
                g.id,
                null as session_id,
                null as session_title,
                g.term,
                g.definition,
                null as question,
                null as answer,
                null as title,
                null as description,
                null as text,
                length(g.term) as relevance_score
            FROM public.glossary_term g
            WHERE LOWER(g.term) ILIKE $1 
               OR LOWER(g.definition) ILIKE $1
            
            UNION ALL
            
            -- FAQs de sesiones
            SELECT 
                'faq' as source,
                f.id,
                f.session_id,
                cs.title as session_title,
                null as term,
                null as definition,
                f.question,
                f.answer,
                null as title,
                null as description,
                null as text,
                length(f.question) + length(f.answer) as relevance_score
            FROM public.session_faq f
            JOIN public.course_session cs ON f.session_id = cs.id
            WHERE LOWER(f.question) ILIKE $1 
               OR LOWER(f.answer) ILIKE $1
            
            UNION ALL
            
            -- Actividades de sesiones
            SELECT 
                'activity' as source,
                a.id,
                a.session_id,
                cs.title as session_title,
                null as term,
                null as definition,
                null as question,
                null as answer,
                a.title,
                a.description,
                null as text,
                length(a.title) + COALESCE(length(a.description), 0) as relevance_score
            FROM public.session_activity a
            JOIN public.course_session cs ON a.session_id = cs.id
            WHERE LOWER(a.title) ILIKE $1 
               OR LOWER(a.description) ILIKE $1
            
            UNION ALL
            
            -- Preguntas de sesiones
            SELECT 
                'question' as source,
                q.id,
                q.session_id,
                cs.title as session_title,
                null as term,
                null as definition,
                null as question,
                null as answer,
                null as title,
                null as description,
                q.text,
                length(q.text) as relevance_score
            FROM public.session_question q
            JOIN public.course_session cs ON q.session_id = cs.id
            WHERE LOWER(q.text) ILIKE $1
            
            ORDER BY relevance_score DESC, source
            LIMIT 8
        `;

        const result = await pool.query(contextQuery, [searchTerm]);
        
        // Formatear los resultados según el tipo
        const formattedData = result.rows.map(row => {
            const base = {
                source: row.source,
                id: row.id,
                session_id: row.session_id,
                session_title: row.session_title
            };

            switch (row.source) {
                case 'glossary':
                    return {
                        ...base,
                        term: row.term,
                        definition: row.definition
                    };
                case 'faq':
                    return {
                        ...base,
                        question: row.question,
                        answer: row.answer
                    };
                case 'activity':
                    return {
                        ...base,
                        title: row.title,
                        description: row.description
                    };
                case 'question':
                    return {
                        ...base,
                        text: row.text
                    };
                default:
                    return base;
            }
        });

        res.json({ data: formattedData });
    } catch (error) {
        console.error('Error consultando contexto de BD:', error);
        res.status(500).json({ 
            error: 'Error consultando contexto', 
            details: error.message 
        });
    }
});

// Función para obtener prompts del sistema

// Middleware de manejo de errores
app.use((error, req, res, next) => {
    console.error('Error no manejado:', error);
    if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Middleware para rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Lia IA — servidor iniciado en puerto ${PORT}`);
    console.log(`🔒 Modo: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
