let chartBulanan = null;
let chartProduk = null;

/* Tampilan grafik (warna & gaya saja) */
const CHART_LINE = '#3F7D68';
const CHART_BAR = '#5E9C86';
const CHART_BAR_HOVER = '#3F7D68';
const CHART_GRID = '#EDF2EF';
const CHART_TEXT = '#6B7A73';

function applyChartDefaults() {
  if (!window.Chart) return;
  Chart.defaults.font.family = "'DM Sans', 'Inter', 'Segoe UI', sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.color = CHART_TEXT;
}

const CHART_TOOLTIP = {
  backgroundColor: '#1F2D27',
  titleColor: '#FFFFFF',
  bodyColor: '#E5F0EA',
  padding: 10,
  cornerRadius: 10,
  displayColors: false,
  boxPadding: 4
};

function formatTickRupiah(v) {
  if (v >= 1000000) return 'Rp ' + (v / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt';
  if (v >= 1000) return 'Rp ' + (v / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' rb';
  return 'Rp ' + v;
}

function loadDashboardPage() {
  serverCall('getDashboardStats', [], renderDashboard);
}

function renderDashboard(stats) {
  document.getElementById('stat-omzet').textContent = formatRupiah(stats.totalOmzetBulanIni);
  document.getElementById('stat-transaksi').textContent = stats.transaksiBulanIni;
  document.getElementById('stat-produk').textContent = stats.totalProduk;
  document.getElementById('stat-pelanggan').textContent = stats.totalPelanggan;

  renderLowStock(stats.produkStokMenipis);
  renderTopProduk(stats.perProduk);
  renderChartBulanan(stats.per6Bulan);
  renderChartProduk(stats.perProduk);
}

function renderLowStock(list) {
  const el = document.getElementById('low-stock-list');
  if (!list || list.length === 0) {
    el.innerHTML = '<div class="empty-state"><div class="emoji">✅</div>Semua stok aman</div>';
    return;
  }
  el.innerHTML = list.map(p => `
    <div class="low-stock-item">
      <span>${p.NamaProduk}</span>
      <span class="badge badge-red">${p.Stok} ${p.Satuan} tersisa</span>
    </div>
  `).join('');
}

function renderTopProduk(list) {
  const el = document.getElementById('top-produk-list');
  if (!list || list.length === 0) {
    el.innerHTML = '<div class="empty-state"><div class="emoji">📭</div>Belum ada data penjualan</div>';
    return;
  }
  el.innerHTML = list.slice(0, 5).map((p, i) => `
    <div class="low-stock-item">
      <span>${i + 1}. ${p.nama}</span>
      <span class="badge badge-gold">${formatRupiah(p.total)}</span>
    </div>
  `).join('');
}

function renderChartBulanan(data) {
  const ctx = document.getElementById('chart-bulanan');
  const labels = data.map(d => {
    const parts = d.bulan.split('-');
    const bulanNama = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    return bulanNama[parseInt(parts[1], 10) - 1] + ' ' + parts[0].slice(2);
  });
  const values = data.map(d => d.total);

  applyChartDefaults();
  if (chartBulanan) chartBulanan.destroy();
  chartBulanan = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Omzet',
        data: values,
        borderColor: CHART_LINE,
        backgroundColor: 'rgba(63,125,104,0.10)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#FFFFFF',
        pointBorderColor: CHART_LINE,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: Object.assign({}, CHART_TOOLTIP, {
          callbacks: { label: c => ' ' + formatRupiah(c.parsed.y) }
        })
      },
      scales: {
        y: { ticks: { callback: formatTickRupiah, color: CHART_TEXT }, grid: { color: CHART_GRID }, border: { display: false } },
        x: { ticks: { color: CHART_TEXT }, grid: { display: false }, border: { display: false } }
      }
    }
  });
}

function renderChartProduk(list) {
  const ctx = document.getElementById('chart-produk');
  const top = list.slice(0, 6);
  applyChartDefaults();
  if (chartProduk) chartProduk.destroy();
  chartProduk = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: top.map(p => p.nama),
      datasets: [{
        label: 'Qty Terjual',
        data: top.map(p => p.qty),
        backgroundColor: CHART_BAR,
        hoverBackgroundColor: CHART_BAR_HOVER,
        borderRadius: 8,
        maxBarThickness: 44
      }]
    },
    options: {
      plugins: { legend: { display: false }, tooltip: CHART_TOOLTIP },
      scales: {
        y: { beginAtZero: true, ticks: { color: CHART_TEXT }, grid: { color: CHART_GRID }, border: { display: false } },
        x: { ticks: { color: CHART_TEXT }, grid: { display: false }, border: { display: false } }
      }
    }
  });
}
