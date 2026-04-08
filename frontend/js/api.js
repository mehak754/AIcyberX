/* ============================================================
   AIcyberX — API Helper
   All backend communication goes through this module
   ============================================================ */

const API_BASE = 'https://aicyberx.onrender.com/api';

// ─── Request Helper ────────────────────────────────────────
async function request(method, path, body = null, auth = false) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = localStorage.getItem('acx_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_BASE}${path}`, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    return data;
  } catch (err) {
    throw err;
  }
}

// ─── Auth API ──────────────────────────────────────────────
const AuthAPI = {
  register: (data) => request('POST', '/auth/register', data),
  login: (data) => request('POST', '/auth/login', data),
  getProfile: () => request('GET', '/auth/profile', null, true),
  updateProfile: (data) => request('PUT', '/auth/profile', data, true),
};

// ─── Workshops API ─────────────────────────────────────────
const WorkshopsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/workshops${qs ? '?' + qs : ''}`);
  },
  getById: (id) => request('GET', `/workshops/${id}`),
  register: (id) => request('POST', `/workshops/${id}/register`, {}, true),
};

// ─── Contact API ───────────────────────────────────────────
const ContactAPI = {
  submit: (data) => request('POST', '/contact', data),
  joinCommunity: (data) => request('POST', '/contact/community', data),
};

// ─── Auth State ────────────────────────────────────────────
const Auth = {
  save(token, student) {
    localStorage.setItem('acx_token', token);
    localStorage.setItem('acx_student', JSON.stringify(student));
  },
  clear() {
    localStorage.removeItem('acx_token');
    localStorage.removeItem('acx_student');
  },
  getStudent() {
    try { return JSON.parse(localStorage.getItem('acx_student')); }
    catch { return null; }
  },
  getToken: () => localStorage.getItem('acx_token'),
  isLoggedIn: () => !!localStorage.getItem('acx_token'),
};

// ─── Expose globally ───────────────────────────────────────
window.AuthAPI = AuthAPI;
window.WorkshopsAPI = WorkshopsAPI;
window.ContactAPI = ContactAPI;
window.Auth = Auth;
