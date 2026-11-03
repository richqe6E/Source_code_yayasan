# Smart Q/A Assistant & PPDB Information Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun fitur Asisten Informasi Interaktif (Rule-Based Smart Q/A Assistant & Interactive PPDB Guide) pada seluruh halaman publik website SIYAYASAN, dengan tombol pemicu mengambang (*floating*) tepat di atas tombol WhatsApp, tanpa ketergantungan API AI eksternal, berbasis Knowledge Base resmi dan sistem pengenalan intent & scope validation yang ketat.

**Architecture:**
- **Knowledge Base & NLP Engine (`qa-knowledge-base.js`)**: Struktur data pengetahuan resmi yayasan, tokenizer, penyaring stopwords, kamus sinonim bahasa Indonesia, pencocok frasa/kata kunci berbobot (*intent classification*), validasi ruang lingkup (*out-of-scope detector*), dan integrasi data dinamis (*CMS/cache hydration*).
- **Interactive UI Controller (`qa-assistant.js`)**: Komponen percakapan modern (header, pesan pembuka, *quick recommendation chips*, bubble chat, typing indicator, kartu interaktif panduan PPDB 11 langkah, input bar dengan tombol Enter/Send, tombol navigasi halaman).
- **Styling & Positioning (`qa-assistant.css`)**: Tata letak fleksibel, dialog melayang desktop & mobile sheet, animasi halus (*smooth transitions*), serta stack vertikal proporsional bersama tombol WhatsApp.
- **Unified Site Chrome Integration (`public-shell.js`)**: Injeksi otomatis tombol dan dependensi pada seluruh halaman publik yang menggunakan `injectSiteChrome()`.

**Tech Stack:** Vanilla JavaScript (ES6+), HTML5, CSS3, Tailwind CSS classes, Flaticon Uicons, LocalStorage / SessionStorage Cache Hydration, Zero External AI Dependencies.

**Spec:** Sesuai instruksi pada user prompt "PUBLIC WEBSITE — SMART Q/A ASSISTANT & PPDB INFORMATION GUIDE" dan diagram arsitektur yang dilampirkan pengguna (`User Input -> Intent Recognition -> (Knowledge Base & Scope Validation) -> Response & Navigation`).

## Global Constraints

- **Zero External AI API:** Tidak boleh menggunakan OpenAI, Gemini API, Claude API, atau layanan AI berbayar eksternal lainnya. Sistem harus 100% lokal, cepat, dan mandiri.
- **Strict Scope Policy:** Pertanyaan di luar topik resmi yayasan (politik, teknologi umum, matematika, hiburan, dll) WAJIB dijawab persis: `"Saya tidak bisa menjawab pertanyaan Anda."`.
- **In-Scope Unhandled Policy:** Pertanyaan seputar yayasan/sekolah yang belum terdaftar di Knowledge Base dijawab: `"Maaf, informasi tersebut belum tersedia dalam sistem. Silakan hubungi pihak yayasan melalui WhatsApp untuk mendapatkan informasi lebih lanjut."` disertai tombol direct WhatsApp resmi yayasan.
- **No Hallucinated Data:** Jangan mengarang tanggal, biaya, alamat, atau kebijakan. Gunakan hanya data resmi dari database/CMS/profil (`Jl. Wijaya Kusuma V-A No. 38 Samarinda`, TPQ Ulinnuha, KB Ulinnuha, WA: `081347142829`).
- **Preserve Existing WhatsApp Button:** Tombol WhatsApp yang sudah ada di kanan bawah layar tidak boleh rusak atau tergeser sembarangan; tombol Q/A harus berada tepat di atasnya dengan jarak proporsional dan tidak bertumpuk di layar desktop maupun ponsel.

## Review Focus

1. **Susunan Vertikal Tombol Melayang**: Tombol Q/A dan tombol WhatsApp harus tersusun vertikal secara rapi tanpa tumpang tindih baik di viewport smartphone (<640px) maupun layar lebar desktop.
2. **Kesesuaian Respons Out-of-Scope**: Uji pertanyaan acak seperti "siapa presiden indonesia?", "cara coding python", "resep mie goreng" harus segera memunculkan string exact `"Saya tidak bisa menjawab pertanyaan Anda."` tanpa jawaban asumsi.
3. **Ketahanan Sinonim & Variasi Kalimat**: Uji variasi pendaftaran ("gimana cara daftar", "saya mau masuk sekolah ini", "bgmn registrasinya", "daftar ppdb") harus konsisten mengenali intent `ppdb_register` dan menampilkan panduan beserta tombol aksi "Buka Halaman PPDB".
4. **Alur 11 Langkah Panduan PPDB**: Pengguna dapat mengakses modul panduan pendaftaran dari tahap 1 s.d. 11 secara interaktif dengan tautan halaman yang valid (`ppdb.html`, `ppdb.html#jadwal-linimasa`, dll).
5. **Keamanan XSS & Input Kosong**: Input whitespace atau tag script `<script>alert(1)</script>` harus di-escape secara aman dan tidak merusak tampilan chat.

---

## File Structure

```
frontend/public/
├── css/
│   └── qa-assistant.css           # Styling widget chat, floating stack, bubble, stepper, dan animasi
├── js/
│   ├── qa-knowledge-base.js       # Database resmi, intent dictionary, stopwords, scope validator, dynamic hydration
│   ├── qa-assistant.js            # UI Widget, chat controller, quick chips, message rendering, accessibility
│   └── public-shell.js            # Koordinasi floating stack (Tombol Q/A tepat di atas tombol WA) & chrome loader
tests/
├── test-qa-assistant.html         # Browser test runner untuk 10 skenario pengujian intent & rendering
└── test-qa-engine.ps1             # PowerShell verification runner untuk validasi keyword & rule logic
```

---

## Tasks

### Task 1: Knowledge Base & Rule-Based Intent Engine

**Files:**
- Create: `frontend/public/js/qa-knowledge-base.js`

**Interfaces:**
- Produces:
  - `window.SiyQaEngine`:
    - `findAnswer(rawQuery: string): Object` -> `{ type: 'answer'|'out_of_scope'|'unhandled_in_scope'|'empty', answer: string, actions?: Array<{ label: string, url: string, icon?: string, isExternal?: boolean }>, followUps?: Array<string>, meta?: Object }`
    - `getPpdbGuideSteps(): Array<{ step: number, title: string, summary: string, detail: string, actionUrl?: string, actionLabel?: string }>`
    - `getSuggestedQuestions(): Array<string>`
    - `isOutOfScope(query: string): boolean`

- [ ] **Step 1: Definisikan Kamus Stopwords, Sinonim, dan Pola Out-of-Scope**
  - Siapkan daftar kata umum yang diabaikan (*stopwords*: "apakah", "bagaimana", "dan", "di", "yang", "mau", "ingin", dll).
  - Siapkan kamus normalisasi slang/singkatan Indonesia: "gimana" -> "bagaimana", "bgmn" -> "bagaimana", "sy" -> "saya", "mo" -> "mau", "brapa" -> "berapa", "kpn" -> "kapan", "daptar" -> "daftar", "skolah" -> "sekolah", "lokasi" -> "alamat".
  - Siapkan daftar kata terlarang *Out-of-Scope* (politik, capres, teknologi/programming, cuaca, selebriti, resep, film, game, matematika, curhat/pribadi).

- [ ] **Step 2: Susun Entri Data Knowledge Base Resmi Yayasan At Tarbiyyah**
  - **Kategori PPDB**:
    - `ppdb_info`: Apa itu PPDB, periode berjalan, jenjang yang dibuka (TPQ & KB Ulinnuha).
    - `ppdb_register`: Cara & alur pendaftaran online, tautan ke formulir online.
    - `ppdb_requirements`: Persyaratan berkas (Pasfoto formal, Akta Kelahiran, KK, batas 5MB, format JPG/PNG/PDF).
    - `ppdb_form_help`: Cara mengisi formulir langkah demi langkah (5 tahap pendaftaran).
    - `ppdb_upload_help`: Cara upload dokumen dan solusi alternatif jika berkas belum ada digitalnya (serahkan fisik saat verifikasi).
    - `ppdb_status`: Cara cek status pendaftaran & seleksi via Nomor Registrasi di `ppdb.html`.
    - `ppdb_verification`: Proses verifikasi administrasi berkas oleh Tata Usaha.
    - `ppdb_announcement`: Jadwal pengumuman hasil seleksi.
    - `ppdb_after_accepted`: Langkah setelah diterima (daftar ulang di Sekretariat).
    - `ppdb_activation`: Proses aktivasi status menjadi siswa aktif.
    - `ppdb_nis_portal`: Penerbitan NIS dan kredensial login Portal Siswa oleh Admin Yayasan.
  - **Kategori Informasi Yayasan & Sekolah**:
    - `yayasan_profile`: Profil resmi Yayasan At Tarbiyyah Wijaya Kusuma Samarinda.
    - `yayasan_vision_mission`: Visi & Misi resmi ("Hafal Al-Qur'an < 9 Tahun, Hafal Tanpa Menghafal").
    - `school_programs`: Program TPQ Ulinnuha (Metode Qiraati, Pra PTPT, PTPT) & KB Ulinnuha (PAUD/PKBM).
    - `school_location`: Alamat Jl. Wijaya Kusuma V-A No. 38, Samarinda Ulu & tautan Google Maps.
    - `school_contacts`: WhatsApp 081347142829, email `info@attarbiyyah-samarinda.sch.id`.
    - `school_facilities`: Fasilitas ruang belajar adem, tenang, sarana mengaji, dan lingkungan islami.
    - `school_leadership`: Pimpinan yayasan (Pembina, Pengawas, Ketua Yayasan/Kepala Sekolah Bpk. Makhrus).
  - **Kategori Akademik & Operasional**:
    - `school_schedule`: Hari masuk sekolah (Senin s/d Sabtu) dan jam belajar (TPQ Pagi & Sore @ 75 Menit).
    - `school_holidays`: Hari libur resmi (Hari Ahad/Minggu dan Hari Libur Nasional).
    - `academic_calendar`: Kalender akademik dan agenda kegiatan yayasan (mengarahkan ke `agenda.html`).
    - `academic_year`: Tahun ajaran aktif (diambil dinamis dari data cache/DB, default 2026/2027).
  - **Kategori Administrasi & Keuangan**:
    - `tuition_spp`: Informasi pembayaran SPP bulanan via Portal Siswa & pencetakan kuitansi resmi.
    - `payment_methods`: Kebijakan konfirmasi dan pembayaran administrasi sekolah.
    - `new_student_admin`: Berkas administrasi siswa baru yang harus diserahkan saat daftar ulang.
  - **Kategori Panduan PPDB Interaktif (11 Tahapan)**:
    - Modul array 11 tahap pendaftaran online dari pengenalan program hingga akun portal siswa.

- [ ] **Step 3: Implementasi Mesin Pencocok Intent (Multi-Keyword Scoring & Intent Classifier)**
  - Normalisasi teks query pengguna.
  - Cek korelasi out-of-scope: jika cocok dengan pola terlarang dan tidak memiliki kata konteks yayasan, return `"Saya tidak bisa menjawab pertanyaan Anda."`.
  - Hitung bobot kemiripan (*similarity score*) berdasarkan kecocokan frasa exact, kata kunci primer (bobot 3), kata kunci sekunder (bobot 1), dan kecocokan kategori.
  - Jika skor tertinggi melampaui batas ambang (*threshold*), kembalikan jawaban resmi beserta tombol navigasi halaman terkait.
  - Jika skor di bawah threshold namun terdeteksi kosa kata umum sekolah/yayasan ("sekolah", "yayasan", "guru", "anak", "biaya", "ustadz", "kelas"), kembalikan:
    `"Maaf, informasi tersebut belum tersedia dalam sistem. Silakan hubungi pihak yayasan melalui WhatsApp untuk mendapatkan informasi lebih lanjut."` disertai tombol WhatsApp.
  - Jika tidak ada indikasi keterkaitan sama sekali dengan yayasan: kembalikan `"Saya tidak bisa menjawab pertanyaan Anda."`.

- [ ] **Step 4: Integrasi Data Dinamis (*Dynamic Data Hydration*)**
  - Baca `sessionStorage.getItem('siyayasan_school_profile')` untuk nomor WhatsApp, alamat, dan nama pimpinan terkini.
  - Baca `localStorage.getItem('siy_ppdb_period_cache')` untuk tahun ajaran aktif, status gelombang pendaftaran, dan tanggal linimasa PPDB terkini.
  - Format jawaban menyematkan nilai aktual tersebut secara otomatis.

---

### Task 2: Engine Verification & Test Suite

**Files:**
- Create: `tests/test-qa-assistant.html`
- Create: `tests/test-qa-engine.ps1`

- [ ] **Step 1: Susun Skenario Uji Komprehensif**
  - Uji Kasus 1: Pertanyaan PPDB variatif ("bagaimana cara daftar?", "mau masuk sekolah ini", "bgmn daftar ppdb", "gmn cara daftar").
  - Uji Kasus 2: Pertanyaan Persyaratan Berkas ("apa saja berkas yang dibutuhkan?", "syarat dokumen ppdb", "perlu pasfoto kah?").
  - Uji Kasus 3: Pertanyaan Lokasi & Kontak ("di mana alamat yayasan?", "lokasi sekolah", "nomor wa admin").
  - Uji Kasus 4: Pertanyaan Hari Libur & Jam Masuk ("kapan sekolah libur?", "hari apa saja masuk sekolah?", "jam berapa belajar?").
  - Uji Kasus 5: Pertanyaan Out-of-Scope ("siapa presiden indonesia?", "resep nasi goreng", "cara belajar python", "film bioskop terbaru").
  - Uji Kasus 6: Pertanyaan In-Scope Tidak Terdaftar ("apakah ada beasiswa kuliah s2 luar negeri?", "apakah ada ekskul robotik internasional?").
  - Uji Kasus 7: Pertanyaan Input Kosong atau Tanda Baca Saja ("   ", "???", "...").
  - Uji Kasus 8: Pertanyaan Alur 11 Langkah PPDB ("bagaimana alur pendaftaran dari awal sampai akhir?").
  - Uji Kasus 9: Pertanyaan SPP & Pembayaran ("bagaimana cara bayar spp?", "info uang spp").
  - Uji Kasus 10: Tautan Navigasi yang Dihasilkan (Pastikan seluruh URL yang dikembalikan mengarah ke halaman yang valid).

- [ ] **Step 2: Buat Test Script Otomatis (PowerShell)**
  - Script mengeksekusi engine logic via Node / JScript / Regex parser dan menguji kesesuaian output terhadap ekspektasi.

- [ ] **Step 3: Jalankan Pengujian dan Verifikasi Seluruh Kasus Lolos (PASS)**

---

### Task 3: Assistant Interface Styling & Responsive Floating Stack

**Files:**
- Create: `frontend/public/css/qa-assistant.css`

- [ ] **Step 1: Desain Stack Mengambang (*Floating Stack Layout*)**
  - Wrapper melayang di kanan bawah: `fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3 pointer-events-auto`.
  - Tombol Q/A ditempatkan di atas tombol WhatsApp secara elegan dan stabil di seluruh perangkat.
  - Tombol Q/A: Berukuran `w-14 h-14 sm:w-16 sm:h-16`, latar belakang gradasi biru-primary (`bg-gradient-to-tr from-sky-600 to-primary-700`), bayangan lembut (`shadow-lg hover:shadow-xl`), ikon asisten robotik/pesan yang ramah, efek hover scale halus, dan badge notifikasi aktif.
  - Tooltip samping desktop: "Asisten Informasi SIYAYASAN".

- [ ] **Step 2: Desain Jendela Percakapan (*Chat Widget Window*)**
  - Mode Desktop: Lebar `390px - 420px`, tinggi `560px - 620px` (maksimal `85vh`), radius melengkung `rounded-2xl` atau `rounded-3xl`, *glassmorphic surface*, bayangan tebal profesional (`shadow-2xl`), border tipis elegan `border-slate-200/80`.
  - Mode Mobile: Menyesuaikan secara responsif di ponsel (layar sentuh nyaman, `inset-x-3 bottom-4 max-h-[88vh]` dengan tombol *close* yang sangat mudah disentuh jempol).
  - Header: Aksen warna identitas yayasan, avatar asisten, status hijau *Online / Siap Membantu*, judul "Asisten Informasi SIYAYASAN", tombol *refresh/clear chat*, tombol *minimize/close*.
  - Body: Scrollbar tersembunyi/halus, padding proporsional, bubble user (primary-600 teks putih rounded-2xl), bubble asisten (latar putih dengan border slate-200/90 rounded-2xl).
  - Chip Rekomendasi Pertanyaan: Tombol kecil bergaya *pill badge* yang bisa diklik untuk bertanya seketika.
  - Komponen Panduan PPDB: Stepper horizontal/vertikal interaktif untuk menampilkan rincian 11 tahapan tanpa memenuhi layar.
  - Input Bar: Field input teks dengan border modern, tombol kirim ikon pesawat, dan status pengetikan (*typing indicator* 3 titik bergelombang).

---

### Task 4: Interactive Assistant UI Controller

**Files:**
- Create: `frontend/public/js/qa-assistant.js`

- [ ] **Step 1: Inisialisasi DOM & Struktur Komponen**
  - Cek idempotensi (`if (window.__SIY_QA_ASSISTANT_LOADED__) return;`).
  - Bangun elemen HTML modal chat dan tombol trigger secara dinamis.
  - Kelola state: `isOpen`, `isTyping`, `messagesHistory`, `activeGuideStep`.

- [ ] **Step 2: Event Listener & Aksesibilitas**
  - Buka/tutup modal saat tombol Q/A ditekan.
  - Tekan tombol `Esc` untuk menutup jendela percakapan.
  - Tekan tombol `Enter` pada input untuk mengirim pesan.
  - Auto-focus pada kolom input saat jendela chat dibuka di desktop.
  - Tangani klik chip rekomendasi pertanyaan agar langsung memproses pertanyaan tersebut.

- [ ] **Step 3: Rendering Percakapan & Interaktivitas**
  - Pesan sambutan awal otomatis saat pertama kali dibuka.
  - Tampilkan efek *typing indicator* (~300-450ms) agar terasa hidup dan natural sebelum menampilkan jawaban.
  - Format teks balasan: mendukung teks tebal (`*teks*`), poin-poin (*bullet points*), dan tombol aksi navigasi.
  - Tombol aksi yang responsif:
    - "Buka Halaman PPDB" -> menuju `ppdb.html`
    - "Lihat Persyaratan Pendaftaran" -> menuju `ppdb.html#jadwal-linimasa`
    - "Cek Status PPDB" -> menuju `ppdb.html` atau membuka dialog cek status
    - "Buka Google Maps" -> menuju tautan lokasi resmi
    - "Hubungi WhatsApp" -> membuka percakapan WhatsApp resmi
    - "Buka Panduan Lengkap PPDB" -> membuka modul interaktif 11 langkah di dalam asisten

- [ ] **Step 4: Modul Panduan PPDB Interaktif (11 Tahap)**
  - Tampilkan opsi membuka panduan pendaftaran online.
  - Sediakan tombol navigasi "Lanjut ke Tahap Berikutnya", "Kembali", dan "Buka Halaman Terkait" pada setiap tahapan 1 s.d. 11.

- [ ] **Step 5: Integrasi Pembersihan & Riwayat Sesi**
  - Sediakan tombol "Bersihkan Percakapan" untuk mengembalikan percakapan ke salam pembuka.
  - Simpan riwayat percakapan sementara di `sessionStorage` sehingga jika pengguna berpindah halaman antar menu website, percakapan tidak langsung hilang.

---

### Task 5: Integrasi Public Shell & Floating Stack Coordination

**Files:**
- Modify: `frontend/public/js/public-shell.js`

- [ ] **Step 1: Koordinasi Injeksi Stack Melayang**
  - Perbarui fungsi penempatan tombol mengambang: gabungkan tombol Asisten Informasi dan tombol WhatsApp ke dalam satu container vertikal terkoordinasi (`#site-floating-actions-container`).
  - Posisi Tombol 1 (Atas): Tombol Asisten Q/A (`#site-floating-qa`).
  - Posisi Tombol 2 (Bawah): Tombol WhatsApp (`#site-floating-wa`).
  - Pastikan jarak antartombol seimbang (`gap-3 sm:gap-3.5`) dan tidak saling bertumpukan.

- [ ] **Step 2: Dynamic Script & CSS Loader**
  - Di dalam `injectSiteChrome()`, otomatis memuat `qa-assistant.css`, `qa-knowledge-base.js`, dan `qa-assistant.js` jika belum tersedia di halaman:
    ```javascript
    ensureQaAssistant(base);
    ```
  - Ini memastikan seluruh halaman website publik (`index.html`, `ppdb.html`, `profil.html`, `kontak.html`, `berita.html`, `pengumuman.html`, `agenda.html`, `galeri.html`) langsung memiliki fitur Asisten Informasi tanpa harus mengedit markup HTML masing-masing satu per satu!

---

### Task 6: End-to-End Verification Across Public Pages

- [ ] **Step 1: Verifikasi Tampilan & Posisi Tombol di Berbagai Halaman**
  - Cek `index.html`, `ppdb.html`, `profil.html`, `kontak.html`.
  - Pastikan tombol Q/A selalu tampil tepat di atas tombol WhatsApp.
  - Uji tampilan responsive pada resolusi smartphone (360px - 414px) dan desktop (>1024px).

- [ ] **Step 2: Validasi 10 Kriteria Pengujian dari User Prompt**
  - 1. Pertanyaan PPDB dengan berbagai susunan kalimat.
  - 2. Pertanyaan yang menggunakan sinonim & singkatan.
  - 3. Pertanyaan lokasi yayasan & sekolah.
  - 4. Pertanyaan hari libur dan jam operasional.
  - 5. Pertanyaan yang membutuhkan tombol navigasi halaman.
  - 6. Pertanyaan belum tersedia dalam Knowledge Base (direspons rujukan WA resmi).
  - 7. Pertanyaan di luar ruang lingkup (direspons persis: "Saya tidak bisa menjawab pertanyaan Anda.").
  - 8. Pertanyaan ambigu / umum.
  - 9. Pertanyaan dengan salah ketik sederhana (*typo resilience*).
  - 10. Pengujian responsivitas input bar, tombol Enter, tombol kirim, dan scrollbar.

- [ ] **Step 3: Git Commit & Dokumentasi Hasil**
  - Commit perubahan dengan deskripsi fitur yang rapi.
  - Push ke remote repository `main`.

