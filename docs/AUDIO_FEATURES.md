# 🎵 Características de Audio del Chatbot

## Descripción General

El chatbot educativo incluye funcionalidades de audio para mejorar la experiencia del usuario, proporcionando retroalimentación auditiva en los mensajes de bienvenida y respuestas del bot.

## 🎧 Funcionalidades Implementadas

### 1. Audio de Bienvenida
- **Descripción**: Reproduce automáticamente un mensaje de bienvenida cuando se carga la página
- **Implementación**: Utiliza Web Speech API como método principal, con fallback a archivos de audio
- **Configuración**: 
  - Volumen: 0.7 (70%)
  - Idioma: Español (es-ES)
  - Velocidad: 0.9x

### 2. Audio en Respuestas del Bot
- **Descripción**: Reproduce audio para todas las respuestas del bot
- **Implementación**: Web Speech API con voz en español
- **Configuración**:
  - Volumen: 0.5 (50%)
  - Idioma: Español (es-ES)
  - Velocidad: 0.9x

### 3. Control de Audio
- **Activación/Desactivación**: Función `toggleAudio()`
- **Estado del Audio**: Función `getAudioStatus()`
- **Control de Volumen**: Función `setAudioVolume(volume)`

## 🔧 Configuración

### Configuración Básica
```javascript
const CHATBOT_CONFIG = {
    audioEnabled: true,
    welcomeAudio: {
        src: 'assets/audio/welcome.mp3',
        volume: 0.7
    }
};
```

### Configuración Avanzada
```javascript
// Activar/desactivar audio
window.Chatbot.toggleAudio();

// Obtener estado del audio
const audioStatus = window.Chatbot.getAudioStatus();

// Configurar volumen (0.0 - 1.0)
window.Chatbot.setAudioVolume(0.8);
```

## 🎯 Métodos de Implementación

### 1. Web Speech API (Principal)
- **Ventajas**: 
  - No requiere archivos de audio
  - Soporte nativo del navegador
  - Múltiples voces disponibles
- **Compatibilidad**: Chrome, Firefox, Safari, Edge

### 2. Archivos de Audio (Fallback)
- **Ubicación**: `src/assets/audio/`
- **Formato**: MP3
- **Uso**: Cuando Web Speech API no está disponible

## 🚀 Uso en el Código

### Reproducir Audio de Bienvenida
```javascript
// Se ejecuta automáticamente al cargar la página
playWelcomeAudio();
```

### Reproducir Audio en Respuestas
```javascript
// En las respuestas del bot
addBotMessage(response, true); // El segundo parámetro habilita el audio
```

### Reproducir Audio Personalizado
```javascript
// Reproducir cualquier archivo de audio
window.Chatbot.playAudio('assets/audio/custom.mp3', 0.6);
```

## 🔍 Solución de Problemas

### Audio No Reproduce
1. **Verificar permisos**: El navegador puede requerir interacción del usuario
2. **Comprobar compatibilidad**: Verificar si Web Speech API está disponible
3. **Revisar consola**: Buscar errores en la consola del navegador

### Voz No Suena en Español
1. **Verificar voces disponibles**: `speechSynthesis.getVoices()`
2. **Configurar idioma**: Asegurar que `utterance.lang = 'es-ES'`
3. **Fallback**: Si no hay voz en español, usará la voz por defecto

### Volumen Muy Bajo/Alto
1. **Ajustar configuración**: Modificar `volume` en la configuración
2. **Control dinámico**: Usar `setAudioVolume()` para ajustar en tiempo real

## 📝 Notas Técnicas

### Compatibilidad de Navegadores
- ✅ Chrome 33+
- ✅ Firefox 49+
- ✅ Safari 7+
- ✅ Edge 79+

### Limitaciones
- **Interacción requerida**: Algunos navegadores requieren interacción del usuario
- **Voces disponibles**: Depende del sistema operativo y navegador
- **Calidad de voz**: Varía según la implementación del navegador

### Mejores Prácticas
1. **Siempre proporcionar fallback**: Para usuarios sin soporte de audio
2. **Respetar preferencias del usuario**: Permitir activar/desactivar
3. **Optimizar volumen**: No demasiado alto para evitar molestias
4. **Probar en múltiples navegadores**: Asegurar compatibilidad

## 🔄 Actualizaciones Futuras

### Funcionalidades Planificadas
- [ ] Soporte para múltiples idiomas
- [ ] Control de velocidad de reproducción
- [ ] Efectos de sonido personalizados
- [ ] Integración con servicios TTS externos
- [ ] Cache de audio para mejor rendimiento

### Integración con Servicios Externos
- Google Cloud Text-to-Speech
- Amazon Polly
- Microsoft Azure Speech Service
- OpenAI Whisper

---

*Última actualización: Diciembre 2024*
