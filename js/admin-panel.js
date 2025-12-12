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

    // Event listeners для рецептів
    document.getElementById('add-recipe-form').addEventListener('submit', handleAddRecipe);
    document.getElementById('refresh-recipes-btn').addEventListener('click', loadRecipes);
    document.getElementById('search-recipes').addEventListener('input', filterRecipes);
    // user recipes controls (moderation)
    const refreshUserBtn = document.getElementById('refresh-user-recipes-btn');
    if (refreshUserBtn) refreshUserBtn.addEventListener('click', loadUserRecipes);
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
    loadUserSettings();
    
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
        'add-recipe': 'Додати рецепт',
        'settings': 'Налаштування'
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

        row.innerHTML = `
            <td>${recipe.id}</td>
            <td><strong>${escapeHtml(recipe.title)}</strong></td>
            <td>${recipe.category || '-'}</td>
            <td>${createdDate}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-small btn-edit" onclick="openEditModal(${recipe.id})">Редагувати</button>
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
        recipe.category.toLowerCase().includes(searchTerm)
    );
    displayRecipes(filtered);
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

    // Завантаження повної інформації рецепту
    fetch(`backend/get-all-recipes.php`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const fullRecipe = data.recipes.find(r => r.id == recipeId);

                if (fullRecipe) {
                    document.getElementById('edit-recipe-id').value = fullRecipe.id;
                    document.getElementById('edit-recipe-title').value = fullRecipe.title;
                    document.getElementById('edit-recipe-category').value = fullRecipe.category;
                    document.getElementById('edit-recipe-ingredients').value = fullRecipe.ingredients;
                    document.getElementById('edit-recipe-instructions').value = fullRecipe.instructions;

                    // Показ поточного зображення
                    const imageContainer = document.getElementById('edit-current-image');
                    imageContainer.innerHTML = '';
                    if (fullRecipe.image_path) {
                        const img = document.createElement('img');
                        img.src = fullRecipe.image_path;
                        img.alt = 'Поточне зображення';
                        imageContainer.appendChild(img);
                    }

                    document.getElementById('edit-modal').classList.add('show');
                }
            }
        })
        .catch(error => console.error('Помилка завантаження:', error));
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
    if (!confirm('Ви впевнені, що хочете видалити цей рецепт?')) {
        return;
    }

    const formData = new FormData();
    formData.append('recipe_id', recipeId);

    fetch('backend/admin-delete-recipe.php', {
        method: 'POST',
        body: formData
    })
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
    if (r.category) metaBadges.push(`<span class="meta-badge">${escapeHtml(r.category)}</span>`);
    if (r.difficulty) metaBadges.push(`<span class="meta-badge">${escapeHtml(r.difficulty)}</span>`);
    if (r.time) metaBadges.push(`<span class="meta-badge">${escapeHtml(r.time)}${isNaN(r.time) ? '' : ' хв'}</span>`);

    // Show approve/reject buttons only for pending recipes
    const actionButtons = (!r.status || r.status === 'pending') ? `
            <div style="margin-top:8px; display:flex; gap:8px;">
                <button class="btn btn-success" onclick="approveUserRecipe(${r.id})">Одобрити</button>
                <button class="btn btn-secondary" onclick="rejectUserRecipe(${r.id})">Відхилити</button>
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
        </div>
    `;
    modal.classList.add('show');
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
    if (!confirm('Ви впевнені, що хочете видалити цей рецепт?')) return;
    const fd = new FormData(); fd.append('recipe_id', id);
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
}