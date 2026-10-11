/**
 * Test End-to-End CMS Konten & Integrasi Publik (Tahap 4)
 * Menguji:
 * 1. Admin Login
 * 2. Admin Ambil & Perbarui Pengaturan Website & Medsos (web_settings & schools)
 * 3. Halaman Publik Membaca Hero Carousel & Profil Sekolah Baru
 * 4. Admin Terbitkan Berita Baru (news create)
 * 5. Publik Membaca Berita Baru di Beranda & Halaman Berita
 * 6. Publik Membaca Detail Berita (news get)
 * 7. Admin Tambah Agenda Baru (events create)
 * 8. Publik Membaca Agenda Sekolah (events list)
 * 9. Admin Tambah Pengumuman Baru (announcements create)
 * 10. Publik Membaca Pengumuman Resmi (announcements list)
 * 11. Admin Tambah Foto Galeri (gallery create)
 * 12. Publik Membaca Galeri Foto (gallery list)
 * 13. Admin Ubah Status Berita Menjadi Draft (news update)
 * 14. Publik Filter Memverifikasi Draft Tidak Tampil di Website Publik
 * 15. Admin Hapus Konten Pengumuman (announcements remove)
 */

const http = require('http');

function post(endpoint, data = {}, token = null) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const req = http.request(`http://localhost:3000${endpoint}`, {
      method: 'POST',
      headers
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function api(module, action, params = {}, token = null) {
  return post(`/api/v1/${module}/${action}`, params, token);
}

async function runCmsTests() {
  console.log('========================================================');
  console.log('  TESTING E2E TAHAP 4: CMS KONTEN & INTEGRASI PUBLIK');
  console.log('========================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, detail = '') {
    total++;
    if (condition) {
      console.log(`  [PASS] Test ${total}: ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] Test ${total}: ${testName} -> ${detail}`);
    }
  }

  try {
    // 1. Admin Login
    const adminLogin = await api('auth', 'login', {
      identifier: 'admin@yayasan.sch.id',
      password: 'admin123'
    });
    const adminToken = adminLogin.body?.data?.token;
    assert(adminToken && adminLogin.body?.data?.user?.role === 'super_admin', 'Admin Login Berhasil');

    // 2. Admin Ambil Data Pengaturan Website Awal
    const settingsInit = await api('web_settings', 'get', {}, adminToken);
    assert(settingsInit.body?.success === true && Array.isArray(settingsInit.body?.data?.hero_images), 'Admin Membaca Web Settings & Hero Slides');

    // 3. Admin Update Pengaturan Website & Media Sosial
    const updateSettingsRes = await api('web_settings', 'update', {
      school_name: 'Yayasan Samarinda',
      whatsapp: '081234567891',
      phone: '(0541) 234-5678',
      email: 'info@yayasan.sch.id',
      instagram_url: 'https://instagram.com/yayasansamarinda',
      hero_images: [
        { url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1600', caption: 'Pentas Seni Santri Cilik 2026' }
      ]
    }, adminToken);
    assert(updateSettingsRes.body?.success === true, 'Admin Berhasil Update Banner Hero & Medsos CMS');

    // 4. Publik Ambil Pengaturan Website Terkini
    const publicSettings = await api('web_settings', 'get');
    assert(
      publicSettings.body?.data?.whatsapp === '081234567891' &&
      publicSettings.body?.data?.hero_images?.[0]?.caption === 'Pentas Seni Santri Cilik 2026',
      'Halaman Publik Menerima Update Web Settings Realtime'
    );

    // 5. Admin Terbitkan Berita Baru
    const newArticle = {
      title: 'Peringatan Hari Santri Nasional di Kampus Yayasan Samarinda',
      category: 'Prestasi',
      excerpt: 'Ratusan santri cilik memeriahkan peringatan Hari Santri dengan kirab obor islami.',
      content: 'Alhamdulillah, acara peringatan berlangsung semarak dihadiri tokoh masyarakat dan wali santri.',
      image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800',
      status: 'published',
      is_published: true
    };
    const createNewsRes = await api('news', 'create', newArticle, adminToken);
    assert(createNewsRes.body?.success === true && createNewsRes.body?.data?.item?.id, 'Admin Berhasil Menulis & Mempublikasikan Berita Baru');
    const createdNewsId = createNewsRes.body?.data?.item?.id;

    // 6. Publik Membaca Daftar Berita
    const publicNewsList = await api('news', 'list', { is_published: 'true' });
    const newsItems = Array.isArray(publicNewsList.body?.data) ? publicNewsList.body?.data : (publicNewsList.body?.data?.items || []);
    const foundPublishedNews = newsItems.find(n => n.id === createdNewsId || n.title.includes('Hari Santri'));
    assert(foundPublishedNews !== undefined, 'Berita Baru Tampil di Halaman Publik Berita', `Judul: ${foundPublishedNews?.title}`);

    // 7. Publik Membaca Detail Berita Berdasarkan ID
    const newsDetailRes = await api('news', 'get', { id: createdNewsId });
    assert(
      newsDetailRes.body?.success === true && newsDetailRes.body?.data?.title.includes('Hari Santri'),
      'Publik Berhasil Membaca Detail Berita Lengkap'
    );

    // 8. Admin Tambah Agenda Baru
    const newEvent = {
      title: 'Lomba Tahfidz & Tartil Qur\'an Anak Sholeh Se-Kota Samarinda',
      event_date: '2026-11-20',
      location: 'Masjid Raya Darussalam Samarinda',
      description: 'Ajang unjuk bakat hafalan juz 30 dan surat pendek bagi santri PAUD dan TPQ.',
      status: 'published'
    };
    const createEventRes = await api('events', 'create', newEvent, adminToken);
    assert(createEventRes.body?.success === true && createEventRes.body?.data?.item?.id, 'Admin Berhasil Menambahkan Agenda Acara Baru');
    const createdEventId = createEventRes.body?.data?.item?.id;

    // 9. Publik Membaca Agenda
    const publicEvents = await api('events', 'list');
    const eventItems = Array.isArray(publicEvents.body?.data) ? publicEvents.body?.data : (publicEvents.body?.data?.items || []);
    const foundEvent = eventItems.find(e => e.id === createdEventId || e.title.includes('Tahfidz'));
    assert(foundEvent && foundEvent.event_date === '2026-11-20', 'Agenda Baru Tampil di Halaman Publik Agenda');

    // 10. Admin Tambah Pengumuman Baru
    const newAnn = {
      title: 'Jadwal Pengambilan Formulir dan Seragam Siswa Baru 2026',
      content: 'Wali murid dipersilakan mengambil paket seragam dan perlengkapan santri di loket TU pada jam kerja.',
      status: 'published'
    };
    const createAnnRes = await api('announcements', 'create', newAnn, adminToken);
    assert(createAnnRes.body?.success === true && createAnnRes.body?.data?.item?.id, 'Admin Berhasil Menambahkan Pengumuman Resmi Baru');
    const createdAnnId = createAnnRes.body?.data?.item?.id;

    // 11. Publik Membaca Pengumuman
    const publicAnns = await api('announcements', 'list');
    const annItems = Array.isArray(publicAnns.body?.data) ? publicAnns.body?.data : (publicAnns.body?.data?.items || []);
    const foundAnn = annItems.find(a => a.id === createdAnnId || a.title.includes('Seragam'));
    assert(foundAnn !== undefined, 'Pengumuman Baru Tampil di Halaman Publik Pengumuman');

    // 12. Admin Tambah Foto Galeri
    const newGallery = {
      title: 'Keseruan Belajar Outdoor di Taman Budaya',
      image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
      description: 'Dokumentasi kunjungan edukatif ananda santri TK B.'
    };
    const createGalRes = await api('gallery', 'create', newGallery, adminToken);
    assert(createGalRes.body?.success === true, 'Admin Berhasil Mengunggah Foto ke Galeri');

    // 13. Publik Membaca Galeri Foto
    const publicGallery = await api('gallery', 'list');
    const galItems = Array.isArray(publicGallery.body?.data) ? publicGallery.body?.data : (publicGallery.body?.data?.items || []);
    const foundGal = galItems.find(g => g.title && g.title.includes('Outdoor'));
    assert(foundGal !== undefined, 'Foto Baru Tampil di Halaman Publik Galeri');

    // 14. Admin Mengubah Berita Menjadi Status Draft (Tarik dari Publik)
    const draftUpdate = await api('news', 'update', {
      id: createdNewsId,
      status: 'draft',
      is_published: false
    }, adminToken);
    assert(draftUpdate.body?.success === true, 'Admin Berhasil Mengubah Status Berita Jadi Draft');

    // 15. Verifikasi Draft Tidak Tampil pada Publik Filter
    const publicNewsAfterDraft = await api('news', 'list', { is_published: 'true' });
    const newsItemsAfter = Array.isArray(publicNewsAfterDraft.body?.data) ? publicNewsAfterDraft.body?.data : (publicNewsAfterDraft.body?.data?.items || []);
    const shouldNotExist = newsItemsAfter.find(n => n.id === createdNewsId);
    assert(shouldNotExist === undefined, 'Berita Berstatus Draft Berhasil Ditarik dari Halaman Publik');

    // 16. Admin Hapus Pengumuman (remove)
    const removeAnn = await api('announcements', 'remove', { id: createdAnnId }, adminToken);
    assert(removeAnn.body?.success === true, 'Admin Berhasil Menghapus Pengumuman (Action: remove)');

    // 17. Verifikasi Pengumuman Terhapus
    const publicAnnsAfter = await api('announcements', 'list');
    const annItemsAfter = Array.isArray(publicAnnsAfter.body?.data) ? publicAnnsAfter.body?.data : (publicAnnsAfter.body?.data?.items || []);
    const shouldBeRemoved = annItemsAfter.find(a => a.id === createdAnnId);
    assert(shouldBeRemoved === undefined, 'Pengumuman Berhasil Dihapus dari Database & Publik');

  } catch (err) {
    console.error('Fatal test error:', err);
  }

  console.log('\n========================================================');
  console.log(`HASIL AKHIR: ${passed}/${total} (${Math.round((passed/total)*100)}%) PENGUJIAN LULUS`);
  console.log('========================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runCmsTests();
