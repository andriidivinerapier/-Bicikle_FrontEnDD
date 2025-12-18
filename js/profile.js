// Profile Page JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Ensure session is valid; if not, redirect to homepage
    fetch('backend/session.php').then(r => r.json()).then(sess => {
        if (!sess || sess.status !== 'logged') {
            // session invalid — redirect to homepage
            window.location.href = 'index.html';
            return;
        }
    }).catch(err => {
        console.error('Session check failed:', err);
    });
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

    // ---------------- Notifications ----------------
    const notifBtn = document.getElementById('notifBtn');
    const notifDropdown = document.getElementById('notifDropdown');
    const notifList = document.getElementById('notifList');
    const notifBadge = document.getElementById('notifBadge');
    // Profile header bell elements (small bell near username)
    const profileNotifBtn = document.getElementById('profileNotifBtn');
    const profileNotifBadge = document.getElementById('profileNotifBadge');
    const markAllReadBtn = document.getElementById('markAllReadBtn');

    function fetchNotifications() {
        fetch('backend/get-user-notifications.php')
            .then(r => r.json())
            .then(data => {
                if (data && data.status === 'success') {
                    renderNotifications(data.notifications || []);
                }
            })
            .catch(err => console.error('Error loading notifications:', err));
    }

    function renderNotifications(notes) {
        if (!notifList) return;
        notifList.innerHTML = '';
        if (!notes || notes.length === 0) {
            notifList.innerHTML = '<div class="notif-empty">Немає сповіщень</div>';
            if (notifBadge) { notifBadge.style.display = 'none'; notifBadge.textContent = '0'; }
            if (profileNotifBadge) { profileNotifBadge.style.display = 'none'; profileNotifBadge.textContent = '0'; }
            // disable footer buttons when no notifications
            if (clearAllBtn) { clearAllBtn.disabled = true; clearAllBtn.classList.add('disabled'); }
            if (markAllReadBtn) { markAllReadBtn.disabled = true; markAllReadBtn.classList.add('disabled'); }
            return;
        }
        let unread = 0;
        notes.forEach(n => {
            if (!n) return;
            const item = document.createElement('div');
            item.className = 'notif-item' + (n.is_read == 0 ? ' unread' : '');
            item.dataset.id = n.id;
            const time = new Date(n.created_at).toLocaleString('uk-UA');
            if (n.is_read == 0) unread++;
            item.innerHTML = `
                <div class="notif-meta">
                    <div class="notif-message">${escapeHtml(n.message)}</div>
                    <div class="notif-time">${time}</div>
                </div>
            `;
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                markNotificationRead(n.id, item);
            });
            notifList.appendChild(item);
        });
        if (unread > 0) {
            if (notifBadge) { notifBadge.style.display = 'inline-block'; notifBadge.textContent = String(unread); }
            if (profileNotifBadge) { profileNotifBadge.style.display = 'inline-block'; profileNotifBadge.textContent = String(unread); }
            // enable buttons appropriately
            if (clearAllBtn) { clearAllBtn.disabled = false; clearAllBtn.classList.remove('disabled'); }
            if (markAllReadBtn) { markAllReadBtn.disabled = false; markAllReadBtn.classList.remove('disabled'); }
        } else {
            if (notifBadge) { notifBadge.style.display = 'none'; notifBadge.textContent = '0'; }
            if (profileNotifBadge) { profileNotifBadge.style.display = 'none'; profileNotifBadge.textContent = '0'; }
            // no unread, but there may still be notifications — enable clear, disable markAll
            if (clearAllBtn) { clearAllBtn.disabled = false; clearAllBtn.classList.remove('disabled'); }
            if (markAllReadBtn) { markAllReadBtn.disabled = true; markAllReadBtn.classList.add('disabled'); }
        }
    }

    function markNotificationRead(id, itemEl) {
        if (!id) return;
        const fd = new FormData(); fd.append('id', id);
        fetch('backend/mark-notification-read.php', { method: 'POST', body: fd })
            .then(r => r.json())
            .then(res => {
                if (res && res.status === 'success') {
                    if (itemEl) itemEl.classList.remove('unread');
                    // refresh list to update badge count
                    fetchNotifications();
                }
            })
            .catch(err => console.error('Error marking notification read:', err));
    }

    if (notifBtn) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const open = notifDropdown.classList.toggle('show');
            notifDropdown.setAttribute('aria-hidden', open ? 'false' : 'true');
            notifBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (open) fetchNotifications();
        });
    }

    // small bell near profile header opens the same dropdown, positioned near button
    if (profileNotifBtn) {
        profileNotifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!notifDropdown) return;
            const isOpen = notifDropdown.classList.contains('show');
            if (isOpen) {
                // close
                notifDropdown.classList.remove('show');
                notifDropdown.setAttribute('aria-hidden', 'true');
                if (notifBtn) notifBtn.setAttribute('aria-expanded', 'false');
                profileNotifBtn.setAttribute('aria-expanded', 'false');
            } else {
                // open
                fetchNotifications();
                notifDropdown.classList.add('show');
                notifDropdown.setAttribute('aria-hidden', 'false');
                if (notifBtn) notifBtn.setAttribute('aria-expanded', 'true');
                profileNotifBtn.setAttribute('aria-expanded', 'true');
                // position near the profile button
                const rect = profileNotifBtn.getBoundingClientRect();
                const dd = notifDropdown;
                dd.style.position = 'absolute';
                dd.style.right = 'auto';
                dd.style.left = (rect.left + window.scrollX) + 'px';
                dd.style.top = (rect.bottom + window.scrollY + 8) + 'px';
                dd.style.zIndex = 1200;
            }
        });
    }

    // Close button handler for notif dropdown
    const notifCloseBtn = document.getElementById('notifCloseBtn');
    if (notifCloseBtn) {
        notifCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (notifDropdown) {
                notifDropdown.classList.remove('show');
                notifDropdown.setAttribute('aria-hidden', 'true');
            }
            if (notifBtn) notifBtn.setAttribute('aria-expanded', 'false');
            if (profileNotifBtn) profileNotifBtn.setAttribute('aria-expanded', 'false');
        });
    }

    // mark all read
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // find all unread IDs
            const ids = Array.from(document.querySelectorAll('.notif-item.unread')).map(el => el.dataset.id).filter(Boolean);
            if (ids.length === 0) {
                // nothing to mark — still close dropdown
                if (notifDropdown) {
                    notifDropdown.classList.remove('show');
                    notifDropdown.setAttribute('aria-hidden', 'true');
                }
                if (notifBtn) notifBtn.setAttribute('aria-expanded', 'false');
                if (profileNotifBtn) profileNotifBtn.setAttribute('aria-expanded', 'false');
                showToast('Немає непрочитаних сповіщень', 'info');
                return;
            }
            // mark sequentially
            Promise.all(ids.map(id => {
                const fd = new FormData(); fd.append('id', id);
                return fetch('backend/mark-notification-read.php', { method: 'POST', body: fd }).then(r => r.json()).catch(()=>null);
            }))
            .then(()=> {
                // refresh list to update badge count
                return fetchNotifications();
            })
            .finally(() => {
                // close dropdown after marking all as read
                try {
                    if (notifDropdown) {
                        notifDropdown.classList.remove('show');
                        notifDropdown.setAttribute('aria-hidden', 'true');
                    }
                    if (notifBtn) notifBtn.setAttribute('aria-expanded', 'false');
                    if (profileNotifBtn) profileNotifBtn.setAttribute('aria-expanded', 'false');
                } catch (err) { console.error('Error closing notif dropdown:', err); }
            });
        });
    }

    // Clear all notifications (permanently delete via backend)
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const items = Array.from(document.querySelectorAll('.notif-item'));
            if (items.length === 0) {
                if (notifDropdown) {
                    notifDropdown.classList.remove('show');
                    notifDropdown.setAttribute('aria-hidden', 'true');
                }
                if (notifBtn) notifBtn.setAttribute('aria-expanded', 'false');
                if (profileNotifBtn) profileNotifBtn.setAttribute('aria-expanded', 'false');
                showToast('Немає сповіщень для очищення', 'info');
                return;
            }

            if (!confirm('Ви дійсно хочете видалити всі сповіщення?')) return;

            const fd = new FormData();
            fd.append('all', '1');

            fetch('backend/delete-notifications.php', { method: 'POST', body: fd })
                .then(r => r.json())
                .then(resp => {
                    if (resp && resp.status === 'success') {
                        if (notifList) notifList.innerHTML = '<div class="notif-empty">Немає сповіщень</div>';
                        if (notifBadge) { notifBadge.style.display = 'none'; notifBadge.textContent = '0'; }
                        if (profileNotifBadge) { profileNotifBadge.style.display = 'none'; profileNotifBadge.textContent = '0'; }
                        showToast('Сповіщення видалено', 'success');
                    } else {
                        console.error('Delete notifications error', resp);
                        showToast('Помилка при очищенні сповіщень', 'error');
                    }
                })
                .catch(err => {
                    console.error('Network error deleting notifications', err);
                    showToast('Помилка мережі', 'error');
                })
                .finally(() => {
                    if (notifDropdown) {
                        notifDropdown.classList.remove('show');
                        notifDropdown.setAttribute('aria-hidden', 'true');
                    }
                    if (notifBtn) notifBtn.setAttribute('aria-expanded', 'false');
                    if (profileNotifBtn) profileNotifBtn.setAttribute('aria-expanded', 'false');
                });
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const clickedInside = notifDropdown && notifDropdown.contains(e.target);
        const clickedNotifBtn = notifBtn && notifBtn.contains(e.target);
        const clickedProfileBell = profileNotifBtn && profileNotifBtn.contains(e.target);
        if (notifDropdown && !clickedInside && !clickedNotifBtn && !clickedProfileBell) {
            notifDropdown.classList.remove('show');
            notifDropdown.setAttribute('aria-hidden', 'true');
            if (notifBtn) notifBtn.setAttribute('aria-expanded', 'false');
        }
    });

    // escapeHtml helper
    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, function (m) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]); });
    }

    // Initial fetch to update badge on load
    fetchNotifications();

    // Tab Switching
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            // Remove active from all buttons and panels
            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));

            // Add active to clicked button
            btn.classList.add('active');

            // Activate the panel that matches the tab name
            const panelEl = document.getElementById(`tab-${tabName}`);
            if (panelEl) panelEl.classList.add('active');

            // show or hide comments container inside favorites
            const commentsContainer = document.getElementById('myCommentsList');
            if (tabName === 'comments') {
                if (commentsContainer) commentsContainer.style.display = '';
                if (window.showMyComments) window.showMyComments(1);
            } else {
                if (commentsContainer) commentsContainer.style.display = 'none';
            }

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
            const settingsTabBtn = document.querySelector('[data-tab="settings"]');
            if (settingsTabBtn) {
                settingsTabBtn.click();
                setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 300);
            } else {
                // Settings tab removed: just scroll to top of profile
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    // Logout Button in Profile
    if (profileLogoutBtn) {
        profileLogoutBtn.addEventListener('click', () => {
            showConfirmModal('Ви дійсно хочете вийти з аккаунта?').then(confirmed => {
                if (!confirmed) return;
                fetch('backend/logout.php', { method: 'POST' })
                    .then(res => res.json())
                    .then(data => {
                        if (data.status === 'success') {
                            window.location.href = 'index.html';
                        } else {
                            console.error('Logout failed:', data);
                        }
                    })
                    .catch(err => console.error('Logout error:', err));
            });
        });
    }

    // Delete/Edit Recipe Buttons
    document.querySelectorAll('.recipe-card-editable .btn-icon').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (btn.classList.contains('btn-danger')) {
                // Delete recipe (call backend) using modal confirmation
                const card = btn.closest('.recipe-card');
                if (!card) return;
                showConfirmModal('Видалити цей рецепт?').then(confirmed => {
                    if (!confirmed) return;

                    const recipeId = card.dataset.recipeId || card.dataset.recipeid || '';
                    if (!recipeId) {
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.95)';
                        setTimeout(() => card.remove(), 300);
                        return;
                    }

                    const fd = new FormData(); fd.append('recipe_id', recipeId);
                    fetch('backend/delete-user-recipe.php', { method: 'POST', body: fd })
                        .then(r => r.json())
                        .then(resp => {
                            if (resp && resp.status === 'success') {
                                card.style.opacity = '0';
                                card.style.transform = 'scale(0.95)';
                                setTimeout(() => {
                                    card.remove();
                                    try { loadUserProfileStats(); } catch (e){}
                                }, 300);
                                showToast('Рецепт видалено', 'success');
                            } else {
                                console.error('Delete recipe error', resp);
                                showToast(resp.message || 'Помилка при видаленні', 'error');
                            }
                        })
                        .catch(err => {
                            console.error('Network error deleting recipe', err);
                            showToast('Помилка мережі', 'error');
                        });
                });
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

    // Settings Form Save Button — only run if a central save button (`settingsSaveBtn`) exists
    const settingsSaveBtn = document.getElementById('settingsSaveBtn');
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

    // Close create modal when clicking on overlay background
    if (createOverlay) {
        createOverlay.addEventListener('click', (e) => {
            if (e.target === createOverlay) {
                createOverlay.style.display = 'none';
                document.body.classList.remove('modal-open');
            }
        });
    }

    // Close create modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && createOverlay && createOverlay.style.display !== 'none') {
            createOverlay.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    });

    // Submit create recipe form
    if (createForm) {
        // File input handler
        const fileInput = document.getElementById('profileRecipeImage');
        const imageFileInfo = document.getElementById('imageFileName');
        const imageFileNameText = document.getElementById('imageFileNameText');
        
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    const fileName = e.target.files[0].name;
                    const fileSize = (e.target.files[0].size / 1024 / 1024).toFixed(2);
                    imageFileNameText.textContent = `${fileName} (${fileSize} MB)`;
                    imageFileInfo.style.display = 'block';
                    console.log('✅ Файл вибрано:', fileName);
                } else {
                    imageFileInfo.style.display = 'none';
                }
            });
        }
        
        // Helper function to update delete button visibility
        function updateDeleteButtonVisibility(container, itemSelector) {
            const items = container.querySelectorAll(itemSelector);
            items.forEach(item => {
                const deleteBtn = item.querySelector('.delete-btn');
                if (deleteBtn) {
                    deleteBtn.style.display = items.length > 1 ? 'flex' : 'none';
                }
            });
        }

        // Helper function to renumber items
        function renumberItems(container, numberSelector) {
            const items = container.querySelectorAll('[class$="-item"]');
            items.forEach((item, index) => {
                const numberSpan = item.querySelector(numberSelector);
                if (numberSpan) {
                    numberSpan.textContent = (index + 1) + '.';
                }
            });
        }

        // Add Ingredient Button
        const addIngredientBtn = document.getElementById('profileAddIngredientBtn');
        const ingredientsContainer = document.getElementById('profileIngredientsContainer');
        
        if (addIngredientBtn && ingredientsContainer) {
            addIngredientBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const itemCount = ingredientsContainer.querySelectorAll('.ingredient-item').length;
                const itemDiv = document.createElement('div');
                itemDiv.className = 'ingredient-item';
                itemDiv.innerHTML = `
                    <span class="ingredient-number">${itemCount + 1}.</span>
                    <input type="text" name="ingredients[]" placeholder="Додайте інгредієнт">
                    <button type="button" class="delete-btn" title="Видалити інгредієнт">✕</button>
                `;
                
                // Add delete handler for this new item
                const deleteBtn = itemDiv.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    itemDiv.remove();
                    renumberItems(ingredientsContainer, '.ingredient-number');
                    updateDeleteButtonVisibility(ingredientsContainer, '.ingredient-item');
                });
                
                ingredientsContainer.appendChild(itemDiv);
                updateDeleteButtonVisibility(ingredientsContainer, '.ingredient-item');
            });
        }

        // Add delete handlers to existing ingredient items
        if (ingredientsContainer) {
            ingredientsContainer.querySelectorAll('.ingredient-item .delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    btn.closest('.ingredient-item').remove();
                    renumberItems(ingredientsContainer, '.ingredient-number');
                    updateDeleteButtonVisibility(ingredientsContainer, '.ingredient-item');
                });
            });
        }

        // Add Step Button
        const addStepBtn = document.getElementById('profileAddStepBtn');
        const stepsContainer = document.getElementById('profileStepsContainer');
        
        if (addStepBtn && stepsContainer) {
            addStepBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const itemCount = stepsContainer.querySelectorAll('.step-item').length;
                const stepDiv = document.createElement('div');
                stepDiv.className = 'step-item';
                stepDiv.innerHTML = `
                    <span class="step-number">${itemCount + 1}.</span>
                    <textarea name="steps[]" placeholder="Опишіть етап приготування..."></textarea>
                    <button type="button" class="delete-btn" title="Видалити етап">✕</button>
                `;
                
                // Add delete handler for this new item
                const deleteBtn = stepDiv.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    stepDiv.remove();
                    renumberItems(stepsContainer, '.step-number');
                    updateDeleteButtonVisibility(stepsContainer, '.step-item');
                });
                
                stepsContainer.appendChild(stepDiv);
                updateDeleteButtonVisibility(stepsContainer, '.step-item');
            });
        }

        // Add delete handlers to existing step items
        if (stepsContainer) {
            stepsContainer.querySelectorAll('.step-item .delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    btn.closest('.step-item').remove();
                    renumberItems(stepsContainer, '.step-number');
                    updateDeleteButtonVisibility(stepsContainer, '.step-item');
                });
            });
        }

        // Initialize delete button visibility on page load
        if (ingredientsContainer) {
            updateDeleteButtonVisibility(ingredientsContainer, '.ingredient-item');
        }
        if (stepsContainer) {
            updateDeleteButtonVisibility(stepsContainer, '.step-item');
        }

        createForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Збираємо дані
            const title = document.getElementById('profileRecipeTitle').value.trim();
            const difficulty = document.getElementById('profileRecipeDifficulty').value.trim();
            const time = document.getElementById('profileRecipeTime').value.trim();
            const category = document.getElementById('profileRecipeCategory').value.trim();
            const imageInput = document.getElementById('profileRecipeImage');
            
            // Збираємо інгредієнти та етапи з форми напряму
            const formData = new FormData(createForm);
            const ingredientsArray = formData.getAll('ingredients[]').filter(v => v.trim());
            const stepsArray = formData.getAll('steps[]').filter(v => v.trim());
            
            console.log('Form Data:', { title, difficulty, time, category, ingredients: ingredientsArray, steps: stepsArray });
            
            // Валідація - включаючи фото!
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
            
            // Перевірити фото
            if (!imageInput.files || imageInput.files.length === 0) {
                console.log('❌ Фото не вибрано!');
                showToast('Виберіть фото рецепту!', 'error');
                return;
            }
            
            const file = imageInput.files[0];
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            
            if (!allowedTypes.includes(file.type)) {
                console.log('❌ Невідомий формат фото:', file.type);
                showToast('Дозволені формати: JPG, PNG, GIF, WebP', 'error');
                return;
            }
            
            if (file.size > 10 * 1024 * 1024) { // 10MB максимум
                console.log('❌ Фото занадто велике:', file.size);
                showToast('Фото не повинна перевищувати 10MB', 'error');
                return;
            }
            
            console.log('✅ Фото валідно:', file.name, file.size);


            //準備FormData з усіма даними
            const fd = new FormData(createForm);
            fd.append('ingredients', JSON.stringify(ingredientsArray));
            fd.append('steps', JSON.stringify(stepsArray));
            
            // Debug: log what we're sending
            console.log('📋 FormData entries:');
            for (let [key, value] of fd.entries()) {
                if (key === 'image') {
                    console.log(`  ${key}: File(${value.size} bytes, name: ${value.name})`);
                } else if (typeof value === 'string' && value.length > 100) {
                    console.log(`  ${key}: "${value.substring(0, 100)}..."`);
                } else {
                    console.log(`  ${key}: ${value}`);
                }
            }
            
            fetch('backend/create-recipe.php', { method: 'POST', body: fd })
                .then(r => r.json())
                .then(res => {
                    console.log('📝 Response:', res);
                    if (res.debug_upload) {
                        console.log('📤 Upload Debug:', res.debug_upload);
                    }
                    if (res.status === 'success') {
                        showToast('Рецепт відправлено на модерацію', 'success');
                        console.log('✅ Recipe created with image_path:', res.image_path);
                        if (createOverlay) {
                            createOverlay.style.display = 'none';
                            document.body.classList.remove('modal-open');
                        }
                        createForm.reset();
                        // Reload user recipes after a short delay
                        setTimeout(() => {
                            loadUserRecipes();
                        }, 500);
                    } else {
                        showToast(res.message || 'Помилка при створенні', 'error');
                        if (res.debug) {
                            console.error('❌ Debug info:', res.debug);
                        }
                    }
                })
                .catch(err => {
                    console.error('❌ Error:', err);
                    showToast('Помилка мережі', 'error');
                });
        });
    }

    // Change Password handled in settings-profile.js (no-op here to avoid duplicate alerts)

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

    // Confirm modal helper
    function showConfirmModal(message) {
        return new Promise((resolve) => {
            let modal = document.getElementById('confirmModal');
            if (!modal) return resolve(false);
            // ensure modal is appended to body so fixed positioning works reliably
            if (modal.parentElement !== document.body) document.body.appendChild(modal);
            modal.style.position = 'fixed';
            const msg = modal.querySelector('#confirmModalMessage');
            const yesBtn = modal.querySelector('#confirmModalYes');
            const noBtn = modal.querySelector('#confirmModalNo');

            msg.textContent = message || 'Підтвердіть дію';

            function cleanup() {
                modal.classList.remove('open');
                modal.setAttribute('aria-hidden', 'true');
                yesBtn.removeEventListener('click', onYes);
                noBtn.removeEventListener('click', onNo);
                modal.removeEventListener('click', onBackdrop);
                document.removeEventListener('keydown', onKey);
                document.body.classList.remove('modal-open');
            }

            function onYes(e) { e && e.stopPropagation(); cleanup(); resolve(true); }
            function onNo(e) { e && e.stopPropagation(); cleanup(); resolve(false); }
            function onBackdrop(e) { if (e.target === modal) { cleanup(); resolve(false); } }
            function onKey(e) { if (e.key === 'Escape') { cleanup(); resolve(false); } }

            yesBtn.addEventListener('click', onYes);
            noBtn.addEventListener('click', onNo);
            modal.addEventListener('click', onBackdrop);
            document.addEventListener('keydown', onKey);

            // show
            modal.classList.add('open');
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open');
            // focus yes button for accessibility
            setTimeout(() => { try { yesBtn.focus(); } catch (e) {} }, 50);
        });
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
                                        ${(() => {
                                            const t = recipe.cooking_time || recipe.time || '';
                                            const formatted = t === '' ? '30 хв' : (isNaN(t) ? t : `${t} хв`);
                                            return `<span class="cook-time">${escapeHtml(formatted)}</span>`;
                                        })()}
                                        <span class="recipe-category">${escapeHtml(mapCategory(recipe.category || ''))}</span>
                                    </div>
                                    <div class="meta-right">
                                        <button class="recipe-button">Рецепт</button>
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
                    console.log(`📦 Found ${data.recipes.length} recipes`);
                    // keep recipes for editing
                    window.userRecipes = data.recipes;
                    data.recipes.forEach((recipe, idx) => {
                        console.log(`  Recipe ${idx+1}: "${recipe.title}" - image_path: "${recipe.image_path}"`);
                        
                        const article = document.createElement('div');
                        article.className = 'recipe-card recipe-card-editable';
                        
                        // Отримуємо image_path
                        let image = recipe.image_path ? recipe.image_path.trim() : '';
                        
                        // Якщо пусто або невалідно, використовуємо fallback
                        if (!image || image === '0' || image === 'null') {
                            image = 'images/homepage/salad1.jpg';
                        }
                        
                        console.log(`    Image path from DB: "${recipe.image_path}"`);
                        console.log(`    Final image URL: "${image}"`);
                        
                        // Логуємо файл для перевірки
                        const fileCheckUrl = image;
                        console.log(`    Will try to load from: ${fileCheckUrl}`);
                        const ingredients = recipe.ingredients || '';
                        const firstIngredient = ingredients.split('|')[0] || 'Рецепт';
                        const tval = recipe.cooking_time || recipe.time || '';
                        const formattedTime = (tval === '' ? '' : (isNaN(tval) ? tval : `${tval} хв`));
                        
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
                                        <button class="recipe-button">Рецепт</button>
                                        <span style="color: ${statusColor}; font-weight: 600; font-size: 0.85rem; margin-left: 8px;">${statusText}</span>
                                    </div>
                                    <div class="meta-right">
                                        <button class="btn-icon" title="Редагувати"><i class="fas fa-edit"></i></button>
                                        <button class="btn-icon btn-danger" title="Видалити"><i class="fas fa-trash-alt"></i></button>
                                    </div>
                                </div>
                            </div>
                        `;
                        // attach recipe id and full data for backend/ modal operations
                        article.dataset.recipeId = recipe.id || '';
                        article.dataset.ingredients = recipe.ingredients || '';
                        article.dataset.steps = recipe.instructions || '';
                        article.dataset.difficulty = recipe.difficulty || '';
                        article.dataset.time = tval || '';
                        grid.appendChild(article);
                    });
                    console.log(`✅ Завантажено ${data.recipes.length} рецептів`);
                    
                    // Re-attach delete handlers to new cards
                    attachRecipeCardHandlers();
                    
                    // Оновимо статистику після завантаження рецептів
                    loadUserProfileStats();
                } else {
                    console.log('ℹ️ Рецептів не знайдено');
                    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #9aa6b6;">Ви ще не створили рецептів. Натисніть "Додати новий рецепт", щоб почати!</p>';
                    
                    // Оновимо статистику також
                    loadUserProfileStats();
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
    
    // map stored category keys to human-friendly Ukrainian labels
    function mapCategory(key) {
        if (!key) return '';
        const map = {
            breakfast: 'Сніданок',
            lunch: 'Обід',
            dinner: 'Вечеря',
            desserts: 'Десерти',
            salads: 'Салати',
            soups: 'Супи',
            snacks: 'Закуски',
            drinks: 'Напої',
            vegan: 'Веганські',
            pastries: 'Тістечка'
            , season_spring: 'Весняні'
            , season_summer: 'Літні'
            , season_autumn: 'Осінні'
            , season_winter: 'Зимові'
            };
        return map[key] || String(key);
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
            // Delete recipe (call backend) using confirm modal
            const card = this.closest('.recipe-card');
            if (!card) return;
            showConfirmModal('Видалити цей рецепт?').then(confirmed => {
                if (!confirmed) return;

                const recipeId = card.dataset.recipeId || card.dataset.recipeid || '';
                if (!recipeId) {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.95)';
                    setTimeout(() => { card.remove(); loadUserProfileStats(); }, 300);
                    return;
                }

                const fd = new FormData(); fd.append('recipe_id', recipeId);
                fetch('backend/delete-user-recipe.php', { method: 'POST', body: fd })
                    .then(r => r.json())
                    .then(resp => {
                        if (resp && resp.status === 'success') {
                            card.style.opacity = '0';
                            card.style.transform = 'scale(0.95)';
                            setTimeout(() => { card.remove(); loadUserProfileStats(); }, 300);
                            showToast('Рецепт видалено', 'success');
                        } else {
                            console.error('Delete recipe error', resp);
                            showToast(resp.message || 'Помилка при видаленні', 'error');
                        }
                    })
                    .catch(err => {
                        console.error('Network error deleting recipe', err);
                        showToast('Помилка мережі', 'error');
                    });
            });
        } else {
            // Edit recipe - open edit modal for user's recipe
            const card = this.closest('.recipe-card');
            if (!card) return;
            const recipeId = card.dataset.recipeId || card.dataset.recipeid || '';
            if (!recipeId) return;
            openUserEditModal(recipeId);
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

    // Open Recipe Modal (react to recipe-button or legacy details-btn)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('recipe-button') || e.target.classList.contains('details-btn')) {
            const card = e.target.closest('.recipe-card');
            if (card) openRecipeModal(card);
        }
    });

    function openRecipeModal(card) {
    const title = card.querySelector('h4')?.textContent || 'Рецепт';
    const rawTime = card.dataset.time || card.querySelector('.cook-time')?.textContent || '';
    const time = rawTime ? (isNaN(rawTime) ? rawTime : `${rawTime} хв`) : '';
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
                        <section class="comments-section" aria-labelledby="commentsTitle">
                            <h4 id="commentsTitle">Коментарі</h4>
                            <div class="comments-list" id="modalCommentsList">
                                <!-- comments loaded by JS -->
                            </div>
                            <form id="modalCommentForm" class="comment-form">
                                <textarea name="comment" placeholder="Напишіть коментар..." required></textarea>
                                <button type="submit">Надіслати</button>
                            </form>
                        </section>
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

        // set recipe id on modal and fire event for comments loader
        try { modal.setAttribute('data-recipe-id', card.dataset.recipeId || card.dataset.recipe_id || ''); } catch (e) {}
        document.dispatchEvent(new CustomEvent('recipeModalOpen', { detail: { recipeId: card.dataset.recipeId || card.dataset.recipe_id || '' } }));


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

    // ---------- User edit modal handling ----------
    function openUserEditModal(recipeId) {
        const modal = document.getElementById('edit-modal');
        const form = document.getElementById('edit-recipe-form');

        function populateAndShow(recipe) {
            if (!recipe) return showToast('Рецепт не знайдено', 'error');
            document.getElementById('edit-recipe-id').value = recipe.id || '';
            document.getElementById('editRecipeTitle').value = recipe.title || '';
            document.getElementById('editRecipeCategory').value = recipe.category || '';
            const diff = document.getElementById('editRecipeDifficulty'); if (diff) diff.value = recipe.difficulty || '';
            const t = document.getElementById('editRecipeTime'); if (t) t.value = recipe.cooking_time || recipe.time || '';

            // populate ingredients and steps into dynamic lists
            const ingCont = document.getElementById('editIngredientsContainer');
            const stepsCont = document.getElementById('editStepsContainer');
            if (ingCont) {
                ingCont.innerHTML = '';
                const ingredients = (recipe.ingredients || '').split('|').map(s => s.trim()).filter(Boolean);
                if (ingredients.length === 0) ingredients.push('');
                ingredients.forEach((ing, idx) => {
                    const div = document.createElement('div'); div.className = 'ingredient-item';
                    div.innerHTML = `<span class="ingredient-number">${idx+1}.</span><input type="text" name="ingredients[]" value="${escapeHtml(ing)}"><button type="button" class="delete-btn">✕</button>`;
                    ingCont.appendChild(div);
                });
            }
            if (stepsCont) {
                stepsCont.innerHTML = '';
                const steps = (recipe.instructions || '').split('|').map(s => s.trim()).filter(Boolean);
                if (steps.length === 0) steps.push('');
                steps.forEach((st, idx) => {
                    const div = document.createElement('div'); div.className = 'step-item';
                    div.innerHTML = `<span class="step-number">${idx+1}.</span><textarea name="steps[]">${escapeHtml(st)}</textarea><button type="button" class="delete-btn">✕</button>`;
                    stepsCont.appendChild(div);
                });
            }

            const imageContainer = document.getElementById('edit-current-image');
            if (imageContainer) {
                imageContainer.innerHTML = '';
                if (recipe.image_path) {
                    const img = document.createElement('img'); img.src = recipe.image_path; img.alt = 'Поточне зображення';
                    imageContainer.appendChild(img);
                }
            }

            // initialize delete buttons and counters
            renumberItems(ingCont || document, '.ingredient-number');
            renumberItems(stepsCont || document, '.step-number');
            updateDeleteButtonVisibility(ingCont || document, '.ingredient-item');
            updateDeleteButtonVisibility(stepsCont || document, '.step-item');

            // attach delete handlers for newly created items
            if (ingCont) {
                ingCont.querySelectorAll('.ingredient-item .delete-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => { e.preventDefault(); btn.closest('.ingredient-item').remove(); renumberItems(ingCont, '.ingredient-number'); updateDeleteButtonVisibility(ingCont, '.ingredient-item'); });
                });
            }
            if (stepsCont) {
                stepsCont.querySelectorAll('.step-item .delete-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => { e.preventDefault(); btn.closest('.step-item').remove(); renumberItems(stepsCont, '.step-number'); updateDeleteButtonVisibility(stepsCont, '.step-item'); });
                });
            }

            // show modal
            if (modal) modal.classList.add('show');

            // attach close handlers
            document.querySelectorAll('#edit-modal .close-modal').forEach(btn => btn.addEventListener('click', () => {
                if (modal) modal.classList.remove('show');
            }));

            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) modal.classList.remove('show');
                });
            }

            // attach submit handler once
            if (!window._profileEditHandlerAttached) {
                form.addEventListener('submit', handleUserEditRecipe);
                window._profileEditHandlerAttached = true;
            }
        }

        const recipes = window.userRecipes || [];
        let recipe = recipes.find(r => String(r.id) === String(recipeId));
        if (recipe) return populateAndShow(recipe);

        // fallback: reload from server
        fetch('backend/get-user-recipes.php')
            .then(r => r.json())
            .then(data => {
                if (data && data.status === 'success' && Array.isArray(data.recipes)) {
                    window.userRecipes = data.recipes;
                    recipe = data.recipes.find(r => String(r.id) === String(recipeId));
                    populateAndShow(recipe);
                } else {
                    showToast('Не вдалося завантажити рецепт', 'error');
                }
            })
            .catch(err => {
                console.error('Error loading user recipes for edit:', err);
                showToast('Помилка мережі', 'error');
            });
    }

    function handleUserEditRecipe(e) {
        e.preventDefault();
        const form = document.getElementById('edit-recipe-form');
        // collect arrays from dynamic fields
        const ingredientsArray = Array.from((form.querySelectorAll('input[name="ingredients[]"]') || [])).map(i => i.value.trim()).filter(Boolean);
        const stepsArray = Array.from((form.querySelectorAll('textarea[name="steps[]"]') || [])).map(i => i.value.trim()).filter(Boolean);
        // Client-side validation to avoid server-side 'Заповніть всі обов\'язкові поля'
        const title = (form.querySelector('input[name="title"]') || {}).value || '';
        const difficulty = (form.querySelector('select[name="difficulty"]') || {}).value || '';
        const timeVal = (form.querySelector('select[name="time"]') || form.querySelector('input[name="time"]') || {}).value || '';

        if (!title.trim() || !difficulty.trim() || !timeVal.toString().trim() || ingredientsArray.length === 0 || stepsArray.length === 0) {
            showToast("Заповніть всі обов'язкові поля", 'error');
            return;
        }

        const fd = new FormData(form);
        fd.append('ingredients', JSON.stringify(ingredientsArray));
        fd.append('steps', JSON.stringify(stepsArray));
        // Debug: log FormData contents before sending
        console.group('EditRecipe: FormData to send');
        for (let pair of fd.entries()) {
            if (pair[0] === 'image' && pair[1] instanceof File) {
                console.log(pair[0], 'File:', pair[1].name, pair[1].size);
            } else {
                console.log(pair[0], pair[1]);
            }
        }
        console.groupEnd();

        // send and robustly log server response (try JSON, fall back to raw text)
        fetch('backend/edit-user-recipe.php', { method: 'POST', body: fd })
            .then(async r => {
                const status = r.status;
                const ok = r.ok;
                let json = null;
                let text = null;
                try {
                    json = await r.clone().json();
                } catch (err) {
                    try { text = await r.clone().text(); } catch (e) { text = null; }
                }
                return { status, ok, json, text };
            })
            .then(result => {
                console.log('EditRecipe: server result', result);
                const resp = result.json || null;

                if (resp && resp.status === 'success') {
                    showToast(resp.message || 'Рецепт оновлено', 'success');
                    const modal = document.getElementById('edit-modal');
                    if (modal) modal.classList.remove('show');
                    setTimeout(() => loadUserRecipes(), 300);
                    return;
                }

                // If server didn't return JSON, include raw text in logs
                if (!resp && result.text) {
                    console.error('Edit failed: non-JSON response from server:', result.text);
                    showToast(result.text || 'Помилка при оновленні', 'error');
                    return;
                }

                // Otherwise resp is JSON but reports error
                console.error('Edit failed:', resp || result);
                showToast((resp && resp.message) || 'Помилка при оновленні', 'error');
            })
            .catch(err => {
                console.error('Error updating user recipe:', err);
                showToast('Помилка мережі', 'error');
            });
    }

    // ---- Edit form helpers: file preview, add/remove ingredients/steps ----
    // initialize edit form controls when module loads
    (function initEditFormControls(){
        const fileInput = document.getElementById('editRecipeImage');
        const imageFileInfo = document.getElementById('editImageFileName');
        const imageFileNameText = document.getElementById('editImageFileNameText');
        const addIngredientBtn = document.getElementById('editAddIngredientBtn');
        const ingredientsContainer = document.getElementById('editIngredientsContainer');
        const addStepBtn = document.getElementById('editAddStepBtn');
        const stepsContainer = document.getElementById('editStepsContainer');

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    const fileName = e.target.files[0].name;
                    const fileSize = (e.target.files[0].size / 1024 / 1024).toFixed(2);
                    if (imageFileNameText) imageFileNameText.textContent = `${fileName} (${fileSize} MB)`;
                    if (imageFileInfo) imageFileInfo.style.display = 'block';
                    // show preview inside edit modal replacing current image
                    const imageContainer = document.getElementById('edit-current-image');
                    if (imageContainer) {
                        imageContainer.innerHTML = '';
                        const url = URL.createObjectURL(e.target.files[0]);
                        const img = document.createElement('img');
                        img.src = url;
                        img.alt = 'Нове зображення';
                        img.onload = () => URL.revokeObjectURL(url);
                        imageContainer.appendChild(img);
                    }
                } else if (imageFileInfo) {
                    imageFileInfo.style.display = 'none';
                }
            });
        }

        if (addIngredientBtn && ingredientsContainer) {
            addIngredientBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const itemCount = ingredientsContainer.querySelectorAll('.ingredient-item').length;
                const itemDiv = document.createElement('div');
                itemDiv.className = 'ingredient-item';
                itemDiv.innerHTML = `\n                    <span class="ingredient-number">${itemCount + 1}.</span>\n                    <input type="text" name="ingredients[]" placeholder="Додайте інгредієнт">\n                    <button type="button" class="delete-btn" title="Видалити інгредієнт">✕</button>\n                `;
                const deleteBtn = itemDiv.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', (e) => {
                    e.preventDefault(); itemDiv.remove(); renumberItems(ingredientsContainer, '.ingredient-number'); updateDeleteButtonVisibility(ingredientsContainer, '.ingredient-item');
                });
                ingredientsContainer.appendChild(itemDiv);
                updateDeleteButtonVisibility(ingredientsContainer, '.ingredient-item');
            });
        }

        if (ingredientsContainer) {
            ingredientsContainer.querySelectorAll('.ingredient-item .delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault(); btn.closest('.ingredient-item').remove(); renumberItems(ingredientsContainer, '.ingredient-number'); updateDeleteButtonVisibility(ingredientsContainer, '.ingredient-item');
                });
            });
        }

        if (addStepBtn && stepsContainer) {
            addStepBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const itemCount = stepsContainer.querySelectorAll('.step-item').length;
                const stepDiv = document.createElement('div');
                stepDiv.className = 'step-item';
                stepDiv.innerHTML = `\n                    <span class="step-number">${itemCount + 1}.</span>\n                    <textarea name="steps[]" placeholder="Опишіть етап приготування..."></textarea>\n                    <button type="button" class="delete-btn" title="Видалити етап">✕</button>\n                `;
                const deleteBtn = stepDiv.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', (e) => { e.preventDefault(); stepDiv.remove(); renumberItems(stepsContainer, '.step-number'); updateDeleteButtonVisibility(stepsContainer, '.step-item'); });
                stepsContainer.appendChild(stepDiv);
                updateDeleteButtonVisibility(stepsContainer, '.step-item');
            });
        }

        if (stepsContainer) {
            stepsContainer.querySelectorAll('.step-item .delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => { e.preventDefault(); btn.closest('.step-item').remove(); renumberItems(stepsContainer, '.step-number'); updateDeleteButtonVisibility(stepsContainer, '.step-item'); });
            });
        }
    })();
});

