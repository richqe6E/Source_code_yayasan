/**
 * SIYAYASAN Smart Q/A Assistant — Knowledge Base & Rule-Based NLP Engine
 * 100% Client-Side Engine: Zero External AI API, Zero Token Cost, Zero Data Leak.
 * 
 * Architecture:
 * - Text Normalization & Slang Dictionary (Bahasa Indonesia)
 * - Out-of-Scope Rule Validator (Strict Guardrail)
 * - Weighted Keyword & Phrase Matcher (Intent Recognition)
 * - Dynamic Data Hydration (Tahun Ajaran, Jadwal PPDB, Kontak Yayasan)
 * - Interactive 11-Step PPDB Guide Dataset
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SiyQaEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // =========================================================================
  // 1. DATA DINAMIS (HYDRATION DARI LOCALSTORAGE / SESSIONSTORAGE JIKA ADA)
  // =========================================================================
  function getDynamicContext() {
    let schoolName = 'Yayasan At Tarbiyyah Wijaya Kusuma Samarinda';
    let address = 'Jl. Wijaya Kusuma V-A No. 38, Kel. Air Putih, Kec. Samarinda Ulu, Kota Samarinda, Kalimantan Timur 75124';
    let phone = '081347142829';
    let waPhone = '6281347142829';
    let email = 'info@attarbiyyah-samarinda.sch.id';
    let headmaster = 'Makhrus';
    let activeYear = '2026/2027';
    let ppdbPeriodName = 'PPDB TA 2026/2027';
    let regDates = 'Gelombang pendaftaran resmi dibuka';
    let mapsUrl = 'https://maps.google.com/?q=Yayasan+At+Tarbiyyah+Wijaya+Kusuma+Samarinda';

    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const cached = window.sessionStorage.getItem('siyayasan_school_profile');
        if (cached) {
          const s = JSON.parse(cached);
          if (s.school_name) schoolName = s.school_name;
          if (s.address) address = s.address;
          if (s.phone) phone = s.phone;
          if (s.email) email = s.email;
          if (s.headmaster_name) headmaster = s.headmaster_name;
          const rawWa = s.whatsapp_number || s.whatsapp || phone;
          if (rawWa) {
            const clean = rawWa.replace(/\D/g, '');
            waPhone = clean.startsWith('0') ? ('62' + clean.slice(1)) : (clean.startsWith('62') ? clean : ('62' + clean));
          }
        }
      }
    } catch (_) {}

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const pRaw = window.localStorage.getItem('siy_ppdb_period_cache');
        if (pRaw) {
          const p = JSON.parse(pRaw);
          if (p.academic_year) activeYear = p.academic_year;
          if (p.name) ppdbPeriodName = p.name;
          if (p.online_registration_dates) regDates = p.online_registration_dates;
        }
      }
    } catch (_) {}

    const waHelpUrl = `https://wa.me/${waPhone}?text=` + encodeURIComponent("Assalamu'alaikum Admin Yayasan At Tarbiyyah, saya ingin bertanya informasi lebih lanjut.");

    return {
      schoolName,
      address,
      phone,
      waPhone,
      email,
      headmaster,
      activeYear,
      ppdbPeriodName,
      regDates,
      mapsUrl,
      waHelpUrl
    };
  }

  // =========================================================================
  // 2. STOPWORDS & KAMUS SLANG / NORMALISASI BAHASA INDONESIA
  // =========================================================================
  const STOPWORDS = new Set([
    'apakah', 'bagaimanakah', 'bagaimana', 'apa', 'apaan', 'dimanakah', 'dimana', 'kemanakah',
    'kemana', 'kapan', 'kapankah', 'kenapakah', 'kenapa', 'mengapa', 'mengapakah', 'siapakah',
    'siapa', 'berapa', 'berapakah', 'dan', 'atau', 'yang', 'ini', 'itu', 'adalah', 'yaitu',
    'dari', 'pada', 'ke', 'di', 'untuk', 'dengan', 'secara', 'atas', 'oleh', 'bagi', 'terhadap',
    'saya', 'kami', 'kita', 'anda', 'kamu', 'ingin', 'mau', 'pengen', 'bisa', 'dapat', 'tolong',
    'mohon', 'tanya', 'info', 'informasi', 'ada', 'tidak', 'nggak', 'gak', 'bukan', 'pun',
    'lagi', 'saja', 'hanya', 'tentang', 'mengenai', 'seputar', 'dong', 'sih', 'deh', 'ya', 'kah'
  ]);

  const SLANG_MAP = {
    'gimana': 'bagaimana',
    'bgmn': 'bagaimana',
    'bgaimana': 'bagaimana',
    'gmn': 'bagaimana',
    'kmn': 'kemana',
    'dmn': 'dimana',
    'kpn': 'kapan',
    'knp': 'kenapa',
    'brapa': 'berapa',
    'brp': 'berapa',
    'sy': 'saya',
    'aq': 'saya',
    'aku': 'saya',
    'gw': 'saya',
    'gua': 'saya',
    'mo': 'mau',
    'pngen': 'mau',
    'daptar': 'daftar',
    'dftr': 'daftar',
    'regis': 'daftar',
    'registrasi': 'daftar',
    'pendaftaran': 'daftar',
    'mendaftar': 'daftar',
    'daftarin': 'daftar',
    'skolah': 'sekolah',
    'sklh': 'sekolah',
    'yysn': 'yayasan',
    'almt': 'alamat',
    'lokasi': 'alamat',
    'tmpat': 'alamat',
    'posisi': 'alamat',
    'biaya': 'spp',
    'bayar': 'spp',
    'tarif': 'spp',
    'ongkos': 'spp',
    'uang': 'spp',
    'iuran': 'spp',
    'pembayaran': 'spp',
    'dokumen': 'berkas',
    'persyaratan': 'berkas',
    'syarat': 'berkas',
    'file': 'berkas',
    'surat': 'berkas',
    'foto': 'pasfoto',
    'pasfoto': 'pasfoto',
    'poto': 'pasfoto',
    'lulus': 'diterima',
    'lolos': 'diterima',
    'keterima': 'diterima',
    'hasil': 'diterima',
    'seleksi': 'diterima',
    'pengumuman': 'diterima',
    'status': 'diterima',
    'kontak': 'hubungi',
    'wa': 'hubungi',
    'whatsapp': 'hubungi',
    'telp': 'hubungi',
    'telepon': 'hubungi',
    'nomer': 'hubungi',
    'nomor': 'hubungi',
    'libur': 'jadwal',
    'masuk': 'jadwal',
    'waktu': 'jadwal',
    'jam': 'jadwal',
    'hari': 'jadwal',
    'kalender': 'agenda',
    'kegiatan': 'agenda',
    'acara': 'agenda',
    'jurusan': 'program',
    'jenjang': 'program',
    'prodi': 'program',
    'kelas': 'program'
  };

  // =========================================================================
  // 3. ATURAN PENGAWASAN RUANG LINGKUP (OUT-OF-SCOPE FORBIDDEN PATTERNS)
  // =========================================================================
  // Pertanyaan di luar topik resmi yayasan WAJIB dijawab persis:
  // "Saya tidak bisa menjawab pertanyaan Anda."
  const OUT_OF_SCOPE_REGEX = /\b(politik|pemilu|pilpres|pilkada|capres|cawapres|caleg|partai|dpr|mpr|presiden|menteri|pemerintah\s+daerah|perang|militer|senjata|rusia|ukraina|israel|palestina|coding|programmer|programming|python|javascript|typescript|react|vue|angular|html|css|php|laravel|java|c\+\+|sql|database\s+admin|hack|cheat|game|gaming|dota|mobile\s+legends|free\s+fire|pubg|roblox|genshin|gta|steam|film|movie|bioskop|cinema|aktor|aktris|artis|selebriti|sinetron|netflix|anime|manga|zodiak|horoskop|ramalan|tarot|cuaca|prakiraan\s+cuaca|hujan\s+hari\s+ini|gempa|tsunami|resep|bumbu|memasak|goreng|rebus|masakan|kuliner|restoran|kafe|cafe|kopi|coffee|crypto|bitcoin|ethereum|forex|saham|investasi\s+bodong|pinjol|pinjaman\s+online|judi|slot|casino|togel|pacaran|selingkuh|curhat|jodoh|kalkulus|integral|turunan|sin\s+cos\s+tan|aljabar\s+vektor)\b/i;

  // Keyword umum yang menandakan konteks sekolah/yayasan
  const IN_SCOPE_ANCHOR_REGEX = /\b(yayasan|sekolah|paud|tpq|santri|siswa|ananda|ppdb|daftar|pendaftaran|guru|ustadz|ustadzah|tu|tata\s+usaha|spp|ijazah|rapor|juanda|wijaya\s+kusuma|air\s+putih|samarinda|ulinnuha|qiraati|tahfidz|ptpt|pra\s+ptpt|surah|nis|nomor\s+induk|portal\s+siswa)\b/i;

  // =========================================================================
  // 4. DATA PANDUAN PPDB INTERAKTIF 11 TAHAPAN
  // =========================================================================
  const PPDB_11_STEPS = [
    {
      step: 1,
      title: 'Mengenal Informasi & Program Pendidikan',
      summary: 'Pahami profil TPQ Ulinnuha (Metode Qiraati & Tahfidz) dan KB Ulinnuha (PAUD & PKBM).',
      detail: 'Calon santri/orang tua dapat mempelajari kurikulum unggulan "Hafal Al-Qur\'an di Bawah Usia 9 Tahun (Hafal Tanpa Menghafal)", pembiasaan adab Islami harian, dan pendidikan usia dini di halaman Profil.',
      actionUrl: 'profil.html',
      actionLabel: 'Pelajari Program Pendidikan'
    },
    {
      step: 2,
      title: 'Memahami Persyaratan Pendaftaran',
      summary: 'Siapkan Pasfoto Formal ananda, scan Akta Kelahiran, dan Kartu Keluarga (KK).',
      detail: 'Dokumen disiapkan dalam format JPG, PNG, atau PDF dengan ukuran maksimal 5 MB. Pastikan foto tegak lurus, pencahayaan terang, dan teks nama/NIK terbaca dengan jelas.',
      actionUrl: 'ppdb.html#jadwal-linimasa',
      actionLabel: 'Lihat Ketentuan Berkas'
    },
    {
      step: 3,
      title: 'Membuka Halaman Formulir PPDB Online',
      summary: 'Kunjungi halaman PPDB website resmi SIYAYASAN pada menu Pendaftaran Santri Baru.',
      detail: 'Pastikan status gelombang pendaftaran aktif. Di halaman ini tersedia formulir online multi-tahap (Tahap 1 s.d. 5) dan linimasa jadwal penting PPDB.',
      actionUrl: 'ppdb.html#formulir-pendaftaran',
      actionLabel: 'Buka Halaman PPDB'
    },
    {
      step: 4,
      title: 'Mengisi Formulir Pendaftaran',
      summary: 'Lengkapi Data Santri (A), Data Orang Tua / Wali (B), dan Riwayat Pendidikan (C).',
      detail: 'Isi identitas ananda seperti Nama Lengkap, NIK, Tempat/Tanggal Lahir, Jenis Kelamin, Alamat Domisili, serta Kontak Orang Tua (WhatsApp) yang aktif.',
      actionUrl: 'ppdb.html#formulir-pendaftaran',
      actionLabel: 'Mulai Isi Formulir'
    },
    {
      step: 5,
      title: 'Mengunggah Dokumen yang Diperlukan',
      summary: 'Unggah Pasfoto Formal (wajib), Akta Kelahiran, dan Kartu Keluarga pada Tahap 4.',
      detail: 'Sistem web SIYAYASAN dilengkapi kompresi otomatis agar upload berjalan cepat dan ringan. Jika terkendala berkas digital, fotokopi fisik dapat diserahkan saat verifikasi di yayasan.',
      actionUrl: 'ppdb.html#jadwal-linimasa',
      actionLabel: 'Panduan Unggah Berkas'
    },
    {
      step: 6,
      title: 'Mengirim Formulir & Mencetak Bukti Registrasi',
      summary: 'Periksa kembali tinjauan formulir pada Tahap 5, lalu tekan tombol Kirim Pendaftaran.',
      detail: 'Setelah berhasil terkirim, sistem otomatis menerbitkan Lembar Bukti Pendaftaran resmi dengan Nomor Registrasi unik (misal: REG-2026-XXXX). Simpan atau cetak lembar ini.',
      actionUrl: 'ppdb.html#formulir-pendaftaran',
      actionLabel: 'Kirim Pendaftaran'
    },
    {
      step: 7,
      title: 'Menunggu Verifikasi Administrasi Tata Usaha',
      summary: 'Panitia PPDB Yayasan memeriksa keabsahan data dan kesesuaian dokumen pendaftaran.',
      detail: 'Pemeriksaan mencakup validitas NIK, usia pendaftar sesuai jenjang (PAUD / TPQ), dan kelengkapan kontak. Panitia dapat menghubungi orang tua via WhatsApp jika diperlukan konfirmasi.',
      actionUrl: 'ppdb.html#jadwal-linimasa',
      actionLabel: 'Jadwal Verifikasi'
    },
    {
      step: 8,
      title: 'Memantau Status & Pengumuman Penerimaan',
      summary: 'Cek status seleksi secara mandiri di website menggunakan Nomor Registrasi Anda.',
      detail: 'Klik tombol "Cek Status PPDB" pada halaman PPDB, masukkan nomor registrasi dan nomor telepon terdaftar untuk mengetahui apakah ananda dinyatakan diterima, perlu perbaikan berkas, atau ditolak.',
      actionUrl: 'ppdb.html',
      actionLabel: 'Cek Status PPDB'
    },
    {
      step: 9,
      title: 'Daftar Ulang di Sekretariat Yayasan',
      summary: 'Konfirmasi kesediaan dan serahkan salinan berkas fisik ke kantor sekretariat yayasan.',
      detail: 'Orang tua/wali santri yang dinyatakan diterima hadir ke Sekretariat Yayasan (Jl. Wijaya Kusuma V-A No. 38 Samarinda) untuk verifikasi dokumen fisik, pengukuran seragam, dan administrasi.',
      actionUrl: 'kontak.html',
      actionLabel: 'Lokasi Sekretariat'
    },
    {
      step: 10,
      title: 'Aktivasi Status Menjadi Siswa / Santri Aktif',
      summary: 'Admin Yayasan mengubah status calon siswa menjadi siswa aktif di sistem database.',
      detail: 'Setelah proses daftar ulang selesai, calon santri secara resmi terdata di basis data yayasan sebagai peserta didik aktif Tahun Ajaran 2026/2027.',
      actionUrl: 'profil.html',
      actionLabel: 'Tentang Santri Yayasan'
    },
    {
      step: 11,
      title: 'Penerbitan NIS & Akun Portal Siswa',
      summary: 'Admin menerbitkan Nomor Induk Siswa (NIS) lokal, alokasi kelas, dan kredensial login.',
      detail: 'Nomor Induk Siswa (NIS) dan akun login Portal Siswa (SIAKAD) diterbitkan resmi oleh Admin Yayasan. Melalui portal tersebut, wali santri dapat memantau kehadiran, nilai hafalan/rapor, dan pembayaran SPP bulanan.',
      actionUrl: 'login.html',
      actionLabel: 'Portal Siswa SIAKAD'
    }
  ];

  // =========================================================================
  // 5. STRUKTUR KNOWLEDGE BASE RESMI (RULE-BASED INTENTS)
  // =========================================================================
  const KNOWLEDGE_BASE = [
    // -----------------------------------------------------------------------
    // A. KATEGORI PPDB & PENDAFTARAN ONLINE
    // -----------------------------------------------------------------------
    {
      id: 'ppdb_overview',
      category: 'ppdb',
      intent: 'ppdb_info',
      title: 'Tentang PPDB Yayasan At Tarbiyyah',
      patterns: [
        'apa itu ppdb', 'informasi ppdb', 'ppdb itu apa', 'maksud ppdb', 'tentang ppdb',
        'penerimaan santri baru', 'penerimaan murid baru', 'pendaftaran siswa baru', 'psb'
      ],
      keywords: ['ppdb', 'daftar', 'penerimaan', 'santri', 'baru', 'periode', 'gelombang'],
      priority: 10,
      buildAnswer: function (ctx) {
        return `*PPDB (Penerimaan Peserta Didik Baru)* di ${ctx.schoolName} adalah sistem pendaftaran online resmi untuk calon santri baru jenjang *TPQ Ulinnuha* (TPQ Pagi, Tahfidz Pra PTPT & PTPT) serta *KB Ulinnuha (PAUD)* Tahun Ajaran ${ctx.activeYear}.\n\nPendaftaran dapat dilakukan secara mandiri melalui formulir online 24 jam di website ini.`;
      },
      actions: [
        { label: 'Buka Halaman PPDB', url: 'ppdb.html', icon: 'fi fi-rr-document-signed' },
        { label: 'Lihat Persyaratan', url: 'ppdb.html#jadwal-linimasa', icon: 'fi fi-rr-clip' }
      ]
    },
    {
      id: 'ppdb_registration_howto',
      category: 'ppdb',
      intent: 'ppdb_register',
      title: 'Cara Mendaftar PPDB Online',
      patterns: [
        'bagaimana cara daftar', 'gimana cara daftar', 'cara mendaftar', 'saya mau masuk',
        'saya mau daftar', 'bagaimana alur pendaftaran', 'tata cara daftar', 'langkah pendaftaran',
        'cara registrasi', 'mau daftar sekolah', 'cara ikut ppdb', 'prosedur daftar'
      ],
      keywords: ['cara', 'daftar', 'alur', 'pendaftaran', 'masuk', 'langkah', 'prosedur', 'tata'],
      priority: 15,
      buildAnswer: function (ctx) {
        return `Untuk mendaftar di *${ctx.schoolName}*, ikuti langkah ringkas berikut:\n\n1. Buka menu *PPDB Online* pada website ini.\n2. Lengkapi formulir pendaftaran (Data Santri, Orang Tua, dan Riwayat Pendidikan).\n3. Unggah Pasfoto formal ananda (wajib) serta foto/scan Akta Kelahiran & KK.\n4. Periksa ringkasan formulir dan klik *Kirim Pendaftaran*.\n5. Simpan/cetak Lembar Bukti Registrasi dengan Nomor Registrasi unik Anda.\n\nSetelah itu, panitia Tata Usaha akan memverifikasi berkas Anda.`;
      },
      actions: [
        { label: 'Daftar Sekarang (Formulir Online)', url: 'ppdb.html#formulir-pendaftaran', icon: 'fi fi-rr-edit' },
        { label: 'Buka Panduan 11 Langkah', action: 'open_ppdb_guide', icon: 'fi fi-rr-workflow' }
      ]
    },
    {
      id: 'ppdb_requirements_docs',
      category: 'ppdb',
      intent: 'ppdb_requirements',
      title: 'Persyaratan Berkas Dokumen PPDB',
      patterns: [
        'apa saja persyaratan berkas', 'syarat berkas', 'persyaratan dokumen', 'apa saja dokumen yang dibutuhkan',
        'syarat pendaftaran', 'berkas apa saja', 'dokumen yang disiapkan', 'syarat masuk',
        'perlu foto kah', 'perlu akta', 'perlu kartu keluarga'
      ],
      keywords: ['persyaratan', 'syarat', 'berkas', 'dokumen', 'pasfoto', 'akta', 'kk', 'kartu', 'keluarga', 'upload'],
      priority: 14,
      buildAnswer: function (ctx) {
        return `Berikut adalah *dokumen persyaratan pendaftaran calon santri/siswa* di ${ctx.schoolName}:\n\n` +
          `• *1. Pasfoto Formal Ananda (Wajib):* Foto resmi terbaru setengah badan, wajah menghadap ke depan dengan pencahayaan jelas. Format JPG/PNG, maks. 5 MB.\n` +
          `• *2. Akta Kelahiran Calon Siswa:* Scan atau foto asli yang terbaca jelas untuk validasi NIK & tanggal lahir (JPG/PNG/PDF, maks. 5 MB).\n` +
          `• *3. Kartu Keluarga (KK):* Memuat NIK kepala keluarga & alamat domisili (JPG/PNG/PDF, maks. 5 MB).\n` +
          `• *4. Dokumen Tambahan (Opsional):* Surat pindah / rapor jenjang sebelumnya jika pendaftar merupakan siswa pindahan.\n\n` +
          `*Catatan:* Jika ada kendala mengunggah file online, Anda tetap dapat menyelesaikan form online dan menyerahkan fotokopi fisik ke Sekretariat Yayasan saat verifikasi berkas.`;
      },
      actions: [
        { label: 'Lihat Detail Persyaratan Berkas', url: 'ppdb.html#jadwal-linimasa', icon: 'fi fi-rr-clip' },
        { label: 'Isi Formulir Pendaftaran', url: 'ppdb.html#formulir-pendaftaran', icon: 'fi fi-rr-document-signed' }
      ]
    },
    {
      id: 'ppdb_form_filling_guide',
      category: 'ppdb',
      intent: 'ppdb_form_help',
      title: 'Panduan Mengisi Formulir PPDB Online',
      patterns: [
        'bagaimana cara mengisi formulir', 'cara isi form', 'panduan formulir', 'tahapan formulir',
        'langkah isi formulir', 'bagian apa saja di formulir', 'bantuan isi form'
      ],
      keywords: ['isi', 'formulir', 'form', 'tahap', 'bagian', 'biodata', 'panduan'],
      priority: 11,
      buildAnswer: function (ctx) {
        return `Formulir PPDB Online ${ctx.schoolName} tersusun atas *5 Tahap Ringkas*:\n\n` +
          `• *Tahap 1 — Identitas Santri:* Nama lengkap, NIK anak, tempat/tgl lahir, jenis kelamin, alamat rumah.\n` +
          `• *Tahap 2 — Identitas Orang Tua / Wali:* Nama Ayah, Ibu, Pekerjaan, Pendidikan, dan No. WhatsApp aktif.\n` +
          `• *Tahap 3 — Riwayat & Data Tambahan:* Pilihan jenjang (TPQ Pagi / Tahfidz / KB Ulinnuha PAUD), asal sekolah sebelumnya.\n` +
          `• *Tahap 4 — Unggah Dokumen:* Unggah Pasfoto anak (wajib), Akta Kelahiran, dan Kartu Keluarga.\n` +
          `• *Tahap 5 — Tinjauan & Cetak:* Periksa kembali kebenaran data lalu kirim formulir secara aman.`;
      },
      actions: [
        { label: 'Buka Formulir Pendaftaran', url: 'ppdb.html#formulir-pendaftaran', icon: 'fi fi-rr-edit' }
      ]
    },
    {
      id: 'ppdb_upload_guide',
      category: 'ppdb',
      intent: 'ppdb_upload_help',
      title: 'Ketentuan & Cara Mengunggah Dokumen',
      patterns: [
        'bagaimana cara mengunggah dokumen', 'cara upload file', 'ukuran file upload', 'format file ppdb',
        'gagal upload berkas', 'kendala upload dokumen', 'cara upload foto'
      ],
      keywords: ['unggah', 'upload', 'file', 'format', 'ukuran', 'mb', 'pdf', 'jpg', 'png', 'gagal'],
      priority: 12,
      buildAnswer: function (ctx) {
        return `Ketentuan pengunggahan berkas pendaftaran di website:\n\n` +
          `• *Format Dokumen:* Mendukung format *.JPG, .JPEG, .PNG*, dan *.PDF*.\n` +
          `• *Batas Ukuran:* Maksimal *5 MB* per berkas. Sistem kami otomatis mengompresi gambar agar pengunggahan lancar di ponsel maupun laptop.\n` +
          `• *Tips Keterbacaan:* Pastikan foto tegak, tidak blur, dan teks nama serta NIK tidak terpotong.\n\n` +
          `*Solusi Kendala:* Jika koneksi internet lambat atau file belum siap, formulir tetap dapat disubmit, dan fotokopi berkas fisik dapat diserahkan langsung ke Panitia di Sekretariat Yayasan.`;
      },
      actions: [
        { label: 'Lihat Persyaratan di Web', url: 'ppdb.html#jadwal-linimasa', icon: 'fi fi-rr-clip' }
      ]
    },
    {
      id: 'ppdb_status_check',
      category: 'ppdb',
      intent: 'ppdb_status',
      title: 'Cara Mengetahui Status Pendaftaran & Hasil Seleksi',
      patterns: [
        'bagaimana mengetahui status pendaftaran', 'cara cek status pendaftaran', 'bagaimana mengetahui hasil penerimaan',
        'cek hasil seleksi', 'cek status ppdb', 'apakah saya diterima', 'melihat hasil seleksi',
        'pengumuman hasil seleksi', 'status registrasi'
      ],
      keywords: ['status', 'hasil', 'seleksi', 'penerimaan', 'cek', 'pengumuman', 'diterima', 'nomor', 'registrasi'],
      priority: 15,
      buildAnswer: function (ctx) {
        return `Anda dapat memeriksa *status pendaftaran & hasil penerimaan* secara mandiri kapan saja:\n\n` +
          `1. Buka halaman *PPDB* di website ini.\n` +
          `2. Klik tombol *Cek Status PPDB* (atau tombol Cek Registrasi).\n` +
          `3. Masukkan *Nomor Registrasi* pendaftaran Anda (contoh: *REG-2026-XXXX*).\n` +
          `4. Masukkan nomor telepon yang digunakan saat mendaftar untuk verifikasi keamanan.\n` +
          `5. Sistem akan menampilkan status terkini: *Menunggu Verifikasi, Berkas Lengkap, Diterima, atau Perlu Perbaikan*.`;
      },
      actions: [
        { label: 'Cek Status PPDB Sekarang', url: 'ppdb.html', icon: 'fi fi-rr-search' }
      ]
    },
    {
      id: 'ppdb_verification_process',
      category: 'ppdb',
      intent: 'ppdb_verification',
      title: 'Proses Verifikasi Berkas Administrasi',
      patterns: [
        'bagaimana proses verifikasi', 'proses verifikasi berkas', 'berapa lama verifikasi',
        'siapa yang memverifikasi', 'tahap verifikasi administrasi'
      ],
      keywords: ['proses', 'verifikasi', 'tata', 'usaha', 'panitia', 'validasi', 'berkas'],
      priority: 11,
      buildAnswer: function (ctx) {
        return `*Proses Verifikasi Berkas PPDB* dilakukan oleh Panitia PPDB / Bagian Tata Usaha ${ctx.schoolName}:\n\n` +
          `• Petugas memvalidasi kesesuaian biodata formulir dengan data pada Akta Kelahiran dan Kartu Keluarga.\n` +
          `• Menyesuaikan jenjang usia ananda (PAUD / KB atau TPQ Pagi/Tahfidz).\n` +
          `• Jika berkas belum lengkap atau buram, panitia akan memberikan catatan status pada sistem atau menghubungi nomor WhatsApp orang tua terdaftar.`;
      },
      actions: [
        { label: 'Lihat Jadwal Linimasa PPDB', url: 'ppdb.html#jadwal-linimasa', icon: 'fi fi-rr-calendar' }
      ]
    },
    {
      id: 'ppdb_post_admission',
      category: 'ppdb',
      intent: 'ppdb_after_accepted',
      title: 'Langkah Setelah Dinyatakan Diterima (Daftar Ulang)',
      patterns: [
        'apa yang harus dilakukan setelah diterima', 'langkah setelah diterima', 'setelah lolos seleksi harus apa',
        'tahapan setelah diterima', 'cara daftar ulang', 'kapan daftar ulang', 'konfirmasi penerimaan'
      ],
      keywords: ['setelah', 'diterima', 'lolos', 'lulus', 'daftar', 'ulang', 'konfirmasi', 'sekretariat'],
      priority: 13,
      buildAnswer: function (ctx) {
        return `Selamat bagi calon santri yang telah dinyatakan *Diterima*! Langkah berikutnya adalah:\n\n` +
          `1. Melakukan *Daftar Ulang* di Sekretariat Yayasan (${ctx.address}).\n` +
          `2. Menyerahkan salinan fisik dokumen (Fotokopi Akta Kelahiran, Fotokopi KK, dan Pasfoto cetak).\n` +
          `3. Melakukan pengukuran perlengkapan seragam dan penyelesaian administrasi daftar ulang.\n` +
          `4. Panitia akan memproses penempatan kelompok belajar/kelas ananda.`;
      },
      actions: [
        { label: 'Lihat Lokasi Sekretariat Yayasan', url: 'kontak.html', icon: 'fi fi-rr-marker' },
        { label: 'Hubungi Panitia via WhatsApp', url: ctx.waHelpUrl, icon: 'fi fi-brands-whatsapp', isExternal: true }
      ]
    },
    {
      id: 'ppdb_activation_nis',
      category: 'ppdb',
      intent: 'ppdb_activation',
      title: 'Aktivasi Siswa, Penerbitan NIS & Akun Portal Siswa',
      patterns: [
        'bagaimana proses aktivasi menjadi siswa', 'bagaimana memperoleh nis', 'kapan saya mendapatkan nis',
        'kapan dapat akun portal', 'sandi portal siswa', 'nomor induk siswa', 'cara dapat nis',
        'akun login portal siswa'
      ],
      keywords: ['aktivasi', 'nis', 'nomor', 'induk', 'portal', 'siswa', 'sandi', 'password', 'akun'],
      priority: 13,
      buildAnswer: function (ctx) {
        return `*Penerbitan NIS & Akun Portal Siswa* merupakan kewenangan internal panitia/admin yayasan:\n\n` +
          `• *Nomor Induk Siswa (NIS)* lokal resmi dan alokasi kelas diterbitkan oleh Admin Yayasan *setelah tahapan daftar ulang selesai*.\n` +
          `• Akun login menuju *Portal Siswa (SIAKAD)* akan diserahkan kepada orang tua/wali murid saat penyerahan berkas fisik daftar ulang.\n` +
          `• *Calon siswa TIDAK PERLU mengunggah apapun* untuk memperoleh NIS, seluruhnya diproses langsung oleh sistem administrasi yayasan.`;
      },
      actions: [
        { label: 'Buka Halaman Login Portal', url: 'login.html', icon: 'fi fi-rr-lock' }
      ]
    },

    // -----------------------------------------------------------------------
    // B. KATEGORI INFORMASI YAYASAN & SEKOLAH
    // -----------------------------------------------------------------------
    {
      id: 'yayasan_profile_info',
      category: 'yayasan',
      intent: 'yayasan_profile',
      title: 'Profil Yayasan At Tarbiyyah Wijaya Kusuma',
      patterns: [
        'profil yayasan', 'tentang yayasan', 'sejarah yayasan', 'apa itu yayasan at tarbiyyah',
        'siapa yayasan at tarbiyyah', 'profil sekolah', 'profil singkat'
      ],
      keywords: ['profil', 'yayasan', 'sejarah', 'tentang', 'tarbiyyah', 'wijaya', 'kusuma'],
      priority: 12,
      buildAnswer: function (ctx) {
        return `*${ctx.schoolName}* berdiri sebagai wujud kepedulian masyarakat di lingkungan Air Putih Samarinda Ulu terhadap pendidikan dasar Islam dan anak usia dini yang berkualitas.\n\nYayasan membina dua unit utama:\n• *TPQ Ulinnuha* (Metode Qiraati 5 Jilid & Program Tahfidz Anak)\n• *KB Ulinnuha (PAUD)* (NPSN: 69840840) serta backup pendidikan kesetaraan PKBM ijazah resmi pemerintah.`;
      },
      actions: [
        { label: 'Baca Profil Lengkap Yayasan', url: 'profil.html', icon: 'fi fi-rr-building' }
      ]
    },
    {
      id: 'yayasan_vision_mission_info',
      category: 'yayasan',
      intent: 'yayasan_vision_mission',
      title: 'Visi dan Misi Yayasan',
      patterns: [
        'visi dan misi', 'apa visi yayasan', 'apa misi yayasan', 'visi misi sekolah',
        'tujuan yayasan', 'komitmen yayasan', 'budaya sekolah'
      ],
      keywords: ['visi', 'misi', 'tujuan', 'komitmen', 'budaya', 'hafalan', '9', 'tahun'],
      priority: 13,
      buildAnswer: function (ctx) {
        return `*Visi & Misi ${ctx.schoolName}*:\n\n` +
          `🎯 *Visi Utama:*\n"Mewujudkan Anak Hafal Al-Qur'an di Bawah Usia 9 Tahun (Hafal Tanpa Menghafal), serta membentuk generasi berakhlak mulia, cerdas, dan mandiri."\n\n` +
          `📌 *Misi Pokok:*\n` +
          `1. Menyelenggarakan TPQ Pagi (Metode Qiraati 5 Jilid) & Jenjang Tahfidz (Pra PTPT & PTPT Juz 1–30).\n` +
          `2. Menanamkan adab Islami dan hafalan doa sehari-hari sejak usia dini.\n` +
          `3. Menyelenggarakan KB Ulinnuha (PAUD) serta dukungan jalur pendidikan kesetaraan ijazah resmi pemerintah melalui PKBM.`;
      },
      actions: [
        { label: 'Lihat Visi & Misi di Web', url: 'profil.html#visi-misi', icon: 'fi fi-rr-eye' }
      ]
    },
    {
      id: 'school_programs_info',
      category: 'yayasan',
      intent: 'school_programs',
      title: 'Program Studi & Jenjang Pendidikan',
      patterns: [
        'program studi', 'jenjang pendidikan', 'ada program apa saja', 'jurusan apa saja',
        'program tpq', 'program paud', 'kelas apa saja', 'tingkat pendidikan'
      ],
      keywords: ['program', 'jenjang', 'tpq', 'paud', 'tahfidz', 'qiraati', 'kelas', 'studi'],
      priority: 13,
      buildAnswer: function (ctx) {
        return `*Program Pendidikan Unggulan di ${ctx.schoolName}*:\n\n` +
          `📖 *1. TPQ Ulinnuha (Nomor Induk: 05.01.01.001):*\n` +
          `• *TPQ Pagi:* Metode Qiraati 5 Jilid, Al-Qur'an, Ghorib & Tajwid (Target 6 bulan khotam).\n` +
          `• *Tahfidz Pra PTPT:* Pembiasaan Nderes 90 menit level ½ s/d 3 Juz (Target 60x khotam).\n` +
          `• *Tahfidz PTPT:* 6 kelas berkelanjutan Juz 1 s/d 30 (Target hafal < 9 tahun).\n\n` +
          `🧸 *2. KB Ulinnuha (PAUD - NPSN: 69840840) & PKBM:*\n` +
          `• Stimulasi tumbuh kembang, adab harian, motorik & kemandirian anak usia dini.\n` +
          `• Jalur kesetaraan resmi pemerintah (SPS dan Program Paket A/B/C).`;
      },
      actions: [
        { label: 'Lihat Rincian Program', url: 'profil.html#program-pendidikan', icon: 'fi fi-rr-book-alt' },
        { label: 'Daftar Jenjang Ini di PPDB', url: 'ppdb.html', icon: 'fi fi-rr-document-signed' }
      ]
    },
    {
      id: 'school_location_info',
      category: 'yayasan',
      intent: 'school_location',
      title: 'Lokasi & Alamat Resmi Yayasan',
      patterns: [
        'di mana lokasi sekolah', 'dimana alamat sekolah', 'alamat yayasan', 'lokasi yayasan',
        'kantor yayasan dimana', 'rute ke sekolah', 'di mana posisi yayasan', 'tempat sekolah'
      ],
      keywords: ['lokasi', 'alamat', 'dimana', 'jalan', 'juanda', 'wijaya', 'kusuma', 'samarinda', 'maps', 'posisi'],
      priority: 14,
      buildAnswer: function (ctx) {
        return `📍 *Alamat Resmi ${ctx.schoolName}*:\n\n` +
          `${ctx.address}\n\n` +
          `Lingkungan yayasan asri, tenang, dan kondusif untuk mendukung tumbuh kembang serta konsentrasi menghafal Al-Qur'an anak.`;
      },
      actions: [
        { label: 'Buka Google Maps', url: 'https://maps.google.com/?q=Jl.+Wijaya+Kusuma+V-A+Samarinda', icon: 'fi fi-rr-map-marker', isExternal: true },
        { label: 'Halaman Kontak Yayasan', url: 'kontak.html', icon: 'fi fi-rr-marker' }
      ]
    },
    {
      id: 'school_contacts_info',
      category: 'yayasan',
      intent: 'school_contacts',
      title: 'Kontak Resmi & Layanan WhatsApp',
      patterns: [
        'bagaimana cara menghubungi yayasan', 'kontak resmi', 'nomor whatsapp yayasan', 'nomor telpon sekolah',
        'email yayasan', 'hubungi admin', 'kontak panitia', 'nomor wa admin'
      ],
      keywords: ['kontak', 'hubungi', 'whatsapp', 'wa', 'telepon', 'telp', 'email', 'nomor', 'admin'],
      priority: 14,
      buildAnswer: function (ctx) {
        return `📞 *Kontak Resmi ${ctx.schoolName}*:\n\n` +
          `• *WhatsApp & Telepon:* ${ctx.phone}\n` +
          `• *Email:* ${ctx.email}\n` +
          `• *Alamat Kantor:* ${ctx.address}\n\n` +
          `Anda juga dapat mengklik tombol WhatsApp hijau di pojok kanan bawah layar untuk langsung terhubung dengan admin kami.`;
      },
      actions: [
        { label: 'Chat WhatsApp Sekarang', url: ctx.waHelpUrl, icon: 'fi fi-brands-whatsapp', isExternal: true },
        { label: 'Buka Formulir Kontak', url: 'kontak.html', icon: 'fi fi-rr-envelope' }
      ]
    },
    {
      id: 'school_facilities_info',
      category: 'yayasan',
      intent: 'school_facilities',
      title: 'Fasilitas Pendidikan Yayasan',
      patterns: [
        'informasi fasilitas pendidikan', 'fasilitas sekolah', 'sarana dan prasarana', 'sarana prasarana',
        'fasilitas apa saja', 'ruang kelasnya seperti apa'
      ],
      keywords: ['fasilitas', 'sarana', 'prasarana', 'ruang', 'kelas', 'lingkungan', 'gedung'],
      priority: 11,
      buildAnswer: function (ctx) {
        return `*Fasilitas Pendidikan di ${ctx.schoolName}* dirancang khusus untuk kenyamanan anak usia dini dan santri penghafal Al-Qur'an:\n\n` +
          `• Ruang belajar yang tenang, nyaman, dan sejuk.\n` +
          `• Sarana bimbingan Tahfidz Al-Qur'an intensif metode Qiraati.\n` +
          `• Alat permainan edukatif (APE) stimulasi motorik untuk anak PAUD/KB.\n` +
          `• Lingkungan komplek perumahan yang aman dari kebisingan lalu lintas jalan raya utama.`;
      },
      actions: [
        { label: 'Lihat Galeri Fasilitas & Kegiatan', url: 'galeri.html', icon: 'fi fi-rr-picture' }
      ]
    },
    {
      id: 'school_leadership_info',
      category: 'yayasan',
      intent: 'school_leadership',
      title: 'Tenaga Pendidik & Pengurus Yayasan',
      patterns: [
        'siapa pimpinan yayasan', 'siapa kepala sekolah', 'ketua yayasan', 'struktur organisasi',
        'tenaga pendidik', 'pengurus yayasan', 'siapa pendiri yayasan'
      ],
      keywords: ['pimpinan', 'kepala', 'sekolah', 'ketua', 'yayasan', 'struktur', 'makhrus', 'guru', 'ustadz'],
      priority: 11,
      buildAnswer: function (ctx) {
        return `*Kepengurusan ${ctx.schoolName}* dipimpin oleh:\n\n` +
          `• *Ketua Yayasan / Kepala Sekolah:* Bpk. ${ctx.headmaster}\n` +
          `• Dibina dan diawasi oleh dewan pembina dan pengawas yayasan, serta didukung oleh dewan ustadz/ustadzah yang bersanad Qiraati dan berkompeten di bidang pendidikan anak usia dini Islam.`;
      },
      actions: [
        { label: 'Lihat Struktur Pengurus Lengkap', url: 'profil.html#struktur-organisasi', icon: 'fi fi-rr-users-alt' }
      ]
    },

    // -----------------------------------------------------------------------
    // C. KATEGORI AKADEMIK & OPERASIONAL
    // -----------------------------------------------------------------------
    {
      id: 'school_schedule_info',
      category: 'akademik',
      intent: 'school_schedule',
      title: 'Hari Masuk & Jam Operasional Sekolah',
      patterns: [
        'hari masuk sekolah', 'jam operasional sekolah', 'jam berapa buka', 'hari apa saja sekolah',
        'kapan jam belajar', 'jadwal masuk sekolah', 'jam belajar tpq', 'jam belajar paud'
      ],
      keywords: ['hari', 'jam', 'masuk', 'operasional', 'buka', 'belajar', 'jadwal', 'senin', 'sabtu'],
      priority: 13,
      buildAnswer: function (ctx) {
        return `⏰ *Jadwal Masuk & Operasional ${ctx.schoolName}*:\n\n` +
          `• *Hari Operasional:* Senin sampai dengan Sabtu.\n` +
          `• *TPQ Pagi & Tahfidz:* Belajar sehari 2x (Sesi Pagi & Sesi Sore @ 75 Menit).\n` +
          `• *Jenjang Pra PTPT:* Pembiasaan Nderes selama 90 Menit.\n` +
          `• *KB Ulinnuha (PAUD):* Sesuai jadwal stimulasi pagi hari.\n` +
          `• *Layanan Kantor Tata Usaha:* Senin – Sabtu pukul 08.00 – 16.00 WITA.`;
      },
      actions: [
        { label: 'Lihat Agenda Kegiatan', url: 'agenda.html', icon: 'fi fi-rr-calendar' }
      ]
    },
    {
      id: 'school_holidays_info',
      category: 'akademik',
      intent: 'school_holidays',
      title: 'Informasi Hari Libur Sekolah',
      patterns: [
        'hari libur', 'sekolah libur kapan', 'kapan libur sekolah', 'apakah hari minggu libur',
        'jadwal libur', 'libur nasional sekolah'
      ],
      keywords: ['libur', 'minggu', 'ahad', 'kapan', 'nasional', 'jadwal'],
      priority: 13,
      buildAnswer: function (ctx) {
        return `📅 *Ketentuan Hari Libur di ${ctx.schoolName}*:\n\n` +
          `• Kegiatan belajar mengajar *libur rutin setiap hari Ahad (Minggu)*.\n` +
          `• Libur hari-hari besar Islam (Idul Fitri, Idul Adha, dll) dan Hari Libur Nasional resmi pemerintah.\n` +
          `• Informasi libur khusus semester/tahun ajaran diumumkan resmi melalui menu Pengumuman website.`;
      },
      actions: [
        { label: 'Lihat Pengumuman Resmi', url: 'pengumuman.html', icon: 'fi fi-rr-megaphone' }
      ]
    },
    {
      id: 'academic_calendar_info',
      category: 'akademik',
      intent: 'academic_calendar',
      title: 'Kalender Akademik & Agenda Kegiatan',
      patterns: [
        'kalender akademik', 'jadwal kegiatan', 'agenda sekolah', 'jadwal tahun ajaran',
        'kapan tahun ajaran dimulai', 'kegiatan santri apa saja', 'agenda tahunan'
      ],
      keywords: ['kalender', 'akademik', 'agenda', 'kegiatan', 'tahun', 'ajaran', 'mulai', 'jadwal'],
      priority: 12,
      buildAnswer: function (ctx) {
        return `*Tahun Ajaran ${ctx.activeYear}* di ${ctx.schoolName} mengacu pada kalender akademik terpadu yang memadukan target khatam metode Qiraati, evaluasi juz tahfidz, dan stimulasi PAUD.\n\nSeluruh agenda kegiatan santri, jadwal ujian kenaikan jilid, dan peringatan hari besar Islam dipublikasikan pada halaman *Agenda Kegiatan*.`;
      },
      actions: [
        { label: 'Buka Halaman Agenda', url: 'agenda.html', icon: 'fi fi-rr-calendar' }
      ]
    },

    // -----------------------------------------------------------------------
    // D. KATEGORI ADMINISTRASI & PEMBAYARAN SPP
    // -----------------------------------------------------------------------
    {
      id: 'tuition_spp_info',
      category: 'administrasi',
      intent: 'tuition_spp',
      title: 'Informasi SPP & Pembayaran Administrasi',
      patterns: [
        'bagaimana cara membayar spp', 'informasi spp', 'berapa biaya spp', 'berapa uang pendaftaran',
        'ketentuan pembayaran spp', 'biaya masuk sekolah', 'cara bayar spp', 'tagihan spp',
        'rincian biaya pendidikan'
      ],
      keywords: ['spp', 'biaya', 'bayar', 'tagihan', 'uang', 'tarif', 'iuran', 'kuitansi', 'portal'],
      priority: 14,
      buildAnswer: function (ctx) {
        return `💳 *Informasi SPP & Administrasi Keuangan* di ${ctx.schoolName}:\n\n` +
          `• Seluruh pengelolaan tagihan SPP bulanan santri aktif dikelola secara transparan dan terpadu melalui *Portal Siswa (SIAKAD)*.\n` +
          `• Wali santri dapat mengecek status tagihan, mengonfirmasi bukti bayar, dan mengunduh *Kuitansi Pembayaran Resmi* berstempel digital yayasan.\n` +
          `• Untuk rincian nominal infaq pendaftaran PPDB dan SPP jenjang terkait, silakan konfirmasi langsung ke Sekretariat Yayasan atau melalui WhatsApp Panitia.`;
      },
      actions: [
        { label: 'Login Portal Siswa (SIAKAD)', url: 'login.html', icon: 'fi fi-rr-graduation-cap' },
        { label: 'Tanya Biaya via WhatsApp', url: ctx.waHelpUrl, icon: 'fi fi-brands-whatsapp', isExternal: true }
      ]
    },
    {
      id: 'new_student_admin_docs',
      category: 'administrasi',
      intent: 'new_student_admin',
      title: 'Administrasi Siswa Baru & Dokumen Fisik',
      patterns: [
        'informasi administrasi siswa baru', 'dokumen yang perlu disiapkan setelah diterima',
        'berkas daftar ulang fisik', 'administrasi santri baru', 'syarat administrasi siswa'
      ],
      keywords: ['administrasi', 'siswa', 'baru', 'berkas', 'fisik', 'fotokopi', 'daftar', 'ulang'],
      priority: 12,
      buildAnswer: function (ctx) {
        return `Berkas fisik yang diserahkan saat *Daftar Ulang Siswa Baru* di Sekretariat Yayasan:\n\n` +
          `1. Salinan Lembar Bukti Pendaftaran PPDB Online.\n` +
          `2. Fotokopi Akta Kelahiran (2 lembar).\n` +
          `3. Fotokopi Kartu Keluarga / KK (2 lembar).\n` +
          `4. Pasfoto formal cetak ukuran 3x4 berwarna (2 lembar).\n` +
          `5. Menandatangani surat komitmen wali santri dalam pembiasaan adab Islami dan target hafalan ananda.`;
      },
      actions: [
        { label: 'Cek Status PPDB', url: 'ppdb.html', icon: 'fi fi-rr-search' },
        { label: 'Lokasi Sekretariat Yayasan', url: 'kontak.html', icon: 'fi fi-rr-marker' }
      ]
    }
  ];

  // =========================================================================
  // 6. HELPER: NORMALISASI TEKS QUERY PENGGUNA
  // =========================================================================
  function normalizeText(text) {
    if (!text || typeof text !== 'string') return '';
    let clean = text.toLowerCase();

    // Hapus karakter non-alfanumerik kecuali spasi
    clean = clean.replace(/[^a-z0-9\s]/g, ' ');

    // Ganti slang / singkatan
    const tokens = clean.split(/\s+/).filter(Boolean);
    const normalizedTokens = tokens.map(t => SLANG_MAP[t] || t);

    return normalizedTokens.join(' ').trim();
  }

  // =========================================================================
  // 7. MESIN PENCOCOK INTENT (RULE-BASED WEIGHTED MATCHING)
  // =========================================================================
  function findAnswer(rawQuery) {
    if (!rawQuery || typeof rawQuery !== 'string' || !rawQuery.trim()) {
      return {
        type: 'empty',
        answer: 'Silakan ketik pertanyaan Anda seputar PPDB, persyaratan, program pendidikan, atau informasi yayasan.',
        actions: []
      };
    }

    const trimmed = rawQuery.trim();
    const normalized = normalizeText(trimmed);
    const ctx = getDynamicContext();

    // -----------------------------------------------------------------------
    // FILTER 1: DETEKSI STRICT OUT-OF-SCOPE
    // Pertanyaan politik, pemilu, coding, film, game, kalkulus, resep, dll
    // WAJIB dijawab persis: "Saya tidak bisa menjawab pertanyaan Anda."
    // -----------------------------------------------------------------------
    const hasForbiddenWord = OUT_OF_SCOPE_REGEX.test(trimmed) || OUT_OF_SCOPE_REGEX.test(normalized);
    const hasSchoolAnchor = IN_SCOPE_ANCHOR_REGEX.test(trimmed) || IN_SCOPE_ANCHOR_REGEX.test(normalized);

    if (hasForbiddenWord && !hasSchoolAnchor) {
      return {
        type: 'out_of_scope',
        answer: 'Saya tidak bisa menjawab pertanyaan Anda.',
        actions: []
      };
    }

    // -----------------------------------------------------------------------
    // FILTER 2: KHUSUS PANDUAN LENGKAP 11 TAHAPAN
    // -----------------------------------------------------------------------
    if (/(alur|panduan|langkah|tahap|proses).*(pendaftaran|ppdb|masuk|santri|awal sampai akhir)/i.test(normalized) ||
        /(panduan lengkap|11 tahap|step by step)/i.test(normalized)) {
      return {
        type: 'answer',
        intent: 'ppdb_11_steps',
        title: 'Panduan Lengkap Alur Pendaftaran PPDB',
        answer: `Berikut adalah *11 Tahapan Resmi Pendaftaran Santri Baru* di ${ctx.schoolName}:\n\n` +
          `1. Mengenal informasi & program pendidikan yayasan\n` +
          `2. Memahami persyaratan berkas (Pasfoto, Akta, KK)\n` +
          `3. Membuka halaman formulir PPDB online\n` +
          `4. Mengisi formulir online (Tahap 1–3)\n` +
          `5. Mengunggah dokumen pendaftaran (Tahap 4)\n` +
          `6. Mengirim formulir & mencetak lembar bukti registrasi\n` +
          `7. Verifikasi administrasi oleh Tata Usaha\n` +
          `8. Memantau status & pengumuman penerimaan secara mandiri\n` +
          `9. Konfirmasi daftar ulang di Sekretariat Yayasan\n` +
          `10. Aktivasi calon siswa menjadi santri aktif\n` +
          `11. Penerbitan NIS lokal resmi & akun Portal Siswa (SIAKAD)\n\n` +
          `Klik tombol di bawah untuk membuka kartu rincian panduan langkah demi langkah.`,
        actions: [
          { label: 'Buka Panduan Interaktif (11 Langkah)', action: 'open_ppdb_guide', icon: 'fi fi-rr-workflow' },
          { label: 'Buka Formulir Pendaftaran', url: 'ppdb.html#formulir-pendaftaran', icon: 'fi fi-rr-edit' }
        ]
      };
    }

    // -----------------------------------------------------------------------
    // FILTER 3: PENCOCOKAN DENGAN KNOWLEDGE BASE BERBOBOT
    // -----------------------------------------------------------------------
    const userWords = normalized.split(/\s+/).filter(w => !STOPWORDS.has(w));
    let bestMatch = null;
    let highestScore = 0;

    for (let i = 0; i < KNOWLEDGE_BASE.length; i++) {
      const entry = KNOWLEDGE_BASE[i];
      let score = 0;

      // 1. Cek Exact Match / Phrase Match pada patterns (+20 poin)
      for (let p = 0; p < entry.patterns.length; p++) {
        const pattern = normalizeText(entry.patterns[p]);
        if (normalized === pattern) {
          score += 25;
          break;
        } else if (normalized.includes(pattern)) {
          score += 18;
          break;
        } else if (pattern.includes(normalized) && normalized.length > 5) {
          score += 12;
          break;
        }
      }

      // 2. Cek Kata Kunci Primer (+4 poin per kata cocok)
      for (let k = 0; k < entry.keywords.length; k++) {
        const kw = entry.keywords[k];
        if (userWords.includes(kw)) {
          score += 4;
        } else {
          // Substring partial match (+1.5 poin)
          for (let u = 0; u < userWords.length; u++) {
            if (userWords[u].length >= 4 && (userWords[u].includes(kw) || kw.includes(userWords[u]))) {
              score += 1.5;
            }
          }
        }
      }

      // 3. Tambahan prioritas bawaan
      score += (entry.priority || 0) * 0.2;

      if (score > highestScore) {
        highestScore = score;
        bestMatch = entry;
      }
    }

    // Ambang batas kecocokan minimum (threshold)
    const MATCH_THRESHOLD = 5.0;

    if (bestMatch && highestScore >= MATCH_THRESHOLD) {
      return {
        type: 'answer',
        intent: bestMatch.intent,
        title: bestMatch.title,
        answer: bestMatch.buildAnswer(ctx),
        actions: bestMatch.actions || []
      };
    }

    // -----------------------------------------------------------------------
    // FILTER 4: FALLBACK PENANGANAN PERTANYAAN
    // Jika masih ada kaitan dengan sekolah/yayasan tetapi belum terdaftar di KB
    // -----------------------------------------------------------------------
    if (hasSchoolAnchor || userWords.some(w => ['sekolah', 'yayasan', 'guru', 'ustadz', 'anak', 'kursus', 'biaya', 'spp', 'seragam', 'buku', 'rapor', 'kelas', 'ijazah', 'jadwal'].includes(w))) {
      return {
        type: 'unhandled_in_scope',
        answer: 'Maaf, informasi tersebut belum tersedia dalam sistem. Silakan hubungi pihak yayasan melalui WhatsApp untuk mendapatkan informasi lebih lanjut.',
        actions: [
          { label: 'Hubungi WhatsApp Resmi', url: ctx.waHelpUrl, icon: 'fi fi-brands-whatsapp', isExternal: true },
          { label: 'Lihat Menu Kontak & Alamat', url: 'kontak.html', icon: 'fi fi-rr-marker' }
        ]
      };
    }

    // Jika sama sekali tidak ada kaitan dengan sekolah atau yayasan
    return {
      type: 'out_of_scope',
      answer: 'Saya tidak bisa menjawab pertanyaan Anda.',
      actions: []
    };
  }

  // =========================================================================
  // 8. DAFTAR PERTANYAAN REKOMENDASI CEPAT (QUICK CHIPS)
  // =========================================================================
  const SUGGESTED_QUESTIONS = [
    'Bagaimana cara mendaftar?',
    'Apa saja persyaratan PPDB?',
    'Panduan alur pendaftaran PPDB',
    'Di mana lokasi sekolah?',
    'Apa saja program pendidikannya?',
    'Bagaimana informasi biaya / SPP?',
    'Bagaimana cara cek status PPDB?',
    'Kapan hari & jam operasional sekolah?'
  ];

  return {
    findAnswer: findAnswer,
    normalizeText: normalizeText,
    getPpdbGuideSteps: function () {
      return PPDB_11_STEPS;
    },
    getSuggestedQuestions: function () {
      return SUGGESTED_QUESTIONS;
    },
    getDynamicContext: getDynamicContext,
    isOutOfScope: function (query) {
      const res = findAnswer(query);
      return res.type === 'out_of_scope';
    }
  };
});
