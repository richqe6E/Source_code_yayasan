const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const BASE_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

function resolveFilePath(reqPath) {
  let p = reqPath.split('?')[0];

  // Direct redirects
  if (p === '/admin' || p === '/admin/') return { redirect: '/admin/dashboard.html' };
  if (p === '/siswa' || p === '/siswa/') return { redirect: '/siswa/dashboard.html' };
  if (p === '/portal/admin' || p === '/portal/admin/') return { redirect: '/admin/dashboard.html' };
  if (p === '/portal/siswa' || p === '/portal/siswa/') return { redirect: '/siswa/dashboard.html' };
  if (p === '/guru' || p === '/guru/' || p === '/ortu' || p === '/ortu/' || p === '/portal/guru' || p === '/portal/ortu') return { redirect: '/login.html' };
  if (p === '/login') return { redirect: '/login.html' };
  if (p === '/register') return { redirect: '/register.html' };
  if (p === '/ppdb') return { redirect: '/ppdb.html' };
  if (p === '/berita') return { redirect: '/berita.html' };

  // Support /public/ prefix directly
  if (p.startsWith('/public/')) {
    return { file: path.join(BASE_DIR, 'public', p.replace(/^\/public\//, '')) };
  }

  // Support /shared/ prefix
  if (p.startsWith('/shared/')) {
    return { file: path.join(BASE_DIR, p) };
  }

  // Portals (Admin & Siswa Saja)
  if (p.startsWith('/portal/admin/')) {
    return { file: path.join(BASE_DIR, 'portal/admin', p.replace(/^\/portal\/admin\//, '')) };
  }
  if (p.startsWith('/portal/siswa/')) {
    return { file: path.join(BASE_DIR, 'portal/siswa', p.replace(/^\/portal\/siswa\//, '')) };
  }

  if (p.startsWith('/admin/')) {
    return { file: path.join(BASE_DIR, 'portal/admin', p.replace(/^\/admin\//, '')) };
  }
  if (p.startsWith('/siswa/')) {
    return { file: path.join(BASE_DIR, 'portal/siswa', p.replace(/^\/siswa\//, '')) };
  }

  // Public assets
  if (p.startsWith('/css/') || p.startsWith('/js/') || p.startsWith('/images/') || p.startsWith('/videos/') || p.startsWith('/assets/')) {
    return { file: path.join(BASE_DIR, 'public', p) };
  }

  // PPDB and Berita
  if (p.startsWith('/ppdb/')) {
    return { file: path.join(BASE_DIR, 'public', p) };
  }
  if (p === '/form-paud.html') return { file: path.join(BASE_DIR, 'public/ppdb/form-paud.html') };
  if (p === '/form-tpq.html') return { file: path.join(BASE_DIR, 'public/ppdb/form-tpq.html') };
  if (p === '/status.html') return { file: path.join(BASE_DIR, 'public/ppdb/status.html') };

  if (p.startsWith('/berita/')) {
    return { file: path.join(BASE_DIR, 'public/berita/detail.html') };
  }

  if (p === '/' || p === '/index.html') {
    return { file: path.join(BASE_DIR, 'public/index.html') };
  }

  // Public files fallback
  const publicPath = path.join(BASE_DIR, 'public', p.replace(/^\//, ''));
  if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
    return { file: publicPath };
  }

  // Check with .html appended
  const publicHtml = publicPath + '.html';
  if (fs.existsSync(publicHtml) && fs.statSync(publicHtml).isFile()) {
    return { file: publicHtml };
  }

  return { notFound: true };
}

let localApi = null;
try {
  localApi = require('./local-api');
} catch (e) {
  console.warn('local-api not found, proceeding without local mock API');
}

const server = http.createServer((req, res) => {
  // Add CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Pakai WHATWG URL API (url.parse deprecated di Node 21+)
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const parsed = {
    pathname: parsedUrl.pathname,
    query: Object.fromEntries(parsedUrl.searchParams.entries())
  };

  // Handle /exec or /api/v1/ via localApi
  if (localApi && (parsed.pathname === '/exec' || parsed.pathname.startsWith('/api/v1/'))) {
    let apiPath = parsed.query.path || parsed.pathname;

    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', () => {
      let params = { ...parsed.query };
      if (bodyStr) {
        try {
          const bodyJson = JSON.parse(bodyStr);
          Object.assign(params, bodyJson);
          if (bodyJson.path && !parsed.query.path) apiPath = bodyJson.path;
        } catch (err) {
          // not json, leave params as query
        }
      }

      // Resolve user identity dari token (untuk RBAC mock)
      const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
      const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
      const reqToken = params.token || bearerToken || '';
      if (reqToken && typeof localApi.lookupToken === 'function') {
        const sessionUser = localApi.lookupToken(reqToken);
        if (sessionUser) {
          const roleCode = (typeof sessionUser.role === 'object' && sessionUser.role) ? sessionUser.role.code : sessionUser.role;
          params._user_email = sessionUser.email;
          params._user_role = roleCode;
          params._user_id = sessionUser.id;
        }
      }

      try {
        const result = localApi.handleApiRequest(apiPath, params, req.method);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result));
      } catch (apiErr) {
        console.error('dev-server API Error:', apiErr);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: apiErr.message, error: { message: apiErr.message } }));
      }
    });
    return;
  }

  const resolved = resolveFilePath(parsed.pathname);

  if (resolved.redirect) {
    res.writeHead(302, { 'Location': resolved.redirect });
    res.end();
    return;
  }

  if (resolved.file && fs.existsSync(resolved.file)) {
    const ext = path.extname(resolved.file).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(resolved.file).pipe(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found: ' + req.url);
});

server.listen(PORT, () => {
  console.log(`Local dev server running at http://localhost:${PORT}`);
});
