/**
 * @fileoverview Apps Script backend - Attendance service.
 * Handle presensi harian siswa.
 *
 * @version 1.0
 * @date 2026-09-12
 */

var AttendanceService = (function () {

  /**
   * Input presensi harian untuk satu kelas.
   * Body: { class_id, date, records: [{student_id, status, notes?}] }
   * - Guru boleh input hanya untuk kelas yang diajar.
   * - Admin TU/Super Admin: semua kelas.
   */
  function recordDaily(session, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU, ROLE_CODES.GURU]);
    if (deny) return deny;

    var validation = validateRequired(data, ['class_id', 'date', 'records']);
    if (!validation.valid) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Field wajib belum diisi',
        { missing: validation.missing }, HTTP_STATUS.BAD_REQUEST);
    }

    if (!isValidDate(data.date)) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Format date harus YYYY-MM-DD', {}, HTTP_STATUS.BAD_REQUEST);
    }

    if (!Array.isArray(data.records) || data.records.length === 0) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'records harus array minimal 1', {}, HTTP_STATUS.BAD_REQUEST);
    }

    // Validasi akses: guru hanya boleh input untuk kelas yang diajar
    if (Permissions.isGuru(session)) {
      var teacherId = session.user.linked_entity_id;
      var assignments = findWhere(SHEET_NAMES.TEACHER_CLASS_ASSIGNMENTS, {
        teacher_id: teacherId,
        class_id: data.class_id,
        status: 'active'
      });
      if (assignments.length === 0) {
        ActivityLogService.log({
          userId: session.userId,
          action: 'create',
          module: 'attendance',
          description: 'Akses ditolak: guru bukan wali kelas ' + data.class_id,
          status: LOG_STATUS.FAILED
        });
        return errorResponse(ERROR_CODES.FORBIDDEN,
          'Anda bukan wali kelas untuk kelas ini', {}, HTTP_STATUS.FORBIDDEN);
      }
    }

    var validStatuses = [STATUS.ATT_HADIR, STATUS.ATT_IZIN, STATUS.ATT_SAKIT, STATUS.ATT_ALPHA];
    var results = [];

    data.records.forEach(function (rec) {
      // Cek apakah sudah ada record untuk siswa & tanggal ini
      var existing = findWhere(SHEET_NAMES.ATTENDANCE, {
        student_id: rec.student_id,
        class_id: data.class_id,
        date: data.date
      });

      if (!isValidEnum(rec.status, validStatuses)) {
        results.push({ student_id: rec.student_id, error: 'Status tidak valid' });
        return;
      }

      if (existing.length > 0) {
        var updated = updateRow(SHEET_NAMES.ATTENDANCE, existing[0].id, {
          status: rec.status,
          check_in_time: rec.check_in_time || '',
          check_out_time: rec.check_out_time || '',
          notes: rec.notes || '',
          recorded_by: session.userId
        }, session.userId);
        results.push({ student_id: rec.student_id, action: 'updated', id: updated.id });
      } else {
        var created = insertRow(SHEET_NAMES.ATTENDANCE, {
          id: generateId(ID_PREFIXES.ATTENDANCE),
          student_id: rec.student_id,
          class_id: data.class_id,
          date: data.date,
          status: rec.status,
          check_in_time: rec.check_in_time || '',
          check_out_time: rec.check_out_time || '',
          notes: rec.notes || '',
          recorded_by: session.userId
        }, session.userId);
        results.push({ student_id: rec.student_id, action: 'created', id: created.id });
      }
    });

    ActivityLogService.log({
      userId: session.userId,
      action: 'create',
      module: 'attendance',
      description: 'Input presensi ' + data.records.length + ' siswa kelas ' + data.class_id + ' tanggal ' + data.date,
      newValues: { class_id: data.class_id, date: data.date, count: data.records.length }
    });

    return successResponse({ results: results });
  }

  /**
   * List presensi untuk satu kelas & rentang tanggal.
   * Admin/Super Admin only (guru gunakan attendance/submit untuk input sendiri).
   */
  function listForClass(session, params) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var validation = validateRequired(params, ['class_id']);
    if (!validation.valid) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'class_id wajib diisi', {}, HTTP_STATUS.BAD_REQUEST);
    }

    var records = findWhere(SHEET_NAMES.ATTENDANCE, { class_id: params.class_id });

    if (params.from_date) records = records.filter(function (r) { return r.date >= params.from_date; });
    if (params.to_date) records = records.filter(function (r) { return r.date <= params.to_date; });

    records.sort(function (a, b) { return b.date.localeCompare(a.date); });

    // Group by date
    var byDate = {};
    records.forEach(function (r) {
      if (!byDate[r.date]) byDate[r.date] = [];
      byDate[r.date].push(r);
    });

    return successResponse({
      items: records,
      by_date: byDate,
      total: records.length
    });
  }

  /**
   * Get presensi satu anak (untuk ortu).
   * - Admin TU/Super Admin: all
   * - Guru: hanya siswa di kelas yang diajar
   * - Orang tua: hanya anaknya
   */
  function getForStudent(session, studentId, params) {
    if (!Permissions.canAccessStudent(session, studentId)) {
      ActivityLogService.log({
        userId: session.userId,
        action: 'read',
        module: 'attendance',
        entityId: studentId,
        description: 'Akses ditolak ke presensi ' + studentId,
        status: LOG_STATUS.FAILED
      });
      return errorResponse(ERROR_CODES.FORBIDDEN,
        'Anda tidak punya akses ke data siswa ini', {}, HTTP_STATUS.FORBIDDEN);
    }

    var records = findWhere(SHEET_NAMES.ATTENDANCE, { student_id: studentId });

    if (params.from_date) records = records.filter(function (r) { return r.date >= params.from_date; });
    if (params.to_date) records = records.filter(function (r) { return r.date <= params.to_date; });
    if (params.month) records = records.filter(function (r) { return r.date && String(r.date).indexOf(params.month) === 0; });

    records.sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });

    // Summary
    var summary = { hadir: 0, izin: 0, sakit: 0, alpha: 0 };
    records.forEach(function (r) {
      if (summary[r.status] !== undefined) summary[r.status]++;
    });
    summary.total = records.length;
    summary.pct_hadir = summary.total > 0 ? Math.round((summary.hadir / summary.total) * 100) : 100;

    return successResponse({
      items: records,
      records: records,
      summary: summary,
      pct_hadir: summary.pct_hadir
    });
  }

  /**
   * Rekap bulanan per kelas.
   * Returns: { month: 'YYYY-MM', students: [{student_id, hadir, izin, sakit, alpha, total}] }
   * Admin/Super Admin only.
   */
  function getMonthlyRecap(session, params) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    if (!params.class_id || !params.month) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR,
        'class_id dan month wajib diisi', {}, HTTP_STATUS.BAD_REQUEST);
    }

    var fromDate = params.month + '-01';
    var toDate = params.month + '-31';

    var records = findWhere(SHEET_NAMES.ATTENDANCE, { class_id: params.class_id })
      .filter(function (r) { return r.date >= fromDate && r.date <= toDate; });

    var byStudent = {};
    records.forEach(function (r) {
      if (!byStudent[r.student_id]) {
        byStudent[r.student_id] = { hadir: 0, izin: 0, sakit: 0, alpha: 0 };
      }
      if (byStudent[r.student_id][r.status] !== undefined) {
        byStudent[r.student_id][r.status]++;
      }
    });

    var recap = Object.keys(byStudent).map(function (sid) {
      var s = byStudent[sid];
      s.student_id = sid;
      s.total = s.hadir + s.izin + s.sakit + s.alpha;
      s.persentase = s.total > 0 ? Math.round((s.hadir / s.total) * 100) : 0;
      return s;
    });

    return successResponse({
      month: params.month,
      class_id: params.class_id,
      recap: recap
    });
  }

  /**
   * Get students of a class (untuk render form input presensi).
   * Admin/Super Admin: semua kelas. Guru: hanya kelas yang diajar.
   */
  function getStudentsForClass(session, classId, date) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU, ROLE_CODES.GURU]);
    if (deny) return deny;

    // Guru: hanya boleh akses siswa di kelas binaannya
    if (Permissions.isGuru(session)) {
      var teacherId = session.user.linked_entity_id;
      var assignments = findWhere(SHEET_NAMES.TEACHER_CLASS_ASSIGNMENTS, {
        teacher_id: teacherId,
        status: 'active'
      });
      var classIds = assignments.map(function (a) { return a.class_id; });
      if (classIds.indexOf(classId) === -1) {
        return errorResponse(ERROR_CODES.FORBIDDEN, 'Anda tidak mengajar kelas ini', {}, HTTP_STATUS.FORBIDDEN);
      }
    }

    var students = findWhere(SHEET_NAMES.STUDENTS, {
      current_class_id: classId,
      status: 'active'
    });

    // Jika ada date, tambahkan existing attendance untuk pre-fill
    if (date) {
      var existingRecords = findWhere(SHEET_NAMES.ATTENDANCE, {
        class_id: classId,
        date: date
      });
      var attendanceMap = {};
      existingRecords.forEach(function (r) {
        attendanceMap[r.student_id] = r;
      });

      students = students.map(function (s) {
        var att = attendanceMap[s.id];
        return Object.assign({}, s, {
          attendance: att ? {
            status: att.status,
            check_in_time: att.check_in_time,
            check_out_time: att.check_out_time,
            notes: att.notes
          } : null
        });
      });
    }

    return successResponse({ items: students, students: students });
  }

  return {
    recordDaily: recordDaily,
    listForClass: listForClass,
    getForStudent: getForStudent,
    getMonthlyRecap: getMonthlyRecap,
    getStudentsForClass: getStudentsForClass
  };

})();

// Register handlers
AttendanceHandlers.list = function (session, id, params) {
  if (params.student_id) {
    return jsonResponse(AttendanceService.getForStudent(session, params.student_id, params));
  }
  if (params.class_id && params.month) {
    return jsonResponse(AttendanceService.getMonthlyRecap(session, params));
  }
  if (params.class_id) {
    return jsonResponse(AttendanceService.listForClass(session, params));
  }
  return jsonResponse(errorResponse(ERROR_CODES.VALIDATION_ERROR,
    'class_id atau student_id wajib diisi', {}, HTTP_STATUS.BAD_REQUEST));
};
AttendanceHandlers.create = function (session, id, params) {
  return jsonResponse(AttendanceService.recordDaily(session, params));
};
AttendanceHandlers.student = function (session, id, params) {
  return jsonResponse(AttendanceService.getForStudent(session, id, params));
};
AttendanceHandlers.recap = function (session, id, params) {
  return jsonResponse(AttendanceService.getMonthlyRecap(session, params));
};
AttendanceHandlers.students = function (session, id, params) {
  return jsonResponse(AttendanceService.getStudentsForClass(session, params.class_id || id, params.date));
};
AttendanceHandlers.submit = function (session, id, params) {
  return jsonResponse(AttendanceService.recordDaily(session, params));
};
AttendanceHandlers.history = function (session, id, params) {
  var target = id || params.student_id;
  if (!target) return jsonResponse(errorResponse(ERROR_CODES.VALIDATION_ERROR, 'student_id wajib diisi', {}, HTTP_STATUS.BAD_REQUEST));
  return jsonResponse(AttendanceService.getForStudent(session, target, params));
};
AttendanceHandlers.summary = function (session, id, params) {
  if (params.class_id && params.month) {
    return jsonResponse(AttendanceService.getMonthlyRecap(session, params));
  }
  var studentId = id || params.student_id;
  if (!studentId && Permissions.isOrangTua(session)) {
    var myChildrenRes = StudentService.getMyChildren(session);
    if (myChildrenRes && myChildrenRes.data && myChildrenRes.data.children && myChildrenRes.data.children.length > 0) {
      studentId = myChildrenRes.data.children[0].student.id;
    }
  }
  if (studentId) {
    return jsonResponse(AttendanceService.getForStudent(session, studentId, params));
  }
  return jsonResponse(errorResponse(ERROR_CODES.VALIDATION_ERROR,
    'student_id atau (class_id & month) wajib diisi', {}, HTTP_STATUS.BAD_REQUEST));
};
AttendanceHandlers.roster = function (session, id, params) {
  var classId = params.class_id || id;
  if (!classId) return jsonResponse(errorResponse(ERROR_CODES.VALIDATION_ERROR, 'class_id wajib diisi', {}, HTTP_STATUS.BAD_REQUEST));
  return jsonResponse(AttendanceService.getStudentsForClass(session, classId, params.date));
};