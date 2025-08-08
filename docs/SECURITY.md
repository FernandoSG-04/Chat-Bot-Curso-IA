# 🔒 Guía de Seguridad del Chatbot Educativo

## 📋 Descripción General

Este documento describe las medidas de seguridad implementadas para proteger las credenciales, APIs y datos del chatbot educativo.

## 🛡️ Medidas de Seguridad Implementadas

### 1. **Protección de Credenciales**

#### Variables de Entorno
- ✅ Todas las credenciales se almacenan en variables de entorno
- ✅ Archivo `.env` incluido en `.gitignore`
- ✅ No se exponen claves en el código fuente
- ✅ Uso de `.env.example` para documentación

#### Configuración Segura
```bash
# Variables de entorno requeridas
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=your_database_url_here
API_SECRET_KEY=your-api-secret-key-here
SESSION_SECRET=your-session-secret-here
```

### 2. **Backend Seguro**

#### Autenticación
- ✅ Middleware de autenticación con API keys
- ✅ Validación de headers de seguridad
- ✅ Rate limiting para prevenir abuso
- ✅ CORS configurado de forma segura

#### Endpoints Protegidos
```javascript
// Todos los endpoints requieren autenticación
app.get('/api/config', authenticateRequest, ...)
app.post('/api/openai', authenticateRequest, ...)
app.post('/api/database', authenticateRequest, ...)
app.post('/api/context', authenticateRequest, ...)
```

### 3. **Protección Frontend**

#### Claves Dinámicas
- ✅ No se almacenan claves en el frontend
- ✅ Uso de sessionStorage para claves temporales
- ✅ Claves generadas dinámicamente por sesión
- ✅ Comunicación segura con el backend

#### Headers de Seguridad
```javascript
headers: {
    'Content-Type': 'application/json',
    'X-API-Key': getApiKey(),
    'X-Requested-With': 'XMLHttpRequest'
}
```

### 4. **Configuración de Helmet**

#### Content Security Policy
```javascript
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
```

### 5. **Rate Limiting**

#### Protección contra Abuso
```javascript
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por ventana
    message: 'Demasiadas solicitudes desde esta IP'
});
```

## 🚨 Medidas de Seguridad Críticas

### 1. **Nunca Exponer Credenciales**

#### ❌ Incorrecto
```javascript
// NUNCA hacer esto
const apiKey = 'your-actual-api-key-here';
```

#### ✅ Correcto
```javascript
// Usar variables de entorno
const apiKey = process.env.OPENAI_API_KEY;
```

### 2. **Validación de Entrada**

#### Sanitización
```javascript
// Validar y sanitizar todas las entradas
function sanitizeInput(input) {
    return input.replace(/[<>]/g, '');
}
```

### 3. **Consultas SQL Seguras**

#### Parametrización
```javascript
// Usar consultas parametrizadas
const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [userId]
);
```

## 🔐 Configuración de Producción

### 1. **Variables de Entorno de Producción**

```bash
# Configuración de producción
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://yourdomain.com
API_SECRET_KEY=your-super-secure-api-key
SESSION_SECRET=your-super-secure-session-secret
```

### 2. **Configuración de CORS**

```javascript
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS.split(','),
    credentials: true
}));
```

### 3. **Headers de Seguridad**

```javascript
// Headers adicionales de seguridad
app.use(helmet({
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    noSniff: true,
    xssFilter: true
}));
```

## 🛠️ Implementación de Seguridad

### 1. **Instalación de Dependencias**

```bash
npm install helmet express-rate-limit cors dotenv
```

### 2. **Configuración del Servidor**

```javascript
// server.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
require('dotenv').config();
```

### 3. **Middleware de Seguridad**

```javascript
// Aplicar middleware de seguridad
app.use(helmet());
app.use(rateLimit());
app.use(cors());
```

## 🔍 Auditoría de Seguridad

### 1. **Verificación de Credenciales**

- ✅ No hay claves hardcodeadas en el código
- ✅ Variables de entorno configuradas correctamente
- ✅ Archivo `.env` en `.gitignore`

### 2. **Verificación de Endpoints**

- ✅ Todos los endpoints requieren autenticación
- ✅ Rate limiting implementado
- ✅ CORS configurado correctamente

### 3. **Verificación de Base de Datos**

- ✅ Consultas parametrizadas
- ✅ Conexión SSL configurada
- ✅ Permisos mínimos necesarios

## 🚀 Despliegue Seguro

### 1. **Configuración de Variables de Entorno**

```bash
# En el servidor de producción
export OPENAI_API_KEY="your-actual-key"
export DATABASE_URL="your-actual-db-url"
export API_SECRET_KEY="your-actual-api-key"
```

### 2. **Configuración de HTTPS**

```javascript
// Redirigir HTTP a HTTPS
app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
        res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
        next();
    }
});
```

### 3. **Monitoreo de Seguridad**

```javascript
// Logging de eventos de seguridad
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
    next();
});
```

## 📞 Contacto de Seguridad

Si encuentras alguna vulnerabilidad de seguridad, por favor:

1. **NO** la reportes públicamente
2. Contacta al equipo de desarrollo de forma privada
3. Proporciona detalles específicos sobre la vulnerabilidad
4. Espera confirmación antes de hacer público

## 🔄 Actualizaciones de Seguridad

### Versión 1.0.0 (Diciembre 2024)
- ✅ Implementación inicial de medidas de seguridad
- ✅ Protección de credenciales con variables de entorno
- ✅ Backend seguro con autenticación
- ✅ Rate limiting y CORS configurado
- ✅ Headers de seguridad con Helmet

---

*Documentación actualizada: Diciembre 2024*
