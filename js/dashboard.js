let chartBulanan = null;
let chartProduk = null;

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

  if (chartBulanan) chartBulanan.destroy();
  chartBulanan = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Omzet',
        data: values,
        borderColor: '#c9962b',
        backgroundColor: 'rgba(201,150,43,0.12)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#1f4d3d',
        pointRadius: 4
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { callback: v => 'Rp ' + (v/1000) + 'rb' }, grid: { color: '#eef1f0' } },
        x: { grid: { display: false } }
      }
    }
  });
}

function renderChartProduk(list) {
  const ctx = document.getElementById('chart-produk');
  const top = list.slice(0, 6);
  if (chartProduk) chartProduk.destroy();
  chartProduk = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: top.map(p => p.nama),
      datasets: [{
        label: 'Qty Terjual',
        data: top.map(p => p.qty),
        backgroundColor: '#2a6650',
        borderRadius: 6,
        maxBarThickness: 34
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#eef1f0' } },
        x: { grid: { display: false } }
      }
    }
  });
}
