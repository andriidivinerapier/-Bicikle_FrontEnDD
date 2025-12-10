// Profile Page JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const tabButtons = document.querySelectorAll('.profile-tab-btn');
    const tabPanels = document.querySelectorAll('.profile-tab-panel');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const profileLogoutBtn = document.getElementById('profileLogoutBtn');

    // Load user profile statistics
    function loadUserProfileStats() {
        fetch('backend/get-user-profile.php')
            .then(res => res.json())
            .then(data => {
                console.log('📊 Profile stats response:', data);
                if (data.status === 'success' && data.user) {
                    const user = data.user;
                    console.log('📊 Updating stats:', { recipes: user.recipes_count, comments: user.comments_count, favorites: user.favorites_count });
                    // Update profile header stats
                    const statsElement = document.querySelector('.profile-stats');
                    if (statsElement) {
                        statsElement.innerHTML = `
                            <span><strong>${user.recipes_count}</strong> рецептів </span>
                            <span><strong>${user.comments_count}</strong> коментарів </span>
                            <span><strong>${user.favorites_count}</strong> улюблених </span>
                        `;
                        console.log('✅ Stats updated in DOM');
                    } else {
                        console.warn('⚠️ .profile-stats element not found');
                    }
                    // Update profile username and email
                    const usernameEl = document.getElementById('profileUsername');
                    const emailEl = document.getElementById('profileEmail');
                    if (usernameEl) usernameEl.textContent = user.username || 'Користувач';
                    if (emailEl) emailEl.textContent = user.email || 'email@example.com';
                } else {
                    console.warn('⚠️ Profile stats response invalid:', data);
                }
            })
            .catch(err => console.error('❌ Error loading profile stats:', err));
    }
    loadUserProfileStats();

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
        // Add Ingredient Button
        const addIngredientBtn = document.getElementById('profileAddIngredientBtn');
        const ingredientsContainer = document.getElementById('profileIngredientsContainer');
        
        if (addIngredientBtn && ingredientsContainer) {
            addIngredientBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const newInput = document.createElement('input');
                newInput.type = 'text';
                newInput.name = 'ingredients[]';
                newInput.placeholder = 'Додайте інгредієнт';
                newInput.style.cssText = 'padding: 0.75rem; background: #23283b; border: 1px solid #333; color: #fff; border-radius: 6px; width: 100%;';
                ingredientsContainer.appendChild(newInput);
            });
        }

        // Add Step Button
        const addStepBtn = document.getElementById('profileAddStepBtn');
        const stepsContainer = document.getElementById('profileStepsContainer');
        
        if (addStepBtn && stepsContainer) {
            addStepBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const stepNumber = stepsContainer.querySelectorAll('textarea[name="steps[]"]').length + 1;
                const newStep = document.createElement('div');
                newStep.style.cssText = 'display: flex; gap: 0.5rem; margin-bottom: 1rem;';
                newStep.innerHTML = `
                    <span style="color: #ff9800; font-weight: bold; min-width: 30px;">${stepNumber}.</span>
                    <textarea name="steps[]" placeholder="Опишіть етап приготування..." style="flex: 1; padding: 0.75rem; background: #23283b; border: 1px solid #333; color: #fff; border-radius: 6px; resize: vertical; min-height: 80px;"></textarea>
                `;
                stepsContainer.appendChild(newStep);
            });
        }

        createForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Збираємо дані
            const title = document.getElementById('profileRecipeTitle').value.trim();
            const difficulty = document.getElementById('profileRecipeDifficulty').value.trim();
            const time = document.getElementById('profileRecipeTime').value.trim();
            const category = document.getElementById('profileRecipeCategory').value.trim();
            
            // Збираємо інгредієнти та етапи з форми напряму
            const formData = new FormData(createForm);
            const ingredientsArray = formData.getAll('ingredients[]').filter(v => v.trim());
            const stepsArray = formData.getAll('steps[]').filter(v => v.trim());
            
            console.log('Form Data:', { title, difficulty, time, category, ingredients: ingredientsArray, steps: stepsArray });
            
            // Валідація
            if (!title || !difficulty || !time || !category || ingredientsArray.length === 0 || stepsArray.length === 0) {
                console.log('Validation failed:', { 
                    title: !!title, 
                    difficulty: !!difficulty, 
                    time: !!time, 
                    category: !!category, 
                    ingredients: ingredientsArray.length, 
                    steps: stepsArray.length 
                });
                showToast('Заповніть усі обов\'язкові поля!', 'error');
                return;
            }

            //準備FormData з усіма даними
            const fd = new FormData(createForm);
            fd.append('ingredients', JSON.stringify(ingredientsArray));
            fd.append('steps', JSON.stringify(stepsArray));
            
            fetch('backend/create-recipe.php', { method: 'POST', body: fd })
                .then(r => r.json())
                .then(res => {
                    console.log('Response:', res);
                    if (res.status === 'success') {
                        showToast('Рецепт відправлено на модерацію', 'success');
                        if (createOverlay) {
                            createOverlay.style.display = 'none';
                            document.body.classList.remove('modal-open');
                        }
                        createForm.reset();
                    } else {
                        showToast(res.message || 'Помилка при створенні', 'error');
                    }
                })
                .catch(err => {
                    console.error('Error:', err);
                    showToast('Помилка мережі', 'error');
                });
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

                // ---------------- Notifications ----------------
                // Poll for user notifications and show toasts for unread
                function pollNotifications() {
                    fetch('backend/get-user-notifications.php')
                        .then(r => r.json())
                        .then(data => {
                            if (data.status === 'success' && Array.isArray(data.notifications)) {
                                data.notifications.forEach(n => {
                                    if (n.is_read == 0) {
                                        showToast(n.message, 'info');
                                        // mark as read
                                        const fd = new FormData(); fd.append('id', n.id);
                                        fetch('backend/mark-notification-read.php', { method: 'POST', body: fd })
                                            .catch(err => console.error('mark read err', err));
                                    }
                                });
                            }
                        })
                        .catch(err => console.error('notifications err', err));
                }

                // Start polling every 20 seconds
                setInterval(pollNotifications, 20000);
                // Also poll once on load
                pollNotifications();
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

    // Load favorites into Favorites tab
    function loadFavorites() {
        const grid = document.querySelector('#tab-favorites .recipes-grid');
        if (!grid) return;

        // clear demo cards
        grid.innerHTML = '';

        fetch('backend/get-favorite-recipes.php')
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success' && Array.isArray(data.recipes)) {
                    data.recipes.forEach(recipe => {
                        const card = document.createElement('div');
                        card.className = 'recipe-card';
                        if (recipe.id) card.dataset.recipeId = recipe.id;
                        card.dataset.source = recipe.source || 'user';
                        card.dataset.ingredients = recipe.ingredients || '';
                        card.dataset.steps = recipe.instructions || '';
                        card.dataset.difficulty = 'Середня';
                        card.dataset.source = recipe.source || 'admin';

                        const image = (recipe.image_path && recipe.image_path.trim()) ? recipe.image_path : 'images/homepage/salad1.jpg';
                        const firstIngredient = (recipe.ingredients || '').split('|')[0] || '';

                        card.innerHTML = `
                            <div class="recipe-image" style="background-image: url('${escapeHtml(image)}')"></div>
                            <div class="recipe-info">
                                <h4>${escapeHtml(recipe.title || 'Без назви')}</h4>
                                <p class="recipe-description">${escapeHtml(firstIngredient)}</p>
                                <div class="recipe-meta">
                                    <div class="meta-left">
                                        <span class="cook-time">${recipe.created_at ? recipe.created_at.split(' ')[0] : 'Недавно'}</span>
                                        <span class="recipe-category">${escapeHtml(recipe.category || '')}</span>
                                    </div>
                                    <div class="meta-right">
                                        <button class="recipe-button details-btn">Переглянути</button>
                                        <button class="recipe-like liked" aria-label="Видалити з улюблених" data-recipe-id="${recipe.id}">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;

                        // ensure like button carries source info
                        const likeBtn = card.querySelector('.recipe-like');
                        if (likeBtn) likeBtn.dataset.source = card.dataset.source || 'user';
                        grid.appendChild(card);
                    });

                    // attach remove handlers (unified behavior with other pages)
                    grid.querySelectorAll('.recipe-like').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const recipeId = btn.dataset.recipeId;
                            const source = btn.dataset.source || 'user';
                            if (!recipeId) return;

                            // Optimistic UI: show unliked state and toast, then call backend
                            // Ask for confirmation to avoid accidental removals
                            if (!confirm('Видалити з улюблених?')) return;

                            fetch('backend/remove-favorite.php', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                body: `recipe_id=${encodeURIComponent(recipeId)}&source=${encodeURIComponent(source)}`
                            })
                            .then(r => r.json())
                            .then(resp => {
                                // remove card from DOM
                                const card = btn.closest('.recipe-card');
                                if (card) card.remove();
                                // update favorites count
                                const favCountElem = document.querySelector('.profile-stats span:nth-child(3) strong');
                                if (favCountElem) favCountElem.textContent = Math.max(0, parseInt(favCountElem.textContent || '0') - 1);
                                showToast('Видалено з улюблених', 'info');
                            })
                            .catch(err => {
                                console.error('Remove favorite error:', err);
                                showToast('Помилка при видаленні з улюблених', 'error');
                            });
                        });
                    });
                } else {
                    grid.innerHTML = '<p style="color:#9aa6b6;">У вас ще немає улюблених рецептів.</p>';
                }
            })
            .catch(err => {
                console.error('Error loading favorites:', err);
                grid.innerHTML = '<p style="color:#ff6b6b;">Помилка завантаження улюблених рецептів</p>';
            });
    }

    // Load favorites on initial profile load and when switching to favorites tab
    loadFavorites();

    // Simple toast helper (creates container if needed)
    function showToast(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.position = 'fixed';
            container.style.right = '20px';
            container.style.bottom = '20px';
            container.style.zIndex = 9999;
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'toast-item';
        toast.style.marginTop = '8px';
        toast.style.padding = '10px 14px';
        toast.style.borderRadius = '8px';
        toast.style.color = '#fff';
        toast.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
        toast.style.fontSize = '0.95rem';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 200ms ease, transform 200ms ease';

        if (type === 'error') {
            toast.style.background = '#e74c3c';
        } else if (type === 'success') {
            toast.style.background = '#28a745';
        } else {
            toast.style.background = '#333';
        }

        toast.textContent = message;
        container.appendChild(toast);

        // animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(-6px)';
        });

        setTimeout(() => {
            // animate out then remove
            toast.style.opacity = '0';
            toast.style.transform = '';
            setTimeout(() => toast.remove(), 400);
        }, 2600);
    }

    document.querySelectorAll('.profile-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.tab === 'favorites') {
                loadFavorites();
            }
        });
    });

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
                        
                        // Status badge colors
                        const statusColors = {
                            'pending': '#ffc107',
                            'approved': '#28a745',
                            'rejected': '#dc3545'
                        };
                        const statusTexts = {
                            'pending': '⏳ На модерації',
                            'approved': '✅ Схвалено',
                            'rejected': '❌ Відхилено'
                        };
                        const status = recipe.status || 'pending';
                        const statusColor = statusColors[status] || '#9aa6b6';
                        const statusText = statusTexts[status] || 'Невідомо';
                        
                        article.innerHTML = `
                            <div class="recipe-image" style="background-image: url('${image}')"></div>
                            <div class="recipe-info">
                                <h4>${escapeHtml(recipe.title || 'Без назви')}</h4>
                                <p class="recipe-description">${escapeHtml(firstIngredient)}</p>
                                <div class="recipe-meta">
                                    <div class="meta-left">
                                        <span class="cook-time">${recipe.created_at ? recipe.created_at.split(' ')[0] : 'Недавно'}</span>
                                        <span style="color: ${statusColor}; font-weight: 600; font-size: 0.85rem;">${statusText}</span>
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

    // Open Recipe Modal
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('details-btn')) {
            const card = e.target.closest('.recipe-card');
            if (card) openRecipeModal(card);
        }
    });

    function openRecipeModal(card) {
        const title = card.querySelector('h4')?.textContent || 'Рецепт';
        const time = card.querySelector('.cook-time')?.textContent || '';
        const category = card.querySelector('.recipe-category')?.textContent || '';
        const imgUrl = card.querySelector('.recipe-image')?.style.backgroundImage.slice(4, -1).replace(/"/g, '') || 'images/homepage/salad1.jpg';
        const ingredientsRaw = card.dataset.ingredients || '';
        const stepsRaw = card.dataset.steps || '';
        const difficulty = card.dataset.difficulty || 'Легка';

        // Create modal HTML
        const modalHtml = `
            <div class="recipe-modal-overlay">
                <div class="recipe-modal">
                    <button class="modal-close">×</button>
                    <div class="modal-image-wrap">
                        <img src="${imgUrl}" alt="${title}" onerror="this.src='images/homepage/salad1.jpg'">
                    </div>
                    <div class="modal-body">
                        <h2 id="modalTitle">${title}</h2>
                        <div class="modal-meta">
                            <span class="difficulty">${difficulty}</span>
                            <span class="cook-time">⏱️ ${time}</span>
                        </div>
                        <div class="ingredients">
                            <h4>🥘 Інгредієнти:</h4>
                            <ul>
                                ${ingredientsRaw.split('|')
                                    .filter(Boolean)
                                    .map(i => `<li>${i.trim()}</li>`)
                                    .join('')}
                            </ul>
                        </div>
                        <div class="preparation">
                            <h4>📋 Приготування:</h4>
                            <ol>
                                ${stepsRaw.split('|')
                                    .filter(Boolean)
                                    .map(s => `<li>${s.trim()}</li>`)
                                    .join('')}
                            </ol>
                        </div>
                    </div>
                </div>
            </div>`;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Get references to new elements
        const modal = document.querySelector('.recipe-modal-overlay');
        const closeBtn = modal.querySelector('.modal-close');

        // Open modal with animation
        requestAnimationFrame(() => {
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
        });


        // Close handlers
        const closeModal = () => {
            modal.classList.remove('open');
            document.body.style.overflow = '';
            setTimeout(() => modal.remove(), 300);
        };

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
    }
});

