const { spawn } = require('child_process');
const path = require('path');

const frontend = spawn('npx', ['vite'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true
});

const backend = spawn('python', ['-m', 'uvicorn', 'app.main:app', '--reload', '--port', '8000'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

frontend.on('close', (code) => {
  console.log(`Frontend exited with code ${code}`);
  backend.kill();
});

backend.on('close', (code) => {
  console.log(`Backend exited with code ${code}`);
  frontend.kill();
});

process.on('SIGINT', () => {
  frontend.kill();
  backend.kill();
  process.exit(0);
});