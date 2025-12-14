// recipes.js — логіка для каталогу, фільтрування, пагінації, детальніше та лайків
document.addEventListener('DOMContentLoaded', () => {
    const catalogBtn = document.getElementById('catalogBtn');
    const catalogModal = document.getElementById('catalogModal');
    const closeCatalog = document.getElementById('closeCatalog');
    // Do not query cat buttons statically — use delegation so dynamic changes still work
    const recipesGrid = document.getElementById('recipesGrid');
    const pagination = document.getElementById('pagination');

    const cardsPerPage = 12;
    let currentPage = 1;
    let activeCategory = 'all';
    let allRecipes = [];

    // Функція для завантаження рецептів з backend
    async function loadRecipesPage(category = 'all', page = 1) {
        currentPage = page;
        activeCategory = category;
        
        const data = await loadRecipes(recipesGrid.id, {
            category,
            page,
            per_page: cardsPerPage
        });

        // Оновляємо пагінацію
        if (pagination && data.pagination) {
            pagination.innerHTML = '';
            for (let i = 1; i <= data.pagination.total_pages; i++) {
                const btn = document.createElement('button');
                btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
                btn.textContent = i;
                btn.dataset.page = i;
                btn.addEventListener('click', () => loadRecipesPage(activeCategory, i));
                pagination.appendChild(btn);
            }

            // Додаємо кнопку "Наступна"
            if (currentPage < data.pagination.total_pages) {
                const nextBtn = document.createElement('button');
                nextBtn.className = 'page-next';
                nextBtn.textContent = '→';
                nextBtn.addEventListener('click', () => loadRecipesPage(activeCategory, currentPage + 1));
                pagination.appendChild(nextBtn);
            }
        }
    }

    // Відкриття/закриття модального каталогу — з перевірками на наявність елементів
    if (catalogBtn) {
        catalogBtn.addEventListener('click', () => {
            if (catalogModal) {
                catalogModal.setAttribute('aria-hidden', 'false');
                catalogModal.classList.add('show');
            }
        });
    }
    if (closeCatalog) {
        closeCatalog.addEventListener('click', () => {
            if (catalogModal) {
                catalogModal.setAttribute('aria-hidden', 'true');
                catalogModal.classList.remove('show');
            }
        });
    }
    if (catalogModal) {
        // Закриття при кліку поза контентом
        catalogModal.addEventListener('click', (e) => {
            if (e.target === catalogModal) {
                catalogModal.setAttribute('aria-hidden', 'true');
                catalogModal.classList.remove('show');
            }
        });

        // Делегуємо кліки на кнопки категорій — це працюватиме незалежно від того, коли кнопки додані
        catalogModal.addEventListener('click', (e) => {
            const btn = e.target.closest && e.target.closest('.cat-btn');
            if (!btn) return;
            const category = btn.dataset.category || 'all';
            loadRecipesPage(category, 1);
            catalogModal.setAttribute('aria-hidden', 'true');
            catalogModal.classList.remove('show');
        });
    }

    // Модальне вікно рецепту
    document.addEventListener('click', (e) => {
        // Обробка кнопки "Рецепт"
        if (e.target.classList.contains('recipe-button')) {
            const card = e.target.closest('.recipe-card');
            openRecipeModal(card);
        }

        // Обробка кнопки "вподобайки" — звертаємось до backend
        if (e.target.classList.contains('recipe-like')) {
            e.preventDefault();
            e.stopPropagation();

            const likeBtn = e.target;
            const card = likeBtn.closest('.recipe-card');
            const recipeId = card.dataset.recipeId;
            const source = card.dataset.source || 'admin';

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

                    const formData = new FormData();
                    formData.append('recipe_id', recipeId);
                    formData.append('source', source);

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
                                console.error('Add favorite response:', res);
                            }
                        })
                        .catch(err => {
                            console.error('Like error:', err);
                        });
                });
        }
    });

    function openRecipeModal(card) {
        const title = card.querySelector('h4').textContent;
        const time = card.querySelector('.cook-time')?.textContent || '';
        const imgUrl = card.querySelector('.recipe-image')?.style.backgroundImage.slice(4, -1).replace(/"/g, '') || '';
        const ingredientsRaw = card.dataset.ingredients || '';
        const stepsRaw = card.dataset.steps || '';
        const difficulty = card.dataset.difficulty || '';

        // Створюємо модальне вікно
        const modalHtml = `
            <div class="recipe-modal-overlay">
                <div class="recipe-modal">
                    <button class="modal-close">×</button>
                    <div class="modal-image-wrap">
                        <img src="${imgUrl}" alt="${title}">
                    </div>
                    <div class="modal-body">
                        <h2 id="modalTitle">${title}</h2>
                        <div class="modal-meta">
                            <span class="difficulty">${difficulty}</span>
                            <span class="cook-time">${time}</span>
                        </div>
                        <div class="ingredients">
                            <h4>Інгредієнти:</h4>
                            <ul>
                                ${ingredientsRaw.split('|')
                                    .filter(Boolean)
                                    .map(i => `<li>${i.trim()}</li>`)
                                    .join('')}
                            </ul>
                        </div>
                        <div class="preparation">
                            <h4>Приготування:</h4>
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

        // Додаємо модал до body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Отримуємо посилання на новостворені елементи
        const modal = document.querySelector('.recipe-modal-overlay');
        const closeBtn = modal.querySelector('.modal-close');

        // Відкриваємо модал
        requestAnimationFrame(() => {
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
        });

        // Обробники закриття
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

    function closeAllModals() {
        const modal = document.querySelector('.recipe-modal-overlay');
        if (modal) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
            setTimeout(() => modal.remove(), 300);
        }
        if (catalogModal) {
            catalogModal.setAttribute('aria-hidden', 'true');
            catalogModal.classList.remove('show');
        }
    }

    document.addEventListener('keydown', (e) => { 
        if (e.key === 'Escape') closeAllModals(); 
    });

    // Ініціалізуємо завантаження рецептів
    loadRecipesPage('all', 1);
});
