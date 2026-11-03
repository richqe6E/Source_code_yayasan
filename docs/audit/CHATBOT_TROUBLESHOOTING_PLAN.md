# Chatbot Troubleshooting & Action Plan
**Rencana Perbaikan Fitur Asisten Informasi SIYAYASAN**
*Tanggal Rencana: 3 November 2026*

---

## 1. Daftar Temuan Masalah & Akar Penyebab

| No | Gejala Permasalahan | Akar Penyebab Teknis | Tingkat Keparahan |
|---|---|---|---|
| **1** | Chatbot selalu menjawab *"Maaf, sistem sedang memuat basis pengetahuan..."* untuk semua pertanyaan | Uncaught `ReferenceError: ctx is not defined` pada baris 460, 596, dan 732 di `qa-knowledge-base.js` yang menyebabkan skrip berhenti seketika dan `window.SiyQaEngine` gagal terbentuk (`undefined`). | **CRITICAL (Blocker)** |
| **2** | Rekomendasi Pertanyaan (*Quick Chips*) tidak muncul / kosong di antarmuka chat | `renderQuickChips()` di `qa-assistant.js` langsung `return` karena mendeteksi `!window.SiyQaEngine`. | **HIGH** |
| **3** | Pertanyaan sapaan seperti *"hallop"*, *"halo"*, *"assalamu'alaikum"* belum dikenali | Belum ada entri intent `greeting` pada `KNOWLEDGE_BASE`. | **MEDIUM** |
| **4** | Pertanyaan jadwal spesifik *"Kapan PPDB buka?"* belum memiliki intent mandiri | Frasa pembukaan pendaftaran belum diakomodasi secara khusus dengan status periode dinamis (`open` vs `closed`). | **MEDIUM** |
| **5** | Pesan kesalahan menyamarkan crash permanen sebagai loading sementara | `handleUserSubmit()` di `qa-assistant.js` tidak memiliki state manajemen yang membedakan status `LOADING`, `READY`, dan `ERROR`. | **LOW (Peningkatan DX/UX)** |

---

## 2. Rincian Rekomendasi Solusi Teknis

### Solusi 1: Restrukturisasi Resolusi URL Aksi Dinamis (`qa-knowledge-base.js`)
* **Masalah:** Baris 460, 596, dan 732 mengevaluasi `ctx.waHelpUrl` pada lingkup statis array `KNOWLEDGE_BASE`.
* **Rekomendasi:**
  Ubah properti `actions` dari array statis menjadi fungsi `buildActions: function(ctx)` atau gunakan placeholder `url: '{waHelpUrl}'` yang di-resolve secara dinamis pada `findAnswer(rawQuery)`.
  *Contoh Implementasi:*
  ```javascript
  // Menggunakan buildActions(ctx) atau resolusi otomatis di findAnswer:
  actions: [
    { label: 'Lihat Lokasi Sekretariat Yayasan', url: 'kontak.html', icon: 'fi fi-rr-marker' },
    { label: 'Hubungi Panitia via WhatsApp', isWhatsApp: true, icon: 'fi fi-brands-whatsapp', isExternal: true }
  ]
  ```
  Pada `findAnswer()`, jika `act.isWhatsApp === true`, otomatis isi URL dengan `ctx.waHelpUrl`. Ini 100% aman dan bebas dari crash lingkup variabel!

### Solusi 2: Tambahkan Intent Sapaan & Salam (*Greeting / Sapaan*)
* **Rekomendasi:**
  Tambahkan entri intent `greeting` pada `KNOWLEDGE_BASE`:
  ```javascript
  {
    id: 'general_greeting',
    category: 'general',
    intent: 'greeting',
    title: 'Salam & Bantuan Asisten',
    patterns: [
      'halo', 'hallop', 'hallo', 'hai', 'hi', 'assalamu alaikum', 'assalamualaikum',
      'selamat pagi', 'selamat siang', 'selamat sore', 'selamat malam', 'apa kabar'
    ],
    keywords: ['halo', 'hai', 'assalamualaikum', 'salam', 'pagi', 'siang', 'sore'],
    priority: 20,
    buildAnswer: function(ctx) {
      return `Assalamu'alaikum! Halo, selamat datang di layanan *Asisten Informasi ${ctx.schoolName}*.\n\nAda yang dapat saya bantu mengenai pendaftaran PPDB, persyaratan berkas, program tahfidz/PAUD, atau informasi yayasan hari ini?`;
    },
    actions: [
      { label: 'Buka Halaman PPDB', url: 'ppdb.html', icon: 'fi fi-rr-document-signed' },
      { label: 'Panduan Alur 11 Langkah', action: 'open_ppdb_guide', icon: 'fi fi-rr-workflow' }
    ]
  }
  ```

### Solusi 3: Tambahkan Intent Khusus Jadwal Pembukaan PPDB (*"kapan PPDB buka?"*)
* **Rekomendasi:**
  Tambahkan entri `ppdb_opening_schedule`:
  ```javascript
  {
    id: 'ppdb_opening_schedule',
    category: 'ppdb',
    intent: 'ppdb_schedule',
    title: 'Jadwal Pembukaan PPDB Online',
    patterns: [
      'kapan ppdb buka', 'kapan ppdb dibuka', 'kapan pendaftaran dibuka', 'kapan mulai daftar',
      'jadwal buka ppdb', 'tanggal berapa buka', 'apakah ppdb sudah buka'
    ],
    keywords: ['kapan', 'buka', 'dibuka', 'jadwal', 'mulai', 'tanggal', 'periode', 'gelombang'],
    priority: 16,
    buildAnswer: function(ctx) {
      // Baca status periode aktif dari cache/context
      return `*Jadwal Pembukaan PPDB TA ${ctx.activeYear}* di ${ctx.schoolName}:\n\n` +
        `• Periode: *${ctx.ppdbPeriodName}*\n` +
        `• Status Pendaftaran: *${ctx.regDates}*\n\n` +
        `Anda dapat memantau linimasa lengkap verifikasi, pengumuman hasil seleksi, dan daftar ulang pada halaman Jadwal PPDB.`;
    },
    actions: [
      { label: 'Lihat Linimasa Lengkap PPDB', url: 'ppdb.html#jadwal-linimasa', icon: 'fi fi-rr-calendar' },
      { label: 'Buka Formulir Pendaftaran', url: 'ppdb.html#formulir-pendaftaran', icon: 'fi fi-rr-document-signed' }
    ]
  }
  ```

### Solusi 4: Perjelas Status Penanganan Error & Diagnostik di `qa-assistant.js`
* Bedakan status engine:
  - `STATUS_READY`: Engine siap, pertanyaan diproses normal.
  - `STATUS_INITIALIZING`: Sedang memuat modul skrip.
  - `STATUS_ERROR`: Terjadi kendala teknis saat memuat modul (berikan opsi klik tombol muat ulang atau tautan WhatsApp alternatif).

---

## 3. Urutan Pengerjaan Perbaikan (*Action Sequence*)

1. **Langkah 1: Perbaiki `frontend/public/js/qa-knowledge-base.js`**
   - Hapus pemanggilan `ctx.waHelpUrl` di properti statis baris 460, 596, 732 dan gantikan dengan flag `isWhatsApp: true` atau resolusi dinamis pada `findAnswer()`.
   - Tambahkan intent `greeting` untuk sapaan ("hallop", "halo", "hai", dll).
   - Tambahkan intent `ppdb_schedule` untuk pertanyaan pembukaan PPDB ("kapan ppdb buka").
2. **Langkah 2: Perbaiki `frontend/public/js/qa-assistant.js`**
   - Pastikan resolusi action button mendukung flag `isWhatsApp` menuju `ctx.waHelpUrl`.
   - Perbaiki mekanisme `renderQuickChips()` agar me-retry rendering begitu engine selesai terinisialisasi.
3. **Langkah 3: Jalankan Automated Browser Test Suite**
   - Eksekusi pengujian browser headless Edge pada `tests/test-qa-assistant.html` untuk memverifikasi bahwa:
     - `window.SiyQaEngine` terdefinisi sempurna.
     - "hallop" mendapatkan balasan sapaan resmi.
     - "Kapan PPDB buka?" mendapatkan informasi jadwal dan status pendaftaran.
     - "Bagaimana cara mendaftar?" mendapatkan panduan alur pendaftaran.
     - "Apa saja persyaratan PPDB?" mendapatkan rincian dokumen (pasfoto, akta, KK).
     - Pertanyaan di luar topik ("siapa presiden amerika?") tetap ditolak dengan tegas.
4. **Langkah 4: Verifikasi Tampilan Lintas Halaman Publik**
   - Uji pada `index.html` dan `ppdb.html` untuk memastikan chip rekomendasi muncul dan floating stack tersusun rapi.

---

## 4. Analisis Risiko Perubahan

* **Tingkat Risiko:** **SANGAT RENDAH (Very Low Risk)**.
* **Alasan:**
  1. Perbaikan bersifat terlokalisir hanya pada berkas internal asisten (`qa-knowledge-base.js` dan `qa-assistant.js`).
  2. Tidak ada perubahan struktur database, tabel, maupun RLS.
  3. Tidak menyentuh logika formulir PPDB online, validasi input pendaftaran, maupun sistem pembayaran SPP.
  4. Seluruh fitur yang sudah ada di halaman publik website dijamin tetap berfungsi 100% normal.

