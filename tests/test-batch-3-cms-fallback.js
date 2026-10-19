const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE BATCH 3: CMS FALLBACK ELIMINATION, TERMINOLOGY & ACCORDION ===\n');

// 1. Check for elimination of forced dummy fallback when data is 0
console.log('Test 1: Checking elimination of dummy fallback in public pages...');
const agendaHtml = fs.readFileSync(path.join(__dirname, '../frontend/public/agenda.html'), 'utf8');
const beritaHtml = fs.readFileSync(path.join(__dirname, '../frontend/public/berita.html'), 'utf8');
const pengumumanHtml = fs.readFileSync(path.join(__dirname, '../frontend/public/pengumuman.html'), 'utf8');
const galeriHtml = fs.readFileSync(path.join(__dirname, '../frontend/public/galeri.html'), 'utf8');

const agendaHasDummyInjection = agendaHtml.includes("title: 'Pekan Ceria Ramadhan & Pawai Menyambut Bulan Suci 1447 H'") && agendaHtml.includes("items = [");
const beritaHasDummyInjection = beritaHtml.includes("Keseruan Belajar Berbagi pada Peringatan Bulan Ramadhan 1447 H") && beritaHtml.includes("allNews = [");
const pengumumanHasDummyInjection = pengumumanHtml.includes("Edaran Jadwal Libur Awal Ramadhan") && pengumumanHtml.includes("items = [");
const galeriHasDummyInjection = galeriHtml.includes("Keceriaan Belajar Mewarnai Santri TK") && galeriHtml.includes("galleryItems = [");

console.log('Agenda dummy injection eliminated:', !agendaHasDummyInjection ? '✅ Bersih' : '❌ Masih memaksa dummy');
console.log('Berita dummy injection eliminated:', !beritaHasDummyInjection ? '✅ Bersih' : '❌ Masih memaksa dummy');
console.log('Pengumuman dummy injection eliminated:', !pengumumanHasDummyInjection ? '✅ Bersih' : '❌ Masih memaksa dummy');
console.log('Galeri dummy injection eliminated:', !galeriHasDummyInjection ? '✅ Bersih' : '❌ Masih memaksa dummy');

// 2. Check for removal of "Kampus" terminology in CMS & Kontak
console.log('\nTest 2: Checking terminology clean-up (Hapus istilah Kampus)...');
const cmsSettingHtml = fs.readFileSync(path.join(__dirname, '../frontend/portal/admin/cms_setting.html'), 'utf8');
const kontakHtml = fs.readFileSync(path.join(__dirname, '../frontend/public/kontak.html'), 'utf8');

const cmsHasKampus = cmsSettingHtml.includes('Keterangan Kampus') || cmsSettingHtml.includes('Kampus Utama Yayasan');
const kontakHasKampus = kontakHtml.includes('Kampus Utama Air Putih') || kontakHtml.includes('Kampus Yayasan');
console.log('CMS Setting free of "Kampus":', !cmsHasKampus ? '✅ Bersih' : '❌ Masih ada istilah Kampus');
console.log('Kontak page free of "Kampus":', !kontakHasKampus ? '✅ Bersih' : '❌ Masih ada istilah Kampus');

// 3. Check for dynamic operational hours in cms_setting.html and kontak.html
console.log('\nTest 3: Checking dynamic operational hours...');
const cmsHasOpHours = cmsSettingHtml.includes('set-hours') || cmsSettingHtml.includes('operational_hours') || cmsSettingHtml.includes('Jam Operasional');
const kontakHasOpHours = kontakHtml.includes('operational_hours') || kontakHtml.includes('op-hours') || kontakHtml.includes('jam_operasional');
console.log('CMS operational hours form:', cmsHasOpHours ? '✅ Tersedia' : '❌ Belum tersedia');
console.log('Kontak dynamic operational hours sync:', kontakHasOpHours ? '✅ Tersedia' : '❌ Belum tersedia');

// 4. Check for Accordion in PPDB requirements
console.log('\nTest 4: Checking Accordion in PPDB requirements...');
const ppdbHtml = fs.readFileSync(path.join(__dirname, '../frontend/public/ppdb.html'), 'utf8');
const hasAccordion = ppdbHtml.includes('accordion') || ppdbHtml.includes('toggleAccordion') || ppdbHtml.includes('<details');
console.log('PPDB requirements accordion:', hasAccordion ? '✅ Terpasang' : '❌ Belum accordion');

const batch3Passed = !agendaHasDummyInjection && !beritaHasDummyInjection && !pengumumanHasDummyInjection && !galeriHasDummyInjection &&
  !cmsHasKampus && !kontakHasKampus && cmsHasOpHours && kontakHasOpHours && hasAccordion;

if (batch3Passed) {
  console.log('\n🎉 ALL BATCH 3 TESTS PASSED!');
  process.exit(0);
} else {
  console.log('\n⚠️ Batch 3 needs implementation to pass.');
  process.exit(1);
}
