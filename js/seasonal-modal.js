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
function openSeasonalModal(season) {
    const modal = document.getElementById('seasonModal');
    const modalImage = document.getElementById('seasonModalImage');
    const modalTitle = document.getElementById('seasonModalTitle');
    const modalDescription = document.getElementById('seasonModalDescription');
    const recipesGrid = document.querySelector('.season-recipes-grid');
    const viewAllButton = document.querySelector('.view-all-button span');
    
    const seasonData = seasonalData[season];
    
    // Заповнюємо дані
    modalImage.src = seasonData.image;
    modalImage.alt = seasonData.title;
    modalTitle.textContent = seasonData.title;
    modalDescription.textContent = seasonData.description;
    viewAllButton.textContent = `Переглянути всі ${seasonData.title.toLowerCase()}`;
    
    // Очищаємо та заповнюємо рецепти
    recipesGrid.innerHTML = '';
    seasonData.recipes.forEach(recipe => {
        recipesGrid.innerHTML += `
            <div class="season-recipe-card">
                <div class="season-recipe-image">
                    <img src="${recipe.image}" alt="${recipe.title}">
                </div>
                <div class="season-recipe-info">
                    <h4>${recipe.title}</h4>
                    <p>${recipe.description}</p>
                    <div class="season-recipe-meta">
                        <span class="season-recipe-time">${recipe.time}</span>
                        <button class="season-recipe-button" 
                                data-ingredients="${encodeURIComponent(JSON.stringify(recipe.ingredients || []))}"
                                data-steps="${encodeURIComponent(JSON.stringify(recipe.steps || []))}"
                                data-title="${recipe.title}"
                                data-difficulty="${recipe.difficulty || 'Середня'}"
                                data-time="${recipe.time}"
                                data-image="${recipe.image}">
                            Детальніше
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    // Відкриваємо модальне вікно
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Додаємо обробники для кнопок "Детальніше"
    const detailButtons = document.querySelectorAll('.season-recipe-button');
    detailButtons.forEach(button => {
        button.addEventListener('click', () => {
            const recipeModal = document.getElementById('recipeModal');
            const modalTitle = document.getElementById('modalTitle');
            const modalImage = document.getElementById('modalImage');
            const modalIngredients = document.getElementById('modalIngredients');
            const modalPreparation = document.getElementById('modalPreparation');
            const difficultyTag = document.querySelector('.tag.difficulty');
            const timeTag = document.querySelector('.tag.time');

            modalTitle.textContent = button.dataset.title;
            modalImage.src = button.dataset.image;
            modalImage.alt = button.dataset.title;
            difficultyTag.textContent = button.dataset.difficulty;
            timeTag.textContent = button.dataset.time;

            const ingredients = JSON.parse(decodeURIComponent(button.dataset.ingredients || '[]'));
            modalIngredients.innerHTML = ingredients.length > 0 
                ? ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')
                : '<li>Інгредієнти будуть додані незабаром</li>';

            const steps = JSON.parse(decodeURIComponent(button.dataset.steps || '[]'));
            modalPreparation.innerHTML = steps.length > 0
                ? steps.map(step => `<li>${step}</li>`).join('')
                : '<li>Кроки приготування будуть додані незабаром</li>';

            // Закриваємо сезонне модальне вікно
            closeSeasonalModal();

            // Відкриваємо модальне вікно рецепту
            recipeModal.classList.add('open');
            recipeModal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open');
        });
    });
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