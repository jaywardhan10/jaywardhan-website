async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    ...options,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  getContent: () => request('/api/content'),
  saveContent: (content) => request('/api/content', { method: 'PUT', body: JSON.stringify(content) }),

  getNavPages: () => request('/api/pages'),
  getPage: (slug) => request(`/api/pages/${encodeURIComponent(slug)}`),

  getAdminPages: () => request('/api/admin/pages'),
  createPage: (page) => request('/api/admin/pages', { method: 'POST', body: JSON.stringify(page) }),
  updatePage: (id, page) => request(`/api/admin/pages/${id}`, { method: 'PUT', body: JSON.stringify(page) }),
  deletePage: (id) => request(`/api/admin/pages/${id}`, { method: 'DELETE' }),

  sendContact: (payload) => request('/api/contact', { method: 'POST', body: JSON.stringify(payload) }),

  getSession: () => request('/api/session'),
  login: (username, password) => request('/api/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request('/api/logout', { method: 'POST' }),

  uploadPhoto: (file) => {
    const fd = new FormData();
    fd.append('photo', file);
    return request('/api/upload/photo', { method: 'POST', body: fd });
  },
  uploadCv: (file) => {
    const fd = new FormData();
    fd.append('cv', file);
    return request('/api/upload/cv', { method: 'POST', body: fd });
  },
  uploadImage: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return request('/api/upload/image', { method: 'POST', body: fd });
  },
};
