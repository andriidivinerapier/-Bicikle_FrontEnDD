// recipes.js — логіка для каталогу, фільтрування, пагінації, детальніше та лайків
document.addEventListener('DOMContentLoaded', () => {
    const catalogBtn = document.getElementById('catalogBtn');
    const catalogModal = document.getElementById('catalogModal');
    const closeCatalog = document.getElementById('closeCatalog');
    const catButtons = Array.from(document.querySelectorAll('.cat-btn'));

    const cards = Array.from(document.querySelectorAll('.recipe-card'));
    const pageButtons = Array.from(document.querySelectorAll('.page-btn'));
    const nextBtn = document.querySelector('.page-next');

    const cardsPerPage = 12;
    let currentPage = 1;
    let activeCategory = 'Усі';

    // Відкриття/закриття модального каталогу
    catalogBtn.addEventListener('click', () => {
        catalogModal.setAttribute('aria-hidden', 'false');
    });
    closeCatalog.addEventListener('click', () => {
        catalogModal.setAttribute('aria-hidden', 'true');
    });
    catalogModal.addEventListener('click', (e) => {
        if (e.target === catalogModal) catalogModal.setAttribute('aria-hidden', 'true');
    });

    // Кнопки категорій — фільтрація
    catButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            activeCategory = btn.dataset.category;
            currentPage = 1;
            renderCards();
            catalogModal.setAttribute('aria-hidden', 'true');
        });
    });

    // Модальне вікно рецепту
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('details-btn')) {
            const card = e.target.closest('.recipe-card');
            openRecipeModal(card);
        }

        if (e.target.classList.contains('recipe-like')) {
            e.target.classList.toggle('liked');
            const title = e.target.closest('.recipe-card').querySelector('h4').textContent;
            const liked = e.target.classList.contains('liked');
            const likes = JSON.parse(localStorage.getItem('likes') || '{}');
            likes[title] = liked;
            localStorage.setItem('likes', JSON.stringify(likes));
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
        catalogModal.setAttribute('aria-hidden', 'true');
    }

    document.addEventListener('keydown', (e) => { 
        if (e.key === 'Escape') closeAllModals(); 
    });

    // Пагінація
    pageButtons.forEach(btn => btn.addEventListener('click', (e) => {
        const page = Number(e.target.dataset.page);
        currentPage = page;
        renderCards();
    }));

    nextBtn.addEventListener('click', () => {
        const totalVisible = filteredCards().length;
        const totalPages = Math.max(1, Math.ceil(totalVisible / cardsPerPage));
        currentPage = Math.min(totalPages, currentPage + 1);
        renderCards();
    });

    function filteredCards(){
        if (!activeCategory || activeCategory === 'Усі') return cards;
        return cards.filter(c => c.dataset.category === activeCategory);
    }

    function renderCards(){
        const filtered = filteredCards();
        const totalPages = Math.max(1, Math.ceil(filtered.length / cardsPerPage));

        // Сховати всі
        cards.forEach(c => c.style.display = 'none');

        // Показати ті, що на поточній сторінці
        const start = (currentPage - 1) * cardsPerPage;
        const end = start + cardsPerPage;
        filtered.slice(start, end).forEach(c => {
            c.style.display = 'flex';
            c.style.opacity = '1';
        });

        // Оновити активну кнопку пагінації
        pageButtons.forEach(b => b.classList.remove('active'));
        const btn = pageButtons.find(b => Number(b.dataset.page) === currentPage);
        if (btn) btn.classList.add('active');

        // Якщо поточна сторінка перевищує totalPages, зафіксувати
        if (currentPage > totalPages) { currentPage = totalPages; renderCards(); }
    }

    // Ініціалізація лайків з localStorage
    (function restoreLikes(){
        const likes = JSON.parse(localStorage.getItem('likes') || '{}');
        cards.forEach(c => {
            const title = c.querySelector('h4').textContent;
            const btn = c.querySelector('.recipe-like');
            if (likes[title]) btn.classList.add('liked');
        });
    })();

    // Ініціалізуємо відображення
    renderCards();
});
