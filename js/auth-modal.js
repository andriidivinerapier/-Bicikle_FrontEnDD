document.addEventListener('DOMContentLoaded', () => {
    // Toast-сповіщення
    function showAuthToast(message, type = 'success') {
        let toast = document.querySelector('.auth-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'auth-toast';
            toast.innerHTML = `
                <span class="auth-toast__icon"></span>
                <span class="auth-toast__msg"></span>
                <button class="auth-toast__close" aria-label="Закрити">×</button>
            `;
            document.body.appendChild(toast);
        }
        toast.classList.remove('auth-toast--success', 'auth-toast--error');
        toast.classList.add('auth-toast--' + type);
        toast.querySelector('.auth-toast__msg').textContent = message;
        toast.querySelector('.auth-toast__icon').innerHTML = type === 'success' ? '✔️' : '⚠️';
        toast.classList.add('show');
        toast.querySelector('.auth-toast__close').onclick = () => toast.classList.remove('show');
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => toast.classList.remove('show'), 3500);
    }

    // Elements
    const authModal = document.getElementById('authModal');
    const authModalClose = document.getElementById('authModalClose');
    const loginButton = document.getElementById('loginBtn');
    const profileContainer = document.getElementById('profileContainer');
    const profileBtn = document.getElementById('profileBtn');
    const profileMenu = document.getElementById('profileMenu');
    const profileNameEl = document.getElementById('profileName');
    const logoutBtn = document.getElementById('logoutBtn');
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Show modal when clicking login button
    if (loginButton) {
        loginButton.addEventListener('click', (e) => {
            e.preventDefault();
            authModal.classList.add('open');
            document.body.style.overflow = 'hidden';
        });
    }

    // Delegated handler for .login-btn
    document.addEventListener('click', (e) => {
        const btn = e.target.closest && e.target.closest('.login-btn');
        if (btn) {
            e.preventDefault();
            if (authModal) openAuthModal();
        }
    });

    function openAuthModal() {
        if (!authModal) return;
        authModal.classList.add('open');
        document.body.style.overflow = 'hidden';
        const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
        if (loginTab) loginTab.click();
    }
    window.openAuthModal = openAuthModal;

    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!window.location.pathname.includes('profile.html')) {
                window.location.href = 'profile.html';
            }
        });
    }

    function closeAuthModalAndMaybeRedirect() {
        const activeForm = document.querySelector('.auth-form.active');
        authModal.classList.remove('open');
        document.body.style.overflow = '';
        if (activeForm && (activeForm.id === 'forgotForm' || activeForm.id === 'resetForm')) {
            // User closed while in forgot/reset flow — send to homepage
            window.location.href = 'index.html';
        }
    }

    if (authModalClose) {
        authModalClose.addEventListener('click', () => closeAuthModalAndMaybeRedirect());
    }

    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) closeAuthModalAndMaybeRedirect();
        });
    }

    // Tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            authTabs.forEach(t => t.classList.remove('active'));
            authForms.forEach(f => f.classList.remove('active'));
            tab.classList.add('active');
            const formId = tab.dataset.tab + 'Form';
            const form = document.getElementById(formId);
            if (form) form.classList.add('active');
        });
    });

    // Login
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData();
            formData.append('email', loginForm.loginEmail.value);
            formData.append('password', loginForm.loginPassword.value);

            fetch('backend/login.php', { method: 'POST', body: formData })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        showAuthToast('Вхід успішний! Вітаємо, ' + data.username, 'success');
                        authModal.classList.remove('open');
                        document.body.style.overflow = '';
                        if (data.role === 'admin') {
                            setTimeout(() => { window.location.href = 'admin.html'; }, 800);
                        } else {
                            setTimeout(() => { window.location.href = 'index.html'; }, 800);
                        }
                    } else {
                        showAuthToast(data.message || 'Помилка входу', 'error');
                    }
                })
                .catch(() => showAuthToast('Помилка зʼєднання з сервером', 'error'));
        });
    }

    // Logout handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            const sharedModal = document.getElementById('confirmModal');
            if (sharedModal) {
                // Use shared modal if present on the page
                const msg = sharedModal.querySelector('#confirmModalMessage');
                const yesBtn = sharedModal.querySelector('#confirmModalYes');
                const noBtn = sharedModal.querySelector('#confirmModalNo');
                if (msg) msg.textContent = 'Ви дійсно хочете вийти з аккаунта?';

                function cleanup() {
                    sharedModal.classList.remove('open');
                    sharedModal.setAttribute('aria-hidden', 'true');
                    yesBtn.removeEventListener('click', onYes);
                    noBtn.removeEventListener('click', onNo);
                    document.removeEventListener('keydown', onKey);
                    document.body.classList.remove('modal-open');
                }
                function onYes(e) { e && e.stopPropagation(); cleanup(); doLogout(); }
                function onNo(e) { e && e.stopPropagation(); cleanup(); }
                function onKey(e) { if (e.key === 'Escape') { cleanup(); } }

                yesBtn.addEventListener('click', onYes);
                noBtn.addEventListener('click', onNo);
                document.addEventListener('keydown', onKey);

                sharedModal.classList.add('open');
                sharedModal.setAttribute('aria-hidden', 'false');
                document.body.classList.add('modal-open');
                try { yesBtn.focus(); } catch (e) {}
            } else {
                // Fallback: direct logout
                doLogout();
            }
        });
    }

    function doLogout() {
        fetch('backend/logout.php', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    showAuthToast('Ви вийшли з аккаунту', 'success');
                    updateAuthUI(null);
                } else {
                    showAuthToast(data.message || 'Помилка при виході', 'error');
                }
            })
            .catch(() => showAuthToast('Помилка зʼєднання з сервером', 'error'));
    }

    function updateAuthUI(user) {
        if (user && user.username) {
            if (loginButton) loginButton.style.display = 'none';
            if (profileContainer) profileContainer.style.display = 'flex';
            if (profileNameEl) profileNameEl.textContent = user.username;
            const adminMenuLink = document.getElementById('adminMenuLink');
            const adminMenuSeparator = document.getElementById('adminMenuSeparator');
            if (user.role === 'admin') {
                if (adminMenuLink) adminMenuLink.style.display = 'block';
                if (adminMenuSeparator) adminMenuSeparator.style.display = 'block';
            } else {
                if (adminMenuLink) adminMenuLink.style.display = 'none';
                if (adminMenuSeparator) adminMenuSeparator.style.display = 'none';
            }
        } else {
            if (loginButton) loginButton.style.display = '';
            if (profileContainer) profileContainer.style.display = 'none';
            if (profileNameEl) profileNameEl.textContent = 'Профіль';
            const adminMenuLink = document.getElementById('adminMenuLink');
            const adminMenuSeparator = document.getElementById('adminMenuSeparator');
            if (adminMenuLink) adminMenuLink.style.display = 'none';
            if (adminMenuSeparator) adminMenuSeparator.style.display = 'none';
        }
    }

    function checkSession() {
        fetch('backend/session.php')
            .then(res => res.json())
            .then(data => {
                if (data.status === 'logged') {
                    fetch('backend/get-user-profile.php')
                        .then(res => res.json())
                        .then(profileData => {
                            if (profileData.status === 'success' && profileData.user) {
                                updateAuthUI({ username: profileData.user.username || data.username, email: profileData.user.email, role: data.role });
                            } else {
                                updateAuthUI({ username: data.username, role: data.role });
                            }
                        })
                        .catch(() => updateAuthUI({ username: data.username, role: data.role }));
                } else {
                    updateAuthUI(null);
                }
            })
            .catch(() => updateAuthUI(null));
    }

    checkSession();

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData();
            formData.append('username', registerForm.registerName.value);
            formData.append('email', registerForm.registerEmail.value);
            formData.append('password', registerForm.registerPassword.value);

            fetch('backend/register.php', { method: 'POST', body: formData })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        showAuthToast('Аккаунт успішно зареєстровано! Тепер увійдіть.', 'success');
                        const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
                        if (loginTab) loginTab.click();
                    } else {
                        showAuthToast(data.message || 'Помилка реєстрації', 'error');
                    }
                })
                .catch(() => showAuthToast('Помилка зʼєднання з сервером', 'error'));
        });
    }

    // Password reset flow
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const forgotForm = document.getElementById('forgotForm');
    const resetForm = document.getElementById('resetForm');
    const backToLoginFromForgot = document.getElementById('backToLoginFromForgot');
    const backToLoginFromReset = document.getElementById('backToLoginFromReset');

    function showAuthFormById(id) {
        authTabs.forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => {
            if (f.id === id) {
                f.classList.add('active');
                f.style.display = '';
            } else {
                f.classList.remove('active');
                f.style.display = 'none';
            }
        });
    }

    if (forgotPasswordLink && forgotForm) {
        forgotPasswordLink.addEventListener('click', (e) => { e.preventDefault(); showAuthFormById('forgotForm'); });
    }
    if (backToLoginFromForgot) backToLoginFromForgot.addEventListener('click', (e) => { e.preventDefault(); showAuthFormById('loginForm'); });
    if (backToLoginFromReset) backToLoginFromReset.addEventListener('click', (e) => { e.preventDefault(); showAuthFormById('loginForm'); });

    if (forgotForm) {
        forgotForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('forgotEmail').value;
            // Show focused loading state on this submit button
            const submitBtn = forgotForm.querySelector('button[type="submit"]');
            let origHtml = submitBtn ? submitBtn.innerHTML : null;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('loading');
                submitBtn.innerHTML = 'Відправлення...';
            }

            const fd = new FormData();
            fd.append('email', email);
            fetch('backend/request-password-reset.php', { method: 'POST', body: fd })
                .then(r => r.json())
                .then(data => {
                    if (data.status === 'ok') {
                        showAuthToast('Код відправлено, перевірте пошту', 'success');
                        const re = document.getElementById('resetEmail');
                        if (re) re.value = email;
                        showAuthFormById('resetForm');
                    } else {
                        showAuthToast(data.message || 'Помилка при відправці', 'error');
                    }
                })
                .catch(() => showAuthToast('Помилка зʼєднання з сервером', 'error'))
                .finally(() => {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.classList.remove('loading');
                        submitBtn.innerHTML = origHtml;
                    }
                });
        });
    }

    if (resetForm) {
        resetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('resetEmail').value;
            const code = document.getElementById('resetCode').value;
            const newPassword = document.getElementById('resetNewPassword').value;
            const fd = new FormData();
            fd.append('email', email);
            fd.append('code', code);
            fd.append('new_password', newPassword);
            fetch('backend/reset-password.php', { method: 'POST', body: fd })
                .then(r => r.json())
                .then(data => {
                    if (data.status === 'ok') {
                        showAuthToast('Пароль успішно оновлено. Увійдіть.', 'success');
                        showAuthFormById('loginForm');
                    } else {
                        showAuthToast(data.message || 'Помилка при оновленні пароля', 'error');
                    }
                })
                .catch(() => showAuthToast('Помилка зʼєднання з сервером', 'error'));
        });
    }
});