/**
 * Test End-to-End Modul SPP & Pembayaran (Tahap 3)
 * Menguji:
 * 1. Admin Login & Cek Summary SPP
 * 2. Siswa Login & Ambil Tagihan SPP
 * 3. Siswa Unggah Bukti Bayar (Upload Proof Transfer)
 * 4. Status Invoice berubah jadi 'menunggu_verifikasi'
 * 5. Admin Lihat Daftar Pembayaran Pending
 * 6. Admin Verifikasi (Approve) Pembayaran
 * 7. Status Invoice menjadi 'paid' (Lunas)
 * 8. Siswa Refresh & Verifikasi Status Lunas
 * 9. Admin Terbitkan Tagihan Baru (Individual & Bulk)
 * 10. Admin Tandai Lunas Pembayaran Offline (Cash di TU)
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

async function runSppTests() {
  console.log('========================================================');
  console.log('  TESTING E2E TAHAP 3: MODUL SPP & SISTEM PEMBAYARAN');
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
    assert(adminToken && adminLogin.body?.data?.user?.role === 'super_admin', 'Admin TU Login Berhasil');

    // 2. Admin Cek Summary SPP Awal
    const summaryBefore = await api('payments', 'summary', {}, adminToken);
    assert(summaryBefore.body?.success === true && typeof summaryBefore.body?.data?.total_invoice === 'number', 'Admin Ambil Summary SPP');

    // 3. Siswa Login
    const studentLogin = await api('auth', 'login', {
      identifier: '2026001',
      password: '2020-03-12'
    });
    const studentToken = studentLogin.body?.data?.token;
    const studentRole = studentLogin.body?.data?.user?.role;
    const roleCode = typeof studentRole === 'object' ? studentRole.code : studentRole;
    assert(studentToken && (roleCode === 'siswa' || roleCode === 'siswa_aktif'), 'Siswa Login Berhasil (NIS: 2026001)');

    // 4. Siswa Ambil Tagihan SPP
    const studentSpp = await api('siswa', 'get_spp', { nis: '2026001' }, studentToken);
    const invoices = studentSpp.body?.data?.invoices || [];
    assert(invoices.length >= 2, 'Siswa Memiliki Daftar Tagihan SPP', `Jumlah: ${invoices.length}`);

    // Cari tagihan unpaid
    const unpaidInvoice = invoices.find(i => i.status === 'unpaid');
    assert(unpaidInvoice && unpaidInvoice.amount === 150000, 'Terdapat Tagihan Unpaid Sebesar Rp 150.000', `ID: ${unpaidInvoice?.id}`);

    // 5. Siswa Kirim Bukti Transfer Pembayaran
    const submitProof = await api('payments', 'create', {
      invoice_id: unpaidInvoice.id,
      proof_image_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      method: 'transfer',
      notes: 'Transfer via BSI a.n. Ahmad Fauzan'
    }, studentToken);
    assert(submitProof.body?.success === true, 'Siswa Berhasil Unggah Bukti Transfer SPP');

    const paymentId = submitProof.body?.data?.payment?.id;

    // 6. Verifikasi Invoice Status Menjadi 'menunggu_verifikasi'
    const studentSppPending = await api('siswa', 'get_spp', { nis: '2026001' }, studentToken);
    const updatedUnpaid = studentSppPending.body?.data?.invoices?.find(i => i.id === unpaidInvoice.id);
    assert(updatedUnpaid && updatedUnpaid.status === 'menunggu_verifikasi', 'Status Tagihan Berubah Jadi "menunggu_verifikasi"');

    // 7. Admin Cek Daftar Pembayaran Menunggu Verifikasi
    const pendingList = await api('payments', 'list', { status: 'pending' }, adminToken);
    const foundPending = pendingList.body?.data?.items?.find(p => p.id === paymentId || p.invoice_id === unpaidInvoice.id);
    assert(foundPending !== undefined, 'Admin Melihat Bukti Transfer Siswa di Antrean Verifikasi');

    // 8. Admin Verifikasi (Approve) Pembayaran
    const verifyRes = await api('payments', 'verify', { id: foundPending ? foundPending.id : '' }, adminToken);
    assert(verifyRes.body?.success === true, 'Admin Berhasil Memverifikasi Bukti Pembayaran SPP');

    // 9. Siswa Refresh & Verifikasi Status Lunas
    const studentSppPaid = await api('siswa', 'get_spp', { nis: '2026001' }, studentToken);
    const verifiedInvoice = studentSppPaid.body?.data?.invoices?.find(i => i.id === unpaidInvoice.id);
    assert(verifiedInvoice && verifiedInvoice.status === 'paid', 'Status Tagihan Siswa Resmi Menjadi "paid" (Lunas)');

    // 10. Admin Terbitkan Tagihan Baru Perorangan
    const createInv = await api('invoices', 'create', {
      student_id: 'STU-001',
      item_name: 'SPP Bulan November 2026',
      period: 'November 2026',
      amount: 150000,
      due_date: '2026-11-10'
    }, adminToken);
    assert(createInv.body?.success === true, 'Admin Berhasil Menerbitkan Tagihan SPP Baru (November 2026)');

    const newInvId = createInv.body?.data?.invoice?.id;

    // 11. Admin Tandai Lunas Pembayaran Offline (Cash Kasir TU)
    const markPaid = await api('invoices', 'mark_paid', { id: newInvId }, adminToken);
    assert(markPaid.body?.success === true && markPaid.body?.data?.invoice?.status === 'paid', 'Admin Berhasil Menandai Lunas Pembayaran Offline/Kasir TU');

    // 12. Cek Summary SPP Akhir
    const summaryAfter = await api('payments', 'summary', {}, adminToken);
    assert(summaryAfter.body?.data?.total_paid > summaryBefore.body?.data?.total_paid, 'Rekapitulasi Keuangan SPP Bertambah Akurat');

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

runSppTests();
