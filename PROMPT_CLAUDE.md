Objetivo
Necesito que verifiques e implementes la conexión completa entre mi frontend y el backend con OpenAI para que el agente de IA responda mensajes reales en mi chatbot web. Ya tengo prompts del agente, seguridad y la UI funcionando, pero las respuestas están saliendo genéricas o vacías. Quiero que ajustes/validez la integración y me devuelvas pasos y código concretos para que funcione de inmediato.
Contexto del proyecto
Frontend: HTML/CSS/JS vanilla. Archivo principal del chat: src/scripts/main.js
Backend: Node.js/Express en server.js
Paleta y UI ya unificadas; hay paneles laterales (glosario y copiar prompts).
Seguridad:
API interna usa cabeceras: X-API-Key, Authorization: Bearer <token>, X-User-Id (en dev están relajadas).
Rate limiting, Helmet, verificación de origen (en prod).
Sesiones: endpoint /api/auth/issue (temporal, sin BD) emite userId y token ligados a fingerprint.
Prompts del agente en prompts/: system.es.md, style.es.md, tools.es.md, safety.es.md, use_cases.es.md, examples.es.md
Endpoints clave:
GET /api/config → devuelve prompts y config
POST /api/openai → llama a OpenAI y responde { response: string }
POST /api/context → obtiene contexto de BD si está configurada
Model por defecto en dev: gpt-4o-mini (puede venir de env CHATBOT_MODEL). max_tokens ~700, temperature 0.7, top_p 0.9
El frontend construye el prompt con un bloque [ÁMBITO] para limitar alcance al curso y añade el contexto de BD cuando existe.
Qué necesito que hagas (instrucciones para Claude)
1) Validar y, si hace falta, corregir el flujo de autenticación:
En login (src/login/login.js), tras credenciales válidas, se llama a /api/auth/issue y se guardan userId y authToken.
Front debe incluir en TODAS las llamadas:
X-API-Key (usa sessionStorage apiKey que ya generamos)
Authorization: Bearer <token>
X-User-Id: <userId>
Verifica que src/scripts/main.js añade correctamente esas cabeceras en /api/openai, /api/context, /api/config. Si falta en alguna, añade.
2) Revisar la llamada real a OpenAI en server.js (POST /api/openai):
Asegúrate de que:
Usa fetch compatible en Node (node-fetch si Node < 18).
Lee OPENAI_API_KEY de .env y falla explícito si falta.
Monta messages con:
system: prompts combinados (system+style+safety+tools+use_cases+context opcional+examples como system extra)
user: el prompt recibido
Parámetros: model (CHATBOT_MODEL por env, default gpt-4o-mini), max_tokens ≈ 700–900, temperature 0.5–0.7, top_p 0.9–0.95.
Si response.ok es false: devuelve el texto de error para depurar.
Devuelve en JSON { response: content } usando data?.choices?.[0]?.message?.content.
3) Revisar construcción del prompt en el front (src/scripts/main.js > processUserMessageWithAI):
Añade/valida bloque ÁMBITO (responder solo sobre el curso; reconducir fuera de alcance).
Asegura que “contextInfo” de BD se concatena cuando /api/context devuelve data.
Devuelve la respuesta del backend tal cual; sin plantillas fijas.
4) Entregarme:
Código exacto (edits) a aplicar si detectas fallos.
Pasos de verificación (en DevTools → Network) para comprobar que /api/openai devuelve 200 y ver el JSON con “response”.
Un ejemplo de .env (sin claves reales) con:
OPENAI_API_KEY, CHATBOT_MODEL, CHATBOT_MAX_TOKENS, CHATBOT_TEMPERATURE, API_SECRET_KEY, USER_JWT_SECRET, ALLOWED_ORIGINS, NODE_ENV.
Recomendaciones de fallback si OpenAI falla (mensaje claro + permitir reintento).
Criterio de éxito
Enviar “¿Qué significa prompt?” y recibir respuesta real, específica y educativa (no plantillas).
Si hay error, el JSON de /api/openai incluye “details” con el mensaje para depurar.
Mantener seguridad y límites del agente (use_cases) activos.
Nota
Puedo compartirte server.js y src/scripts/main.js si quieres proponer edits concretos. El stack ya está preparado para prompts y seguridad; solo necesito que garantices la respuesta real de OpenAI y ajustes mínimos para que no haya silencios ni mensajes genéricos.