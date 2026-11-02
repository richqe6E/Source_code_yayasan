# LAPORAN AUDIT MENYELURUH SISTEM PELAPORAN & REKAPITULASI
## Portal Admin SIYAYASAN — Yayasan At Tarbiyyah Wijaya Kusuma Samarinda

**Dokumen:** `REPORTING_AUDIT.md`  
**Tanggal Audit:** 2 November 2026  
**Auditor:** Antigravity Senior Technical Systems Auditor  
**Status Audit:** COMPREHENSIVE AUDIT COMPLETE (Analisis Kode & Database Selesai)  
**Tujuan:** Audit menyeluruh integritas data, sumber database, akurasi perhitungan keuangan, integrasi antarmodul, kelengkapan filter, format ekspor, dan kesiapan operasional laporan di Portal Admin SIYAYASAN.

---

## 1. RINGKASAN EKSEKUTIF AUDIT

Audit menyeluruh telah dilakukan terhadap seluruh fitur pelaporan, rekapitulasi data, kartu ringkasan KPI, dan fungsi ekspor di Portal Admin SIYAYASAN. Audit mencakup penelusuran kode frontend (`reports.html`, `payments.html`, `dashboard.html`, `students.html`, `ppdb.html`, `teachers.html`), logika backend API (`frontend/shared/js/api.js`), serta struktur dan ketersediaan data di database PostgreSQL Supabase (`students`, `invoices`, `payments`, `ppdb_registrations`, `teachers`, `classes`, `users`, `activity_logs`, `web_settings`).

### Ringkasan Penilaian Utama

| Parameter Evaluasi | Nilai Evaluasi | Status | Catatan Kritis |
| :--- | :---: | :---: | :--- |
| **1. Data Accuracy (Akurasi Perhitungan)** | **62 / 100** | **PERLU PERBAIKAN BESAR** | Total nominal pada ekspor Excel laporan keuangan menjumlahkan seluruh tagihan tanpa membedakan lunas dan tunggakan. Tidak ada pemisahan antara piutang dan penerimaan kas riil. |
| **2. Data Integration (Integrasi Sumber Data)** | **70 / 100** | **CUKUP (PARTIALLY INTEGRATED)** | Terkoneksi ke database Supabase, namun query laporan keuangan hanya membaca tabel `invoices` dan mengabaikan tabel `payments` (transaksi pembayaran dan bukti transfer). |
| **3. Operational Usefulness (Kemanfaatan Operasional)** | **65 / 100** | **BELUM LENGKAP** | Tidak tersedia Laporan Data Guru, Laporan Tunggakan Siswa per Kelas, Buku Kas SPP Riil, dan Rekapitulasi Pembayaran per Siswa. Filter kelas dan jenjang belum tersedia di modul laporan. |

---

## 2. INVENTARISASI SELURUH FITUR LAPORAN & REKAPITULASI

Berdasarkan penelusuran arsitektur sistem, pelaporan di Portal Admin terdistribusi pada 3 halaman utama:

```
Portal Admin SIYAYASAN
 ├── 1. Modul Laporan Resmi (frontend/portal/admin/reports.html)
 │    ├── Rekapitulasi Data Siswa Aktif (`report_type: students`)
 │    ├── Rekapitulasi Keuangan & SPP (`report_type: payments`)
 │    ├── Rekapitulasi Pendaftaran Santri Baru (`report_type: ppdb`)
 │    ├── Ringkasan Eksekutif Yayasan (`report_type: all`)
 │    ├── Fitur Ekspor: Unduh Excel (.xls), Unduh CSV (.csv), Cetak Dokumen Resmi (Kop Surat)
 │    └── Fitur Impor: Unggah Tagihan Massal (.csv), Unggah Siswa Baru (.csv)
 │
 ├── 2. Modul Keuangan & SPP (frontend/portal/admin/payments.html)
 │    ├── 4 Kartu KPI Keuangan: Total Tagihan, Sudah Dibayar, Tunggakan Siswa, Menunggu Verifikasi
 │    ├── Filter Tagihan: Pencarian teks, Status (unpaid/pending/paid), Kelas (Rombel), Bulan/Tahun SPP
 │    └── Fitur Cetak Rekap SPP: Cetak tabel rekapitulasi invoice langsung via pop-up jendela cetak
 │
 └── 3. Dashboard Admin (frontend/portal/admin/dashboard.html)
      ├── 4 Kartu Statistik Utama: Total Siswa, Total Kelas, Total Guru, Pendaftar PPDB
      ├── Kartu Ringkasan PPDB: Total Pendaftar, Pending, Approved, Pendaftar Bulan Ini
      └── Kartu Ringkasan Keuangan: Total Tagihan, Sudah Dibayar, Tunggakan, Menunggu Verifikasi
```

---

## 3. AUDIT MENDALAM PER KATEGORI LAPORAN

### A. Laporan Keuangan dan SPP (Area Kritis Tertinggi)

> [!CRITICAL]
> **TEMUAN KRITIS KEUANGAN: Laporan Keuangan SPP Menyamakan Total Tagihan dengan Kas Masuk.**

#### 1. Kondisi Aktual & Alur Data
- Di `reports.html`, admin memilih kartu **"Pembayaran SPP & Keuangan"** dengan filter bulan (`#rep-pay-month`), lalu menekan tombol *Tampilkan*.
- Frontend memanggil `apiCall('reports', 'generate', { report_type: 'payments', month: 'YYYY-MM' })`.
- Di backend `frontend/shared/js/api.js` (baris 3845–3860):
  ```javascript
  const inv = await supabaseRest('invoices?select=*').catch(() => []);
  let list = inv || [];
  if (params.month) {
    list = list.filter(i => (i.due_date && i.due_date.startsWith(params.month)) || 
                            (i.period && i.period.includes(params.month)) || 
                            (i.month && i.month.includes(params.month)));
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
  ```

#### 2. Permasalahan & Bukti Teknis
1. **Penerimaan Kas Riil Tidak Dilaporkan**:
   Query **hanya mengambil data dari tabel `invoices`**. Sistem tidak melakukan cross-check atau query ke tabel `payments` (transaksi pembayaran nyata yang telah diverifikasi bendahara dengan tanggal transfer, nomor referensi, dan metode pembayaran).
2. **Kesesatan Total Nominal pada Ekspor Excel**:
   Pada `frontend/portal/admin/reports.html` baris 504–508:
   ```javascript
   const totalAmount = rows.reduce((acc, r) => {
     const raw = String(r[4] || '0').replace(/[^0-9]/g, '');
     return acc + (Number(raw) || 0);
   }, 0);
   summaryText = `Total: ${rows.length} Data Tagihan | Total Nominal: Rp ${totalAmount.toLocaleString('id-ID')}`;
   ```
   **Dampak Fatal:** Angka "Total Nominal" yang tercetak pada baris bawah lembar Excel adalah akumulasi dari **seluruh tagihan**, termasuk tagihan yang masih menunggak (`BELUM LUNAS`) dan yang masih menunggu konfirmasi bukti transfer (`MENUNGGU VERIFIKASI`). Jika laporan ini diserahkan kepada Ketua Yayasan, yayasan dapat mengira kas masuk sebesar Rp15.000.000, padahal yang sudah benar-benar dibayar mungkin hanya Rp3.000.000 (Rp12.000.000 sisanya adalah piutang/tunggakan).
3. **Bug Filter Bulan (`input type="month"` vs Format Data)**:
   Filter `#rep-pay-month` menghasilkan format ISO `"2026-10"`. Di database, kolom `invoices.month` tersimpan dalam teks bahasa Indonesia (misalnya `"Oktober 2026"`). Jika kolom `due_date` kosong atau tidak diawali `"2026-10"`, kondisi `i.month.includes(params.month)` akan selalu menghasilkan `false`, menyebabkan tagihan pada bulan tersebut hilang dari laporan.
4. **Tidak Tersedia Laporan Tunggakan Khusus (*Arrears Aging Report*)**:
   Bendahara tidak memiliki opsi untuk menyaring "Hanya Siswa Menunggak" untuk keperluan surat pemberitahuan atau rekap tagihan per wali santri.
5. **Batas Muat Data (*Data Truncation*) di `payments.html`**:
   Tombol *Cetak Rekap SPP* di `payments.html` (baris 1042) mencetak data dari `invoicesCache`. Pada baris 450, `loadInvoices()` dibatasi hanya memuat `per_page: 200`. Jika yayasan memiliki lebih dari 200 data tagihan, seluruh tagihan ke-201 dan seterusnya akan terpotong dan hilang dari hasil cetak tanpa ada peringatan kepada admin.

---

### B. Laporan Data Siswa & Rombel

#### 1. Kondisi Aktual & Alur Data
- Memanggil `apiCall('reports', 'generate', { report_type: 'students' })`.
- Di backend `api.js` (baris 3832–3844):
  ```javascript
  headers = ['No', 'NIS', 'Nama Lengkap', 'Kelas', 'Jenis Kelamin', 'Nama Wali', 'No. HP / WA', 'Status'];
  const stu = await supabaseRest('students?status=eq.active&select=*&order=full_name.asc').catch(() => []);
  ```

#### 2. Permasalahan & Bukti Teknis
1. **Tidak Memiliki Filter Kelas / Rombel**:
   Di `reports.html`, kartu *Data Siswa* hanya memiliki satu tombol: `Tampilkan Rekap`. Admin tidak dapat memfilter laporan per rombongan belajar (misalnya: Rekap Siswa Kelas KB Ulinnuha saja, atau Kelas TPQ saja). Laporan selalu menampilkan seluruh siswa aktif yayasan dalam satu daftar panjang.
2. **Informasi Administrasi Esensial Hilang**:
   Laporan tidak menyertakan:
   - NISN (Nomor Induk Siswa Nasional)
   - Tempat & Tanggal Lahir (wajib untuk pelaporan dinas/yayasan)
   - Alamat Domisili
   - Nominal Ketetapan SPP Bulanan per siswa
3. **Pengecualian Mutlak Siswa Non-Aktif / Pindah / Alumni**:
   Query mengunci `status=eq.active`. Admin tidak dapat mencetak rekapitulasi siswa yang non-aktif, mutasi keluar, atau lulus.
4. **Tidak Ada Rekapitulasi Statistik Demografis**:
   Tidak ada ringkasan jumlah siswa berdasarkan jenis kelamin (Laki-laki/Perempuan), per jenjang (PAUD/TPQ), atau per rombel di bagian atas atau bawah tabel.

---

### C. Laporan PPDB & Pendaftaran Siswa Baru

#### 1. Kondisi Aktual & Alur Data
- Memanggil `apiCall('reports', 'generate', { report_type: 'ppdb', academic_year: '...' })`.
- Di backend `api.js` (baris 3861–3885):
  Query membaca tabel `ppdb_registrations`.

#### 2. Permasalahan & Bukti Teknis
1. **Input Tahun Ajaran Bebas Teks (*Free Text Input*)**:
   Filter tahun di `reports.html` baris 171 berupa `<input type="text" id="rep-ppdb-year" placeholder="2026/2027">`. Admin harus mengetik manual tahun ajaran secara persis. Jika admin salah mengetik atau tidak mengisi, filter dapat mencampuradukkan data pendaftar dari berbagai tahun ajaran.
2. **Tidak Ada Rekap Statistik Keputusan Penerimaan**:
   Laporan hanya menampilkan baris tabel pendaftar tanpa menyajikan kartu rekap:
   - Berapa total pendaftar yang masuk?
   - Berapa yang berstatus *Pending* (belum diputuskan)?
   - Berapa yang *Diterima* (*Approved/Accepted*)?
   - Berapa yang *Ditolak* (*Rejected*)?
   - Berapa yang *Sudah Dikonversi* menjadi siswa aktif (*Converted*)?
3. **Pemisahan Jenjang Belum Standar**:
   Kolom Jenjang diisi dengan rumus fallback:
   `r.level || (r.form_metadata && r.form_metadata.program_level) || (r.form_type || 'PAUD').toUpperCase()`.
   Jika form metadata kosong, seluruh jenjang otomatis berubah menjadi `"PAUD"`, padahal pendaftar mungkin mendaftar ke unit TPQ Ulinnuha.

---

### D. Laporan Administrasi & Data Guru (Hilang / Belum Tersedia)

> [!WARNING]
> **TEMUAN TINGGI: Modul Laporan Data Guru Sama Sekali Belum Disediakan di `reports.html`.**

1. Di `reports.html`, hanya ada 4 kartu laporan (Siswa, SPP, PPDB, Ringkasan All). **Tidak ada opsi Laporan Data Guru dan Tenaga Pendidik**.
2. Di backend `api.js` pada blok `module === 'reports'`, tidak ada penanganan untuk `repType === 'teachers'`.
3. Di halaman manajemen `teachers.html`, tidak ada tombol ekspor Excel, tidak ada tombol unduh CSV, dan tidak ada fitur cetak dokumen resmi.
4. **Dampak Operasional:** Tata Usaha tidak dapat mencetak daftar guru resmi yayasan (NIP, gelar pendidikan, jabatan struktural, spesialisasi mengajar, kontak, dan status keaktifan) untuk keperluan akreditasi, rapat yayasan, maupun administrasi dinas.

---

### E. Dashboard & Ringkasan Statistik Eksekutif

#### 1. Kondisi Aktual & Alur Data
- Memanggil `apiCall('dashboard', 'index')`.
- Backend membaca seluruh tabel secara paralel via `Promise.all` (`students`, `teachers`, `classes`, `ppdb_registrations`, `invoices`, `payments`).

#### 2. Permasalahan & Hasil Rekonsiliasi
1. **Definisi "Menunggu Verifikasi" pada Kartu Keuangan**:
   Di `dashboard.html` baris 232:
   `Shell.setText('fin-pending', pendingVerify);`
   Nilai yang ditampilkan adalah **jumlah transaksi** (misalnya `2`), sedangkan baris lainnya menampilkan **nominal Rupiah** (`formatIDR(sppTarget)` = Rp1.500.000, `formatIDR(sppCollected)` = Rp300.000, `formatIDR(outstanding)` = Rp1.200.000). Tampilan angka `"2"` tanpa satuan atau keterangan dapat disalahartikan pengguna sebagai "Rp2" atau nominal rupiah yang rusak.
2. **Tidak Ada Filter Periode / Tahun Ajaran**:
   Dashboard menyajikan data kumulatif sepanjang masa (*all-time cumulative*). Tidak ada opsi bagi pimpinan yayasan untuk melihat statistik khusus bulan ini, semester ini, atau tahun ajaran 2026/2027.
3. **Sinkronisasi Memori Lokal PPDB**:
   Di `api.js` baris 1373–1382, dashboard menggabungkan data PPDB dari Supabase dengan data lokal browser `localStorage.getItem('siy_local_ppdb_regs')`. Jika admin membuka dashboard dari perangkat komputer lain, data lokal tersebut tidak terbaca, sehingga angka pendaftar PPDB dapat berbeda antar perangkat jika ada data pendaftaran yang belum terunggah ke database cloud.

---

## 4. HASIL REKONSILIASI DATA ANTARMODUL

Pemeriksaan komparatif dilakukan untuk memastikan konsistensi angka pada tabel sumber, modul fungsional, modul laporan, dan dashboard:

```
+-------------------------------------------------------------------------------------------------------+
| MATRIKS REKONSILIASI DATA ANTARMUDA & DATABASE                                                        |
+--------------------------+-----------------------+-----------------------+----------------------------+
| Entitas / Metrik         | Sumber DB (Supabase)  | Halaman Modul Faktual | Modul Laporan & Dashboard  | Status Sinkronisasi
+--------------------------+-----------------------+-----------------------+----------------------------+
| 1. Siswa Aktif           | students (active)     | students.html (Filter)| reports.html (rep: students)
|                          | Query: status=active  | Tampil: status=active | Dashboard: active_students | VERIFIED (KONSISTEN)
+--------------------------+-----------------------+-----------------------+----------------------------+
| 2. Pendaftar PPDB        | ppdb_registrations    | ppdb.html (5 tab)     | reports.html (rep: ppdb)   | PARTIALLY VERIFIED
|                          | Raw DB rows           | Cloud + localStorage  | Input tahun teks manual    | (Rentan desinkron)
+--------------------------+-----------------------+-----------------------+----------------------------+
| 3. Total Tagihan SPP     | invoices.amount       | payments.html KPI     | reports.html (Total Excel) | FAILED (TIDAK KONSISTEN)
|                          | Sum(amount)           | kpi-total: Sum(amount)| Total = Tagihan + Piutang  | (Label menyesatkan)
+--------------------------+-----------------------+-----------------------+----------------------------+
| 4. Kas SPP Masuk Riil    | payments (verified)   | payments.html KPI     | reports.html               | FAILED (TIDAK TERSEDIA)
|                          | / invoices (paid)     | kpi-paid: Sum(amount) | Tidak ada laporan kas riil | (Hanya ada flat tagihan)
+--------------------------+-----------------------+-----------------------+----------------------------+
| 5. Tunggakan SPP         | invoices (unpaid)     | payments.html KPI     | reports.html               | FAILED (TIDAK TERSEDIA)
|                          | Sum(unpaid amount)    | kpi-outstanding       | Tidak ada laporan tunggakan| (Harus hitung manual)
+--------------------------+-----------------------+-----------------------+----------------------------+
| 6. Data Guru             | teachers              | teachers.html         | reports.html               | FAILED (TIDAK TERSEDIA)
|                          | Query: teachers       | Daftar guru lengkap   | Menu laporan tidak ada     | (Fitur hilang)
+-------------------------------------------------------------------------------------------------------+
```

---

## 5. AUDIT FILTER, EKSPOR, DAN PRESENTASI DOKUMEN

### A. Evaluasi Fitur Ekspor

| Format Ekspor | Kondisi Saat Ini | Validasi Integritas | Evaluasi & Rekomendasi |
| :--- | :--- | :---: | :--- |
| **Excel (.xls)** | Diekspor menggunakan HTML/XML spreadsheet dengan Kop Surat, gaya sel, dan lembar tanda tangan. | **BERFUNGSI TETAPI ANGKA TOTAL SALAH** | Kop surat dan tata letak tabel sangat baik. Namun rumus total di baris bawah menjumlahkan seluruh tagihan tanpa memisahkan status LUNAS vs TUNGGAKAN. |
| **CSV (.csv)** | Diekspor dengan UTF-8 BOM (`\uFEFF`) dan deklarasi `sep=,`. | **VERIFIED (AMALAN TERBAIK)** | Kolom nomor telepon dan NIS diawali `="0..."` sehingga angka nol di depan tidak terpotong oleh Excel. |
| **Cetak Resmi (PDF)** | Menggunakan `@media print` A4 Portrait, menyembunyikan elemen web, menampilkan kop surat resmi dan tanda tangan basah Ketua & Bendahara. | **VERIFIED (STANDAR TINGGI)** | Tampilan cetak formal dan rapi. Namun nama Ketua Yayasan (*Makhrus*) dan Bendahara (*Sri Pragawati*) masih tertulis statis dan belum mengambil data dari profil yayasan. |

### B. Evaluasi Fitur Impor (Spreadsheet CSV ke Database)

- **Impor Tagihan Massal (`import_invoices`)**:
  - Berhasil memvalidasi pencocokan NIS dan nama siswa aktif sebelum membuat baris tagihan.
  - Baris dengan NIS tidak valid dilewati (*skipped count*) untuk mencegah data yatim (*orphan data*).
- **Impor Siswa Baru (`import_students`)**:
  - Berhasil memetakan kelas siswa baru ke tabel `classes`.
  - Format template yang diunduh (`downloadImportTemplate()`) sudah sesuai dan mudah dipahami pengguna.

---

## 6. KLASIFIKASI TEMUAN AUDIT

### [CRITICAL] Kesalahan Perhitungan & Integritas Keuangan

#### TEMUAN C-01: Penjumlahan Total Nominal Ekspor Excel SPP Menyesatkan
- **Fitur:** Laporan Rekapitulasi SPP (`reports.html` & `exportCurrentReportToExcel()`)
- **Kondisi Aktual:** Baris total Excel menjumlahkan nilai numerik seluruh kolom nominal tagihan tanpa memfilter apakah statusnya `paid`, `unpaid`, atau `menunggu_verifikasi`.
- **Bukti Kode:** `frontend/portal/admin/reports.html` baris 504–508.
- **Penyebab:** Perhitungan total hanya melakukan `reduce` terhadap `r[4]` (seluruh baris yang ditampilkan).
- **Dampak Operasional:** Laporan keuangan yang diserahkan ke pimpinan yayasan menampilkan total nominal tagihan sebagai penerimaan, yang berpotensi menyebabkan salah tafsir likuiditas kas yayasan (menganggap piutang yang belum dibayar sebagai uang kas masuk).
- **Status:** **FAILED**
- **Rekomendasi:** Perbarui baris ringkasan menjadi 3 metrik terpisah:
  1. *Total Penerimaan Kas SPP (Lunas)*: Rp [Total Paid]
  2. *Total Tunggakan SPP (Belum Lunas)*: Rp [Total Unpaid]
  3. *Total Tagihan Diterbitkan*: Rp [Grand Total]

---

### [HIGH] Ketiadaan Laporan Esensial & Masalah Filter

#### TEMUAN H-01: Ketiadaan Laporan Data Guru & Tenaga Kependidikan
- **Fitur:** Modul Rekapitulasi & Laporan (`reports.html`)
- **Kondisi Aktual:** Tidak ada kartu menu laporan guru di `reports.html`, dan backend `apiCall('reports', 'generate')` tidak mendukung parameter `teachers`. Modul `teachers.html` juga tidak memiliki fitur ekspor atau cetak.
- **Bukti Kode:** `frontend/portal/admin/reports.html` baris 135–191 dan `api.js` baris 3826–3913.
- **Dampak Operasional:** Administrasi Tata Usaha tidak dapat mengekspor atau mencetak berkas resmi data tenaga pendidik untuk arsip yayasan, audit dinas, atau berkas akreditasi.
- **Status:** **FAILED**
- **Rekomendasi:** Tambahkan kartu laporan *Data Guru & Pendidik* pada `reports.html` dengan ekspor Excel, CSV, dan format cetak resmi ber-Kop Surat.

#### TEMUAN H-02: Tidak Ada Filter Kelas & Jenjang pada Laporan Siswa
- **Fitur:** Laporan Data Siswa (`reports.html`)
- **Kondisi Aktual:** Tombol cetak langsung memuat seluruh siswa aktif tanpa opsi filter kelas atau unit jenjang (TPQ vs KB).
- **Bukti Kode:** `frontend/shared/js/api.js` baris 3834 (`students?status=eq.active&select=*&order=full_name.asc`).
- **Dampak Operasional:** Guru atau wali kelas tidak dapat mencetak daftar presensi/rekap siswa per kelas tertentu, melainkan harus mencetak seluruh siswa yayasan lalu memilah secara manual.
- **Status:** **FAILED**
- **Rekomendasi:** Tambahkan dropdown pemilihan Rombel/Kelas dan Jenjang pada kartu laporan siswa di `reports.html`.

#### TEMUAN H-03: Ketiadaan Laporan Rekapitulasi Tunggakan Khusus (*Arrears Report*)
- **Fitur:** Laporan SPP & Keuangan
- **Kondisi Aktual:** Tidak ada jenis laporan khusus yang hanya menyaring siswa menunggak per kelas.
- **Dampak Operasional:** Petugas TU kesulitan melakukan penagihan rutin karena harus menelusuri ratusan transaksi satu per satu untuk menemukan siapa saja yang belum membayar SPP.
- **Status:** **FAILED**
- **Rekomendasi:** Tambahkan sub-filter atau tipe laporan terpisah: *Laporan Daftar Tunggakan Siswa per Kelas*.

---

### [MEDIUM] Keterbatasan Filter & Inkonsistensi Visual

#### TEMUAN M-01: Filter Periode PPDB Berupa Teks Bebas (*Free Text*)
- **Fitur:** Laporan Pendaftaran PPDB Baru (`reports.html`)
- **Kondisi Aktual:** Menggunakan input teks bebas (`<input type="text" id="rep-ppdb-year">`), bukan dropdown periode yang terdaftar di sistem.
- **Bukti Kode:** `frontend/portal/admin/reports.html` baris 171.
- **Dampak Operasional:** Ketidakkonsistenan pengetikan admin (misal mengetik "2026", "2026/2027", atau "26-27") dapat menyebabkan data tidak ditemukan atau data lintas periode tercampur.
- **Status:** **PARTIALLY VERIFIED**
- **Rekomendasi:** Ubah input teks menjadi elemen `<select>` yang otomatis memuat daftar tahun ajaran dari database.

#### TEMUAN M-02: Batas Pemotongan 200 Invoice pada Cetak Rekap SPP di `payments.html`
- **Fitur:** Cetak Rekap SPP (`payments.html`)
- **Kondisi Aktual:** Fungsi cetak mengambil data dari `invoicesCache` yang dibatasi maksimal 200 baris.
- **Bukti Kode:** `frontend/portal/admin/payments.html` baris 450 dan 1042.
- **Dampak Operasional:** Jika tagihan bertambah melampaui 200, laporan cetak akan memotong data tanpa notifikasi apapun kepada admin.
- **Status:** **PARTIALLY VERIFIED**
- **Rekomendasi:** Ambil data cetak langsung dari backend API tanpa batasan halaman UI saat tombol cetak ditekan.

---

### [LOW] Penyempurnaan Tampilan & Tanda Tangan Statis

#### TEMUAN L-01: Nama Penandatangan Lembar Pengesahan Masih Statis
- **Fitur:** Lembar Pengesahan Cetak & Ekspor Excel (`reports.html` & `payments.html`)
- **Kondisi Aktual:** Nama Ketua Yayasan (*Makhrus*) dan Bendahara (*Sri Pragawati*) tertulis secara *hardcoded* di HTML dan script.
- **Bukti Kode:** `frontend/portal/admin/reports.html` baris 260, 268, 691, 693.
- **Dampak Operasional:** Jika terjadi pergantian pengurus atau pejabat penandatangan yayasan, nama tidak otomatis berganti dari database `web_settings` / `schools`.
- **Status:** **VERIFIED (MINOR)**
- **Rekomendasi:** Ambil nama penandatangan secara dinamis dari tabel `schools` atau `web_settings`.

---

## 7. KESIMPULAN AKHIR DAN STATUS AUDIT

1. **Akurasi Data (*Data Accuracy*):** Memerlukan perbaikan mendesak pada perhitungan total laporan keuangan SPP di `reports.html` agar secara tegas memisahkan Kas Masuk Sah (Lunas) dengan Piutang/Tunggakan.
2. **Integrasi Data (*Data Integration*):** Struktur database telah siap dan memadai. Perlu penambahan koneksi modul laporan ke tabel `teachers` dan integrasi tabel `payments` ke dalam laporan buku kas SPP.
3. **Kemanfaatan Operasional (*Operational Usefulness*):** Fitur cetak dokumen ber-Kop Surat dan ekspor Excel/CSV yang sudah ada memiliki kualitas presentasi visual yang sangat baik. Kemanfaatannya akan meningkat drastis setelah dilengkapi filter kelas, laporan guru, dan laporan khusus tunggakan.

---
*Audit ini disusun secara independen, objektif, dan berbasis bukti kode aktual. Tidak ada perubahan kode atau database yang dilakukan selama proses audit berlangsung.*

