# Sistema de Login - ChatBot IA

## 📋 Descripción

Sistema de autenticación moderno y seguro para el ChatBot IA, diseñado con un enfoque en la experiencia del usuario y la seguridad. Incluye animaciones fluidas, validación en tiempo real, y un diseño glassmorphism que se integra perfectamente con el tema principal de la aplicación.

## 🎨 Características de Diseño

### Paleta de Colores
- **Primario Oscuro**: `#0f1a2f`
- **Primario Cian**: `#04c2d1`
- **Secundario Oscuro**: `#07254a`
- **Más Oscuro**: `#071124`
- **Azul Medio**: `#0a3663`
- **Teal**: `#0d7a8a`

### Efectos Visuales
- **Glassmorphism**: Efectos de vidrio esmerilado con `backdrop-filter`
- **Gradientes**: Fondos con gradientes radiales y lineales
- **Partículas**: Animaciones de partículas flotantes en el fondo
- **Glow Effects**: Efectos de brillo en elementos interactivos
- **Transiciones**: Animaciones suaves en todos los elementos

## 🚀 Funcionalidades

### Autenticación
- ✅ Validación en tiempo real de credenciales
- ✅ Sistema de bloqueo después de intentos fallidos
- ✅ Función "Recordarme" con persistencia local
- ✅ Toggle de visibilidad de contraseña
- ✅ Redirección automática al chat después del login

### Seguridad
- 🔒 Bloqueo temporal después de 3 intentos fallidos
- 🔒 Validación de longitud mínima de credenciales
- 🔒 Limpieza automática de datos expirados
- 🔒 Protección contra ataques de fuerza bruta

### Experiencia de Usuario
- 🎯 Animaciones fluidas y responsivas
- 🎯 Feedback visual inmediato
- 🎯 Mensajes de error y éxito animados
- 🎯 Diseño responsive para móviles
- 🎯 Navegación por teclado

## 📁 Estructura de Archivos

```
src/login/
├── login.html          # Página principal de login
├── login.css           # Estilos y animaciones
├── login.js            # Lógica de autenticación
├── README.md           # Documentación
└── test-credentials.html # Página de credenciales de prueba
```

## 🎮 Uso

### Credenciales de Prueba
Para probar el sistema, utiliza cualquiera de estas credenciales:

| Usuario | Contraseña |
|---------|------------|
| `admin` | `admin123` |
| `usuario` | `123456` |
| `test` | `test123` |

### Flujo de Login
1. **Acceso**: Navega a `src/login/login.html`
2. **Entrada**: Ingresa usuario y contraseña
3. **Validación**: El sistema valida en tiempo real
4. **Autenticación**: Simula validación de credenciales
5. **Redirección**: Te lleva al chat principal

## ⚙️ Configuración

### Variables de Configuración
```javascript
const LOGIN_CONFIG = {
    minUsernameLength: 3,        // Longitud mínima de usuario
    minPasswordLength: 6,        // Longitud mínima de contraseña
    maxAttempts: 3,              // Intentos máximos antes del bloqueo
    lockoutDuration: 300000,     // Duración del bloqueo (5 min)
    animationDelay: 1000,        // Delay de animaciones
    redirectDelay: 1500          // Delay antes de redirección
};
```

### Personalización
- **Colores**: Modifica las variables CSS en `:root`
- **Animaciones**: Ajusta los `@keyframes` en `login.css`
- **Comportamiento**: Edita `LOGIN_CONFIG` en `login.js`

## 🔧 Integración

### Con el Chat Principal
El sistema se integra con el chat principal a través de:
- **Redirección**: `window.location.href = '../index.html'`
- **Persistencia**: `localStorage` para datos de sesión
- **Diseño**: Misma paleta de colores y estilos

### Botón de Login en el Chat
El chat principal incluye un botón de login que:
- Detecta si hay un usuario recordado
- Muestra el nombre del usuario o "Login"
- Permite logout con confirmación

## 🎨 Animaciones

### Animaciones Principales
- **slideInUp**: Entrada del contenedor principal
- **fadeInDown**: Aparición del logo
- **fadeInUp**: Aparición del formulario
- **glowPulse**: Efecto de brillo en elementos
- **float**: Movimiento de partículas
- **successPulse**: Feedback de éxito
- **errorShake**: Feedback de error

### Efectos de Hover
- **Lift Effect**: Elementos se elevan al pasar el cursor
- **Glow Effect**: Brillo en elementos interactivos
- **Scale Effect**: Escalado suave en imágenes

## 📱 Responsive Design

### Breakpoints
- **Desktop**: > 480px - Diseño completo
- **Mobile**: ≤ 480px - Diseño adaptado

### Adaptaciones Móviles
- Contenedor más compacto
- Fuentes ajustadas
- Espaciado optimizado
- Touch-friendly buttons

## 🔒 Seguridad

### Medidas Implementadas
1. **Validación Local**: Verificación de credenciales en el cliente
2. **Rate Limiting**: Bloqueo temporal después de intentos fallidos
3. **Data Sanitization**: Limpieza de datos de entrada
4. **Session Management**: Gestión de sesiones con localStorage
5. **Auto-cleanup**: Limpieza automática de datos expirados

### Consideraciones
- ⚠️ Este es un sistema de demostración
- ⚠️ Las credenciales están hardcodeadas
- ⚠️ Para producción, implementar backend real
- ⚠️ Usar HTTPS en producción

## 🐛 Troubleshooting

### Problemas Comunes

**La imagen no se muestra**
- Verifica que `brain-icon.jpg` existe en `src/assets/images/`
- Comprueba la ruta relativa en `login.html`

**Las animaciones no funcionan**
- Asegúrate de que CSS está cargado correctamente
- Verifica que JavaScript no tiene errores en la consola

**El login no redirige**
- Comprueba que `../index.html` existe
- Verifica permisos de archivo

**Credenciales no funcionan**
- Usa exactamente las credenciales de prueba
- Verifica que no hay espacios extra

## 🚀 Futuras Mejoras

### Funcionalidades Planificadas
- [ ] Integración con backend real
- [ ] Autenticación OAuth (Google, GitHub)
- [ ] Recuperación de contraseña
- [ ] Registro de usuarios
- [ ] Verificación por email
- [ ] Autenticación de dos factores

### Mejoras de UX
- [ ] Modo oscuro/claro
- [ ] Más animaciones personalizadas
- [ ] Sonidos de feedback
- [ ] Modo offline
- [ ] PWA capabilities

## 📄 Licencia

Este proyecto está bajo la misma licencia que el proyecto principal.

## 🤝 Contribución

Para contribuir al sistema de login:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Implementa los cambios
4. Añade tests si es necesario
5. Envía un pull request

---

**Desarrollado con ❤️ para el ChatBot IA**
