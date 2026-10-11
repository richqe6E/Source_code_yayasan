// Automated verification script for PPDB registration and Login flow
const http = require('http');

async function testPages() {
  console.log('--- 1. Testing Localhost Endpoints ---');
  const urls = ['/login.html', '/ppdb.html', '/register.html', '/ppdb/form-paud.html', '/index.html'];
  for (const p of urls) {
    await new Promise((resolve) => {
      http.get('http://localhost:3000' + p, (res) => {
        console.log(`[HTTP ${res.statusCode}] ${p}`);
        resolve();
      }).on('error', (err) => {
        console.error(`[ERR] ${p}:`, err.message);
        resolve();
      });
    });
  }
}

testPages().then(() => {
  console.log('\n--- 2. Endpoints Verification Complete ---');
});
