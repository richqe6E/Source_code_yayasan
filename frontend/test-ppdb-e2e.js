/**
 * Test End-to-End Alur PPDB & Sinkronisasi Portal Siswa
 * Menguji:
 * 1. Periode PPDB
 * 2. Submit Pendaftaran Baru
 * 3. Cek Status (Pending)
 * 4. Admin Verifikasi / Approve
 * 5. Cek Status (Approved)
 * 6. Admin Konversi ke Siswa Aktif (Convert)
 * 7. Cek Status (Converted + NIS + Kelas)
 * 8. Login Siswa Baru di Portal Siswa menggunakan NIS & Tanggal Lahir
 * 9. Cek data SPP siswa baru di Portal Siswa
 */

const http = require('http');

function post(endpoint, data = {}, token = null) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const req = http.request(`http://localhost:3000${endpoint}`, {
      method: 'POST',
      headers
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(endpoint, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;

    http.get(`http://localhost:3000${endpoint}`, { headers }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    }).on('error', reject);
  });
}

async function api(module, action, data = {}, token = null) {
  return post(`/api/v1/${module}/${action}`, data, token);
}

async function runTest() {
  console.log('🚀 Memulai Uji End-to-End PPDB & Portal Siswa...');
  let passed = 0;
  let total = 0;

  function assert(desc, condition) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
    }
  }

  try {
    // 1. Admin Login
    const adminLogin = await api('auth', 'login', { identifier: 'admin@yayasan.sch.id', password: 'admin123' });
    assert('1. Admin login berhasil', adminLogin.body && adminLogin.body.success && adminLogin.body.data.token);
    const adminToken = adminLogin.body.data.token;

    // 2. Cek Periode PPDB
    const periodRes = await api('ppdb', 'period');
    assert('2. Membaca periode PPDB publik', periodRes.body && periodRes.body.success && periodRes.body.data.academic_year);

    // 3. Submit Pendaftaran Baru
    const newRegData = {
      full_name: 'Muhammad Rayyan Al-Farizi',
      child_name: 'Muhammad Rayyan Al-Farizi',
      nickname: 'Rayyan',
      gender: 'L',
      birth_place: 'Samarinda',
      birth_date: '2021-08-15',
      form_type: 'paud',
      level: 'PAUD',
      father_name: 'Fauzi Rahman',
      mother_name: 'Siti Maryam',
      parent_phone: '081298765432',
      address: 'Jl. P. Suryanata No. 12, Samarinda',
      email: 'fauzi.rahman@test.com'
    };
    const submitRes = await api('ppdb', 'submit', newRegData);
    assert('3. Submit pendaftaran calon siswa baru', submitRes.body && submitRes.body.success);
    const regNum = submitRes.body.data.registration_number;
    console.log(`     -> Nomor Registrasi Diterbitkan: ${regNum}`);

    // 4. Cek Status Awal (Pending)
    const check1 = await api('ppdb', 'check_status', { registration_number: regNum });
    assert('4. Cek status pendaftaran baru berstatus pending', check1.body && check1.body.success && check1.body.data.status === 'pending');

    // 5. Admin Approve Pendaftar
    const approveRes = await api('ppdb', 'approve', { id: regNum, notes: 'Dokumen akta kelahiran & KK lengkap dan terverifikasi.' }, adminToken);
    assert('5. Admin menyetujui (approve) pendaftaran', approveRes.body && approveRes.body.success);

    // 6. Cek Status Setelah Disetujui (Approved)
    const check2 = await api('ppdb', 'check_status', { registration_number: regNum });
    assert('6. Cek status setelah diverifikasi berstatus approved', check2.body && check2.body.success && check2.body.data.status === 'approved');

    // 7. Admin Konversi Menjadi Siswa Aktif
    const targetNis = '2026' + String(Date.now()).slice(-4);
    const convertRes = await api('ppdb', 'convert', { id: regNum, class_id: 'CLS-001', nis: targetNis }, adminToken);
    assert('7. Admin mengonversi calon siswa ke siswa aktif (convert)', convertRes.body && convertRes.body.success && convertRes.body.data.nis === targetNis);

    // 8. Cek Status Pendaftar Setelah Dikonversi (Converted + NIS + Kelas)
    const check3 = await api('ppdb', 'check_status', { registration_number: regNum });
    assert('8. Cek status publik menampilkan status converted & NIS baru', 
      check3.body && check3.body.success && 
      check3.body.data.status === 'converted' && 
      check3.body.data.converted_nis === targetNis
    );
    console.log(`     -> Calon Siswa Kini Memiliki NIS: ${check3.body.data.converted_nis}, Kelas: ${check3.body.data.class_name}`);

    // 9. Login Siswa Baru Menggunakan NIS & Tanggal Lahir (YYYY-MM-DD)
    const studentLogin = await api('auth', 'login', { identifier: targetNis, password: '2021-08-15' });
    assert('9. Siswa baru berhasil login ke Portal Siswa dengan NIS & Tanggal Lahir', 
      studentLogin.body && studentLogin.body.success && 
      studentLogin.body.data.user && 
      studentLogin.body.data.user.nis === targetNis
    );
    const studentToken = studentLogin.body.data.token;

    // 10. Siswa Mengakses Profil & Data SPP di Portal Siswa
    const studentProfile = await api('siswa', 'get_profile', { nis: targetNis }, studentToken);
    assert('10. Siswa baru dapat mengakses profil di portal siswa', studentProfile.body && studentProfile.body.success);

    const studentSpp = await api('siswa', 'get_spp', { nis: targetNis }, studentToken);
    assert('11. Siswa baru dapat mengakses tagihan SPP di portal siswa', studentSpp.body && studentSpp.body.success);

    console.log(`\n========================================`);
    console.log(`Hasil Uji: ${passed} dari ${total} pengujian BERHASIL (${Math.round((passed/total)*100)}%)`);
    console.log(`========================================`);

    if (passed === total) {
      process.exit(0);
    } else {
      process.exit(1);
    }

  } catch (err) {
    console.error('Error saat eksekusi uji:', err);
    process.exit(1);
  }
}

runTest();
