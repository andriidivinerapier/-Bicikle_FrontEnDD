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
                time: '15 хв'
            },
            {
                title: 'Суп з молодого горошку',
                image: 'images/soups/pea-soup.jpg',
                description: 'Ніжний крем-суп з свіжого горошку з м\'ятою',
                time: '30 хв'
            },
            {
                title: 'Тарт зі спаржею',
                image: 'images/baking/asparagus-tart.jpg',
                description: 'Хрусткий тарт з молодою спаржею та рікотою',
                time: '45 хв'
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
                time: '20 хв'
            },
            {
                title: 'Салат з кавуном',
                image: 'images/salads/watermelon-salad.jpg',
                description: 'Легкий салат з кавуном, фетою та м\'ятою',
                time: '15 хв'
            },
            {
                title: 'Ягідний пиріг',
                image: 'images/baking/berry-pie.jpg',
                description: 'Літній пиріг з свіжими сезонними ягодами',
                time: '60 хв'
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
                time: '45 хв'
            },
            {
                title: 'Теплий салат з грушею',
                image: 'images/salads/pear-salad.jpg',
                description: 'Салат з печеною грушею та горіхами',
                time: '30 хв'
            },
            {
                title: 'Яблучний штрудель',
                image: 'images/baking/apple-strudel.jpg',
                description: 'Класичний штрудель з яблуками та корицею',
                time: '90 хв'
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
                time: '120 хв'
            },
            {
                title: 'Запечена качка',
                image: 'images/main/roasted-duck.jpg',
                description: 'Качка запечена з яблуками',
                time: '180 хв'
            },
            {
                title: 'Пряні печива',
                image: 'images/baking/spice-cookies.jpg',
                description: 'Різдвяні печива з прянощами',
                time: '45 хв'
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
                        <button class="season-recipe-button">Детальніше</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    // Відкриваємо модальне вікно
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
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