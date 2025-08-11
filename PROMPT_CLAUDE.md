## Rol y objetivo

Eres la IA de desarrollo y producto de esta aplicación (Lia IA). Tu responsabilidad es DIAGNOSTICAR Y ARREGLAR por completo el funcionamiento de la IA del chat y ENTREGAR todas las mejoras solicitadas de interfaz y funcionalidades, sin dejar nada a medias. Trabajas en español y devuelves entregables listos para aplicar.

## Alcance (debes hacer TODO)

1) Reparar el funcionamiento de la IA del chat (si está fallando otra vez, debes dejarla operativa).
2) Mejorar la interfaz de bienvenida (landing/pantalla inicial) con un diseño moderno, claro y responsivo.
3) En el área de entrada del chat, agregar un botón «+» al estilo ChatGPT para gestionar sesiones (crear, renombrar, duplicar, cambiar, archivar/eliminar).
4) El chat será única y exclusivamente para la IA. Todas las demás funcionalidades irán en los laterales (layouts/sidebars).
5) Reorganizar y mejorar la distribución de los botones laterales.
6) Implementar la IA para crear informes o resúmenes (entrada de texto/archivo, plantillas, salida descargable en PDF/Markdown).
7) Agregar dos botones laterales nuevos: «Sesiones Zoom» y «Docentes del curso».

No entregues respuestas parciales. Si algo te bloquea, pide exactamente lo que falta (variables, rutas, claves, permisos) y ofrece una alternativa temporal.

## Diagnóstico y reparación de la IA (prioridad 0)

Debes:
- Detectar y explicar la causa raíz (API key ausente/incorrecta, endpoint, CORS, límite de tokens, timeouts, dependencias, errores de tipado, errores de build, rutas, proxies).
- Proponer y aplicar los cambios específicos de código y configuración para dejar la IA operativa.
- Añadir manejo de errores visible para el usuario y logs útiles para depuración.
- Validar con una prueba real (mensaje de ejemplo y respuesta de la IA) y mostrar el resultado.

Checklist de diagnóstico (marca todo):
- [ ] Comprobación de variables de entorno (clave del proveedor, organización/proyecto si aplica).
- [ ] Verificación de endpoints, modelo y parámetros (máximo tokens, temperatura, top_p, streaming si procede).
- [ ] Manejo de CORS/headers y proxy si hay frontend web.
- [ ] Manejo de errores comunes: 401/403, 404, 429, 5xx, timeouts, JSON inválido.
- [ ] Revisión de dependencias, versiones y compatibilidad.
- [ ] Prueba funcional del chat con transcript corto y respuesta de la IA.

## Cambios de interfaz requeridos

1) Pantalla de bienvenida
- Diseño limpio y responsivo con tipografía legible, tema claro/oscuro.
- Sección de título, subtítulo y CTA para «Iniciar chat con la IA».
- Tarjetas/beneficios breves y un ejemplo de prompt.
- Estado de conexión a la IA (conectado/degradado/sin conexión) y cómo resolver.

2) Área de chat (exclusivo para la IA)
- Campo de entrada con botón «Enviar» y un botón «+» a la izquierda del input (como en ChatGPT) para gestionar sesiones.
- Soporte de sesiones separadas con contexto independiente por sesión.
- Almacenar sesiones de forma persistente (localStorage o backend) con estructura clara: id, título, createdAt, updatedAt, mensajes.
- Acciones del botón «+»: crear sesión, renombrar, duplicar, cambiar de sesión activa, archivar/eliminar.
- Mostrar la sesión activa en el encabezado del chat, con menú para cambiar.

3) Laterales (layouts/sidebars)
- Reorganizar los botones por grupos lógicos, con iconos y etiquetas claras.
- Agregar:
  - «Informes/Resúmenes» (abre flujo para generar informes con IA)
  - «Sesiones Zoom» (lista enlaces/programación; admite agregar/editar)
  - «Docentes del curso» (lista docentes, perfiles y enlaces de contacto)
- Mantener accesibilidad (navegación por teclado, aria-labels) y buen contraste.

## Funcionalidad de Informes/Resúmenes con IA

- Entrada: texto pegado, archivos .txt/.md/.pdf (si PDF, extraer texto), o URL.
- Selección de plantilla: resumen ejecutivo, informe técnico, minuta de reunión, plan de estudio, etc.
- Parámetros: longitud objetivo, nivel de detalle, idioma (por defecto español), tono.
- Salida: vista previa en el navegador + descarga en PDF y Markdown.
- Citas y fuentes: si hay URL o documentos, incluir referencias al final.
- Guardar cada informe como artefacto de sesión o en un historial propio.

## Criterios de aceptación (todo debe cumplirse)

- [ ] La IA del chat vuelve a funcionar de extremo a extremo y responde a un mensaje de prueba.
- [ ] La pantalla de bienvenida está mejorada, es responsiva y accesible.
- [ ] Existe el botón «+» en el área de entrada del chat con todas las acciones de sesión operativas.
- [ ] El chat solo muestra interacción con la IA; otras funciones están en los laterales.
- [ ] Los laterales están reorganizados y contienen los nuevos botones (Informes/Resúmenes, Sesiones Zoom, Docentes del curso).
- [ ] La funcionalidad de informes/resúmenes genera descargas en PDF/Markdown y guarda el historial.
- [ ] No hay errores de consola, linter ni build. Documentación mínima incluida.

## Entregables que debes devolver en tu respuesta

1) Plan breve de cambios con impacto.
2) Edits de código completos y listos para aplicar, con rutas reales del repo. Usa este formato por archivo:

```
RUTA/DEL/ARCHIVO.ext
--- antes
<fragmento relevante si necesitas contexto>
--- después
<contenido nuevo completo o dif conciso>
``` 

Cuando el archivo sea nuevo, indica claramente «archivo nuevo» y su contenido completo.

3) Variables de entorno y configuración que se requieren, con ejemplos seguros.
4) Instrucciones de build/run y verificación funcional (incluye un mensaje de prueba y la respuesta esperada de la IA).
5) Notas de compatibilidad y fallback (qué ocurre si falla la IA o no hay clave).

## Convenciones de implementación

- Respeta el estilo existente del proyecto. Código claro, nombres expresivos, sin dejar TODOs.
- Maneja errores y estados de carga; informa al usuario si algo falla y cómo resolver.
- Prueba después de cada cambio relevante. Si algo rompe, arréglalo antes de continuar.
- Seguridad: no expongas claves en el frontend. Usa variables de entorno y un proxy/servidor cuando se necesite.
- Accesibilidad: etiquetas aria, soporte teclado, contraste adecuado, tamaños alcanzables.

## Si falta información

Si necesitas datos que no están en el repositorio (por ejemplo: claves/URLs de API, endpoints de Zoom, lista de docentes con perfiles), solicita exactamente:
- Variables o secretos precisos (nombres y dónde ubicarlos: .env, panel, etc.).
- Rutas o archivos concretos a crear/editar.
- Formato de datos esperado (JSON de docentes, estructura de sesiones, etc.).

Mientras tanto, implementa mocks o datos de ejemplo y señala dónde reemplazarlos.

## Ejemplo de datos de configuración (modifica según el proyecto)

```
# .env (backend)
AI_PROVIDER=anthropic
AI_API_KEY=xxxxx
AI_MODEL=claude-3-5-sonnet-20240620
AI_MAX_TOKENS=4096
AI_TEMPERATURE=0.3

# .env (frontend)
VITE_API_BASE_URL=http://localhost:3000
```

## Ejemplo de estructura de sesión (persistencia mínima en frontend)

```
{
  "id": "sess_1712345678",
  "title": "Nueva sesión",
  "createdAt": 1712345678000,
  "updatedAt": 1712345678000,
  "messages": [
    { "role": "user", "content": "Hola" },
    { "role": "assistant", "content": "¡Hola!" }
  ]
}
```

## Formato de respuesta final (obligatorio)

Responde en este orden y en español:
1) Resumen ejecutivo (breve).
2) Checklist de diagnóstico marcado.
3) Cambios de código por archivo (formato de «antes/después» indicado).
4) Configuración/variables necesarias.
5) Instrucciones para ejecutar y validar.
6) Evidencia de prueba (mensaje enviado y respuesta recibida de la IA; captura/logs si aplica).
7) Próximos pasos opcionales.


