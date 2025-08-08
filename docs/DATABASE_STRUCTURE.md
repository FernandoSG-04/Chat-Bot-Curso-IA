# 🗄️ Estructura de Base de Datos para el Chatbot Educativo

## 📋 Descripción General

El chatbot educativo utiliza una base de datos PostgreSQL para almacenar y recuperar información relevante sobre el curso de inteligencia artificial. Esta información se utiliza para proporcionar respuestas más precisas y contextualizadas.

## 🏗️ Estructura de Tablas Requeridas

### 1. Tabla `course_content`

Almacena todo el contenido del curso organizado por tipos.

```sql
CREATE TABLE course_content (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- 'topic', 'exercise', 'concept', 'faq'
    content TEXT NOT NULL,
    difficulty_level VARCHAR(20), -- 'beginner', 'intermediate', 'advanced'
    category VARCHAR(100), -- 'fundamentals', 'ml', 'deep_learning', 'applications'
    tags TEXT[], -- Array de tags para búsqueda
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Tabla `users`

Almacena información de los usuarios del chatbot.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Tabla `conversations`

Almacena el historial de conversaciones.

```sql
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    message_type VARCHAR(20) NOT NULL, -- 'user', 'bot'
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(100)
);
```

### 4. Tabla `topics`

Almacena información específica sobre temas del curso.

```sql
CREATE TABLE topics (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    difficulty_level VARCHAR(20),
    prerequisites TEXT[],
    estimated_duration INTEGER, -- en minutos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Tabla `exercises`

Almacena ejercicios y actividades prácticas.

```sql
CREATE TABLE exercises (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT NOT NULL,
    difficulty_level VARCHAR(20),
    category VARCHAR(100),
    estimated_time INTEGER, -- en minutos
    solution_hints TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6. Tabla `faqs`

Almacena preguntas frecuentes y sus respuestas.

```sql
CREATE TABLE faqs (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 📊 Datos de Ejemplo

### Contenido del Curso

```sql
-- Insertar temas fundamentales
INSERT INTO course_content (title, content_type, content, difficulty_level, category, tags) VALUES
('¿Qué es la Inteligencia Artificial?', 'topic', 'La inteligencia artificial es un campo de la informática que busca crear sistemas capaces de realizar tareas que normalmente requieren inteligencia humana...', 'beginner', 'fundamentals', ARRAY['IA', 'fundamentos', 'definición']),
('Machine Learning Básico', 'topic', 'Machine Learning es una rama de la IA que permite a las computadoras aprender sin ser programadas explícitamente...', 'intermediate', 'ml', ARRAY['ML', 'aprendizaje', 'algoritmos']),
('Redes Neuronales', 'topic', 'Las redes neuronales artificiales son modelos computacionales inspirados en el cerebro humano...', 'advanced', 'deep_learning', ARRAY['neural networks', 'deep learning', 'redes']);

-- Insertar ejercicios
INSERT INTO exercises (title, description, instructions, difficulty_level, category, estimated_time) VALUES
('Implementar un Clasificador Simple', 'Crea un clasificador básico usando scikit-learn', '1. Importa las librerías necesarias\n2. Carga un dataset de ejemplo\n3. Divide los datos en entrenamiento y prueba\n4. Entrena un modelo de clasificación\n5. Evalúa el rendimiento', 'beginner', 'ml', 30),
('Análisis Exploratorio de Datos', 'Realiza un análisis completo de un dataset', '1. Carga el dataset\n2. Explora la estructura de los datos\n3. Identifica valores faltantes\n4. Crea visualizaciones\n5. Genera estadísticas descriptivas', 'intermediate', 'data_analysis', 45);

-- Insertar FAQs
INSERT INTO faqs (question, answer, category, tags) VALUES
('¿Qué es el overfitting?', 'El overfitting ocurre cuando un modelo se ajusta demasiado a los datos de entrenamiento y no generaliza bien a nuevos datos...', 'ml', ARRAY['overfitting', 'generalización', 'modelos']),
('¿Cuál es la diferencia entre IA y ML?', 'La IA es un campo más amplio que incluye cualquier técnica que permita a las máquinas simular inteligencia...', 'fundamentals', ARRAY['IA', 'ML', 'diferencias']);
```

## 🔍 Consultas Útiles

### Buscar Contenido por Palabras Clave

```sql
SELECT * FROM course_content 
WHERE content_type = 'topic' 
AND (content ILIKE '%machine learning%' OR tags @> ARRAY['ml'])
ORDER BY difficulty_level;
```

### Obtener Ejercicios por Nivel

```sql
SELECT title, description, estimated_time 
FROM exercises 
WHERE difficulty_level = 'beginner' 
AND category = 'ml'
ORDER BY estimated_time;
```

### Buscar FAQs Relevantes

```sql
SELECT question, answer 
FROM faqs 
WHERE question ILIKE '%overfitting%' 
OR tags @> ARRAY['overfitting'];
```

## 🚀 Implementación

### 1. Conexión a la Base de Datos

```javascript
// Ejemplo de conexión usando pg (Node.js)
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
```

### 2. Consultas Asíncronas

```javascript
async function getCourseContent(searchTerm) {
    const query = `
        SELECT * FROM course_content 
        WHERE content ILIKE $1 
        OR tags @> $2
        ORDER BY difficulty_level
    `;
    
    const result = await pool.query(query, [`%${searchTerm}%`, [searchTerm]]);
    return result.rows;
}
```

## 📝 Notas Importantes

### Seguridad
- **Credenciales**: Nunca exponer las credenciales de la base de datos en el código frontend
- **Consultas**: Usar consultas parametrizadas para evitar inyección SQL
- **Permisos**: Configurar permisos mínimos necesarios para la aplicación

### Rendimiento
- **Índices**: Crear índices en columnas frecuentemente consultadas
- **Caché**: Implementar caché para consultas frecuentes
- **Paginación**: Usar paginación para grandes conjuntos de datos

### Escalabilidad
- **Conexiones**: Usar pools de conexiones para manejar múltiples usuarios
- **Monitoreo**: Implementar logging y monitoreo de consultas
- **Backup**: Configurar backups regulares de la base de datos

## 🔄 Próximos Pasos

1. **Crear las tablas** en la base de datos PostgreSQL
2. **Insertar datos de ejemplo** para probar la funcionalidad
3. **Implementar las consultas** en el código del chatbot
4. **Configurar índices** para optimizar el rendimiento
5. **Probar la integración** con OpenAI

---

*Documentación actualizada: Diciembre 2024*
