import { spawn } from 'child_process';
import http from 'http';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchLogin() {
  return new Promise((resolve) => {
    const req = http.request('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
    });
    req.write(JSON.stringify({ email: 'fake@example.com', password: 'wrong' }));
    req.end();
  });
}

async function runTest(envName, expectedBlockAfter) {
  console.log(`\n--- Testing NODE_ENV=${envName} ---`);
  
  const server = spawn('npm', ['run', 'start'], {
    cwd: './server',
    env: { ...process.env, NODE_ENV: envName },
    shell: true
  });

  // Wait for server to start
  await wait(3000);

  let blockCount = 0;
  for (let i = 1; i <= 15; i++) {
    const res = await fetchLogin();
    if (res.status === 429) {
      console.log(`Request ${i}: Blocked (429)`);
      blockCount++;
    } else if (res.status === 401) {
      console.log(`Request ${i}: Rejected invalid credentials (401)`);
    } else {
      console.log(`Request ${i}: Unexpected status ${res.status}`);
    }
  }

  server.kill();
  const { execSync } = await import('child_process');
  try { execSync('taskkill /F /IM node.exe'); } catch(e){}
  await wait(1000);
}

async function main() {
  await runTest('development', 50);
  await runTest('production', 10);
  console.log('\nDone.');
}

main().catch(console.error);
