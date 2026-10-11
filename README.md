# 🏫 SIYAYASAN V2 - Sistem Informasi Manajemen Sekolah & Yayasan Samarinda

Website resmi dan portal manajemen pendidikan terpadu untuk unit **PAUD**, **TK (TK-A & TK-B)**, dan **TPQ**.

---

## 🚀 Panduan Menjalankan di Device / Laptop Baru

### 1. Prasyarat
* **Git**: Terpasang di laptop.
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

Buka browser di:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🏛️ Akses Portal & Akun Demo

Sesuai arsitektur resmi V2, sistem memiliki **2 Portal Resmi**:

| Peran (Role) | Identitas Login | Kata Sandi | Halaman / Portal URL |
|---|---|---|---|
| **Super Admin** | `admin@yayasan.sch.id` | `admin123` | `http://localhost:3000/admin/dashboard.html` |
| **Admin TU** | `tu@yayasan.sch.id` | `tu123456` | `http://localhost:3000/admin/dashboard.html` |
| **Siswa Aktif 1** | `2026001` (NIS) | `2020-03-12` (Tgl Lahir) | `http://localhost:3000/siswa/dashboard.html` |
| **Siswa Aktif 2** | `2026002` (NIS) | `2019-08-25` (Tgl Lahir) | `http://localhost:3000/siswa/dashboard.html` |

Halaman Login Utama: `http://localhost:3000/login.html` (tersedia tab *Siswa* dan *Admin*).

---

## 📂 Struktur Direktori Proyek

```
Source_code_yayasan/
├── frontend/
│   ├── public/              # Website publik (index, profil, kontak, berita, galeri, PPDB, dll)
│   ├── portal/
│   │   ├── admin/           # Portal Admin & TU (dashboard, users, payments, reports, cms, dll)
│   │   └── siswa/           # Portal Siswa Mandiri (dashboard, biodata, akademik, spp, dokumen)
│   ├── shared/
│   │   ├── js/              # Logika shared (api.js, auth.js, supabase-config.js, shell.js)
│   │   └── images/          # Aset logo dan gambar shared
│   ├── dev-server.js        # Server HTTP lokal Node.js port 3000 (Zero npm dependencies)
│   └── local-api.js         # Mock API engine lengkap
├── database/
│   ├── MASTER_SUPABASE_SETUP_V2.sql  # Skema & relasi database PostgreSQL Supabase
│   └── seed/                # Data awal CSV untuk migrasi
├── docs/                    # Dokumentasi arsitektur sistem, PRD, SRD, & ERD
├── .legacy_backup/          # Arsip kode portal v1 lama (guru & orang tua)
└── start-server.cmd         # Shortcut peluncur server lokal otomatis
```

---

## ☁️ Integrasi Cloud & Database
* **Database**: PostgreSQL Supabase (sudah terhubung di `frontend/shared/js/supabase-config.js`).
* **Hosting Produksi**: Vercel (`https://siyayasan-portal.vercel.app`).
* Sistem beroperasi secara hybrid: otomatis tersambung ke Supabase saat online, dan didukung simulasi data lokal saat offline.
