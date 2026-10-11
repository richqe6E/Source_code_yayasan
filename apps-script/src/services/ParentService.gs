/**
 * @fileoverview Apps Script backend - Parents service.
 * Handle CRUD data orang tua + relasi parent-student.
 *
 * @version 1.0
 * @date 2026-09-12
 */

var ParentService = (function () {

  /**
   * List parents dengan filter & pagination.
   * Admin TU/Super Admin: semua orang tua.
   * Parent sendiri: hanya data sendiri (tidak dipanggil, gunakan /students/myChildren).
   */
  function list(session, params) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var accessible = getSheetData(SHEET_NAMES.PARENTS);

    if (params.search) {
      var q = String(params.search).toLowerCase();
      accessible = accessible.filter(function (p) {
        return (p.full_name && p.full_name.toLowerCase().indexOf(q) !== -1) ||
               (p.phone && String(p.phone).toLowerCase().indexOf(q) !== -1) ||
               (p.email && String(p.email).toLowerCase().indexOf(q) !== -1) ||
               (p.nik && String(p.nik).toLowerCase().indexOf(q) !== -1);
      });
    }
    if (params.relation) {
      accessible = accessible.filter(function (p) { return p.relation === params.relation; });
    }
    if (params.status) {
      accessible = accessible.filter(function (p) { return p.status === params.status; });
    }

    var page = parseInt(params.page) || 1;
    var pageSize = parseInt(params.pageSize) || 50;
    var total = accessible.length;
    var totalPages = Math.ceil(total / pageSize);
    var start = (page - 1) * pageSize;
    var items = accessible.slice(start, start + pageSize);

    ActivityLogService.log({
      userId: session.userId,
      action: 'read',
      module: 'parent',
      description: 'List ' + items.length + ' orang tua'
    });

    return successResponse({
      items: items,
      pagination: { page: page, pageSize: pageSize, total: total, totalPages: totalPages }
    });
  }

  /**
   * Get single parent detail, termasuk daftar anak.
   */
  // Hindari nama `getById` agar tidak membayungi helper global Utils.getById(sheet, id).
  function getParent(session, parentId) {
    var isOwnParent = (session && session.user && session.user.linked_entity_id && session.user.linked_entity_id === parentId);
    var isAdmin = Permissions.isSuperAdmin(session) || Permissions.isAdminTU(session);
    var isOwnOrtu = Permissions.isOrangTua(session) && isOwnParent;
    if (!isAdmin && !isOwnOrtu) {
      return errorResponse(ERROR_CODES.FORBIDDEN, 'Tidak punya akses', {}, HTTP_STATUS.FORBIDDEN);
    }

    var parent = getById(SHEET_NAMES.PARENTS, parentId);
    if (!parent) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Orang tua tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    var relations = findWhere(SHEET_NAMES.PARENT_STUDENT_RELATIONS, { parent_id: parentId });
    var studentIds = relations.map(function (r) { return r.student_id; });
    var students = studentIds.map(function (sid) { return getById(SHEET_NAMES.STUDENTS, sid); }).filter(Boolean);

    ActivityLogService.log({
      userId: session.userId,
      action: 'read',
      module: 'parent',
      entityId: parentId,
      description: 'Lihat detail orang tua ' + parent.full_name
    });

    return successResponse({
      parent: parent,
      children: students,
      relations: relations
    });
  }

  /**
   * Create parent baru (biasanya dipanggil oleh admin saat setup akun ortu,
   * atau otomatis dari PPDB convert).
   */
  function create(session, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var validation = validateRequired(data, ['full_name', 'relation']);
    if (!validation.valid) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Field wajib belum diisi',
        { missing: validation.missing }, HTTP_STATUS.BAD_REQUEST);
    }

    if (!isValidEnum(data.relation, RELATION_TYPES)) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR,
        'Relation harus salah satu dari: ' + RELATION_TYPES.join(', '),
        {}, HTTP_STATUS.BAD_REQUEST);
    }

    if (data.email && !isValidEmail(data.email)) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Format email tidak valid', {}, HTTP_STATUS.BAD_REQUEST);
    }

    if (data.phone && !isValidPhoneId(data.phone)) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Format nomor HP tidak valid', {}, HTTP_STATUS.BAD_REQUEST);
    }

    if (data.nik && !isValidNik(data.nik)) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Format NIK tidak valid (harus 16 digit)', {}, HTTP_STATUS.BAD_REQUEST);
    }

    // Cek duplikasi email
    if (data.email) {
      var existingEmail = findWhere(SHEET_NAMES.PARENTS, { email: data.email });
      if (existingEmail.length > 0) {
        return errorResponse(ERROR_CODES.DUPLICATE_ENTRY, 'Email orang tua sudah terdaftar', {}, HTTP_STATUS.BAD_REQUEST);
      }
    }

    data.id = generateId(ID_PREFIXES.PARENT);
    data.status = data.status || STATUS.PARENT_ACTIVE;

    var created = insertRow(SHEET_NAMES.PARENTS, data, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'create',
      module: 'parent',
      entityId: created.id,
      description: 'Tambah orang tua ' + created.full_name,
      newValues: created
    });

    return successResponse({ parent: created });
  }

  /**
   * Update parent.
   */
  function update(session, parentId, data) {
    var isOwnParent = (session && session.user && session.user.linked_entity_id && session.user.linked_entity_id === parentId);
    var isAdmin = Permissions.isSuperAdmin(session) || Permissions.isAdminTU(session);
    var isOwnOrtu = Permissions.isOrangTua(session) && isOwnParent;
    if (!isAdmin && !isOwnOrtu) {
      return errorResponse(ERROR_CODES.FORBIDDEN, 'Tidak punya akses', {}, HTTP_STATUS.FORBIDDEN);
    }

    var existing = getById(SHEET_NAMES.PARENTS, parentId);
    if (!existing) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Orang tua tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    if (data.email && !isValidEmail(data.email)) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Format email tidak valid', {}, HTTP_STATUS.BAD_REQUEST);
    }
    if (data.phone && !isValidPhoneId(data.phone)) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Format nomor HP tidak valid', {}, HTTP_STATUS.BAD_REQUEST);
    }

    var updated = updateRow(SHEET_NAMES.PARENTS, parentId, data, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'update',
      module: 'parent',
      entityId: parentId,
      description: 'Update data orang tua ' + existing.full_name,
      oldValues: existing,
      newValues: updated
    });

    return successResponse({ parent: updated });
  }

  /**
   * Soft delete parent (hati-hati: relasi parent-student jadi orphan).
   * Production: biasanya parent di-deactivate saja (status=inactive), bukan dihapus.
   */
  function remove(session, parentId) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var existing = getById(SHEET_NAMES.PARENTS, parentId);
    if (!existing) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Orang tua tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    // Cek apakah masih punya anak aktif
    var activeRelations = findWhere(SHEET_NAMES.PARENT_STUDENT_RELATIONS, {
      parent_id: parentId,
      status: 'active'
    });

    if (activeRelations.length > 0) {
      // Tidak hapus, tapi nonaktifkan
      var updated = updateRow(SHEET_NAMES.PARENTS, parentId, { status: 'inactive' }, session.userId);
      ActivityLogService.log({
        userId: session.userId,
        action: 'update',
        module: 'parent',
        entityId: parentId,
        description: 'Nonaktifkan orang tua ' + existing.full_name + ' (masih punya anak aktif)',
        newValues: { status: 'inactive' }
      });
      return successResponse({ parent: updated, message: 'Orang tua dinonaktifkan karena masih punya relasi anak aktif' });
    }

    softDeleteRow(SHEET_NAMES.PARENTS, parentId, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'delete',
      module: 'parent',
      entityId: parentId,
      description: 'Soft delete orang tua ' + existing.full_name
    });

    return successResponse({ message: 'Data orang tua dihapus' });
  }

  // --------------------------------------------------------------------------
  // PARENT-STUDENT RELATIONS
  // --------------------------------------------------------------------------

  /**
   * Hubungkan parent dengan student.
   * Body: { parent_id, student_id, relation, is_primary }
   */
  function addRelation(session, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var validation = validateRequired(data, ['parent_id', 'student_id', 'relation']);
    if (!validation.valid) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Field wajib belum diisi',
        { missing: validation.missing }, HTTP_STATUS.BAD_REQUEST);
    }

    if (!isValidEnum(data.relation, RELATION_TYPES)) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR,
        'Relation harus salah satu dari: ' + RELATION_TYPES.join(', '),
        {}, HTTP_STATUS.BAD_REQUEST);
    }

    var parent = getById(SHEET_NAMES.PARENTS, data.parent_id);
    if (!parent) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Orang tua tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    var student = getById(SHEET_NAMES.STUDENTS, data.student_id);
    if (!student) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Siswa tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    // Cek apakah relasi sudah ada
    var existing = findWhere(SHEET_NAMES.PARENT_STUDENT_RELATIONS, {
      parent_id: data.parent_id,
      student_id: data.student_id,
      relation: data.relation
    });
    if (existing.length > 0) {
      return errorResponse('DUPLICATE_ENTRY', 'Relasi orang tua - siswa sudah ada',
        {}, HTTP_STATUS.CONFLICT);
    }

    var relData = {
      id: generateId('PSR'),
      parent_id: data.parent_id,
      student_id: data.student_id,
      relation: data.relation,
      is_primary: data.is_primary ? 'TRUE' : 'FALSE',
      status: 'active'
    };

    var created = insertRow(SHEET_NAMES.PARENT_STUDENT_RELATIONS, relData, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'create',
      module: 'parent',
      entityType: 'parent_student_relation',
      entityId: created.id,
      description: 'Hubungkan ' + parent.full_name + ' (' + data.relation + ') dengan siswa ' + student.full_name
    });

    return successResponse({ relation: created });
  }

  /**
   * Putus relasi parent-student (soft).
   */
  function removeRelation(session, relationId) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var rel = getById(SHEET_NAMES.PARENT_STUDENT_RELATIONS, relationId);
    if (!rel) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Relasi tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    softDeleteRow(SHEET_NAMES.PARENT_STUDENT_RELATIONS, relationId, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'delete',
      module: 'parent',
      entityId: relationId,
      description: 'Putus relasi orang tua - siswa'
    });

    return successResponse({ message: 'Relasi diputus' });
  }

  /**
   * Get all parents of a student.
   */
  function getParentsOfStudent(session, studentId) {
    if (!Permissions.canAccessStudent(session, studentId)) {
      return errorResponse(ERROR_CODES.FORBIDDEN, 'Tidak punya akses', {}, HTTP_STATUS.FORBIDDEN);
    }

    var relations = findWhere(SHEET_NAMES.PARENT_STUDENT_RELATIONS, {
      student_id: studentId,
      status: 'active'
    });
    var parents = relations.map(function (r) {
      var p = getById(SHEET_NAMES.PARENTS, r.parent_id);
      return p ? Object.assign({}, p, { relation_type: r.relation, is_primary: r.is_primary }) : null;
    }).filter(Boolean);

    return successResponse({ items: parents });
  }

  return {
    list: list,
    getById: getParent,
    create: create,
    update: update,
    remove: remove,
    addRelation: addRelation,
    removeRelation: removeRelation,
    getParentsOfStudent: getParentsOfStudent
  };

})();

// Register handlers
ParentHandlers.list = function (session, id, params) {
  return jsonResponse(ParentService.list(session, params));
};
ParentHandlers.get = function (session, id, params) {
  return jsonResponse(ParentService.getById(session, id || params.id));
};
ParentHandlers.create = function (session, id, params) {
  return jsonResponse(ParentService.create(session, params));
};
ParentHandlers.update = function (session, id, params) {
  return jsonResponse(ParentService.update(session, id || params.id, params));
};
ParentHandlers.remove = function (session, id, params) {
  return jsonResponse(ParentService.remove(session, id || params.id));
};
ParentHandlers.addRelation = function (session, id, params) {
  return jsonResponse(ParentService.addRelation(session, params));
};
ParentHandlers.removeRelation = function (session, id, params) {
  return jsonResponse(ParentService.removeRelation(session, params.relation_id || id));
};
ParentHandlers.ofStudent = function (session, id, params) {
  return jsonResponse(ParentService.getParentsOfStudent(session, id));
};
ParentHandlers.update_profile = function (session, id, params) {
  var parentId = session.user.linked_entity_id;
  return jsonResponse(ParentService.update(session, parentId, params));
};
ParentHandlers.me = function (session, id, params) {
  if (!Permissions.isOrangTua(session)) {
    return jsonResponse(errorResponse(ERROR_CODES.FORBIDDEN, 'Hanya untuk orang tua', {}, HTTP_STATUS.FORBIDDEN));
  }
  var parentId = session.user.linked_entity_id;
  return jsonResponse(ParentService.getById(session, parentId));
};