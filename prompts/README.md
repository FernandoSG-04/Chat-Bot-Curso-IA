# Prompts del Agente de IA

Carpeta con los prompts fuente para el asistente. Están pensados para un agente educativo en español, alineado al flujo y UI del chat (escritura simulada, edición del último mensaje para menús, glosario lateral, push‑to‑talk, etc.).

## Archivos

- `system.es.md`: Prompt de sistema principal (identidad, objetivos, reglas).
- `style.es.md`: Guía de estilo de respuestas (tono, formato, longitud, emojis).
- `tools.es.md`: Cómo coordinarse con las funciones del front/backend (sin invocar código, solo describiendo lo necesario).
- `safety.es.md`: Reglas de seguridad y cumplimiento.
- `examples.es.md`: Ejemplos de diálogos (few‑shot) para calibrar el tono.

## Uso

1) Copia y pega el contenido de `system.es.md` como mensaje de sistema al inicializar la conversación del agente.
2) Concátale (si quieres) fragmentos de `style.es.md`, `tools.es.md` y `safety.es.md`.
3) Para respuestas de ejemplo o pruebas de regresión, usa `examples.es.md`.

Sugerencia: puedes cargar estos archivos en el servidor y generar el mensaje de sistema dinámicamente, o mantenerlos aquí como documentación de referencia y pegar el texto en la configuración del proveedor de IA.


