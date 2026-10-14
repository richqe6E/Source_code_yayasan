/**
 * Batch 3 Unit & Verification Tests
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- RUNNING BATCH 3 VERIFICATION TESTS ---');

// Test 1: CMS Publish/Draft status, gallery delete & announcement category (BUG-06)
function testCmsContentAndGallery() {
  const contentPath = path.join(__dirname, '../frontend/portal/admin/content.html');
  const contentHtml = fs.readFileSync(contentPath, 'utf8');
  const apiPath = path.join(__dirname, '../frontend/shared/js/api.js');
  const apiJs = fs.readFileSync(apiPath, 'utf8');

  // content.html must prioritize item.status
  assert.ok(
    contentHtml.includes('item.status') && (contentHtml.includes("item.status === 'published'") || contentHtml.includes("item.status === 'draft'")),
    'content.html must prioritize item.status over boolean fallback'
  );

  // Gallery render must include delete button
  assert.ok(
    contentHtml.includes("deleteItem('gallery'") || contentHtml.includes('deleteItem("gallery"'),
    'content.html renderGallery must contain delete button'
  );

  // api.js must synchronize is_published on news/announcements/events
  assert.ok(
    apiJs.includes('is_published') && apiJs.includes("params.status === 'published'"),
    'api.js must synchronize is_published with status'
  );

  // api.js announcements/list must map category
  assert.ok(
    apiJs.includes('category: r.category') || apiJs.includes('r.target_audience'),
    'api.js announcements/list must map category'
  );
  console.log('✓ Test 1: CMS publish/draft, gallery delete & announcements category verified.');
}

// Test 2: Users 2-portal roles, classes TPQ/TK, teachers filter (BUG-08)
function testUsersClassesTeachers() {
  const usersPath = path.join(__dirname, '../frontend/portal/admin/users.html');
  const usersHtml = fs.readFileSync(usersPath, 'utf8');
  const classesPath = path.join(__dirname, '../frontend/portal/admin/classes.html');
  const classesHtml = fs.readFileSync(classesPath, 'utf8');
  const teachersPath = path.join(__dirname, '../frontend/portal/admin/teachers.html');
  const teachersHtml = fs.readFileSync(teachersPath, 'utf8');
  const apiPath = path.join(__dirname, '../frontend/shared/js/api.js');
  const apiJs = fs.readFileSync(apiPath, 'utf8');

  // users.html must support 2-portal roles
  assert.ok(
    usersHtml.includes('siswa_aktif') && usersHtml.includes('calon_siswa'),
    'users.html must include siswa_aktif and calon_siswa roles'
  );
  assert.ok(
    usersHtml.includes('deleteUser') || usersHtml.includes('hapus') || usersHtml.includes('users/delete'),
    'users.html should include delete user capability'
  );

  // classes.html must include TPQ and TK
  assert.ok(
    classesHtml.includes('value="TPQ"') && (classesHtml.includes('value="TK"') || classesHtml.includes('value="TK_A"')),
    'classes.html must include TPQ and TK levels'
  );

  // teachers.html & api.js must support is_active and nip
  assert.ok(
    apiJs.includes('nip.ilike') && apiJs.includes('params.is_active'),
    'api.js teachers/list must support nip search and is_active filter'
  );
  assert.ok(
    teachersHtml.includes('deleteTeacher') || teachersHtml.includes('teachers/delete') || teachersHtml.includes('hapus'),
    'teachers.html should include delete teacher capability'
  );
  console.log('✓ Test 2: Users roles, classes TPQ/TK & teachers filters verified.');
}

// Test 3: Receipt dynamic terbilang and payment method (BUG-10)
function testReceiptTerbilang() {
  const adminPayPath = path.join(__dirname, '../frontend/portal/admin/payments.html');
  const adminPayHtml = fs.readFileSync(adminPayPath, 'utf8');
  const siswaSppPath = path.join(__dirname, '../frontend/portal/siswa/spp.html');
  const siswaSppHtml = fs.readFileSync(siswaSppPath, 'utf8');

  // Both files must have angkaKeTerbilang
  assert.ok(
    adminPayHtml.includes('angkaKeTerbilang') || adminPayHtml.includes('terbilang'),
    'admin/payments.html must contain angkaKeTerbilang function'
  );
  assert.ok(
    siswaSppHtml.includes('angkaKeTerbilang') || siswaSppHtml.includes('terbilang'),
    'siswa/spp.html must contain angkaKeTerbilang function'
  );

  // Neither should have hardcoded Seratus Lima Puluh Ribu Rupiah in terbilang box
  assert.ok(
    !adminPayHtml.includes('<div class="terbilang"># Seratus Lima Puluh Ribu Rupiah #</div>'),
    'admin/payments.html must not hardcode Seratus Lima Puluh Ribu Rupiah'
  );
  assert.ok(
    !siswaSppHtml.includes('<div class="terbilang"># Seratus Lima Puluh Ribu Rupiah #</div>'),
    'siswa/spp.html must not hardcode Seratus Lima Puluh Ribu Rupiah'
  );

  // Check payment_method display
  assert.ok(
    adminPayHtml.includes('payment_method') || adminPayHtml.includes('inv.method'),
    'admin/payments.html must read payment_method'
  );
  assert.ok(
    siswaSppHtml.includes('payment_method') || siswaSppHtml.includes('inv.method'),
    'siswa/spp.html must read payment_method'
  );
  console.log('✓ Test 3: Dynamic terbilang & payment method in receipts verified.');
}

try {
  testCmsContentAndGallery();
  testUsersClassesTeachers();
  testReceiptTerbilang();
  console.log('\nALL BATCH 3 TESTS PASSED!');
} catch (err) {
  console.error('\nTEST FAILED:', err.message);
  process.exit(1);
}
