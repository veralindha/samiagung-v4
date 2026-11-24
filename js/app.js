/* ============================================================
 * GLOBAL STATE & UTILITIES
 * ============================================================ */
let CURRENT_PAGE = 'dashboard';
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  produk: 'Produk & Sub Produk',
  supplier: 'Supplier',
  kendaraan: 'Kendaraan',
  sopir: 'Sopir',
  pelanggan: 'Pelanggan',
  penjualan: 'Penjualan',
  password: 'Pengaturan Password'
};
const pagesLoaded = { dashboard: false, produk: false, supplier: false, kendaraan: false, sopir: false, pelanggan: false, penjualan: false, password: false };

document.getElementById('footer-year').textContent = new Date().getFullYear();
document.getElementById('topbar-date').textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

function showLoader() { document.getElementById('page-loader').classList.add('show'); }
function hideLoader() { document.getElementById('page-loader').classList.remove('show'); }

function showToast(message, isError) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast' + (isError ? ' error' : '');
  toast.innerHTML = (isError ? '⚠️ ' : '✅ ') + message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function formatRupiah(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

/* ============================================================
 * API (Apps Script Web App) + SESI LOGIN
 * ============================================================ */
const TOKEN_KEY = 'samiagung_session';

function saveSession(token, expiresInSec) {
  try {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ token: token, exp: Date.now() + (expiresInSec - 60) * 1000 }));
  } catch (e) { /* penyimpanan diblokir: sesi hanya berlaku sampai halaman ditutup */ }
  window.__token = token;
}

function loadSession() {
  if (window.__token) return window.__token;
  try {
    const s = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
    if (s && s.token && s.exp > Date.now()) { window.__token = s.token; return s.token; }
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) { /* abaikan */ }
  return null;
}

function clearSession() {
  window.__token = null;
  try { localStorage.removeItem(TOKEN_KEY); } catch (e) { /* abaikan */ }
}

function showLogin(message) {
  document.getElementById('login-overlay').style.display = '';
  document.getElementById('login-error').textContent = message || '';
  document.getElementById('login-password').value = '';
}

async function apiCall(action, args) {
  if (!CONFIG.API_URL || CONFIG.API_URL.indexOf('GANTI') !== -1) {
    throw new Error('API_URL belum diisi di file config.js.');
  }
  let res;
  try {
    res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      // text/plain menghindari CORS preflight yang tidak didukung Apps Script
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, args: args || [], token: loadSession() })
    });
  } catch (e) {
    throw new Error('Gagal terhubung ke server. Periksa koneksi internet.');
  }
  let json;
  try { json = await res.json(); } catch (e) { throw new Error('Respons server tidak valid.'); }
  if (!json.ok) throw new Error(json.error || 'Terjadi kesalahan.');
  return json.data;
}

function serverCall(fnName, args, onSuccess, onError) {
  showLoader();
  apiCall(fnName, args).then(
    function (res) { hideLoader(); onSuccess(res); },
    function (err) {
      hideLoader();
      if (err.message === 'SESSION_EXPIRED') {
        clearSession();
        showLogin('Sesi berakhir. Silakan masuk lagi.');
      } else {
        showToast(err.message || 'Terjadi kesalahan.', true);
      }
      if (onError) onError(err);
    }
  );
}

function downloadBase64PDF(base64, filename) {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ============================================================
 * LOGIN
 * ============================================================ */
function doLogin() {
  const pass = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');
  const errorEl = document.getElementById('login-error');
  errorEl.textContent = '';
  if (!pass) { errorEl.textContent = 'Password wajib diisi.'; return; }
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Memeriksa...';
  apiCall('login', [pass]).then(
    function (res) {
      btn.disabled = false;
      btn.innerHTML = 'Masuk';
      saveSession(res.token, res.expiresIn);
      document.getElementById('login-password').value = '';
      document.getElementById('login-overlay').style.display = 'none';
      initApp();
    },
    function (err) {
      btn.disabled = false;
      btn.innerHTML = 'Masuk';
      errorEl.textContent = err.message;
    }
  );
}

function doLogout() {
  apiCall('logout', []).catch(function () { /* abaikan */ }).then(function () {
    clearSession();
    location.reload();
  });
}

function initApp() {
  loadDashboardPage();
  pagesLoaded.dashboard = true;
}

/* ============================================================
 * NAVIGATION
 * ============================================================ */
function navigateTo(page) {
  CURRENT_PAGE = page;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  document.querySelectorAll('.page').forEach(el => el.classList.toggle('active', el.id === 'page-' + page));
  document.getElementById('topbar-title').textContent = PAGE_TITLES[page];

  if (window.innerWidth <= 860) document.getElementById('sidebar').classList.remove('open');

  if (!pagesLoaded[page]) {
    pagesLoaded[page] = true;
    if (page === 'produk') loadProdukPage();
    if (page === 'supplier') loadSupplierPage();
    if (page === 'kendaraan') loadKendaraanPage();
    if (page === 'sopir') loadSopirPage();
    if (page === 'pelanggan') loadPelangganPage();
    if (page === 'penjualan') loadPenjualanPage();
  } else {
    if (page === 'dashboard') loadDashboardPage();
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

/* ============================================================
 * MODAL HELPERS
 * ============================================================ */
function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

function confirmAction(title, message, onConfirm) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').textContent = message;
  const btn = document.getElementById('confirm-btn-ok');
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);
  newBtn.addEventListener('click', function () {
    closeModal('modal-confirm');
    onConfirm();
  });
  openModal('modal-confirm');
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) overlay.classList.remove('show');
  });
});

/* Lanjutkan sesi jika token masih berlaku (tanpa login ulang tiap refresh) */
// (menunggu DOMContentLoaded agar skrip halaman di bawahnya sudah termuat)
document.addEventListener('DOMContentLoaded', function () {
  if (loadSession()) {
    document.getElementById('login-overlay').style.display = 'none';
    initApp();
  }
});
