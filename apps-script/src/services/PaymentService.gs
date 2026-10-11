/**
 * @fileoverview Apps Script backend - Invoice & Payment services.
 * Handle tagihan SPP / daftar ulang, upload bukti bayar, verifikasi pembayaran.
 *
 * @version 1.0
 * @date 2026-09-12
 */

var InvoiceService = (function () {

  /**
   * List invoices dengan filter.
   * - Admin TU/Super Admin: semua
   * - Guru: hanya invoice siswa di kelas yang diajar
   * - Orang tua: hanya anaknya
   */
  function list(session, params) {
    if (Permissions.isOrangTua(session)) {
      return listForParent(session, params);
    }
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU, ROLE_CODES.GURU]);
    if (deny) return deny;

    var items = getSheetData(SHEET_NAMES.INVOICES);

    if (params.student_id) items = items.filter(function (i) { return i.student_id === params.student_id; });
    if (params.status) items = items.filter(function (i) { return i.status === params.status; });
    if (params.invoice_type) items = items.filter(function (i) { return i.invoice_type === params.invoice_type; });
    if (params.academic_year_id) items = items.filter(function (i) { return i.academic_year_id === params.academic_year_id; });

    // Guru: hanya invoice siswa di kelas binaannya
    if (Permissions.isGuru(session)) {
      var teacherId = session.user.linked_entity_id;
      var assignments = findWhere(SHEET_NAMES.TEACHER_CLASS_ASSIGNMENTS, {
        teacher_id: teacherId,
        status: 'active'
      });
      var classIds = assignments.map(function (a) { return a.class_id; });
      items = items.filter(function (i) {
        var stu = i.student_id ? getById(SHEET_NAMES.STUDENTS, i.student_id) : null;
        return stu && classIds.indexOf(stu.current_class_id) !== -1;
      });
    }

    // Enrich agar frontend tidak perlu lookup manual
    items = items.map(function (i) {
      var stu = i.student_id ? getById(SHEET_NAMES.STUDENTS, i.student_id) : null;
      i.student_name = stu ? stu.full_name : '';
      i.class_id = i.class_id || (stu ? stu.current_class_id : '');
      i.invoice_number = i.invoice_number || i.id;
      i.period = i.period || i.period_label || '';
      i.item_name = i.item_name || ('Tagihan ' + (i.period || i.invoice_type || ''));
      return i;
    });

    items.sort(function (a, b) { return (b.due_date || '').localeCompare(a.due_date || ''); });

    var page = parseInt(params.page) || 1;
    var pageSize = parseInt(params.pageSize) || 50;
    var total = items.length;
    var totalPages = Math.ceil(total / pageSize);
    var start = (page - 1) * pageSize;
    var paged = items.slice(start, start + pageSize);

    ActivityLogService.log({
      userId: session.userId,
      action: 'read',
      module: 'invoice',
      description: 'List ' + paged.length + ' tagihan'
    });

    return successResponse({
      items: paged,
      pagination: { page: page, pageSize: pageSize, total: total, totalPages: totalPages }
    });
  }

  function listForParent(session, params) {
    var studentIds = getMyChildrenStudentIds(session);
    var items = getSheetData(SHEET_NAMES.INVOICES)
      .filter(function (i) { return studentIds.indexOf(i.student_id) !== -1; });

    if (params.status) items = items.filter(function (i) { return i.status === params.status; });

    // Enrich agar frontend tidak perlu lookup manual
    items = items.map(function (i) {
      var stu = i.student_id ? getById(SHEET_NAMES.STUDENTS, i.student_id) : null;
      i.student_name = stu ? stu.full_name : '';
      i.class_id = i.class_id || (stu ? stu.current_class_id : '');
      i.invoice_number = i.invoice_number || i.id;
      i.period = i.period || i.period_label || '';
      i.item_name = i.item_name || ('Tagihan ' + (i.period || i.invoice_type || ''));
      return i;
    });

    items.sort(function (a, b) { return (b.due_date || '').localeCompare(a.due_date || ''); });

    return successResponse({ items: items });
  }

  /**
   * Get invoice detail.
   * Admin/Super Admin: all. Guru: hanya siswa binaannya. Ortu: hanya anaknya.
   */
  function getInvoiceById(session, invoiceId) {
    if (Permissions.isOrangTua(session)) {
      var denyParent = Permissions.rbacDeny(session, [ROLE_CODES.ORANG_TUA]);
      if (denyParent) return denyParent;
    } else if (Permissions.isGuru(session)) {
      var denyGuru = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU, ROLE_CODES.GURU]);
      if (denyGuru) return denyGuru;
    } else {
      var denyAdmin = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
      if (denyAdmin) return denyAdmin;
    }

    var invoice = getById(SHEET_NAMES.INVOICES, invoiceId);
    if (!invoice) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Tagihan tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    // Cek akses: parent hanya invoice anaknya
    if (Permissions.isOrangTua(session)) {
      var studentIds = getMyChildrenStudentIds(session);
      if (studentIds.indexOf(invoice.student_id) === -1) {
        return errorResponse(ERROR_CODES.FORBIDDEN, 'Tidak punya akses', {}, HTTP_STATUS.FORBIDDEN);
      }
    }

    // Guru: hanya invoice siswa binaannya
    if (Permissions.isGuru(session)) {
      var tId = session.user.linked_entity_id;
      var tsAssignments = findWhere(SHEET_NAMES.TEACHER_CLASS_ASSIGNMENTS, {
        teacher_id: tId,
        status: 'active'
      });
      var tsClassIds = tsAssignments.map(function (a) { return a.class_id; });
      var stu = invoice.student_id ? getById(SHEET_NAMES.STUDENTS, invoice.student_id) : null;
      if (!stu || tsClassIds.indexOf(stu.current_class_id) === -1) {
        return errorResponse(ERROR_CODES.FORBIDDEN, 'Tidak punya akses', {}, HTTP_STATUS.FORBIDDEN);
      }
    }

    var payments = findWhere(SHEET_NAMES.PAYMENTS, { invoice_id: invoiceId });
    var student = invoice.student_id ? getById(SHEET_NAMES.STUDENTS, invoice.student_id) : null;

    return successResponse({
      invoice: invoice,
      student: student ? { id: student.id, full_name: student.full_name, nis: student.nis } : null,
      payments: payments
    });
  }

  /**
   * Create invoice baru.
   * Body: { student_id, period_label, due_date, amount, invoice_type, academic_year_id? }
   * Admin/Super Admin only.
   */
  function create(session, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var validation = validateRequired(data, ['student_id', 'period_label', 'due_date', 'amount', 'invoice_type']);
    if (!validation.valid) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Field wajib belum diisi',
        { missing: validation.missing }, HTTP_STATUS.BAD_REQUEST);
    }

    if (!isValidDate(data.due_date)) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR,
        'Format due_date harus YYYY-MM-DD', {}, HTTP_STATUS.BAD_REQUEST);
    }

    if (!isValidEnum(data.invoice_type,
      [STATUS.INVOICE_SPP, STATUS.INVOICE_DAFTAR_ULANG, STATUS.INVOICE_LAINNYA])) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR,
        'invoice_type tidak valid', {}, HTTP_STATUS.BAD_REQUEST);
    }

    var amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'amount harus angka > 0', {}, HTTP_STATUS.BAD_REQUEST);
    }

    var activeAY = findWhere(SHEET_NAMES.ACADEMIC_YEARS, { is_active: 'TRUE' })[0];
    var student = data.student_id ? getById(SHEET_NAMES.STUDENTS, data.student_id) : null;
    var invId = generateId(ID_PREFIXES.INVOICE);
    var period = data.period || data.period_label || '';

    var invoiceData = {
      id: invId,
      invoice_number: data.invoice_number || invId,
      item_name: data.item_name || (period ? ('Tagihan ' + period) : ('Tagihan ' + data.invoice_type)),
      student_id: data.student_id,
      class_id: data.class_id || (student ? student.current_class_id : ''),
      academic_year_id: data.academic_year_id || (activeAY ? activeAY.id : ''),
      period: period,
      period_label: data.period_label || period,
      due_date: data.due_date,
      amount: amount,
      status: STATUS.INV_UNPAID,
      total_paid: '0',
      invoice_type: data.invoice_type
    };

    var created = insertRow(SHEET_NAMES.INVOICES, invoiceData, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'create',
      module: 'invoice',
      entityType: 'invoice',
      entityId: created.id,
      description: 'Buat tagihan ' + data.invoice_type + ' ' + formatRupiah(amount) +
        ' untuk siswa ' + data.student_id,
      newValues: created
    });

    return successResponse({ invoice: created });
  }

  /**
   * Generate SPP bulanan untuk banyak siswa sekaligus.
   * Body: { class_id, period_label, due_date, amount, month (YYYY-MM) }
   * Admin/Super Admin only.
   */
  function generateBulkSPP(session, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var validation = validateRequired(data, ['class_id', 'period_label', 'due_date', 'amount', 'month']);
    if (!validation.valid) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Field wajib belum diisi',
        { missing: validation.missing }, HTTP_STATUS.BAD_REQUEST);
    }

    var students = findWhere(SHEET_NAMES.STUDENTS, {
      current_class_id: data.class_id,
      status: 'active'
    });

    if (students.length === 0) {
      return errorResponse('NO_STUDENTS', 'Tidak ada siswa aktif di kelas ini', {}, HTTP_STATUS.NOT_FOUND);
    }

    var amount = parseFloat(data.amount);
    var activeAY = findWhere(SHEET_NAMES.ACADEMIC_YEARS, { is_active: 'TRUE' })[0];

    var created = [];
    var skipped = [];

    students.forEach(function (s) {
      // Cek duplikat: SPP untuk siswa & bulan yang sama
      var existing = findWhere(SHEET_NAMES.INVOICES, {
        student_id: s.id,
        invoice_type: STATUS.INVOICE_SPP,
        period_label: data.period_label
      });
      if (existing.length > 0) {
        skipped.push({ student_id: s.id, reason: 'sudah ada invoice' });
        return;
      }

      var invId = generateId(ID_PREFIXES.INVOICE);
      var inv = insertRow(SHEET_NAMES.INVOICES, {
        id: invId,
        invoice_number: invId,
        item_name: data.item_name || ('SPP ' + (data.period_label || data.month)),
        student_id: s.id,
        class_id: data.class_id || s.current_class_id || '',
        academic_year_id: activeAY ? activeAY.id : '',
        period: data.period || data.period_label || data.month || '',
        period_label: data.period_label,
        due_date: data.due_date,
        amount: amount,
        status: STATUS.INV_UNPAID,
        total_paid: '0',
        invoice_type: STATUS.INVOICE_SPP
      }, session.userId);
      created.push(inv);
    });

    ActivityLogService.log({
      userId: session.userId,
      action: 'create',
      module: 'invoice',
      description: 'Generate SPP ' + data.month + ' untuk kelas ' + data.class_id +
        ' (' + created.length + ' created, ' + skipped.length + ' skipped)',
      newValues: { class_id: data.class_id, month: data.month, count: created.length }
    });

    return successResponse({
      created_count: created.length,
      skipped_count: skipped.length,
      skipped: skipped,
      invoices: created
    });
  }

  /**
   * Cancel invoice.
   * Admin/Super Admin only.
   */
  function cancel(session, invoiceId, reason) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var existing = getById(SHEET_NAMES.INVOICES, invoiceId);
    if (!existing) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Tagihan tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    if (existing.status === STATUS.INV_PAID) {
      return errorResponse('INVALID_STATE',
        'Tagihan sudah dibayar, tidak bisa dibatalkan', {}, HTTP_STATUS.FORBIDDEN);
    }

    var updated = updateRow(SHEET_NAMES.INVOICES, invoiceId, {
      status: STATUS.INV_CANCELLED
    }, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'update',
      module: 'invoice',
      entityId: invoiceId,
      description: 'Batal tagihan ' + existing.period_label +
        (reason ? ' (' + reason + ')' : '')
    });

    return successResponse({ invoice: updated });
  }

  /**
   * Tandai invoice lunas offline (admin input pembayaran tunai langsung).
   * Body: { payment_date, method, notes? }
   * Side effect: buat payment record (status verified) + set invoice.status=paid.
   * Admin/Super Admin only.
   */
  function markPaid(session, invoiceId, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var invoice = getById(SHEET_NAMES.INVOICES, invoiceId);
    if (!invoice) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Tagihan tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }
    if (invoice.status === STATUS.INV_PAID) {
      return errorResponse('INVALID_STATE', 'Tagihan sudah lunas', {}, HTTP_STATUS.FORBIDDEN);
    }
    if (invoice.status === STATUS.INV_CANCELLED) {
      return errorResponse('INVALID_STATE', 'Tagihan sudah dibatalkan', {}, HTTP_STATUS.FORBIDDEN);
    }

    var method = String((data && data.method) || 'tunai').toLowerCase().trim();
    if (method === 'transfer') method = 'transfer_bank';
    if (method === 'cash') method = 'tunai';
    if (method !== 'tunai' && method !== 'transfer_bank' && method !== 'e_wallet' && method !== 'qris') {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR,
        'method harus salah satu: tunai, transfer_bank, e_wallet, qris', {}, HTTP_STATUS.BAD_REQUEST);
    }

    var amount = parseFloat(invoice.amount);
    var paymentDate = (data && data.payment_date) || todayDate();

    var payment = insertRow(SHEET_NAMES.PAYMENTS, {
      id: generateId(ID_PREFIXES.PAYMENT),
      invoice_id: invoiceId,
      student_id: invoice.student_id,
      parent_id: '',
      payment_date: paymentDate,
      amount: amount,
      method: method,
      proof_file_id: '',
      notes: (data && data.notes) || 'Pembayaran langsung dicatat admin',
      status: STATUS.PAY_VERIFIED,
      verified_by: session.userId,
      verified_at: nowIso()
    }, session.userId);

    var updatedInvoice = updateRow(SHEET_NAMES.INVOICES, invoiceId, {
      status: STATUS.INV_PAID,
      total_paid: String(amount)
    }, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'create',
      module: 'payment',
      entityType: 'payment',
      entityId: payment.id,
      description: 'Catat pembayaran offline ' + formatRupiah(amount) + ' untuk invoice ' + invoice.period_label,
      newValues: { invoice_id: invoiceId, method: method, amount: amount }
    });

    return successResponse({ payment: payment, invoice: updatedInvoice });
  }

  // Helper untuk orang tua
  function getMyChildrenStudentIds(session) {
    var parent = getById(SHEET_NAMES.PARENTS, session.user.linked_entity_id);
    if (!parent) return [];
    var relations = findWhere(SHEET_NAMES.PARENT_STUDENT_RELATIONS, { parent_id: parent.id });
    return relations.map(function (r) { return r.student_id; });
  }

  return {
    list: list,
    listForParent: listForParent,
    getInvoiceById: getInvoiceById,
    create: create,
    generateBulkSPP: generateBulkSPP,
    cancel: cancel,
    markPaid: markPaid
  };

})();

// Register handlers
InvoiceHandlers.list = function (session, id, params) {
  return jsonResponse(InvoiceService.list(session, params));
};
InvoiceHandlers.list_mine = function (session, id, params) {
  return jsonResponse(InvoiceService.listForParent(session, params));
};
InvoiceHandlers.get = function (session, id, params) {
  return jsonResponse(InvoiceService.getInvoiceById(session, id || params.id));
};
InvoiceHandlers.create = function (session, id, params) {
  return jsonResponse(InvoiceService.create(session, params));
};
InvoiceHandlers.generateBulk = function (session, id, params) {
  return jsonResponse(InvoiceService.generateBulkSPP(session, params));
};
InvoiceHandlers.cancel = function (session, id, params) {
  return jsonResponse(InvoiceService.cancel(session, id || params.id, params.reason));
};
InvoiceHandlers.markPaid = function (session, id, params) {
  var targetId = id || params.id;
  if (!targetId) return jsonResponse(errorResponse(ERROR_CODES.VALIDATION_ERROR, 'id wajib diisi', {}, HTTP_STATUS.BAD_REQUEST));
  return jsonResponse(InvoiceService.markPaid(session, targetId, params));
};
InvoiceHandlers.delete = function (session, id, params) {
  var targetId = id || params.id;
  if (!targetId) return jsonResponse(errorResponse(ERROR_CODES.VALIDATION_ERROR, 'id wajib diisi', {}, HTTP_STATUS.BAD_REQUEST));
  if (typeof InvoiceService.softRemove !== 'function') {
    return jsonResponse(errorResponse(ERROR_CODES.FORBIDDEN,
      'Invoice tidak dapat dihapus, gunakan cancel untuk membatalkan', {}, HTTP_STATUS.FORBIDDEN));
  }
  return jsonResponse(InvoiceService.softRemove(session, targetId));
};


// ============================================================================
// PAYMENT SERVICE
// ============================================================================

var PaymentService = (function () {

  var PAYMENT_METHODS = ['tunai', 'transfer_bank', 'e_wallet', 'qris'];

  /**
   * Submit pembayaran (upload bukti).
   * Body: { invoice_id, amount, method, proof_file_id, notes }
   * Orang tua: hanya untuk invoice anaknya.
   */
  function submit(session, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU, ROLE_CODES.ORANG_TUA]);
    if (deny) return deny;

    var validation = validateRequired(data, ['invoice_id', 'amount', 'method']);
    if (!validation.valid) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Field wajib belum diisi',
        { missing: validation.missing }, HTTP_STATUS.BAD_REQUEST);
    }

    // Normalisasi metode pembayaran dari frontend
    var m = String(data.method || '').toLowerCase().trim();
    if (m === 'transfer') m = 'transfer_bank';
    if (m === 'cash') m = 'tunai';
    data.method = m;

    if (!isValidEnum(data.method, PAYMENT_METHODS)) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR,
        'method harus salah satu: ' + PAYMENT_METHODS.join(', '), {}, HTTP_STATUS.BAD_REQUEST);
    }

    var invoice = getById(SHEET_NAMES.INVOICES, data.invoice_id);
    if (!invoice) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Tagihan tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    if (invoice.status === STATUS.INV_PAID) {
      return errorResponse('INVALID_STATE', 'Tagihan sudah lunas', {}, HTTP_STATUS.FORBIDDEN);
    }
    if (invoice.status === STATUS.INV_CANCELLED) {
      return errorResponse('INVALID_STATE', 'Tagihan sudah dibatalkan', {}, HTTP_STATUS.FORBIDDEN);
    }

    var amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'amount harus > 0', {}, HTTP_STATUS.BAD_REQUEST);
    }

    // Parent: hanya boleh bayar invoice anaknya
    if (Permissions.isOrangTua(session)) {
      var parent = getById(SHEET_NAMES.PARENTS, session.user.linked_entity_id);
      var relations = findWhere(SHEET_NAMES.PARENT_STUDENT_RELATIONS, {
        parent_id: parent ? parent.id : '',
        student_id: invoice.student_id
      });
      if (relations.length === 0) {
        return errorResponse(ERROR_CODES.FORBIDDEN,
          'Tagihan ini bukan milik anak Anda', {}, HTTP_STATUS.FORBIDDEN);
      }
    }

    var paymentData = {
      id: generateId(ID_PREFIXES.PAYMENT),
      invoice_id: data.invoice_id,
      student_id: invoice.student_id,
      parent_id: session.user.linked_entity_type === 'parent' ? session.user.linked_entity_id : '',
      payment_date: data.payment_date || todayDate(),
      amount: amount,
      method: data.method,
      proof_file_id: data.proof_file_id || '',
      notes: data.notes || '',
      status: STATUS.PAY_PENDING
    };

    var created = insertRow(SHEET_NAMES.PAYMENTS, paymentData, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'create',
      module: 'payment',
      entityType: 'payment',
      entityId: created.id,
      description: 'Submit pembayaran ' + formatRupiah(amount) + ' untuk invoice ' + invoice.period_label,
      newValues: { invoice_id: data.invoice_id, amount: amount }
    });

    return successResponse({ payment: created });
  }

  /**
   * Verifikasi pembayaran oleh admin TU.
   * Jika verified, update invoice.total_paid dan invoice.status accordingly.
   * Admin/Super Admin only.
   */
  function verify(session, paymentId) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var payment = getById(SHEET_NAMES.PAYMENTS, paymentId);
    if (!payment) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Pembayaran tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    if (payment.status !== STATUS.PAY_PENDING) {
      return errorResponse('INVALID_STATE',
        'Status pembayaran bukan menunggu_verifikasi: ' + payment.status, {}, HTTP_STATUS.FORBIDDEN);
    }

    var updated = updateRow(SHEET_NAMES.PAYMENTS, paymentId, {
      status: STATUS.PAY_VERIFIED,
      verified_by: session.userId,
      verified_at: nowIso()
    }, session.userId);

    // Update invoice.total_paid
    var invoice = getById(SHEET_NAMES.INVOICES, payment.invoice_id);
    if (invoice) {
      var newTotal = parseFloat(invoice.total_paid || 0) + parseFloat(payment.amount);
      var newStatus = newTotal >= parseFloat(invoice.amount) ? STATUS.INV_PAID : STATUS.INV_PARTIAL;

      updateRow(SHEET_NAMES.INVOICES, invoice.id, {
        total_paid: String(newTotal),
        status: newStatus
      }, session.userId);
    }

    ActivityLogService.log({
      userId: session.userId,
      action: 'verify',
      module: 'payment',
      entityId: paymentId,
      description: 'Verifikasi pembayaran ' + formatRupiah(payment.amount)
    });

    return successResponse({ payment: updated, invoice: invoice });
  }

  /**
   * Tolak pembayaran.
   * Admin/Super Admin only.
   */
  function reject(session, paymentId, reason) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    if (!reason) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Alasan penolakan wajib', {}, HTTP_STATUS.BAD_REQUEST);
    }

    var payment = getById(SHEET_NAMES.PAYMENTS, paymentId);
    if (!payment) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Pembayaran tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    var updated = updateRow(SHEET_NAMES.PAYMENTS, paymentId, {
      status: STATUS.PAY_REJECTED,
      rejection_reason: reason
    }, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'reject',
      module: 'payment',
      entityId: paymentId,
      description: 'Tolak pembayaran ' + formatRupiah(payment.amount) + ': ' + reason
    });

    return successResponse({ payment: updated });
  }

  /**
   * List pembayaran.
   * Admin/Super Admin: semua. Orang tua: hanya miliknya.
   */
  function list(session, params) {
    if (Permissions.isOrangTua(session)) {
      return listForParent(session, params);
    }
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var items = getSheetData(SHEET_NAMES.PAYMENTS);

    if (params.invoice_id) items = items.filter(function (p) { return p.invoice_id === params.invoice_id; });
    if (params.student_id) items = items.filter(function (p) { return p.student_id === params.student_id; });
    if (params.status) items = items.filter(function (p) { return p.status === params.status; });
    if (params.method) items = items.filter(function (p) { return p.method === params.method; });

    items = items.map(function (p) {
      var stu = p.student_id ? getById(SHEET_NAMES.STUDENTS, p.student_id) : null;
      var inv = p.invoice_id ? getById(SHEET_NAMES.INVOICES, p.invoice_id) : null;
      p.student_name = stu ? stu.full_name : '';
      p.invoice_number = inv ? (inv.invoice_number || inv.id) : '';
      return p;
    });

    items.sort(function (a, b) { return (b.payment_date || '').localeCompare(a.payment_date || ''); });

    return successResponse({ items: items });
  }

  function listForParent(session, params) {
    var parent = getById(SHEET_NAMES.PARENTS, session.user.linked_entity_id);
    if (!parent) return successResponse({ items: [] });

    var relations = findWhere(SHEET_NAMES.PARENT_STUDENT_RELATIONS, { parent_id: parent.id });
    var studentIds = relations.map(function (r) { return r.student_id; });
    var items = getSheetData(SHEET_NAMES.PAYMENTS)
      .filter(function (p) { return studentIds.indexOf(p.student_id) !== -1; });

    if (params.status) items = items.filter(function (p) { return p.status === params.status; });

    // Enrich agar ortu bisa melihat nama anak dan nomor invoice
    items = items.map(function (p) {
      var stu = p.student_id ? getById(SHEET_NAMES.STUDENTS, p.student_id) : null;
      var inv = p.invoice_id ? getById(SHEET_NAMES.INVOICES, p.invoice_id) : null;
      p.student_name = stu ? stu.full_name : '';
      p.invoice_number = inv ? (inv.invoice_number || inv.id) : '';
      return p;
    });

    items.sort(function (a, b) { return (b.payment_date || '').localeCompare(a.payment_date || ''); });
    return successResponse({ items: items });
  }

  /**
   * Rekap pembayaran untuk periode tertentu.
   * Admin/Super Admin only.
   */
  function getRecap(session, params) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var items = getSheetData(SHEET_NAMES.PAYMENTS);

    if (params.from_date) items = items.filter(function (p) { return p.payment_date >= params.from_date; });
    if (params.to_date) items = items.filter(function (p) { return p.payment_date <= params.to_date; });
    if (params.status) items = items.filter(function (p) { return p.status === params.status; });

    var recap = {
      total_payments: items.length,
      total_amount: 0,
      by_method: {},
      by_status: {}
    };

    items.forEach(function (p) {
      var amt = parseFloat(p.amount) || 0;
      if (p.status === STATUS.PAY_VERIFIED) {
        recap.total_amount += amt;
      }
      recap.by_method[p.method] = (recap.by_method[p.method] || 0) + 1;
      recap.by_status[p.status] = (recap.by_status[p.status] || 0) + 1;
    });

    return successResponse({ recap: recap });
  }

  return {
    submit: submit,
    verify: verify,
    reject: reject,
    list: list,
    listForParent: listForParent,
    getRecap: getRecap
  };

})();

// Register handlers
PaymentHandlers.list = function (session, id, params) {
  return jsonResponse(PaymentService.list(session, params));
};
PaymentHandlers.list_mine = function (session, id, params) {
  return jsonResponse(PaymentService.listForParent(session, params));
};
PaymentHandlers.create = function (session, id, params) {
  return jsonResponse(PaymentService.submit(session, params));
};
PaymentHandlers.submit = function (session, id, params) {
  return jsonResponse(PaymentService.submit(session, params));
};
PaymentHandlers.verify = function (session, id, params) {
  return jsonResponse(PaymentService.verify(session, id || params.id));
};
PaymentHandlers.reject = function (session, id, params) {
  return jsonResponse(PaymentService.reject(session, id || params.id, params.reason));
};
PaymentHandlers.recap = function (session, id, params) {
  return jsonResponse(PaymentService.getRecap(session, params));
};
PaymentHandlers.summary = function (session, id, params) {
  return jsonResponse(PaymentService.getRecap(session, params));
};