/**
 * @fileoverview Apps Script backend - Report & Backup services.
 *
 * @version 1.0
 * @date 2026-09-12
 */

// ============================================================================
// REPORT SERVICE
// ============================================================================

var ReportService = (function () {

  /**
   * Laporan SPP bulanan.
   */
  function sppMonthly(session, params) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var month = params.month;  // YYYY-MM
    if (!month) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'month (YYYY-MM) wajib diisi', {}, HTTP_STATUS.BAD_REQUEST);
    }

    var fromDate = month + '-01';
    var toDate = month + '-31';

    var invoices = findWhere(SHEET_NAMES.INVOICES, {
      invoice_type: STATUS.INVOICE_SPP
    }).filter(function (i) {
      return i.due_date >= fromDate && i.due_date <= toDate;
    });

    var report = invoices.map(function (inv) {
      var student = getById(SHEET_NAMES.STUDENTS, inv.student_id);
      return {
        invoice_id: inv.id,
        student_name: student ? student.full_name : '',
        student_nis: student ? student.nis : '',
        period: inv.period_label,
        due_date: inv.due_date,
        amount: parseFloat(inv.amount),
        total_paid: parseFloat(inv.total_paid || 0),
        outstanding: parseFloat(inv.amount) - parseFloat(inv.total_paid || 0),
        status: inv.status
      };
    });

    var totalAmount = report.reduce(function (s, r) { return s + r.amount; }, 0);
    var totalPaid = report.reduce(function (s, r) { return s + r.total_paid; }, 0);

    ActivityLogService.log({
      userId: session.userId,
      action: 'export',
      module: 'report',
      description: 'Cetak laporan SPP bulanan ' + month
    });

    return successResponse({
      month: month,
      invoices: report,
      total_amount: totalAmount,
      total_paid: totalPaid,
      total_outstanding: totalAmount - totalPaid
    });
  }

  /**
   * Laporan presensi bulanan per kelas.
   */
  function attendanceMonthly(session, params) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    if (!params.class_id || !params.month) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR,
        'class_id dan month wajib diisi', {}, HTTP_STATUS.BAD_REQUEST);
    }

    var fromDate = params.month + '-01';
    var toDate = params.month + '-31';

    var students = findWhere(SHEET_NAMES.STUDENTS, {
      current_class_id: params.class_id,
      status: 'active'
    });

    var records = findWhere(SHEET_NAMES.ATTENDANCE, { class_id: params.class_id })
      .filter(function (r) { return r.date >= fromDate && r.date <= toDate; });

    var recap = students.map(function (s) {
      var studentRecords = records.filter(function (r) { return r.student_id === s.id; });
      var counts = { hadir: 0, izin: 0, sakit: 0, alpha: 0 };
      studentRecords.forEach(function (r) {
        if (counts[r.status] !== undefined) counts[r.status]++;
      });
      var total = counts.hadir + counts.izin + counts.sakit + counts.alpha;
      return {
        student_id: s.id,
        nis: s.nis,
        nama: s.full_name,
        hadir: counts.hadir,
        izin: counts.izin,
        sakit: counts.sakit,
        alpha: counts.alpha,
        total: total,
        persentase: total > 0 ? Math.round((counts.hadir / total) * 100) : 0
      };
    });

    ActivityLogService.log({
      userId: session.userId,
      action: 'export',
      module: 'report',
      description: 'Cetak laporan presensi kelas ' + params.class_id + ' bulan ' + params.month
    });

    return successResponse({
      class_id: params.class_id,
      month: params.month,
      recap: recap
    });
  }

  /**
   * Laporan perkembangan siswa per periode.
   */
  function developmentReport(session, params) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    if (!params.class_id || !params.period) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR,
        'class_id dan period wajib diisi', {}, HTTP_STATUS.BAD_REQUEST);
    }

    var students = findWhere(SHEET_NAMES.STUDENTS, {
      current_class_id: params.class_id,
      status: 'active'
    });

    var aspects = [
      'aspek_agama_budi_pekerti', 'aspek_jasmani_kesehatan',
      'aspek_kognitif', 'aspek_bahasa', 'aspek_sosial_emosional', 'aspek_seni'
    ];

    var report = students.map(function (s) {
      var dev = findWhere(SHEET_NAMES.STUDENT_DEVELOPMENT, {
        student_id: s.id,
        period: params.period
      })[0];

      var row = {
        student_id: s.id,
        nis: s.nis,
        nama: s.full_name
      };
      aspects.forEach(function (a) {
        row[a] = dev ? dev[a] : '';
      });
      row.catatan = dev ? dev.catatan_guru : '';
      row.rekomendasi = dev ? dev.rekomendasi : '';
      return row;
    });

    ActivityLogService.log({
      userId: session.userId,
      action: 'export',
      module: 'report',
      description: 'Cetak laporan perkembangan kelas ' + params.class_id + ' periode ' + params.period
    });

    return successResponse({
      class_id: params.class_id,
      period: params.period,
      students: report
    });
  }

  /**
   * Rapor individual siswa (semua aspek).
   */
  function studentReportCard(session, studentId, params) {
    if (!Permissions.canAccessStudent(session, studentId)) {
      return errorResponse(ERROR_CODES.FORBIDDEN, 'Tidak punya akses', {}, HTTP_STATUS.FORBIDDEN);
    }

    var student = getById(SHEET_NAMES.STUDENTS, studentId);
    if (!student) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Siswa tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    var period = params.period || '';
    var dev = period
      ? findWhere(SHEET_NAMES.STUDENT_DEVELOPMENT, { student_id: studentId, period: period })[0]
      : findWhere(SHEET_NAMES.STUDENT_DEVELOPMENT, { student_id: studentId })
          .sort(function (a, b) { return (b.recorded_date || '').localeCompare(a.recorded_date || ''); })[0];

    var attendance = findWhere(SHEET_NAMES.ATTENDANCE, { student_id: studentId });
    var attSummary = { hadir: 0, izin: 0, sakit: 0, alpha: 0 };
    attendance.forEach(function (a) {
      if (attSummary[a.status] !== undefined) attSummary[a.status]++;
    });

    var cls = student.current_class_id ? getById(SHEET_NAMES.CLASSES, student.current_class_id) : null;
    var school = cls ? getById(SHEET_NAMES.SCHOOLS, cls.school_id) : null;
    var ay = dev && dev.academic_year_id ? getById(SHEET_NAMES.ACADEMIC_YEARS, dev.academic_year_id) : null;

    return successResponse({
      student: student,
      class: cls,
      school: school,
      academic_year: ay,
      development: dev,
      attendance_summary: attSummary
    });
  }

  return {
    sppMonthly: sppMonthly,
    attendanceMonthly: attendanceMonthly,
    developmentReport: developmentReport,
    studentReportCard: studentReportCard
  };

})();

ReportHandlers.list = function (session, id, params) {
  return jsonResponse(errorResponse('NOT_FOUND',
    'Report action harus spesifik: ?type=spp|attendance|development', {}, HTTP_STATUS.NOT_FOUND));
};
ReportHandlers.spp = function (session, id, params) {
  return jsonResponse(ReportService.sppMonthly(session, params));
};
ReportHandlers.attendance = function (session, id, params) {
  return jsonResponse(ReportService.attendanceMonthly(session, params));
};
ReportHandlers.development = function (session, id, params) {
  return jsonResponse(ReportService.developmentReport(session, params));
};
ReportHandlers.student = function (session, id, params) {
  return jsonResponse(ReportService.studentReportCard(session, id, params));
};


// ============================================================================
// BACKUP SERVICE
// ============================================================================

var BackupService = (function () {

  /**
   * Backup semua sheet ke folder Backup di Drive (CSV per sheet).
   */
  function createBackup(session) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    var root = getDriveRootFolder();
    var backupFolderName = 'BACKUP_' + timestamp;

    var subfolders = root.getFoldersByName('BACKUP');
    var backupFolder;
    if (subfolders.hasNext()) {
      backupFolder = subfolders.next();
    } else {
      backupFolder = root.createFolder('BACKUP');
    }

    var thisBackup = backupFolder.createFolder(backupFolderName);

    var db = getDatabase();
    var allSheets = db.getSheets();
    var filesCreated = [];

    allSheets.forEach(function (sheet) {
      var name = sheet.getName();
      var data = sheet.getDataRange().getValues();

      var csv = data.map(function (row) {
        return row.map(function (cell) {
          var s = String(cell);
          if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) {
            return '"' + s.replace(/"/g, '""') + '"';
          }
          return s;
        }).join(',');
      }).join('\n');

      var file = thisBackup.createFile(name + '.csv', csv, MimeType.PLAIN_TEXT);
      filesCreated.push({ sheet: name, file_id: file.getId() });
    });

    // Cleanup old backups (> retentionMonths)
    cleanupOldBackups(backupFolder);

    ActivityLogService.log({
      userId: session.userId,
      action: 'backup',
      module: 'backup',
      description: 'Backup database: ' + filesCreated.length + ' sheet',
      newValues: { folder: thisBackup.getId(), file_count: filesCreated.length }
    });

    return successResponse({
      backup_folder: thisBackup.getId(),
      backup_folder_url: thisBackup.getUrl(),
      file_count: filesCreated.length,
      files: filesCreated
    });
  }

  /**
   * List available backups.
   */
  function listBackups(session) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    try {
      var root = getDriveRootFolder();
      var subfolders = root.getFoldersByName('BACKUP');
      if (!subfolders.hasNext()) return successResponse({ items: [] });

      var backupFolder = subfolders.next();
      var sub = backupFolder.getFolders();
      var items = [];

      while (sub.hasNext()) {
        var f = sub.next();
        items.push({
          folder_id: f.getId(),
          folder_name: f.getName(),
          url: f.getUrl(),
          created_at: f.getDateCreated().toISOString(),
          file_count: f.getFiles().hasNext() ? countFilesInFolder(f) : 0
        });
      }

      items.sort(function (a, b) { return b.created_at.localeCompare(a.created_at); });
      return successResponse({ items: items });
    } catch (e) {
      return errorResponse(ERROR_CODES.INTERNAL_ERROR, e.message, {}, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  function countFilesInFolder(folder) {
    var count = 0;
    var files = folder.getFiles();
    while (files.hasNext()) {
      files.next();
      count++;
    }
    return count;
  }

  function cleanupOldBackups(backupFolder) {
    var retentionMonths = BACKUP_CONFIG.retentionMonths || 3;
    var cutoff = new Date(Date.now() - retentionMonths * 30 * 24 * 60 * 60 * 1000);
    var sub = backupFolder.getFolders();
    while (sub.hasNext()) {
      var f = sub.next();
      if (f.getDateCreated() < cutoff) {
        f.setTrashed(true);
      }
    }
  }

  return {
    createBackup: createBackup,
    listBackups: listBackups
  };

})();

ReportHandlers.backup = function (session, id, params) {
  return jsonResponse(BackupService.createBackup(session));
};
ReportHandlers.backups = function (session, id, params) {
  return jsonResponse(BackupService.listBackups(session));
};
ReportHandlers.create = function (session, id, params) {
  return jsonResponse(BackupService.createBackup(session));
};
ReportHandlers.restore = function (session, id, params) {
  return jsonResponse(errorResponse('NOT_IMPLEMENTED',
    'Restore backup belum diimplementasikan di MVP ini. Gunakan file backup manual.',
    {}, HTTP_STATUS.NOT_IMPLEMENTED));
};
ReportHandlers.generate = function (session, id, params) {
  var type = (params.type || params.report_type || '').toLowerCase();
  if (type === 'spp' || type === 'spp_monthly') return jsonResponse(ReportService.sppMonthly(session, params));
  if (type === 'attendance') return jsonResponse(ReportService.attendanceMonthly(session, params));
  if (type === 'development') return jsonResponse(ReportService.developmentReport(session, params));
  if (type === 'student_report_card' || type === 'rapor') {
    var studentId = id || params.student_id;
    if (!studentId) return jsonResponse(errorResponse(ERROR_CODES.VALIDATION_ERROR,
      'student_id wajib diisi untuk rapor', {}, HTTP_STATUS.BAD_REQUEST));
    return jsonResponse(ReportService.studentReportCard(session, studentId, params));
  }
  return jsonResponse(errorResponse(ERROR_CODES.VALIDATION_ERROR,
    'type harus salah satu: spp, attendance, development, student_report_card', {}, HTTP_STATUS.BAD_REQUEST));
};