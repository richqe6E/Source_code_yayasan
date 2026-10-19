const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=== TEST SUITE BATCH 1: CRITICAL BUG FIXES & SECURITY ===\n');

// -------------------------------------------------------------
// Test 1: Syntax Validation on frontend/portal/admin/ppdb.html
// -------------------------------------------------------------
console.log('Test 1: Validating JavaScript syntax in admin/ppdb.html...');
const ppdbHtml = fs.readFileSync(path.join(__dirname, '../frontend/portal/admin/ppdb.html'), 'utf8');
const scriptMatches = ppdbHtml.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi);
assert(scriptMatches && scriptMatches.length > 0, 'Harus ada blok script inline di admin/ppdb.html');

let syntaxPassed = true;
let syntaxError = null;

scriptMatches.forEach((scriptTag, idx) => {
  const code = scriptTag.replace(/<\/?script[^>]*>/gi, '');
  try {
    // Validate script by creating a Script instance
    new vm.Script(code, { filename: `admin/ppdb.html#script-${idx + 1}` });
  } catch (err) {
    syntaxPassed = false;
    syntaxError = err;
  }
});

if (!syntaxPassed) {
  console.log('❌ admin/ppdb.html syntax error detected (expected before fix):', syntaxError.message);
} else {
  console.log('✅ admin/ppdb.html JavaScript syntax is clean & valid.');
}

// -------------------------------------------------------------
// Test 2: Validating student_documents query in api.js
// -------------------------------------------------------------
console.log('\nTest 2: Checking student_documents query in api.js...');
const apiJs = fs.readFileSync(path.join(__dirname, '../frontend/shared/js/api.js'), 'utf8');

const hasStudentNisQuery = apiJs.includes('student_nis.eq');
if (hasStudentNisQuery) {
  console.log('❌ api.js masih memuat kueri fiktif student_nis.eq yang menyebabkan HTTP 400 Bad Request');
} else {
  console.log('✅ api.js bersih dari kolom fiktif student_nis.eq');
}

// -------------------------------------------------------------
// Test 3: Checking Login Role Guard & Help Modal in login.html
// -------------------------------------------------------------
console.log('\nTest 3: Checking Role Isolation & Contextual Help in login.html...');
const loginHtml = fs.readFileSync(path.join(__dirname, '../frontend/public/login.html'), 'utf8');

const hasRoleGuard = loginHtml.includes('currentLoginMode') && 
  (loginHtml.includes('Akun ini terdaftar sebagai') || loginHtml.includes('Silakan gunakan tab'));
const hasDynamicHelpModal = loginHtml.includes('openHelpModal') && 
  (loginHtml.includes('help-title') || loginHtml.includes('Panduan Akses Portal Administrator'));

console.log('Role Guard in login.html:', hasRoleGuard ? '✅ Terpasang' : '❌ Belum terpasang');
console.log('Dynamic Help Modal in login.html:', hasDynamicHelpModal ? '✅ Terpasang' : '❌ Belum terpasang');

// Summary check for batch 1 completeness
const batch1Ready = syntaxPassed && !hasStudentNisQuery && hasRoleGuard && hasDynamicHelpModal;
if (batch1Ready) {
  console.log('\n🎉 ALL BATCH 1 TESTS PASSED!');
  process.exit(0);
} else {
  console.log('\n⚠️ Batch 1 needs implementation to pass.');
  process.exit(1);
}
