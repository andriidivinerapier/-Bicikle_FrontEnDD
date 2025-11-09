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
        // Add your login logic here
        console.log('Login submit', {
            email: loginForm.loginEmail.value,
            password: loginForm.loginPassword.value
        });
    });

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Add your registration logic here
        console.log('Register submit', {
            name: registerForm.registerName.value,
            email: registerForm.registerEmail.value,
            password: registerForm.registerPassword.value
        });
    });
});