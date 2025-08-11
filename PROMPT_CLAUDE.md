

Rediseño UI — migrar a formato tipo NotebookLM (cambio abismal)
- Objetivo: reemplazar la UI estilo Telegram (teclado inline y botones "Temas del Curso / Ejercicios / Ayuda / Glosario") por una interfaz de 3 paneles, inspirada en NotebookLM, manteniendo el chat en el centro.
- Branding: el asistente se llama "COACH IA" y usará la guía de UX/UI unificada (paleta, tipografías, tokens) ya definida en este documento.

Estructura final
- Panel izquierdo (Navegación y herramientas de aprendizaje):
  - Copiar Prompts, Ver Videos, Cuestionarios, Preguntas Frecuentes, Datasets/Mini‑proyectos, Configuración rápida.
  - Estados: colapsable, ancho 280–320 px, iconos outline (Turquesa IA) y etiquetas.
- Panel central (Chat principal):
  - Área de conversación con COACH IA; soporte para mensajes largos, bloques de código, listas, y tarjetas de acciones contextuales.
  - Cabecera con título y estado (en línea / escribiendo), input con micrófono/enviar, accesos a acciones contextuales.
- Panel derecho (Studio):
  - Notas (markdown), Glosario lateral, Resumen de audio, Resumen de video, Mapas mentales, Informes (reportes PDF/MD), Historial.
  - Cada herramienta abre un módulo en tarjetas dentro de este panel. Deben poder leer del chat y del contexto de BD.

Interacciones clave
- Al seleccionar una herramienta en el panel izquierdo, el centro NO se recarga; se envía un evento (pub/sub simple) que actualiza el panel derecho o agrega una tarjeta al Studio.
- Desde el chat, COACH IA puede sugerir acciones (p. ej., "Enviar a Notas", "Crear Informe", "Resumir audio"). Esas acciones crean tarjetas en el panel derecho.
- El Glosario debe abrirse como panel derecho persistente (no como overlay) y conservar scroll/estado.

Implementación técnica requerida (cuando te pidan código)
- HTML/CSS/JS vanilla (sin frameworks) manteniendo archivos actuales:
  - `src/chat.html`: reestructura al layout 3 paneles (aside.left, main.chat, aside.right). El chat sigue usando `scripts/main.js`.
  - `src/styles/main.css`: añade secciones `.layout-notebook`, `.sidebar-left`, `.studio-right`, `.studio-card` y variables; elimina dependencias del teclado inline.
  - `src/scripts/main.js`:
    - Eliminar `showMainMenu()` y cualquier uso de teclado inline. Sustituir por funciones que disparan eventos: `UI.openGlossary()`, `UI.openNotes()`, `UI.openReports()`, etc.
    - Añadir un bus de eventos mínimo: `window.EventBus = { on, off, emit }`.
    - Exponer API `window.UI` con `openNotes(payload)`, `openGlossary()`, `openAudioSummary(blob|url)`, `openVideoSummary(url)`, `openReport({title,content})`.
    - Mantener todas las reglas de respuesta (ánimo, sarcasmo controlado, casos de uso, prompts), pero cambiar los "botones" sugeridos por frases con acciones sugeridas (que el frontend convierte en tarjetas en el Studio).
  - `server.js`:
    - CSP en desarrollo permite `scriptSrc 'unsafe-inline'` y `scriptSrcAttr 'unsafe-inline'` (ya aplicado). Mantener seguro en producción.

Herramientas de Studio (panel derecho)
- Notas: editor markdown simple; persistir en `localStorage` y, si hay BD, en tabla `user_note(id, user_id, title, content_md, created_at, updated_at)`.
- Resumen de audio: carga de audio (ya existe `/api/audio/upload`), transcripción/resumen con IA, tarjeta con export a Notas/Informe.
- Resumen de video: URL de YouTube/Vimeo; obtener transcripción (si no hay API, explicar limitaciones y ofrecer plan manual); generar resumen y puntos clave.
- Informes: compilar contenido del chat/notas en MD/HTML y opción PDF (si no hay generador, export MD descargable).
- Mapa mental: estructura JSON simple nodos/enlaces; render básico con listas jerárquicas mientras no haya canvas.

Accesibilidad y rendimiento
- Teclado: atajos `Ctrl+K` (buscar/acciones), `Ctrl+N` (nueva nota), `Ctrl+G` (glosario), `Ctrl+R` (nuevo informe).
- `prefers-reduced-motion` y WCAG AA ya cubiertos por la guía; mantenerlo.

Plan de migración sugerido (pasos que debes proponer y luego ejecutar cuando se solicite código)
1) Quitar botones/teclado inline del chat y refactorizar `main.js` para EventBus + UI API.
2) Reestructurar `chat.html` al layout NotebookLM (left/center/right) y actualizar `main.css` con las nuevas clases.
3) Implementar tarjetas del Studio (Notas, Glosario, Audio, Video, Informe) y wiring con EventBus.
4) Crear endpoints/mocks mínimos si es necesario (p. ej., `/api/report/compile` opcional) y tablas sugeridas.
5) QA: verificar navegadores (Chromium/Firefox), mobile responsive, shortcuts, y no romper el flujo del chat.

Entrega esperada (cuando generes output de implementación)
- Edits por archivo con contexto, listando exactamente qué líneas cambian y el resultado final por bloque.
- Explicar brevemente el impacto de cada cambio y cómo revertir en caso de error.

contexto de la base de datos: -- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.ai_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL UNIQUE,
  model text NOT NULL,
  prompt_version text NOT NULL,
  feedback_text text NOT NULL,
  tokens_prompt integer,
  tokens_completion integer,
  tokens_total integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ai_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT ai_feedback_response_id_fkey FOREIGN KEY (response_id) REFERENCES public.student_response(id)
);
CREATE TABLE public.cohort (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  starts_on date,
  ends_on date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cohort_pkey PRIMARY KEY (id)
);
CREATE TABLE public.course_session (
  id smallint NOT NULL,
  title text NOT NULL,
  position smallint NOT NULL DEFAULT 0,
  CONSTRAINT course_session_pkey PRIMARY KEY (id)
);
CREATE TABLE public.event_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid,
  event_type text NOT NULL,
  session_id smallint,
  payload jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT event_log_pkey PRIMARY KEY (id),
  CONSTRAINT event_log_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profile(id)
);
CREATE TABLE public.glossary_term (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  letter character NOT NULL CHECK (letter::text = upper(letter::text)),
  term text NOT NULL,
  definition text NOT NULL,
  CONSTRAINT glossary_term_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profile (
  id uuid NOT NULL,
  cohort_id uuid,
  email text,
  first_name text,
  last_name text,
  display_name text DEFAULT NULLIF(TRIM(BOTH FROM ((COALESCE(first_name, ''::text) || ' '::text) || COALESCE(last_name, ''::text))), ''::text),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profile_pkey PRIMARY KEY (id),
  CONSTRAINT profile_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profile_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES public.cohort(id)
);
CREATE TABLE public.prompt_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL,
  prompt_version text NOT NULL,
  model text NOT NULL,
  prompt_sha256 text NOT NULL,
  completion_sha256 text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT prompt_audit_pkey PRIMARY KEY (id),
  CONSTRAINT prompt_audit_response_id_fkey FOREIGN KEY (response_id) REFERENCES public.student_response(id)
);
CREATE TABLE public.prompt_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  prompt_slug text NOT NULL,
  prompt_text text,
  copied_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT prompt_log_pkey PRIMARY KEY (id),
  CONSTRAINT prompt_log_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profile(id)
);
CREATE TABLE public.session_activity (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id smallint NOT NULL,
  idx smallint NOT NULL,
  title text NOT NULL,
  description text,
  video_url text,
  workbook_url text,
  steps jsonb,
  CONSTRAINT session_activity_pkey PRIMARY KEY (id),
  CONSTRAINT session_activity_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.course_session(id)
);
CREATE TABLE public.session_faq (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id smallint NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  CONSTRAINT session_faq_pkey PRIMARY KEY (id),
  CONSTRAINT session_faq_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.course_session(id)
);
CREATE TABLE public.session_question (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id smallint NOT NULL,
  idx smallint NOT NULL,
  text text NOT NULL,
  CONSTRAINT session_question_pkey PRIMARY KEY (id),
  CONSTRAINT session_question_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.course_session(id)
);
CREATE TABLE public.student_response (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  session_id smallint NOT NULL,
  question_id uuid,
  activity_id uuid,
  response_text text,
  skipped boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT student_response_pkey PRIMARY KEY (id),
  CONSTRAINT student_response_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.session_activity(id),
  CONSTRAINT student_response_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profile(id),
  CONSTRAINT student_response_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.course_session(id),
  CONSTRAINT student_response_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.session_question(id)
);
CREATE TABLE public.support_ticket (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid,
  response_id uuid,
  reason text NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'open'::ticket_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  closed_at timestamp with time zone,
  CONSTRAINT support_ticket_pkey PRIMARY KEY (id),
  CONSTRAINT support_ticket_response_id_fkey FOREIGN KEY (response_id) REFERENCES public.student_response(id),
  CONSTRAINT support_ticket_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profile(id)
);