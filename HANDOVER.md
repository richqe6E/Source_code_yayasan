# 📦 DOKUMEN HANDOVER & STATUS SISTEM — SIYAYASAN V2

> **PANDUAN UNTUK AGEN AI / DEVELOPER BERIKUTNYA:**  
> Dokumen ini adalah **Single Source of Truth** terkini proyek SIYAYASAN V2 per **11 Oktober 2026**.  
> Harap baca dokumen ini sebelum melakukan modifikasi apapun. Jangan mengubah arsitektur yang sudah disepakati, jangan menambahkan library baru di luar spesifikasi, dan patuhi batasan branding serta pembagian peran resmi.

---

## 📌 Status Repositori GitHub Resmi
* **URL GitHub**: [https://github.com/richqe6E/Source_code_yayasan](https://github.com/richqe6E/Source_code_yayasan)
* **Branch Utama**: `main`
* **Status Sinkronisasi**: 100% Up to Date & Clean (Siap di-clone di laptop lain).
* **Proteksi Git**: `.gitignore` aktif mengabaikan `.env*` dan `.vercel/` demi keamanan data rahasia.


## 1. ⚙️ Ringkasan Proyek & Ketentuan Arsitektur

- **Nama Sistem:** SIYAYASAN V2 (Sistem Informasi Manajemen Sekolah & Yayasan Samarinda).
- **Unit Pendidikan:** PAUD, TK (TK-A & TK-B), dan TPQ.
- **Branding Resmi Ketat:** **"Yayasan Samarinda"** SAJA. *(DILARANG menggunakan nama "Tarbiyah" atau "Ulil Albab")*.
- **Domain & Format Email:** `*.yayasan.sch.id`.

### 🏛️ Ketentuan Arsitektur 2 Portal Resmi:
Sesuai keputusan dan kesepakatan final:
> **Sistem HANYA mengaktifkan 2 Portal Resmi:**
> 1. **Portal Admin Sekolah** (`/admin/dashboard.html`)
> 2. **Portal Siswa** (`/siswa/dashboard.html`)
>
> *(Catatan Penting: Portal Guru dan Orang Tua **SUDAH TIDAK DIPERLUKAN** dalam sistem aktif V2. Seluruh kode lama guru dan ortu telah diamankan ke direktori arsip `/.legacy_backup/portal_v1_guru_ortu/`. DILARANG membangkitkan atau merestorasi portal guru/ortu ke folder `frontend/portal/` aktif!).*

### Struktur Direktori Aktif:
1. **Frontend (Website Publik & 2 Portal Aktif):**
   - **Teknologi:** HTML5, Tailwind CSS (via CDN), Vanilla JavaScript ES6 modern, Uicons Flaticon, Lottie Vector Player.
   - **Hosting Production:** **Vercel** (`https://siyayasan-portal.vercel.app`)
   - **Struktur Direktori:**
     - `frontend/public/` : Halaman publik (`index.html`, `profil.html`, `kontak.html`, `pengumuman.html`, `berita.html`, `galeri.html`, `agenda.html`, `login.html`, subdirektori `ppdb/`).
     - `frontend/portal/admin/` : Portal Admin TU & Super Admin (`dashboard.html`, `users.html`, `teachers.html`, `classes.html`, `students.html`, `ppdb.html`, `payments.html`, `content.html`, `reports.html`, `logs.html`, `backup.html`, `cms_setting.html`).
     - `frontend/portal/siswa/` : Portal Siswa Mandiri (`dashboard.html`, `biodata.html`, `akademik.html`, `spp.html`, `dokumen.html`).
     - `frontend/shared/js/` : Shared logic (`api.js`, `auth.js`, `shell.js`, `supabase-config.js`, `page-transitions.js`).
     - `/.legacy_backup/portal_v1_guru_ortu/` : Arsip kode lama guru dan orang tua.

2. **Backend Lokal / Development:**
   - **Engine:** Node.js HTTP Server (`frontend/dev-server.js`) pada port `3000`.
   - **Mock API Kontrak Penuh:** `frontend/local-api.js` (mensimulasikan 100% perilaku backend lokal, mendukung modul `auth`, `dashboard`, `ppdb`, `classes`, `students`, `teachers`, `users`, `payments`, `content`, `settings`, dan `siswa`).

3. **Backend Cloud (Hybrid PostgREST & Database):**
   - **Supabase PostgreSQL:** Dialihkan otomatis jika online, dengan fallback ke server lokal saat cloud unreachable.

---

## 2. 🔑 Kredensial Akun Pengujian (Demo Login)

Semua akun resmi berikut aktif di localhost (`http://localhost:3000/login.html`) dan live server:

| Peran (Role) | Identitas (Email / NIS) | Password | Portal / URL Tujuan |
|---|---|---|---|
| **Super Admin** | `admin@yayasan.sch.id` | `admin123` | `http://localhost:3000/admin/dashboard.html` |
| **Admin TU** | `tu@yayasan.sch.id` | `tu123456` | `http://localhost:3000/admin/dashboard.html` |
| **Siswa Aktif (Demo 1)** | `2026001` (NIS) | `2020-03-12` (Tgl Lahir) | `http://localhost:3000/siswa/dashboard.html` |
| **Siswa Aktif (Demo 2)** | `2026002` (NIS) | `2019-08-25` (Tgl Lahir) | `http://localhost:3000/siswa/dashboard.html` |

*(Catatan: Halaman login SIAKAD menyajikan tab segmented **Siswa** dan **Admin**).*

---

## 3. 🛠️ Rangkuman Perbaikan Terkini (09 Oktober 2026)

### Sesi Terakhir (Audit Internal, Perbaikan Bug UI Footer & Penegasan 2 Portal):
1. **Presisi UI Tombol Media Sosial di Footer & Drawer Publik:**
   - **Masalah:** Tombol Facebook, Instagram, YouTube di footer publik tidak rata tengah, miring, dan style.display `'inline'` merusak flex container saat hidrasi dinamis.
   - **Solusi:** Diganti dengan **vektor SVG inline presisi** (`w-4 h-4 fill-current shrink-0`) di dalam tombol `w-9 h-9 rounded-xl` elegan dengan `inline-flex` dan efek hover transisi halus. 100% terpusat simetris dan presisi di semua resolusi.
2. **Pembersihan Direktori & Rute Portal Guru / Ortu:**
   - Folder `guru/` dan `ortu/` dihapus dari direktori aktif `frontend/portal/` dan dipastikan tersimpan aman di arsip cadangan `/.legacy_backup/portal_v1_guru_ortu/`.
   - Rute legacy `/guru`, `/ortu`, `/portal/guru`, `/portal/ortu` pada `dev-server.js`, `vercel.json`, dan `auth.js` dialihkan secara otomatis (HTTP 302) ke `/login.html`.
3. **SyntaxError Fatal pada Admin PPDB:**
   - Diperbaiki pada `frontend/portal/admin/ppdb.html` fungsi `convertReg` (duplikasi kurung kurawal dibersihkan).
4. **Implementasi Lengkap Modul `siswa` pada Local API:**
   - `frontend/local-api.js` kini menangani aksi: `get_profile`, `update_biodata`, `get_academic`, `get_spp`, `get_documents`, dan `upload_document`.
5. **Sinkronisasi Metrik KPI Keuangan Dashboard Admin:**
   - Field `spp_target`, `spp_collected`, `payments_pending_verification` telah diselaraskan antara `dashboard.html`, `shared/js/api.js`, dan `local-api.js`.
6. **Filter Siswa Berdasarkan Kelas via Parameter URL:**
   - `students.html` kini otomatis membaca query string `?class_id=CLS-xxx` dari tombol aksi di `classes.html`.

---

## 4. 🧪 Hasil Uji Validasi & Verifikasi Sistem (Localhost:3000)

| Pengujian | Rute / Fitur | Status Uji | Keterangan |
| :--- | :--- | :---: | :--- |
| **Visual Footer** | `http://localhost:3000/` | **PASS (100% Presisi)** | Tombol SVG FB, IG, YT rapi, rata tengah sempurna, dan hover interaktif. |
| **Landing Page** | `http://localhost:3000/` | **PASS (HTTP 200)** | Render landing page publik stabil. |
| **Login SIAKAD** | `http://localhost:3000/login.html` | **PASS (HTTP 200)** | Tab segmented Siswa & Admin aktif, bantuan NIS & modal bantuan responsif. |
| **Portal Admin** | `http://localhost:3000/admin/dashboard.html` | **PASS (HTTP 200)** | Dashboard admin dan kartu KPI berfungsi penuh. |
| **Portal Siswa** | `http://localhost:3000/siswa/dashboard.html` | **PASS (HTTP 200)** | Dashboard siswa memuat biodata, akademik, tagihan SPP, dan dokumen. |
| **Redirect Guru** | `http://localhost:3000/guru` | **PASS (HTTP 302)** | Mengalihkan otomatis ke `/login.html`. |
| **Redirect Ortu** | `http://localhost:3000/ortu` | **PASS (HTTP 302)** | Mengalihkan otomatis ke `/login.html`. |
| **Login Siswa** | `auth/login` (NIS: `2026001`) | **PASS (Valid)** | Berhasil login dengan password awal tanggal lahir `2020-03-12`. |
| **Login Admin** | `auth/login` (`admin@yayasan.sch.id`) | **PASS (Valid)** | Berhasil login dengan password `admin123`. |

---

## 5. 🚨 Panduan & Aturan Keras bagi Agen AI / Pengembang Berikutnya

1. **JANGAN MERESTORASI PORTAL GURU ATAU ORANG TUA:**
   - Kesepakatan resmi menetapkan **hanya 2 portal**: **Admin Sekolah** dan **Siswa**.
   - Jangan membuat ulang, menyarankan, atau mengembalikan rute guru/ortu ke folder portal aktif.
2. **KONSISTENSI BRANDING:**
   - Nama yayasan **WAJIB "Yayasan Samarinda"**.
   - Warna tema utama **WAJIB Biru Samudra / Oceanic Blue** (`primary-600: #0284C7`).
   - Gunakan logo resmi yang tersimpan di `images/logo.png`.
3. **PRINSIP MINIMAL CHANGE & PRESERVE WORKING CODE:**
   - Utamakan kode yang sudah berjalan. Jangan membangun ulang sistem yang sudah stabil.
   - Jangan menambah framework besar (React, Vue, Webpack, Vite, dsb.) karena arsitektur resmi adalah Vanilla JS + Tailwind CDN.
4. **PERIKSAAN KONTRAK DATA:**
   - Selalu periksa keselarasan field payload antara UI dan backend (`local-api.js` serta `shared/js/api.js`).

---

## 6. 💻 Perintah Menjalankan & Menguji Sistem

```powershell
# 1. Menjalankan Server Dev Lokal (Port 3000)
cd "d:\Projek Landing page yayasan\PROJEK WEBSIDE YAYASAN V2"
node frontend/dev-server.js

# 2. Akses Aplikasi di Browser
# Website Publik : http://localhost:3000
# Login SIAKAD   : http://localhost:3000/login.html
# Portal Admin   : http://localhost:3000/admin/dashboard.html
# Portal Siswa   : http://localhost:3000/siswa/dashboard.html
```

---
*Dokumen ini diperbarui secara resmi pada 11 Oktober 2026. Repositori GitHub resmi telah terhubung (https://github.com/richqe6E/Source_code_yayasan), seluruh kode sumber terunggah 100%, dan seluruh konteks kerja tersimpan secara presisi.*