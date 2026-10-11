# README — Folder Arsitektur SIYAYASAN

Folder ini berisi dokumen arsitektur, requirements, dan diagram untuk sistem SIYAYASAN.

## Daftar File

### 📄 Dokumen Persyaratan

| File | Format | Deskripsi |
|------|--------|-----------|
| `SRD_SIYAYASAN.md` | Markdown | Software Requirements Document — kebutuhan fungsional & non-fungsional lengkap |
| `PRD_SIYAYASAN.md` | Markdown | Product Requirements Document — product vision, personas, fitur, roadmap |

### 📐 Diagram Arsitektur (Draw.io)

| File | Format | Deskripsi |
|------|--------|-----------|
| `01_Arsitektur_Sistem.drawio` | Draw.io | Diagram arsitektur 4-layer (Client → API Gateway → Services → Data) |
| `02_ERD_Database.drawio` | Draw.io | Entity Relationship Diagram dari 33 sheet database |
| `03_Workflow_PPDB.drawio` | Draw.io | Alur PPDB online dari pendaftaran sampai convert ke siswa |
| `04_Use_Case_Per_Role.drawio` | Draw.io | Use case per peran (5 peran utama) |
| `05_Frontend_Pages.drawio` | Draw.io | Peta halaman frontend (public + portal) |
| `06_Sequence_Diagrams.drawio` | Draw.io | Sequence diagram login & API request |

## Cara Membuka Diagram

### Opsi 1: Draw.io Online (Paling Mudah)
1. Buka https://app.diagrams.net
2. Klik **"Open Existing Diagram"**
3. Pilih **"Device"**
4. Upload file `.drawio` dari folder ini
5. Diagram akan terbuka di browser

### Opsi 2: VS Code Extension
1. Install extension **"Draw.io Integration"** di VS Code
2. Buka file `.drawio` langsung di VS Code
3. Diagram dapat diedit dengan GUI

### Opsi 3: Desktop App
1. Download Draw.io Desktop dari https://github.com/jgraph/drawio-desktop/releases
2. Install & buka
3. Drag file `.drawio` ke dalam aplikasi

## Ekspor ke Format Lain

Untuk export diagram ke PNG/PDF/SVG:
1. Buka diagram di Draw.io
2. Tekan **Ctrl+Shift+E** (atau File → Export as)
3. Pilih format:
   - **PNG** — untuk dokumentasi/web
   - **PDF** — untuk dicetak
   - **SVG** — untuk kualitas tinggi
4. Klik Export

## Catatan

- Semua diagram menggunakan **Draw.io XML format** (`.drawio`) yang dapat dibuka dengan tools Draw.io apa pun.
- File markdown menggunakan **CommonMark** dan dapat dibuka di VS Code, GitHub, atau markdown viewer apa pun.
- Jika ingin mengedit diagram, **selalu simpan kembali sebagai `.drawio`** (bukan PNG/SVG) agar editable.

## Kontak

Untuk pertanyaan atau revisi: hubungi Tim Pengembang SIYAYASAN.

---
**Versi Dokumen**: 1.0
**Tanggal**: 12 September 2026
**Status**: Disetujui
