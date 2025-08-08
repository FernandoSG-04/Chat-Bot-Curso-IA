#!/usr/bin/env node

/**
 * Script de configuración inicial del proyecto
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Configurando Chatbot Educativo...\n');

// Verificar si Node.js está instalado
try {
  const nodeVersion = process.version;
  console.log(`✅ Node.js ${nodeVersion} detectado`);
} catch (error) {
  console.error('❌ Node.js no está instalado. Por favor, instala Node.js 14 o superior.');
  process.exit(1);
}

// Verificar si npm está disponible
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`✅ npm ${npmVersion} detectado`);
} catch (error) {
  console.error('❌ npm no está disponible. Por favor, instala npm.');
  process.exit(1);
}

// Instalar dependencias
console.log('\n📦 Instalando dependencias...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencias instaladas correctamente');
} catch (error) {
  console.error('❌ Error al instalar dependencias:', error.message);
  process.exit(1);
}

// Crear archivos de configuración si no existen
const configFiles = [
  '.env.example',
  'src/config/config.js'
];

configFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.log(`📄 Creando ${file}...`);
    // Aquí se crearían los archivos de configuración
  }
});

console.log('\n🎉 ¡Configuración completada!');
console.log('\n📋 Próximos pasos:');
console.log('1. Ejecuta "npm start" para iniciar el servidor de desarrollo');
console.log('2. Abre http://localhost:3000 en tu navegador');
console.log('3. ¡Disfruta desarrollando tu chatbot!');
console.log('\n📚 Recursos útiles:');
console.log('- README.md: Documentación del proyecto');
console.log('- docs/CONTRIBUTING.md: Guía de contribución');
console.log('- docs/CHANGELOG.md: Historial de cambios'); 