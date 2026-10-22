const TOKEN_KEY = 'shopeasy_token';
const USER_KEY = 'shopeasy_user';

const PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">' +
      '<rect width="300" height="200" fill="#eef0f6"/>' +
      '<text x="150" y="108" font-size="18" text-anchor="middle" fill="#99a">No image</text>' +
      '</svg>'
  );

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch (e) {
    return null;
  }
}

function setAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function logout() {
  clearAuth();
  window.location.href = '/index.html';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function formatPrice(paise) {
  return '₹' + (Number(paise) / 100).toLocaleString('en-IN');
}

function imgTag(url, alt) {
  return `<img src="${escapeHtml(url || PLACEHOLDER)}" alt="${escapeHtml(alt)}" onerror="this.onerror=null;this.src=PLACEHOLDER">`;
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = 'Bearer ' + token;

  const res = await fetch('/api' + path, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    data = {};
  }

  if (!res.ok) {
    if (res.status === 401 && token && !path.startsWith('/auth/')) {
      clearAuth();
      window.location.href = '/login.html';
    }
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

let toastTimer;
function showToast(message, type = 'ok') {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.className = 'toast show ' + (type === 'err' ? 'err' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

async function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge || !getToken()) return;
  try {
    const cart = await api('/cart');
    badge.textContent = cart.count;
  } catch (e) {
    /* ignore */
  }
}

function renderNav() {
  const el = document.getElementById('navbar');
  if (!el) return;
  const user = getUser();

  let links = '<a href="/index.html">Shop</a>';
  if (user) {
    links += '<a href="/cart.html">Cart <span class="badge" id="cartBadge">0</span></a>';
    links += '<a href="/orders.html">My Orders</a>';
    if (user.role === 'admin') links += '<a href="/admin/products.html">Admin</a>';
    links += `<span class="who">Hi, ${escapeHtml(user.name)}</span>`;
    links += '<button class="btn-link" id="logoutBtn">Logout</button>';
  } else {
    links += '<a href="/login.html">Login</a><a href="/register.html">Register</a>';
  }

  el.innerHTML = `<div class="nav-inner"><a class="brand" href="/index.html">ShopEasy</a><nav>${links}</nav></div>`;

  const btn = document.getElementById('logoutBtn');
  if (btn) btn.addEventListener('click', logout);
  updateCartBadge();
}

document.addEventListener('DOMContentLoaded', renderNav);
function requireLogin() {
  if (!getToken()) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

function requireAdmin() {
  const user = getUser();
  if (!getToken() || !user || user.role !== 'admin') {
    window.location.href = '/index.html';
    return false;
  }
  return true;
}

function formatDate(value) {
  if (!value) return '';
  const d = new Date(String(value).replace(' ', 'T') + 'Z');
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function statusBadge(status) {
  return `<span class="status ${escapeHtml(String(status).toLowerCase())}">${escapeHtml(status)}</span>`;
}

function adminNav(active) {
  const links = [['dashboard', 'Dashboard'], ['products', 'Products'], ['orders', 'Orders']];
  return links
    .map(([key, label]) => `<a href="/admin/${key}.html" class="${key === active ? 'active' : ''}">${label}</a>`)
    .join('');
}