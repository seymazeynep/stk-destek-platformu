const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('stk_user');
    window.dispatchEvent(new CustomEvent('stk:unauthorized'));
  }

  return res;
}

export async function fetchStats() {
  const res = await apiFetch('/stats');
  if (!res.ok) throw new Error('İstatistikler yüklenemedi');
  return res.json();
}

export async function fetchCategories() {
  const res = await apiFetch('/categories');
  if (!res.ok) throw new Error('Kategoriler yüklenemedi');
  return res.json();
}

export async function fetchCities() {
  const res = await apiFetch('/cities');
  if (!res.ok) throw new Error('Şehirler yüklenemedi');
  return res.json();
}

export async function fetchWizardTopics() {
  const res = await apiFetch('/wizard/topics');
  if (!res.ok) throw new Error('Destek konuları yüklenemedi');
  return res.json();
}

export async function matchWizard(params) {
  const query = new URLSearchParams();
  if (params.topicId) query.append('topicId', params.topicId);
  if (params.targetGroup) query.append('targetGroup', params.targetGroup);
  if (params.city) query.append('city', params.city);
  if (params.keyword) query.append('keyword', params.keyword);

  const res = await apiFetch(`/wizard/match?${query.toString()}`);
  if (!res.ok) throw new Error('Eşleştirme yapılamadı');
  return res.json();
}

export async function fetchStks(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  if (params.q) query.append('q', params.q);
  if (params.city) query.append('city', params.city);
  if (params.category && params.category !== 'all') query.append('category', params.category);
  if (params.organizationType && params.organizationType !== 'all') query.append('organizationType', params.organizationType);
  if (params.verified) query.append('verified', params.verified);
  if (params.sort) query.append('sort', params.sort);

  const res = await apiFetch(`/stks?${query.toString()}`);
  if (!res.ok) throw new Error('STK listesi yüklenemedi');
  return res.json();
}

export async function fetchStkDetail(id) {
  const res = await apiFetch(`/stks/${id}`);
  if (!res.ok) throw new Error('STK detayları yüklenemedi');
  return res.json();
}

export async function submitContactRequest(payload) {
  const res = await apiFetch('/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Mesaj gönderilemedi');
  return data;
}

export async function loginStk(email, password) {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.error || 'Giriş yapılamadı');
  return data;
}

export async function registerStk(payload) {
  const res = await apiFetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.error || 'Kayıt yapılamadı');
  return data;
}

export async function logoutStk() {
  const res = await apiFetch('/auth/logout', { method: 'POST' });
  if (!res.ok) throw new Error('Çıkış yapılamadı');
}

export async function fetchDashboard() {
  const res = await apiFetch('/stk/dashboard');
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Yönetim paneli yüklenemedi');
  return data;
}

export async function updateStkProfile(payload) {
  const res = await apiFetch('/stk/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Profil güncellenemedi');
  return data;
}

export async function addStkActivity(payload) {
  const res = await apiFetch('/stk/activities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Faaliyet eklenemedi');
  return data;
}

export async function updateRequestStatus(reqId, status, adminNotes) {
  const res = await apiFetch(`/stk/requests/${reqId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, admin_notes: adminNotes })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Talep güncellenemedi');
  return data;
}
