// Отримуємо необхідні елементи
const searchInput = document.getElementById('searchInput');
const recipeCards = document.querySelectorAll('.recipe-card');


// Функція для фільтрації рецептів
function filterRecipes(searchTerm) {
    searchTerm = searchTerm.toLowerCase();

    recipeCards.forEach(card => {
        const title = card.querySelector('h4').textContent.toLowerCase();
        const isVisible = title.includes(searchTerm);
        
        // Анімація появи/зникнення
        if (isVisible) {
            card.style.display = 'block';
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
            }, 50);
        } else {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.8)';
            setTimeout(() => {
                card.style.display = 'none';
            }, 300);
        }
    });
}

// Слухач події для поля пошуку
searchInput.addEventListener('input', (e) => {
    filterRecipes(e.target.value);
});

// Фіксоване меню при прокрутці
const header = document.querySelector('.header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll <= 0) {
        header.classList.remove('scroll-up');
        return;
    }

    if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
        // Прокручування вниз
        header.classList.remove('scroll-up');
        header.classList.add('scroll-down');
    } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
        // Прокручування вгору
        header.classList.remove('scroll-down');
        header.classList.add('scroll-up');
    }
    
    lastScroll = currentScroll;
});

// Анімація для карток при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    recipeCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
});

// Плавний скрол для навігаційних посилань (тільки для внутрішніх хеш-посилань)
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        // Якщо href починається з '#' і елемент існує на сторінці — робимо плавний скрол
        if (href && href.startsWith('#') && document.querySelector(href)) {
            e.preventDefault();
            const offsetTop = document.querySelector(href).offsetTop;
            scroll({
                top: offsetTop - 70,
                behavior: 'smooth'
            });
        }
        // Інакше дозволяємо звичайну навігацію (наприклад, перехід на contacts.html)
    });
});

// --- Modal: open / close / populate ---
(function () {
    const modalOverlay = document.getElementById('recipeModal');
    const modalClose = document.getElementById('modalClose');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalIngredients = document.getElementById('modalIngredients');
    const modalPreparation = document.getElementById('modalPreparation');
    const modalDifficulty = modalOverlay.querySelector('.tag.difficulty');
    const modalTimeEl = modalOverlay.querySelector('.tag.time');

    // Small data store for demo recipes (keyed by title)
    const recipes = {
        'будда-боул': {
            difficulty: 'Легка',
            time: '25 хв',
            ingredients: [
                'Кіноа - 100г', 'Морква - 1 шт', 'Соєвий соус - 2 ст.л.',
                'Нут варений - 200г', 'Броколі - 200г', 'Кунжутна олія - 1 ст.л.',
                'Авокадо - 1 шт', 'Шпинат - 50г'
            ],
            steps: [
                'Приготуйте кіноа згідно інструкції на упаковці.',
                'Поріжте овочі та обсмажте моркву і броколі на олії кілька хвилин.',
                'Змішайте кіноа, овочі та нут, додайте соєвий соус і кунжутну олію.',
                'Декоруйте скибочками авокадо та свіжим шпинатом. Подавайте теплою.'
            ]
        }
    };

    function extractUrlFromBg(bg) {
        // bg like: url("images/homepage/salad1.jpg")
        if (!bg) return '';
        const m = bg.match(/url\((?:\"|\')?(.*?)(?:\"|\')?\)/);
        return m ? m[1] : bg;
    }

    function openModal(data) {
    // fill image & title
    if (data.image) modalImage.src = data.image;
    if (data.title) modalTitle.textContent = data.title;

    // tags (difficulty/time)
    if (modalDifficulty) modalDifficulty.textContent = data.difficulty || '';
    if (modalTimeEl) modalTimeEl.textContent = data.time || '';
        // populate ingredients
        modalIngredients.innerHTML = '';
        (data.ingredients || []).forEach(ing => {
            const li = document.createElement('li');
            li.textContent = ing;
            modalIngredients.appendChild(li);
        });

        // preparation
        modalPreparation.innerHTML = '';
        (data.steps || []).forEach(step => {
            const li = document.createElement('li');
            li.textContent = step;
            modalPreparation.appendChild(li);
        });

        modalOverlay.classList.add('open');
        modalOverlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modalOverlay.classList.remove('open');
        modalOverlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    // Attach to recipe buttons
    document.querySelectorAll('.recipe-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = btn.closest('.recipe-card');
            if (!card) return;
            const title = (card.querySelector('h4')?.textContent || '').trim();
            const rawBg = card.querySelector('.recipe-image')?.style.backgroundImage || getComputedStyle(card.querySelector('.recipe-image')).backgroundImage;
            const imageUrl = extractUrlFromBg(rawBg) || 'images/homepage/salad1.jpg';


            const key = title.toLowerCase();
            const ds = card.dataset || {};
            const ingredients = ds.ingredients ? ds.ingredients.split('|') : (recipes[key]?.ingredients || ['Інгредієнт 1', 'Інгредієнт 2']);
            const steps = ds.steps ? ds.steps.split('|') : (recipes[key]?.steps || ['Крок 1: ...', 'Крок 2: ...']);
            const difficulty = ds.difficulty || recipes[key]?.difficulty || 'Середня';
            const time = ds.time || card.querySelector('.cook-time')?.textContent || recipes[key]?.time || '';

            const data = {
                title: title || recipes[key]?.title || 'Рецепт',
                image: imageUrl,
                difficulty,
                time,
                ingredients,
                steps
            };

            openModal(data);
        });
    });

    // Close handlers
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
})();
