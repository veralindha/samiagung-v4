let HARGA_TODAY = null;
let PJ_PRODUK_CACHE = [];
let PJ_SUBPRODUK_CACHE = [];
let PJ_PELANGGAN_CACHE = [];
let PJ_KENDARAAN_CACHE = [];
let PJ_SOPIR_CACHE = [];
let CART = [];
let PENJUALAN_GROUPED_CACHE = [];
let CURRENT_DETAIL_SJ = null;

function loadPenjualanPage() {
  serverCall('getPenjualanPageInitData', [], function (data) {
    PJ_PRODUK_CACHE = data.produkList;
    populateFilterProdukSelect(data.produkList);
    populateItemProdukSelect(data.produkList);

    PJ_SUBPRODUK_CACHE = data.subProdukList;

    PJ_PELANGGAN_CACHE = data.pelangganList;
    populatePelangganSelect(data.pelangganList);

    PJ_KENDARAAN_CACHE = data.kendaraanList;
    populateKendaraanSelect(data.kendaraanList);

    PJ_SOPIR_CACHE = data.sopirList;
    populateSopirSelect(data.sopirList);

    HARGA_TODAY = data.hargaHariIni;
    renderHargaStatus(data.hargaHariIni);

    applyPenjualanRows(data.penjualanList);
  });
}

function populateFilterProdukSelect(list) {
  const sel = document.getElementById('filter-produk');
  sel.innerHTML = '<option value="">Semua Produk</option>' +
    list.map(p => `<option value="${p.ID}">${p.NamaProduk}</option>`).join('');
}

function populateItemProdukSelect(list) {
  const sel = document.getElementById('item-produk');
  sel.innerHTML = '<option value="">-- Pilih Produk --</option>' +
    list.map(p => `<option value="${p.ID}">${p.NamaProduk}</option>`).join('');
}

function populatePelangganSelect(list) {
  const sel = document.getElementById('sj-pelanggan');
  if (list.length === 0) {
    sel.innerHTML = '<option value="">-- Belum ada pelanggan --</option>';
    return;
  }
  sel.innerHTML = '<option value="">-- Pilih Pelanggan --</option>' +
    list.map(p => `<option value="${p.ID}">${p.Nama}</option>`).join('');
}

function populateKendaraanSelect(list) {
  const sel = document.getElementById('sj-kendaraan-select');
  sel.innerHTML = '<option value="">-- Pilih Kendaraan --</option>' +
    list.map(k => `<option value="${k.NomorKendaraan}">${k.NomorKendaraan}${k.Keterangan ? ' (' + k.Keterangan + ')' : ''}</option>`).join('') +
    '<option value="__custom__">✏️ Input Manual...</option>';
}

function populateSopirSelect(list) {
  const sel = document.getElementById('sj-sopir-select');
  sel.innerHTML = '<option value="">-- Pilih Sopir --</option>' +
    list.map(s => `<option value="${s.Nama}">${s.Nama}</option>`).join('') +
    '<option value="__custom__">✏️ Input Manual...</option>';
}

function onKendaraanSelectChange() {
  const sel = document.getElementById('sj-kendaraan-select');
  const custom = document.getElementById('sj-kendaraan-custom');
  custom.style.display = sel.value === '__custom__' ? 'block' : 'none';
  if (sel.value === '__custom__') custom.focus();
}

function onSopirSelectChange() {
  const sel = document.getElementById('sj-sopir-select');
  const custom = document.getElementById('sj-sopir-custom');
  custom.style.display = sel.value === '__custom__' ? 'block' : 'none';
  if (sel.value === '__custom__') custom.focus();
}

function getKendaraanTextValue() {
  const sel = document.getElementById('sj-kendaraan-select');
  if (sel.value === '__custom__') return document.getElementById('sj-kendaraan-custom').value.trim();
  return sel.value;
}

function getSopirTextValue() {
  const sel = document.getElementById('sj-sopir-select');
  if (sel.value === '__custom__') return document.getElementById('sj-sopir-custom').value.trim();
  return sel.value;
}

/* ============================================================
 * HARGA HARI INI (per Sub Produk)
 * ============================================================ */
function refreshHargaHariIni() {
  serverCall('getHargaHariIni', [], function (data) {
    HARGA_TODAY = data;
    renderHargaStatus(data);
  });
}

function renderHargaStatus(data) {
  const badge = document.getElementById('harga-status-badge');
  const preview = document.getElementById('harga-preview-list');
  const notice = document.getElementById('item-locked-notice');
  const formWrap = document.getElementById('item-form-wrap');

  if (data.harga.length === 0) {
    notice.style.display = 'block';
    formWrap.style.display = 'none';
    preview.innerHTML = '<div class="empty-state" style="padding:14px;">Belum ada sub produk. Tambahkan dulu di menu Produk &amp; Sub Produk.</div>';
    badge.className = 'badge badge-red';
    badge.textContent = 'Belum Ada Sub Produk';
    return;
  }

  notice.style.display = 'none';
  formWrap.style.display = 'block';

  if (data.sudahSetup) {
    badge.className = 'badge badge-green';
    badge.textContent = 'Sudah Disetup';
  } else {
    badge.className = 'badge badge-red';
    badge.textContent = 'Belum Lengkap';
  }

  preview.innerHTML = '<div style="display:flex; flex-wrap:wrap; gap:8px;">' +
    data.harga.map(h => `
      <span class="badge ${h.harga !== '' ? 'badge-gold' : 'badge-red'}">
        ${h.namaProduk} - ${h.namaSubProduk}: ${h.harga !== '' ? formatRupiah(h.harga) : 'belum diset'}
      </span>
    `).join('') + '</div>';
}

function openHargaModal() {
  document.getElementById('harga-modal-tanggal').textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const data = HARGA_TODAY || { harga: [] };
  const list = document.getElementById('harga-modal-list');

  if (data.harga.length === 0) {
    list.innerHTML = '<div class="empty-state" style="padding:14px;">Belum ada sub produk. Tambahkan dulu di menu Produk &amp; Sub Produk.</div>';
  } else {
    list.innerHTML = data.harga.map(h => `
      <div class="form-group">
        <label>${h.namaProduk} - ${h.namaSubProduk}</label>
        <input type="number" class="form-control harga-input" data-subproduk-id="${h.subProdukId}" data-subproduk-nama="${h.namaSubProduk}" data-produk-id="${h.produkId}" data-produk-nama="${h.namaProduk}" min="0" placeholder="0" value="${h.harga}">
      </div>
    `).join('');
  }
  openModal('modal-harga');
}

function saveHargaHariIni() {
  const inputs = document.querySelectorAll('.harga-input');
  const list = [];
  let hasEmpty = false;
  inputs.forEach(inp => {
    const val = inp.value;
    if (val === '' || Number(val) <= 0) hasEmpty = true;
    list.push({
      subProdukId: inp.dataset.subprodukId,
      namaSubProduk: inp.dataset.subprodukNama,
      produkId: inp.dataset.produkId,
      namaProduk: inp.dataset.produkNama,
      harga: val || 0
    });
  });

  if (hasEmpty) { showToast('Isi semua harga sub produk dengan nilai lebih dari 0.', true); return; }

  const btn = document.getElementById('btn-simpan-harga');
  btn.disabled = true;
  serverCall('setHargaHariIni', [list], function (res) {
    btn.disabled = false;
    if (res.success) {
      showToast('Harga hari ini berhasil disimpan.');
      closeModal('modal-harga');
      refreshHargaHariIni();
    } else {
      showToast('Gagal menyimpan harga.', true);
    }
  }, function () { btn.disabled = false; });
}

/* ============================================================
 * FORM TAMBAH ITEM KE KERANJANG
 * ============================================================ */
function onItemProdukChange() {
  const produkId = document.getElementById('item-produk').value;
  const subSel = document.getElementById('item-subproduk');

  if (!produkId) {
    subSel.innerHTML = '<option value="">-- Pilih Produk Dulu --</option>';
    subSel.disabled = true;
    resetItemHargaArea();
    return;
  }

  const subList = PJ_SUBPRODUK_CACHE.filter(s => s.ProdukID === produkId);
  if (subList.length === 0) {
    subSel.innerHTML = '<option value="">-- Belum ada sub produk --</option>';
    subSel.disabled = true;
    resetItemHargaArea();
    return;
  }

  subSel.disabled = false;
  subSel.innerHTML = '<option value="">-- Pilih Sub Produk --</option>' +
    subList.map(s => `<option value="${s.ID}">${s.NamaSubProduk}</option>`).join('');
  resetItemHargaArea();
}

function resetItemHargaArea() {
  document.getElementById('item-custom-harga-toggle').checked = false;
  document.getElementById('item-harga').value = '';
  document.getElementById('item-harga').disabled = true;
  document.getElementById('item-harga-hint').textContent = 'Mengikuti harga hari ini';
  document.getElementById('item-total-display').value = 'Rp 0';
}

function updateItemHargaPreview() {
  const subProdukId = document.getElementById('item-subproduk').value;
  const toggle = document.getElementById('item-custom-harga-toggle');
  const hargaInput = document.getElementById('item-harga');
  const hint = document.getElementById('item-harga-hint');

  if (!subProdukId) { resetItemHargaArea(); return; }

  const hargaItem = HARGA_TODAY ? HARGA_TODAY.harga.find(h => h.subProdukId === subProdukId) : null;
  const sudahAda = hargaItem && hargaItem.harga !== '';

  if (sudahAda) {
    hargaInput.value = hargaItem.harga;
    toggle.checked = false;
    toggle.disabled = false;
    hargaInput.disabled = true;
    hint.textContent = 'Mengikuti harga hari ini: ' + formatRupiah(hargaItem.harga);
  } else {
    hargaInput.value = '';
    toggle.checked = true;
    toggle.disabled = true;
    hargaInput.disabled = false;
    hint.textContent = 'Harga belum di-setup hari ini — wajib isi harga custom.';
  }
  updateItemTotal();
}

function toggleItemCustomHarga() {
  const toggle = document.getElementById('item-custom-harga-toggle');
  const hargaInput = document.getElementById('item-harga');
  const subProdukId = document.getElementById('item-subproduk').value;

  if (toggle.checked) {
    hargaInput.disabled = false;
    if (!subProdukId) hargaInput.value = '';
    hargaInput.focus();
  } else {
    const hargaItem = HARGA_TODAY ? HARGA_TODAY.harga.find(h => h.subProdukId === subProdukId) : null;
    if (hargaItem && hargaItem.harga !== '') {
      hargaInput.value = hargaItem.harga;
      hargaInput.disabled = true;
    }
  }
  updateItemTotal();
}

function updateItemTotal() {
  const harga = Number(document.getElementById('item-harga').value || 0);
  const qty = Number(document.getElementById('item-qty').value || 0);
  document.getElementById('item-total-display').value = formatRupiah(harga * qty);
}

function addItemToCart() {
  const produkId = document.getElementById('item-produk').value;
  const subProdukId = document.getElementById('item-subproduk').value;
  const qty = Number(document.getElementById('item-qty').value || 0);
  const harga = Number(document.getElementById('item-harga').value || 0);
  const isCustom = document.getElementById('item-custom-harga-toggle').checked;

  if (!produkId || !subProdukId) { showToast('Pilih produk dan sub produk terlebih dahulu.', true); return; }
  if (!qty || qty <= 0) { showToast('Qty harus lebih dari 0.', true); return; }
  if (!harga || harga <= 0) { showToast('Harga belum terisi. Gunakan custom harga jika belum di-setup.', true); return; }

  const produk = PJ_PRODUK_CACHE.find(p => p.ID === produkId);
  const sub = PJ_SUBPRODUK_CACHE.find(s => s.ID === subProdukId);

  CART.push({
    subProdukId: subProdukId,
    namaSubProduk: sub.NamaSubProduk,
    produkId: produkId,
    namaProduk: produk.NamaProduk,
    satuan: produk.Satuan,
    qty: qty,
    harga: harga,
    isCustomHarga: isCustom,
    total: harga * qty
  });

  renderCart();

  document.getElementById('item-produk').value = '';
  document.getElementById('item-subproduk').innerHTML = '<option value="">-- Pilih Produk Dulu --</option>';
  document.getElementById('item-subproduk').disabled = true;
  document.getElementById('item-qty').value = '';
  resetItemHargaArea();

  showToast('Item ditambahkan ke daftar kirim.');
}

function renderCart() {
  const wrap = document.getElementById('cart-list');
  const totalRow = document.getElementById('cart-total-row');

  if (CART.length === 0) {
    wrap.innerHTML = '<div class="cart-empty">Belum ada produk di daftar kirim.</div>';
    totalRow.style.display = 'none';
    return;
  }

  let grandTotal = 0;
  wrap.innerHTML = CART.map((item, idx) => {
    grandTotal += item.total;
    return `
      <div class="cart-item">
        <div>
          <div class="cart-item-label">Produk</div>
          <strong>${item.namaProduk}</strong> — ${item.namaSubProduk} ${item.isCustomHarga ? '<span class="badge badge-gold badge-sm">custom</span>' : ''}
        </div>
        <div>
          <div class="cart-item-label">Harga</div>
          ${formatRupiah(item.harga)}
        </div>
        <div>
          <div class="cart-item-label">Qty</div>
          ${item.qty} ${item.satuan}
        </div>
        <div>
          <div class="cart-item-label">Subtotal</div>
          <strong>${formatRupiah(item.total)}</strong>
        </div>
        <div></div>
        <div style="text-align:right;">
          <button class="btn-icon" onclick="removeCartItem(${idx})">🗑️</button>
        </div>
      </div>
    `;
  }).join('');

  totalRow.style.display = 'flex';
  document.getElementById('cart-grand-total').textContent = formatRupiah(grandTotal);
}

function removeCartItem(idx) {
  CART.splice(idx, 1);
  renderCart();
}

/* ============================================================
 * SUBMIT SURAT JALAN
 * ============================================================ */
function submitSuratJalan() {
  if (CART.length === 0) { showToast('Daftar kirim masih kosong.', true); return; }

  const pelangganId = document.getElementById('sj-pelanggan').value;
  const kendaraanText = getKendaraanTextValue();
  const sopirText = getSopirTextValue();

  if (!pelangganId) { showToast('Pilih pelanggan terlebih dahulu.', true); return; }
  if (!kendaraanText) { showToast('Nomor kendaraan wajib diisi.', true); return; }
  if (!sopirText) { showToast('Nama sopir wajib diisi.', true); return; }

  const items = CART.map(item => ({
    subProdukId: item.subProdukId,
    qty: item.qty,
    hargaOverride: item.isCustomHarga ? item.harga : null
  }));

  const btn = document.getElementById('btn-submit-sj');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Menyimpan...';

  serverCall('submitSuratJalan', [{ pelangganId, kendaraanText, sopirText, items }], function (res) {
    btn.disabled = false;
    btn.innerHTML = '🖨️ Simpan &amp; Cetak Surat Jalan';
    if (res.success) {
      showToast('Surat jalan ' + res.noSuratJalan + ' berhasil disimpan.');
      downloadBase64PDF(res.pdfBase64, res.pdfFilename);
      CART = [];
      renderCart();
      document.getElementById('sj-pelanggan').value = '';
      document.getElementById('sj-kendaraan-select').value = '';
      document.getElementById('sj-kendaraan-custom').value = '';
      document.getElementById('sj-kendaraan-custom').style.display = 'none';
      document.getElementById('sj-sopir-select').value = '';
      document.getElementById('sj-sopir-custom').value = '';
      document.getElementById('sj-sopir-custom').style.display = 'none';
      loadPenjualanTable();
      refreshHargaHariIni();
    } else {
      showToast(res.message || 'Gagal menyimpan surat jalan.', true);
    }
  }, function () { btn.disabled = false; btn.innerHTML = '🖨️ Simpan &amp; Cetak Surat Jalan'; });
}

/* ============================================================
 * TABEL RIWAYAT (grouped per No. Surat Jalan)
 * ============================================================ */
function getPenjualanFilter() {
  return {
    produkId: document.getElementById('filter-produk').value,
    produkNama: document.getElementById('filter-produk').selectedOptions[0].text,
    dari: document.getElementById('filter-dari').value,
    sampai: document.getElementById('filter-sampai').value
  };
}

function resetFilterPenjualan() {
  document.getElementById('filter-produk').value = '';
  document.getElementById('filter-dari').value = '';
  document.getElementById('filter-sampai').value = '';
  loadPenjualanTable();
}

function loadPenjualanTable() {
  const filter = getPenjualanFilter();
  serverCall('getPenjualanList', [filter], function (rows) {
    applyPenjualanRows(rows);
  });
}

function applyPenjualanRows(rows) {
  PENJUALAN_GROUPED_CACHE = groupByNoSuratJalan(rows);
  renderPenjualanTable(PENJUALAN_GROUPED_CACHE);
}

function groupByNoSuratJalan(rows) {
  const map = {};
  const order = [];
  rows.forEach(r => {
    if (!map[r.NoSuratJalan]) {
      map[r.NoSuratJalan] = {
        noSuratJalan: r.NoSuratJalan,
        tanggal: r.Tanggal,
        namaPelanggan: r.NamaPelanggan,
        nomorKendaraan: r.NomorKendaraan,
        namaSopir: r.NamaSopir,
        items: [],
        total: 0
      };
      order.push(r.NoSuratJalan);
    }
    map[r.NoSuratJalan].items.push(r);
    map[r.NoSuratJalan].total += Number(r.Total);
  });
  return order.map(k => map[k]);
}

function renderPenjualanTable(groups) {
  const body = document.getElementById('penjualan-table-body');
  const summary = document.getElementById('penjualan-summary');

  if (!groups || groups.length === 0) {
    body.innerHTML = '<tr class="empty-row"><td colspan="7">📭 Belum ada surat jalan pada periode/filter ini.</td></tr>';
    summary.textContent = '';
    return;
  }

  let grandTotal = 0;
  body.innerHTML = groups.map(g => {
    grandTotal += g.total;
    return `
      <tr>
        <td><strong>${g.noSuratJalan}</strong></td>
        <td>${g.tanggal}</td>
        <td>${g.namaPelanggan}</td>
        <td>${g.items.length} item</td>
        <td>${g.nomorKendaraan}<br><span style="color:var(--text-400); font-size:12px;">${g.namaSopir}</span></td>
        <td><strong>${formatRupiah(g.total)}</strong></td>
        <td>
          <div class="table-actions" style="justify-content:flex-end;">
            <button class="btn-icon" onclick="viewDetailSuratJalan('${g.noSuratJalan}')">👁️</button>
            <button class="btn-icon" onclick="handleDeleteSuratJalan('${g.noSuratJalan}')">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  summary.textContent = 'Total: ' + formatRupiah(grandTotal) + ' (' + groups.length + ' surat jalan)';
}

function viewDetailSuratJalan(noSuratJalan) {
  const g = PENJUALAN_GROUPED_CACHE.find(x => x.noSuratJalan === noSuratJalan);
  if (!g) return;
  CURRENT_DETAIL_SJ = noSuratJalan;

  document.getElementById('detail-sj-title').textContent = 'Detail Surat Jalan ' + g.noSuratJalan;
  document.getElementById('detail-sj-body').innerHTML = `
    <p style="margin-top:0; font-size:13.5px;">
      <strong>Pelanggan:</strong> ${g.namaPelanggan}<br>
      <strong>Tanggal:</strong> ${g.tanggal}<br>
      <strong>Kendaraan:</strong> ${g.nomorKendaraan} &nbsp;|&nbsp; <strong>Sopir:</strong> ${g.namaSopir}
    </p>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Produk</th><th>Sub Produk</th><th>Qty</th><th>Harga</th><th>Total</th></tr></thead>
        <tbody>
          ${g.items.map(it => `
            <tr>
              <td>${it.NamaProduk}</td>
              <td>${it.NamaSubProduk}</td>
              <td>${it.Qty} ${it.Satuan}</td>
              <td>${formatRupiah(it.Harga)}</td>
              <td>${formatRupiah(it.Total)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div style="text-align:right; margin-top:10px; font-weight:700;">Total: ${formatRupiah(g.total)}</div>
  `;
  openModal('modal-detail-sj');
}

function handleReprintSuratJalan() {
  if (!CURRENT_DETAIL_SJ) return;
  const btn = document.getElementById('btn-reprint-sj');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Membuat PDF...';

  serverCall('reprintSuratJalan', [CURRENT_DETAIL_SJ], function (res) {
    btn.disabled = false;
    btn.innerHTML = '🖨️ Cetak Ulang';
    if (res.success) {
      downloadBase64PDF(res.pdfBase64, res.pdfFilename);
      showToast('Surat jalan berhasil dicetak ulang.');
    } else {
      showToast(res.message || 'Gagal mencetak ulang.', true);
    }
  }, function () { btn.disabled = false; btn.innerHTML = '🖨️ Cetak Ulang'; });
}

function handleDeleteSuratJalan(noSuratJalan) {
  confirmAction('Hapus Surat Jalan', 'Menghapus surat jalan ' + noSuratJalan + ' akan mengembalikan stok seluruh item di dalamnya. Lanjutkan?', function () {
    serverCall('deleteSuratJalan', [noSuratJalan], function (res) {
      if (res.success) {
        showToast('Surat jalan berhasil dihapus.');
        loadPenjualanTable();
      } else {
        showToast(res.message || 'Gagal menghapus surat jalan.', true);
      }
    });
  });
}

/* ============================================================
 * EXPORT LAPORAN PDF (tabel flat, sesuai filter)
 * ============================================================ */
function exportPenjualanToPDF() {
  const filter = getPenjualanFilter();
  const btn = document.getElementById('btn-export-pdf');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Membuat PDF...';

  serverCall('exportPenjualanPDF', [filter], function (res) {
    btn.disabled = false;
    btn.innerHTML = '📄 Export Laporan PDF';
    if (res.success) {
      downloadBase64PDF(res.base64, res.filename);
      showToast('PDF laporan berhasil dibuat dan diunduh.');
    } else {
      showToast('Gagal membuat PDF.', true);
    }
  }, function () { btn.disabled = false; btn.innerHTML = '📄 Export Laporan PDF'; });
}
