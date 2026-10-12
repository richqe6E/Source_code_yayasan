# 📌 DOKUMEN KONTEKS & CHECKPOINT RESMI PROYEK SIYAYASAN V2
**Terakhir Diperbarui:** 12 Oktober 2026 (Sesi Audit, Penyempurnaan 4 Persona, & Localhost)  
**Status Sistem:** Selesai Diuji (34/34 Pengujian Lulus 100%), Stabil, Zero Regression.

---

## 🎯 1. Ringkasan & Arsitektur Utama Sistem
Sistem Informasi Manajemen & Portal Website Yayasan (PAUD, TK, TPQ Samarinda) dirancang dengan arsitektur **Lean & Terkoordinasi**, terdiri dari 2 portal inti:
1. **Portal Admin & Staf TU** (`frontend/portal/admin/`):
   - Mengelola PPDB (Penerimaan Peserta Didik Baru), Keuangan SPP & Infaq, Kelas & Rombel, Data Siswa Aktif, Guru/Tenaga Pendidik, CMS Konten Website (Berita, Pengumuman, Agenda, Galeri), CMS Pengaturan Website & Tampilan, Audit Logs, Laporan Ekspor/Impor, dan Backup Database.
2. **Portal Siswa & Wali Murid** (`frontend/portal/siswa/`):
   - Mengelola pendaftaran/biodata calon santri, upload berkas persyaratan, pelacakan seleksi PPDB, rincian kewajiban SPP & konfirmasi bayar transfer, cetak kuitansi, dan unduh berkas dokumen sekolah.
3. **Website Publik Utama** (`frontend/public/`):
   - Beranda, Profil Yayasan, Berita, Pengumuman, Agenda, Galeri, Kontak & Peta Interaktif Google Maps, serta Formulir PPDB Online 5 tahap.

---

## ⚖️ 2. Keputusan Arsitektur Kunci yang Telah Disepakati
1. **Rapor Akademik Siswa Ditiadakan:**
   - **Keputusan:** Halaman rapor elektronik di portal siswa resmi **ditiadakan**.
   - **Rasional:** Tidak ada Portal Guru dalam sistem yayasan ini. Membebankan input nilai per mata pelajaran kepada staf TU tidak realistis dan berisiko tinggi. Evaluasi perkembangan santri usia dini (STPPA 6 Aspek) berupa rapor fisik yang diserahkan guru langsung ke orang tua santri saat pertemuan akhir semester.
   - **Arsip Digital:** Jika sekolah ingin membagikan scan PDF ijazah/rapor, didistribusikan melalui menu **Berkas Dokumen** (`dokumen.html`). Rute lama `akademik.html` dialihkan secara mulus ke `dashboard.html`.
2. **Pengaturan Lokasi, Alamat & Google Maps Dinamis Tanpa Koding:**
   - **Keputusan:** Alamat fisik, catatan kampus, tautan langsung Google Maps, dan URL iframe embed peta Google Maps dapat diubah sewaktu-waktu oleh pihak Admin/TU melalui formulir visual di **CMS Pengaturan Website** (`cms_setting.html`) dan **Profil Lembaga** (`content.html`).
   - **Hasil:** Seluruh tampilan publik (Header, Footer, Kontak, tombol peta, rute arah) berubah otomatis secara realtime tanpa admin menyentuh kode teknis.

---

## 🛠️ 3. Pekerjaan & Perbaikan Terakhir yang Telah Selesai (Sesi Ini)
1. **CMS Pengaturan Website & Tampilan (`frontend/portal/admin/cms_setting.html`):**
   - Menambahkan field: Alamat Lengkap, Keterangan Kampus (`campus_note`), Tautan Google Maps (`maps_url`), dan Iframe Embed (`maps_embed_url`).
   - Menambahkan box **Live Map Preview** interaktif dan tombol **"Reset ke Lokasi Kampus POLNES"**.
   - Menghubungkan penyimpanan dua arah otomatis ke endpoint `web_settings` dan `schools`.
2. **Halaman Kontak Publik (`frontend/public/kontak.html`):**
   - Sinkronisasi dinamis seluruh elemen kartu alamat, tombol "Buka di Google Maps", tombol "Petunjuk Arah", nomor WhatsApp resmi TU, dan iframe embed Google Maps.
3. **Komponen Footer Global (`frontend/public/js/public-shell.js`):**
   - Menambahkan ID `site-footer-maps-link` dan binding dinamis ke `maps_url`.
   - Mengintegrasikan pembacaan data identitas sekolah secara tangguh dari API maupun cache sesi.
4. **Detail Berita (`frontend/public/berita/detail.html`):**
   - Menambahkan dependensi script `supabase-config.js` dan `api.js` agar artikel berita detail selalu termuat stabil baik daring maupun luring.
5. **WhatsApp Tagihan SPP (`frontend/portal/admin/payments.html`):**
   - Memperluas deteksi nomor HP orang tua dengan memeriksa `inv.parent_phone` dan `inv.parent_whatsapp` terlebih dahulu sebelum fallback ke data siswa.
6. **Arsip Dokumen Siswa (`frontend/portal/siswa/dokumen.html`):**
   - Mengganti direct new-tab dengan **Modal Lightbox Pratinjau Dokumen internal** untuk mencegah terpotongnya file gambar/Base64.
7. **Backend & Dev Server (`frontend/local-api.js`):**
   - Menambahkan sinkronisasi dua arah otomatis antara modul `schools` dan `web_settings`.
   - Memberikan fallback bawaan `action = 'get'` jika parameter action tidak disertakan.

---

## 📊 4. Hasil Uji Otomatis & Audit 4 Persona
Semua 34 skenario pengujian pada `frontend/audit-all-features.js` telah **Lulus 100% (Zero Bug, Zero Regression)**:
- Autentikasi Super Admin & Siswa: **LULUS**
- Alur PPDB (Daftar -> Approve -> Convert ke Siswa Aktif -> Login NIS): **LULUS**
- Transaksi SPP, Bayar Tunai di Kasir TU, Upload Transfer, Verifikasi & Kuitansi: **LULUS**
- Biodata & Upload Dokumen Siswa: **LULUS**
- CMS Berita, Pengumuman, Agenda, Galeri, Pengaturan Medsos & Lokasi Sekolah: **LULUS**
- Integritas seluruh rute publik dan portal (HTTP 200 OK): **LULUS**

---

## 🚀 5. Cara Menjalankan & Menguji di Localhost
1. **Menjalankan Server:**
   ```bash
   node frontend/dev-server.js
   ```
   Server aktif di `http://localhost:3000`.

2. **Kredensial Akun Login:**
   - **Admin TU / Super Admin:**
     - URL: `http://localhost:3000/login.html`
     - Email: `admin@yayasan.sch.id`
     - Password: `admin123`
   - **Siswa Aktif:**
     - URL: `http://localhost:3000/login.html`
     - NIS: `2026001`
     - Password Awal: `2020-03-12` (Tanggal Lahir)

---

## 🗺️ 6. Rencana Kerja untuk Sesi Berikutnya
Ketika sesi dilanjutkan, agenda kerja yang dapat dilakukan meliputi:
1. **Penyesuaian Visual / Aset Nyata Yayasan:** Mengganti logo atau foto kampus dengan aset riil yayasan jika sudah disediakan oleh yayasan.
2. **Penyelarasan Skema Cloud Supabase:** Memastikan tabel PostgreSQL remote di Supabase menyertakan kolom yang sama dengan schema lokal (jika yayasan akan segera online ke production).
3. **Uji Penerimaan Pengguna (UAT Final):** Melakukan demo alur lengkap bersama pengurus yayasan.
