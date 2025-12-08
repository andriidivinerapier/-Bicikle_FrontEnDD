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
    loadUserSettings();
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
