/**
 * Seed Data Generator for SIYAYASAN V2
 * Menyediakan data realistik yang selaras antara:
 * - Halaman Publik (Website Utama): 250+ Siswa Aktif, 24 Tenaga Pendidik, 12 Rombongan Belajar
 * - Portal Admin & Siswa: 24 Tenaga Pendidik, 12 Kelas Rombel, 250 Siswa Aktif
 */

function generateSeedData() {
  const TEACHER_PROFILES = [
    { name: 'Ustadz Ahmad Dahlan, S.Pd.I.', nip: '198503152010011001', spec: 'Wali Kelas PAUD A1 & Koordinator Kurikulum Islam', phone: '081234567801', gender: 'L', email: 'guru@yayasan.sch.id' },
    { name: 'Ustadzah Siti Fatimah, S.Pd.', nip: '198807202012022002', spec: 'Guru Sentra Balok & Kreativitas PAUD', phone: '081234567802', gender: 'P', email: 'siti.fatimah@yayasan.sch.id' },
    { name: 'Ustadzah Nurul Hidayah, S.Pd.Aud.', nip: '199004122014022003', spec: 'Wali Kelas PAUD A2 (Bintang Kejora)', phone: '081234567803', gender: 'P', email: 'nurul.hidayah@yayasan.sch.id' },
    { name: 'Ustadz Muhammad Yusuf, Lc.', nip: '198711052011011004', spec: 'Guru Bahasa Arab & Hadits Cilik', phone: '081234567804', gender: 'L', email: 'muhammad.yusuf@yayasan.sch.id' },
    { name: 'Ustadzah Rina Astuti, S.Pd.', nip: '199201182015022005', spec: 'Wali Kelas PAUD B1 (Bulan Sabit)', phone: '081234567805', gender: 'P', email: 'rina.astuti@yayasan.sch.id' },
    { name: 'Ustadzah Dewi Kartika, S.Pd.', nip: '199308222016022006', spec: 'Guru Sentra Seni, Musik & Prakarya', phone: '081234567806', gender: 'P', email: 'dewi.kartika@yayasan.sch.id' },
    { name: 'Ustadzah Aisyah Rahmawati, S.Pd.I.', nip: '199105302014022007', spec: 'Wali Kelas PAUD B2 (Bulan Purnama)', phone: '081234567807', gender: 'P', email: 'aisyah.rahmawati@yayasan.sch.id' },
    { name: 'Ustadz Hasan Basri, S.Pd.I.', nip: '198609142010011008', spec: 'Guru Sentra Ibadah, Fiqih Cilik & Doa Harian', phone: '081234567808', gender: 'L', email: 'hasan.basri@yayasan.sch.id' },
    { name: 'Ustadz Faisal Ramadhan, S.Pd.', nip: '198906102013011009', spec: 'Wali Kelas TPQ Jilid 1 (Al-Fatihah)', phone: '081234567809', gender: 'L', email: 'faisal.ramadhan@yayasan.sch.id' },
    { name: 'Ustadzah Maryam Ulfah, S.Ag.', nip: '199002252014022010', spec: 'Guru Makharijul Huruf & Metode Yanbu\'a', phone: '081234567810', gender: 'P', email: 'maryam.ulfah@yayasan.sch.id' },
    { name: 'Ustadz Ridwan Kamil, S.Pd.I.', nip: '198803172012011011', spec: 'Wali Kelas TPQ Jilid 2 (Al-Baqarah)', phone: '081234567811', gender: 'L', email: 'ridwan.kamil@yayasan.sch.id' },
    { name: 'Ustadzah Annisa Fitriani, S.Pd.', nip: '199411082017022012', spec: 'Guru Tajwid Dasar & Adab Islami', phone: '081234567812', gender: 'P', email: 'annisa.fitriani@yayasan.sch.id' },
    { name: 'Ustadz Zulkifli Hasan, S.Pd.', nip: '198712012011011013', spec: 'Wali Kelas TPQ Jilid 3 (Ali Imran)', phone: '081234567813', gender: 'L', email: 'zulkifli.hasan@yayasan.sch.id' },
    { name: 'Ustadzah Zahra Maharani, S.Hum.', nip: '199506142018022014', spec: 'Guru Sejarah & Kisah 25 Nabi', phone: '081234567814', gender: 'P', email: 'zahra.maharani@yayasan.sch.id' },
    { name: 'Ustadz Lukman Hakim, S.Pd.I.', nip: '198904282013011015', spec: 'Wali Kelas TPQ Jilid 4 (An-Nisa)', phone: '081234567815', gender: 'L', email: 'lukman.hakim@yayasan.sch.id' },
    { name: 'Ustadzah Khadijah Azzahra, S.Pd.Aud.', nip: '199309192016022016', spec: 'Guru Motorik Halus & Bahan Alam', phone: '081234567816', gender: 'P', email: 'khadijah.azzahra@yayasan.sch.id' },
    { name: 'Ustadz Abdurrahman Wahid, S.Ag.', nip: '198601202010011017', spec: 'Wali Kelas TPQ Jilid 5 (Al-Ma\'idah)', phone: '081234567817', gender: 'L', email: 'abdurrahman.wahid@yayasan.sch.id' },
    { name: 'Ustadzah Fatmawati, S.Pd.', nip: '199207032015022018', spec: 'Guru Imla & Khath Kaligrafi Santri', phone: '081234567818', gender: 'P', email: 'fatmawati@yayasan.sch.id' },
    { name: 'Ustadz M. Rizky Pratama, S.Pd.', nip: '199010152014011019', spec: 'Wali Kelas TPQ Jilid 6 (Al-An\'am)', phone: '081234567819', gender: 'L', email: 'm.rizky.pratama@yayasan.sch.id' },
    { name: 'Ustadzah Fitri Handayani, S.Pd.I.', nip: '199103282014022020', spec: 'Guru Nagham & Irama Murottal Qur\'an', phone: '081234567820', gender: 'P', email: 'fitri.handayani@yayasan.sch.id' },
    { name: 'Ustadz Hendra Gunawan, S.Kom., S.Pd.', nip: '198808122012011021', spec: 'Wali Kelas Al-Qur\'an & Terjemah', phone: '081234567821', gender: 'L', email: 'hendra.gunawan@yayasan.sch.id' },
    { name: 'Ustadzah Nurlaila Sari, S.Pd.', nip: '199304052016022022', spec: 'Guru Tadabbur Ayat & Aqidah Akhlak', phone: '081234567822', gender: 'P', email: 'nurlaila.sari@yayasan.sch.id' },
    { name: 'Ustadz Syarif Hidayatullah, Al-Hafidz', nip: '198705162011011023', spec: 'Wali Kelas Tahfidz Cilik Juz 30', phone: '081234567823', gender: 'L', email: 'syarif.hidayatullah@yayasan.sch.id' },
    { name: 'Ustadzah Nur Halimah, Al-Hafidzah', nip: '199402112017022024', spec: 'Pembina Tahfidz & Tasmi\' Putri', phone: '081234567824', gender: 'P', email: 'nur.halimah@yayasan.sch.id' }
  ];

  const teachers = TEACHER_PROFILES.map((p, idx) => {
    const seq = String(idx + 1).padStart(3, '0');
    return {
      id: `TEA-${seq}`,
      user_id: `USR-${String(idx + 3).padStart(3, '0')}`,
      full_name: p.name,
      name: p.name,
      nip: p.nip,
      email: p.email,
      phone: p.phone,
      specialization: p.spec,
      is_active: true,
      status: 'active',
      start_date: '2022-07-15',
      joined_at: '2022-07-15'
    };
  });

  const teacherUsers = teachers.map(t => ({
    id: t.user_id,
    name: t.full_name,
    full_name: t.full_name,
    email: t.email,
    password: 'guru' + t.id.replace('TEA-', ''),
    role: 'guru',
    role_label: 'Guru / Pendidik',
    teacher_id: t.id,
    status: 'active',
    phone: t.phone,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
  }));
  teacherUsers[0].password = 'guru123'; // Akun guru utama tetap guru123

  const classes = [
    { id: 'CLS-001', name: 'PAUD A1 - Bintang Kecil', level: 'PAUD', teacher_id: 'TEA-001', teacher_name: 'Ustadz Ahmad Dahlan, S.Pd.I.', grade_level: 'PAUD A', capacity: 25, academic_year: '2026/2027' },
    { id: 'CLS-002', name: 'PAUD A2 - Bintang Kejora', level: 'PAUD', teacher_id: 'TEA-003', teacher_name: 'Ustadzah Nurul Hidayah, S.Pd.Aud.', grade_level: 'PAUD A', capacity: 25, academic_year: '2026/2027' },
    { id: 'CLS-003', name: 'PAUD B1 - Bulan Sabit', level: 'PAUD', teacher_id: 'TEA-005', teacher_name: 'Ustadzah Rina Astuti, S.Pd.', grade_level: 'PAUD B', capacity: 25, academic_year: '2026/2027' },
    { id: 'CLS-004', name: 'PAUD B2 - Bulan Purnama', level: 'PAUD', teacher_id: 'TEA-007', teacher_name: 'Ustadzah Aisyah Rahmawati, S.Pd.I.', grade_level: 'PAUD B', capacity: 25, academic_year: '2026/2027' },
    { id: 'CLS-005', name: 'TPQ Jilid 1 - Al-Fatihah', level: 'TPQ', teacher_id: 'TEA-009', teacher_name: 'Ustadz Faisal Ramadhan, S.Pd.', grade_level: 'TPQ 1', capacity: 25, academic_year: '2026/2027' },
    { id: 'CLS-006', name: 'TPQ Jilid 2 - Al-Baqarah', level: 'TPQ', teacher_id: 'TEA-011', teacher_name: 'Ustadz Ridwan Kamil, S.Pd.I.', grade_level: 'TPQ 2', capacity: 25, academic_year: '2026/2027' },
    { id: 'CLS-007', name: 'TPQ Jilid 3 - Ali Imran', level: 'TPQ', teacher_id: 'TEA-013', teacher_name: 'Ustadz Zulkifli Hasan, S.Pd.', grade_level: 'TPQ 3', capacity: 25, academic_year: '2026/2027' },
    { id: 'CLS-008', name: 'TPQ Jilid 4 - An-Nisa', level: 'TPQ', teacher_id: 'TEA-015', teacher_name: 'Ustadz Lukman Hakim, S.Pd.I.', grade_level: 'TPQ 4', capacity: 25, academic_year: '2026/2027' },
    { id: 'CLS-009', name: 'TPQ Jilid 5 - Al-Ma\'idah', level: 'TPQ', teacher_id: 'TEA-017', teacher_name: 'Ustadz Abdurrahman Wahid, S.Ag.', grade_level: 'TPQ 5', capacity: 25, academic_year: '2026/2027' },
    { id: 'CLS-010', name: 'TPQ Jilid 6 - Al-An\'am', level: 'TPQ', teacher_id: 'TEA-019', teacher_name: 'Ustadz M. Rizky Pratama, S.Pd.', grade_level: 'TPQ 6', capacity: 25, academic_year: '2026/2027' },
    { id: 'CLS-011', name: 'Kelas Al-Qur\'an & Terjemah', level: 'TPQ', teacher_id: 'TEA-021', teacher_name: 'Ustadz Hendra Gunawan, S.Kom., S.Pd.', grade_level: 'Lanjutan', capacity: 25, academic_year: '2026/2027' },
    { id: 'CLS-012', name: 'Kelas Tahfidz Cilik Juz 30', level: 'TPQ', teacher_id: 'TEA-023', teacher_name: 'Ustadz Syarif Hidayatullah, Al-Hafidz', grade_level: 'Tahfidz', capacity: 25, academic_year: '2026/2027' }
  ];

  const FIRST_NAMES_L = [
    'Ahmad', 'Muhammad', 'Bilal', 'Fauzan', 'Rayhan', 'Zidan', 'Farhan', 'Arsyad', 'Kenzo', 'Rafa',
    'Dimas', 'Arya', 'Fikri', 'Ilham', 'Hafiz', 'Alif', 'Fadhil', 'Ihsan', 'Naufal', 'Reza',
    'Azka', 'Gibran', 'Daffa', 'Malik', 'Hasan', 'Husain', 'Hamzah', 'Tariq', 'Zubair', 'Sulaiman'
  ];
  const FIRST_NAMES_P = [
    'Zahra', 'Siti', 'Aisyah', 'Naura', 'Yasmin', 'Sabrina', 'Amelia', 'Fatimah', 'Salma', 'Aqila',
    'Nabila', 'Kayla', 'Alisha', 'Safira', 'Nayla', 'Khadijah', 'Maryam', 'Rania', 'Hana', 'Syifa',
    'Alya', 'Talita', 'Adiba', 'Afifah', 'Shakira', 'Nasywa', 'Zulfa', 'Kamila', 'Haura', 'Fairuz'
  ];
  const LAST_NAMES = [
    'Pratama', 'Nugraha', 'Saputra', 'Ramadhan', 'Hidayat', 'Kurniawan', 'Santoso', 'Wijaya', 'Gunawan', 'Al-Ghifari',
    'Hakim', 'Firmansyah', 'Putra', 'Putri', 'Lestari', 'Rahmawati', 'Anggraini', 'Permata', 'Kusuma', 'Maharani',
    'Setiawan', 'Syahputra', 'Wibowo', 'Mahendra', 'Utomo', 'Siregar', 'Harahap', 'Nasution', 'Batubara', 'Lubis'
  ];
  const PARENT_NAMES = [
    'Bapak Muhammad Fauzi', 'Ibu Rahmawati', 'Bapak Hendra Gunawan', 'Bapak Budi Santoso', 'Ibu Dewi Sartika',
    'Bapak Agus Setiawan', 'Ibu Sri Wahyuni', 'Bapak Bambang Sutrisno', 'Ibu Siti Aminah', 'Bapak Rudi Hartono',
    'Bapak Eko Prasetyo', 'Ibu Endang Sulistyo', 'Bapak Joko Widodo', 'Ibu Tri Astuti', 'Bapak Dedi Supriyadi',
    'Bapak Slamet Riyadi', 'Ibu Nurhayati', 'Bapak Heri Purwanto', 'Ibu Yuliana', 'Bapak Dani Iskandar'
  ];

  const students = [];

  // Siswa 1-3 (Preserve existing testing credentials & logins)
  students.push({
    id: 'STU-001',
    nis: '2026001',
    nisn: '0012345678',
    full_name: 'Ahmad Fauzan Pratama',
    name: 'Ahmad Fauzan Pratama',
    child_name: 'Ahmad Fauzan Pratama',
    nickname: 'Fauzan',
    gender: 'L',
    class_id: 'CLS-001',
    class_name: 'PAUD A1 - Bintang Kecil',
    parent_id: 'PAR-001',
    parent_name: 'Bapak Muhammad Fauzi',
    parent_email: 'ortu@yayasan.sch.id',
    birth_place: 'Samarinda',
    birth_date: '2020-03-12',
    status: 'active',
    status_kenaikan: 'Aktif',
    attendance_pct: 95,
    created_at: '2026-01-10T08:00:00.000Z'
  });

  students.push({
    id: 'STU-002',
    nis: '2026002',
    nisn: '0012345679',
    full_name: 'Siti Nur Aisyah',
    name: 'Siti Nur Aisyah',
    child_name: 'Siti Nur Aisyah',
    nickname: 'Aisyah',
    gender: 'P',
    class_id: 'CLS-001',
    class_name: 'PAUD A1 - Bintang Kecil',
    parent_id: 'PAR-002',
    parent_name: 'Ibu Rahmawati',
    parent_email: 'rahma@gmail.com',
    birth_place: 'Samarinda',
    birth_date: '2020-07-25',
    status: 'active',
    status_kenaikan: 'Aktif',
    attendance_pct: 92,
    created_at: '2026-01-10T08:15:00.000Z'
  });

  students.push({
    id: 'STU-003',
    nis: '2026003',
    nisn: '0012345680',
    full_name: 'Muhammad Bilal Al-Ghifari',
    name: 'Muhammad Bilal Al-Ghifari',
    child_name: 'Muhammad Bilal Al-Ghifari',
    nickname: 'Bilal',
    gender: 'L',
    class_id: 'CLS-001',
    class_name: 'PAUD A1 - Bintang Kecil',
    parent_id: 'PAR-003',
    parent_name: 'Bapak Hendra Gunawan',
    parent_email: 'hendra.gunawan@gmail.com',
    birth_place: 'Samarinda',
    birth_date: '2020-01-18',
    status: 'active',
    status_kenaikan: 'Aktif',
    attendance_pct: 88,
    created_at: '2026-01-10T08:30:00.000Z'
  });

  // Distribusi kelas: 10 kelas x 21 siswa (210) + 2 kelas x 20 siswa (40) = Total 250 siswa
  const classTargets = [
    { id: 'CLS-001', count: 21 },
    { id: 'CLS-002', count: 21 },
    { id: 'CLS-003', count: 21 },
    { id: 'CLS-004', count: 21 },
    { id: 'CLS-005', count: 21 },
    { id: 'CLS-006', count: 21 },
    { id: 'CLS-007', count: 21 },
    { id: 'CLS-008', count: 21 },
    { id: 'CLS-009', count: 21 },
    { id: 'CLS-010', count: 21 },
    { id: 'CLS-011', count: 20 },
    { id: 'CLS-012', count: 20 }
  ];

  let currentStudentSeq = 4;

  classTargets.forEach(ct => {
    const clsObj = classes.find(c => c.id === ct.id);
    const existingInClass = students.filter(s => s.class_id === ct.id).length;
    const toAdd = ct.count - existingInClass;

    for (let i = 0; i < toAdd; i++) {
      const isBoy = (currentStudentSeq % 2 === 1);
      const fnPool = isBoy ? FIRST_NAMES_L : FIRST_NAMES_P;
      const fn = fnPool[(currentStudentSeq + i * 3) % fnPool.length];
      const ln = LAST_NAMES[(currentStudentSeq * 7 + i * 5) % LAST_NAMES.length];
      const fullName = `${fn} ${ln}`;
      const nisStr = '2026' + String(currentStudentSeq).padStart(3, '0');
      const birthYear = (clsObj.level === 'PAUD') ? 2020 + (currentStudentSeq % 2) : 2018 + (currentStudentSeq % 3);
      const birthMonth = String(1 + ((currentStudentSeq * 3) % 12)).padStart(2, '0');
      const birthDay = String(1 + ((currentStudentSeq * 7) % 28)).padStart(2, '0');
      const birthDate = `${birthYear}-${birthMonth}-${birthDay}`;

      const parentName = PARENT_NAMES[(currentStudentSeq) % PARENT_NAMES.length];
      const parentId = `PAR-${String(1 + (currentStudentSeq % 50)).padStart(3, '0')}`;

      students.push({
        id: `STU-${String(currentStudentSeq).padStart(3, '0')}`,
        nis: nisStr,
        nisn: `001234${String(currentStudentSeq).padStart(4, '0')}`,
        full_name: fullName,
        name: fullName,
        child_name: fullName,
        nickname: fn,
        gender: isBoy ? 'L' : 'P',
        class_id: clsObj.id,
        class_name: clsObj.name,
        parent_id: parentId,
        parent_name: parentName,
        parent_email: `wali.${nisStr}@yayasan.sch.id`,
        birth_place: 'Samarinda',
        birth_date: birthDate,
        status: 'active',
        status_kenaikan: 'Aktif',
        attendance_pct: 88 + (currentStudentSeq % 12),
        created_at: new Date(1705000000000 + currentStudentSeq * 3600000).toISOString()
      });

      currentStudentSeq++;
    }
  });

  // Sinkronkan student_count pada objek kelas
  classes.forEach(c => {
    c.student_count = students.filter(s => s.class_id === c.id).length;
  });

  return {
    teachers,
    teacherUsers,
    classes,
    students
  };
}

module.exports = { generateSeedData };
