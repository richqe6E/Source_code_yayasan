# LAPORAN AUDIT ARSITEKTUR, INTEGRASI DATA & LOGIKA SISTEM MENYELURUH

**Proyek:** Sistem Informasi Terpadu Yayasan At-Tarbiyyah Wijaya Kusuma Samarinda (`SIYAYASAN V2`)

**Cakupan Audit:** Database Supabase (`MASTER_SUPABASE_SETUP_V2.sql`), API & Storage Bridge (`api.js`, `app.js`, `supabase-config.js`, `vercel.json`), Website Utama Publik (9 Halaman), Sistem PPDB Online (2 Halaman), Portal Siswa Mandiri (4 Halaman), dan Portal Admin Operasional (12 Halaman).

## Ringkasan Eksekutif & Matriks Temuan Audit

Berdasarkan pemeriksaan baris demi baris (*line-by-line code audit*) pada seluruh repositori, ditemukan **12 akar permasalahan utama** (9 Bug Kritis Sistem/Integrasi dan 3 Cacat Logika Pendukung & Standar Brand) yang menjelaskan mengapa fitur-fitur di versi *deploy* tidak berjalan semestinya atau mengalami desinkronisasi data antara pengunjung publik, calon siswa/siswa, dan Admin.

| ID | Kategori & Tingkat Keparahan | Modul & Integrasi Sistem Terdampak | Lokasi File & Baris Kode | Ringkasan Akar Masalah | 
| ----- | ----- | ----- | ----- | ----- | 
| **BUG-01** | 🔴 **KRITIS** | **PPDB Online** $\leftrightarrow$ **Upload Gambar** $\leftrightarrow$ **Database Supabase** | `frontend/public/ppdb.html` (1419–1423)  `frontend/shared/js/api.js` (90, 144, 1390–1398)  `frontend/public/js/app.js` (183–191) | Timeout REST (2.5 detik) & Storage (3 detik) terlalu singkat + string Base64 di `photo_url`, `birth_certificate_url`, `family_card_url` lupa dihapus dari `cleanMeta` sehingga membebani kolom JSONB `form_metadata` (5–15 MB) dan memutus koneksi saat submit PPDB. | 
| **BUG-02** | 🔴 **KRITIS** | **Portal Admin PPDB** $\leftrightarrow$ **Konversi Siswa Aktif** | `frontend/portal/admin/ppdb.html` (590–614, 632) | Crash `ReferenceError: defaultPassword is not defined` (dan `loginUrl`) pada `showConvertSuccessModal()`, menyebabkan tombol **Aktivasi Siswa** memunculkan pesan gagal palsu dan tidak me-refresh tabel. | 
| **BUG-03** | 🔴 **KRITIS** | **Portal Admin PPDB** $\leftrightarrow$ **Tabel `ppdb_periods`** $\leftrightarrow$ **Website Utama** | `frontend/portal/admin/ppdb.html` (243, 288–299)  `frontend/shared/js/api.js` (1573–1593)  `database/MASTER_SUPABASE_SETUP_V2.sql` (603) | ID periode di DB adalah `'PER-2026-1'` (`status: 'active'`), namun `api.js` melakukan `PATCH` ke ID `'PPDPER-2026'` (0 baris terupdate di DB) dan `admin/ppdb.html` hanya mengecek `status === 'open'`, sehingga status selalu tampak "TUTUP" di Admin dan perubahan jadwal tidak tersimpan ke Supabase. | 
| **BUG-04** | 🔴 **KRITIS** | **Portal Admin PPDB (Tab Filter & Jenis Jenjang)** | `frontend/portal/admin/ppdb.html` (41, 315–326)  `frontend/shared/js/api.js` (1336–1342, 1609) | `ppdb/approve` menyimpan `status: 'accepted'`, sedangkan tab Approved memfilter `status=eq.approved` (tab selalu kosong). Selain itu filter `#filter-type` (`paud`/`tpq`) diabaikan oleh `api.js`. | 
| **BUG-05** | 🔴 **KRITIS** | **Portal Admin Kasir SPP (`payments.html`)** $\leftrightarrow$ **`api.js`** | `frontend/portal/admin/payments.html` (330–348)  `frontend/shared/js/api.js` (1312–1329) | Mismatch key JSON: `api.js` mengembalikan `total_tagihan`, `total_lunas`, `total_tunggakan`, `menunggu_verifikasi`, sedangkan `payments.html` membaca `total_invoice`, `total_paid`, `total_outstanding`, `pending_verification`. Keempat kartu KPI selalu `Rp 0`. | 
| **BUG-06** | 🔴 **KRITIS** | **Portal Admin Konten CMS** $\leftrightarrow$ **Website Publik (`berita`, `pengumuman`, `agenda`, `galeri`)** | `frontend/portal/admin/content.html` (179–239)  `frontend/shared/js/api.js` (1781–1964)  `frontend/public/pengumuman.html` (132) | Tombol **Tarik (Draft)** hanya mengubah `status: 'draft'` tanpa mengubah `is_published: false` (default DB `TRUE`), sehingga status di Admin macet di "Terbit" dan konten Draft bocor ke publik. Tidak ada tombol **Edit** konten & tidak ada tombol **Hapus** di tab Galeri. | 
| **BUG-07** | 🔴 **KRITIS** | **Integrasi PPDB** $\leftrightarrow$ **Portal Siswa Mandiri** $\leftrightarrow$ **Verifikasi Dokumen Admin** | `frontend/shared/js/api.js` (556–637, 1502–1517, 1621–1775)  `frontend/portal/siswa/dashboard.html` (294–305, 383, 471–492)  `frontend/portal/siswa/dokumen.html` | Berkas yang diunggah saat PPDB tidak disinkronkan ke tabel `student_documents` (dan sebaliknya upload dari Portal Siswa tidak memperbarui `ppdb_registrations`). Tracker PPDB tahap 3 & 4 di Dashboard Siswa belum memiliki kode update DOM, dan nomor pendaftaran menampilkan `STU-...` alih-alih `REG-...`. | 
| **BUG-08** | 🔴 **KRITIS** | **Portal Admin Pengguna (`users.html`), Kelas (`classes.html`), & Guru (`teachers.html`)** | `frontend/portal/admin/users.html` (30–37, 200–203)  `frontend/portal/admin/classes.html` (38–40)  `frontend/portal/admin/teachers.html` (28–32, 72)  `frontend/shared/js/api.js` (779–789) | `users.html` masih memakai role warisan V1 (`guru`, `orang_tua`, `pendaftar`) yang ditolak oleh `auth.js` (2-Portal) dan tidak memiliki opsi `super_admin`, `siswa_aktif`, `calon_siswa`. `classes.html` tidak memiliki jenjang `TPQ` dan `TK`. Filter status di `teachers.html` diabaikan oleh `api.js` dan belum ada tombol Hapus Guru/User. | 
| **BUG-09** | 🔴 **KRITIS** | **Portal Admin Dashboard, Log Aktivitas (`logs.html`), & Backup (`backup.html`)** | `frontend/shared/js/api.js` (642–686, 2017–2023, 2226–2346)  `frontend/portal/admin/logs.html` (75–112)  `frontend/portal/admin/backup.html` (345–392) | Duplikasi blok `if (module === 'dashboard')` di `api.js` menyebabkan blok kedua menjadi *dead code* (`ppdb_this_month` selalu `0`). Tidak ada satupun mutasi di `api.js` yang menulis ke `activity_logs` (halaman Log selalu kosong) + mismatch `l.description` vs `l.details`. Fitur `backup/restore` hanya menyimpan ke `localStorage` tanpa memulihkan tabel Supabase. | 
| **BUG-10** | 🟡 **PERBAIKAN** | **Cetak Kuitansi SPP (Portal Siswa & Portal Admin)** | `frontend/portal/siswa/spp.html` (367, 425)  `frontend/portal/admin/payments.html` (758, 816) | Teks terbilang kuitansi dipatok statis `# Seratus Lima Puluh Ribu Rupiah #` untuk semua nominal tagihan, dan kuitansi membaca `inv.paid_by` padahal kolom database adalah `inv.payment_method`. | 
| **BUG-11** | 🟡 **PERBAIKAN** | **Website Utama (`kontak.html`, `index.html`)** $\leftrightarrow$ **CMS Settings & Konfigurasi Script Admin** | `frontend/public/kontak.html` (384)  `frontend/public/js/public-shell.js` (258, 340–410)  `frontend/portal/admin/*.html` | Submit form `kontak.html` membuka `https://wa.me/0813...` (belum diformat ke kode negara `62`) dan tidak menyimpan ke `contact_messages`. Field `tagline` dari `cms_setting.html` tidak dirender di `public-shell.js`. Seluruh 12 file `admin/*.html` belum memuat `<script src="../../shared/js/supabase-config.js"></script>`. | 
| **BUG-12** | 🟡 **PERBAIKAN** | **Standar Identitas Visual (Zero-Green Enforcement — Oceanic Blue Palette)** | 11 file di `frontend/portal/admin/*.html` & 3 file di `frontend/portal/siswa/*.html` | Masih terdapat **60+ penggunaan class warna `green-*`, `emerald-*`, dan `teal-*`** yang menyimpang dari karakteristik identitas desain Oceanic Blue (`#0284c7` / `#0ea5e9`). | 

## Detail Audit Per Modul, Analisis Baris Kode & Solusi Implementasi

### 🔴 BUG-01: Kegagalan Submit PPDB & Upload Gambar Akibat Kebocoran Base64 ke `form_metadata` + Timeout 2.5 Detik

* **Sistem Integrasi Terdampak:** Formulir PPDB Online (`frontend/public/ppdb.html`) $\leftrightarrow$ Sistem Upload Supabase Storage (`frontend/shared/js/api.js`) $\leftrightarrow$ Tabel Database `ppdb_registrations`.

* **Lokasi File & Baris Kode:**

  1. `frontend/public/ppdb.html` (baris **1419–1423**)

  2. `frontend/shared/js/api.js` (baris **90**, **144**, **1361–1435**)

  3. `frontend/public/js/app.js` (baris **183–191**)

* **Penjelasan Cacat Logika:**

  1. Pada `frontend/public/ppdb.html` baris 1419–1421, berkas foto, akta kelahiran, dan kartu keluarga yang diunggah calon wali murid dikirim dalam bentuk string Base64 di dalam properti `payload.photo_url`, `payload.birth_certificate_url`, dan `payload.family_card_url`:

     ```
     photo_url: document.getElementById('file-foto-dataurl')?.value || '',
     birth_certificate_url: document.getElementById('file-akta-dataurl')?.value || '',
     family_card_url: document.getElementById('file-kk-dataurl')?.value || '',
     
     ```

  2. Pada `frontend/shared/js/api.js` baris 1390–1398 (`ppdb/create` & `ppdb/submitPublic`), kode berusaha membersihkan data Base64 agar tidak masuk ke kolom JSONB `form_metadata`:

     ```
     const cleanMeta = { ...params };
     delete cleanMeta.photo_dataurl;
     delete cleanMeta.akta_dataurl;
     delete cleanMeta.kk_dataurl;
     
     ```

     **Masalahnya:** Kode hanya menghapus `*_dataurl`, tetapi **LUPA menghapus `cleanMeta.photo_url`, `cleanMeta.birth_certificate_url`, `cleanMeta.family_card_url`, dan `cleanMeta.notes`**! Akibatnya, walaupun file berhasil diunggah ke Supabase Storage Bucket `siyayasan-media`, string mentah Base64 berukuran **5 MB hingga 15 MB** tetap ikut dikirim ke dalam kolom JSONB `form_metadata` pada tabel `ppdb_registrations`.

  3. Lebih fatal lagi, fungsi `supabaseRest()` di `api.js` baris 90 memasang `AbortController` dengan batas waktu hanya **2500 ms (2.5 detik)**, dan `uploadToSupabaseStorage()` di baris 144 memasang batas waktu **3000 ms (3 detik)**. Pada jaringan internet seluler/rata-rata pengguna di Indonesia, mengunggah 3 berkas gambar (1–5 MB) hampir pasti memakan waktu lebih dari 3 detik. Akibatnya:

     * Upload ke Supabase Storage dihentikan paksa (`AbortError`) pada detik ke-3 dan jatuh ke fallback Base64.

     * Request `POST` ke tabel `ppdb_registrations` (yang kini membawa payload Base64 5–15 MB) dihentikan paksa pada detik ke-2.5.

     * Eksekusi jatuh ke blok `catch(e)` di baris 1479 yang hanya menyimpan pendaftaran ke `localStorage` di HP/browser pendaftar sendiri! Pendaftar melihat halaman sukses dan mendapat nomor `REG-2026-XXXX`, tetapi **data pendaftar sama sekali tidak masuk ke database Supabase Admin**, dan ketika mereka cek di perangkat lain atau Admin membuka Portal Admin, datanya kosong!

* **Opsi Kode Perbaikan (`frontend/shared/js/api.js` & `frontend/public/js/app.js`):**

```
// 1. Di frontend/shared/js/api.js baris 88-92 (Fungsi supabaseRest):
// Ubah timeout dari 2500ms menjadi 15000ms (15 detik)
const controller = new AbortController();
const timeoutMs = (method === 'GET' || method === 'HEAD') ? 8000 : 15000;
const timer = setTimeout(() => controller.abort(), timeoutMs);

// 2. Di frontend/shared/js/api.js baris 142-146 (Fungsi uploadToSupabaseStorage):
// Ubah timeout upload file dari 3000ms menjadi 25000ms (25 detik)
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 25000);

// 3. Di frontend/shared/js/api.js baris 1388-1402 (dan frontend/public/js/app.js baris 183-191):
// Bersihkan seluruh properti Base64 dari cleanMeta sebelum disimpan ke form_metadata
const cleanMeta = { ...params };
delete cleanMeta.photo_dataurl;
delete cleanMeta.akta_dataurl;
delete cleanMeta.kk_dataurl;
delete cleanMeta.photo_url;
delete cleanMeta.birth_certificate_url;
delete cleanMeta.family_card_url;
delete cleanMeta.notes;
cleanMeta.uploaded_files = {
  photo_url: photoUrl || '',
  birth_certificate_url: aktaUrl || '',
  family_card_url: kkUrl || ''
};

```

### 🛠️ DIRECTIVE UNTUK ANTIGRAVITY

* **Target File:** `frontend/shared/js/api.js` (baris 88–95, 142–148, 1388–1405) dan `frontend/public/js/app.js` (baris 183–195).

* **Instruksi Eksekusi:**

  1. Naikkan batas waktu `AbortController` pada `supabaseRest()` menjadi `8000` ms untuk `GET` dan `15000` ms untuk `POST/PATCH/DELETE`.

  2. Naikkan batas waktu `AbortController` pada `uploadToSupabaseStorage()` dari `3000` ms menjadi `25000` ms agar unggahan foto/dokumen beresolusi tinggi ke bucket `siyayasan-media` tidak terputus prematur.

  3. Hapus properti `photo_url`, `birth_certificate_url`, `family_card_url`, dan `notes` dari objek `cleanMeta` pada `api.js` dan `app.js`, lalu simpan URL hasil upload Supabase Storage (`photoUrl`, `aktaUrl`, `kkUrl`) ke dalam `cleanMeta.uploaded_files`.

### 🔴 BUG-02: Crash `ReferenceError: defaultPassword is not defined` saat Aktivasi/Konversi Siswa di Portal Admin

* **Sistem Integrasi Terdampak:** Portal Admin PPDB (`frontend/portal/admin/ppdb.html`) $\leftrightarrow$ Konversi Calon Siswa ke Siswa Aktif (`api.js:ppdb/convert`) $\leftrightarrow$ Pembuatan Kredensial Login Portal Siswa.

* **Lokasi File & Baris Kode:** `frontend/portal/admin/ppdb.html` (baris **590–614** dan **632**).

* **Penjelasan Cacat Logika:**
  Saat Admin mengeklik tombol **"Aktivasi Siswa"** pada pendaftar yang sudah berstatus `accepted`/`approved`, fungsi `convertReg(id)` memanggil `await apiCall('ppdb', 'convert', { id })` (baris 594). Panggilan API berhasil membuat data siswa aktif dan mengembalikan `res.data`, lalu memanggil `showConvertSuccessModal(res.data)` (baris 596).
  Namun di dalam `showConvertSuccessModal(data)` (baris 607–635):

  ```
  function showConvertSuccessModal(data) {
    const s = data.student || {};
    const creds = data.initial_credentials || {};
    const nis = s.nis || creds.nis || '-';
    const pin = creds.pin || s.pin || '-';
    const waText = encodeURIComponent(
      `Assalamu'alaikum Wr. Wb.\n\nSelamat! Pendaftaran putra/putri Bapak/Ibu atas nama *${s.full_name || '-'}* di Yayasan At-Tarbiyyah Wijaya Kusuma telah *DITERIMA & DIAKTIFKAN*.\n\nBerikut adalah akses login Portal Siswa:\n- NIS / Username: *${nis}*\n- Tanggal Lahir (Password Default): *${defaultPassword}*\n...`
    );
  
  ```

  Variabel `defaultPassword` (baris 613 & 632) dan `loginUrl` (baris 613) **tidak pernah dideklarasikan**! Akibatnya JavaScript melempar `ReferenceError: defaultPassword is not defined`, yang langsung ditangkap oleh blok `catch (e)` di `convertReg()` baris 600 dan menampilkan toast error **"Gagal mengaktifkan siswa"**, modal kredensial WhatsApp tidak pernah muncul, serta `loadPPDB()` tidak terpanggil!

* **Opsi Kode Perbaikan (`frontend/portal/admin/ppdb.html` baris 607–616):**

```
function showConvertSuccessModal(data) {
  const s = data.student || {};
  const creds = data.initial_credentials || {};
  const nis = s.nis || creds.nis || '-';
  const pin = creds.pin || s.pin || '-';
  const defaultPassword = creds.default_password || s.birth_date || pin || '-';
  const loginUrl = creds.login_url || (window.location.origin + '/login.html');
  const waText = encodeURIComponent(
    `Assalamu'alaikum Wr. Wb.\n\nSelamat! Pendaftaran putra/putri Bapak/Ibu atas nama *${s.full_name || '-'}* di Yayasan At-Tarbiyyah Wijaya Kusuma telah *DITERIMA & DIAKTIFKAN*.\n\nBerikut adalah akses login Portal Siswa:\n- NIS / Username: *${nis}*\n- Tanggal Lahir (Password Default): *${defaultPassword}*\n- PIN Akses: *${pin}*\n\nSilakan login melalui: ${loginUrl}\n\nTerima kasih.`
  );

```

### 🛠️ DIRECTIVE UNTUK ANTIGRAVITY

* **Target File:** `frontend/portal/admin/ppdb.html` (baris 607–635).

* **Instruksi Eksekusi:** Deklarasikan `const defaultPassword = creds.default_password || s.birth_date || pin || '-';` dan `const loginUrl = creds.login_url || (window.location.origin + '/login.html');` tepat di bawah deklarasi `const pin` pada fungsi `showConvertSuccessModal(data)`.

### 🔴 BUG-03: Pengaturan Buka/Tutup & Jadwal PPDB Tidak Tersimpan ke Supabase + Status Awal Selalu "TUTUP"

* **Sistem Integrasi Terdampak:** Portal Admin PPDB (`frontend/portal/admin/ppdb.html`) $\leftrightarrow$ Tabel `ppdb_periods` di Supabase $\leftrightarrow$ Banner Beranda (`frontend/public/index.html`) & Gerbang Formulir (`frontend/public/ppdb.html`).

* **Lokasi File & Baris Kode:**

  1. `database/MASTER_SUPABASE_SETUP_V2.sql` (baris **603**)

  2. `frontend/portal/admin/ppdb.html` (baris **243**, **283–310**)

  3. `frontend/shared/js/api.js` (baris **1573–1593**)

* **Penjelasan Cacat Logika:**

  1. Di database Supabase (`MASTER_SUPABASE_SETUP_V2.sql` baris 603), data periode PPDB awal disimpan dengan `id = 'PER-2026-1'` dan `status = 'active'`.

  2. Di halaman publik (`ppdb.html` baris 1072), pengecekan status periode sudah mengenali keduanya: `p.status === 'open' || p.status === 'active'`. **TETAPI** di halaman Admin (`frontend/portal/admin/ppdb.html` baris 243), kode hanya mengecek:

     ```
     const isOpen = currentPeriod.status === 'open';
     
     ```

     Karena di database nilainya `'active'`, `isOpen` bernilai `false`! Akibatnya di Portal Admin selalu tampil badge merah **"TUTUP (FORMULIR DISEMBUNYIKAN)"** padahal di halaman depan formulir sedang terbuka!

  3. Lebih parah lagi, saat Admin mengubah jadwal atau menekan tombol Buka/Tutup lalu klik **Simpan** (`admin/ppdb.html` baris 288–299), objek `payload` yang dikirim ke `apiCall('ppdb', 'updatePeriod', payload)` **tidak menyertakan `id: currentPeriod.id`**.

  4. Di `frontend/shared/js/api.js` baris 1574 (`ppdb/updatePeriod`), kode jatuh ke fallback:

     ```
     const id = params.id || 'PPDPER-2026';
     await supabaseRest(`ppdb_periods?id=eq.${encodeURIComponent(id)}`, 'PATCH', payload);
     
     ```

     Karena di database ID barisnya adalah `'PER-2026-1'` (bukan `'PPDPER-2026'`), perintah `PATCH` ke Supabase mengenai **0 baris** (tidak mengubah apa-apa di database)! Perubahan hanya tersimpan di `localStorage` browser komputer Admin itu sendiri, sedangkan di perangkat calon wali murid yang membuka website, jadwal dan status buka/tutup PPDB sama sekali tidak berubah!

* **Opsi Kode Perbaikan (`frontend/portal/admin/ppdb.html` & `frontend/shared/js/api.js`):**

```
// 1. Di frontend/portal/admin/ppdb.html baris 243:
const isOpen = currentPeriod.status === 'open' || currentPeriod.status === 'active';

// 2. Di frontend/portal/admin/ppdb.html baris 288-299 (Event submit #period-form):
const payload = {
  id: currentPeriod && currentPeriod.id ? currentPeriod.id : undefined,
  academic_year: document.getElementById('period-year').value,
  start_date: document.getElementById('period-start').value,
  end_date: document.getElementById('period-end').value,
  quota_paud: Number(document.getElementById('period-quota-paud').value) || 0,
  quota_tk: Number(document.getElementById('period-quota-tk').value) || 0,
  quota: (Number(document.getElementById('period-quota-paud').value) || 0) + (Number(document.getElementById('period-quota-tk').value) || 0),
  status: document.getElementById('period-status').checked ? 'open' : 'closed',
  is_active: document.getElementById('period-status').checked,
  announcement_text: document.getElementById('period-announcement').value
};

// 3. Di frontend/shared/js/api.js baris 1573-1593 (action === 'updatePeriod' || action === 'savePeriod'):
if (action === 'updatePeriod' || action === 'savePeriod') {
  let targetId = params.id;
  if (!targetId) {
    const existing = await supabaseRest('ppdb_periods?select=id&order=created_at.desc&limit=1');
    if (Array.isArray(existing) && existing.length > 0) {
      targetId = existing[0].id;
    }
  }
  const dbPayload = {
    academic_year: params.academic_year || '2026/2027',
    start_date: params.start_date || null,
    end_date: params.end_date || null,
    quota_paud: Number(params.quota_paud ?? 30),
    quota_tk: Number(params.quota_tk ?? 40),
    quota: Number(params.quota ?? ((Number(params.quota_paud || 30)) + (Number(params.quota_tk || 40)))),
    status: params.status || (params.is_active ? 'open' : 'closed'),
    is_active: params.status ? (params.status === 'open' || params.status === 'active') : Boolean(params.is_active),
    announcement_text: params.announcement_text || ''
  };
  try {
    if (targetId) {
      await supabaseRest(`ppdb_periods?id=eq.${encodeURIComponent(targetId)}`, 'PATCH', dbPayload);
    } else {
      targetId = 'PER-2026-1';
      await supabaseRest('ppdb_periods', 'POST', { id: targetId, ...dbPayload });
    }
  } catch (e) { console.warn('[SIYAYASAN] ppdb_periods update error:', e); }
  const savedPeriod = { id: targetId || 'PER-2026-1', ...dbPayload };
  localStorage.setItem('siy_ppdb_period', JSON.stringify(savedPeriod));
  return { ok: true, data: savedPeriod, message: 'Pengaturan periode PPDB disimpan' };
}

```

### 🛠️ DIRECTIVE UNTUK ANTIGRAVITY

* **Target File:** `frontend/portal/admin/ppdb.html` (baris 243, 288–299) dan `frontend/shared/js/api.js` (baris 1573–1593).

* **Instruksi Eksekusi:**

  1. Perbarui evaluasi `isOpen` di `admin/ppdb.html` agar menerima `'open'` maupun `'active'`.

  2. Sertakan `id: currentPeriod?.id` saat mengirim form pengaturan periode di `admin/ppdb.html`.

  3. Perbarui handler `updatePeriod`/`savePeriod` di `api.js` agar mengecek ID periode aktif di tabel `ppdb_periods` terlebih dahulu jika `params.id` kosong, dan memetakan kolom ` table ppdb_periods` secara eksplisit (menghindari pengiriman properti tak dikenal yang membuat PostgREST menolak query `PATCH`).

### 🔴 BUG-04: Tab "Approved" Kosong & Filter Jenis Formulir (PAUD/TPQ) Tidak Bekerja di Admin PPDB

* **Sistem Integrasi Terdampak:** Portal Admin PPDB (`frontend/portal/admin/ppdb.html`) $\leftrightarrow$ `frontend/shared/js/api.js` (`ppdb/list` & `ppdb/approve`).

* **Lokasi File & Baris Kode:**

  1. `frontend/portal/admin/ppdb.html` (baris **41**, **315–326**, **356–358**)

  2. `frontend/shared/js/api.js` (baris **1336–1342**, **1607–1613**)

* **Penjelasan Cacat Logika:**

  1. Saat Admin menyetujui pendaftaran (`approveReg`), `api.js` baris 1609 mengubah status di database menjadi `status: 'accepted'`.

  2. Namun tombol tab **"Approved"** di `admin/ppdb.html` baris 41 memiliki atribut `data-status="approved"`, yang mengirimkan `params.status = 'approved'` ke `apiCall('ppdb', 'list', params)`.

  3. Di `api.js` baris 1338, query yang dijalankan adalah:

     ```
     if (params.status) query += `&status=eq.${encodeURIComponent(params.status)}`;
     
     ```

     Karena di database nilainya `'accepted'` sedangkan yang dicari `'approved'`, **tab Approved di Portal Admin selalu menampilkan 0 data (kosong)** meskipun sudah banyak pendaftar yang disetujui!

  4. Selain itu, dropdown `#filter-type` (`paud` / `tpq`) di `admin/ppdb.html` mengirimkan `params.form_type`, tetapi `api.js` baris 1336–1342 **sama sekali tidak memiliki kode filter untuk `params.form_type` maupun `params.level`**!

* **Opsi Kode Perbaikan (`frontend/shared/js/api.js` baris 1335–1345):**

```
if (action === 'list') {
  let query = 'ppdb_registrations?select=*&order=created_at.desc';
  if (params.status) {
    if (params.status === 'approved' || params.status === 'accepted') {
      query += `&status=in.(approved,accepted)`;
    } else {
      query += `&status=eq.${encodeURIComponent(params.status)}`;
    }
  }
  if (params.form_type) {
    query += `&form_type=eq.${encodeURIComponent(params.form_type.toLowerCase())}`;
  }
  if (params.level) {
    query += `&program_choice=ilike.*${encodeURIComponent(params.level)}*`;
  }
  if (params.search) {
    query += `&or=(full_name.ilike.*${encodeURIComponent(params.search)}*,reg_number.ilike.*${encodeURIComponent(params.search)}*,registration_number.ilike.*${encodeURIComponent(params.search)}*)`;
  }
  const rows = await supabaseRest(query);
  return { ok: true, data: (rows || []).map(normalizePpdbRow) };
}

```

### 🛠️ DIRECTIVE UNTUK ANTIGRAVITY

* **Target File:** `frontend/shared/js/api.js` (baris 1335–1345).

* **Instruksi Eksekusi:** Ganti logika filter `ppdb/list` di `api.js` agar status `'approved'` dan `'accepted'` difilter menggunakan operator PostgREST `in.(approved,accepted)`, serta tambahkan filter `form_type` dan `level`.

### 🔴 BUG-05: Keempat Kartu KPI Keuangan di Halaman Pembayaran SPP Admin Selalu Menampilkan `Rp 0`

* **Sistem Integrasi Terdampak:** Portal Admin Kasir SPP (`frontend/portal/admin/payments.html`) $\leftrightarrow$ `frontend/shared/js/api.js` (`payments/summary`).

* **Lokasi File & Baris Kode:**

  1. `frontend/shared/js/api.js` (baris **1312–1329**)

  2. `frontend/portal/admin/payments.html` (baris **330–348**)

* **Penjelasan Cacat Logika:**
  Terjadi ketidakcocokan nama properti (*key mismatch*) antara respons API dan pemanggilan di frontend:

  * Di `frontend/shared/js/api.js` baris 1322–1327, `payments/summary` mengembalikan key berbahasa Indonesia:

    ```
    return {
      ok: true,
      data: {
        total_tagihan: totalTagihan,
        total_lunas: totalLunas,
        total_tunggakan: totalTunggakan,
        menunggu_verifikasi: menungguVerifikasi
      }
    };
    
    ```

  * Sedangkan di `frontend/portal/admin/payments.html` baris 333–337, frontend membaca key berbahasa Inggris:

    ```
    document.getElementById('sum-total').textContent = formatRupiah(res.data.total_invoice || 0);
    document.getElementById('sum-paid').textContent = formatRupiah(res.data.total_paid || 0);
    document.getElementById('sum-unpaid').textContent = formatRupiah(res.data.total_outstanding || 0);
    document.getElementById('sum-pending').textContent = res.data.pending_verification || 0;
    
    ```

  Akibatnya keempat nilai tersebut selalu `undefined` dan jatuh ke fallback `0` (`Rp 0`)!

* **Opsi Kode Perbaikan (`frontend/shared/js/api.js` baris 1321–1329):**

```
return {
  ok: true,
  data: {
    total_tagihan: totalTagihan,
    total_lunas: totalLunas,
    total_tunggakan: totalTunggakan,
    menunggu_verifikasi: menungguVerifikasi,
    total_invoice: totalTagihan,
    total_paid: totalLunas,
    total_outstanding: totalTunggakan,
    pending_verification: menungguVerifikasi
  }
};

```

### 🛠️ DIRECTIVE UNTUK ANTIGRAVITY

* **Target File:** `frontend/shared/js/api.js` (baris 1321–1329) dan `frontend/portal/admin/payments.html` (baris 333–337).

* **Instruksi Eksekusi:** Sertakan kedua versi nama properti (Indonesia & Inggris) pada respons `payments/summary` di `api.js` untuk menjamin kompatibilitas penuh di seluruh halaman Admin.

### 🔴 BUG-06: Tombol "Tarik (Draft) / Terbitkan" Konten CMS Macet, Konten Draft Bocor ke Publik, Kategori Pengumuman Hilang & Tidak Ada Tombol Edit/Hapus Galeri

* **Sistem Integrasi Terdampak:** Portal Admin Manajemen Konten (`frontend/portal/admin/content.html`) $\leftrightarrow$ `frontend/shared/js/api.js` (`news`, `announcements`, `events`, `gallery`) $\leftrightarrow$ Website Utama (`index.html`, `berita.html`, `pengumuman.html`, `agenda.html`, `galeri.html`).

* **Lokasi File & Baris Kode:**

  1. `database/MASTER_SUPABASE_SETUP_V2.sql` (baris **369**, **383**, **397**)

  2. `frontend/portal/admin/content.html` (baris **179–196**, **206–239**, **294–305**)

  3. `frontend/shared/js/api.js` (baris **1781–1964**)

  4. `frontend/public/pengumuman.html` (baris **132**)

* **Penjelasan Cacat Logika:**

  1. **Bug Status Terbit/Draft Macet:** Di skema database (`MASTER_SUPABASE_SETUP_V2.sql`), tabel `news`, `announcements`, dan `events` memiliki dua kolom status sekaligus: `status TEXT DEFAULT 'published'` dan `is_published BOOLEAN DEFAULT TRUE`.
     Saat Admin menekan tombol **"Tarik (Draft)"** (`togglePublish` di `admin/content.html` baris 294–305), `api.js` hanya mengubah `status: 'draft'`, tetapi **tidak mengubah `is_published` menjadi `false`**.
     Padahal di `admin/content.html` baris 179, status terbit dievaluasi dengan:

     ```
     const isPub = (item.status === 'published' || item.status === 'pinned' || item.is_published === true || item.is_published === 'TRUE');
     
     ```

     Karena `item.is_published` di database tetap `true`, variabel `isPub` **selalu bernilai `true`** walaupun `item.status` sudah `'draft'`! Akibatnya badge di Admin selalu bertuliskan **"Terbit"** dan tombol **"Tarik (Draft)"** terlihat tidak berfungsi sama sekali!

  2. **Konten Draft Tampil di Website Publik:** Di `api.js` baris 1782 (`news/list`), 1838 (`announcements/list`), dan 1882 (`events/list`), query mengambil seluruh baris tanpa memfilter status ketika diakses dari halaman publik (`berita.html`, `pengumuman.html`, `agenda.html`, `index.html`).

  3. **Kategori Pengumuman Hilang:** Saat Admin membuat pengumuman dengan kategori (misal `"Libur Sekolah"`), `api.js` baris 1848 menyimpannya ke kolom `target_audience` dan `target_role`, sedangkan `public/pengumuman.html` baris 132 membaca `a.category || 'Edaran'`. Karena objek pengumuman tidak memiliki properti `category`, semua pengumuman di publik selalu berlabel `"Edaran"`.

  4. **Tidak Ada Tombol Hapus di Tab Galeri & Tidak Ada Fitur Edit Konten:** Pada fungsi `renderGallery()` di `admin/content.html` baris 218–225, kartu foto galeri hanya menampilkan gambar dan judul **tanpa tombol Hapus (`deleteItem`)**, sehingga foto galeri yang salah unggah tidak bisa dihapus oleh Admin! Selain itu, baris tabel Berita, Pengumuman, dan Agenda belum memiliki tombol **Edit**.

* **Opsi Kode Perbaikan (`frontend/shared/js/api.js` & `frontend/portal/admin/content.html`):**

```
// 1. Di frontend/portal/admin/content.html baris 179:
// Prioritaskan item.status jika tersedia agar status 'draft' terbaca dengan benar
const isPub = item.status
  ? (item.status === 'published' || item.status === 'pinned')
  : (item.is_published === true || item.is_published === 'TRUE');

// 2. Di frontend/shared/js/api.js pada news/create & news/update (serta announcements & events):
// Pastikan is_published selalu disinkronkan dengan status:
const nextStatus = params.status || 'published';
const isPublishedBool = (nextStatus === 'published' || nextStatus === 'pinned');
// Sertakan di payload POST dan PATCH:
status: nextStatus,
is_published: isPublishedBool

// 3. Di frontend/shared/js/api.js pada announcements/list (baris 1838):
// Petakan kolom target_audience ke properti category agar terbaca di pengumuman.html
const rows = await supabaseRest('announcements?select=*&order=created_at.desc');
return {
  ok: true,
  data: (rows || []).map(r => ({
    ...r,
    category: r.category || r.target_audience || r.target_role || 'Edaran'
  }))
};

// 4. Di frontend/portal/admin/content.html baris 218-225 (Fungsi renderGallery):
// Tambahkan tombol Hapus pada setiap kartu foto Galeri
grid.innerHTML = items.map(g => `
  <div class="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video shadow-xs">
    <img src="${g.image_url || 'https://placehold.co/400x300?text=No+Image'}" alt="${g.title || g.caption || ''}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
    <button onclick="deleteItem('gallery', '${g.id}')" title="Hapus Foto" class="absolute top-2.5 right-2.5 w-8 h-8 rounded-lg bg-red-600/90 hover:bg-red-700 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10">
      <i class="fas fa-trash text-xs"></i>
    </button>
    <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex flex-col justify-end p-4 pointer-events-none">
      <span class="text-[10px] font-bold uppercase tracking-wider text-sky-400">${g.category || 'Umum'}</span>
      <h4 class="text-white font-semibold text-sm line-clamp-1">${g.title || g.caption || '-'}</h4>
    </div>
  </div>
`).join('');

```

### 🛠️ DIRECTIVE UNTUK ANTIGRAVITY

* **Target File:** `frontend/portal/admin/content.html` (baris 179–239, 294–305) dan `frontend/shared/js/api.js` (baris 1781–1964).

* **Instruksi Eksekusi:**

  1. Sinkronkan nilai boolean `is_published` dengan `status` (`published`/`pinned` $\rightarrow$ `true`, `draft` $\rightarrow$ `false`) pada setiap operasi `create` dan `update` di modul `news`, `announcements`, dan `events` dalam `api.js`.

  2. Perbaiki logika `isPub` di `admin/content.html` baris 179 agar memeriksa `item.status` terlebih dahulu.

  3. Tambahkan tombol hapus (`deleteItem('gallery', g.id)`) pada setiap kartu di `renderGallery()` dan tombol edit pada baris tabel konten.

  4. Petakan `category: r.category || r.target_audience || 'Edaran'` pada `announcements/list`.

### 🔴 BUG-07: Desinkronisasi Data Pendaftar PPDB $\leftrightarrow$ Portal Siswa Mandiri (`dashboard.html`, `dokumen.html`, `biodata.html`) $\leftrightarrow$ Verifikasi Admin

* **Sistem Integrasi Terdampak:** Formulir PPDB Online (`ppdb.html`) $\leftrightarrow$ Portal Siswa Mandiri (`portal/siswa/dashboard.html`, `dokumen.html`, `biodata.html`) $\leftrightarrow$ Portal Admin PPDB (`portal/admin/ppdb.html`).

* **Lokasi File & Baris Kode:**

  1. `frontend/shared/js/api.js` (baris **556–637**, **1502–1517**, **1621–1775**)

  2. `frontend/portal/siswa/dashboard.html` (baris **294–305**, **383**, **471–492**)

  3. `frontend/portal/siswa/dokumen.html` (baris **190–265**)

* **Penjelasan Cacat Logika:**

  1. **Berkas PPDB Tidak Muncul di Portal Siswa (`dokumen.html`):** Saat calon siswa mendaftar di `ppdb.html` beserta unggahan Pas Foto, Akta Kelahiran, dan Kartu Keluarga, `api.js` (`ppdb/submitPublic` baris 1502–1517) membuat record di `ppdb_registrations` dan `students`, namun **tidak menyalin ketiga berkas tersebut ke tabel `student_documents`**! Akibatnya ketika calon siswa login ke Portal Siswa dan membuka menu **Dokumen Persyaratan** (`siswa/dokumen.html`), ke-4 kartu dokumen berstatus **"Belum Diunggah"** dan tabel di bawahnya tertulis **"Belum ada dokumen yang diunggah"**.

  2. **Upload Dokumen dari Portal Siswa Tidak Terlihat oleh Admin di `admin/ppdb.html`:** Sebaliknya, ketika calon siswa mengunggah dokumen di `siswa/dokumen.html` (`siswa/upload_document` di `api.js` baris 1692–1752), file hanya masuk ke tabel `student_documents` dan **tidak mengupdate kolom `photo_url`, `birth_certificate_url`, atau `family_card_url` pada tabel `ppdb_registrations`**! Akibatnya Admin yang membuka modal Detail Pendaftar di `admin/ppdb.html` melihat berkas pendaftar tetap kosong!

  3. **Field Biodata Siswa Kosong Saat Dibuat dari PPDB:** Pada `api.js` baris 1502–1516, objek `newStudent` yang di-insert ke tabel `students` hanya mengisi `full_name`, `gender`, `birth_place`, `birth_date`, `parent_name`, `parent_phone`, tetapi **tidak menyertakan `address`, `nickname`, `nik`, `father_name`, `mother_name`, dan `photo_url`** yang sudah diisi di form PPDB.

  4. **Tracker Progres PPDB di Dashboard Siswa Mati di Tahap 2, 3, dan 4:** Di `frontend/portal/siswa/dashboard.html`:

     * Baris 383 menampilkan `student.id` (`STU-...`) sebagai Nomor Pendaftaran, bukan `reg_number` (`REG-2026-XXXX`).

     * Fungsi `updatePPDBTracker(student)` di baris 471–492 hanya mengecek `if (student.full_name && student.birth_date && student.address)` untuk Tahap 2 (yang selalu gagal karena `student.address` tidak disalin), sedangkan **Tahap 3 (`step-3-icon`, `step-3-text`: Berkas Dokumen) dan Tahap 4 (`step-4-icon`, `step-4-text`: Hasil Verifikasi) sama sekali tidak ada kodenya**!

     * Bagian **Pengumuman Sekolah** di `siswa/dashboard.html` baris 294–305 masih berupa HTML statis hardcoded dan tidak memanggil `apiCall('announcements', 'list')`.

* **Opsi Kode Perbaikan (`frontend/shared/js/api.js` & `frontend/portal/siswa/dashboard.html`):**

```
// 1. Di frontend/shared/js/api.js baris 1502-1525 (ppdb/create & ppdb/submitPublic):
// Sertakan field lengkap pada newStudent dan sinkronkan berkas awal ke student_documents
const newStudent = {
  id: newStudentId,
  nis: generatedNis,
  pin: generatedPin,
  full_name: params.full_name || '',
  nickname: params.nickname || '',
  nik: params.nik || '',
  gender: params.gender || 'L',
  birth_place: params.birth_place || '',
  birth_date: params.birth_date || null,
  address: params.address || '',
  father_name: params.father_name || '',
  mother_name: params.mother_name || '',
  parent_name: params.father_name || params.mother_name || params.parent_name || 'Wali',
  parent_phone: params.phone || params.parent_phone || '',
  program: (params.program_choice || params.form_type || 'PAUD').toUpperCase(),
  level: (params.program_choice || params.form_type || 'PAUD').toUpperCase(),
  status: 'calon_siswa',
  photo_url: photoUrl || ''
};
try { await supabaseRest('students', 'POST', newStudent); } catch (e) {}

// Sinkronkan berkas yang diunggah saat PPDB ke tabel student_documents:
const initialDocs = [
  { type: 'pas_foto', name: 'Pas Foto 3x4', url: photoUrl },
  { type: 'akta_kelahiran', name: 'Akta Kelahiran', url: aktaUrl },
  { type: 'kartu_keluarga', name: 'Kartu Keluarga', url: kkUrl }
].filter(d => d.url);
for (const doc of initialDocs) {
  try {
    await supabaseRest('student_documents', 'POST', {
      id: 'DOC-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      student_id: newStudentId,
      document_type: doc.type,
      file_name: doc.name,
      file_url: doc.url,
      status: 'pending'
    });
  } catch (e) {}
}

// 2. Di frontend/shared/js/api.js baris 1705-1735 (siswa/upload_document):
// Sinkronkan juga URL dokumen baru ke tabel ppdb_registrations agar langsung tampil di Admin PPDB
const docColMap = {
  pas_foto: 'photo_url',
  akta_kelahiran: 'birth_certificate_url',
  kartu_keluarga: 'family_card_url'
};
if (docColMap[docType]) {
  try {
    await supabaseRest(
      `ppdb_registrations?or=(student_id.eq.${encodeURIComponent(studentId)},full_name.eq.${encodeURIComponent(session?.name || '')})`,
      'PATCH',
      { [docColMap[docType]]: finalFileUrl }
    );
  } catch (e) {}
}

// 3. Di frontend/portal/siswa/dashboard.html baris 471-492 (Fungsi updatePPDBTracker):
function updatePPDBTracker(student, docs = [], ppdbReg = null) {
  if (ppdbReg && ppdbReg.reg_number) {
    document.getElementById('calon-reg-no').textContent = ppdbReg.reg_number;
  }
  // Step 2: Biodata
  if (student.full_name && student.birth_date && (student.address || ppdbReg?.address)) {
    const s2Icon = document.getElementById('step-2-icon');
    const s2Text = document.getElementById('step-2-text');
    if (s2Icon) {
      s2Icon.className = 'w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-primary-500/20';
      s2Icon.innerHTML = '<i class="fas fa-check"></i>';
    }
    if (s2Text) {
      s2Text.textContent = 'Sudah lengkap';
      s2Text.className = 'text-[11px] text-primary-600 font-medium mt-0.5';
    }
  }
  // Step 3: Berkas Dokumen
  const uploadedCount = (docs || []).length;
  const s3Icon = document.getElementById('step-3-icon');
  const s3Text = document.getElementById('step-3-text');
  if (uploadedCount >= 3 && s3Icon && s3Text) {
    s3Icon.className = 'w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-primary-500/20';
    s3Icon.innerHTML = '<i class="fas fa-check"></i>';
    s3Text.textContent = `${uploadedCount} berkas terunggah`;
    s3Text.className = 'text-[11px] text-primary-600 font-medium mt-0.5';
  } else if (uploadedCount > 0 && s3Text) {
    s3Text.textContent = `${uploadedCount}/3 berkas wajib terunggah`;
    s3Text.className = 'text-[11px] text-amber-600 font-medium mt-0.5';
  }
  // Step 4: Hasil Verifikasi
  const regStatus = (ppdbReg?.status || student.ppdb_status || 'pending').toLowerCase();
  const s4Icon = document.getElementById('step-4-icon');
  const s4Text = document.getElementById('step-4-text');
  if ((regStatus === 'accepted' || regStatus === 'approved' || regStatus === 'converted') && s4Icon && s4Text) {
    s4Icon.className = 'w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-primary-500/20';
    s4Icon.innerHTML = '<i class="fas fa-check-double"></i>';
    s4Text.textContent = 'Diverifikasi & Diterima';
    s4Text.className = 'text-[11px] text-primary-600 font-semibold mt-0.5';
  } else if (regStatus === 'rejected' && s4Text) {
    s4Text.textContent = 'Belum disetujui';
    s4Text.className = 'text-[11px] text-red-600 font-semibold mt-0.5';
  }
}

```

### 🛠️ DIRECTIVE UNTUK ANTIGRAVITY

* **Target File:** `frontend/shared/js/api.js` (baris 1502–1530, 1650–1752) dan `frontend/portal/siswa/dashboard.html` (baris 294–305, 383, 471–492).

* **Instruksi Eksekusi:**

  1. Salin seluruh field biodata dan 3 dokumen awal PPDB ke tabel `students` dan `student_documents` saat `ppdb/submitPublic` dijalankan.

  2. Saat `siswa/upload_document` dijalankan di Portal Siswa, lakukan `PATCH` juga ke kolom terkait di `ppdb_registrations` agar Admin langsung dapat memeriksa dokumen tersebut di `admin/ppdb.html`.

  3. Lengkapi fungsi `updatePPDBTracker()` di `siswa/dashboard.html` untuk memperbarui Step 2, Step 3, Step 4, dan nomor registrasi `REG-...`, serta muat daftar pengumuman dinamis dari `apiCall('announcements', 'list')`.

### 🔴 BUG-08: Ketidaksesuaian Role 2-Portal di `admin/users.html`, Jenjang TPQ/TK di `admin/classes.html`, & Filter Guru di `admin/teachers.html`

* **Sistem Integrasi Terdampak:** Portal Admin (`users.html`, `classes.html`, `teachers.html`) $\leftrightarrow$ Sistem Autentikasi 2-Portal (`auth.js`) & `api.js`.

* **Lokasi File & Baris Kode:**

  1. `frontend/portal/admin/users.html` (baris **30–37**, **81–86**, **200–203**, **214–244**)

  2. `frontend/portal/admin/classes.html` (baris **38–40**, **120**, **151**)

  3. `frontend/portal/admin/teachers.html` (baris **28–32**, **72**, **104–107**) & `frontend/shared/js/api.js` (baris **779–789**)

* **Penjelasan Cacat Logika:**

  1. **Role Warisan V1 di `admin/users.html`:** Dropdown filter dan form tambah/edit pengguna di `users.html` masih menyediakan opsi `admin`, `guru`, `orang_tua`, `pendaftar` dan **tidak menyediakan `super_admin`, `siswa_aktif`, maupun `calon_siswa`**! Padahal di `frontend/shared/js/auth.js` baris 91–94, sistem menggunakan arsitektur **2-Portal** (Admin: `admin`/`super_admin`; Siswa: `siswa`/`siswa_aktif`/`calon_siswa`). Jika Admin membuat akun dengan role `guru` atau `orang_tua`, akun tersebut akan ditolak oleh `requireAuth()` dan terpental kembali ke halaman `/login.html`! Selain itu, belum ada tombol **Hapus User** di baris tabel `users.html`.

  2. **Jenjang TPQ & TK Hilang di `admin/classes.html`:** Dropdown `#form-grade` di `classes.html` baris 38–40 hanya memiliki opsi `PAUD`, `TK_A`, dan `TK_B`. Tidak ada opsi **`TPQ`** maupun **`TK`**, padahal di database (`MASTER_SUPABASE_SETUP_V2.sql` baris 595) terdapat kelas `CLS-004` (`TPQ Iqra 1`, level `TPQ`). Jika Admin mengedit kelas TPQ tersebut, dropdown Tingkat menjadi kosong!

  3. **Filter Status Guru & Pencarian NIP di `admin/teachers.html`:** Dropdown `#filter-active` (`true`/`false`) dikirim ke `apiCall('teachers', 'list', params)`, tetapi `api.js` baris 779–789 sama sekali mengabaikan `params.is_active`, hanya mencari berdasarkan `full_name.ilike` (mengabaikan pencarian `nip`), dan belum menyediakan tombol **Hapus Guru** di tabel.

* **Opsi Kode Perbaikan:**

```
<!-- 1. Di frontend/portal/admin/users.html baris 30-37 & 81-86: Sesuaikan dengan Arsitektur 2-Portal -->
<select id="filter-role" onchange="loadUsers()" class="px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-primary-500">
  <option value="">Semua Role</option>
  <option value="super_admin">Super Admin</option>
  <option value="admin">Admin Operasional</option>
  <option value="siswa_aktif">Siswa Aktif</option>
  <option value="calon_siswa">Calon Siswa (PPDB)</option>
</select>

<!-- 2. Di frontend/portal/admin/classes.html baris 38-40: Tambahkan opsi TPQ dan TK -->
<select id="form-grade" required class="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-primary-500">
  <option value="PAUD">PAUD Terpadu</option>
  <option value="TK_A">TK A</option>
  <option value="TK_B">TK B</option>
  <option value="TK">TK Umum</option>
  <option value="TPQ">TPQ (Taman Pendidikan Al-Qur'an)</option>
</select>

```

```
// 3. Di frontend/shared/js/api.js baris 779-789 (teachers/list):
if (action === 'list') {
  let query = 'teachers?select=*&order=full_name.asc';
  if (params.search) {
    query += `&or=(full_name.ilike.*${encodeURIComponent(params.search)}*,nip.ilike.*${encodeURIComponent(params.search)}*,subject_specialty.ilike.*${encodeURIComponent(params.search)}*)`;
  }
  if (params.is_active !== undefined && params.is_active !== '') {
    const isAct = (params.is_active === true || params.is_active === 'true' || params.is_active === 1 || params.is_active === '1');
    query += `&is_active=eq.${isAct}`;
  }
  const rows = await supabaseRest(query);
  return { ok: true, data: (rows || []).map(normalizeTeacherRow) };
}

```

### 🛠️ DIRECTIVE UNTUK ANTIGRAVITY

* **Target File:** `frontend/portal/admin/users.html`, `frontend/portal/admin/classes.html`, `frontend/portal/admin/teachers.html`, dan `frontend/shared/js/api.js` (baris 779–789).

* **Instruksi Eksekusi:**

  1. Perbarui opsi role di `users.html` menjadi `super_admin`, `admin`, `siswa_aktif`, dan `calon_siswa`, serta tambahkan tombol hapus user (`users/delete`).

  2. Tambahkan opsi `TPQ` dan `TK` pada `#form-grade` di `classes.html` dan perbarui badge warna jenjang di baris 120.

  3. Tambahkan dukungan filter `is_active` dan pencarian `nip` pada `teachers/list` di `api.js`, serta tambahkan tombol hapus guru (`teachers/delete`) di `teachers.html`.

### 🔴 BUG-09: Duplikasi Blok Dead-Code Dashboard, Activity Log Kosong Permanen (`logs.html`), & Restore Database Semu (`backup.html`)

* **Sistem Integrasi Terdampak:** Portal Admin (`dashboard.html`, `logs.html`, `backup.html`) $\leftrightarrow$ `frontend/shared/js/api.js`.

* **Lokasi File & Baris Kode:**

  1. `frontend/shared/js/api.js` (baris **642–686** vs **2267–2346**; baris **2017–2023**; baris **2226–2233**)

  2. `frontend/portal/admin/logs.html` (baris **75–112**)

  3. `frontend/portal/admin/backup.html` (baris **345–392**)

* **Penjelasan Cacat Logika:**

  1. **Duplikasi Blok `if (module === 'dashboard')` di `api.js`:** Terdapat dua blok handler untuk `module === 'dashboard'` di `api.js`: satu di baris 642 dan satu lagi di baris 2267. Karena blok pertama di baris 642 langsung mengeksekusi `return`, blok kedua di baris 2267 menjadi *dead code*. Blok pertama di baris 642 tidak menghitung `ppdb_this_month`, sehingga sub-label **"Bulan ini: 0"** pada kartu Total Pendaftar PPDB di Dashboard Admin selalu bernilai `0`!

  2. **Halaman Log Aktivitas (`logs.html`) Selalu Kosong:**

     * Tidak ada fungsi helper pencatat log di `api.js` saat Admin melakukan aksi penting (login, verifikasi PPDB, konversi siswa, verifikasi SPP, tambah konten, dll.).

     * Di `api.js` baris 2019 (`logs/list`), seluruh parameter filter dari `logs.html` (`params.action`, `params.module`, `params.search`) diabaikan.

     * Di `logs.html` baris 110, tabel merender `l.description`, padahal kolom di tabel database `activity_logs` (`MASTER_SUPABASE_SETUP_V2.sql` baris 417) bernama `details` (dan `entity_type`), sehingga meskipun ada data di database, kolom Deskripsi akan tertulis `undefined` / `-`!

  3. **Fitur Restore Backup (`backup/restore`) Hanya Menyimpan ke `localStorage`:** Di `api.js` baris 2226–2233, saat Admin mengunggah file `.json` backup dan menekan **Mulai Restore Data**, kode hanya menjalankan:

     ```
     localStorage.setItem('siy_restored_snapshot', JSON.stringify(params.data || params));
     return { ok: true, message: 'Data berhasil direstore ke sistem lokal' };
     
     ```

     Data backup **sama sekali tidak di-upsert kembali ke tabel-tabel Supabase** (`students`, `teachers`, `classes`, `ppdb_registrations`, `invoices`, `news`, `cms_settings`, dll.)!

* **Opsi Kode Perbaikan (`frontend/shared/js/api.js` & `frontend/portal/admin/logs.html`):**

```
// 1. Tambahkan helper recordActivityLog() di frontend/shared/js/api.js:
async function recordActivityLog(actionType, entityType, detailsText, entityId = '') {
  try {
    const sess = JSON.parse(localStorage.getItem('siyayasan_session_v2') || 'null');
    await supabaseRest('activity_logs', 'POST', {
      user_id: sess?.id || null,
      user_name: sess?.name || 'Admin',
      user_role: sess?.role || 'admin',
      action: actionType,
      entity_type: entityType,
      entity_id: String(entityId || ''),
      details: detailsText
    });
  } catch (e) {}
}

// 2. Perbaiki logs/list di frontend/shared/js/api.js baris 2017-2023:
if (module === 'logs') {
  if (action === 'list') {
    let q = 'activity_logs?select=*&order=created_at.desc&limit=100';
    if (params.action) q += `&action=ilike.*${encodeURIComponent(params.action)}*`;
    if (params.module) q += `&entity_type=ilike.*${encodeURIComponent(params.module)}*`;
    if (params.search) q += `&or=(details.ilike.*${encodeURIComponent(params.search)}*,user_name.ilike.*${encodeURIComponent(params.search)}*)`;
    const rows = await supabaseRest(q);
    return {
      ok: true,
      data: (rows || []).map(r => ({
        ...r,
        module: r.module || r.entity_type || 'sistem',
        description: r.description || r.details || '-'
      }))
    };
  }
}

// 3. Gabungkan perhitungan ppdb_this_month ke dashboard/summary di api.js baris 642-686 dan hapus blok duplikat di baris 2267:
const nowMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
const ppdbThisMonth = (ppdb || []).filter(p => String(p.created_at || p.registration_date || '').startsWith(nowMonth)).length;
// Sertakan ppdb_this_month: ppdbThisMonth di dalam return data dashboard/summary

```

### 🛠️ DIRECTIVE UNTUK ANTIGRAVITY

* **Target File:** `frontend/shared/js/api.js` (baris 642–686, 2017–2023, 2226–2346) dan `frontend/portal/admin/logs.html` (baris 75–112).

* **Instruksi Eksekusi:**

  1. Tambahkan `ppdb_this_month` pada handler `dashboard` utama di baris 642 dan hapus blok `if (module === 'dashboard')` duplikat di baris 2267.

  2. Implementasikan `recordActivityLog()` pada aksi-aksi mutasi utama di `api.js` dan petakan `description: r.description || r.details` serta `module: r.module || r.entity_type` pada `logs/list`.

  3. Pada `backup/restore` (`api.js` baris 2226), lakukan iterasi `POST` (dengan header `Prefer: resolution=merge-duplicates,return=representation`) ke tabel-tabel Supabase yang ada di dalam objek `tables` dari file JSON backup.

### 🟡 BUG-10: Teks Terbilang Kuitansi SPP Hardcoded `# Seratus Lima Puluh Ribu Rupiah #` & Field `paid_by`

* **Sistem Integrasi Terdampak:** Cetak Kuitansi SPP di Portal Siswa (`frontend/portal/siswa/spp.html`) & Portal Admin (`frontend/portal/admin/payments.html`).

* **Lokasi File & Baris Kode:**

  1. `frontend/portal/siswa/spp.html` (baris **367** & **425**)

  2. `frontend/portal/admin/payments.html` (baris **758** & **816**)

* **Penjelasan Cacat Logika:**
  Pada template cetak kuitansi di kedua portal:

  * Baris 367 (`spp.html`) dan 758 (`payments.html`) membaca `inv.paid_by || 'Orang Tua / Wali'`, padahal kolom di tabel `invoices` adalah `payment_method` (misal `"Transfer Bank"` atau `"Tunai"`).

  * Baris 425 (`spp.html`) dan 816 (`payments.html`) mematok teks terbilang secara statis:

    ```
    <div style="..."># Seratus Lima Puluh Ribu Rupiah #</div>
    
    ```

    Akibatnya jika Admin mencetak kuitansi untuk tagihan seragam (`Rp 450.000`) atau tunggakan 2 bulan (`Rp 300.000`), angka nominal tertulis `Rp 450.000` tetapi kotak Terbilang tetap tertulis **`# Seratus Lima Puluh Ribu Rupiah #`**!

* **Opsi Kode Perbaikan (`frontend/portal/siswa/spp.html` & `frontend/portal/admin/payments.html`):**

```
function angkaKeTerbilang(n) {
  n = Math.abs(Math.floor(Number(n) || 0));
  if (n === 0) return 'Nol';
  const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  function konversi(x) {
    if (x < 12) return satuan[x];
    if (x < 20) return konversi(x - 10) + ' Belas';
    if (x < 100) return konversi(Math.floor(x / 10)) + ' Puluh' + (x % 10 ? ' ' + konversi(x % 10) : '');
    if (x < 200) return 'Seratus' + (x - 100 ? ' ' + konversi(x - 100) : '');
    if (x < 1000) return konversi(Math.floor(x / 100)) + ' Ratus' + (x % 100 ? ' ' + konversi(x % 100) : '');
    if (x < 2000) return 'Seribu' + (x - 1000 ? ' ' + konversi(x - 1000) : '');
    if (x < 1000000) return konversi(Math.floor(x / 1000)) + ' Ribu' + (x % 1000 ? ' ' + konversi(x % 1000) : '');
    if (x < 1000000000) return konversi(Math.floor(x / 1000000)) + ' Juta' + (x % 1000000 ? ' ' + konversi(x % 1000000) : '');
    return String(x);
  }
  return `# ${konversi(n).trim()} Rupiah #`;
}

```

### 🛠️ DIRECTIVE UNTUK ANTIGRAVITY

* **Target File:** `frontend/portal/siswa/spp.html` (baris 367, 425) dan `frontend/portal/admin/payments.html` (baris 758, 816).

* **Instruksi Eksekusi:** Tambahkan fungsi `angkaKeTerbilang(inv.amount)` untuk menggantikan string statis `# Seratus Lima Puluh Ribu Rupiah #`, serta tampilkan metode pembayaran dari `inv.payment_method || 'Tunai / Transfer'`.

### 🟡 BUG-11: Format Nomor WhatsApp `wa.me/0813...` Tidak Valid di Submit Kontak, Tagline CMS Tidak Tampil, & Script `supabase-config.js` Absen di Admin

* **Sistem Integrasi Terdampak:** Website Utama (`frontend/public/kontak.html`, `frontend/public/js/public-shell.js`) $\leftrightarrow$ Pengaturan CMS Admin (`frontend/portal/admin/cms_setting.html`) & Seluruh Halaman Admin (`frontend/portal/admin/*.html`).

* **Lokasi File & Baris Kode:**

  1. `frontend/public/kontak.html` (baris **329**, **359**, **374–392**)

  2. `frontend/public/js/public-shell.js` (baris **258**, **340–410**)

  3. Seluruh 12 file di `frontend/portal/admin/*.html` (bagian bawah `<body>`)

* **Penjelasan Cacat Logika:**

  1. Di `frontend/public/kontak.html` baris 329, nilai default `currentWaNumber` adalah `'081347142829'`. Pada baris 359 (`btnWa`), nomor tersebut dikonversi menjadi awalan `'62'`, namun variabel `currentWaNumber` itu sendiri tidak diubah! Akibatnya ketika pengunjung mengisi formulir **"Kirim Pesan"** dan menekan tombol submit (baris 384), browser membuka `https://wa.me/081347142829?text=...` (dengan angka `0` di depan) yang ditolak oleh API WhatsApp (`Nomor telepon yang dibagikan melalui tautan tidak valid`). Selain itu, form tersebut tidak memanggil `apiCall('contact', 'create', ...)` untuk menyimpan pesan ke tabel `contact_messages`.

  2. Di `frontend/portal/admin/cms_setting.html`, Admin dapat mengubah **Tagline / Slogan**, namun `frontend/public/js/public-shell.js` tidak pernah menyuntikkan `s.tagline` ke `#site-footer-desc` atau elemen publik.

  3. Seluruh 12 file di `frontend/portal/admin/*.html` hanya memuat `auth.js`, `api.js`, dan `shell.js` tanpa memuat `<script src="../../shared/js/supabase-config.js"></script>` terlebih dahulu (berbeda dengan halaman publik dan portal siswa yang memuatnya).

* **Opsi Kode Perbaikan (`frontend/public/kontak.html` baris 357–390):**

```
// Normalisasi nomor WA ke format internasional 62 sekali untuk semua tombol dan form:
function formatWaIntl(num) {
  let clean = String(num || '081347142829').replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) clean = '62' + clean.slice(1);
  return clean;
}
// Di dalam event listener submit contactForm (baris 374):
contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const subject = document.getElementById('subject').value.trim();
  const message = document.getElementById('message').value.trim();
  try {
    if (typeof apiCall === 'function') {
      await apiCall('contact', 'create', { sender_name: name, sender_phone: phone, subject, message });
    }
  } catch (err) {}
  const waTarget = formatWaIntl(currentWaNumber);
  const text = `Assalamu'alaikum Admin Yayasan At-Tarbiyyah.\n\nPerkenalkan saya *${name}* (${phone}).\nKeperluan: *${subject}*\n\n${message}`;
  window.open(`https://wa.me/${waTarget}?text=${encodeURIComponent(text)}`, '_blank');
  contactForm.reset();
});

```

### 🛠️ DIRECTIVE UNTUK ANTIGRAVITY

* **Target File:** `frontend/public/kontak.html` (baris 355–392), `frontend/public/js/public-shell.js` (baris 340–410), dan 12 file `frontend/portal/admin/*.html`.

* **Instruksi Eksekusi:**

  1. Gunakan fungsi `formatWaIntl()` pada `kontak.html` agar `wa.me` selalu berawalan `62` dan simpan pesan ke `contact/create`.

  2. Terapkan `s.tagline` dari `cms_settings` ke `#site-footer-desc` di `public-shell.js`.

  3. Tambahkan `<script src="../../shared/js/supabase-config.js"></script>` sebelum `<script src="../../shared/js/api.js"></script>` di seluruh 12 halaman Portal Admin.

### 🟡 BUG-12: Pelanggaran Standar Brand (Zero-Green Enforcement — 60+ Class `green-*`, `emerald-*`, `teal-*`)

* **Sistem Integrasi Terdampak:** Konsistensi UI/UX & Identitas Visual Oceanic Blue (`#0284c7` / `#0ea5e9`) di Portal Admin dan Portal Siswa.

* **Lokasi File Terdampak:**

  * `frontend/portal/admin/backup.html` (7 titik `emerald-*`)

  * `frontend/portal/admin/classes.html` (3 titik `emerald-*`)

  * `frontend/portal/admin/content.html` (3 titik `emerald-*`)

  * `frontend/portal/admin/dashboard.html` (11 titik `emerald-*` / `teal-*`)

  * `frontend/portal/admin/logs.html` (2 titik `emerald-*`)

  * `frontend/portal/admin/payments.html` (11 titik `emerald-*` / `green-*` + inline hex `#059669`, `#ecfdf5`, `#a7f3d0` di kuitansi baris 735–738)

  * `frontend/portal/admin/ppdb.html` (15 titik `emerald-*` / `green-*` / `teal-*`)

  * `frontend/portal/admin/reports.html` (6 titik `emerald-*` + warna chart `#10b981` di baris 218 & 277)

  * `frontend/portal/admin/students.html` (5 titik `emerald-*`)

  * `frontend/portal/admin/teachers.html` (3 titik `emerald-*`)

  * `frontend/portal/admin/users.html` (2 titik `emerald-*`)

  * `frontend/portal/siswa/dashboard.html` (9 titik `emerald-*` / `green-*`)

  * `frontend/portal/siswa/dokumen.html` (6 titik `emerald-*`)

  * `frontend/portal/siswa/spp.html` (6 titik `emerald-*` + inline hex `#059669`, `#ecfdf5`, `#a7f3d0` di kuitansi baris 344–347)

* **Opsi Kode Perbaikan (Konversi Palet Oceanic Blue):**

  * Seluruh class `bg-emerald-50`, `bg-green-50`, `bg-teal-50` $\rightarrow$ `bg-primary-50` atau `bg-sky-50`

  * Seluruh class `text-emerald-600`, `text-emerald-700`, `text-green-600`, `text-teal-600` $\rightarrow$ `text-primary-600` atau `text-sky-700`

  * Seluruh class `bg-emerald-600`, `hover:bg-emerald-700`, `bg-green-600` $\rightarrow$ `bg-primary-600`, `hover:bg-primary-700`

  * Seluruh class `border-emerald-200`, `border-green-200` $\rightarrow$ `border-primary-200` atau `border-sky-200`

  * Warna status `LUNAS` pada cetak kuitansi (`spp.html:344` & `payments.html:735`): ubah dari `#059669` / `#ecfdf5` / `#a7f3d0` menjadi `#0284c7` / `#f0f9ff` / `#bae6fd`.

  * Warna dataset Chart.js di `reports.html:218, 277`: ubah dari `#10b981` menjadi `#0284c7` (`Oceanic Blue`).

### 🛠️ DIRECTIVE UNTUK ANTIGRAVITY

* **Target File:** 11 file di `frontend/portal/admin/*.html` dan 3 file di `frontend/portal/siswa/*.html`.

* **Instruksi Eksekusi:** Lakukan penggantian menyeluruh (*Zero-Green Enforcement*) atas seluruh class `emerald-*`, `green-*`, dan `teal-*` serta kode hex hijau `#10b981`/`#059669` menjadi palet `primary-*` / `sky-*` (`#0284c7` / `#0ea5e9`) sesuai standar arsitektur desain Oceanic Blue.