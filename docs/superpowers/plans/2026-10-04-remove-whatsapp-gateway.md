# Implementation Plan: Penghapusan Fitur WhatsApp Gateway API & Penyesuaian Alur PPDB

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghilangkan seluruh konfigurasi dan ketergantungan Token WhatsApp Gateway API (Fonnte / Wablas) serta pengiriman otomatis di latar belakang, sekaligus menyesuaikan alur aktivasi siswa PPDB agar menjadi sistem mandiri (self-contained) yang sederhana, stabil, dan bebas dari error eksternal.

**Architecture:** 
1. Hapus input `Token WhatsApp Gateway API` pada formulir profil sekolah di Portal Admin (`content.html`) dan jadikan bagian tersebut murni sebagai `Kontak WhatsApp Resmi Sekolah` untuk interaksi publik (kontak/tata usaha).
2. Hapus pemanggilan API eksternal pihak ketiga (`api.fonnte.com`) dan query token dari `ppdb/convert` di `api.js`.
3. Perbaiki struktur modal aktivasi siswa pada `ppdb.html` (memperbaiki galat sintaksis template string yang ada), lalu sediakan fitur "Salin Info Akun (1-Klik)" ke clipboard agar admin dapat mencatat/memberikan kredensial (NIS & kata sandi awal tanggal lahir) secara langsung kepada orang tua tanpa ketergantungan gateway otomatis.
4. Pastikan data profil sekolah di `local-api.js` dan cache lokal tetap sinkron tanpa `wa_gateway_token`.

**Tech Stack:** Vanilla JavaScript, HTML5 Semantic, Tailwind CSS, Local Dev Server (Node.js/Electron).

---

## Global Constraints
- Tetap pertahankan nomor kontak WhatsApp resmi sekolah (`whatsapp_number`) karena digunakan pada header, footer, dan halaman kontak website untuk saluran informasi publik.
- Hanya hapus fitur **Token Gateway API otomatis / Fonnte / Wablas** dan pemanggilan HTTP background gateway.
- Kredensial akun siswa baru (NIS & Password awal tanggal lahir) tetap di-generate secara otomatis dan ditampilkan transparan kepada admin saat aktivasi berhasil.
- Seluruh 12 halaman admin harus tetap berjalan 100% tanpa error JavaScript dan lulus verifikasi HTTP 200.

---

## Review Focus
1. Formulir Profil Yayasan di `content.html` tidak boleh error saat disimpan tanpa `wa_gateway_token`.
2. Halaman `ppdb.html` tidak boleh memiliki syntax error pada script modal aktivasi.
3. Fungsi `ppdb/convert` harus berhasil mengonversi calon siswa menjadi siswa aktif, menghasilkan NIS, dan mengembalikan data kredensial tanpa mencoba mengirim HTTP request ke Fonnte/Wablas.
4. Tombol "Salin Info Akun" pada modal sukses aktivasi menyalin informasi akun ke clipboard pengguna secara mulus.
5. Landing page publik (`kontak.html`, `public-shell.js`) tetap dapat menampilkan tautan konsultasi WhatsApp resmi tata usaha secara normal.

---

### Task 1: Hapus Input WhatsApp Gateway Token di UI Portal Admin (`content.html`)

**Files:**
- Modify: `frontend/portal/admin/content.html`

**Interfaces:**
- Consumes: `school` data dari `apiCall('schools', 'get')`
- Produces: Payload `schools/update` tanpa atribut `wa_gateway_token`

- [ ] **Step 1: Hapus field input `sch-wa-token` dan perbarui header bagian WhatsApp**
  - Pada Tab *Profil Yayasan* di `content.html`, ubah judul subbagian:
    Dari: `2. Kontak WhatsApp Resmi & Gateway Notifikasi Otomatis`
    Menjadi: `2. Kontak WhatsApp Resmi Sekolah`
  - Hapus elemen `<input id="sch-wa-token">` beserta label dan deskripsi *"Token WhatsApp Gateway API (Opsional) - Token Fonnte / Wablas"*.
  - Biarkan input `sch-wa` (Nomor WhatsApp Resmi Sekolah) tetap ada dengan layout lebar penuh atau grid rapi.

- [ ] **Step 2: Sesuaikan form submit handler di `content.html`**
  - Hapus pembacaan `wa_gateway_token: document.getElementById('sch-wa-token').value.trim()` dari objek `payload` penyimpanan profil sekolah.

- [ ] **Step 3: Uji simpan profil sekolah di `content.html`**
  - Jalankan script pengujian untuk memastikan `schools/update` berhasil dengan status 200 tanpa error field `wa_gateway_token`.

---

### Task 2: Hapus Pemanggilan Background Gateway Fonnte di `frontend/shared/js/api.js`

**Files:**
- Modify: `frontend/shared/js/api.js`

**Interfaces:**
- Consumes: Aksi `ppdb/convert` dan `schools/update`
- Produces: Response `ppdb/convert` bersih berisi `{ student, nis, class_name, initial_credentials }`

- [ ] **Step 1: Hapus pemanggilan `https://api.fonnte.com/send` pada modul `ppdb/convert`**
  - Buka `frontend/shared/js/api.js` pada blok `module === 'ppdb' && action === 'convert'`.
  - Hapus blok `try-catch` yang mengambil `schools?select=wa_gateway_token` dan melakukan `fetch('https://api.fonnte.com/send', ...)`.
  - Hapus variabel `waStatus` dan ketergantungan gateway.
  - Sederhanakan objek kembalian sehingga mengembalikan informasi aktivasi siswa:
    ```javascript
    return {
      success: true,
      data: {
        student: studentPayload,
        nis: studentNis,
        class_name: targetClassName,
        initial_credentials: {
          username: studentNis,
          password_hint: birthDatePassword,
          login_url: '/public/login.html'
        }
      },
      message: `Siswa berhasil diaktifkan dengan NIS: ${studentNis}`
    };
    ```

- [ ] **Step 2: Bersihkan `schools/update` di `frontend/shared/js/api.js`**
  - Hapus properti `wa_gateway_token` dari `extPayload`.

- [ ] **Step 3: Jalankan verifikasi endpoint `ppdb/convert`**
  - Pastikan eksekusi aktivasi PPDB berjalan instan tanpa jeda koneksi eksternal.

---

### Task 3: Perbaiki Galat Sintaksis dan Sempurnakan Modal Aktivasi Siswa di `ppdb.html`

**Files:**
- Modify: `frontend/portal/admin/ppdb.html`

**Interfaces:**
- Consumes: Response data dari `apiCall('ppdb', 'convert', ...)`
- Produces: Modal interaktif penampil NIS & password awal + fitur Salin Info Akun

- [ ] **Step 1: Perbaiki galat kode trailing di akhir `ppdb.html`**
  - Hapus fragmen kode rusak `${waStatusHtml}` dan blok markup duplikat di baris 470–487.

- [ ] **Step 2: Desain ulang `showConvertSuccessModal(data)`**
  - Tampilkan rincian aktivasi secara bersih dan jelas bagi admin:
    - Nama Siswa
    - NIS (Username Login Portal)
    - Kelas Masuk
    - Password Awal (Format: Tanggal Lahir DDMMYYYY)
  - Tambahkan tombol **"Salin Rincian Akun"** (`navigator.clipboard.writeText`) yang menyalin format teks rapi:
    ```text
    Akses Portal Siswa Yayasan Samarinda
    Nama: [Nama Siswa]
    NIS: [NIS]
    Password Awal: [DDMMYYYY]
    Link Login: http://localhost:3000/public/login.html
    ```
  - Tambahkan tombol **"Tutup"** untuk menutup modal secara bersih.
  - Hapus tombol atau indikator pengiriman gateway otomatis.

---

### Task 4: Sinkronisasi Backend Lokal (`local-api.js`) & Pengujian Menyeluruh

**Files:**
- Modify: `frontend/local-api.js`
- Test: `scratch/test-ppdb-convert.js`

- [ ] **Step 1: Pastikan mock `DB.school_profile` dan `ppdb/convert` di `local-api.js` bersih**
  - Pastikan `DB.school_profile` tidak menyimpan `wa_gateway_token`.
  - Pastikan respon `ppdb/convert` pada `local-api.js` konsisten dengan format `initial_credentials`.

- [ ] **Step 2: Buat skrip uji mandiri `scratch/test-ppdb-convert.js`**
  - Simulasikan pendaftaran PPDB -> Approve -> Convert ke Siswa.
  - Verifikasi bahwa siswa baru terdaftar di tabel `students`, memiliki NIS, dan tidak ada kegagalan fungsi.

- [ ] **Step 3: Uji seluruh 12 halaman admin dan pastikan tidak ada regresi**
  - Verifikasi bahwa `content.html` dan `ppdb.html` bebas dari error JavaScript di console.
