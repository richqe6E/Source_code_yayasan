# 🏫 SIYAYASAN V2 - Sistem Informasi Manajemen Sekolah & Yayasan Samarinda

Website resmi dan portal manajemen pendidikan terpadu untuk **Yayasan At Tarbiyyah Wijaya Kusuma Samarinda** yang menaungi jenjang **PAUD Terpadu**, **TK (TK-A & TK-B)**, dan **TPQ**.

---

## 🌐 Akses Produksi & Hosting Resmi
* **URL Produksi Resmi:** **[https://siyayasan.vercel.app](https://siyayasan.vercel.app)**
* **Basis Data & Storage Cloud:** Supabase Cloud (PostgreSQL 15+ & Bucket Storage `siyayasan-uploads`)
* **Arsitektur:** Jamstack Modern Serverless BaaS (HTML5 Semantik, Vanilla ES6+, Tailwind CSS Oceanic Blue System, Zero NPM Runtime Dependencies).

---

## 🚀 Panduan Menjalankan di Komputer / Laptop Lokal

### 1. Prasyarat
* **Git**: Terpasang di komputer.
* **Node.js**: Versi 18 atau lebih baru.

### 2. Kloning Repositori
```bash
git clone https://github.com/richqe6E/Source_code_yayasan.git
cd Source_code_yayasan
```

### 3. Menjalankan Server Lokal (Port 3000)
Anda dapat menjalankan server melalui salah satu cara berikut:

* **Cara 1 (Windows Script)**:
  Cukup klik dua kali berkas `start-server.cmd` di folder utama.
* **Cara 2 (Terminal Command)**:
  ```bash
  node frontend/dev-server.js
  ```

Buka peramban di:  
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🏛️ Akses Portal & Akun Uji Coba Resmi

Sistem mengadopsi arsitektur **2 Portal Inti + Website Publik**:

| Peran (Role) | Identitas Login | Kata Sandi | Halaman / Portal URL |
|---|---|---|---|
| **Super Admin** | `admin@yayasan.sch.id` | `230400` | `http://localhost:3000/admin/dashboard.html` |
| **Admin TU** | `tu@yayasan.sch.id` | `tu123456` | `http://localhost:3000/admin/dashboard.html` |
| **Siswa Aktif 1** | `2026001` (NIS) | `2020-03-12` (Tgl Lahir) | `http://localhost:3000/siswa/dashboard.html` |
| **Siswa Aktif 2** | `2026002` (NIS) | `2019-08-25` (Tgl Lahir) | `http://localhost:3000/siswa/dashboard.html` |

Halaman Login Terpadu: `http://localhost:3000/login.html` (tersedia tab *Siswa* dan *Admin / Staf*).

---

## 📂 Struktur Direktori Proyek

```
Source_code_yayasan/
├── frontend/
│   ├── public/              # Area Website Publik (index, profil, kontak, berita, galeri, agenda, pengumuman, ppdb)
│   ├── portal/
│   │   ├── admin/           # Portal Admin & TU (dashboard, users, teachers, classes, students, ppdb, payments, cms, reports, backup, logs)
│   │   └── siswa/           # Portal Siswa Mandiri (dashboard, biodata, spp, dokumen)
│   ├── shared/
│   │   └── js/              # Logika shared (api.js, auth.js, supabase-config.js, shell.js, page-transitions.js)
│   ├── dev-server.js        # Server HTTP lokal Node.js port 3000 (Zero npm dependencies)
│   ├── local-api.js         # Engine Mock API & ketahanan offline (offline-resilience)
│   └── package.json         # Konfigurasi package & metadata
├── database/
│   ├── MASTER_SUPABASE_SETUP_V2.sql  # Skema DDL master basis data Supabase PostgreSQL
│   ├── patch_*.sql                   # Berkas patch migrasi & penyesuaian kolom Supabase
│   └── README.md                     # Panduan setup & inisialisasi basis data Supabase
├── tests/                   # Test suite E2E, integrasi alur kerja, dan validasi skema
├── .agents/                 # Konfigurasi agen coding, tools, & custom skills
├── vercel.json              # Konfigurasi routing Vercel (Edge CDN, security headers, canonical redirects)
├── start-server.cmd         # Shortcut peluncur server lokal otomatis
└── *.md                     # Dokumentasi resmi proyek (lihat daftar di bawah)
```

---

## 📚 Dokumentasi Resmi Proyek

| Dokumen | Deskripsi |
|---|---|
| **`PROJECT_CONTEXT_CHECKPOINT.md`** | Dokumen acuan utama (*single source of truth*) arsitektur resmi, kredensial, dan status sistem terkini. |
| **`PROJECT_STATUS.md`** | Riwayat detail lengkap seluruh sesi pengembangan proyek (Sesi 1 s/d Sesi 57). |
| **`ARSITEKTUR_DAN_KOMPONEN_VITAL.md`** | Arsitektur teknis Jamstack, Serverless BaaS Supabase, dan pemetaan komponen vital. |
| **`DOKUMENTASI_TEKNOLOGI_PPDB_ONLINE.md`** | Spesifikasi arsitektur komprehensif sistem PPDB Online (Wizard, kompresi klien, konversi NIS, Supabase). |
| **`PANDUAN_PENGUJIAN_MENYELURUH_E2E.md`** | Panduan pengujian fungsional menyeluruh (*End-to-End*) lintas portal. |
| **`DESIGN_SYNC.md`** | Panduan token desain UI/UX, palet warna *Oceanic Blue*, dan benchmark visual anti-slop. |
| **`database/README.md`** | Panduan inisialisasi dan struktur tabel basis data PostgreSQL di Supabase. |
