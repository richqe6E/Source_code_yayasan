/**
 * @fileoverview Apps Script backend - Classes service.
 * Handle CRUD kelas + academic year + schools.
 *
 * @version 1.0
 * @date 2026-09-12
 */

var ClassService = (function () {

  /**
   * List kelas dengan filter.
   * Admin: semua kelas. Guru: hanya kelas yang diajar.
   */
  function list(session, params) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU, ROLE_CODES.GURU]);
    if (deny) return deny;

    var all = getSheetData(SHEET_NAMES.CLASSES);

    // Filter: guru hanya boleh lihat kelas binaannya
    var accessible = all;
    if (Permissions.isGuru(session)) {
      var teacherId = session.user.linked_entity_id;
      var assignments = findWhere(SHEET_NAMES.TEACHER_CLASS_ASSIGNMENTS, {
        teacher_id: teacherId,
        status: 'active'
      });
      var classIds = assignments.map(function (a) { return a.class_id; });
      accessible = all.filter(function (c) { return classIds.indexOf(c.id) !== -1; });
    }

    if (params.school_id) {
      accessible = accessible.filter(function (c) { return c.school_id === params.school_id; });
    }
    if (params.academic_year_id) {
      accessible = accessible.filter(function (c) { return c.academic_year_id === params.academic_year_id; });
    }
    if (params.level) {
      accessible = accessible.filter(function (c) { return c.level === params.level; });
    }
    if (params.status) {
      accessible = accessible.filter(function (c) { return c.status === params.status; });
    }

    var page = parseInt(params.page) || 1;
    var pageSize = parseInt(params.pageSize) || 50;
    var total = accessible.length;
    var totalPages = Math.ceil(total / pageSize);
    var start = (page - 1) * pageSize;
    var items = accessible.slice(start, start + pageSize);

    // Enrich dengan school, homeroom teacher, dan jumlah siswa
    var enriched = items.map(function (c) {
      var school = c.school_id ? getById(SHEET_NAMES.SCHOOLS, c.school_id) : null;
      var homeroom = c.homeroom_teacher_id ? getById(SHEET_NAMES.TEACHERS, c.homeroom_teacher_id) : null;
      var studentCount = findWhere(SHEET_NAMES.STUDENTS, {
        current_class_id: c.id
      }).length;
      return Object.assign({}, c, {
        school_name: school ? school.name : '',
        homeroom_name: homeroom ? homeroom.full_name : '',
        student_count: studentCount
      });
    });

    ActivityLogService.log({
      userId: session.userId,
      action: 'read',
      module: 'class',
      description: 'List ' + items.length + ' kelas'
    });

    return successResponse({
      items: enriched,
      pagination: { page: page, pageSize: pageSize, total: total, totalPages: totalPages }
    });
  }

  /**
   * Get class detail + daftar siswa + guru pengampu.
   */
  // Hindari nama `getById` agar tidak membayungi helper global Utils.getById(sheet, id).
  function getClass(session, classId) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU, ROLE_CODES.GURU]);
    if (deny) return deny;

    // Guru: hanya boleh akses kelas binaannya
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

    var cls = getById(SHEET_NAMES.CLASSES, classId);
    if (!cls) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Kelas tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    var students = findWhere(SHEET_NAMES.STUDENTS, { current_class_id: classId, status: 'active' });
    var assignments = findWhere(SHEET_NAMES.TEACHER_CLASS_ASSIGNMENTS, {
      class_id: classId,
      status: 'active'
    });
    var teachers = assignments.map(function (a) {
      var t = getById(SHEET_NAMES.TEACHERS, a.teacher_id);
      return t ? Object.assign({}, t, { role: a.role }) : null;
    }).filter(Boolean);
    var homeroom = cls.homeroom_teacher_id ? getById(SHEET_NAMES.TEACHERS, cls.homeroom_teacher_id) : null;
    var school = cls.school_id ? getById(SHEET_NAMES.SCHOOLS, cls.school_id) : null;
    var academicYear = cls.academic_year_id ? getById(SHEET_NAMES.ACADEMIC_YEARS, cls.academic_year_id) : null;

    return successResponse({
      class: cls,
      school: school,
      academic_year: academicYear,
      homeroom: homeroom,
      teachers: teachers,
      students: students,
      student_count: students.length
    });
  }

  /**
   * Create kelas baru.
   */
  function create(session, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    data.school_id = data.school_id || 'SCH-001';
    data.academic_year_id = data.academic_year_id || 'AY-2026';
    data.level = data.level || (data.grade_level ? String(data.grade_level) : 'PAUD');

    var validation = validateRequired(data, ['school_id', 'academic_year_id', 'name', 'level']);
    if (!validation.valid) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Field wajib belum diisi',
        { missing: validation.missing }, HTTP_STATUS.BAD_REQUEST);
    }

    if (!isValidEnum(data.level, CLASS_LEVELS)) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR,
        'Level harus salah satu: ' + CLASS_LEVELS.join(', '),
        {}, HTTP_STATUS.BAD_REQUEST);
    }

    if (data.homeroom_teacher_id) {
      var teacher = getById(SHEET_NAMES.TEACHERS, data.homeroom_teacher_id);
      if (!teacher) {
        return errorResponse(ERROR_CODES.NOT_FOUND, 'Guru wali tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
      }
    }

    data.id = generateId(ID_PREFIXES.CLASS);
    data.capacity = data.capacity || 25;
    data.status = data.status || 'active';

    var created = insertRow(SHEET_NAMES.CLASSES, data, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'create',
      module: 'class',
      entityType: 'class',
      entityId: created.id,
      description: 'Buat kelas: ' + created.name,
      newValues: created
    });

    return successResponse({ class: created });
  }

  /**
   * Update kelas.
   */
  function update(session, classId, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var existing = getById(SHEET_NAMES.CLASSES, classId);
    if (!existing) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Kelas tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    var updated = updateRow(SHEET_NAMES.CLASSES, classId, data, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'update',
      module: 'class',
      entityId: classId,
      description: 'Update kelas ' + existing.name,
      oldValues: existing,
      newValues: updated
    });

    return successResponse({ class: updated });
  }

  /**
   * Soft delete kelas.
   */
  function remove(session, classId) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var existing = getById(SHEET_NAMES.CLASSES, classId);
    if (!existing) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Kelas tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    // Cek apakah masih ada siswa aktif di kelas ini
    var activeStudents = findWhere(SHEET_NAMES.STUDENTS, {
      current_class_id: classId,
      status: 'active'
    });
    if (activeStudents.length > 0) {
      return errorResponse('INVALID_STATE',
        'Kelas masih memiliki ' + activeStudents.length + ' siswa aktif. Pindahkan dulu.',
        { active_students: activeStudents.length },
        HTTP_STATUS.FORBIDDEN);
    }

    softDeleteRow(SHEET_NAMES.CLASSES, classId, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'delete',
      module: 'class',
      entityId: classId,
      description: 'Soft delete kelas ' + existing.name
    });

    return successResponse({ message: 'Kelas berhasil dihapus' });
  }

  /**
   * Get students in a class.
   */
  function getStudents(session, classId, params) {
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
      status: params.status || 'active'
    });
    return successResponse({ items: students });
  }

  return {
    list: list,
    getById: getClass,
    create: create,
    update: update,
    remove: remove,
    getStudents: getStudents
  };

})();

// Register handlers
ClassHandlers.list = function (session, id, params) {
  return jsonResponse(ClassService.list(session, params));
};
ClassHandlers.get = function (session, id, params) {
  return jsonResponse(ClassService.getById(session, id || params.id));
};
ClassHandlers.create = function (session, id, params) {
  return jsonResponse(ClassService.create(session, params));
};
ClassHandlers.update = function (session, id, params) {
  return jsonResponse(ClassService.update(session, id || params.id, params));
};
ClassHandlers.remove = function (session, id, params) {
  return jsonResponse(ClassService.remove(session, id || params.id));
};
ClassHandlers.delete = function (session, id, params) {
  var targetId = id || params.id;
  if (!targetId) return jsonResponse(errorResponse(ERROR_CODES.VALIDATION_ERROR, 'id wajib diisi', {}, HTTP_STATUS.BAD_REQUEST));
  return jsonResponse(ClassService.remove(session, targetId));
};
ClassHandlers.students = function (session, id, params) {
  return jsonResponse(ClassService.getStudents(session, id, params));
};

// ============================================================================
// ACADEMIC YEAR SERVICE
// ============================================================================

var AcademicYearService = (function () {

  function list(session, params) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU, ROLE_CODES.GURU]);
    if (deny) return deny;

    var items = getSheetData(SHEET_NAMES.ACADEMIC_YEARS);
    if (params.is_active) {
      items = items.filter(function (a) { return a.is_active === params.is_active; });
    }
    return successResponse({ items: items });
  }

  function getActive() {
    var active = findWhere(SHEET_NAMES.ACADEMIC_YEARS, { is_active: 'TRUE' })[0];
    return successResponse({ academic_year: active || null });
  }

  function create(session, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var validation = validateRequired(data, ['name', 'start_date', 'end_date']);
    if (!validation.valid) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Field wajib belum diisi',
        { missing: validation.missing }, HTTP_STATUS.BAD_REQUEST);
    }

    if (!isValidDate(data.start_date) || !isValidDate(data.end_date)) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Format tanggal harus YYYY-MM-DD', {}, HTTP_STATUS.BAD_REQUEST);
    }

    data.id = generateId(ID_PREFIXES.ACADEMIC_YEAR);
    data.is_active = data.is_active || 'FALSE';

    // Jika set is_active=TRUE, nonaktifkan yang lain (atomic switch)
    if (data.is_active === 'TRUE') {
      var existingActive = findWhere(SHEET_NAMES.ACADEMIC_YEARS, { is_active: 'TRUE' });
      existingActive.forEach(function (ay) {
        updateRow(SHEET_NAMES.ACADEMIC_YEARS, ay.id, { is_active: 'FALSE' }, session.userId);
      });
    }

    var created = insertRow(SHEET_NAMES.ACADEMIC_YEARS, data, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'create',
      module: 'academic_year',
      entityId: created.id,
      description: 'Buat tahun ajaran: ' + created.name
    });

    return successResponse({ academic_year: created });
  }

  function setActive(session, ayId) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var existing = findWhere(SHEET_NAMES.ACADEMIC_YEARS, { is_active: 'TRUE' });
    existing.forEach(function (ay) {
      updateRow(SHEET_NAMES.ACADEMIC_YEARS, ay.id, { is_active: 'FALSE' }, session.userId);
    });

    var updated = updateRow(SHEET_NAMES.ACADEMIC_YEARS, ayId, { is_active: 'TRUE' }, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'update',
      module: 'academic_year',
      entityId: ayId,
      description: 'Set tahun ajaran aktif: ' + updated.name
    });

    return successResponse({ academic_year: updated });
  }

  return {
    list: list,
    getActive: getActive,
    create: create,
    setActive: setActive
  };

})();

// Register handlers
AcademicYearHandlers.list = function (session, id, params) {
  return jsonResponse(AcademicYearService.list(session, params));
};
AcademicYearHandlers.active = function (session, id, params) {
  return jsonResponse(AcademicYearService.getActive());
};
AcademicYearHandlers.create = function (session, id, params) {
  return jsonResponse(AcademicYearService.create(session, params));
};
AcademicYearHandlers.setActive = function (session, id, params) {
  return jsonResponse(AcademicYearService.setActive(session, id));
};