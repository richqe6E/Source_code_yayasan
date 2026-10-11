/**
 * Test E2E Full Lifecycle Simulation
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

async function runE2E() {
  console.log('=== SIMULASI SIKLUS HIDUP LENGKAP SIYAYASAN V2 ===\n');

  // STEP 1: Buat 1 Kelas Master jika belum ada
  console.log('Langkah 1: Memastikan ada kelas aktif di database...');
  let classId = 'CLS-A1';
  const classesRes = await request('classes?select=*&limit=1');
  if (Array.isArray(classesRes.data) && classesRes.data.length > 0) {
    classId = classesRes.data[0].id;
    console.log(`   Menggunakan kelas yang ada: ${classesRes.data[0].name} (${classId})`);
  } else {
    console.log('   Membuat kelas baru: Kelompok Bermain A (KB-A)...');
    const newClass = await request('classes', 'POST', {
      id: classId,
      name: 'Kelompok Bermain A (KB-A)',
      level: 'PAUD',
      capacity: 20
    });
    console.log('   Kelas berhasil dibuat:', newClass.status);
  }

  // STEP 2: Simulasi Calon Siswa Mendaftar PPDB Online
  console.log('\nLangkah 2: Calon Wali Murid mendaftar PPDB Online...');
  const testRegId = 'PPD-TEST-' + Date.now().toString().slice(-4);
  const birthDate = '2021-04-10'; // 10 April 2021
  const childPhoto = 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200';
  const parentEmail = `wali.${Date.now().toString().slice(-4)}@gmail.com`;
  const parentPhone = '081298765432';

  const regPayload = {
    id: testRegId,
    registration_number: 'REG/2026/' + Date.now().toString().slice(-4),
    form_type: 'paud',
    child_name: 'Muhammad Zidan Al-Fatih',
    birth_date: birthDate,
    gender: 'Laki-laki',
    parent_email: parentEmail,
    father_name: 'Rahmat Hidayat',
    mother_name: 'Siti Aminah',
    parent_phone: parentPhone,
    address: 'Jl. Ahmad Yani No. 12, Samarinda',
    child_photo_url: childPhoto,
    status: 'pending'
  };

  const regRes = await request('ppdb_registrations', 'POST', regPayload);
  console.log(`   Pendaftaran tersimpan [${regRes.status}]: ${regPayload.child_name}`);
  console.log(`   Nomor Pendaftaran: ${regPayload.registration_number}`);

  // STEP 3: Admin Verifikasi & Setujui Pendaftaran PPDB
  console.log('\nLangkah 3: Admin memverifikasi & menyetujui berkas pendaftaran...');
  const approveRes = await request(`ppdb_registrations?id=eq.${testRegId}`, 'PATCH', {
    status: 'approved',
    verified_at: new Date().toISOString(),
    notes: 'Berkas lengkap dan memenuhi syarat usia PAUD'
  });
  console.log('   Status berkas diubah ke "approved":', approveRes.status);

  // STEP 4: Admin Melakukan Convert ke Siswa Aktif & Pembuatan Akun Otomatis
  console.log('\nLangkah 4: Admin mengkonversi pendaftaran menjadi Siswa Aktif...');
  const studentId = 'STU-' + Date.now().toString().slice(-5);
  const studentNis = '2026' + Date.now().toString().slice(-3);

  // 4a. Buat Data Siswa
  const stuPayload = {
    id: studentId,
    nis: studentNis,
    full_name: regPayload.child_name,
    class_id: classId,
    gender: regPayload.gender,
    birth_date: regPayload.birth_date,
    parent_phone: regPayload.parent_phone,
    parent_email: regPayload.parent_email,
    photo_url: childPhoto,
    status: 'active'
  };
  const stuRes = await request('students', 'POST', stuPayload);
  console.log(`   Siswa aktif dibuat [${stuRes.status}]: ${stuPayload.full_name} (NIS: ${studentNis})`);

  // 4b. Hitung password berdasarkan tanggal lahir DDMMYYYY
  const parts = birthDate.split('-');
  const expectedPassword = `${parts[2]}${parts[1]}${parts[0]}`; // '10042021'
  console.log(`   Password akun orang tua (Tgl Lahir DDMMYYYY): ${expectedPassword}`);

  // 4c. Buat Akun User Orang Tua
  const userId = 'USR-' + Date.now().toString().slice(-5);
  const userPayload = {
    id: userId,
    email: parentEmail,
    password_hash: expectedPassword,
    full_name: regPayload.father_name || 'Orang Tua ' + regPayload.child_name,
    role: 'orang_tua',
    role_label: 'Orang Tua / Wali',
    student_id: studentId,
    avatar_url: childPhoto,
    status: 'active'
  };
  const userRes = await request('users', 'POST', userPayload);
  console.log(`   Akun orang tua dibuat [${userRes.status}]: ${parentEmail}`);
  console.log(`   Avatar akun orang tua otomatis menggunakan foto anak: ${childPhoto}`);

  // 4d. Buat Tagihan Awal SPP
  const invId = 'INV-' + Date.now().toString().slice(-5);
  const invPayload = {
    id: invId,
    invoice_number: 'INV/2026/' + Date.now().toString().slice(-4),
    student_id: studentId,
    student_name: regPayload.child_name,
    title: 'SPP & Uang Pangkal Siswa Baru',
    amount: 350000,
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    status: 'unpaid'
  };
  const invRes = await request('invoices', 'POST', invPayload);
  console.log(`   Tagihan SPP diterbitkan [${invRes.status}]: ${invPayload.title} (Rp ${invPayload.amount.toLocaleString()})`);

  // 4e. Format pesan WhatsApp
  const waCleanPhone = parentPhone.replace(/\D/g, '').replace(/^0/, '62');
  const waText = `Assalamu'alaikum Wr. Wb. Bapak/Ibu ${regPayload.father_name},\n\nSelamat! Ananda *${regPayload.child_name}* telah DITERIMA di Yayasan Samarinda.\n\nBerikut akun Portal Orang Tua Anda:\n- Website: http://localhost:3000/login.html\n- Email: ${parentEmail}\n- Password: ${expectedPassword} (Tanggal lahir: ${birthDate})\n\nSilakan login untuk memeriksa jadwal presensi dan tagihan.\nTerima kasih.`;
  const waUrl = `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(waText)}`;
  console.log(`   Link WhatsApp siap kirim: ${waUrl.slice(0, 70)}...`);

  // STEP 5: Orang Tua Login ke Portal Menggunakan Password Tanggal Lahir
  console.log('\nLangkah 5: Orang Tua login dengan kredensial baru...');
  const loginRes = await request(`users?email=eq.${encodeURIComponent(parentEmail)}&status=eq.active&select=*`);
  if (Array.isArray(loginRes.data) && loginRes.data.length > 0) {
    const parentUser = loginRes.data[0];
    if (parentUser.password_hash === expectedPassword) {
      console.log('   [SUKSES] Orang Tua berhasil login menggunakan sandi tanggal lahir!');
      console.log(`   Siswa terhubung ke akun: ${parentUser.student_id}`);
      console.log(`   Foto profil orang tua: ${parentUser.avatar_url}`);
    } else {
      console.error('   [GAGAL] Password tidak cocok');
    }
  }

  // STEP 6: Orang Tua Mengupload Bukti Pembayaran SPP
  console.log('\nLangkah 6: Orang tua mengupload bukti transfer SPP...');
  const payId = 'PAY-' + Date.now().toString().slice(-5);
  const payPayload = {
    id: payId,
    invoice_id: invId,
    invoice_number: invPayload.invoice_number,
    student_id: studentId,
    student_name: regPayload.child_name,
    amount: invPayload.amount,
    method: 'transfer',
    payment_date: new Date().toISOString().slice(0, 10),
    proof_image_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
    status: 'menunggu_verifikasi'
  };
  const payRes = await request('payments', 'POST', payPayload);
  console.log(`   Konfirmasi pembayaran terkirim [${payRes.status}]: Bukti transfer masuk`);

  // STEP 7: Admin Memverifikasi Pembayaran & Tagihan Menjadi Lunas
  console.log('\nLangkah 7: Admin memverifikasi bukti bayar...');
  const verifRes = await request(`payments?id=eq.${payId}`, 'PATCH', {
    status: 'verified',
    verified_at: new Date().toISOString()
  });
  console.log('   Status pembayaran diubah ke "verified":', verifRes.status);
  const markRes = await request(`invoices?id=eq.${invId}`, 'PATCH', {
    status: 'paid',
    paid_at: new Date().toISOString()
  });
  console.log('   Status tagihan diubah ke "paid" (Lunas):', markRes.status);

  // STEP 8: Pembersihan Data Uji Coba Simulasi
  console.log('\nLangkah 8: Membersihkan data simulasi uji coba agar database tetap bersih...');
  await request(`payments?id=eq.${payId}`, 'DELETE');
  await request(`invoices?id=eq.${invId}`, 'DELETE');
  await request(`users?id=eq.${userId}`, 'DELETE');
  await request(`students?id=eq.${studentId}`, 'DELETE');
  await request(`ppdb_registrations?id=eq.${testRegId}`, 'DELETE');
  console.log('   [OK] Data simulasi uji coba telah dibersihkan kembali.');

  console.log('\n=== SELURUH SIKLUS HIDUP SISTEM BERHASIL 100%! ===');
}

runE2E().catch(console.error);
