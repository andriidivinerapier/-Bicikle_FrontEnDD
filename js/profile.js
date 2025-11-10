// Profile Page JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const tabButtons = document.querySelectorAll('.profile-tab-btn');
    const tabPanels = document.querySelectorAll('.profile-tab-panel');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const profileLogoutBtn = document.getElementById('profileLogoutBtn');

    // Tab Switching
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Remove active from all buttons and panels
            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            
            // Add active to clicked button and corresponding panel
            btn.classList.add('active');
            document.getElementById(`tab-${tabName}`).classList.add('active');
            
            // Update URL without page reload
            window.history.replaceState(null, '', `profile.html?tab=${tabName}`);
        });
    });

    // Check URL parameters to open correct tab on load
    function initializeTabFromURL() {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        
        if (tabParam) {
            const btn = document.querySelector(`[data-tab="${tabParam}"]`);
            if (btn) {
                btn.click();
            }
        }
    }
    initializeTabFromURL();

    // Edit Profile Button
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            // Click on settings tab
            document.querySelector('[data-tab="settings"]').click();
            // Scroll to settings
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 300);
        });
    }

    // Logout Button in Profile
    if (profileLogoutBtn) {
        profileLogoutBtn.addEventListener('click', () => {
            if (confirm('Ви впевнені, що хочете вийти?')) {
                fetch('backend/logout.php', { method: 'POST' })
                    .then(res => res.json())
                    .then(data => {
                        if (data.status === 'success') {
                            window.location.href = 'index.html';
                        }
                    })
                    .catch(err => console.error('Logout error:', err));
            }
        });
    }

    // Delete/Edit Recipe Buttons
    document.querySelectorAll('.recipe-card-editable .btn-icon').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (btn.classList.contains('btn-danger')) {
                // Delete recipe
                if (confirm('Видалити цей рецепт?')) {
                    btn.closest('.recipe-card').style.opacity = '0';
                    btn.closest('.recipe-card').style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        btn.closest('.recipe-card').remove();
                    }, 300);
                }
            } else {
                // Edit recipe
                alert('Редагування рецепту (функцію ще не реалізовано)');
            }
        });
    });

    // Delete Comment Buttons
    document.querySelectorAll('.comment-item .btn-icon').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Видалити цей коментар?')) {
                const item = btn.closest('.comment-item');
                item.style.opacity = '0';
                item.style.transform = 'translateX(-20px)';
                setTimeout(() => {
                    item.remove();
                }, 300);
            }
        });
    });

    // Delete Favorite Recipe
    document.querySelectorAll('#tab-favorites .recipe-like').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Видалити з улюблених?')) {
                const card = btn.closest('.recipe-card');
                card.style.opacity = '0';
                card.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    card.remove();
                }, 300);
            }
        });
    });

    // Settings Form Save Button
    const settingsSaveBtn = document.querySelector('#tab-settings .btn-primary');
    if (settingsSaveBtn) {
        settingsSaveBtn.addEventListener('click', () => {
            const inputs = document.querySelectorAll('#tab-settings .form-group input, #tab-settings .form-group textarea');
            let allValid = true;
            
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    allValid = false;
                    input.style.borderColor = '#ff6b35';
                } else {
                    input.style.borderColor = '';
                }
            });
            
            if (allValid) {
                // Show success message
                showToast('Налаштування збережено!', 'success');
            } else {
                showToast('Заповніть всі поля', 'error');
            }
        });
    }

    // Add Recipe Button
    const addRecipeBtn = document.querySelector('#tab-recipes .btn-primary');
    if (addRecipeBtn) {
        addRecipeBtn.addEventListener('click', () => {
            alert('Додавання нового рецепту (функцію ще не реалізовано)');
        });
    }

    // Change Password Button
    const changePasswordBtn = document.querySelector('#tab-settings .btn-secondary:first-of-type');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            alert('Зміна пароля (функцію ще не реалізовано)');
        });
    }

    // Delete Account Button
    const deleteAccountBtn = document.querySelector('.danger-zone .btn-danger');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', () => {
            if (confirm('Ви впевнені? Цю дію не можна скасувати! Весь вміст буде видалено.')) {
                if (confirm('Остаточно видалити аккаунт?')) {
                    alert('Видалення аккаунту (функцію ще не реалізовано)');
                }
            }
        });
    }

    // Toast notification function
    function showToast(message, type = 'success') {
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
        
        toast.querySelector('.auth-toast__close').onclick = () => {
            toast.classList.remove('show');
        };
        
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
    }

    // Update profile info with user data (can be populated from backend)
    function loadProfileData() {
        // This will be populated from backend/session.php
        fetch('backend/session.php')
            .then(res => res.json())
            .then(data => {
                if (data.status === 'logged') {
                    document.getElementById('profileUsername').textContent = data.username || 'Користувач';
                }
            })
            .catch(err => console.error('Error loading profile:', err));
    }

    loadProfileData();

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.profile-tab-panel.active .recipe-card');
            
            cards.forEach(card => {
                const title = card.querySelector('h4')?.textContent.toLowerCase() || '';
                const desc = card.querySelector('.recipe-description')?.textContent.toLowerCase() || '';
                
                if (title.includes(term) || desc.includes(term)) {
                    card.style.display = 'block';
                    card.style.opacity = '1';
                } else {
                    card.style.opacity = '0.3';
                }
            });
        });
    }

    // Keyboard shortcut to switch tabs
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            const num = parseInt(e.key);
            if (num >= 1 && num <= 4) {
                const buttons = document.querySelectorAll('.profile-tab-btn');
                if (buttons[num - 1]) {
                    buttons[num - 1].click();
                }
            }
        }
    });
});
