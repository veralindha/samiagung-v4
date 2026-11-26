let SUPPLIER_CACHE = [];

function loadSupplierPage() {
  serverCall('getSupplierList', [], function (list) {
    SUPPLIER_CACHE = list;
    renderSupplierTable(list);
  });
}

function renderSupplierTable(list) {
  const body = document.getElementById('supplier-table-body');
  if (!list || list.length === 0) {
    body.innerHTML = '<tr class="empty-row"><td colspan="4">📭 Belum ada supplier. Klik "Tambah Supplier" untuk memulai.</td></tr>';
    return;
  }
  body.innerHTML = list.map(p => `
    <tr>
      <td><strong>${p.Nama}</strong></td>
      <td>${p.Kontak || '-'}</td>
      <td>${p.Alamat || '-'}</td>
      <td>
        <div class="table-actions" style="justify-content:flex-end;">
          <button class="btn-icon" onclick="openSupplierModal('${p.ID}')">✏️</button>
          <button class="btn-icon" onclick="handleDeleteSupplier('${p.ID}', '${String(p.Nama).replace(/'/g, "\\'")}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterSupplierTable() {
  const q = document.getElementById('supplier-search').value.toLowerCase().trim();
  if (!q) { renderSupplierTable(SUPPLIER_CACHE); return; }
  const filtered = SUPPLIER_CACHE.filter(p =>
    String(p.Nama || '').toLowerCase().includes(q) || String(p.Kontak || '').toLowerCase().includes(q)
  );
  renderSupplierTable(filtered);
}

function openSupplierModal(id) {
  document.getElementById('supplier-id').value = '';
  document.getElementById('supplier-nama').value = '';
  document.getElementById('supplier-kontak').value = '';
  document.getElementById('supplier-alamat').value = '';
  document.getElementById('modal-supplier-title').textContent = 'Tambah Supplier';

  if (id) {
    const p = SUPPLIER_CACHE.find(x => x.ID === id);
    if (p) {
      document.getElementById('supplier-id').value = p.ID;
      document.getElementById('supplier-nama').value = p.Nama;
      document.getElementById('supplier-kontak').value = p.Kontak;
      document.getElementById('supplier-alamat').value = p.Alamat;
      document.getElementById('modal-supplier-title').textContent = 'Edit Supplier';
    }
  }
  openModal('modal-supplier');
}

function saveSupplier() {
  const id = document.getElementById('supplier-id').value;
  const nama = document.getElementById('supplier-nama').value.trim();
  const kontak = document.getElementById('supplier-kontak').value.trim();
  const alamat = document.getElementById('supplier-alamat').value.trim();

  if (!nama) { showToast('Nama supplier wajib diisi.', true); return; }

  const btn = document.getElementById('btn-simpan-supplier');
  btn.disabled = true;

  const data = { id: id, nama: nama, kontak: kontak, alamat: alamat };
  const fn = id ? 'updateSupplier' : 'addSupplier';

  serverCall(fn, [data], function (res) {
    btn.disabled = false;
    if (res.success) {
      showToast(id ? 'Supplier berhasil diperbarui.' : 'Supplier berhasil ditambahkan.');
      closeModal('modal-supplier');
      loadSupplierPage();
    } else {
      showToast(res.message || 'Gagal menyimpan supplier.', true);
    }
  }, function () { btn.disabled = false; });
}

function handleDeleteSupplier(id, nama) {
  confirmAction('Hapus Supplier', 'Yakin ingin menghapus supplier "' + nama + '"?', function () {
    serverCall('deleteSupplier', [id], function (res) {
      if (res.success) {
        showToast('Supplier berhasil dihapus.');
        loadSupplierPage();
      } else {
        showToast(res.message || 'Gagal menghapus supplier.', true);
      }
    });
  });
}
