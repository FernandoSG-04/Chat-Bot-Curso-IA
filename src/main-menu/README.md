# Menú Principal - Curso IA

## Descripción
El menú principal es la interfaz central que permite a los usuarios navegar entre diferentes secciones del curso de Inteligencia Artificial. Proporciona acceso a cursos, progreso, chat con IA y gestión del perfil.

## Características

### 🎨 Diseño
- **Glassmorphism**: Efecto de cristal esmerilado con transparencias
- **Tema Oscuro**: Paleta de colores oscura y moderna
- **Animaciones**: Transiciones suaves y efectos visuales atractivos
- **Responsive**: Diseño adaptativo para móviles y desktop

### 🧭 Navegación
- **Navbar Interactivo**: Barra de navegación con indicador animado
- **5 Secciones Principales**:
  - 🏠 **Inicio**: Dashboard con estadísticas generales
  - 📚 **Cursos**: Lista de cursos disponibles con progreso
  - 📊 **Progreso**: Visualización del progreso general
  - 💬 **Chat**: Acceso directo al chat con IA
  - 👤 **Perfil**: Gestión de cuenta y configuración

### 🎯 Funcionalidades

#### Sección Inicio
- Estadísticas generales del curso
- Contador de cursos disponibles
- Horas de contenido total
- Número de estudiantes

#### Sección Cursos
- Tarjetas de cursos con progreso visual
- Barras de progreso animadas
- Botones para continuar cursos
- Información detallada de cada curso

#### Sección Progreso
- Progreso circular animado
- Estadísticas detalladas
- Cursos completados
- Horas de estudio

#### Sección Chat
- Vista previa del chat
- Acceso directo al chat principal
- Mensajes de ejemplo

#### Sección Perfil
- Información del usuario
- Estadísticas personales
- Acciones de cuenta
- Cerrar sesión

## Estructura de Archivos

```
main-menu/
├── main-menu.html          # Estructura HTML principal
├── main-menu.css           # Estilos y animaciones
├── main-menu.js            # Funcionalidad JavaScript
└── README.md              # Documentación
```

## Tecnologías Utilizadas

- **HTML5**: Estructura semántica
- **CSS3**: 
  - Variables CSS (Custom Properties)
  - Flexbox y Grid
  - Animaciones y transiciones
  - Backdrop-filter para glassmorphism
- **JavaScript ES6+**:
  - Navegación dinámica
  - Animaciones en scroll
  - Gestión de estado
  - Notificaciones

## Paleta de Colores

```css
:root {
    --color-bg-1: #071124;      /* Fondo muy oscuro */
    --color-bg-2: #0f1a2f;      /* Fondo navy */
    --color-surface: #07254a;   /* Paneles */
    --color-accent: #0a3663;    /* Azul medio */
    --color-secondary: #0d7a8a; /* Teal oscuro */
    --color-primary: #04c2d1;   /* Cian brillante */
    --text-on-dark: #e8f4ff;    /* Texto claro */
    --text-muted: #9db1c7;      /* Texto atenuado */
}
```

## Animaciones

### Principales
- `fadeInUp`: Entrada desde abajo
- `fadeInDown`: Entrada desde arriba
- `slideInUp`: Deslizamiento desde abajo
- `glowPulse`: Efecto de brillo pulsante
- `float`: Flotación de partículas

### Navbar
- Indicador deslizante
- Transiciones suaves
- Efectos hover
- Animación de iconos

## Responsive Design

### Breakpoints
- **Desktop**: > 768px
- **Tablet**: 768px - 1024px
- **Mobile**: < 768px

### Características Móviles
- Menú hamburguesa
- Navegación táctil
- Layout adaptativo
- Optimización de touch

## Uso

### Navegación
1. **Click en elementos del navbar**: Cambia entre secciones
2. **Scroll**: Anima elementos al hacer scroll
3. **Touch**: Soporte completo para dispositivos táctiles

### Interacciones
- **Hover**: Efectos visuales en elementos interactivos
- **Click**: Navegación y acciones
- **Scroll**: Animaciones automáticas

## Integración

### Con Login
- Redirección automática después del login exitoso
- Mantenimiento de sesión
- Logout funcional

### Con Chat
- Acceso directo desde la sección Chat
- Vista previa de conversaciones
- Navegación fluida

## Personalización

### Colores
Modificar las variables CSS en `:root` para cambiar la paleta de colores.

### Animaciones
Ajustar las duraciones y efectos en las clases CSS correspondientes.

### Contenido
Editar el HTML para modificar textos, imágenes y estructura.

## Compatibilidad

### Navegadores
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Dispositivos
- ✅ Desktop
- ✅ Tablet
- ✅ Mobile

## Mantenimiento

### Actualizaciones
1. Revisar compatibilidad de navegadores
2. Actualizar dependencias
3. Optimizar rendimiento
4. Mejorar accesibilidad

### Debugging
- Usar DevTools para inspeccionar elementos
- Verificar consola para errores JavaScript
- Probar en diferentes dispositivos

## Contribución

Para contribuir al desarrollo:
1. Seguir las convenciones de código
2. Probar en múltiples navegadores
3. Mantener la consistencia del diseño
4. Documentar cambios importantes
