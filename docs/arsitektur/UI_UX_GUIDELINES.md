# 🎨 SIYAYASAN — Design System & UI/UX Guidelines

> **Prinsip**: Profesional, mudah dibaca, tidak berlebihan, tanpa indikasi "AI slop".

---

## 1. Filosofi Desain

### 1.1 Tiga Prinsip Utama

1. **Profesional seperti Lembaga Pendidikan**
   - Tipografi jelas, warna netral, layout lapang.
   - Tidak ada emoji atau animasi berlebihan.
   - Fokus pada konten, bukan dekorasi.

2. **Ramah Pengguna (User-Friendly)**
   - Bahasa Indonesia formal, tidak terlalu kaku.
   - Mobile-first (kebanyakan akses via smartphone).
   - Aksesibilitas: kontras cukup, label jelas, navigasi konsisten.

3. **Konsisten & Prediktabel**
   - Pola visual seragam di semua halaman.
   - Interaksi standar: klik tombol → loading → feedback (toast/alert).
   - Navigasi tidak berubah-ubah.

### 1.2 Anti-Pattern yang Harus Dihindari

❌ **"AI Slop"** — ciri yang harus dihindari:
- Gradien warna mencolok (ungu/pink/hijau neon)
- Glass morphism, neumorphism berlebihan
- Floating elements, decorative shapes
- Excessive animations (parallax, scroll-triggered)
- 3D illustrations, isometric graphics
- Generic AI-style icons (multicolor, skeuomorphic)
- Rounded corner terlalu besar (border-radius 2rem+)
- Pattern background yang ramai

✅ **Yang diinginkan:**
- Clean white/cream background
- Subtle 1px borders, light shadow
- Flat solid colors (1-2 brand + neutrals)
- Typography hierarchy yang jelas
- Generous whitespace
- Standard system icons (Heroicons, Lucide)

---

## 2. Design Tokens

### 2.1 Color Palette

#### Primary (Brand Color: Yayasan)
```css
--color-primary-50:  #F0F9FF;  /* Lightest */
--color-primary-100: #E0F2FE;
--color-primary-200: #BAE6FD;
--color-primary-300: #7DD3FC;
--color-primary-400: #38BDF8;
--color-primary-500: #0EA5E9;  /* Base */
--color-primary-600: #0284C7;
--color-primary-700: #0369A1;
--color-primary-800: #075985;
--color-primary-900: #0C4A6E;  /* Darkest */
```

> **Catatan**: Warna brand (primary) dapat diganti sesuai logo yayasan. Default menggunakan **Sky Blue** karena netral & edukatif.

#### Neutrals (Abu-abu)
```css
--color-gray-50:  #F9FAFB;
--color-gray-100: #F3F4F6;
--color-gray-200: #E5E7EB;
--color-gray-300: #D1D5DB;
--color-gray-400: #9CA3AF;
--color-gray-500: #6B7280;
--color-gray-600: #4B5563;
--color-gray-700: #374151;
--color-gray-800: #1F2937;
--color-gray-900: #111827;
```

#### Semantic Colors
```css
--color-success: #16A34A;   /* Hijau tua */
--color-warning: #D97706;   /* Oranye tua */
--color-danger:  #DC2626;   /* Merah tua */
--color-info:    #2563EB;   /* Biru tua */
```

**Light backgrounds untuk badges/notifikasi:**
```css
--color-success-bg: #DCFCE7;
--color-warning-bg: #FEF3C7;
--color-danger-bg:  #FEE2E2;
--color-info-bg:    #DBEAFE;
```

### 2.2 Typography

#### Font Family
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-serif: 'Source Serif Pro', Georgia, serif;  /* Untuk heading jika perlu */
```

> **Catatan**: Hindari font terlalu artistikal. **Inter** adalah pilihan aman dan modern.

#### Type Scale (Modular Scale 1.250)
```css
--text-xs:   0.75rem;   /* 12px */
--text-sm:   0.875rem;  /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg:   1.125rem;  /* 18px */
--text-xl:   1.25rem;   /* 20px */
--text-2xl:  1.5rem;    /* 24px */
--text-3xl:  1.875rem;  /* 30px */
--text-4xl:  2.25rem;   /* 36px */
--text-5xl:  3rem;      /* 48px */
```

#### Line Height
```css
--leading-tight:  1.25;
--leading-snug:   1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

#### Font Weight
```css
--font-normal:    400;
--font-medium:    500;
--font-semibold:  600;
--font-bold:      700;
```

#### Contoh Penggunaan
- **H1 (page title)**: `text-3xl font-bold text-gray-900 leading-tight`
- **H2 (section)**: `text-2xl font-semibold text-gray-800 leading-snug`
- **H3 (subsection)**: `text-lg font-semibold text-gray-700`
- **Body**: `text-base text-gray-700 leading-relaxed`
- **Caption**: `text-sm text-gray-500`

### 2.3 Spacing

Mengikuti **4px base unit**:
```css
--space-1:  0.25rem;  /* 4px */
--space-2:  0.5rem;   /* 8px */
--space-3:  0.75rem;  /* 12px */
--space-4:  1rem;     /* 16px */
--space-5:  1.25rem;  /* 20px */
--space-6:  1.5rem;   /* 24px */
--space-8:  2rem;     /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
```

**Aturan umum:**
- Padding card: `space-6` (24px)
- Gap antar section: `space-8` (32px)
- Container max-width: `1280px` (max-w-7xl)

### 2.4 Border Radius

```css
--radius-sm:   0.25rem;  /* 4px - untuk badge */
--radius-md:   0.5rem;   /* 8px - untuk button, input */
--radius-lg:   0.75rem;  /* 12px - untuk card */
--radius-xl:   1rem;     /* 16px - untuk modal (max) */
--radius-full: 9999px;   /* Untuk avatar, pill */
```

> ⚠️ **Jangan lebih dari 16px (1rem)**, kecuali untuk avatar/circle.

### 2.5 Shadow

```css
--shadow-sm:  0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md:  0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg:  0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl:  0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

**Penggunaan:**
- `shadow-sm`: untuk button default
- `shadow-md`: untuk card
- `shadow-lg`: untuk dropdown, popover
- `shadow-xl`: untuk modal

### 2.6 Breakpoints

```css
--breakpoint-sm:  640px;   /* Small tablet */
--breakpoint-md:  768px;   /* Tablet */
--breakpoint-lg:  1024px;  /* Desktop */
--breakpoint-xl:  1280px;  /* Wide desktop */
--breakpoint-2xl: 1536px;  /* Ultra wide */
```

---

## 3. Komponen

### 3.1 Button

```html
<!-- Primary Button -->
<button class="inline-flex items-center justify-center gap-2 px-4 py-2.5 
               bg-primary-600 hover:bg-primary-700 active:bg-primary-800
               text-white font-medium text-sm rounded-md 
               transition-colors duration-150
               focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
               disabled:opacity-50 disabled:cursor-not-allowed">
  Simpan
</button>

<!-- Secondary Button -->
<button class="inline-flex items-center justify-center gap-2 px-4 py-2.5 
               bg-white hover:bg-gray-50 
               text-gray-700 font-medium text-sm rounded-md 
               border border-gray-300
               focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
  Batal
</button>

<!-- Danger Button -->
<button class="inline-flex items-center justify-center gap-2 px-4 py-2.5 
               bg-red-600 hover:bg-red-700
               text-white font-medium text-sm rounded-md 
               focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
  Hapus
</button>
```

**Ukuran:**
- `px-3 py-1.5 text-xs` — Small
- `px-4 py-2.5 text-sm` — Default
- `px-5 py-3 text-base` — Large

### 3.2 Input

```html
<div>
  <label for="email" class="block text-sm font-medium text-gray-700 mb-1.5">
    Email
  </label>
  <input type="email" id="email" name="email"
         class="block w-full px-3 py-2.5 
                text-gray-900 text-sm 
                border border-gray-300 rounded-md
                placeholder:text-gray-400
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                disabled:bg-gray-50 disabled:text-gray-500">
</div>
```

**States:**
- Default: `border-gray-300`
- Error: `border-red-500 focus:ring-red-500`
- Disabled: `bg-gray-50`

### 3.3 Card

```html
<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
  <h3 class="text-lg font-semibold text-gray-900 mb-2">Judul Card</h3>
  <p class="text-sm text-gray-600">Isi konten card di sini.</p>
</div>
```

### 3.4 Table

```html
<div class="overflow-x-auto border border-gray-200 rounded-lg">
  <table class="w-full text-sm text-left">
    <thead class="bg-gray-50 border-b border-gray-200">
      <tr>
        <th class="px-4 py-3 font-semibold text-gray-700">Nama</th>
        <th class="px-4 py-3 font-semibold text-gray-700">Status</th>
        <th class="px-4 py-3 font-semibold text-gray-700">Aksi</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-200">
      <tr class="hover:bg-gray-50">
        <td class="px-4 py-3 text-gray-900">Andi</td>
        <td class="px-4 py-3">
          <span class="inline-flex px-2 py-0.5 text-xs font-medium 
                       bg-green-100 text-green-800 rounded">Aktif</span>
        </td>
        <td class="px-4 py-3">
          <button class="text-primary-600 hover:text-primary-700 font-medium">Edit</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### 3.5 Badge

```html
<!-- Status badges -->
<span class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded">
  <!-- Success -->
  <span class="bg-green-100 text-green-800">Aktif</span>
  <!-- Warning -->
  <span class="bg-yellow-100 text-yellow-800">Pending</span>
  <!-- Danger -->
  <span class="bg-red-100 text-red-800">Ditolak</span>
  <!-- Info -->
  <span class="bg-blue-100 text-blue-800">Info</span>
</span>
```

### 3.6 Alert

```html
<div class="p-4 border-l-4 rounded-r-md" 
     style="border-color: var(--color-success); background: var(--color-success-bg);">
  <div class="flex">
    <div class="flex-shrink-0">
      <svg class="w-5 h-5 text-green-700" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
      </svg>
    </div>
    <div class="ml-3">
      <p class="text-sm font-medium text-green-800">Data berhasil disimpan.</p>
    </div>
  </div>
</div>
```

### 3.7 Modal

```html
<div class="fixed inset-0 z-50 overflow-y-auto" role="dialog">
  <!-- Backdrop -->
  <div class="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"></div>
  
  <!-- Modal -->
  <div class="relative min-h-screen flex items-center justify-center p-4">
    <div class="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Konfirmasi</h3>
      <p class="text-sm text-gray-600 mb-6">Apakah Anda yakin ingin menghapus data ini?</p>
      <div class="flex justify-end gap-2">
        <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">Batal</button>
        <button class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md">Hapus</button>
      </div>
    </div>
  </div>
</div>
```

### 3.8 Navigation

#### Top Navbar (Public)
```html
<nav class="bg-white border-b border-gray-200 sticky top-0 z-40">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <div class="flex items-center">
        <a href="/" class="flex items-center gap-2">
          <img src="/logo.png" class="h-8 w-8" alt="Logo Yayasan">
          <span class="text-lg font-bold text-gray-900">Yayasan</span>
        </a>
        <div class="hidden md:flex items-center ml-10 gap-1">
          <a href="/profil.html" class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600">Profil</a>
          <a href="/berita.html" class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600">Berita</a>
          <a href="/ppdb.html" class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600">PPDB</a>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <a href="/login.html" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">Login</a>
      </div>
    </div>
  </div>
</nav>
```

#### Sidebar (Portal)
```html
<aside class="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
  <div class="px-6 py-5 border-b border-gray-200">
    <h1 class="text-lg font-bold text-gray-900">Portal</h1>
  </div>
  <nav class="flex-1 px-3 py-4 space-y-1">
    <a href="/admin/dashboard.html" 
       class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md
              bg-primary-50 text-primary-700">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
      </svg>
      Dashboard
    </a>
    <a href="/admin/students.html" 
       class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md
              text-gray-700 hover:bg-gray-50">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">...</svg>
      Siswa
    </a>
  </nav>
</aside>
```

---

## 4. Layout Patterns

### 4.1 Container

```html
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <!-- Konten -->
</div>
```

### 4.2 Grid

```html
<!-- 3-column grid responsive -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

### 4.3 Page Header

```html
<div class="border-b border-gray-200 bg-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <h1 class="text-2xl font-bold text-gray-900">Manajemen Siswa</h1>
    <p class="mt-1 text-sm text-gray-600">Kelola data siswa yayasan</p>
  </div>
</div>
```

### 4.4 Empty State

```html
<div class="text-center py-12">
  <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
  </svg>
  <h3 class="mt-2 text-sm font-medium text-gray-900">Belum ada data</h3>
  <p class="mt-1 text-sm text-gray-500">Mulai dengan menambahkan data baru.</p>
  <div class="mt-6">
    <button class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md">
      Tambah Data
    </button>
  </div>
</div>
```

---

## 5. Iconography

Gunakan **Heroicons** (https://heroicons.com) atau **Lucide Icons** (https://lucide.dev):
- **Outline** untuk navigasi, list, action.
- **Solid** untuk status, badge, indicator.
- **Size default**: 20px (w-5 h-5) atau 24px (w-6 h-6).
- **Color**: `currentColor` agar mewarisi warna teks.

**Hindari:**
- Emoji sebagai icon utama (boleh sebagai dekorasi konten).
- Icon library yang tidak konsisten (campur 3+ jenis).
- Icon terlalu kecil (< 16px) atau terlalu besar (> 32px).

---

## 6. Loading States

### 6.1 Skeleton (Loading Placeholder)
```html
<div class="animate-pulse space-y-4">
  <div class="h-4 bg-gray-200 rounded w-3/4"></div>
  <div class="h-4 bg-gray-200 rounded w-1/2"></div>
  <div class="h-4 bg-gray-200 rounded w-full"></div>
</div>
```

### 6.2 Spinner
```html
<svg class="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
</svg>
```

### 6.3 Button Loading
```html
<button disabled class="opacity-75 cursor-not-allowed">
  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" ...>
    <!-- spinner -->
  </svg>
  Menyimpan...
</button>
```

---

## 7. Toast / Notification

```html
<!-- Toast container (fixed bottom-right) -->
<div id="toast" 
     class="fixed bottom-4 right-4 z-50 max-w-sm bg-white border border-gray-200 
            rounded-lg shadow-lg p-4 flex items-start gap-3">
  <div class="flex-shrink-0">
    <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
    </svg>
  </div>
  <div class="flex-1">
    <p class="text-sm font-medium text-gray-900">Berhasil</p>
    <p class="mt-0.5 text-sm text-gray-600">Data telah disimpan.</p>
  </div>
  <button class="text-gray-400 hover:text-gray-500">
    <svg class="w-4 h-4" ...>×</svg>
  </button>
</div>
```

---

## 8. Form Patterns

### 8.1 Form Layout (Vertical)
```html
<form class="space-y-5">
  <div>
    <label for="name" class="block text-sm font-medium text-gray-700 mb-1.5">
      Nama Lengkap <span class="text-red-500">*</span>
    </label>
    <input id="name" type="text" required
           class="block w-full px-3 py-2.5 text-sm border border-gray-300 rounded-md
                  focus:ring-2 focus:ring-primary-500 focus:border-transparent">
  </div>
  
  <div class="flex justify-end gap-2 pt-4 border-t border-gray-200">
    <button type="button" class="px-4 py-2.5 text-sm font-medium text-gray-700 
                                   bg-white border border-gray-300 rounded-md">
      Batal
    </button>
    <button type="submit" class="px-4 py-2.5 text-sm font-medium text-white 
                                  bg-primary-600 rounded-md">
      Simpan
    </button>
  </div>
</form>
```

### 8.2 Validation
```html
<div>
  <label for="email" class="block text-sm font-medium text-gray-700 mb-1.5">
    Email <span class="text-red-500">*</span>
  </label>
  <input id="email" type="email" required
         class="block w-full px-3 py-2.5 text-sm 
                border border-red-500 rounded-md
                focus:ring-2 focus:ring-red-500 focus:border-transparent">
  <p class="mt-1.5 text-sm text-red-600">Format email tidak valid.</p>
</div>
```

---

## 9. Accessibility (a11y)

### 9.1 Checklist
- [ ] Color contrast minimal **4.5:1** untuk teks normal, **3:1** untuk teks besar.
- [ ] Setiap `<input>` punya `<label>` atau `aria-label`.
- [ ] Tombol punya label yang jelas (jangan hanya icon tanpa label).
- [ ] Heading hierarchy: H1 → H2 → H3 (tidak skip).
- [ ] Focus visible (jangan `outline: none` tanpa alternatif).
- [ ] Keyboard navigable: tab order logis, escape untuk tutup modal.
- [ ] Alt text untuk gambar (`alt="..."`).

### 9.2 Skip to Content
```html
<a href="#main" class="sr-only focus:not-sr-only ...">Skip to main content</a>
```

---

## 10. Responsive Strategy

### 10.1 Mobile-First

Tulislah CSS/HTML untuk **mobile dulu**, baru tambahkan breakpoint untuk layar lebih besar.

```html
<!-- Mobile: stack vertical -->
<!-- Desktop: horizontal layout -->
<div class="flex flex-col md:flex-row gap-4">
  <div class="flex-1">Kolom 1</div>
  <div class="flex-1">Kolom 2</div>
</div>
```

### 10.2 Breakpoint Behavior
- **< 640px (sm)**: Single column, hamburger menu, full-width button.
- **640px-1024px (md)**: 2-column grid, sidebar collapse.
- **> 1024px (lg)**: Full layout dengan sidebar.

### 10.3 Table di Mobile
Gunakan **responsive table** dengan horizontal scroll atau stacked layout:
```html
<div class="overflow-x-auto">
  <table class="w-full">...</table>
</div>
```

---

## 11. Print Stylesheet

Untuk halaman yang dapat dicetak (laporan, rapor):
```css
@media print {
  .no-print { display: none; }
  body { font-size: 11pt; }
  .print-page-break { page-break-after: always; }
  .card { border: 1px solid #000; box-shadow: none; }
}
```

---

## 12. Performance Best Practices

1. **CSS**: Gunakan Tailwind via CDN untuk development, build ke production CSS.
2. **JS**: Vanilla JS minimal, hindari framework besar untuk halaman statis.
3. **Image**: 
   - Format WebP dengan fallback JPG/PNG.
   - Lazy loading: `loading="lazy"`.
   - Ukuran responsif via `srcset`.
4. **Font**: Preconnect ke Google Fonts.
5. **Caching**: Browser cache untuk aset statis.

---

## 13. Checklist Sebelum Publish

- [ ] Responsif di mobile (test di Chrome DevTools).
- [ ] Aksesibilitas: tab navigation, screen reader.
- [ ] Loading state setiap aksi async.
- [ ] Error handling: tampilkan pesan jelas.
- [ ] Empty state untuk data kosong.
- [ ] SEO meta tags (title, description, og:image).
- [ ] Favicon dan apple-touch-icon.
- [ ] Performance: Lighthouse score > 80.

---

**Versi Dokumen**: 1.0
**Tanggal**: 12 September 2026
**Disusun oleh**: Tim Pengembang SIYAYASAN
