const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE BATCH 4: PROFILE & HOMEPAGE ALIGNMENT (SINGLE SOURCE OF TRUTH) ===\n');

// 1. Check Admin Portal for Institutional CMS (Visi Misi, Sejarah, Program, Struktur Organisasi)
console.log('Test 1: Checking Admin CMS fields for institutional data...');
const contentHtml = fs.readFileSync(path.join(__dirname, '../frontend/portal/admin/content.html'), 'utf8');

const hasVisiInput = contentHtml.includes('sch-visi') || contentHtml.includes('set-visi');
const hasMisiInput = contentHtml.includes('sch-misi') || contentHtml.includes('set-misi');
const hasSejarahInput = contentHtml.includes('sch-sejarah') || contentHtml.includes('set-sejarah') || contentHtml.includes('sch-history');
const hasProgramInput = contentHtml.includes('sch-program') || contentHtml.includes('sch-curriculum') || contentHtml.includes('sch-kurikulum');
const hasStrukturInputs = contentHtml.includes('sch-pembina') && contentHtml.includes('sch-ketua') && contentHtml.includes('sch-sekretaris');

console.log('Admin CMS Visi input:', hasVisiInput ? '✅ Tersedia' : '❌ Belum ada');
console.log('Admin CMS Misi input:', hasMisiInput ? '✅ Tersedia' : '❌ Belum ada');
console.log('Admin CMS Sejarah input:', hasSejarahInput ? '✅ Tersedia' : '❌ Belum ada');
console.log('Admin CMS Program/Kurikulum input:', hasProgramInput ? '✅ Tersedia' : '❌ Belum ada');
console.log('Admin CMS Struktur Organisasi inputs:', hasStrukturInputs ? '✅ Tersedia' : '❌ Belum ada');

// 2. Check Homepage (index.html) Single Source of Truth
console.log('\nTest 2: Checking Beranda (index.html) Visi Misi hydration...');
const indexHtml = fs.readFileSync(path.join(__dirname, '../frontend/public/index.html'), 'utf8');

const indexHasVisiId = indexHtml.includes('home-visi') || indexHtml.includes('data-hydrate="visi"');
const indexHasMisiId = indexHtml.includes('home-misi') || indexHtml.includes('data-hydrate="misi"');
const indexHasDynamicLoader = indexHtml.includes('loadInstitutionalProfile') || indexHtml.includes('apiCall(\'schools\'') || indexHtml.includes('apiCall(\'web_settings\'');

console.log('Index Visi container:', indexHasVisiId ? '✅ Tersedia' : '❌ Belum ada');
console.log('Index Misi container:', indexHasMisiId ? '✅ Tersedia' : '❌ Belum ada');
console.log('Index dynamic institutional loader:', indexHasDynamicLoader ? '✅ Terpasang' : '❌ Belum terpasang');

// 3. Check Profile Page (profil.html) Single Source of Truth & Clean Org Tree Chart
console.log('\nTest 3: Checking Profil (profil.html) dynamic hydration & Org Tree Chart...');
const profilHtml = fs.readFileSync(path.join(__dirname, '../frontend/public/profil.html'), 'utf8');

const profilHasVisiId = profilHtml.includes('profil-visi') || profilHtml.includes('profile-visi');
const profilHasMisiId = profilHtml.includes('profil-misi') || profilHtml.includes('profile-misi');
const profilHasSejarahId = profilHtml.includes('profil-sejarah') || profilHtml.includes('profile-sejarah');
const profilHasDynamicLoader = profilHtml.includes('loadProfilePageData') || profilHtml.includes('apiCall(\'schools\'');

// Clean Org Tree Chart check: must have hierarchical tree structure, clean white/oceanic blue styling, no clashing dark/yellow
const profilHasOrgTree = profilHtml.includes('org-tree') || profilHtml.includes('diagram-organisasi') || profilHtml.includes('struktur-tree');
const profilHasOceanicAccents = profilHtml.includes('primary-600') || profilHtml.includes('primary-700') || profilHtml.includes('sky-500');

console.log('Profil Visi container:', profilHasVisiId ? '✅ Tersedia' : '❌ Belum ada');
console.log('Profil Misi container:', profilHasMisiId ? '✅ Tersedia' : '❌ Belum ada');
console.log('Profil Sejarah container:', profilHasSejarahId ? '✅ Tersedia' : '❌ Belum ada');
console.log('Profil dynamic loader:', profilHasDynamicLoader ? '✅ Terpasang' : '❌ Belum terpasang');
console.log('Profil Org Tree Diagram:', profilHasOrgTree ? '✅ Terpasang' : '❌ Belum diagram pohon');
console.log('Profil Oceanic Blue accents:', profilHasOceanicAccents ? '✅ Sesuai standar' : '❌ Perlu penyesuaian');

// 4. Check api.js persistence contract for extended fields
console.log('\nTest 4: Checking api.js persistence for institutional fields...');
const apiJs = fs.readFileSync(path.join(__dirname, '../frontend/shared/js/api.js'), 'utf8');
const apiPersistsInstitutional = apiJs.includes('visi') && apiJs.includes('misi') && apiJs.includes('sejarah');

console.log('api.js institutional field propagation:', apiPersistsInstitutional ? '✅ Terintegrasi' : '❌ Belum terintegrasi');

const batch4Passed = hasVisiInput && hasMisiInput && hasSejarahInput && hasProgramInput && hasStrukturInputs &&
  indexHasVisiId && indexHasMisiId && indexHasDynamicLoader &&
  profilHasVisiId && profilHasMisiId && profilHasSejarahId && profilHasDynamicLoader && profilHasOrgTree &&
  apiPersistsInstitutional;

if (batch4Passed) {
  console.log('\n🎉 ALL BATCH 4 TESTS PASSED!');
  process.exit(0);
} else {
  console.log('\n⚠️ Batch 4 needs implementation to pass (Expected in RED phase of TDD).');
  process.exit(1);
}
