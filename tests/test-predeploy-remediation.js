/**
 * TEST SUITE: PRE-DEPLOYMENT COMPREHENSIVE REMEDIATION
 * Menguji seluruh 11 temuan audit baris-demi-baris sebelum deploy ke Vercel
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST SUITE: PRE-DEPLOYMENT COMPREHENSIVE REMEDIATION ===\n');

const apiJs = fs.readFileSync(path.join(__dirname, '../frontend/shared/js/api.js'), 'utf8');
const siswaDash = fs.readFileSync(path.join(__dirname, '../frontend/portal/siswa/dashboard.html'), 'utf8');
const siswaDok = fs.readFileSync(path.join(__dirname, '../frontend/portal/siswa/dokumen.html'), 'utf8');
const adminStudents = fs.readFileSync(path.join(__dirname, '../frontend/portal/admin/students.html'), 'utf8');
const adminPpdb = fs.readFileSync(path.join(__dirname, '../frontend/portal/admin/ppdb.html'), 'utf8');
const adminContent = fs.readFileSync(path.join(__dirname, '../frontend/portal/admin/content.html'), 'utf8');
const adminPayments = fs.readFileSync(path.join(__dirname, '../frontend/portal/admin/payments.html'), 'utf8');
const adminReports = fs.readFileSync(path.join(__dirname, '../frontend/portal/admin/reports.html'), 'utf8');
const publicShell = fs.readFileSync(path.join(__dirname, '../frontend/public/js/public-shell.js'), 'utf8');
const publicIndex = fs.readFileSync(path.join(__dirname, '../frontend/public/index.html'), 'utf8');
const publicProfil = fs.readFileSync(path.join(__dirname, '../frontend/public/profil.html'), 'utf8');
const publicAgenda = fs.readFileSync(path.join(__dirname, '../frontend/public/agenda.html'), 'utf8');
const publicLogin = fs.readFileSync(path.join(__dirname, '../frontend/public/login.html'), 'utf8');
const publicPpdb = fs.readFileSync(path.join(__dirname, '../frontend/public/ppdb.html'), 'utf8');

// 1. Check loginUrl declaration in api.js ppdb/convert
console.log('Test 1: Checking loginUrl declaration in api.js ppdb/convert...');
assert(
  /const\s+loginUrl\s*=\s*\(origin\s*\|\|\s*'https:\/\/siyayasan-portal\.vercel\.app'\)\s*\+\s*'\/login\.html'/.test(apiJs) ||
  /const\s+loginUrl\s*=\s*origin\s*\?\s*`\$\{origin\}\/login\.html`/.test(apiJs),
  'FAILED: loginUrl is not declared before use in api.js ppdb/convert'
);
console.log('✅ Test 1 Passed');

// 2. Check else branch in siswa/dashboard.html
console.log('Test 2: Checking if/else branch in portal/siswa/dashboard.html...');
assert(
  /await\s+loadSiswaAktifData\(student,\s*user\);\s*\}\s*else\s*\{/.test(siswaDash),
  'FAILED: Missing "} else {" after await loadSiswaAktifData(student, user) in siswa/dashboard.html'
);
console.log('✅ Test 2 Passed');

// 3. Check escapeAttr defined in portal/admin/students.html
console.log('Test 3: Checking escapeAttr helper in portal/admin/students.html...');
assert(
  /function\s+escapeAttr\s*\(/.test(adminStudents),
  'FAILED: function escapeAttr is not defined in portal/admin/students.html'
);
console.log('✅ Test 3 Passed');

// 4. Check public-shell.js base logo fallback & operational_hours preservation
console.log('Test 4: Checking public-shell.js logo fallback & operational_hours in sessionStorage...');
assert(
  !publicShell.includes('this.src = `${base}images/logo.png`') || /function\s+applySchoolData\(school,\s*base/.test(publicShell) || publicShell.includes("this.src = '/images/logo.png'"),
  'FAILED: public-shell.js applySchoolData still references undefined base variable'
);
assert(
  /operational_hours:\s*s\.operational_hours/.test(publicShell) && /tagline:\s*s\.tagline/.test(publicShell),
  'FAILED: public-shell.js strips operational_hours or tagline when building school object from web_settings'
);
assert(
  publicShell.includes('ppdb.html#jadwal-linimasa'),
  'FAILED: public-shell.js footer link still points to #jadwal instead of #jadwal-linimasa'
);
console.log('✅ Test 4 Passed');

// 5. Check cross-device persistence in api.js (web_settings & schools)
console.log('Test 5: Checking cross-device persistence packing in api.js...');
assert(
  apiJs.includes('announcement_banner') && apiJs.includes('wa_gateway_token'),
  'FAILED: api.js does not pack/unpack extended profile & operational_hours into guaranteed Supabase columns'
);
console.log('✅ Test 5 Passed');

// 6. Check dynamic hydration of program_pendidikan & kurikulum on index.html and profil.html
console.log('Test 6: Checking program_pendidikan & kurikulum hydration on index.html and profil.html...');
assert(
  publicIndex.includes('program_pendidikan') && publicProfil.includes('program_pendidikan') && publicProfil.includes('kurikulum'),
  'FAILED: index.html or profil.html does not hydrate program_pendidikan / kurikulum'
);
console.log('✅ Test 6 Passed');

// 7. Check draft filtering in api.js & upcoming status in admin/content.html & dynamic time in agenda.html
console.log('Test 7: Checking draft filtering, upcoming event status, and dynamic agenda time...');
assert(
  apiJs.includes('params.exclude_id'),
  'FAILED: api.js news/list does not support params.exclude_id'
);
assert(
  adminContent.includes("item.status === 'upcoming'"),
  'FAILED: admin/content.html does not recognize status === "upcoming" as published'
);
assert(
  publicAgenda.includes('ev.time'),
  'FAILED: public/agenda.html still hardcodes event time instead of using ev.time'
);
console.log('✅ Test 7 Passed');

// 8. Check auth/update_profile handler in api.js
console.log('Test 8: Checking auth/update_profile handler in api.js...');
assert(
  /if\s*\(\s*action\s*===\s*'update_profile'\s*\)/.test(apiJs),
  'FAILED: api.js is missing action === "update_profile" inside module === "auth"'
);
console.log('✅ Test 8 Passed');

// 9. Check document type labels in siswa/dokumen.html & studentId resolution in api.js
console.log('Test 9: Checking document type normalization & studentId resolution...');
assert(
  siswaDok.includes('pas_foto:') && siswaDok.includes('kartu_keluarga:') && siswaDok.includes('akta_kelahiran:'),
  'FAILED: siswa/dokumen.html typeLabels is missing pas_foto, kartu_keluarga, akta_kelahiran'
);
assert(
  !apiJs.includes('const studentId = params.student_id || (currentUser ? (currentUser.student_id || currentUser.id) : null);'),
  'FAILED: api.js line 600 still falls back to currentUser.id (USR-...) as studentId'
);
console.log('✅ Test 9 Passed');

// 10. Check Admin CRUD fixes (activity_logs schema, ppdb/update, invoices/mark_paid, reports, backup)
console.log('Test 10: Checking Admin CRUD fixes in api.js, payments.html, reports.html...');
assert(
  !apiJs.includes('entity_type: entityType') && apiJs.includes('module: entityType'),
  'FAILED: recordActivityLog in api.js still sends non-existent entity_type instead of module'
);
assert(
  !apiJs.includes('|| (stuList && stuList[0])'),
  'FAILED: api.js import_invoices still falls back to stuList[0] when student NIS does not match'
);
assert(
  adminReports.includes('window.exportCurrentReportToExcel = exportCurrentReportToExcel'),
  'FAILED: admin/reports.html does not attach exportCurrentReportToExcel to window'
);
console.log('✅ Test 10 Passed');

// 11. Check UI & Polish fixes in login.html & ppdb.html
console.log('Test 11: Checking login.html help button & ppdb.html step badge...');
assert(
  !publicLogin.includes('id="help-wa-link" href="https://wa.me/6281347142829?text=Assalamu%27alaikum%2C%20saya%20memerlukan%20bantuan%20login%20SIAKAD%20Yayasan%20At%20Tarbiyyah%20Wijaya%20Kusuma" target="_blank" class="w-full py-2.5 px-4 bg-primary-600'),
  'FAILED: login.html #help-wa-link still uses undefined bg-primary-600'
);
assert(
  publicPpdb.includes('current-step-badge') && /Tahap\s+\$\{targetStep\}\s+dari\s+5/.test(publicPpdb),
  'FAILED: ppdb.html updateStepperUI does not update #current-step-badge'
);
// 12. Check users/update role_id sanitization & supabaseRest schema-cache self-healing
console.log('Test 12: Checking users/update column whitelist & supabaseRest schema-cache self-healing...');
const adminUsers = fs.readFileSync(path.join(__dirname, '../frontend/portal/admin/users.html'), 'utf8');
assert(
  apiJs.includes("Could not find the '([^']+)' column") && apiJs.includes('Auto-stripping unrecognized column'),
  'FAILED: supabaseRest in api.js is missing automatic schema-cache column self-healing'
);
assert(
  apiJs.includes('const resolvedRole = params.role || roleIdToCodeMap[params.role_id];') &&
  !adminUsers.includes('role_id: ROLE_CODE_TO_ID[roleVal]'),
  'FAILED: users/update in api.js or users.html still passes raw role_id to Supabase'
);
console.log('✅ Test 12 Passed');

console.log('\n🎉 ALL PRE-DEPLOYMENT REMEDIATION TESTS PASSED 100%!');


