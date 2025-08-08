# 📖 Instrucciones de Uso del Chatbot Educativo

## 🎯 Descripción General

El chatbot educativo está diseñado para proporcionar una experiencia de aprendizaje interactiva y personalizada. Incluye funcionalidades de audio, comandos especiales y un sistema de respuestas inteligentes.

## 🎧 Audio de Bienvenida con Instrucciones

### Características del Audio
- **Reproducción automática**: Se reproduce al cargar la página
- **Velocidad optimizada**: 0.85x para mejor comprensión
- **Idioma**: Español (es-ES)
- **Volumen**: 70% por defecto
- **Duración**: Aproximadamente 2-3 minutos

### Contenido del Audio de Bienvenida
El audio reproduce las siguientes instrucciones completas:

1. **Saludo inicial** y presentación del asistente
2. **Instrucciones de escritura** de mensajes
3. **Tipos de preguntas** que se pueden realizar
4. **Comandos especiales** disponibles
5. **Información sobre audio** y controles
6. **Información sobre historial** de conversaciones
7. **Invitación** a comenzar a usar el chatbot

## ⌨️ Comandos Especiales

### 1. Comando "ayuda"
- **Función**: Muestra las instrucciones de uso completas
- **Uso**: Escribir "ayuda" en el chat
- **Respuesta**: Lista detallada de todas las funcionalidades

### 2. Comando "temas"
- **Función**: Muestra todos los temas disponibles del curso
- **Uso**: Escribir "temas" en el chat
- **Respuesta**: Lista organizada de temas con categorías

### 3. Comando "ejercicios"
- **Función**: Muestra ejercicios prácticos disponibles
- **Uso**: Escribir "ejercicios" en el chat
- **Respuesta**: Lista de ejercicios por nivel de dificultad

## 🎵 Control de Audio

### Funciones Disponibles
```javascript
// Activar/desactivar audio
window.Chatbot.toggleAudio();

// Verificar estado del audio
const status = window.Chatbot.getAudioStatus();

// Ajustar volumen (0.0 - 1.0)
window.Chatbot.setAudioVolume(0.8);
```

### Configuración de Audio
- **Volumen de bienvenida**: 0.7 (70%)
- **Volumen de respuestas**: 0.5 (50%)
- **Velocidad de bienvenida**: 0.85x
- **Velocidad de respuestas**: 0.9x

## 💬 Tipos de Preguntas Soportadas

### 1. Preguntas sobre Temas del Curso
- Fundamentos de IA
- Machine Learning
- Deep Learning
- Aplicaciones prácticas

### 2. Preguntas sobre Conceptos
- Explicaciones de términos técnicos
- Conceptos básicos y avanzados
- Ejemplos prácticos

### 3. Solicitud de Ejercicios
- Ejercicios básicos
- Ejercicios intermedios
- Proyectos prácticos
- Desafíos avanzados

### 4. Preguntas Generales
- Saludos y despedidas
- Agradecimientos
- Dudas sobre el funcionamiento

## 🔄 Flujo de Uso Típico

### 1. Primera Vez
1. **Carga la página** → Audio de bienvenida se reproduce automáticamente
2. **Escucha las instrucciones** → Comprende todas las funcionalidades
3. **Escribe "ayuda"** → Refresca las instrucciones si es necesario
4. **Explora temas** → Escribe "temas" para ver opciones
5. **Haz preguntas** → Comienza a interactuar con el chatbot

### 2. Uso Regular
1. **Escribe tu pregunta** → En el campo de texto
2. **Presiona Enter** → O haz clic en enviar
3. **Escucha la respuesta** → Audio se reproduce automáticamente
4. **Continúa la conversación** → Haz preguntas de seguimiento

### 3. Uso Avanzado
1. **Usa comandos especiales** → "ayuda", "temas", "ejercicios"
2. **Controla el audio** → Activa/desactiva según preferencias
3. **Explora funcionalidades** → Prueba diferentes tipos de preguntas

## 🎨 Características de la Interfaz

### Elementos Visuales
- **Chat moderno**: Interfaz tipo WhatsApp/Telegram
- **Indicador de escritura**: Muestra cuando el bot está "pensando"
- **Historial visual**: Todas las conversaciones se muestran
- **Scroll automático**: Se mueve al último mensaje

### Elementos de Audio
- **Reproducción automática**: Audio en bienvenida y respuestas
- **Control de volumen**: Ajustable según preferencias
- **Fallback**: Funciona sin audio si no está disponible

## 🔧 Configuración Técnica

### Requisitos del Navegador
- **Web Speech API**: Para reproducción de audio
- **JavaScript habilitado**: Para funcionalidad completa
- **Permisos de audio**: Para reproducción automática

### Compatibilidad
- ✅ Chrome 33+
- ✅ Firefox 49+
- ✅ Safari 7+
- ✅ Edge 79+

## 🚀 Mejores Prácticas

### Para Usuarios
1. **Escucha completo**: Escucha las instrucciones de bienvenida
2. **Usa comandos**: Aprovecha "ayuda", "temas", "ejercicios"
3. **Haz preguntas específicas**: Obtén respuestas más precisas
4. **Controla el audio**: Ajusta según tu entorno

### Para Desarrolladores
1. **Mantén actualizadas**: Las instrucciones en el código
2. **Prueba el audio**: En diferentes navegadores
3. **Optimiza respuestas**: Para mejor comprensión
4. **Documenta cambios**: En este archivo

## 🔄 Actualizaciones

### Versión Actual
- **Fecha**: Diciembre 2024
- **Características**: Audio de bienvenida con instrucciones completas
- **Comandos**: 3 comandos especiales implementados
- **Compatibilidad**: Todos los navegadores modernos

### Próximas Mejoras
- [ ] Más comandos especiales
- [ ] Personalización de voz
- [ ] Control de velocidad de audio
- [ ] Exportación de conversaciones
- [ ] Integración con más servicios

---

*Documentación actualizada: Diciembre 2024*
