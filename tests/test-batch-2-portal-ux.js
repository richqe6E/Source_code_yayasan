const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE BATCH 2: PORTAL UX, PROFILE & NAVIGATION ===\n');

// 1. Check shell.js for student menu icons mapping & modern refresh button
console.log('Test 1: Checking student icons & modern refresh button in shell.js...');
const shellJs = fs.readFileSync(path.join(__dirname, '../frontend/shared/js/shell.js'), 'utf8');

const hasStudentIconMapping = shellJs.includes('biodata.html') || shellJs.includes('STUDENT_MENU');
const hasModernRefresh = shellJs.includes('Shell.refresh') && shellJs.includes('animate-spin') && shellJs.includes('active:scale-95');
const hasProfileModal = shellJs.includes('openProfileModal') && shellJs.includes('Ganti Foto') || shellJs.includes('Ubah Profil');

console.log('Student icons in shell.js:', hasStudentIconMapping ? '✅ Ada' : '❌ Belum ada');
console.log('Modern refresh button in shell.js:', hasModernRefresh ? '✅ Terpasang' : '❌ Belum terpasang');
console.log('Profile modal in shell.js:', hasProfileModal ? '✅ Terpasang' : '❌ Belum terpasang');

// 2. Check biodata.html for localStorage.setItem('siy_user') and clean labels
console.log('\nTest 2: Checking biodata.html user sync & clean labels...');
const biodataHtml = fs.readFileSync(path.join(__dirname, '../frontend/portal/siswa/biodata.html'), 'utf8');

const hasUserSync = biodataHtml.includes("localStorage.setItem('siy_user'") || biodataHtml.includes('siy_user');
const hasCleanLabels = !biodataHtml.includes("'📊 Dashboard'") && !biodataHtml.includes("'👤 Biodata Siswa'");

console.log('Biodata user sync:', hasUserSync ? '✅ Ada' : '❌ Belum sinkron');
console.log('Clean student menu labels (no emoji duplication):', hasCleanLabels ? '✅ Bersih' : '❌ Masih ada emoji');

// 3. Check dokumen.html for modern refresh button with tactile feedback
console.log('\nTest 3: Checking dokumen.html refresh button...');
const dokumenHtml = fs.readFileSync(path.join(__dirname, '../frontend/portal/siswa/dokumen.html'), 'utf8');

const hasModernDocRefresh = dokumenHtml.includes('btn-refresh-docs') && dokumenHtml.includes('animate-spin');
console.log('Modern refresh in dokumen.html:', hasModernDocRefresh ? '✅ Terpasang' : '❌ Belum terpasang');

const allBatch2Passed = hasStudentIconMapping && hasModernRefresh && hasProfileModal && hasUserSync && hasCleanLabels && hasModernDocRefresh;

if (allBatch2Passed) {
  console.log('\n🎉 ALL BATCH 2 TESTS PASSED!');
  process.exit(0);
} else {
  console.log('\n⚠️ Batch 2 needs implementation to pass.');
  process.exit(1);
}
