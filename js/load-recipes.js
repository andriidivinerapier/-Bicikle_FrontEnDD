// js/load-recipes.js — динамічно завантажує рецепти з API

async function loadRecipes(containerId, options = {}) {
    const {
        category = 'all',
        page = 1,
        per_page = 12,
        search = '',
        onLoad = null,
        renderCard = null
    } = options;

    const container = containerId ? document.getElementById(containerId) : null;

    try {
        // small local toast helper (uses global showToast if present)
        function _showToast(msg, type = 'info') {
            try {
                if (typeof window.showToast === 'function') return window.showToast(msg, type);
            } catch (e) {}
            // fallback
            if (type === 'error') console.error(msg);
            else console.log(msg);
            try { alert(msg); } catch (e) {}
        }

        const params = new URLSearchParams({
            category,
            page,
            per_page,
            search
        });

        const response = await fetch(`backend/get-recipes.php?${params}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (data.status !== 'success') throw new Error(data.message || 'Unknown error');

        // Очищуємо контейнер тільки якщо він існує
        if (container) {
            container.innerHTML = '';

            // Рендеримо рецепти
            data.data.forEach(recipe => {
                if (renderCard) {
                    container.appendChild(renderCard(recipe));
                } else {
                    container.appendChild(createRecipeCard(recipe));
                }
            });

            // Після рендеру позначаємо вже вподобані рецепти для поточного користувача
            fetch('backend/get-favorites.php')
                .then(r => r.json())
                .then(favData => {
                    if (favData && Array.isArray(favData.favorites)) {
                        const favSet = new Set(favData.favorites.map(String));
                        container.querySelectorAll('.recipe-card').forEach(card => {
                            const id = card.dataset.recipeId;
                            const source = card.dataset.source || 'admin';
                            const likeBtn = card.querySelector('.recipe-like');
                            const key = source + ':' + String(id);
                            if (id && likeBtn && favSet.has(key)) {
                                likeBtn.classList.add('liked');
                                likeBtn.style.color = '#ff6b6b';
                                likeBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
                            }
                        });
                    }
                })
                .catch(err => {
                    // не критично, просто лог
                    console.log('Could not load favorites:', err);
                });
        }

        // Callback
        if (onLoad) {
            onLoad(data);
        }

        // Regardless of whether we rendered into a specific container or used callbacks,
        // mark already-favorited recipes across the whole page so hearts remain active after reload.
        fetch('backend/get-favorites.php')
            .then(r => r.json())
            .then(favData => {
                if (favData && Array.isArray(favData.favorites)) {
                    const favSet = new Set(favData.favorites.map(String));
                    document.querySelectorAll('.recipe-like').forEach(btn => {
                        // try to find recipe id on button or on ancestor card
                        const article = btn.closest('.recipe-card');
                        const id = btn.dataset.recipeId || article?.dataset.recipeId;
                        const source = btn.dataset.source || article?.dataset.source || 'admin';
                        const key = source + ':' + String(id);
                        if (id && favSet.has(key)) {
                            btn.classList.add('liked');
                            btn.style.color = '#ff6b6b';
                            btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
                        }
                    });
                }
            })
            .catch(err => {
                // not critical — log and continue
                console.log('Could not load favorites:', err);
            });

        return data;
    } catch (error) {
        console.error('Error loading recipes:', error);
        if (container) {
            container.innerHTML = `<p style="color: red; grid-column: 1/-1; text-align: center;">Помилка завантаження рецептів: ${error.message}</p>`;
        }
    }
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

// Функція для створення картки рецепту
function createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.dataset.recipeId = recipe.id;
    // store source if backend provided it, otherwise default to admin
    card.dataset.source = recipe.source || 'admin';
    card.dataset.difficulty = recipe.difficulty;
    card.dataset.ingredients = recipe.ingredients_array.join('|');
    card.dataset.steps = recipe.instructions_array.join('|');

    const imageUrl = recipe.image_path || 'images/homepage/placeholder.jpg';
    const cookTime = recipe.cooking_time || '30';

    card.innerHTML = `
        <div class="recipe-image" style="background-image: url('${imageUrl}');"></div>
        <div class="recipe-info">
            <h4>${recipe.title}</h4>
            <p class="recipe-description">${recipe.instructions_array[0] || 'Смачний рецепт'}</p>
            <div class="recipe-meta">
                <div class="meta-left">
                    <span class="cook-time">${cookTime} хв</span>
                    <span class="recipe-category">${mapCategory(recipe.category)}</span>
                </div>
                <div class="meta-right">
                    <button class="recipe-button">Рецепт</button>
                    <button class="recipe-like" aria-label="Додати в улюблені">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;

    // Додаємо обробник для кнопки лайку
    const likeBtn = card.querySelector('.recipe-like');
    if (likeBtn) likeBtn.dataset.source = card.dataset.source;
    if (likeBtn) {
        likeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Перевіряємо чи користувач залогінений
            fetch('backend/session.php')
                .then(r => r.json())
                .then(data => {
                    if (data.status !== 'logged') {
                        // Показуємо авт модал
                        if (typeof openAuthModal === 'function') {
                            openAuthModal();
                        } else {
                            alert('Будь ласка, увійдіть, щоб додавати улюблені.');
                        }
                        return;
                    }

                    // Перевіряємо чи вже вподобано
                    const isLiked = likeBtn.classList.contains('liked');
                    const endpoint = isLiked ? 'backend/remove-favorite.php' : 'backend/add-favorite.php';
                    const recipeId = card.dataset.recipeId;

                    const formData = new FormData();
                    formData.append('recipe_id', recipeId);
                    formData.append('source', card.dataset.source || 'admin');

                    fetch(endpoint, {
                        method: 'POST',
                        body: formData
                    })
                        .then(r => r.json())
                        .then(res => {
                            if (res && (res.success || res.status === 'success')) {
                                likeBtn.classList.toggle('liked');
                                // Заповняємо серце якщо вподобано
                                if (likeBtn.classList.contains('liked')) {
                                    likeBtn.style.color = '#ff6b6b';
                                    likeBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
                                } else {
                                    likeBtn.style.color = '';
                                    likeBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" stroke-width="2"/></svg>';
                                }
                            } else {
                                const msg = (res && (res.message || res.error || res.status)) || 'Помилка при додаванні в улюблені';
                                _showToast(msg, 'error');
                                console.error('Add favorite response:', res);
                            }
                        })
                        .catch(err => {
                            console.error('Like error:', err);
                            _showToast('Помилка при додаванні в улюблені', 'error');
                        });
                });
        });
    }

    return card;
}

// Завантажуємо рецепти на сторінці index.html
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/recepty/')) {
        // Завантажуємо рецепти для всіх трьох секцій
        loadRecipes(null, {
            category: 'all',
            per_page: 100,
            onLoad: (data) => {
                // Вегетаріанські - беремо перші 4 рецепти з категорією 'vegan'
                const veganCat = document.getElementById('veganCategory');
                if (veganCat) {
                    veganCat.innerHTML = '';
                    data.data
                        .filter(r => String(r.category).toLowerCase() === 'vegan')
                        .slice(0, 4)
                        .forEach(recipe => {
                            veganCat.appendChild(createRecipeCard(recipe));
                        });
                }

                // Супи - беремо перші 4 рецепти з категорією 'soups'
                const soupsCat = document.getElementById('soupsCategory');
                if (soupsCat) {
                    soupsCat.innerHTML = '';
                    data.data
                        .filter(r => String(r.category).toLowerCase() === 'soups')
                        .slice(0, 4)
                        .forEach(recipe => {
                            soupsCat.appendChild(createRecipeCard(recipe));
                        });
                }

                // Десерти - беремо перші 4 рецепти з категорією 'desserts'
                const dessertCat = document.getElementById('dessertCategory');
                if (dessertCat) {
                    dessertCat.innerHTML = '';
                    data.data
                        .filter(r => String(r.category).toLowerCase() === 'desserts')
                        .slice(0, 4)
                        .forEach(recipe => {
                            dessertCat.appendChild(createRecipeCard(recipe));
                        });
                }

                // Seasonal categories
                const springCat = document.getElementById('springCategory');
                if (springCat) {
                    springCat.innerHTML = '';
                    data.data
                        .filter(r => String(r.category).toLowerCase() === 'season_spring')
                        .slice(0, 6)
                        .forEach(recipe => springCat.appendChild(createRecipeCard(recipe)));
                }

                const summerCat = document.getElementById('summerCategory');
                if (summerCat) {
                    summerCat.innerHTML = '';
                    data.data
                        .filter(r => String(r.category).toLowerCase() === 'season_summer')
                        .slice(0, 6)
                        .forEach(recipe => summerCat.appendChild(createRecipeCard(recipe)));
                }

                const autumnCat = document.getElementById('autumnCategory');
                if (autumnCat) {
                    autumnCat.innerHTML = '';
                    data.data
                        .filter(r => String(r.category).toLowerCase() === 'season_autumn')
                        .slice(0, 6)
                        .forEach(recipe => autumnCat.appendChild(createRecipeCard(recipe)));
                }

                const winterCat = document.getElementById('winterCategory');
                if (winterCat) {
                    winterCat.innerHTML = '';
                    data.data
                        .filter(r => String(r.category).toLowerCase() === 'season_winter')
                        .slice(0, 6)
                        .forEach(recipe => winterCat.appendChild(createRecipeCard(recipe)));
                }
            }
        });
    }

    // На сторінці recipes.html
    if (window.location.pathname.includes('recipes.html')) {
        loadRecipesPage();
    }
});

// Функція для сторінки recipes.html
function loadRecipesPage() {
    const recipesGrid = document.getElementById('recipesGrid');
    const pagination = document.getElementById('pagination');
    const catalogBtn = document.getElementById('catalogBtn');
    const catalogModal = document.getElementById('catalogModal');

    if (!recipesGrid) return;

    let currentPage = 1;
    let activeCategory = 'all';
    const perPage = 12;

    async function renderPage(page, category) {
        currentPage = page;
        activeCategory = category;
        const data = await loadRecipes(recipesGrid.id, {
            category,
            page,
            per_page: perPage
        });

        // Оновляємо пагінацію
        if (pagination && data.pagination) {
            const paginationHTML = [];
            for (let i = 1; i <= data.pagination.total_pages; i++) {
                const btn = document.createElement('button');
                btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
                btn.textContent = i;
                btn.dataset.page = i;
                btn.addEventListener('click', () => renderPage(i, activeCategory));
                pagination.appendChild(btn);
            }

            // Додаємо кнопку "Наступна"
            if (currentPage < data.pagination.total_pages) {
                const nextBtn = document.createElement('button');
                nextBtn.className = 'page-next';
                nextBtn.textContent = '→';
                nextBtn.addEventListener('click', () => renderPage(currentPage + 1, activeCategory));
                pagination.appendChild(nextBtn);
            }
        }
    }

    // Обробляємо кліки на категорії (якщо є каталог модаль)
    if (catalogBtn && catalogModal) {
        const catButtons = catalogModal.querySelectorAll('.cat-btn');
        catButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category || 'all';
                renderPage(1, category);
                catalogModal.setAttribute('aria-hidden', 'true');
            });
        });
    }

    // Завантажуємо першу сторінку
    renderPage(1, 'all');
}
