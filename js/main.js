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

// Плавний скрол для навігаційних посилань
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        const offsetTop = document.querySelector(href).offsetTop;

        scroll({
            top: offsetTop - 70,
            behavior: 'smooth'
        });
    });
});