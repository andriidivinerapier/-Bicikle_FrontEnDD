document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const authModal = document.getElementById('authModal');
    const authModalClose = document.getElementById('authModalClose');
    const loginButton = document.getElementById('loginBtn');
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Show modal when clicking login button
    loginButton.addEventListener('click', (e) => {
        e.preventDefault();
        authModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    });

    // Close modal
    authModalClose.addEventListener('click', () => {
        authModal.classList.remove('open');
        document.body.style.overflow = '';
    });

    // Close modal when clicking outside
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.classList.remove('open');
            document.body.style.overflow = '';
        }
    });

    // Tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and forms
            authTabs.forEach(t => t.classList.remove('active'));
            authForms.forEach(f => f.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding form
            tab.classList.add('active');
            const formId = tab.dataset.tab + 'Form';
            document.getElementById(formId).classList.add('active');
        });
    });

    // Form submission
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
                alert('Вхід успішний! Вітаємо, ' + data.username);
                authModal.classList.remove('open');
                document.body.style.overflow = '';
                // Можна додати логіку для оновлення UI після входу
            } else {
                alert(data.message || 'Помилка входу');
            }
        })
        .catch(() => alert('Помилка зʼєднання з сервером'));
    });

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
                alert('Реєстрація успішна! Тепер увійдіть.');
                // Переключити на вкладку входу
                document.querySelector('.auth-tab[data-tab="login"]').click();
            } else {
                alert(data.message || 'Помилка реєстрації');
            }
        })
        .catch(() => alert('Помилка зʼєднання з сервером'));
    });
});