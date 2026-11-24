let KENDARAAN_CACHE = [];

function loadKendaraanPage() {
  serverCall('getKendaraanList', [], function (list) {
    KENDARAAN_CACHE = list;
    renderKendaraanTable(list);
  });
}

function renderKendaraanTable(list) {
  const body = document.getElementById('kendaraan-table-body');
  if (!list || list.length === 0) {
    body.innerHTML = '<tr class="empty-row"><td colspan="3">📭 Belum ada kendaraan. Klik "Tambah Kendaraan" untuk memulai.</td></tr>';
    return;
  }
  body.innerHTML = list.map(k => `
    <tr>
      <td><strong>${k.NomorKendaraan}</strong></td>
      <td>${k.Keterangan || '-'}</td>
      <td>
        <div class="table-actions" style="justify-content:flex-end;">
          <button class="btn-icon" onclick="openKendaraanModal('${k.ID}')">✏️</button>
          <button class="btn-icon" onclick="handleDeleteKendaraan('${k.ID}', '${k.NomorKendaraan.replace(/'/g, "\\'")}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openKendaraanModal(id) {
  document.getElementById('kendaraan-id').value = '';
  document.getElementById('kendaraan-nomor').value = '';
  document.getElementById('kendaraan-keterangan').value = '';
  document.getElementById('modal-kendaraan-title').textContent = 'Tambah Kendaraan';

  if (id) {
    const k = KENDARAAN_CACHE.find(x => x.ID === id);
    if (k) {
      document.getElementById('kendaraan-id').value = k.ID;
      document.getElementById('kendaraan-nomor').value = k.NomorKendaraan;
      document.getElementById('kendaraan-keterangan').value = k.Keterangan;
      document.getElementById('modal-kendaraan-title').textContent = 'Edit Kendaraan';
    }
  }
  openModal('modal-kendaraan');
}

function saveKendaraan() {
  const id = document.getElementById('kendaraan-id').value;
  const nomor = document.getElementById('kendaraan-nomor').value.trim();
  const keterangan = document.getElementById('kendaraan-keterangan').value.trim();

  if (!nomor) { showToast('Nomor kendaraan wajib diisi.', true); return; }

  const btn = document.getElementById('btn-simpan-kendaraan');
  btn.disabled = true;

  const data = { id: id, nomorKendaraan: nomor, keterangan: keterangan };
  const fn = id ? 'updateKendaraan' : 'addKendaraan';

  serverCall(fn, [data], function (res) {
    btn.disabled = false;
    if (res.success) {
      showToast(id ? 'Kendaraan berhasil diperbarui.' : 'Kendaraan berhasil ditambahkan.');
      closeModal('modal-kendaraan');
      loadKendaraanPage();
    } else {
      showToast(res.message || 'Gagal menyimpan kendaraan.', true);
    }
  }, function () { btn.disabled = false; });
}

function handleDeleteKendaraan(id, nomor) {
  confirmAction('Hapus Kendaraan', 'Yakin ingin menghapus kendaraan "' + nomor + '"?', function () {
    serverCall('deleteKendaraan', [id], function (res) {
      if (res.success) {
        showToast('Kendaraan berhasil dihapus.');
        loadKendaraanPage();
      } else {
        showToast(res.message || 'Gagal menghapus kendaraan.', true);
      }
    });
  });
}
