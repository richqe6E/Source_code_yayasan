/**
 * @fileoverview Apps Script backend - Students service.
 * Handle CRUD students + relasi orang tua + enrollment.
 *
 * @version 1.0
 * @date 2026-09-12
 */

var StudentService = (function () {

  /**
   * List students dengan filter & pagination.
   * Auto-filter berdasarkan role:
   * - Admin/Super Admin: semua
   * - Guru: hanya siswa di kelas yang diajar
   * - Orang tua: hanya anaknya
   */
  function list(session, params) {
    var allStudents = getSheetData(SHEET_NAMES.STUDENTS);

    // Apply role-based filtering
    var accessible = [];
    if (Permissions.isSuperAdmin(session) || Permissions.isAdminTU(session)) {
      accessible = allStudents;
    } else if (Permissions.isGuru(session)) {
      var teacherId = session.user.linked_entity_id;
      var assignments = findWhere(SHEET_NAMES.TEACHER_CLASS_ASSIGNMENTS, {
        teacher_id: teacherId,
        status: 'active'
      });
      var classIds = assignments.map(function (a) { return a.class_id; });

      accessible = allStudents.filter(function (s) {
        return classIds.indexOf(s.current_class_id) !== -1;
      });
    } else if (Permissions.isOrangTua(session)) {
      var parentId = session.user.linked_entity_id;
      var relations = findWhere(SHEET_NAMES.PARENT_STUDENT_RELATIONS, {
        parent_id: parentId
      });
      var studentIds = relations.map(function (r) { return r.student_id; });

      accessible = allStudents.filter(function (s) {
        return studentIds.indexOf(s.id) !== -1;
      });
    }

    // Apply filters
    if (params.class_id) {
      accessible = accessible.filter(function (s) { return s.current_class_id === params.class_id; });
    }
    if (params.status) {
      accessible = accessible.filter(function (s) { return s.status === params.status; });
    }
    if (params.search) {
      var q = String(params.search).toLowerCase();
      accessible = accessible.filter(function (s) {
        return (s.full_name && s.full_name.toLowerCase().indexOf(q) !== -1) ||
               (s.nis && String(s.nis).toLowerCase().indexOf(q) !== -1);
      });
    }

    // Pagination
    var page = parseInt(params.page) || 1;
    var pageSize = parseInt(params.pageSize) || 50;
    var total = accessible.length;
    var totalPages = Math.ceil(total / pageSize);
    var start = (page - 1) * pageSize;
    var items = accessible.slice(start, start + pageSize);

    ActivityLogService.log({
      userId: session.userId,
      action: 'read',
      module: 'student',
      description: 'List ' + items.length + ' students (filter)',
      entityType: 'student'
    });

    return successResponse({
      items: items,
      pagination: {
        page: page,
        pageSize: pageSize,
        total: total,
        totalPages: totalPages
      }
    });
  }

  /**
   * Get single student by ID.
   */
  // Hindari nama `getById` agar tidak membayungi helper global Utils.getById(sheet, id).
  function getStudent(session, studentId) {
    if (!Permissions.canAccessStudent(session, studentId)) {
      ActivityLogService.log({
        userId: session.userId,
        action: 'read',
        module: 'student',
        entityId: studentId,
        description: 'Akses ditolak ke student ' + studentId,
        status: LOG_STATUS.FAILED,
        errorMessage: 'IDOR attempt blocked'
      });
      return errorResponse(
        ERROR_CODES.FORBIDDEN,
        'Anda tidak memiliki akses ke data siswa ini',
        {},
        HTTP_STATUS.FORBIDDEN
      );
    }

    var student = getById(SHEET_NAMES.STUDENTS, studentId);
    if (!student) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Siswa tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    // Get parents (jika ada akses)
    var parentRelations = findWhere(SHEET_NAMES.PARENT_STUDENT_RELATIONS, {
      student_id: studentId
    });
    var parentIds = parentRelations.map(function (r) { return r.parent_id; });
    var parents = parentIds.map(function (pid) { return getById(SHEET_NAMES.PARENTS, pid); }).filter(Boolean);

    // Get class info
    var classInfo = student.current_class_id ? getById(SHEET_NAMES.CLASSES, student.current_class_id) : null;

    ActivityLogService.log({
      userId: session.userId,
      action: 'read',
      module: 'student',
      entityId: studentId,
      description: 'Lihat detail siswa ' + student.full_name
    });

    return successResponse({
      student: student,
      parents: parents,
      class: classInfo
    });
  }

  /**
   * Create new student.
   * Auto-generate NIS jika tidak diisi.
   */
  function create(session, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    // Fallback defaults jika kosong
    data.birth_place = data.birth_place || '-';

    // Validasi
    var validation = validateRequired(data, ['full_name', 'gender', 'birth_place', 'birth_date']);
    if (!validation.valid) {
      return errorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Field wajib belum diisi',
        { missing: validation.missing },
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (!isValidEnum(data.gender, [STATUS.GENDER_L, STATUS.GENDER_P])) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Gender harus L atau P', {}, HTTP_STATUS.BAD_REQUEST);
    }

    if (!isValidDate(data.birth_date)) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Format birth_date harus YYYY-MM-DD', {}, HTTP_STATUS.BAD_REQUEST);
    }

    // Auto-generate ID
    data.id = generateId(ID_PREFIXES.STUDENT);

    // Auto-generate NIS jika kosong
    if (!data.nis) {
      var year = new Date().getFullYear();
      data.nis = year + String(Math.floor(Math.random() * 99999)).padStart(5, '0');
    }

    data.status = data.status || STATUS.STUDENT_ACTIVE;
    data.enrollment_date = data.enrollment_date || todayDate();

    var created = insertRow(SHEET_NAMES.STUDENTS, data, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'create',
      module: 'student',
      entityType: 'student',
      entityId: created.id,
      description: 'Buat siswa baru: ' + created.full_name,
      newValues: created
    });

    return successResponse({ student: created });
  }

  /**
   * Update student.
   */
  function update(session, studentId, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var existing = getById(SHEET_NAMES.STUDENTS, studentId);
    if (!existing) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Siswa tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    var updated = updateRow(SHEET_NAMES.STUDENTS, studentId, data, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'update',
      module: 'student',
      entityId: studentId,
      description: 'Update siswa ' + existing.full_name,
      oldValues: existing,
      newValues: updated
    });

    return successResponse({ student: updated });
  }

  /**
   * Soft delete student.
   */
  function remove(session, studentId) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var existing = getById(SHEET_NAMES.STUDENTS, studentId);
    if (!existing) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Siswa tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    softDeleteRow(SHEET_NAMES.STUDENTS, studentId, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'delete',
      module: 'student',
      entityId: studentId,
      description: 'Soft delete siswa ' + existing.full_name,
      oldValues: existing
    });

    return successResponse({ message: 'Siswa berhasil dihapus' });
  }

  /**
   * List students for the current logged-in guru (alias used by guru portal).
   * Returns the same shape as list() but is role-aware.
   */
  function listMine(session, params) {
    return list(session, params);
  }

  /**
   * Get children of current parent (untuk portal orang tua).
   */
  function getMyChildren(session) {
    if (!Permissions.isOrangTua(session)) {
      return errorResponse(ERROR_CODES.FORBIDDEN, 'Hanya untuk orang tua', {}, HTTP_STATUS.FORBIDDEN);
    }

    var parent = getById(SHEET_NAMES.PARENTS, session.user.linked_entity_id);
    if (!parent) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Data orang tua tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    var relations = findWhere(SHEET_NAMES.PARENT_STUDENT_RELATIONS, { parent_id: parent.id });
    var studentIds = relations.map(function (r) { return r.student_id; });
    var students = studentIds.map(function (sid) {
      return getById(SHEET_NAMES.STUDENTS, sid);
    }).filter(Boolean);

    // Enrich with class info
    var enriched = students.map(function (s) {
      var classInfo = s.current_class_id ? getById(SHEET_NAMES.CLASSES, s.current_class_id) : null;
      var school = classInfo ? getById(SHEET_NAMES.SCHOOLS, classInfo.school_id) : null;
      return {
        student: s,
        class: classInfo,
        school: school
      };
    });

    return successResponse({ children: enriched });
  }

  /**
   * Get development records of a student.
   */
  function getDevelopment(session, studentId) {
    if (!Permissions.canAccessStudent(session, studentId)) {
      return errorResponse(ERROR_CODES.FORBIDDEN, 'Tidak punya akses', {}, HTTP_STATUS.FORBIDDEN);
    }

    var records = findWhere(SHEET_NAMES.STUDENT_DEVELOPMENT, { student_id: studentId });
    records.sort(function (a, b) { return new Date(b.recorded_date) - new Date(a.recorded_date); });

    return successResponse({ items: records });
  }

  /**
   * Get attendance of a student.
   */
  function getAttendance(session, studentId, params) {
    if (!Permissions.canAccessStudent(session, studentId)) {
      return errorResponse(ERROR_CODES.FORBIDDEN, 'Tidak punya akses', {}, HTTP_STATUS.FORBIDDEN);
    }

    var records = findWhere(SHEET_NAMES.ATTENDANCE, { student_id: studentId });

    // Date range filter
    if (params.from_date) {
      records = records.filter(function (r) { return r.date >= params.from_date; });
    }
    if (params.to_date) {
      records = records.filter(function (r) { return r.date <= params.to_date; });
    }

    records.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

    // Calculate summary
    var summary = { hadir: 0, izin: 0, sakit: 0, alpha: 0, total: records.length };
    records.forEach(function (r) {
      if (summary[r.status] !== undefined) summary[r.status]++;
    });

    return successResponse({
      items: records,
      summary: summary
    });
  }

  return {
    list: list,
    listMine: listMine,
    getById: getStudent,
    create: create,
    update: update,
    remove: remove,
    getMyChildren: getMyChildren,
    getDevelopment: getDevelopment,
    getAttendance: getAttendance
  };

})();

// Register handlers ke router
StudentHandlers.list = function (session, id, params) {
  return jsonResponse(StudentService.list(session, params));
};
StudentHandlers.list_mine = function (session, id, params) {
  return jsonResponse(StudentService.listMine(session, params));
};
StudentHandlers.get = function (session, id, params) {
  return jsonResponse(StudentService.getById(session, id || params.id));
};
StudentHandlers.create = function (session, id, params) {
  return jsonResponse(StudentService.create(session, params));
};
StudentHandlers.update = function (session, id, params) {
  return jsonResponse(StudentService.update(session, id || params.id, params));
};
StudentHandlers.delete = function (session, id, params) {
  return jsonResponse(StudentService.remove(session, id || params.id));
};
StudentHandlers.remove = function (session, id, params) {
  return jsonResponse(StudentService.remove(session, id || params.id));
};
StudentHandlers.myChildren = function (session, id, params) {
  return jsonResponse(StudentService.getMyChildren(session));
};
StudentHandlers.development = function (session, id, params) {
  return jsonResponse(StudentService.getDevelopment(session, id));
};
StudentHandlers.attendance = function (session, id, params) {
  return jsonResponse(StudentService.getAttendance(session, id, params));
};