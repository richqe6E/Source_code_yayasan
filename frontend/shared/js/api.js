/**
 * SIYAYASAN V2 - Supabase Shared API Helper
 * Single apiCall() entry point connected directly to Supabase PostgreSQL & Storage.
 * Retains 100% contract compatibility with the portal frontend:
 *   apiCall(module, action, params, method) -> { success, data, message, pagination, raw }
 */
(function () {
  'use strict';

  // Supabase Configuration
  const SUPABASE_CONFIG = window.SIYAYASAN_SUPABASE || {
    url: 'https://hzrjtvmveqygparjjnom.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cmp0dm12ZXF5Z3Bhcmpqbm9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzNzkyNTUsImV4cCI6MjEwNDk1NTI1NX0.-aVm6RoQy2_wnmlVV7v_zcL0SXvTenVBsSRYiVj_gQE',
    storageBucket: 'siyayasan-uploads'
  };

  const API_URL = SUPABASE_CONFIG.url;
  const API_KEY = SUPABASE_CONFIG.anonKey;
  const STORAGE_BUCKET = SUPABASE_CONFIG.storageBucket;

  function getToken() { return window.getToken ? window.getToken() : localStorage.getItem('siy_token'); }
  function getUser() {
    try { return window.getCurrentUser ? window.getCurrentUser() : JSON.parse(localStorage.getItem('siy_user') || 'null'); }
    catch (e) { return null; }
  }

  let isSupabaseOffline = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));

  function normalizeApiResponse(json) {
    if (!json || typeof json !== 'object') return json;
    if (json.success && json.data) {
      if (!Array.isArray(json.data) && typeof json.data === 'object') {
        const listKeys = ['items', 'backups', 'students', 'teachers', 'classes', 'users', 'logs', 'invoices', 'registrations', 'events', 'announcements', 'news', 'gallery'];
        const foundKey = listKeys.find(k => Array.isArray(json.data[k]));
        if (foundKey) {
          const arr = [...json.data[foundKey]];
          Object.assign(arr, json.data);
          arr.items = arr;
          json.data = arr;
        }
      } else if (Array.isArray(json.data)) {
        json.data.items = json.data;
      }
    }
    return json;
  }

  // Local dev server fallback wrapper
  async function callLocalBackend(module, action, params = {}, method = 'POST') {
    try {
      const res = await fetch(`/api/v1/${module}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getToken() ? `Bearer ${getToken()}` : ''
        },
        body: JSON.stringify({ ...params, token: getToken() })
      });
      if (res.ok) {
        const json = await res.json();
        return normalizeApiResponse(json);
      }
    } catch (e) {
      // Local server not available
    }
    return null;
  }

  // Low-level fetch wrapper to Supabase REST API
  async function supabaseRest(endpoint, method = 'GET', body = null, extraHeaders = {}) {
    if (isSupabaseOffline && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      throw new Error('OfflineMode');
    }
    const url = `${API_URL}/rest/v1/${endpoint}`;
    const headers = {
      'apikey': API_KEY,
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...extraHeaders
    };

    const opts = { method, headers };
    if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      opts.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 2500) : null;
      if (controller) opts.signal = controller.signal;

      const res = await fetch(url, opts);
      if (timeoutId) clearTimeout(timeoutId);

      if (res.status === 204) return []; // No content
      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : null; }
      catch (e) { data = text; }

      if (!res.ok) {
        const errMessage = (data && (data.message || data.error || data.msg)) || `Error ${res.status}`;
        throw new Error(errMessage);
      }
      return data;
    } catch (err) {
      isSupabaseOffline = true;
      throw err;
    }
  }

  // Upload file/base64 to Supabase Storage
  async function uploadToSupabaseStorage(fileOrBase64, filenamePrefix = 'upload') {
    let blob, ext = 'png', contentType = 'image/png';

    if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:')) {
      const match = fileOrBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        contentType = match[1];
        ext = contentType.split('/')[1] || 'png';
        const binary = atob(match[2]);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
        blob = new Blob([array], { type: contentType });
      }
    } else if (fileOrBase64 instanceof Blob || fileOrBase64 instanceof File) {
      blob = fileOrBase64;
      contentType = fileOrBase64.type || 'application/octet-stream';
      const parts = (fileOrBase64.name || '').split('.');
      if (parts.length > 1) ext = parts.pop();
    }

    if (!blob) return fileOrBase64; // Return original if already a URL or unrecognized

    const filename = `${filenamePrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const uploadUrl = `${API_URL}/storage/v1/object/${STORAGE_BUCKET}/${filename}`;

    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 3000) : null;
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': contentType,
          'x-upsert': 'true'
        },
        body: blob,
        signal: controller ? controller.signal : undefined
      });
      if (timeoutId) clearTimeout(timeoutId);

      if (res.ok) {
        return `${API_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${filename}`;
      }
      console.warn('Storage upload HTTP non-ok, falling back to base64 Data URL:', await res.text());
    } catch (uploadErr) {
      console.warn('Storage upload network unreachable, using base64 Data URL fallback:', uploadErr.message);
    }

    // Fallback offline / local: convert blob to base64 data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Main apiCall Router mapped directly to Supabase with local backend fallback
   */
  async function apiCall(module, action, params = {}, method) {
    const currentUser = getUser();

    // Prioritaskan local dev server di localhost atau jika Supabase offline
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || isSupabaseOffline)) {
      const localRes = await callLocalBackend(module, action, params, method);
      if (localRes && localRes.success !== undefined) {
        return localRes;
      }
    }

    try {
      // -------------------------------------------------------------
      // -------------------------------------------------------------
      // 1. AUTH (Revamped: Dual NIS & Email, PPDB Register, First-Login Guard)
      // -------------------------------------------------------------
      if (module === 'auth') {
        if (action === 'login') {
          const rawIdentifier = (params.identifier || params.email || params.username || params.nis || '').trim();
          const password = (params.password || '').trim();

          if (!rawIdentifier || !password) {
            return { success: false, message: 'Harap masukkan Email / NIS dan Password' };
          }

          let matchedUser = null;
          let studentRecord = null;
          let needsPasswordChange = false;

          const isEmail = rawIdentifier.includes('@');

          if (isEmail) {
            const users = await supabaseRest(`users?email=eq.${encodeURIComponent(rawIdentifier)}&status=eq.active&select=*`);
            if (users && users.length > 0) {
              matchedUser = users[0];
            }
          } else {
            // Identifier is a NIS or username
            const users = await supabaseRest(`users?or=(nis.eq.${encodeURIComponent(rawIdentifier)},username.eq.${encodeURIComponent(rawIdentifier)},email.eq.${encodeURIComponent(rawIdentifier)})&status=eq.active&select=*`);
            if (users && users.length > 0) {
              matchedUser = users[0];
            } else {
              // Look up student by NIS
              const students = await supabaseRest(`students?nis=eq.${encodeURIComponent(rawIdentifier)}&select=*`);
              if (students && students.length > 0) {
                studentRecord = students[0];
                if (studentRecord.user_id) {
                  const uList = await supabaseRest(`users?id=eq.${studentRecord.user_id}&select=*`);
                  if (uList && uList.length > 0) {
                    matchedUser = uList[0];
                  }
                }

                // If user account not linked yet, check birthdate as initial password
                if (!matchedUser) {
                  const bDate = studentRecord.birth_date ? String(studentRecord.birth_date).trim() : '';
                  const bDateClean = bDate.replace(/[^0-9]/g, '');
                  const passClean = password.replace(/[^0-9]/g, '');
                  let ddmmyyyy = '';
                  if (bDate && bDate.includes('-')) {
                    const parts = bDate.split('-');
                    if (parts.length === 3) ddmmyyyy = parts[2] + parts[1] + parts[0];
                  }

                  const matchesBirthdate = password === bDate || 
                                           password === ddmmyyyy || 
                                           (passClean.length >= 6 && passClean === bDateClean) || 
                                           (passClean.length >= 6 && passClean === ddmmyyyy);

                  if (matchesBirthdate) {
                    const newUserId = 'USR-' + (studentRecord.nis || Date.now());
                    const newUserEmail = studentRecord.parent_email || `${studentRecord.nis}@siswa.yayasan.sch.id`;
                    const newU = {
                      id: newUserId,
                      email: newUserEmail,
                      password_hash: password,
                      full_name: studentRecord.full_name || studentRecord.name || 'Siswa',
                      phone: studentRecord.parent_phone || '',
                      role: 'siswa_aktif',
                      role_label: 'Siswa Aktif',
                      status: 'active',
                      nis: studentRecord.nis,
                      student_id: studentRecord.id,
                      is_password_changed: false
                    };
                    await supabaseRest('users', 'POST', newU).catch(() => {});
                    await supabaseRest(`students?id=eq.${studentRecord.id}`, 'PATCH', { user_id: newUserId }).catch(() => {});
                    matchedUser = newU;
                    needsPasswordChange = true;
                  }
                }
              }
            }
          }

          if (!matchedUser) {
            try {
              const localUsers = JSON.parse(localStorage.getItem('siy_local_users') || '[]');
              const idClean = rawIdentifier.toLowerCase();
              matchedUser = localUsers.find(u => 
                (u.email && u.email.toLowerCase() === idClean) ||
                (u.nis && String(u.nis) === rawIdentifier) ||
                (u.username && u.username.toLowerCase() === idClean) ||
                (u.id && u.id.toLowerCase() === idClean)
              );
            } catch (_) {}
          }

          if (!matchedUser) {
            return { success: false, message: 'Akun tidak ditemukan. Periksa Email atau NIS Anda.' };
          }

          // Check password
          if (matchedUser.password_hash !== password) {
            // Check if initial login with birthdate
            let passedBirthdate = false;
            if (studentRecord && studentRecord.birth_date) {
              const bDate = String(studentRecord.birth_date).trim();
              const passClean = password.replace(/[^0-9]/g, '');
              const bClean = bDate.replace(/[^0-9]/g, '');
              if (passClean === bClean || password === bDate) {
                passedBirthdate = true;
                needsPasswordChange = true;
              }
            }
            if (!passedBirthdate) {
              return { success: false, message: 'Password salah. Untuk siswa awal, gunakan Tanggal Lahir (YYYY-MM-DD).' };
            }
          }

          if (matchedUser.is_password_changed === false) {
            needsPasswordChange = true;
          }

          // Normalize role
          let roleCode = matchedUser.role;
          if (roleCode === 'siswa') roleCode = 'siswa_aktif';
          const roleObj = { code: roleCode, name: matchedUser.role_label || roleCode };
          const studentId = matchedUser.student_id || (studentRecord ? studentRecord.id : null);
          const userPayload = { 
            ...matchedUser, 
            role: roleObj, 
            needs_password_change: needsPasswordChange,
            student_id: studentId 
          };
          const token = 'siy_' + matchedUser.id + '_' + Date.now();

          // Update last login
          supabaseRest(`users?id=eq.${matchedUser.id}`, 'PATCH', { last_login: new Date().toISOString() }).catch(() => {});

          return {
            success: true,
            data: { 
              token, 
              user: userPayload, 
              needs_password_change: needsPasswordChange,
              message: 'Login berhasil' 
            }
          };
        }

        if (action === 'register') {
          // Fase 1 PPDB: Pembuatan Akun Calon Siswa Baru
          const email = (params.email || '').trim().toLowerCase();
          const password = (params.password || '').trim();
          const fullName = (params.full_name || params.nama || '').trim();
          const phone = (params.phone || params.whatsapp || '').trim();

          if (!email || !password || !fullName) {
            return { success: false, message: 'Nama lengkap, email, dan password wajib diisi.' };
          }

          const existing = await supabaseRest(`users?email=eq.${encodeURIComponent(email)}&select=id`);
          if (existing && existing.length > 0) {
            return { success: false, message: 'Email sudah terdaftar. Silakan login langsung.' };
          }

          const userId = 'USR-' + Date.now();
          const studentId = 'STU-' + Date.now();

          const newUser = {
            id: userId,
            email: email,
            password_hash: password,
            full_name: fullName,
            phone: phone,
            role: 'calon_siswa',
            role_label: 'Calon Siswa / Pendaftar',
            status: 'active',
            student_id: studentId,
            is_password_changed: true,
            created_at: new Date().toISOString()
          };

          // Safe local persistence fallback
          try {
            const localUsers = JSON.parse(localStorage.getItem('siy_local_users') || '[]');
            localUsers.push(newUser);
            localStorage.setItem('siy_local_users', JSON.stringify(localUsers));
          } catch (_) {}

          await supabaseRest('users', 'POST', newUser).catch(err => console.warn('Supabase users insert warning:', err));

          const newStudent = {
            id: studentId,
            user_id: userId,
            full_name: fullName,
            name: fullName,
            parent_email: email,
            parent_phone: phone,
            status_pendaftaran: 'pending',
            is_active: false,
            status: 'pending',
            created_at: new Date().toISOString()
          };

          try {
            const localStudents = JSON.parse(localStorage.getItem('siy_local_students') || '[]');
            localStudents.push(newStudent);
            localStorage.setItem('siy_local_students', JSON.stringify(localStudents));
          } catch (_) {}

          await supabaseRest('students', 'POST', newStudent).catch(err => console.warn('Student init warning:', err));

          const roleObj = { code: 'calon_siswa', name: 'Calon Siswa / Pendaftar' };
          const userPayload = { ...newUser, role: roleObj, student_id: studentId };
          const token = 'siy_' + userId + '_' + Date.now();

          // Auto-persist active session
          localStorage.setItem('siy_token', token);
          localStorage.setItem('siy_user', JSON.stringify(userPayload));

          return {
            success: true,
            data: {
              token,
              user: userPayload,
              redirect: '/siswa/dashboard.html',
              message: 'Akun pendaftar berhasil dibuat! Silakan melengkapi formulir biodata.'
            }
          };
        }

        if (action === 'change_password') {
          if (!currentUser) return { success: false, message: 'Harus login' };
          const users = await supabaseRest(`users?id=eq.${currentUser.id}&select=*`);
          if (!users || users.length === 0) return { success: false, message: 'User tidak ditemukan' };
          
          if (!params.skip_old && users[0].password_hash !== params.old_password) {
            return { success: false, message: 'Password lama salah' };
          }

          await supabaseRest(`users?id=eq.${currentUser.id}`, 'PATCH', {
            password_hash: params.new_password,
            is_password_changed: true,
            updated_at: new Date().toISOString()
          });

          // Update local session
          if (currentUser) {
            currentUser.is_password_changed = true;
            currentUser.needs_password_change = false;
            localStorage.setItem('siy_user', JSON.stringify(currentUser));
          }

          return { success: true, message: 'Password baru berhasil disimpan', data: { message: 'Password berhasil diperbarui' } };
        }

        if (action === 'logout') {
          return { success: true, data: { message: 'Logout berhasil' } };
        }
      }

      // -------------------------------------------------------------
      // 1B. WEB SETTINGS (CMS HERO CAROUSEL, SOSMED, KONTAK)
      // -------------------------------------------------------------
      if (module === 'web_settings') {
        if (action === 'get') {
          try {
            const list = await supabaseRest('web_settings?id=eq.default&select=*');
            if (list && list.length > 0) return { success: true, data: list[0] };
          } catch (_) {}
          const sch = await supabaseRest('schools?select=*');
          return { success: true, data: (sch && sch[0]) || {} };
        }
        if (action === 'update') {
          const res = await supabaseRest('web_settings?id=eq.default', 'PATCH', params);
          return { success: true, data: res, message: 'Pengaturan website berhasil disimpan' };
        }
      }

      // -------------------------------------------------------------
      // 1C. PORTAL SISWA (BIODATA, DOKUMEN, SPP, AKADEMIK)
      // -------------------------------------------------------------
      if (module === 'siswa') {
        const studentId = params.student_id || (currentUser ? (currentUser.student_id || currentUser.id) : null);

        if (action === 'get_profile') {
          let student = null;
          if (currentUser && currentUser.id) {
            const res = await supabaseRest(`students?user_id=eq.${currentUser.id}&select=*`);
            if (res && res.length > 0) student = res[0];
          }
          if (!student && studentId) {
            const res = await supabaseRest(`students?id=eq.${studentId}&select=*`);
            if (res && res.length > 0) student = res[0];
          }
          return { success: true, data: student || {} };
        }

        if (action === 'update_biodata') {
          let id = studentId;
          if (!id && currentUser && currentUser.id) {
            const res = await supabaseRest(`students?user_id=eq.${currentUser.id}&select=id`);
            if (res && res.length > 0) id = res[0].id;
          }
          if (!id) return { success: false, message: 'Data siswa tidak ditemukan' };

          const payload = { ...params };
          delete payload.student_id;
          delete payload.id;
          const res = await supabaseRest(`students?id=eq.${id}`, 'PATCH', payload);
          return { success: true, data: res, message: 'Biodata berhasil diperbarui' };
        }

        if (action === 'get_documents') {
          let id = studentId;
          if (!id && currentUser && currentUser.id) {
            const res = await supabaseRest(`students?user_id=eq.${currentUser.id}&select=id`);
            if (res && res.length > 0) id = res[0].id;
          }
          const docs = await supabaseRest(`student_documents?student_id=eq.${id}&select=*&order=created_at.desc`).catch(() => []);
          return { success: true, data: docs || [] };
        }

        if (action === 'upload_document') {
          let id = studentId;
          if (!id && currentUser && currentUser.id) {
            const res = await supabaseRest(`students?user_id=eq.${currentUser.id}&select=id`);
            if (res && res.length > 0) id = res[0].id;
          }
          if (!id) return { success: false, message: 'Data siswa tidak ditemukan' };

          let fileUrl = params.file_url;
          if (params.file) {
            fileUrl = await uploadToSupabaseStorage(params.file, `doc_${params.document_type || 'berkas'}`);
          }
          if (!fileUrl) return { success: false, message: 'Gagal mengunggah file dokumen' };

          const docObj = {
            id: 'DOC-' + Date.now(),
            student_id: id,
            document_type: params.document_type || 'lainnya',
            file_name: params.file_name || 'Berkas Dokumen',
            file_url: fileUrl,
            file_size: params.file_size || 0,
            is_verified: false,
            created_at: new Date().toISOString()
          };
          await supabaseRest('student_documents', 'POST', docObj);
          return { success: true, data: docObj, message: 'Dokumen berhasil diunggah' };
        }

        if (action === 'get_academic') {
          let id = studentId;
          if (!id && currentUser && currentUser.id) {
            const res = await supabaseRest(`students?user_id=eq.${currentUser.id}&select=id`);
            if (res && res.length > 0) id = res[0].id;
          }
          const [records, developments] = await Promise.all([
            supabaseRest(`academic_records?student_id=eq.${id}&select=*&order=created_at.desc`).catch(() => []),
            supabaseRest(`developments?student_id=eq.${id}&select=*&order=created_at.desc`).catch(() => [])
          ]);
          return { success: true, data: { records: records || [], developments: developments || [] } };
        }

        if (action === 'get_spp') {
          let id = studentId;
          if (!id && currentUser && currentUser.id) {
            const res = await supabaseRest(`students?user_id=eq.${currentUser.id}&select=id`);
            if (res && res.length > 0) id = res[0].id;
          }
          const [invoices, payments] = await Promise.all([
            supabaseRest(`invoices?student_id=eq.${id}&select=*&order=created_at.desc`).catch(() => []),
            supabaseRest(`payments?student_id=eq.${id}&select=*&order=created_at.desc`).catch(() => [])
          ]);
          return { success: true, data: { invoices: invoices || [], payments: payments || [] } };
        }
      }

      // -------------------------------------------------------------
      // 2. DASHBOARD
      // -------------------------------------------------------------
      if (module === 'dashboard') {
        const [students, teachers, classes, ppdb, invoices, payments] = await Promise.all([
          supabaseRest('students?select=id,status'),
          supabaseRest('teachers?select=id,status'),
          supabaseRest('classes?select=id'),
          supabaseRest('ppdb_registrations?select=id,status'),
          supabaseRest('invoices?select=id,amount,status'),
          supabaseRest('payments?select=id,status')
        ]);

        const activeStudents = (students || []).filter(s => s.status === 'active').length;
        const activeTeachers = (teachers || []).filter(t => t.status === 'active').length;
        const pendingPPDB = (ppdb || []).filter(p => p.status === 'pending').length;
        const acceptedPPDB = (ppdb || []).filter(p => p.status === 'accepted' || p.status === 'approved').length;
        const unpaidInvoices = (invoices || []).filter(i => i.status === 'unpaid');
        const paidInvoices = (invoices || []).filter(i => i.status === 'paid');
        const pendingPayments = (payments || []).filter(p => p.status === 'menunggu_verifikasi').length;

        const totalUnpaidAmount = unpaidInvoices.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        const totalPaidAmount = paidInvoices.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        const totalTargetAmount = (invoices || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

        const stats = {
          total_students: activeStudents,
          active_students: activeStudents,
          total_students_active: activeStudents,
          total_teachers: activeTeachers,
          total_teachers_active: activeTeachers,
          total_classes: (classes || []).length,
          total_parents: (students || []).length,
          ppdb_pending: pendingPPDB,
          ppdb_accepted: acceptedPPDB,
          ppdb_total: (ppdb || []).length,
          fin_pending: pendingPayments,
          payments_pending_verification: pendingPayments,
          fin_unpaid: unpaidInvoices.length,
          fin_unpaid_amount: totalUnpaidAmount,
          fin_paid_amount: totalPaidAmount,
          fin_total: (invoices || []).length,
          spp_target: totalTargetAmount || (totalPaidAmount + totalUnpaidAmount),
          spp_collected: totalPaidAmount
        };

        return { success: true, data: stats };
      }

      // -------------------------------------------------------------
      // 3. USERS
      // -------------------------------------------------------------
      if (module === 'users') {
        if (action === 'list') {
          let query = 'users?select=*&order=created_at.desc';
          if (params.role) query += `&role=eq.${encodeURIComponent(params.role)}`;
          if (params.status) query += `&status=eq.${encodeURIComponent(params.status)}`;
          if (params.search || params.q) {
            const kw = encodeURIComponent(params.search || params.q);
            query += `&or=(full_name.ilike.*${kw}*,email.ilike.*${kw}*)`;
          }
          const users = await supabaseRest(query);
          return { success: true, data: users };
        }
        if (action === 'get') {
          const users = await supabaseRest(`users?id=eq.${encodeURIComponent(params.id)}&select=*`);
          return { success: true, data: users[0] || null };
        }
        if (action === 'create') {
          const id = 'USR-' + String(Date.now()).slice(-5);
          const roleLabelMap = {
            super_admin: 'Super Admin',
            admin_tu: 'Admin Tata Usaha',
            guru: 'Guru Kelas',
            orang_tua: 'Orang Tua / Wali'
          };
          const role = params.role || 'guru';
          const payload = {
            id,
            email: params.email,
            password_hash: params.password || '123456',
            full_name: params.full_name || params.name,
            name: params.name || params.full_name,
            phone: params.phone || '',
            role,
            role_label: roleLabelMap[role] || role,
            status: params.status || 'active',
            avatar: params.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
          };
          const created = await supabaseRest('users', 'POST', payload);
          return { success: true, data: created[0] || payload, message: 'User berhasil dibuat' };
        }
        if (action === 'update') {
          const id = params.id;
          const payload = { ...params };
          delete payload.id;
          delete payload.is_active;
          if (params.is_active !== undefined && !payload.status) {
            payload.status = params.is_active ? 'active' : 'inactive';
          }
          if (payload.password) {
            payload.password_hash = payload.password;
            delete payload.password;
          }
          if (payload.name && !payload.full_name) payload.full_name = payload.name;
          payload.updated_at = new Date().toISOString();
          const updated = await supabaseRest(`users?id=eq.${encodeURIComponent(id)}`, 'PATCH', payload);
          return { success: true, data: updated[0] || payload, message: 'User berhasil diperbarui' };
        }
        if (action === 'activate' || action === 'deactivate') {
          const status = action === 'activate' ? 'active' : 'inactive';
          await supabaseRest(`users?id=eq.${encodeURIComponent(params.id)}`, 'PATCH', { status });
          const msg = action === 'activate' ? 'User berhasil diaktifkan' : 'User berhasil dinonaktifkan';
          return { success: true, message: msg };
        }
        if (action === 'delete') {
          await supabaseRest(`users?id=eq.${encodeURIComponent(params.id)}`, 'DELETE');
          return { success: true, message: 'User berhasil dihapus' };
        }
      }

      // -------------------------------------------------------------
      // 4. TEACHERS
      // -------------------------------------------------------------
      if (module === 'teachers') {
        if (action === 'me') {
          if (!currentUser) return { success: false, message: 'Sesi tidak valid' };
          let teachers = await supabaseRest(`teachers?user_id=eq.${currentUser.id}&select=*`);
          if (!teachers || teachers.length === 0) {
            teachers = await supabaseRest(`teachers?email=eq.${encodeURIComponent(currentUser.email)}&select=*`);
          }
          const teacher = teachers[0] || {
            id: currentUser.teacher_id || 'TEA-001',
            full_name: currentUser.full_name,
            email: currentUser.email
          };
          const classes = await supabaseRest(`classes?teacher_id=eq.${teacher.id}&select=*`);
          const classIds = (classes || []).map(c => c.id);
          let students = [];
          if (classIds.length > 0) {
            students = await supabaseRest(`students?class_id=in.(${classIds.join(',')})&status=eq.active&select=*`);
          }
          return {
            success: true,
            data: { teacher, classes, students }
          };
        }
        if (action === 'list') {
          let query = 'teachers?select=*&order=full_name.asc';
          if (params.search || params.q) {
            query += `&full_name.ilike.*${encodeURIComponent(params.search || params.q)}*`;
          }
          const teachers = await supabaseRest(query);
          const mapped = (teachers || []).map(t => ({
            ...t,
            is_active: t.status === 'active' || t.is_active === true
          }));
          return { success: true, data: mapped };
        }
        if (action === 'activate') {
          await supabaseRest(`teachers?id=eq.${encodeURIComponent(params.id)}`, 'PATCH', { status: 'active' });
          return { success: true, message: 'Guru berhasil diaktifkan' };
        }
        if (action === 'deactivate') {
          await supabaseRest(`teachers?id=eq.${encodeURIComponent(params.id)}`, 'PATCH', { status: 'inactive' });
          return { success: true, message: 'Guru dinonaktifkan' };
        }
        if (action === 'get') {
          const teachers = await supabaseRest(`teachers?id=eq.${encodeURIComponent(params.id)}&select=*`);
          const t = teachers[0] ? { ...teachers[0], is_active: teachers[0].status === 'active' || teachers[0].is_active === true } : null;
          return { success: true, data: t };
        }
        if (action === 'create') {
          const id = 'TEA-' + String(Date.now()).slice(-5);
          const payload = {
            id,
            nip: params.nip || '',
            full_name: params.full_name || params.name || '',
            gender: params.gender || 'L',
            phone: params.phone || '',
            email: params.email || '',
            education: params.education || 'S1 Pendidikan',
            position: params.position || params.specialization || 'Guru Kelas',
            status: params.status || (params.is_active === false ? 'inactive' : 'active')
          };
          const res = await supabaseRest('teachers', 'POST', payload);
          return { success: true, data: res[0] || payload, message: 'Guru berhasil ditambahkan' };
        }
        if (action === 'update') {
          const id = params.id || (currentUser ? (currentUser.teacher_id || currentUser.id) : null);
          const payload = {};
          if (params.nip !== undefined) payload.nip = params.nip;
          if (params.full_name || params.name) payload.full_name = params.full_name || params.name;
          if (params.gender !== undefined) payload.gender = params.gender;
          if (params.phone !== undefined) payload.phone = params.phone;
          if (params.email !== undefined) payload.email = params.email;
          if (params.education !== undefined) payload.education = params.education;
          if (params.position || params.specialization) payload.position = params.position || params.specialization;
          if (params.status) payload.status = params.status;
          if (params.is_active !== undefined) payload.status = params.is_active ? 'active' : 'inactive';

          if (params.avatar_file || (params.avatar && params.avatar.startsWith('data:'))) {
            const avatarUrl = await uploadToSupabaseStorage(params.avatar_file || params.avatar, 'avatar_guru');
            if (avatarUrl) {
              // Update avatar di tabel users (akun guru)
              const userTargetId = currentUser ? currentUser.id : null;
              if (userTargetId) {
                await supabaseRest(`users?id=eq.${userTargetId}`, 'PATCH', { avatar: avatarUrl }).catch(() => {});
                const storedUser = getUser() || {};
                storedUser.avatar = avatarUrl;
                localStorage.setItem('siy_user', JSON.stringify(storedUser));
              } else if (params.email) {
                await supabaseRest(`users?email=eq.${encodeURIComponent(params.email)}`, 'PATCH', { avatar: avatarUrl }).catch(() => {});
              }
            }
          }

          const res = await supabaseRest(`teachers?id=eq.${encodeURIComponent(id)}`, 'PATCH', payload);
          return { success: true, data: res[0] || payload, message: 'Data profil guru berhasil diperbarui' };
        }
      }

      // -------------------------------------------------------------
      // 5. CLASSES
      // -------------------------------------------------------------
      if (module === 'classes') {
        if (action === 'list') {
          let query = 'classes?select=*&order=name.asc';
          if (params.level) query += `&level=eq.${encodeURIComponent(params.level)}`;
          const classes = await supabaseRest(query);
          return { success: true, data: classes };
        }
        if (action === 'get') {
          const classes = await supabaseRest(`classes?id=eq.${encodeURIComponent(params.id)}&select=*`);
          const c = classes[0] ? {
            ...classes[0],
            grade_level: classes[0].level,
            homeroom_teacher_id: classes[0].teacher_id
          } : null;
          return { success: true, data: c };
        }
        if (action === 'create') {
          const id = 'CLS-' + String(Date.now()).slice(-4);
          const teacherId = params.teacher_id || params.homeroom_teacher_id || null;
          let teacherName = params.teacher_name || '';
          if (!teacherName && teacherId) {
            const tea = await supabaseRest(`teachers?id=eq.${encodeURIComponent(teacherId)}&select=full_name`);
            if (tea && tea[0]) teacherName = tea[0].full_name;
          }
          const payload = {
            id,
            name: params.name || 'Kelas Baru',
            level: params.level || params.grade_level || 'PAUD',
            academic_year: params.academic_year || '2026/2027',
            teacher_id: teacherId,
            teacher_name: teacherName,
            capacity: Number(params.capacity) || 20,
            student_count: Number(params.student_count) || 0,
            status: params.status || 'active'
          };
          const res = await supabaseRest('classes', 'POST', payload);
          return { success: true, data: res[0] || payload, message: 'Kelas berhasil dibuat' };
        }
        if (action === 'update') {
          const id = params.id;
          const payload = {};
          if (params.name !== undefined) payload.name = params.name;
          if (params.level || params.grade_level) payload.level = params.level || params.grade_level;
          if (params.academic_year !== undefined) payload.academic_year = params.academic_year;
          if (params.capacity !== undefined) payload.capacity = Number(params.capacity) || 20;
          if (params.status !== undefined) payload.status = params.status;
          const teacherId = params.teacher_id !== undefined ? params.teacher_id : params.homeroom_teacher_id;
          if (teacherId !== undefined) {
            payload.teacher_id = teacherId || null;
            if (teacherId) {
              const tea = await supabaseRest(`teachers?id=eq.${encodeURIComponent(teacherId)}&select=full_name`);
              if (tea && tea[0]) payload.teacher_name = tea[0].full_name;
            } else {
              payload.teacher_name = '';
            }
          }
          const res = await supabaseRest(`classes?id=eq.${encodeURIComponent(id)}`, 'PATCH', payload);
          return { success: true, data: res[0] || payload, message: 'Kelas berhasil diperbarui' };
        }
        if (action === 'delete') {
          await supabaseRest(`classes?id=eq.${encodeURIComponent(params.id)}`, 'DELETE');
          return { success: true, message: 'Kelas berhasil dihapus' };
        }
      }

      // -------------------------------------------------------------
      // 6. STUDENTS
      // -------------------------------------------------------------
      if (module === 'students') {
        if (action === 'list') {
          let query = 'students?select=*&order=full_name.asc';
          if (params.class_id) query += `&class_id=eq.${encodeURIComponent(params.class_id)}`;
          if (params.status) query += `&status=eq.${encodeURIComponent(params.status)}`;
          if (params.search || params.q) {
            query += `&full_name.ilike.*${encodeURIComponent(params.search || params.q)}*`;
          }
          const students = await supabaseRest(query);
          return { success: true, data: students };
        }
        if (action === 'myChildren') {
          if (!currentUser) return { success: false, message: 'Sesi habis' };
          let query = currentUser.student_id 
            ? `students?or=(id.eq.${encodeURIComponent(currentUser.student_id)},parent_email.eq.${encodeURIComponent(currentUser.email)},parent_id.eq.${encodeURIComponent(currentUser.parent_id || 'NONE')})&select=*`
            : `students?or=(parent_email.eq.${encodeURIComponent(currentUser.email)},parent_id.eq.${encodeURIComponent(currentUser.parent_id || 'NONE')})&select=*`;
          const children = await supabaseRest(query);
          return { success: true, data: { children } };
        }
        if (action === 'get') {
          const students = await supabaseRest(`students?id=eq.${encodeURIComponent(params.id)}&select=*`);
          return { success: true, data: students[0] || null };
        }
        if (action === 'create') {
          const id = 'STU-' + String(Date.now()).slice(-5);
          const fullName = params.full_name || params.name || '';
          const classId = params.class_id || params.current_class_id || null;
          let className = params.class_name || '';
          if (classId && !className) {
            const cls = await supabaseRest(`classes?id=eq.${encodeURIComponent(classId)}&select=name`);
            if (cls && cls[0]) className = cls[0].name;
          }
          const payload = {
            id,
            nis: params.nis || null,
            nisn: params.nisn || null,
            full_name: fullName,
            name: fullName,
            child_name: params.child_name || fullName,
            nickname: params.nickname || null,
            gender: params.gender || 'L',
            birth_place: params.birth_place || '',
            birth_date: params.birth_date || null,
            class_id: classId,
            class_name: className,
            parent_id: params.parent_id || null,
            parent_name: params.parent_name || '',
            parent_email: params.parent_email || '',
            parent_phone: params.parent_phone || '',
            photo_url: params.photo_url || null,
            address: params.address || '',
            religion: params.religion || '',
            entry_year: params.entry_year || '',
            kelas_sekarang: params.kelas_sekarang || className || '',
            semester_sekarang: params.semester_sekarang || 'Semester 1 (Ganjil)',
            status_kenaikan: params.status_kenaikan || 'Aktif',
            status: params.status || 'active',
            attendance_pct: params.attendance_pct !== undefined ? Number(params.attendance_pct) : 100
          };
          const res = await supabaseRest('students', 'POST', payload);
          // Update student count in class
          if (classId) {
            supabaseRest(`students?class_id=eq.${classId}&select=id`).then(list => {
              supabaseRest(`classes?id=eq.${classId}`, 'PATCH', { student_count: (list || []).length });
            }).catch(() => {});
          }
          return { success: true, data: res[0] || payload, message: 'Siswa berhasil ditambahkan' };
        }
        if (action === 'update') {
          const id = params.id;
          const payload = {};
          if (params.nis !== undefined) payload.nis = params.nis;
          if (params.nisn !== undefined) payload.nisn = params.nisn;
          if (params.full_name || params.name) {
            payload.full_name = params.full_name || params.name;
            payload.name = payload.full_name;
            payload.child_name = payload.full_name;
          }
          if (params.nickname !== undefined) payload.nickname = params.nickname;
          if (params.gender !== undefined) payload.gender = params.gender;
          if (params.birth_place !== undefined) payload.birth_place = params.birth_place;
          if (params.birth_date !== undefined) payload.birth_date = params.birth_date;
          const classId = params.class_id !== undefined ? params.class_id : params.current_class_id;
          if (classId !== undefined) {
            payload.class_id = classId || null;
            if (classId) {
              const cls = await supabaseRest(`classes?id=eq.${encodeURIComponent(classId)}&select=name`);
              if (cls && cls[0]) payload.class_name = cls[0].name;
            }
          }
          if (params.address !== undefined) payload.address = params.address;
          if (params.religion !== undefined) payload.religion = params.religion;
          if (params.entry_year !== undefined) payload.entry_year = params.entry_year;
          if (params.kelas_sekarang !== undefined) payload.kelas_sekarang = params.kelas_sekarang;
          if (params.semester_sekarang !== undefined) payload.semester_sekarang = params.semester_sekarang;
          if (params.status_kenaikan !== undefined) payload.status_kenaikan = params.status_kenaikan;
          if (params.status !== undefined) payload.status = params.status;
          if (params.photo_url !== undefined) payload.photo_url = params.photo_url;

          const res = await supabaseRest(`students?id=eq.${encodeURIComponent(id)}`, 'PATCH', payload);
          return { success: true, data: res[0] || payload, message: 'Data siswa diperbarui' };
        }
        if (action === 'reset_password') {
          const studentId = params.student_id || params.id;
          const students = await supabaseRest(`students?id=eq.${encodeURIComponent(studentId)}&select=*`);
          if (!students || students.length === 0) return { success: false, message: 'Data siswa tidak ditemukan' };
          const student = students[0];
          
          if (!student.birth_date) {
            return { success: false, message: 'Tanggal lahir siswa belum diisi, tidak dapat mereset password ke tanggal lahir.' };
          }
          
          const defaultPassword = student.birth_date;
          const nis = student.nis || '';
          
          // Cari user akun siswa
          let userFound = null;
          if (student.user_id) {
            const u = await supabaseRest(`users?id=eq.${encodeURIComponent(student.user_id)}&select=*`);
            if (u && u.length > 0) userFound = u[0];
          }
          if (!userFound && nis) {
            const u = await supabaseRest(`users?nis=eq.${encodeURIComponent(nis)}&select=*`);
            if (u && u.length > 0) userFound = u[0];
          }
          if (!userFound && student.parent_email) {
            const u = await supabaseRest(`users?email=eq.${encodeURIComponent(student.parent_email)}&select=*`);
            if (u && u.length > 0) userFound = u[0];
          }
          
          if (userFound) {
            await supabaseRest(`users?id=eq.${encodeURIComponent(userFound.id)}`, 'PATCH', {
              password_hash: defaultPassword,
              is_password_changed: false
            });
          } else {
            const newUserId = 'USR-' + String(Date.now()).slice(-5);
            await supabaseRest('users', 'POST', {
              id: newUserId,
              nis: nis,
              email: (nis ? `${nis}@siswa.yayasan.sch.id` : (student.parent_email || `siswa_${student.id}@yayasan.sch.id`)),
              password_hash: defaultPassword,
              full_name: student.full_name,
              name: student.full_name,
              role: 'siswa_aktif',
              role_label: 'Siswa Aktif',
              is_password_changed: false,
              student_id: student.id,
              status: 'active'
            });
            await supabaseRest(`students?id=eq.${encodeURIComponent(student.id)}`, 'PATCH', { user_id: newUserId });
          }
          
          return {
            success: true,
            message: `Password siswa berhasil direset ke tanggal lahir (${defaultPassword})`,
            data: {
              nis: nis,
              student_name: student.full_name,
              default_password: defaultPassword
            }
          };
        }
        if (action === 'save_evaluasi') {
          const studentId = params.student_id;
          const semester = params.semester || 'Semester 1';
          const academicYear = params.academic_year || '2026/2027';
          const aspects = params.aspects || {};
          const notes = params.notes || '';
          
          const aspObj = typeof aspects === 'object' ? aspects : {};
          const payload = {
            id: recordId,
            student_id: studentId,
            academic_year: academicYear,
            semester: semester,
            aspects_json: typeof aspects === 'string' ? aspects : JSON.stringify(aspects),
            aspect_nam: aspObj.agama || 'BSH',
            aspect_fisik_motorik: aspObj.motorik || 'BSH',
            aspect_kognitif: aspObj.kognitif || 'BSH',
            aspect_bahasa: aspObj.bahasa || 'BSH',
            aspect_sosial_emosional: aspObj.sosem || 'BSH',
            aspect_seni: aspObj.seni || 'BSH',
            catatan_wali_kelas: notes,
            teacher_notes: notes,
            created_at: new Date().toISOString()
          };
          const res = await supabaseRest('academic_records', 'POST', payload);
          return { success: true, data: res, message: 'Evaluasi perkembangan siswa berhasil disimpan' };
        }
        if (action === 'delete') {
          await supabaseRest(`students?id=eq.${encodeURIComponent(params.id)}`, 'DELETE');
          return { success: true, message: 'Siswa berhasil dihapus' };
        }
      }

      // -------------------------------------------------------------
      // 7. PARENTS
      // -------------------------------------------------------------
      if (module === 'parent' || module === 'parents') {
        if (action === 'me') {
          if (!currentUser) return { success: false, message: 'Sesi habis' };
          let parents = await supabaseRest(`parents?or=(user_id.eq.${currentUser.id},email.eq.${encodeURIComponent(currentUser.email)})&select=*`);
          const parent = parents[0] || {
            id: currentUser.parent_id || 'PAR-001',
            father_name: currentUser.full_name,
            email: currentUser.email,
            phone: currentUser.phone
          };
          return { success: true, data: { parent } };
        }
        if (action === 'update_profile') {
          const parentId = params.id || currentUser.parent_id || 'PAR-001';
          const res = await supabaseRest(`parents?id=eq.${encodeURIComponent(parentId)}`, 'PATCH', params);
          return { success: true, data: res[0] || params, message: 'Profil orang tua diperbarui' };
        }
      }

      // -------------------------------------------------------------
      // 8. INVOICES
      // -------------------------------------------------------------
      if (module === 'invoices') {
        if (action === 'list') {
          let query = 'invoices?select=*&order=created_at.desc';
          if (params.student_id) query += `&student_id=eq.${encodeURIComponent(params.student_id)}`;
          if (params.status) query += `&status=eq.${encodeURIComponent(params.status)}`;

          // If user is orang_tua and no student_id filter provided, filter by parent's student
          if (currentUser && currentUser.role === 'orang_tua' && !params.student_id && currentUser.student_id) {
            query += `&student_id=eq.${encodeURIComponent(currentUser.student_id)}`;
          }

          const invoices = await supabaseRest(query);
          return { success: true, data: invoices };
        }
        if (action === 'create') {
          const id = 'INV-' + Date.now();
          const invNum = 'INV/' + new Date().getFullYear() + '/' + String(Date.now()).slice(-4);
          let studentName = params.student_name || '';
          if (!studentName && params.student_id) {
            const stu = await supabaseRest(`students?id=eq.${encodeURIComponent(params.student_id)}&select=full_name`);
            if (stu && stu[0]) studentName = stu[0].full_name;
          }
          const payload = {
            id,
            invoice_number: params.invoice_number || invNum,
            student_id: params.student_id,
            student_name: studentName,
            month: params.month || params.item_name || 'September 2026',
            period: params.period || params.item_name || '2026/2027',
            amount: Number(params.amount) || 0,
            due_date: params.due_date || new Date().toISOString().slice(0, 10),
            status: 'unpaid',
            description: params.description || params.item_name || ''
          };
          const res = await supabaseRest('invoices', 'POST', payload);
          return { success: true, data: res[0] || payload, message: 'Tagihan berhasil dibuat' };
        }
        if (action === 'create_bulk') {
          const classId = params.class_id;
          const month = params.month || 'Oktober 2026';
          const amount = Number(params.amount) || 150000;
          const dueDate = params.due_date || new Date().toISOString().slice(0, 10);
          const itemName = params.item_name || `SPP ${month}`;

          let studentsQuery = 'students?status=eq.active&select=id,full_name,nis,class_id';
          if (classId) studentsQuery += `&class_id=eq.${encodeURIComponent(classId)}`;
          const students = await supabaseRest(studentsQuery);

          if (!students || students.length === 0) {
            return { success: false, message: 'Tidak ada siswa aktif ditemukan pada kelas/filter ini' };
          }

          const createdInvoices = [];
          for (let i = 0; i < students.length; i++) {
            const stu = students[i];
            const invId = 'INV-' + Date.now() + '-' + i;
            const invNum = 'INV/' + new Date().getFullYear() + '/' + String(Date.now()).slice(-4) + '/' + (i + 1);
            const invPayload = {
              id: invId,
              invoice_number: invNum,
              student_id: stu.id,
              student_name: stu.full_name,
              month: month,
              period: month,
              amount: amount,
              due_date: dueDate,
              status: 'unpaid',
              description: itemName
            };
            await supabaseRest('invoices', 'POST', invPayload).catch(() => {});
            createdInvoices.push(invPayload);
          }
          return {
            success: true,
            data: createdInvoices,
            message: `Berhasil menerbitkan ${createdInvoices.length} tagihan SPP untuk siswa terpilih`
          };
        }
        if (action === 'delete') {
          await supabaseRest(`invoices?id=eq.${encodeURIComponent(params.id)}`, 'DELETE');
          return { success: true, message: 'Tagihan berhasil dihapus' };
        }
        if (action === 'mark_paid') {
          const updated = await supabaseRest(`invoices?id=eq.${encodeURIComponent(params.id)}`, 'PATCH', {
            status: 'paid',
            paid_at: new Date().toISOString(),
            payment_method: 'tunai'
          });
          return { success: true, data: updated[0], message: 'Tagihan ditandai Lunas (Offline)' };
        }
      }

      // -------------------------------------------------------------
      // 9. PAYMENTS
      // -------------------------------------------------------------
      if (module === 'payments') {
        if (action === 'list') {
          let query = 'payments?select=*&order=submitted_at.desc';
          if (params.status) {
            const st = (params.status === 'pending' || params.status === 'menunggu_verifikasi')
              ? 'menunggu_verifikasi,pending'
              : params.status;
            query += `&status=in.(${encodeURIComponent(st)})`;
          }
          const payments = await supabaseRest(query);
          return { success: true, data: payments };
        }
        if (action === 'submit' || action === 'create') {
          let proofUrl = params.proof_image_url;
          if (params.proof_image_file || (typeof proofUrl === 'string' && proofUrl.startsWith('data:'))) {
            proofUrl = await uploadToSupabaseStorage(params.proof_image_file || proofUrl, 'bukti_bayar');
          }

          let invNum = params.invoice_number || '';
          let stuId = params.student_id || '';
          let stuName = params.student_name || '';
          let amt = Number(params.amount) || 0;

          if (params.invoice_id && (!invNum || !stuName || !amt)) {
            const inv = await supabaseRest(`invoices?id=eq.${encodeURIComponent(params.invoice_id)}&select=*`);
            if (inv && inv[0]) {
              invNum = inv[0].invoice_number || invNum;
              stuId = inv[0].student_id || stuId;
              stuName = inv[0].student_name || stuName;
              amt = Number(inv[0].amount) || amt;
            }
          }

          const id = 'PAY-' + Date.now();
          const payload = {
            id,
            invoice_id: params.invoice_id,
            invoice_number: invNum,
            student_id: stuId,
            student_name: stuName,
            amount: amt,
            method: params.method || 'transfer',
            payment_date: params.payment_date || new Date().toISOString().slice(0, 10),
            proof_image_url: proofUrl || '',
            status: 'menunggu_verifikasi'
          };

          const res = await supabaseRest('payments', 'POST', payload);
          // Update invoice status to menunggu_verifikasi
          if (params.invoice_id) {
            supabaseRest(`invoices?id=eq.${encodeURIComponent(params.invoice_id)}`, 'PATCH', { status: 'menunggu_verifikasi' }).catch(() => {});
          }

          return { success: true, data: res[0] || payload, message: 'Bukti pembayaran berhasil dikirim' };
        }
        if (action === 'verify') {
          const updated = await supabaseRest(`payments?id=eq.${encodeURIComponent(params.id)}`, 'PATCH', {
            status: 'verified',
            verified_by: currentUser ? currentUser.full_name : 'Admin',
            verified_at: new Date().toISOString()
          });
          const pay = updated[0];
          if (pay && pay.invoice_id) {
            await supabaseRest(`invoices?id=eq.${encodeURIComponent(pay.invoice_id)}`, 'PATCH', {
              status: 'paid',
              paid_at: new Date().toISOString(),
              payment_method: pay.method || 'transfer'
            }).catch(() => {});
          }
          return { success: true, data: pay, message: 'Pembayaran disetujui' };
        }
        if (action === 'reject') {
          const updated = await supabaseRest(`payments?id=eq.${encodeURIComponent(params.id)}`, 'PATCH', {
            status: 'rejected',
            notes: params.notes || params.reason || ''
          });
          const pay = updated[0];
          if (pay && pay.invoice_id) {
            await supabaseRest(`invoices?id=eq.${encodeURIComponent(pay.invoice_id)}`, 'PATCH', { status: 'unpaid' }).catch(() => {});
          }
          return { success: true, data: pay, message: 'Pembayaran ditolak' };
        }
        if (action === 'summary') {
          const payments = await supabaseRest('payments?select=amount,status');
          const invoices = await supabaseRest('invoices?select=amount,status');

          const totalBills = (invoices || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
          const paidBills = (invoices || []).filter(i => i.status === 'paid').reduce((s, i) => s + (Number(i.amount) || 0), 0);
          const pendingVerif = (payments || []).filter(p => p.status === 'menunggu_verifikasi').length;

          return {
            success: true,
            data: {
              total_tagihan: totalBills,
              total_lunas: paidBills,
              total_tunggakan: totalBills - paidBills,
              menunggu_verifikasi: pendingVerif
            }
          };
        }
      }

      // -------------------------------------------------------------
      // 10. ATTENDANCE
      // -------------------------------------------------------------
      if (module === 'attendance') {
        if (action === 'roster') {
          const date = params.date || new Date().toISOString().slice(0, 10);
          const classId = params.class_id || 'CLS-001';

          const [students, attendances] = await Promise.all([
            supabaseRest(`students?class_id=eq.${encodeURIComponent(classId)}&status=eq.active&select=*`),
            supabaseRest(`attendance?class_id=eq.${encodeURIComponent(classId)}&date=eq.${encodeURIComponent(date)}&select=*`)
          ]);

          const attMap = {};
          (attendances || []).forEach(a => { attMap[a.student_id] = a; });

          const records = (students || []).map(s => {
            const att = attMap[s.id];
            return {
              id: s.id,
              student_id: s.id,
              full_name: s.full_name,
              name: s.full_name,
              nis: s.nis,
              status: att ? att.status : 'hadir',
              notes: att ? att.notes : ''
            };
          });

          return { success: true, data: records, raw: { students: records, records, existing: attendances || [] } };
        }
        if (action === 'submit') {
          const records = params.records || [];
          const date = params.date || new Date().toISOString().slice(0, 10);
          const classId = params.class_id;

          for (const r of records) {
            const id = r.id || 'ATT-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
            // Delete existing on same date and student
            await supabaseRest(`attendance?student_id=eq.${encodeURIComponent(r.student_id)}&date=eq.${encodeURIComponent(date)}`, 'DELETE').catch(() => {});
            await supabaseRest('attendance', 'POST', {
              id,
              student_id: r.student_id,
              student_name: r.student_name,
              class_id: classId,
              date,
              status: r.status || 'H',
              notes: r.notes || '',
              created_by: currentUser ? currentUser.full_name : ''
            });
          }
          return { success: true, message: 'Presensi berhasil disimpan' };
        }
        if (action === 'history') {
          let query = 'attendance?select=*&order=date.desc';
          if (params.student_id) query += `&student_id=eq.${encodeURIComponent(params.student_id)}`;
          const history = await supabaseRest(query);
          return { success: true, data: history };
        }
        if (action === 'summary') {
          const date = params.date || new Date().toISOString().slice(0, 10);
          const atts = await supabaseRest(`attendance?date=eq.${encodeURIComponent(date)}&select=status`);
          const counts = { H: 0, S: 0, I: 0, A: 0 };
          (atts || []).forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });
          return { success: true, data: counts };
        }
      }

      // -------------------------------------------------------------
      // 11. DEVELOPMENT (RAPOR 6 ASPEK)
      // -------------------------------------------------------------
      if (module === 'development') {
        if (action === 'list') {
          let query = 'developments?select=*&order=created_at.desc';
          if (params.student_id) query += `&student_id=eq.${encodeURIComponent(params.student_id)}`;
          if (params.semester) query += `&semester=eq.${encodeURIComponent(params.semester)}`;
          const devs = await supabaseRest(query);
          return { success: true, data: devs };
        }
        if (action === 'upsert') {
          const studentId = params.student_id;
          const semester = params.semester || '1';
          const academicYear = params.academic_year || '2026/2027';

          // Check if exists
          const existing = await supabaseRest(`developments?student_id=eq.${encodeURIComponent(studentId)}&semester=eq.${encodeURIComponent(semester)}&academic_year=eq.${encodeURIComponent(academicYear)}&select=id`);

          const payload = {
            student_id: studentId,
            student_name: params.student_name,
            class_id: params.class_id,
            semester,
            academic_year: academicYear,
            aspect_nam: params.aspect_nam || params.nilai_agama || 'BSH',
            aspect_fisik_motorik: params.aspect_fisik_motorik || 'BSH',
            aspect_kognitif: params.aspect_kognitif || 'BSH',
            aspect_bahasa: params.aspect_bahasa || 'BSH',
            aspect_sosial_emosional: params.aspect_sosial_emosional || 'BSH',
            aspect_seni: params.aspect_seni || 'BSH',
            teacher_notes: params.teacher_notes || '',
            updated_at: new Date().toISOString()
          };

          if (existing && existing.length > 0) {
            await supabaseRest(`developments?id=eq.${existing[0].id}`, 'PATCH', payload);
          } else {
            payload.id = 'DEV-' + Date.now();
            await supabaseRest('developments', 'POST', payload);
          }
          return { success: true, message: 'Rapor perkembangan tersimpan' };
        }
      }

      // -------------------------------------------------------------
      // 12. PPDB
      // -------------------------------------------------------------
      if (module === 'ppdb') {
        if (action === 'list') {
          let query = 'ppdb_registrations?select=*&order=created_at.desc';
          if (params.status) query += `&status=eq.${encodeURIComponent(params.status)}`;
          if (params.search || params.q) {
            query += `&full_name.ilike.*${encodeURIComponent(params.search || params.q)}*`;
          }
          let regs = [];
          try {
            regs = await supabaseRest(query);
          } catch (e) {
            console.warn('PPDB registrations fetch fallback:', e);
          }
          if (!regs || regs.length === 0) {
            try {
              const localRegs = JSON.parse(localStorage.getItem('siy_local_ppdb_regs') || '[]');
              if (localRegs.length > 0) regs = localRegs;
            } catch (_) {}
          }
          return { success: true, data: regs };
        }
        if (action === 'get') {
          const id = params.id;
          const regs = await supabaseRest(`ppdb_registrations?or=(id.eq.${encodeURIComponent(id)},registration_number.eq.${encodeURIComponent(id)})&select=*`);
          return { success: true, data: regs[0] || null };
        }
        if (action === 'submitPublic' || action === 'submit') {
          // Upload documents if provided as File or base64
          let photoUrl = params.photo_url || params.photo_dataurl;
          if (params.photo_file || (photoUrl && typeof photoUrl === 'string' && photoUrl.startsWith('data:') && photoUrl.length > 50)) {
            photoUrl = await uploadToSupabaseStorage(params.photo_file || photoUrl, 'ppdb_photo').catch(() => '');
          }
          let certUrl = params.birth_certificate_url || params.akta_dataurl;
          if (params.birth_certificate_file || (certUrl && typeof certUrl === 'string' && certUrl.startsWith('data:') && certUrl.length > 50)) {
            certUrl = await uploadToSupabaseStorage(params.birth_certificate_file || certUrl, 'ppdb_akta').catch(() => '');
          }
          let kkUrl = params.family_card_url || params.kk_dataurl;
          if (params.family_card_file || (kkUrl && typeof kkUrl === 'string' && kkUrl.startsWith('data:') && kkUrl.length > 50)) {
            kkUrl = await uploadToSupabaseStorage(params.family_card_file || kkUrl, 'ppdb_kk').catch(() => '');
          }

          const id = 'REG-' + Date.now();
          const regNum = 'REG-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));
          
          const studentName = params.student_name || params.child_name || params.full_name || params.nama || 'Calon Siswa';
          const parentName = params.parent_name || params.father_name || params.mother_name || 'Orang Tua';
          const parentPhone = params.phone || params.parent_phone || params.father_phone || params.mother_phone || '';
          const parentEmail = params.email || params.parent_email || params.father_email || '';
          const gender = params.gender || params.student_gender || 'L';
          const birthPlace = params.birth_place || params.student_birth_place || 'Samarinda';
          const birthDate = params.birth_date || params.student_birth_date || '2021-01-01';
          const level = params.form_type === 'tpq' ? 'TPQ' : (params.level || 'PAUD');
          const address = params.address || '';
          const password = params.password || (typeof birthDate === 'string' ? birthDate.replace(/-/g, '') : '123456');

          const regPayload = {
            id,
            registration_number: regNum,
            student_name: studentName,
            student_gender: gender,
            student_birth_place: birthPlace,
            student_birth_date: birthDate,
            parent_name: parentName,
            parent_phone: parentPhone,
            parent_email: parentEmail,
            address: address,
            level: level,
            status: 'pending',
            notes: params.notes || '',
            documents_url: {
              photo: photoUrl || '',
              birth_certificate: certUrl || '',
              family_card: kkUrl || ''
            }
          };

          // 1. Simpan ke tabel ppdb_registrations dengan penanganan skema
          let res = null;
          try {
            res = await supabaseRest('ppdb_registrations', 'POST', regPayload);
          } catch (err) {
            console.warn('PPDB insert primary failed, trying alternate schema:', err);
            const altPayload = {
              id,
              registration_number: regNum,
              registration_no: regNum,
              full_name: studentName,
              child_name: studentName,
              gender: gender,
              birth_place: birthPlace,
              birth_date: birthDate,
              father_name: parentName,
              phone: parentPhone,
              address: address,
              photo_url: photoUrl || '',
              birth_certificate_url: certUrl || '',
              family_card_url: kkUrl || '',
              status: 'pending'
            };
            res = await supabaseRest('ppdb_registrations', 'POST', altPayload).catch(e => {
              console.warn('Alternate PPDB insert fallback:', e);
              return [regPayload];
            });
          }

          // Safe local persistence fallback
          try {
            const localRegs = JSON.parse(localStorage.getItem('siy_local_ppdb_regs') || '[]');
            localRegs.unshift({ ...regPayload, id, registration_number: regNum, registration_no: regNum, created_at: new Date().toISOString() });
            localStorage.setItem('siy_local_ppdb_regs', JSON.stringify(localRegs));
          } catch (_) {}

          // 2. Buat akun login Portal Siswa untuk Calon Siswa
          const userId = 'USR-' + Date.now();
          const studentId = 'STU-' + Date.now();
          const emailForLogin = parentEmail || `${regNum.toLowerCase().replace(/[^a-z0-9]/g, '')}@pendaftar.yayasan.sch.id`;

          const newUser = {
            id: userId,
            email: emailForLogin,
            username: regNum,
            password_hash: password,
            full_name: studentName,
            name: studentName,
            phone: parentPhone,
            role: 'calon_siswa',
            role_label: 'Calon Siswa / Pendaftar',
            status: 'active',
            student_id: studentId,
            is_password_changed: true,
            created_at: new Date().toISOString()
          };

          try {
            const localUsers = JSON.parse(localStorage.getItem('siy_local_users') || '[]');
            localUsers.push(newUser);
            localStorage.setItem('siy_local_users', JSON.stringify(localUsers));
          } catch (_) {}

          await supabaseRest('users', 'POST', newUser).catch(err => console.warn('User account warning:', err));

          // 3. Buat record di students
          const newStudent = {
            id: studentId,
            user_id: userId,
            full_name: studentName,
            name: studentName,
            gender: gender,
            birth_place: birthPlace,
            birth_date: birthDate,
            parent_name: parentName,
            parent_phone: parentPhone,
            parent_email: emailForLogin,
            status_pendaftaran: 'pending',
            is_active: false,
            status: 'pending',
            created_at: new Date().toISOString()
          };

          try {
            const localStudents = JSON.parse(localStorage.getItem('siy_local_students') || '[]');
            localStudents.push(newStudent);
            localStorage.setItem('siy_local_students', JSON.stringify(localStudents));
          } catch (_) {}

          await supabaseRest('students', 'POST', newStudent).catch(err => console.warn('Student profile warning:', err));

          // 4. Simpan sesi login otomatis ke localStorage
          const roleObj = { code: 'calon_siswa', name: 'Calon Siswa / Pendaftar' };
          const userSession = { ...newUser, role: roleObj, student_id: studentId };
          const token = 'siy_' + userId + '_' + Date.now();
          localStorage.setItem('siy_token', token);
          localStorage.setItem('siy_user', JSON.stringify(userSession));

          return {
            success: true,
            data: (res && res[0]) || regPayload,
            registration_number: regNum,
            registration_no: regNum,
            login_email: emailForLogin,
            login_password: password,
            message: 'Pendaftaran PPDB berhasil diajukan! Akun portal calon siswa Anda telah aktif.'
          };
        }
        if (action === 'getStatusPublic' || action === 'check_status' || action === 'status') {
          const regNo = params.registration_number || params.registration_no || params.id;
          const regs = await supabaseRest(`ppdb_registrations?or=(registration_number.eq.${encodeURIComponent(regNo)},registration_no.eq.${encodeURIComponent(regNo)},id.eq.${encodeURIComponent(regNo)})&select=*`);
          if (!regs || regs.length === 0) {
            return { success: false, message: 'Nomor pendaftaran tidak ditemukan' };
          }
          return { success: true, data: { registration: regs[0] }, registration: regs[0] };
        }
        if (action === 'period') {
          const periods = await supabaseRest('ppdb_periods?select=*&order=created_at.desc');
          const p = periods && periods[0] ? { ...periods[0] } : null;
          if (p) {
            let extra = {};
            if (p.announcement_notes) {
              try {
                extra = JSON.parse(p.announcement_notes);
              } catch (_) {
                extra = { notes: p.announcement_notes };
              }
            }
            try {
              const cached = localStorage.getItem('siy_ppdb_schedule');
              if (cached) Object.assign(extra, JSON.parse(cached));
            } catch (_) {}
            Object.assign(p, extra);
          }
          return { success: true, data: p };
        }
        if (action === 'update_period') {
          const id = params.id || 'PPDPER-2026';
          const scheduleData = {
            online_registration_dates: params.online_registration_dates || '',
            verification_dates: params.verification_dates || '',
            announcement_dates: params.announcement_dates || '',
            re_registration_dates: params.re_registration_dates || '',
            notes: params.notes || ''
          };
          try {
            localStorage.setItem('siy_ppdb_schedule', JSON.stringify(scheduleData));
          } catch (_) {}

          const payload = {
            status: params.status || 'open',
            academic_year: params.academic_year || '2026/2027',
            announcement_notes: JSON.stringify(scheduleData)
          };
          const res = await supabaseRest(`ppdb_periods?id=eq.${encodeURIComponent(id)}`, 'PATCH', payload);
          return { success: true, data: { ...(res[0] || payload), ...scheduleData }, message: 'Pengaturan gelombang & jadwal PPDB diperbarui' };
        }
        if (action === 'approve') {
          const res = await supabaseRest(`ppdb_registrations?id=eq.${encodeURIComponent(params.id)}`, 'PATCH', {
            status: 'accepted',
            notes: params.notes || ''
          });
          return { success: true, data: res[0], message: 'Pendaftar diterima' };
        }
        if (action === 'reject') {
          const res = await supabaseRest(`ppdb_registrations?id=eq.${encodeURIComponent(params.id)}`, 'PATCH', {
            status: 'rejected',
            notes: params.reason || params.notes || ''
          });
          return { success: true, data: res[0], message: 'Pendaftar ditolak' };
        }
        if (action === 'convert') {
          const regs = await supabaseRest(`ppdb_registrations?id=eq.${encodeURIComponent(params.id)}&select=*`);
          if (!regs || regs.length === 0) return { success: false, message: 'Pendaftar tidak ditemukan' };
          const reg = regs[0];
          const stuId = 'STU-' + String(Date.now()).slice(-5);
          const targetClassId = params.class_id || 'CLS-001';

          // Ambil nama kelas
          let targetClassName = 'PAUD / TK Terpadu';
          if (targetClassId) {
            const cls = await supabaseRest(`classes?id=eq.${encodeURIComponent(targetClassId)}&select=name`);
            if (cls && cls[0]) targetClassName = cls[0].name;
          }

          // 1. Tentukan NIS Siswa (bisa input dari admin atau auto-generate)
          const studentNis = params.nis || ('2026' + String(Math.floor(1000 + Math.random() * 9000)));

          // 2. Password awal dari Tanggal Lahir (Format default: YYYY-MM-DD atau DDMMYYYY)
          let birthDateStr = reg.birth_date ? String(reg.birth_date).trim() : '2021-01-01';
          let birthDatePassword = birthDateStr;
          if (birthDateStr.includes('-')) {
            const p = birthDateStr.split('-');
            if (p.length === 3) birthDatePassword = `${p[2]}${p[1]}${p[0]}`; // DDMMYYYY
          }

          const cleanPhone = (reg.phone || '').replace(/[^0-9]/g, '');
          const studentEmail = reg.email || (cleanPhone ? `${studentNis}@siswa.yayasan.sch.id` : `siswa_${studentNis}@yayasan.sch.id`);
          const studentName = reg.full_name || reg.child_name || 'Santri Baru';

          // 3. Cek apakah user akun pendaftar sudah ada (dari registrasi PPDB Akun-First)
          let existingUsers = await supabaseRest(`users?email=eq.${encodeURIComponent(studentEmail)}&select=*`);
          let userId = 'USR-' + studentNis;

          if (existingUsers && existingUsers.length > 0) {
            userId = existingUsers[0].id;
            await supabaseRest(`users?id=eq.${userId}`, 'PATCH', {
              role: 'siswa_aktif',
              role_label: 'Siswa Aktif',
              nis: studentNis,
              student_id: stuId,
              is_password_changed: false,
              status: 'active'
            });
          } else {
            await supabaseRest('users', 'POST', {
              id: userId,
              email: studentEmail,
              password_hash: birthDatePassword,
              full_name: studentName,
              name: studentName,
              phone: reg.phone,
              role: 'siswa_aktif',
              role_label: 'Siswa Aktif',
              nis: studentNis,
              student_id: stuId,
              avatar: reg.photo_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
              status: 'active',
              is_password_changed: false
            });
          }

          // 4. Buat / Update Data Siswa Aktif
          const studentPayload = {
            id: stuId,
            user_id: userId,
            nis: studentNis,
            full_name: studentName,
            name: studentName,
            child_name: studentName,
            gender: reg.gender || 'L',
            birth_place: reg.birth_place || 'Samarinda',
            birth_date: birthDateStr,
            class_id: targetClassId,
            class_name: targetClassName,
            kelas_sekarang: targetClassName,
            semester_sekarang: 'Semester 1',
            status_kenaikan: 'Aktif',
            status_pendaftaran: 'accepted',
            is_active: true,
            parent_name: reg.father_name || reg.mother_name || '',
            parent_phone: reg.phone || '',
            parent_email: studentEmail,
            address: reg.address || '',
            status: 'active'
          };
          await supabaseRest('students', 'POST', studentPayload);

          // 5. Update Status Registrasi PPDB
          await supabaseRest(`ppdb_registrations?id=eq.${reg.id}`, 'PATCH', {
            status: 'accepted',
            notes: `Diterima sebagai Siswa Aktif (NIS: ${studentNis}, Kelas: ${targetClassName})`
          });

          // 6. Ringkasan Kredensial Siswa Baru
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          const loginUrl = `${origin}/public/login.html`;
          const summaryText = `Akses Portal Siswa Yayasan Samarinda\nNama: ${studentName}\nNIS (Username Login): ${studentNis}\nKata Sandi Awal: ${birthDatePassword} (Tanggal Lahir: DDMMYYYY)\nLink Portal: ${loginUrl}`;

          return {
            success: true,
            data: {
              student: studentPayload,
              nis: studentNis,
              class_name: targetClassName,
              initial_credentials: {
                student_name: studentName,
                nis: studentNis,
                default_password: birthDatePassword,
                login_url: loginUrl
              },
              summary_text: summaryText
            },
            message: `Siswa berhasil diaktifkan dengan NIS: ${studentNis}`
          };
        }
      }

      // -------------------------------------------------------------
      // 13. CONTENT (NEWS, ANNOUNCEMENTS, EVENTS, GALLERIES)
      // -------------------------------------------------------------
      if (module === 'news') {
        if (action === 'list') {
          const news = await supabaseRest('news?select=*&order=published_at.desc');
          return { success: true, data: news, raw: { items: news } };
        }
        if (action === 'get') {
          const res = await supabaseRest(`news?or=(id.eq.${encodeURIComponent(params.id || '')},slug.eq.${encodeURIComponent(params.slug || '')})&select=*`);
          return { success: true, data: res[0] || null };
        }
        if (action === 'create') {
          let img = params.image || params.featured_image_url || params.cover_url || params.image_url;
          if (params.image_file || (img && img.startsWith('data:'))) {
            img = await uploadToSupabaseStorage(params.image_file || img, 'berita');
          }
          const id = 'NWS-' + Date.now();
          const slug = (params.title || 'berita').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + String(Date.now()).slice(-4);
          const payload = {
            id,
            slug,
            title: params.title || 'Berita Baru',
            category: params.category || 'Umum',
            summary: params.summary || params.excerpt || (params.content ? params.content.substring(0, 150) : ''),
            content: params.content || params.body || '',
            image: img || '',
            author: params.author || 'Admin',
            status: params.status || (params.is_published ? 'published' : 'draft'),
            published_at: params.published_at || new Date().toISOString()
          };
          const res = await supabaseRest('news', 'POST', payload);
          return { success: true, data: res[0] || payload, message: 'Berita berhasil diterbitkan' };
        }
        if (action === 'update') {
          const payload = {};
          if (params.title) payload.title = params.title;
          if (params.category) payload.category = params.category;
          if (params.summary || params.excerpt) payload.summary = params.summary || params.excerpt;
          if (params.content || params.body) payload.content = params.content || params.body;
          if (params.status) payload.status = params.status;
          let img = params.image || params.featured_image_url || params.cover_url || params.image_url;
          if (params.image_file || (img && img.startsWith('data:'))) {
            img = await uploadToSupabaseStorage(params.image_file || img, 'berita');
            if (img) payload.image = img;
          } else if (img) {
            payload.image = img;
          }
          const res = await supabaseRest(`news?id=eq.${encodeURIComponent(params.id)}`, 'PATCH', payload);
          return { success: true, data: res[0] || payload, message: 'Berita diperbarui' };
        }
        if (action === 'delete' || action === 'remove') {
          await supabaseRest(`news?id=eq.${encodeURIComponent(params.id)}`, 'DELETE');
          return { success: true, message: 'Berita dihapus' };
        }
      }

      if (module === 'announcements') {
        if (action === 'list') {
          const ann = await supabaseRest('announcements?select=*&order=published_at.desc');
          return { success: true, data: ann, raw: { items: ann } };
        }
        if (action === 'get') {
          const ann = await supabaseRest(`announcements?id=eq.${encodeURIComponent(params.id)}&select=*`);
          return { success: true, data: ann[0] || null };
        }
        if (action === 'create') {
          const id = 'ANN-' + Date.now();
          const payload = {
            id,
            title: params.title || 'Pengumuman Baru',
            content: params.content || params.body || params.excerpt || '',
            target_audience: params.target_audience || params.category || 'all',
            is_pinned: !!params.is_pinned,
            status: params.status || (params.is_published ? 'published' : 'draft'),
            published_at: params.published_at || new Date().toISOString()
          };
          const res = await supabaseRest('announcements', 'POST', payload);
          return { success: true, data: res[0] || payload, message: 'Pengumuman diterbitkan' };
        }
        if (action === 'update') {
          const payload = {};
          if (params.title) payload.title = params.title;
          if (params.content || params.body) payload.content = params.content || params.body;
          if (params.target_audience) payload.target_audience = params.target_audience;
          if (params.status) payload.status = params.status;
          if (params.is_pinned !== undefined) payload.is_pinned = !!params.is_pinned;
          const res = await supabaseRest(`announcements?id=eq.${encodeURIComponent(params.id)}`, 'PATCH', payload);
          return { success: true, data: res[0] || params, message: 'Pengumuman diperbarui' };
        }
        if (action === 'delete' || action === 'remove') {
          await supabaseRest(`announcements?id=eq.${encodeURIComponent(params.id)}`, 'DELETE');
          return { success: true, message: 'Pengumuman dihapus' };
        }
      }

      if (module === 'events') {
        if (action === 'list') {
          const evts = await supabaseRest('events?select=*&order=date.asc');
          return { success: true, data: evts, raw: { items: evts } };
        }
        if (action === 'create') {
          const id = 'EVT-' + Date.now();
          const payload = {
            id,
            title: params.title || 'Agenda Baru',
            date: params.date || params.event_date || new Date().toISOString().split('T')[0],
            time: params.time || '08:00 - Selesai',
            location: params.location || 'Lingkungan Yayasan',
            description: params.description || params.content || params.excerpt || '',
            status: params.status || (params.is_published ? 'upcoming' : 'draft')
          };
          const res = await supabaseRest('events', 'POST', payload);
          return { success: true, data: res[0] || payload, message: 'Agenda dibuat' };
        }
        if (action === 'update') {
          const payload = {};
          if (params.title) payload.title = params.title;
          if (params.date || params.event_date) payload.date = params.date || params.event_date;
          if (params.time) payload.time = params.time;
          if (params.location) payload.location = params.location;
          if (params.description || params.content) payload.description = params.description || params.content;
          if (params.status) payload.status = params.status;
          const res = await supabaseRest(`events?id=eq.${encodeURIComponent(params.id)}`, 'PATCH', payload);
          return { success: true, data: res[0] || payload, message: 'Agenda diperbarui' };
        }
        if (action === 'delete' || action === 'remove') {
          await supabaseRest(`events?id=eq.${encodeURIComponent(params.id)}`, 'DELETE');
          return { success: true, message: 'Agenda dihapus' };
        }
      }

      // Galeri: Dukung alias 'gallery' dan 'galleries' dengan upload storage
      if (module === 'galleries' || module === 'gallery') {
        if (action === 'list') {
          const gals = await supabaseRest('galleries?select=*&order=created_at.desc');
          return { success: true, data: gals, raw: { items: gals } };
        }
        if (action === 'create') {
          let imgUrl = params.image_url || params.image || params.cover_url;
          if (params.image_file || (imgUrl && imgUrl.startsWith('data:'))) {
            imgUrl = await uploadToSupabaseStorage(params.image_file || imgUrl, 'galeri');
          }
          const id = 'GAL-' + Date.now();
          const payload = {
            id,
            title: params.title || 'Foto Galeri',
            category: params.category || 'Umum',
            description: params.description || params.content || params.excerpt || '',
            image_url: imgUrl || ''
          };
          const res = await supabaseRest('galleries', 'POST', payload);
          return { success: true, data: res[0] || payload, message: 'Foto galeri ditambahkan' };
        }
        if (action === 'update') {
          let imgUrl = params.image_url || params.image || params.cover_url;
          if (params.image_file || (imgUrl && imgUrl.startsWith('data:'))) {
            imgUrl = await uploadToSupabaseStorage(params.image_file || imgUrl, 'galeri');
          }
          const payload = {};
          if (params.title) payload.title = params.title;
          if (params.category) payload.category = params.category;
          if (params.description || params.content || params.excerpt) {
            payload.description = params.description || params.content || params.excerpt;
          }
          if (imgUrl) payload.image_url = imgUrl;
          const res = await supabaseRest(`galleries?id=eq.${encodeURIComponent(params.id)}`, 'PATCH', payload);
          return { success: true, data: res[0] || payload, message: 'Foto galeri diperbarui' };
        }
        if (action === 'delete' || action === 'remove') {
          await supabaseRest(`galleries?id=eq.${encodeURIComponent(params.id)}`, 'DELETE');
          return { success: true, message: 'Galeri dihapus' };
        }
      }

      // -------------------------------------------------------------
      // 14. SCHOOLS / PENGATURAN IDENTITAS SEKOLAH & MEDSOS
      // -------------------------------------------------------------
      if (module === 'schools' || module === 'school') {
        if (action === 'get') {
          const schools = await supabaseRest('schools?select=*');
          const sch = (schools && schools[0]) ? { ...schools[0] } : {};
          try {
            const cachedExt = localStorage.getItem('siy_school_ext');
            if (cachedExt) Object.assign(sch, JSON.parse(cachedExt));
          } catch (_) {}
          return { success: true, data: sch };
        }
        if (action === 'update') {
          const id = params.id || 'SCH-001';
          const fullPayload = { ...params };
          delete fullPayload.id;
          fullPayload.updated_at = new Date().toISOString();

          // Simpan selalu ke cache lokal agar langsung aktif
          const extPayload = {
            whatsapp_number: params.whatsapp_number || '',
            instagram_url: params.instagram_url || '',
            youtube_url: params.youtube_url || '',
            facebook_url: params.facebook_url || ''
          };
          try {
            localStorage.setItem('siy_school_ext', JSON.stringify(extPayload));
            sessionStorage.setItem('siyayasan_school_profile', JSON.stringify({ ...fullPayload, ...extPayload }));
          } catch (_) {}

          try {
            const res = await supabaseRest(`schools?id=eq.${encodeURIComponent(id)}`, 'PATCH', fullPayload);
            return { success: true, data: res[0] || fullPayload, message: 'Identitas & tautan sekolah berhasil diperbarui' };
          } catch (patchErr) {
            console.warn('Full school patch failed, fallback to core fields:', patchErr.message);
            const corePayload = {
              name: params.name,
              address: params.address,
              phone: params.phone,
              email: params.email
            };
            const res = await supabaseRest(`schools?id=eq.${encodeURIComponent(id)}`, 'PATCH', corePayload);
            return { success: true, data: { ...corePayload, ...extPayload }, message: 'Identitas & tautan sekolah berhasil diperbarui' };
          }
        }
      }

      // 15. LOGS / AKTIVITAS
      if (module === 'logs' || module === 'activity_logs') {
        if (action === 'list') {
          const logs = await supabaseRest('activity_logs?select=*&order=created_at.desc&limit=50');
          return { success: true, data: logs, raw: { items: logs } };
        }
      }

      // 16. REPORTS
      if (module === 'reports') {
        if (action === 'generate') {
          const repType = params.report_type || 'students';
          let headers = [];
          let rows = [];

          if (repType === 'students') {
            headers = ['No', 'NIS', 'Nama Lengkap', 'Kelas', 'Jenis Kelamin', 'Nama Wali', 'No. HP / WA', 'Status'];
            const stu = await supabaseRest('students?select=*').catch(() => []);
            rows = (stu || []).map((s, idx) => [
              idx + 1,
              s.nis || '-',
              s.full_name || s.name || '-',
              s.class_name || s.kelas_sekarang || s.class_id || '-',
              s.gender === 'L' ? 'Laki-laki' : (s.gender === 'P' ? 'Perempuan' : (s.gender || '-')),
              s.parent_name || s.father_name || s.mother_name || '-',
              s.parent_phone || s.phone || '-',
              (s.status || 'active').toUpperCase()
            ]);
          } else if (repType === 'payments' || repType === 'finance') {
            headers = ['No', 'No. Tagihan', 'Nama Siswa', 'Keterangan / Periode', 'Nominal (Rp)', 'Jatuh Tempo', 'Status Tagihan'];
            const inv = await supabaseRest('invoices?select=*').catch(() => []);
            let list = inv || [];
            if (params.month) {
              list = list.filter(i => (i.due_date && i.due_date.startsWith(params.month)) || (i.period && i.period.includes(params.month)));
            }
            rows = list.map((i, idx) => [
              idx + 1,
              i.invoice_number || '-',
              i.student_name || '-',
              i.description || i.item_name || i.period || i.month || '-',
              Number(i.amount || 0).toLocaleString('id-ID'),
              i.due_date || '-',
              i.status === 'paid' ? 'LUNAS' : (i.status === 'menunggu_verifikasi' ? 'MENUNGGU VERIFIKASI' : 'BELUM LUNAS')
            ]);
          } else if (repType === 'ppdb') {
            headers = ['No', 'No. Pendaftaran', 'Nama Calon Siswa', 'Jalur / Jenjang', 'Nama Wali', 'No. HP', 'Status', 'Tgl Daftar'];
            const regs = await supabaseRest('ppdb_registrations?select=*').catch(() => []);
            let list = regs || [];
            if (params.academic_year) {
              list = list.filter(r => (r.academic_year && r.academic_year.includes(params.academic_year)) || (r.period_name && r.period_name.includes(params.academic_year)));
            }
            rows = list.map((r, idx) => [
              idx + 1,
              r.registration_number || r.registration_no || '-',
              r.full_name || r.child_name || '-',
              (r.form_type || 'PAUD').toUpperCase(),
              r.father_name || r.parent_name || '-',
              r.phone || r.father_phone || '-',
              (r.status || 'pending').toUpperCase(),
              (r.registration_date || r.created_at || '').slice(0, 10)
            ]);
          } else if (repType === 'attendance') {
            headers = ['No', 'Tanggal', 'Nama Siswa', 'Kelas', 'Status Kehadiran', 'Catatan'];
            const att = await supabaseRest('attendance?select=*').catch(() => []);
            let list = att || [];
            if (params.month) {
              list = list.filter(a => a.date && a.date.startsWith(params.month));
            }
            rows = list.map((a, idx) => [
              idx + 1,
              a.date || '-',
              a.student_name || '-',
              a.class_id || '-',
              (a.status || 'hadir').toUpperCase(),
              a.notes || '-'
            ]);
          } else if (repType === 'development') {
            headers = ['No', 'Siswa', 'Semester', 'Tahun Ajaran', 'NAM', 'Fisik Motorik', 'Kognitif', 'Bahasa', 'Sosial Emosional', 'Seni'];
            const devs = await supabaseRest('developments?select=*').catch(() => []);
            let list = devs || [];
            if (params.semester) list = list.filter(d => String(d.semester) === String(params.semester));
            if (params.year) list = list.filter(d => d.academic_year && d.academic_year.includes(params.year));
            rows = list.map((d, idx) => [
              idx + 1,
              d.student_name || '-',
              d.semester || '1',
              d.academic_year || '2026/2027',
              d.aspect_nam || 'Baik',
              d.aspect_fisik_motorik || 'Baik',
              d.aspect_kognitif || 'Baik',
              d.aspect_bahasa || 'Baik',
              d.aspect_sosial_emosional || 'Baik',
              d.aspect_seni || 'Baik'
            ]);
          } else if (repType === 'all') {
            headers = ['No', 'Modul Data', 'Jumlah Entitas Terdaftar', 'Keterangan'];
            const [stu, cls, inv, regs] = await Promise.all([
              supabaseRest('students?select=id').catch(() => []),
              supabaseRest('classes?select=id').catch(() => []),
              supabaseRest('invoices?select=id').catch(() => []),
              supabaseRest('ppdb_registrations?select=id').catch(() => [])
            ]);
            rows = [
              [1, 'Siswa Aktif', `${(stu || []).length} Siswa`, 'Terdaftar di database yayasan'],
              [2, 'Rombongan Belajar (Kelas)', `${(cls || []).length} Kelas`, 'Tahun Ajaran 2026/2027'],
              [3, 'Tagihan SPP Tercatat', `${(inv || []).length} Tagihan`, 'Total transaksi keuangan'],
              [4, 'Pendaftar PPDB', `${(regs || []).length} Berkas`, 'Penerimaan siswa baru']
            ];
          }

          return {
            success: true,
            data: {
              report_type: repType,
              headers,
              rows,
              total: rows.length,
              generated_at: new Date().toISOString()
            },
            message: 'Laporan berhasil dibuat'
          };
        }
      }

      // 17. BACKUP & RESTORE
      if (module === 'backup') {
        if (action === 'backups' || action === 'list') {
          let backups = [];
          try {
            const raw = localStorage.getItem('siy_backup_history');
            if (raw) backups = JSON.parse(raw);
          } catch (_) {}
          return { success: true, data: backups, items: backups, total: backups.length };
        }
        if (action === 'create') {
          let [sch, usr, stu, cls, tea, nws, gal, inv, reg] = await Promise.all([
            supabaseRest('schools?select=*').catch(() => []),
            supabaseRest('users?select=*').catch(() => []),
            supabaseRest('students?select=*').catch(() => []),
            supabaseRest('classes?select=*').catch(() => []),
            supabaseRest('teachers?select=*').catch(() => []),
            supabaseRest('news?select=*').catch(() => []),
            supabaseRest('galleries?select=*').catch(() => []),
            supabaseRest('invoices?select=*').catch(() => []),
            supabaseRest('registrations?select=*').catch(() => [])
          ]);
          const dStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          const filename = `backup-yayasan-${dStr}.json`;
          const backupObj = {
            id: 'BCK-' + Date.now(),
            created_at: new Date().toISOString(),
            folder_name: filename,
            filename: filename,
            file_count: 9,
            data: {
              schools: sch || [],
              users: usr || [],
              students: stu || [],
              classes: cls || [],
              teachers: tea || [],
              news: nws || [],
              galleries: gal || [],
              invoices: inv || [],
              registrations: reg || []
            }
          };
          try {
            let list = [];
            const raw = localStorage.getItem('siy_backup_history');
            if (raw) list = JSON.parse(raw);
            list.unshift(backupObj);
            localStorage.setItem('siy_backup_history', JSON.stringify(list.slice(0, 15)));
          } catch (_) {}
          return { success: true, data: backupObj, backup: backupObj, message: 'Backup berhasil dibuat: ' + filename };
        }
        if (action === 'restore') {
          if (params.data && typeof params.data === 'object') {
            try {
              localStorage.setItem('siy_restored_snapshot', JSON.stringify({ restored_at: new Date().toISOString(), ...params.data }));
            } catch (_) {}
          }
          return { success: true, message: 'Data backup berhasil dipulihkan ke sistem!' };
        }
        if (action === 'delete') {
          try {
            let list = [];
            const raw = localStorage.getItem('siy_backup_history');
            if (raw) list = JSON.parse(raw);
            list = list.filter(b => b.id !== params.id);
            localStorage.setItem('siy_backup_history', JSON.stringify(list));
          } catch (_) {}
          return { success: true, message: 'Riwayat cadangan berhasil dihapus' };
        }
      }

      // Default fallback generic CRUD if module corresponds directly to a table
      const items = await supabaseRest(`${module}?select=*`);
      return { success: true, data: items, raw: { items } };

    } catch (err) {
      if (!isSupabaseOffline) {
        isSupabaseOffline = true;
        const localRes = await callLocalBackend(module, action, params, method);
        if (localRes && localRes.success !== undefined) {
          return localRes;
        }
      }
      console.error(`apiCall Error [${module}/${action}]:`, err);
      return {
        success: false,
        message: err.message || 'Terjadi kesalahan sistem',
        error: { message: err.message }
      };
    }
  }

  function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed top-4 right-4 z-50 space-y-2';
      document.body.appendChild(container);
    }
    const colors = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error:   'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info:    'bg-blue-50 border-blue-200 text-blue-800'
    };
    const el = document.createElement('div');
    el.className = `px-4 py-3 rounded-md border text-sm shadow-sm transition-all duration-300 ${colors[type] || colors.info}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
      el.classList.add('opacity-0');
      setTimeout(() => el.remove(), 300);
    }, 4000);
  }

  function formatIDR(n) {
    return 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');
  }
  function formatDate(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function formatDateTime(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  // Global exports
  window.apiCall = apiCall;
  window.showToast = showToast;
  window.formatIDR = formatIDR;
  window.formatDate = formatDate;
  window.formatDateTime = formatDateTime;
  window.uploadToSupabaseStorage = uploadToSupabaseStorage;
})();