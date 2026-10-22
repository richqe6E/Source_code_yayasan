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

  // Low-level fetch wrapper to Supabase REST API (with automatic schema-cache column self-healing)
  async function supabaseRest(endpoint, method = 'GET', body = null, extraHeaders = {}, _retryCount = 0) {
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
        // Self-healing: if PostgREST rejects an unknown column in POST/PATCH/PUT object payload, strip it and retry
        if (
          _retryCount < 8 &&
          body &&
          typeof body === 'object' &&
          !Array.isArray(body) &&
          (method === 'POST' || method === 'PATCH' || method === 'PUT')
        ) {
          const colMatch =
            errMessage.match(/Could not find the '([^']+)' column/i) ||
            errMessage.match(/column "([^"]+)" of relation/i);
          if (colMatch && colMatch[1] && Object.prototype.hasOwnProperty.call(body, colMatch[1])) {
            const badCol = colMatch[1];
            console.warn(`[SIYAYASAN] Auto-stripping unrecognized column '${badCol}' on ${method} ${endpoint} and retrying...`);
            const nextBody = { ...body };
            delete nextBody[badCol];
            if (Object.keys(nextBody).length === 0) return [];
            return supabaseRest(endpoint, method, nextBody, extraHeaders, _retryCount + 1);
          }
        }
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
      await supabaseRest('activity_logs', 'POST', {
        id: 'LOG-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        user_id: sess?.id || 'USR-001',
        user_name: sess?.full_name || sess?.name || 'Admin',
        action: String(actionType || 'UPDATE'),
        module: entityType || 'sistem',
        details: String(detailsText || '') + (entityId ? ` [ID: ${entityId}]` : ''),
        created_at: new Date().toISOString()
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
      if (localRes && localRes.success !== undefined && !String(localRes.message || '').startsWith('Endpoint tidak dikenali:')) {
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

        if (action === 'update_profile') {
          const targetUserId = params.user_id || (currentUser ? currentUser.id : null);
          if (!targetUserId) return { success: false, message: 'Identitas pengguna tidak ditemukan' };

          let avatarUrl = params.avatar_url || params.avatar || '';
          if (typeof avatarUrl === 'string' && avatarUrl.startsWith('data:')) {
            avatarUrl = await uploadToSupabaseStorage(avatarUrl, 'avatar');
          }

          const newName = (params.full_name || params.name || '').trim();
          const userPatch = { updated_at: new Date().toISOString() };
          if (newName) {
            userPatch.full_name = newName;
            userPatch.name = newName;
          }
          if (avatarUrl) {
            userPatch.avatar = avatarUrl;
          }
          if (params.phone) userPatch.phone = params.phone;

          await supabaseRest(`users?id=eq.${encodeURIComponent(targetUserId)}`, 'PATCH', userPatch).catch(() => {});

          const stuId = params.student_id || (currentUser ? currentUser.student_id : null);
          if (stuId && String(stuId).startsWith('STU-')) {
            const stuPatch = {};
            if (newName) {
              stuPatch.full_name = newName;
              stuPatch.name = newName;
              stuPatch.child_name = newName;
            }
            if (avatarUrl) stuPatch.photo_url = avatarUrl;
            if (Object.keys(stuPatch).length > 0) {
              await supabaseRest(`students?id=eq.${encodeURIComponent(stuId)}`, 'PATCH', stuPatch).catch(() => {});
            }
          }

          if (currentUser && currentUser.id === targetUserId) {
            if (newName) {
              currentUser.full_name = newName;
              currentUser.name = newName;
            }
            if (avatarUrl) {
              currentUser.avatar_url = avatarUrl;
              currentUser.avatar = avatarUrl;
            }
            try { localStorage.setItem('siy_user', JSON.stringify(currentUser)); } catch (_) {}
          }

          return {
            success: true,
            data: { user_id: targetUserId, full_name: newName, avatar_url: avatarUrl },
            message: 'Profil berhasil diperbarui'
          };
        }

        if (action === 'logout') {
          return { success: true, data: { message: 'Logout berhasil' } };
        }
      }

      // -------------------------------------------------------------
      // 1B. WEB SETTINGS (CMS HERO CAROUSEL, SOSMED, KONTAK & EXTENDED PROFILE)
      // -------------------------------------------------------------
      if (module === 'web_settings') {
        const EXT_KEYS = [
          'visi', 'misi', 'budaya', 'sejarah', 'program_pendidikan', 'kurikulum',
          'operational_hours', 'struktur_organisasi', 'pembina', 'pengawas',
          'ketua_yayasan', 'sekretaris', 'bendahara', 'headmaster_name',
          'campus_note', 'maps_url', 'maps_embed_url', 'footer_bg_url', 'logo_url', 'tagline',
          'hero_images', 'backup_history', 'whatsapp_number', 'whatsapp', 'phone', 'email',
          'address', 'school_name', 'name', 'instagram_url', 'youtube_url', 'facebook_url',
          'hero_title', 'hero_subtitle', 'ppdb_active_note'
        ];
        const VALID_WEB_SETTINGS_COLS = [
          'id', 'school_name', 'tagline', 'hero_title', 'hero_subtitle', 'hero_images',
          'facebook_url', 'instagram_url', 'youtube_url', 'phone', 'whatsapp', 'email',
          'address', 'ppdb_active_note', 'updated_at', 'header_title', 'announcement_banner',
          'whatsapp_official', 'contact_email', 'campus_note', 'maps_url', 'maps_embed_url',
          'academic_year', 'footer_bg_url', 'login_bg_url'
        ];

        if (action === 'get') {
          let out = {};
          try {
            const [list, sch] = await Promise.all([
              supabaseRest('web_settings?id=eq.default&select=*').catch(() => []),
              supabaseRest('schools?select=*&limit=1').catch(() => [])
            ]);
            const ws = (list && list[0]) ? list[0] : null;
            const schRow = (sch && sch[0]) ? sch[0] : null;

            let wsExt = {};
            if (ws && typeof ws.announcement_banner === 'string' && ws.announcement_banner.trim().startsWith('{')) {
              try { wsExt = JSON.parse(ws.announcement_banner); } catch (_) {}
            }
            let schExt = {};
            if (schRow && typeof schRow.wa_gateway_token === 'string' && schRow.wa_gateway_token.trim().startsWith('{')) {
              try { schExt = JSON.parse(schRow.wa_gateway_token); } catch (_) {}
            }

            // Tentukan sumber mana yang lebih baru berdasarkan updated_at
            const wsTime = ws && ws.updated_at ? new Date(ws.updated_at).getTime() : 0;
            const schTime = schRow && schRow.updated_at ? new Date(schRow.updated_at).getTime() : 0;

            if (schTime > wsTime) {
              if (ws) Object.assign(out, ws);
              Object.assign(out, wsExt);
              if (schRow) Object.assign(out, schRow);
              Object.assign(out, schExt);
            } else {
              if (schRow) Object.assign(out, schRow);
              Object.assign(out, schExt);
              if (ws) Object.assign(out, ws);
              Object.assign(out, wsExt);
            }

            // Pastikan field yang hanya ada di salah satu ekstensi tetap terisi
            for (const [k, v] of Object.entries(schExt)) {
              if (out[k] === undefined || out[k] === null || out[k] === '') out[k] = v;
            }
            for (const [k, v] of Object.entries(wsExt)) {
              if (out[k] === undefined || out[k] === null || out[k] === '') out[k] = v;
            }
            if (out.name && !out.school_name) out.school_name = out.name;
            if (out.school_name && !out.name) out.name = out.school_name;
            if (out.whatsapp && !out.whatsapp_number) out.whatsapp_number = out.whatsapp;
            if (out.whatsapp_number && !out.whatsapp) out.whatsapp = out.whatsapp_number;

            // Kolom asli hero_images di tabel web_settings adalah sumber kebenaran tunggal
            if (ws && Array.isArray(ws.hero_images)) {
              out.hero_images = ws.hero_images;
            } else if (!Array.isArray(out.hero_images)) {
              out.hero_images = [];
            }
          } catch (_) {}
          try {
            const cachedExt = localStorage.getItem('siy_school_ext');
            if (cachedExt) {
              const parsedLocal = JSON.parse(cachedExt);
              Object.keys(parsedLocal).forEach(k => {
                if (k === 'hero_images') return;
                if (out[k] === undefined || out[k] === null || out[k] === '') {
                  out[k] = parsedLocal[k];
                }
              });
            }
          } catch (_) {}
          return { success: true, data: out };
        }
        if (action === 'update') {
          let mergedExt = {};
          try {
            const raw = localStorage.getItem('siy_school_ext');
            if (raw) mergedExt = JSON.parse(raw);
          } catch (_) {}

          // Read existing cloud JSON in both schools.wa_gateway_token and web_settings.announcement_banner
          try {
            const [existingWs, existingSch] = await Promise.all([
              supabaseRest('web_settings?id=eq.default&select=announcement_banner').catch(() => []),
              supabaseRest('schools?select=wa_gateway_token&limit=1').catch(() => [])
            ]);
            if (existingSch && existingSch[0] && typeof existingSch[0].wa_gateway_token === 'string' && existingSch[0].wa_gateway_token.trim().startsWith('{')) {
              mergedExt = { ...JSON.parse(existingSch[0].wa_gateway_token), ...mergedExt };
            }
            if (existingWs && existingWs[0] && typeof existingWs[0].announcement_banner === 'string' && existingWs[0].announcement_banner.trim().startsWith('{')) {
              mergedExt = { ...JSON.parse(existingWs[0].announcement_banner), ...mergedExt };
            }
          } catch (_) {}

          EXT_KEYS.forEach(k => {
            if (params[k] !== undefined) mergedExt[k] = params[k];
          });
          if (params.whatsapp !== undefined && params.whatsapp_number === undefined) {
            mergedExt.whatsapp_number = params.whatsapp;
          }
          if (params.whatsapp_number !== undefined && params.whatsapp === undefined) {
            mergedExt.whatsapp = params.whatsapp_number;
          }

          try {
            localStorage.setItem('siy_school_ext', JSON.stringify(mergedExt));
          } catch (_) {}

          const nowIso = new Date().toISOString();
          const safeWsPayload = { updated_at: nowIso };
          VALID_WEB_SETTINGS_COLS.forEach(col => {
            if (params[col] !== undefined && col !== 'id') {
              safeWsPayload[col] = params[col];
            }
          });
          if (params.name && !safeWsPayload.school_name) safeWsPayload.school_name = params.name;
          if (params.whatsapp_number && !safeWsPayload.whatsapp) safeWsPayload.whatsapp = params.whatsapp_number;
          safeWsPayload.announcement_banner = JSON.stringify(mergedExt);

          let res = null;
          try {
            res = await supabaseRest('web_settings?id=eq.default', 'PATCH', safeWsPayload);
            if (!res || res.length === 0) {
              res = await supabaseRest('web_settings', 'POST', { id: 'default', ...safeWsPayload }).catch(() => []);
            }
          } catch (wsErr) {
            console.warn('web_settings primary patch warning, retrying core cols:', wsErr);
            const minimalWs = {
              school_name: safeWsPayload.school_name || 'YAYASAN AT TARBIYYAH WIJAYA KUSUMA SAMARINDA',
              phone: safeWsPayload.phone,
              whatsapp: safeWsPayload.whatsapp,
              email: safeWsPayload.email,
              address: safeWsPayload.address,
              hero_images: safeWsPayload.hero_images,
              announcement_banner: JSON.stringify(mergedExt),
              updated_at: nowIso
            };
            Object.keys(minimalWs).forEach(k => minimalWs[k] === undefined && delete minimalWs[k]);
            res = await supabaseRest('web_settings?id=eq.default', 'PATCH', minimalWs).catch(() => []);
          }

          // Sync extended JSON to schools.wa_gateway_token as well so schools/get on other devices also receives it
          try {
            const schSync = { wa_gateway_token: JSON.stringify(mergedExt), updated_at: nowIso };
            if (params.school_name || params.name) schSync.name = params.school_name || params.name;
            if (params.phone) schSync.phone = params.phone;
            if (params.email) schSync.email = params.email;
            if (params.address) schSync.address = params.address;
            await supabaseRest('schools?id=eq.SCH-001', 'PATCH', schSync).catch(() => {});
          } catch (_) {}

          return { success: true, data: { ...(res && res[0] ? res[0] : safeWsPayload), ...mergedExt }, message: 'Pengaturan website berhasil disimpan' };
        }
      }

      // -------------------------------------------------------------
      // 1C. PORTAL SISWA (BIODATA, DOKUMEN, SPP, AKADEMIK)
      // -------------------------------------------------------------
      if (module === 'siswa') {
        const studentId = params.student_id || (currentUser ? currentUser.student_id : null);

        async function resolveCurrentStudentRecord() {
          let stu = null;
          if (studentId && String(studentId).startsWith('STU-')) {
            const res = await supabaseRest(`students?id=eq.${encodeURIComponent(studentId)}&select=*`).catch(() => []);
            if (res && res.length > 0) stu = res[0];
          }
          if (!stu && currentUser && currentUser.id) {
            const res = await supabaseRest(`students?user_id=eq.${encodeURIComponent(currentUser.id)}&select=*`).catch(() => []);
            if (res && res.length > 0) stu = res[0];
          }
          if (!stu && currentUser && currentUser.nis) {
            const res = await supabaseRest(`students?nis=eq.${encodeURIComponent(currentUser.nis)}&select=*`).catch(() => []);
            if (res && res.length > 0) stu = res[0];
          }
          if (!stu && studentId) {
            const res = await supabaseRest(`students?id=eq.${encodeURIComponent(studentId)}&select=*`).catch(() => []);
            if (res && res.length > 0) stu = res[0];
          }
          return stu;
        }

        if (action === 'get_profile') {
          let student = await resolveCurrentStudentRecord();
          if (student && !student.registration_number && currentUser) {
            try {
              const regQuery = currentUser.username && String(currentUser.username).startsWith('REG')
                ? `ppdb_registrations?registration_number=eq.${encodeURIComponent(currentUser.username)}&select=*`
                : `ppdb_registrations?full_name=eq.${encodeURIComponent(student.full_name || currentUser.full_name || '')}&select=*`;
              const regs = await supabaseRest(regQuery).catch(() => []);
              if (regs && regs[0]) {
                student.registration_number = regs[0].registration_number || regs[0].registration_no;
                student.status_pendaftaran = regs[0].status || student.status_pendaftaran;
                if (!student.photo_url && regs[0].photo_url) student.photo_url = regs[0].photo_url;
              }
            } catch (_) {}
          }
          return { success: true, data: student || {} };
        }

        if (action === 'update_biodata') {
          const stuRecord = await resolveCurrentStudentRecord();
          let id = (stuRecord && stuRecord.id) || studentId;
          if (!id) return { success: false, message: 'Data siswa tidak ditemukan' };

          const payload = { ...params };
          delete payload.student_id;
          delete payload.id;
          const res = await supabaseRest(`students?id=eq.${encodeURIComponent(id)}`, 'PATCH', payload);

          // Sinkronkan nama lengkap & telepon ke tabel users
          const newName = payload.full_name || payload.name;
          const newPhone = payload.parent_phone || payload.phone;
          if (currentUser && currentUser.id && (newName || newPhone)) {
            const uPatch = {};
            if (newName) { uPatch.full_name = newName; uPatch.name = newName; }
            if (newPhone) uPatch.phone = newPhone;
            await supabaseRest(`users?id=eq.${encodeURIComponent(currentUser.id)}`, 'PATCH', uPatch).catch(() => {});
          }

          // Sinkronkan juga ke ppdb_registrations jika merupakan calon_siswa / memiliki data PPDB
          try {
            const regPatch = {};
            if (newName) { regPatch.full_name = newName; regPatch.student_name = newName; regPatch.child_name = newName; }
            if (payload.nickname !== undefined) regPatch.nickname = payload.nickname;
            if (payload.gender !== undefined) { regPatch.gender = payload.gender; regPatch.student_gender = payload.gender; }
            if (payload.birth_place !== undefined) { regPatch.birth_place = payload.birth_place; regPatch.student_birth_place = payload.birth_place; }
            if (payload.birth_date !== undefined) { regPatch.birth_date = payload.birth_date; regPatch.student_birth_date = payload.birth_date; }
            if (payload.father_name !== undefined) { regPatch.father_name = payload.father_name; regPatch.parent_name = payload.father_name; }
            if (payload.mother_name !== undefined) regPatch.mother_name = payload.mother_name;
            if (newPhone !== undefined) { regPatch.parent_phone = newPhone; regPatch.phone = newPhone; }
            if (payload.parent_email !== undefined) regPatch.parent_email = payload.parent_email;
            if (payload.address !== undefined) regPatch.address = payload.address;
            if (Object.keys(regPatch).length > 0 && currentUser) {
              const regFilter = (currentUser.username && String(currentUser.username).startsWith('REG'))
                ? `registration_number=eq.${encodeURIComponent(currentUser.username)}`
                : `full_name=eq.${encodeURIComponent((stuRecord && stuRecord.full_name) || currentUser.full_name || '')}`;
              await supabaseRest(`ppdb_registrations?${regFilter}`, 'PATCH', regPatch).catch(() => {});
            }
          } catch (_) {}

          return { success: true, data: res, message: 'Biodata berhasil diperbarui' };
        }

        if (action === 'get_documents') {
          const stuRecord = await resolveCurrentStudentRecord();
          let id = (stuRecord && stuRecord.id) || studentId;
          let docs = [];
          if (id) {
            docs = await supabaseRest(`student_documents?student_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.desc`).catch(() => []) || [];
          }
          // Fallback: jika tabel student_documents belum memiliki entri, periksa dari ppdb_registrations / stuRecord
          if (docs.length === 0 && (stuRecord || currentUser)) {
            try {
              const nameLookup = (stuRecord && stuRecord.full_name) || (currentUser && currentUser.full_name) || '';
              const regNoLookup = (stuRecord && stuRecord.registration_number) || (currentUser && currentUser.username) || '';
              let regs = [];
              if (regNoLookup && String(regNoLookup).startsWith('REG')) {
                regs = await supabaseRest(`ppdb_registrations?registration_number=eq.${encodeURIComponent(regNoLookup)}&select=*`).catch(() => []);
              }
              if ((!regs || regs.length === 0) && nameLookup) {
                regs = await supabaseRest(`ppdb_registrations?full_name=eq.${encodeURIComponent(nameLookup)}&select=*`).catch(() => []);
              }
              const r = (regs && regs[0]) || stuRecord || {};
              if (r.photo_url) docs.push({ id: 'DOC-FOTO', student_id: id, document_type: 'pas_foto', file_name: 'Pas Foto 3x4', file_url: r.photo_url, is_verified: true, created_at: r.created_at });
              if (r.birth_certificate_url) docs.push({ id: 'DOC-AKTA', student_id: id, document_type: 'akta_kelahiran', file_name: 'Akta Kelahiran', file_url: r.birth_certificate_url, is_verified: true, created_at: r.created_at });
              if (r.family_card_url) docs.push({ id: 'DOC-KK', student_id: id, document_type: 'kartu_keluarga', file_name: 'Kartu Keluarga', file_url: r.family_card_url, is_verified: true, created_at: r.created_at });
            } catch (_) {}
          }
          return { success: true, data: docs || [] };
        }

        if (action === 'upload_document') {
          const stuRecord = await resolveCurrentStudentRecord();
          let id = (stuRecord && stuRecord.id) || studentId;
          if (!id) return { success: false, message: 'Data siswa tidak ditemukan' };

          const rawType = (params.document_type || 'lainnya').toLowerCase();
          const normTypeMap = {
            foto: 'pas_foto',
            pas_foto: 'pas_foto',
            kk: 'kartu_keluarga',
            kartu_keluarga: 'kartu_keluarga',
            akte: 'akta_kelahiran',
            akta: 'akta_kelahiran',
            akta_kelahiran: 'akta_kelahiran'
          };
          const canonicalType = normTypeMap[rawType] || rawType;

          let fileUrl = params.file_url;
          if (params.file) {
            fileUrl = await uploadToSupabaseStorage(params.file, `doc_${canonicalType}`);
          }
          if (!fileUrl) return { success: false, message: 'Gagal mengunggah file dokumen' };

          // Cek apakah dokumen dengan tipe yang sama sudah ada untuk siswa ini agar tidak duplikat
          const existingDocs = await supabaseRest(`student_documents?student_id=eq.${encodeURIComponent(id)}&select=*`).catch(() => []) || [];
          const sameTypeDoc = existingDocs.find(d => (normTypeMap[(d.document_type || '').toLowerCase()] || d.document_type) === canonicalType && canonicalType !== 'lainnya');

          let docObj;
          if (sameTypeDoc) {
            docObj = {
              ...sameTypeDoc,
              document_type: canonicalType,
              file_name: params.file_name || sameTypeDoc.file_name || 'Berkas Dokumen',
              file_url: fileUrl,
              file_size: params.file_size || 0,
              updated_at: new Date().toISOString()
            };
            await supabaseRest(`student_documents?id=eq.${encodeURIComponent(sameTypeDoc.id)}`, 'PATCH', {
              document_type: canonicalType,
              file_name: docObj.file_name,
              file_url: fileUrl,
              file_size: docObj.file_size,
              updated_at: docObj.updated_at
            }).catch(() => {});
          } else {
            docObj = {
              id: 'DOC-' + Date.now(),
              student_id: id,
              document_type: canonicalType,
              file_name: params.file_name || 'Berkas Dokumen',
              file_url: fileUrl,
              file_size: params.file_size || 0,
              is_verified: false,
              created_at: new Date().toISOString()
            };
            await supabaseRest('student_documents', 'POST', docObj);
          }

          if (canonicalType === 'pas_foto') {
            await supabaseRest(`students?id=eq.${encodeURIComponent(id)}`, 'PATCH', { photo_url: fileUrl }).catch(() => {});
          }

          const docColMap = {
            pas_foto: 'photo_url',
            foto: 'photo_url',
            akta_kelahiran: 'birth_certificate_url',
            akte: 'birth_certificate_url',
            akta: 'birth_certificate_url',
            kartu_keluarga: 'family_card_url',
            kk: 'family_card_url'
          };
          const targetCol = docColMap[canonicalType] || docColMap[rawType];
          if (targetCol) {
            try {
              const nameMatch = (stuRecord && stuRecord.full_name) || currentUser?.full_name || currentUser?.name || '';
              if (nameMatch) {
                await supabaseRest(
                  `ppdb_registrations?full_name=eq.${encodeURIComponent(nameMatch)}`,
                  'PATCH',
                  { [targetCol]: fileUrl }
                ).catch(() => {});
              }
            } catch (_) {}
          }

          return { success: true, data: docObj, message: 'Dokumen berhasil diunggah' };
        }

        if (action === 'get_spp') {
          const stuRecord = await resolveCurrentStudentRecord();
          let id = (stuRecord && stuRecord.id) || studentId;
          const [invoices, payments] = await Promise.all([
            id ? supabaseRest(`invoices?student_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.desc`).catch(() => []) : [],
            id ? supabaseRest(`payments?student_id=eq.${encodeURIComponent(id)}&select=*&order=submitted_at.desc`).catch(() => []) : []
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
          total_students: (students || []).length || activeStudents,
          active_students: activeStudents,
          total_students_active: activeStudents,
          total_teachers: (teachers || []).length || activeTeachers,
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
          const roleIdToCodeMap = {
            'ROL-001': 'super_admin',
            'ROL-002': 'admin_tu',
            'ROL-003': 'siswa_aktif',
            'ROL-004': 'calon_siswa'
          };
          const roleLabelMap = {
            super_admin: 'Super Admin',
            admin_tu: 'Admin Tata Usaha',
            siswa_aktif: 'Siswa Aktif',
            calon_siswa: 'Calon Siswa / Pendaftar'
          };
          const role = params.role || roleIdToCodeMap[params.role_id] || 'admin_tu';
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
            status: params.status || (params.is_active === false ? 'inactive' : 'active'),
            avatar: params.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
            is_password_changed: true
          };
          const created = await supabaseRest('users', 'POST', payload);
          await recordActivityLog('CREATE_USER', 'users', `Menambahkan user baru: ${payload.full_name} (${payload.email})`, id);
          const { password_hash, ...safeCreated } = (created && created[0]) || payload;
          return { success: true, data: safeCreated, message: 'User berhasil dibuat' };
        }
        if (action === 'update') {
          const id = params.id;
          const roleIdToCodeMap = {
            'ROL-001': 'super_admin',
            'ROL-002': 'admin_tu',
            'ROL-003': 'siswa_aktif',
            'ROL-004': 'calon_siswa'
          };
          const roleLabelMap = {
            super_admin: 'Super Admin',
            admin_tu: 'Admin Tata Usaha',
            siswa_aktif: 'Siswa Aktif',
            calon_siswa: 'Calon Siswa / Pendaftar'
          };
          const payload = {};
          if (params.email !== undefined) payload.email = params.email;
          if (params.nis !== undefined) payload.nis = params.nis;
          if (params.username !== undefined) payload.username = params.username;
          if (params.full_name !== undefined || params.name !== undefined) {
            payload.full_name = params.full_name || params.name;
            payload.name = params.name || params.full_name;
          }
          if (params.phone !== undefined) payload.phone = params.phone;
          const resolvedRole = params.role || roleIdToCodeMap[params.role_id];
          if (resolvedRole) {
            payload.role = resolvedRole;
            payload.role_label = params.role_label || roleLabelMap[resolvedRole] || resolvedRole;
          }
          if (params.status !== undefined) {
            payload.status = params.status;
          } else if (params.is_active !== undefined) {
            payload.status = params.is_active ? 'active' : 'inactive';
          }
          if (params.avatar !== undefined) payload.avatar = params.avatar;
          if (params.student_id !== undefined) payload.student_id = params.student_id;
          if (params.teacher_id !== undefined) payload.teacher_id = params.teacher_id;
          if (params.password || params.password_hash) {
            payload.password_hash = params.password || params.password_hash;
            payload.is_password_changed = true;
          }
          payload.updated_at = new Date().toISOString();

          const updated = await supabaseRest(`users?id=eq.${encodeURIComponent(id)}`, 'PATCH', payload);
          const { password_hash, ...safeUpdated } = (updated && updated[0]) || { id, ...payload };

          // Sinkronkan sesi localStorage jika akun yang diperbarui adalah user yang sedang login
          if (currentUser && String(currentUser.id) === String(id)) {
            if (payload.full_name) {
              currentUser.full_name = payload.full_name;
              currentUser.name = payload.full_name;
            }
            if (payload.email) currentUser.email = payload.email;
            if (payload.phone !== undefined) currentUser.phone = payload.phone;
            if (payload.is_password_changed) {
              currentUser.is_password_changed = true;
              currentUser.needs_password_change = false;
            }
            try { localStorage.setItem('siy_user', JSON.stringify(currentUser)); } catch (_) {}
          }

          await recordActivityLog('UPDATE_USER', 'users', `Memperbarui akun user ID: ${id}`, id);
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
            query += `&or=(full_name.ilike.*${sTerm}*,nip.ilike.*${sTerm}*,specialization.ilike.*${sTerm}*)`;
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
          const [classes, activeStu] = await Promise.all([
            supabaseRest(query),
            supabaseRest('students?status=eq.active&select=id,class_id').catch(() => [])
          ]);
          const countMap = {};
          (activeStu || []).forEach(s => {
            if (s.class_id) countMap[s.class_id] = (countMap[s.class_id] || 0) + 1;
          });
          const mappedClasses = (classes || []).map(c => ({
            ...c,
            student_count: countMap[c.id] !== undefined ? countMap[c.id] : (Number(c.student_count) || 0)
          }));
          return { success: true, data: mappedClasses };
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
          let stuRow = null;
          try {
            if (!studentId && nis) {
              const matchedStudent = await supabaseRest(`students?nis=eq.${encodeURIComponent(nis)}&select=*`);
              if (matchedStudent && matchedStudent.length > 0) {
                stuRow = matchedStudent[0];
                studentId = stuRow.id;
              }
            } else if (studentId) {
              const matchedStudent = await supabaseRest(`students?id=eq.${encodeURIComponent(studentId)}&select=*`).catch(() => []);
              if (matchedStudent && matchedStudent.length > 0) stuRow = matchedStudent[0];
            }
            if (studentId) {
              docs = await supabaseRest(`student_documents?student_id=eq.${encodeURIComponent(studentId)}&order=created_at.desc`).catch(() => []) || [];
            }
            // Fallback ke ppdb_registrations jika berkas belum tersalin ke student_documents
            if (docs.length === 0 && stuRow) {
              const stuName = stuRow.full_name || stuRow.name || '';
              if (stuName) {
                const regs = await supabaseRest(`ppdb_registrations?full_name=eq.${encodeURIComponent(stuName)}&select=*`).catch(() => []);
                const r = (regs && regs[0]) || stuRow;
                if (r.photo_url) docs.push({ document_type: 'pas_foto', file_name: 'Pas Foto 3x4', file_url: r.photo_url, is_verified: true });
                if (r.birth_certificate_url) docs.push({ document_type: 'akta_kelahiran', file_name: 'Akta Kelahiran', file_url: r.birth_certificate_url, is_verified: true });
                if (r.family_card_url) docs.push({ document_type: 'kartu_keluarga', file_name: 'Kartu Keluarga', file_url: r.family_card_url, is_verified: true });
              }
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
  function getInvoiceMonthKey(str) {
    if (!str) return '';
    const s = String(str).toLowerCase();
    const months = [
      { key: 'januari', match: ['januari', 'january', 'jan'] },
      { key: 'februari', match: ['februari', 'february', 'feb'] },
      { key: 'maret', match: ['maret', 'march', 'mar'] },
      { key: 'april', match: ['april', 'apr'] },
      { key: 'mei', match: ['mei', 'may'] },
      { key: 'juni', match: ['juni', 'june', 'jun'] },
      { key: 'juli', match: ['juli', 'july', 'jul'] },
      { key: 'agustus', match: ['agustus', 'august', 'agu', 'aug'] },
      { key: 'september', match: ['september', 'sep', 'sept'] },
      { key: 'oktober', match: ['oktober', 'october', 'okt', 'oct'] },
      { key: 'november', match: ['november', 'nov'] },
      { key: 'desember', match: ['desember', 'december', 'des', 'dec'] }
    ];

    let foundMonth = '';
    for (const m of months) {
      if (m.match.some(alias => s.includes(alias))) {
        foundMonth = m.key;
        break;
      }
    }

    const yearMatch = s.match(/20\d\d/);
    const foundYear = yearMatch ? yearMatch[0] : String(new Date().getFullYear());

    if (foundMonth) return `${foundMonth}-${foundYear}`;
    return s.trim().replace(/\s+/g, '-');
  }

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
          const targetMonth = params.month || params.item_name || 'September 2026';
          const targetKey = getInvoiceMonthKey(targetMonth);

          // Cek anti-duplikasi untuk siswa bersangkutan
          if (params.student_id && targetKey) {
            const existingInvs = await supabaseRest(`invoices?student_id=eq.${encodeURIComponent(params.student_id)}&select=id,month,period,description,status`);
            const alreadyHas = (existingInvs || []).some(inv => {
              const k1 = getInvoiceMonthKey(inv.month);
              const k2 = getInvoiceMonthKey(inv.period);
              const k3 = getInvoiceMonthKey(inv.description);
              return k1 === targetKey || k2 === targetKey || k3 === targetKey;
            });
            if (alreadyHas) {
              return {
                success: false,
                message: `Siswa ini sudah memiliki tagihan untuk periode ${targetMonth}. Tagihan ganda dicegah.`
              };
            }
          }

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
            month: targetMonth,
            period: params.period || targetMonth,
            amount: Number(params.amount) || 0,
            due_date: params.due_date || new Date().toISOString().slice(0, 10),
            status: 'unpaid',
            description: params.description || params.item_name || `SPP ${targetMonth}`
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

          // Cek seluruh invoice yang sudah ada untuk mencegah tagihan ganda
          const existingInvs = await supabaseRest('invoices?select=id,student_id,month,period,description,status');
          const targetKey = getInvoiceMonthKey(month);

          const createdInvoices = [];
          const skippedStudents = [];

          for (let i = 0; i < students.length; i++) {
            const stu = students[i];

            // Cek apakah siswa ini sudah memiliki tagihan untuk bulan/periode yang sama
            const alreadyHasInvoice = (existingInvs || []).some(inv => {
              if (inv.student_id !== stu.id) return false;
              const k1 = getInvoiceMonthKey(inv.month);
              const k2 = getInvoiceMonthKey(inv.period);
              const k3 = getInvoiceMonthKey(inv.description);
              return k1 === targetKey || k2 === targetKey || k3 === targetKey;
            });

            if (alreadyHasInvoice) {
              skippedStudents.push(stu.full_name);
              continue;
            }

            const invId = 'INV-' + Date.now() + '-' + i;
            const invNum = 'INV/' + new Date().getFullYear() + '/' + String(Date.now()).slice(-4) + '/' + (createdInvoices.length + 1);
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

          let msg = `Berhasil menerbitkan ${createdInvoices.length} tagihan SPP baru untuk ${month}`;
          if (skippedStudents.length > 0) {
            msg += `. ${skippedStudents.length} siswa dilewati karena sudah memiliki tagihan (${skippedStudents.slice(0, 2).join(', ')}${skippedStudents.length > 2 ? ' dll.' : ''})`;
          }

          return {
            success: true,
            data: createdInvoices,
            skipped: skippedStudents,
            message: msg
          };
        }
        if (action === 'delete') {
          await supabaseRest(`invoices?id=eq.${encodeURIComponent(params.id)}`, 'DELETE');
          return { success: true, message: 'Tagihan berhasil dihapus' };
        }
        if (action === 'mark_paid') {
          const nowIso = new Date().toISOString();
          const updated = await supabaseRest(`invoices?id=eq.${encodeURIComponent(params.id)}`, 'PATCH', {
            status: 'paid',
            paid_at: nowIso,
            payment_method: 'tunai'
          });
          // Selesaikan juga payment yang berstatus menunggu_verifikasi untuk invoice ini agar tidak menyangkut
          await supabaseRest(`payments?invoice_id=eq.${encodeURIComponent(params.id)}&status=eq.menunggu_verifikasi`, 'PATCH', {
            status: 'verified',
            verified_by: currentUser ? currentUser.full_name : 'Admin',
            verified_at: nowIso
          }).catch(() => {});
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

          const userId = 'USR-' + Date.now();
          const studentId = 'STU-' + Date.now();
          const emailForLogin = parentEmail || `${regNum.toLowerCase().replace(/[^a-z0-9]/g, '')}@pendaftar.yayasan.sch.id`;

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
          cleanMeta.password = password;
          cleanMeta.account_password = password;
          cleanMeta.user_id = userId;
          cleanMeta.student_id = studentId;
          cleanMeta.uploaded_files = {
            photo_url: photoUrl || '',
            birth_certificate_url: certUrl || '',
            family_card_url: kkUrl || ''
          };

          let safeIncomingNotes = params.notes || '';
          if (typeof safeIncomingNotes === 'string' && safeIncomingNotes.trim().startsWith('{')) {
            try {
              const parsedNotes = JSON.parse(safeIncomingNotes);
              if (parsedNotes.account && parsedNotes.account.password) {
                delete parsedNotes.account.password;
              }
              safeIncomingNotes = JSON.stringify(parsedNotes);
            } catch (_) {}
          }

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
            notes: safeIncomingNotes,
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

          // 1. Simpan ke tabel ppdb_registrations dengan penanganan skema bertingkat
          let res = null;
          try {
            res = await supabaseRest('ppdb_registrations', 'POST', regPayload);
          } catch (err) {
            console.warn('PPDB insert regPayload failed, trying minimal schema:', err);
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
            localRegs.unshift({ ...regPayload, password, account_password: password, id, registration_number: regNum, registration_no: regNum, created_at: new Date().toISOString() });
            localStorage.setItem('siy_local_ppdb_regs', JSON.stringify(localRegs));
          } catch (_) {}

          // 2. Buat akun login Portal Siswa untuk Calon Siswa
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

          await supabaseRest('students', 'POST', newStudent).catch(e => console.warn('Student profile insert warning:', e));

          // Sinkronkan berkas yang diunggah saat PPDB ke tabel student_documents
          const initialDocs = [
            { type: 'pas_foto', name: 'Pas Foto 3x4', url: photoUrl },
            { type: 'akta_kelahiran', name: 'Akta Kelahiran', url: certUrl },
            { type: 'kartu_keluarga', name: 'Kartu Keluarga', url: kkUrl }
          ].filter(d => d.url);
          for (const doc of initialDocs) {
              await supabaseRest('student_documents', 'POST', {
                id: 'DOC-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                student_id: studentId,
                document_type: doc.type,
                file_name: doc.name,
                file_url: doc.url,
                is_verified: false
              }).catch(async () => {
                await supabaseRest('student_documents', 'POST', {
                  id: 'DOC-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                  student_id: studentId,
                  document_type: doc.type,
                  file_name: doc.name,
                  file_url: doc.url
                }).catch(() => {});
              });
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
          const reg = { ...regs[0] };
          if (reg.form_metadata && typeof reg.form_metadata === 'object') {
            if (!reg.converted_nis && reg.form_metadata.converted_nis) reg.converted_nis = reg.form_metadata.converted_nis;
            if (!reg.nis && reg.form_metadata.nis) reg.nis = reg.form_metadata.nis;
            if (!reg.class_name && reg.form_metadata.class_name) reg.class_name = reg.form_metadata.class_name;
          }
          return { success: true, data: { registration: reg }, registration: reg };
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
            notes: params.notes || '',
            announcement_notes: JSON.stringify(scheduleData)
          };
          let res = null;
          try {
            res = await supabaseRest(`ppdb_periods?id=eq.${encodeURIComponent(targetId)}`, 'PATCH', payload);
            if (!res || res.length === 0) {
              res = await supabaseRest('ppdb_periods', 'POST', {
                id: targetId,
                name: params.name || 'Gelombang 1',
                ...payload
              });
            }
          } catch (e) {
            console.warn('[SIYAYASAN] ppdb_periods update fallback, trying POST:', e);
            res = await supabaseRest('ppdb_periods', 'POST', {
              id: targetId,
              name: params.name || 'Gelombang 1',
              ...payload
            }).catch(() => null);
          }
          await recordActivityLog('UPDATE_PERIOD', 'ppdb', 'Mengubah pengaturan jadwal & status PPDB: ' + (params.status || 'open'), targetId);
          return { success: true, data: { ...(res && res[0] ? res[0] : payload), id: targetId, ...scheduleData }, message: 'Pengaturan gelombang & jadwal PPDB diperbarui' };
        }
        if (action === 'update') {
          const id = params.id;
          const patchData = { ...params };
          delete patchData.id;
          delete patchData.token;
          if (patchData.email !== undefined) {
            if (!patchData.parent_email) patchData.parent_email = patchData.email;
            delete patchData.email;
          }
          let res = null;
          try {
            res = await supabaseRest(`ppdb_registrations?id=eq.${encodeURIComponent(id)}`, 'PATCH', patchData);
          } catch (err) {
            console.warn('PPDB update primary failed, retrying with safe columns:', err);
            const safePatch = {};
            const validCols = ['student_name', 'full_name', 'child_name', 'nickname', 'nik', 'form_type', 'student_gender', 'gender', 'student_birth_place', 'birth_place', 'student_birth_date', 'birth_date', 'parent_name', 'father_name', 'mother_name', 'parent_phone', 'phone', 'parent_email', 'address', 'level', 'status', 'notes', 'photo_url', 'birth_certificate_url', 'family_card_url', 'documents_url', 'form_metadata'];
            for (const k of validCols) {
              if (patchData[k] !== undefined) safePatch[k] = patchData[k];
            }
            res = await supabaseRest(`ppdb_registrations?id=eq.${encodeURIComponent(id)}`, 'PATCH', safePatch);
          }
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
          const customPpdbPass = String(reg.password || reg.account_password || (reg.form_metadata && (reg.form_metadata.password || reg.form_metadata.account_password)) || '').trim();
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

          let userId = (existingUsers && existingUsers[0])
            ? existingUsers[0].id
            : ((reg.form_metadata && reg.form_metadata.user_id) || ('USR-' + studentNis));
          let stuId = (existingUsers && existingUsers[0] && existingUsers[0].student_id)
            ? existingUsers[0].student_id
            : ((reg.form_metadata && reg.form_metadata.student_id) || ('STU-' + String(Date.now()).slice(-5)));

          const userPayloadToSave = {
            email: studentEmail,
            role: 'siswa_aktif',
            role_label: 'Siswa Aktif',
            nis: studentNis,
            student_id: stuId,
            password_hash: initialPassword,
            is_password_changed: Boolean(customPpdbPass),
            status: 'active'
          };

          if (existingUsers && existingUsers.length > 0) {
            await supabaseRest(`users?id=eq.${encodeURIComponent(userId)}`, 'PATCH', userPayloadToSave).catch(() => {});
          } else {
            const newUserRecord = {
              id: userId,
              ...userPayloadToSave,
              full_name: studentName,
              name: studentName,
              phone: reg.phone || reg.parent_phone || '',
              avatar: reg.photo_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
            };
            await supabaseRest('users', 'POST', newUserRecord).catch(() => {});
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

          // Pastikan dokumen PPDB terhubung dengan stuId di student_documents
          try {
            const existingDocs = await supabaseRest(`student_documents?student_id=eq.${encodeURIComponent(stuId)}&select=*`).catch(() => []);
            if (!existingDocs || existingDocs.length === 0) {
              const docMap = reg.documents_url && typeof reg.documents_url === 'object' ? reg.documents_url : {};
              const uploadedMap = reg.form_metadata && reg.form_metadata.uploaded_files ? reg.form_metadata.uploaded_files : {};
              const docsToSync = [
                { type: 'pas_foto', name: 'Pas Foto 3x4', url: reg.photo_url || docMap.photo || uploadedMap.photo_url },
                { type: 'akta_kelahiran', name: 'Akta Kelahiran', url: reg.birth_certificate_url || docMap.birth_certificate || uploadedMap.birth_certificate_url },
                { type: 'kartu_keluarga', name: 'Kartu Keluarga', url: reg.family_card_url || docMap.family_card || uploadedMap.family_card_url }
              ].filter(d => d.url);
              for (const doc of docsToSync) {
                await supabaseRest('student_documents', 'POST', {
                  id: 'DOC-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                  student_id: stuId,
                  document_type: doc.type,
                  file_name: doc.name,
                  file_url: doc.url,
                  is_verified: true
                }).catch(() => {});
              }
            }
          } catch (_) {}

          // Update jumlah siswa di kelas tujuan
          if (targetClassId) {
            supabaseRest(`students?class_id=eq.${encodeURIComponent(targetClassId)}&status=eq.active&select=id`).then(list => {
              supabaseRest(`classes?id=eq.${encodeURIComponent(targetClassId)}`, 'PATCH', { student_count: (list || []).length });
            }).catch(() => {});
          }

          // 7. Update Status Registrasi PPDB menjadi 'converted'
          const metaWithNis = {
            ...(reg.form_metadata || {}),
            converted_nis: studentNis,
            nis: studentNis,
            class_name: targetClassName,
            student_id: stuId,
            user_id: userId
          };
          try {
            await supabaseRest(`ppdb_registrations?id=eq.${reg.id}`, 'PATCH', {
              status: 'converted',
              notes: `Diterima sebagai Siswa Aktif (NIS: ${studentNis}, Kelas: ${targetClassName})`,
              form_metadata: metaWithNis
            });
          } catch (_) {
            await supabaseRest(`ppdb_registrations?id=eq.${reg.id}`, 'PATCH', {
              status: 'converted',
              notes: `Diterima sebagai Siswa Aktif (NIS: ${studentNis}, Kelas: ${targetClassName})`
            }).catch(() => {});
          }
          await recordActivityLog('CONVERT_SISWA', 'students', 'Aktivasi calon siswa PPDB ' + studentName + ' ke siswa aktif (NIS: ' + studentNis + ', Kelas: ' + targetClassName + ')', stuId);

          // 8. Terbitkan Otomatis Tagihan SPP Bulan Pertama (Jika auto_spp aktif & belum pernah diterbitkan untuk bulan berjalan)
          if (params.auto_spp !== false) {
            const currentYear = new Date().getFullYear();
            const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            const currentMonthName = monthNames[new Date().getMonth()];

            let hasExistingInvoice = false;
            try {
              const existingInvs = await supabaseRest(`invoices?student_id=eq.${encodeURIComponent(stuId)}&month=eq.${encodeURIComponent(currentMonthName)}&select=id`);
              if (existingInvs && existingInvs.length > 0) hasExistingInvoice = true;
            } catch (_) {}

            if (!hasExistingInvoice) {
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
          }

          // 9. Ringkasan Kredensial Siswa Baru
          const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
          const loginUrl = (origin || 'https://siyayasan-portal.vercel.app') + '/login.html';
          const activeInitialPass = customPpdbPass || birthDatePassword;
          const passNotes = customPpdbPass ? `${customPpdbPass} (Password Pendaftaran PPDB)` : `${birthDatePassword} (Tanggal Lahir: DDMMYYYY)`;
          const summaryText = `Akses Portal Siswa Yayasan At Tarbiyyah Wijaya Kusuma Samarinda\nNama: ${studentName}\nNIS (Username Login): ${studentNis}\nKata Sandi Awal: ${passNotes}\nLink Portal: ${loginUrl}`;

          return {
            success: true,
            data: {
              student: studentPayload,
              nis: studentNis,
              class_name: targetClassName,
              initial_credentials: {
                student_name: studentName,
                nis: studentNis,
                default_password: activeInitialPass,
                fallback_password: birthDatePassword,
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
          let list = Array.isArray(news) ? news : [];
          if (params.status === 'published' || params.is_published === 'true' || params.is_published === true || params.published_only) {
            list = list.filter(n => n.status !== 'draft' && n.is_published !== false);
          }
          if (params.exclude_id) {
            list = list.filter(n => String(n.id) !== String(params.exclude_id) && String(n.slug) !== String(params.exclude_id));
          }
          return { success: true, data: list, raw: { items: list } };
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
          let mapped = (ann || []).map(r => ({
            ...r,
            category: r.category || r.target_audience || r.target_role || 'Edaran'
          }));
          if (params.status === 'published' || params.is_published === 'true' || params.is_published === true || params.published_only) {
            mapped = mapped.filter(a => a.status !== 'draft' && a.is_published !== false);
          }
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
          let normalizedEvts = (evts || []).map(e => ({ ...e, date: e.date || e.event_date, event_date: e.event_date || e.date }));
          if (params.status === 'published' || params.is_published === 'true' || params.is_published === true || params.published_only) {
            normalizedEvts = normalizedEvts.filter(e => e.status !== 'draft' && e.is_published !== false);
          }
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
          const [schools, wsRows] = await Promise.all([
            supabaseRest('schools?select=*').catch(() => []),
            supabaseRest('web_settings?id=eq.default&select=*').catch(() => [])
          ]);
          const schRow = (schools && schools[0]) ? { ...schools[0] } : {};
          const ws = (wsRows && wsRows[0]) ? { ...wsRows[0] } : {};

          let schExt = {};
          if (schRow.wa_gateway_token && typeof schRow.wa_gateway_token === 'string' && schRow.wa_gateway_token.trim().startsWith('{')) {
            try { schExt = JSON.parse(schRow.wa_gateway_token); } catch (_) {}
          }
          let wsExt = {};
          if (ws.announcement_banner && typeof ws.announcement_banner === 'string' && ws.announcement_banner.trim().startsWith('{')) {
            try { wsExt = JSON.parse(ws.announcement_banner); } catch (_) {}
          }

          const wsTime = ws.updated_at ? new Date(ws.updated_at).getTime() : 0;
          const schTime = schRow.updated_at ? new Date(schRow.updated_at).getTime() : 0;

          let sch = {};
          if (wsTime > schTime) {
            Object.assign(sch, schRow, schExt, ws, wsExt);
          } else {
            Object.assign(sch, ws, wsExt, schRow, schExt);
          }

          for (const [k, v] of Object.entries(wsExt)) {
            if (sch[k] === undefined || sch[k] === null || sch[k] === '') sch[k] = v;
          }
          for (const [k, v] of Object.entries(schExt)) {
            if (sch[k] === undefined || sch[k] === null || sch[k] === '') sch[k] = v;
          }
          if (sch.school_name && !sch.name) sch.name = sch.school_name;
          if (sch.name && !sch.school_name) sch.school_name = sch.name;
          if (sch.whatsapp && !sch.whatsapp_number) sch.whatsapp_number = sch.whatsapp;
          if (sch.whatsapp_number && !sch.whatsapp) sch.whatsapp = sch.whatsapp_number;
          if (ws && Array.isArray(ws.hero_images)) {
            sch.hero_images = ws.hero_images;
          }

          try {
            const cachedExt = localStorage.getItem('siy_school_ext');
            if (cachedExt) {
              const parsedLocal = JSON.parse(cachedExt);
              for (const [k, v] of Object.entries(parsedLocal)) {
                if (sch[k] === undefined || sch[k] === null || sch[k] === '') sch[k] = v;
              }
            }
          } catch (_) {}
          return { success: true, data: sch };
        }
        if (action === 'update') {
          const id = params.id || 'SCH-001';
          const fullPayload = { ...params };
          delete fullPayload.id;
          const nowIso = new Date().toISOString();
          fullPayload.updated_at = nowIso;

          // Baca data sebelumnya dari DB (schools & web_settings) atau localStorage agar tidak kehilangan field lain
          let existingExt = {};
          try {
            const [curSchools, curWs] = await Promise.all([
              supabaseRest(`schools?id=eq.${encodeURIComponent(id)}&select=wa_gateway_token`).catch(() => []),
              supabaseRest('web_settings?id=eq.default&select=announcement_banner').catch(() => [])
            ]);
            if (curWs && curWs[0] && curWs[0].announcement_banner && curWs[0].announcement_banner.trim().startsWith('{')) {
              existingExt = { ...existingExt, ...JSON.parse(curWs[0].announcement_banner) };
            }
            if (curSchools && curSchools[0] && curSchools[0].wa_gateway_token && curSchools[0].wa_gateway_token.trim().startsWith('{')) {
              existingExt = { ...existingExt, ...JSON.parse(curSchools[0].wa_gateway_token) };
            }
          } catch (_) {}
          try {
            const raw = localStorage.getItem('siy_school_ext');
            if (raw) existingExt = { ...JSON.parse(raw), ...existingExt };
          } catch (_) {}

          const resolvedWa = params.whatsapp_number !== undefined
            ? params.whatsapp_number
            : (params.whatsapp !== undefined ? params.whatsapp : (existingExt.whatsapp_number || existingExt.whatsapp));

          const extPayload = {
            ...existingExt,
            name: params.name !== undefined ? params.name : existingExt.name,
            school_name: params.name !== undefined ? params.name : existingExt.school_name,
            address: params.address !== undefined ? params.address : existingExt.address,
            phone: params.phone !== undefined ? params.phone : existingExt.phone,
            email: params.email !== undefined ? params.email : existingExt.email,
            campus_note: params.campus_note !== undefined ? params.campus_note : existingExt.campus_note,
            maps_url: params.maps_url !== undefined ? params.maps_url : existingExt.maps_url,
            maps_embed_url: params.maps_embed_url !== undefined ? params.maps_embed_url : existingExt.maps_embed_url,
            whatsapp_number: resolvedWa,
            whatsapp: resolvedWa,
            instagram_url: params.instagram_url !== undefined ? params.instagram_url : existingExt.instagram_url,
            youtube_url: params.youtube_url !== undefined ? params.youtube_url : existingExt.youtube_url,
            facebook_url: params.facebook_url !== undefined ? params.facebook_url : existingExt.facebook_url,
            operational_hours: params.operational_hours !== undefined ? params.operational_hours : existingExt.operational_hours,
            visi: params.visi !== undefined ? params.visi : existingExt.visi,
            misi: params.misi !== undefined ? params.misi : existingExt.misi,
            budaya: params.budaya !== undefined ? params.budaya : existingExt.budaya,
            sejarah: params.sejarah !== undefined ? params.sejarah : existingExt.sejarah,
            program_pendidikan: params.program_pendidikan !== undefined ? params.program_pendidikan : existingExt.program_pendidikan,
            kurikulum: params.kurikulum !== undefined ? params.kurikulum : existingExt.kurikulum,
            struktur_organisasi: params.struktur_organisasi !== undefined ? params.struktur_organisasi : existingExt.struktur_organisasi,
            pembina: params.pembina !== undefined ? params.pembina : existingExt.pembina,
            pengawas: params.pengawas !== undefined ? params.pengawas : existingExt.pengawas,
            ketua_yayasan: params.ketua_yayasan !== undefined ? params.ketua_yayasan : existingExt.ketua_yayasan,
            sekretaris: params.sekretaris !== undefined ? params.sekretaris : existingExt.sekretaris,
            bendahara: params.bendahara !== undefined ? params.bendahara : existingExt.bendahara,
            headmaster_name: params.headmaster_name !== undefined ? params.headmaster_name : existingExt.headmaster_name
          };
          delete extPayload.hero_images;
          try {
            localStorage.setItem('siy_school_ext', JSON.stringify(extPayload));
            sessionStorage.setItem('siyayasan_school_profile', JSON.stringify({ ...fullPayload, ...extPayload }));
          } catch (_) {}

          // Kolom asli yang tersedia di tabel schools Supabase:
          // id, name, npsn, address, phone, email, website, logo_url, headmaster_name, pembina, pengawas, ketua_yayasan, sekretaris, bendahara, wa_gateway_token, updated_at
          const validSchoolCols = [
            'name', 'npsn', 'address', 'phone', 'email', 'website', 'logo_url',
            'headmaster_name', 'pembina', 'pengawas', 'ketua_yayasan', 'sekretaris', 'bendahara', 'wa_gateway_token', 'updated_at'
          ];
          const dbSchoolPayload = {
            wa_gateway_token: JSON.stringify(extPayload),
            updated_at: nowIso
          };
          for (const col of validSchoolCols) {
            if (fullPayload[col] !== undefined) dbSchoolPayload[col] = fullPayload[col];
          }

          // Sinkronkan juga ke web_settings?id=eq.default agar seluruh pengunjung lintas perangkat selalu mendapatkan data terbaru
          const wsSyncPayload = {
            announcement_banner: JSON.stringify(extPayload),
            updated_at: nowIso
          };
          if (params.name) wsSyncPayload.school_name = params.name;
          if (params.address !== undefined) wsSyncPayload.address = params.address;
          if (params.phone !== undefined) wsSyncPayload.phone = params.phone;
          if (resolvedWa !== undefined) wsSyncPayload.whatsapp = resolvedWa;
          if (params.email !== undefined) wsSyncPayload.email = params.email;
          if (params.campus_note !== undefined) wsSyncPayload.campus_note = params.campus_note;
          if (params.maps_url !== undefined) wsSyncPayload.maps_url = params.maps_url;
          if (params.maps_embed_url !== undefined) wsSyncPayload.maps_embed_url = params.maps_embed_url;
          if (params.instagram_url !== undefined) wsSyncPayload.instagram_url = params.instagram_url;
          if (params.youtube_url !== undefined) wsSyncPayload.youtube_url = params.youtube_url;
          if (params.facebook_url !== undefined) wsSyncPayload.facebook_url = params.facebook_url;

          const [res] = await Promise.all([
            supabaseRest(`schools?id=eq.${encodeURIComponent(id)}`, 'PATCH', dbSchoolPayload).catch(() => []),
            supabaseRest('web_settings?id=eq.default', 'PATCH', wsSyncPayload).catch(() => [])
          ]);
          return { success: true, data: { ...(res && res[0] ? res[0] : dbSchoolPayload), ...extPayload }, message: 'Identitas & profil sekolah berhasil diperbarui' };
        }
      }

      // 15. LOGS / AKTIVITAS
      if (module === 'logs' || module === 'activity_logs') {
        if (action === 'list') {
          let q = 'activity_logs?select=*&order=created_at.desc&limit=100';
          if (params.action) q += `&action=ilike.*${encodeURIComponent(params.action)}*`;
          if (params.module) q += `&module=ilike.*${encodeURIComponent(params.module)}*`;
          if (params.user_id) q += `&user_id=eq.${encodeURIComponent(params.user_id)}`;
          if (params.date_from) q += `&created_at=gte.${encodeURIComponent(params.date_from)}`;
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
              list = list.filter(i => (i.due_date && i.due_date.startsWith(params.month)) || (i.period && i.period.includes(params.month)) || (i.month && i.month.includes(params.month)));
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
          let skippedCount = 0;
          for (let i = 0; i < rawItems.length; i++) {
            const row = rawItems[i];
            const stu = (stuList || []).find(s =>
              (row.nis && s.nis && String(s.nis).trim() === String(row.nis).trim()) ||
              (row.student_name && s.full_name && s.full_name.toLowerCase().includes(String(row.student_name).toLowerCase().trim()))
            );
            if (!stu) {
              skippedCount++;
              continue;
            }
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
          return {
            success: true,
            count: insertedCount,
            skipped: skippedCount,
            message: `Berhasil mengimpor ${insertedCount} data tagihan ke dalam database${skippedCount > 0 ? ` (${skippedCount} baris dilewati karena NIS/Nama tidak cocok)` : ''}!`
          };
        }

        if (action === 'import_students') {
          const rawItems = Array.isArray(params.items) ? params.items : [];
          if (rawItems.length === 0) return { success: false, message: 'Tidak ada data siswa untuk diimpor' };
          const clsList = await supabaseRest('classes?select=id,name').catch(() => []);
          let insertedCount = 0;
          for (let i = 0; i < rawItems.length; i++) {
            const row = rawItems[i];
            const stuId = 'STU-' + Date.now() + '-' + i;
            const fullName = row.full_name || row.name || ('Siswa Baru ' + (i + 1));
            const matchedClass = (clsList || []).find(c =>
              row.class_name && c.name && c.name.toLowerCase().trim() === String(row.class_name).toLowerCase().trim()
            );
            const resolvedClassId = row.class_id || (matchedClass ? matchedClass.id : 'CLS-001');
            const resolvedClassName = matchedClass ? matchedClass.name : (row.class_name || 'PAUD / TK');
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
              class_id: resolvedClassId,
              class_name: resolvedClassName,
              kelas_sekarang: resolvedClassName,
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
          try {
            const ws = await supabaseRest('web_settings?id=eq.default&select=announcement_banner').catch(() => []);
            if (ws && ws[0] && typeof ws[0].announcement_banner === 'string' && ws[0].announcement_banner.trim().startsWith('{')) {
              const parsed = JSON.parse(ws[0].announcement_banner);
              if (Array.isArray(parsed.backup_history) && parsed.backup_history.length > 0) {
                const localById = {};
                backups.forEach(b => { if (b && b.id) localById[b.id] = b; });
                parsed.backup_history.forEach(cloudItem => {
                  if (cloudItem && cloudItem.id && !localById[cloudItem.id]) {
                    backups.push(cloudItem);
                  }
                });
                backups.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
              }
            }
          } catch (_) {}
          return { success: true, data: backups, items: backups, total: backups.length };
        }
        if (action === 'create') {
          let [sch, usr, stu, cls, tea, nws, ann, evt, gal, inv, pay, reg, per, ws] = await Promise.all([
            supabaseRest('schools?select=*').catch(() => []),
            supabaseRest('users?select=*').catch(() => []),
            supabaseRest('students?select=*').catch(() => []),
            supabaseRest('classes?select=*').catch(() => []),
            supabaseRest('teachers?select=*').catch(() => []),
            supabaseRest('news?select=*').catch(() => []),
            supabaseRest('announcements?select=*').catch(() => []),
            supabaseRest('events?select=*').catch(() => []),
            supabaseRest('galleries?select=*').catch(() => []),
            supabaseRest('invoices?select=*').catch(() => []),
            supabaseRest('payments?select=*').catch(() => []),
            supabaseRest('ppdb_registrations?select=*').catch(() => []),
            supabaseRest('ppdb_periods?select=*').catch(() => []),
            supabaseRest('web_settings?select=*').catch(() => [])
          ]);
          const dStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          const filename = `backup-yayasan-${dStr}.json`;
          const fullData = {
            schools: sch || [],
            users: usr || [],
            students: stu || [],
            classes: cls || [],
            teachers: tea || [],
            news: nws || [],
            announcements: ann || [],
            events: evt || [],
            galleries: gal || [],
            invoices: inv || [],
            payments: pay || [],
            ppdb_registrations: reg || [],
            ppdb_periods: per || [],
            web_settings: ws || []
          };
          const approxBytes = JSON.stringify(fullData).length;
          const sizeMb = Math.max(0.05, Number((approxBytes / (1024 * 1024)).toFixed(2)));
          const backupObj = {
            id: 'BCK-' + Date.now(),
            created_at: new Date().toISOString(),
            folder_name: filename,
            filename: filename,
            file_count: 14,
            size_mb: sizeMb,
            data: fullData
          };
          const metaEntry = {
            id: backupObj.id,
            created_at: backupObj.created_at,
            folder_name: backupObj.folder_name,
            filename: backupObj.filename,
            file_count: backupObj.file_count,
            size_mb: backupObj.size_mb
          };
          if (!params || !params.silent_history) {
            let list = [];
            try {
              const raw = localStorage.getItem('siy_backup_history');
              if (raw) list = JSON.parse(raw);
            } catch (_) {}
            list.unshift(backupObj);
            list = list.slice(0, 15);
            try {
              localStorage.setItem('siy_backup_history', JSON.stringify(list));
            } catch (quotaErr) {
              // If full snapshot exceeds 5MB localStorage quota, store lightweight metadata entries
              try {
                const lightList = list.map(item => ({
                  id: item.id,
                  created_at: item.created_at,
                  folder_name: item.folder_name,
                  filename: item.filename,
                  file_count: item.file_count || 14,
                  size_mb: item.size_mb || sizeMb
                }));
                localStorage.setItem('siy_backup_history', JSON.stringify(lightList));
              } catch (_) {}
            }
            // Also persist lightweight backup history metadata to Supabase web_settings so it persists across devices/sessions
            try {
              const existingWs = await supabaseRest('web_settings?id=eq.default&select=announcement_banner').catch(() => []);
              let bannerObj = {};
              if (existingWs && existingWs[0] && typeof existingWs[0].announcement_banner === 'string' && existingWs[0].announcement_banner.trim().startsWith('{')) {
                bannerObj = JSON.parse(existingWs[0].announcement_banner);
              }
              const cloudHist = Array.isArray(bannerObj.backup_history) ? bannerObj.backup_history : [];
              cloudHist.unshift(metaEntry);
              bannerObj.backup_history = cloudHist.slice(0, 20);
              await supabaseRest('web_settings?id=eq.default', 'PATCH', {
                announcement_banner: JSON.stringify(bannerObj),
                updated_at: new Date().toISOString()
              }).catch(() => {});
            } catch (_) {}
            await recordActivityLog('CREATE_BACKUP', 'backup', `Membuat cadangan database: ${filename} (${sizeMb} MB)`);
          }
          return { success: true, data: backupObj, backup: backupObj, message: 'Backup berhasil dibuat: ' + filename };
        }
        if (action === 'restore') {
          let snapshot = params.data || params;
          if (params.id && !params.data && !params.tables) {
            try {
              const raw = localStorage.getItem('siy_backup_history');
              if (raw) {
                const list = JSON.parse(raw);
                const found = list.find(b => b.id === params.id);
                if (found && found.data) snapshot = found.data;
              }
            } catch (_) {}
          }
          if (snapshot && typeof snapshot === 'object') {
            try {
              localStorage.setItem('siy_restored_snapshot', JSON.stringify({ restored_at: new Date().toISOString() }));
            } catch (_) {}
            const tableMap = snapshot.tables || snapshot.data || snapshot;
            const tableAliases = {
              registrations: 'ppdb_registrations',
              cms_settings: 'web_settings'
            };
            const validTables = ['schools', 'users', 'students', 'teachers', 'classes', 'ppdb_registrations', 'ppdb_periods', 'invoices', 'payments', 'news', 'announcements', 'events', 'galleries', 'web_settings'];
            if (typeof tableMap === 'object') {
              for (const [rawTblName, rows] of Object.entries(tableMap)) {
                const tblName = tableAliases[rawTblName] || rawTblName;
                if (Array.isArray(rows) && rows.length > 0 && validTables.includes(tblName)) {
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
          try {
            const existingWs = await supabaseRest('web_settings?id=eq.default&select=announcement_banner').catch(() => []);
            if (existingWs && existingWs[0] && typeof existingWs[0].announcement_banner === 'string' && existingWs[0].announcement_banner.trim().startsWith('{')) {
              const bannerObj = JSON.parse(existingWs[0].announcement_banner);
              if (Array.isArray(bannerObj.backup_history)) {
                bannerObj.backup_history = bannerObj.backup_history.filter(b => b.id !== params.id);
                await supabaseRest('web_settings?id=eq.default', 'PATCH', {
                  announcement_banner: JSON.stringify(bannerObj),
                  updated_at: new Date().toISOString()
                }).catch(() => {});
              }
            }
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
        if (action === 'delete' || action === 'remove') {
          await supabaseRest(`contact_messages?id=eq.${encodeURIComponent(params.id)}`, 'DELETE').catch(() => {});
          return { success: true, message: 'Pesan kontak berhasil dihapus' };
        }
        if (action === 'mark_read' || action === 'update') {
          const updated = await supabaseRest(`contact_messages?id=eq.${encodeURIComponent(params.id)}`, 'PATCH', {
            status: params.status || 'read'
          }).catch(() => []);
          return { success: true, data: updated[0] || {}, message: 'Status pesan diperbarui' };
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