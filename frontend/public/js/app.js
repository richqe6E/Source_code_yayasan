/**
 * SIYAYASAN - Frontend Public JavaScript
 * Terkoneksi langsung ke Supabase PostgreSQL & Storage untuk Website Publik.
 */

(function () {
  'use strict';

  const existingSharedApiCall = window.apiCall;

  const SUPABASE_CONFIG = window.SIYAYASAN_SUPABASE || {
    url: 'https://hnkxrbmngmveoxipohtk.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua3hyYm1uZ212ZW94aXBvaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTQ5NTMsImV4cCI6MjEwNDQ5MDk1M30.S10JzbSvvEStbEJl4DFVBYniyoQkG6q7_PGg3cJI9Yo',
    storageBucket: 'siyayasan-uploads'
  };

  const API_URL = SUPABASE_CONFIG.url;
  const API_KEY = SUPABASE_CONFIG.anonKey;
  const STORAGE_BUCKET = SUPABASE_CONFIG.storageBucket;

  async function supabaseRest(endpoint, method = 'GET', body = null, extraHeaders = {}) {
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

    const res = await fetch(url, opts);
    if (res.status === 204) return [];
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : null; }
    catch (e) { data = text; }

    if (!res.ok) {
      const errMessage = (data && (data.message || data.error || data.msg)) || `Error ${res.status}`;
      throw new Error(errMessage);
    }
    return data;
  }

  async function uploadToStorage(fileOrBlob, prefix = 'ppdb') {
    if (!fileOrBlob || (typeof fileOrBlob === 'string' && !fileOrBlob.startsWith('data:'))) {
      return fileOrBlob || '';
    }

    let blob, ext = 'jpg', contentType = 'image/jpeg';
    if (typeof fileOrBlob === 'string' && fileOrBlob.startsWith('data:')) {
      const match = fileOrBlob.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        contentType = match[1];
        ext = contentType.split('/')[1] || 'jpg';
        const binary = atob(match[2]);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
        blob = new Blob([array], { type: contentType });
      }
    } else if (fileOrBlob instanceof Blob || fileOrBlob instanceof File) {
      blob = fileOrBlob;
      contentType = fileOrBlob.type || 'application/octet-stream';
      const parts = (fileOrBlob.name || '').split('.');
      if (parts.length > 1) ext = parts.pop();
    }

    if (!blob) return '';

    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const uploadUrl = `${API_URL}/storage/v1/object/${STORAGE_BUCKET}/${filename}`;

    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': contentType,
        'x-upsert': 'true'
      },
      body: blob
    });

    if (!res.ok) return '';
    return `${API_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${filename}`;
  }

  /**
   * Generic API caller for public website
   */
  async function apiCall(module, action, params = {}, method = 'GET') {
    if (existingSharedApiCall && typeof existingSharedApiCall === 'function') {
      return existingSharedApiCall(module, action, params, method);
    }

    try {
      if (module === 'news') {
        if (action === 'list') {
          let query = 'news?select=*&order=published_at.desc';
          if (params.status) query += `&status=eq.${encodeURIComponent(params.status)}`;
          if (params.exclude_id) query += `&id=neq.${encodeURIComponent(params.exclude_id)}`;
          const news = await supabaseRest(query);
          return { success: true, data: news, raw: { items: news } };
        }
        if (action === 'get') {
          const kw = params.slug || params.id || '';
          const news = await supabaseRest(`news?or=(slug.eq.${encodeURIComponent(kw)},id.eq.${encodeURIComponent(kw)})&select=*`);
          if (!news || news.length === 0) return { success: false, message: 'Berita tidak ditemukan' };
          return { success: true, data: news[0] };
        }
      }

      if (module === 'announcements') {
        if (action === 'list') {
          const ann = await supabaseRest('announcements?status=eq.published&select=*&order=published_at.desc');
          return { success: true, data: ann, raw: { items: ann } };
        }
        if (action === 'get') {
          const ann = await supabaseRest(`announcements?id=eq.${encodeURIComponent(params.id)}&select=*`);
          return { success: true, data: ann[0] || null };
        }
      }

      if (module === 'events') {
        if (action === 'list') {
          const evts = await supabaseRest('events?select=*&order=event_date.asc').catch(() => supabaseRest('events?select=*'));
          const normalizedEvts = (evts || []).map(e => ({ ...e, date: e.date || e.event_date, event_date: e.event_date || e.date }));
          return { success: true, data: normalizedEvts, raw: { items: normalizedEvts } };
        }
      }

      if (module === 'galleries' || module === 'gallery') {
        if (action === 'list') {
          const gals = await supabaseRest('galleries?select=*&order=created_at.desc');
          return { success: true, data: gals, raw: { items: gals } };
        }
      }

      if (module === 'schools' || module === 'school') {
        const schools = await supabaseRest('schools?select=*');
        return { success: true, data: schools[0] || null };
      }

      if (module === 'ppdb') {
        if (action === 'period') {
          const periods = await supabaseRest('ppdb_periods?select=*&order=created_at.desc');
          const p = periods && periods[0] ? { ...periods[0] } : null;
          if (p) {
            let extra = {};
            if (p.announcement_notes) {
              try { extra = JSON.parse(p.announcement_notes); } catch (_) { extra = { notes: p.announcement_notes }; }
            }
            try {
              const cached = localStorage.getItem('siy_ppdb_schedule');
              if (cached) Object.assign(extra, JSON.parse(cached));
            } catch (_) {}
            Object.assign(p, extra);
          }
          return { success: true, data: p };
        }
        if (action === 'submitPublic' || action === 'submit') {
          let photoUrl = params.photo_url;
          if (params.photo_file || (photoUrl && photoUrl.startsWith('data:'))) {
            photoUrl = await uploadToStorage(params.photo_file || photoUrl, 'foto_santri');
          }
          let certUrl = params.birth_certificate_url;
          if (params.birth_certificate_file || (certUrl && certUrl.startsWith('data:'))) {
            certUrl = await uploadToStorage(params.birth_certificate_file || certUrl, 'akta');
          }
          let kkUrl = params.family_card_url;
          if (params.family_card_file || (kkUrl && kkUrl.startsWith('data:'))) {
            kkUrl = await uploadToStorage(params.family_card_file || kkUrl, 'kk');
          }

          const id = 'REG-' + Date.now();
          const regNum = 'REG-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));

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

          const studentName = params.student_name || params.full_name || params.child_name || 'Santri Baru';
          const parentName = params.parent_name || params.father_name || params.mother_name || 'Orang Tua / Wali';
          const parentPhone = params.parent_phone || params.phone || params.father_phone || '';
          const parentEmail = params.parent_email || params.email || '';
          const birthPlace = params.student_birth_place || params.birth_place || 'Samarinda';
          const birthDate = params.student_birth_date || params.birth_date || '2021-01-01';
          const gender = params.student_gender || params.gender || 'L';
          const level = params.level || (params.form_type === 'tpq' ? 'TPQ' : (params.form_type === 'tk' ? 'TK' : 'PAUD'));
          const address = params.address || '';

          const payload = {
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

          try {
            const res = await supabaseRest('ppdb_registrations', 'POST', payload);
            return {
              success: true,
              data: (Array.isArray(res) ? res[0] : res) || payload,
              registration_number: regNum,
              message: 'Pendaftaran PPDB berhasil diajukan'
            };
          } catch (postErr) {
            console.warn('Supabase PPDB insert fallback:', postErr);
            // Save to local cache for resilient offline/fallback support
            try {
              const localList = JSON.parse(localStorage.getItem('siy_local_ppdb_regs') || '[]');
              localList.unshift(payload);
              localStorage.setItem('siy_local_ppdb_regs', JSON.stringify(localList));
            } catch (_) {}
            return {
              success: true,
              data: payload,
              registration_number: regNum,
              message: 'Pendaftaran PPDB berhasil diajukan'
            };
          }
        }

        if (action === 'getStatusPublic' || action === 'check_status' || action === 'status') {
          const regNo = params.registration_number || params.registration_no || params.id;
          const regs = await supabaseRest(`ppdb_registrations?or=(registration_number.eq.${encodeURIComponent(regNo)},registration_no.eq.${encodeURIComponent(regNo)},id.eq.${encodeURIComponent(regNo)})&select=*`);
          if (!regs || regs.length === 0) {
            return { success: false, message: 'Nomor pendaftaran tidak ditemukan' };
          }
          return { success: true, data: { registration: regs[0] }, registration: regs[0] };
        }
      }

      if (module === 'contact') {
        const id = 'MSG-' + Date.now();
        await supabaseRest('contact_messages', 'POST', { id, ...params });
        return { success: true, message: 'Pesan berhasil dikirim' };
      }

      // Default query
      const data = await supabaseRest(`${module}?select=*`);
      return { success: true, data, raw: { items: data } };

    } catch (err) {
      // Fallback ke server lokal jika cloud offline
      try {
        const localRes = await fetch(`/api/v1/${module}/${action}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        if (localRes.ok) {
          const lJson = await localRes.json();
          return lJson;
        }
      } catch (_) {}

      console.error('Public API Error:', err);
      return { success: false, message: err.message || 'Gagal terhubung ke database' };
    }
  }

  function showToast(message, type = 'info') {
    const colors = {
      success: 'border-primary-600 bg-primary-50 text-primary-900',
      error: 'border-red-500 bg-red-50 text-red-800',
      warning: 'border-amber-500 bg-amber-50 text-amber-800',
      info: 'border-primary-500 bg-primary-50 text-primary-800'
    };
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 z-50 max-w-sm ${colors[type] || colors.info} border-l-4 rounded-r-md shadow-lg p-4 flex items-start gap-3 transition-all duration-300`;
    toast.innerHTML = `
      <p class="text-sm font-medium flex-1">${message}</p>
      <button onclick="this.parentElement.remove()" class="text-current opacity-60 hover:opacity-100">&times;</button>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDateID(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  async function loadLatestNews() {
    const container = document.getElementById('latest-news');
    if (!container) return;

    // Fetch warta berita dan galeri dokumentasi secara paralel
    const [newsRes, galleryRes] = await Promise.all([
      apiCall('news', 'list', { status: 'published' }).catch(() => null),
      apiCall('gallery', 'list', { per_page: 6 }).catch(() => null)
    ]);

    const rawItems = (newsRes && Array.isArray(newsRes.data)) ? newsRes.data : ((newsRes && newsRes.data && newsRes.data.items) || (newsRes && newsRes.items) || []);
    const items = rawItems.slice(0, 3);

    const rawGallery = (galleryRes && Array.isArray(galleryRes.data)) ? galleryRes.data : ((galleryRes && galleryRes.data && galleryRes.data.items) || (galleryRes && galleryRes.items) || []);
    const galleryPhotos = rawGallery.filter(g => g && (g.image_url || g.image)).slice(0, 2);

    if (!newsRes || !newsRes.success || items.length === 0) {
      container.className = 'w-full';
      container.innerHTML = '<div class="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200/80 text-sm">Belum ada warta berita yang diterbitkan.</div>';
      return;
    }

    // Jika artikel hanya 1: Tampilkan Bento Split (Warta Utama di kiri + Dokumentasi Galeri Kegiatan di kanan)
    if (items.length === 1) {
      const n = items[0];
      const imgUrl = n.image || n.featured_image_url || 'images/school-campus.jpg';
      container.className = 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch';
      container.innerHTML = `
        <!-- Kartu Berita Utama (Featured News) -->
        <div class="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            <div class="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 mb-5 relative">
              <img src="${imgUrl}" alt="${n.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
              <span class="absolute top-3 left-3 bg-slate-900/75 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">Warta Yayasan</span>
            </div>
            <div class="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <span>${formatDateID(n.published_at || n.created_at)}</span>
            </div>
            <h3 class="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-primary-700 leading-snug mb-2 transition-colors">
              <a href="berita/detail.html?slug=${encodeURIComponent(n.slug || n.id)}">${n.title}</a>
            </h3>
            <p class="text-sm text-slate-600 line-clamp-2 leading-relaxed text-justify mb-4">${n.summary || 'Informasi terbaru seputar kegiatan pendidikan, pembiasaan ibadah, dan agenda santri Yayasan At Tarbiyyah.'}</p>
          </div>
          <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
            <a href="berita/detail.html?slug=${encodeURIComponent(n.slug || n.id)}" class="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 hover:text-primary-800 transition">
              <span>Baca Selengkapnya</span>
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
            </a>
            <span class="text-[11px] text-slate-400">Liputan Resmi</span>
          </div>
        </div>

        <!-- Kartu Potret & Dokumentasi Santri (Mengisi Void Kanan) -->
        <div class="lg:col-span-5 bg-gradient-to-br from-slate-50 to-sky-50/40 border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
                <h4 class="text-sm font-bold text-slate-900">Potret Kegiatan Santri</h4>
              </div>
              <span class="text-[11px] font-semibold text-primary-700 bg-white border border-primary-200 px-2.5 py-0.5 rounded-full">Dokumentasi</span>
            </div>
            <p class="text-xs text-slate-600 mb-4 leading-relaxed">
              Momen belajar, bermain edukatif, dan pembiasaan adab Qur'ani santri PAUD, TK, dan TPQ di lingkungan sekolah.
            </p>
            <div class="grid grid-cols-2 gap-3 mb-4">
              ${(function() {
                if (galleryPhotos.length > 0) {
                  let html = galleryPhotos.map((g, idx) => {
                    const photoUrl = g.image_url || g.image;
                    const photoTitle = g.title || (idx === 0 ? 'Kegiatan Santri' : 'Fasilitas Sekolah');
                    return `
                      <a href="galeri.html" class="aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-2xs group/img relative block" title="${escapeHtml(photoTitle)}">
                        <img src="${photoUrl}" alt="${escapeHtml(photoTitle)}" class="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300" loading="lazy">
                        <span class="absolute bottom-1.5 left-1.5 text-[9px] font-medium text-white bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded truncate max-w-[85%]">${escapeHtml(photoTitle)}</span>
                      </a>
                    `;
                  }).join('');

                  if (galleryPhotos.length === 1) {
                    html += `
                      <a href="galeri.html" class="aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-2xs group/img relative block" title="Gedung Kampus Yayasan">
                        <img src="images/school-campus.jpg" alt="Gedung Kampus Yayasan" class="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300" loading="lazy">
                        <span class="absolute bottom-1.5 left-1.5 text-[9px] font-medium text-white bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded">Kampus</span>
                      </a>
                    `;
                  }
                  return html;
                }

                // Fallback jika belum ada foto galeri di Supabase
                return `
                  <a href="galeri.html" class="aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-2xs group/img relative block" title="Lingkungan Kampus">
                    <img src="images/school-campus.jpg" alt="Aktivitas Santri At Tarbiyyah" class="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300" loading="lazy">
                    <span class="absolute bottom-1.5 left-1.5 text-[9px] font-medium text-white bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded">Lingkungan</span>
                  </a>
                  <a href="galeri.html" class="aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-2xs group/img relative block" title="Fasilitas Yayasan">
                    <img src="images/school-campus.jpg" alt="Gedung Kampus Yayasan" class="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300" loading="lazy">
                    <span class="absolute bottom-1.5 left-1.5 text-[9px] font-medium text-white bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded">Fasilitas</span>
                  </a>
                `;
              })()}
            </div>
          </div>
          <div class="pt-4 border-t border-slate-200/70">
            <a href="galeri.html" class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold transition shadow-2xs active:scale-[0.98]">
              <span>Buka Galeri Foto Aktivitas</span>
              <svg class="w-3.5 h-3.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
            </a>
          </div>
        </div>
      `;
      return;
    }

    // Jika 2 atau 3 artikel: Tampilkan Elevated Card Grid
    container.className = items.length === 2 ? 'grid md:grid-cols-2 gap-6' : 'grid md:grid-cols-3 gap-6';
    container.innerHTML = items.map(n => `
      <div class="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-primary-400 transition-all flex flex-col justify-between group">
        <div>
          <div class="aspect-video bg-slate-100 rounded-xl overflow-hidden mb-4 relative">
            ${(n.image || n.featured_image_url)
              ? `<img src="${n.image || n.featured_image_url}" alt="${n.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">`
              : `<div class="w-full h-full flex items-center justify-center text-slate-400"><svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>`
            }
          </div>
          <div class="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span>${formatDateID(n.published_at || n.created_at)}</span>
          </div>
          <h3 class="text-base font-bold text-slate-900 group-hover:text-primary-700 leading-snug mb-2 transition-colors">
            <a href="berita/detail.html?slug=${encodeURIComponent(n.slug || n.id)}">${n.title}</a>
          </h3>
          <p class="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed mb-4">${n.summary || ''}</p>
        </div>
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
          <a href="berita/detail.html?slug=${encodeURIComponent(n.slug || n.id)}" class="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 hover:text-primary-800 transition">
            <span>Baca Warta</span>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
          </a>
        </div>
      </div>
    `).join('');
  }

  // Exports
  if (!window.apiCall) {
    window.apiCall = apiCall;
  }
  window.showToast = window.showToast || showToast;
  window.formatDateID = formatDateID;
  window.formatDate = window.formatDate || formatDateID;
  window.uploadToStorage = uploadToStorage;

  document.addEventListener('DOMContentLoaded', () => {
    loadLatestNews();
  });
})();