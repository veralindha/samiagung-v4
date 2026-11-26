let PRODUK_CACHE = [];
let SUBPRODUK_CACHE = [];
let SUPPLIER_CACHE_FOR_RESTOK = [];
const openGroups = {};

function loadProdukPage() {
  serverCall('getProdukPageInitData', [], function (data) {
    PRODUK_CACHE = data.produkList;
    SUBPRODUK_CACHE = data.subProdukList;
    renderProdukGroups();
  });
}

function renderProdukGroups() {
  const wrap = document.getElementById('produk-list-wrap');
  try {
    if (!PRODUK_CACHE || PRODUK_CACHE.length === 0) {
      wrap.innerHTML = '<div class="card"><div class="empty-state"><div class="emoji">📭</div>Belum ada produk. Klik "Tambah Produk" untuk memulai.</div></div>';
      return;
    }

    wrap.innerHTML = PRODUK_CACHE.map(p => {
      const namaProduk = String(p.NamaProduk || '(tanpa nama)');
      const namaProdukEsc = namaProduk.replace(/'/g, "\\'");
      const menipis = Number(p.Stok) <= Number(p.StokMinimum);
      const subList = (SUBPRODUK_CACHE || []).filter(s => s.ProdukID === p.ID);
      const isOpen = !!openGroups[p.ID];

      return `
        <div class="produk-group">
          <div class="produk-group-header" onclick="toggleProdukGroup('${p.ID}')">
            <div class="produk-group-title">
              <span class="caret ${isOpen ? 'open' : ''}" id="caret-${p.ID}">▶</span>
              ${namaProduk}
            </div>
            <div class="produk-group-meta">
              <span class="badge ${menipis ? 'badge-red' : 'badge-green'}">${p.Stok} ${p.Satuan} ${menipis ? '(menipis)' : ''}</span>
              <span class="badge badge-gold badge-sm">${subList.length} sub produk</span>
              <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); openRestokModal('${p.ID}')">🚚 Restok</button>
              <button class="btn-icon" onclick="event.stopPropagation(); openKoreksiModal('${p.ID}')">⚖️</button>
              <button class="btn-icon" onclick="event.stopPropagation(); openProdukModal('${p.ID}')">✏️</button>
              <button class="btn-icon" onclick="event.stopPropagation(); handleDeleteProduk('${p.ID}', '${namaProdukEsc}')">🗑️</button>
            </div>
          </div>
          <div class="produk-group-body ${isOpen ? 'open' : ''}" id="body-${p.ID}">
            <div style="display:flex; justify-content:flex-end; margin-bottom:8px;">
              <button class="btn btn-sm btn-gold" onclick="openSubProdukModal('${p.ID}', '${namaProdukEsc}')">➕ Sub Produk</button>
            </div>
            ${subList.length === 0
              ? '<div class="empty-state" style="padding:14px;">Belum ada sub produk untuk "' + namaProduk + '".</div>'
              : subList.map(s => {
                  const namaSub = String(s.NamaSubProduk || '(tanpa nama)');
                  const namaSubEsc = namaSub.replace(/'/g, "\\'");
                  return `
                  <div class="subproduk-chip-row">
                    <span>🔸 ${namaSub}</span>
                    <div class="table-actions">
                      <button class="btn-icon" onclick="openSubProdukModal('${p.ID}', '${namaProdukEsc}', '${s.ID}')">✏️</button>
                      <button class="btn-icon" onclick="handleDeleteSubProduk('${s.ID}', '${namaSubEsc}')">🗑️</button>
                    </div>
                  </div>
                `;
                }).join('')
            }
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('renderProdukGroups error:', err);
    wrap.innerHTML = '<div class="card"><div class="empty-state"><div class="emoji">⚠️</div>Gagal menampilkan data produk.<br><span style="font-size:12px; color:var(--text-500);">' + (err && err.message ? err.message : err) + '</span><br><button class="btn btn-sm btn-outline" style="margin-top:10px;" onclick="loadProdukPage()">🔄 Coba Lagi</button></div></div>';
  }
}

function toggleProdukGroup(id) {
  openGroups[id] = !openGroups[id];
  document.getElementById('body-' + id).classList.toggle('open', openGroups[id]);
  document.getElementById('caret-' + id).classList.toggle('open', openGroups[id]);
}

/* ============================================================
 * PRODUK INDUK CRUD
 * ============================================================ */
function openProdukModal(id) {
  document.getElementById('produk-id').value = '';
  document.getElementById('produk-nama').value = '';
  document.getElementById('produk-satuan').value = '';
  document.getElementById('produk-stok').value = '';
  document.getElementById('produk-stok-min').value = '';
  document.getElementById('modal-produk-title').textContent = 'Tambah Produk';

  if (id) {
    const p = PRODUK_CACHE.find(x => x.ID === id);
    if (p) {
      document.getElementById('produk-id').value = p.ID;
      document.getElementById('produk-nama').value = p.NamaProduk;
      document.getElementById('produk-satuan').value = p.Satuan;
      document.getElementById('produk-stok').value = p.Stok;
      document.getElementById('produk-stok-min').value = p.StokMinimum;
      document.getElementById('modal-produk-title').textContent = 'Edit Produk';
    }
  }
  openModal('modal-produk');
}

function saveProduk() {
  const id = document.getElementById('produk-id').value;
  const nama = document.getElementById('produk-nama').value.trim();
  const satuan = document.getElementById('produk-satuan').value.trim();
  const stok = document.getElementById('produk-stok').value;
  const stokMin = document.getElementById('produk-stok-min').value;

  if (!nama || !satuan) { showToast('Nama produk dan satuan wajib diisi.', true); return; }

  const btn = document.getElementById('btn-simpan-produk');
  btn.disabled = true;

  const data = { id: id, namaProduk: nama, satuan: satuan, stok: stok || 0, stokMinimum: stokMin || 0 };
  const fn = id ? 'updateProduk' : 'addProduk';

  serverCall(fn, [data], function (res) {
    btn.disabled = false;
    if (res.success) {
      showToast(id ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan.');
      closeModal('modal-produk');
      loadProdukPage();
    } else {
      showToast(res.message || 'Gagal menyimpan produk.', true);
    }
  }, function () { btn.disabled = false; });
}

function handleDeleteProduk(id, nama) {
  confirmAction('Hapus Produk', 'Yakin ingin menghapus produk "' + nama + '"? Pastikan semua sub produknya sudah dihapus terlebih dahulu.', function () {
    serverCall('deleteProduk', [id], function (res) {
      if (res.success) {
        showToast('Produk berhasil dihapus.');
        loadProdukPage();
      } else {
        showToast(res.message || 'Gagal menghapus produk.', true);
      }
    });
  });
}

/* ============================================================
 * SUB PRODUK CRUD
 * ============================================================ */
function openSubProdukModal(produkId, produkNama, subId) {
  document.getElementById('subproduk-id').value = '';
  document.getElementById('subproduk-produk-id').value = produkId;
  document.getElementById('subproduk-produk-nama').textContent = produkNama;
  document.getElementById('subproduk-nama').value = '';
  document.getElementById('modal-subproduk-title').textContent = 'Tambah Sub Produk';

  if (subId) {
    const s = SUBPRODUK_CACHE.find(x => x.ID === subId);
    if (s) {
      document.getElementById('subproduk-id').value = s.ID;
      document.getElementById('subproduk-nama').value = s.NamaSubProduk;
      document.getElementById('modal-subproduk-title').textContent = 'Edit Sub Produk';
    }
  }
  openModal('modal-subproduk');
}

function saveSubProduk() {
  const id = document.getElementById('subproduk-id').value;
  const produkId = document.getElementById('subproduk-produk-id').value;
  const nama = document.getElementById('subproduk-nama').value.trim();

  if (!nama) { showToast('Nama sub produk wajib diisi.', true); return; }

  const btn = document.getElementById('btn-simpan-subproduk');
  btn.disabled = true;

  const data = { id: id, produkId: produkId, namaSubProduk: nama };
  const fn = id ? 'updateSubProduk' : 'addSubProduk';

  serverCall(fn, [data], function (res) {
    btn.disabled = false;
    if (res.success) {
      showToast(id ? 'Sub produk berhasil diperbarui.' : 'Sub produk berhasil ditambahkan.');
      closeModal('modal-subproduk');
      openGroups[produkId] = true;
      loadProdukPage();
    } else {
      showToast(res.message || 'Gagal menyimpan sub produk.', true);
    }
  }, function () { btn.disabled = false; });
}

function handleDeleteSubProduk(id, nama) {
  confirmAction('Hapus Sub Produk', 'Yakin ingin menghapus sub produk "' + nama + '"?', function () {
    serverCall('deleteSubProduk', [id], function (res) {
      if (res.success) {
        showToast('Sub produk berhasil dihapus.');
        loadProdukPage();
      } else {
        showToast(res.message || 'Gagal menghapus sub produk.', true);
      }
    });
  });
}

/* ============================================================
 * RESTOK (butuh Supplier)
 * ============================================================ */
function openRestokModal(produkId) {
  const p = PRODUK_CACHE.find(x => x.ID === produkId);
  if (!p) return;
  document.getElementById('restok-produk-id').value = p.ID;
  document.getElementById('restok-produk-nama').textContent = p.NamaProduk;
  document.getElementById('restok-produk-current').textContent = p.Stok + ' ' + p.Satuan;
  document.getElementById('restok-qty').value = '';
  document.getElementById('restok-catatan').value = '';

  serverCall('getSupplierList', [], function (list) {
    SUPPLIER_CACHE_FOR_RESTOK = list;
    const sel = document.getElementById('restok-supplier');
    const hint = document.getElementById('restok-no-supplier-hint');
    if (list.length === 0) {
      sel.innerHTML = '<option value="">-- Belum ada supplier --</option>';
      hint.style.display = 'block';
    } else {
      sel.innerHTML = '<option value="">-- Pilih Supplier --</option>' + list.map(s => `<option value="${s.ID}">${s.Nama}</option>`).join('');
      hint.style.display = 'none';
    }
    openModal('modal-restok');
  });
}

function submitRestok() {
  const produkId = document.getElementById('restok-produk-id').value;
  const supplierId = document.getElementById('restok-supplier').value;
  const qty = document.getElementById('restok-qty').value;
  const catatan = document.getElementById('restok-catatan').value.trim();

  if (!supplierId) { showToast('Pilih supplier terlebih dahulu.', true); return; }
  if (!qty || Number(qty) <= 0) { showToast('Jumlah masuk harus lebih dari 0.', true); return; }

  serverCall('restokProduk', [{ produkId, supplierId, qty, catatan }], function (res) {
    if (res.success) {
      showToast('Restok berhasil disimpan. Stok baru: ' + res.stokBaru);
      closeModal('modal-restok');
      loadProdukPage();
    } else {
      showToast(res.message || 'Gagal menyimpan restok.', true);
    }
  });
}

/* ============================================================
 * KOREKSI STOK (tanpa supplier)
 * ============================================================ */
function openKoreksiModal(produkId) {
  const p = PRODUK_CACHE.find(x => x.ID === produkId);
  if (!p) return;
  document.getElementById('koreksi-produk-id').value = p.ID;
  document.getElementById('koreksi-produk-nama').textContent = p.NamaProduk;
  document.getElementById('koreksi-produk-current').textContent = p.Stok + ' ' + p.Satuan;
  document.getElementById('koreksi-jenis').value = 'tambah';
  document.getElementById('koreksi-jumlah').value = '';
  openModal('modal-koreksi');
}

function submitKoreksiStok() {
  const produkId = document.getElementById('koreksi-produk-id').value;
  const jenis = document.getElementById('koreksi-jenis').value;
  let jumlah = Number(document.getElementById('koreksi-jumlah').value);
  if (!jumlah || jumlah <= 0) { showToast('Jumlah harus lebih dari 0.', true); return; }
  if (jenis === 'kurang') jumlah = -jumlah;

  serverCall('koreksiStok', [produkId, jumlah], function (res) {
    if (res.success) {
      showToast('Stok berhasil disesuaikan.');
      closeModal('modal-koreksi');
      loadProdukPage();
    } else {
      showToast(res.message || 'Gagal menyesuaikan stok.', true);
    }
  });
}
