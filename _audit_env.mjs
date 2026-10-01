import fs from 'fs';
import path from 'path';
import net from 'net';

const R = 'f:/PROJECT/Lost2Found';
const out = [];
const p = (...a) => out.push(a.join(' '));

const exists = (rel) => fs.existsSync(path.join(R, rel));

p('NODE', process.version);
p('nm root', exists('node_modules'));
p('nm server', exists('server/node_modules'));
p('nm client', exists('client/node_modules'));
p('.env server', exists('server/.env'));
p('.env client', exists('client/.env'));

const readPkg = (rel) => {
  try { return JSON.parse(fs.readFileSync(path.join(R, rel), 'utf8')).version; }
  catch { return 'MISSING'; }
};
for (const m of ['express', 'mongoose', 'bcryptjs', 'jsonwebtoken', 'socket.io', 'multer', 'helmet',
  'cors', 'express-rate-limit', '@exortek/express-mongo-sanitize', 'cloudinary',
  '@google/generative-ai', 'cookie-parser', 'dotenv', 'cookie']) {
  p('server dep', m, readPkg(`server/node_modules/${m}/package.json`));
}
for (const m of ['react', 'react-dom', 'react-router-dom', 'axios', 'socket.io-client', 'vite', 'tailwindcss', '@vitejs/plugin-react', '@tailwindcss/postcss']) {
  p('client dep', m, readPkg(`client/node_modules/${m}/package.json`));
}

if (exists('server/.env')) {
  const lines = fs.readFileSync(path.join(R, 'server/.env'), 'utf8').split(/\r?\n/);
  const report = lines.filter((l) => /^\s*[A-Za-z_][A-Za-z0-9_]*=/.test(l)).map((l) => {
    const i = l.indexOf('=');
    const k = l.slice(0, i).trim();
    const v = l.slice(i + 1).trim();
    const placeholder = /^(your_|changeme|xxx|todo)/i.test(v) || v === '';
    return `${k}:${v.length}ch${placeholder ? ' *PLACEHOLDER*' : ''}`;
  });
  p('server env keys', report.join(', '));
}

const testPort = (portNum) => new Promise((resolve) => {
  const s = net.createConnection({ host: '127.0.0.1', port: portNum });
  let finished = false;
  const done = (v) => { if (finished) return; finished = true; try { s.destroy(); } catch (e) {} resolve(v); };
  s.setTimeout(1500);
  s.on('connect', () => done(true));
  s.on('timeout', () => done(false));
  s.on('error', () => done(false));
});

p('mongo:27017 open', await testPort(27017));
p('api:5000 open', await testPort(5000));
p('vite:5173 open', await testPort(5173));

fs.writeFileSync(path.join(R, '_audit_env.txt'), out.join('\n') + '\n');
console.log('OK');
