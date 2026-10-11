const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = __dirname;
const PUBLIC_DIR = path.join(FRONTEND_DIR, 'public');
const PORTAL_DIR = path.join(FRONTEND_DIR, 'portal');
const SHARED_DIR = path.join(FRONTEND_DIR, 'shared');

function getAllHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllHtmlFiles(fullPath));
    } else if (file.endsWith('.html')) {
      results.push(fullPath);
    }
  });
  return results;
}

const allHtmls = getAllHtmlFiles(FRONTEND_DIR);
console.log(`Ditemukan ${allHtmls.length} file HTML.\n`);

const issues = [];

allHtmls.forEach(htmlPath => {
  const content = fs.readFileSync(htmlPath, 'utf8');
  const relPath = path.relative(FRONTEND_DIR, htmlPath).replace(/\\/g, '/');

  // Check script src
  const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["']/gi;
  let match;
  while ((match = scriptRegex.exec(content)) !== null) {
    const src = match[1];
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) continue;
    
    // Check if relative file exists
    const resolvedPath = path.resolve(path.dirname(htmlPath), src.split('?')[0]);
    if (!fs.existsSync(resolvedPath)) {
      issues.push({
        file: relPath,
        type: 'BROKEN_SCRIPT',
        target: src,
        resolved: path.relative(FRONTEND_DIR, resolvedPath).replace(/\\/g, '/')
      });
    }
  }

  // Check link href (stylesheets)
  const linkRegex = /<link\s+[^>]*href=["']([^"']+)["']/gi;
  while ((match = linkRegex.exec(content)) !== null) {
    const href = match[1];
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//') || href.startsWith('#')) continue;
    if (match[0].includes('rel="canonical"') || match[0].includes('rel="icon"')) continue;
    
    const resolvedPath = path.resolve(path.dirname(htmlPath), href.split('?')[0]);
    if (!fs.existsSync(resolvedPath)) {
      issues.push({
        file: relPath,
        type: 'BROKEN_CSS',
        target: href,
        resolved: path.relative(FRONTEND_DIR, resolvedPath).replace(/\\/g, '/')
      });
    }
  }

  // Check internal <a> links
  const aRegex = /<a\s+[^>]*href=["']([^"']+)["']/gi;
  while ((match = aRegex.exec(content)) !== null) {
    const href = match[1];
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//') || href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('javascript:')) continue;
    
    const cleanHref = href.split('?')[0].split('#')[0];
    if (!cleanHref) continue;

    // Resolve relative or root link
    let resolvedPath;
    if (cleanHref.startsWith('/')) {
      // Map based on routing
      if (cleanHref.startsWith('/admin/')) resolvedPath = path.join(PORTAL_DIR, 'admin', cleanHref.replace('/admin/', ''));
      else if (cleanHref.startsWith('/guru/')) resolvedPath = path.join(PORTAL_DIR, 'guru', cleanHref.replace('/guru/', ''));
      else if (cleanHref.startsWith('/ortu/')) resolvedPath = path.join(PORTAL_DIR, 'ortu', cleanHref.replace('/ortu/', ''));
      else if (cleanHref.startsWith('/shared/')) resolvedPath = path.join(FRONTEND_DIR, cleanHref);
      else if (cleanHref === '/' || cleanHref === '/login') resolvedPath = path.join(PUBLIC_DIR, cleanHref === '/' ? 'index.html' : 'login.html');
      else resolvedPath = path.join(PUBLIC_DIR, cleanHref.replace(/^\//, ''));
    } else {
      resolvedPath = path.resolve(path.dirname(htmlPath), cleanHref);
    }

    // Check with .html if not exists
    let exists = fs.existsSync(resolvedPath);
    if (!exists && !path.extname(resolvedPath)) {
      exists = fs.existsSync(resolvedPath + '.html');
    }

    if (!exists) {
      issues.push({
        file: relPath,
        type: 'BROKEN_LINK',
        target: href,
        resolved: path.relative(FRONTEND_DIR, resolvedPath).replace(/\\/g, '/')
      });
    }
  }
});

console.log(`Total temuan masalah: ${issues.length}`);
console.log(JSON.stringify(issues, null, 2));
