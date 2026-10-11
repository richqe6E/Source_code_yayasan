const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const ROUTES = [
  '/',
  '/index.html',
  '/profil.html',
  '/berita.html',
  '/agenda.html',
  '/galeri.html',
  '/pengumuman.html',
  '/kontak.html',
  '/login.html',
  '/register.html',
  '/ppdb.html',
  '/ppdb/form-paud.html',
  '/ppdb/form-tpq.html',
  '/ppdb/status.html',
  '/videos/vector-login.mp4',
  '/assets/lottie/education.json',
  '/public/js/lottie-player.js',
  '/public/css/style.css',
  '/public/js/app.js',
  '/public/js/public-shell.js',
  '/shared/js/api.js',
  '/shared/js/auth.js',
  '/shared/js/shell.js',
  // Admin portal
  '/admin/dashboard.html',
  '/admin/cms_setting.html',
  '/admin/students.html',
  '/admin/classes.html',
  '/admin/ppdb.html',
  '/admin/payments.html',
  '/admin/users.html',
  '/admin/content.html',
  '/admin/reports.html',
  '/admin/logs.html',
  // Siswa portal
  '/siswa/dashboard.html',
  '/siswa/biodata.html',
  '/siswa/dokumen.html',
  '/siswa/akademik.html',
  '/siswa/spp.html'
];

async function checkRoute(route) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${route}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          route,
          status: res.statusCode,
          contentType: res.headers['content-type'],
          size: data.length,
          hasError: res.statusCode >= 400
        });
      });
    }).on('error', (err) => {
      resolve({
        route,
        status: 'ERROR',
        error: err.message,
        hasError: true
      });
    });
  });
}

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  let serverProcess = null;
  
  // Cek apakah server sudah aktif di port 3000
  const initialCheck = await checkRoute('/');
  if (initialCheck.status === 'ERROR') {
    console.log('Menjalankan dev-server otomatis di latar belakang...');
    serverProcess = spawn('node', ['dev-server.js'], {
      cwd: __dirname,
      stdio: 'ignore'
    });
    // Tunggu server startup
    await wait(1200);
  }

  console.log(`Menguji ${ROUTES.length} rute di localhost:3000...\n`);
  let errors = 0;
  for (const r of ROUTES) {
    const res = await checkRoute(r);
    if (res.hasError) {
      errors++;
      console.error(`❌ [${res.status}] ${res.route} - ${res.error || ''}`);
    } else {
      console.log(`✅ [${res.status}] ${res.route} (${res.size} bytes)`);
    }
  }

  if (serverProcess) {
    serverProcess.kill();
  }

  console.log(`\nSelesai: ${ROUTES.length - errors}/${ROUTES.length} sukses.`);
  if (errors > 0) process.exit(1);
}

run();
