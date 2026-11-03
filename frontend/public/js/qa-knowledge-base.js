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
    'kemana', 'kapan', 'kapankah', 'kenapakah', 'kenapa', 'mengapa', 'mengapakah',
    'berapa', 'berapakah', 'dan', 'atau', 'yang', 'ini', 'itu', 'adalah', 'yaitu',
    'dari', 'pada', 'ke', 'di', 'untuk', 'dengan', 'secara', 'atas', 'oleh', 'bagi', 'terhadap',
    'ingin', 'mau', 'pengen', 'bisa', 'dapat', 'mohon', 'tanya', 'info', 'informasi',
    'ada', 'tidak', 'nggak', 'gak', 'bukan', 'pun', 'lagi', 'saja', 'hanya',
    'tentang', 'mengenai', 'seputar', 'dong', 'sih', 'deh', 'ya', 'kah'
  ]);

  const SLANG_MAP = {
    // Sapaan & Salam
    'hallop': 'halo',
    'hallo': 'halo',
    'haloo': 'halo',
    'helo': 'halo',
    'hello': 'halo',
    'haii': 'hai',
    'assalamu': 'assalam',
    'assalamualaikum': 'assalam',
    'asalamualaikum': 'assalam',
    'kbr': 'kabar',

    // Kata Tanya & Perintah
    'gimana': 'bagaimana',
    'bgmn': 'bagaimana',
    'bgaimana': 'bagaimana',
    'gmn': 'bagaimana',
    'kmn': 'kemana',
    'dmn': 'dimana',
    'dmna': 'dimana',
    'kpn': 'kapan',
    'knp': 'kenapa',
    'brapa': 'berapa',
    'brp': 'berapa',

    // Kata Ganti & Mau
    'sy': 'saya',
    'aq': 'saya',
    'aku': 'saya',
    'gw': 'saya',
    'gua': 'saya',
    'lu': 'anda',
    'kamu': 'anda',
    'mo': 'mau',
    'mw': 'mau',
    'pngen': 'mau',
    'pengen': 'mau',
    'ingin': 'mau',
    'aj': 'saja',
    'aja': 'saja',

    // Pendaftaran & Sekolah
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

    // Biaya & SPP
    'biaya': 'spp',
    'bayar': 'spp',
    'tarif': 'spp',
    'ongkos': 'spp',
    'uang': 'spp',
    'iuran': 'spp',
    'pembayaran': 'spp',

    // Dokumen & Berkas
    'dokumen': 'berkas',
    'persyaratan': 'berkas',
    'syarat': 'berkas',
    'file': 'berkas',
    'surat': 'berkas',
    'foto': 'pasfoto',
    'pasfoto': 'pasfoto',
    'poto': 'pasfoto',

    // Penerimaan & Hasil
    'lulus': 'diterima',
    'lolos': 'diterima',
    'keterima': 'diterima',
    'hasil': 'diterima',
    'seleksi': 'diterima',
    'pengumuman': 'diterima',
    'status': 'diterima',

    // Kontak & Admin
    'kontak': 'hubungi',
    'wa': 'hubungi',
    'whatsapp': 'hubungi',
    'telp': 'hubungi',
    'telepon': 'hubungi',
    'nomer': 'hubungi',
    'nomor': 'hubungi',

    // Kesantunan & Konfirmasi
    'makasih': 'terimakasih',
    'terimakasih': 'terimakasih',
    'makasi': 'terimakasih',
    'thx': 'terimakasih',
    'thanks': 'terimakasih',
    'suwun': 'terimakasih',
    'ok': 'oke',
    'sip': 'oke',
    'siap': 'oke',
    'yup': 'oke',
    'bye': 'dadah',
    'goodbye': 'dadah',

    // Suffix -nya mapping
    'registrasinya': 'daftar',
    'pendaftarannya': 'daftar',
    'daftarnya': 'daftar',
    'caranya': 'cara',
    'syaratnya': 'berkas',
    'persyaratannya': 'berkas',
    'biayanya': 'spp',
    'jadwalnya': 'jadwal',
    'lokasinya': 'alamat',
    'kontaknya': 'hubungi',
    'fungsinya': 'fungsi',
    'tugasnya': 'tugas',
    'penerimaannya': 'diterima',
    'halamannya': 'halaman',
    'linknya': 'halaman',
    'tautannya': 'halaman',

    // Akademik & Program
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

  // Keyword umum yang menandakan konteks sekolah/yayasan atau interaksi asisten resmi
  const IN_SCOPE_ANCHOR_REGEX = /\b(halo|hallop|hallo|hai|assalam|assalamu|assalamualaikum|salam|kabar|permisi|pagi|siang|sore|malam|terima\s+kasih|terimakasih|makasih|oke|baik|siap|sampai\s+jumpa|dadah|bye|tolong|maaf|bantu|bantuan|asisten|ai|robot|manusia|privasi|yayasan|sekolah|paud|tpq|santri|siswa|ananda|ppdb|daftar|pendaftaran|guru|ustadz|ustadzah|tu|tata\s+usaha|spp|ijazah|rapor|juanda|wijaya\s+kusuma|air\s+putih|samarinda|ulinnuha|qiraati|tahfidz|ptpt|pra\s+ptpt|surah|nis|nomor\s+induk|portal\s+siswa)\b|siapa\s+(anda|kamu|bot|asisten|admin|pengurus|kepala|ketua|saya|kita)|(anda|kamu)\s+siapa|(tugas|fungsi)\s+(anda|kamu|bot|asisten)/i;

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
    // GREETING / SALAM PEMBUKA & SAPAAN
    // -----------------------------------------------------------------------
    {
      id: 'system_greeting',
      category: 'umum',
      intent: 'greeting',
      title: 'Salam & Bantuan Asisten Informasi',
      patterns: [
        'halo', 'hallop', 'hallo', 'haloo', 'hai', 'hi', 'helo', 'hello',
        'assalamu alaikum', 'assalamualaikum', 'asalamualaikum',
        'selamat pagi', 'selamat siang', 'selamat sore', 'selamat malam',
        'apa kabar', 'salam', 'permisi', 'halo admin', 'hai admin', 'bantuan'
      ],
      keywords: ['halo', 'hai', 'assalam', 'salam', 'pagi', 'siang', 'sore', 'malam', 'permisi', 'kabar', 'bantuan'],
      priority: 25,
      buildAnswer: function (ctx) {
        return `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
          `Selamat datang di Layanan Asisten Informasi Resmi *${ctx.schoolName}*! 😊\n\n` +
          `Saya siap membantu Anda dengan informasi seputar:\n` +
          `• *Penerimaan Peserta Didik Baru (PPDB)* Tahun Ajaran ${ctx.activeYear}\n` +
          `• Persyaratan berkas, biaya SPP, dan alur pendaftaran\n` +
          `• Program pendidikan TPQ Ulinnuha & KB Ulinnuha (PAUD)\n` +
          `• Lokasi, kontak resmi, dan jadwal kegiatan yayasan\n\n` +
          `Silakan ketik pertanyaan Anda atau pilih topik rekomendasi di bawah ini.`;
      },
      actions: [
        { label: 'Buka Halaman PPDB', url: 'ppdb.html', icon: 'fi fi-rr-document-signed' },
        { label: 'Panduan Alur 11 Langkah', action: 'open_ppdb_guide', icon: 'fi fi-rr-workflow' }
      ]
    },

    // -----------------------------------------------------------------------
    // IDENTITAS ASISTEN, PENGGUNA, KESANTUNAN & PANDUAN FUNGSI
    // -----------------------------------------------------------------------
    {
      id: 'bot_identity_info',
      category: 'asisten',
      intent: 'bot_identity',
      title: 'Identitas & Peran Asisten Informasi',
      patterns: [
        'siapa anda', 'anda siapa', 'siapa kamu', 'kamu siapa', 'siapa ini', 'ini siapa',
        'apa nama anda', 'siapa nama anda', 'siapa nama kamu', 'anda ini siapa', 'kamu ini siapa',
        'apa tugas anda', 'apa fungsi anda', 'apa tugas kamu', 'apa fungsi kamu', 'fungsi anda', 'tugas anda',
        'anda dibuat untuk apa', 'kamu dibuat untuk apa', 'dibuat untuk apa', 'tujuan anda dibuat',
        'apa yang bisa anda bantu', 'apa yang bisa kamu bantu', 'bisa bantu apa saja', 'bisa bantu apa',
        'apakah anda ai', 'apakah anda robot', 'apakah anda manusia', 'apakah kamu ai', 'apakah kamu manusia',
        'kamu robot ya', 'anda robot ya', 'bagaimana cara menggunakan anda', 'bagaimana cara pakai asisten',
        'cara menggunakan asisten', 'tentang asisten'
      ],
      keywords: ['siapa', 'anda', 'nama', 'tugas', 'fungsi', 'bantu', 'bantuan', 'asisten', 'ai', 'robot', 'manusia'],
      priority: 22,
      buildAnswer: function (ctx) {
        return `Saya adalah *Asisten Informasi Resmi ${ctx.schoolName}*! 🤖\n\n` +
          `• *Tugas & Fungsi Saya:* Membantu calon santri, orang tua/wali murid, dan pengunjung memperoleh informasi resmi seputar:\n` +
          `  1. *PPDB Online* (Jadwal pendaftaran, alur 11 langkah, formulir, dan verifikasi).\n` +
          `  2. *Persyaratan Berkas* (Pasfoto formal, scan Akta Kelahiran, dan KK).\n` +
          `  3. *Program Pendidikan* (TPQ Ulinnuha Metode Qiraati & KB Ulinnuha PAUD/PKBM).\n` +
          `  4. *Administrasi Pendidikan* (SPP bulanan di SIAKAD, aktivasi NIS, dan daftar ulang).\n` +
          `  5. *Informasi Umum Yayasan* (Alamat kantor, kontak WhatsApp panitia, dan fasilitas).\n\n` +
          `• *Status Sistem:* Saya merupakan sistem asisten informasi cerdas berbasis aturan (*rule-based*) internal SIYAYASAN. Saya bukan manusia dan tidak menggunakan layanan AI eksternal.\n\n` +
          `Silakan ketik pertanyaan Anda seputar PPDB atau yayasan, atau pilih topik rekomendasi di bawah!`;
      },
      actions: [
        { label: 'Buka Halaman PPDB', url: 'ppdb.html', icon: 'fi fi-rr-document-signed' },
        { label: 'Panduan Alur 11 Langkah', action: 'open_ppdb_guide', icon: 'fi fi-rr-workflow' },
        { label: 'Profil Yayasan', url: 'profil.html', icon: 'fi fi-rr-info' }
      ]
    },
    {
      id: 'user_identity_privacy',
      category: 'asisten',
      intent: 'user_identity',
      title: 'Identitas Pengguna & Privasi Data',
      patterns: [
        'siapa saya', 'siapa aku', 'aku siapa', 'saya siapa', 'anda kenal saya',
        'apakah anda mengenal saya', 'apakah kamu kenal saya', 'apakah anda tahu nama saya',
        'apakah kamu tahu nama saya', 'tahu nama saya', 'kenal saya tidak',
        'apa yang anda ketahui tentang saya', 'apa yang kamu tahu tentang saya', 'anda tahu apa tentang saya',
        'saya sedang berada di mana', 'dimana saya sekarang', 'lokasi saya dimana', 'posisi saya dimana',
        'dimana saya'
      ],
      keywords: ['siapa', 'saya', 'aku', 'kenal', 'mengenal', 'privasi', 'posisi', 'tahu'],
      priority: 20,
      buildAnswer: function (ctx) {
        return `Anda adalah *pengunjung website resmi ${ctx.schoolName}* yang sedang menggunakan layanan Asisten Informasi.\n\n` +
          `• *Privasi & Keamanan Data:* Saya tidak memiliki akses ke nama, identitas pribadi, kontak, maupun data perangkat Anda. Seluruh sesi tanya jawab ini bersifat aman dan anonim.\n` +
          `• *Informasi Lokasi:* Saya tidak melacak posisi fisik Anda. Namun jika Anda mencari lokasi resmi sekolah kami, *Sekretariat Yayasan At Tarbiyyah* beralamat di:\n` +
          `  📍 *${ctx.address}*\n\n` +
          `Ada informasi pendaftaran atau informasi yayasan yang dapat saya bantu?`;
      },
      actions: [
        { label: 'Lihat Alamat & Peta Kontak', url: 'kontak.html', icon: 'fi fi-rr-marker' },
        { label: 'Buka Menu PPDB', url: 'ppdb.html', icon: 'fi fi-rr-document-signed' }
      ]
    },
    {
      id: 'courtesy_thanks_info',
      category: 'umum',
      intent: 'courtesy_thanks',
      title: 'Ucapan Terima Kasih',
      patterns: [
        'terima kasih', 'makasih', 'terimakasih', 'makasi', 'makasih banyak', 'terima kasih banyak',
        'thanks', 'thank you', 'suwun', 'hatur nuhun', 'matur suwun', 'terima kasih infonya',
        'makasih infonya', 'makasih admin', 'terima kasih admin'
      ],
      keywords: ['terima', 'kasih', 'makasih', 'thanks', 'suwun'],
      priority: 22,
      buildAnswer: function (ctx) {
        return `Sama-sama! Senang dapat membantu Anda. 😊\n\n` +
          `Jangan ragu untuk bertanya kembali jika ada hal lain seputar pendaftaran PPDB, persyaratan berkas, atau informasi ${ctx.schoolName} yang Anda butuhkan.\n\n` +
          `Semoga sukses dan berkah untuk ananda dan keluarga!`;
      },
      actions: [
        { label: 'Buka Formulir PPDB Online', url: 'ppdb.html#formulir-pendaftaran', icon: 'fi fi-rr-edit' },
        { label: 'Hubungi Panitia via WhatsApp', isWhatsApp: true, icon: 'fi fi-brands-whatsapp', isExternal: true }
      ]
    },
    {
      id: 'courtesy_ack_info',
      category: 'umum',
      intent: 'courtesy_ack',
      title: 'Konfirmasi Percakapan',
      patterns: [
        'oke', 'ok', 'baik', 'baiklah', 'siap', 'paham', 'mengerti', 'sip',
        'oke baik', 'oke paham', 'oke mengerti', 'oke siap', 'oke sip'
      ],
      keywords: ['oke', 'baik', 'siap', 'paham', 'mengerti', 'sip'],
      priority: 18,
      buildAnswer: function () {
        return `Baik! Senang informasi yang disampaikan dapat dipahami dengan baik. 👍\n\n` +
          `Apakah masih ada hal lain seputar PPDB, biaya SPP, jadwal kegiatan, atau profil yayasan yang ingin Anda ketahui? Silakan ketik pertanyaan Anda.`;
      },
      actions: [
        { label: 'Buka Halaman PPDB', url: 'ppdb.html', icon: 'fi fi-rr-document-signed' },
        { label: 'Panduan Alur 11 Langkah', action: 'open_ppdb_guide', icon: 'fi fi-rr-workflow' }
      ]
    },
    {
      id: 'courtesy_closing_info',
      category: 'umum',
      intent: 'courtesy_closing',
      title: 'Salam Perpisahan & Penutup',
      patterns: [
        'sampai jumpa', 'dadah', 'bye', 'selamat tinggal', 'goodbye', 'sampai ketemu',
        'wassalam', 'wassalamualaikum', 'wassalamu alaikum'
      ],
      keywords: ['sampai', 'jumpa', 'dadah', 'bye', 'tinggal', 'wassalam'],
      priority: 20,
      buildAnswer: function (ctx) {
        return `Sampai jumpa kembali! Terima kasih banyak telah berkunjung ke website resmi ${ctx.schoolName}.\n\n` +
          `Semoga hari Anda menyenangkan dan senantiasa dalam lindungan Allah SWT. Wassalamu'alaikum Warahmatullahi Wabarakatuh. 🙏`;
      },
      actions: [
        { label: 'Buka Halaman Utama', url: 'index.html', icon: 'fi fi-rr-home' }
      ]
    },
    {
      id: 'courtesy_help_request_info',
      category: 'umum',
      intent: 'courtesy_help',
      title: 'Permintaan Bantuan',
      patterns: [
        'bisa bantu saya', 'bantu saya', 'tolong saya', 'minta tolong', 'tolong',
        'saya butuh bantuan', 'butuh bantuan', 'tolong bantu', 'mau tanya dong',
        'saya mau tanya', 'boleh tanya', 'apakah boleh tanya'
      ],
      keywords: ['bisa', 'bantu', 'tolong', 'bantuan', 'tanya'],
      priority: 20,
      buildAnswer: function () {
        return `Tentu! Saya siap membantu Anda dengan senang hati. 😊\n\n` +
          `Silakan tanyakan informasi yang Anda perlukan seputar:\n` +
          `• *PPDB Online:* Syarat berkas, tata cara pendaftaran, jadwal, dan status pengumuman.\n` +
          `• *Program Pendidikan:* TPQ Ulinnuha (Metode Qiraati & Tahfidz) serta KB Ulinnuha (PAUD).\n` +
          `• *Keuangan & Administrasi:* SPP bulanan, aktivasi NIS, seragam, dan daftar ulang.\n` +
          `• *Sekolah & Yayasan:* Alamat lokasi kantor, hari operasional, dan nomor WhatsApp panitia.\n\n` +
          `Apa yang ingin Anda ketahui?`;
      },
      actions: [
        { label: 'Buka Halaman PPDB', url: 'ppdb.html', icon: 'fi fi-rr-document-signed' },
        { label: 'Lihat Persyaratan Berkas', url: 'ppdb.html#jadwal-linimasa', icon: 'fi fi-rr-clip' }
      ]
    },
    {
      id: 'bot_capabilities_info',
      category: 'asisten',
      intent: 'bot_capabilities',
      title: 'Panduan Informasi & Cara Bertanya',
      patterns: [
        'apa saja informasi yang tersedia', 'bisa tanya apa saja', 'menu apa saja',
        'informasi apa saja yang ada', 'bisa bantu apa', 'bagaimana cara bertanya',
        'cara bertanya bagaimana', 'bagaimana mencari informasi ppdb', 'cara cari info ppdb',
        'bagaimana membuka halaman tertentu', 'bagaimana mendapatkan bantuan',
        'bagaimana menghubungi admin'
      ],
      keywords: ['informasi', 'tersedia', 'tanya', 'menu', 'bantuan', 'admin', 'cara'],
      priority: 19,
      buildAnswer: function (ctx) {
        return `ℹ️ *Panduan Informasi Asisten SIYAYASAN*:\n\n` +
          `Anda dapat bertanya seputar:\n` +
          `• *1. Pendaftaran PPDB:* Cara mendaftar online, jadwal linimasa, panduan pengisian formulir, dan alur 11 tahapan.\n` +
          `• *2. Dokumen Persyaratan:* Pasfoto formal anak, scan Akta Kelahiran, dan KK.\n` +
          `• *3. Status Penerimaan & Daftar Ulang:* Cara memantau pengumuman mandiri, verifikasi berkas fisik, dan penerbitan NIS.\n` +
          `• *4. SPP & Pembayaran:* Mekanisme kuitansi resmi dan tagihan via Portal Siswa (SIAKAD).\n` +
          `• *5. Profil Yayasan:* Fasilitas pendidikan, kurikulum metode Qiraati & tahfidz, lokasi alamat, dan kontak resmi.\n\n` +
          `Jika pertanyaan membutuhkan layanan tatap muka, Anda dapat langsung menghubungi panitia melalui WhatsApp.`;
      },
      actions: [
        { label: 'Buka Halaman PPDB', url: 'ppdb.html', icon: 'fi fi-rr-document-signed' },
        { label: 'Hubungi WhatsApp Panitia', isWhatsApp: true, icon: 'fi fi-brands-whatsapp', isExternal: true },
        { label: 'Buka Halaman Kontak', url: 'kontak.html', icon: 'fi fi-rr-envelope' }
      ]
    },

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
      id: 'ppdb_schedule_timeline',
      category: 'ppdb',
      intent: 'ppdb_schedule',
      title: 'Jadwal & Periode Pembukaan PPDB',
      patterns: [
        'kapan ppdb buka', 'kapan ppdb dibuka', 'kapan pendaftaran dibuka', 'kapan mulai daftar',
        'jadwal buka ppdb', 'tanggal berapa buka', 'apakah ppdb sudah buka', 'kapan buka ppdb',
        'kapan pendaftaran murid baru dibuka', 'jadwal ppdb', 'periode pendaftaran',
        'kapan mulai pendaftaran', 'kapan terakhir pendaftaran', 'kapan pendaftaran ditutup'
      ],
      keywords: ['ppdb', 'daftar', 'pendaftaran', 'kapan', 'buka', 'dibuka', 'jadwal', 'mulai', 'tanggal', 'periode', 'gelombang', 'ditutup', 'terakhir'],
      priority: 18,
      buildAnswer: function (ctx) {
        return `📅 *Jadwal & Periode PPDB ${ctx.schoolName}*:\n\n` +
          `• *Tahun Ajaran:* ${ctx.activeYear}\n` +
          `• *Periode:* ${ctx.ppdbPeriodName}\n` +
          `• *Status Pendaftaran:* ${ctx.regDates}\n\n` +
          `Pendaftaran peserta didik baru dibuka secara mandiri 24 jam melalui formulir online di website resmi yayasan. Anda dapat langsung melengkapi biodata calon siswa dan mengunggah dokumen persyaratan secara daring.`;
      },
      actions: [
        { label: 'Lihat Linimasa Lengkap PPDB', url: 'ppdb.html#jadwal-linimasa', icon: 'fi fi-rr-calendar' },
        { label: 'Buka Formulir Pendaftaran', url: 'ppdb.html#formulir-pendaftaran', icon: 'fi fi-rr-edit' }
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
        'cara registrasi', 'mau daftar sekolah', 'cara ikut ppdb', 'prosedur daftar',
        'bagaimana cara mendaftar', 'bagaimana registrasinya', 'bagaimana pendaftarannya', 'bgmn registrasinya', 'registrasi',
        'saya ingin mendaftar', 'saya ingin masuk', 'saya mau masuk sekolah ini', 'bagaimana cara masuk sekolah ini',
        'saya mau menjadi siswa baru', 'mau jadi siswa baru', 'bagaimana proses penerimaannya', 'proses penerimaan',
        'mau daftar ppdb', 'daftar ppdb', 'pendaftaran ppdb', 'ikut ppdb', 'mau daftar'
      ],
      keywords: ['cara', 'daftar', 'alur', 'pendaftaran', 'masuk', 'langkah', 'prosedur', 'tata', 'ppdb', 'registrasi'],
      priority: 19,
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
        'perlu foto kah', 'perlu akta', 'perlu kartu keluarga',
        'apa saja persyaratan ppdb', 'persyaratan ppdb', 'syarat ppdb', 'berkas ppdb',
        'apa saja syarat ppdb', 'syarat pendaftaran ppdb', 'apa saja persyaratan masuk', 'syarat masuk ppdb',
        'apa saja berkasnya', 'apa saja persyaratannya', 'berkasnya apa saja', 'syaratnya apa saja'
      ],
      keywords: ['persyaratan', 'syarat', 'berkas', 'dokumen', 'pasfoto', 'akta', 'kk', 'kartu', 'keluarga', 'upload', 'ppdb'],
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
        'tahapan setelah diterima', 'cara daftar ulang', 'kapan daftar ulang', 'konfirmasi penerimaan',
        'kalau sudah diterima bagaimana', 'setelah diterima bagaimana', 'kalau sudah diterima',
        'setelah lolos bagaimana', 'langkah setelah diterima bagaimana'
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
        { label: 'Hubungi Panitia via WhatsApp', isWhatsApp: true, icon: 'fi fi-brands-whatsapp', isExternal: true }
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
        'siapa yayasan at tarbiyyah', 'profil sekolah', 'profil singkat', 'sekolah', 'tentang sekolah', 'info sekolah'
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
        'kantor yayasan dimana', 'rute ke sekolah', 'di mana posisi yayasan', 'tempat sekolah',
        'lokasi sekolah', 'alamat sekolah', 'lokasi sekolah dimana', 'alamat sekolah dimana',
        'dimana lokasi sekolah', 'dimana alamat sekolah', 'posisi sekolah', 'sekolah dimana'
      ],
      keywords: ['lokasi', 'alamat', 'dimana', 'jalan', 'juanda', 'wijaya', 'kusuma', 'samarinda', 'maps', 'posisi', 'sekolah'],
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
        { label: 'Chat WhatsApp Sekarang', isWhatsApp: true, icon: 'fi fi-brands-whatsapp', isExternal: true },
        { label: 'Buka Formulir Kontak', url: 'kontak.html', icon: 'fi fi-rr-envelope' }
      ]
    },
    {
      id: 'yayasan_social_media_info',
      category: 'yayasan',
      intent: 'social_media',
      title: 'Media Sosial & Saluran Informasi Resmi',
      patterns: [
        'media sosial yayasan', 'akun instagram', 'facebook yayasan', 'youtube sekolah',
        'medsos yayasan', 'akun medsos', 'sosial media', 'instagram sekolah', 'facebook sekolah',
        'medsos sekolah', 'sosmed yayasan', 'sosmed sekolah'
      ],
      keywords: ['media', 'sosial', 'medsos', 'sosmed', 'instagram', 'facebook', 'youtube', 'saluran'],
      priority: 15,
      buildAnswer: function (ctx) {
        return `🌐 *Saluran Informasi Resmi ${ctx.schoolName}*:\n\n` +
          `• *Website Resmi:* Akses berita terkini, pengumuman, dan kalender kegiatan langsung di portal website ini.\n` +
          `• *Layanan WhatsApp Panitia:* ${ctx.phone} (layanan pesan cepat untuk konsultasi PPDB & pertanyaan umum).\n` +
          `• *Email Resmi:* ${ctx.email}\n\n` +
          `Dokumentasi kegiatan santri, agenda wisuda tahfidz, dan pengumuman resmi yayasan dipublikasikan secara berkala melalui menu Berita dan Galeri di website ini.`;
      },
      actions: [
        { label: 'Lihat Berita Terbaru', url: 'berita.html', icon: 'fi fi-rr-newspaper' },
        { label: 'Hubungi WhatsApp Resmi', isWhatsApp: true, icon: 'fi fi-brands-whatsapp', isExternal: true }
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
        'kapan jam belajar', 'jadwal masuk sekolah', 'jam belajar tpq', 'jam belajar paud',
        'hari apa saja masuk sekolah', 'hari apa saja masuk'
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
        'jadwal libur', 'libur nasional sekolah', 'kapan sekolah libur', 'hari libur sekolah'
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
        { label: 'Tanya Biaya via WhatsApp', isWhatsApp: true, icon: 'fi fi-brands-whatsapp', isExternal: true }
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
  // 6. HELPER: NORMALISASI TEKS & FUZZY MATCHING (TYPO TOLERANCE)
  // =========================================================================
  const CANONICAL_KEYWORDS = [
    'daftar', 'pendaftaran', 'mendaftar', 'masuk', 'formulir', 'registrasi',
    'syarat', 'persyaratan', 'berkas', 'dokumen', 'pasfoto', 'foto', 'akta', 'keluarga',
    'sekolah', 'yayasan', 'profil', 'alamat', 'lokasi', 'kontak', 'telepon', 'whatsapp',
    'jadwal', 'libur', 'kalender', 'agenda', 'kegiatan', 'biaya', 'spp', 'bayar', 'tagihan',
    'diterima', 'lulus', 'hasil', 'pengumuman', 'seleksi', 'aktivasi', 'nis', 'portal',
    'siapa', 'tugas', 'fungsi', 'bantu', 'bantuan', 'asisten', 'terimakasih', 'terima', 'kasih',
    'halo', 'pagi', 'siang', 'sore', 'malam', 'kabar', 'sampai', 'jumpa', 'informasi', 'dibuka'
  ];

  // Algoritma Levenshtein Distance untuk toleransi kesalahan ketik (typo)
  function levenshteinDistance(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const row = [];
    for (let i = 0; i <= b.length; i++) {
      row[i] = i;
    }

    for (let i = 1; i <= a.length; i++) {
      let prev = i;
      for (let j = 1; j <= b.length; j++) {
        let val;
        if (a[i - 1] === b[j - 1]) {
          val = row[j - 1];
        } else {
          val = Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
        }
        row[j - 1] = prev;
        prev = val;
      }
      row[b.length] = prev;
    }
    return row[b.length];
  }

  // Pencocokan fuzzy ke kosakata kanonikal
  function fuzzyMatchKeyword(token) {
    if (!token || token.length < 4) return token;
    let closestWord = token;
    let minDistance = 99;

    for (let i = 0; i < CANONICAL_KEYWORDS.length; i++) {
      const canonical = CANONICAL_KEYWORDS[i];
      if (Math.abs(token.length - canonical.length) > 2) continue;
      const dist = levenshteinDistance(token, canonical);
      const maxAllowed = canonical.length >= 7 ? 2 : 1;
      if (dist <= maxAllowed && dist < minDistance) {
        minDistance = dist;
        closestWord = canonical;
      }
    }

    return closestWord;
  }

  // Pemangkasan huruf berulang (elongated letters: "halloooo" -> "hallo", "bagaimanaa" -> "bagaimana")
  function cleanRepeatedCharacters(word) {
    if (!word || typeof word !== 'string') return '';
    // 1. Pangkas pengulangan 3+ karakter berturut-turut menjadi 1 karakter
    let clean = word.replace(/([a-z])\1{2,}/gi, '$1');

    // 2. Pangkas pengulangan 2 karakter di akhir kata untuk konsonan/vokal berlebih
    clean = clean.replace(/([a-z])\1$/i, '$1');

    return clean;
  }

  function normalizeToken(rawToken) {
    if (!rawToken) return '';
    let token = cleanRepeatedCharacters(rawToken);

    if (SLANG_MAP[token]) {
      return SLANG_MAP[token];
    }

    // Penanganan sufiks '-nya' (contoh: "persyaratannya" -> "persyaratan" -> "berkas")
    if (token.endsWith('nya') && token.length > 5) {
      const root = token.slice(0, -3);
      if (SLANG_MAP[root]) {
        return SLANG_MAP[root];
      }
      if (CANONICAL_KEYWORDS.includes(root)) {
        return root;
      }
    }

    // Fuzzy matching ke kamus kanonikal
    const fuzzy = fuzzyMatchKeyword(token);
    if (fuzzy !== token) {
      return SLANG_MAP[fuzzy] || fuzzy;
    }

    return token;
  }

  function normalizeText(text) {
    if (!text || typeof text !== 'string') return '';
    let clean = text.toLowerCase();

    // Hapus karakter non-alfanumerik kecuali spasi
    clean = clean.replace(/[^a-z0-9\s]/g, ' ');

    const tokens = clean.split(/\s+/).filter(Boolean);
    const normalizedTokens = tokens.map(t => normalizeToken(t));

    return normalizedTokens.join(' ').trim();
  }

  // =========================================================================
  // 7. MESIN PENCOCOK INTENT (RULE-BASED WEIGHTED MATCHING)
  // =========================================================================
  function findAnswer(rawQuery, conversationContext) {
    if (!rawQuery || typeof rawQuery !== 'string' || !rawQuery.trim()) {
      return {
        type: 'empty',
        answer: 'Silakan ketik pertanyaan Anda seputar PPDB, persyaratan, program pendidikan, atau informasi yayasan.',
        actions: []
      };
    }

    const trimmed = rawQuery.trim();
    const normalized = normalizeText(trimmed);
    if (!normalized || !normalized.trim()) {
      return {
        type: 'empty',
        answer: 'Silakan ketik pertanyaan Anda seputar PPDB, persyaratan, program pendidikan, atau informasi yayasan.',
        actions: []
      };
    }
    const ctx = getDynamicContext();

    function resolveActions(actionsList) {
      if (!actionsList || !Array.isArray(actionsList)) return [];
      return actionsList.map(function (act) {
        const item = Object.assign({}, act);
        if (item.isWhatsApp || (!item.url && !item.action)) {
          item.url = ctx.waHelpUrl;
          item.isExternal = true;
        }
        return item;
      });
    }

    // -----------------------------------------------------------------------
    // FILTER 0: CONTEXT-AWARE FOLLOW-UP RESOLVER (Pertanyaan Berangkai)
    // -----------------------------------------------------------------------
    if (conversationContext && conversationContext.lastIntent) {
      const lastIntent = conversationContext.lastIntent;
      const lastTopic = conversationContext.lastTopic || '';

      // A. "Bagaimana selanjutnya?", "Kalau sudah?", "Terus?", "Langkah berikutnya?"
      const isNextStep = /^(bagaimana\s+selanjutnya|kalau\s+sudah|setelah\s+itu|terus\s+bagaimana|terus\s+gimana|terus|selanjutnya\s+apa|langkah\s+berikutnya)/i.test(trimmed) ||
                         /^(bagaimana\s+selanjutnya|kalau\s+sudah|setelah\s+itu|terus\s+bagaimana|terus\s+gimana|terus|selanjutnya\s+apa|langkah\s+berikutnya)/i.test(normalized);

      if (isNextStep) {
        if (lastIntent === 'ppdb_register' || lastIntent === 'ppdb_form_help' || lastIntent === 'ppdb_info') {
          return findAnswer('bagaimana cara verifikasi dan pengumuman ppdb', null);
        } else if (lastIntent === 'ppdb_requirements') {
          return findAnswer('bagaimana cara mendaftar ppdb online', null);
        } else if (lastIntent === 'ppdb_acceptance_check' || lastIntent === 'ppdb_after_accepted') {
          return findAnswer('bagaimana proses aktivasi menjadi siswa dan dapat nis', null);
        }
      }

      // B. "Apa saja berkasnya?", "Syaratnya apa saja?", "Apa saja?"
      const isRequirementsFollowup = /^(apa\s+saja\s+berkas|apa\s+saja\s+syarat|syaratnya\s+apa|berkasnya\s+apa|apa\s+saja)/i.test(normalized) ||
                                     /^(apa\s+saja\s+berkasnya|apa\s+saja\s+syaratnya)/i.test(trimmed);
      if (isRequirementsFollowup && (lastTopic === 'ppdb' || lastIntent.startsWith('ppdb'))) {
        return findAnswer('apa saja persyaratan berkas dokumen ppdb', null);
      }

      // C. "Kalau sudah diterima bagaimana?", "Setelah diterima bagaimana?"
      const isAfterAcceptance = /^(kalau\s+sudah\s+diterima|setelah\s+diterima|setelah\s+lolos)/i.test(normalized);
      if (isAfterAcceptance) {
        return findAnswer('apa yang harus dilakukan setelah diterima', null);
      }

      // D. "Di mana halamannya?", "Mana linknya?", "Mana tautannya?"
      const isPageLink = /^(di\s+mana\s+halaman|dimana\s+halaman|mana\s+link|mana\s+tautan|linknya\s+mana|buka\s+halaman)/i.test(normalized);
      if (isPageLink) {
        if (lastTopic === 'ppdb' || lastIntent.startsWith('ppdb')) {
          return {
            type: 'answer',
            category: 'ppdb',
            intent: 'page_link',
            title: 'Tautan Halaman PPDB Online',
            answer: `Berikut tautan langsung menuju halaman resmi *PPDB Online ${ctx.schoolName}*:\n\nSilakan klik tombol di bawah untuk membuka halaman pendaftaran atau formulir online:`,
            actions: [
              { label: 'Buka Halaman PPDB', url: 'ppdb.html', icon: 'fi fi-rr-document-signed' },
              { label: 'Isi Formulir Pendaftaran', url: 'ppdb.html#formulir-pendaftaran', icon: 'fi fi-rr-edit' }
            ]
          };
        } else if (lastIntent === 'tuition_spp' || lastTopic === 'administrasi') {
          return {
            type: 'answer',
            category: 'administrasi',
            intent: 'page_link',
            title: 'Tautan Portal Siswa (SIAKAD)',
            answer: `Berikut tautan resmi menuju *Portal Siswa (SIAKAD) ${ctx.schoolName}* untuk pengecekan tagihan SPP dan administrasi keuangan santri:`,
            actions: [
              { label: 'Login Portal Siswa (SIAKAD)', url: 'login.html', icon: 'fi fi-rr-graduation-cap' }
            ]
          };
        } else if (lastIntent === 'school_location' || lastIntent === 'school_contacts') {
          return {
            type: 'answer',
            category: 'yayasan',
            intent: 'page_link',
            title: 'Tautan Kontak & Lokasi Yayasan',
            answer: `Berikut tautan resmi menuju halaman *Kontak & Peta Lokasi Yayasan*:`,
            actions: [
              { label: 'Lihat Kontak & Lokasi', url: 'kontak.html', icon: 'fi fi-rr-marker' }
            ]
          };
        }
      }

      // E. "Berapa biayanya?", "Biayanya berapa?"
      const isCostFollowup = /^(berapa\s+spp|spp\s+berapa|biayanya\s+berapa|berapa\s+biaya)/i.test(normalized);
      if (isCostFollowup) {
        return findAnswer('berapa biaya spp dan tagihan pendidikan', conversationContext);
      }
    }

    // -----------------------------------------------------------------------
    // FILTER 0B: AMBIGUOUS SHORT QUERY CLARIFICATION
    // Jika pertanyaan hanya 1 kata ambigu ("info", "tanya", "menu", "bantuan")
    // -----------------------------------------------------------------------
    if (['info', 'tanya', 'menu', 'bantuan', 'informasi'].includes(normalized)) {
      return {
        type: 'clarification',
        category: 'umum',
        intent: 'bot_capabilities',
        title: 'Bantuan Asisten Informasi SIYAYASAN',
        answer: `Halo! Saya siap membantu Anda. Silakan pilih topik informasi yang ingin Anda ketahui di bawah ini, atau ketik pertanyaan lengkap Anda:`,
        actions: [
          { label: 'Pendaftaran PPDB Online', url: 'ppdb.html', icon: 'fi fi-rr-document-signed' },
          { label: 'Syarat Berkas Pendaftaran', url: 'ppdb.html#jadwal-linimasa', icon: 'fi fi-rr-clip' },
          { label: 'Biaya SPP & Pendidikan', url: 'login.html', icon: 'fi fi-rr-coins' },
          { label: 'Lokasi & Kontak Yayasan', url: 'kontak.html', icon: 'fi fi-rr-marker' }
        ]
      };
    }

    // -----------------------------------------------------------------------
    // FILTER 1: DETEKSI STRICT OUT-OF-SCOPE
    // Pertanyaan politik, pemilu, coding, film, game, kalkulus, resep, dll
    // WAJIB dijawab persis: "Saya tidak bisa menjawab pertanyaan Anda."
    // -----------------------------------------------------------------------
    const hasForbiddenWord = OUT_OF_SCOPE_REGEX.test(trimmed) || OUT_OF_SCOPE_REGEX.test(normalized);
    const hasSchoolAnchor = IN_SCOPE_ANCHOR_REGEX.test(trimmed) || IN_SCOPE_ANCHOR_REGEX.test(normalized);

    if (hasForbiddenWord) {
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
        category: 'ppdb',
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
        } else if (pattern.includes(' ') && normalized.includes(pattern)) {
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

      // 3. Tambahan prioritas bawaan jika ada kecocokan
      if (score > 0) {
        score += (entry.priority || 0) * 0.1;
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = entry;
      }
    }

    // Ambang batas kecocokan minimum (threshold)
    const MATCH_THRESHOLD = 7.0;

    if (bestMatch && highestScore >= MATCH_THRESHOLD) {
      return {
        type: 'answer',
        category: bestMatch.category || 'umum',
        intent: bestMatch.intent,
        title: bestMatch.title,
        answer: bestMatch.buildAnswer(ctx),
        actions: resolveActions(bestMatch.actions)
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
        actions: resolveActions([
          { label: 'Hubungi WhatsApp Resmi', isWhatsApp: true, icon: 'fi fi-brands-whatsapp', isExternal: true },
          { label: 'Lihat Menu Kontak & Alamat', url: 'kontak.html', icon: 'fi fi-rr-marker' }
        ])
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
  // 8. DAFTAR PERTANYAAN REKOMENDASI CEPAT & ADAPTIF (QUICK CHIPS)
  // =========================================================================
  const SUGGESTED_QUESTIONS = [
    'Bagaimana cara mendaftar?',
    'Apa saja persyaratan PPDB?',
    'Panduan alur pendaftaran PPDB',
    'Berapa biaya SPP pendidikan?',
    'Di mana lokasi yayasan & sekolah?',
    'Apa saja program pendidikannya?',
    'Bagaimana cara cek status PPDB?',
    'Kapan hari & jam operasional sekolah?'
  ];

  // Rekomendasi kontekstual adaptif berdasarkan topik percakapan terakhir
  function getContextualSuggestions(lastIntent) {
    if (!lastIntent) return SUGGESTED_QUESTIONS.slice(0, 3);

    switch (lastIntent) {
      case 'ppdb_register':
      case 'ppdb_form_help':
        return [
          'Apa saja persyaratan PPDB?',
          'Kapan PPDB buka?',
          'Bagaimana cara cek status PPDB?'
        ];
      case 'ppdb_requirements':
        return [
          'Bagaimana cara mendaftar?',
          'Berapa biaya SPP pendidikan?',
          'Di mana lokasi yayasan & sekolah?'
        ];
      case 'ppdb_schedule':
        return [
          'Bagaimana cara mendaftar?',
          'Apa saja persyaratan PPDB?',
          'Panduan alur pendaftaran PPDB'
        ];
      case 'ppdb_after_accepted':
      case 'ppdb_activation':
        return [
          'Bagaimana login Portal Siswa?',
          'Berapa biaya SPP pendidikan?',
          'Di mana lokasi yayasan & sekolah?'
        ];
      case 'tuition_spp':
        return [
          'Bagaimana cara mendaftar?',
          'Bagaimana login Portal Siswa?',
          'Hubungi panitia via WhatsApp'
        ];
      case 'school_location':
      case 'school_contacts':
        return [
          'Kapan hari & jam operasional sekolah?',
          'Bagaimana cara mendaftar?',
          'Apa saja program pendidikannya?'
        ];
      case 'bot_identity':
      case 'user_identity':
      case 'greeting':
      case 'courtesy_help':
        return [
          'Bagaimana cara mendaftar?',
          'Apa saja persyaratan PPDB?',
          'Di mana lokasi yayasan & sekolah?'
        ];
      default:
        return SUGGESTED_QUESTIONS.slice(0, 3);
    }
  }

  return {
    findAnswer: findAnswer,
    normalizeText: normalizeText,
    getPpdbGuideSteps: function () {
      return PPDB_11_STEPS;
    },
    getSuggestedQuestions: function () {
      return SUGGESTED_QUESTIONS;
    },
    getContextualSuggestions: getContextualSuggestions,
    getDynamicContext: getDynamicContext,
    isOutOfScope: function (query) {
      const res = findAnswer(query);
      return res.type === 'out_of_scope';
    }
  };
});
