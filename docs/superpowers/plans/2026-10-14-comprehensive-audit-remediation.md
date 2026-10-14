# Comprehensive Audit Remediation Plan (Plan B: Phased Layered Implementation)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all 12 confirmed audit vulnerabilities across SIYAYASAN V2 (network timeouts, PPDB data pipelines, conversion errors, CMS draft leaks, 2-portal roles, activity logs, receipt terbilang, and brand palette consistency).

**Architecture:** Layered remediation dividing work into 4 decoupled batches:
1. Core API & Network Bridge (`api.js`, Supabase query normalization, admin config injection).
2. PPDB Pipeline, Student Portal & Public Integrations (`ppdb.html`, student document synchronization, tracker steps, `kontak.html`).
3. Admin Operational Modules & CMS (`content.html`, `users.html`, `classes.html`, `teachers.html`, dynamic receipt terbilang).
4. Brand System Enforcement (Zero-Green to Oceanic Blue `#0284c7` / `#0ea5e9` across 14 portal templates).

**Tech Stack:** Vanilla JavaScript (ES6+), HTML5, PostgREST REST API, Supabase Storage, Tailwind CSS / Oceanic Blue Design System.

**Spec:** [laporan_audit_komprehensif_siyayasan_v2 (1).md](file:///d:/Source_code_yayasan/laporan_audit_komprehensif_siyayasan_v2%20%281%29.md)

---

## Global Constraints

- Never break existing offline fallbacks (`localStorage`) while fixing Supabase REST integrations.
- Zero-Green rule: No green, emerald, or teal utility classes in portal UI; use primary/sky palette (`#0284c7`/`#0ea5e9`).
- Two-Portal Auth Rule: Valid roles are `super_admin`, `admin`, `siswa_aktif`, `calon_siswa`.
- Preserve backward compatibility for response keys where both English and Indonesian keys might be read by legacy code.

---

## Review Focus

1. PPDB submission with large photo payloads must not timeout or dump Base64 into JSONB `form_metadata`.
2. Activating/converting a student from PPDB in Admin must succeed without `ReferenceError` and trigger credentials modal.
3. PPDB period updates must persist to Supabase `ppdb_periods` table and show accurate 'open'/'active' status.
4. Content CMS draft toggle must set `is_published: false` and hide unpublished items from public listings.
5. Receipt printing must generate correct Indonesian numbers-to-words (*terbilang*) dynamically rather than hardcoding Rp 150.000.

---

## Implementation Tasks

### Batch 1: Core Engine, API Bridge & Supabase Configuration

#### Task 1.1: Fix Network Timeouts & Payload Sanitization in `api.js` (BUG-01)
**Files:**
- Modify: `frontend/shared/js/api.js:88-100, 140-160, 1385-1435`
- Modify: `frontend/public/js/app.js:180-200`
- [ ] Increase `supabaseRest` timeout from 2500ms to 8000ms for GET and 15000ms for mutations.
- [ ] Increase `uploadToSupabaseStorage` timeout from 3000ms to 25000ms.
- [ ] Remove `photo_url`, `birth_certificate_url`, `family_card_url`, and `notes` from `cleanMeta` before saving to `form_metadata`.
- [ ] Save Storage URLs cleanly into `cleanMeta.uploaded_files`.

#### Task 1.2: Fix PPDB Period Updates & State Evaluation (BUG-03)
**Files:**
- Modify: `frontend/shared/js/api.js:1573-1595`
- Modify: `frontend/portal/admin/ppdb.html:240-260, 283-305`
- [ ] In `api.js` `update_period`, dynamically resolve active period ID or fallback to `'PER-2026-1'`.
- [ ] In `admin/ppdb.html`, evaluate `isOpen` for both `'open'` and `'active'`.
- [ ] In `admin/ppdb.html` form submit, include `id: currentPeriod?.id`.

#### Task 1.3: Fix PPDB Filter & List Mapping (BUG-04)
**Files:**
- Modify: `frontend/shared/js/api.js:1335-1355`
- [ ] In `api.js` `ppdb/list`, treat `'approved'` and `'accepted'` as matching both statuses (`status=in.(approved,accepted)`).
- [ ] Add query filtering for `form_type` and `level`.

#### Task 1.4: Fix Payment KPI Summary Keys (BUG-05)
**Files:**
- Modify: `frontend/shared/js/api.js:1312-1330`
- [ ] Return dual-language keys in `payments/summary` (`total_invoice`, `total_paid`, `total_outstanding`, `pending_verification` alongside Indonesian equivalents).

#### Task 1.5: Remove Dashboard Dead Code, Add Activity Logs, and Fix Backup Restore (BUG-09)
**Files:**
- Modify: `frontend/shared/js/api.js:640-686, 2017-2023, 2226-2346`
- Modify: `frontend/portal/admin/logs.html:75-120`
- [ ] Consolidate `ppdb_this_month` calculation into primary `dashboard` handler and remove duplicate dead code block.
- [ ] Add `recordActivityLog(action, entity, details, id)` helper and invoke it on key mutations.
- [ ] Map `module` (`entity_type`) and `description` (`details`) properly in `logs/list`.
- [ ] Update `backup/restore` to upsert records into Supabase relational tables.

#### Task 1.6: Inject `supabase-config.js` into All 12 Admin Portal Pages (BUG-11 pt. 3)
**Files:**
- Modify: 12 files in `frontend/portal/admin/*.html`
- [ ] Ensure `<script src="../../shared/js/supabase-config.js"></script>` is loaded before `api.js`.

---

### Batch 2: PPDB End-to-End, Student Portal & Public Integrations

#### Task 2.1: Fix PPDB Public Submission Payload (BUG-01 frontend)
**Files:**
- Modify: `frontend/public/ppdb.html:1415-1440`
- [ ] Ensure public PPDB submission properly dispatches clean metadata.

#### Task 2.2: Fix Student Activation / Convert in Admin PPDB (BUG-02)
**Files:**
- Modify: `frontend/portal/admin/ppdb.html:607-635`
- [ ] Define `defaultPassword` and `loginUrl` in `showConvertSuccessModal(data)`.
- [ ] Fix WhatsApp text template link and credentials copy.

#### Task 2.3: Student Documents Synchronization & Dashboard Tracker (BUG-07)
**Files:**
- Modify: `frontend/shared/js/api.js:1500-1535, 1700-1740`
- Modify: `frontend/portal/siswa/dashboard.html:380-492`
- [ ] When student registers via PPDB, populate complete student attributes (`address`, `nik`, etc.) and insert records into `student_documents`.
- [ ] When student uploads document in Portal Siswa, patch corresponding file URL to `ppdb_registrations`.
- [ ] In `siswa/dashboard.html`, display registration number `REG-...` instead of raw ID.
- [ ] Fully wire up 4-step PPDB Tracker in DOM (Step 1 to Step 4).

#### Task 2.4: Fix WhatsApp Contact Link & Store Messages (BUG-11 pt. 1 & 2)
**Files:**
- Modify: `frontend/public/kontak.html:325-395`
- Modify: `frontend/public/js/public-shell.js:340-410`
- [ ] Normalize WhatsApp number with international `62` prefix so `wa.me/628...` works without phone errors.
- [ ] Persist contact form message to Supabase via `apiCall('contact', 'create', ...)`.
- [ ] Render `tagline` in `public-shell.js` from `cms_settings`.

---

### Batch 3: Operational Admin Modules, CMS & Financial Integrity

#### Task 3.1: Synchronize CMS Publish/Draft, Add Edit & Delete Features (BUG-06)
**Files:**
- Modify: `frontend/shared/js/api.js:1780-1960`
- Modify: `frontend/portal/admin/content.html:175-245`
- Modify: `frontend/public/pengumuman.html:130-145`
- [ ] Synchronize `is_published` boolean with `status` across `news`, `announcements`, and `events`.
- [ ] Add delete button to Gallery cards and wire up edit actions for content tables.
- [ ] Map `category` fallback to `target_audience` in announcements.

#### Task 3.2: Modernize Roles in `users.html`, Add TPQ/TK to `classes.html`, Fix `teachers.html` (BUG-08)
**Files:**
- Modify: `frontend/portal/admin/users.html:30-40, 210-245`
- Modify: `frontend/portal/admin/classes.html:35-50`
- Modify: `frontend/portal/admin/teachers.html:25-35, 75-90`
- Modify: `frontend/shared/js/api.js:778-795`
- [ ] Update user role dropdowns to match 2-portal architecture (`super_admin`, `admin`, `siswa_aktif`, `calon_siswa`) and add delete user action.
- [ ] Add `TPQ` and `TK` to `classes.html` grade selector.
- [ ] Support `is_active` filter and NIP search in `teachers/list`, plus delete teacher option.

#### Task 3.3: Implement Dynamic Indonesian "Terbilang" for Receipts (BUG-10)
**Files:**
- Modify: `frontend/portal/siswa/spp.html:360-435`
- Modify: `frontend/portal/admin/payments.html:750-825`
- [ ] Add `angkaKeTerbilang(amount)` helper.
- [ ] Replace static text `# Seratus Lima Puluh Ribu Rupiah #` with dynamically calculated words.
- [ ] Display payment method from `inv.payment_method`.

---

### Batch 4: Brand Identity & Zero-Green Oceanic Blue Enforcement

#### Task 4.1: Eliminate Green Classes in Portal Admin & Siswa (BUG-12)
**Files:**
- Modify: 11 files in `frontend/portal/admin/*.html`
- Modify: 3 files in `frontend/portal/siswa/*.html`
- [ ] Convert all `emerald-*`, `green-*`, `teal-*` utility classes to `primary-*` or `sky-*`.
- [ ] Replace green hex values (`#059669`, `#10b981`, `#ecfdf5`) in receipts and charts with Oceanic Blue `#0284c7` / `#0ea5e9`.
- [ ] Verify visual harmony and run full automated checks.
