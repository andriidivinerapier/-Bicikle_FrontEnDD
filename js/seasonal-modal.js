// Дані для сезонних рецептів
const seasonalData = {
    spring: {
        title: 'Весняні страви',
        image: 'images/homepage/spring.jpg',
        description: 'Легкі та свіжі страви з перших весняних овочів та зелені. Відкрийте для себе яскраві смаки сезону, що пробуджується: соковиті салати, ароматні супи та легкі закуски.',
        recipes: [
            {
                title: 'Салат з молодим шпинатом',
                image: 'images/salads/spinach-salad.jpg',
                description: 'Ніжний салат з молодого шпинату з полуницею та козячим сиром',
                time: '15 хв',
                difficulty: 'Легка',
                ingredients: [
                    'Молодий шпинат - 200г',
                    'Полуниця - 200г',
                    'Козячий сир - 100г',
                    'Волоські горіхи - 50г',
                    'Оливкова олія - 2 ст.л.',
                    'Бальзамічний оцет - 1 ст.л.',
                    'Мед - 1 ч.л.',
                    'Сіль та перець - за смаком'
                ],
                steps: [
                    'Помийте та обсушіть шпинат і полуницю',
                    'Наріжте полуницю скибочками',
                    'Подрібніть горіхи та козячий сир',
                    'Приготуйте заправку з олії, оцту та меду',
                    "З'єднайте всі інгредієнти та полийте заправкою",
                    'Приправте сіллю та перцем за смаком'
                ]
            },
            {
                title: 'Суп з молодого горошку',
                image: 'images/soups/pea-soup.jpg',
                description: 'Ніжний крем-суп з свіжого горошку з м\'ятою',
                time: '30 хв',
                difficulty: 'Середня',
                ingredients: [
                    'Зелений горошок - 500г',
                    'Цибуля - 1 шт',
                    'Часник - 2 зубчики',
                    'Картопля - 1 шт',
                    'Вершки - 100мл',
                    'М\'ята - 10г',
                    'Оливкова олія - 2 ст.л.',
                    'Овочевий бульйон - 500мл',
                    'Сіль та перець - за смаком'
                ],
                steps: [
                    "Обсмажте подрібнену цибулю та часник",
                    "Додайте нарізану картоплю та горошок",
                    "Залийте бульйоном і варіть до готовності",
                    "Додайте м'яту та подрібніть все блендером",
                    "Влийте вершки та доведіть до кипіння",
                    "Приправте сіллю та перцем"
                ]
            },
            {
                title: 'Тарт зі спаржею',
                image: 'images/baking/asparagus-tart.jpg',
                description: 'Хрусткий тарт з молодою спаржею та рікотою',
                time: '45 хв',
                difficulty: 'Середня',
                ingredients: [
                    'Листкове тісто - 300г',
                    'Спаржа - 400г',
                    'Рікота - 250г',
                    'Пармезан - 50г',
                    'Яйця - 2 шт',
                    'Вершки - 100мл',
                    'Часник - 2 зубчики',
                    'Оливкова олія - 2 ст.л.',
                    'Сіль та перець - за смаком'
                ],
                steps: [
                    "Розкачайте тісто та викладіть у форму",
                    "Змішайте рікоту, яйця, вершки та спеції",
                    "Відваріть спаржу протягом 3 хвилин",
                    "Викладіть начинку на тісто",
                    "Зверху викладіть спаржу та посипте пармезаном",
                    "Випікайте при 180°C 30-35 хвилин"
                ]
            }
        ]
    },
    summer: {
        title: 'Літні страви',
        image: 'images/homepage/summer.jpg',
        description: 'Соковиті сезонні овочі та фрукти у їх найкращому вигляді. Освіжаючі салати, холодні супи, легкі закуски та десерти з ягодами — все для насолоди літнім сезоном.',
        recipes: [
            {
                title: 'Гаспачо',
                image: 'images/soups/gazpacho.jpg',
                description: 'Освіжаючий холодний суп з томатів',
                time: '20 хв',
                difficulty: 'Легка',
                ingredients: [
                    'Стиглі томати - 1 кг',
                    'Огірок - 1 шт',
                    'Червоний перець - 1 шт',
                    'Часник - 2 зубчики',
                    'Червона цибуля - 1/2 шт',
                    'Оливкова олія - 4 ст.л.',
                    'Бальзамічний оцет - 2 ст.л.',
                    'Хліб білий - 100г',
                    'Сіль та перець - за смаком'
                ],
                steps: [
                    'Замочіть хліб у воді',
                    'Наріжте овочі великими шматками',
                    'Складіть всі інгредієнти в блендер',
                    'Подрібніть до однорідної маси',
                    'Приправте сіллю та перцем',
                    'Охолодіть перед подачею'
                ]
            },
            {
                title: 'Салат з кавуном',
                image: 'images/salads/watermelon-salad.jpg',
                description: "Легкий салат з кавуном, фетою та м'ятою",
                time: '15 хв',
                difficulty: 'Легка',
                ingredients: [
                    'Кавун - 500г',
                    'Сир фета - 150г',
                    "М'ята - 10г",
                    'Оливкова олія - 2 ст.л.',
                    'Лайм - 1 шт',
                    'Чорний перець - за смаком'
                ],
                steps: [
                    'Наріжте кавун кубиками',
                    'Подрібніть фету',
                    'Порвіть листя мяти',
                    "Збризніть оливковою олією та соком лайму",
                    'Приправте свіжомеленим перцем'
                ]
            },
            {
                title: 'Ягідний пиріг',
                image: 'images/baking/berry-pie.jpg',
                description: 'Літній пиріг з свіжими сезонними ягодами',
                time: '60 хв',
                difficulty: 'Середня',
                ingredients: [
                    'Борошно - 300г',
                    'Масло - 200г',
                    'Цукор - 150г',
                    'Яйця - 2 шт',
                    'Суміш ягід - 500г',
                    'Крохмаль - 2 ст.л.',
                    'Ванільний екстракт - 1 ч.л.',
                    'Сіль - дрібка'
                ],
                steps: [
                    'Замісіть тісто з борошна, масла та цукру',
                    'Охолодіть тісто 30 хвилин',
                    'Розкачайте тісто та викладіть у форму',
                    'Змішайте ягоди з крохмалем та цукром',
                    'Викладіть начинку на тісто',
                    'Випікайте при 180°C 40-45 хвилин'
                ]
            }
        ]
    },
    autumn: {
        title: 'Осінні страви',
        image: 'images/homepage/autumn.jpg',
        description: 'Затишні та поживні страви з осінніх овочів та фруктів. Ароматні супи, запіканки з гарбуза, теплі салати та смачна випічка з яблуками та грушами.',
        recipes: [
            {
                title: 'Гарбузовий суп',
                image: 'images/soups/pumpkin-soup.jpg',
                description: 'Кремовий суп з гарбуза зі спеціями',
                time: '45 хв',
                difficulty: 'Середня',
                ingredients: [
                    'Гарбуз - 800г',
                    'Цибуля - 1 шт',
                    'Морква - 1 шт',
                    'Часник - 2 зубчики',
                    'Імбир - 2 см',
                    'Вершки - 200мл',
                    'Куркума - 1 ч.л.',
                    'Мускатний горіх - дрібка',
                    'Оливкова олія - 2 ст.л.',
                    'Сіль та перець - за смаком'
                ],
                steps: [
                    'Наріжте гарбуз та овочі',
                    'Обсмажте цибулю, моркву та часник',
                    'Додайте гарбуз та спеції',
                    'Залийте водою і варіть до готовності',
                    'Подрібніть все блендером',
                    'Додайте вершки та доведіть до кипіння'
                ]
            },
            {
                title: 'Теплий салат з грушею',
                image: 'images/salads/pear-salad.jpg',
                description: 'Салат з печеною грушею та горіхами',
                time: '30 хв',
                difficulty: 'Легка',
                ingredients: [
                    'Груші - 2 шт',
                    'Рукола - 100г',
                    'Горгонзола - 100г',
                    'Волоські горіхи - 50г',
                    'Мед - 2 ст.л.',
                    'Оливкова олія - 2 ст.л.',
                    'Бальзамічний оцет - 1 ст.л.',
                    'Сіль та перець - за смаком'
                ],
                steps: [
                    'Наріжте груші четвертинками',
                    'Запечіть груші з медом',
                    'Підсмажте горіхи',
                    'Викладіть руколу на тарілку',
                    'Додайте груші та покришений сир',
                    'Полийте заправкою з олії та оцту'
                ]
            },
            {
                title: 'Яблучний штрудель',
                image: 'images/baking/apple-strudel.jpg',
                description: 'Класичний штрудель з яблуками та корицею',
                time: '90 хв',
                difficulty: 'Складна',
                ingredients: [
                    'Борошно - 250г',
                    'Яйце - 1 шт',
                    'Вода - 125мл',
                    'Олія - 2 ст.л.',
                    'Яблука - 1 кг',
                    'Цукор - 100г',
                    'Кориця - 2 ч.л.',
                    'Родзинки - 50г',
                    'Горіхи - 50г',
                    'Вершкове масло - 100г'
                ],
                steps: [
                    'Замісіть тісто та дайте відпочити',
                    'Наріжте яблука тонкими скибочками',
                    'Розтягніть тісто дуже тонко',
                    'Викладіть начинку та скрутіть рулет',
                    'Змастіть маслом',
                    'Випікайте при 180°C 40 хвилин'
                ]
            }
        ]
    },
    winter: {
        title: 'Зимові страви',
        image: 'images/homepage/winter.jpg',
        description: 'Зігріваючі та поживні страви для холодної пори року. Ароматні супи та рагу, запечене м\'ясо, святкові десерти та гарячі напої.',
        recipes: [
            {
                title: 'Борщ з грибами',
                image: 'images/soups/borscht.jpg',
                description: 'Традиційний борщ з білими грибами',
                time: '120 хв',
                difficulty: 'Середня',
                ingredients: [
                    'Сушені білі гриби - 50г',
                    'Буряк - 2 шт',
                    'Картопля - 3 шт',
                    'Морква - 1 шт',
                    'Цибуля - 2 шт',
                    'Капуста - 300г',
                    'Томатна паста - 2 ст.л.',
                    'Часник - 3 зубчики',
                    'Олія - 3 ст.л.',
                    'Оцет - 1 ст.л.',
                    'Лавровий лист, сіль, перець'
                ],
                steps: [
                    'Замочіть гриби на 2 години',
                    'Відваріть гриби, збережіть відвар',
                    'Приготуйте овочеву засмажку',
                    'Відваріть буряк та наріжте соломкою',
                    'Зваріть борщ на грибному бульйоні',
                    'Додайте засмажку та спеції'
                ]
            },
            {
                title: 'Запечена качка',
                image: 'images/main/roasted-duck.jpg',
                description: 'Качка запечена з яблуками',
                time: '180 хв',
                difficulty: 'Складна',
                ingredients: [
                    'Качка - 2-2.5 кг',
                    'Яблука кислі - 4 шт',
                    'Апельсин - 1 шт',
                    'Часник - 6 зубчиків',
                    'Розмарин - 4 гілочки',
                    'Мед - 3 ст.л.',
                    'Соєвий соус - 4 ст.л.',
                    'Сіль та перець - за смаком'
                ],
                steps: [
                    'Підготуйте маринад з меду та соєвого соусу',
                    'Натріть качку сіллю та перцем',
                    'Нафаршируйте яблуками та травами',
                    'Змастіть маринадом',
                    'Запікайте при 180°C 2.5 години',
                    'Періодично поливайте жиром'
                ]
            },
            {
                title: 'Пряні печива',
                image: 'images/baking/spice-cookies.jpg',
                description: 'Різдвяні печива з прянощами',
                time: '45 хв',
                difficulty: 'Легка',
                ingredients: [
                    'Борошно - 300г',
                    'Масло - 150г',
                    'Цукор коричневий - 100г',
                    'Мед - 2 ст.л.',
                    'Яйце - 1 шт',
                    'Кориця - 2 ч.л.',
                    'Імбир мелений - 1 ч.л.',
                    'Гвоздика мелена - 1/2 ч.л.',
                    'Мускатний горіх - 1/4 ч.л.',
                    'Сода - 1/2 ч.л.'
                ],
                steps: [
                    "Змішайте сухі інгредієнти",
                    "Розітріть масло з цукром",
                    "Додайте яйце та мед",
                    "З'єднайте з борошном та спеціями",
                    "Розкачайте тісто та виріжте форми",
                    "Випікайте при 180°C 12-15 хвилин"
                ]
            }
        ]
    }
};

// Функція для відкриття модального вікна
async function openSeasonalModal(season) {
    const modal = document.getElementById('seasonModal');
    const modalImage = document.getElementById('seasonModalImage');
    const modalTitle = document.getElementById('seasonModalTitle');
    const modalDescription = document.getElementById('seasonModalDescription');
    const recipesGrid = modal.querySelector('.season-recipes-grid');

    const seasonData = seasonalData[season] || {};

    // Заповнюємо базові дані (локальні тексти)
    modalImage.src = seasonData.image || '';
    modalImage.alt = seasonData.title || '';
    modalTitle.textContent = seasonData.title || '';
    modalDescription.textContent = seasonData.description || '';

    // Спробуємо завантажити реальні рецепти з бекенду для цієї сезонної категорії.
    const categoryKey = `season_${season}`;
    let recipes = [];
    try {
        const resp = await fetch(`backend/get-recipes.php?category=${encodeURIComponent(categoryKey)}&per_page=100`);
        if (resp.ok) {
            const json = await resp.json();
            if (json && Array.isArray(json.data) && json.data.length > 0) {
                recipes = json.data;
            }
        }
    } catch (e) {
        console.warn('Season modal: could not fetch recipes from backend', e);
    }

    // Якщо бекенд не повернув рецепти — використовуємо локальні демо-дані
    if (!recipes || recipes.length === 0) {
        recipes = (seasonData.recipes || []).map(r => ({
            title: r.title,
            image: r.image,
            description: r.description,
            time: r.time,
            difficulty: r.difficulty,
            ingredients_array: r.ingredients || [],
            instructions_array: r.steps || []
        }));
    }

    // Carousel state stored on modal
    modal._seasonRecipes = recipes.slice(0, 50);
    modal._seasonIndex = 0;

    function renderRecipeAt(index) {
        const visibleCount = 3;
        const total = modal._seasonRecipes.length;
        const maxIndex = Math.max(0, total - visibleCount);
        // clamp
        index = Math.max(0, Math.min(index, maxIndex));
        modal._seasonIndex = index;

        // build track with all cards
        const trackHtml = modal._seasonRecipes.map(r => {
            const title = r.title || r.title;
            const image = r.image || r.image_path || 'images/homepage/placeholder.jpg';
            const desc = r.description || (r.instructions_array && r.instructions_array[0]) || '';
            const time = r.time || r.cooking_time || r['time'] || '';
            const difficulty = r.difficulty || r.level || '';
            const ingredientsArr = r.ingredients_array || (r.ingredients ? (Array.isArray(r.ingredients) ? r.ingredients : String(r.ingredients).split('|')) : []);
            const stepsArr = r.instructions_array || (r.instructions ? (Array.isArray(r.instructions) ? r.instructions : String(r.instructions).split('|')) : []);

            return `
                <div class="season-recipe-card">
                    <div class="season-recipe-image"><img src="${image}" alt="${escapeHtml(title)}"></div>
                    <div class="season-recipe-info">
                        <h4>${escapeHtml(title)}</h4>
                        <p>${escapeHtml(desc)}</p>
                        <div class="season-recipe-meta">
                            <span class="season-recipe-time">${escapeHtml(time)}</span>
                            <button class="season-like-btn" data-recipe-id="${r.id || ''}" data-source="${r.source || 'admin'}" aria-label="Вподобати" title="Додати у вподобані" style="margin-right:8px;">❤</button>
                            <button class="season-recipe-button"
                                    data-ingredients="${encodeURIComponent(JSON.stringify(ingredientsArr))}"
                                    data-steps="${encodeURIComponent(JSON.stringify(stepsArr))}"
                                    data-title="${escapeHtml(title)}"
                                    data-difficulty="${escapeHtml(difficulty || 'Середня')}"
                                    data-time="${escapeHtml(time)}"
                                    data-image="${escapeHtml(image)}">
                                Детальніше
                            </button>
                        </div>
                    </div>
                </div>`;
        }).join('');

        // create track once and reuse it to allow CSS transform transitions in both directions
        let track = recipesGrid.querySelector('.season-recipes-track');
        if (!track) {
            recipesGrid.innerHTML = '';
            track = document.createElement('div');
            track.className = 'season-recipes-track';
            track.innerHTML = trackHtml;
            recipesGrid.appendChild(track);
            // delegate clicks for detail and like buttons (attach once)
            track.addEventListener('click', (ev) => {
                const likeBtn = ev.target.closest('.season-like-btn');
                if (likeBtn) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    // handle like/unlike
                    const recipeId = likeBtn.dataset.recipeId;
                    const source = likeBtn.dataset.source || 'admin';
                    if (!recipeId) return; // nothing to do for demo items without id

                    // optimistic UI
                    const wasLiked = likeBtn.classList.contains('liked');
                    likeBtn.classList.toggle('liked');
                    if (wasLiked) {
                        likeBtn.style.color = '';
                    } else {
                        likeBtn.style.color = '#ff6b6b';
                    }

                    // check session and call backend
                    fetch('backend/session.php').then(r => r.json()).then(sess => {
                        if (!sess || sess.status !== 'logged') {
                            // revert and open auth
                            likeBtn.classList.toggle('liked');
                            if (wasLiked) likeBtn.style.color = '#ff6b6b';
                            else likeBtn.style.color = '';
                            if (typeof openAuthModal === 'function') openAuthModal();
                            return;
                        }

                        const endpoint = wasLiked ? 'backend/remove-favorite.php' : 'backend/add-favorite.php';
                        const fd = new FormData();
                        fd.append('recipe_id', recipeId);
                        fd.append('source', source);

                        fetch(endpoint, { method: 'POST', body: fd })
                            .then(res => res.json())
                            .then(json => {
                                if (!(json && (json.success || json.status === 'success'))) {
                                    // revert on failure
                                    likeBtn.classList.toggle('liked');
                                    if (wasLiked) likeBtn.style.color = '#ff6b6b';
                                    else likeBtn.style.color = '';
                                }
                            })
                            .catch(err => {
                                console.error('Favorite action failed', err);
                                likeBtn.classList.toggle('liked');
                                if (wasLiked) likeBtn.style.color = '#ff6b6b';
                                else likeBtn.style.color = '';
                            });
                    }).catch(err => {
                        console.error('Session check failed', err);
                        likeBtn.classList.toggle('liked');
                        if (wasLiked) likeBtn.style.color = '#ff6b6b';
                        else likeBtn.style.color = '';
                        if (typeof openAuthModal === 'function') openAuthModal();
                    });

                    return;
                }

                const btn = ev.target.closest('.season-recipe-button');
                if (!btn) return;
                const recipeModal = document.getElementById('recipeModal');
                const modalTitleMain = document.getElementById('modalTitle');
                const modalImageMain = document.getElementById('modalImage');
                const modalIngredients = document.getElementById('modalIngredients');
                const modalPreparation = document.getElementById('modalPreparation');
                const difficultyTag = document.querySelector('.tag.difficulty');
                const timeTag = document.querySelector('.tag.time');

                modalTitleMain.textContent = btn.dataset.title;
                modalImageMain.src = btn.dataset.image;
                modalImageMain.alt = btn.dataset.title;
                if (difficultyTag) difficultyTag.textContent = btn.dataset.difficulty;
                if (timeTag) timeTag.textContent = btn.dataset.time;

                const ingredients = JSON.parse(decodeURIComponent(btn.dataset.ingredients || '[]'));
                modalIngredients.innerHTML = ingredients.length > 0
                    ? ingredients.map(ingredient => `<li>${escapeHtml(ingredient)}</li>`).join('')
                    : '<li>Інгредієнти будуть додані незабаром</li>';

                const steps = JSON.parse(decodeURIComponent(btn.dataset.steps || '[]'));
                modalPreparation.innerHTML = steps.length > 0
                    ? steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')
                    : '<li>Кроки приготування будуть додані незабаром</li>';

                closeSeasonalModal();
                recipeModal.classList.add('open');
                recipeModal.setAttribute('aria-hidden', 'false');
                document.body.classList.add('modal-open');
            });
        } else {
            // update cards only if track exists
            track.innerHTML = trackHtml;
        }

        // initialize liked state for visible seasonal recipes
        (function markSeasonFavorites() {
            fetch('backend/get-favorites.php')
                .then(r => r.json())
                .then(favData => {
                    if (favData && Array.isArray(favData.favorites)) {
                        const favSet = new Set(favData.favorites.map(String));
                        track.querySelectorAll('.season-like-btn').forEach(btn => {
                            const rid = btn.dataset.recipeId;
                            const source = btn.dataset.source || 'admin';
                            const key = source + ':' + String(rid);
                            const altKeyUser = 'user:' + String(rid);
                            const altKeyAdmin = 'admin:' + String(rid);
                            if (rid && (favSet.has(key) || favSet.has(altKeyUser) || favSet.has(altKeyAdmin) || favSet.has(String(rid)))) {
                                btn.classList.add('liked');
                                btn.style.color = '#ff6b6b';
                            }
                        });
                    }
                })
                .catch(() => {});
        })();

        const cards = Array.from(track.querySelectorAll('.season-recipe-card'));

        // compute gap in px and measure card width after DOM update
        const gapStyle = parseFloat(getComputedStyle(track).gap) || 16;
        const cardWidth = cards[0] ? cards[0].getBoundingClientRect().width : 0;
        const shift = index * (cardWidth + gapStyle);
        // force layout then animate transform
        requestAnimationFrame(() => {
            track.style.transform = `translateX(-${shift}px)`;
        });

        // update arrow disabled state
        const prevBtn = modal.querySelector('.season-prev');
        const nextBtn = modal.querySelector('.season-next');
        if (prevBtn) prevBtn.disabled = (index <= 0);
        if (nextBtn) nextBtn.disabled = (index >= maxIndex);

        // wire detail buttons
        track.querySelectorAll('.season-recipe-button').forEach(btn => {
            btn.addEventListener('click', () => {
                const recipeModal = document.getElementById('recipeModal');
                const modalTitleMain = document.getElementById('modalTitle');
                const modalImageMain = document.getElementById('modalImage');
                const modalIngredients = document.getElementById('modalIngredients');
                const modalPreparation = document.getElementById('modalPreparation');
                const difficultyTag = document.querySelector('.tag.difficulty');
                const timeTag = document.querySelector('.tag.time');

                modalTitleMain.textContent = btn.dataset.title;
                modalImageMain.src = btn.dataset.image;
                modalImageMain.alt = btn.dataset.title;
                if (difficultyTag) difficultyTag.textContent = btn.dataset.difficulty;
                if (timeTag) timeTag.textContent = btn.dataset.time;

                const ingredients = JSON.parse(decodeURIComponent(btn.dataset.ingredients || '[]'));
                modalIngredients.innerHTML = ingredients.length > 0
                    ? ingredients.map(ingredient => `<li>${escapeHtml(ingredient)}</li>`).join('')
                    : '<li>Інгредієнти будуть додані незабаром</li>';

                const steps = JSON.parse(decodeURIComponent(btn.dataset.steps || '[]'));
                modalPreparation.innerHTML = steps.length > 0
                    ? steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')
                    : '<li>Кроки приготування будуть додані незабаром</li>';

                closeSeasonalModal();
                recipeModal.classList.add('open');
                recipeModal.setAttribute('aria-hidden', 'false');
                document.body.classList.add('modal-open');
            });
        });
    }

    // initial render
    renderRecipeAt(modal._seasonIndex);

    // wire navigation
    const prevBtn = modal.querySelector('.season-prev');
    const nextBtn = modal.querySelector('.season-next');
    const visibleCount = 3;
    const total = modal._seasonRecipes.length;
    const maxIndex = Math.max(0, total - visibleCount);
    if (prevBtn) prevBtn.onclick = () => { if (modal._seasonIndex > 0) { renderRecipeAt(modal._seasonIndex - 1); } };
    if (nextBtn) nextBtn.onclick = () => { if (modal._seasonIndex < maxIndex) { renderRecipeAt(modal._seasonIndex + 1); } };

    // touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;
    recipesGrid.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; });
    recipesGrid.addEventListener('touchmove', (e) => { touchEndX = e.changedTouches[0].screenX; });
    recipesGrid.addEventListener('touchend', () => {
        const diff = touchEndX - touchStartX;
        const threshold = 40; // px
        if (diff > threshold && modal._seasonIndex > 0) { // swipe right -> prev
            renderRecipeAt(modal._seasonIndex - 1);
        } else if (diff < -threshold && modal._seasonIndex < maxIndex) { // swipe left -> next
            renderRecipeAt(modal._seasonIndex + 1);
        }
        touchStartX = 0; touchEndX = 0;
    });

    // keyboard left/right while modal open
    function onKey(e) {
        if (!modal.classList.contains('active')) return;
        if (e.key === 'ArrowLeft' && modal._seasonIndex > 0) { renderRecipeAt(modal._seasonIndex - 1); }
        if (e.key === 'ArrowRight' && modal._seasonIndex < maxIndex) { renderRecipeAt(modal._seasonIndex + 1); }
    }
    document.addEventListener('keydown', onKey);

    // cleanup when modal closes: remove key listener
    const originalClose = closeSeasonalModal;
    // wrap closeSeasonalModal to also remove listener when invoked
    function wrappedClose() {
        document.removeEventListener('keydown', onKey);
        originalClose();
    }
    // replace closeSeasonalModal with wrapper in this scope by reassigning global function
    window._closeSeasonalModalBackup = window._closeSeasonalModalBackup || closeSeasonalModal;
    window.closeSeasonalModal = wrappedClose;

    // Відкриваємо модальне вікно
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    
}

// Простий escape для вставки тексту в HTML (мінімізує XSS через дані з бекенду)
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Функція для закриття модального вікна
function closeSeasonalModal() {
    const modal = document.getElementById('seasonModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Додаємо обробники подій
document.addEventListener('DOMContentLoaded', () => {
    const seasonCards = document.querySelectorAll('.season-card');
    const closeButton = document.getElementById('seasonModalClose');
    const modal = document.getElementById('seasonModal');
    
    seasonCards.forEach(card => {
        card.addEventListener('click', () => {
            const season = card.getAttribute('data-season');
            openSeasonalModal(season);
        });
    });
    
    closeButton.addEventListener('click', closeSeasonalModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeSeasonalModal();
        }
    });
});