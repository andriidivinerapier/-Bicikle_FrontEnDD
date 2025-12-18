// admin-panel.js — логіка адмін панелі

// admin-panel.js — логіка адмін панелі

document.addEventListener('DOMContentLoaded', () => {
    // Спочатку сховати контент поки перевіряємо автентифікацію
    document.querySelector('.admin-container').style.opacity = '0';
    document.querySelector('.admin-container').style.pointerEvents = 'none';
    
    initializeAdminPanel();
});

function initializeAdminPanel() {
    // Перевірка автентифікації
    checkAdminAuth();

    // Event listeners для навігації
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            switchSection(section);
        });
    });

    // Ensure any leftover settings nav link is removed (safety for older templates)
    const legacySettingsLink = document.querySelector('.nav-link[data-section="settings"]');
    if (legacySettingsLink) {
        const li = legacySettingsLink.closest('li');
        if (li) li.remove();
        else legacySettingsLink.remove();
    }

    // Event listeners для рецептів
    document.getElementById('add-recipe-form').addEventListener('submit', handleAddRecipe);
    document.getElementById('refresh-recipes-btn').addEventListener('click', loadRecipes);
    document.getElementById('search-recipes').addEventListener('input', filterRecipes);
    // Image preview for add form
    const addImageInput = document.getElementById('recipe-image');
    const addImagePreview = document.getElementById('add-image-preview');
    if (addImageInput) {
        addImageInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!addImagePreview) return;
            if (file) {
                const url = URL.createObjectURL(file);
                addImagePreview.innerHTML = `<img src="${url}" alt="preview">`;
                // revoke url after image loads to free memory
                const img = addImagePreview.querySelector('img');
                if (img) img.onload = () => URL.revokeObjectURL(url);
            } else {
                addImagePreview.innerHTML = '';
            }
        });
        // clear preview on form reset
        const addForm = document.getElementById('add-recipe-form');
        if (addForm) addForm.addEventListener('reset', () => { if (addImagePreview) addImagePreview.innerHTML = ''; });
    }

    // no subcategory handling (removed)
    // user recipes controls (moderation)
    const refreshUserBtn = document.getElementById('refresh-user-recipes-btn');
    if (refreshUserBtn) refreshUserBtn.addEventListener('click', loadUserRecipes);

    // Ініціалізація форми інгредієнтів та етапів
    initializeIngredientsList();
    initializeStepsList();
    // Ініціалізація для модального редагування
    initializeEditIngredientsList();
    initializeEditStepsList();
    const searchUserInput = document.getElementById('search-user-recipes');
    if (searchUserInput) searchUserInput.addEventListener('input', filterUserRecipes);

    // Event listener для вихода
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Event listener для редагування
    document.getElementById('edit-recipe-form').addEventListener('submit', handleEditRecipe);

    // Закриття модалу
    document.querySelector('.close-modal').addEventListener('click', closeEditModal);
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeEditModal);
    });
    document.getElementById('edit-modal').addEventListener('click', (e) => {
        if (e.target.id === 'edit-modal') {
            closeEditModal();
        }
    });

    // Завантаження рецептів
    loadRecipes();
    // Завантаження рецептів користувачів (на модерації)
    if (typeof loadUserRecipes === 'function') loadUserRecipes();
    // Users management controls
    const usersSearchInput = document.getElementById('search-users');
    const refreshUsersBtn = document.getElementById('refresh-users-btn');
    if (usersSearchInput) {
        usersSearchInput.addEventListener('input', () => {
            loadUsers({ q: usersSearchInput.value });
        });
    }
    if (refreshUsersBtn) refreshUsersBtn.addEventListener('click', () => loadUsers());

    // load users list initially (if section exists)
    loadUsers();
    
    // Setup user recipes tab filtering
    const userRecipesTabs = document.querySelectorAll('.user-recipes-tab');
    if (userRecipesTabs.length > 0) {
        userRecipesTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Update current status
                window.currentUserRecipesStatus = tab.getAttribute('data-status');
                
                // Update active tab styling
                userRecipesTabs.forEach(t => {
                    t.classList.remove('active');
                    t.style.color = '#7f8c8d';
                    t.style.borderBottomColor = 'transparent';
                });
                tab.classList.add('active');
                tab.style.color = 'var(--secondary-color)';
                tab.style.borderBottomColor = 'var(--secondary-color)';
                
                // Filter and display recipes
                filterAndDisplayUserRecipes();
            });
        });
    }
}

/**
 * Перевірка автентифікації адміна
 */
function checkAdminAuth() {
    fetch('backend/session.php')
        .then(response => response.json())
        .then(data => {
            const adminContainer = document.querySelector('.admin-container');
            
            if (data.status === 'logged' && data.role === 'admin') {
                document.getElementById('admin-username').textContent = data.username || 'Адмін';
                // Показати контент - адмін авторизований
                adminContainer.style.opacity = '1';
                adminContainer.style.pointerEvents = 'auto';
            } else if (data.status === 'logged') {
                // Звичайний користувач - перенаправлення на головну
                showToast('Доступ заборонений. Адмін панель тільки для адміністраторів.', 'error');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                // Не залогінений - перенаправлення на головну
                showToast('Будь ласка, залогініться як адмін.', 'error');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            }
        })
        .catch(error => {
            console.error('Помилка перевірки автентифікації:', error);
            showToast('Помилка перевірки доступу', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        });
}

/**
 * Переключение между секциями
 */
function switchSection(sectionName) {
    // Скрытие всех секций
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });

    // Удаление активного класса со всех навигационных ссылок
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Показ нужной секции
    const sectionId = sectionName + '-section';
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }

    // Установка активного класса на навигационную ссылку
    const navLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (navLink) {
        navLink.classList.add('active');
    }

    // Обновление заголовка
    const titles = {
        'recipes': 'Рецепти',
        'user-recipes': 'Рецепти користувачів',
        'add-recipe': 'Додати рецепт'
    };
    document.getElementById('section-title').textContent = titles[sectionName] || 'Адмін Панель';
}

/**
 * Завантаження рецептів
 */
function loadRecipes() {
    showToast('Завантаження рецептів...', 'info');

    fetch('backend/admin-get-recipes.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                displayRecipes(data.recipes);
                showToast('Рецепти завантажені', 'success');
            } else {
                showToast('Помилка завантаження рецептів', 'error');
            }
        })
        .catch(error => {
            console.error('Помилка:', error);
            showToast('Помилка при запиті до сервера', 'error');
        });
}

/**
 * Отображение рецептов в таблице
 */
function displayRecipes(recipes) {
    const tbody = document.getElementById('recipes-tbody');
    tbody.innerHTML = '';

    if (recipes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading-text">Рецептів не знайдено</td></tr>';
        return;
    }

    recipes.forEach(recipe => {
        const row = document.createElement('tr');
        const createdDate = new Date(recipe.created_at).toLocaleDateString('uk-UA');
        const categoryLabel = mapCategory(recipe.category || '');

                row.innerHTML = `
            <td>${recipe.id}</td>
            <td><strong>${escapeHtml(recipe.title)}</strong></td>
            <td>${escapeHtml(categoryLabel || '-')}</td>
            <td>${createdDate}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-small btn-edit" onclick="viewRecipe(${recipe.id})">Переглянути</button>
                    <button class="btn-small btn-edit" onclick="openEditModal(${recipe.id})" aria-label="Редагувати рецепт">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor"/>
                            <path d="M20.71 7.04a1.003 1.003 0 0 0 0-1.41l-2.34-2.34a1.003 1.003 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
                        </svg>
                        <span>Редагувати</span>
                    </button>
                    <button class="btn-small btn-delete" onclick="deleteRecipe(${recipe.id})">Видалити</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Збереження рецептів для пошуку
    window.allRecipes = recipes;
}

/**
 * Фільтрація рецептів
 */
function filterRecipes() {
    const searchTerm = document.getElementById('search-recipes').value.toLowerCase();
    const filtered = window.allRecipes.filter(recipe =>
        recipe.title.toLowerCase().includes(searchTerm) ||
        (recipe.category && recipe.category.toString().toLowerCase().includes(searchTerm)) ||
        (mapCategory(recipe.category || '').toLowerCase().includes(searchTerm))
    );
    displayRecipes(filtered);
}

/**
 * Перегляд рецепту в модалі
 */
function viewRecipe(recipeId) {
    // Fetch full recipe details to ensure we have ingredients, instructions, time, difficulty
    fetch(`backend/get-recipe.php?id=${encodeURIComponent(recipeId)}`)
        .then(r => r.json())
        .then(data => {
            if (!data || data.status !== 'success' || !data.recipe) {
                showToast('Рецепт не знайдено', 'error');
                return;
            }

            const recipe = data.recipe;
            const modal = document.getElementById('edit-modal');
            const content = modal.querySelector('.modal-content');
            content.querySelector('h3').textContent = 'Перегляд рецепту';
            const form = document.getElementById('edit-recipe-form');
            form.style.display = 'none';

            let viewDiv = document.getElementById('admin-view-recipe');
            if (!viewDiv) {
                viewDiv = document.createElement('div');
                viewDiv.id = 'admin-view-recipe';
                content.appendChild(viewDiv);
            }

            const imageTag = recipe.image_path ? `<img src="${escapeHtml(recipe.image_path)}" alt="${escapeHtml(recipe.title)}">` : '';

            function splitLines(text) {
                if (!text) return [];
                return String(text).split(/(?:\r?\n|\|)+/).map(s => s.trim()).filter(Boolean);
            }

            const ingredientsList = splitLines(recipe.ingredients);
            const stepsList = splitLines(recipe.instructions);

            const ingredientsHtml = ingredientsList.length ? `
                <div class="view-section view-ingredients">
                    <strong>Інгредієнти:</strong>
                    ${ingredientsList.map((it, idx) => `<div class="view-ingredient"><span class="ingredient-number">${idx+1}.</span><div class="ingredient-text">${escapeHtml(it)}</div></div>`).join('')}
                </div>` : '';

            const instructionsHtml = stepsList.length ? `
                <div class="view-section view-steps">
                    <strong>Етапи приготування:</strong>
                    ${stepsList.map((st, idx) => `<div class="view-step"><span class="step-number">${idx+1}.</span><div class="step-text">${escapeHtml(st)}</div></div>`).join('')}
                </div>` : '';

            const metaBadges = [];
            if (recipe.category) metaBadges.push(`<span class="meta-badge">${escapeHtml(mapCategory(recipe.category))}</span>`);
            if (recipe.difficulty) metaBadges.push(`<span class="meta-badge">${escapeHtml(recipe.difficulty)}</span>`);
            if (recipe.cooking_time || recipe.time) metaBadges.push(`<span class="meta-badge">${escapeHtml(recipe.cooking_time || recipe.time)}${isNaN(recipe.cooking_time || recipe.time) ? '' : ' хв'}</span>`);

            viewDiv.innerHTML = `
                <div class="view-image">${imageTag}</div>
                <div class="view-details">
                    <h4>${escapeHtml(recipe.title)}</h4>
                    <div class="recipe-meta-row">${metaBadges.join(' ')}</div>
                    <div class="view-columns">
                        ${ingredientsHtml}
                        ${instructionsHtml}
                    </div>
                    <div class="view-section view-comments">
                        <h4>Коментарі</h4>
                        <div id="admin-comments-container" class="comments-container">Завантаження...</div>
                    </div>
                </div>
            `;

            modal.classList.add('show');
            // ensure photo is displayed on top for viewing
            modal.classList.add('view-top-image');
            // load comments for this recipe
            loadCommentsForRecipe(recipe.id);
        })
        .catch(err => {
            console.error('Помилка завантаження рецепту:', err);
            showToast('Помилка завантаження рецепту', 'error');
        });
}

/**
 * Обработка добавления рецепта
 */
function handleAddRecipe(e) {
    e.preventDefault();

    const formData = new FormData(document.getElementById('add-recipe-form'));

    fetch('backend/admin-add-recipe.php', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showToast('Рецепт успішно додано', 'success');
                document.getElementById('add-recipe-form').reset();
                switchSection('recipes');
                loadRecipes();
            } else {
                showToast(data.message || 'Помилка при додаванні рецепту', 'error');
            }
        })
        .catch(error => {
            console.error('Помилка:', error);
            showToast('Помилка при запиті до сервера', 'error');
        });
}

/**
 * Відкриття модалу редагування
 */
function openEditModal(recipeId) {
    const recipe = window.allRecipes.find(r => r.id == recipeId);

    if (!recipe) {
        showToast('Рецепт не знайдено', 'error');
        return;
    }

    // Завантаження повної інформації рецепту (запит до одного рецепту)
    fetch(`backend/get-recipe.php?id=${encodeURIComponent(recipeId)}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.status === 'success' && data.recipe) {
                const fullRecipe = data.recipe;

                document.getElementById('edit-recipe-id').value = fullRecipe.id;
                document.getElementById('edit-recipe-title').value = fullRecipe.title || '';
                document.getElementById('edit-recipe-category').value = fullRecipe.category || '';

                const editDiff = document.getElementById('edit-recipe-difficulty');
                if (editDiff) editDiff.value = fullRecipe.difficulty || '';
                const editTime = document.getElementById('edit-recipe-time');
                if (editTime) editTime.value = fullRecipe.cooking_time || fullRecipe.time || '';

                // Populate edit ingredients/steps lists (stored as '|' delimited)
                const ingCont = document.getElementById('editIngredientsContainer');
                const stepsCont = document.getElementById('editStepsContainer');
                if (ingCont) {
                    ingCont.innerHTML = '';
                    const parts = (fullRecipe.ingredients || '').toString().split(/\|/).map(s => s.trim()).filter(Boolean);
                    if (parts.length === 0) parts.push('');
                    parts.forEach((p, idx) => {
                        const item = document.createElement('div');
                        item.className = 'ingredient-item';
                        item.innerHTML = `
                            <span class="ingredient-number">${idx+1}.</span>
                            <input type="text" name="ingredients[]" value="${escapeHtml(p)}" placeholder="Додайте інгредієнт">
                            <button type="button" class="delete-btn" title="Видалити">✕</button>
                        `;
                        item.querySelector('.delete-btn').addEventListener('click', (e) => { e.preventDefault(); item.remove(); renumberContainer(ingCont, '.ingredient-number'); updateDeleteVisibility(ingCont, '.ingredient-item'); });
                        ingCont.appendChild(item);
                    });
                    renumberContainer(ingCont, '.ingredient-number');
                    updateDeleteVisibility(ingCont, '.ingredient-item');
                }

                if (stepsCont) {
                    stepsCont.innerHTML = '';
                    const parts = (fullRecipe.instructions || '').toString().split(/\|/).map(s => s.trim()).filter(Boolean);
                    if (parts.length === 0) parts.push('');
                    parts.forEach((p, idx) => {
                        const item = document.createElement('div');
                        item.className = 'step-item';
                        item.innerHTML = `
                            <span class="step-number">${idx+1}.</span>
                            <textarea name="steps[]" placeholder="Опишіть етап приготування...">${escapeHtml(p)}</textarea>
                            <button type="button" class="delete-btn" title="Видалити">✕</button>
                        `;
                        item.querySelector('.delete-btn').addEventListener('click', (e) => { e.preventDefault(); item.remove(); renumberContainer(stepsCont, '.step-number'); updateDeleteVisibility(stepsCont, '.step-item'); });
                        stepsCont.appendChild(item);
                    });
                    renumberContainer(stepsCont, '.step-number');
                    updateDeleteVisibility(stepsCont, '.step-item');
                }

                // Показ поточного зображення
                const imageContainer = document.getElementById('edit-current-image');
                if (imageContainer) imageContainer.innerHTML = '';
                if (fullRecipe.image_path) {
                    const img = document.createElement('img');
                    img.src = fullRecipe.image_path;
                    img.alt = 'Поточне зображення';
                    if (imageContainer) imageContainer.appendChild(img);
                }

                document.getElementById('edit-modal').classList.add('show');
            } else {
                showToast('Рецепт не знайдено', 'error');
            }
        })
        .catch(error => {
            console.error('Помилка завантаження:', error);
            showToast('Помилка завантаження рецепту', 'error');
        });
}

/**
 * Закриття модалу
 */
function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('show');
    // cleanup any admin view content
    if (typeof clearViewModal === 'function') clearViewModal();
}

/**
 * Обработка редагування рецепту
 */
function handleEditRecipe(e) {
    e.preventDefault();

    const formData = new FormData(document.getElementById('edit-recipe-form'));

    fetch('backend/admin-edit-recipe.php', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showToast('Рецепт успішно оновлено', 'success');
                closeEditModal();
                loadRecipes();
            } else {
                showToast(data.message || 'Помилка при оновленні рецепту', 'error');
            }
        })
        .catch(error => {
            console.error('Помилка:', error);
            showToast('Помилка при запиті до сервера', 'error');
        });
}

/**
 * Видалення рецепту
 */
function deleteRecipe(recipeId) {
    // Use admin modal with confirmation
    if (typeof showAdminModal === 'function') {
        showAdminModal({ title: 'Видалити рецепт?', message: 'Ви дійсно хочете видалити цей рецепт? Цю дію неможливо відмінити.', showReason: false })
            .then(res => {
                if (!res || !res.confirmed) return;
                const formData = new FormData();
                formData.append('recipe_id', recipeId);
                fetch('backend/admin-delete-recipe.php', { method: 'POST', body: formData })
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === 'success') {
                            showToast('Рецепт успішно видалено', 'success');
                            loadRecipes();
                        } else {
                            showToast(data.message || 'Помилка при видаленні рецепту', 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Помилка:', error);
                        showToast('Помилка при запиті до сервера', 'error');
                    });
            })
            .catch(err => console.error('confirm modal error', err));
    } else {
        // fallback to native confirm
        if (!confirm('Ви впевнені, що хочете видалити цей рецепт?')) return;
        const formData = new FormData(); formData.append('recipe_id', recipeId);
        fetch('backend/admin-delete-recipe.php', { method: 'POST', body: formData })
            .then(r => r.json())
            .then(data => { if (data.status === 'success') { showToast('Рецепт успішно видалено','success'); loadRecipes(); } else showToast(data.message||'Помилка при видаленні рецепту','error'); })
            .catch(err => { console.error(err); showToast('Помилка при запиті до сервера','error'); });
    }
}

/**
 * Завантаження налаштувань користувача
 */
function loadUserSettings() {
    fetch('backend/session.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'logged') {
                // Оновлення налаштувань на сторінці
                fetch('backend/get-user-profile.php')
                    .then(response => response.json())
                    .then(userData => {
                        if (userData.status === 'success') {
                            document.getElementById('settings-username').textContent = userData.user.username;
                            document.getElementById('settings-email').textContent = userData.user.email;
                        }
                    })
                    .catch(error => console.error('Помилка завантаження профілю:', error));
            }
        })
        .catch(error => console.error('Помилка:', error));
}

/**
 * Вихід з системи
 */
function handleLogout() {
    fetch('backend/logout.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showToast('Ви вийшли з системи', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            }
        })
        .catch(error => {
            console.error('Помилка:', error);
            window.location.href = 'index.html';
        });
}

/**
 * Показ Toast сповіщення
 */
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Екранування HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/* ======================== User recipes moderation ======================== */
// Track current filter status
window.currentUserRecipesStatus = 'pending';

function loadUserRecipes() {
    const tbody = document.getElementById('user-recipes-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="loading-text">Завантаження...</td></tr>';

    fetch('backend/admin-get-user-recipes.php')
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                window.allUserRecipes = data.recipes || [];
                filterAndDisplayUserRecipes();
            } else {
                if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="loading-text">Помилка при завантаженні</td></tr>';
            }
        })
        .catch(err => {
            console.error('Помилка:', err);
            if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="loading-text">Помилка при запиті</td></tr>';
        });
}

function filterAndDisplayUserRecipes() {
    // Filter by status (pending vs approved)
    const status = window.currentUserRecipesStatus || 'pending';
    let recipes = (window.allUserRecipes || []).filter(r => {
        // Рецепти на модерації мають status 'pending' або відсутній status
        // Опубліковані рецепти мають status 'approved' або існують в основному каталозі
        if (status === 'pending') {
            return !r.status || r.status === 'pending';
        } else if (status === 'approved') {
            return r.status === 'approved';
        }
        return true;
    });

    // Apply search filter
    const q = (document.getElementById('search-user-recipes') || {value: ''}).value.toLowerCase();
    if (q) {
        recipes = recipes.filter(r => 
            (r.title || '').toLowerCase().includes(q) || 
            (r.username || '').toLowerCase().includes(q) || 
            (r.email || '').toLowerCase().includes(q)
        );
    }

    displayUserRecipes(recipes, status);
}

function displayUserRecipes(recipes, status) {
    const tbody = document.getElementById('user-recipes-tbody');
    tbody.innerHTML = '';
    
    const statusText = status === 'pending' ? 'на модерації' : 'опублікованих';
    if (!recipes || recipes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="loading-text">Немає ${statusText} рецептів</td></tr>`;
        return;
    }

    recipes.forEach(r => {
        const tr = document.createElement('tr');
        const createdDate = new Date(r.created_at).toLocaleString('uk-UA');
        
        let actionButtons = '';
        if (status === 'pending') {
            // Модерація рецептів
            actionButtons = `
                <button class="btn-small btn-edit" onclick="viewUserRecipe(${r.id})">Переглянути</button>
                <button class="btn-small btn-edit" onclick="approveUserRecipe(${r.id})">Одобрити</button>
                <button class="btn-small btn-delete" onclick="rejectUserRecipe(${r.id})">Відхилити</button>
            `;
        } else {
            // Опубліковані рецепти
            actionButtons = `
                <button class="btn-small btn-edit" onclick="viewUserRecipe(${r.id})">Переглянути</button>
                <button class="btn-small btn-delete" onclick="deleteUserRecipe(${r.id})">Видалити</button>
            `;
        }

        tr.innerHTML = `
            <td>${r.id}</td>
            <td><strong>${escapeHtml(r.title)}</strong></td>
            <td>${escapeHtml(r.username || r.email || '-')}</td>
            <td>${r.category || '-'}</td>
            <td>${r.difficulty || '-'}</td>
            <td>${r.time ? r.time + ' хв' : '-'}</td>
            <td>${createdDate}</td>
            <td>
                <div class="table-actions">
                    ${actionButtons}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    window.userRecipes = recipes;
}

function filterUserRecipes() {
    filterAndDisplayUserRecipes();
}

function viewUserRecipe(id) {
    const r = (window.userRecipes || []).find(x => x.id == id);
    if (!r) return showToast('Рецепт не знайдено', 'error');
    const modal = document.getElementById('edit-modal');
    const content = modal.querySelector('.modal-content');
    content.querySelector('h3').textContent = 'Перегляд рецепту';
    const form = document.getElementById('edit-recipe-form');
    form.style.display = 'none';
    let viewDiv = document.getElementById('admin-view-recipe');
    if (!viewDiv) {
        viewDiv = document.createElement('div');
        viewDiv.id = 'admin-view-recipe';
        content.appendChild(viewDiv);
    }
    // build structured view: image + details
    const imageTag = r.image_path ? `<img src="${escapeHtml(r.image_path)}" alt="${escapeHtml(r.title)}">` : '';
    // prepare numbered ingredients and steps
    function splitLines(text) {
        if (!text) return [];
        // split by newline or pipe '|' to support different backend formats
        return String(text).split(/(?:\r?\n|\|)+/).map(s => s.trim()).filter(Boolean);
    }

    const ingredientsList = splitLines(r.ingredients);
    const stepsList = splitLines(r.instructions);

    const ingredientsHtml = ingredientsList.length ? `
        <div class="view-section view-ingredients">
            <strong>Інгредієнти:</strong>
            ${ingredientsList.map((it, idx) => `\n                <div class="view-ingredient"><span class="ingredient-number">${idx+1}.</span><div class="ingredient-text">${escapeHtml(it)}</div></div>`).join('')}
        </div>` : '';

    const instructionsHtml = stepsList.length ? `
        <div class="view-section view-steps">
            <strong>Етапи приготування:</strong>
            ${stepsList.map((st, idx) => `\n                <div class="view-step"><span class="step-number">${idx+1}.</span><div class="step-text">${escapeHtml(st)}</div></div>`).join('')}
        </div>` : '';
    const metaBadges = [];
    if (r.category) metaBadges.push(`<span class="meta-badge">${escapeHtml(mapCategory(r.category))}</span>`);
    if (r.difficulty) metaBadges.push(`<span class="meta-badge">${escapeHtml(r.difficulty)}</span>`);
    if (r.time) metaBadges.push(`<span class="meta-badge">${escapeHtml(r.time)}${isNaN(r.time) ? '' : ' хв'}</span>`);

    // Show approve/reject buttons only for pending recipes
    const actionButtons = (!r.status || r.status === 'pending') ? `
            <div style="margin-top:8px; display:flex; gap:8px;">
                <button class="btn-edit" style="padding:8px 12px;" onclick="approveUserRecipe(${r.id})">Одобрити</button>
                <button class="btn-delete" style="padding:8px 12px;" onclick="rejectUserRecipe(${r.id})">Відхилити</button>
            </div>` : '';
    
    viewDiv.innerHTML = `
        <div class="view-image">${imageTag}</div>
        <div class="view-details">
            <h4>${escapeHtml(r.title)}</h4>
            <div><strong>Автор:</strong> ${escapeHtml(r.username || r.email || '-')}</div>
            <div class="recipe-meta-row">${metaBadges.join(' ')}</div>
            <div class="view-columns">
                ${ingredientsHtml}
                ${instructionsHtml}
            </div>
            ${actionButtons}
            <div class="view-section view-comments">
                <h4>Коментарі</h4>
                <div id="admin-comments-container" class="comments-container">Завантаження...</div>
            </div>
        </div>
    `;
    modal.classList.add('show');
    // show image above content for easier reading
    modal.classList.add('view-top-image');
    // load comments for this recipe
    loadCommentsForRecipe(r.id);
}

// cleanup view modal content and restore edit form when modal closes
function clearViewModal() {
    const modal = document.getElementById('edit-modal');
    if (!modal) return;
    const content = modal.querySelector('.modal-content');
    const viewDiv = document.getElementById('admin-view-recipe');
    if (viewDiv) viewDiv.remove();
    const form = document.getElementById('edit-recipe-form');
    if (form) form.style.display = '';
    // restore heading
    const h3 = content.querySelector('h3');
    if (h3) h3.textContent = 'Редагувати рецепт';
    // remove view-specific layout class
    modal.classList.remove('view-top-image');
}

function approveUserRecipe(id) {
    if (!confirm('Підтвердити публікацію рецепту?')) return;
    const fd = new FormData(); fd.append('recipe_id', id); fd.append('action', 'approve');
    fetch('backend/admin-review-user-recipe.php', { method: 'POST', body: fd })
        .then(r => r.json())
        .then(res => {
            if (res.status === 'success') {
                showToast('Рецепт одобрено', 'success');
                closeEditModal();
                loadUserRecipes();
                loadRecipes();
            } else showToast(res.message || 'Помилка', 'error');
        })
        .catch(err => { console.error(err); showToast('Помилка мережі', 'error'); });
}

function rejectUserRecipe(id) {
    const reason = prompt('Вкажіть причину відхилення (буде надіслано користувачу):', '');
    if (reason === null) return; // cancelled
    const fd = new FormData(); fd.append('recipe_id', id); fd.append('action', 'reject'); fd.append('reason', reason);
    fetch('backend/admin-review-user-recipe.php', { method: 'POST', body: fd })
        .then(r => r.json())
        .then(res => {
            if (res.status === 'success') {
                showToast('Рецепт відхилено', 'success');
                loadUserRecipes();
            } else showToast(res.message || 'Помилка', 'error');
        })
        .catch(err => { console.error(err); showToast('Помилка мережі', 'error'); });
}
function deleteUserRecipe(id) {
    // require admin modal with reason when deleting user-submitted recipe
    const modalFn = (typeof showAdminModal === 'function') ? showAdminModal : null;
    const promptPromise = modalFn ? modalFn({ title: 'Видалити рецепт користувача?', message: 'Ви дійсно хочете видалити цей рецепт від користувача? Причина буде надіслана користувачу.', showReason: true }) : Promise.resolve({ confirmed: confirm('Ви впевнені, що хочете видалити цей рецепт?'), reason: '' });
    promptPromise.then(result => {
        if (!result || !result.confirmed) return;
        const fd = new FormData(); fd.append('recipe_id', id);
        if (result.reason) fd.append('reason', result.reason);
        fetch('backend/admin-delete-recipe.php', { method: 'POST', body: fd })
            .then(r => r.json())
            .then(res => {
                if (res.status === 'success') {
                    showToast('Рецепт видалено', 'success');
                    loadUserRecipes();
                    loadRecipes();
                } else showToast(res.message || 'Помилка при видаленні', 'error');
            })
            .catch(err => { console.error(err); showToast('Помилка мережі', 'error'); });
    }).catch(err => { console.error('confirm modal error', err); });
}

/**
 * Ініціалізація списку інгредієнтів
 */
function initializeIngredientsList() {
    const container = document.getElementById('ingredientsContainer');
    const addBtn = document.getElementById('addIngredientBtn');

    if (!addBtn) return;

    addBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const itemCount = container.querySelectorAll('.ingredient-item').length;
        const newItem = document.createElement('div');
        newItem.className = 'ingredient-item';
        newItem.innerHTML = `
            <span class="ingredient-number">${itemCount + 1}.</span>
            <input type="text" name="ingredients[]" placeholder="Додайте інгредієнт">
            <button type="button" class="delete-btn" title="Видалити">✕</button>
        `;

        const deleteBtn = newItem.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            newItem.remove();
            renumberIngredients();
            updateDeleteButtons();
        });

        container.appendChild(newItem);
        updateDeleteButtons();
    });

    // Додати обробники видалення до існуючих інгредієнтів
    container.querySelectorAll('.ingredient-item .delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            btn.closest('.ingredient-item').remove();
            renumberIngredients();
            updateDeleteButtons();
        });
    });

    function renumberIngredients() {
        const items = container.querySelectorAll('.ingredient-item');
        items.forEach((item, index) => {
            const numberSpan = item.querySelector('.ingredient-number');
            if (numberSpan) numberSpan.textContent = (index + 1) + '.';
        });
    }

    function updateDeleteButtons() {
        const items = container.querySelectorAll('.ingredient-item');
        items.forEach(item => {
            const deleteBtn = item.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.style.display = items.length > 1 ? 'flex' : 'none';
            }
        });
    }

    updateDeleteButtons();
}

/**
 * Ініціалізація списку етапів
 */
function initializeStepsList() {
    const container = document.getElementById('stepsContainer');
    const addBtn = document.getElementById('addStepBtn');

    if (!addBtn) return;

    addBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const itemCount = container.querySelectorAll('.step-item').length;
        const newItem = document.createElement('div');
        newItem.className = 'step-item';
        newItem.innerHTML = `
            <span class="step-number">${itemCount + 1}.</span>
            <textarea name="steps[]" placeholder="Опишіть етап приготування..."></textarea>
            <button type="button" class="delete-btn" title="Видалити">✕</button>
        `;

        const deleteBtn = newItem.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            newItem.remove();
            renumberSteps();
            updateDeleteButtons();
        });

        container.appendChild(newItem);
        updateDeleteButtons();
    });

    // Додати обробники видалення до існуючих етапів
    container.querySelectorAll('.step-item .delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            btn.closest('.step-item').remove();
            renumberSteps();
            updateDeleteButtons();
        });
    });

    function renumberSteps() {
        const items = container.querySelectorAll('.step-item');
        items.forEach((item, index) => {
            const numberSpan = item.querySelector('.step-number');
            if (numberSpan) numberSpan.textContent = (index + 1) + '.';
        });
    }

    function updateDeleteButtons() {
        const items = container.querySelectorAll('.step-item');
        items.forEach(item => {
            const deleteBtn = item.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.style.display = items.length > 1 ? 'flex' : 'none';
            }
        });
    }

    updateDeleteButtons();
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
    };
    return map[key] || String(key);
}

// Users management: load and display users list in admin panel
function loadUsers(opts = {}) {
    const q = opts.q || '';
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="loading-text">Завантаження...</td></tr>';
    // Verify admin session first to avoid silent access-denied responses
    fetch('backend/session.php').then(r => r.json()).then(sess => {
        if (!sess || sess.status !== 'logged' || sess.role !== 'admin') {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-text">Потрібна авторизація адміністратора</td></tr>';
            console.warn('loadUsers: not admin session', sess);
            return;
        }

        const params = new URLSearchParams();
        if (q) params.set('q', q);

        fetch('backend/get-users.php?' + params.toString())
            .then(r => r.json())
            .then(data => {
                // response received
                if (data.status === 'success' && Array.isArray(data.users)) {
                    displayUsers(data.users);
                } else {
                    tbody.innerHTML = `<tr><td colspan="6" class="loading-text">Помилка: ${data.message || 'Невідома помилка'}</td></tr>`;
                    if (data && data.message) showToast(data.message, 'error');
                }
            })
            .catch(err => {
                console.error('Load users error:', err);
                tbody.innerHTML = '<tr><td colspan="6" class="loading-text">Помилка завантаження</td></tr>';
                showToast('Помилка при завантаженні списку користувачів', 'error');
            });
    }).catch(err => {
        console.error('Session check failed before loading users:', err);
        tbody.innerHTML = '<tr><td colspan="6" class="loading-text">Помилка перевірки сесії</td></tr>';
    });
}

function displayUsers(users) {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-text">Користувачів не знайдено</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    users.forEach(u => {
        const tr = document.createElement('tr');
        const created = u.created_at ? new Date(u.created_at).toLocaleString('uk-UA') : '-';
        tr.innerHTML = `
            <td>${u.id}</td>
            <td>${escapeHtml(u.username || '-')}</td>
            <td>${escapeHtml(u.email || '-')}</td>
            <td>${escapeHtml(u.role || 'user')}</td>
            <td>${created}</td>
            <td>
                <button class="btn-delete" data-user-id="${u.id}">Видалити</button>
            </td>
        `;
        const delBtn = tr.querySelector('button[data-user-id]');
        if (delBtn) {
            delBtn.addEventListener('click', (e) => {
                const uid = Number(delBtn.getAttribute('data-user-id'));
                if (!uid) return;
                if (!confirm('Ви впевнені, що хочете видалити цього користувача? Цю дію не можна скасувати.')) return;
                const fd = new FormData(); fd.append('user_id', uid);
                fetch('backend/delete-user.php', { method: 'POST', body: fd })
                    .then(r => r.json())
                    .then(res => {
                        if (res && res.status === 'success') {
                            showToast('Користувача видалено', 'success');
                            loadUsers();
                        } else {
                            showToast(res.message || 'Помилка при видаленні', 'error');
                        }
                    })
                    .catch(err => {
                        console.error('Delete user error:', err);
                        showToast('Помилка при видаленні користувача', 'error');
                    });
            });
        }
        tbody.appendChild(tr);
    });
}

// Initialize ingredients list for edit modal
function initializeEditIngredientsList() {
    const container = document.getElementById('editIngredientsContainer');
    const addBtn = document.getElementById('editAddIngredientBtn');
    if (!addBtn || !container) return;

    addBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const itemCount = container.querySelectorAll('.ingredient-item').length;
        const newItem = document.createElement('div');
        newItem.className = 'ingredient-item';
        newItem.innerHTML = `
            <span class="ingredient-number">${itemCount + 1}.</span>
            <input type="text" name="ingredients[]" placeholder="Додайте інгредієнт">
            <button type="button" class="delete-btn" title="Видалити">✕</button>
        `;

        const deleteBtn = newItem.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => { e.preventDefault(); newItem.remove(); renumberContainer(container, '.ingredient-number'); updateDeleteVisibility(container, '.ingredient-item'); });

        container.appendChild(newItem);
        updateDeleteVisibility(container, '.ingredient-item');
    });

    // bind existing delete buttons
    container.querySelectorAll('.ingredient-item .delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { e.preventDefault(); btn.closest('.ingredient-item').remove(); renumberContainer(container, '.ingredient-number'); updateDeleteVisibility(container, '.ingredient-item'); });
    });

    updateDeleteVisibility(container, '.ingredient-item');
}

// Initialize steps list for edit modal
function initializeEditStepsList() {
    const container = document.getElementById('editStepsContainer');
    const addBtn = document.getElementById('editAddStepBtn');
    if (!addBtn || !container) return;

    addBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const itemCount = container.querySelectorAll('.step-item').length;
        const newItem = document.createElement('div');
        newItem.className = 'step-item';
        newItem.innerHTML = `
            <span class="step-number">${itemCount + 1}.</span>
            <textarea name="steps[]" placeholder="Опишіть етап приготування..."></textarea>
            <button type="button" class="delete-btn" title="Видалити">✕</button>
        `;

        const deleteBtn = newItem.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => { e.preventDefault(); newItem.remove(); renumberContainer(container, '.step-number'); updateDeleteVisibility(container, '.step-item'); });

        container.appendChild(newItem);
        updateDeleteVisibility(container, '.step-item');
    });

    container.querySelectorAll('.step-item .delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { e.preventDefault(); btn.closest('.step-item').remove(); renumberContainer(container, '.step-number'); updateDeleteVisibility(container, '.step-item'); });
    });

    updateDeleteVisibility(container, '.step-item');
}

// helpers used by edit initializers
function renumberContainer(container, selector) {
    // selector expected like '.ingredient-number' or '.step-number'
    const nums = container.querySelectorAll(selector);
    nums.forEach((n, i) => { n.textContent = (i + 1) + '.'; });
}

function updateDeleteVisibility(container, itemSelector) {
    const items = container.querySelectorAll(itemSelector);
    items.forEach(item => {
        const deleteBtn = item.querySelector('.delete-btn');
        if (deleteBtn) deleteBtn.style.display = items.length > 1 ? 'flex' : 'none';
    });
}

/**
 * Завантажити коментарі для рецепту та відобразити їх в модалі
 */
function loadCommentsForRecipe(recipeId) {
    const container = document.getElementById('admin-comments-container');
    if (!container) return;
    container.innerHTML = 'Завантаження...';

    fetch('backend/get-comments.php?recipe_id=' + encodeURIComponent(recipeId) + '&limit=200')
        .then(r => r.json())
        .then(data => {
            if (!data || data.status !== 'success') {
                container.innerHTML = '<div class="loading-text">Помилка завантаження коментарів</div>';
                return;
            }
            renderCommentsList(container, data.comments || [], recipeId);
        })
        .catch(err => {
            console.error('loadCommentsForRecipe error:', err);
            container.innerHTML = '<div class="loading-text">Помилка мережі</div>';
        });
}

function renderCommentsList(container, comments, recipeId) {
    const pageSize = 5;
    if (!comments || comments.length === 0) {
        container.innerHTML = '<div class="loading-text">Коментарів не знайдено</div>';
        return;
    }

    // prepare pagination state
    let currentPage = 1;
    const totalPages = Math.max(1, Math.ceil(comments.length / pageSize));

    // root list container
    const listRoot = document.createElement('div');
    listRoot.className = 'admin-comments-list-root';

    const list = document.createElement('div');
    list.className = 'admin-comments-list';

    const pagination = document.createElement('div');
    pagination.className = 'comments-pagination';

    function renderPage(page) {
        page = Math.max(1, Math.min(totalPages, page));
        currentPage = page;
        list.innerHTML = '';
        const start = (page - 1) * pageSize;
        const slice = comments.slice(start, start + pageSize);

        slice.forEach(c => {
            const item = document.createElement('div');
            item.className = 'admin-comment-item';
            const date = c.created_at ? new Date(c.created_at).toLocaleString('uk-UA') : '';
            item.innerHTML = `
                <div class="comment-main">
                    <div class="comment-header"><strong>${escapeHtml(c.username || 'Користувач')}</strong> <span class="comment-date">${escapeHtml(date)}</span></div>
                    <div class="comment-body">${escapeHtml(c.content)}</div>
                </div>
                <div class="comment-actions">
                    <button class="btn-small btn-delete" data-comment-id="${c.id}">Видалити</button>
                </div>
            `;

            const delBtn = item.querySelector('button[data-comment-id]');
            if (delBtn) {
                delBtn.addEventListener('click', () => {
                    deleteComment(c.id, recipeId);
                });
            }

            list.appendChild(item);
        });

        // render pagination buttons
        pagination.innerHTML = '';
        if (totalPages > 1) {
            const prev = document.createElement('button');
            prev.className = 'page-btn';
            prev.textContent = '<';
            prev.disabled = page === 1;
            prev.addEventListener('click', () => renderPage(currentPage - 1));
            pagination.appendChild(prev);

            // show up to 7 page buttons (compact)
            const startPage = Math.max(1, Math.min(page - 3, totalPages - 6));
            const endPage = Math.min(totalPages, startPage + 6);
            for (let p = startPage; p <= endPage; p++) {
                const btn = document.createElement('button');
                btn.className = 'page-btn' + (p === page ? ' active' : '');
                btn.textContent = String(p);
                btn.addEventListener('click', () => renderPage(p));
                pagination.appendChild(btn);
            }

            const next = document.createElement('button');
            next.className = 'page-btn';
            next.textContent = '>';
            next.disabled = page === totalPages;
            next.addEventListener('click', () => renderPage(currentPage + 1));
            pagination.appendChild(next);
        }
    }

    listRoot.appendChild(list);
    listRoot.appendChild(pagination);
    container.innerHTML = '';
    container.appendChild(listRoot);

    // initial render
    renderPage(1);
}

/**
 * Видалити коментар (адмінська дія)
 */
function deleteComment(commentId, recipeId) {
    // show admin confirm modal (uses new admin modal helper if available)
    const modalFn = (typeof showAdminModal === 'function') ? showAdminModal : null;
    const promise = modalFn ? modalFn({ title: 'Видалити коментар?', message: 'Ви дійсно хочете видалити цей коментар? Цю дію неможливо відмінити.', showReason: true }) : Promise.resolve({ confirmed: confirm('Ви впевнені, що хочете видалити цей коментар?') });
    promise.then(result => {
        if (!result || !result.confirmed) return;
        const fd = new FormData(); fd.append('comment_id', commentId);
        if (result.reason) fd.append('reason', result.reason);
        fetch('backend/delete-comment.php', { method: 'POST', body: fd })
            .then(r => r.json())
            .then(res => {
                if (res && res.status === 'success') {
                    showToast('Коментар видалено', 'success');
                    if (typeof loadCommentsForRecipe === 'function') loadCommentsForRecipe(recipeId);
                } else {
                    showToast(res.message || 'Помилка при видаленні коментаря', 'error');
                    console.error('deleteComment failed', res);
                }
            })
            .catch(err => {
                console.error('deleteComment error:', err);
                showToast('Помилка мережі', 'error');
            });
    }).catch(err => { console.error('confirm modal error', err); });
}

// Admin confirm modal helper: returns Promise<{confirmed: boolean, reason?: string}>
function showAdminConfirm(message, opts = { showReason: false, title: 'Підтвердження' }) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-delete-modal');
        if (!modal) {
            // fallback to native confirm
            const ok = window.confirm(message);
            return resolve({ confirmed: ok, reason: '' });
        }

        const titleEl = modal.querySelector('#confirm-delete-title');
        const msgEl = modal.querySelector('#confirm-delete-message');
        const reasonWrap = modal.querySelector('#confirm-delete-reason-wrap');
        const reasonInput = modal.querySelector('#confirm-delete-reason');
        const btnCancel = modal.querySelector('#confirm-delete-cancel');
        const btnYes = modal.querySelector('#confirm-delete-yes');
        const btnClose = modal.querySelector('.confirm-close');

        if (titleEl) titleEl.textContent = opts.title || 'Підтвердження';
        if (msgEl) msgEl.textContent = message || '';
        if (reasonWrap) reasonWrap.style.display = opts.showReason ? 'block' : 'none';
        if (reasonInput) reasonInput.value = '';

        modal.setAttribute('aria-hidden', 'false');
        modal.classList.add('open');
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';

        function cleanUp() {
            btnCancel.removeEventListener('click', onCancel);
            btnYes.removeEventListener('click', onYes);
            if (btnClose) btnClose.removeEventListener('click', onCancel);
            document.removeEventListener('keydown', onKey);
            modal.classList.remove('open');
            modal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
        }

        function onCancel(e) { e && e.preventDefault(); cleanUp(); resolve({ confirmed: false }); }
        function onYes(e) { e && e.preventDefault(); const reason = reasonInput ? reasonInput.value.trim() : ''; cleanUp(); resolve({ confirmed: true, reason }); }
        function onKey(e) { if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); onCancel(); } }

        btnCancel.addEventListener('click', onCancel);
        btnYes.addEventListener('click', onYes);
        if (btnClose) btnClose.addEventListener('click', onCancel);
        document.addEventListener('keydown', onKey);

        // focus yes button for accessibility
        setTimeout(() => { if (btnYes) btnYes.focus(); }, 50);
    });
}