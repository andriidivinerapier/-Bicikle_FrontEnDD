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

    // Детальніше — відкриваємо деталізований модал з кроками/інгредієнтами/складністю
    const detailModal = document.getElementById('detailModal');
    const closeDetail = document.getElementById('closeDetail');
    const detailImage = document.getElementById('detailImage');
    const detailTitle = document.getElementById('detailTitle');
    const detailIngredients = document.getElementById('detailIngredients');
    const detailSteps = document.getElementById('detailSteps');
    const detailDifficulty = document.getElementById('detailDifficulty');
    const detailTime = document.getElementById('detailTime');

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('details-btn')) {
            const card = e.target.closest('.recipe-card');
            openDetail(card);
        }

        if (e.target.classList.contains('recipe-like')) {
            e.target.classList.toggle('liked');
            // Можна тут зберегти в localStorage
            const title = e.target.closest('.recipe-card').querySelector('h4').textContent;
            const liked = e.target.classList.contains('liked');
            const likes = JSON.parse(localStorage.getItem('likes') || '{}');
            likes[title] = liked;
            localStorage.setItem('likes', JSON.stringify(likes));
        }
    });

    function openDetail(card){
        // Наповнюємо модал
        const title = card.querySelector('h4').textContent;
        const time = card.querySelector('.cook-time') ? card.querySelector('.cook-time').textContent : '';
        const img = card.querySelector('.recipe-image')?.style.backgroundImage || '';
        const ingredientsRaw = card.dataset.ingredients || '';
        const stepsRaw = card.dataset.steps || '';
        const difficulty = card.dataset.difficulty || '';

        detailTitle.textContent = title;
        detailTime.textContent = time;
        detailDifficulty.textContent = difficulty;
        // set image background (strip url());
        detailImage.style.backgroundImage = img;

        // Заповнюємо інгредієнти з анімацією (stagger)
        detailIngredients.innerHTML = '';
        const ingList = ingredientsRaw.split('|').filter(Boolean);
        ingList.forEach((i, idx) => {
            const li = document.createElement('li');
            li.textContent = i.trim();
            li.classList.add('fade-in-up');
            li.style.animationDelay = `${idx * 70}ms`;
            detailIngredients.appendChild(li);
        });

        // Кроки з анімацією
        detailSteps.innerHTML = '';
        const stepsList = stepsRaw.split('|').filter(Boolean);
        stepsList.forEach((s, idx) => {
            const li = document.createElement('li');
            li.textContent = s.trim();
            li.classList.add('fade-in-up');
            // додатковий відступ, щоб кроки з'являлися трохи після інгредієнтів
            li.style.animationDelay = `${(ingList.length * 70) + idx * 80}ms`;
            detailSteps.appendChild(li);
        });

        // Забороняємо скрол на бекграунді
        document.body.classList.add('no-scroll');

        // Відкриваємо модал
        detailModal.setAttribute('aria-hidden','false');
        // легко переконатися, що анімації застосуються — браузер починає анімацію після відмалювання
        requestAnimationFrame(() => {
            // нічого додаткового потрібно — анімації вже прив'язані через клас і delay
        });
    }

    function closeAllModals(){
        detailModal.setAttribute('aria-hidden','true');
        catalogModal.setAttribute('aria-hidden','true');
        document.body.classList.remove('no-scroll');
    }

    closeDetail.addEventListener('click', closeAllModals);
    detailModal.addEventListener('click', (e) => { if (e.target === detailModal) closeAllModals(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllModals(); });

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
