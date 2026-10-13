/**
 * Local Mock API for SIYAYASAN V2
 * Menyediakan mock backend lokal yang 100% kompatibel dengan contract Apps Script backend.
 * Memungkinkan pengujian end-to-end tanpa kendala CORS dan login Google.
 */

const fs = require('fs');
const path = require('path');
const { generateSeedData } = require('./seed-data');

const SEEDS = generateSeedData();

// Initial seed data
const DB = {
  users: [
    {
      id: 'USR-001',
      name: 'Makhrus (Ketua Yayasan)',
      full_name: 'Makhrus',
      email: 'admin@yayasan.sch.id',
      password: 'admin123',
      role: 'super_admin',
      role_label: 'Ketua Yayasan / Super Admin',
      status: 'active',
      phone: '081347142829',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
    },
    {
      id: 'USR-002',
      name: 'Sri Pragawati (Bendahara / TU)',
      full_name: 'Sri Pragawati',
      email: 'tu@yayasan.sch.id',
      password: 'tu123456',
      role: 'admin_tu',
      role_label: 'Bendahara / Tata Usaha',
      status: 'active',
      phone: '081347142829',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
    },
    ...SEEDS.teacherUsers,
    {
      id: 'USR-030',
      name: 'Bapak Muhammad Fauzi',
      full_name: 'Bapak Muhammad Fauzi',
      email: 'ortu@yayasan.sch.id',
      password: 'ortu123',
      role: 'orang_tua',
      role_label: 'Orang Tua / Wali',
      parent_id: 'PAR-001',
      student_id: 'STU-001',
      status: 'active',
      phone: '081234567893',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
    }
  ],

  classes: SEEDS.classes,

  students: SEEDS.students,

  ppdb_registrations: [
    {
      id: 'REG-2026-001',
      registration_number: 'REG-2026-001',
      registration_no: 'REG-2026-001',
      full_name: 'Zahra Amelia Putri',
      child_name: 'Zahra Amelia Putri',
      nickname: 'Amel',
      gender: 'P',
      birth_place: 'Samarinda',
      birth_date: '2021-04-10',
      form_type: 'paud',
      period_id: 'PPDPER-2026',
      period_name: 'Tahun Ajaran 2026/2027 Gelombang 1',
      father_name: 'Budi Santoso',
      mother_name: 'Dewi Lestari',
      phone: '081345678901',
      father_phone: '081345678901',
      address: 'Jl. Merbabu No. 45, Samarinda',
      status: 'pending',
      created_at: '2026-09-10T08:30:00.000Z',
      registration_date: '2026-09-10'
    }
  ],

  ppdb_periods: [
    {
      id: 'PPDPER-2026',
      name: 'PPDB 2026/2027 Gelombang 1',
      academic_year: '2026/2027',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      status: 'open'
    }
  ],

  invoices: [
    {
      id: 'INV-2026-09-001',
      invoice_number: 'INV/2026/09/001',
      student_id: 'STU-001',
      student_name: 'Ahmad Fauzan Pratama',
      month: 'September 2026',
      amount: 150000,
      due_date: '2026-09-15',
      status: 'unpaid',
      description: 'SPP Bulan September 2026'
    },
    {
      id: 'INV-2026-08-001',
      invoice_number: 'INV/2026/08/001',
      student_id: 'STU-001',
      student_name: 'Ahmad Fauzan Pratama',
      month: 'Agustus 2026',
      amount: 150000,
      due_date: '2026-08-15',
      status: 'paid',
      paid_at: '2026-08-10',
      description: 'SPP Bulan Agustus 2026'
    }
  ],

  payments: [
    {
      id: 'PAY-2026-09-001',
      invoice_id: 'INV-2026-09-001',
      invoice_number: 'INV/2026/09/001',
      student_id: 'STU-001',
      student_name: 'Ahmad Fauzan Pratama',
      amount: 150000,
      method: 'transfer',
      payment_date: '2026-09-10',
      proof_image_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600',
      status: 'menunggu_verifikasi',
      submitted_at: '2026-09-10T08:30:00.000Z'
    }
  ],

  attendance: [
    {
      id: 'ATT-001',
      student_id: 'STU-001',
      student_name: 'Ahmad Fauzan Pratama',
      class_id: 'CLS-001',
      date: '2026-09-12',
      status: 'H',
      notes: 'Hadir tepat waktu'
    },
    {
      id: 'ATT-002',
      student_id: 'STU-001',
      student_name: 'Ahmad Fauzan Pratama',
      class_id: 'CLS-001',
      date: '2026-09-11',
      status: 'H',
      notes: ''
    }
  ],

  developments: [
    {
      id: 'DEV-001',
      student_id: 'STU-001',
      student_name: 'Ahmad Fauzan Pratama',
      class_id: 'CLS-001',
      semester: '1',
      academic_year: '2026/2027',
      aspect_nam: 'BSB',
      aspect_fisik_motorik: 'BSH',
      aspect_kognitif: 'BSB',
      aspect_bahasa: 'BSH',
      aspect_sosial_emosional: 'BSH',
      aspect_seni: 'BSB',
      teacher_notes: 'Ananda Fauzan sangat aktif dan menunjukkan hafalan surat pendek yang sangat baik.',
      created_at: '2026-09-08'
    }
  ],

  news: [
    {
      id: 'NWS-001',
      title: 'Penerimaan Peserta Didik Baru (PPDB) Tahun Ajaran 2026/2027 Resmi Dibuka',
      slug: 'ppdb-2026-2027-resmi-dibuka',
      category: 'PPDB',
      summary: 'Yayasan Samarinda resmi membuka pendaftaran peserta didik baru untuk jenjang PAUD/TK dan TPQ.',
      content: '<p>Alhamdulillah, Yayasan Samarinda kembali membuka pendaftaran peserta didik baru untuk tahun ajaran 2026/2027. Tersedia jenjang PAUD/TK Terpadu dan TPQ ULINNUHA.</p><p>Pendaftaran dapat dilakukan secara online melalui website ini atau langsung ke kantor sekretariat.</p>',
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600',
      author: 'Panitia PPDB',
      status: 'published',
      published_at: '2026-09-01'
    },
    {
      id: 'NWS-002',
      title: 'Peringatan Maulid Nabi Muhammad SAW dan Pentas Seni Santri',
      slug: 'peringatan-maulid-nabi-dan-pentas-seni',
      category: 'Kegiatan',
      summary: 'Kemeriahan peringatan Maulid Nabi di lingkungan Yayasan diisi dengan hafalan Qur\'an dan dongeng islami.',
      content: '<p>Acara berlangsung khidmat dan ceria dihadiri oleh seluruh wali murid dan santriwan-santriwati.</p>',
      image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600',
      author: 'Humas Yayasan',
      status: 'published',
      published_at: '2026-09-05'
    }
  ],

  announcements: [
    {
      id: 'ANN-001',
      title: 'Jadwal Libur Awal Ramadhan 1448 H',
      content: 'Diberitahukan kepada seluruh orang tua santri bahwa kegiatan pembelajaran akan diliburkan pada 3 hari awal Ramadhan.',
      target_audience: 'all',
      is_pinned: 'TRUE',
      status: 'published',
      published_at: '2026-09-01'
    }
  ],

  events: [
    {
      id: 'EVT-001',
      title: 'Ujian Tasmi\' Juz Amma',
      date: '2026-09-25',
      time: '08:00 - 11:30 WITA',
      location: 'Aula Yayasan',
      description: 'Ujian hafalan terbuka santri TPQ tingkat lanjut.'
    }
  ],

  galleries: [
    {
      id: 'GAL-001',
      title: 'Kegiatan Outbound Edukatif Santri',
      image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600',
      caption: 'Keceriaan santri saat kegiatan belajar di alam terbuka.'
    }
  ],

  // Teachers collection (mirror of users with role guru, untuk portal admin - 24 tenaga pendidik)
  teachers: SEEDS.teachers,

  // Parents collection (mirror of users with role orang_tua)
  parents: [
    {
      id: 'PAR-001',
      user_id: 'USR-004',
      father_name: 'Bapak Muhammad Fauzi',
      mother_name: 'Ibu Siti Aminah',
      phone: '081234567893',
      email: 'ortu@yayasan.sch.id',
      address: 'Jl. Pemuda No. 45, Samarinda',
      occupation: 'Wiraswasta'
    },
    {
      id: 'PAR-002',
      user_id: 'USR-005',
      father_name: 'Bapak Agus Setiawan',
      mother_name: 'Ibu Rahmawati',
      phone: '081234567894',
      email: 'rahma@gmail.com',
      address: 'Jl. Juanda No. 12, Samarinda',
      occupation: 'PNS'
    },
    {
      id: 'PAR-003',
      user_id: 'USR-006',
      father_name: 'Bapak Hendra Gunawan',
      mother_name: 'Ibu Dewi Sartika',
      phone: '081234567895',
      email: 'hendra@gmail.com',
      address: 'Jl. Ahmad Yani No. 88, Samarinda',
      occupation: 'Swasta'
    }
  ],

  // Activity logs (untuk dashboard feed & portal admin/logs.html)
  activity_logs: [
    { id: 'LOG-001', user_id: 'USR-001', user_name: 'Super Administrator', action: 'login', module: 'auth', description: 'Login berhasil', created_at: '2026-09-14T08:00:00.000Z' },
    { id: 'LOG-002', user_id: 'USR-004', user_name: 'Bapak Muhammad Fauzi', action: 'payment_submit', module: 'payments', description: 'Konfirmasi pembayaran INV-2026-09-001 menunggu verifikasi', created_at: '2026-09-14T09:15:00.000Z' },
    { id: 'LOG-003', user_id: 'USR-003', user_name: 'Ustadz Ahmad Dahlan', action: 'attendance_save', module: 'attendance', description: 'Simpan presensi kelas CLS-001 tanggal 2026-09-13', created_at: '2026-09-13T11:30:00.000Z' },
    { id: 'LOG-004', user_id: 'USR-001', user_name: 'Super Administrator', action: 'ppdb_approve', module: 'ppdb', description: 'Pendaftar REG-2026-001 disetujui', created_at: '2026-09-12T14:20:00.000Z' },
    { id: 'LOG-005', user_id: 'USR-003', user_name: 'Ustadz Ahmad Dahlan', action: 'development_save', module: 'development', description: 'Catatan perkembangan STU-001 semester 1 disimpan', created_at: '2026-09-10T10:00:00.000Z' }
  ],

  // Backup history
  backups: [
    { id: 'BAK-2026-09-01', folder_name: 'Backups', folder_url: '#', file_count: 8, size_mb: 1.4, created_at: '2026-09-01T00:00:00.000Z', created_by: 'Super Administrator' }
  ],

  // Profil Lembaga Resmi
  school_profile: {
    id: 'SCH-001',
    name: 'YAYASAN AT TARBIYYAH WIJAYA KUSUMA SAMARINDA',
    npsn: '69912345',
    level: 'PAUD, TK, dan TPQ',
    address: 'Jl. Wijaya Kusuma V-A No. 38, Kel. Air Putih, Kec. Samarinda Ulu Kota Samarinda, Kalimantan Timur, Kode Pos: 75124',
    campus_note: 'Kampus Utama Air Putih, Samarinda Ulu',
    maps_url: 'https://maps.google.com/?q=Jl.+Wijaya+Kusuma+V-A+No.+38,+Air+Putih,+Samarinda+Ulu,+Kota+Samarinda,+Kalimantan+Timur+75124',
    maps_embed_url: 'https://maps.google.com/maps?q=Jl.+Wijaya+Kusuma+V-A+No.+38,+Air+Putih,+Samarinda+Ulu,+Kota+Samarinda,+Kalimantan+Timur+75124&t=&z=16&ie=UTF8&iwloc=&output=embed',
    phone: '081347142829',
    whatsapp_number: '081347142829',
    email: 'info@attarbiyyah-samarinda.sch.id',
    headmaster_name: 'Makhrus',
    ketua_yayasan: 'Makhrus',
    bendahara: 'Sri Pragawati',
    sekretaris: 'Candra Gunawan',
    pembina: 'DJOKO IRIANDONO',
    pengawas: 'Suhardi',
    instagram_url: 'https://instagram.com/yayasansamarinda',
    youtube_url: 'https://youtube.com/@yayasansamarinda',
    facebook_url: 'https://facebook.com/yayasansamarinda',
    footer_bg_url: 'images/school-campus.jpg'
  },

  // CMS Web Settings (Banner Hero, Sosmed, Kontak)
  web_settings: {
    id: 'SET-001',
    school_name: 'YAYASAN AT TARBIYYAH WIJAYA KUSUMA SAMARINDA',
    tagline: 'Membina Generasi Qurani, Berakhlak Mulia & Berprestasi',
    header_title: 'Sistem Informasi Akademik & Portal Yayasan At Tarbiyyah Wijaya Kusuma Samarinda',
    footer_bg_url: '/images/school-campus.jpg',
    login_bg_url: '/images/school-campus.jpg',
    announcement_banner: 'Penerimaan Peserta Didik Baru (PPDB) 2026/2027 Resmi Dibuka!',
    whatsapp_official: '081347142829',
    whatsapp: '081347142829',
    contact_email: 'info@attarbiyyah-samarinda.sch.id',
    email: 'info@attarbiyyah-samarinda.sch.id',
    phone: '081347142829',
    address: 'Jl. Wijaya Kusuma V-A No. 38, Kel. Air Putih, Kec. Samarinda Ulu Kota Samarinda, Kalimantan Timur, Kode Pos: 75124',
    campus_note: 'Kampus Utama Air Putih, Samarinda Ulu',
    maps_url: 'https://maps.google.com/?q=Jl.+Wijaya+Kusuma+V-A+No.+38,+Air+Putih,+Samarinda+Ulu,+Kota+Samarinda,+Kalimantan+Timur+75124',
    maps_embed_url: 'https://maps.google.com/maps?q=Jl.+Wijaya+Kusuma+V-A+No.+38,+Air+Putih,+Samarinda+Ulu,+Kota+Samarinda,+Kalimantan+Timur+75124&t=&z=16&ie=UTF8&iwloc=&output=embed',
    academic_year: '2026/2027',
    instagram_url: 'https://instagram.com/yayasansamarinda',
    youtube_url: 'https://youtube.com/@yayasansamarinda',
    facebook_url: 'https://facebook.com/yayasansamarinda',
    hero_images: [
      { url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1600&auto=format&fit=crop', caption: 'Suasana Belajar Ceria Santri PAUD & TK' },
      { url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1600&auto=format&fit=crop', caption: 'Pendidikan Karakter & Hafalan Qur\'an Sejak Dini' },
      { url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1600&auto=format&fit=crop', caption: 'Fasilitas Belajar & Lingkungan Islami Nyaman' }
    ]
  }
};

// Sessions store: token -> user
const SESSIONS = new Map();

function createToken(user) {
  const token = 'TOKEN-' + user.role.toUpperCase() + '-' + Date.now();
  SESSIONS.set(token, user);
  return token;
}

// Pre-create initial tokens for fast login
const ADMIN_TOKEN = createToken(DB.users[0]);
const TU_TOKEN = createToken(DB.users[1]);
const GURU_TOKEN = createToken(DB.users[2]);
const ORTU_TOKEN = createToken(DB.users[3]);

// RBAC helper — return 403 if requester's role is not in `allowed`.
// `allowed` may be a string or array. Empty array = require any authenticated role.
function rbacDeny(params, allowed) {
  let role = params._user_role;
  if (role && typeof role === 'object') role = role.code;
  if (!role) return { success: false, message: 'Sesi tidak valid. Silakan login ulang.', error: { code: 'UNAUTHORIZED' } };
  const roleNorm = String(role).toLowerCase();
  const list = (Array.isArray(allowed) ? allowed : [allowed]).map(r => String(r).toLowerCase());
  const isMatch = list.includes(roleNorm) || 
                  (roleNorm === 'siswa_aktif' && list.includes('siswa')) ||
                  (roleNorm === 'siswa' && list.includes('siswa_aktif'));
  if (list.length > 0 && !isMatch) {
    return { success: false, message: 'Anda tidak memiliki akses ke fitur ini', error: { code: 'FORBIDDEN' } };
  }
  return null;
}

function handleApiRequest(apiPath, params, method) {
  const cleanPath = String(apiPath).replace(/^\/+/, '').replace(/^api\/v1\//, '');
  const [module, action] = cleanPath.split('/');

  // 1. AUTH
  if (module === 'auth') {
    if (action === 'login') {
      const identifier = (params.identifier || params.email || params.username || params.nis || '').trim();
      const password = (params.password || '').trim();
      const idLower = identifier.toLowerCase();

      // 1. Cek DB.users (Admin, TU, Guru, Ortu)
      let user = DB.users.find(u => 
        (u.email && u.email.toLowerCase() === idLower) ||
        (u.id && u.id.toLowerCase() === idLower) ||
        (u.username && u.username.toLowerCase() === idLower)
      );

      if (user) {
        if (user.password !== password) {
          return { success: false, message: 'Password salah.', error: { code: 'UNAUTHORIZED', message: 'Password salah.' } };
        }
        const token = createToken(user);
        return {
          success: true,
          data: {
            token,
            user: {
              id: user.id,
              name: user.name,
              full_name: user.full_name || user.name,
              email: user.email,
              role: user.role,
              role_label: user.role_label,
              avatar: user.avatar,
              teacher_id: user.teacher_id,
              parent_id: user.parent_id,
              student_id: user.student_id
            }
          }
        };
      }

      // 2. Cek DB.students (Siswa Aktif via NIS / ID)
      let student = DB.students.find(s => 
        (s.nis && String(s.nis) === identifier) ||
        (s.id && s.id.toLowerCase() === idLower) ||
        (s.nisn && String(s.nisn) === identifier)
      );

      if (student) {
        const bDate = student.birth_date ? String(student.birth_date).trim() : '';
        const bDateClean = bDate.replace(/[^0-9]/g, '');
        const passClean = password.replace(/[^0-9]/g, '');
        let ddmmyyyy = '';
        if (bDate && bDate.includes('-')) {
          const parts = bDate.split('-');
          if (parts.length === 3) ddmmyyyy = parts[2] + parts[1] + parts[0];
        }

        const matchesBirthdate = password === bDate || 
                                 password === ddmmyyyy || 
                                 (passClean.length >= 6 && passClean === bDateClean) || 
                                 (passClean.length >= 6 && passClean === ddmmyyyy);
        const matchesCustomPwd = student.password && student.password === password;

        if (!matchesBirthdate && !matchesCustomPwd) {
          return { 
            success: false, 
            message: 'Password salah. Untuk siswa awal, gunakan Tanggal Lahir (YYYY-MM-DD).', 
            error: { code: 'UNAUTHORIZED', message: 'Password salah.' } 
          };
        }

        const isPasswordChanged = Boolean(student.is_password_changed);
        const studentUser = {
          id: 'USR-' + student.nis,
          name: student.nickname || student.name || student.full_name,
          full_name: student.full_name || student.name,
          email: student.parent_email || `${student.nis}@siswa.yayasan.sch.id`,
          role: { code: 'siswa_aktif', name: 'Siswa Aktif' },
          role_label: 'Siswa Aktif',
          avatar: student.photo_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
          student_id: student.id,
          nis: student.nis,
          class_id: student.class_id,
          class_name: student.class_name,
          is_password_changed: isPasswordChanged
        };
        const token = 'TOKEN-SISWA-' + student.nis + '-' + Date.now();
        SESSIONS.set(token, studentUser);

        return {
          success: true,
          data: {
            token,
            user: studentUser
          }
        };
      }

      return { success: false, message: 'Akun tidak ditemukan. Periksa Email atau NIS Anda.', error: { code: 'UNAUTHORIZED', message: 'Akun tidak ditemukan' } };
    }

    if (action === 'change_password') {
      const { user_id, new_password } = params;
      const student = DB.students.find(s => ('USR-' + s.nis === user_id) || (s.id === user_id) || (s.nis === user_id));
      if (student) {
        student.password = new_password;
        student.is_password_changed = true;
        return { success: true, data: { message: 'Password berhasil diubah' } };
      }
      return { success: true, data: { message: 'Password berhasil diperbarui' } };
    }

    if (action === 'me') {
      const token = params.token;
      const user = SESSIONS.get(token) || DB.users[0];
      return {
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            full_name: user.full_name || user.name,
            email: user.email,
            role: user.role,
            role_label: user.role_label,
            avatar: user.avatar,
            teacher_id: user.teacher_id,
            parent_id: user.parent_id,
            student_id: user.student_id,
            nis: user.nis,
            class_id: user.class_id,
            class_name: user.class_name
          }
        }
      };
    }

    if (action === 'logout') {
      if (params.token) SESSIONS.delete(params.token);
      return { success: true, data: { message: 'Berhasil logout' } };
    }
  }

  // 2. PPDB
  if (module === 'ppdb') {
    if (action === 'submit' || action === 'register') {
      const regId = 'REG-' + new Date().getFullYear() + '-' + String(DB.ppdb_registrations.length + 1).padStart(3, '0');
      const studentName = params.full_name || params.child_name || params.student_name || 'Santri Baru';
      const parentName = params.parent_name || params.father_name || params.mother_name || params.guardian_name || 'Orang Tua';
      const phoneNum = params.phone || params.parent_phone || params.father_phone || params.mother_phone || '';
      const emailAddr = params.email || params.parent_email || '';
      const lvl = params.level || (params.form_type === 'tpq' ? 'TPQ' : 'PAUD');
      const photo = params.photo_url || params.child_photo_url || '';
      const birthCert = params.birth_certificate_url || '';
      const familyCard = params.family_card_url || '';

      const newReg = {
        id: regId,
        registration_number: regId,
        registration_no: regId,
        full_name: studentName,
        child_name: studentName,
        student_name: studentName,
        nickname: params.nickname || '',
        gender: params.gender || params.student_gender || 'L',
        student_gender: params.gender || params.student_gender || 'L',
        birth_place: params.birth_place || params.student_birth_place || 'Samarinda',
        student_birth_place: params.birth_place || params.student_birth_place || 'Samarinda',
        birth_date: params.birth_date || params.student_birth_date || '2020-01-01',
        student_birth_date: params.birth_date || params.student_birth_date || '2020-01-01',
        address: params.address || '',
        form_type: params.form_type || (lvl === 'TPQ' ? 'tpq' : 'paud'),
        level: lvl,
        period_id: params.period_id || 'PPDPER-2026',
        period_name: params.period_name || 'PPDB 2026/2027 Gelombang 1',
        father_name: params.father_name || parentName,
        father_occupation: params.father_occupation || '',
        father_phone: params.father_phone || phoneNum,
        mother_name: params.mother_name || '',
        mother_occupation: params.mother_occupation || '',
        mother_phone: params.mother_phone || '',
        guardian_name: params.guardian_name || '',
        parent_name: parentName,
        phone: phoneNum,
        parent_phone: phoneNum,
        email: emailAddr,
        parent_email: emailAddr,
        photo_url: photo,
        child_photo_url: photo,
        birth_certificate_url: birthCert,
        family_card_url: familyCard,
        documents_url: {
          photo: photo,
          birth_certificate: birthCert,
          family_card: familyCard
        },
        notes: params.notes || '',
        status: 'pending',
        created_at: new Date().toISOString(),
        registration_date: new Date().toISOString().split('T')[0]
      };
      DB.ppdb_registrations.unshift(newReg);
      return {
        success: true,
        data: {
          id: regId,
          registration_no: regId,
          registration_number: regId,
          child_name: newReg.child_name,
          full_name: newReg.full_name,
          registration: newReg
        }
      };
    }

    if (action === 'check_status' || action === 'status') {
      const regQuery = params.registration_number || params.id || params.reg || '';
      const reg = DB.ppdb_registrations.find(r => 
        String(r.registration_number).toLowerCase() === String(regQuery).toLowerCase() ||
        String(r.id).toLowerCase() === String(regQuery).toLowerCase()
      );
      if (!reg) {
        return { success: false, message: 'Nomor pendaftaran tidak ditemukan', error: { code: 'NOT_FOUND', message: 'Nomor pendaftaran tidak ditemukan' } };
      }
      if (reg.status === 'converted') {
        const linkedStudent = DB.students.find(s => (reg.student_id && s.id === reg.student_id) || (reg.converted_nis && s.nis === reg.converted_nis) || (s.full_name === (reg.child_name || reg.full_name)));
        if (linkedStudent) {
          reg.converted_nis = linkedStudent.nis;
          reg.class_name = linkedStudent.class_name;
          reg.student_id = linkedStudent.id;
        }
      }
      return {
        success: true,
        data: {
          ...reg,
          registration: reg
        }
      };
    }

    if (action === 'get') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const reg = DB.ppdb_registrations.find(r => r.id === params.id || r.registration_number === params.id);
      if (!reg) return { success: false, message: 'Pendaftar tidak ditemukan' };
      return { success: true, data: reg };
    }

    if (action === 'list') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      let list = [...DB.ppdb_registrations];
      if (params.status) {
        if (params.status === 'pending') {
          list = list.filter(r => r.status === 'pending' || r.status === 'submitted' || r.status === 'waiting_verification');
        } else if (params.status === 'approved') {
          list = list.filter(r => r.status === 'approved' || r.status === 'accepted' || r.status === 'verified');
        } else if (params.status === 'rejected') {
          list = list.filter(r => r.status === 'rejected');
        } else if (params.status === 'converted') {
          list = list.filter(r => r.status === 'converted');
        }
      }
      if (params.search || params.q) {
        const q = String(params.search || params.q).toLowerCase();
        list = list.filter(r => 
          (r.full_name && r.full_name.toLowerCase().includes(q)) ||
          (r.child_name && r.child_name.toLowerCase().includes(q)) ||
          (r.registration_number && r.registration_number.toLowerCase().includes(q)) ||
          (r.parent_name && r.parent_name.toLowerCase().includes(q))
        );
      }
      if (params.form_type) {
        list = list.filter(r => String(r.form_type).toLowerCase() === String(params.form_type).toLowerCase() || String(r.level).toLowerCase() === String(params.form_type).toLowerCase());
      }
      return {
        success: true,
        data: {
          items: list,
          total: list.length,
          pagination: { page: 1, pageSize: 50, total: list.length }
        }
      };
    }

    if (action === 'accept' || action === 'approve') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const reg = DB.ppdb_registrations.find(r => r.id === params.id || r.registration_number === params.id);
      if (reg) {
        reg.status = 'approved';
        if (params.notes) reg.notes = params.notes;
      }
      return { success: true, data: { message: 'Pendaftar berhasil disetujui', registration: reg } };
    }

    if (action === 'reject') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const reg = DB.ppdb_registrations.find(r => r.id === params.id || r.registration_number === params.id);
      if (reg) {
        reg.status = 'rejected';
        reg.notes = params.reason || params.notes || 'Persyaratan administrasi belum terpenuhi';
      }
      return { success: true, data: { message: 'Pendaftar ditolak', registration: reg } };
    }

    if (action === 'update') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const reg = DB.ppdb_registrations.find(r => r.id === params.id || r.registration_number === params.id);
      if (!reg) return { success: false, message: 'Pendaftar tidak ditemukan' };

      if (params.full_name || params.child_name || params.student_name) {
        const sName = params.full_name || params.child_name || params.student_name;
        reg.full_name = sName; reg.child_name = sName; reg.student_name = sName;
      }
      if (params.nickname !== undefined) reg.nickname = params.nickname;
      if (params.gender !== undefined) { reg.gender = params.gender; reg.student_gender = params.gender; }
      if (params.birth_place !== undefined) { reg.birth_place = params.birth_place; reg.student_birth_place = params.birth_place; }
      if (params.birth_date !== undefined) { reg.birth_date = params.birth_date; reg.student_birth_date = params.birth_date; }
      if (params.address !== undefined) reg.address = params.address;
      if (params.parent_name !== undefined) reg.parent_name = params.parent_name;
      if (params.father_name !== undefined) reg.father_name = params.father_name;
      if (params.mother_name !== undefined) reg.mother_name = params.mother_name;
      if (params.phone !== undefined || params.parent_phone !== undefined) {
        const p = params.phone || params.parent_phone;
        reg.phone = p; reg.parent_phone = p; reg.father_phone = p;
      }
      if (params.email !== undefined || params.parent_email !== undefined) {
        const e = params.email || params.parent_email;
        reg.email = e; reg.parent_email = e;
      }
      if (params.level !== undefined) { reg.level = params.level; reg.form_type = params.level === 'TPQ' ? 'tpq' : 'paud'; }
      if (params.notes !== undefined) reg.notes = params.notes;
      reg.updated_at = new Date().toISOString();

      return { success: true, message: 'Data pendaftar berhasil diperbarui', data: reg };
    }

    if (action === 'delete') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const idx = DB.ppdb_registrations.findIndex(r => r.id === params.id || r.registration_number === params.id);
      if (idx === -1) return { success: false, message: 'Pendaftar tidak ditemukan' };
      const deleted = DB.ppdb_registrations.splice(idx, 1)[0];
      return { success: true, message: 'Data pendaftar berhasil dihapus', data: deleted };
    }

    if (action === 'convert') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const reg = DB.ppdb_registrations.find(r => r.id === params.id || r.registration_number === params.id);
      if (!reg) return { success: false, message: 'Pendaftar tidak ditemukan' };

      // 1. Guard Idempotensi: Cegah konversi ganda untuk pendaftar yang sama
      if (reg.status === 'converted') {
        return { success: false, message: 'Pendaftar ini sudah pernah dikonversi menjadi siswa aktif.' };
      }

      const nextSeq = DB.students.length + 1;
      const targetNis = params.nis || ('2026' + String(nextSeq).padStart(3, '0'));

      // 2. Guard Keunikan NIS: Pastikan NIS belum terdaftar di data siswa aktif
      const isNisTaken = DB.students.some(s => String(s.nis).trim() === String(targetNis).trim());
      if (isNisTaken) {
        return { success: false, message: `NIS ${targetNis} sudah digunakan oleh siswa aktif lain. Silakan gunakan nomor NIS lain.` };
      }

      const targetClass = DB.classes.find(c => c.id === (params.class_id || 'CLS-001')) || {};
      const studentName = reg.child_name || reg.full_name || reg.student_name || 'Santri Baru';
      const studentBirthDate = reg.birth_date || reg.student_birth_date || '2020-01-01';

      const newStu = {
        id: 'STU-' + String(nextSeq).padStart(3, '0'),
        nis: targetNis,
        full_name: studentName,
        name: studentName,
        child_name: studentName,
        nickname: reg.nickname || '',
        gender: reg.gender || reg.student_gender || 'L',
        class_id: params.class_id || 'CLS-001',
        class_name: targetClass.name || 'PAUD A - Bintang Kecil',
        birth_place: reg.birth_place || reg.student_birth_place || 'Samarinda',
        birth_date: studentBirthDate,
        parent_id: 'PAR-' + String(nextSeq).padStart(3, '0'),
        parent_name: reg.parent_name || reg.father_name || reg.mother_name || '-',
        parent_email: reg.parent_email || reg.email || '',
        parent_phone: reg.parent_phone || reg.phone || reg.father_phone || '',
        phone: reg.phone || reg.parent_phone || '',
        photo_url: reg.photo_url || reg.child_photo_url || '',
        address: reg.address || '',
        status: 'active'
      };
      DB.students.push(newStu);

      // Sinkronisasi akun user portal jika belum ada
      const existingUser = DB.users.find(u => u.nis === targetNis || (u.student_id && u.student_id === newStu.id));
      if (!existingUser) {
        DB.users.push({
          id: 'USR-' + targetNis,
          email: newStu.parent_email || `${targetNis}@siswa.yayasan.sch.id`,
          nis: targetNis,
          password_hash: studentBirthDate.replace(/\D/g, ''),
          full_name: studentName,
          name: studentName,
          phone: newStu.parent_phone,
          role: 'siswa_aktif',
          role_label: 'Siswa Aktif',
          status: 'active',
          student_id: newStu.id
        });
      }

      reg.status = 'converted';
      reg.converted_nis = targetNis;
      reg.student_id = newStu.id;
      reg.class_name = newStu.class_name;
      const defaultPass = studentBirthDate ? studentBirthDate.replace(/\D/g, '') : ('ortu' + String(nextSeq).padStart(3, '0'));
      const initialCredentials = {
        student_name: newStu.full_name,
        username: targetNis,
        nis: targetNis,
        default_password: defaultPass,
        password_hint: defaultPass,
        login_url: '/public/login.html'
      };
      return {
        success: true,
        message: 'Pendaftar berhasil dikonversi menjadi siswa aktif.',
        data: {
          message: 'Pendaftar berhasil dikonversi menjadi siswa aktif.',
          registration: reg,
          student: newStu,
          nis: targetNis,
          class_name: newStu.class_name,
          parent_user: {
            email: newStu.parent_email,
            full_name: newStu.parent_name
          },
          initial_credentials: initialCredentials
        }
      };
    }

    if (action === 'period' || action === 'periods') {
      const activePeriod = (DB.ppdb_periods && DB.ppdb_periods[0]) || {
        id: 'PPDPER-2026',
        name: 'PPDB 2026/2027 Gelombang 1',
        academic_year: '2026/2027',
        status: 'open',
        online_registration_dates: '01 Feb - 31 Mar 2026',
        verification_dates: '01 - 05 Apr 2026',
        announcement_dates: '10 Apr 2026',
        re_registration_dates: '12 - 20 Apr 2026',
        notes: 'Pendaftaran Peserta Didik Baru Gelombang 1 Resmi Dibuka. Silakan mengisi formulir pendaftaran secara online.'
      };
      return {
        success: true,
        data: action === 'period' ? activePeriod : { items: DB.ppdb_periods, periods: DB.ppdb_periods, period: activePeriod }
      };
    }

    if (action === 'update_period') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      if (!DB.ppdb_periods || !DB.ppdb_periods[0]) {
        DB.ppdb_periods = [{ id: 'PPDPER-2026' }];
      }
      Object.assign(DB.ppdb_periods[0], params);
      return { success: true, message: 'Status gelombang PPDB berhasil diperbarui', data: DB.ppdb_periods[0] };
    }
  }

  // 2B. SISWA PORTAL (get_profile, update_biodata, get_academic, get_spp, get_documents, upload_document)
  if (module === 'siswa') {
    const findStudent = () => {
      const studentId = params.student_id || params.id;
      if (studentId) {
        const found = DB.students.find(s => s.id === studentId || s.nis === studentId);
        if (found) return found;
      }
      if (params.nis) {
        const found = DB.students.find(s => s.nis === params.nis);
        if (found) return found;
      }
      if (params._user_id) {
        const found = DB.students.find(s => s.id === params._user_id || ('USR-' + s.nis) === params._user_id);
        if (found) return found;
      }
      if (params._user_email) {
        const emailLower = params._user_email.toLowerCase();
        const found = DB.students.find(s => (s.parent_email && s.parent_email.toLowerCase() === emailLower) || (s.email && s.email.toLowerCase() === emailLower));
        if (found) return found;
      }
      return DB.students[0];
    };

    const targetStudent = findStudent();

    if (action === 'get_profile') {
      if (!targetStudent) {
        return { success: false, message: 'Data siswa tidak ditemukan', error: { code: 'NOT_FOUND' } };
      }
      const parent = DB.parents ? DB.parents.find(p => p.id === targetStudent.parent_id) : null;
      const profileData = {
        ...targetStudent,
        name: targetStudent.full_name || targetStudent.name,
        full_name: targetStudent.full_name || targetStudent.name,
        child_name: targetStudent.child_name || targetStudent.full_name || targetStudent.name,
        kelas_sekarang: targetStudent.class_name || targetStudent.kelas_sekarang || 'TK B Terpadu',
        semester_sekarang: targetStudent.semester_sekarang || 'Semester 1 • TA 2026/2027',
        status_kenaikan: targetStudent.status_kenaikan || 'Aktif',
        father_name: targetStudent.father_name || (parent ? parent.father_name || parent.name : 'Bapak Muhammad Fauzi'),
        father_phone: targetStudent.father_phone || (parent ? parent.phone : '081234567893'),
        mother_name: targetStudent.mother_name || (parent ? parent.mother_name : 'Ibu Siti Aminah'),
        address: targetStudent.address || (parent ? parent.address : 'Jl. Ahmad Yani No. 88, Samarinda'),
        religion: targetStudent.religion || 'Islam',
        nik: targetStudent.nik || '6472010101210001',
        previous_school: targetStudent.previous_school || 'KB Al-Ihsan',
        blood_type: targetStudent.blood_type || 'O',
        hobbies: targetStudent.hobbies || 'Mewarnai & Bersepeda',
        aspirations: targetStudent.aspirations || 'Dokter / Guru'
      };
      return { success: true, data: profileData };
    }

    if (action === 'update_biodata') {
      if (!targetStudent) {
        return { success: false, message: 'Data siswa tidak ditemukan', error: { code: 'NOT_FOUND' } };
      }
      Object.assign(targetStudent, params);
      return { success: true, message: 'Biodata berhasil diperbarui', data: targetStudent };
    }

    if (action === 'get_academic') {
      const studentId = targetStudent ? targetStudent.id : 'STU-001';
      let developments = (DB.developments || []).filter(d => d.student_id === studentId);
      if (developments.length === 0) {
        developments = [
          {
            id: 'DEV-001',
            student_id: studentId,
            student_name: targetStudent ? targetStudent.full_name : 'Santri',
            academic_year: '2026/2027',
            semester: 'Semester 1 (Ganjil)',
            aspect_nam: 'BSB',
            aspect_fisik_motorik: 'BSH',
            aspect_kognitif: 'BSB',
            aspect_bahasa: 'BSH',
            aspect_sosial_emosional: 'BSH',
            aspect_seni: 'BSB',
            teacher_notes: 'Ananda sangat aktif, memiliki daya ingat tajam dalam hafalan doa harian, dan gemar tolong-menolong dengan teman.',
            created_at: '2026-09-15T10:00:00.000Z'
          }
        ];
      }
      return {
        success: true,
        data: {
          records: [],
          developments
        }
      };
    }

    if (action === 'get_spp') {
      const studentId = targetStudent ? targetStudent.id : 'STU-001';
      let invoices = (DB.invoices || []).filter(i => i.student_id === studentId);
      if (invoices.length === 0) {
        const studentName = targetStudent ? (targetStudent.full_name || targetStudent.name) : 'Santri';
        const invUnpaid = {
          id: 'INV-' + studentId + '-2026-10',
          invoice_number: 'INV/2026/10/' + studentId,
          student_id: studentId,
          student_name: studentName,
          month: 'Oktober 2026',
          item_name: 'SPP Bulan Oktober 2026',
          period: '2026/2027',
          amount: 150000,
          due_date: '2026-10-10',
          status: 'unpaid',
          description: 'SPP Bulan Oktober 2026'
        };
        const invPaid = {
          id: 'INV-' + studentId + '-2026-09',
          invoice_number: 'INV/2026/09/' + studentId,
          student_id: studentId,
          student_name: studentName,
          month: 'September 2026',
          item_name: 'SPP Bulan September 2026',
          period: '2026/2027',
          amount: 150000,
          due_date: '2026-09-10',
          status: 'paid',
          paid_at: '2026-09-08',
          paid_by: 'Transfer BSI',
          description: 'SPP Bulan September 2026'
        };
        DB.invoices.push(invUnpaid, invPaid);
        invoices = [invUnpaid, invPaid];
      }
      const payments = (DB.payments || []).filter(p => invoices.some(i => i.id === p.invoice_id) || p.student_id === studentId);
      return {
        success: true,
        data: {
          invoices,
          payments
        }
      };
    }

    if (action === 'get_documents') {
      const defaultDocs = [
        { id: 'DOC-001', document_type: 'foto', file_name: 'pas_foto_3x4.jpg', file_url: targetStudent && targetStudent.photo_url ? targetStudent.photo_url : 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150', file_size: 245000, is_verified: true, created_at: '2026-08-01T08:00:00.000Z' },
        { id: 'DOC-002', document_type: 'kk', file_name: 'kartu_keluarga_legalisir.pdf', file_url: '#', file_size: 1250000, is_verified: true, created_at: '2026-08-01T08:05:00.000Z' },
        { id: 'DOC-003', document_type: 'akte', file_name: 'akta_kelahiran_asli.pdf', file_url: '#', file_size: 890000, is_verified: true, created_at: '2026-08-01T08:10:00.000Z' }
      ];
      if (!targetStudent.documents) {
        targetStudent.documents = defaultDocs;
      }
      return { success: true, data: targetStudent.documents };
    }

    if (action === 'upload_document') {
      if (!targetStudent.documents) targetStudent.documents = [];
      const newDoc = {
        id: 'DOC-' + Date.now(),
        document_type: params.document_type || 'lainnya',
        file_name: params.file_name || 'Dokumen Unggahan',
        file_url: params.file_url || '#',
        file_size: params.file_size || 500000,
        is_verified: false,
        created_at: new Date().toISOString()
      };
      targetStudent.documents.unshift(newDoc);
      return { success: true, message: 'Dokumen berhasil diunggah', data: newDoc };
    }
  }

  // 3. STUDENTS
  if (module === 'students') {
      if (action === 'save_evaluasi') {
        const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
        if (deny) return deny;
        if (!DB.evaluasi) DB.evaluasi = [];
        const studentId = params.student_id;
        const evalRecord = {
          id: 'EVAL-' + Date.now(),
          student_id: studentId,
          semester: params.semester || 'Semester 1',
          academic_year: params.academic_year || '2026/2027',
          aspects: params.aspects || {},
          notes: params.notes || '',
          created_at: new Date().toISOString()
        };
        DB.evaluasi.push(evalRecord);
        return { success: true, message: 'Evaluasi STPPA berhasil disimpan', data: evalRecord };
      }
      if (action === 'reset_password') {
        const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
        if (deny) return deny;
        const studentId = params.student_id || params.id;
        const stu = (DB.students || []).find(s => s.id === studentId || s.nis === studentId);
        if (!stu) return { success: false, message: 'Data siswa tidak ditemukan' };
        if (!stu.birth_date) return { success: false, message: 'Tanggal lahir siswa belum diisi, tidak dapat mereset password ke tanggal lahir.' };
        
        const defaultPassword = stu.birth_date;
        const u = (DB.users || []).find(user => user.student_id === stu.id || user.username === stu.nis);
        if (u) u.password = defaultPassword;
        return { success: true, message: 'Password berhasil direset ke tanggal lahir (' + defaultPassword + ')' };
      }

    if (action === 'list') {
      // guru/ortu/pendaftar tidak boleh akses admin list — harus pakai teachers/me atau students/myChildren
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      let list = [...DB.students];
      if (params.class_id) list = list.filter(s => s.class_id === params.class_id);
      const requesterRole = params._user_role;
      const requesterEmail = (params._user_email || '').toLowerCase();
      if (requesterRole === 'orang_tua' && requesterEmail) {
        const requester = DB.users.find(u => u.email && u.email.toLowerCase() === requesterEmail);
        if (requester && requester.parent_id) {
          list = list.filter(s => s.parent_id === requester.parent_id);
        } else {
          list = [];
        }
      }
      return { success: true, data: { items: list, students: list, total: list.length, pagination: { page: 1, per_page: list.length, total: list.length } } };
    }
    if (action === 'myChildren') {
      // ortu: lihat anaknya sendiri. role lain (termasuk admin): tolak (strict per-domain)
      const deny = rbacDeny(params, ['orang_tua']);
      if (deny) return deny;
      const requesterEmail = (params._user_email || '').toLowerCase();
      const requesterRole = params._user_role;
      let list = [];
      if (requesterRole === 'orang_tua' && requesterEmail) {
        const requester = DB.users.find(u => u.email && u.email.toLowerCase() === requesterEmail);
        if (requester && requester.parent_id) {
          list = DB.students.filter(s => s.parent_id === requester.parent_id);
        }
      }
      return { success: true, data: { items: list, students: list, total: list.length } };
    }
    if (action === 'get') {
      // guru boleh baca data siswa (untuk presensi/perkembangan); ortu hanya anaknya; admin selalu boleh
      const deny = rbacDeny(params, ['super_admin', 'admin_tu', 'guru', 'orang_tua']);
      if (deny) return deny;
      const stu = DB.students.find(s => s.id === params.id);
      if (!stu) return { success: false, message: 'Siswa tidak ditemukan', error: { code: 'NOT_FOUND' } };
      // RBAC: ortu hanya boleh lihat anaknya
      const requesterEmail = (params._user_email || '').toLowerCase();
      const requesterRole = params._user_role;
      if (requesterRole === 'orang_tua' && requesterEmail) {
        const requester = DB.users.find(u => u.email && u.email.toLowerCase() === requesterEmail);
        if (requester && requester.parent_id && stu.parent_id !== requester.parent_id) {
          return { success: false, message: 'Anda tidak memiliki akses ke data siswa ini', error: { code: 'FORBIDDEN' } };
        }
      }
      // RBAC: guru hanya boleh lihat siswa di kelas binaannya
      if (requesterRole === 'guru' && requesterEmail) {
        const requester = DB.users.find(u => u.email && u.email.toLowerCase() === requesterEmail);
        const teacherId = requester ? requester.teacher_id : null;
        const myClassIds = DB.classes.filter(c => c.teacher_id === teacherId).map(c => c.id);
        if (!myClassIds.includes(stu.class_id)) {
          return { success: false, message: 'Anda tidak memiliki akses ke siswa di luar kelas binaan Anda', error: { code: 'FORBIDDEN' } };
        }
      }
      return { success: true, data: { ...stu, student: stu } };
    }
    if (action === 'create') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const seq = DB.students.length + 1;
      const newStu = {
        id: 'STU-' + String(seq).padStart(3, '0'),
        nis: params.nis || ('2026' + String(seq).padStart(3, '0')),
        full_name: params.full_name || params.name || 'Siswa Baru',
        name: params.full_name || params.name || 'Siswa Baru',
        child_name: params.full_name || params.name || 'Siswa Baru',
        nickname: params.nickname || '',
        gender: params.gender || 'L',
        class_id: params.current_class_id || params.class_id || 'CLS-001',
        class_name: (DB.classes.find(c => c.id === (params.current_class_id || params.class_id || 'CLS-001')) || {}).name || '',
        parent_id: params.parent_id || null,
        parent_name: params.parent_name || '',
        birth_place: params.birth_place || 'Samarinda',
        birth_date: params.birth_date || '2020-01-01',
        status: params.status || 'active',
        created_at: new Date().toISOString()
      };
      DB.students.push(newStu);
      return { success: true, message: 'Siswa berhasil ditambahkan', data: { message: 'Siswa berhasil ditambahkan', student: newStu } };
    }
    if (action === 'update') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const stu = DB.students.find(s => s.id === params.id);
      if (!stu) return { success: false, message: 'Siswa tidak ditemukan', error: { code: 'NOT_FOUND' } };
      if (params.full_name != null) { stu.full_name = params.full_name; stu.name = params.full_name; stu.child_name = params.full_name; }
      if (params.nickname != null) stu.nickname = params.nickname;
      if (params.gender != null) stu.gender = params.gender;
      if (params.current_class_id != null) {
        stu.class_id = params.current_class_id;
        stu.class_name = (DB.classes.find(c => c.id === params.current_class_id) || {}).name || '';
      }
      if (params.class_id != null && params.current_class_id == null) {
        stu.class_id = params.class_id;
        stu.class_name = (DB.classes.find(c => c.id === params.class_id) || {}).name || '';
      }
      if (params.parent_id != null) stu.parent_id = params.parent_id;
      if (params.parent_name != null) stu.parent_name = params.parent_name;
      if (params.birth_place != null) stu.birth_place = params.birth_place;
      if (params.birth_date != null) stu.birth_date = params.birth_date;
      if (params.status != null) stu.status = params.status;
      return { success: true, message: 'Data siswa diperbarui', data: { message: 'Data siswa diperbarui', student: stu } };
    }
    if (action === 'delete') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const idx = DB.students.findIndex(s => s.id === params.id);
      if (idx === -1) return { success: false, message: 'Siswa tidak ditemukan', error: { code: 'NOT_FOUND' } };
      const removed = DB.students.splice(idx, 1)[0];
      return { success: true, message: 'Siswa berhasil dihapus', data: { message: 'Siswa berhasil dihapus', student: removed } };
    }
  }

  // 4. CLASSES
  if (module === 'classes') {
    if (action === 'list') {
      // guru boleh baca; ortu/pendaftar tidak boleh
      const deny = rbacDeny(params, ['super_admin', 'admin_tu', 'guru']);
      if (deny) return deny;
      let list = DB.classes.map(c => ({
        id: c.id,
        name: c.name,
        level: c.level,
        teacher_id: c.teacher_id || null,
        teacher_name: c.teacher_name || '',
        student_count: c.student_count || DB.students.filter(s => s.class_id === c.id).length,
        capacity: c.capacity || 20,
        academic_year: c.academic_year || '2026/2027',
        grade_level: c.grade_level || c.level,
        homeroom_teacher_id: c.teacher_id || null
      }));
      // guru: hanya lihat kelas binaannya
      if (params._user_role === 'guru') {
        const reqEmail = (params._user_email || '').toLowerCase();
        const req = DB.users.find(u => u.email && u.email.toLowerCase() === reqEmail);
        const teacherId = req ? req.teacher_id : null;
        list = list.filter(c => c.teacher_id === teacherId);
      }
      return { success: true, data: { items: list, classes: list, total: list.length, pagination: { page: 1, per_page: list.length, total: list.length } } };
    }
  }

  // 5. TEACHERS (guru-facing endpoints: classes, me)
  if (module === 'teachers') {
    if (action === 'classes') {
      // guru: hanya lihat kelas binaannya
      const deny = rbacDeny(params, ['super_admin', 'admin_tu', 'guru']);
      if (deny) return deny;
      const reqEmail = (params._user_email || '').toLowerCase();
      const req = DB.users.find(u => u.email && u.email.toLowerCase() === reqEmail);
      const teacherId = req ? req.teacher_id : null;
      const myClasses = DB.classes.filter(c => c.teacher_id === teacherId);
      return { success: true, data: { items: myClasses, classes: myClasses } };
    }
    if (action === 'me') {
      // hanya guru yang boleh akses profilenya sendiri
      const deny = rbacDeny(params, ['guru', 'super_admin', 'admin_tu']);
      if (deny) return deny;
      const reqEmail = (params._user_email || '').toLowerCase();
      const req = DB.users.find(u => u.email && u.email.toLowerCase() === reqEmail);
      const teacherId = req ? req.teacher_id : null;
      const myClasses = DB.classes.filter(c => c.teacher_id === teacherId);
      const myClassIds = myClasses.map(c => c.id);
      const myStudents = DB.students.filter(s => myClassIds.includes(s.class_id));
      const teacherRec = DB.teachers.find(t => t.id === teacherId) || {};
      return {
        success: true,
        data: {
          teacher: { ...req, teacher_id: teacherId, full_name: req ? (req.full_name || req.name) : '', nip: teacherRec.nip || '', specialization: teacherRec.specialization || '', start_date: teacherRec.start_date || null },
          classes: myClasses,
          students: myStudents
        }
      };
    }
  }

  // 6. ATTENDANCE
  if (module === 'attendance') {
    // Helper untuk filter data sesuai role guru (hanya kelas binaannya)
    const scopedClassIds = () => {
      const reqEmail = (params._user_email || '').toLowerCase();
      const req = DB.users.find(u => u.email && u.email.toLowerCase() === reqEmail);
      const teacherId = req ? req.teacher_id : null;
      return DB.classes.filter(c => c.teacher_id === teacherId).map(c => c.id);
    };
    const scopedStudentIds = () => {
      const reqEmail = (params._user_email || '').toLowerCase();
      const req = DB.users.find(u => u.email && u.email.toLowerCase() === reqEmail);
      if (req && req.parent_id) return DB.students.filter(s => s.parent_id === req.parent_id).map(s => s.id);
      return [];
    };
    if (action === 'students' || action === 'roster') {
      // ortu/pendaftar tidak boleh akses roster
      const deny = rbacDeny(params, ['super_admin', 'admin_tu', 'guru']);
      if (deny) return deny;
      let classId = params.class_id || 'CLS-001';
      // guru: hanya boleh pilih kelas binaannya sendiri
      if (params._user_role === 'guru') {
        const myIds = scopedClassIds();
        if (!myIds.includes(classId)) {
          // fallback ke kelas pertama yang dibina
          classId = myIds[0] || classId;
          if (!myIds.includes(classId)) {
            return { success: true, data: { items: [], students: [], existing: [] } };
          }
        }
      }
      const students = DB.students.filter(s => s.class_id === classId);
      return {
        success: true,
        data: {
          items: students,
          students: students,
          existing: DB.attendance.filter(a => a.date === params.date && a.class_id === classId)
        }
      };
    }
    if (action === 'save' || action === 'submit') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu', 'guru']);
      if (deny) return deny;
      // guru: hanya boleh submit untuk kelas binaannya
      if (params._user_role === 'guru') {
        const myIds = scopedClassIds();
        if (!myIds.includes(params.class_id)) {
          return { success: false, message: 'Anda tidak memiliki akses untuk mengubah presensi kelas ini', error: { code: 'FORBIDDEN' } };
        }
      }
      if (params.records && Array.isArray(params.records)) {
        params.records.forEach(rec => {
          DB.attendance.push({
            id: 'ATT-' + Date.now() + Math.random(),
            student_id: rec.student_id,
            class_id: params.class_id || 'CLS-001',
            date: params.date || new Date().toISOString().split('T')[0],
            status: rec.status,
            notes: rec.notes || ''
          });
        });
      }
      return { success: true, message: 'Presensi berhasil disimpan', data: { message: 'Presensi berhasil disimpan' } };
    }
    if (action === 'summary') {
      // summary boleh untuk guru/ortu (filtered), admin (full)
      const deny = rbacDeny(params, ['super_admin', 'admin_tu', 'guru', 'orang_tua']);
      if (deny) return deny;
      let records = DB.attendance;
      if (params._user_role === 'guru') {
        const myIds = scopedClassIds();
        records = records.filter(r => myIds.includes(r.class_id));
      } else if (params._user_role === 'orang_tua') {
        const mySIds = scopedStudentIds();
        records = records.filter(r => mySIds.includes(r.student_id));
      }
      const total = records.length;
      const hadir = records.filter(r => r.status === 'hadir').length;
      return {
        success: true,
        data: {
          total_meetings: total,
          hadir,
          sakit: records.filter(r => r.status === 'sakit').length,
          izin: records.filter(r => r.status === 'izin').length,
          alfa: records.filter(r => r.status === 'alfa').length,
          pct_hadir: total ? Math.round((hadir / total) * 100) : 0,
          records
        }
      };
    }
    if (action === 'history' || action === 'getForStudent') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu', 'guru', 'orang_tua']);
      if (deny) return deny;
      let records = DB.attendance;
      if (params._user_role === 'guru') {
        const myIds = scopedClassIds();
        records = records.filter(r => myIds.includes(r.class_id));
        if (params.student_id) records = records.filter(r => r.student_id === params.student_id);
      } else if (params._user_role === 'orang_tua') {
        const mySIds = scopedStudentIds();
        if (params.student_id && !mySIds.includes(params.student_id)) {
          return { success: false, message: 'Anda tidak memiliki akses ke data siswa ini', error: { code: 'FORBIDDEN' } };
        }
        records = records.filter(r => mySIds.includes(r.student_id));
      } else if (params.student_id) {
        records = records.filter(r => r.student_id === params.student_id);
      }
      return { success: true, data: { items: records, records, summary: { pct_hadir: records.length ? Math.round((records.filter(r => r.status === 'hadir').length / records.length) * 100) : 0 } } };
    }
  }

  // 7. DEVELOPMENT (RAPOR ASPEK)
  if (module === 'development') {
    if (action === 'getForStudent' || action === 'list') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu', 'guru', 'orang_tua']);
      if (deny) return deny;
      // Filter scope: guru hanya lihat siswa binaannya; ortu hanya anaknya
      const reqEmail = (params._user_email || '').toLowerCase();
      const req = DB.users.find(u => u.email && u.email.toLowerCase() === reqEmail);
      let scopeStudentIds = null;
      if (params._user_role === 'guru' && req) {
        const myClassIds = DB.classes.filter(c => c.teacher_id === req.teacher_id).map(c => c.id);
        scopeStudentIds = DB.students.filter(s => myClassIds.includes(s.class_id)).map(s => s.id);
        if (params.student_id && !scopeStudentIds.includes(params.student_id)) {
          return { success: false, message: 'Anda tidak memiliki akses ke data siswa ini', error: { code: 'FORBIDDEN' } };
        }
      } else if (params._user_role === 'orang_tua' && req) {
        scopeStudentIds = DB.students.filter(s => s.parent_id === req.parent_id).map(s => s.id);
        if (params.student_id && !scopeStudentIds.includes(params.student_id)) {
          return { success: false, message: 'Anda tidak memiliki akses ke data siswa ini', error: { code: 'FORBIDDEN' } };
        }
      }
      const dev = DB.developments.find(d => (!params.student_id || d.student_id === params.student_id) && (!scopeStudentIds || scopeStudentIds.includes(d.student_id))) || (scopeStudentIds ? null : DB.developments[0]);
      if (!dev) return { success: true, data: { items: [], record: null, records: [] } };
      // PENTING: hanya kembalikan field yang aman, JANGAN spread `params` (bocor field request)
      const normalized = {
        id: dev.id,
        student_id: dev.student_id,
        student_name: dev.student_name,
        class_id: dev.class_id,
        class_name: dev.class_name,
        period: dev.period,
        aspect_nam: dev.aspect_nam || dev.nam || 'BSH',
        aspect_fisik_motorik: dev.aspect_fisik_motorik || dev.fisik_motorik || 'BSH',
        aspect_kognitif: dev.aspect_kognitif || dev.kognitif || 'BSB',
        aspect_bahasa: dev.aspect_bahasa || dev.bahasa || 'BSH',
        aspect_sosial_emosional: dev.aspect_sosial_emosional || dev.sosial_emosional || 'BSH',
        aspect_seni: dev.aspect_seni || dev.seni || 'BSB',
        teacher_notes: dev.teacher_notes || dev.teacher_note || 'Ananda berkembang sangat baik',
        updated_at: dev.updated_at || dev.created_at || new Date().toISOString()
      };
      return { success: true, data: { items: [normalized], record: normalized, records: [normalized] } };
    }
    if (action === 'upsert' || action === 'save') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu', 'guru']);
      if (deny) return deny;
      // guru: hanya boleh simpan catatan untuk siswa binaannya
      if (params._user_role === 'guru') {
        const reqEmail = (params._user_email || '').toLowerCase();
        const req = DB.users.find(u => u.email && u.email.toLowerCase() === reqEmail);
        const myClassIds = DB.classes.filter(c => c.teacher_id === (req ? req.teacher_id : null)).map(c => c.id);
        const stu = DB.students.find(s => s.id === params.student_id);
        if (!stu || !myClassIds.includes(stu.class_id)) {
          return { success: false, message: 'Anda tidak memiliki akses untuk mengubah catatan perkembangan siswa ini', error: { code: 'FORBIDDEN' } };
        }
      }
      const normalized = {
        aspect_nam: params.aspect_nam || params.nilai_agama || params.nam || '',
        aspect_fisik_motorik: params.aspect_fisik_motorik || params.fisik_motorik || '',
        aspect_kognitif: params.aspect_kognitif || params.kognitif || '',
        aspect_bahasa: params.aspect_bahasa || params.bahasa || '',
        aspect_sosial_emosional: params.aspect_sosial_emosional || params.sosial_emosional || '',
        aspect_seni: params.aspect_seni || params.seni || '',
        teacher_notes: params.teacher_notes || params.teacher_note || params.catatan_guru || '',
        updated_at: new Date().toISOString()
      };
      const existing = DB.developments.find(d => d.student_id === params.student_id);
      if (existing) {
        Object.assign(existing, normalized);
      } else {
        const stu = DB.students.find(s => s.id === params.student_id) || {};
        DB.developments.push({
          id: 'DEV-' + Date.now(),
          student_id: params.student_id,
          student_name: stu.full_name || stu.name || '',
          class_id: stu.class_id || '',
          period: params.period || 'Semester 1 2026/2027',
          created_at: new Date().toISOString(),
          ...normalized
        });
      }
      return { success: true, message: 'Catatan perkembangan berhasil disimpan', data: { message: 'Catatan perkembangan berhasil disimpan' } };
    }
  }

  // 8. PAYMENTS & INVOICES
  if (module === 'invoices') {
      if (action === 'create_bulk') {
        const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
        if (deny) return deny;
        const classId = params.class_id;
        const month = params.month || 'Oktober 2026';
        const amount = Number(params.amount) || 150000;
        const dueDate = params.due_date || new Date().toISOString().split('T')[0];
        const itemName = params.item_name || ('SPP ' + month);

        let targetStudents = (DB.students || []).filter(s => (s.status || 'active') === 'active');
        if (classId) {
          targetStudents = targetStudents.filter(s => s.class_id === classId);
        }
        if (targetStudents.length === 0) {
          return { success: false, message: 'Tidak ada siswa aktif ditemukan pada kelas/filter ini' };
        }

        const created = [];
        for (const stu of targetStudents) {
          const inv = {
            id: 'INV-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            invoice_number: 'INV/' + new Date().getFullYear() + '/' + String(DB.invoices.length + 1).padStart(3, '0'),
            student_id: stu.id,
            student_name: stu.full_name,
            item_name: itemName,
            period: month,
            amount: amount,
            due_date: dueDate,
            status: 'unpaid',
            created_at: new Date().toISOString()
          };
          DB.invoices.push(inv);
          created.push(inv);
        }
        return { success: true, message: created.length + ' tagihan massal berhasil diterbitkan', data: { invoices: created } };
      }

    if (action === 'list') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu', 'orang_tua', 'guru']);
      if (deny) return deny;
      let list = [...DB.invoices];
      
      // Filter by student_id
      if (params.student_id) list = list.filter(i => i.student_id === params.student_id);
      
      // Filter by status (unpaid, paid, menunggu_verifikasi)
      if (params.status) {
        const stNorm = String(params.status).toLowerCase();
        list = list.filter(i => (i.status || '').toLowerCase() === stNorm);
      }

      // Filter by class_id
      if (params.class_id) {
        const studentIdsInClass = DB.students.filter(s => s.class_id === params.class_id).map(s => s.id);
        list = list.filter(i => studentIdsInClass.includes(i.student_id));
      }

      // Filter by search keyword
      if (params.search) {
        const q = String(params.search).toLowerCase();
        list = list.filter(i => 
          (i.invoice_number && i.invoice_number.toLowerCase().includes(q)) ||
          (i.student_name && i.student_name.toLowerCase().includes(q)) ||
          (i.description && i.description.toLowerCase().includes(q)) ||
          (i.item_name && i.item_name.toLowerCase().includes(q))
        );
      }

      // Filter by month/period
      if (params.month) {
        const m = String(params.month).toLowerCase();
        list = list.filter(i => (i.period && i.period.toLowerCase().includes(m)) || (i.item_name && i.item_name.toLowerCase().includes(m)));
      }

      // RBAC: ortu hanya boleh lihat invoice anaknya
      const requesterRole = params._user_role;
      const requesterEmail = (params._user_email || '').toLowerCase();
      if (requesterRole === 'orang_tua' && requesterEmail) {
        const requester = DB.users.find(u => u.email && u.email.toLowerCase() === requesterEmail);
        if (requester && requester.parent_id) {
          const myStudentIds = DB.students.filter(s => s.parent_id === requester.parent_id).map(s => s.id);
          list = list.filter(i => myStudentIds.includes(i.student_id));
        } else {
          list = [];
        }
      } else if (requesterRole === 'guru' && requesterEmail) {
        // guru: hanya invoice untuk siswa di kelas binaannya
        const requester = DB.users.find(u => u.email && u.email.toLowerCase() === requesterEmail);
        const myClassIds = DB.classes.filter(c => c.teacher_id === (requester ? requester.teacher_id : null)).map(c => c.id);
        const myStudentIds = DB.students.filter(s => myClassIds.includes(s.class_id)).map(s => s.id);
        list = list.filter(i => myStudentIds.includes(i.student_id));
      }
      return { success: true, data: { items: list, invoices: list, total: list.length, pagination: { page: 1, per_page: list.length, total: list.length } } };
    }
    if (action === 'create') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const stu = DB.students.find(s => s.id === params.student_id);
      const inv = {
        id: 'INV-' + Date.now(),
        invoice_number: 'INV/' + new Date().getFullYear() + '/' + String(DB.invoices.length + 1).padStart(3,'0'),
        student_id: params.student_id,
        student_name: stu ? stu.full_name : '-',
        item_name: params.item_name || 'SPP Bulanan',
        period: params.period || new Date().toLocaleString('id-ID', {month:'long', year:'numeric'}),
        amount: Number(params.amount) || 150000,
        due_date: params.due_date || new Date().toISOString().split('T')[0],
        status: 'unpaid',
        created_at: new Date().toISOString()
      };
      DB.invoices.push(inv);
      return { success: true, message: 'Tagihan berhasil dibuat', data: { message: 'Tagihan berhasil dibuat', invoice: inv } };
    }
    if (action === 'delete') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const idx = DB.invoices.findIndex(i => i.id === params.id);
      if (idx !== -1) DB.invoices.splice(idx, 1);
      return { success: true, message: 'Tagihan berhasil dihapus', data: { message: 'Tagihan berhasil dihapus' } };
    }
    // mark_paid: admin menandai lunas untuk pembayaran offline
    if (action === 'mark_paid') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const inv = DB.invoices.find(i => i.id === params.id || i.id === params.invoice_id);
      if (!inv) return { success: false, message: 'Tagihan tidak ditemukan' };
      inv.status = 'paid';
      inv.paid_at = new Date().toISOString();
      inv.paid_by = 'Admin (Offline)';
      // hapus pembayaran pending terkait jika ada
      const pendingIdx = DB.payments.findIndex(p => p.invoice_id === inv.id && p.status === 'menunggu_verifikasi');
      if (pendingIdx !== -1) DB.payments.splice(pendingIdx, 1);
      return { success: true, message: 'Tagihan berhasil ditandai Lunas', data: { message: 'Tagihan berhasil ditandai Lunas', invoice: inv } };
    }
  }

  if (module === 'payments') {
    if (action === 'list') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu', 'orang_tua', 'guru']);
      if (deny) return deny;
      let list = [...DB.payments];
      // filter status: 'pending' atau 'menunggu_verifikasi' artinya sama
      if (params.status === 'pending' || params.status === 'menunggu_verifikasi') {
        list = list.filter(p => p.status === 'menunggu_verifikasi' || p.status === 'pending_verification' || p.status === 'pending');
      }
      // RBAC: ortu hanya boleh lihat payment anaknya sendiri
      const requesterRole = params._user_role;
      const requesterEmail = (params._user_email || '').toLowerCase();
      if (requesterRole === 'orang_tua' && requesterEmail) {
        const requester = DB.users.find(u => u.email && u.email.toLowerCase() === requesterEmail);
        if (requester && requester.parent_id) {
          const myStudentIds = DB.students.filter(s => s.parent_id === requester.parent_id).map(s => s.id);
          list = list.filter(p => myStudentIds.includes(p.student_id));
        } else {
          list = [];
        }
      } else if (requesterRole === 'guru' && requesterEmail) {
        const requester = DB.users.find(u => u.email && u.email.toLowerCase() === requesterEmail);
        const myClassIds = DB.classes.filter(c => c.teacher_id === (requester ? requester.teacher_id : null)).map(c => c.id);
        const myStudentIds = DB.students.filter(s => myClassIds.includes(s.class_id)).map(s => s.id);
        list = list.filter(p => myStudentIds.includes(p.student_id));
      }
      return { success: true, data: { items: list, payments: list, total: list.length, pagination: { page: 1, per_page: list.length, total: list.length } } };
    }
    if (action === 'summary') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const totalInv = DB.invoices.reduce((s, i) => s + Number(i.amount||0), 0);
      const totalPaid = DB.invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount||0), 0);
      const totalOut = DB.invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + Number(i.amount||0), 0);
      const pendingVer = DB.payments.filter(p => p.status === 'menunggu_verifikasi' || p.status === 'pending_verification').length;
      return { success: true, data: { total_invoice: totalInv, total_paid: totalPaid, total_outstanding: totalOut, pending_verification: pendingVer } };
    }
    // submit: orang tua kirim konfirmasi pembayaran online (upload foto)
    if (action === 'submit' || action === 'confirm' || action === 'create') {
        const deny = rbacDeny(params, ['orang_tua', 'siswa', 'super_admin', 'admin_tu']);
      if (deny) return deny;
      const inv = DB.invoices.find(i => i.id === params.invoice_id);
      if (!inv) return { success: false, message: 'Tagihan tidak ditemukan' };
      if (inv.status === 'paid') return { success: false, message: 'Tagihan sudah lunas' };

      // RBAC: hanya orang tua yang punya akses ke student_id invoice boleh submit
      const requesterEmail = (params._user_email || '').toLowerCase();
      const requesterRole = params._user_role;
      if (requesterRole === 'orang_tua' && requesterEmail) {
        const requester = DB.users.find(u => u.email && u.email.toLowerCase() === requesterEmail);
        const allowedStudentIds = DB.students
          .filter(s => s.parent_id && requester && s.parent_id === requester.parent_id)
          .map(s => s.id);
        if (!allowedStudentIds.includes(inv.student_id)) {
          return { success: false, message: 'Anda tidak memiliki akses untuk membayar tagihan siswa ini', error: { code: 'FORBIDDEN' } };
        }
      }

      // update status invoice
      inv.status = 'menunggu_verifikasi';
      const stu = DB.students.find(s => s.id === inv.student_id);
      const pay = {
        id: 'PAY-' + Date.now(),
        invoice_id: inv.id,
        invoice_number: inv.invoice_number,
        student_id: inv.student_id,
        student_name: stu ? stu.full_name : inv.student_name || '-',
        amount: inv.amount, // nominal dari invoice, BUKAN dari user
        method: params.method || 'transfer',
        payment_date: params.payment_date || new Date().toISOString().split('T')[0],
        proof_image_url: params.proof_image_url || params.proof_url || '',
        note: params.note || '',
        status: 'menunggu_verifikasi',
        submitted_at: new Date().toISOString()
      };
      DB.payments.push(pay);
      return { success: true, message: 'Konfirmasi pembayaran berhasil dikirim. Menunggu verifikasi admin.', data: { message: 'Konfirmasi pembayaran berhasil dikirim. Menunggu verifikasi admin.', payment: pay } };
    }
    // verify: admin setujui pembayaran online
    if (action === 'verify' || action === 'approve') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const pay = DB.payments.find(p => p.id === params.id);
      if (!pay) return { success: false, message: 'Data pembayaran tidak ditemukan' };
      pay.status = 'verified';
      pay.verified_at = new Date().toISOString();
      const inv = DB.invoices.find(i => i.id === pay.invoice_id);
      if (inv) {
        inv.status = 'paid';
        inv.paid_at = pay.payment_date || new Date().toISOString();
        inv.paid_by = 'Transfer Bank (Diverifikasi Admin)';
      }
      return { success: true, message: 'Pembayaran berhasil diverifikasi. Status tagihan: Lunas.', data: { message: 'Pembayaran berhasil diverifikasi. Status tagihan: Lunas.' } };
    }
    // reject: admin tolak pembayaran
    if (action === 'reject') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const pay = DB.payments.find(p => p.id === params.id);
      if (!pay) return { success: false, message: 'Data pembayaran tidak ditemukan' };
      pay.status = 'ditolak';
      const inv = DB.invoices.find(i => i.id === pay.invoice_id);
      if (inv) inv.status = 'unpaid';
      return { success: true, message: 'Pembayaran ditolak. Status tagihan kembali ke Belum Lunas.', data: { message: 'Pembayaran ditolak. Status tagihan kembali ke Belum Lunas.' } };
    }
  }

  // 9. DASHBOARD STATS
  if (module === 'dashboard') {
    const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
    if (deny) return deny;
    const now = new Date();
    const monthPrefix = now.toISOString().slice(0, 7); // "2026-09"
    const unpaidInvoices = (DB.invoices || []).filter(i => i.status === 'unpaid');
    const totalUnpaidAmount = unpaidInvoices.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const paidInvoices = (DB.invoices || []).filter(i => i.status === 'paid');
    const totalPaidAmount = paidInvoices.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalInvoicesAmount = (DB.invoices || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 5000000;
    const sppCollected = totalPaidAmount || 4500000;
    const sppTarget = totalInvoicesAmount;
    const pendingPayments = (DB.payments || []).filter(p => p.status === 'menunggu_verifikasi' || p.status === 'pending_verification' || p.status === 'pending').length;

    const stats = {
      total_students: (DB.students || []).length,
      total_students_active: (DB.students || []).filter(s => (s.status || 'active') === 'active').length,
      active_students: (DB.students || []).filter(s => (s.status || 'active') === 'active').length,
      total_teachers: (DB.teachers || []).length,
      total_teachers_active: (DB.teachers || []).filter(t => (t.status || 'active') === 'active').length,
      total_classes: (DB.classes || []).length,
      total_parents: (DB.parents || []).length || (DB.students || []).length,
      ppdb_total: (DB.ppdb_registrations || []).length,
      ppdb_pending: (DB.ppdb_registrations || []).filter(r => r.status === 'pending').length,
      ppdb_accepted: (DB.ppdb_registrations || []).filter(r => r.status === 'approved' || r.status === 'accepted').length,
      ppdb_this_month: (DB.ppdb_registrations || []).filter(r => (r.registration_date || r.created_at || '').slice(0, 7) === monthPrefix).length,
      payments_pending_verification: pendingPayments,
      fin_pending: pendingPayments,
      fin_unpaid: unpaidInvoices.length,
      fin_unpaid_amount: totalUnpaidAmount,
      fin_paid_amount: sppCollected,
      fin_total: (DB.invoices || []).length,
      attendance_today_pct: 94,
      spp_collected: sppCollected,
      spp_target: sppTarget
    };
    return { success: true, data: stats };
  }

  // 11. USERS MANAGEMENT
  if (module === 'users') {
    const safeProjection = (u) => ({
      id: u.id,
      name: u.name,
      full_name: u.full_name || u.name,
      email: u.email,
      role: u.role,
      role_label: u.role_label,
      status: u.status || 'active',
      is_active: (u.status || 'active') === 'active',
      phone: u.phone || '',
      avatar: u.avatar || '',
      teacher_id: u.teacher_id || null,
      parent_id: u.parent_id || null,
      student_id: u.student_id || null,
      created_at: u.created_at || '2026-01-01T00:00:00.000Z'
    });

    if (action === 'list') {
      const requesterRole = params._user_role;
      if (requesterRole !== 'super_admin' && requesterRole !== 'admin_tu') {
        return { success: false, message: 'Anda tidak memiliki akses untuk melihat daftar user', error: { code: 'FORBIDDEN' } };
      }
      const role = params.role || (params.role_id === 'ROLE-001' ? 'super_admin' : params.role_id === 'ROLE-002' ? 'admin_tu' : params.role_id === 'ROLE-003' ? 'guru' : params.role_id === 'ROLE-004' ? 'orang_tua' : params.role_id === 'ROLE-005' ? 'pendaftar' : null);
      let list = DB.users.map(safeProjection);
      if (role) list = list.filter(u => u.role === role);
      if (params.search) {
        const q = String(params.search).toLowerCase();
        list = list.filter(u => (u.full_name && u.full_name.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q)) || (u.phone && String(u.phone).toLowerCase().includes(q)));
      }
      const total = list.length;
      return { success: true, data: { items: list, users: list, total, pagination: { page: 1, per_page: total, total } } };
    }

    if (action === 'get') {
      const requesterRole = params._user_role;
      if (requesterRole !== 'super_admin' && requesterRole !== 'admin_tu') {
        return { success: false, message: 'Anda tidak memiliki akses untuk melihat data user', error: { code: 'FORBIDDEN' } };
      }
      const u = DB.users.find(x => x.id === params.id);
      if (!u) return { success: false, message: 'User tidak ditemukan', error: { code: 'NOT_FOUND' } };
      return { success: true, data: { user: safeProjection(u), ...safeProjection(u) } };
    }

    if (action === 'create') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const seq = DB.users.length + 1;
      const status = params.status || (params.is_active === false ? 'inactive' : 'active');
      const newUser = {
        id: 'USR-' + String(seq).padStart(3, '0'),
        name: params.name || params.full_name || 'User Baru',
        full_name: params.full_name || params.name || 'User Baru',
        email: params.email || ('user' + seq + '@yayasan.sch.id'),
        password: params.password || 'user123',
        role: params.role || 'orang_tua',
        role_label: params.role_label || 'Orang Tua / Wali',
        status: status,
        phone: params.phone || '',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        teacher_id: params.teacher_id || null,
        parent_id: params.parent_id || null,
        student_id: params.student_id || null,
        created_at: new Date().toISOString()
      };
      DB.users.push(newUser);
      DB.activity_logs.unshift({ id: 'LOG-' + Date.now(), user_id: 'system', user_name: 'System', action: 'user_create', module: 'users', description: 'User ' + newUser.email + ' dibuat', created_at: new Date().toISOString() });
      return { success: true, message: 'User berhasil dibuat', data: { message: 'User berhasil dibuat', user: safeProjection(newUser) } };
    }

    if (action === 'update') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const u = DB.users.find(x => x.id === params.id);
      if (!u) return { success: false, message: 'User tidak ditemukan', error: { code: 'NOT_FOUND' } };
      if (params.name != null) u.name = params.name;
      if (params.full_name != null) { u.full_name = params.full_name; if (!u.name) u.name = params.full_name; }
      if (params.phone != null) u.phone = params.phone;
      if (params.status != null) u.status = params.status;
      if (params.is_active != null) u.status = params.is_active ? 'active' : 'inactive';
      if (params.role != null) u.role = params.role;
      if (params.role_label != null) u.role_label = params.role_label;
      if (params.password) u.password = params.password;
      DB.activity_logs.unshift({ id: 'LOG-' + Date.now(), user_id: u.id, user_name: u.name, action: 'user_update', module: 'users', description: 'User ' + u.email + ' diperbarui', created_at: new Date().toISOString() });
      return { success: true, message: 'User berhasil diperbarui', data: { message: 'User berhasil diperbarui', user: safeProjection(u) } };
    }

    if (action === 'activate' || action === 'deactivate') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const u = DB.users.find(x => x.id === params.id);
      if (!u) return { success: false, message: 'User tidak ditemukan', error: { code: 'NOT_FOUND' } };
      u.status = action === 'activate' ? 'active' : 'inactive';
      DB.activity_logs.unshift({ id: 'LOG-' + Date.now(), user_id: u.id, user_name: u.name, action: 'user_' + action, module: 'users', description: 'User ' + u.email + ' ' + (action === 'activate' ? 'diaktifkan' : 'dinonaktifkan'), created_at: new Date().toISOString() });
      return { success: true, message: 'Status user diperbarui', data: { message: 'Status user diperbarui', user: safeProjection(u) } };
    }

    if (action === 'delete') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const idx = DB.users.findIndex(x => x.id === params.id);
      if (idx === -1) return { success: false, message: 'User tidak ditemukan', error: { code: 'NOT_FOUND' } };
      const removed = DB.users.splice(idx, 1)[0];
      return { success: true, message: 'User berhasil dihapus', data: { message: 'User berhasil dihapus', user: safeProjection(removed) } };
    }
  }

  // 12. CONTENT: NEWS, ANNOUNCEMENTS, EVENTS, GALLERIES
  if (module === 'news' || module === 'announcements' || module === 'events' || module === 'galleries' || module === 'gallery') {
    const dbKey = module === 'gallery' ? 'galleries' : module;
    const items = DB[dbKey] || [];
    if (action === 'list') {
      const perPage = Number(params.per_page) || 50;
      const page = Number(params.page) || 1;
      let list = [...items].reverse();
      if (params.is_published === 'true' || params.is_published === true) {
        list = list.filter(i => i.status === 'published' || i.is_published === true || i.is_published === 'TRUE');
      } else if (params.status) {
        list = list.filter(i => i.status === params.status);
      }
      const total = list.length;
      const sliced = list.slice((page - 1) * perPage, page * perPage);
      return { success: true, data: { items: sliced, total, pagination: { page, per_page: perPage, total } }, items: sliced, total };
    }
    if (action === 'get') {
      const item = items.find(i => i.id === params.id || (params.slug && i.slug === params.slug));
      if (!item) return { success: false, message: 'Konten tidak ditemukan', error: { code: 'NOT_FOUND' } };
      return { success: true, data: item };
    }
    if (action === 'create') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const seq = items.length + 1;
      const prefix = { news: 'NWS', announcements: 'ANN', events: 'EVT', galleries: 'GAL', gallery: 'GAL' }[dbKey] || 'CTN';
      const newItem = Object.assign({
        id: prefix + '-' + String(seq).padStart(3, '0'),
        created_at: new Date().toISOString(),
        status: params.status || 'draft',
        is_published: params.is_published === true || params.status === 'published'
      }, params);
      items.unshift(newItem);
      DB.activity_logs.unshift({ id: 'LOG-' + Date.now(), user_id: 'admin', user_name: 'Administrator', action: dbKey + '_create', module, description: 'Konten baru: ' + (params.title || newItem.id), created_at: new Date().toISOString() });
      return { success: true, message: 'Konten berhasil disimpan', data: { message: 'Konten berhasil disimpan', item: newItem } };
    }
    if (action === 'update') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const idx = items.findIndex(i => i.id === params.id);
      if (idx === -1) return { success: false, message: 'Konten tidak ditemukan', error: { code: 'NOT_FOUND' } };
      Object.assign(items[idx], params);
      return { success: true, message: 'Konten diperbarui', data: { message: 'Konten diperbarui', item: items[idx] } };
    }
    if (action === 'delete' || action === 'remove') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const idx = items.findIndex(i => i.id === params.id);
      if (idx === -1) return { success: false, message: 'Konten tidak ditemukan', error: { code: 'NOT_FOUND' } };
      const removed = items.splice(idx, 1)[0];
      return { success: true, message: 'Konten dihapus', data: { message: 'Konten dihapus', item: removed } };
    }
  }

  // 13. TEACHERS MANAGEMENT (admin portal)
  if (module === 'teachers') {
    const proj = (t) => ({
      id: t.id,
      full_name: t.full_name || t.name,
      name: t.full_name || t.name,
      nip: t.nip || '',
      email: t.email,
      phone: t.phone || '',
      specialization: t.specialization || '',
      is_active: (t.status || 'active') === 'active',
      status: t.status || 'active',
      joined_at: t.joined_at || null,
      start_date: t.start_date || t.joined_at || null,
      user_id: t.user_id || null
    });

    if (action === 'list') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const list = DB.teachers.map(proj);
      return { success: true, data: { items: list, teachers: list, total: list.length, pagination: { page: 1, per_page: list.length, total: list.length } } };
    }
    if (action === 'get') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const t = DB.teachers.find(x => x.id === params.id);
      if (!t) return { success: false, message: 'Guru tidak ditemukan', error: { code: 'NOT_FOUND' } };
      return { success: true, data: { teacher: proj(t), ...proj(t) } };
    }
    if (action === 'create') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const seq = DB.teachers.length + 1;
      const newT = {
        id: 'TEA-' + String(seq).padStart(3, '0'),
        user_id: params.user_id || null,
        full_name: params.full_name || params.name || 'Guru Baru',
        name: params.full_name || params.name || 'Guru Baru',
        nip: params.nip || '',
        email: params.email || '',
        phone: params.phone || '',
        specialization: params.specialization || '',
        start_date: params.start_date || params.joined_at || new Date().toISOString().split('T')[0],
        joined_at: params.joined_at || params.start_date || new Date().toISOString().split('T')[0],
        status: params.status || (params.is_active === false ? 'inactive' : 'active'),
        password: params.password || 'guru' + String(seq).padStart(3, '0')
      };
      DB.teachers.push(newT);
      return { success: true, message: 'Guru berhasil ditambahkan', data: { message: 'Guru berhasil ditambahkan', teacher: proj(newT), initial_password: newT.password } };
    }
    if (action === 'update') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const t = DB.teachers.find(x => x.id === params.id);
      if (!t) return { success: false, message: 'Guru tidak ditemukan', error: { code: 'NOT_FOUND' } };
      if (params.full_name != null) { t.full_name = params.full_name; t.name = params.full_name; }
      if (params.name != null && params.full_name == null) { t.full_name = params.name; t.name = params.name; }
      if (params.nip != null) t.nip = params.nip;
      if (params.email != null) t.email = params.email;
      if (params.phone != null) t.phone = params.phone;
      if (params.specialization != null) t.specialization = params.specialization;
      if (params.start_date != null) { t.start_date = params.start_date; t.joined_at = params.start_date; }
      if (params.joined_at != null && params.start_date == null) { t.joined_at = params.joined_at; t.start_date = params.joined_at; }
      if (params.status != null) t.status = params.status;
      if (params.is_active != null) t.status = params.is_active ? 'active' : 'inactive';
      return { success: true, message: 'Data guru diperbarui', data: { message: 'Data guru diperbarui', teacher: proj(t) } };
    }
    if (action === 'activate' || action === 'deactivate') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const t = DB.teachers.find(x => x.id === params.id);
      if (!t) return { success: false, message: 'Guru tidak ditemukan', error: { code: 'NOT_FOUND' } };
      t.status = action === 'activate' ? 'active' : 'inactive';
      return { success: true, message: 'Status guru diperbarui', data: { message: 'Status guru diperbarui', teacher: proj(t) } };
    }
    if (action === 'delete') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const idx = DB.teachers.findIndex(x => x.id === params.id);
      if (idx === -1) return { success: false, message: 'Guru tidak ditemukan', error: { code: 'NOT_FOUND' } };
      DB.teachers.splice(idx, 1);
      return { success: true, message: 'Guru berhasil dihapus', data: { message: 'Guru berhasil dihapus' } };
    }
    if (action === 'classes') {
      // already handled by guru-facing block above
      const deny = rbacDeny(params, ['super_admin', 'admin_tu', 'guru']);
      if (deny) return deny;
      return { success: true, data: { classes: DB.classes } };
    }
  }

  // 14. CLASSES MANAGEMENT (admin)
  if (module === 'classes') {
    const proj = (c) => ({
      id: c.id,
      name: c.name,
      level: c.level,
      teacher_id: c.teacher_id || null,
      teacher_name: c.teacher_name || '',
      student_count: c.student_count || DB.students.filter(s => s.class_id === c.id).length,
      capacity: c.capacity || 20,
      academic_year: c.academic_year || '2026/2027',
      grade_level: c.grade_level || c.level,
      homeroom_teacher_id: c.teacher_id || null
    });
    // 'list' sudah ditangani di blok guru-facing (allow guru + admin, filter homeroom untuk guru)
    if (action === 'get') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const c = DB.classes.find(x => x.id === params.id);
      if (!c) return { success: false, message: 'Kelas tidak ditemukan', error: { code: 'NOT_FOUND' } };
      return { success: true, data: { class: proj(c), ...proj(c) } };
    }
    if (action === 'create') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const seq = DB.classes.length + 1;
      const newC = {
        id: 'CLS-' + String(seq).padStart(3, '0'),
        name: params.name || 'Kelas Baru',
        level: params.level || params.grade_level || 'PAUD',
        teacher_id: params.homeroom_teacher_id || params.teacher_id || null,
        teacher_name: params.teacher_name || '',
        student_count: 0,
        capacity: Number(params.capacity) || 20,
        academic_year: params.academic_year || '2026/2027'
      };
      DB.classes.push(newC);
      return { success: true, message: 'Kelas berhasil dibuat', data: { message: 'Kelas berhasil dibuat', class: proj(newC) } };
    }
    if (action === 'update') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const c = DB.classes.find(x => x.id === params.id);
      if (!c) return { success: false, message: 'Kelas tidak ditemukan', error: { code: 'NOT_FOUND' } };
      if (params.name != null) c.name = params.name;
      if (params.level != null) c.level = params.level;
      if (params.grade_level != null && params.level == null) c.level = params.grade_level;
      if (params.homeroom_teacher_id != null) {
        c.teacher_id = params.homeroom_teacher_id;
        const t = DB.teachers.find(x => x.id === params.homeroom_teacher_id);
        c.teacher_name = t ? (t.full_name || t.name) : '';
      }
      if (params.teacher_id != null && params.homeroom_teacher_id == null) c.teacher_id = params.teacher_id;
      if (params.capacity != null) c.capacity = Number(params.capacity);
      if (params.academic_year != null) c.academic_year = params.academic_year;
      return { success: true, message: 'Kelas diperbarui', data: { message: 'Kelas diperbarui', class: proj(c) } };
    }
    if (action === 'delete') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const idx = DB.classes.findIndex(x => x.id === params.id);
      if (idx === -1) return { success: false, message: 'Kelas tidak ditemukan', error: { code: 'NOT_FOUND' } };
      DB.classes.splice(idx, 1);
      return { success: true, message: 'Kelas berhasil dihapus', data: { message: 'Kelas berhasil dihapus' } };
    }
  }

  // 15. ACTIVITY LOGS
  if (module === 'logs') {
    if (action === 'list') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      let list = (DB.activity_logs || []).slice().reverse();
      if (params.user_id) list = list.filter(l => String(l.user_id) === String(params.user_id));
      if (params.module) list = list.filter(l => l.module === params.module);
      if (params.action) list = list.filter(l => l.action === params.action);
      const perPage = Number(params.per_page) || 50;
      const page = Number(params.page) || 1;
      const total = list.length;
      const sliced = list.slice((page - 1) * perPage, page * perPage);
      return { success: true, data: { items: sliced, logs: sliced, total, pagination: { page, per_page: perPage, total } } };
    }
  }

  // 16. REPORTS & EXCEL REKAP
  if (module === 'reports') {
    if (action === 'generate') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const reportType = params.report_type || 'students';
      let rows = [];
      let headers = [];

      if (reportType === 'students') {
        headers = ['No', 'NIS', 'Nama Lengkap', 'Kelas', 'Jenis Kelamin', 'Nama Wali', 'No. HP / WA', 'Status'];
        rows = DB.students.map((s, idx) => [
          idx + 1,
          s.nis || '-',
          s.full_name || s.name || '-',
          s.class_name || s.kelas_sekarang || s.class_id || '-',
          s.gender === 'L' ? 'Laki-laki' : (s.gender === 'P' ? 'Perempuan' : (s.gender || '-')),
          s.parent_name || s.father_name || s.mother_name || '-',
          s.parent_phone || s.phone || '-',
          (s.status || 'active').toUpperCase()
        ]);
      } else if (reportType === 'payments' || reportType === 'finance') {
        headers = ['No', 'No. Tagihan', 'Nama Siswa', 'Keterangan / Periode', 'Nominal (Rp)', 'Jatuh Tempo', 'Status Tagihan'];
        let list = [...DB.invoices];
        if (params.month) {
          list = list.filter(i => (i.due_date && i.due_date.startsWith(params.month)) || (i.period && i.period.includes(params.month)));
        }
        rows = list.map((i, idx) => [
          idx + 1,
          i.invoice_number || '-',
          i.student_name || '-',
          i.description || i.item_name || i.period || i.month || '-',
          Number(i.amount || 0).toLocaleString('id-ID'),
          i.due_date || '-',
          i.status === 'paid' ? 'LUNAS' : (i.status === 'menunggu_verifikasi' ? 'MENUNGGU VERIFIKASI' : 'BELUM LUNAS')
        ]);
      } else if (reportType === 'ppdb') {
        headers = ['No', 'No. Pendaftaran', 'Nama Calon Siswa', 'Jalur / Jenjang', 'Nama Wali', 'No. HP', 'Status', 'Tgl Daftar'];
        let list = [...DB.ppdb_registrations];
        if (params.academic_year) {
          list = list.filter(r => (r.academic_year && r.academic_year.includes(params.academic_year)) || (r.period_name && r.period_name.includes(params.academic_year)));
        }
        rows = list.map((r, idx) => [
          idx + 1,
          r.registration_number || r.registration_no || '-',
          r.full_name || r.child_name || '-',
          (r.form_type || 'PAUD').toUpperCase(),
          r.father_name || r.parent_name || '-',
          r.phone || r.father_phone || '-',
          (r.status || 'pending').toUpperCase(),
          (r.registration_date || r.created_at || '').slice(0, 10)
        ]);
      } else if (reportType === 'attendance') {
        headers = ['No', 'Tanggal', 'Nama Siswa', 'Kelas', 'Status Kehadiran', 'Catatan'];
        let list = [...(DB.attendance || [])];
        if (params.month) {
          list = list.filter(a => a.date && a.date.startsWith(params.month));
        }
        rows = list.map((a, idx) => [
          idx + 1,
          a.date || '-',
          a.student_name || '-',
          a.class_id || '-',
          (a.status || 'hadir').toUpperCase(),
          a.notes || '-'
        ]);
      } else if (reportType === 'development') {
        headers = ['No', 'Siswa', 'Semester', 'Tahun Ajaran', 'NAM', 'Fisik Motorik', 'Kognitif', 'Bahasa', 'Sosial Emosional', 'Seni'];
        let list = [...(DB.developments || [])];
        if (params.semester) list = list.filter(d => String(d.semester) === String(params.semester));
        if (params.year) list = list.filter(d => d.academic_year && d.academic_year.includes(params.year));
        rows = list.map((d, idx) => [
          idx + 1,
          d.student_name || '-',
          d.semester || '1',
          d.academic_year || '2026/2027',
          d.aspect_nam || 'Baik',
          d.aspect_fisik_motorik || 'Baik',
          d.aspect_kognitif || 'Baik',
          d.aspect_bahasa || 'Baik',
          d.aspect_sosial_emosional || 'Baik',
          d.aspect_seni || 'Baik'
        ]);
      } else if (reportType === 'all') {
        headers = ['No', 'Modul Data', 'Jumlah Entitas Terdaftar', 'Keterangan'];
        rows = [
          [1, 'Siswa Aktif', String(DB.students.filter(s => (s.status || 'active') === 'active').length) + ' Siswa', 'Terdaftar di database yayasan'],
          [2, 'Tenaga Pengajar (Guru)', String(DB.teachers.length) + ' Guru', 'Pengajar aktif'],
          [3, 'Rombongan Belajar (Kelas)', String(DB.classes.length) + ' Kelas', 'Tahun Ajaran 2026/2027'],
          [4, 'Tagihan SPP Tercatat', String(DB.invoices.length) + ' Tagihan', 'Total transaksi keuangan'],
          [5, 'Pendaftar PPDB', String(DB.ppdb_registrations.length) + ' Berkas', 'Penerimaan siswa baru']
        ];
      }

      return {
        success: true,
        data: {
          report_type: reportType,
          headers,
          rows,
          total: rows.length,
          generated_at: new Date().toISOString()
        }
      };
    }

    // Import Tagihan SPP Massal dari Excel / CSV
    if (action === 'import_invoices') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const rawItems = Array.isArray(params.items) ? params.items : [];
      if (rawItems.length === 0) {
        return { success: false, message: 'Tidak ada data tagihan yang dikirim untuk diimpor' };
      }

      let insertedCount = 0;
      for (const row of rawItems) {
        // Cari siswa yang cocok berdasarkan NIS atau nama
        const stu = DB.students.find(s => 
          (row.nis && s.nis && String(s.nis).trim() === String(row.nis).trim()) ||
          (row.student_name && s.full_name && s.full_name.toLowerCase().includes(String(row.student_name).toLowerCase().trim()))
        ) || DB.students[0];

        const inv = {
          id: 'INV-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
          invoice_number: row.invoice_number || ('INV/' + new Date().getFullYear() + '/' + String(DB.invoices.length + 1).padStart(3, '0')),
          student_id: stu ? stu.id : (row.student_id || 'STU-001'),
          student_name: row.student_name || (stu ? stu.full_name : 'Siswa Import'),
          item_name: row.description || row.item_name || 'SPP Import Excel',
          description: row.description || row.item_name || 'SPP Import Excel',
          period: row.period || row.month || 'Periode Berjalan',
          amount: Number(row.amount) || 150000,
          due_date: row.due_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          status: (row.status || 'unpaid').toLowerCase(),
          created_at: new Date().toISOString()
        };
        DB.invoices.unshift(inv);
        insertedCount++;
      }

      DB.activity_logs.unshift({
        id: 'LOG-' + Date.now(),
        user_id: params._user_id || 'admin',
        user_name: 'Administrator',
        action: 'import_invoices',
        module: 'reports',
        description: `Import ${insertedCount} data tagihan SPP dari file Excel/CSV`,
        created_at: new Date().toISOString()
      });

      return {
        success: true,
        message: `Berhasil mengimpor ${insertedCount} data tagihan ke dalam database!`,
        count: insertedCount
      };
    }

    // Import Data Siswa Massal dari Excel / CSV
    if (action === 'import_students') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const rawItems = Array.isArray(params.items) ? params.items : [];
      if (rawItems.length === 0) {
        return { success: false, message: 'Tidak ada data siswa yang dikirim untuk diimpor' };
      }

      let insertedCount = 0;
      for (const row of rawItems) {
        const seq = DB.students.length + 1;
        const newStu = {
          id: 'STU-' + String(seq).padStart(3, '0'),
          nis: row.nis || ('NIS' + String(1000 + seq)),
          full_name: row.full_name || row.name || 'Siswa Baru ' + seq,
          name: row.full_name || row.name || 'Siswa Baru ' + seq,
          nickname: row.nickname || (row.full_name || '').split(' ')[0] || 'Siswa',
          gender: row.gender || 'L',
          birth_place: row.birth_place || 'Samarinda',
          birth_date: row.birth_date || '2020-01-01',
          class_id: row.class_id || (DB.classes[0] ? DB.classes[0].id : 'CLS-001'),
          class_name: row.class_name || (DB.classes[0] ? DB.classes[0].name : 'PAUD A'),
          kelas_sekarang: row.class_name || (DB.classes[0] ? DB.classes[0].name : 'PAUD A'),
          parent_name: row.parent_name || row.father_name || 'Wali Siswa',
          father_name: row.father_name || row.parent_name || 'Wali Siswa',
          mother_name: row.mother_name || '',
          parent_phone: row.phone || row.parent_phone || '081234567890',
          phone: row.phone || row.parent_phone || '081234567890',
          parent_email: row.email || `${seq}@siswa.yayasan.sch.id`,
          address: row.address || 'Samarinda',
          status: 'active',
          joined_at: new Date().toISOString().split('T')[0]
        };
        DB.students.push(newStu);
        insertedCount++;
      }

      DB.activity_logs.unshift({
        id: 'LOG-' + Date.now(),
        user_id: params._user_id || 'admin',
        user_name: 'Administrator',
        action: 'import_students',
        module: 'reports',
        description: `Import ${insertedCount} data siswa dari file Excel/CSV`,
        created_at: new Date().toISOString()
      });

      return {
        success: true,
        message: `Berhasil mengimpor ${insertedCount} data siswa ke dalam database!`,
        count: insertedCount
      };
    }
  }

  // 17. BACKUP & RESTORE
  if (module === 'backup') {
    if (action === 'list' || action === 'backups') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      return { success: true, data: { items: DB.backups || [], backups: DB.backups || [], total: (DB.backups || []).length }, items: DB.backups || [] };
    }
    if (action === 'create') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const bakId = 'BAK-' + Date.now();
      const dStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `backup-yayasan-${dStr}.json`;
      const bakDir = path.join(__dirname, 'backups');
      if (!fs.existsSync(bakDir)) {
        try { fs.mkdirSync(bakDir, { recursive: true }); } catch (_) {}
      }
      const bakPath = path.join(bakDir, filename);

      const snapshotData = {
        meta: {
          app: 'SIYAYASAN V2',
          exported_at: new Date().toISOString(),
          version: '2.0.0'
        },
        users: DB.users || [],
        students: DB.students || [],
        classes: DB.classes || [],
        teachers: DB.teachers || [],
        invoices: DB.invoices || [],
        payments: DB.payments || [],
        ppdb_registrations: DB.ppdb_registrations || [],
        ppdb_periods: DB.ppdb_periods || [],
        attendance: DB.attendance || [],
        developments: DB.developments || [],
        news: DB.news || [],
        announcements: DB.announcements || [],
        events: DB.events || [],
        galleries: DB.galleries || [],
        school_profile: DB.school_profile || {},
        web_settings: DB.web_settings || {},
        activity_logs: DB.activity_logs || []
      };

      let sizeMb = 0.5;
      try {
        const dump = JSON.stringify(snapshotData, null, 2);
        fs.writeFileSync(bakPath, dump, 'utf8');
        sizeMb = Math.round((Buffer.byteLength(dump) / (1024 * 1024)) * 100) / 100;
      } catch (_) {}

      const newBak = {
        id: bakId,
        folder_name: filename,
        filename: filename,
        folder_url: '#',
        file_count: Object.keys(snapshotData).length,
        size_mb: sizeMb,
        created_at: new Date().toISOString(),
        created_by: 'Administrator'
      };
      DB.backups.unshift(newBak);

      DB.activity_logs.unshift({
        id: 'LOG-' + Date.now(),
        user_id: params._user_id || 'admin',
        user_name: 'Administrator',
        action: 'backup_create',
        module: 'backup',
        description: `Membuat backup database: ${filename}`,
        created_at: new Date().toISOString()
      });

      return {
        success: true,
        message: 'Backup database berhasil dibuat: ' + filename,
        data: {
          message: 'Backup berhasil dibuat',
          backup: newBak,
          filename: filename,
          download_url: `/backups/${filename}`,
          snapshot: snapshotData
        }
      };
    }
    if (action === 'restore') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;

      let restoreData = params.data || params.backup_data;

      // Jika restore via ID backup yang tersimpan di disk
      if (!restoreData && params.id) {
        const found = DB.backups.find(b => b.id === params.id || b.folder_name === params.id);
        if (found) {
          const diskPath = path.join(__dirname, 'backups', found.folder_name);
          if (fs.existsSync(diskPath)) {
            try {
              restoreData = JSON.parse(fs.readFileSync(diskPath, 'utf8'));
            } catch (_) {}
          }
        }
      }

      if (!restoreData) {
        return { success: false, message: 'Data file cadangan (JSON) tidak ditemukan atau format tidak sesuai.' };
      }

      // Restore setiap modul
      if (Array.isArray(restoreData.students)) DB.students = restoreData.students;
      if (Array.isArray(restoreData.users)) DB.users = restoreData.users;
      if (Array.isArray(restoreData.classes)) DB.classes = restoreData.classes;
      if (Array.isArray(restoreData.teachers)) DB.teachers = restoreData.teachers;
      if (Array.isArray(restoreData.invoices)) DB.invoices = restoreData.invoices;
      if (Array.isArray(restoreData.payments)) DB.payments = restoreData.payments;
      if (Array.isArray(restoreData.ppdb_registrations)) DB.ppdb_registrations = restoreData.ppdb_registrations;
      if (Array.isArray(restoreData.news)) DB.news = restoreData.news;
      if (Array.isArray(restoreData.galleries)) DB.galleries = restoreData.galleries;
      if (restoreData.school_profile && typeof restoreData.school_profile === 'object') DB.school_profile = restoreData.school_profile;
      if (restoreData.web_settings && typeof restoreData.web_settings === 'object') DB.web_settings = restoreData.web_settings;

      DB.activity_logs.unshift({
        id: 'LOG-' + Date.now(),
        user_id: params._user_id || 'admin',
        user_name: 'Administrator',
        action: 'backup_restore',
        module: 'backup',
        description: 'Memulihkan database dari file cadangan',
        created_at: new Date().toISOString()
      });

      return {
        success: true,
        message: 'Database yayasan berhasil dipulihkan dari file cadangan!',
        data: {
          message: 'Data berhasil disinkronkan.',
          restored_tables: Object.keys(restoreData).length
        }
      };
    }
    if (action === 'delete') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      const idx = DB.backups.findIndex(b => b.id === params.id);
      if (idx !== -1) {
        const removed = DB.backups.splice(idx, 1)[0];
        try {
          const p = path.join(__dirname, 'backups', removed.folder_name);
          if (fs.existsSync(p)) fs.unlinkSync(p);
        } catch (_) {}
      }
      return { success: true, message: 'Riwayat cadangan berhasil dihapus' };
    }
  }

  // 18. PARENT PROFILE (portal ortu)
  if (module === 'parent') {
    const requesterEmail = (params._user_email || '').toLowerCase();
    const requester = DB.users.find(u => u.email && u.email.toLowerCase() === requesterEmail);
    if (!requester || requester.role !== 'orang_tua') {
      return { success: false, message: 'Hanya orang tua yang dapat mengakses', error: { code: 'FORBIDDEN' } };
    }
    if (action === 'me') {
      const children = DB.students.filter(s => s.parent_id === requester.parent_id);
      const myInvoices = DB.invoices.filter(i => i.parent_id === requester.parent_id || children.some(c => c.id === i.student_id));
      return {
        success: true,
        data: {
          user: {
            id: requester.id,
            full_name: requester.full_name || requester.name,
            name: requester.name,
            email: requester.email,
            phone: requester.phone || '',
            avatar: requester.avatar || '',
            role: requester.role,
            role_label: requester.role_label,
            parent_id: requester.parent_id,
            student_id: requester.student_id
          },
          parent: {
            id: requester.parent_id,
            full_name: requester.full_name || requester.name,
            phone: requester.phone || '',
            email: requester.email,
            address: requester.address || ''
          },
          children,
          invoices: myInvoices
        }
      };
    }
    if (action === 'update_profile') {
      if (params.full_name != null) { requester.full_name = params.full_name; requester.name = params.full_name; }
      if (params.phone != null) requester.phone = params.phone;
      if (params.address != null) requester.address = params.address;
      if (params.occupation != null) requester.occupation = params.occupation;
      return { success: true, message: 'Profil berhasil diperbarui', data: { message: 'Profil berhasil diperbarui', user: { ...requester, full_name: requester.full_name || requester.name } } };
    }
  }

  // 19. AUTH: change password (any authenticated role can change their own)
  if (module === 'auth' && action === 'change_password') {
    const deny = rbacDeny(params, []);
    if (deny) return deny;
    const requesterEmail = (params._user_email || '').toLowerCase();
    const u = DB.users.find(x => x.email && x.email.toLowerCase() === requesterEmail);
    if (!u) return { success: false, message: 'User tidak ditemukan', error: { code: 'NOT_FOUND' } };
    if (!params.old_password || u.password !== params.old_password) {
      return { success: false, message: 'Password lama salah', error: { code: 'INVALID_OLD_PASSWORD' } };
    }
    if (!params.new_password || String(params.new_password).length < 6) {
      return { success: false, message: 'Password baru minimal 6 karakter', error: { code: 'WEAK_PASSWORD' } };
    }
    u.password = String(params.new_password);
    return { success: true, message: 'Password berhasil diperbarui', data: { message: 'Password berhasil diperbarui' } };
  }

  // 20. PPDB: get detail
  if (module === 'ppdb' && action === 'get') {
    const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
    if (deny) return deny;
    const reg = DB.ppdb_registrations.find(r => r.id === params.id || r.registration_number === params.id);
    if (!reg) return { success: false, message: 'Pendaftar tidak ditemukan', error: { code: 'NOT_FOUND' } };
    return { success: true, data: { ...reg, registration: reg } };
  }
  // Simpan notes di approve (admin only)
  if (module === 'ppdb' && (action === 'accept' || action === 'approve')) {
    const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
    if (deny) return deny;
    const reg = DB.ppdb_registrations.find(r => r.id === params.id || r.registration_number === params.id);
    if (reg) {
      reg.status = 'approved';
      if (params.notes) reg.notes = params.notes;
    }
    return { success: true, message: 'Pendaftar berhasil disetujui', data: { message: 'Pendaftar berhasil disetujui', registration: reg } };
  }

  // 21. SCHOOLS & INSTITUTION SETTINGS (content.html Tab Profil & Website Utama)
  if (module === 'schools' || module === 'school') {
    const computeStats = () => ({
      total_students: (DB.students || []).filter(s => (s.status || 'active') === 'active').length,
      total_teachers: (DB.teachers || []).filter(t => (t.status || 'active') === 'active' || t.is_active).length,
      total_classes: (DB.classes || []).length,
      years_serving: 15
    });

    if (action === 'get' || !action) {
      const school = DB.school_profile || {
        id: 'SCH-001',
        name: 'YAYASAN AT TARBIYYAH WIJAYA KUSUMA SAMARINDA',
        npsn: '69912345',
        level: 'PAUD, TK, dan TPQ',
        address: 'Jl. Wijaya Kusuma V-A No. 38, Kel. Air Putih, Kec. Samarinda Ulu Kota Samarinda, Kalimantan Timur, Kode Pos: 75124',
        campus_note: 'Kampus Utama Air Putih, Samarinda Ulu',
        maps_url: 'https://maps.google.com/?q=Jl.+Wijaya+Kusuma+V-A+No.+38,+Air+Putih,+Samarinda+Ulu,+Kota+Samarinda,+Kalimantan+Timur+75124',
        maps_embed_url: 'https://maps.google.com/maps?q=Jl.+Wijaya+Kusuma+V-A+No.+38,+Air+Putih,+Samarinda+Ulu,+Kota+Samarinda,+Kalimantan+Timur+75124&t=&z=16&ie=UTF8&iwloc=&output=embed',
        phone: '081347142829',
        whatsapp_number: '081347142829',
        email: 'info@attarbiyyah-samarinda.sch.id',
        headmaster_name: 'Makhrus',
        ketua_yayasan: 'Makhrus',
        bendahara: 'Sri Pragawati',
        sekretaris: 'Candra Gunawan',
        pembina: 'DJOKO IRIANDONO',
        pengawas: 'Suhardi',
        instagram_url: 'https://instagram.com/yayasansamarinda',
        youtube_url: 'https://youtube.com/@yayasansamarinda',
        facebook_url: 'https://facebook.com/yayasansamarinda',
        footer_bg_url: 'images/school-campus.jpg'
      };
      school.stats = computeStats();
      return { success: true, data: school };
    }
    if (action === 'stats') {
      return { success: true, data: computeStats() };
    }
    if (action === 'update') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      if (!DB.school_profile) DB.school_profile = {};
      Object.assign(DB.school_profile, params);

      // Auto-sync ke DB.web_settings jika ada pembaruan
      if (!DB.web_settings) DB.web_settings = {};
      if (params.name) DB.web_settings.school_name = params.name;
      if (params.address) DB.web_settings.address = params.address;
      if (params.campus_note) DB.web_settings.campus_note = params.campus_note;
      if (params.maps_url) DB.web_settings.maps_url = params.maps_url;
      if (params.maps_embed_url) DB.web_settings.maps_embed_url = params.maps_embed_url;
      if (params.phone) DB.web_settings.phone = params.phone;
      if (params.email) DB.web_settings.email = params.email;
      if (params.whatsapp_number) DB.web_settings.whatsapp = params.whatsapp_number;
      if (params.facebook_url) DB.web_settings.facebook_url = params.facebook_url;
      if (params.instagram_url) DB.web_settings.instagram_url = params.instagram_url;
      if (params.youtube_url) DB.web_settings.youtube_url = params.youtube_url;
      if (params.footer_bg_url) DB.web_settings.footer_bg_url = params.footer_bg_url;

      return { success: true, message: 'Profil yayasan berhasil diperbarui', data: DB.school_profile };
    }
  }

  // 22. WEB SETTINGS & CMS (cms_setting.html)
  if (module === 'web_settings' || module === 'settings') {
    const DEFAULT_SETTINGS = {
      id: 'SET-001',
      school_name: 'YAYASAN AT TARBIYYAH WIJAYA KUSUMA SAMARINDA',
      tagline: 'Membina Generasi Qurani, Berakhlak Mulia & Berprestasi',
      header_title: 'Sistem Informasi Akademik & Portal Yayasan At Tarbiyyah Wijaya Kusuma Samarinda',
      footer_bg_url: '/images/school-campus.jpg',
      login_bg_url: '/images/school-campus.jpg',
      announcement_banner: 'Penerimaan Peserta Didik Baru (PPDB) 2026/2027 Resmi Dibuka!',
      whatsapp_official: '081347142829',
      whatsapp: '081347142829',
      contact_email: 'info@attarbiyyah-samarinda.sch.id',
      email: 'info@attarbiyyah-samarinda.sch.id',
      phone: '081347142829',
      address: 'Jl. Wijaya Kusuma V-A No. 38, Kel. Air Putih, Kec. Samarinda Ulu Kota Samarinda, Kalimantan Timur, Kode Pos: 75124',
      campus_note: 'Kampus Utama Air Putih, Samarinda Ulu',
      maps_url: 'https://maps.google.com/?q=Jl.+Wijaya+Kusuma+V-A+No.+38,+Air+Putih,+Samarinda+Ulu,+Kota+Samarinda,+Kalimantan+Timur+75124',
      maps_embed_url: 'https://maps.google.com/maps?q=Jl.+Wijaya+Kusuma+V-A+No.+38,+Air+Putih,+Samarinda+Ulu,+Kota+Samarinda,+Kalimantan+Timur+75124&t=&z=16&ie=UTF8&iwloc=&output=embed',
      academic_year: '2026/2027',
      instagram_url: 'https://instagram.com/yayasansamarinda',
      youtube_url: 'https://youtube.com/@yayasansamarinda',
      facebook_url: 'https://facebook.com/yayasansamarinda',
      hero_images: [
        { url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1600&auto=format&fit=crop', caption: 'Suasana Belajar Ceria Santri PAUD & TK' },
        { url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1600&auto=format&fit=crop', caption: 'Pendidikan Karakter & Hafalan Qur\'an Sejak Dini' },
        { url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1600&auto=format&fit=crop', caption: 'Fasilitas Belajar & Lingkungan Islami Nyaman' }
      ]
    };

    if (action === 'get' || !action) {
      const merged = Object.assign({}, DEFAULT_SETTINGS, DB.web_settings || {});
      return { success: true, data: merged };
    }
    if (action === 'update') {
      const deny = rbacDeny(params, ['super_admin', 'admin_tu']);
      if (deny) return deny;
      if (!DB.web_settings) DB.web_settings = Object.assign({}, DEFAULT_SETTINGS);
      Object.assign(DB.web_settings, params);

      // Auto-sync ke DB.school_profile
      if (!DB.school_profile) DB.school_profile = {};
      if (params.school_name) DB.school_profile.name = params.school_name;
      if (params.address) DB.school_profile.address = params.address;
      if (params.campus_note) DB.school_profile.campus_note = params.campus_note;
      if (params.maps_url) DB.school_profile.maps_url = params.maps_url;
      if (params.maps_embed_url) DB.school_profile.maps_embed_url = params.maps_embed_url;
      if (params.phone) DB.school_profile.phone = params.phone;
      if (params.email) DB.school_profile.email = params.email;
      if (params.whatsapp) DB.school_profile.whatsapp_number = params.whatsapp;
      if (params.facebook_url) DB.school_profile.facebook_url = params.facebook_url;
      if (params.instagram_url) DB.school_profile.instagram_url = params.instagram_url;
      if (params.youtube_url) DB.school_profile.youtube_url = params.youtube_url;
      if (params.footer_bg_url) DB.school_profile.footer_bg_url = params.footer_bg_url;

      return { success: true, message: 'Pengaturan website berhasil disimpan', data: DB.web_settings };
    }
  }

  // 23. CONTENT ALIAS (news, announcements, events, galleries)
  if (module === 'content') {
    const targetKey = { news: 'news', announcements: 'announcements', events: 'events', galleries: 'galleries', gallery: 'galleries' }[action] || 'news';
    const items = DB[targetKey] || [];
    return { success: true, data: { items, total: items.length } };
  }

  // Default fallback: JANGAN return sukses silently — ini menyembunyikan bug.
  return { success: false, message: 'Endpoint tidak dikenali: ' + module + '/' + action, error: { code: 'NOT_IMPLEMENTED', module, action } };
}

function lookupToken(token) {
  if (!token) return null;
  const t = String(token).trim();
  if (SESSIONS.has(t)) return SESSIONS.get(t);

  // Format TOKEN-SISWA-{nis}-{timestamp}
  if (t.startsWith('TOKEN-SISWA-')) {
    const parts = t.split('-');
    const nis = parts[2];
    const student = DB.students.find(s => s.nis === nis || s.id === nis) || DB.students[0];
    if (student) {
      const u = {
        id: 'USR-' + student.nis,
        name: student.full_name || student.name,
        full_name: student.full_name || student.name,
        email: student.parent_email || `${student.nis}@siswa.yayasan.sch.id`,
        role: 'siswa_aktif',
        role_label: 'Siswa Aktif',
        student_id: student.id,
        nis: student.nis,
        class_id: student.class_id,
        class_name: student.class_name
      };
      SESSIONS.set(t, u);
      return u;
    }
  }

  // Format TOKEN-{ROLE}-{timestamp}
  if (t.startsWith('TOKEN-')) {
    const parts = t.split('-');
    const roleCode = (parts[1] || '').toLowerCase();
    const matched = DB.users.find(u => (u.role || '').toLowerCase() === roleCode);
    if (matched) {
      SESSIONS.set(t, matched);
      return matched;
    }
  }

  // Format siy_{userId}_{timestamp}
  if (t.startsWith('siy_')) {
    const parts = t.split('_');
    const userId = parts[1];
    let matched = DB.users.find(u => u.id === userId || u.email === userId);
    if (!matched) {
      const student = DB.students.find(s => s.id === userId || s.nis === userId);
      if (student) {
        matched = {
          id: 'USR-' + student.nis,
          name: student.full_name || student.name,
          full_name: student.full_name || student.name,
          email: student.parent_email || `${student.nis}@siswa.yayasan.sch.id`,
          role: 'siswa_aktif',
          student_id: student.id,
          nis: student.nis
        };
      }
    }
    if (matched) {
      SESSIONS.set(t, matched);
      return matched;
    }
  }

  // Fallbacks by role keywords
  const tLow = t.toLowerCase();
  if (tLow.includes('admin')) {
    return DB.users[0];
  }
  if (tLow.includes('guru') || tLow.includes('teacher')) {
    return DB.users[2];
  }
  if (tLow.includes('ortu') || tLow.includes('parent')) {
    return DB.users[3];
  }
  if (tLow.includes('siswa') || tLow.includes('student')) {
    const s = DB.students[0];
    return {
      id: 'USR-' + s.nis,
      name: s.full_name || s.name,
      full_name: s.full_name || s.name,
      email: s.parent_email,
      role: 'siswa_aktif',
      student_id: s.id,
      nis: s.nis
    };
  }

  return null;
}

module.exports = {
  handleApiRequest,
  DB,
  SESSIONS,
  lookupToken
};
