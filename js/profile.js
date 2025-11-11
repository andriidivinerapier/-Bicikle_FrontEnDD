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
            
            // Load recipes when switching to recipes tab
            if (tabName === 'recipes') {
                loadUserRecipes();
            }
            
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
        addRecipeBtn.addEventListener('click', openCreateModal);
    }

    // Modal elements for create recipe (profile)
    const profileAddBtn = document.getElementById('profileAddRecipeBtn');
    const createOverlay = document.getElementById('createRecipeOverlay');
    const createClose = document.getElementById('createRecipeClose');
    const createForm = document.getElementById('profileCreateRecipeForm');

    function openCreateModal() {
        if (createOverlay) {
            createOverlay.style.display = 'flex';
            document.body.classList.add('modal-open');
        }
    }

    if (profileAddBtn) profileAddBtn.addEventListener('click', openCreateModal);
    if (createClose) createClose.addEventListener('click', () => {
        if (createOverlay) {
            createOverlay.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    });

    // Submit create recipe form
    if (createForm) {
        createForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fd = new FormData(createForm);
            fetch('backend/create-recipe.php', { method: 'POST', body: fd })
                .then(r => r.json())
                .then(res => {
                    if (res.status === 'success') {
                        showToast('Рецепт створено', 'success');
                        // append new recipe card to DOM (simple representation)
                        const grid = document.querySelector('#tab-recipes .recipes-grid');
                        if (grid) {
                            const article = document.createElement('div');
                            article.className = 'recipe-card recipe-card-editable';
                            const img = fd.get('image') ? URL.createObjectURL(fd.get('image')) : 'images/homepage/salad1.jpg';
                            article.innerHTML = `\n                                <div class="recipe-image" style="background-image: url('${img}')"></div>\n                                <div class="recipe-info">\n                                    <h4>${fd.get('title')}</h4>\n                                    <p class="recipe-description">${(fd.get('ingredients') || '').split('|')[0] || ''}</p>\n                                    <div class="recipe-meta">\n                                        <div class="meta-left">\n                                            <span class="cook-time">--</span>\n                                        </div>\n                                        <div class="meta-right">\n                                            <button class="btn-icon" title="Редагувати"><i class="fas fa-edit"></i></button>\n                                            <button class="btn-icon btn-danger" title="Видалити"><i class="fas fa-trash-alt"></i></button>\n                                        </div>\n                                    </div>\n                                </div>`;
                            grid.insertBefore(article, grid.firstChild);
                        }
                        // close modal
                        if (createOverlay) {
                            createOverlay.style.display = 'none';
                            document.body.classList.remove('modal-open');
                        }
                        // clear form
                        createForm.reset();
                    } else {
                        showToast(res.message || 'Помилка при створенні', 'error');
                    }
                })
                .catch(() => showToast('Помилка мережі', 'error'));
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

    // Update profile info with user data from backend
    function loadProfileData() {
        fetch('backend/get-user-profile.php')
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success' && data.user) {
                    const user = data.user;
                    
                    // Update profile header
                    document.getElementById('profileUsername').textContent = user.username || 'Користувач';
                    document.getElementById('profileEmail').textContent = user.email || '';
                    
                    // Update stats
                    const statsElements = document.querySelectorAll('.profile-stats span strong');
                    if (statsElements.length >= 3) {
                        statsElements[0].textContent = user.recipes_count || '0';
                        statsElements[1].textContent = user.comments_count || '0';
                        statsElements[2].textContent = user.favorites_count || '0';
                    }
                    
                    // Update header profile name
                    const headerProfileName = document.getElementById('profileName');
                    if (headerProfileName) {
                        headerProfileName.textContent = user.username || 'ANDREW';
                    }
                    
                    // Update settings form fields
                    const settingsNameInput = document.querySelector('#tab-settings .form-group input[type="text"]');
                    const settingsEmailInput = document.querySelector('#tab-settings .form-group input[type="email"]');
                    
                    if (settingsNameInput) {
                        settingsNameInput.value = user.username || '';
                    }
                    if (settingsEmailInput) {
                        settingsEmailInput.value = user.email || '';
                    }
                }
            })
            .catch(err => console.error('Error loading profile:', err));
    }

    loadProfileData();

    // Load user recipes on tab switch
    function loadUserRecipes() {
        const grid = document.querySelector('#tab-recipes .recipes-grid');
        if (!grid) return;

        console.log('📥 Завантажуємо рецепти користувача...');
        
        fetch('backend/get-user-recipes.php')
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .then(data => {
                console.log('✅ Відповідь сервера:', data);
                
                // Clear existing demo recipes
                const demoCards = grid.querySelectorAll('.recipe-card-editable');
                demoCards.forEach(card => card.remove());
                
                if (data.status === 'success' && Array.isArray(data.recipes) && data.recipes.length > 0) {
                    data.recipes.forEach(recipe => {
                        const article = document.createElement('div');
                        article.className = 'recipe-card recipe-card-editable';
                        
                        const image = (recipe.image_path && recipe.image_path.trim()) ? recipe.image_path : 'images/homepage/salad1.jpg';
                        const ingredients = recipe.ingredients || '';
                        const firstIngredient = ingredients.split('|')[0] || 'Рецепт';
                        
                        article.innerHTML = `
                            <div class="recipe-image" style="background-image: url('${image}')"></div>
                            <div class="recipe-info">
                                <h4>${escapeHtml(recipe.title || 'Без назви')}</h4>
                                <p class="recipe-description">${escapeHtml(firstIngredient)}</p>
                                <div class="recipe-meta">
                                    <div class="meta-left">
                                        <span class="cook-time">${recipe.created_at ? recipe.created_at.split(' ')[0] : 'Недавно'}</span>
                                    </div>
                                    <div class="meta-right">
                                        <button class="btn-icon" title="Редагувати"><i class="fas fa-edit"></i></button>
                                        <button class="btn-icon btn-danger" title="Видалити"><i class="fas fa-trash-alt"></i></button>
                                    </div>
                                </div>
                            </div>
                        `;
                        
                        grid.appendChild(article);
                    });
                    console.log(`✅ Завантажено ${data.recipes.length} рецептів`);
                    
                    // Re-attach delete handlers to new cards
                    attachRecipeCardHandlers();
                } else {
                    console.log('ℹ️ Рецептів не знайдено');
                    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #9aa6b6;">Ви ще не створили рецептів. Натисніть "Додати новий рецепт", щоб почати!</p>';
                }
            })
            .catch(error => {
                console.error('❌ Помилка завантаження:', error);
                grid.innerHTML = `<p style="grid-column: 1/-1; color:#ff6b6b; text-align: center;">⚠️ Помилка завантаження рецептів</p>`;
            });
    }

    // Escape HTML
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Attach handlers to recipe cards
    function attachRecipeCardHandlers() {
        document.querySelectorAll('.recipe-card-editable .btn-icon').forEach(btn => {
            btn.removeEventListener('click', handleRecipeCardClick);
            btn.addEventListener('click', handleRecipeCardClick);
        });
    }

    function handleRecipeCardClick(e) {
        e.stopPropagation();
        if (this.classList.contains('btn-danger')) {
            // Delete recipe
            if (confirm('Видалити цей рецепт?')) {
                const card = this.closest('.recipe-card');
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    card.remove();
                }, 300);
            }
        } else {
            // Edit recipe
            alert('Редагування рецепту (функцію ще не реалізовано)');
        }
    }
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
