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

// Configuración de seguridad
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.openai.com"],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:']
        }
    }
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

// Redirigir la raíz al inicio de sesión
app.get('/', (req, res) => {
    res.redirect('/login/login.html');
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
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.API_SECRET_KEY) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    next();
}

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
    const combined = [system, style, safety, tools]
        .filter(Boolean)
        .join('\n\n')
        .trim();
    return { system, style, tools, safety, examples, combined };
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

// Endpoint para subir audio (push-to-talk)
app.post('/api/audio/upload', authenticateRequest, upload.single('audio'), (req, res) => {
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

// Endpoint seguro para obtener configuración
app.get('/api/config', authenticateRequest, (req, res) => {
    try {
        // Solo devolver configuración no sensible
        const prompts = getPrompts();
        res.json({
            openaiModel: process.env.CHATBOT_MODEL || 'gpt-4',
            maxTokens: process.env.CHATBOT_MAX_TOKENS || 1000,
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

        const { combined, examples } = getPrompts();
        const systemContent = (
            (combined || `Eres un asistente educativo en español.`) +
            (context ? `\n\nContexto adicional (BD/UI):\n${context}` : '')
        ).trim();

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: process.env.CHATBOT_MODEL || 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: systemContent
                    },
                    ...(examples ? [{ role: 'system', content: `Ejemplos de estilo:\n\n${examples.substring(0, 4000)}` }] : []),
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: parseInt(process.env.CHATBOT_MAX_TOKENS) || 1000,
                temperature: parseFloat(process.env.CHATBOT_TEMPERATURE) || 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`Error en la API de OpenAI: ${response.status}`);
        }

        const data = await response.json();
        res.json({ response: data.choices[0].message.content });
    } catch (error) {
        console.error('Error llamando a OpenAI:', error);
        res.status(500).json({ error: 'Error procesando la solicitud' });
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

// Endpoint para obtener contexto de la base de datos
app.post('/api/context', authenticateRequest, requireUserSession, async (req, res) => {
    try {
        if (!pool) {
            return res.json({ data: [] });
        }

        const { userQuestion } = req.body;
        
        if (!userQuestion) {
            return res.json({ data: [] });
        }

        const query = `
            SELECT * FROM course_content 
            WHERE content_type IN ('topic', 'exercise', 'concept')
            AND (content ILIKE $1 OR tags @> $2)
            ORDER BY difficulty_level
            LIMIT 5
        `;
        
        const result = await pool.query(query, [`%${userQuestion}%`, [userQuestion.toLowerCase()]]);
        res.json({ data: result.rows });
    } catch (error) {
        console.error('Error obteniendo contexto:', error);
        res.json({ data: [] });
    }
});

// Middleware de manejo de errores
app.use((error, req, res, next) => {
    console.error('Error no manejado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Middleware para rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor seguro iniciado en puerto ${PORT}`);
    console.log(`🔒 Modo: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
