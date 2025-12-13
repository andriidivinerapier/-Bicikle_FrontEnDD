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
        // Закрити вручну
        toast.querySelector('.auth-toast__close').onclick = () => toast.classList.remove('show');
        // Автоматично сховати через 3.5 сек
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => toast.classList.remove('show'), 3500);
    }
    // Elements
    const authModal = document.getElementById('authModal');
    const authModalClose = document.getElementById('authModalClose');
    const loginButton = document.getElementById('loginBtn');
    // Profile elements (shown when logged in)
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

    // Fallback: delegated handler for any element with class `login-btn`
    document.addEventListener('click', (e) => {
        const btn = e.target.closest && e.target.closest('.login-btn');
        if (btn) {
            e.preventDefault();
            if (authModal) openAuthModal();
        }
    });

    // Expose a global helper so other scripts can open the auth modal
    function openAuthModal() {
        if (!authModal) return;
        authModal.classList.add('open');
        document.body.style.overflow = 'hidden';
        // Ensure login tab is active when opened by external callers
        const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
        if (loginTab) loginTab.click();
    }
    window.openAuthModal = openAuthModal;

    // Profile button click — navigate to profile page (do not toggle submenu)
    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!window.location.pathname.includes('profile.html')) {
                window.location.href = 'profile.html';
            }
            // If already on profile page, do nothing — submenu is disabled to avoid nested subpages
        });
    }

    // Close modal
    if (authModalClose) {
        authModalClose.addEventListener('click', () => {
            authModal.classList.remove('open');
            document.body.style.overflow = '';
        });
    }

    // Close modal when clicking outside
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) {
                authModal.classList.remove('open');
                document.body.style.overflow = '';
            }
        });
    }

    // Tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and forms
            authTabs.forEach(t => t.classList.remove('active'));
            authForms.forEach(f => f.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding form
            tab.classList.add('active');
            const formId = tab.dataset.tab + 'Form';
            const form = document.getElementById(formId);
            if (form) form.classList.add('active');
        });
    });

    // Form submission
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Відправка даних на login.php через fetch
            const formData = new FormData();
            formData.append('email', loginForm.loginEmail.value);
            formData.append('password', loginForm.loginPassword.value);

            fetch('backend/login.php', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    showAuthToast('Вхід успішний! Вітаємо, ' + data.username, 'success');
                    authModal.classList.remove('open');
                    document.body.style.overflow = '';
                    
                    // Якщо адмін - перенаправити на адмін панель
                    if (data.role === 'admin') {
                        setTimeout(() => {
                            window.location.href = 'admin.html';
                        }, 1000);
                    } else {
                        // Оновлюємо UI після входу для звичайних користувачів
                        updateAuthUI({ username: data.username, role: data.role });
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
        });
    }

    // Update UI according to user object (null = logged out)
    function updateAuthUI(user) {
        if (user && user.username) {
            // hide login button, show profile
            if (loginButton) loginButton.style.display = 'none';
            if (profileContainer) profileContainer.style.display = 'flex';
            if (profileNameEl) profileNameEl.textContent = user.username;
            
            // Показати адмін меню якщо користувач адмін
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
            
            // Сховати адмін меню
            const adminMenuLink = document.getElementById('adminMenuLink');
            const adminMenuSeparator = document.getElementById('adminMenuSeparator');
            if (adminMenuLink) adminMenuLink.style.display = 'none';
            if (adminMenuSeparator) adminMenuSeparator.style.display = 'none';
        }
    }

    // On load check session (if backend has active session)
    function checkSession() {
        fetch('backend/session.php')
            .then(res => res.json())
            .then(data => {
                if (data.status === 'logged') {
                    // Завантажимо повні дані користувача
                    fetch('backend/get-user-profile.php')
                        .then(res => res.json())
                        .then(profileData => {
                            if (profileData.status === 'success' && profileData.user) {
                                updateAuthUI({ 
                                    username: profileData.user.username || data.username,
                                    email: profileData.user.email,
                                    role: data.role
                                });
                            } else {
                                updateAuthUI({ 
                                    username: data.username,
                                    role: data.role
                                });
                            }
                        })
                        .catch(() => {
                            updateAuthUI({ 
                                username: data.username,
                                role: data.role
                            });
                        });
                } else {
                    updateAuthUI(null);
                }
            })
            .catch(() => {
                // If session check fails, keep default (logged out)
                updateAuthUI(null);
            });
    }

    // Run session check on DOMContentLoaded
    checkSession();

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Відправка даних на register.php через fetch
        const formData = new FormData();
        formData.append('username', registerForm.registerName.value);
        formData.append('email', registerForm.registerEmail.value);
        formData.append('password', registerForm.registerPassword.value);

        fetch('backend/register.php', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                showAuthToast('Аккаунт успішно зареєстровано! Тепер увійдіть.', 'success');
                // Переключити на вкладку входу
                const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
                if (loginTab) loginTab.click();
            } else {
                showAuthToast(data.message || 'Помилка реєстрації', 'error');
            }
        })
        .catch(() => showAuthToast('Помилка зʼєднання з сервером', 'error'));
        });
    }
});