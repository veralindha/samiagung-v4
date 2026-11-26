let SOPIR_CACHE = [];

function loadSopirPage() {
  serverCall('getSopirList', [], function (list) {
    SOPIR_CACHE = list;
    renderSopirTable(list);
  });
}

function renderSopirTable(list) {
  const body = document.getElementById('sopir-table-body');
  if (!list || list.length === 0) {
    body.innerHTML = '<tr class="empty-row"><td colspan="3">📭 Belum ada sopir. Klik "Tambah Sopir" untuk memulai.</td></tr>';
    return;
  }
  body.innerHTML = list.map(s => `
    <tr>
      <td><strong>${s.Nama}</strong></td>
      <td>${s.Kontak || '-'}</td>
      <td>
        <div class="table-actions" style="justify-content:flex-end;">
          <button class="btn-icon" onclick="openSopirModal('${s.ID}')">✏️</button>
          <button class="btn-icon" onclick="handleDeleteSopir('${s.ID}', '${String(s.Nama).replace(/'/g, "\\'")}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openSopirModal(id) {
  document.getElementById('sopir-id').value = '';
  document.getElementById('sopir-nama').value = '';
  document.getElementById('sopir-kontak').value = '';
  document.getElementById('modal-sopir-title').textContent = 'Tambah Sopir';

  if (id) {
    const s = SOPIR_CACHE.find(x => x.ID === id);
    if (s) {
      document.getElementById('sopir-id').value = s.ID;
      document.getElementById('sopir-nama').value = s.Nama;
      document.getElementById('sopir-kontak').value = s.Kontak;
      document.getElementById('modal-sopir-title').textContent = 'Edit Sopir';
    }
  }
  openModal('modal-sopir');
}

function saveSopir() {
  const id = document.getElementById('sopir-id').value;
  const nama = document.getElementById('sopir-nama').value.trim();
  const kontak = document.getElementById('sopir-kontak').value.trim();

  if (!nama) { showToast('Nama sopir wajib diisi.', true); return; }

  const btn = document.getElementById('btn-simpan-sopir');
  btn.disabled = true;

  const data = { id: id, nama: nama, kontak: kontak };
  const fn = id ? 'updateSopir' : 'addSopir';

  serverCall(fn, [data], function (res) {
    btn.disabled = false;
    if (res.success) {
      showToast(id ? 'Sopir berhasil diperbarui.' : 'Sopir berhasil ditambahkan.');
      closeModal('modal-sopir');
      loadSopirPage();
    } else {
      showToast(res.message || 'Gagal menyimpan sopir.', true);
    }
  }, function () { btn.disabled = false; });
}

function handleDeleteSopir(id, nama) {
  confirmAction('Hapus Sopir', 'Yakin ingin menghapus sopir "' + nama + '"?', function () {
    serverCall('deleteSopir', [id], function (res) {
      if (res.success) {
        showToast('Sopir berhasil dihapus.');
        loadSopirPage();
      } else {
        showToast(res.message || 'Gagal menghapus sopir.', true);
      }
    });
  });
}
