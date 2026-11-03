# SIYAYASAN — COMPREHENSIVE TESTING FINDINGS & DEFECT AUDIT REPORT
**Sistem Informasi Terpadu Yayasan At Tarbiyyah Wijaya Kusuma Samarinda**
*Dokumentasi Hasil Pengujian End-to-End, Investigasi Defek, dan Rekomendasi Remediasi*

---

## 1. Ringkasan Eksekutif Hasil Pengujian

Pengujian sistem secara menyeluruh (*Comprehensive End-to-End Testing*) telah dilakukan terhadap ekosistem SIYAYASAN yang mencakup 4 pilar operasional:
1. **Website Publik** (Halaman profil, agenda, berita, pengumuman, galeri, kontak, PPDB, status tracking, login, dan asisten informasi Q/A).
2. **Sistem PPDB Online** (Formulir pendaftaran, pengunggahan dokumen berkas, validasi payload, dan pelacakan status calon siswa).
3. **Portal Admin Yayasan / Tata Usaha** (Otentikasi kredensial `admin@yayasan.sch.id`, master data guru & kelas, verifikasi berkas pendaftaran, konversi pendaftar ke siswa aktif dengan penomoran NIS, penagihan SPP, pelaporan, dan audit trail).
4. **Portal Siswa** (Otentikasi menggunakan NIS dan kata sandi awal/tanggal lahir, verifikasi biodata, dokumen persyaratan, tagihan SPP, dan konfirmasi pembayaran).

### Matriks Klasifikasi Temuan (Defect Severity Matrix)
| ID Defek | Kategori | Tingkat Keparahan (Severity) | Prioritas Perbaikan | Status |
| :--- | :--- | :--- | :--- | :--- |
| **BUG-001** | Asset / UI Routing | Low | P3 - Minor | Teridentifikasi |
| **BUG-002** | Input Validation / Data Integrity | **High** | **P1 - Critical** | Teridentifikasi |
| **BUG-003** | SEO / Semantic HTML & Aksesibilitas | Low | P3 - Minor | Teridentifikasi |
| **BUG-004** | Concurrency / Asynchronous Race Condition | **High** | **P1 - Critical** | Teridentifikasi |
| **BUG-005** | Security / Credential Storage Exposure | **Medium** | **P2 - Major** | Teridentifikasi |
| **BUG-006** | Data Normalization / UI Filter Inconsistency | Medium | P2 - Major | Teridentifikasi |
| **BUG-007** | Logging Schema Consistency / Field Naming | Low | P3 - Minor | Teridentifikasi |

---

## 2. Rincian Temuan Defek & Analisis Akar Masalah

---

### BUG-001: Path Fallback Logo pada `login.html` Menghasilkan HTTP 404
- **ID Defek**: `BUG-001`
- **Komponen Terdampak**: `frontend/public/login.html` (Baris 24)
- **Tingkat Keparahan**: Low
- **Prioritas**: P3 (Minor)
- **Lapisan Sistem**: Frontend UI / Static Assets

#### Deskripsi
Pada tag logo utama di halaman `login.html`, atribut fallback gambar menggunakan `onerror="this.src='public/images/logo.png'"`. Ketika aplikasi dijalankan baik pada live server (Vercel) maupun server lokal (`scripts/serve.ps1`), direktori `public` dipetakan sebagai *root web context* (`/`), bukan subdirektori. Akibatnya, jika file gambar utama gagal dimuat, handler error meminta path `/public/images/logo.png` yang mengembalikan respon HTTP 404 Not Found.

#### Langkah Reproduksi
1. Buka browser dan arahkan ke `http://localhost:8080/login.html` (atau live domain).
2. Periksa elemen `<img>` logo:
   ```html
   <img src="images/logo.png" alt="Logo Yayasan" class="w-16 h-16 object-contain" onerror="this.src='public/images/logo.png'">
   ```
3. Simulasikan kegagalan gambar utama atau akses langsung `http://localhost:8080/public/images/logo.png`.
4. Browser mencatat kegagalan: `GET http://localhost:8080/public/images/logo.png 404 (Not Found)`.

#### Dampak Operasional
Tampilan logo yayasan dapat menjadi *broken image* jika terjadi sedikit gangguan caching atau path gambar awal, mengurangi kredibilitas dan estetika antarmuka portal login resmi.

#### Rekomendasi Remediasi
Ubah fallback pada atribut `onerror` agar mengarah ke path relatif absolut yang valid:
```html
onerror="this.src='images/logo.png'; this.onerror=null;"
```
atau menggunakan inline SVG placeholder yang mandiri tanpa dependensi file eksternal.

---

### BUG-002: Ketiadaan Validasi Field Wajib pada `apiCall('ppdb', 'submit')`
- **ID Defek**: `BUG-002`
- **Komponen Terdampak**: `frontend/shared/js/api.js` (Baris 2442–2535) & `frontend/public/ppdb.html`
- **Tingkat Keparahan**: **High**
- **Prioritas**: **P1 (Critical)**
- **Lapisan Sistem**: API Router & Data Validation Layer

#### Deskripsi
Ketika fungsi `apiCall('ppdb', 'submit', params)` dipanggil dengan objek kosong `{}` atau data formulir yang tidak lengkap, sistem backend Supabase REST API tidak menolak permintaan tersebut dengan kode error validasi. Sebaliknya, kode `api.js` secara otomatis mengisi nilai default string:
```javascript
const studentName = params.student_name || params.child_name || params.full_name || params.nama || 'Calon Siswa';
const parentName = params.parent_name || params.father_name || params.mother_name || 'Orang Tua';
const birthDate = params.birth_date || params.student_birth_date || '2021-01-01';
const level = params.level || (params.form_type === 'tpq' ? 'TPQ Pagi' : (params.form_type === 'tahfidz' ? 'Tahfidz Pra PTPT' : 'KB Ulinnuha (PAUD)'));
```
Sistem kemudian secara otomatis menerbitkan Nomor Registrasi acak (contoh: `REG-2026-7233`), membuat record registrasi baru di tabel `ppdb_registrations`, membuat user pendaftar di tabel `users`, dan membuat profil di tabel `students`.

#### Bukti Pengujian Nyata
Pengujian simulasi `tests/simulate-ppdb.ps1` mengirimkan payload kosong `{}`:
- **Hasil**: Sistem merespons `{ success: true, registration_number: 'REG-2026-7233' }`.
- **Database**: Ditemukan baris nyata pada Supabase dengan nama `'Calon Siswa'`, orang tua `'Orang Tua'`, jenjang `'KB Ulinnuha (PAUD)'`.

#### Dampak Operasional
1. **Pencemaran Database (Data Pollution)**: Form PPDB rentan terhadap *bot submission* atau pengiriman formulir kosong yang membebani database operasional yayasan dengan ribuan data sampah.
2. **Kekacauan Kuota PPDB**: Setiap submit kosong langsung dihitung sebagai pendaftar masuk, mengacaukan statistik penerimaan dan rekapitulasi kuota sekolah.
3. **Penerbitan Akun Palsu**: Akun pendaftar dan siswa dibuat secara cuma-cuma tanpa verifikasi identitas (NIK/Nama).

#### Rekomendasi Remediasi
Tambahkan blok validasi ketat (*Fail-Fast Schema Guard*) di baris awal handler `action === 'submitPublic' || action === 'submit'` sebelum proses pembuatan ID dan penyimpanan ke Supabase:
```javascript
const requiredFields = [
  { field: params.student_name || params.full_name, label: 'Nama lengkap calon siswa' },
  { field: params.parent_name || params.father_name, label: 'Nama orang tua / wali' },
  { field: params.phone || params.parent_phone, label: 'Nomor WhatsApp / telepon' },
  { field: params.birth_date || params.student_birth_date, label: 'Tanggal lahir' },
  { field: params.nik, label: 'Nomor Induk Kependudukan (NIK)' }
];
const missing = requiredFields.filter(f => !f.field || String(f.field).trim() === '');
if (missing.length > 0) {
  return {
    success: false,
    message: `Pendaftaran tidak dapat diproses. Mohon lengkapi: ${missing.map(m => m.label).join(', ')}.`
  };
}
```

---

### BUG-003: Ketidakberadaan Elemen Semantic `<h1>` pada Halaman Publik Tertentu
- **ID Defek**: `BUG-003`
- **Komponen Terdampak**: `frontend/public/profil.html`, `agenda.html`, `berita.html`, `pengumuman.html`, `galeri.html`, `kontak.html`
- **Tingkat Keparahan**: Low
- **Prioritas**: P3 (Minor)
- **Lapisan Sistem**: Frontend Public Website / Semantic HTML & Accessibility

#### Deskripsi
Berdasarkan audit otomatis DOM melalui `tests/audit-public-pages.ps1`, 6 dari 10 halaman publik tidak memiliki tag judul tingkat satu (`<h1>`). Halaman-halaman tersebut menggunakan tag `<h2>` atau kelas styling utilitas Tailwind CSS (`text-3xl font-bold`) pada elemen `<div>` atau `<span>` untuk judul hero section, tanpa tag semantik `<h1>`.

#### Bukti Pengujian Nyata
Output audit DOM:
- `index.html`: Memiliki `<h1>` (`Selamat Datang di Portal Resmi Yayasan...`)
- `profil.html`: `<h1>` = `N/A`
- `agenda.html`: `<h1>` = `N/A`
- `berita.html`: `<h1>` = `N/A`
- `pengumuman.html`: `<h1>` = `N/A`
- `galeri.html`: `<h1>` = `N/A`
- `kontak.html`: `<h1>` = `N/A`

#### Dampak Operasional
1. **Penalti SEO**: Mesin pencari (Google, Bing) mengandalkan hierarki heading `<h1>` untuk memahami topik utama halaman institusi.
2. **Aksesibilitas (WCAG 2.1)**: Pembaca layar (*screen reader*) tunanetra kehilangan navigasi heading level 1 untuk langsung melompat ke konten inti.

#### Rekomendasi Remediasi
Ganti elemen judul hero section di masing-masing file HTML dari `<h2 class="text-3xl font-bold...">` atau `<div>` menjadi `<h1 class="text-3xl font-bold...">` dengan mempertahankan styling visual yang sama.

---

### BUG-004: Race Condition Asinkron pada Eksekusi `payments.submit` dan `payments.verify`
- **ID Defek**: `BUG-004`
- **Komponen Terdampak**: `frontend/shared/js/api.js` (Baris 2255–2276)
- **Tingkat Keparahan**: **High**
- **Prioritas**: **P1 (Critical)**
- **Lapisan Sistem**: Financial Billing Module / Supabase Concurrency

#### Deskripsi
Pada fungsi `apiCall('payments', 'submit')`, setelah baris insert pembayaran ke tabel `payments` berhasil dijalankan, pembaruan status tagihan pada tabel `invoices` dieksekusi secara asinkron tanpa kata kunci `await`:
```javascript
// frontend/shared/js/api.js baris 2257-2259
if (params.invoice_id) {
  supabaseRest(`invoices?id=eq.${encodeURIComponent(params.invoice_id)}`, 'PATCH', { status: 'menunggu_verifikasi' }).catch(() => {});
}
```
Ketika alur operasional berlangsung cepat (misalnya otomatisasi penagihan atau verifikasi instan oleh Admin TU sesaat setelah pembayaran diajukan), aksi `apiCall('payments', 'verify')` dieksekusi dan mengubah status invoice menjadi `paid`. Namun, *promise* dari `submit` yang berjalan di latar belakang dan belum selesai dieksekusi baru tiba di Supabase setelahnya, sehingga menimpa (*overwrite*) status invoice kembali menjadi `'menunggu_verifikasi'`.

#### Bukti Pengujian Nyata
Pada database Supabase untuk transaksi simulasi `INV-820774`:
- Tabel `payments` (`PAY-1793673820854`):
  * `status`: `'verified'`
  * `verified_by`: `'Administrator Yayasan'`
  * `verified_at`: `2026-11-03T02:43:40.874Z`
  * `submitted_at`: `2026-11-03T02:43:56.530Z`
- Tabel `invoices` (`INV-820774`):
  * `status`: `'menunggu_verifikasi'` (Tertinggal dan tidak berubah menjadi `paid`!)
  * `paid_at`: `null`

#### Dampak Operasional
1. **Ketidaksesuaian Pembukuan Keuangan**: Tagihan siswa tercatat belum lunas (*menunggu verifikasi*) padahal bukti pembayaran telah disetujui resmi oleh Tata Usaha.
2. **Kuitansi Tertahan**: Siswa tidak dapat mengunduh bukti lunas resmi di Portal Siswa karena status tagihan masih menggantung.

#### Rekomendasi Remediasi
Gunakan kata kunci `await` sebelum mengembalikan respon `submit`:
```javascript
if (params.invoice_id) {
  await supabaseRest(`invoices?id=eq.${encodeURIComponent(params.invoice_id)}`, 'PATCH', { status: 'menunggu_verifikasi' }).catch(() => {});
}
```
Serta pada `verify`, pastikan pengecekan kondisi agar tidak dapat ditimpa oleh status yang lebih rendah.

---

### BUG-005: Kebocoran Kredensial Akun pada Kolom `notes` Registrasi PPDB
- **ID Defek**: `BUG-005`
- **Komponen Terdampak**: `frontend/shared/js/api.js` (Baris 2481–2493) & Database `ppdb_registrations`
- **Tingkat Keparahan**: **Medium**
- **Prioritas**: **P2 (Major)**
- **Lapisan Sistem**: Security / Data Privacy (PII Protection)

#### Deskripsi
Pada proses pengajuan PPDB, sistem berusaha membersihkan kata sandi akun dari catatan pendaftaran melalui:
```javascript
if (parsedNotes.account && parsedNotes.account.password) {
  delete parsedNotes.account.password;
}
```
Namun, jika formulir mengirimkan objek dengan format `account.initial_password` atau field `account_password`, sanitasi tersebut gagal mendeteksi properti tersebut. Akibatnya, string JSON lengkap yang berisi `"account":{"initial_password":"Password123"}` dan `"account_password":"..."` tersimpan secara terbuka (*plaintext*) di kolom teks `notes` pada tabel `ppdb_registrations`.

#### Bukti Pengujian Nyata
Query langsung terhadap baris `REG-1793673254202` di Supabase:
```json
{
  "notes": "{\"previous_school\":\"TK Aisyiyah 1 Samarinda\",\"emergency_contact\":\"081299997777\",\"account\":{\"initial_password\":\"Password123\"}, ...}"
}
```

#### Dampak Operasional
Admin atau pihak yang memiliki akses baca ke tabel `ppdb_registrations` atau tampilan catatan formulir dapat melihat kata sandi awal pengguna secara terbuka, melanggar prinsip kepatuhan privasi data (*data confidentiality*).

#### Rekomendasi Remediasi
Terapkan sanitasi mendalam (*deep recursive key scrubber*) yang menghapus segala properti dengan nama yang mengandung `password`, `pass`, `token`, atau `secret` pada seluruh metadata sebelum diubah menjadi format JSON teks:
```javascript
function stripSensitiveKeys(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const sensitiveRegex = /password|secret|pin|token/i;
  for (const k of Object.keys(obj)) {
    if (sensitiveRegex.test(k)) {
      delete obj[k];
    } else if (typeof obj[k] === 'object') {
      stripSensitiveKeys(obj[k]);
    }
  }
  return obj;
}
```

---

### BUG-006: Inkonsistensi Penamaan Jenjang Pendidikan pada Filter Modal Konversi Siswa
- **ID Defek**: `BUG-006`
- **Komponen Terdampak**: `frontend/portal/admin/ppdb.html` & `frontend/portal/admin/classes.html`
- **Tingkat Keparahan**: Medium
- **Prioritas**: P2 (Major)
- **Lapisan Sistem**: Data Normalization / Admin Portal UX

#### Deskripsi
Terdapat perbedaan representasi string nama jenjang antar modul:
- Modul Formulir Publik PPDB: Menyimpan level sebagai `'TPQ Pagi'`, `'KB Ulinnuha (PAUD)'`, `'Tahfidz Pra PTPT'`.
- Modul Kelas Admin: Menyimpan field `level` sebagai `'TPQ'`, `'PAUD'`, `'TK_A'`, `'TK_B'`.
Meskipun file `ppdb.html` telah memiliki normalisasi regex adaptif (`normTarget`), apabila admin membuat kelas baru dengan nama bebas (contoh: `'Kelas Al-Qur'an 1'`), modal konversi pendaftar ke siswa aktif dapat menampilkan dropdown kelas yang kosong atau tidak mencocokkan jenjang secara otomatis jika kata kunci jenjang tidak eksplisit.

#### Dampak Operasional
Admin Tata Usaha harus secara manual memilih kelas lain atau bingung ketika kelas tujuan yang baru dibuat tidak langsung muncul pada filter rekomendasi modal konversi.

#### Rekomendasi Remediasi
Gunakan kamus referensi baku (*canonical enum master*) untuk jenjang pendidikan di database yayasan:
`['KB', 'TK_A', 'TK_B', 'TPQ_PAGI', 'TPQ_SORE', 'TAHFIDZ']` dan gunakan mapping kode seragam baik di formulir pendaftaran maupun pembuatan kelas.

---

### BUG-007: Nama Kolom Catatan Audit Trail `details` vs Proyeksi `description`
- **ID Defek**: `BUG-007`
- **Komponen Terdampak**: `frontend/shared/js/api.js` (`recordActivityLog`) & `frontend/portal/admin/logs.html`
- **Tingkat Keparahan**: Low
- **Prioritas**: P3 (Minor)
- **Lapisan Sistem**: Database Schema / Activity Log Visualization

#### Deskripsi
Fungsi `recordActivityLog` menyimpan teks deskripsi aktivitas ke dalam kolom database PostgreSQL bernama `details`. Namun, pada beberapa modul visualisasi tabel dan pelaporan, skrip pembaca mencoba membaca properti `log.description` terlebih dahulu sebelum memeriksa `log.details`. Apabila kolom dialiaskan tanpa fallback, tabel log dapat menampilkan kolom deskripsi yang kosong.

#### Bukti Pengujian Nyata
Query tabel `activity_logs` dengan `Format-Table action, module, description` menghasilkan nilai kosong pada kolom `description`, sedangkan query pada kolom `details` berisi teks lengkap:
`"Aktivasi calon siswa PPDB [SIMULASI] Muhammad Fahri Ramadhan ke siswa aktif (NIS: 2026001, Kelas: [SIMULASI] TPQ Al-Hikmah Pagi)"`.

#### Rekomendasi Remediasi
Pastikan fungsi normalisasi `normalizeApiResponse` atau handler `logs.list` di `api.js` selalu melakukan *dual-aliasing*:
```javascript
log.description = log.details || log.description || '';
log.details = log.description;
```

---

## 3. Matriks Rekomendasi Perbaikan Sesuai Prioritas

| Prioritas | ID Defek | Tindakan yang Direkomendasikan | Tingkat Risiko Operasional jika Diabaikan |
| :--- | :--- | :--- | :--- |
| **P1 (Harus Segera)** | **BUG-002** | Pasang validasi field wajib di `api.js` untuk `ppdb.submit` | Database dibanjiri record sampah & kuota PPDB tidak akurat |
| **P1 (Harus Segera)** | **BUG-004** | Tambahkan `await` pada update invoice di `payments.submit` | Tagihan siswa tetap "menunggu verifikasi" meskipun sudah disetujui TU |
| **P2 (Penting)** | **BUG-005** | Implementasikan pembersihan kata sandi rekursif pada `notes` | Pelanggaran kerahasiaan kata sandi akun calon siswa |
| **P2 (Penting)** | **BUG-006** | Seragamkan enum jenjang pendidikan antar PPDB dan Master Kelas | Kesalahan penempatan kelas bagi siswa baru yang telah diterima |
| **P3 (Penyempurnaan)** | **BUG-001** | Perbaiki path fallback logo pada `login.html` | Logo broken image saat error loading awal |
| **P3 (Penyempurnaan)** | **BUG-003** | Tambahkan tag `<h1>` semantik pada 6 halaman publik | Skor SEO dan keramahan aksesibilitas screen reader rendah |
| **P3 (Penyempurnaan)** | **BUG-007** | Lakukan aliasing ganda `details` dan `description` di modul log | Tampilan log kosong pada tabel yang mengacu ke kolom `description` |

---
*Laporan ini disusun secara objektif berdasarkan bukti eksekusi langsung pada browser Microsoft Edge Headless, penelusuran basis data Supabase PostgreSQL, dan simulasi alur operasional live.*

