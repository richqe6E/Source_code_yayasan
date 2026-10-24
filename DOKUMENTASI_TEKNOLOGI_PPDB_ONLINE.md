# DOKUMENTASI LENGKAP ARSITEKTUR & TEKNOLOGI PPDB ONLINE
## Yayasan At Tarbiyyah Wijaya Kusuma Samarinda

> **Dokumen Resmi Arsitektur Teknis Sistem**  
> **Terakhir Diperbarui:** 24 Oktober 2026  
> **Ruang Lingkup:** Ekosistem PPDB Online (Halaman Publik, Pelacak Status, Portal Admin, API & Database)  
> **Status Sistem:** Produksi Aktif (*Live on Edge*)

---

## DAFTAR ISI
1. [Ringkasan Eksekutif & Filosofi Desain](#1-ringkasan-eksekutif--filosofi-desain)
2. [Arsitektur Global & Infrastruktur Serverless](#2-arsitektur-global--infrastruktur-serverless)
3. [Teknologi Frontend & UI/UX Engine](#3-teknologi-frontend--uiux-engine)
4. [Tampilan Utama Halaman PPDB Publik (`ppdb.html`)](#4-tampilan-utama-halaman-ppdb-publik-ppdbhtml)
5. [Fitur Cek Status Pendaftaran PPDB (`status.html`)](#5-fitur-cek-status-pendaftaran-ppdb-statushtml)
6. [Portal Admin Manajemen PPDB (`portal/admin/ppdb.html`)](#6-portal-admin-manajemen-ppdb-portaladminppdbhtml)
7. [Layer Database, API & Penyimpanan Berkas (`api.js` & Supabase)](#7-layer-database-api--penyimpanan-berkas-apijs--supabase)
8. [Keamanan, Privasi & Ketahanan Jaringan (Reliability)](#8-keamanan-privasi--ketahanan-jaringan-reliability)
9. [Matriks File & Referensi Kode Sumber](#9-matriks-file--referensi-kode-sumber)

---

## 1. Ringkasan Eksekutif & Filosofi Desain

Modul **PPDB Online (Penerimaan Peserta Didik Baru)** Yayasan At Tarbiyyah Wijaya Kusuma Samarinda dirancang untuk mendigitalkan seluruh siklus admisi calon peserta didik baru pada seluruh jenjang pendidikan yayasan:
* **PAUD Terpadu** (Pendidikan Anak Usia Dini)
* **TK A & TK B** (Taman Kanak-Kanak)
* **TPQ** (Taman Pendidikan Al-Qur'an)

### Prinsip Utama Sistem
1. **Ultra-Lightweight & Fast-Loading:** Dibuat tanpa beban framework monolitik berat agar dapat diakses seketika pada ponsel pintar orang tua di jaringan seluler apa pun.
2. **Zero-Slop & Human-Crafted Aesthetic:** Mengikuti standar estetika visual tinggi, bebas dari elemen visual generik AI, bersih, bernuansa akademis islami modern, dan menggunakan hierarki informasi yang teratur.
3. **End-to-End Integrated:** Satu kali pengisian formulir otomatis menghasilkan nomor registrasi, akun login portal calon siswa, penyimpanan arsip dokumen, notifikasi WhatsApp, dan jalur konversi instan menjadi siswa aktif ber-NIS resmi.

---

## 2. Arsitektur Global & Infrastruktur Serverless

Sistem ini mengadopsi pola arsitektur **Jamstack (JavaScript, APIs, Markup)** yang dipadukan dengan **Serverless Backend-as-a-Service (BaaS)**:

```
┌─────────────────────────────────────────────────────────────┐
│                       PENGGUNA / KLIEN                       │
│      Wali Murid (Mobile / Desktop)      Admin & Pengurus    │
└──────────────┬──────────────────────────────────┬───────────┘
               │                                  │
               ▼                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                 VERCEL GLOBAL EDGE NETWORK                  │
│       - Static CDN Assets (HTML5, Vanilla JS, CSS)          │
│       - SSL/TLS Auto-Certificates & HTTP/2 HTTPS            │
│       - GitOps CI/CD Terhubung ke GitHub Repository         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼ (RESTful PostgREST Protocol)
┌─────────────────────────────────────────────────────────────┐
│              BACKEND-AS-A-SERVICE (SUPABASE)                │
│                                                             │
│   ┌──────────────────────────┐  ┌────────────────────────┐  │
│   │   PostgreSQL Database    │  │ Supabase Cloud Storage │  │
│   │ - ppdb_registrations     │  │ - siyayasan-uploads    │  │
│   │ - ppdb_periods           │  │   (Pas Foto, Akta, KK) │  │
│   │ - users (Calon Siswa)    │  └────────────────────────┘  │
│   │ - students & documents   │                              │
│   └──────────────────────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

* **Hosting & CDN:** [Vercel](https://vercel.com) Edge Deployment dengan pipeline otomatis dari cabang `main` GitHub.
* **Database Relasional:** PostgreSQL tangguh di cloud [Supabase](https://supabase.com).
* **Protokol Komunikasi:** RESTful API melalui engine Supabase PostgREST langsung dari klien tanpa membutuhkan backend server Express/Node.js perantara, mengeliminasi titik kegagalan server tunggal (*single point of failure*).
* **Penyimpanan Berkas Fisik:** Supabase Cloud Storage Bucket (`siyayasan-uploads`) dengan proteksi link publik terenkripsi.

---

## 3. Teknologi Frontend & UI/UX Engine

| Layer Teknologi | Spesifikasi / Library | Fungsi dalam PPDB Online |
| :--- | :--- | :--- |
| **Bahasa Utama** | **HTML5 Semantic & Vanilla JavaScript (ES6+)** | Seluruh logika aplikasi (validasi form, state wizard, kalkulasi tanggal, request API) dieksekusi secara native di browser. Menghasilkan konsumsi RAM sangat rendah di HP wali murid. |
| **CSS Utility Framework** | **Tailwind CSS v3 (JIT Engine)** | Menghasilkan utility layout responsif, micro-interactions, modal dialog, flexbox/grid layout, dan palet warna resmi yayasan (`brand-*` dan `primary-*`). |
| **Tipografi Antarmuka** | **Plus Jakarta Sans** (Google Fonts) | Tipografi sans-serif modern yang dirancang khusus untuk kenyamanan membaca di layar kecil dan keterbacaan teks formal. |
| **Tipografi Data Teknis** | **JetBrains Mono** (Google Fonts) | Tipografi monospaced khusus untuk menampilkan nomor registrasi unik (`REG-2026-XXXX`), kode NIS, dan kredensial akun agar angka nol (`0`) dan huruf `O` tidak membingungkan pengguna. |
| **Ikonografi Vektor** | **Flaticon UIcons (Solid & Rounded SVG)** | Memberikan petunjuk visual yang jelas untuk tombol aksi, indikator kelengkapan dokumen, dan navigasi tab. |
| **Mesin Kompresi Gambar** | **HTML5 Canvas API & FileReader** | Mengompresi foto kamera HP berukuran 5MB–15MB menjadi JPEG berkualitas tinggi berukuran ~40KB–60KB langsung di browser sebelum proses kirim. |
| **Physics & Animasi** | **IntersectionObserver & Cubic-Bezier Smooth Scroll** | Gulir layar halus alami (`cubic-bezier(0.16, 1, 0.3, 1)`) dengan scroll-padding terkalibrasi untuk navigasi formulir bertingkat yang nyaman. |
| **Anti-Flicker Script** | **Zero-FOUC Pre-Hydration (Local Storage)** | Menghilangkan kedipan layout (*Flash of Unstyled Content*) saat mengecek status pendaftaran atau periode aktif. |

---

## 4. Tampilan Utama Halaman PPDB Publik (`ppdb.html`)

Halaman utama pendaftaran calon santri dan siswa baru berada pada file:  
👉 [`frontend/public/ppdb.html`](file:///d:/Source_code_yayasan/frontend/public/ppdb.html)

### Fitur & Komponen Teknis:

#### A. Wizard Formulir Multi-Tahap (5-Step Stepper)
Formulir dirancang dalam bentuk wizard bertahap agar wali murid tidak merasa kewalahan:
1. **Langkah 1 – Penentuan Jenjang:**  
   Pilihan jenjang pendidikan formal dan non-formal (PAUD Terpadu, TK A / TK B, atau TPQ) dilengkapi panduan usia dan kurikulum singkat.
2. **Langkah 2 – Biodata Calon Peserta Didik:**  
   Pengisian nama lengkap anak, nama panggilan, NIK anak (16 digit), jenis kelamin, tempat lahir, dan tanggal lahir.
3. **Langkah 3 – Data Orang Tua / Wali:**  
   Pengisian nama ayah, nama ibu, nomor WhatsApp aktif (tervalidasi), alamat email orang tua, dan alamat tempat tinggal lengkap.
4. **Langkah 4 – Unggah Berkas Persyaratan:**  
   Pengunggahan 3 dokumen utama:
   * **Pas Foto Resmi Anak** (ukuran 3x4)
   * **Foto / Scan Akta Kelahiran**
   * **Foto / Scan Kartu Keluarga (KK)**
5. **Langkah 5 – Review, Pratinjau & Konfirmasi:**  
   Ringkasan komprehensif data yang telah diinput sebelum data secara permanen diajukan ke sistem yayasan.

#### B. Engine Kompresi Gambar Otomatis di Sisi Klien
```javascript
// Mekanisme kompresi foto kamera di sisi klien (Canvas Engine)
function compressImage(file, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
```
* Mengubah foto kamera berukuran besar (5MB+) menjadi ~40KB tanpa penurunan kualitas visual yang signifikan.
* Menjamin kelancaran pengiriman berkas di area dengan koneksi internet terbatas.

#### C. Sinkronisasi Status Buka/Tutup Gelombang
* Script di halaman publik secara otomatis melakukan query ke tabel `ppdb_periods`.
* Jika status gelombang bernilai `closed`, formulir input akan disembunyikan secara dinamis dan digantikan oleh kartu pemberitahuan resmi bahwa pendaftaran telah ditutup atau belum dibuka.

---

## 5. Fitur Cek Status Pendaftaran PPDB (`status.html`)

Halaman pelacak status pendaftaran publik berada pada file:  
👉 [`frontend/public/ppdb/status.html`](file:///d:/Source_code_yayasan/frontend/public/ppdb/status.html)

### Fitur & Komponen Teknis:

1. **Pencarian Real-Time Nomor Registrasi:**
   * Wali murid memasukkan nomor registrasi resmi (format: `REG-YYYY-XXXX`).
   * Menggunakan PostgREST query dengan sanitasi input untuk mencegah manipulasi query parameter.
2. **Visual Stepper & Status Badge:**
   * **Pending (Menunggu Verifikasi):** Berkas pendaftaran telah masuk dan sedang dalam antrean verifikasi panitia.
   * **Approved (Berkas Terverifikasi):** Berkas dinyatakan sah dan lengkap; calon peserta didik dijadwalkan untuk observasi/wawancara.
   * **Converted (Diterima & Resmi Jadi Siswa):** Calon siswa telah menyelesaikan administrasi, terbit Nomor Induk Siswa (NIS), dan penempatan kelas telah dibuat.
   * **Rejected (Perlu Perbaikan / Ditolak):** Berkas tidak memenuhi kriteria atau perlu diunggah ulang.
3. **Penyaringan Keamanan Data Sensitif (`sanitizeOfficialNotes`):**
   * Catatan internal admin dan payload form (seperti password akun portal, NIK orang tua, atau catatan internal panitia) secara ketat dibersihkan agar tidak tampak di halaman publik pelacak status.
4. **Deep-Link WhatsApp Bantuan:**
   * Jika calon santri membutuhkan bantuan lanjutan, terdapat tombol bantuan yang otomatis menghubungkan pendaftar ke nomor WhatsApp panitia PPDB dengan teks salam dan nomor pendaftaran yang otomatis terisi.

---

## 6. Portal Admin Manajemen PPDB (`portal/admin/ppdb.html`)

Halaman operasional panitia admisi dan pimpinan yayasan berada pada file:  
👉 [`frontend/portal/admin/ppdb.html`](file:///d:/Source_code_yayasan/frontend/portal/admin/ppdb.html)

### Fitur & Komponen Teknis:

1. **Banner Kontrol Periode & Jadwal Gelombang:**
   * **Sakelar 1-Klik Buka/Tutup:** Mengubah status pendaftaran di seluruh website seketika.
   * **Manajemen Linimasa:** Mengatur tanggal pendaftaran online, verifikasi berkas, pengumuman seleksi, dan daftar ulang.
2. **Sistem Filter Tab Cepat:**
   * Tab terbagi menjadi: *Semua*, *Pending*, *Approved*, *Converted (Siswa Aktif)*, dan *Rejected*.
   * Dilengkapi pencarian nama anak, jenjang (PAUD, TK, TPQ), dan nomor pendaftaran.
3. **Modal Penampil Dokumen (Document Inspector):**
   * Panitia dapat mengklik Pas Foto, Akta Kelahiran, dan KK untuk ditampilkan dalam modal popup resolusi penuh tanpa perlu mengunduh file secara manual ke penyimpanan komputer lokal.
4. **Otomatisasi Konversi Siswa Aktif (*Convert to Student*):**
   * Mengubah status pendaftar menjadi peserta didik definitif dengan 1 klik:
     1. Sistem menerbitkan **Nomor Induk Siswa (NIS)** resmi secara otomatis.
     2. Membuat baris data di tabel induk siswa (`students`).
     3. Menyinkronkan seluruh berkas (foto, akta, KK) ke tabel arsip siswa (`student_documents`).
     4. Menghubungkan akun portal calon siswa ke akun siswa aktif.
5. **Generator Pesan Notifikasi WhatsApp Otomatis:**
   * Admin dapat menekan tombol kontak WhatsApp yang secara otomatis merangkai pesan resmi berkop yayasan berisi ucapan selamat, nomor registrasi, instruksi daftar ulang, atau jadwal wawancara langsung ke nomor orang tua.

---

## 7. Layer Database, API & Penyimpanan Berkas (`api.js` & Supabase)

Seluruh logika perantara data PPDB dikelola secara terpusat di:  
👉 [`frontend/shared/js/api.js`](file:///d:/Source_code_yayasan/frontend/shared/js/api.js) (Modul `ppdb`)

### Skema Tabel Database (Supabase PostgreSQL):

```sql
-- 1. Tabel Registrasi PPDB
CREATE TABLE ppdb_registrations (
    id VARCHAR(64) PRIMARY KEY,
    registration_number VARCHAR(32) UNIQUE NOT NULL,
    student_name VARCHAR(128) NOT NULL,
    form_type VARCHAR(16) NOT NULL, -- 'paud' / 'tpq'
    level VARCHAR(32) NOT NULL,      -- 'PAUD', 'TK A', 'TK B', 'TPQ'
    gender VARCHAR(2) NOT NULL,      -- 'L' / 'P'
    birth_place VARCHAR(64),
    birth_date DATE,
    nik VARCHAR(20),
    parent_name VARCHAR(128),
    father_name VARCHAR(128),
    mother_name VARCHAR(128),
    parent_phone VARCHAR(32),
    parent_email VARCHAR(128),
    address TEXT,
    status VARCHAR(24) DEFAULT 'pending', -- 'pending', 'approved', 'converted', 'rejected'
    photo_url TEXT,
    birth_certificate_url TEXT,
    family_card_url TEXT,
    form_metadata JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Pengaturan Gelombang & Jadwal PPDB
CREATE TABLE ppdb_periods (
    id VARCHAR(32) PRIMARY KEY,
    status VARCHAR(16) DEFAULT 'open', -- 'open' / 'closed'
    academic_year VARCHAR(16) NOT NULL, -- '2026/2027'
    online_registration_dates VARCHAR(64),
    verification_dates VARCHAR(64),
    announcement_dates VARCHAR(64),
    re_registration_dates VARCHAR(64),
    notes TEXT,
    announcement_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Integrasi Lintas Entitas Saat Pendaftaran Dikirim (`submitPublic`):
Saat calon pendaftar menekan tombol kirim formulir di `ppdb.html`, sistem melakukan operasi berantai:
1. **Unggah Berkas ke Supabase Storage:** Berkas dikirim ke bucket `siyayasan-uploads` di folder `ppdb_photo`, `ppdb_akta`, dan `ppdb_kk`.
2. **Insert Data ke `ppdb_registrations`:** Menyimpan biodata lengkap beserta URL berkas.
3. **Pembuatan Akun Portal Calon Siswa di `users`:** Membuat akun dengan `role: 'calon_siswa'` sehingga orang tua dapat langsung login ke portal yayasan.
4. **Inisialisasi Profil Awal di `students`:** Menciptakan entitas siswa berstatus `calon_siswa`.
5. **Sinkronisasi ke `student_documents`:** Berkas langsung diindeks sebagai dokumen resmi kesiswaan.
6. **Cadangan Local Storage:** Data pendaftaran disalin ke `localStorage` browser pengguna sebagai cadangan keamanan data offline.

---

## 8. Keamanan, Privasi & Ketahanan Jaringan (Reliability)

1. **Role-Based Access Control (RBAC):**
   * Hak akses portal admin PPDB diproteksi secara ketat melalui [`auth.js`](file:///d:/Source_code_yayasan/frontend/shared/js/auth.js). Hanya pengguna berstatus `admin` atau `superadmin` yang dapat membuka dan mengelola data pendaftar.
2. **Pencegahan Kebocoran Data (Data Sanitization):**
   * Halaman publik `status.html` menjalankan fungsi `sanitizeOfficialNotes` dan pembersihan string JSON mentah untuk menjamin data rahasia seperti NIK, nomor KK, dan password tidak dapat dibaca oleh pihak ketiga.
3. **Pencegahan Injeksi & XSS:**
   * Seluruh nilai string yang dimasukkan pendaftar dirender menggunakan `escapeHtml()` sebelum ditempatkan ke DOM antarmuka.
4. **Dual-Storage Resilience (Tahan Gangguan Jaringan):**
   * Apabila request ke database Supabase mengalami gangguan jaringan sesaat di sisi wali murid, sistem `api.js` secara otomatis menyimpan data ke antrean lokal (`siy_local_ppdb_regs`) sehingga data formulir tidak hilang dan dapat disinkronkan kembali saat koneksi pulih.

---

## 9. Matriks File & Referensi Kode Sumber

| No | Modul / Komponen | Path File Sumber | Tipe & Peran |
| :---: | :--- | :--- | :--- |
| 1 | **Formulir Pendaftaran Publik** | [`frontend/public/ppdb.html`](file:///d:/Source_code_yayasan/frontend/public/ppdb.html) | Halaman antarmuka pendaftaran online (5-Step Wizard) |
| 2 | **Cek Status Pendaftaran** | [`frontend/public/ppdb/status.html`](file:///d:/Source_code_yayasan/frontend/public/ppdb/status.html) | Halaman pelacak status registrasi & verifikasi dokumen |
| 3 | **Portal Admin PPDB** | [`frontend/portal/admin/ppdb.html`](file:///d:/Source_code_yayasan/frontend/portal/admin/ppdb.html) | Dasbor pengelolaan berkas, buka/tutup gelombang & konversi siswa |
| 4 | **Logika API & Adapter Data** | [`frontend/shared/js/api.js`](file:///d:/Source_code_yayasan/frontend/shared/js/api.js) | Engine adapter PostgREST modul `ppdb` (Lines 1930–2380) |
| 5 | **Konfigurasi Supabase** | [`frontend/shared/js/supabase-config.js`](file:///d:/Source_code_yayasan/frontend/shared/js/supabase-config.js) | Kredensial client API URL & Public Anon Key |
| 6 | **Autentikasi & Otorisasi** | [`frontend/shared/js/auth.js`](file:///d:/Source_code_yayasan/frontend/shared/js/auth.js) | Pelindung hak akses portal admin & portal siswa |
| 7 | **Shell & Navigasi Publik** | [`frontend/public/js/public-shell.js`](file:///d:/Source_code_yayasan/frontend/public/js/public-shell.js) | Header, footer, floating widget WA, dan smooth scroll |
| 8 | **Styling & Desain Sistem** | [`frontend/public/css/style.css`](file:///d:/Source_code_yayasan/frontend/public/css/style.css) | Aturan CSS global, transisi, animasi scroll reveal, font import |

---
*Dokumentasi ini disusun secara komprehensif sebagai acuan teknis pemeliharaan, pengembangan fitur, dan audit kualitas sistem informasi Yayasan At Tarbiyyah Wijaya Kusuma Samarinda.*

