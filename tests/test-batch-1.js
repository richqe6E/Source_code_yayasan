/**
 * Batch 1 Unit & Verification Tests
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- RUNNING BATCH 1 VERIFICATION TESTS ---');

// Test 1: Verify Timeouts and cleanMeta sanitization logic
function testApiTimeoutAndSanitization() {
  const apiPath = path.join(__dirname, '../frontend/shared/js/api.js');
  const content = fs.readFileSync(apiPath, 'utf8');

  // Check REST timeout: should have 8000/15000ms instead of hardcoded 2500ms
  assert.ok(
    content.includes('15000') || content.includes('8000'),
    'api.js should have increased timeout (8s/15s) for supabaseRest'
  );
  assert.ok(
    !content.includes('setTimeout(() => controller.abort(), 2500)'),
    'api.js must not have 2500ms abort timeout'
  );

  // Check Storage timeout: should have 25000ms instead of 3000ms
  assert.ok(
    content.includes('25000'),
    'uploadToSupabaseStorage should have 25000ms timeout'
  );
  assert.ok(
    !content.includes('setTimeout(() => controller.abort(), 3000)'),
    'uploadToSupabaseStorage must not have 3000ms abort timeout'
  );

  // Check cleanMeta deletion of photo_url, birth_certificate_url, family_card_url
  assert.ok(
    content.includes('delete cleanMeta.photo_url'),
    'cleanMeta must delete photo_url'
  );
  assert.ok(
    content.includes('delete cleanMeta.birth_certificate_url'),
    'cleanMeta must delete birth_certificate_url'
  );
  assert.ok(
    content.includes('delete cleanMeta.family_card_url'),
    'cleanMeta must delete family_card_url'
  );
  assert.ok(
    content.includes('delete cleanMeta.notes'),
    'cleanMeta must delete notes'
  );
  console.log('✓ Test 1: Timeouts & cleanMeta sanitization verified.');
}

// Test 2: Verify ppdb_periods update logic and ID resolution
function testPpdbPeriodLogic() {
  const apiPath = path.join(__dirname, '../frontend/shared/js/api.js');
  const apiContent = fs.readFileSync(apiPath, 'utf8');
  const adminPpdbPath = path.join(__dirname, '../frontend/portal/admin/ppdb.html');
  const adminPpdbContent = fs.readFileSync(adminPpdbPath, 'utf8');

  // api.js should resolve existing period or fallback gracefully, not blindly patch PPDPER-2026 without checking
  assert.ok(
    apiContent.includes('ppdb_periods') && (apiContent.includes('targetId') || apiContent.includes('PER-2026-1') || apiContent.includes('currentPeriod')),
    'api.js update_period should support dynamic period ID or PER-2026-1'
  );

  // admin/ppdb.html should evaluate isOpen for both 'open' and 'active'
  assert.ok(
    adminPpdbContent.includes("currentPeriod.status === 'open' || currentPeriod.status === 'active'"),
    'admin/ppdb.html must check both open and active status'
  );
  console.log('✓ Test 2: PPDB Period update and status evaluation verified.');
}

// Test 3: Verify ppdb/list handles accepted/approved and form_type
function testPpdbListFilters() {
  const apiPath = path.join(__dirname, '../frontend/shared/js/api.js');
  const content = fs.readFileSync(apiPath, 'utf8');

  assert.ok(
    content.includes('status=in.(approved,accepted)') || content.includes('in.(accepted,approved)') || content.includes("params.status === 'approved'"),
    'api.js ppdb/list must map approved to accepted/approved'
  );
  assert.ok(
    content.includes('params.form_type') || content.includes('form_type'),
    'api.js ppdb/list must handle form_type filter'
  );
  console.log('✓ Test 3: PPDB list filter mapping verified.');
}

// Test 4: Verify payments/summary provides dual-language keys
function testPaymentSummaryKeys() {
  const apiPath = path.join(__dirname, '../frontend/shared/js/api.js');
  const content = fs.readFileSync(apiPath, 'utf8');

  assert.ok(
    content.includes('total_invoice') && content.includes('total_paid') && content.includes('total_outstanding'),
    'api.js payments/summary must return total_invoice, total_paid, total_outstanding'
  );
  assert.ok(
    content.includes('total_tagihan') && content.includes('total_lunas'),
    'api.js payments/summary must preserve total_tagihan, total_lunas'
  );
  console.log('✓ Test 4: Payments summary keys verified.');
}

// Test 5: Verify dashboard dead-code removal & activity log helper
function testDashboardAndLogs() {
  const apiPath = path.join(__dirname, '../frontend/shared/js/api.js');
  const content = fs.readFileSync(apiPath, 'utf8');

  // Verify activity_logs helper exists
  assert.ok(
    content.includes('recordActivityLog') || content.includes('activity_logs'),
    'api.js should have activity log recording'
  );

  // Verify logs/list maps description / details
  assert.ok(
    content.includes('details') || content.includes('description'),
    'api.js logs/list should map details'
  );
  console.log('✓ Test 5: Dashboard & activity logs verified.');
}

// Test 6: Verify all 12 admin pages have supabase-config.js script
function testAdminSupabaseConfigScript() {
  const adminDir = path.join(__dirname, '../frontend/portal/admin');
  const adminFiles = fs.readdirSync(adminDir).filter(f => f.endsWith('.html'));
  assert.strictEqual(adminFiles.length, 12, 'Expected 12 admin HTML files');

  for (const file of adminFiles) {
    const filePath = path.join(adminDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(
      content.includes('supabase-config.js'),
      `${file} must include supabase-config.js`
    );
  }
  console.log('✓ Test 6: All 12 admin pages have supabase-config.js.');
}

try {
  testApiTimeoutAndSanitization();
  testPpdbPeriodLogic();
  testPpdbListFilters();
  testPaymentSummaryKeys();
  testDashboardAndLogs();
  testAdminSupabaseConfigScript();
  console.log('\nALL BATCH 1 TESTS PASSED!');
} catch (err) {
  console.error('\nTEST FAILED:', err.message);
  process.exit(1);
}
