/**
 * @fileoverview Apps Script backend - PPDB Service.
 * Handle submission, verifikasi, accept/reject, dan konversi pendaftar.
 * Formulir PPDB mencakup dua jenis:
 *   1. Formulir TPQ (TPQ ULINNUHA) - untuk pendaftaran TPQ
 *   2. Formulir PAUD - untuk pendaftaran PAUD
 * Field disatukan dalam satu sheet dengan flag `form_type` untuk membedakan.
 *
 * @version 1.0
 * @date 2026-09-12
 */

var PPDbService = (function () {

  // Tipe formulir
  var FORM_TYPE_TPQ = 'tpq';
  var FORM_TYPE_PAUD = 'paud';

  /**
   * Submit pendaftaran baru (public, tanpa auth).
   * Status awal: SUBMITTED
   *
   * Body (TPQ):
   *   form_type, period_id, full_name, nickname, gender, birth_place, birth_date,
   *   child_order, sibling_count, nik, address (object), phone1, phone2,
   *   father_name, father_occupation, father_education,
   *   mother_name, mother_occupation, mother_education,
   *   guardian_name, guardian_occupation, guardian_education, guardian_relation,
   *   registration_date (optional, auto)
   *
   * Body (PAUD):
   *   form_type, period_id, full_name, nickname, gender, birth_place, birth_date,
   *   address (object), religion, nationality, child_order,
   *   sibling_kandung, sibling_tiri, sibling_angkat,
   *   orphan_status, daily_language, special_characteristics,
   *   father (object), mother (object)
   */
  function submitPublic(data, e) {
    var formType = data.form_type || FORM_TYPE_TPQ;
    if (!data.full_name && data.child_name) {
      data.full_name = data.child_name;
    }

    // Auto-resolve period jika tidak disertakan di form
    if (!data.period_id) {
      var allPeriods = getSheetData(SHEET_NAMES.PPDB_PERIODS);
      var openPeriods = allPeriods.filter(function (p) { return p.status === 'open'; });
      if (openPeriods.length > 0) {
        data.period_id = openPeriods[0].id;
      } else if (allPeriods.length > 0) {
        data.period_id = allPeriods[0].id;
      } else {
        data.period_id = 'PPDPER-2026';
      }
    }

    // Validasi field wajib minimal
    var validation = validateRequired(data, [
      'form_type', 'period_id', 'full_name', 'gender', 'birth_place', 'birth_date'
    ]);
    if (!validation.valid) {
      return errorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Field wajib belum diisi',
        { missing: validation.missing },
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (!isValidEnum(formType, [FORM_TYPE_TPQ, FORM_TYPE_PAUD])) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR,
        'form_type harus tpq atau paud', {}, HTTP_STATUS.BAD_REQUEST);
    }

    // Cek periode aktif (toleran terhadap periode default atau jika tidak ditentukan)
    var period = getById(SHEET_NAMES.PPDB_PERIODS, data.period_id);
    if (!period || data.period_id === 'PPDPER-2026' || data.period_id === 'PPDPER-DEFAULT') {
      period = { id: data.period_id, status: 'open' };
    }
    if (period.status && period.status !== 'open' && period.status !== 'active') {
      return errorResponse('PERIOD_CLOSED', 'PPDB sedang tidak buka (Status: ' + period.status + ')',
        { status: period.status, period_id: data.period_id }, HTTP_STATUS.FORBIDDEN);
    }

    if (!isValidEnum(data.gender, [STATUS.GENDER_L, STATUS.GENDER_P])) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Gender harus L atau P', {}, HTTP_STATUS.BAD_REQUEST);
    }

    if (!isValidDate(data.birth_date)) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR,
        'Format birth_date harus YYYY-MM-DD', {}, HTTP_STATUS.BAD_REQUEST);
    }

    if (data.nik && !isValidNik(data.nik)) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR,
        'NIK harus 16 digit angka', {}, HTTP_STATUS.BAD_REQUEST);
    }

    if (data.phone1 && !isValidPhoneId(data.phone1)) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR,
        'Format phone1 tidak valid', {}, HTTP_STATUS.BAD_REQUEST);
    }

    if (data.phone2 && !isValidPhoneId(data.phone2)) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR,
        'Format phone2 tidak valid', {}, HTTP_STATUS.BAD_REQUEST);
    }

    // Serialize field object/JSON
    var regId = generateId(ID_PREFIXES.PPD_REGISTRATION);
    var submission = {
      id: regId,
      registration_number: regId,
      form_type: formType,
      period_id: data.period_id,

      // Identitas calon siswa (kedua format kolom didukung)
      full_name: data.full_name,
      child_name: data.full_name,
      nickname: data.nickname || '',
      gender: data.gender,
      child_gender: data.gender,
      birth_place: data.birth_place,
      child_birth_place: data.birth_place,
      birth_date: data.birth_date,
      child_birth_date: data.birth_date,
      religion: data.religion || '',
      child_religion: data.religion || '',
      nationality: data.nationality || 'WNI',
      child_nationality: data.nationality || 'WNI',
      nik: data.nik || '',
      address: typeof data.address === 'object' ? safeJsonStringify(data.address) : (data.address || ''),

      // Alamat (TPQ: object dengan provinsi/kabupaten/kecamatan/desa/alamat;
      //         PAUD: object dengan jalan/Desa/Kecamatan/Kabupaten/Provinsi)
      address_json: data.address ? safeJsonStringify(data.address) : '',

      // Kontak (TPQ: phone1 & phone2; PAUD: lewat parent)
      phone1: data.phone1 || '',
      phone2: data.phone2 || '',

      // Urutan & saudara (TPQ)
      child_order: data.child_order || '',
      sibling_count: data.sibling_count || '',
      sibling_kandung: data.sibling_kandung || '',
      sibling_tiri: data.sibling_tiri || '',
      sibling_angkat: data.sibling_angkat || '',

      // Status anak (PAUD)
      orphan_status: data.orphan_status || '',   // yatim / piatu / yatim_piatu / tidak
      daily_language: data.daily_language || '',
      special_characteristics: data.special_characteristics || '',

      // Identitas Ayah (TPQ flat, PAUD nested)
      father_name: data.father_name || '',
      father_phone: data.father_phone || '',
      father_email: data.father_email || '',
      father_occupation: data.father_occupation || '',
      father_education: data.father_education || '',
      father_birth_place: data.father_birth_place || '',
      father_birth_date: data.father_birth_date || '',
      father_religion: data.father_religion || '',
      father_type: data.father_type || 'kandung',  // kandung/tiri/angkat/wali
      father_json: data.father ? safeJsonStringify(data.father) : '',

      // Identitas Ibu
      mother_name: data.mother_name || '',
      mother_phone: data.mother_phone || '',
      mother_email: data.mother_email || '',
      mother_occupation: data.mother_occupation || '',
      mother_education: data.mother_education || '',
      mother_birth_place: data.mother_birth_place || '',
      mother_birth_date: data.mother_birth_date || '',
      mother_religion: data.mother_religion || '',
      mother_type: data.mother_type || 'kandung',
      mother_json: data.mother ? safeJsonStringify(data.mother) : '',

      // Identitas Wali (khusus TPQ)
      guardian_name: data.guardian_name || '',
      guardian_phone: data.guardian_phone || '',
      guardian_occupation: data.guardian_occupation || '',
      guardian_education: data.guardian_education || '',
      guardian_relation: data.guardian_relation || '',

      // Sekolah sebelumnya
      previous_school: data.previous_school || '',

      // Mutasi (PAUD)
      mutation_from: data.mutation_from || '',
      mutation_reason: data.mutation_reason || '',

      // Keterangan lain (PAUD)
      distance_to_school: data.distance_to_school || '',
      transport_method: data.transport_method || '',

      // Metadata
      registration_date: data.registration_date || todayDate(),
      entry_date: data.entry_date || '',
      nis_lokal: data.nis_lokal || '',
      notes: data.notes || data.catatan || '',
      catatan: data.notes || data.catatan || '',

      status: STATUS.PPD_SUBMITTED
    };

    var created = insertRow(SHEET_NAMES.PPDB_REGISTRATIONS, submission, SYSTEM_USER_ID);

    ActivityLogService.log({
      action: 'create',
      module: 'ppdb',
      entityType: 'ppdb_registration',
      entityId: created.id,
      description: 'Pendaftaran PPDB baru (' + formType + '): ' + created.full_name,
      ipAddress: getClientIp(e),
      userAgent: getUserAgent(e),
      newValues: {
        id: created.id,
        full_name: created.full_name,
        form_type: formType
      }
    });

    var regInfo = {
      id: created.id,
      registration_number: created.id,
      registration_no: created.id,
      full_name: created.full_name || created.child_name,
      child_name: created.child_name || created.full_name,
      form_type: formType,
      status: created.status,
      period_id: created.period_id,
      registration_date: created.registration_date,
      created_at: created.created_at || created.registration_date
    };

    return successResponse({
      id: created.id,
      registration_no: created.id,
      registration_number: created.id,
      full_name: regInfo.full_name,
      child_name: regInfo.child_name,
      registration: regInfo
    });
  }

  /**
   * Get registration by ID (public, tanpa auth — verifikasi via birth_date).
   */
  function getStatusPublic(registrationIdOrParams, birthDate) {
    var regId = '';
    var bDate = '';
    if (typeof registrationIdOrParams === 'object' && registrationIdOrParams !== null) {
      regId = registrationIdOrParams.registration_number || registrationIdOrParams.registration_no || registrationIdOrParams.id || '';
      bDate = registrationIdOrParams.birth_date || registrationIdOrParams.child_birth_date || '';
    } else {
      regId = String(registrationIdOrParams || '');
      bDate = String(birthDate || '');
    }

    var reg = getById(SHEET_NAMES.PPDB_REGISTRATIONS, regId, { includeDeleted: true });
    if (!reg) {
      // Cari juga berdasarkan registration_number
      var matches = findWhere(SHEET_NAMES.PPDB_REGISTRATIONS, { registration_number: regId }, { includeDeleted: true });
      if (matches.length > 0) reg = matches[0];
    }

    if (!reg) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Nomor pendaftaran tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    var recordBirthDate = reg.child_birth_date || reg.birth_date || '';
    if (bDate && recordBirthDate && recordBirthDate !== bDate) {
      return errorResponse('VERIFICATION_FAILED', 'Data verifikasi tidak cocok', {}, HTTP_STATUS.FORBIDDEN);
    }

    var regData = {
      id: reg.id || reg.registration_number,
      registration_number: reg.registration_number || reg.id,
      registration_no: reg.registration_number || reg.id,
      full_name: reg.full_name || reg.child_name,
      child_name: reg.child_name || reg.full_name,
      form_type: reg.form_type,
      status: reg.status,
      registration_date: reg.registration_date || reg.created_at,
      created_at: reg.created_at || reg.registration_date,
      birth_date: recordBirthDate,
      child_birth_date: recordBirthDate,
      period_id: reg.period_id,
      verified_at: reg.verified_at,
      rejection_reason: reg.rejection_reason,
      notes: reg.notes || reg.rejection_reason || '',
      accepted_at: reg.accepted_at,
      nis_lokal: reg.nis_lokal
    };

    return successResponse({
      registration: regData,
      registration_number: regData.registration_number,
      child_name: regData.child_name,
      full_name: regData.full_name,
      status: regData.status,
      form_type: regData.form_type,
      created_at: regData.created_at,
      child_birth_date: regData.child_birth_date,
      notes: regData.notes
    });
  }

  /**
   * Update data oleh pendaftar (jika status NEEDS_REVISION).
   */
  function updateByRegistrant(session, data) {
    if (!data.id) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'ID pendaftaran diperlukan', {}, HTTP_STATUS.BAD_REQUEST);
    }

    var reg = getById(SHEET_NAMES.PPDB_REGISTRATIONS, data.id);
    if (!reg) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Pendaftaran tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    if (reg.status !== STATUS.PPD_NEEDS_REVISION) {
      return errorResponse('INVALID_STATE', 'Tidak bisa edit, status: ' + reg.status, {}, HTTP_STATUS.FORBIDDEN);
    }

    // Hapus field yang tidak boleh diubah
    var protectedFields = [
      'id', 'status', 'verified_by', 'verified_at', 'accepted_at',
      'converted_to_student_id', 'converted_at', 'nis_lokal',
      'period_id', 'form_type'
    ];
    protectedFields.forEach(function (f) { delete data[f]; });

    // Re-serialize jika ada address/parent object
    if (data.address) data.address_json = safeJsonStringify(data.address);
    if (data.father) data.father_json = safeJsonStringify(data.father);
    if (data.mother) data.mother_json = safeJsonStringify(data.mother);

    var updated = updateRow(SHEET_NAMES.PPDB_REGISTRATIONS, reg.id, data, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'update',
      module: 'ppdb',
      entityId: reg.id,
      description: 'Pendaftar update data',
      oldValues: reg,
      newValues: updated
    });

    return successResponse({ registration: updated });
  }

  /**
   * List registrations (admin).
   */
  function list(session, params) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var allRegs = getSheetData(SHEET_NAMES.PPDB_REGISTRATIONS);

    if (params.status) {
      var sFilter = String(params.status).toLowerCase();
      if (sFilter === 'pending') {
        allRegs = allRegs.filter(function (r) {
          var s = String(r.status).toLowerCase();
          return s === 'pending' || s === 'submitted' || s === 'waiting_verification' || s === 'needs_revision';
        });
      } else if (sFilter === 'approved') {
        allRegs = allRegs.filter(function (r) {
          var s = String(r.status).toLowerCase();
          return s === 'approved' || s === 'accepted' || s === 'verified';
        });
      } else if (sFilter === 'rejected') {
        allRegs = allRegs.filter(function (r) {
          return String(r.status).toLowerCase() === 'rejected';
        });
      } else {
        allRegs = allRegs.filter(function (r) { return r.status === params.status; });
      }
    }
    if (params.period_id) {
      allRegs = allRegs.filter(function (r) { return r.period_id === params.period_id; });
    }
    if (params.form_type) {
      allRegs = allRegs.filter(function (r) { return r.form_type === params.form_type; });
    }
    if (params.search) {
      var q = String(params.search).toLowerCase();
      allRegs = allRegs.filter(function (r) {
        var name = (r.full_name || r.child_name || '').toLowerCase();
        return (name.indexOf(q) !== -1) ||
               (r.nik && String(r.nik).toLowerCase().indexOf(q) !== -1) ||
               (r.father_name && r.father_name.toLowerCase().indexOf(q) !== -1) ||
               (r.mother_name && r.mother_name.toLowerCase().indexOf(q) !== -1) ||
               (r.registration_number && r.registration_number.toLowerCase().indexOf(q) !== -1);
      });
    }

    var page = parseInt(params.page) || 1;
    var pageSize = parseInt(params.pageSize) || 50;
    var total = allRegs.length;
    var totalPages = Math.ceil(total / pageSize);
    var start = (page - 1) * pageSize;
    var items = allRegs.slice(start, start + pageSize);

    // Enrich agar field yang dicari frontend selalu tersedia
    items = items.map(function (r) {
      return Object.assign({}, r, {
        child_name: r.child_name || r.full_name || '',
        full_name: r.full_name || r.child_name || '',
        registration_number: r.registration_number || r.id || '',
        created_at: r.created_at || r.registration_date || ''
      });
    });

    ActivityLogService.log({
      userId: session.userId,
      action: 'read',
      module: 'ppdb',
      description: 'List ' + items.length + ' registrations'
    });

    return successResponse({
      items: items,
      pagination: { page: page, pageSize: pageSize, total: total, totalPages: totalPages }
    });
  }

  /**
   * Get single registration detail (admin).
   */
  // Hindari nama `getById` agar tidak membayungi helper global Utils.getById(sheet, id).
  function getRegistration(session, regId) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var reg = getById(SHEET_NAMES.PPDB_REGISTRATIONS, regId);
    if (!reg) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Pendaftaran tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    var docs = findWhere(SHEET_NAMES.PPDB_DOCUMENTS, { registration_id: regId });
    var period = reg.period_id ? getById(SHEET_NAMES.PPDB_PERIODS, reg.period_id) : null;

    // Parse JSON fields
    var enriched = Object.assign({}, reg, {
      address: safeJsonParse(reg.address_json, null),
      father_detail: safeJsonParse(reg.father_json, null),
      mother_detail: safeJsonParse(reg.mother_json, null)
    });

    ActivityLogService.log({
      userId: session.userId,
      action: 'read',
      module: 'ppdb',
      entityId: regId,
      description: 'Lihat detail pendaftaran ' + reg.full_name
    });

    return successResponse({
      registration: enriched,
      documents: docs,
      period: period
    });
  }

  /**
   * Admin: Verify (mulai review).
   */
  function verify(session, regId) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var reg = getById(SHEET_NAMES.PPDB_REGISTRATIONS, regId);
    if (!reg) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    var updated = updateRow(SHEET_NAMES.PPDB_REGISTRATIONS, regId, {
      status: STATUS.PPD_VERIFIED,
      verified_by: session.userId,
      verified_at: nowIso()
    }, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'verify',
      module: 'ppdb',
      entityId: regId,
      description: 'Verifikasi pendaftaran ' + reg.full_name
    });

    return successResponse({ registration: updated });
  }

  /**
   * Admin: Accept pendaftaran.
   */
  function accept(session, regId) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var reg = getById(SHEET_NAMES.PPDB_REGISTRATIONS, regId);
    if (!reg) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    var validFromStates = [
      STATUS.PPD_VERIFIED, STATUS.PPD_SUBMITTED, STATUS.PPD_WAITING_VERIFICATION,
      'pending', 'submitted', 'waiting_verification', 'verified'
    ];
    if (validFromStates.indexOf(reg.status) === -1) {
      return errorResponse('INVALID_STATE',
        'Status tidak valid untuk accept: ' + reg.status, {}, HTTP_STATUS.FORBIDDEN);
    }

    var updated = updateRow(SHEET_NAMES.PPDB_REGISTRATIONS, regId, {
      status: STATUS.PPD_ACCEPTED,
      accepted_at: nowIso(),
      verified_by: reg.verified_by || session.userId,
      verified_at: reg.verified_at || nowIso()
    }, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'approve',
      module: 'ppdb',
      entityId: regId,
      description: 'Terima pendaftaran ' + reg.full_name
    });

    return successResponse({ registration: updated });
  }

  /**
   * Admin: Reject pendaftaran.
   */
  function reject(session, regId, reason) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    if (!reason) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Alasan penolakan wajib diisi', {}, HTTP_STATUS.BAD_REQUEST);
    }

    var reg = getById(SHEET_NAMES.PPDB_REGISTRATIONS, regId);
    if (!reg) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    var updated = updateRow(SHEET_NAMES.PPDB_REGISTRATIONS, regId, {
      status: STATUS.PPD_REJECTED,
      rejection_reason: reason
    }, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'reject',
      module: 'ppdb',
      entityId: regId,
      description: 'Tolak pendaftaran ' + reg.full_name,
      newValues: { reason: reason }
    });

    return successResponse({ registration: updated });
  }

  /**
   * Admin: Minta revisi.
   */
  function requestRevision(session, regId, notes) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var reg = getById(SHEET_NAMES.PPDB_REGISTRATIONS, regId);
    if (!reg) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    var updated = updateRow(SHEET_NAMES.PPDB_REGISTRATIONS, regId, {
      status: STATUS.PPD_NEEDS_REVISION,
      notes: notes || ''
    }, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'update',
      module: 'ppdb',
      entityId: regId,
      description: 'Minta revisi pendaftaran ' + reg.full_name
    });

    return successResponse({ registration: updated });
  }

  /**
   * Admin: Konversi pendaftar jadi siswa aktif.
   * Flow: ACCEPTED → RE_REGISTRATION → ACTIVE_STUDENT
   */
  function convertToStudent(session, regId, options) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var reg = getById(SHEET_NAMES.PPDB_REGISTRATIONS, regId);
    if (!reg) {
      return errorResponse(ERROR_CODES.NOT_FOUND, 'Pendaftaran tidak ditemukan', {}, HTTP_STATUS.NOT_FOUND);
    }

    if (reg.status !== STATUS.PPD_ACCEPTED && reg.status !== STATUS.PPD_RE_REGISTRATION) {
      return errorResponse('INVALID_STATE', 'Pendaftaran belum diterima',
        { current: reg.status }, HTTP_STATUS.FORBIDDEN);
    }

    options = options || {};
    if (!options.class_id) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'class_id wajib diisi', {}, HTTP_STATUS.BAD_REQUEST);
    }

    // 1. Buat student baru
    var studentId = generateId(ID_PREFIXES.STUDENT);
    var year = new Date().getFullYear();
    var nis = options.nis || (year + String(Math.floor(Math.random() * 99999)).padStart(5, '0'));

    var studentData = {
      id: studentId,
      nis: nis,
      nisn: reg.nik || '',  // PAUD/TPQ kadang belum punya NISN, pakai NIK sementara
      full_name: reg.full_name,
      nickname: reg.nickname || '',
      gender: reg.gender,
      birth_place: reg.birth_place,
      birth_date: reg.birth_date,
      religion: reg.religion || '',
      address: reg.address_json || reg.address || '',
      photo_file_id: '',
      birth_cert_number: reg.nik || '',
      status: STATUS.STUDENT_ACTIVE,
      enrollment_date: todayDate(),
      created_from_ppdb_reg: regId,
      current_class_id: options.class_id
    };
    insertRow(SHEET_NAMES.STUDENTS, studentData, session.userId);

    // 2. Buat enrollment
    var enrollmentId = generateId(ID_PREFIXES.ENROLLMENT);
    var activeAY = findWhere(SHEET_NAMES.ACADEMIC_YEARS, { is_active: 'TRUE' })[0];
    insertRow(SHEET_NAMES.ENROLLMENTS, {
      id: enrollmentId,
      student_id: studentId,
      class_id: options.class_id,
      academic_year_id: activeAY ? activeAY.id : '',
      enrollment_date: todayDate(),
      status: 'aktif'
    }, session.userId);

    // 3. Buat orang tua (jika belum ada)
    var fatherId = null;
    var motherId = null;

    if (reg.father_name && reg.father_phone) {
      fatherId = createOrFindParent(reg.father_name, reg.father_type || 'ayah', reg.father_phone, reg.father_email);
    }
    if (reg.mother_name && reg.mother_phone) {
      motherId = createOrFindParent(reg.mother_name, reg.mother_type || 'ibu', reg.mother_phone, reg.mother_email);
    }
    // Wali (TPQ)
    if (!fatherId && !motherId && reg.guardian_name && reg.guardian_phone) {
      fatherId = createOrFindParent(reg.guardian_name, 'wali', reg.guardian_phone, '');
    }

    // 4. Buat relasi parent-student + user account untuk ortu
    if (fatherId) {
      insertRow(SHEET_NAMES.PARENT_STUDENT_RELATIONS, {
        id: generateId('PSR'),
        parent_id: fatherId,
        student_id: studentId,
        relation: 'ayah',
        is_primary: 'TRUE',
        status: 'active'
      }, session.userId);
      createUserForParent(fatherId, reg.father_name, reg.father_email, reg.father_phone);
    }
    if (motherId) {
      insertRow(SHEET_NAMES.PARENT_STUDENT_RELATIONS, {
        id: generateId('PSR'),
        parent_id: motherId,
        student_id: studentId,
        relation: 'ibu',
        is_primary: fatherId ? 'FALSE' : 'TRUE',
        status: 'active'
      }, session.userId);
      createUserForParent(motherId, reg.mother_name, reg.mother_email, reg.mother_phone);
    }

    // 5. Update ppdb_registration jadi ACTIVE_STUDENT
    updateRow(SHEET_NAMES.PPDB_REGISTRATIONS, regId, {
      status: STATUS.PPD_ACTIVE_STUDENT,
      converted_to_student_id: studentId,
      converted_at: nowIso()
    }, session.userId);

    // 6. Generate tagihan daftar ulang (opsional)
    var period = reg.period_id ? getById(SHEET_NAMES.PPDB_PERIODS, reg.period_id) : null;
    if (period && period.registration_fee && parseFloat(period.registration_fee) > 0) {
      insertRow(SHEET_NAMES.INVOICES, {
        id: generateId(ID_PREFIXES.INVOICE),
        student_id: studentId,
        academic_year_id: activeAY ? activeAY.id : '',
        period_label: 'Daftar Ulang ' + (activeAY ? activeAY.name : ''),
        due_date: options.due_date || todayDate(),
        amount: period.registration_fee,
        status: STATUS.INV_UNPAID,
        total_paid: '0',
        invoice_type: STATUS.INVOICE_DAFTAR_ULANG
      }, session.userId);
    }

    ActivityLogService.log({
      userId: session.userId,
      action: 'create',
      module: 'ppdb',
      entityId: regId,
      description: 'Konversi pendaftar ' + reg.full_name + ' menjadi siswa aktif ' + studentId,
      newValues: { student_id: studentId, enrollment_id: enrollmentId }
    });

    return successResponse({
      student_id: studentId,
      enrollment_id: enrollmentId,
      message: 'Konversi berhasil'
    });
  }

  /**
   * Helper: Find or create parent.
   */
  function createOrFindParent(fullName, relation, phone, email) {
    if (!phone) return null;

    var existing = findWhere(SHEET_NAMES.PARENTS, { phone: phone, full_name: fullName });
    if (existing.length > 0) return existing[0].id;

    var parentId = generateId(ID_PREFIXES.PARENT);
    insertRow(SHEET_NAMES.PARENTS, {
      id: parentId,
      full_name: fullName,
      relation: relation,
      phone: phone,
      email: email || '',
      status: 'active'
    }, SYSTEM_USER_ID);

    return parentId;
  }

  /**
   * Helper: Create user account untuk parent.
   */
  function createUserForParent(parentId, fullName, email, phone) {
    if (!email) {
      email = 'parent.' + parentId.toLowerCase().replace(/[^a-z0-9]/g, '') + '@yayasan.local';
    }

    var existing = findWhere(SHEET_NAMES.USERS, { email: email.toLowerCase() });
    if (existing.length > 0) {
      updateRow(SHEET_NAMES.USERS, existing[0].id, {
        linked_entity_id: parentId,
        linked_entity_type: 'parent'
      }, SYSTEM_USER_ID);
      return existing[0].id;
    }

    var userId = generateId(ID_PREFIXES.USER);
    var tempPassword = randomString(12);

    var parentRole = findWhere(SHEET_NAMES.ROLES, { code: ROLE_CODES.ORANG_TUA })[0];

    insertRow(SHEET_NAMES.USERS, {
      id: userId,
      email: email.toLowerCase(),
      password_hash: hashPassword(tempPassword),
      full_name: fullName,
      phone: phone || '',
      role_id: parentRole ? parentRole.id : '',
      status: STATUS.USER_ACTIVE,
      linked_entity_id: parentId,
      linked_entity_type: 'parent',
      email_verified: 'FALSE'
    }, SYSTEM_USER_ID);

    return userId;
  }

  // --------------------------------------------------------------------------
  // PPDB PERIOD MANAGEMENT
  // --------------------------------------------------------------------------

  function listPeriods() {
    var periods = getSheetData(SHEET_NAMES.PPDB_PERIODS);
    return successResponse({ items: periods });
  }

  function createPeriod(session, data) {
    var deny = Permissions.rbacDeny(session, [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN_TU]);
    if (deny) return deny;

    var validation = validateRequired(data, [
      'academic_year_id', 'school_id', 'name', 'start_date', 'end_date'
    ]);
    if (!validation.valid) {
      return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Field wajib belum diisi',
        { missing: validation.missing }, HTTP_STATUS.BAD_REQUEST);
    }

    data.id = generateId('PPDPER');
    data.status = data.status || 'draft';

    var created = insertRow(SHEET_NAMES.PPDB_PERIODS, data, session.userId);

    ActivityLogService.log({
      userId: session.userId,
      action: 'create',
      module: 'ppdb_period',
      entityId: created.id,
      description: 'Buat periode PPDB: ' + created.name
    });

    return successResponse({ period: created });
  }

  /**
   * Get form schema definition (frontend bisa query ini untuk render form dinamis).
   * Berguna agar frontend tidak hardcode field apa saja yang harus diisi.
   */
  function getFormSchema(formType) {
    if (formType === FORM_TYPE_PAUD) {
      return successResponse({
        form_type: 'paud',
        schema_version: '1.0',
        sections: [
          {
            id: 'indentity',
            title: 'Identitas Anak Didik',
            fields: [
              { key: 'full_name', label: 'Nama Lengkap', type: 'text', required: true },
              { key: 'nickname', label: 'Nama Panggilan', type: 'text', required: false },
              { key: 'gender', label: 'Jenis Kelamin', type: 'select', options: ['L', 'P'], required: true },
              { key: 'birth_place', label: 'Tempat Lahir', type: 'text', required: true },
              { key: 'birth_date', label: 'Tanggal Lahir', type: 'date', required: true },
              { key: 'religion', label: 'Agama', type: 'select', options: RELIGIONS, required: false },
              { key: 'nationality', label: 'Kewarganegaraan', type: 'text', default: 'WNI', required: false },
              { key: 'nik', label: 'No. NIK', type: 'text', pattern: '^[0-9]{16}$', required: false },
              {
                key: 'address',
                label: 'Alamat Rumah',
                type: 'object',
                fields: [
                  { key: 'jalan', label: 'Jalan', type: 'text' },
                  { key: 'desa', label: 'Desa', type: 'text' },
                  { key: 'kecamatan', label: 'Kecamatan', type: 'text' },
                  { key: 'kabupaten', label: 'Kabupaten', type: 'text' },
                  { key: 'provinsi', label: 'Provinsi', type: 'text' }
                ]
              },
              { key: 'child_order', label: 'Anak Ke', type: 'number', required: false },
              {
                key: 'siblings',
                label: 'Jumlah Saudara',
                type: 'group',
                fields: [
                  { key: 'sibling_kandung', label: 'Kandung', type: 'number' },
                  { key: 'sibling_tiri', label: 'Tiri', type: 'number' },
                  { key: 'sibling_angkat', label: 'Angkat', type: 'number' }
                ]
              },
              { key: 'orphan_status', label: 'Status Anak', type: 'select',
                options: ['tidak', 'yatim', 'piatu', 'yatim_piatu'], required: false },
              { key: 'daily_language', label: 'Bahasa Sehari-hari', type: 'text', required: false },
              { key: 'special_characteristics', label: 'Ciri-ciri Khusus', type: 'textarea', required: false }
            ]
          },
          {
            id: 'father',
            title: 'Identitas Ayah',
            fields: [
              { key: 'father_type', label: 'Status', type: 'select',
                options: ['kandung', 'tiri', 'angkat', 'wali'], default: 'kandung' },
              { key: 'father_name', label: 'Nama', type: 'text', required: false },
              { key: 'father_birth_place', label: 'Tempat Lahir', type: 'text' },
              { key: 'father_birth_date', label: 'Tanggal Lahir', type: 'date' },
              { key: 'father_religion', label: 'Agama', type: 'select', options: RELIGIONS },
              { key: 'father_education', label: 'Pendidikan Terakhir', type: 'text' },
              { key: 'father_phone', label: 'Nomor Telepon/WA', type: 'tel' }
            ]
          },
          {
            id: 'mother',
            title: 'Identitas Ibu',
            fields: [
              { key: 'mother_type', label: 'Status', type: 'select',
                options: ['kandung', 'tiri', 'angkat', 'wali'], default: 'kandung' },
              { key: 'mother_name', label: 'Nama', type: 'text', required: false },
              { key: 'mother_birth_place', label: 'Tempat Lahir', type: 'text' },
              { key: 'mother_birth_date', label: 'Tanggal Lahir', type: 'date' },
              { key: 'mother_religion', label: 'Agama', type: 'select', options: RELIGIONS },
              { key: 'mother_education', label: 'Pendidikan Terakhir', type: 'text' },
              { key: 'mother_phone', label: 'Nomor Telepon/WA', type: 'tel' }
            ]
          },
          {
            id: 'mutation',
            title: 'Mutasi',
            fields: [
              { key: 'mutation_from', label: 'Berasal dari sekolah mana?', type: 'text' },
              { key: 'mutation_reason', label: 'Karena pindah/melanjutkan ke', type: 'text' }
            ]
          },
          {
            id: 'other',
            title: 'Keterangan Lain',
            fields: [
              { key: 'distance_to_school', label: 'Jarak tempat tinggal ke sekolah', type: 'text' },
              { key: 'transport_method', label: 'Pergi ke sekolah dengan', type: 'text' }
            ]
          }
        ],
        attachments: [
          { key: 'foto_anak', label: 'Foto Anak', mime: ['image/jpeg', 'image/png'] },
          { key: 'akta_kelahiran', label: 'Akta Kelahiran', mime: ['application/pdf', 'image/jpeg'] },
          { key: 'kartu_keluarga', label: 'Kartu Keluarga', mime: ['application/pdf', 'image/jpeg'] }
        ]
      });
    }

    // Default: TPQ
    return successResponse({
      form_type: 'tpq',
      schema_version: '1.0',
      sections: [
        {
          id: 'santri_identity',
          title: 'A. Identitas Santri',
          fields: [
            { key: 'full_name', label: 'Nama Lengkap', type: 'text', required: true },
            { key: 'nickname', label: 'Nama Panggilan', type: 'text' },
            { key: 'gender', label: 'Jenis Kelamin', type: 'select', options: ['L', 'P'], required: true },
            { key: 'birth_place', label: 'Tempat Lahir', type: 'text', required: true },
            { key: 'birth_date', label: 'Tanggal Lahir', type: 'date', required: true },
            { key: 'child_order', label: 'Anak Ke', type: 'number' },
            { key: 'sibling_count', label: 'Jumlah Saudara', type: 'number' },
            { key: 'nik', label: 'No. NIK', type: 'text', pattern: '^[0-9]{16}$' },
            {
              key: 'address',
              label: 'Alamat Rumah',
              type: 'object',
              fields: [
                { key: 'provinsi', label: 'Provinsi', type: 'text' },
                { key: 'kabupaten', label: 'Kab/Kota', type: 'text' },
                { key: 'kecamatan', label: 'Kecamatan', type: 'text' },
                { key: 'desa', label: 'Desa/Kelurahan', type: 'text' },
                { key: 'alamat', label: 'Alamat', type: 'textarea' }
              ]
            },
            { key: 'phone1', label: 'Telepon/WA (1)', type: 'tel' },
            { key: 'phone2', label: 'Telepon/WA (2)', type: 'tel' }
          ]
        },
        {
          id: 'father',
          title: 'B. Identitas Ayah',
          fields: [
            { key: 'father_name', label: 'Nama Ayah', type: 'text', required: true },
            { key: 'father_occupation', label: 'Pekerjaan Ayah', type: 'text' },
            { key: 'father_education', label: 'Pendidikan Terakhir Ayah', type: 'select',
              options: ['SD', 'SMP', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3', 'Tidak Sekolah'] },
            { key: 'father_phone', label: 'Telepon/WA', type: 'tel', required: true }
          ]
        },
        {
          id: 'mother',
          title: 'C. Identitas Ibu',
          fields: [
            { key: 'mother_name', label: 'Nama Ibu', type: 'text' },
            { key: 'mother_occupation', label: 'Pekerjaan Ibu', type: 'text' },
            { key: 'mother_education', label: 'Pendidikan Terakhir Ibu', type: 'select',
              options: ['SD', 'SMP', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3', 'Tidak Sekolah'] },
            { key: 'mother_phone', label: 'Telepon/WA', type: 'tel' }
          ]
        },
        {
          id: 'guardian',
          title: 'D. Wali (jika ada)',
          fields: [
            { key: 'guardian_name', label: 'Nama Wali', type: 'text' },
            { key: 'guardian_occupation', label: 'Pekerjaan Wali', type: 'text' },
            { key: 'guardian_education', label: 'Pendidikan Terakhir Wali', type: 'select',
              options: ['SD', 'SMP', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3', 'Tidak Sekolah'] },
            { key: 'guardian_relation', label: 'Hubungan Wali', type: 'text' },
            { key: 'guardian_phone', label: 'Telepon/WA', type: 'tel' }
          ]
        },
        {
          id: 'registration',
          title: 'E. Pendaftaran',
          fields: [
            { key: 'registration_date', label: 'Tanggal Daftar', type: 'date',
              note: 'Otomatis saat mendaftar', readonly: true },
            { key: 'entry_date', label: 'Tanggal Masuk', type: 'date',
              note: 'Otomatis terisi sesuai tanggal diterimanya siswa', readonly: true },
            { key: 'nis_lokal', label: 'NIS Lokal', type: 'text',
              note: 'Diisi manual oleh guru atau petugas TU', readonly: true }
          ]
        }
      ],
      attachments: [
        { key: 'foto_santri', label: 'Foto Siswa (rapi)', mime: ['image/jpeg', 'image/png'] },
        { key: 'akta_kelahiran', label: 'Akta Kelahiran', mime: ['application/pdf', 'image/jpeg'] },
        { key: 'kartu_keluarga', label: 'Kartu Keluarga', mime: ['application/pdf', 'image/jpeg'] }
      ]
    });
  }

  return {
    submitPublic: submitPublic,
    getStatusPublic: getStatusPublic,
    updateByRegistrant: updateByRegistrant,
    list: list,
    getById: getRegistration,
    verify: verify,
    accept: accept,
    reject: reject,
    requestRevision: requestRevision,
    convertToStudent: convertToStudent,
    listPeriods: listPeriods,
    createPeriod: createPeriod,
    getFormSchema: getFormSchema,
    checkStatus: getStatusPublic
  };

})();

// Register handlers
PPDbHandlers.list = function (session, id, params) {
  return jsonResponse(PPDbService.list(session, params));
};
PPDbHandlers.get = function (session, id, params) {
  return jsonResponse(PPDbService.getById(session, id || params.id));
};
PPDbHandlers.verify = function (session, id, params) {
  return jsonResponse(PPDbService.verify(session, id || params.id));
};
PPDbHandlers.accept = function (session, id, params) {
  return jsonResponse(PPDbService.accept(session, id || params.id));
};
PPDbHandlers.approve = function (session, id, params) {
  return jsonResponse(PPDbService.accept(session, id || params.id));
};
PPDbHandlers.reject = function (session, id, params) {
  return jsonResponse(PPDbService.reject(session, id || params.id, params.reason));
};
PPDbHandlers.requestRevision = function (session, id, params) {
  return jsonResponse(PPDbService.requestRevision(session, id || params.id, params.notes));
};
PPDbHandlers.convert = function (session, id, params) {
  return jsonResponse(PPDbService.convertToStudent(session, id || params.id, params));
};
PPDbHandlers.periods = function (session, id, params) {
  return jsonResponse(PPDbService.listPeriods());
};
PPDbHandlers.createPeriod = function (session, id, params) {
  return jsonResponse(PPDbService.createPeriod(session, params));
};
PPDbHandlers.updateMine = function (session, id, params) {
  return jsonResponse(PPDbService.updateByRegistrant(session, params));
};
PPDbHandlers.formSchema = function (session, id, params) {
  return jsonResponse(PPDbService.getFormSchema(params.form_type));
};
PPDbHandlers.check_status = function (session, id, params) {
  return jsonResponse(PPDbService.checkStatus(params));
};
PPDbHandlers.submit = function (session, id, params, e) {
  return jsonResponse(PPDbService.submitPublic(params, e));
};
PPDbHandlers.register = PPDbHandlers.submit;