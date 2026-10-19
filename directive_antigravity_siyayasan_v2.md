# 🛠️ DOKUMEN MASTER EXECUTABLE DIRECTIVE — SIYAYASAN V2 (UNTUK ANTIGRAVITY IDE)

**Proyek:** Sistem Informasi & Portal Resmi Yayasan At Tarbiyyah Wijaya Kusuma Samarinda (SIYAYASAN V2)  
**URL Produksi:** `https://siyayasan-portal.vercel.app/`  
**Repositori Target:** `Source_code_yayasan`  
**Fokus Eksekusi:** Perbaikan Logika Sistem, Sinkronisasi Integrasi Antar-Portal (Publik $\leftrightarrow$ Admin $\leftrightarrow$ Siswa), Penyelesaian Bug Alur Kerja (Input–Output), dan Standarisasi Kode Antarmuka.

> **Instruksi untuk Coding Agent (Antigravity):**  
> Dokumen ini disusun berdasarkan hasil simulasi pengujian fungsional *end-to-end* (Publik $\rightarrow$ Pendaftaran PPDB $\rightarrow$ Validasi & Konversi Admin $\rightarrow$ Cek Status Kelulusan $\rightarrow$ Login & Portal Siswa $\rightarrow$ Siklus Tagihan & Kuitansi SPP $\rightarrow$ Publikasi CMS & Master Data). Eksekusi seluruh bagian di bawah ini secara berurutan dari **Prioritas 1 (Bug Logika & Celah Integrasi Kritis)** hingga **Prioritas 3 (Standarisasi UI/UX & Tipografi Sistem)**. Jangan mengubah data uji coba (*dummy content/images*) di database kecuali yang berkaitan langsung dengan perbaikan logika kode di bawah ini.

## 1. PETA STATUS INTEGRASI SISTEM SAAT INI (HASIL AUDIT END-TO-END)

Tabel berikut merangkum kondisi integrasi seluruh modul berdasarkan pengujian langsung di browser:

| Jalur Integrasi Modul | File Sumber (Input) | File Tujuan (Output) | Status Integrasi | Rincian Temuan Teknis |
| :--- | :--- | :--- | :--- | :--- |
| **1. Pendaftaran PPDB Publik $\rightarrow$ Tabel Validasi Admin** | `ppdb.html` | `admin/ppdb.html` & `ppdb/status.html` | **Berfungsi Baik** | Pendaftaran 5-tahap menghasilkan Nomor Registrasi (`REG-2026-XXXX`) dan langsung masuk ke antrean `Menunggu Verifikasi TU` di `admin/ppdb.html`. |
| **2. Konversi Siswa Admin $\rightarrow$ Halaman Cek Status PPDB** | `admin/ppdb.html` | `ppdb/status.html` | **BUG KRITIS (Properti Mismatch)** | Status berubah menjadi `RESMI TERDAFTAR & AKTIF`, tetapi **angka NIS tidak muncul** (`Telah Diterbitkan` & `NIS Anda ()` kosong) serta tombol menuju Login SIAKAD putih polos tanpa teks. |
| **3. Password PPDB Tahap 3 $\rightarrow$ Konversi Admin $\rightarrow$ Login Siswa** | `ppdb.html` & `admin/ppdb.html` | `login.html` (`js/auth.js`) | **CACAT LOGIKA (Konflik Password)** | Password yang dibuat pendaftar di Tahap 3 `ppdb.html` ditimpa paksa menjadi tanggal lahir (`DDMMYYYY`) saat konversi Admin. Pesan error di `login.html` salah menulis petunjuk `(YYYY-MM-DD)` padahal validator meminta `DDMMYYYY`. |
| **4. Jenjang Pendaftar PPDB $\rightarrow$ Dropdown Rombel Konversi** | `ppdb.html` | `admin/ppdb.html` | **CACAT LOGIKA (Tanpa Filter Jenjang)** | Saat mengonversi pendaftar jenjang `TK A`, dropdown kelas menampilkan seluruh rombel tanpa filter jenjang (opsi pertama adalah `Kelompok Bermain (KB)`), memicu salah penempatan kelas. |
| **5. Biodata Siswa $\leftrightarrow$ Data Siswa Admin** | `siswa/biodata.html` | `admin/students.html` | **Berfungsi Baik** | Perubahan biodata yang disimpan oleh siswa di `siswa/biodata.html` tersinkronisasi dengan modal detail/edit di `admin/students.html`. |
| **6. Upload Dokumen Siswa $\rightarrow$ Pemeriksaan Dokumen Admin** | `siswa/dokumen.html` | `admin/students.html` & `admin/ppdb.html` | **CELAH INTEGRASI (One-Way Dead End)** | Dokumen susulan (Pas Foto, KK, Akta) yang diunggah siswa di `siswa/dokumen.html` tersimpan di sisi siswa, tetapi **tidak memiliki tombol lihat/pratinjau/unduh** di `admin/students.html`. |
| **7. Master Data Guru $\rightarrow$ Dropdown Wali Kelas Rombel** | `admin/teachers.html` | `admin/classes.html` | **CELAH INTEGRASI (Tidak Tersambung)** | Guru baru yang ditambahkan di `admin/teachers.html` tidak muncul pada dropdown **Wali Kelas** saat tambah/edit kelas di `admin/classes.html` (hanya muncul opsi `-`). |
| **8. Kasir SPP Admin $\leftrightarrow$ Tagihan Siswa $\leftrightarrow$ Kuitansi** | `admin/payments.html` | `siswa/pembayaran.html` & `admin/reports.html` | **Berfungsi Baik (Perlu Auto-Invoice Awal)** | Pembuatan tagihan (`INV/2026/XXXX`), unggah bukti bayar oleh siswa, verifikasi `Lunas` oleh Admin, dan cetak kuitansi di kedua portal bekerja penuh. Namun saat siswa baru dikonversi, tagihan bulan pertama belum otomatis dibuat (`Rp 0`). |
| **9. CMS Konten & Pengaturan Web Admin $\rightarrow$ Halaman Publik** | `admin/content.html` & `admin/cms_setting.html` | `index.html`, `berita.html`, `pengumuman.html`, `agenda.html`, `galeri.html`, `kontak.html` | **Berfungsi Baik** | Semua 5 tab di `admin/content.html` (Berita, Pengumuman, Agenda, Galeri, Identitas) dan `admin/cms_setting.html` terhubung langsung ke halaman publik sesuai tipe/kategorinya. |
| **10. Kelola Pengguna, Laporan, Activity Log, & Backup JSON** | `admin/users.html`, `admin/reports.html`, `admin/backup.html` | `login.html` & Ekspor File | **Berfungsi Baik** | Manajemen akun pengguna, rekap laporan keuangan/siswa, pencatatan log aktivitas, dan unduh cadangan `.json` berjalan normal tanpa error. |

## 2. PRIORITAS 1 — PERBAIKAN BUG LOGIKA & CELAH INTEGRASI KRITIS

### 🔧 TUGAS 1.1: Perbaiki Binding Variabel NIS & Tombol Login Blank di `ppdb/status.html`

* **File Target:** `ppdb/status.html` (serta file JS pengelola status PPDB, misalnya `js/status.js` atau script inline di `ppdb/status.html`) dan `admin/ppdb.html`
* **Akar Masalah:**
  1. Saat fungsi konversi siswa (`convertToStudent` / tombol **Convert ke Siswa**) dijalankan di `admin/ppdb.html`, nomor NIS yang digenerate disimpan pada properti `nis` (atau `student_nis` / `nisBaru`), sedangkan template hasil pencarian di `ppdb/status.html` memanggil properti yang berbeda (`applicant.nisn` atau variabel yang bernilai `undefined`), sehingga menghasilkan output `Username: NIS Anda ()`.
  2. Pada kartu/tabel ringkasan status di `ppdb/status.html`, kolom **Nomor Induk Siswa (NIS)** masih menampilkan teks statis `"Telah Diterbitkan"`, bukan angka NIS sebenarnya.
  3. Di sebelah kiri tombol `"Cetak Surat Penerimaan"`, terdapat elemen tombol menuju halaman Login SIAKAD yang menggunakan class `bg-white text-white` (atau `innerText` kosong), sehingga tampak sebagai kotak putih polos tanpa tulisan.
* **Spesifikasi Perbaikan Kode:**
  1. Di `admin/ppdb.html` (saat proses **Convert ke Siswa**): Pastikan ketika objek pendaftar (`ppdb_registrations` / `applicants`) diperbarui di Supabase dan `localStorage`, simpan nomor NIS yang baru diterbitkan secara konsisten ke properti `nis` **dan** `student_nis`, serta simpan nama kelas yang dipilih ke properti `class_name` / `rombel`:
     ```javascript
     // Pastikan saat update data pendaftar pasca-konversi di admin/ppdb.html:
     const generatedNis = String(newStudent.nis);
     const updatedApplicantPayload = {
       status: 'accepted',
       is_converted: true,
       nis: generatedNis,
       student_nis: generatedNis,
       assigned_class: selectedClassName,
       converted_at: new Date().toISOString()
     };
     ```
  2. Di `ppdb/status.html`: Buat resolver variabel `nisSiswa` yang memeriksa semua kemungkinan nama properti (`applicant.nis || applicant.student_nis || applicant.nisBaru || applicant.nisn`), dan jika belum ada di objek pendaftar, cari berdasarkan `reg_number` / `registration_number` pada daftar `students`:
     ```javascript
     function resolveStudentNis(applicant, studentsList = []) {
       if (applicant.nis) return applicant.nis;
       if (applicant.student_nis) return applicant.student_nis;
       if (applicant.nisBaru) return applicant.nisBaru;
       const matchedStudent = studentsList.find(
         s => s.reg_number === applicant.reg_number ||
              s.registration_number === applicant.reg_number ||
              (s.full_name && applicant.full_name && s.full_name.toLowerCase() === applicant.full_name.toLowerCase())
       );
       return matchedStudent?.nis || 'Segera Diterbitkan';
     }
     ```
  3. Di `ppdb/status.html`: Ganti tampilan kolom **Nomor Induk Siswa (NIS)** yang tadinya hardcoded `"Telah Diterbitkan"` dan perbaiki teks panduan login beserta tombol aksi menuju `login.html`:
     ```html
     <!-- Kolom Nomor Induk Siswa pada Kartu Status Diterima -->
     <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
       <span class="block text-xs font-medium text-slate-500 mb-1">Nomor Induk Siswa (NIS)</span>
       <span class="tabular-nums font-semibold text-base text-primary-700">${nisSiswa}</span>
     </div>

     <!-- Panduan Login ke Portal Siswa -->
     <div class="mt-4 p-4 rounded-xl bg-sky-50/80 border border-sky-200 text-slate-700 text-sm space-y-1.5">
       <p class="font-semibold text-slate-900">Panduan Login ke Portal Siswa Mandiri (SIAKAD):</p>
       <p>Username / NIS: <span class="tabular-nums font-semibold text-primary-700">NIS Anda (${nisSiswa})</span></p>
       <p>Password Awal: <span class="tabular-nums font-semibold text-slate-900">Tanggal Lahir format DDMMYYYY</span> (atau password yang Anda buat saat pendaftaran)</p>
     </div>

     <!-- Kelompok Tombol Aksi (Perbaikan Tombol Putih Polos di Kiri Cetak Surat Penerimaan) -->
     <div class="mt-6 flex flex-wrap items-center gap-3">
       <a href="../login.html" class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm shadow-sm active:scale-[0.98] transition-all">
         <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
         </svg>
         <span>Masuk ke Portal Siswa (SIAKAD)</span>
       </a>
       <button type="button" onclick="window.print()" class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-sm shadow-sm active:scale-[0.98] transition-all">
         <span>Cetak Surat Penerimaan</span>
       </button>
     </div>
     ```

### 🔧 TUGAS 1.2: Sinkronkan Logika Password PPDB Tahap 3, Konversi Admin, & Validator `login.html`

* **File Target:** `ppdb.html`, `admin/ppdb.html`, dan `login.html` (serta `js/auth.js`)
* **Akar Masalah:**
  1. Pada `ppdb.html` Tahap 3, pendaftar mengisi field **Password Login Siswa** (misal `123456`).
  2. Saat Admin mengklik **Convert ke Siswa** di `admin/ppdb.html`, password pilihan pendaftar tersebut diabaikan dan diganti paksa menjadi tanggal lahir format `DDMMYYYY` (`12052020`), serta memaksa `must_change_password = true`.
  3. Di `login.html`, ketika siswa gagal login dan muncul pesan error, teks error justru menulis: `"Password salah. Untuk siswa awal, gunakan Tanggal Lahir (YYYY-MM-DD)."` — padahal kode validator memvalidasi format **`DDMMYYYY`** (`12052020`), bukan `YYYY-MM-DD` (`2020-05-12`).
* **Spesifikasi Perbaikan Kode:**
  1. **Pada `admin/ppdb.html` (Fungsi Konversi Siswa) & `login.html` (`js/auth.js`):** Izinkan siswa baru login menggunakan **salah satu** dari:
     * Password yang mereka buat sendiri saat pendaftaran PPDB Tahap 3 (`applicant.password` / `applicant.account_password`), **ATAU**
     * Password default Tanggal Lahir dalam format `DDMMYYYY` (`12052020`) maupun `YYYY-MM-DD` (`2020-05-12`) sebagai *fallback* jika mereka lupa password pendaftaran.
     ```javascript
     // Helper pembentuk format tanggal lahir DDMMYYYY dari string YYYY-MM-DD:
     function formatDobToDDMMYYYY(dobString) {
       if (!dobString) return '';
       const parts = dobString.split('-'); // [YYYY, MM, DD]
       if (parts.length === 3 && parts[0].length === 4) {
         return `${parts[2]}${parts[1]}${parts[0]}`; // DDMMYYYY
       }
       return dobString.replace(/\D/g, '');
     }

     // Saat Convert ke Siswa di admin/ppdb.html:
     const defaultDobPass = formatDobToDDMMYYYY(applicant.birth_date || applicant.tanggal_lahir);
     const customPpdbPass = applicant.password || applicant.student_password || '';
     const studentRecord = {
       ...otherFields,
       nis: generatedNis,
       password: customPpdbPass || defaultDobPass,
       fallback_dob_password: defaultDobPass,
       birth_date: applicant.birth_date || applicant.tanggal_lahir,
       // Jika pendaftar sudah membuat password sendiri di PPDB Tahap 3, tidak perlu dipaksa ganti password kecuali masih memakai default tanggal lahir
       must_change_password: !Boolean(customPpdbPass)
     };
     ```
  2. **Pada `login.html` / `js/auth.js` (Validator Login Siswa):**
     * Terima kecocokan jika input password cocok dengan `student.password`, `student.fallback_dob_password` (`DDMMYYYY`), atau `student.birth_date` (`YYYY-MM-DD`).
     * Perbaiki teks pesan error agar akurat dan tidak menyesatkan:
       ```javascript
       const errorMsg = "Password salah. Gunakan password yang Anda buat saat pendaftaran PPDB, atau gunakan Tanggal Lahir format DDMMYYYY (contoh: 12052020).";
       ```

### 🔧 TUGAS 1.3: Filter Otomatis Dropdown Rombel/Kelas Berdasarkan Jenjang Pendaftar (`admin/ppdb.html`)

* **File Target:** `admin/ppdb.html`
* **Akar Masalah:**
  * Saat Admin menekan tombol **Convert ke Siswa** pada pendaftar berjenjang `TK A`, elemen `<select>` kelas menampilkan seluruh kelas dari semua jenjang (`KB`, `TK A`, `TK B`, `TPQ`) dengan pilihan pertama jatuh pada `Kelompok Bermain (KB) Ceria sekali`. Akibatnya, siswa `TK A` masuk ke rombel `KB`.
* **Spesifikasi Perbaikan Kode:**
  1. Saat modal **Convert ke Siswa** dibuka untuk objek `applicant`, filter array `classes` agar mengutamakan kelas yang memiliki jenjang (`level` / `jenjang` / `unit`) yang cocok dengan `applicant.jenjang` (misal `PAUD`/`KB`, `TK A`, `TK B`, `TPQ`).
  2. Urutkan sehingga kelas yang sesuai jenjang berada di urutan paling atas dan terpilih secara otomatis (`selected`), sementara kelas dari jenjang lain dikelompokkan di dalam `<optgroup label="Jenjang Lainnya">` atau diberi penanda jelas:
     ```javascript
     function renderClassOptionsForApplicant(applicant, allClasses) {
       const targetJenjang = (applicant.jenjang || applicant.program || '').toUpperCase().trim();
       const matchingClasses = allClasses.filter(c => {
         const classLevel = (c.jenjang || c.level || c.name || '').toUpperCase();
         if (targetJenjang.includes('PAUD') || targetJenjang.includes('KB')) {
           return classLevel.includes('PAUD') || classLevel.includes('KB') || classLevel.includes('KELOMPOK BERMAIN');
         }
         if (targetJenjang.includes('TK A')) return classLevel.includes('TK A') || classLevel.includes('TKA');
         if (targetJenjang.includes('TK B')) return classLevel.includes('TK B') || classLevel.includes('TKB');
         if (targetJenjang.includes('TK')) return classLevel.includes('TK');
         if (targetJenjang.includes('TPQ')) return classLevel.includes('TPQ');
         return false;
       });

       const otherClasses = allClasses.filter(c => !matchingClasses.includes(c));
       let html = '';

       if (matchingClasses.length > 0) {
         html += `<optgroup label="Sesuai Jenjang Pendaftar (${applicant.jenjang})">`;
         matchingClasses.forEach((cls, idx) => {
           html += `<option value="${cls.id || cls.name}" ${idx === 0 ? 'selected' : ''}>${cls.name} (${cls.jenjang || applicant.jenjang})</option>`;
         });
         html += `</optgroup>`;
       }

       if (otherClasses.length > 0) {
         html += `<optgroup label="Kelas / Jenjang Lainnya">`;
         otherClasses.forEach(cls => {
           html += `<option value="${cls.id || cls.name}">${cls.name} (${cls.jenjang || '-'})</option>`;
         });
         html += `</optgroup>`;
       }

       return html;
     }
     ```

### 🔧 TUGAS 1.4: Integrasikan Berkas Dokumen Siswa (`siswa/dokumen.html`) ke Panel Admin (`admin/students.html`)

* **File Target:** `siswa/dokumen.html` dan `admin/students.html`
* **Akar Masalah:**
  * Siswa dapat mengunggah/memperbarui Pas Foto, Kartu Keluarga (KK), dan Akta Kelahiran di `siswa/dokumen.html`. Namun ketika Admin membuka `admin/students.html`, tidak ada kolom status berkas maupun tombol untuk melihat/mengunduh dokumen yang telah diunggah oleh siswa tersebut.
* **Spesifikasi Perbaikan Kode:**
  1. **Di `siswa/dokumen.html`:** Pastikan setiap kali siswa berhasil mengunggah berkas (`foto`, `kk`, `akta`, `kip`), URL atau DataURI berkas tersebut tidak hanya disimpan ke state lokal halaman dokumen, tetapi juga diperbarui langsung ke objek siswa yang bersangkutan di tabel `students` (Supabase & `localStorage`) pada properti `documents`:
     ```javascript
     // Struktur penyimpanan dokumen pada record siswa:
     student.documents = {
       ...(student.documents || {}),
       pas_foto: uploadedFotoUrl,
       kartu_keluarga: uploadedKkUrl,
       akta_kelahiran: uploadedAktaUrl,
       updated_at: new Date().toISOString()
     };
     ```
  2. **Di `admin/students.html`:**
     * Tambahkan indikator badge kelengkapan berkas (`Lengkap` / `Belum Lengkap`) pada tabel daftar siswa.
     * Di dalam **Modal Detail / Edit Data Siswa** pada `admin/students.html`, tambahkan seksi **"Berkas Dokumen Siswa (Pas Foto, KK, Akta Kelahiran)"** yang menampilkan pratinjau/tautan buka berkas untuk setiap dokumen yang sudah diunggah siswa dari `siswa/dokumen.html` maupun saat pendaftaran PPDB:
       ```html
       <div class="mt-6 pt-5 border-t border-slate-200">
         <h4 class="text-sm font-bold text-slate-900 mb-3">Berkas Dokumen Santri / Siswa</h4>
         <div class="grid grid-cols-1 sm:grid-cols-3 gap-3" id="admin-student-documents-preview">
           <!-- Dirender dinamis oleh JS dari student.documents / applicant.documents -->
         </div>
       </div>
       ```

### 🔧 TUGAS 1.5: Integrasikan Data Guru (`admin/teachers.html`) ke Dropdown Wali Kelas (`admin/classes.html`)

* **File Target:** `admin/classes.html`
* **Akar Masalah:**
  * Pada modal **Tambah / Edit Rombel & Kelas** di `admin/classes.html`, elemen `<select>` untuk memilih **Wali Kelas** tidak mengambil daftar guru dari tabel `teachers` (`admin/teachers.html`), sehingga hanya menampilkan opsi `-` walaupun Admin sudah menambahkan guru baru.
* **Spesifikasi Perbaikan Kode:**
  1. Pada fungsi inisialisasi halaman `admin/classes.html` dan saat fungsi `openClassModal()` dipanggil, ambil daftar guru aktif dari Supabase (`teachers`) dan/atau `localStorage` (`siyayasan_teachers` / `teachers`).
  2. Populasikan elemen `<select id="class-homeroom-teacher">` (atau selector Wali Kelas yang digunakan) dengan nama lengkap beserta NIP/gelar guru:
     ```javascript
     async function populateTeacherDropdown(selectedTeacherName = '') {
       const selectEl = document.querySelector('#wali-kelas, #homeroom-teacher, select[name="wali_kelas"], select[name="homeroom_teacher"]');
       if (!selectEl) return;

       const teachers = await fetchTeachersList(); // Ambil dari Supabase tabel teachers + fallback localStorage
       let optionsHtml = `<option value="">-- Pilih Wali Kelas --</option>`;

       teachers.forEach(teacher => {
         const teacherName = teacher.full_name || teacher.name || teacher.nama;
         if (teacherName) {
           const isSelected = teacherName === selectedTeacherName ? 'selected' : '';
           optionsHtml += `<option value="${teacherName}" ${isSelected}>${teacherName}${teacher.nip ? ` (NIP: ${teacher.nip})` : ''}</option>`;
         }
       });

       selectEl.innerHTML = optionsHtml;
     }
     ```

## 3. PRIORITAS 2 — PENYEMPURNAAN OTOMATISASI ALUR KERJA (WORKFLOW POLISH)

### 🔧 TUGAS 2.1: Otomatisasi Penerbitan Tagihan SPP Bulan Pertama Saat Konversi Siswa Baru (`admin/ppdb.html`)

* **File Target:** `admin/ppdb.html` dan `siswa/pembayaran.html`
* **Masalah Alur:**
  * Ketika siswa baru selesai dikonversi oleh Admin dan pertama kali login ke Portal Siswa (`siswa/pembayaran.html`), halaman tagihan SPP masih kosong (`Belum ada tagihan SPP yang diterbitkan oleh Tata Usaha` / `Rp 0`), sehingga orang tua harus menunggu Admin membuat tagihan manual di `admin/payments.html`.
* **Spesifikasi Perbaikan Kode:**
  1. Tambahkan checkbox yang tercentang otomatis (`checked`) pada modal **Convert ke Siswa** di `admin/ppdb.html`:
     ```html
     <label class="flex items-start gap-2.5 p-3 rounded-xl bg-sky-50 border border-sky-200 cursor-pointer mt-3">
       <input type="checkbox" id="auto-create-first-spp" checked class="mt-0.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500">
       <span class="text-xs text-slate-700">
         <strong class="font-semibold text-slate-900 block">Terbitkan Otomatis Tagihan SPP Bulan Pertama</strong>
         Buat tagihan SPP awal sebesar <span class="tabular-nums font-semibold">Rp 150.000</span> agar langsung muncul di Portal Siswa.
       </span>
     </label>
     ```
  2. Jika checkbox `#auto-create-first-spp` aktif saat tombol konfirmasi ditekan, buat otomatis 1 objek tagihan SPP (`INV/${currentYear}/${random4Digits}`) untuk `nis` siswa baru tersebut di tabel tagihan (`payments` / `spp_invoices`) dengan status `unpaid` (`Belum Bayar`).

### 🔧 TUGAS 2.2: Sinkronkan Konstanta Rentang Usia Jenjang di Seluruh Halaman (`index.html`, `profil.html`, `ppdb.html`)

* **File Target:** `index.html`, `profil.html`, `ppdb.html`
* **Masalah Logika Informasi:**
  * Rentang usia ketiga jenjang pendidikan berbeda-beda di setiap halaman (`index.html` menulis TPQ `5-12 Tahun`, `profil.html` menulis TPQ `4-12 Tahun` dan menggabung PAUD-TK `2-6 Tahun`, sedangkan `ppdb.html` membagi PAUD `2-4 Tahun`, TK A `4-5 Tahun`, TK B `5-6 Tahun`, dan TPQ).
* **Spesifikasi Perbaikan Kode:**
  * Seragamkan teks rentang usia di ketiga halaman tersebut menjadi satu standar resmi yayasan:
    * **PAUD Terpadu (Kelompok Bermain):** Usia `2–4 Tahun`
    * **TK At Tarbiyyah:** Usia `4–6 Tahun` (TK A: `4–5 Tahun`, TK B: `5–6 Tahun`)
    * **TPQ At Tarbiyyah:** Usia `6–12 Tahun` (atau `5–12 Tahun` — pastikan angka yang sama persis dipakai di `index.html`, `profil.html`, dan `ppdb.html`).

## 4. PRIORITAS 3 — KEPATUHAN BRAND GUIDELINES & STANDARISASI KODE UI/UX

### 🔧 TUGAS 3.1: Pembersihan Elemen Anti-AI Slop & Kicker Badge Pil (`profil.html` & `index.html`)

* **File Target:** `profil.html` dan `index.html`
* **Aksi Spesifik:**
  1. Pada `profil.html`, hapus kartu/badge klaim statis yang belum resmi seperti **`"14+ Tahun Pengabdian"`** dan **`"PERJALANAN SEJAK 2010"`** yang menggunakan bentuk kapsul `rounded-full`.
  2. Ganti seluruh *kicker badge* berbentuk pil (`rounded-full`) di atas judul seksi pada `index.html` dan `profil.html` menjadi teks *overline* tipografi formal tanpa border kapsul:
     ```html
     <span class="block text-xs font-bold uppercase tracking-widest text-primary-600 mb-2">
       Profil & Sejarah Yayasan
     </span>
     ```

### 🔧 TUGAS 3.2: Penyeragaman Tipografi (`text-justify`, `tabular-nums font-semibold`, & `active:scale-[0.98]`)

* **File Target:** Seluruh halaman publik (`index.html`, `profil.html`, `berita.html`, `pengumuman.html`, `agenda.html`, `kontak.html`, `ppdb/status.html`) serta template tabel di `admin/*.html` dan `siswa/*.html`
* **Aksi Spesifik:**
  1. **Paragraf Narasi (`text-justify`):** Tambahkan class `text-justify leading-relaxed` pada seluruh paragraf narasi sejarah dan deskripsi program di `profil.html` serta sub-deskripsi kartu jenjang di `index.html`.
  2. **Angka, Tanggal, Nomor Kontak, NIS, No. Registrasi, & Nominal Uang (`tabular-nums font-semibold`):**
     * Tambahkan class `tabular-nums font-semibold` pada:
       * Nomor telepon/WhatsApp di Navbar, Footer, dan `kontak.html` (`0813-4714-2829`).
       * Tanggal berita dan agenda pada template JS di `berita.html`, `pengumuman.html`, `agenda.html`, dan `index.html`.
       * Nomor Registrasi (`REG-2026-XXXX`) dan NIS (`2026XXXX`) di `ppdb/status.html`, `admin/ppdb.html`, `admin/students.html`, dan `siswa/dashboard.html`.
       * Seluruh nominal Rupiah (`Rp ...`) dan Nomor Invoice (`INV/2026/XXXX`) pada kartu ringkasan dan tabel di `admin/dashboard.html`, `admin/payments.html`, `admin/reports.html`, dan `siswa/pembayaran.html`.
  3. **Efek Tactile Press (`active:scale-[0.98]`):**
     * Tambahkan class `active:scale-[0.98]` pada tombol `SIAKAD` di pojok kanan atas Navbar pada seluruh halaman publik.

## 5. DAFTAR PERIKSA VERIFIKASI AKHIR (POST-IMPLEMENTATION CHECKLIST)

Setelah **Antigravity** selesai menerapkan seluruh perubahan di atas, jalankan pengujian singkat berikut sebelum melakukan *git push* ke produksi Vercel:

1. **Tes Cek Status PPDB (`ppdb/status.html`):** Masukkan `REG-2026-3971` $\rightarrow$ Pastikan angka NIS `20265184` tampil jelas di kolom tabel maupun di dalam tanda kurung `NIS Anda (20265184)`, dan pastikan tombol **"Masuk ke Portal Siswa (SIAKAD)"** di sebelah kiri tombol cetak surat terlihat jelas dengan latar biru (`bg-primary-600 text-white`).
2. **Tes Login Siswa (`login.html`):** Pastikan siswa baru dapat login menggunakan password yang dibuat saat PPDB Tahap 3 maupun menggunakan Tanggal Lahir (`DDMMYYYY`), dan pastikan teks bantuan/error menampilkan contoh format `DDMMYYYY` yang benar.
3. **Tes Konversi PPDB ke Rombel (`admin/ppdb.html`):** Klik **Convert ke Siswa** pada pendaftar jenjang `TK A` $\rightarrow$ Pastikan kelas yang terpilih otomatis adalah kelas berjenjang `TK A`, bukan `Kelompok Bermain (KB)`, dan tagihan SPP bulan pertama otomatis diterbitkan.
4. **Tes Integrasi Dokumen Siswa ke Admin (`siswa/dokumen.html` $\rightarrow$ `admin/students.html`):** Buka detail siswa `Ahmad Fauzan Simulasi` di `admin/students.html` $\rightarrow$ Pastikan dokumen Pas Foto dan KK yang diunggah dari Portal Siswa dapat dilihat/dibuka oleh Admin.
5. **Tes Integrasi Guru ke Wali Kelas (`admin/teachers.html` $\rightarrow$ `admin/classes.html`):** Buka modal Tambah/Edit Kelas di `admin/classes.html` $\rightarrow$ Pastikan dropdown **Wali Kelas** menampilkan daftar nama guru dari `admin/teachers.html` (termasuk `Ustadzah Fatimah, S.Pd.`).
