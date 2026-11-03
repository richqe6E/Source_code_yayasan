/**
 * SIYAYASAN V2 - Shared Auth Helper
 * Handles authentication, role-based redirects (Admin & Siswa), and session security.
 */
(function () {
  'use strict';

  const TOKEN_KEY = 'siy_token';
  const USER_KEY = 'siy_user';

  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
    catch (e) { return null; }
  }
  function setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function isLoggedIn() { return !!getToken(); }

  function logout() {
    clearSession();
    window.location.href = '/login.html';
  }

  /**
   * Mendapatkan URL tujuan redirect berdasarkan role pengguna
   */
  function getPortalRedirect(roleCode) {
    const role = (roleCode || '').toLowerCase();
    if (role === 'super_admin' || role === 'admin_tu' || role === 'admin' || role === 'kepala_sekolah' || role === 'staff' || role === 'guru') {
      return '/admin/dashboard.html';
    }
    if (role === 'siswa_aktif' || role === 'siswa') {
      return '/siswa/dashboard.html';
    }
    return '/login.html';
  }

  /**
   * Guards a page: requires auth and (optionally) one of the given roles.
   * @param {string} [allowedRoles] comma-separated role codes, e.g. 'admin,siswa_aktif'
   */
  function requireAuth(allowedRoles) {
    if (!isLoggedIn()) {
      window.location.href = '/login.html';
      return false;
    }
    if (allowedRoles) {
      const user = getUser();
      if (!user) {
        clearSession();
        window.location.href = '/login.html';
        return false;
      }
      const allowed = allowedRoles.split(',').map(r => r.trim().toLowerCase());
      const rawRole = (user.role && user.role.code ? user.role.code : (user.role || '')).toLowerCase();

      const adminRoles = ['super_admin', 'admin_tu', 'admin', 'kepala_sekolah', 'staff', 'guru'];
      const siswaRoles = ['siswa', 'siswa_aktif'];

      let isAllowed = allowed.includes(rawRole);
      if (!isAllowed) {
        if (allowed.some(a => adminRoles.includes(a)) && adminRoles.includes(rawRole)) {
          isAllowed = true;
        }
        if (allowed.some(a => siswaRoles.includes(a)) && siswaRoles.includes(rawRole)) {
          isAllowed = true;
        }
      }

      if (!isAllowed) {
        const targetUrl = getPortalRedirect(rawRole);
        if (window.location.pathname === targetUrl || targetUrl === '/login.html') {
          clearSession();
          window.location.href = '/login.html';
        } else {
          window.location.href = targetUrl;
        }
        return false;
      }

      // Validasi status akun siswa secara real-time terhadap server
      if (siswaRoles.includes(rawRole)) {
        setTimeout(async () => {
          try {
            if (typeof window.apiCall === 'function') {
              const chk = await window.apiCall('auth', 'verify_session', { user_id: user.id, nis: user.nis });
              if (chk && chk.session_revoked) {
                clearSession();
                alert(chk.message || 'Sesi akun santri telah dinonaktifkan oleh pihak yayasan. Akses ke Portal Siswa ditutup.');
                window.location.href = '/login.html?revoked=1';
              }
            }
          } catch (_) {}
        }, 50);
      }
    }
    return true;
  }

  async function validateSession() {
    const user = getUser();
    if (!user) return true;
    try {
      if (typeof window.apiCall === 'function') {
        const chk = await window.apiCall('auth', 'verify_session', { user_id: user.id, nis: user.nis });
        if (chk && chk.session_revoked) {
          clearSession();
          alert(chk.message || 'Sesi akun santri telah dinonaktifkan oleh pihak yayasan.');
          window.location.href = '/login.html?revoked=1';
          return false;
        }
      }
    } catch (_) {}
    return true;
  }

  // Expose to window
  window.getToken = getToken;
  window.getUser = getUser;
  window.getCurrentUser = getUser;
  window.setSession = setSession;
  window.clearSession = clearSession;
  window.isLoggedIn = isLoggedIn;
  window.logout = logout;
  window.getPortalRedirect = getPortalRedirect;
  window.requireAuth = requireAuth;
  window.validateSession = validateSession;
})();
