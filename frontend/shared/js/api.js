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
    url: 'https://hnkxrbmngmveoxipohtk.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua3hyYm1uZ212ZW94aXBvaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTQ5NTMsImV4cCI6MjEwNDQ5MDk1M30.S10JzbSvvEStbEJl4DFVBYniyoQkG6q7_PGg3cJI9Yo',
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

  let isSupabaseOffline = false;

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
      const timeoutMs = (method === 'GET' || method === 'HEAD') ? 8000 : 15000;
      const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
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
      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      if (isLocal && (err.name === 'AbortError' || err instanceof TypeError || (err.message && err.message.includes('Failed to fetch')))) {
        isSupabaseOffline = true;
      }
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
      const timeoutId = controller ? setTimeout(() => controller.abort(), 25000) : null;
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

  // Activity Log helper
  async function recordActivityLog(actionType, entityType, detailsText, entityId = '') {
    try {
      let sess = null;
      try {
        sess = JSON.parse(localStorage.getItem('siy_user') || localStorage.getItem('siyayasan_session_v2') || 'null');
      } catch (_) {}
      const roleName = (typeof sess?.role === 'object' ? sess.role.code : sess?.role) || 'admin';
      await supabaseRest('activity_logs', 'POST', {
        user_id: sess?.id || null,
        user_name: sess?.full_name || sess?.name || 'Admin',
        user_role: roleName,
        action: actionType,
        entity_type: entityType,
        entity_id: String(entityId || ''),
        details: String(detailsText || '')
      });
    } catch (_) {}
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
            try {
              const users = await supabaseRest(`users?email=eq.${encodeURIComponent(rawIdentifier)}&status=eq.active&select=*`);
              if (users && users.length > 0) {
                matchedUser = users[0];
              }
            } catch (err) {
              console.warn('Supabase auth email query warning:', err);
            }
          } else {
            try {
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
            } catch (err) {
              console.warn('Supabase auth NIS query warning:', err);
            }
          }

          if (!matchedUser) {
            // Built-in master accounts fallback (Super Admin & Admin TU & Demo Siswa)
            const SEED_USERS = [
              {
                id: 'USR-ADMIN01',
                email: 'admin@yayasan.sch.id',
                username: 'admin',
                password_hash: 'admin123',
                full_name: 'Administrator Yayasan',
                name: 'Administrator',
                role: 'super_admin',
                role_label: 'Super Admin',
                status: 'active',
                is_password_changed: true
              },
              {
                id: 'USR-TU01',
                email: 'tu@yayasan.sch.id',
                username: 'tu',
                password_hash: 'tu123456',
                full_name: 'Tata Usaha Yayasan',
                name: 'Tata Usaha',
                role: 'admin_tu',
                role_label: 'Admin TU',
                status: 'active',
                is_password_changed: true
              },
              {
                id: 'USR-2026001',
                email: '2026001@siswa.yayasan.sch.id',
                username: '2026001',
                nis: '2026001',
                password_hash: '2020-03-12',
                full_name: 'Ahmad Faiz Al-Faruq',
                name: 'Ahmad Faiz',
                role: 'siswa_aktif',
                role_label: 'Siswa Aktif',
                status: 'active',
                student_id: 'STU-001',
                birth_date: '2020-03-12',
                is_password_changed: true
              },
              {
                id: 'USR-2026002',
                email: '2026002@siswa.yayasan.sch.id',
                username: '2026002',
                nis: '2026002',
                password_hash: '2019-08-25',
                full_name: 'Aisyah Putri Azzahra',
                name: 'Aisyah Putri',
                role: 'siswa_aktif',
                role_label: 'Siswa Aktif',
                status: 'active',
                student_id: 'STU-002',
                birth_date: '2019-08-25',
                is_password_changed: true
              }
            ];

            const idClean = rawIdentifier.toLowerCase();
            matchedUser = SEED_USERS.find(u => 
              (u.email && u.email.toLowerCase() === idClean) ||
              (u.nis && String(u.nis) === rawIdentifier) ||
              (u.username && u.username.toLowerCase() === idClean) ||
              (u.id && u.id.toLowerCase() === idClean)
            );

            if (!matchedUser) {
              try {
                const localUsers = JSON.parse(localStorage.getItem('siy_local_users') || '[]');
                matchedUser = localUsers.find(u => 
                  (u.email && u.email.toLowerCase() === idClean) ||
                  (u.nis && String(u.nis) === rawIdentifier) ||
                  (u.username && u.username.toLowerCase() === idClean) ||
                  (u.id && u.id.toLowerCase() === idClean)
                );
              } catch (_) {}
            }
          }

          if (!matchedUser) {
            return { success: false, message: 'Akun tidak ditemukan. Periksa Email atau NIS Anda.' };
          }

          // Check password
          if (matchedUser.password_hash !== password) {
            // Check if initial login with birthdate or fallback
            let passedBirthdate = false;
            const bDate = String(matchedUser.birth_date || (studentRecord && studentRecord.birth_date) || '').trim();
            const fallbackDob = String(matchedUser.fallback_dob_password || '').trim();
            if (fallbackDob && password === fallbackDob) {
              passedBirthdate = true;
            }
            if (bDate) {
              const passClean = password.replace(/[^0-9]/g, '');
              const bClean = bDate.replace(/[^0-9]/g, '');
              let ddmmyyyy = '';
              if (bDate.includes('-')) {
                const parts = bDate.split('-');
                if (parts.length === 3) ddmmyyyy = parts[2] + parts[1] + parts[0];
              }
              if (passClean === bClean || password === bDate || password === ddmmyyyy || passClean === ddmmyyyy) {
                passedBirthdate = true;
                needsPasswordChange = true;
              }
            }
            if (!passedBirthdate) {
              return { success: false, message: 'Password salah. Gunakan password saat pendaftaran PPDB atau gunakan Tanggal Lahir format DDMMYYYY (contoh: 14052020).' };
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
          delete userPayload.password_hash;
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
          delete userPayload.password_hash;
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
          const targetUserId = params.user_id || (currentUser ? currentUser.id : null);
          if (!targetUserId) return { success: false, message: 'Harus login atau menyertakan identitas akun' };

          const users = await supabaseRest(`users?id=eq.${encodeURIComponent(targetUserId)}&select=*`);
          if (!users || users.length === 0) return { success: false, message: 'User tidak ditemukan' };
          
          if (!params.skip_old && users[0].password_hash !== params.old_password) {
            return { success: false, message: 'Password lama salah' };
          }

          await supabaseRest(`users?id=eq.${encodeURIComponent(targetUserId)}`, 'PATCH', {
            password_hash: params.new_password,
            is_password_changed: true,
            updated_at: new Date().toISOString()
          });

          // Update local session jika user yang sedang aktif sama
          if (currentUser && currentUser.id === targetUserId) {
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

          const docColMap = {
            pas_foto: 'photo_url',
            akta_kelahiran: 'birth_certificate_url',
            kartu_keluarga: 'family_card_url'
          };
          const docType = params.document_type;
          if (docColMap[docType]) {
            try {
              await supabaseRest(
                `ppdb_registrations?or=(student_id.eq.${encodeURIComponent(id)},full_name.eq.${encodeURIComponent(currentUser?.full_name || currentUser?.name || '')})`,
                'PATCH',
                { [docColMap[docType]]: fileUrl }
              );
            } catch (_) {}
          }

          return { success: true, data: docObj, message: 'Dokumen berhasil diunggah' };
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
          supabaseRest('students?select=id,status').catch(() => []),
          supabaseRest('teachers?select=id,status').catch(() => []),
          supabaseRest('classes?select=id').catch(() => []),
          supabaseRest('ppdb_registrations?select=id,status,created_at').catch(() => []),
          supabaseRest('invoices?select=id,amount,status').catch(() => []),
          supabaseRest('payments?select=id,status').catch(() => [])
        ]);

        const activeStudents = (students || []).filter(s => s.status === 'active').length;
        const activeTeachers = (teachers || []).filter(t => t.status === 'active').length;
        const pendingPPDB = (ppdb || []).filter(p => p.status === 'pending').length;
        const acceptedPPDB = (ppdb || []).filter(p => p.status === 'accepted' || p.status === 'approved' || p.status === 'converted').length;
        const unpaidInvoices = (invoices || []).filter(i => i.status === 'unpaid');
        const paidInvoices = (invoices || []).filter(i => i.status === 'paid');
        const pendingPayments = (payments || []).filter(p => p.status === 'menunggu_verifikasi').length;

        const totalUnpaidAmount = unpaidInvoices.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        const totalPaidAmount = paidInvoices.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        const totalTargetAmount = (invoices || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

        const currentMonthPrefix = new Date().toISOString().slice(0, 7);
        const ppdbThisMonth = (ppdb || []).filter(p => String(p.created_at || '').startsWith(currentMonthPrefix)).length;

        const stats = {
          total_students: activeStudents,
          active_students: activeStudents,
          total_students_active: activeStudents,
          total_teachers: activeTeachers,
          total_teachers_active: activeTeachers,
          total_classes: (classes || []).length,
          total_parents: activeStudents,
          ppdb_pending: pendingPPDB,
          ppdb_accepted: acceptedPPDB,
          ppdb_total: (ppdb || []).length,
          ppdb_this_month: ppdbThisMonth,
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
          const safeUsers = (users || []).map(({ password_hash, ...rest }) => rest);
          return { success: true, data: safeUsers };
        }
        if (action === 'get') {
          const users = await supabaseRest(`users?id=eq.${encodeURIComponent(params.id)}&select=*`);
          if (!users || users.length === 0) return { success: true, data: null };
          const { password_hash, ...safeUser } = users[0];
          return { success: true, data: safeUser };
        }
        if (action === 'create') {
          const id = 'USR-' + String(Date.now()).slice(-5);
          const roleLabelMap = {
            super_admin: 'Super Admin',
            admin_tu: 'Admin Tata Usaha',
            siswa_aktif: 'Siswa Aktif',
            calon_siswa: 'Calon Siswa / Pendaftar'
          };
          const role = params.role || 'admin_tu';
          const payload = {
            id,
            email: params.email,
            nis: params.nis || null,
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
          const { password_hash, ...safeCreated } = (created && created[0]) || payload;
          return { success: true, data: safeCreated, message: 'User berhasil dibuat' };
        }
        if (action === 'update') {
          const id = params.id;
          const roleLabelMap = {
            super_admin: 'Super Admin',
            admin_tu: 'Admin Tata Usaha',
            siswa_aktif: 'Siswa Aktif',
            calon_siswa: 'Calon Siswa / Pendaftar'
          };
          const payload = { ...params };
          delete payload.id;
          delete payload.is_active;
          if (params.is_active !== undefined && !payload.status) {
            payload.status = params.is_active ? 'active' : 'inactive';
          }
          if (payload.role && !payload.role_label && roleLabelMap[payload.role]) {
            payload.role_label = roleLabelMap[payload.role];
          }
          if (payload.password) {
            payload.password_hash = payload.password;
            delete payload.password;
          }
          if (payload.name && !payload.full_name) payload.full_name = payload.name;
          payload.updated_at = new Date().toISOString();
          const updated = await supabaseRest(`users?id=eq.${encodeURIComponent(id)}`, 'PATCH', payload);
          const { password_hash, ...safeUpdated } = (updated && updated[0]) || payload;
          return { success: true, data: safeUpdated, message: 'User berhasil diperbarui' };
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
        if (action === 'list') {
          let query = 'teachers?select=*&order=full_name.asc';
          if (params.search || params.q) {
            const sTerm = encodeURIComponent(params.search || params.q);
            query += `&or=(full_name.ilike.*${sTerm}*,nip.ilike.*${sTerm}*,subject_specialty.ilike.*${sTerm}*)`;
          }
          if (params.is_active !== undefined && params.is_active !== '') {
            const isAct = (params.is_active === true || params.is_active === 'true' || params.is_active === 1 || params.is_active === '1');
            query += `&status=eq.${isAct ? 'active' : 'inactive'}`;
          }
          const teachers = await supabaseRest(query);
          const mapped = (teachers || []).map(t => ({
            ...t,
            is_active: t.status === 'active' || t.is_active === true
          }));
          return { success: true, data: mapped };
        }
        if (action === 'delete') {
          await supabaseRest(`teachers?id=eq.${encodeURIComponent(params.id)}`, 'DELETE');
          await recordActivityLog('DELETE_TEACHER', 'teachers', 'Menghapus data guru ID: ' + params.id, params.id);
          return { success: true, message: 'Data guru berhasil dihapus' };
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
          const fullName = params.full_name || params.name || '';
          const spec = params.specialization || params.position || 'Guru Kelas';
          const sDate = params.start_date || params.joined_at || new Date().toISOString().slice(0, 10);
          const payload = {
            id,
            nip: params.nip || '',
            full_name: fullName,
            name: fullName,
            gender: params.gender || 'L',
            phone: params.phone || '',
            email: params.email || '',
            education: params.education || 'S1 Pendidikan',
            position: params.position || spec,
            specialization: spec,
            start_date: sDate,
            joined_at: sDate,
            status: params.status || (params.is_active === false ? 'inactive' : 'active')
          };
          const res = await supabaseRest('teachers', 'POST', payload);
          return { success: true, data: res[0] || payload, message: 'Guru berhasil ditambahkan' };
        }
        if (action === 'update') {
          const id = params.id || (currentUser ? (currentUser.teacher_id || currentUser.id) : null);
          const payload = {};
          if (params.nip !== undefined) payload.nip = params.nip;
          if (params.full_name || params.name) {
            payload.full_name = params.full_name || params.name;
            payload.name = payload.full_name;
          }
          if (params.gender !== undefined) payload.gender = params.gender;
          if (params.phone !== undefined) payload.phone = params.phone;
          if (params.email !== undefined) payload.email = params.email;
          if (params.education !== undefined) payload.education = params.education;
          if (params.position || params.specialization) {
            payload.position = params.position || params.specialization;
            payload.specialization = params.specialization || params.position;
          }
          if (params.start_date || params.joined_at) {
            payload.start_date = params.start_date || params.joined_at;
            payload.joined_at = payload.start_date;
          }
          if (params.status) payload.status = params.status;
          if (params.is_active !== undefined) payload.status = params.is_active ? 'active' : 'inactive';
          payload.updated_at = new Date().toISOString();

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
        if (action === 'delete') {
          await supabaseRest(`teachers?id=eq.${encodeURIComponent(params.id)}`, 'DELETE');
          return { success: true, message: 'Data pendidik berhasil dihapus' };
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
          if (params.status) {
            query += `&status=eq.${encodeURIComponent(params.status)}`;
          } else {
            query += `&status=neq.pending`;
          }
          if (params.search || params.q) {
            query += `&full_name.ilike.*${encodeURIComponent(params.search || params.q)}*`;
          }
          const students = await supabaseRest(query);
          return { success: true, data: students };
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
            nik: params.nik || null,
            parent_id: params.parent_id || null,
            parent_name: params.parent_name || params.father_name || params.mother_name || '',
            father_name: params.father_name || params.parent_name || '',
            mother_name: params.mother_name || '',
            parent_email: params.parent_email || params.email || '',
            parent_phone: params.parent_phone || params.phone || '',
            phone: params.phone || params.parent_phone || '',
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
          if (params.nik !== undefined) payload.nik = params.nik;
          if (params.parent_name !== undefined) payload.parent_name = params.parent_name;
          if (params.father_name !== undefined) {
            payload.father_name = params.father_name;
            if (params.parent_name === undefined) payload.parent_name = params.father_name;
          }
          if (params.mother_name !== undefined) payload.mother_name = params.mother_name;
          if (params.parent_phone !== undefined || params.phone !== undefined) {
            const ph = params.parent_phone !== undefined ? params.parent_phone : params.phone;
            payload.parent_phone = ph;
            payload.phone = ph;
          }
          if (params.parent_email !== undefined || params.email !== undefined) {
            payload.parent_email = params.parent_email !== undefined ? params.parent_email : params.email;
          }
          if (params.address !== undefined) payload.address = params.address;
          if (params.religion !== undefined) payload.religion = params.religion;
          if (params.entry_year !== undefined) payload.entry_year = params.entry_year;
          if (params.kelas_sekarang !== undefined) payload.kelas_sekarang = params.kelas_sekarang;
          if (params.semester_sekarang !== undefined) payload.semester_sekarang = params.semester_sekarang;
          if (params.status_kenaikan !== undefined) payload.status_kenaikan = params.status_kenaikan;
          if (params.status !== undefined) payload.status = params.status;
          if (params.photo_url !== undefined) payload.photo_url = params.photo_url;
          payload.updated_at = new Date().toISOString();

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
        if (action === 'documents') {
          let studentId = params.student_id || params.id;
          const nis = params.nis;
          let docs = [];
          try {
            if (!studentId && nis) {
              const matchedStudent = await supabaseRest(`students?nis=eq.${encodeURIComponent(nis)}&select=id`);
              if (matchedStudent && matchedStudent.length > 0) {
                studentId = matchedStudent[0].id;
              }
            }
            if (studentId) {
              docs = await supabaseRest(`student_documents?student_id=eq.${encodeURIComponent(studentId)}&order=created_at.desc`) || [];
            }
          } catch (_) { docs = []; }
          return { success: true, data: docs };
        }
        if (action === 'delete') {
          await supabaseRest(`students?id=eq.${encodeURIComponent(params.id)}`, 'DELETE');
          return { success: true, message: 'Siswa berhasil dihapus' };
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
              menunggu_verifikasi: pendingVerif,
              total_invoice: totalBills,
              total_paid: paidBills,
              total_outstanding: totalBills - paidBills,
              pending_verification: pendingVerif
            }
          };
        }
      }

      // -------------------------------------------------------------
      // 12. PPDB
      // -------------------------------------------------------------
      if (module === 'ppdb') {
        if (action === 'list') {
          let query = 'ppdb_registrations?select=*&order=created_at.desc';
          if (params.status) {
            if (params.status === 'approved' || params.status === 'accepted') {
              query += `&status=in.(approved,accepted)`;
            } else {
              query += `&status=eq.${encodeURIComponent(params.status)}`;
            }
          }
          if (params.form_type) {
            query += `&form_type=eq.${encodeURIComponent(params.form_type.toLowerCase())}`;
          }
          if (params.level) {
            query += `&level=ilike.*${encodeURIComponent(params.level)}*`;
          }
          if (params.search || params.q) {
            const sTerm = encodeURIComponent(params.search || params.q);
            query += `&or=(full_name.ilike.*${sTerm}*,registration_number.ilike.*${sTerm}*,id.ilike.*${sTerm}*)`;
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

          const cleanMeta = { ...params };
          delete cleanMeta.photo_file;
          delete cleanMeta.birth_certificate_file;
          delete cleanMeta.family_card_file;
          delete cleanMeta.photo_dataurl;
          delete cleanMeta.akta_dataurl;
          delete cleanMeta.kk_dataurl;
          delete cleanMeta.photo_url;
          delete cleanMeta.birth_certificate_url;
          delete cleanMeta.family_card_url;
          delete cleanMeta.notes;
          delete cleanMeta.password;
          cleanMeta.uploaded_files = {
            photo_url: photoUrl || '',
            birth_certificate_url: certUrl || '',
            family_card_url: kkUrl || ''
          };

          const regPayload = {
            id,
            registration_number: regNum,
            registration_no: regNum,
            student_name: studentName,
            full_name: studentName,
            child_name: studentName,
            nickname: params.nickname || '',
            nik: params.nik || '',
            form_type: params.form_type || (level === 'TPQ' ? 'tpq' : 'paud'),
            student_gender: gender,
            gender: gender,
            student_birth_place: birthPlace,
            birth_place: birthPlace,
            student_birth_date: birthDate,
            birth_date: birthDate,
            parent_name: parentName,
            father_name: params.father_name || parentName,
            mother_name: params.mother_name || '',
            parent_phone: parentPhone,
            phone: parentPhone,
            parent_email: parentEmail,
            address: address,
            level: level,
            status: 'pending',
            notes: params.notes || '',
            photo_url: photoUrl || '',
            birth_certificate_url: certUrl || '',
            family_card_url: kkUrl || '',
            documents_url: {
              photo: photoUrl || '',
              birth_certificate: certUrl || '',
              family_card: kkUrl || ''
            },
            form_metadata: cleanMeta
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
            nickname: params.nickname || '',
            nik: params.nik || '',
            gender: gender,
            birth_place: birthPlace,
            birth_date: birthDate,
            address: address,
            father_name: params.father_name || parentName,
            mother_name: params.mother_name || '',
            parent_name: parentName,
            parent_phone: parentPhone,
            parent_email: emailForLogin,
            program: (params.level || level || 'PAUD').toUpperCase(),
            level: (params.level || level || 'PAUD').toUpperCase(),
            status_pendaftaran: 'pending',
            is_active: false,
            status: 'calon_siswa',
            photo_url: photoUrl || '',
            created_at: new Date().toISOString()
          };

          try {
            const localStudents = JSON.parse(localStorage.getItem('siy_local_students') || '[]');
            localStudents.push(newStudent);
            localStorage.setItem('siy_local_students', JSON.stringify(localStudents));
          } catch (_) {}

          await supabaseRest('students', 'POST', newStudent).catch(err => console.warn('Student profile warning:', err));

          // Sinkronkan berkas yang diunggah saat PPDB ke tabel student_documents
          const initialDocs = [
            { type: 'pas_foto', name: 'Pas Foto 3x4', url: photoUrl },
            { type: 'akta_kelahiran', name: 'Akta Kelahiran', url: certUrl },
            { type: 'kartu_keluarga', name: 'Kartu Keluarga', url: kkUrl }
          ].filter(d => d.url);
          for (const doc of initialDocs) {
            try {
              await supabaseRest('student_documents', 'POST', {
                id: 'DOC-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                student_id: studentId,
                document_type: doc.type,
                file_name: doc.name,
                file_url: doc.url,
                status: 'pending'
              });
            } catch (_) {}
          }

          // 4. Simpan sesi login otomatis ke localStorage
          const roleObj = { code: 'calon_siswa', name: 'Calon Siswa / Pendaftar' };
          const userSession = { ...newUser, role: roleObj, student_id: studentId };
          delete userSession.password_hash;
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
          let p = null;
          try {
            const periods = await supabaseRest('ppdb_periods?select=*&order=created_at.desc');
            p = periods && periods[0] ? { ...periods[0] } : null;
          } catch (e) {
            console.warn('[SIYAYASAN] ppdb_periods read fallback:', e);
          }
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
            try {
              if (p.status) localStorage.setItem('siy_ppdb_status', p.status);
            } catch (_) {}
          } else {
            p = {
              id: 'PER-2026-1',
              status: 'open',
              academic_year: '2026/2027',
              online_registration_dates: '1 Jan - 31 Jul 2026',
              verification_dates: '1 - 5 Agustus 2026',
              announcement_dates: '10 Agustus 2026',
              re_registration_dates: '12 - 20 Agustus 2026'
            };
            try {
              const cachedStatus = localStorage.getItem('siy_ppdb_status');
              if (cachedStatus) p.status = cachedStatus;
              const cachedSched = localStorage.getItem('siy_ppdb_schedule');
              if (cachedSched) Object.assign(p, JSON.parse(cachedSched));
            } catch (_) {}
          }
          return { success: true, data: p };
        }
        if (action === 'update_period' || action === 'savePeriod') {
          let targetId = params.id;
          if (!targetId) {
            try {
              const existing = await supabaseRest('ppdb_periods?select=id&order=created_at.desc&limit=1');
              if (Array.isArray(existing) && existing.length > 0) {
                targetId = existing[0].id;
              }
            } catch (_) {}
          }
          if (!targetId) targetId = 'PER-2026-1';

          const scheduleData = {
            online_registration_dates: params.online_registration_dates || '',
            verification_dates: params.verification_dates || '',
            announcement_dates: params.announcement_dates || '',
            re_registration_dates: params.re_registration_dates || '',
            notes: params.notes || ''
          };
          try {
            if (params.status) localStorage.setItem('siy_ppdb_status', params.status);
            localStorage.setItem('siy_ppdb_schedule', JSON.stringify(scheduleData));
          } catch (_) {}

          const payload = {
            status: params.status || 'open',
            academic_year: params.academic_year || '2026/2027',
            announcement_notes: JSON.stringify(scheduleData)
          };
          let res = null;
          try {
            res = await supabaseRest(`ppdb_periods?id=eq.${encodeURIComponent(targetId)}`, 'PATCH', payload);
          } catch (e) {
            console.warn('[SIYAYASAN] ppdb_periods update fallback:', e);
          }
          await recordActivityLog('UPDATE_PERIOD', 'ppdb', 'Mengubah pengaturan jadwal & status PPDB: ' + (params.status || 'open'), targetId);
          return { success: true, data: { ...(res && res[0] ? res[0] : payload), id: targetId, ...scheduleData }, message: 'Pengaturan gelombang & jadwal PPDB diperbarui' };
        }
        if (action === 'update') {
          const id = params.id;
          const patchData = { ...params };
          delete patchData.id;
          delete patchData.token;
          const res = await supabaseRest(`ppdb_registrations?id=eq.${encodeURIComponent(id)}`, 'PATCH', patchData);
          return { success: true, data: (res && res[0]) || patchData, message: 'Data pendaftar berhasil diperbarui' };
        }
        if (action === 'delete') {
          const id = params.id;
          await supabaseRest(`ppdb_registrations?id=eq.${encodeURIComponent(id)}`, 'DELETE');
          return { success: true, message: 'Data pendaftar berhasil dihapus' };
        }
        if (action === 'approve') {
          const res = await supabaseRest(`ppdb_registrations?id=eq.${encodeURIComponent(params.id)}`, 'PATCH', {
            status: 'accepted',
            notes: params.notes || ''
          });
          await recordActivityLog('APPROVE_PPDB', 'ppdb', 'Menyetujui berkas pendaftaran calon siswa ID: ' + params.id, params.id);
          return { success: true, data: res[0], message: 'Pendaftar diterima' };
        }
        if (action === 'reject') {
          const res = await supabaseRest(`ppdb_registrations?id=eq.${encodeURIComponent(params.id)}`, 'PATCH', {
            status: 'rejected',
            notes: params.reason || params.notes || ''
          });
          await recordActivityLog('REJECT_PPDB', 'ppdb', 'Menolak berkas pendaftaran calon siswa ID: ' + params.id, params.id);
          return { success: true, data: res[0], message: 'Pendaftar ditolak' };
        }
        if (action === 'convert') {
          const regs = await supabaseRest(`ppdb_registrations?id=eq.${encodeURIComponent(params.id)}&select=*`);
          if (!regs || regs.length === 0) return { success: false, message: 'Pendaftar tidak ditemukan' };
          const reg = regs[0];

          // 1. Guard Idempotensi: Cegah konversi ganda
          if (reg.status === 'converted') {
            return { success: false, message: 'Pendaftar ini sudah pernah dikonversi menjadi siswa aktif.' };
          }

          const targetClassId = params.class_id || 'CLS-001';

          // Ambil nama kelas
          let targetClassName = 'PAUD / TK Terpadu';
          if (targetClassId) {
            const cls = await supabaseRest(`classes?id=eq.${encodeURIComponent(targetClassId)}&select=name`);
            if (cls && cls[0]) targetClassName = cls[0].name;
          }

          // 2. Tentukan NIS Siswa (bisa input dari admin atau auto-generate)
          const studentNis = params.nis || ('2026' + String(Math.floor(1000 + Math.random() * 9000)));

          // 3. Guard Keunikan NIS: Pastikan belum ada siswa yang memiliki NIS ini
          const existingNis = await supabaseRest(`students?nis=eq.${encodeURIComponent(studentNis)}&select=id`);
          if (existingNis && existingNis.length > 0) {
            return { success: false, message: `NIS ${studentNis} sudah digunakan oleh siswa aktif lain. Silakan gunakan nomor NIS lain.` };
          }

          // 4. Password awal: gunakan password kustom pendaftaran PPDB (jika ada) atau tanggal lahir DDMMYYYY
          let birthDateStr = reg.birth_date || reg.student_birth_date ? String(reg.birth_date || reg.student_birth_date).trim() : '2021-01-01';
          let birthDatePassword = birthDateStr;
          if (birthDateStr.includes('-')) {
            const p = birthDateStr.split('-');
            if (p.length === 3) birthDatePassword = `${p[2]}${p[1]}${p[0]}`; // DDMMYYYY
          }
          const customPpdbPass = String(reg.password || (reg.form_metadata && reg.form_metadata.password) || '').trim();
          const initialPassword = customPpdbPass || birthDatePassword;

          const regNo = reg.registration_number || reg.registration_no || '';
          const pendaftarEmail = `${regNo.toLowerCase().replace(/[^a-z0-9]/g, '')}@pendaftar.yayasan.sch.id`;
          const cleanPhone = (reg.phone || reg.parent_phone || '').replace(/[^0-9]/g, '');
          const studentEmail = reg.email || reg.parent_email || (cleanPhone ? `${studentNis}@siswa.yayasan.sch.id` : `siswa_${studentNis}@yayasan.sch.id`);
          const studentName = reg.student_name || reg.full_name || reg.child_name || 'Santri Baru';

          // 5. Cek apakah user akun pendaftar sudah ada (cari via email, username regNo, atau email pendaftar)
          let existingUsers = await supabaseRest(
            `users?or=(email.eq.${encodeURIComponent(studentEmail)},username.eq.${encodeURIComponent(regNo)},email.eq.${encodeURIComponent(pendaftarEmail)})&select=*`
          ).catch(() => []);

          let userId = (existingUsers && existingUsers[0]) ? existingUsers[0].id : ('USR-' + studentNis);
          let stuId = (existingUsers && existingUsers[0] && existingUsers[0].student_id)
            ? existingUsers[0].student_id
            : ('STU-' + String(Date.now()).slice(-5));

          if (existingUsers && existingUsers.length > 0) {
            await supabaseRest(`users?id=eq.${encodeURIComponent(userId)}`, 'PATCH', {
              email: studentEmail,
              role: 'siswa_aktif',
              role_label: 'Siswa Aktif',
              nis: studentNis,
              student_id: stuId,
              password_hash: initialPassword,
              fallback_dob_password: birthDatePassword,
              birth_date: birthDateStr,
              is_password_changed: Boolean(customPpdbPass),
              status: 'active'
            });
          } else {
            await supabaseRest('users', 'POST', {
              id: userId,
              email: studentEmail,
              password_hash: initialPassword,
              fallback_dob_password: birthDatePassword,
              birth_date: birthDateStr,
              full_name: studentName,
              name: studentName,
              phone: reg.phone || reg.parent_phone || '',
              role: 'siswa_aktif',
              role_label: 'Siswa Aktif',
              nis: studentNis,
              student_id: stuId,
              avatar: reg.photo_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
              status: 'active',
              is_password_changed: Boolean(customPpdbPass)
            });
          }

          // 6. Buat atau Update Data Siswa Aktif (Tanpa Duplikasi Baris Pending)
          const studentPayload = {
            id: stuId,
            user_id: userId,
            nis: studentNis,
            full_name: studentName,
            name: studentName,
            child_name: studentName,
            nickname: reg.nickname || null,
            gender: reg.gender || reg.student_gender || 'L',
            birth_place: reg.birth_place || reg.student_birth_place || 'Samarinda',
            birth_date: birthDateStr,
            class_id: targetClassId,
            class_name: targetClassName,
            kelas_sekarang: targetClassName,
            semester_sekarang: 'Semester 1',
            status_kenaikan: 'Aktif',
            status_pendaftaran: 'accepted',
            is_active: true,
            parent_name: reg.parent_name || reg.father_name || reg.mother_name || '',
            father_name: reg.father_name || reg.parent_name || '',
            mother_name: reg.mother_name || '',
            parent_phone: reg.parent_phone || reg.phone || '',
            phone: reg.phone || reg.parent_phone || '',
            parent_email: studentEmail,
            photo_url: reg.photo_url || null,
            address: reg.address || '',
            status: 'active'
          };

          const existingStu = await supabaseRest(`students?id=eq.${encodeURIComponent(stuId)}&select=id`).catch(() => []);
          if (existingStu && existingStu.length > 0) {
            const patchStu = { ...studentPayload };
            delete patchStu.id;
            await supabaseRest(`students?id=eq.${encodeURIComponent(stuId)}`, 'PATCH', patchStu);
          } else {
            await supabaseRest('students', 'POST', studentPayload);
          }

          // Update jumlah siswa di kelas tujuan
          if (targetClassId) {
            supabaseRest(`students?class_id=eq.${encodeURIComponent(targetClassId)}&status=eq.active&select=id`).then(list => {
              supabaseRest(`classes?id=eq.${encodeURIComponent(targetClassId)}`, 'PATCH', { student_count: (list || []).length });
            }).catch(() => {});
          }

          // 7. Update Status Registrasi PPDB menjadi 'converted'
          await supabaseRest(`ppdb_registrations?id=eq.${reg.id}`, 'PATCH', {
            status: 'converted',
            converted_nis: studentNis,
            nis: studentNis,
            class_name: targetClassName,
            notes: `Diterima sebagai Siswa Aktif (NIS: ${studentNis}, Kelas: ${targetClassName})`
          }).catch(async () => {
            await supabaseRest(`ppdb_registrations?id=eq.${reg.id}`, 'PATCH', {
              status: 'converted',
              notes: `Diterima sebagai Siswa Aktif (NIS: ${studentNis}, Kelas: ${targetClassName})`,
              form_metadata: {
                ...(reg.form_metadata || {}),
                converted_nis: studentNis,
                nis: studentNis,
                class_name: targetClassName
              }
            }).catch(() => {});
          });
          await recordActivityLog('CONVERT_SISWA', 'students', 'Aktivasi calon siswa PPDB ' + studentName + ' ke siswa aktif (NIS: ' + studentNis + ', Kelas: ' + targetClassName + ')', stuId);

          // 8. Terbitkan Otomatis Tagihan SPP Bulan Pertama (Jika auto_spp aktif)
          if (params.auto_spp !== false) {
            const currentYear = new Date().getFullYear();
            const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            const currentMonthName = monthNames[new Date().getMonth()];
            const invNumber = `INV/${currentYear}/${String(Math.floor(1000 + Math.random() * 9000))}`;
            const invDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
            const invPayload = {
              id: 'INV-' + String(Date.now()).slice(-6),
              invoice_number: invNumber,
              student_id: stuId,
              student_name: studentName,
              month: currentMonthName,
              period: `${currentYear}/${currentYear + 1}`,
              amount: 150000,
              due_date: invDueDate,
              status: 'unpaid',
              description: `SPP Bulan ${currentMonthName} ${currentYear} (Santri Baru)`
            };
            await supabaseRest('invoices', 'POST', invPayload).catch(() => {});
          }

          // 9. Ringkasan Kredensial Siswa Baru
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          const loginUrl = `${origin}/login.html`;
          const summaryText = `Akses Portal Siswa Yayasan At Tarbiyyah Wijaya Kusuma Samarinda\nNama: ${studentName}\nNIS (Username Login): ${studentNis}\nKata Sandi Awal: ${birthDatePassword} (Tanggal Lahir: DDMMYYYY)\nLink Portal: ${loginUrl}`;

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
          const authorVal = params.author || params.author_name || 'Admin Sekolah';
          const payload = {
            id,
            slug,
            title: params.title || 'Berita Baru',
            category: params.category || 'Umum',
            summary: params.summary || params.excerpt || (params.content ? params.content.substring(0, 150) : ''),
            content: params.content || params.body || '',
            image: img || '',
            author: authorVal,
            author_name: authorVal,
            status: params.status || (params.is_published ? 'published' : 'draft'),
            is_published: (params.status === 'published' || params.status === 'pinned' || params.is_published === true),
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
          if (params.status) {
            payload.status = params.status;
            payload.is_published = (params.status === 'published' || params.status === 'pinned');
          }
          if (params.is_published !== undefined) {
            payload.is_published = Boolean(params.is_published);
            if (!payload.status) payload.status = payload.is_published ? 'published' : 'draft';
          }
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
          const mapped = (ann || []).map(r => ({
            ...r,
            category: r.category || r.target_audience || r.target_role || 'Edaran'
          }));
          return { success: true, data: mapped, raw: { items: mapped } };
        }
        if (action === 'get') {
          const ann = await supabaseRest(`announcements?id=eq.${encodeURIComponent(params.id)}&select=*`);
          return { success: true, data: ann[0] || null };
        }
        if (action === 'create') {
          const id = 'ANN-' + Date.now();
          const targetAud = params.target_audience || params.target_role || params.category || 'all';
          const isPubAnn = (params.status === 'published' || params.status === 'pinned' || params.is_published === true);
          const payload = {
            id,
            title: params.title || 'Pengumuman Baru',
            content: params.content || params.body || params.excerpt || '',
            target_audience: targetAud,
            target_role: targetAud,
            category: params.category || targetAud,
            is_pinned: !!params.is_pinned,
            status: params.status || (isPubAnn ? 'published' : 'draft'),
            is_published: isPubAnn,
            published_at: params.published_at || new Date().toISOString()
          };
          const res = await supabaseRest('announcements', 'POST', payload);
          return { success: true, data: res[0] || payload, message: 'Pengumuman diterbitkan' };
        }
        if (action === 'update') {
          const payload = {};
          if (params.title) payload.title = params.title;
          if (params.content || params.body) payload.content = params.content || params.body;
          if (params.target_audience || params.target_role || params.category) {
            payload.target_audience = params.target_audience || params.target_role || params.category;
            payload.target_role = payload.target_audience;
            payload.category = payload.target_audience;
          }
          if (params.status) {
            payload.status = params.status;
            payload.is_published = (params.status === 'published' || params.status === 'pinned');
          }
          if (params.is_published !== undefined) {
            payload.is_published = Boolean(params.is_published);
            if (!payload.status) payload.status = payload.is_published ? 'published' : 'draft';
          }
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
          const evts = await supabaseRest('events?select=*&order=event_date.asc').catch(() => supabaseRest('events?select=*'));
          const normalizedEvts = (evts || []).map(e => ({ ...e, date: e.date || e.event_date, event_date: e.event_date || e.date }));
          return { success: true, data: normalizedEvts, raw: { items: normalizedEvts } };
        }
        if (action === 'create') {
          const id = 'EVT-' + Date.now();
          const evtDate = params.date || params.event_date || new Date().toISOString().split('T')[0];
          const isPubEvt = (params.status === 'upcoming' || params.status === 'published' || params.is_published === true);
          const payload = {
            id,
            title: params.title || 'Agenda Baru',
            date: evtDate,
            event_date: evtDate,
            time: params.time || '08:00 - Selesai',
            location: params.location || 'Lingkungan Yayasan',
            description: params.description || params.content || params.excerpt || '',
            status: params.status || (isPubEvt ? 'upcoming' : 'draft'),
            is_published: isPubEvt
          };
          const res = await supabaseRest('events', 'POST', payload);
          return { success: true, data: res[0] || payload, message: 'Agenda dibuat' };
        }
        if (action === 'update') {
          const payload = {};
          if (params.title) payload.title = params.title;
          if (params.date || params.event_date) {
            payload.date = params.date || params.event_date;
            payload.event_date = payload.date;
          }
          if (params.time) payload.time = params.time;
          if (params.location) payload.location = params.location;
          if (params.description || params.content) payload.description = params.description || params.content;
          if (params.status) {
            payload.status = params.status;
            payload.is_published = (params.status === 'upcoming' || params.status === 'published');
          }
          if (params.is_published !== undefined) {
            payload.is_published = Boolean(params.is_published);
            if (!payload.status) payload.status = payload.is_published ? 'upcoming' : 'draft';
          }
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
            campus_note: params.campus_note || '',
            maps_url: params.maps_url || '',
            maps_embed_url: params.maps_embed_url || '',
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
          let q = 'activity_logs?select=*&order=created_at.desc&limit=100';
          if (params.action) q += `&action=ilike.*${encodeURIComponent(params.action)}*`;
          if (params.module) q += `&entity_type=ilike.*${encodeURIComponent(params.module)}*`;
          if (params.user_id) q += `&user_id=eq.${encodeURIComponent(params.user_id)}`;
          if (params.search) q += `&or=(details.ilike.*${encodeURIComponent(params.search)}*,user_name.ilike.*${encodeURIComponent(params.search)}*)`;
          const logs = await supabaseRest(q).catch(() => []);
          const mapped = (logs || []).map(r => ({
            ...r,
            module: r.module || r.entity_type || 'sistem',
            description: r.description || r.details || '-'
          }));
          return { success: true, data: mapped, raw: { items: mapped } };
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
            const stu = await supabaseRest('students?status=eq.active&select=*&order=full_name.asc').catch(() => []);
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
          } else if (repType === 'all') {
            headers = ['No', 'Modul Data', 'Jumlah Entitas Terdaftar', 'Keterangan'];
            const [stu, cls, inv, regs] = await Promise.all([
              supabaseRest('students?status=eq.active&select=id').catch(() => []),
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

        if (action === 'import_invoices') {
          const rawItems = Array.isArray(params.items) ? params.items : [];
          if (rawItems.length === 0) return { success: false, message: 'Tidak ada data tagihan untuk diimpor' };
          const stuList = await supabaseRest('students?status=eq.active&select=id,nis,full_name').catch(() => []);
          let insertedCount = 0;
          for (let i = 0; i < rawItems.length; i++) {
            const row = rawItems[i];
            const stu = (stuList || []).find(s =>
              (row.nis && s.nis && String(s.nis).trim() === String(row.nis).trim()) ||
              (row.student_name && s.full_name && s.full_name.toLowerCase().includes(String(row.student_name).toLowerCase().trim()))
            ) || (stuList && stuList[0]);
            if (!stu) continue;
            const invPayload = {
              id: 'INV-' + Date.now() + '-' + i,
              invoice_number: row.invoice_number || ('INV/' + new Date().getFullYear() + '/' + String(Date.now()).slice(-4) + '/' + (i + 1)),
              student_id: stu.id,
              student_name: row.student_name || stu.full_name,
              month: row.period || row.month || 'Periode Berjalan',
              period: row.period || row.month || '2026/2027',
              amount: Number(row.amount) || 150000,
              due_date: row.due_date || new Date().toISOString().slice(0, 10),
              status: (row.status || 'unpaid').toLowerCase(),
              description: row.description || row.item_name || 'SPP Import Excel'
            };
            await supabaseRest('invoices', 'POST', invPayload).catch(() => {});
            insertedCount++;
          }
          return { success: true, count: insertedCount, message: `Berhasil mengimpor ${insertedCount} data tagihan ke dalam database!` };
        }

        if (action === 'import_students') {
          const rawItems = Array.isArray(params.items) ? params.items : [];
          if (rawItems.length === 0) return { success: false, message: 'Tidak ada data siswa untuk diimpor' };
          let insertedCount = 0;
          for (let i = 0; i < rawItems.length; i++) {
            const row = rawItems[i];
            const stuId = 'STU-' + Date.now() + '-' + i;
            const fullName = row.full_name || row.name || ('Siswa Baru ' + (i + 1));
            const stuPayload = {
              id: stuId,
              nis: row.nis || ('2026' + String(1000 + i)),
              full_name: fullName,
              name: fullName,
              child_name: fullName,
              nickname: row.nickname || fullName.split(' ')[0],
              gender: row.gender || 'L',
              birth_place: row.birth_place || 'Samarinda',
              birth_date: row.birth_date || '2020-01-01',
              class_id: row.class_id || 'CLS-001',
              class_name: row.class_name || 'PAUD / TK',
              kelas_sekarang: row.class_name || 'PAUD / TK',
              parent_name: row.parent_name || row.father_name || 'Wali Siswa',
              father_name: row.father_name || row.parent_name || '',
              mother_name: row.mother_name || '',
              parent_phone: row.phone || row.parent_phone || '',
              phone: row.phone || row.parent_phone || '',
              parent_email: row.email || '',
              address: row.address || 'Samarinda',
              status: 'active',
              is_active: true
            };
            await supabaseRest('students', 'POST', stuPayload).catch(() => {});
            insertedCount++;
          }
          return { success: true, count: insertedCount, message: `Berhasil mengimpor ${insertedCount} data siswa ke dalam database!` };
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
            supabaseRest('ppdb_registrations?select=*').catch(() => [])
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
          const snapshot = params.data || params;
          if (snapshot && typeof snapshot === 'object') {
            try {
              localStorage.setItem('siy_restored_snapshot', JSON.stringify({ restored_at: new Date().toISOString(), ...snapshot }));
            } catch (_) {}
            const tableMap = snapshot.tables || snapshot.data || snapshot;
            if (typeof tableMap === 'object') {
              for (const [tblName, rows] of Object.entries(tableMap)) {
                if (Array.isArray(rows) && rows.length > 0 && ['students', 'teachers', 'classes', 'ppdb_registrations', 'invoices', 'news', 'cms_settings'].includes(tblName)) {
                  for (const row of rows) {
                    try {
                      await supabaseRest(tblName, 'POST', row, { 'Prefer': 'resolution=merge-duplicates,return=representation' });
                    } catch (_) {}
                  }
                }
              }
            }
          }
          await recordActivityLog('RESTORE_DATABASE', 'backup', 'Memulihkan data cadangan database');
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

      // 18. CONTACT MESSAGES (Form Kontak Publik)
      if (module === 'contact' || module === 'contact_messages') {
        if (action === 'list') {
          const msgs = await supabaseRest('contact_messages?select=*&order=created_at.desc').catch(() => []);
          return { success: true, data: msgs };
        }
        const id = 'MSG-' + Date.now();
        const msgPayload = {
          id,
          name: params.name || 'Pengunjung',
          email: params.email || '',
          phone: params.phone || '',
          subject: params.subject || 'Pesan Website',
          message: params.message || '',
          status: 'unread'
        };
        await supabaseRest('contact_messages', 'POST', msgPayload).catch(() => {});
        return { success: true, data: msgPayload, message: 'Pesan Anda berhasil dikirim.' };
      }

      // Default fallback generic CRUD if module corresponds directly to a table
      const items = await supabaseRest(`${module}?select=*`).catch(() => []);
      return { success: true, data: items, raw: { items } };

    } catch (err) {
      const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      if (isLocalHost && !isSupabaseOffline) {
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
      success: 'bg-sky-50 border-sky-200 text-sky-900',
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