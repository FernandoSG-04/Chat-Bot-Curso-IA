const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de seguridad
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.openai.com"]
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

// Endpoint seguro para obtener configuración
app.get('/api/config', authenticateRequest, (req, res) => {
    try {
        // Solo devolver configuración no sensible
        res.json({
            openaiModel: process.env.CHATBOT_MODEL || 'gpt-4',
            maxTokens: process.env.CHATBOT_MAX_TOKENS || 1000,
            temperature: process.env.CHATBOT_TEMPERATURE || 0.7,
            audioEnabled: process.env.AUDIO_ENABLED === 'true',
            audioVolume: process.env.AUDIO_VOLUME || 0.7
        });
    } catch (error) {
        console.error('Error obteniendo configuración:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint seguro para llamadas a OpenAI
app.post('/api/openai', authenticateRequest, async (req, res) => {
    try {
        const { prompt, context } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt requerido' });
        }

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
                        content: `Eres un asistente educativo especializado en inteligencia artificial. 
                        Responde en español de manera clara, amigable y educativa. 
                        Contexto adicional: ${context || ''}`
                    },
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
app.post('/api/database', authenticateRequest, async (req, res) => {
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
app.post('/api/context', authenticateRequest, async (req, res) => {
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
