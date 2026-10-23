# Portal Streamlining & Admin Core Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Streamline system architecture to strictly operate on 2 portals (Portal Admin & Portal Siswa), decommission all legacy "Orang Tua" login/role remnants, resolve the PPDB deletion and filter sync bugs, remove UI glitches (double-plus button & scrollbar thumb artifacts), and implement 1-click WhatsApp arrears notifications.

**Architecture:** Purge obsolete `orang_tua` role references and replace legacy dashboard cards with actionable metrics (Pendaftar PPDB); disentangle PostgREST empty filter responses (`[]`) from network errors in `api.js` to eliminate the local storage fallback trap; enforce synchronous deletion across Supabase and local storage; polish admin interface controls in `payments.html` and `ppdb.html`.

**Tech Stack:** Vanilla JavaScript (ES6+), Tailwind CSS, Supabase REST API (PostgREST), HTML5, LocalStorage, Vercel Static Hosting.

**Spec:** User directives from session conversation (Requests #5 - #10) and backlog artifact `C:/Users/MSi-Modern/.gemini/antigravity/brain/d39980e2-0e09-414a-8ffe-d4d3b3a3d247/daftar_antrean_revisi_dan_perbaikan_tahap_2.md`.

---

## Global Constraints

- **2-Portal Architecture Only:** System strictly has 2 portals: Portal Admin (`/admin/*`) and Portal Siswa (`/siswa/*`). No dedicated login or portal for parents.
- **Zero-Regression Guarantee:** Existing working features (CMS dynamic banner, news, agenda, teacher profiles, active student sessions, auth session flow) must remain 100% operational.
- **Safe Fallback Handling:** Supabase queries returning zero rows (`[]`) must NOT be treated as network errors; local storage fallback must only trigger on actual network or connection failure (`null` or thrown network exception).
- **Responsive Mobile First:** All portal and public page changes must strictly preserve mobile usability and prevent horizontal overflow or cutoff.

## Review Focus

1. **Empty Filter PostgREST Handling:** When filtering PPDB or Payments with criteria that match 0 records, the API must return `[]` and render "Tidak ada data...", without falling back to unfiltered localStorage pending records.
2. **Dual-Key Deletion:** PPDB deletion must match both `id` and `registration_number` / `registration_no` to guarantee rows are expunged from Supabase regardless of key passed.
3. **Synchronous Local Cache Mutation:** Every delete, approve, or reject operation in admin must immediately mutate `siy_local_ppdb_regs`, `siy_local_students`, and `siy_local_users` to avoid cache resurrection.
4. **WhatsApp Phone Normalization:** Arrears notification must parse phone numbers cleanly to international standard (`628xxx`) and provide interactive admin prompt if phone is missing or malformed.
5. **Dashboard Zero-Count Handling:** Replacing the Orang Tua card with Pendaftar PPDB must gracefully display `0` when there are no pending applicants without throwing `NaN` or unhandled exceptions.

---

### Task 1: Decommission Legacy "Orang Tua" Role & Align Admin Dashboard KPI

**Files:**
- Modify: `frontend/portal/admin/dashboard.html:60-75`
- Modify: `frontend/portal/admin/dashboard.html:125-140`
- Modify: `frontend/portal/admin/dashboard.html:190-220`
- Modify: `frontend/portal/admin/users.html:220-255`
- Modify: `frontend/shared/js/api.js:1050-1070`

**Interfaces:**
- Consumes: `apiCall('dashboard', 'index')` returning `ppdb_pending`, `ppdb_total`, `total_students`, `total_teachers`, `total_classes`.
- Produces: KPI card showing "Calon Siswa" / "Pendaftar PPDB" with count of pending applicants needing verification, linking to `ppdb.html`.

- [ ] **Step 1: Inspect dashboard.html KPI card and Quick Action labels**

Check lines 60-75 and 130-140 in `frontend/portal/admin/dashboard.html`.

- [ ] **Step 2: Replace 4th KPI card "Orang Tua" with "Pendaftar PPDB"**

In `frontend/portal/admin/dashboard.html`, replace lines 63-73 with:
```html
      <div class="bg-white border border-gray-200 rounded-lg p-5 min-w-0">
        <div class="flex items-center justify-between mb-3 gap-2">
          <div class="text-sm text-gray-600 truncate">Pendaftar PPDB</div>
          <div class="w-8 h-8 bg-amber-100 rounded-md flex items-center justify-center shrink-0">
            <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
          </div>
        </div>
        <div class="text-2xl font-bold text-gray-900 truncate" id="stat-ppdb-pending"><div class="skeleton h-7 w-12 rounded"></div></div>
        <div class="text-xs text-amber-700 font-medium mt-1 truncate"><span id="stat-ppdb-sub">0</span> perlu verifikasi</div>
      </div>
```

- [ ] **Step 3: Update Quick Action copy in dashboard.html**

In `frontend/portal/admin/dashboard.html` around line 133, update the subtitle of "Verifikasi Bayar" from "Konfirmasi pembayaran ortu" to "Konfirmasi pembayaran siswa".

- [ ] **Step 4: Update dashboard JS in dashboard.html**

Update `showSkeleton()` and `loadDashboard()`:
```javascript
function showSkeleton() {
  const ids = ['stat-students', 'stat-classes', 'stat-teachers', 'stat-ppdb-pending',
               'stat-students-active', 'stat-teachers-active', 'stat-ppdb-sub'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) Shell.skeleton(el);
  });
}
```
In `loadDashboard()`:
```javascript
Shell.setText('stat-ppdb-pending', d.ppdb_pending != null ? d.ppdb_pending : 0);
Shell.setText('stat-ppdb-sub', d.ppdb_pending != null ? d.ppdb_pending : 0);
```

- [ ] **Step 5: Clean up role mapping in users.html**

In `frontend/portal/admin/users.html`, remove `'orang_tua': { code: 'siswa_aktif', name: 'Orang Tua / Wali' }` from `ROLE_MAP` (line 235), keeping only valid system roles:
- `super_admin`: Super Admin
- `admin` / `admin_tu`: Admin TU
- `siswa_aktif` / `siswa`: Siswa Aktif
- `calon_siswa` / `pendaftar`: Calon Siswa PPDB
- `guru`: Tenaga Pendidik

- [ ] **Step 6: Update dashboard stats in api.js**

In `frontend/shared/js/api.js` line 1056: replace `total_parents: activeStudents` with clean metrics:
```javascript
ppdb_pending: pendingPPDB,
ppdb_accepted: acceptedPPDB,
ppdb_total: (ppdb || []).length,
```

- [ ] **Step 7: Verify syntax with Node.js**

Run: `node -e "require('fs').readFileSync('frontend/portal/admin/dashboard.html')"` and `node --check frontend/shared/js/api.js`.
Expected: Exit code 0, no syntax errors.

---

### Task 2: Fix PPDB Deletion Bug & Eliminate LocalStorage Desync Trap

**Files:**
- Modify: `frontend/shared/js/api.js:2315-2325`
- Modify: `frontend/portal/admin/ppdb.html:585-600`

**Interfaces:**
- Consumes: `apiCall('ppdb', 'delete', { id })` where `id` is either primary key UUID or registration number (`REG-2026-xxxx`).
- Produces: Complete purge of the candidate record across both Supabase and local storage (`siy_local_ppdb_regs`, `siy_local_students`, `siy_local_users`), followed by table reload.

- [ ] **Step 1: Upgrade PPDB delete handler in api.js**

In `frontend/shared/js/api.js`, replace lines 2316-2320 with robust dual-key deletion and local storage cleanup:
```javascript
        if (action === 'delete') {
          const id = params.id;
          if (!id) return { success: false, message: 'ID pendaftar tidak ditentukan' };

          // 1. Hapus dari Supabase dengan mencocokkan ID dan registration_number
          try {
            await supabaseRest(`ppdb_registrations?or=(id.eq.${encodeURIComponent(id)},registration_number.eq.${encodeURIComponent(id)},registration_no.eq.${encodeURIComponent(id)})`, 'DELETE');
          } catch (delErr) {
            console.warn('Supabase PPDB delete error:', delErr);
          }

          // 2. Hapus secara sinkron dari localStorage siy_local_ppdb_regs
          try {
            const rawRegs = localStorage.getItem('siy_local_ppdb_regs');
            if (rawRegs) {
              const localRegs = JSON.parse(rawRegs);
              const filtered = localRegs.filter(r => r.id !== id && r.registration_number !== id && r.registration_no !== id);
              localStorage.setItem('siy_local_ppdb_regs', JSON.stringify(filtered));
            }
          } catch (_) {}

          // 3. Hapus juga dari local students dan local users jika akun dibuat saat PPDB
          try {
            const rawStudents = localStorage.getItem('siy_local_students');
            if (rawStudents) {
              const students = JSON.parse(rawStudents);
              const filteredStudents = students.filter(s => s.id !== id && s.registration_number !== id);
              localStorage.setItem('siy_local_students', JSON.stringify(filteredStudents));
            }
          } catch (_) {}

          try {
            const rawUsers = localStorage.getItem('siy_local_users');
            if (rawUsers) {
              const users = JSON.parse(rawUsers);
              const filteredUsers = users.filter(u => u.id !== id && u.username !== id);
              localStorage.setItem('siy_local_users', JSON.stringify(filteredUsers));
            }
          } catch (_) {}

          await recordActivityLog('DELETE_PPDB', 'ppdb', 'Menghapus berkas pendaftaran calon siswa ID: ' + id, id);
          return { success: true, message: 'Data pendaftar berhasil dihapus dari sistem' };
        }
```

- [ ] **Step 2: Update delete confirmation and state update in ppdb.html**

In `frontend/portal/admin/ppdb.html` lines 585-600:
Ensure `deleteReg(id)` passes `id` reliably and triggers `loadPpdb()` immediately:
```javascript
    async function deleteReg(id) {
      if (!confirm('Apakah Anda yakin ingin menghapus berkas pendaftaran ini dari sistem?')) return;
      try {
        const res = await apiCall('ppdb', 'delete', { id });
        if (res.success) {
          showToast(res.message || 'Berkas pendaftaran berhasil dihapus', 'success');
          await loadPpdb();
        } else {
          showToast(res.message || 'Gagal menghapus berkas', 'error');
        }
      } catch (err) {
        showToast('Gagal menghapus berkas pendaftaran', 'error');
      }
    }
```

- [ ] **Step 3: Syntax check**

Run: `node --check frontend/shared/js/api.js`.
Expected: Exit code 0, no errors.

---

### Task 3: Fix PPDB Filter, Tab Query Trap & Scrollbar Pill Artifact

**Files:**
- Modify: `frontend/shared/js/api.js:1910-1945`
- Modify: `frontend/portal/admin/ppdb.html:43-62`
- Modify: `frontend/portal/admin/ppdb.html:322-332`

**Interfaces:**
- Consumes: Status tab (`all`, `pending`, `approved`, `converted`, `rejected`), jenjang dropdown (`paud`, `tpq`), and search keyword.
- Produces: Correctly filtered list of pendaftar without resurrection of pending records when tab/filter has 0 matches; clean tab bar without gray scrollbar thumb.

- [ ] **Step 1: Disentangle 0-match query from network fallback in api.js**

In `frontend/shared/js/api.js`, replace lines 1931-1943 with:
```javascript
          let regs = null;
          let fetchError = false;
          try {
            regs = await supabaseRest(query);
          } catch (e) {
            console.warn('PPDB registrations fetch error:', e);
            fetchError = true;
          }

          // Fallback ke localStorage HANYA jika terjadi network/connection error (regs === null atau fetchError)
          // JANGAN fallback jika Supabase berhasil mengembalikan array kosong [] (filter tidak cocok / 0 hasil)
          if (fetchError || regs === null) {
            try {
              let localRegs = JSON.parse(localStorage.getItem('siy_local_ppdb_regs') || '[]');
              
              // Terapkan filter pada localRegs agar hasil filter konsisten
              if (params.status && params.status !== 'all') {
                if (params.status === 'approved') {
                  localRegs = localRegs.filter(r => r.status === 'approved' || r.status === 'accepted');
                } else {
                  localRegs = localRegs.filter(r => (r.status || 'pending').toLowerCase() === params.status.toLowerCase());
                }
              }
              if (params.form_type) {
                const ft = params.form_type.toLowerCase();
                localRegs = localRegs.filter(r => {
                  const rFt = (r.form_type || '').toLowerCase();
                  const rLvl = (r.level || '').toLowerCase();
                  if (ft === 'paud') return rFt === 'paud' || rFt === 'tk' || rLvl.includes('paud') || rLvl.includes('tk');
                  if (ft === 'tpq') return rFt === 'tpq' || rLvl.includes('tpq');
                  return rFt === ft;
                });
              }
              if (params.search || params.q) {
                const q = String(params.search || params.q).toLowerCase();
                localRegs = localRegs.filter(r => 
                  (r.student_name && r.student_name.toLowerCase().includes(q)) ||
                  (r.full_name && r.full_name.toLowerCase().includes(q)) ||
                  (r.child_name && r.child_name.toLowerCase().includes(q)) ||
                  (r.registration_number && r.registration_number.toLowerCase().includes(q)) ||
                  (r.parent_name && r.parent_name.toLowerCase().includes(q))
                );
              }
              regs = localRegs;
            } catch (_) {
              regs = [];
            }
          }
          return { success: true, data: Array.isArray(regs) ? regs : [] };
```

- [ ] **Step 2: Eliminate scrollbar pill and enhance filter controls in ppdb.html**

In `frontend/portal/admin/ppdb.html`:
1. Line 44: Change `<div class="border-b border-gray-200 mb-4 overflow-x-auto">` to:
   `<div class="border-b border-gray-200 mb-4 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">`
2. Lines 56-61: Add instant reactive listeners on search and select, plus a "Reset Filter" link:
```html
    <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <input id="filter-search" type="text" onkeyup="if(event.key==='Enter') loadPpdb()" placeholder="Cari nama atau no. pendaftaran..." class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
        <select id="filter-type" onchange="loadPpdb()" class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
          <option value="">Semua Jenis (PAUD, TK, TPQ)</option>
          <option value="paud">PAUD / TK</option>
          <option value="tpq">TPQ</option>
        </select>
        <div class="flex items-center gap-2">
          <button onclick="loadPpdb()" class="flex-1 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition">Filter</button>
          <button onclick="resetPpdbFilter()" class="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition" title="Reset filter">Reset</button>
        </div>
      </div>
    </div>
```
3. Add `resetPpdbFilter()` function in `ppdb.html`:
```javascript
function resetPpdbFilter() {
  document.getElementById('filter-search').value = '';
  document.getElementById('filter-type').value = '';
  currentTab = 'all';
  document.querySelectorAll('.ppdb-tab').forEach(b => {
    b.classList.remove('border-primary-600', 'text-primary-700');
    b.classList.add('border-transparent', 'text-gray-600');
  });
  const allBtn = document.querySelector('[data-tab="all"]');
  if (allBtn) {
    allBtn.classList.remove('border-transparent', 'text-gray-600');
    allBtn.classList.add('border-primary-600', 'text-primary-700');
  }
  loadPpdb();
}
```

- [ ] **Step 3: Syntax check**

Run: `node --check frontend/shared/js/api.js`.
Expected: Exit code 0, no errors.

---

### Task 4: Polish Payments (Eliminate Double Plus Icon, Remove Tab Scrollbar Pill, & Upgrade 1-Click WA Arrears Notification)

**Files:**
- Modify: `frontend/portal/admin/payments.html:68-79`
- Modify: `frontend/portal/admin/payments.html:90-95`
- Modify: `frontend/portal/admin/payments.html:770-790`

**Interfaces:**
- Consumes: `sendWaInvoice(invId)` with invoice data (`student_name`, `amount`, `description`, `parent_phone`).
- Produces: Clean UI without double `+`, clean tab bar without scrollbar thumb, and polite official Islamic WhatsApp template opening `https://wa.me/` with international phone formatting.

- [ ] **Step 1: Remove double plus icon on button in payments.html**

In `frontend/portal/admin/payments.html` lines 90-94, change:
```html
        <button onclick="openSingleInvoiceModal()" class="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-xl shadow-sm transition inline-flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          <span>+ Buat Tagihan Individu</span>
        </button>
```
To:
```html
        <button onclick="openSingleInvoiceModal()" class="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-xl shadow-sm transition inline-flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          <span>Buat Tagihan Individu</span>
        </button>
```

- [ ] **Step 2: Eliminate scrollbar pill artifact on payments tabs**

In `frontend/portal/admin/payments.html` line 69, change:
```html
      <div class="border-b border-gray-200 overflow-x-auto">
```
To:
```html
      <div class="border-b border-gray-200 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
```

- [ ] **Step 3: Upgrade 1-Click WhatsApp arrears notification in payments.html**

In `frontend/portal/admin/payments.html`, replace `sendWaInvoice(invId)` (lines 770-785) with:
```javascript
    function sendWaInvoice(invId) {
      const inv = invoicesCache.find(x => x.id === invId);
      if (!inv) {
        showToast('Data tagihan tidak ditemukan', 'warning');
        return;
      }
      const s = studentsCache.find(x => x.id === inv.student_id) || {};
      let parentPhone = inv.parent_phone || inv.parent_whatsapp || s.father_phone || s.mother_phone || s.parent_phone || s.phone || s.emergency_phone || '';
      
      let cleanPhone = String(parentPhone || '').replace(/\D/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.slice(1);
      }

      if (!cleanPhone || cleanPhone.length < 8) {
        const inputNum = prompt(`Nomor WhatsApp orang tua/wali dari ananda ${inv.student_name || 'siswa'} belum terdaftar.\nSilakan masukkan nomor WhatsApp tujuan (contoh: 08123456789):`);
        if (!inputNum) return;
        cleanPhone = String(inputNum).replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
        if (!cleanPhone || cleanPhone.length < 8) {
          showToast('Nomor WhatsApp tidak valid', 'warning');
          return;
        }
      }

      const studentName = inv.student_name || s.full_name || '-';
      const nis = s.nis || '-';
      const className = s.class_name || s.kelas_sekarang || 'PAUD / TK / TPQ';
      const month = inv.description || inv.month || inv.period || 'Iuran SPP';
      const amount = formatIDR(inv.amount || 150000);
      const dueDate = inv.due_date ? formatDate(inv.due_date) : 'Tanggal 10 bulan berjalan';

      const msg = `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\n` +
        `Yth. Bapak/Ibu Orang Tua / Wali dari ananda:\n` +
        `• Nama Siswa: *${studentName}*\n` +
        `• NIS: *${nis}*\n` +
        `• Jenjang/Kelas: *${className}*\n\n` +
        `Kami dari Bagian Administrasi & Keuangan *Yayasan At Tarbiyyah Wijaya Kusuma Samarinda* menyampaikan informasi kewajiban iuran pendidikan sebagai berikut:\n` +
        `• Rincian Tagihan: *${month}*\n` +
        `• Jumlah: *${amount}*\n` +
        `• Batas Waktu: *${dueDate}*\n\n` +
        `Pembayaran dapat disalurkan melalui rekening resmi yayasan:\n` +
        `🏦 *Bank Syariah Indonesia (BSI)*: *7123456789*\n` +
        `🏦 *Bank Kaltimtara*: *0012345678*\n` +
        `a.n. *Yayasan At Tarbiyyah Wijaya Kusuma*\n\n` +
        `Atau pembayaran tunai langsung di kantor Tata Usaha sekolah.\n` +
        `Setelah melakukan transfer, bukti pembayaran dapat diunggah melalui Portal Siswa (SIAKAD) atau dikirimkan kembali melalui pesan WhatsApp ini.\n\n` +
        `Jazakumullah Khairan Katsiran atas perhatian dan kerjasamanya.\n` +
        `Wassalamu'alaikum Warahmatullahi Wabarakatuh.`;

      const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank');
    }
```

- [ ] **Step 4: Syntax check**

Run: `node -e "require('fs').readFileSync('frontend/portal/admin/payments.html')"`
Expected: Exit code 0, no errors.

---

### Task 5: End-to-End System Audit, Cross-Portal Verification & Deployment

**Files:**
- Audit & Verify: `frontend/portal/admin/dashboard.html`
- Audit & Verify: `frontend/portal/admin/ppdb.html`
- Audit & Verify: `frontend/portal/admin/payments.html`
- Audit & Verify: `frontend/portal/admin/users.html`
- Audit & Verify: `frontend/portal/siswa/dashboard.html`
- Audit & Verify: `frontend/portal/siswa/spp.html`
- Audit & Verify: `frontend/shared/js/api.js`

**Interfaces:**
- Consumes: All modified files and git status.
- Produces: Clean git commit and push to `origin/main` for automatic Vercel production deployment.

- [ ] **Step 1: Check git status for modified files**

Run: `git status --short`
Verify that only targeted files are modified.

- [ ] **Step 2: Validate JavaScript syntax across all shared and portal scripts**

Run: `node --check frontend/shared/js/api.js`
Run: `node --check frontend/shared/js/auth.js`
Run: `node --check frontend/shared/js/shell.js`
Expected: All files pass syntax validation without errors.

- [ ] **Step 3: Test build/bundle verification**

Verify local server integrity and check if there are any broken asset links or script references.

- [ ] **Step 4: Commit and push changes to GitHub repository**

Run:
```bash
git add frontend/portal/admin/dashboard.html frontend/portal/admin/ppdb.html frontend/portal/admin/payments.html frontend/portal/admin/users.html frontend/shared/js/api.js docs/superpowers/plans/2026-10-23-portal-streamlining-and-admin-fixes.md
git commit -m "fix(portal): decommission legacy parent role, fix ppdb delete/filter sync trap, polish payments ui & wa arrears"
git push origin main
```

- [ ] **Step 5: Verify live production deployment on Vercel**

Probe `https://siyayasan.vercel.app` to confirm HTTP 200 and successful deployment.

