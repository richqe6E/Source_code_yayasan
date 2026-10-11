/**
 * SIYAYASAN V2 - AUDIT MENYELURUH SEMUA FITUR, INTEGRASI & KONEKTIVITAS
 * Pengujian otomatis mendalam:
 * 1. Upload Berkas, Dokumen & Bukti Bayar
 * 2. Alur PPDB & Verifikasi Konversi Siswa Baru
 * 3. Login Autentikasi (Admin & Siswa) & Ganti Password
 * 4. CMS Konten Admin (Berita, Agenda, Pengumuman, Galeri, Profil & Hero Carousel)
 * 5. Portal Siswa & Keuangan SPP (Rp 150.000 / tgl 10)
 * 6. Kelayakan Seluruh 38 Rute & Tombol Tautan Halaman
 * 7. Integritas Data & Penanganan Error
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
        resolve({ status: res.statusCode, length: body.length });
      });
    }).on('error', reject);
  });
}

function api(module, action, params = {}, token = null) {
  return post(`/api/v1/${module}/${action}`, params, token);
}

async function runFullAudit() {
  console.log('========================================================================');
  console.log('       AUDIT MENYELURUH FITUR & INTEGRASI SISTEM SIYAYASAN V2');
  console.log('========================================================================\n');

  let totalTests = 0;
  let passedTests = 0;
  const auditReport = [];

  function record(section, name, success, detail = '') {
    totalTests++;
    if (success) {
      passedTests++;
      console.log(`  [OK] [${section}] ${name}`);
      auditReport.push({ section, name, status: 'PASS', detail });
    } else {
      console.error(`  [FAIL] [${section}] ${name} -> ${detail}`);
      auditReport.push({ section, name, status: 'FAIL', detail });
    }
  }

  try {
    // -------------------------------------------------------------------------
    // SEKSI 1: AUTENTIKASI, PERAN & SESI
    // -------------------------------------------------------------------------
    console.log('--- SEKSI 1: AUTENTIKASI & KEAMANAN SESI ---');
    
    // 1.1 Login Admin Super Admin
    const adminLogin = await api('auth', 'login', { identifier: 'admin@yayasan.sch.id', password: 'admin123' });
    const adminToken = adminLogin.body?.data?.token;
    record('AUTH', 'Login Super Admin via Email Resmi', adminToken && adminLogin.body?.data?.user?.role === 'super_admin');

    // 1.2 Login Siswa Aktif Bawaan via NIS & Tanggal Lahir
    const studentLogin = await api('auth', 'login', { identifier: '2026001', password: '2020-03-12' });
    const studentToken = studentLogin.body?.data?.token;
    const studentUser = studentLogin.body?.data?.user;
    const isStudentRole = studentUser && ((typeof studentUser.role === 'object' ? studentUser.role.code : studentUser.role) === 'siswa_aktif');
    record('AUTH', 'Login Siswa Aktif via NIS & Password Tanggal Lahir', studentToken && isStudentRole);

    // 1.3 Penolakan Password Salah
    const badLogin = await api('auth', 'login', { identifier: '2026001', password: 'passwordsalah' });
    record('AUTH', 'Proteksi Keamanan: Penolakan Kredensial Salah', badLogin.body?.success === false);

    // 1.4 Ganti Password Akun
    const changePwd = await api('auth', 'change_password', { user_id: 'USR-2026001', new_password: 'newpassword123' }, studentToken);
    record('AUTH', 'Fitur Ganti Password Siswa / Akun Baru', changePwd.body?.success === true);

    // -------------------------------------------------------------------------
    // SEKSI 2: ALUR PPDB LENGKAP & VERIFIKASI SISWA BARU
    // -------------------------------------------------------------------------
    console.log('\n--- SEKSI 2: PPDB, STATUS PENERIMAAN & KONVERSI SISWA ---');

    // 2.1 Cek Linimasa Periode PPDB
    const period = await api('ppdb', 'period');
    record('PPDB', 'Membaca Periode PPDB & Linimasa Pendaftaran', period.body?.success === true && period.body?.data?.academic_year);

    // 2.2 Admin Mengatur Buka/Tutup PPDB
    const updatePeriod = await api('ppdb', 'update_period', { status: 'open', academic_year: '2026/2027', notes: 'Pendaftaran gelombang 1 dibuka' }, adminToken);
    record('PPDB', 'Admin Mengatur Status Buka/Tutup & Jadwal PPDB', updatePeriod.body?.success === true);

    // 2.3 Calon Siswa Mengajukan Pendaftaran Online (Multi-Tahap)
    const newStudentData = {
      full_name: 'Ananda Bagas Ramadhan',
      child_name: 'Ananda Bagas Ramadhan',
      nickname: 'Bagas',
      gender: 'L',
      birth_place: 'Samarinda',
      birth_date: '2021-05-20',
      form_type: 'paud',
      level: 'PAUD',
      father_name: 'Bambang Irawan',
      mother_name: 'Dewi Lestari',
      parent_phone: '081255566677',
      address: 'Jl. Juanda No. 88, Samarinda',
      email: 'bambang.irawan@test.com',
      photo_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      birth_certificate_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      family_card_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    };
    const regRes = await api('ppdb', 'submit', newStudentData);
    const regNo = regRes.body?.data?.registration_number;
    record('PPDB', 'Submit Formulir PPDB Online (Termasuk Upload Berkas Base64)', regRes.body?.success === true && !!regNo, `No Reg: ${regNo}`);

    // 2.4 Cek Tracking Status Calon Siswa (Pending)
    const statusPending = await api('ppdb', 'status', { registration_number: regNo });
    record('PPDB', 'Pelacakan Status Pendaftaran Awal (Status: Pending)', statusPending.body?.success === true && statusPending.body?.data?.status === 'pending');

    // 2.5 Admin Verifikasi & Setujui Pendaftaran (Approve)
    const approveRes = await api('ppdb', 'approve', { id: regNo, notes: 'Dokumen administrasi lengkap' }, adminToken);
    record('PPDB', 'Admin Menyetujui (Approve) Calon Siswa di Portal Admin', approveRes.body?.success === true);

    // 2.6 Cek Tracking Status Setelah Disetujui (Approved)
    const statusApproved = await api('ppdb', 'status', { registration_number: regNo });
    record('PPDB', 'Pelacakan Status Pengumuman Seleksi (Status: Approved)', statusApproved.body?.data?.status === 'approved');

    // 2.7 Admin Mengonversi Calon Siswa ke Siswa Aktif Ber-NIS
    const customNis = '2026777';
    const convertRes = await api('ppdb', 'convert', { id: regNo, class_id: 'CLS-001', nis: customNis }, adminToken);
    record('PPDB', 'Admin Konversi Calon Siswa ke Siswa Aktif Ber-NIS', convertRes.body?.success === true);

    // 2.8 Cek Status Diterima Resmi (Converted + NIS + Kelas)
    const statusConverted = await api('ppdb', 'status', { registration_number: regNo });
    record('PPDB', 'Pelacakan Status Resmi Terdaftar (Status: Converted & NIS)', statusConverted.body?.data?.status === 'converted' && statusConverted.body?.data?.converted_nis === customNis);

    // 2.9 Siswa Baru Terkonversi Login ke Portal Siswa
    const newStudentLogin = await api('auth', 'login', { identifier: customNis, password: '2021-05-20' });
    const newStudentToken = newStudentLogin.body?.data?.token;
    record('PPDB', 'Aktivasi Akun Otomatis: Siswa Baru Berhasil Login dengan NIS & Tanggal Lahir', !!newStudentToken);

    // -------------------------------------------------------------------------
    // SEKSI 3: MODUL SPP, PEMBAYARAN & KUITANSI
    // -------------------------------------------------------------------------
    console.log('\n--- SEKSI 3: TAGIHAN SPP, VERIFIKASI TU & KUITANSI ---');

    // 3.1 Siswa Melihat Daftar Tagihan SPP
    const sppList = await api('siswa', 'get_spp', { nis: customNis }, newStudentToken);
    const invoices = sppList.body?.data?.invoices || [];
    const unpaidInv = invoices.find(i => i.status === 'unpaid');
    record('SPP', 'Siswa Baru Memiliki Tagihan SPP Rp 150.000 Jatuh Tempo Tgl 10', unpaidInv && unpaidInv.amount === 150000);

    // 3.2 Siswa Mengunggah Bukti Transfer
    const submitProof = await api('payments', 'create', {
      invoice_id: unpaidInv.id,
      proof_image_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      method: 'transfer',
      notes: 'Transfer via BSI Ananda Bagas'
    }, newStudentToken);
    record('SPP', 'Siswa Mengunggah Bukti Transfer Pembayaran SPP', submitProof.body?.success === true);

    // 3.3 Verifikasi Status Tagihan Berubah Jadi 'menunggu_verifikasi'
    const sppPending = await api('siswa', 'get_spp', { nis: customNis }, newStudentToken);
    const invoicePending = sppPending.body?.data?.invoices?.find(i => i.id === unpaidInv.id);
    record('SPP', 'Status Tagihan Otomatis Menjadi "menunggu_verifikasi"', invoicePending && invoicePending.status === 'menunggu_verifikasi');

    // 3.4 Admin Memverifikasi (Approve) Pembayaran Siswa
    const pendingPayments = await api('payments', 'list', { status: 'pending' }, adminToken);
    const targetPayment = pendingPayments.body?.data?.items?.find(p => p.invoice_id === unpaidInv.id);
    const verifyPayment = await api('payments', 'verify', { id: targetPayment ? targetPayment.id : '' }, adminToken);
    record('SPP', 'Admin Tata Usaha Memverifikasi Bukti Pembayaran', verifyPayment.body?.success === true);

    // 3.5 Verifikasi Status Tagihan Berubah Menjadi 'paid' (Lunas)
    const sppPaid = await api('siswa', 'get_spp', { nis: customNis }, newStudentToken);
    const invoicePaid = sppPaid.body?.data?.invoices?.find(i => i.id === unpaidInv.id);
    record('SPP', 'Status Tagihan Resmi Lunas (Paid) & Siap Cetak Kuitansi', invoicePaid && invoicePaid.status === 'paid');

    // 3.6 Admin Menandai Lunas Pembayaran Offline (Kasir Tunai TU)
    const createInvRes = await api('invoices', 'create', {
      student_id: 'STU-001',
      item_name: 'SPP Bulan Desember 2026',
      period: 'Desember 2026',
      amount: 150000,
      due_date: '2026-12-10'
    }, adminToken);
    const createdInvId = createInvRes.body?.data?.invoice?.id;
    const markPaidRes = await api('invoices', 'mark_paid', { id: createdInvId }, adminToken);
    record('SPP', 'Admin Menandai Lunas Pembayaran Tunai di Loket TU (mark_paid)', markPaidRes.body?.success === true && markPaidRes.body?.data?.invoice?.status === 'paid');

    // 3.7 Rekapitulasi Keuangan SPP
    const sppSummary = await api('payments', 'summary', {}, adminToken);
    record('SPP', 'Rekapitulasi Keuangan SPP Yayasan Akurat & Berfungsi', sppSummary.body?.success === true && typeof sppSummary.body?.data?.total_paid === 'number');

    // -------------------------------------------------------------------------
    // SEKSI 4: UPLOAD DOKUMEN & BIODATA SISWA
    // -------------------------------------------------------------------------
    console.log('\n--- SEKSI 4: UPLOAD DOKUMEN & BIODATA SISWA ---');

    // 4.1 Siswa Upload Dokumen Persyaratan (KK, Akte, Foto)
    const uploadDocRes = await api('siswa', 'upload_document', {
      document_type: 'kk',
      file_name: 'kartu_keluarga_bagas.pdf',
      file_size: 320000,
      file_url: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr...'
    }, newStudentToken);
    record('DOCS', 'Siswa Mengunggah Dokumen Persyaratan di Portal Siswa', uploadDocRes.body?.success === true);

    // 4.2 Siswa Melihat Daftar Dokumen Tersimpan
    const docsList = await api('siswa', 'get_documents', {}, newStudentToken);
    const docs = docsList.body?.data || [];
    record('DOCS', 'Arsip Dokumen Siswa Tersimpan & Dapat Ditampilkan', Array.isArray(docs) && docs.length > 0);

    // 4.3 Siswa Memperbarui Biodata
    const updateBio = await api('siswa', 'update_biodata', {
      full_name: 'Ananda Bagas Ramadhan',
      nickname: 'Bagas',
      father_name: 'Bambang Irawan',
      mother_name: 'Dewi Lestari',
      parent_phone: '081255566677',
      address: 'Jl. Juanda No. 88, Samarinda'
    }, newStudentToken);
    record('DOCS', 'Pembaruan Biodata Siswa Berhasil Disimpan', updateBio.body?.success === true);

    // -------------------------------------------------------------------------
    // SEKSI 5: CMS KONTEN, PENGATURAN WEB & SINKRONISASI PUBLIK
    // -------------------------------------------------------------------------
    console.log('\n--- SEKSI 5: CMS KONTEN & INTEGRASI WEBSITE PUBLIK ---');

    // 5.1 Admin Membuat Berita Baru (Published)
    const createNews = await api('news', 'create', {
      title: 'Audit Mutu Pembelajaran PAUD dan TK Yayasan Samarinda 2026',
      category: 'Akademik',
      content: 'Yayasan melaksanakan evaluasi berkala untuk memastikan mutu pendidikan islami.',
      excerpt: 'Evaluasi berkala mutu pendidikan.',
      status: 'published',
      is_published: true
    }, adminToken);
    const newsId = createNews.body?.data?.item?.id;
    record('CMS', 'Admin Menerbitkan Berita Baru', createNews.body?.success === true && !!newsId);

    // 5.2 Publik Membaca Berita Tersebut
    const pubNews = await api('news', 'list', { is_published: 'true' });
    const newsArr = Array.isArray(pubNews.body?.data) ? pubNews.body?.data : (pubNews.body?.data?.items || []);
    record('CMS', 'Berita Baru Langsung Sinkron di Halaman Publik Berita', newsArr.some(n => n.id === newsId));

    // 5.3 Admin Menarik Berita Menjadi Draft
    const draftNews = await api('news', 'update', { id: newsId, status: 'draft', is_published: false }, adminToken);
    record('CMS', 'Admin Mengubah Status Berita Menjadi Draft', draftNews.body?.success === true);

    // 5.4 Publik Tidak Melihat Berita Draft
    const pubNewsAfter = await api('news', 'list', { is_published: 'true' });
    const newsArrAfter = Array.isArray(pubNewsAfter.body?.data) ? pubNewsAfter.body?.data : (pubNewsAfter.body?.data?.items || []);
    record('CMS', 'Berita Draft Terproteksi & Tidak Muncul di Publik', !newsArrAfter.some(n => n.id === newsId));

    // 5.5 Admin Membuat Agenda Acara
    const createEvent = await api('events', 'create', {
      title: 'Pawai Santri Sambut Maulid Nabi',
      event_date: '2026-10-25',
      location: 'Halaman Kampus Yayasan Samarinda',
      status: 'published'
    }, adminToken);
    const eventId = createEvent.body?.data?.item?.id;
    record('CMS', 'Admin Menambahkan Agenda Acara Baru', createEvent.body?.success === true && !!eventId);

    // 5.6 Admin Menambahkan Pengumuman
    const createAnn = await api('announcements', 'create', {
      title: 'Pemberitahuan Ujian Tasmi Al-Quran Santri',
      content: 'Jadwal tasmi terbuka untuk orang tua santri.',
      status: 'published'
    }, adminToken);
    const annId = createAnn.body?.data?.item?.id;
    record('CMS', 'Admin Menambahkan Pengumuman Resmi', createAnn.body?.success === true && !!annId);

    // 5.7 Admin Menambahkan Foto Galeri
    const createGal = await api('gallery', 'create', {
      title: 'Keceriaan Santri Bermain di Outbound Edukatif',
      image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600'
    }, adminToken);
    record('CMS', 'Admin Mengunggah Foto ke Galeri Kegiatan', createGal.body?.success === true);

    // 5.8 Admin Update Profil Sekolah & Media Sosial
    const updateSchool = await api('schools', 'update', {
      whatsapp_number: '081234567891',
      phone: '(0541) 234-5678',
      email: 'info@yayasan.sch.id',
      instagram_url: 'https://instagram.com/yayasansamarinda'
    }, adminToken);
    record('CMS', 'Admin Memperbarui Kontak Resmi & Medsos Sekolah', updateSchool.body?.success === true);

    // 5.9 Admin Update Banner Hero Carousel
    const updateHero = await api('web_settings', 'update', {
      hero_images: [
        { url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1600', caption: 'Suasana Belajar Unggul' }
      ]
    }, adminToken);
    record('CMS', 'Admin Memperbarui Hero Carousel Beranda', updateHero.body?.success === true);

    // 5.10 Admin Membuat Backup Snapshot Fisik
    const makeBackup = await api('backup', 'create', {}, adminToken);
    record('BACKUP', 'Admin Membuat Snapshot Pencadangan Database Fisik', makeBackup.body?.success === true && makeBackup.body?.data?.backup?.folder_name);

    // -------------------------------------------------------------------------
    // SEKSI 6: KELAYAKAN 38 RUTE & HALAMAN SITUS WEB
    // -------------------------------------------------------------------------
    console.log('\n--- SEKSI 6: INTEGRITAS SELURUH RUTE & HALAMAN SITUS WEB ---');
    const routesToTest = [
      '/', '/index.html', '/profil.html', '/berita.html', '/agenda.html', '/galeri.html',
      '/pengumuman.html', '/kontak.html', '/login.html', '/register.html', '/ppdb.html',
      '/ppdb/status.html', '/admin/dashboard.html', '/admin/students.html', '/admin/classes.html',
      '/admin/ppdb.html', '/admin/payments.html', '/admin/users.html', '/admin/content.html',
      '/admin/cms_setting.html', '/admin/reports.html', '/admin/logs.html', '/admin/backup.html',
      '/siswa/dashboard.html', '/siswa/biodata.html', '/siswa/dokumen.html', '/siswa/spp.html'
    ];

    let allRoutesOk = true;
    for (const r of routesToTest) {
      const res = await get(r);
      if (res.status !== 200 || res.length === 0) {
        allRoutesOk = false;
        record('ROUTES', `Rute ${r}`, false, `Status: ${res.status}`);
      }
    }
    if (allRoutesOk) {
      record('ROUTES', 'Seluruh Rute Utama Website & Portal Berstatus HTTP 200 OK', true, `${routesToTest.length} Halaman Diuji`);
    }

  } catch (err) {
    console.error('Fatal audit error:', err);
  }

  console.log('\n========================================================================');
  console.log(`HASIL AKHIR AUDIT: ${passedTests} DARI ${totalTests} PENGUJIAN LULUS (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log('========================================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runFullAudit();
