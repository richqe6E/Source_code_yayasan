# Redesain Struktur Pengurus & Integrasi Upload Foto Wajah Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghapus unit Kepala PAUD/TK dan Koordinator TPQ dari struktur organisasi yayasan, menyederhanakan hierarki menjadi 5 posisi inti (Pembina, Pengawas, Ketua Umum, Sekretaris, Bendahara), menambahkan fitur upload foto wajah pengurus langsung dari Portal Admin (`content.html`), serta menyinkronkan nama dan foto tersebut secara otomatis ke halaman profil publik (`profil.html`) dengan dukungan instant zero-FOUC pre-hydration.

**Architecture:** 
1. **Penyederhanaan Struktur Organisasi:** Menghapus 2 posisi pelaksana teknis (Kepala PAUD/TK & Koordinator TPQ) dari form Admin Portal dan tampilan visual Bagan Pohon di Halaman Profil.
2. **Fitur Upload Foto Wajah Pengurus di Admin Portal (`content.html`):** Membuat 5 kartu terstruktur untuk Pembina, Pengawas, Ketua, Sekretaris, dan Bendahara. Setiap kartu dilengkapi input nama, area pratinjau avatar lingkaran, input file gambar, tombol upload & hapus foto, serta integrasi asinkron dengan `uploadToSupabaseStorage` (tersimpan ke Supabase Storage dengan fallback Base64 Data URL).
3. **Persistensi Data di Backend & Adapter (`api.js`):** Memperluas `extPayload` pada `schools.update` dan `schools.get` agar menyimpan dan mengembalikan URL foto (`pembina_photo`, `pengawas_photo`, `ketua_photo`, `sekretaris_photo`, `bendahara_photo`) baik di root maupun di dalam objek `struktur_organisasi` (tersimpan di `schools.wa_gateway_token`, `web_settings.announcement_banner`, dan cache lokal `siy_school_ext`).
4. **Tampilan Dinamis & Zero-FOUC di Profil Publik (`profil.html`):** Memperbarui bagan pohon desktop dan vertical stepper mobile dengan avatar foto lingkaran elegan (`object-cover`, border halus, bayangan lembut). Jika foto belum diupload, sistem otomatis menampilkan monogram inisial (misal `DI`, `SH`, `MK`, `CG`, `SP`) secara anggun. Skrip pre-hydration di `<head>` membaca cache lokal pada detik ke-0 untuk mencegah kedipan gambar (*Zero-FOUC*).

**Tech Stack:** Vanilla JavaScript (ES6+), Tailwind CSS, Supabase Storage (`siyayasan-uploads`), HTML5 FileReader API, PostgREST REST API.

---

## Global Constraints
- **Zero-Regression:** Tidak mengubah atau merusak logika yang sudah berjalan (CMS Berita/Pengumuman/Agenda, Hero Carousel, CRUD PPDB, Filter PPDB, SPP, Sticky Navigation Header, dan Portal Siswa).
- **Sticky Navigation Preserved:** Tidak menambahkan `overflow-x: hidden` pada `html` atau `body` agar navigasi sticky tetap menempel di atas layar saat di-scroll.
- **Graceful Fallback:** Jika pengurus belum memiliki foto, avatar tetap menampilkan monogram inisial huruf yang rapi tanpa broken image.
- **Mobile Responsive:** Bagan pohon desktop tetap tersembunyi di layar kecil (`hidden md:block`), dan mobile stepper vertikal tetap rapi tanpa scroll horizontal liar.

---

## Review Focus
1. **Photo Upload & Preview di Admin:** Memastikan saat admin memilih file foto untuk salah satu pengurus, pratinjau langsung berganti secara instan, dan tombol hapus foto berfungsi normal.
2. **Data Persistence ke Supabase:** Memastikan saat tombol "Simpan Pengaturan Sekolah" ditekan, URL foto dan nama pengurus tersimpan ke Supabase Cloud dan cache lokal `siy_school_ext`.
3. **Eliminasi Total Kepala PAUD/TK & Koordinator TPQ:** Memastikan tidak ada sisa input atau sisa kartu Kepala PAUD/TK dan Koordinator TPQ baik di Admin maupun Profil Publik.
4. **Zero-FOUC di Profil Publik:** Memastikan saat halaman `profil.html` dibuka, foto pengurus yang telah diupload langsung tampil tanpa jeda atau kedipan.
5. **Mobile Stepper Alignment:** Memastikan foto pengurus di tampilan mobile stepper tampil presisi dalam lingkaran thumbnail 48px (`w-12 h-12 rounded-full object-cover`).

---

## Task Breakdown

### Task 1: Backend Adapter Persistence untuk Foto Pengurus (`api.js`)
**Files:**
- Modify: `frontend/shared/js/api.js`

- [ ] **Step 1.1:** Buka `frontend/shared/js/api.js` pada blok `module === 'schools' || module === 'school'`.
- [ ] **Step 1.2:** Pada `action === 'update'`, tambahkan field foto pengurus ke dalam `extPayload`:
  - `pembina_photo`, `pengawas_photo`, `ketua_photo` / `ketua_yayasan_photo`, `sekretaris_photo`, `bendahara_photo`.
  - Pastikan objek `struktur_organisasi` di dalam `extPayload` memuat baik nama maupun URL foto untuk 5 pengurus inti.
- [ ] **Step 1.3:** Pada `action === 'get'`, pastikan seluruh field foto di atas di-merge dan dikembalikan dengan benar dari `schExt`, `wsExt`, dan `siy_school_ext`.
- [ ] **Step 1.4:** Jalankan `node --check frontend/shared/js/api.js` untuk memverifikasi sintaks JavaScript valid.

---

### Task 2: Redesain Seksi 5 & Fitur Upload Foto Pengurus di Portal Admin (`content.html`)
**Files:**
- Modify: `frontend/portal/admin/content.html`

- [ ] **Step 2.1:** Buka `frontend/portal/admin/content.html` pada Seksi 5: *Struktur Kepengurusan Organisasi (Bagan Pohon)*.
- [ ] **Step 2.2:** Hapus 2 input lama: `#sch-head-paud-tk` (Kepala Sekolah PAUD/TK) dan `#sch-head-tpq` (Koordinator TPQ).
- [ ] **Step 2.3:** Redesain antarmuka 5 posisi inti (Dewan Pembina, Dewan Pengawas, Ketua Umum, Sekretaris, Bendahara) menjadi kartu manajemen foto & nama:
  - Pratinjau avatar lingkaran (`w-14 h-14 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center`).
  - Input teks nama pengurus.
  - Tombol aksi: "Pilih Foto" (`<input type="file" accept="image/*" class="hidden">`) dan "Hapus" (jika foto sudah terpasang).
  - Hidden input penampung data foto: `#sch-pembina-photo`, `#sch-pengawas-photo`, `#sch-ketua-photo`, `#sch-sekretaris-photo`, `#sch-bendahara-photo`.
- [ ] **Step 2.4:** Tambahkan skrip *event listener* pada perubahan file foto (`FileReader` + pratinjau instan + upload asinkron via `uploadToSupabaseStorage(f, 'pengurus_...')`).
- [ ] **Step 2.5:** Perbarui fungsi `saveSchoolIdentity()` untuk mengumpulkan `pembina_photo`, `pengawas_photo`, `ketua_yayasan_photo`, `sekretaris_photo`, dan `bendahara_photo` serta menyimpannya ke payload `schools.update` dan `web_settings.update`.
- [ ] **Step 2.6:** Perbarui fungsi pemuatan/hidrasi form (`renderIdentityTab`) agar memuat foto yang sudah ada ke pratinjau avatar masing-masing.

---

### Task 3: Redesain Bagan Struktur & Integrasi Foto di Halaman Profil Publik (`profil.html`)
**Files:**
- Modify: `frontend/public/profil.html`

- [ ] **Step 3.1:** Buka `frontend/public/profil.html` pada Seksi 3.5: *Struktur Inti Pengurus Yayasan* (`#struktur-organisasi`).
- [ ] **Step 3.2:** Hapus TIER 4 Desktop (Kepala PAUD & TK dan Koordinator TPQ) beserta garis konektornya dari pohon hirarki.
- [ ] **Step 3.3:** Hapus Tier 4 Mobile (Kepala PAUD/TK dan Koord. TPQ) dari *Mobile Vertical Stepper*.
- [ ] **Step 3.4:** Pada TIER 1 (Dewan Pembina), TIER 2 (Dewan Pengawas & Ketua Umum), dan TIER 3 (Sekretaris & Bendahara), perbarui elemen avatar di kartu:
  - Sematkan elemen gambar avatar dinamis: `<img id="org-pembina-img" class="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-slate-200 shadow-xs mx-auto mb-3 hidden" alt="Foto Dewan Pembina">`.
  - Pasang elemen fallback monogram inisial: `<div id="org-pembina-fallback" class="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-800 font-extrabold text-sm flex items-center justify-center mx-auto mb-3"><span>DI</span></div>`.
  - Terapkan struktur yang sama pada Pengawas (`SH`), Ketua (`MK`), Sekretaris (`CG`), dan Bendahara (`SP`).
- [ ] **Step 3.5:** Terapkan elemen thumbnail foto pada kartu *Mobile Stepper* untuk ke-5 posisi inti.
- [ ] **Step 3.6:** Perbarui fungsi `loadProfilePageData()` / `setOrgValue()`:
  - Jika data memiliki `_photo`, tampilkan elemen `<img>` dan sembunyikan `fallback`.
  - Jika data foto kosong, sembunyikan `<img>` dan tampilkan monogram `fallback`.
  - Bersihkan binding lama untuk `org-kepala-paud-tk` dan `org-kepala-tpq`.
- [ ] **Step 3.7:** Perbarui skrip *Instant Pre-Hydration* di `<head>` agar membaca `d.pembina_photo`, `d.pengawas_photo`, dll. dari `siy_school_ext` pada detik ke-0 (Zero-FOUC).

---

### Task 4: Verifikasi Menyeluruh, Pengujian E2E & Deployment
**Files:**
- Test & Verify: Seluruh halaman terkait (`content.html`, `profil.html`, `api.js`)

- [ ] **Step 4.1:** Uji validitas sintaks HTML dan JavaScript (`node --check` dan Python HTMLParser).
- [ ] **Step 4.2:** Uji alur input nama & upload foto di Admin Portal (`content.html`), pastikan data tersimpan ke database & `siy_school_ext`.
- [ ] **Step 4.3:** Uji tampilan `profil.html`: verifikasi bahwa foto pengurus tampil di desktop dan mobile, hanya ada 5 pengurus inti (tanpa kepala sekolah & koordinator TPQ), dan fallback monogram bekerja saat foto belum diupload.
- [ ] **Step 4.4:** Verifikasi sticky header: pastikan navigasi website tetap sticky menempel di atas saat di-scroll.
- [ ] **Step 4.5:** Commit perubahan ke Git dengan pesan deskriptif dan push ke branch `main` GitHub untuk auto-deploy ke Vercel.
- [ ] **Step 4.6:** Update dokumen `PROJECT_CONTEXT_CHECKPOINT.md` dan `daftar_antrean_revisi_dan_perbaikan_tahap_2.md`.
