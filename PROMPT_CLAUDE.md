Objetivo
Deja el chatbot respondiendo con OpenAI en menos de una iteración. Si algo falla, imprime el motivo exacto y aplica un fallback visible. Amplía los casos de uso para que el agente responda preguntas de curso y conceptos básicos de IA aunque no haya contexto de BD.
Contexto técnico
Front: src/scripts/main.js (construye prompt, llama a /api/config, /api/openai, /api/context). Añade bloque [ÁMBITO] y contexto BD si llega.
Back: server.js (Express). Endpoints:
POST /api/openai → llama OpenAI (CHATBOT_MODEL || 'gpt-4o-mini', max_tokens ~700, temp 0.6, top_p 0.9).
POST /api/context → traer contexto de BD (DATABASE_URL en .env).
GET /api/config → devuelve prompts y config.
Prompts: prompts/system.es.md, style.es.md, safety.es.md, tools.es.md, use_cases.es.md, examples.es.md (se concatenan).
Sesión: /api/auth/issue emite userId y token; el front manda X-API-Key, Authorization, X-User-Id y X-Requested-With en todas las requests.
Problema: Bot responde con plantilla o nada.
Lo que debes hacer
1) Diagnóstico y logs útiles
En server.js /api/openai: si falta OPENAI_API_KEY o la request a OpenAI falla, devuelve 500 con details (texto de error de OpenAI). Si Node < 18, usa node-fetch.
Agrega GET /api/health que devuelva { ok: true, model: usado, haveKey: !!OPENAI_API_KEY }.
2) Robustecer /api/openai
Construye messages:
system: concatena system + style + safety + tools + use_cases; examples como system opcional (recortado a 3‑4K).
user: prompt del front (trae [ÁMBITO] + contexto).
Parámetros:
model: process.env.CHATBOT_MODEL || 'gpt-4o-mini'
max_tokens: parseInt(process.env.CHATBOT_MAX_TOKENS) || 700
temperature: parseFloat(process.env.CHATBOT_TEMPERATURE) || 0.6
top_p: 0.9
Si la respuesta llega vacía, devuélvela igual, pero loggea el payload de OpenAI en consola para inspección.
3) Ampliar “Casos de Uso” (prompts/use_cases.es.md)
Dentro de alcance: además de temario, permitir definiciones básicas de IA, ejemplos cortos, diferencias entre modelos, qué es “prompt”, “LLM”, “token”, etc., y dudas comunes de onboarding, aunque no haya contexto de BD.
Fuera de alcance: conversación personal prolongada, temas ajenos; reconducir con 2–4 opciones (Temas, Ejercicios, FAQ, Glosario).
Explícito: si no hay contexto BD, responder igual con explicación corta + sugerir ver glosario/FAQ.
4) Endpoint /api/context con BD (rápido y seguro)
Parametriza consultas y devuelve máximo 5–8 entradas combinadas de:
glossary_term (term, definition)
session_faq (question, answer) JOIN course_session
session_activity (title, description) JOIN course_session
session_question (text) JOIN course_session
Si DATABASE_URL no está, responde { data: [] } sin error.
5) Front: src/scripts/main.js
Verifica que todas las llamadas lleven cabeceras: X-API-Key, Authorization, X-User-Id, X-Requested-With.
processUserMessageWithAI:
Llama primero /api/context; añade “Contexto adicional” si hay data.
Si /api/openai responde 500, muestra el details en consola y al usuario “Hubo un problema temporal. Reintenta.” sin plantillas.
Reduce/elimina cualquier mensaje fijo tipo “Me gusta tu curiosidad…”.
6) .env ejemplo (sin valores reales)
OPENAI_API_KEY=sk-...
CHATBOT_MODEL=gpt-4o-mini
CHATBOT_MAX_TOKENS=700
CHATBOT_TEMPERATURE=0.6
DATABASE_URL=postgres://user:pass@host:5432/dbname
API_SECRET_KEY=dev-key
USER_JWT_SECRET=dev-jwt-secret
ALLOWED_ORIGINS=http://localhost:3000
NODE_ENV=development
7) Entrega exacta
Edits por archivo (server.js y src/scripts/main.js) con bloques de código listos para pegar.
SQL parametrizado de /api/context.
Pasos de prueba:
curl a /api/health
DevTools → Network: /api/openai debe devolver 200 con “response”.
Prueba “¿Qué significa prompt?” → respuesta real.
Prueba “FAQ sesión 1” → mezcla contexto BD + explicación.
8) Criterio de éxito
El chatbot responde con definiciones reales y útiles aunque no haya BD.
Si BD está disponible, enriquece.
No hay mensajes genéricos; cualquier fallo devuelve details para depurar.
Notas
Sé pragmático: si detectas que los prompts son muy restrictivos, ajusta use_cases para permitir definiciones básicas, ejemplos, y explicación de términos clave sin necesidad de contexto.
Si la respuesta de OpenAI se queda corta, sube max_tokens a 900 y baja temperature a 0.5.
Por favor, entrega los edits concretos ya listos para aplicar y una breve explicación de por qué no respondía (encadenamiento de prompts, error de API, headers faltantes, etc.).
Si tienes que importar librerias como en algun proyecto de python o asi para este proyecto tu hazlo pero que ya me funcione mi IA 
