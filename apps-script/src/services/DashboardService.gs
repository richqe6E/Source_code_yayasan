/**
 * @fileoverview Apps Script backend - Dashboard service.
 * KPI aggregations untuk dashboard per role.
 *
 * @version 1.0
 * @date 2026-09-12
 */

var DashboardService = (function () {

  /**
   * Dashboard untuk super admin / admin TU.
   * Tampilkan statistik global yayasan.
   */
  function index(session) {
    if (!Permissions.isSuperAdmin(session) && !Permissions.isAdminTU(session)) {
      return errorResponse(ERROR_CODES.FORBIDDEN, 'Hanya untuk admin', {}, HTTP_STATUS.FORBIDDEN);
    }

    var students = getSheetData(SHEET_NAMES.STUDENTS);
    var activeStudents = students.filter(function (s) { return s.status === 'active'; });
    var classes = getSheetData(SHEET_NAMES.CLASSES).filter(function (c) { return c.status === 'active'; });
    var teachers = getSheetData(SHEET_NAMES.TEACHERS).filter(function (t) { return t.status === 'active'; });
    var parents = getSheetData(SHEET_NAMES.PARENTS).filter(function (p) { return p.status === 'active'; });

    var ppdb = getSheetData(SHEET_NAMES.PPDB_REGISTRATIONS);
    var ppdbByStatus = countBy(ppdb, 'status');

    var invoices = getSheetData(SHEET_NAMES.INVOICES);
    var totalInvoiceAmount = invoices.reduce(function (sum, i) { return sum + parseFloat(i.amount || 0); }, 0);
    var totalPaid = invoices.reduce(function (sum, i) { return sum + parseFloat(i.total_paid || 0); }, 0);
    var totalOutstanding = totalInvoiceAmount - totalPaid;

    var payments = getSheetData(SHEET_NAMES.PAYMENTS);
    var pendingPayments = payments.filter(function (p) { return p.status === 'menunggu_verifikasi'; }).length;

    return successResponse({
      summary: {
        total_students: students.length,
        active_students: activeStudents.length,
        total_classes: classes.length,
        total_teachers: teachers.length,
        total_parents: parents.length
      },
      ppdb: {
        total: ppdb.length,
        by_status: ppdbByStatus,
        new_this_month: ppdb.filter(function (p) {
          var d = new Date(p.created_at);
          var today = new Date();
          return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
        }).length
      },
      finance: {
        total_invoice_amount: totalInvoiceAmount,
        total_paid: totalPaid,
        total_outstanding: totalOutstanding,
        pending_payment_verification: pendingPayments
      },
      today: {
        date: todayDate(),
        attendance_summary: getTodayAttendanceSummary()
      }
    });
  }

  /**
   * Dashboard untuk guru.
   * Fokus pada kelas yang diajar.
   */
  function teacherDashboard(session) {
    if (!Permissions.isGuru(session)) {
      return errorResponse(ERROR_CODES.FORBIDDEN, 'Hanya untuk guru', {}, HTTP_STATUS.FORBIDDEN);
    }

    var teacherId = session.user.linked_entity_id;
    var teacher = getById(SHEET_NAMES.TEACHERS, teacherId);
    if (!teacher) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Data guru tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    var assignments = findWhere(SHEET_NAMES.TEACHER_CLASS_ASSIGNMENTS, {
      teacher_id: teacherId,
      status: 'active'
    });
    var classIds = assignments.map(function (a) { return a.class_id; });
    var myClasses = classIds.map(function (cid) { return getById(SHEET_NAMES.CLASSES, cid); }).filter(Boolean);

    // Total siswa yang diajar
    var allMyStudents = [];
    classIds.forEach(function (cid) {
      var studs = findWhere(SHEET_NAMES.STUDENTS, { current_class_id: cid, status: 'active' });
      allMyStudents = allMyStudents.concat(studs);
    });

    // Presensi hari ini
    var todayRecaps = [];
    classIds.forEach(function (cid) {
      var today = findWhere(SHEET_NAMES.ATTENDANCE, { class_id: cid, date: todayDate() });
      todayRecaps = todayRecaps.concat(today);
    });

    var attendanceToday = { hadir: 0, izin: 0, sakit: 0, alpha: 0 };
    todayRecaps.forEach(function (r) {
      if (attendanceToday[r.status] !== undefined) attendanceToday[r.status]++;
    });

    // Catatan perkembangan yang sudah dibuat minggu ini
    var weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    var myDevThisWeek = findWhere(SHEET_NAMES.STUDENT_DEVELOPMENT, {
      recorded_by: session.userId
    }).filter(function (d) { return d.recorded_date >= weekAgo; });

    return successResponse({
      teacher: teacher,
      classes: myClasses,
      class_ids: classIds,
      students: allMyStudents,
      today: {
        date: todayDate(),
        attendance: attendanceToday
      },
      this_week: {
        development_notes: myDevThisWeek.length
      }
    });
  }

  /**
   * Dashboard untuk orang tua.
   * Fokus pada anak-anak.
   */
  function parentDashboard(session) {
    if (!Permissions.isOrangTua(session)) {
      return errorResponse(ERROR_CODES.FORBIDDEN, 'Hanya untuk orang tua', {}, HTTP_STATUS.FORBIDDEN);
    }

    var parent = getById(SHEET_NAMES.PARENTS, session.user.linked_entity_id);
    if (!parent) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Data orang tua tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    var relations = findWhere(SHEET_NAMES.PARENT_STUDENT_RELATIONS, {
      parent_id: parent.id,
      status: 'active'
    });

    var children = relations.map(function (r) {
      var student = getById(SHEET_NAMES.STUDENTS, r.student_id);
      if (!student) return null;

      var cls = student.current_class_id ? getById(SHEET_NAMES.CLASSES, student.current_class_id) : null;
      var school = cls ? getById(SHEET_NAMES.SCHOOLS, cls.school_id) : null;

      // Presensi minggu ini
      var weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      var recentAttendance = findWhere(SHEET_NAMES.ATTENDANCE, {
        student_id: student.id
      }).filter(function (a) { return a.date >= weekAgo; });

      var attSummary = { hadir: 0, izin: 0, sakit: 0, alpha: 0 };
      recentAttendance.forEach(function (a) {
        if (attSummary[a.status] !== undefined) attSummary[a.status]++;
      });

      // Tagihan belum dibayar
      var unpaidInvoices = findWhere(SHEET_NAMES.INVOICES, {
        student_id: student.id
      }).filter(function (i) {
        return i.status === 'unpaid' || i.status === 'partial' || i.status === 'overdue';
      });

      // Perkembangan terbaru
      var latestDev = findWhere(SHEET_NAMES.STUDENT_DEVELOPMENT, { student_id: student.id })
        .sort(function (a, b) { return (b.recorded_date || '').localeCompare(a.recorded_date || ''); })[0];

      return {
        student: student,
        class: cls,
        school: school,
        attendance_week: attSummary,
        unpaid_invoices: unpaidInvoices.length,
        latest_development: latestDev || null
      };
    }).filter(Boolean);

    // Pengumuman terbaru
    var announcements = getSheetData(SHEET_NAMES.ANNOUNCEMENTS)
      .filter(function (a) {
        return (a.target_audience === 'all' || a.target_audience === 'parents') &&
               (a.status === 'published' || a.status === 'pinned');
      })
      .sort(function (a, b) {
        if (a.is_pinned === 'TRUE' && b.is_pinned !== 'TRUE') return -1;
        return (b.published_at || '').localeCompare(a.published_at || '');
      })
      .slice(0, 5);

    // Tagihan total unpaid
    var allUnpaidInvoices = [];
    children.forEach(function (c) {
      var inv = findWhere(SHEET_NAMES.INVOICES, { student_id: c.student.id })
        .filter(function (i) { return i.status === 'unpaid' || i.status === 'partial'; });
      allUnpaidInvoices = allUnpaidInvoices.concat(inv);
    });
    var totalUnpaid = allUnpaidInvoices.reduce(function (sum, i) {
      return sum + (parseFloat(i.amount) - parseFloat(i.total_paid || 0));
    }, 0);

    return successResponse({
      parent: parent,
      children: children,
      announcements: announcements,
      finance: {
        unpaid_invoices_count: allUnpaidInvoices.length,
        total_unpaid: totalUnpaid
      }
    });
  }

  /**
   * Dashboard untuk pendaftar.
   * Status pendaftaran mereka.
   */
  function registrantDashboard(session) {
    if (!Permissions.isPendaftar(session) && !Permissions.isOrangTua(session)) {
      return errorResponse(ERROR_CODES.FORBIDDEN, 'Hanya untuk pendaftar / orang tua', {}, HTTP_STATUS.FORBIDDEN);
    }

    // Pendaftar biasanya di-tracked via email di ppdb_registrations
    var myRegistrations = findWhere(SHEET_NAMES.PPDB_REGISTRATIONS, {
      // Pendaftar biasanya login via email yang sama dengan yang di submit
      // Untuk MVP: filter berdasarkan creator/email
    });

    // Filter by creator_id atau parent_email matching user.email
    var myEmail = session.user?.email || '';
    myRegistrations = getSheetData(SHEET_NAMES.PPDB_REGISTRATIONS).filter(function (r) {
      return r.father_email === myEmail || r.mother_email === myEmail;
    });

    // Active PPDB period
    var activePeriod = findWhere(SHEET_NAMES.PPDB_PERIODS, { status: 'open' })[0];

    return successResponse({
      active_period: activePeriod,
      my_registrations: myRegistrations
    });
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  function countBy(items, field) {
    var result = {};
    items.forEach(function (it) {
      var v = it[field] || 'unknown';
      result[v] = (result[v] || 0) + 1;
    });
    return result;
  }

  function getTodayAttendanceSummary() {
    var records = findWhere(SHEET_NAMES.ATTENDANCE, { date: todayDate() });
    var summary = { hadir: 0, izin: 0, sakit: 0, alpha: 0 };
    records.forEach(function (r) {
      if (summary[r.status] !== undefined) summary[r.status]++;
    });
    summary.total = records.length;
    return summary;
  }

  return {
    index: index,
    teacher: teacherDashboard,
    parent: parentDashboard,
    registrant: registrantDashboard
  };

})();

// Register handlers
DashboardHandlers.index = function (session, id, params) {
  return jsonResponse(DashboardService.index(session));
};
DashboardHandlers.teacher = function (session, id, params) {
  return jsonResponse(DashboardService.teacher(session));
};
DashboardHandlers.parent = function (session, id, params) {
  return jsonResponse(DashboardService.parent(session));
};
DashboardHandlers.registrant = function (session, id, params) {
  return jsonResponse(DashboardService.registrant(session));
};