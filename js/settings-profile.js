document.addEventListener('DOMContentLoaded', () => {
    const nameEl = document.getElementById('settingsProfileName');
    const emailEl = document.getElementById('settingsProfileEmail');

    // Fetch basic profile and populate
    fetch('backend/get-user-profile.php')
        .then(r => r.json())
        .then(data => {
            if (data && data.status === 'success' && data.user) {
                const u = data.user;
                if (nameEl) nameEl.textContent = u.username || 'Користувач';
                if (emailEl) emailEl.textContent = u.email || '';
            }
        })
        .catch(() => {
            if (nameEl) nameEl.textContent = 'Користувач';
        });

    // Elements
    const changePasswordBtn = document.getElementById('changePasswordBtnSettings');
    const changeEmailBtn = document.getElementById('changeEmailBtnSettings');
    const pwdForm = document.getElementById('changePasswordFormSettings');
    const emailForm = document.getElementById('changeEmailFormSettings');
    const changeNameBtn = document.getElementById('changeNameBtnSettings');
    const nameForm = document.getElementById('changeNameFormSettings');

    if (changePasswordBtn && pwdForm) {
        changePasswordBtn.addEventListener('click', () => {
            pwdForm.style.display = pwdForm.style.display === 'none' ? 'block' : 'none';
            if (emailForm) emailForm.style.display = 'none';
            if (nameForm) nameForm.style.display = 'none';
        });
    }

    if (changeEmailBtn && emailForm) {
        changeEmailBtn.addEventListener('click', () => {
            emailForm.style.display = emailForm.style.display === 'none' ? 'block' : 'none';
            if (pwdForm) pwdForm.style.display = 'none';
            if (nameForm) nameForm.style.display = 'none';
        });
    }

    if (changeNameBtn && nameForm) {
        changeNameBtn.addEventListener('click', () => {
            nameForm.style.display = nameForm.style.display === 'none' ? 'block' : 'none';
            if (pwdForm) pwdForm.style.display = 'none';
            if (emailForm) emailForm.style.display = 'none';
        });
    }

    // Password form actions
    const savePwd = document.getElementById('savePasswordSettings');
    const cancelPwd = document.getElementById('cancelPasswordSettings');
    if (savePwd) {
        savePwd.addEventListener('click', () => {
            const cur = document.getElementById('currentPasswordSettings').value || '';
            const np = document.getElementById('newPasswordSettings').value || '';
            const cf = document.getElementById('confirmNewPasswordSettings').value || '';
            if (!cur || !np || !cf) return (window.showToast ? showToast('Заповніть всі поля', 'error') : alert('Заповніть всі поля'));
            if (np !== cf) return (window.showToast ? showToast('Паролі не співпадають', 'error') : alert('Паролі не співпадають'));

            const fd = new FormData();
            fd.append('type', 'password');
            fd.append('current', cur);
            fd.append('new', np);

            fetch('backend/update-user.php', { method: 'POST', body: fd })
                .then(r => r.json())
                .then(resp => {
                    if (resp && resp.status === 'success') {
                        if (window.showToast) showToast('Пароль змінено', 'success');
                    } else {
                        const msg = (resp && resp.message) ? resp.message : 'Помилка';
                        if (window.showToast) showToast(msg, 'error'); else alert(msg);
                    }
                })
                .catch(err => {
                    console.error('Update password error', err);
                    if (window.showToast) showToast('Помилка мережі', 'error'); else alert('Помилка мережі');
                })
                .finally(() => {
                    if (pwdForm) pwdForm.style.display = 'none';
                    document.getElementById('currentPasswordSettings').value = '';
                    document.getElementById('newPasswordSettings').value = '';
                    document.getElementById('confirmNewPasswordSettings').value = '';
                });
        });
    }
    if (cancelPwd) {
        cancelPwd.addEventListener('click', () => {
            if (pwdForm) pwdForm.style.display = 'none';
        });
    }

    // password visibility toggles — toggle icon classes for reliability
    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (!input) return;
            const icon = btn.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
                btn.setAttribute('aria-pressed', 'true');
            } else {
                input.type = 'password';
                if (icon) { icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
                btn.setAttribute('aria-pressed', 'false');
            }
        });
    });

    // Name change actions
    const saveName = document.getElementById('saveNameSettings');
    const cancelName = document.getElementById('cancelNameSettings');
    if (saveName) {
        saveName.addEventListener('click', () => {
            const newName = document.getElementById('newNameSettings').value || '';
            if (!newName.trim()) return (window.showToast ? showToast('Введіть нове ім\'я', 'error') : alert('Введіть нове ім\'я'));

            // Send to backend
            const fd = new FormData();
            fd.append('type', 'name');
            fd.append('name', newName.trim());

            fetch('backend/update-user.php', { method: 'POST', body: fd })
                .then(r => r.json())
                .then(resp => {
                    if (resp && resp.status === 'success') {
                        if (nameEl) nameEl.textContent = resp.username || newName;
                        const headerName = document.getElementById('profileUsername');
                        const headerSmall = document.getElementById('profileName');
                        if (headerName) headerName.textContent = resp.username || newName;
                        if (headerSmall) headerSmall.textContent = resp.username || newName;
                        if (window.showToast) showToast('Ім\'я збережено', 'success');
                    } else {
                        const msg = (resp && resp.message) ? resp.message : 'Помилка';
                        if (window.showToast) showToast(msg, 'error'); else alert(msg);
                    }
                })
                .catch(err => {
                    console.error('Update name error', err);
                    if (window.showToast) showToast('Помилка мережі', 'error'); else alert('Помилка мережі');
                })
                .finally(() => {
                    if (nameForm) nameForm.style.display = 'none';
                    document.getElementById('newNameSettings').value = '';
                });
        });
    }
    if (cancelName) {
        cancelName.addEventListener('click', () => {
            if (nameForm) nameForm.style.display = 'none';
        });
    }

    // Email form actions: request code -> confirm code
    const saveEmail = document.getElementById('saveEmailSettings');
    const cancelEmail = document.getElementById('cancelEmailSettings');
    const confirmEmail = document.getElementById('confirmEmailSettings');
    const emailCodeRow = document.getElementById('emailCodeRow');
    const emailConfirmCode = document.getElementById('emailConfirmCode');

    if (saveEmail) {
        saveEmail.addEventListener('click', async () => {
            const newEmail = document.getElementById('newEmailSettings').value || '';
            if (!newEmail) return (window.showToast ? showToast('Введіть нову пошту', 'error') : alert('Введіть нову пошту'));
            const emailRegex = /^\S+@\S+\.\S+$/;
            if (!emailRegex.test(newEmail)) return (window.showToast ? showToast('Невірний формат пошти', 'error') : alert('Невірний формат пошти'));

            const fd = new FormData();
            fd.append('new_email', newEmail.trim());

            try {
                saveEmail.disabled = true;
                const res = await fetch('backend/request-email-change.php', { method: 'POST', body: fd });
                const resp = await res.json();
                saveEmail.disabled = false;
                if (resp && resp.success) {
                    if (window.showToast) showToast(resp.sent ? 'Код надіслано на стару пошту' : 'Код збережено для локального тестування', 'success');
                    // reveal code input and confirm button
                    if (emailCodeRow) emailCodeRow.style.display = '';
                    if (confirmEmail) confirmEmail.style.display = '';
                    saveEmail.style.display = 'none';
                } else {
                    const msg = (resp && resp.error) ? resp.error : 'Помилка при запиті коду';
                    if (window.showToast) showToast(msg, 'error'); else alert(msg);
                }
            } catch (err) {
                console.error('Request email change error', err);
                saveEmail.disabled = false;
                if (window.showToast) showToast('Помилка мережі', 'error'); else alert('Помилка мережі');
            }
        });
    }
    if (confirmEmail) {
        confirmEmail.addEventListener('click', async () => {
            const code = (emailConfirmCode && emailConfirmCode.value) ? emailConfirmCode.value.trim() : '';
            if (!code) return (window.showToast ? showToast('Введіть код підтвердження', 'error') : alert('Введіть код підтвердження'));

            const fd = new FormData();
            fd.append('code', code);

            try {
                confirmEmail.disabled = true;
                const res = await fetch('backend/confirm-email-change.php', { method: 'POST', body: fd });
                const resp = await res.json();
                confirmEmail.disabled = false;
                if (resp && resp.success) {
                    if (emailEl) emailEl.textContent = resp.email || document.getElementById('newEmailSettings').value || '';
                    if (window.showToast) showToast('Пошта успішно змінена', 'success');
                    // reset UI
                    if (emailCodeRow) emailCodeRow.style.display = 'none';
                    if (confirmEmail) confirmEmail.style.display = 'none';
                    if (saveEmail) saveEmail.style.display = '';
                    if (emailForm) emailForm.style.display = 'none';
                    document.getElementById('newEmailSettings').value = '';
                    if (emailConfirmCode) emailConfirmCode.value = '';
                } else {
                    const msg = (resp && resp.error) ? resp.error : 'Код неправильний або прострочений';
                    if (window.showToast) showToast(msg, 'error'); else alert(msg);
                }
            } catch (err) {
                console.error('Confirm email change error', err);
                confirmEmail.disabled = false;
                if (window.showToast) showToast('Помилка мережі', 'error'); else alert('Помилка мережі');
            }
        });
    }
    if (cancelEmail) {
        cancelEmail.addEventListener('click', () => {
            if (emailForm) emailForm.style.display = 'none';
            if (emailCodeRow) emailCodeRow.style.display = 'none';
            if (confirmEmail) confirmEmail.style.display = 'none';
            if (saveEmail) { saveEmail.style.display = ''; saveEmail.disabled = false; }
            if (emailConfirmCode) emailConfirmCode.value = '';
        });
    }

    // No central Save button — individual form Save buttons handle submission.
});