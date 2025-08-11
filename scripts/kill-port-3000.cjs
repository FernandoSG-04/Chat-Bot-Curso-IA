#!/usr/bin/env node
/*
  Libera el puerto 3000 en Windows (PowerShell) o Unix (lsof).
  Se ejecuta con: node scripts/kill-port-3000.cjs
*/
const { spawn } = require('child_process');

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: 'ignore', shell: false, ...options });
    child.on('error', () => resolve(false));
    child.on('exit', () => resolve(true));
  });
}

async function killWindows() {
  const psCmd = [
    '-NoProfile',
    '-Command',
    'Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { try { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } catch {} }'
  ];
  await run('powershell', psCmd);
  // Matar procesos residuales de node/nodemon por si no se asociaron al socket todavía
  await run('powershell', ['-NoProfile', '-Command', 'Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force']);
  await run('powershell', ['-NoProfile', '-Command', 'Get-Process nodemon -ErrorAction SilentlyContinue | Stop-Process -Force']);
}

async function killUnix() {
  await run('/bin/sh', ['-c', "pids=$(lsof -ti:3000 2>/dev/null); if [ -n \"$pids\" ]; then kill -9 $pids 2>/dev/null || true; fi"]);
}

(async () => {
  const isWin = process.platform === 'win32';
  try {
    if (isWin) {
      await killWindows();
    } else {
      await killUnix();
    }
    // Ligera espera para liberar el socket
    setTimeout(() => {
      console.log('Puerto 3000 liberado.');
      process.exit(0);
    }, 250);
  } catch (e) {
    console.error('No se pudo liberar el puerto 3000:', e.message);
    process.exit(0);
  }
})();



