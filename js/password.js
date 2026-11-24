function submitChangePassword() {
  const current = document.getElementById('pw-current').value;
  const newPw = document.getElementById('pw-new').value;
  const confirm = document.getElementById('pw-confirm').value;
  const msgEl = document.getElementById('pw-message');
  msgEl.textContent = '';
  msgEl.style.color = 'var(--danger)';

  if (!current || !newPw || !confirm) { msgEl.textContent = 'Semua field wajib diisi.'; return; }
  if (newPw.length < 6) { msgEl.textContent = 'Password baru minimal 6 karakter.'; return; }
  if (newPw !== confirm) { msgEl.textContent = 'Konfirmasi password baru tidak cocok.'; return; }

  const btn = document.getElementById('btn-ganti-password');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Menyimpan...';

  serverCall('changePassword', [current, newPw], function (res) {
    btn.disabled = false;
    btn.innerHTML = '💾 Simpan Password Baru';
    if (res.success) {
      msgEl.style.color = 'var(--success)';
      msgEl.textContent = res.message;
      showToast('Password berhasil diperbarui.');
      document.getElementById('pw-current').value = '';
      document.getElementById('pw-new').value = '';
      document.getElementById('pw-confirm').value = '';
    } else {
      msgEl.textContent = res.message;
    }
  }, function () { btn.disabled = false; btn.innerHTML = '💾 Simpan Password Baru'; });
}
