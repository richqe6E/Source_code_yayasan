/**
 * @fileoverview Apps Script backend - Teachers service.
 * Handle CRUD data guru + assignment kelas.
 *
 * @version 1.0
 * @date 2026-09-12
 */

var TeacherService = (function () {

  /**
   * List teachers dengan filter.
   */
  function list(session, params) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var accessible = getSheetData(SHEET_NAMES.TEACHERS);

    if (params.search) {
      var q = String(params.search).toLowerCase();
      accessible = accessible.filter(function (t) {
        return (t.full_name && t.full_name.toLowerCase().indexOf(q) !== -1) ||
               (t.nip && String(t.nip).toLowerCase().indexOf(q) !== -1) ||
               (t.email && String(t.email).toLowerCase().indexOf(q) !== -1);
      });
    }
    if (params.school_id) {
      accessible = accessible.filter(function (t) { return t.school_id === params.school_id; });
    }
    if (params.position) {
      accessible = accessible.filter(function (t) { return t.position === params.position; });
    }
    if (params.status) {
      accessible = accessible.filter(function (t) { return t.status === params.status; });
    }

    var page = parseInt(params.page) || 1;
    var pageSize = parseInt(params.pageSize) || 50;
    var total = accessible.length;
    var totalPages = Math.ceil(total / pageSize);
    var start = (page - 1) * pageSize;
    var items = accessible.slice(start, start + pageSize);

    // Enrich dengan school info
    var enriched = items.map(function (t) {
      var school = t.school_id ? getById(SHEET_NAMES.SCHOOLS, t.school_id) : null;
      return Object.assign({}, t, { school_name: school ? school.name : '' });
    });

    ActivityLogService.log({
      userId: session.userId,
      action: 'read',
      module: 'teacher',
      description: 'List ' + items.length + ' guru'
    });

    return successResponse({
      items: enriched,
      pagination: { page: page, pageSize: pageSize, total: total, totalPages: totalPages }
    });
  }

  /**
   * Get teacher detail + kelas yang diajar.
   */
  // Hindari nama `getById` agar tidak membayungi helper global Utils.getById(sheet, id).
  function getTeacher(session, teacherId) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var teacher = getById(SHEET_NAMES.TEACHERS, teacherId);
    if (!teacher) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Guru tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    var assignments = findWhere(SHEET_NAMES.TEACHER_CLASS_ASSIGNMENTS, {
      teacher_id: teacherId,
      status: 'active'
    });
    var classIds = assignments.map(function (a) { return a.class_id; });
    var classes = classIds.map(function (cid) { return getById(SHEET_NAMES.CLASSES, cid); }).filter(Boolean);

    var school = teacher.school_id ? getById(SHEET_NAMES.SCHOOLS, teacher.school_id) : null;

    ActivityLogService.log({
      userId: session.userId,
      action: 'read',
      module: 'teacher',
      entityId: teacherId,
      description: 'Lihat detail guru ' + teacher.full_name
    });

    return successResponse({
      teacher: teacher,
      school: school,
      classes: classes
    });
  }

  /**
   * Create teacher baru.
   * Opsional: sekalian buat user account (jika flag create_user_account = true).
   */
  function create(session, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    data.school_id = data.school_id || 'SCH-001';
    data.position = data.position || 'guru_kelas';
    data.gender = data.gender || 'P';
    if (data.is_active !== undefined && !data.status) {
      data.status = data.is_active ? 'active' : 'inactive';
    }

    var validation = validateRequired(data, ['full_name', 'gender', 'school_id', 'position']);
    if (!validation.valid) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Field wajib belum diisi',
        { missing: validation.missing }, HTTP_STATUS.BAD_REQUEST);
    }

    if (!isValidEnum(data.gender, [STATUS.GENDER_L, STATUS.GENDER_P])) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Gender harus L atau P', {}, HTTP_STATUS.BAD_REQUEST);
    }

    if (!isValidEnum(data.position, TEACHER_POSITIONS)) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR,
        'Position harus salah satu: ' + TEACHER_POSITIONS.join(', '),
        {}, HTTP_STATUS.BAD_REQUEST);
    }

    if (data.email && !isValidEmail(data.email)) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Format email tidak valid', {}, HTTP_STATUS.BAD_REQUEST);
    }
    if (data.phone && !isValidPhoneId(data.phone)) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Format nomor HP tidak valid', {}, HTTP_STATUS.BAD_REQUEST);
    }

    data.id = generateId(ID_PREFIXES.TEACHER);
    data.status = data.status || 'active';

    var created = insertRow(SHEET_NAMES.TEACHERS, data, session.userId);

    // Opsional: auto-create user account untuk guru
    if (data.create_user_account && data.email) {
      var userData = createUserForTeacher(created, data.email);
      if (userData) {
        created.user_account = userData;
      }
    }

    ActivityLogService.log({
      userId: session.userId,
      action: 'create',
      module: 'teacher',
      entityType: 'teacher',
      entityId: created.id,
      description: 'Buat data guru: ' + created.full_name,
      newValues: created
    });

    return successResponse({ teacher: created });
  }

  /**
   * Update teacher.
   */
  function update(session, teacherId, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var existing = getById(SHEET_NAMES.TEACHERS, teacherId);
    if (!existing) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Guru tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    if (data.email && !isValidEmail(data.email)) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Format email tidak valid', {}, HTTP_STATUS.BAD_REQUEST);
    }

    var updated = updateRow(SHEET_NAMES.TEACHERS, teacherId, data, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'update',
      module: 'teacher',
      entityId: teacherId,
      description: 'Update data guru ' + existing.full_name,
      oldValues: existing,
      newValues: updated
    });

    return successResponse({ teacher: updated });
  }

  /**
   * Soft delete teacher.
   */
  function remove(session, teacherId) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var existing = getById(SHEET_NAMES.TEACHERS, teacherId);
    if (!existing) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Guru tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    // Nonaktifkan teacher jika masih punya assignment aktif
    var activeAssign = findWhere(SHEET_NAMES.TEACHER_CLASS_ASSIGNMENTS, {
      teacher_id: teacherId,
      status: 'active'
    });
    if (activeAssign.length > 0) {
      var deactivated = updateRow(SHEET_NAMES.TEACHERS, teacherId, { status: 'inactive' }, session.userId);
      ActivityLogService.log({
        userId: session.userId,
        action: 'update',
        module: 'teacher',
        entityId: teacherId,
        description: 'Nonaktifkan guru ' + existing.full_name + ' (masih mengajar kelas aktif)',
        newValues: { status: 'inactive' }
      });
      return successResponse({ teacher: deactivated, message: 'Guru dinonaktifkan' });
    }

    softDeleteRow(SHEET_NAMES.TEACHERS, teacherId, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'delete',
      module: 'teacher',
      entityId: teacherId,
      description: 'Soft delete guru ' + existing.full_name
    });

    return successResponse({ message: 'Guru berhasil dihapus' });
  }

  // --------------------------------------------------------------------------
  // TEACHER CLASS ASSIGNMENTS
  // --------------------------------------------------------------------------

  /**
   * Tugaskan guru ke kelas.
   * Body: { teacher_id, class_id, subject_id, role }
   */
  function assignToClass(session, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var validation = validateRequired(data, ['teacher_id', 'class_id']);
    if (!validation.valid) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Field wajib belum diisi',
        { missing: validation.missing }, HTTP_STATUS.BAD_REQUEST);
    }

    var teacher = getById(SHEET_NAMES.TEACHERS, data.teacher_id);
    if (!teacher) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Guru tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }
    var cls = getById(SHEET_NAMES.CLASSES, data.class_id);
    if (!cls) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Kelas tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    // Cek duplicate
    var existing = findWhere(SHEET_NAMES.TEACHER_CLASS_ASSIGNMENTS, {
      teacher_id: data.teacher_id,
      class_id: data.class_id,
      status: 'active'
    });
    if (existing.length > 0) {
      return errorResponse('DUPLICATE_ENTRY', 'Guru sudah mengajar kelas ini',
        {}, HTTP_STATUS.CONFLICT);
    }

    var assignData = {
      id: generateId('TCA'),
      teacher_id: data.teacher_id,
      class_id: data.class_id,
      subject_id: data.subject_id || '',
      role: data.role || 'guru_kelas',
      status: 'active'
    };

    var created = insertRow(SHEET_NAMES.TEACHER_CLASS_ASSIGNMENTS, assignData, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'create',
      module: 'teacher',
      entityType: 'teacher_class_assignment',
      entityId: created.id,
      description: 'Tugaskan ' + teacher.full_name + ' ke kelas ' + cls.name
    });

    return successResponse({ assignment: created });
  }

  /**
   * Putus assignment guru dari kelas.
   */
  function unassignFromClass(session, assignmentId) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var assign = getById(SHEET_NAMES.TEACHER_CLASS_ASSIGNMENTS, assignmentId);
    if (!assign) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Assignment tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    softDeleteRow(SHEET_NAMES.TEACHER_CLASS_ASSIGNMENTS, assignmentId, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'delete',
      module: 'teacher',
      entityId: assignmentId,
      description: 'Putus assignment guru dari kelas'
    });

    return successResponse({ message: 'Assignment diputus' });
  }

  /**
   * Get kelas yang diajar guru tertentu.
   */
  function getClassesOfTeacher(session, teacherId) {
    var assignments = findWhere(SHEET_NAMES.TEACHER_CLASS_ASSIGNMENTS, {
      teacher_id: teacherId,
      status: 'active'
    });
    var classes = assignments.map(function (a) {
      return getById(SHEET_NAMES.CLASSES, a.class_id);
    }).filter(Boolean);

    return successResponse({ items: classes });
  }

  // --------------------------------------------------------------------------
  // INTERNAL HELPERS
  // --------------------------------------------------------------------------

  function createUserForTeacher(teacher, email) {
    var existing = findWhere(SHEET_NAMES.USERS, { email: email.toLowerCase() });
    if (existing.length > 0) {
      updateRow(SHEET_NAMES.USERS, existing[0].id, {
        linked_entity_id: teacher.id,
        linked_entity_type: 'teacher'
      }, SYSTEM_USER_ID);
      return { user_id: existing[0].id, reused: true };
    }

    var userId = generateId(ID_PREFIXES.USER);
    var tempPassword = randomString(12);

    var teacherRole = findWhere(SHEET_NAMES.ROLES, { code: ROLE_CODES.GURU })[0];

    insertRow(SHEET_NAMES.USERS, {
      id: userId,
      email: email.toLowerCase(),
      password_hash: hashPassword(tempPassword),
      full_name: teacher.full_name,
      phone: teacher.phone || '',
      role_id: teacherRole ? teacherRole.id : '',
      status: STATUS.USER_ACTIVE,
      linked_entity_id: teacher.id,
      linked_entity_type: 'teacher',
      email_verified: 'FALSE'
    }, SYSTEM_USER_ID);

    return { user_id: userId, temp_password: tempPassword, email: email };
  }

  function getMe(session) {
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
    var classes = assignments.map(function (a) {
      return getById(SHEET_NAMES.CLASSES, a.class_id);
    }).filter(Boolean);

    var classIds = classes.map(function (c) { return c.id; });
    var allStudents = getSheetData(SHEET_NAMES.STUDENTS);
    var teacherStudents = allStudents.filter(function (s) {
      return s.current_class_id && classIds.indexOf(s.current_class_id) !== -1;
    });

    return successResponse({ teacher: teacher, classes: classes, students: teacherStudents });
  }

  return {
    list: list,
    getById: getTeacher,
    create: create,
    update: update,
    remove: remove,
    assignToClass: assignToClass,
    unassignFromClass: unassignFromClass,
    getClassesOfTeacher: getClassesOfTeacher,
    me: getMe
  };

})();

// Register handlers
TeacherHandlers.list = function (session, id, params) {
  return jsonResponse(TeacherService.list(session, params));
};
TeacherHandlers.get = function (session, id, params) {
  return jsonResponse(TeacherService.getById(session, id || params.id));
};
TeacherHandlers.create = function (session, id, params) {
  return jsonResponse(TeacherService.create(session, params));
};
TeacherHandlers.update = function (session, id, params) {
  return jsonResponse(TeacherService.update(session, id || params.id, params));
};
TeacherHandlers.remove = function (session, id, params) {
  return jsonResponse(TeacherService.remove(session, id || params.id));
};
TeacherHandlers.assign = function (session, id, params) {
  return jsonResponse(TeacherService.assignToClass(session, params));
};
TeacherHandlers.unassign = function (session, id, params) {
  return jsonResponse(TeacherService.unassignFromClass(session, params.assignment_id || id));
};
TeacherHandlers.classes = function (session, id, params) {
  return jsonResponse(TeacherService.getClassesOfTeacher(session, id));
};
TeacherHandlers.me = function (session, id, params) {
  return jsonResponse(TeacherService.me(session));
};