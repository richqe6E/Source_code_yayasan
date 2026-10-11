/**
 * @fileoverview Apps Script backend - Development service.
 * Handle catatan perkembangan siswa (rapor harian/bulanan).
 * 6 aspek perkembangan sesuai standar PAUD/TK:
 *   1. Agama & Budi Pekerti
 *   2. Jasmani & Kesehatan
 *   3. Kognitif
 *   4. Bahasa
 *   5. Sosial Emosional
 *   6. Seni
 *
 * @version 1.0
 * @date 2026-09-12
 */

var DevelopmentService = (function () {

  // Predikat standar PAUD untuk 6 aspek perkembangan
  var ASPECT_LABELS = {
    aspek_agama_budi_pekerti: 'Agama & Budi Pekerti',
    aspek_jasmani_kesehatan: 'Jasmani & Kesehatan',
    aspek_kognitif: 'Kognitif',
    aspek_bahasa: 'Bahasa',
    aspek_sosial_emosional: 'Sosial Emosional',
    aspek_seni: 'Seni'
  };

  var PREDICATE_OPTIONS = ['BB', 'MB', 'BSH', 'BSB'];
  // BB = Belum Berkembang, MB = Mulai Berkembang, BSH = Berkembang Sesuai Harapan, BSB = Berkembang Sangat Baik

  /**
   * Create catatan perkembangan baru.
   * Admin/Super Admin: semua siswa. Guru: hanya siswa di kelas yang diajar.
   */
  function create(session, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU, ROLE_CODES.GURU]);
    if (deny) return deny;

    if (!data.student_id) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'student_id wajib diisi', {}, HTTP_STATUS.BAD_REQUEST);
    }

    var student = getById(SHEET_NAMES.STUDENTS, data.student_id);
    if (!data.class_id && student) {
      data.class_id = student.current_class_id || '';
    }

    data.period = data.period || ('Semester ' + (data.semester || '1') + ' ' + (data.academic_year || new Date().getFullYear()));
    data.semester = data.semester || '1';
    data.academic_year = data.academic_year || String(new Date().getFullYear());
    data.recorded_date = data.recorded_date || todayDate();

    if (!Permissions.canAccessStudent(session, data.student_id)) {
      ActivityLogService.log({
        userId: session.userId,
        action: 'create',
        module: 'development',
        entityId: data.student_id,
        description: 'Akses ditolak ke perkembangan ' + data.student_id,
        status: LOG_STATUS.FAILED
      });
      return errorResponse(ERROR_CODES.FORBIDDEN,
        'Anda tidak punya akses ke siswa ini', {}, HTTP_STATUS.FORBIDDEN);
    }

    var activeAY = findWhere(SHEET_NAMES.ACADEMIC_YEARS, { is_active: 'TRUE' })[0];

    var devData = {
      id: generateId(ID_PREFIXES.DEVELOPMENT),
      student_id: data.student_id,
      class_id: data.class_id || '',
      academic_year_id: data.academic_year_id || (activeAY ? activeAY.id : ''),
      academic_year: data.academic_year || (activeAY ? activeAY.name : String(new Date().getFullYear())),
      semester: data.semester || '1',
      period: data.period,
      recorded_by: session.userId,
      recorded_date: data.recorded_date,

      // Kedua skema penamaan aspek didukung
      nilai_agama: data.nilai_agama || data.aspek_agama_budi_pekerti || '',
      aspek_agama_budi_pekerti: data.nilai_agama || data.aspek_agama_budi_pekerti || '',
      fisik_motorik: data.fisik_motorik || data.aspek_jasmani_kesehatan || '',
      aspek_jasmani_kesehatan: data.fisik_motorik || data.aspek_jasmani_kesehatan || '',
      kognitif: data.kognitif || data.aspek_kognitif || '',
      aspek_kognitif: data.kognitif || data.aspek_kognitif || '',
      bahasa: data.bahasa || data.aspek_bahasa || '',
      aspek_bahasa: data.bahasa || data.aspek_bahasa || '',
      sosial_emosional: data.sosial_emosional || data.aspek_sosial_emosional || '',
      aspek_sosial_emosional: data.sosial_emosional || data.aspek_sosial_emosional || '',
      seni: data.seni || data.aspek_seni || '',
      aspek_seni: data.seni || data.aspek_seni || '',
      teacher_note: data.teacher_note || data.catatan_guru || '',
      catatan_guru: data.teacher_note || data.catatan_guru || '',
      rekomendasi: data.rekomendasi || ''
    };

    var created = insertRow(SHEET_NAMES.STUDENT_DEVELOPMENT, devData, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'create',
      module: 'development',
      entityType: 'student_development',
      entityId: created.id,
      description: 'Catat perkembangan siswa periode ' + data.period,
      newValues: { student_id: data.student_id, period: data.period }
    });

    return successResponse({ development: created });
  }

  /**
   * Update catatan perkembangan.
   * Admin/Super Admin: semua. Guru: hanya siswa binaannya.
   */
  function update(session, devId, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU, ROLE_CODES.GURU]);
    if (deny) return deny;

    var existing = getById(SHEET_NAMES.STUDENT_DEVELOPMENT, devId);
    if (!existing) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Catatan tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    if (!Permissions.canAccessStudent(session, existing.student_id)) {
      return errorResponse(ERROR_CODES.FORBIDDEN, 'Tidak punya akses', {}, HTTP_STATUS.FORBIDDEN);
    }

    // Hapus field sistem yang tidak boleh diubah via update
    var protectedFields = ['id', 'student_id', 'class_id', 'academic_year_id',
      'recorded_by', 'created_at', 'created_by'];
    protectedFields.forEach(function (f) { delete data[f]; });

    var updated = updateRow(SHEET_NAMES.STUDENT_DEVELOPMENT, devId, data, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'update',
      module: 'development',
      entityId: devId,
      description: 'Update catatan perkembangan'
    });

    return successResponse({ development: updated });
  }

  /**
   * Get all catatan perkembangan untuk satu siswa.
   */
  function getForStudent(session, studentId, params) {
    if (!Permissions.canAccessStudent(session, studentId)) {
      ActivityLogService.log({
        userId: session.userId,
        action: 'read',
        module: 'development',
        entityId: studentId,
        description: 'Akses ditolak ke perkembangan ' + studentId,
        status: LOG_STATUS.FAILED
      });
      return errorResponse(ERROR_CODES.FORBIDDEN,
        'Anda tidak punya akses', {}, HTTP_STATUS.FORBIDDEN);
    }

    var records = findWhere(SHEET_NAMES.STUDENT_DEVELOPMENT, { student_id: studentId });
    if (params.period) records = records.filter(function (r) { return r.period === params.period; });
    if (params.semester) records = records.filter(function (r) { return String(r.semester) === String(params.semester); });
    if (params.year || params.academic_year) {
      var yr = String(params.year || params.academic_year);
      records = records.filter(function (r) { return String(r.academic_year).indexOf(yr) !== -1; });
    }
    if (params.academic_year_id) {
      records = records.filter(function (r) { return r.academic_year_id === params.academic_year_id; });
    }

    records.sort(function (a, b) { return (b.recorded_date || '').localeCompare(a.recorded_date || ''); });

    var student = getById(SHEET_NAMES.STUDENTS, studentId);

    // Enrich: tambahkan nama guru yang mencatat & map field nama aspek
    var enriched = records.map(function (r) {
      var teacher = r.recorded_by ? getById(SHEET_NAMES.USERS, r.recorded_by) : null;
      return Object.assign({}, r, {
        recorded_by_name: teacher ? teacher.full_name : '',
        student_name: student ? student.full_name : '',
        nilai_agama: r.nilai_agama || r.aspek_agama_budi_pekerti || '',
        fisik_motorik: r.fisik_motorik || r.aspek_jasmani_kesehatan || '',
        kognitif: r.kognitif || r.aspek_kognitif || '',
        bahasa: r.bahasa || r.aspek_bahasa || '',
        sosial_emosional: r.sosial_emosional || r.aspek_sosial_emosional || '',
        seni: r.seni || r.aspek_seni || '',
        teacher_note: r.teacher_note || r.catatan_guru || ''
      });
    });

    return successResponse({ items: enriched });
  }

  /**
   * Get single catatan perkembangan.
   */
  // Hindari nama `getById` agar tidak membayungi helper global Utils.getById(sheet, id).
  function getDevelopment(session, devId) {
    var dev = getById(SHEET_NAMES.STUDENT_DEVELOPMENT, devId);
    if (!dev) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Catatan tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }
    if (!Permissions.canAccessStudent(session, dev.student_id)) {
      return errorResponse(ERROR_CODES.FORBIDDEN, 'Tidak punya akses', {}, HTTP_STATUS.FORBIDDEN);
    }
    return successResponse({ development: dev });
  }

  /**
   * Delete catatan perkembangan.
   * Admin/Super Admin: semua. Guru: hanya siswa binaannya.
   */
  function remove(session, devId) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU, ROLE_CODES.GURU]);
    if (deny) return deny;

    var existing = getById(SHEET_NAMES.STUDENT_DEVELOPMENT, devId);
    if (!existing) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Catatan tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }
    if (!Permissions.canAccessStudent(session, existing.student_id)) {
      return errorResponse(ERROR_CODES.FORBIDDEN, 'Tidak punya akses', {}, HTTP_STATUS.FORBIDDEN);
    }

    softDeleteRow(SHEET_NAMES.STUDENT_DEVELOPMENT, devId, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'delete',
      module: 'development',
      entityId: devId,
      description: 'Hapus catatan perkembangan'
    });

    return successResponse({ message: 'Catatan dihapus' });
  }

  /**
   * Get form schema (frontend bisa query untuk render form rapor).
   */
  function getFormSchema() {
    return successResponse({
      aspects: Object.keys(ASPECT_LABELS).map(function (key) {
        return {
          key: key,
          label: ASPECT_LABELS[key],
          options: PREDICATE_OPTIONS
        };
      }),
      predicate_meaning: {
        BB: 'Belum Berkembang',
        MB: 'Mulai Berkembang',
        BSH: 'Berkembang Sesuai Harapan',
        BSB: 'Berkembang Sangat Baik'
      },
      period_format: 'YYYY-[S1|S2|Q1|Q2|Q3|Q4]'
    });
  }

  return {
    create: create,
    update: update,
    getForStudent: getForStudent,
    getById: getDevelopment,
    remove: remove,
    getFormSchema: getFormSchema
  };

})();

// Register handlers
DevelopmentHandlers.list = function (session, id, params) {
  if (params.student_id) {
    return jsonResponse(DevelopmentService.getForStudent(session, params.student_id, params));
  }
  if (id) {
    return jsonResponse(DevelopmentService.getById(session, id));
  }
  return jsonResponse(errorResponse(ERROR_CODES.VALIDATION_ERROR,
    'student_id wajib diisi', {}, HTTP_STATUS.BAD_REQUEST));
};
DevelopmentHandlers.create = function (session, id, params) {
  return jsonResponse(DevelopmentService.create(session, params));
};
DevelopmentHandlers.update = function (session, id, params) {
  return jsonResponse(DevelopmentService.update(session, id || params.id, params));
};
DevelopmentHandlers.get = function (session, id, params) {
  return jsonResponse(DevelopmentService.getById(session, id || params.id));
};
DevelopmentHandlers.remove = function (session, id, params) {
  return jsonResponse(DevelopmentService.remove(session, id || params.id));
};
DevelopmentHandlers.formSchema = function (session, id, params) {
  return jsonResponse(DevelopmentService.getFormSchema());
};
DevelopmentHandlers.upsert = function (session, id, params) {
  var existing = null;
  if (id) {
    existing = getById(SHEET_NAMES.STUDENT_DEVELOPMENT, id);
  }
  if (!existing && params.student_id) {
    var allDevs = findWhere(SHEET_NAMES.STUDENT_DEVELOPMENT, { student_id: params.student_id });
    if (params.semester) {
      var semMatches = allDevs.filter(function (d) { return String(d.semester) === String(params.semester); });
      if (semMatches.length > 0) existing = semMatches[0];
    }
    if (!existing && params.period) {
      var perMatches = allDevs.filter(function (d) { return String(d.period) === String(params.period); });
      if (perMatches.length > 0) existing = perMatches[0];
    }
  }
  if (existing) {
    return jsonResponse(DevelopmentService.update(session, existing.id, params));
  }
  return jsonResponse(DevelopmentService.create(session, params));
};