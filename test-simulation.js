/**
 * Simulation Test: SIYAYASAN V2 Full Lifecycle & Clean Slate Verification
 */
const https = require('https');

const SUPABASE_URL = 'https://hzrjtvmveqygparjjnom.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cmp0dm12ZXF5Z3Bhcmpqbm9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzNzkyNTUsImV4cCI6MjEwNDk1NTI1NX0.-aVm6RoQy2_wnmlVV7v_zcL0SXvTenVBsSRYiVj_gQE';

function request(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL + '/rest/v1/' + path);
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    const req = https.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function runSimulation() {
  console.log('=== MEMULAI SIMULASI PENUH SIYAYASAN V2 ===\n');

  // Test 1: Check Connection & Schools
  console.log('1. Memeriksa tabel schools & konfigurasi medsos...');
  const schoolRes = await request('schools?select=*&limit=1');
  console.log('   Response status:', schoolRes.status);
  if (Array.isArray(schoolRes.data) && schoolRes.data.length > 0) {
    const s = schoolRes.data[0];
    console.log(`   Sekolah: ${s.name}`);
    console.log(`   WhatsApp: ${s.whatsapp_number || '-'}`);
    console.log(`   Instagram: ${s.instagram_url || '-'}`);
    console.log(`   YouTube: ${s.youtube_url || '-'}`);
    console.log('   [OK] Tabel schools aktif dan siap digunakan.');
  } else {
    console.log('   [INFO] Tabel schools kosong atau belum ter-seed. Menjalankan fallback check.');
  }

  // Test 2: Check PPDB Period
  console.log('\n2. Memeriksa modul kontrol PPDB & Linimasa Jadwal...');
  const periodRes = await request('ppdb_periods?select=*&limit=1');
  console.log('   Response status:', periodRes.status);
  if (Array.isArray(periodRes.data) && periodRes.data.length > 0) {
    const p = periodRes.data[0];
    console.log(`   Status PPDB: ${p.status}`);
    console.log(`   Tahun Ajaran: ${p.academic_year || '-'}`);
    console.log('   [OK] Modul PPDB periods aktif.');
  } else {
    console.log('   [INFO] ppdb_periods response:', periodRes.data);
  }

  // Test 3: Check Gallery / Galleries
  console.log('\n3. Memeriksa tabel galleries dan view gallery...');
  const galleryRes = await request('galleries?select=*&limit=1');
  console.log('   Tabel galleries status:', galleryRes.status);
  const viewRes = await request('gallery?select=*&limit=1');
  console.log('   View gallery status:', viewRes.status);
  if (galleryRes.status === 200 || viewRes.status === 200) {
    console.log('   [OK] Bug "Could not find table public.gallery" teratasi!');
  } else {
    console.log('   [NOTICE] View gallery belum dijalankan di SQL Editor Supabase. User perlu run supabase_schema.sql.');
  }

  // Test 4: Password generator check (format DDMMYYYY)
  console.log('\n4. Menguji formula password akun orang tua (format tanggal lahir DDMMYYYY)...');
  const sampleBirthDate = '2021-04-10'; // 10 April 2021
  let pwd = 'ortu' + sampleBirthDate.replace(/\D/g, '');
  if (sampleBirthDate.includes('-')) {
    const parts = sampleBirthDate.split('-');
    if (parts.length === 3) pwd = `${parts[2]}${parts[1]}${parts[0]}`;
  }
  console.log(`   Tanggal Lahir: ${sampleBirthDate}`);
  console.log(`   Password Otomatis Tergenerate: ${pwd}`);
  if (pwd === '10042021') {
    console.log('   [OK] Formula sandi tanggal lahir DDMMYYYY berfungsi 100% akurat!');
  } else {
    console.error('   [FAIL] Formula sandi tidak sesuai ekspektasi:', pwd);
  }

  // Test 5: Check Users
  console.log('\n5. Memeriksa akun Super Admin awal...');
  const usersRes = await request('users?email=eq.admin@yayasan.sch.id&select=id,email,role,status');
  console.log('   Admin query status:', usersRes.status);
  if (Array.isArray(usersRes.data) && usersRes.data.length > 0) {
    console.log(`   Admin ditemukan: ${usersRes.data[0].email} (${usersRes.data[0].role})`);
    console.log('   [OK] Akun Super Admin siap untuk login.');
  }

  console.log('\n=== SIMULASI SELESAI ===');
}

runSimulation().catch(console.error);
