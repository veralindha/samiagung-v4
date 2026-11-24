let PELANGGAN_CACHE = [];

function loadPelangganPage() {
  serverCall('getPelangganList', [], function (list) {
    PELANGGAN_CACHE = list;
    renderPelangganTable(list);
  });
}

function renderPelangganTable(list) {
  const body = document.getElementById('pelanggan-table-body');
  if (!list || list.length === 0) {
    body.innerHTML = '<tr class="empty-row"><td colspan="4">📭 Belum ada pelanggan. Klik "Tambah Pelanggan" untuk memulai.</td></tr>';
    return;
  }
  body.innerHTML = list.map(p => `
    <tr>
      <td><strong>${p.Nama}</strong></td>
      <td>${p.Kontak || '-'}</td>
      <td>${p.Alamat || '-'}</td>
      <td>
        <div class="table-actions" style="justify-content:flex-end;">
          <button class="btn-icon" onclick="openPelangganModal('${p.ID}')">✏️</button>
          <button class="btn-icon" onclick="handleDeletePelanggan('${p.ID}', '${p.Nama.replace(/'/g, "\\'")}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterPelangganTable() {
  const q = document.getElementById('pelanggan-search').value.toLowerCase().trim();
  if (!q) { renderPelangganTable(PELANGGAN_CACHE); return; }
  const filtered = PELANGGAN_CACHE.filter(p =>
    (p.Nama || '').toLowerCase().includes(q) || (p.Kontak || '').toLowerCase().includes(q)
  );
  renderPelangganTable(filtered);
}

function openPelangganModal(id) {
  document.getElementById('pelanggan-id').value = '';
  document.getElementById('pelanggan-nama').value = '';
  document.getElementById('pelanggan-kontak').value = '';
  document.getElementById('pelanggan-alamat').value = '';
  document.getElementById('modal-pelanggan-title').textContent = 'Tambah Pelanggan';

  if (id) {
    const p = PELANGGAN_CACHE.find(x => x.ID === id);
    if (p) {
      document.getElementById('pelanggan-id').value = p.ID;
      document.getElementById('pelanggan-nama').value = p.Nama;
      document.getElementById('pelanggan-kontak').value = p.Kontak;
      document.getElementById('pelanggan-alamat').value = p.Alamat;
      document.getElementById('modal-pelanggan-title').textContent = 'Edit Pelanggan';
    }
  }
  openModal('modal-pelanggan');
}

function savePelanggan() {
  const id = document.getElementById('pelanggan-id').value;
  const nama = document.getElementById('pelanggan-nama').value.trim();
  const kontak = document.getElementById('pelanggan-kontak').value.trim();
  const alamat = document.getElementById('pelanggan-alamat').value.trim();

  if (!nama) { showToast('Nama pelanggan wajib diisi.', true); return; }

  const btn = document.getElementById('btn-simpan-pelanggan');
  btn.disabled = true;

  const data = { id: id, nama: nama, kontak: kontak, alamat: alamat };
  const fn = id ? 'updatePelanggan' : 'addPelanggan';

  serverCall(fn, [data], function (res) {
    btn.disabled = false;
    if (res.success) {
      showToast(id ? 'Data pelanggan berhasil diperbarui.' : 'Pelanggan berhasil ditambahkan.');
      closeModal('modal-pelanggan');
      loadPelangganPage();
    } else {
      showToast(res.message || 'Gagal menyimpan data pelanggan.', true);
    }
  }, function () { btn.disabled = false; });
}

function handleDeletePelanggan(id, nama) {
  confirmAction('Hapus Pelanggan', 'Yakin ingin menghapus pelanggan "' + nama + '"?', function () {
    serverCall('deletePelanggan', [id], function (res) {
      if (res.success) {
        showToast('Pelanggan berhasil dihapus.');
        loadPelangganPage();
      } else {
        showToast(res.message || 'Gagal menghapus pelanggan.', true);
      }
    });
  });
}
