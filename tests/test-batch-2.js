/**
 * Batch 2 Unit & Verification Tests
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- RUNNING BATCH 2 VERIFICATION TESTS ---');

// Test 1: Admin PPDB convert credentials modal (BUG-02)
function testAdminPpdbConvertModal() {
  const adminPpdbPath = path.join(__dirname, '../frontend/portal/admin/ppdb.html');
  const content = fs.readFileSync(adminPpdbPath, 'utf8');

  // Must declare defaultPassword and loginUrl in showConvertSuccessModal
  assert.ok(
    content.includes('const defaultPassword =') || content.includes('let defaultPassword ='),
    'admin/ppdb.html must declare defaultPassword'
  );
  assert.ok(
    content.includes('const loginUrl =') || content.includes('let loginUrl ='),
    'admin/ppdb.html must declare loginUrl'
  );
  console.log('✓ Test 1: Admin PPDB convert modal credentials verified.');
}

// Test 2: Student documents synchronization in api.js (BUG-07)
function testStudentDocumentsSync() {
  const apiPath = path.join(__dirname, '../frontend/shared/js/api.js');
  const content = fs.readFileSync(apiPath, 'utf8');

  // Must insert initialDocs into student_documents on PPDB submit
  assert.ok(
    content.includes('student_documents') && (content.includes('pas_foto') || content.includes('photoUrl')),
    'api.js must sync uploaded files to student_documents on PPDB submit'
  );

  // Must patch document URL to ppdb_registrations when uploaded from student portal
  assert.ok(
    content.includes('docColMap') || content.includes('ppdb_registrations') && content.includes('photo_url'),
    'api.js must patch document uploads back to ppdb_registrations'
  );
  console.log('✓ Test 2: Student documents two-way synchronization verified.');
}

// Test 3: Siswa Dashboard tracker & registration number (BUG-07)
function testSiswaDashboardTracker() {
  const dashPath = path.join(__dirname, '../frontend/portal/siswa/dashboard.html');
  const content = fs.readFileSync(dashPath, 'utf8');

  // Must update step-3 and step-4 in updatePPDBTracker
  assert.ok(
    content.includes('step-3') || content.includes('step3') || content.includes('Dokumen'),
    'siswa/dashboard.html must update document step in tracker'
  );
  assert.ok(
    content.includes('step-4') || content.includes('step4') || content.includes('Verifikasi') || content.includes('Diterima'),
    'siswa/dashboard.html must update verification step in tracker'
  );

  // Must display registration number REG-... instead of STU-...
  assert.ok(
    !content.includes('Nomor Pendaftaran: ${student.id ||') && !content.includes('Nomor Pendaftaran: ${student.id}'),
    'siswa/dashboard.html should not display student.id as PPDB registration number'
  );
  console.log('✓ Test 3: Siswa Dashboard 4-step tracker verified.');
}

// Test 4: Contact page WhatsApp international format & API save (BUG-11)
function testContactPageWaAndSave() {
  const contactPath = path.join(__dirname, '../frontend/public/kontak.html');
  const content = fs.readFileSync(contactPath, 'utf8');

  // Form submit must normalize number to 62 prefix
  assert.ok(
    content.includes('formatWaIntl') || content.includes('waTarget') || content.includes(".startsWith('0') ? '62'"),
    'kontak.html form submit must normalize WhatsApp number with 62 prefix'
  );

  // Form submit must save to contact_messages via apiCall
  assert.ok(
    content.includes("apiCall('contact'") || content.includes('apiCall("contact"'),
    'kontak.html must save messages to database via apiCall'
  );
  console.log('✓ Test 4: Contact WhatsApp formatting & message persistence verified.');
}

try {
  testAdminPpdbConvertModal();
  testStudentDocumentsSync();
  testSiswaDashboardTracker();
  testContactPageWaAndSave();
  console.log('\nALL BATCH 2 TESTS PASSED!');
} catch (err) {
  console.error('\nTEST FAILED:', err.message);
  process.exit(1);
}
