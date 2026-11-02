# SYSTEM FINDINGS & TECHNICAL ROOT CAUSE AUDIT
## Website SIYAYASAN — Yayasan At Tarbiyyah Wijaya Kusuma Samarinda
**Dokumen Referensi Audit Sistem Mendalam (Read-Only Planning Phase)**  
**Tanggal:** 2 November 2026 | **Status:** Perencanaan & Verifikasi Temuan

---

## 1. PENDAHULUAN & METODOLOGI PEMERIKSAAN

Pemeriksaan ini dilakukan menggunakan metode **Read-Only System Audit** terhadap seluruh komponen yang membentuk arsitektur SIYAYASAN, meliputi:
- Antarmuka publik (`frontend/public/`)
- Portal administrasi (`frontend/portal/admin/`)
- Portal siswa (`frontend/portal/siswa/`)
- Lapisan perantara API dan komunikasi database (`frontend/shared/js/api.js`)
- Skema database Supabase PostgreSQL (`database/MASTER_SUPABASE_SETUP_V2.sql` dan `database/patch_missing_columns.sql`)
- Konfigurasi penyimpanan objek Supabase Storage (`siyayasan-uploads`)

Setiap temuan di bawah ini didasarkan pada **bukti aktual baris kode (line of code), fungsi, dan struktur data** yang ditemukan langsung di dalam repositori.

---

## 2. TEMUAN MODUL A: CMS BANNER & WEB (PERFORMA UPLOAD & PENYIMPANAN)

### 2.1. Temuan A.1: Proses Upload Gambar Banner / Slide Terlalu Lama
- **Lokasi Kode Terkait:**
  - [`frontend/portal/admin/cms_setting.html`](file:///d:/Source_code_yayasan/frontend/portal/admin/cms_setting.html#L440-L460) (Event handler pemilihan file)
  - [`frontend/portal/admin/cms_setting.html`](file:///d:/Source_code_yayasan/frontend/portal/admin/cms_setting.html#L664-L685) (Fungsi submit tambah slide)
  - [`frontend/shared/js/api.js`](file:///d:/Source_code_yayasan/frontend/shared/js/api.js#L138-L196) (Fungsi `uploadToSupabaseStorage`)
- **Kondisi Aktual Sistem:**
  1. **Ketiadaan Kompresi Sisi Klien (No Client-side Resizing/Compression):**
     Ketika admin memilih file foto dari komputer atau kamera HP (seringkali berukuran 5 MB – 12 MB dengan resolusi 4000x3000 piksel), browser langsung mengirim file mentah (`raw File/Blob`) tersebut melalui fetch ke endpoint Supabase Storage:
     `${API_URL}/storage/v1/object/${STORAGE_BUCKET}/${filename}`.
  2. **Timeout Upload yang Sangat Panjang:**
     Pada `api.js` baris 165, timeout upload dipatok sebesar **25.000 ms (25 detik)**. Apabila koneksi internet lokal atau jaringan Supabase mengalami latensi tinggi, UI akan tampak membeku (*hang*) menunggu selama 25 detik penuh.
  3. **Mekanisme Fallback ke Base64 Data URL Raksasa:**
     Pada `api.js` baris 189–195 dan `cms_setting.html` baris 676–683: jika upload ke Supabase Storage gagal (karena timeout, hak akses RLS bucket, atau bucket penuh), sistem secara otomatis mengonversi file mentah menjadi **Base64 Data URL string**.
     Sebuah gambar 6 MB menghasilkan string Base64 sekitar **8,2 MB karakter teks**. String raksasa ini kemudian dimasukkan ke dalam array `currentHeroImages` dan disimpan ke dalam database.
- **Indikasi Akar Masalah:**
  - File gambar tidak dioptimasi menjadi format WebP atau dikompresi ke dimensi maksimal hero carousel (misal 1920x1080 piksel) sebelum proses transmisi.
  - Kegagalan upload storage diam-diam menelan Base64 ke dalam state memori dan database, yang melipatgandakan ukuran payload HTTP secara eksponensial.
- **Dampak Operasional:**
  - Admin mengalami *loading spinner* yang lama saat menambahkan gambar.
  - Resiko kegagalan simpan semakin tinggi pada koneksi internet seluler/terbatas.

---

### 2.2. Temuan A.2: Munculnya Gambar Bawaan / Default yang Tidak Terdaftar di CMS
- **Lokasi Kode Terkait:**
  - [`frontend/public/index.html`](file:///d:/Source_code_yayasan/frontend/public/index.html#L181-L203) (Markup statis Hero Slider Container)
  - [`frontend/public/index.html`](file:///d:/Source_code_yayasan/frontend/public/index.html#L594-L617) (Fungsi `renderSlides` pada `initHeroCarousel`)
  - [`frontend/portal/admin/cms_setting.html`](file:///d:/Source_code_yayasan/frontend/portal/admin/cms_setting.html#L536) (Default `footer_bg_url`)
  - [`frontend/public/login.html`](file:///d:/Source_code_yayasan/frontend/public/login.html#L92) (Background statis login)
- **Kondisi Aktual Sistem:**
  1. **Hardcoded Fallback Image di Markup HTML:**
     Pada `frontend/public/index.html` baris 184, kontainer slider memuat markup bawaan hardcoded:
     ```html
     <div class="hero-slide active bg-cover bg-center" 
          style="background-image: url('https://hnkxrbmngmveoxipohtk.supabase.co/storage/v1/object/public/siyayasan-uploads/hero_slide_1792469386750_srz5t.jpg'), url('/images/school-campus.jpg');">
     </div>
     ```
  2. **Hardcoded Fallback di Fungsi JavaScript:**
     Pada `frontend/public/index.html` baris 596:
     ```javascript
     if (!Array.isArray(images) || images.length === 0) {
       sliderContainer.innerHTML = '<div class="hero-slide active bg-cover bg-center" style="background-image: url(\'https://hnkxrbmngmveoxipohtk.supabase.co/storage/v1/object/public/siyayasan-uploads/hero_slide_1792469386750_srz5t.jpg\'), url(\'/images/school-campus.jpg\');"></div>';
       return;
     }
     ```
  3. **Dual Source Fallback di Tag Style:**
     Setiap slide yang di-render secara dinamis menambahkan `url('/images/school-campus.jpg')` sebagai background lapis kedua:
     `style="background-image: url('${img.url}'), url('/images/school-campus.jpg');"`
- **Indikasi Akar Masalah:**
  - Gambar URL `hero_slide_1792469386750_srz5t.jpg` adalah sisa artefak pengujian awal yang disematkan langsung ke dalam file HTML publik sebagai "fallback".
  - Ketika pengunjung membuka website untuk pertama kali (saat cache `localStorage.siy_hero_cache` masih kosong), browser langsung menampilkan gambar hardcoded tersebut selama 1–2 detik sebelum data dari `apiCall('web_settings', 'get')` berhasil diambil dari Supabase.
  - Jika admin menghapus semua slide di CMS atau mengganti gambar hero, pengunjung baru tetap akan melihat gambar bawaan tersebut sekelebat karena berada di HTML statis awal.
- **Dampak Operasional:**
  - Gambar yang sudah dihapus oleh admin di CMS tetap muncul di publik.
  - Terjadi ketidaksinkronan visual antara apa yang tercatat di portal admin dan apa yang dilihat pengunjung.

---

### 2.3. Temuan A.3: Proses "Simpan Semua Perubahan" pada CMS Sangat Lama
- **Lokasi Kode Terkait:**
  - [`frontend/portal/admin/cms_setting.html`](file:///d:/Source_code_yayasan/frontend/portal/admin/cms_setting.html#L716-L779) (Fungsi `saveAllSettings`)
  - [`frontend/shared/js/api.js`](file:///d:/Source_code_yayasan/frontend/shared/js/api.js#L770-L847) (`web_settings` action `update`)
  - [`frontend/shared/js/api.js`](file:///d:/Source_code_yayasan/frontend/shared/js/api.js#L70-L125) (`supabaseRest` retry loop)
- **Kondisi Aktual Sistem:**
  Ketika admin menekan tombol **"Simpan Semua Pengaturan"**, urutan eksekusi jaringan yang terjadi adalah sebagai berikut:
  1. `apiCall('web_settings', 'update', payload)` dipanggil.
  2. Pada `api.js` baris 779, sistem melakukan query paralel ke 2 tabel sekaligus untuk membaca JSON lama:
     - `supabaseRest('web_settings?id=eq.default&select=announcement_banner')` (HTTP Request #1)
     - `supabaseRest('schools?select=wa_gateway_token&limit=1')` (HTTP Request #2)
  3. Payload digabungkan, kemudian dikirim untuk mengupdate tabel `web_settings`:
     - `supabaseRest('web_settings?id=eq.default', 'PATCH', safeWsPayload)` (HTTP Request #3)
  4. Jika baris belum ada atau response kosong, sistem melakukan fallback:
     - `supabaseRest('web_settings', 'POST', { id: 'default', ...safeWsPayload })` (Potensi HTTP Request #4)
  5. Sistem melakukan sinkronisasi duplikat ke tabel `schools`:
     - `supabaseRest('schools?id=eq.SCH-001', 'PATCH', schSync)` (HTTP Request #5)
  6. **Panggilan redundan di file pemanggil (`cms_setting.html` baris 750):**
     Setelah `apiCall('web_settings', 'update')` selesai, file `cms_setting.html` mengeksekusi panggilan kedua secara mandiri:
     - `apiCall('schools', 'update', { name, address, ... })` (HTTP Request #6 & #7)
  7. **Ukuran Payload Raksasa:**
     Jika `currentHeroImages` mengandung Base64 (akibat fallback upload pada Temuan A.1), seluruh string Base64 tersebut di-serialize berulang kali ke kolom `announcement_banner`, `hero_images`, dan `wa_gateway_token`. Payload HTTP mencapai beberapa megabyte.
  8. **Header PostgREST:**
     `supabaseRest` mengirim header `Prefer: return=representation`. PostgREST mengembalikan seluruh data baris yang baru saja di-update (termasuk string Base64 raksasa tersebut) kembali ke browser, melipatgandakan konsumsi bandwidth downstream.
- **Indikasi Akar Masalah:**
  - Terjadi **7 roundtrip HTTP berurutan/paralel** untuk satu kali aksi klik simpan.
  - Data yang sama disimpan secara redundan di dua tabel berbeda (`web_settings` dan `schools`).
  - Tidak ada proteksi terhadap payload ukuran besar (bloated JSON payload).
- **Dampak Operasional:**
  - Waktu simpan mencapai 6 hingga 25 detik.
  - Muncul resiko request timeout atau HTTP 413 (Payload Too Large).

---

### 2.4. Temuan A.4: Bottleneck Performa Pembaruan Data di Seluruh Portal Admin
- **Lokasi Kode Terkait:**
  - [`frontend/shared/js/api.js`](file:///d:/Source_code_yayasan/frontend/shared/js/api.js#L70-L135) (`supabaseRest`)
  - [`frontend/shared/js/api.js`](file:///d:/Source_code_yayasan/frontend/shared/js/api.js#L199-L215) (`recordActivityLog`)
- **Kondisi Aktual Sistem:**
  1. **Mekanisme Self-Healing Retry Loop (Hingga 25x):**
     Pada `api.js` baris 107–124, fungsi `supabaseRest` memiliki mekanisme retry otomatis jika PostgREST menolak payload karena kolom tidak ditemukan di database (`_retryCount < 25`).
     Jika payload admin mengirimkan 4 field yang tidak ada di skema tabel Supabase, `supabaseRest` akan melakukan **4 kali request HTTP berturut-turut** ke server Supabase, menghapus satu per satu kolom yang gagal, baru kemudian berhasil menyimpan data.
  2. **Synchronous Activity Logging:**
     Setiap operasi simpan (misalnya approve PPDB, update guru, buat invoice) seringkali menunggu penyelesaian eksekusi `recordActivityLog` ke tabel `activity_logs` secara berurutan (*blocking await*), menambah latensi 300–800 ms per aksi.
  3. **Ketiadaan ETag / Local Memory Stale While Revalidate:**
     Admin portal melakukan fetch data lengkap (`select=*`) setiap kali modal ditutup atau data disimpan tanpa memanfaatkan caching data lokal yang cerdas.
- **Dampak Operasional:**
  - Seluruh tombol simpan terasa lambat dan kurang responsif.

---

## 3. TEMUAN MODUL B: SISTEM SPP (KEUANGAN & OPERASIONAL)

### 3.1. Temuan B.1: Nominal SPP Siswa Baru Terkunci Permanen pada Rp150.000
- **Lokasi Kode Terkait:**
  - [`frontend/shared/js/api.js`](file:///d:/Source_code_yayasan/frontend/shared/js/api.js#L3010) (Konversi PPDB ke Santri Aktif)
  - [`frontend/shared/js/api.js`](file:///d:/Source_code_yayasan/frontend/shared/js/api.js#L1964) (Default `create_bulk` invoice)
  - [`frontend/portal/admin/payments.html`](file:///d:/Source_code_yayasan/frontend/portal/admin/payments.html#L799) (Print slip pembayaran)
  - [`frontend/portal/siswa/spp.html`](file:///d:/Source_code_yayasan/frontend/portal/siswa/spp.html#L330) (Pesan konfirmasi WA siswa)
- **Kondisi Aktual Sistem:**
  1. Pada fungsi konversi pendaftar PPDB menjadi santri aktif (`api.js` baris 3000–3015):
     ```javascript
     const invPayload = {
       ...
       amount: 150000,
       due_date: invDueDate,
       status: 'unpaid',
       description: `SPP Bulan ${currentMonthName} ${currentYear} (Santri Baru)`
     };
     ```
     Nominal `150000` di-hardcode secara statis di kode program. Parameter `params.amount` atau `params.spp_amount` dari form admin tidak dibaca.
  2. Pada formulir aktivasi santri di `admin/ppdb.html` (modal konversi), admin **tidak diberikan input untuk menentukan besaran iuran SPP**.
  3. Siswa dari jenjang PAUD, TPQ Pagi, maupun Tahfidz otomatis mendapatkan tagihan pertama dengan angka yang persis sama (Rp150.000), padahal struktur SPP yayasan berbeda per jenjang/program.
- **Dampak Operasional:**
  - Petugas TU harus mengedit manual invoice satu per satu di tabel pembayaran setelah konversi selesai.
  - Rentan terjadi kesalahan penetapan biaya SPP bagi santri jalur beasiswa atau program khusus.

---

### 3.2. Temuan B.2: Inkonsistensi Standarisasi Format Rupiah
- **Lokasi Kode Terkait:**
  - [`frontend/shared/js/api.js`](file:///d:/Source_code_yayasan/frontend/shared/js/api.js#L3912-L3914) (Fungsi `formatIDR`)
  - [`frontend/portal/admin/payments.html`](file:///d:/Source_code_yayasan/frontend/portal/admin/payments.html#L220) (Input angka polos tanpa format)
- **Kondisi Aktual Sistem:**
  1. Fungsi `formatIDR` di `api.js` baris 3912 menghasilkan format: `'Rp ' + n.toLocaleString('id-ID')` (menggunakan spasi: `Rp 150.000`).
  2. Standar yang diminta yayasan adalah format resmi Rupiah Indonesia rapat: **`Rp150.000`**, **`Rp250.000`**, **`Rp1.000.000`** tanpa spasi setelah "Rp", menggunakan titik pemisah ribuan, dan tanpa desimal `,00` kecuali diperlukan.
  3. Pada form input tagihan (`payments.html`), admin menginput angka integer biasa (`<input type="number">`), tanpa adanya panduan live preview nominal (misalnya mengetik `250000` tidak menampilkan konfirmasi visual `Rp250.000` di samping atau bawahnya), sehingga meningkatkan risiko salah ketik (kelebihan atau kekurangan angka nol).
- **Dampak Operasional:**
  - Tampilan nominal di kwitansi, portal siswa, dan tabel admin tidak seragam.
  - Risiko human error salah nominal (contoh: Rp1.500.000 terketik Rp150.000).

---

### 3.3. Temuan B.3: Kerapuhan Alur Tagihan Massal (Bulk Invoicing)
- **Lokasi Kode Terkait:**
  - [`frontend/shared/js/api.js`](file:///d:/Source_code_yayasan/frontend/shared/js/api.js#L1983-L2016) (Loop `create_bulk` invoice)
  - [`frontend/portal/admin/payments.html`](file:///d:/Source_code_yayasan/frontend/portal/admin/payments.html#L685-L715) (Modal Bulk Invoice)
- **Kondisi Aktual Sistem:**
  1. **Loop Sequential HTTP POST:**
     Pada `api.js` baris 1983, fungsi penerbitan tagihan massal menggunakan perulangan:
     ```javascript
     for (let i = 0; i < students.length; i++) {
       ...
       await supabaseRest('invoices', 'POST', invPayload).catch(() => {});
     }
     ```
     Jika satu angkatan memiliki 60 santri, browser mengeksekusi **60 panggilan HTTP berurutan**. Hal ini memakan waktu 15–20 detik dan sangat rentan putus di tengah jalan jika jaringan terputus (sebagian santri terbit tagihannya, sebagian tidak).
  2. **Pilihan Nominal Tunggal:**
     Formulir tagihan massal hanya menerima satu kolom `bulk-amount` untuk seluruh santri yang dipilih. Admin tidak dapat menerapkan tarif berjenjang (misal tarif PAUD vs tarif TPQ).
- **Dampak Operasional:**
  - Proses pembuatan tagihan bulanan terasa lambat dan membuat browser admin tampak *freezing*.
  - Ketidaksiapan menangani tagihan multi-tarif dalam satu klik.

---

### 3.4. Temuan B.4: Alur Upload Bukti Pembayaran Siswa & Penolakan Tanpa Alasan
- **Lokasi Kode Terkait:**
  - [`frontend/portal/siswa/spp.html`](file:///d:/Source_code_yayasan/frontend/portal/siswa/spp.html#L160-L195) (Modal Upload Bukti)
  - [`frontend/portal/siswa/spp.html`](file:///d:/Source_code_yayasan/frontend/portal/siswa/spp.html#L315-L338) (Status Badge & Aksi)
  - [`frontend/portal/admin/payments.html`](file:///d:/Source_code_yayasan/frontend/portal/admin/payments.html#L721-L731) (Fungsi `verifyPayment`)
  - [`frontend/shared/js/api.js`](file:///d:/Source_code_yayasan/frontend/shared/js/api.js#L2066-L2108) (`payments.submit`)
  - [`frontend/shared/js/api.js`](file:///d:/Source_code_yayasan/frontend/shared/js/api.js#L2126-L2136) (`payments.reject`)
- **Kondisi Aktual Sistem:**
  1. **Fitur Upload Bukti Tersedia di Portal Siswa:**
     Pemeriksaan membuktikan bahwa portal siswa **memiliki modal upload bukti transfer** di file `siswa/spp.html` baris 160. Santri/wali santri dapat memilih file foto bukti bayar dan mengirimkannya ke sistem.
  2. **Kelemahan Penolakan (Rejection Note Hilang):**
     Ketika staf TU/admin menolak pembayaran di `admin/payments.html` baris 722:
     ```javascript
     if (!isApproved && !confirm('Tolak pembayaran ini? Tagihan siswa akan dikembalikan ke status Belum Lunas.')) return;
     const action = isApproved ? 'verify' : 'reject';
     const res = await apiCall('payments', action, { id });
     ```
     Sistem **sama sekali tidak meminta alasan penolakan** kepada admin.
  3. **Pengalaman Siswa Ketika Pembayaran Ditolak:**
     Di portal siswa (`siswa/spp.html` baris 328), status tagihan langsung kembali menjadi badge merah "Belum Bayar".
     Siswa tidak mengetahui **mengapa bukti bayarnya ditolak** (apakah nominal kurang, rekening salah, atau foto struk buram).
  4. **Potensi Tagihan / Pembayaran Ganda:**
     Pada `api.js` baris 2066, ketika siswa mengirimkan bukti bayar, sistem tidak memvalidasi apakah invoice tersebut sudah memiliki entri di tabel `payments` dengan status `menunggu_verifikasi`. Jika siswa mengklik upload 2 kali, akan tercipta 2 baris pembayaran ganda untuk 1 invoice.
- **Dampak Operasional:**
  - Komunikasi TU dan wali santri terganggu; wali santri bingung kenapa bukti yang dikirim tidak diterima.
  - Risiko verifikasi ganda oleh staf TU yang berbeda.

---

## 4. TEMUAN MODUL C: PPDB (PERIODE, PENERIMAAN MASSAL, NIS & KREDENSIAL)

### 4.1. Temuan C.1: Ketiadaan Filter Periode PPDB di Tampilan Pendaftaran
- **Lokasi Kode Terkait:**
  - [`frontend/portal/admin/ppdb.html`](file:///d:/Source_code_yayasan/frontend/portal/admin/ppdb.html#L54-L68) (Bilah filter PPDB)
  - [`frontend/portal/admin/ppdb.html`](file:///d:/Source_code_yayasan/frontend/portal/admin/ppdb.html#L337-L346) (Fungsi `loadPpdb`)
  - [`frontend/shared/js/api.js`](file:///d:/Source_code_yayasan/frontend/shared/js/api.js#L2166-L2184) (`ppdb.list` query)
- **Kondisi Aktual Sistem:**
  1. Bilah filter pada `admin/ppdb.html` saat ini hanya memiliki 2 kontrol:
     - `filter-search` (Pencarian nama / nomor pendaftaran)
     - `filter-type` (Pilihan jenjang: TPQ Pagi, Tahfidz, PAUD)
  2. Tidak ada dropdown atau filter untuk memilih **Tahun Ajaran / Periode Pendaftaran** (contoh: `2025/2026`, `2026/2027`).
  3. Pada `api.js` baris 2166, query `supabaseRest` mengambil data pendaftaran dengan parameter `order=created_at.desc` tanpa filter kolom `academic_year` atau `period_id`.
- **Dampak Operasional:**
  - Jika yayasan berganti tahun ajaran ke periode baru, seluruh data pendaftar dari tahun-tahun sebelumnya akan tetap bercampur di tabel utama. Admin kesulitan memisahkan pendaftar gelombang aktif dengan pendaftar tahun lalu.

---

### 4.2. Temuan C.2: Ketiadaan Fitur Penerimaan Massal (Bulk Acceptance)
- **Lokasi Kode Terkait:**
  - [`frontend/portal/admin/ppdb.html`](file:///d:/Source_code_yayasan/frontend/portal/admin/ppdb.html#L70-L89) (Struktur tabel PPDB)
  - [`frontend/portal/admin/ppdb.html`](file:///d:/Source_code_yayasan/frontend/portal/admin/ppdb.html#L620-L650) (Aksi tombol per baris)
- **Kondisi Aktual Sistem:**
  1. Setiap baris pendaftar hanya memiliki tombol individual: `Approve` (Setujui), `Tolak` (Reject), dan `Konversi`.
  2. Tabel tidak memiliki kotak centang (*checkbox*) multi-pilihan pada baris maupun pada header (*select all*).
  3. Tidak ada alur kerja penetapan keputusan seleksi massal di mana admin dapat menerima mayoritas santri sekaligus, sambil menentukan secara selektif siswa yang "Tidak Diterima" atau "Dipertimbangkan", dengan opsi eksplisit "Tidak Ada".
- **Dampak Operasional:**
  - Jika terdapat 100 pendaftar baru yang lolos seleksi berkas, panitia PPDB harus mengklik tombol `Approve` sebanyak 100 kali secara berulang.

---

### 4.3. Temuan C.3: Ketiadaan Fitur Aktivasi Santri Aktif Massal (Bulk Activation)
- **Lokasi Kode Terkait:**
  - [`frontend/portal/admin/ppdb.html`](file:///d:/Source_code_yayasan/frontend/portal/admin/ppdb.html#L820-L910) (Modal konversi siswa tunggal)
- **Kondisi Aktual Sistem:**
  1. Tombol "Konversi (Buat NIS)" hanya dapat dibuka untuk satu pendaftar dalam satu waktu melalui modal popup `openConvertModal(id)`.
  2. Admin harus mengisi kelas, NIS, tanggal masuk, dan sandi portal satu per satu untuk setiap calon siswa.
  3. Tidak ada fasilitas aktivasi massal untuk mengonversi seluruh siswa yang telah berstatus `approved` ke dalam database siswa aktif (`students` dan `users`) secara kolektif.
- **Dampak Operasional:**
  - Membutuhkan waktu berjam-jam saat penetapan santri baru menjelang tahun ajaran baru.

---

### 4.4. Temuan C.4: Evaluasi Penomoran NIS dan Keamanan Kredensial Portal Siswa
- **Lokasi Kode Terkait:**
  - [`frontend/shared/js/api.js`](file:///d:/Source_code_yayasan/frontend/shared/js/api.js#L274)
  - [`frontend/shared/js/api.js`](file:///d:/Source_code_yayasan/frontend/shared/js/api.js#L435) (Pemeriksaan sandi login polos)
  - [`frontend/shared/js/api.js`](file:///d:/Source_code_yayasan/frontend/shared/js/api.js#L2814-L2845) (Penyimpanan sandi awal)
- **Kondisi Aktual Sistem:**
  1. **Timing Pembuatan NIS:**
     Saat ini, NIS baru dibuat saat admin menekan tombol "Konversi" (tahap aktivasi). Ketika calon siswa baru pertama kali mendaftar, mereka hanya memiliki Nomor Registrasi (`REG-xxxxxx`). Ketika di-approve, statusnya menjadi `approved`, namun belum memiliki NIS. Hal ini sudah benar secara hierarki akademik (NIS hanya untuk siswa resmi terdaftar di buku induk).
  2. **Penyimpanan Password dalam Bentuk Teks Polos (Plaintext Password Risk):**
     Pada `api.js` baris 2840 dan baris 2953, kata sandi portal siswa disimpan langsung dalam bentuk teks polos pada kolom `password_hash` di tabel `users` dan kolom `portal_password` di tabel `ppdb_registrations`.
     Pada baris 435:
     ```javascript
     if (matchedUser.password_hash !== password) { ... }
     ```
     Verifikasi login menggunakan komparasi string langsung (`===`) tanpa fungsi enkripsi/hash kriptografis (seperti bcrypt atau PBKDF2/SHA-256).
  3. **Risiko Password Seragam Tanpa Wajib Ganti:**
     Jika admin menetapkan satu password awal yang sama (misal `santribaru2026`) untuk 50 siswa tanpa mekanisme wajib ganti sandi pada login pertama (*forced password change*), siapapun yang mengetahui NIS temannya dapat masuk ke akun portal temannya dan melihat biodata pribadi serta dokumen sensitif.
- **Dampak Operasional & Keamanan:**
  - Pelanggaran privasi data santri.
  - Risiko kebocoran akun siswa jika database diinspeksi.

---

## 5. TEMUAN MODUL D: PENGELOLAAN DATA GURU (EMAIL FIELD)

### 5.1. Temuan D.1: Field Email Bersifat Wajib di Form Admin Meskipun Nullable di Database
- **Lokasi Kode Terkait:**
  - [`frontend/portal/admin/teachers.html`](file:///d:/Source_code_yayasan/frontend/portal/admin/teachers.html#L75) (Input email)
  - [`frontend/shared/js/api.js`](file:///d:/Source_code_yayasan/frontend/shared/js/api.js#L1483) (Payload penambahan guru)
  - [`database/MASTER_SUPABASE_SETUP_V2.sql`](file:///d:/Source_code_yayasan/database/MASTER_SUPABASE_SETUP_V2.sql#L240) (Skema tabel `teachers`)
- **Kondisi Aktual Sistem:**
  1. Pada file `frontend/portal/admin/teachers.html` baris 75:
     ```html
     <div>
       <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
       <input id="form-email" type="email" required class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
     </div>
     ```
     Input memiliki atribut HTML5 `required` dan label dengan tanda bintang `*`.
  2. Pada database Supabase (`MASTER_SUPABASE_SETUP_V2.sql` baris 240):
     `email VARCHAR(150),`
     Kolom `email` di tabel `teachers` **bersifat nullable (tidak ada batasan `NOT NULL`)**.
  3. Pada `api.js` baris 1483:
     `email: params.email || '',`
     Backend `api.js` sudah siap menerima email kosong dan menyimpannya sebagai string kosong tanpa error.
  4. Pada autentikasi login (`api.js` baris 240–375):
     Guru dan staf login menggunakan **username** atau **email**. Tidak ada ketergantungan mutlak bahwa akun guru harus memiliki email jika autentikasi dilakukan menggunakan NIP atau Username.
- **Indikasi Akar Masalah:**
  - Atribut `required` di frontend adalah sisa validasi awal yang tidak diselaraskan dengan kebutuhan lapangan institusi di mana tidak semua guru/ustadz memiliki email aktif yang ingin didaftarkan.
- **Dampak Operasional:**
  - Petugas TU terpaksa mengisi email palsu/dummy (contoh `guru1@gmail.com`) agar form dapat disimpan.

---

## 6. TEMUAN MODUL E: DATA SISWA (KELENGKAPAN FIELD PPDB & FORMULIR TAMBAH)

### 6.1. Temuan E.1: Informasi PPDB Tidak Ditampilkan Lengkap pada Modal Edit Siswa
- **Lokasi Kode Terkait:**
  - [`frontend/portal/admin/students.html`](file:///d:/Source_code_yayasan/frontend/portal/admin/students.html#L122-L180) (Modal edit siswa)
  - [`frontend/portal/admin/students.html`](file:///d:/Source_code_yayasan/frontend/portal/admin/students.html#L549-L563) (Pengambilan nilai payload simpan)
  - [`frontend/shared/js/api.js`](file:///d:/Source_code_yayasan/frontend/shared/js/api.js#L1700-L1780) (`students.update`)
- **Kondisi Aktual Sistem:**
  1. Formulir PPDB fisik dan online (`ppdb.html`) memiliki **36 field komprehensif** (buku induk resmi Diknas/Kemenag), mencakup:
     - NIK anak, anak ke-, jumlah saudara, bahasa sehari-hari.
     - Nama ayah & ibu, NIK orang tua, tempat/tanggal lahir orang tua, pendidikan terakhir, pekerjaan, penghasilan bulanan, nomor WhatsApp orang tua.
     - Nama wali & pekerjaan wali (jika ikut wali).
     - Status tempat tinggal (bersama ortu/asrama/wali), jarak ke madrasah, sarana transportasi.
     - Kondisi khusus / kebutuhan khusus, golongan darah, riwayat penyakit.
  2. Seluruh 36 data tersebut **sudah berhasil disimpan** ke dalam kolom JSON `students.form_metadata` saat pendaftar dikonversi.
  3. Namun, ketika admin membuka tombol **Edit Siswa** pada halaman `admin/students.html`, modal popup hanya menyediakan **11 field dasar**:
     - NIS, Nama Lengkap, Jenis Kelamin, Tanggal Lahir, Tempat Lahir, Agama, Kelas, Status, Nama Orang Tua (satu baris), No HP Orang Tua, Alamat.
  4. Seluruh rincian data ayah, ibu, wali, NIK, dan transportasi tidak dapat dilihat apalagi diedit oleh admin pada halaman Data Siswa.
- **Dampak Operasional:**
  - Petugas TU tidak dapat memperbarui data biodata orang tua santri yang sudah terdaftar tanpa harus masuk ke database Supabase secara langsung.

---

### 6.2. Temuan E.2: Ketimpangan Struktur Antara Form "Tambah Siswa Baru" dan PPDB
- **Lokasi Kode Terkait:**
  - [`frontend/portal/admin/students.html`](file:///d:/Source_code_yayasan/frontend/portal/admin/students.html#L112-L175) (Form Tambah Siswa Baru)
  - [`frontend/public/ppdb.html`](file:///d:/Source_code_yayasan/frontend/public/ppdb.html#L400-L750) (Formulir PPDB Online)
- **Kondisi Aktual Sistem:**
  1. Tombol "Tambah Siswa Baru" di portal admin menggunakan modal form yang sama dengan modal edit (hanya 11 field).
  2. Jika ada santri pindahan (*mutasi masuk*) atau pendaftar langsung ke kantor yayasan yang diinput melalui "Tambah Siswa Baru", data santri tersebut **tidak memiliki kolom `form_metadata` selengkap santri PPDB**.
  3. Terjadi ketimpangan struktur data: santri dari PPDB memiliki biodata 36 field, sedangkan santri yang ditambahkan manual oleh admin hanya memiliki 11 field.
- **Dampak Operasional:**
  - Ekspor data buku induk atau pelaporan EMIS/Dapodik menjadi tidak lengkap untuk siswa yang diinput langsung oleh admin.

---

## 7. RINGKASAN TEMUAN & KLASIFIKASI PRIORITAS

| No | Modul | Temuan Masalah | Akar Masalah Utama | Tingkat Urgensi |
|---|---|---|---|---|
| 1 | CMS Banner | Upload gambar lama & berat | Ketiadaan kompresi WebP client-side; upload file mentah hingga 10MB | **P1 — High** |
| 2 | CMS Banner | Gambar bawaan muncul di publik | Hardcoded URL fallback di `index.html` (L184 & L596) | **P1 — High** |
| 3 | CMS Banner | Simpan Semua Pengaturan lambat | 7 panggilan HTTP paralel/sekuensial; Base64 tersimpan di DB | **P1 — High** |
| 4 | Admin Portal | Simpan data lambat di semua menu | Retry loop PostgREST hingga 25x; synchronous activity logs | **P2 — Medium** |
| 5 | Sistem SPP | SPP santri baru terkunci Rp150.000 | Hardcoded nominal di `api.js` L3010; tidak ada input tarif SPP | **P0 — Critical** |
| 6 | Sistem SPP | Format Rupiah belum standar rapat | `formatIDR` menggunakan spasi; tidak ada visual preview rupiah di input | **P2 — Medium** |
| 7 | Sistem SPP | Tagihan massal berisiko putus | Perulangan `for` sekuensial HTTP POST per siswa; belum bulk-insert | **P1 — High** |
| 8 | Sistem SPP | Bukti tolak tanpa keterangan alasan | `verifyPayment` tidak meminta alasan tolak; siswa hanya melihat Belum Bayar | **P1 — High** |
| 9 | PPDB | Filter periode PPDB belum ada | Tidak ada parameter `academic_year` di query dan antarmuka admin | **P1 — High** |
| 10 | PPDB | Belum ada penerimaan massal | Tombol keputusan per baris; belum ada matriks keputusan kolektif | **P1 — High** |
| 11 | PPDB | Belum ada aktivasi massal | Modal konversi per individu satu per satu | **P1 — High** |
| 12 | PPDB / Auth | Password disimpan plaintext | Belum menggunakan salted Web Crypto SHA-256 dan forced password change | **P0 — Critical** |
| 13 | Data Guru | Email wajib diisi padahal nullable | Validasi `required` HTML di form input guru | **P2 — Medium** |
| 14 | Data Siswa | Modal edit hanya 11 dari 36 field | UI edit belum membaca & memperbarui `form_metadata` buku induk lengkap | **P1 — High** |
| 15 | Data Siswa | Form Tambah Siswa tidak seragam PPDB | Struktur form manual tidak memiliki tab/field selengkap PPDB | **P1 — High** |

---

*Laporan temuan ini telah diverifikasi secara read-only terhadap kode sumber aktual repositori `Source_code_yayasan` per 2 November 2026.*

