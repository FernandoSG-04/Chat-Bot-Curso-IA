# Guía de Contribución

¡Gracias por tu interés en contribuir al Chatbot Educativo! Este documento te guiará a través del proceso de contribución.

## 🚀 Cómo Contribuir

### 1. Fork del Proyecto

1. Ve al repositorio principal en GitHub
2. Haz clic en el botón "Fork" en la esquina superior derecha
3. Esto creará una copia del repositorio en tu cuenta

### 2. Clonar tu Fork

```bash
git clone https://github.com/tu-usuario/chat-bot-curso-ia.git
cd chat-bot-curso-ia
```

### 3. Configurar el Entorno de Desarrollo

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Ejecutar el proyecto en modo desarrollo:
   ```bash
   npm start
   ```

3. Abrir http://localhost:3000 en tu navegador

### 4. Crear una Rama

```bash
git checkout -b feature/nombre-de-tu-feature
```

### 5. Hacer Cambios

- Escribe tu código siguiendo las convenciones del proyecto
- Asegúrate de que tu código pase las pruebas
- Mantén commits pequeños y descriptivos

### 6. Commit y Push

```bash
git add .
git commit -m "feat: agregar nueva funcionalidad"
git push origin feature/nombre-de-tu-feature
```

### 7. Crear un Pull Request

1. Ve a tu fork en GitHub
2. Haz clic en "Compare & pull request"
3. Describe tus cambios detalladamente
4. Envía el PR

## 📋 Convenciones de Código

### JavaScript

- Usar ES6+ features
- Preferir `const` y `let` sobre `var`
- Usar arrow functions cuando sea apropiado
- Seguir el estilo de código definido en `.eslintrc.json`

### CSS

- Usar BEM methodology para nombres de clases
- Mantener especificidad baja
- Usar variables CSS para colores y valores reutilizables
- Organizar propiedades alfabéticamente

### HTML

- Usar HTML5 semántico
- Mantener estructura limpia y accesible
- Incluir atributos alt en imágenes
- Usar atributos ARIA cuando sea necesario

## 🧪 Pruebas

### Ejecutar Pruebas

```bash
npm test
```

### Escribir Pruebas

- Crear archivos de prueba en la carpeta `tests/`
- Usar nombres descriptivos para las pruebas
- Cubrir casos edge y errores

## 📝 Documentación

### Actualizar Documentación

- Mantener README.md actualizado
- Documentar nuevas funcionalidades
- Incluir ejemplos de uso
- Actualizar la estructura del proyecto si es necesario

## 🐛 Reportar Bugs

### Antes de Reportar

1. Verifica que el bug no haya sido reportado ya
2. Asegúrate de que estés usando la versión más reciente
3. Intenta reproducir el bug en un entorno limpio

### Información a Incluir

- Descripción detallada del bug
- Pasos para reproducir
- Comportamiento esperado vs actual
- Información del entorno (navegador, OS, etc.)
- Capturas de pantalla si es relevante

## ✨ Sugerencias de Features

### Antes de Implementar

1. Discute la idea en un issue
2. Asegúrate de que esté alineada con los objetivos del proyecto
3. Considera el impacto en la experiencia del usuario

### Implementación

1. Crea un issue detallado
2. Espera feedback de la comunidad
3. Implementa siguiendo las convenciones del proyecto

## 🤝 Código de Conducta

### Nuestros Estándares

- Ser respetuoso y inclusivo
- Usar lenguaje apropiado
- Aceptar críticas constructivas
- Enfocarse en lo que es mejor para la comunidad

### Nuestras Responsabilidades

- Mantener un ambiente acogedor
- Clarificar estándares de comportamiento
- Tomar acción correctiva cuando sea necesario

## 📞 Contacto

Si tienes preguntas sobre cómo contribuir:

- Abre un issue en GitHub
- Contacta al equipo de desarrollo
- Revisa la documentación existente

## 🙏 Agradecimientos

¡Gracias por contribuir al Chatbot Educativo! Tu trabajo ayuda a hacer este proyecto mejor para todos. 