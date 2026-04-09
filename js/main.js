// Отримуємо необхідні елементи
const searchInput = document.getElementById('searchInput');
// note: we query `.recipe-card` inside the filter function so newly-loaded cards are included


// Функція для фільтрації рецептів
function filterRecipes(searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    const recipeCards = document.querySelectorAll('.recipe-card');

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
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        filterRecipes(e.target.value);
    });
    // trigger search on Enter
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            filterRecipes(e.target.value);
        }
    });

    // search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            filterRecipes(searchInput.value || '');
            // focus back to input
            if (typeof searchInput.focus === 'function') searchInput.focus();
        });
    }
}

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
// Fetch featured recipe and populate hero area
function fetchFeaturedRecipe() {
    fetch('/recepty/backend/get-featured-recipe.php')
        .then(res => res.json())
        .then(json => {
            if (json && json.status === 'success' && json.recipe) {
                const r = json.recipe;
                const heroTitleEl = document.querySelector('.hero-content h2');
                const heroDescEl = document.querySelector('.hero-content p');
                const heroImgEl = document.querySelector('.hero-image img');
                const cta = document.querySelector('.cta-button');

                if (heroTitleEl && r.title) heroTitleEl.textContent = r.title;
                if (heroDescEl) {
                    // Use first 2 sentences of instructions as description fallback
                    let desc = '';
                    if (r.instructions) {
                        const parts = r.instructions.split('|');
                        desc = parts.slice(0,2).join(' ').replace(/\|/g, ' ');
                    }
                    heroDescEl.textContent = desc || heroDescEl.textContent;
                }
                if (heroImgEl && r.image_path) heroImgEl.src = r.image_path;
                if (cta) {
                    cta.dataset.ingredients = r.ingredients || '';
                    cta.dataset.steps = r.instructions || '';
                    cta.dataset.difficulty = r.difficulty || '';
                    cta.dataset.time = (r.time ? r.time + ' хв' : '');
                    // expose recipe id so comments and other features can identify the recipe
                    if (r.id) cta.dataset.recipeId = r.id;
                }
            }
        })
        .catch(err => {
            console.warn('Failed to load featured recipe', err);
        });
}

document.addEventListener('DOMContentLoaded', () => {
    // animate cards if present
    const recipeCards = document.querySelectorAll('.recipe-card');
    recipeCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });

    // populate hero with featured recipe from backend
    fetchFeaturedRecipe();
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
    function extractUrlFromBg(bg) {
        // bg like: url("images/homepage/salad1.jpg")
        if (!bg) return '';
        const m = bg.match(/url\((?:\"|\')?(.*?)(?:\"|\')?\)/);
        return m ? m[1] : bg;
    }

    function openRecipeModal(cardOrData) {
        // Clean up any existing modal overlays first
        document.querySelectorAll('.recipe-modal-overlay').forEach(oldModal => {
            try { oldModal.remove(); } catch (e) {}
        });
        document.body.style.overflow = '';
        
        // Small delay to ensure cleanup
        setTimeout(() => {
            createAndShowModal();
        }, 10);
        
        function createAndShowModal() {
            let title, rawTime, time, imgUrl, ingredientsRaw, stepsRaw, difficulty, recipeId;
            if (cardOrData.querySelector && typeof cardOrData.querySelector === 'function') {
                // It's a card element
                title = cardOrData.querySelector('h4')?.textContent || 'Рецепт';
                rawTime = cardOrData.dataset.time || cardOrData.querySelector('.cook-time')?.textContent || '';
                time = rawTime ? (isNaN(rawTime) ? rawTime : `${rawTime} хв`) : '';
                imgUrl = cardOrData.querySelector('.recipe-image')?.style.backgroundImage.slice(4, -1).replace(/"/g, '') || 'images/homepage/salad1.jpg';
                ingredientsRaw = cardOrData.dataset.ingredients || '';
                stepsRaw = cardOrData.dataset.steps || '';
                difficulty = cardOrData.dataset.difficulty || 'Легка';
                recipeId = cardOrData.dataset.recipeId || cardOrData.dataset.recipe_id || '';
            } else {
                // It's data object from CTA button
                title = cardOrData.textContent || 'Рецепт';
                rawTime = cardOrData.time || '';
                time = rawTime ? (isNaN(rawTime) ? rawTime : `${rawTime} хв`) : '';
                imgUrl = cardOrData.backgroundImage || 'url(images/homepage/salad1.jpg)';
                if (imgUrl.startsWith('url(')) {
                    imgUrl = imgUrl.slice(4, -1).replace(/"/g, '', "'", '');
                }
                ingredientsRaw = cardOrData.ingredients || '';
                stepsRaw = cardOrData.steps || '';
                difficulty = cardOrData.difficulty || 'Легка';
                recipeId = cardOrData.recipeId || '';
            }

            // Create modal HTML
            const modalHtml = `
                <div class="recipe-modal-overlay">
                    <div class="recipe-modal">
                        <button class="modal-close">×</button>
                        <div class="modal-image-wrap">
                            <img src="${imgUrl}" alt="${title}" onerror="this.src='images/homepage/salad1.jpg'">
                        </div>
                        <div class="modal-body">
                            <h2 id="modalTitle">${title}</h2>
                            <div class="modal-meta">
                                <span class="difficulty">${difficulty}</span>
                                <span class="cook-time">⏱️ ${time}</span>
                            </div>
                            <div class="ingredients">
                                <h4>🥘 Інгредієнти:</h4>
                                <ul>
                                    ${ingredientsRaw.split('|')
                                        .filter(Boolean)
                                        .map(i => `<li>${i.trim()}</li>`)
                                        .join('')}
                                </ul>
                            </div>
                            <div class="preparation">
                                <h4>📋 Приготування:</h4>
                                <ol>
                                    ${stepsRaw.split('|')
                                        .filter(Boolean)
                                        .map(s => `<li>${s.trim()}</li>`)
                                        .join('')}
                                </ol>
                            </div>
                            <section class="comments-section" aria-labelledby="commentsTitle">
                                <h4 id="commentsTitle">Коментарі</h4>
                                <div class="comments-list" id="modalCommentsList">
                                    <!-- comments loaded by JS -->
                                </div>
                                <form id="modalCommentForm" class="comment-form">
                                    <textarea name="comment" placeholder="Напишіть коментар..." required></textarea>
                                    <button type="submit">Надіслати</button>
                                </form>
                            </section>
                        </div>
                    </div>
                </div>`;

            // Add modal to page
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Get references to new elements
            const modal = document.querySelector('.recipe-modal-overlay:last-child');
            const closeBtn = modal.querySelector('.modal-close');

            // Open modal with animation
            requestAnimationFrame(() => {
                modal.classList.add('open');
                document.body.style.overflow = 'hidden';
            });

            // set recipe id on modal and fire event for comments loader
            try { modal.setAttribute('data-recipe-id', recipeId); } catch (e) {}
            document.dispatchEvent(new CustomEvent('recipeModalOpen', { detail: { recipeId } }));

            // Close handlers
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
    }

    // Attach to recipe buttons using event delegation (to handle dynamically added cards)
    // Mark that main.js is handling click events to prevent recipes.js from double-triggering
    window.__mainJsRecipeHandlerActive = true;
    document.addEventListener('click', (e) => {
        // Handle clicks on recipe buttons
        if (e.target.classList.contains('recipe-button')) {
            e.preventDefault();
            e.stopPropagation();
            const card = e.target.closest('.recipe-card');
            if (!card) return;
            // Use nice modal from profile.html
            openRecipeModal(card);
            return; // Prevent further event propagation
        }
        
        // Handle clicks on recipe cards themselves (for better UX in carousels)
        // Only if the target is NOT a button, like button, or edit/delete action.
        if (e.target.classList.contains('recipe-like')) return; // Skip like buttons
        if (e.target.closest('.recipe-card-action')) return; // Skip edit/delete buttons inside the card
        const card = e.target.closest('.recipe-card');
        if (card && !e.target.closest('.recipe-button') && !e.target.closest('.recipe-like')) {
            e.preventDefault();
            e.stopPropagation();
            // Use nice modal from profile.html
            openRecipeModal(card);
        }
    }, true); // Use capture phase to ensure we handle before other handlers

    // Attach to hero CTA button ("Переглянути рецепт") — opens modal with hero recipe
    function handleHeroCtaClick(target) {
        try {
            // simple throttle to ignore very-rapid repeated clicks
            const now = Date.now();
            if (!window.__heroCtaCooldown) window.__heroCtaCooldown = 0;
            if (now < window.__heroCtaCooldown) return; // ignore
            window.__heroCtaCooldown = now + 300; // 300ms cooldown
            
            const heroTitle = document.querySelector('.hero-content h2')?.textContent.trim() || 'Рецепт';
            const heroImg = document.querySelector('.hero-image img')?.src || 'images/homepage/salad1.jpg';

            // Try to find a matching recipe card by title on the page
            let matchedCard = Array.from(document.querySelectorAll('.recipe-card')).find(c => {
                const t = (c.querySelector('h4')?.textContent || '').trim();
                return t && heroTitle && t.toLowerCase() === heroTitle.toLowerCase();
            });

            if (matchedCard) {
                // Use matched card's data
                openRecipeModal(matchedCard);
                return;
            }

            // Fallback: use data from CTA button or hero section
            const ds = (target && target.dataset) ? target.dataset : (document.querySelector('.cta-button')?.dataset || {});
            const ingredients = ds.ingredients || 'Інгредієнт 1|Інгредієнт 2|Інгредієнт 3';
            const steps = ds.steps || 'Крок 1: ...|Крок 2: ...|Крок 3: ...';
            const difficulty = ds.difficulty || 'Середня';
            const time = ds.time || '30 хв';
            const rid = ds.recipeId || ds.recipe_id || '';

            // Pass simple data object
            openRecipeModal({
                textContent: heroTitle,
                time: time,
                ingredients: ingredients,
                steps: steps,
                difficulty: difficulty,
                backgroundImage: `url(${heroImg})`,
                recipeId: rid
            });
        } catch (err) {
            console.error('Hero CTA handler error:', err);
            // Fallback to basic modal
            openRecipeModal({
                textContent: 'Рецепт',
                time: '30 хв',
                ingredients: 'Інгредієнт 1',
                steps: 'Крок 1',
                difficulty: 'Середня',
                backgroundImage: 'url(images/homepage/salad1.jpg)',
                recipeId: ''
            });
        }
    }

    // Bind directly to CTA if present (keeps original behavior)
    const cta = document.querySelector('.cta-button');
    if (cta) {
        cta.addEventListener('click', (ev) => { ev.preventDefault(); handleHeroCtaClick(ev.currentTarget); });
    }

    // Delegated fallback: if CTA is replaced or re-rendered, handle clicks via document delegation
    document.addEventListener('click', (ev) => {
        const t = ev.target.closest && ev.target.closest('.cta-button');
        if (t) {
            ev.preventDefault();
            handleHeroCtaClick(t);
        }
    });
})();

(function () {
    const mobileFab = document.getElementById('mobileFab');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuClose = document.getElementById('mobileMenuClose');
    const mobileMenuBackdrop = document.getElementById('mobileMenuBackdrop');
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    const mobileProfileLink = document.querySelector('.mobile-profile-link');

    if (!mobileMenu || !mobileMenuClose || !mobileMenuBackdrop || !mobileFab) {
        return;
    }

    const openMenu = () => {
        mobileMenu.classList.add('open');
        document.body.classList.add('menu-open');
        if (mobileFab) mobileFab.classList.add('hidden');
        mobileMenu.setAttribute('aria-hidden', 'false');
    };

    const closeMenu = () => {
        mobileMenu.classList.remove('open');
        document.body.classList.remove('menu-open');
        if (mobileFab) mobileFab.classList.remove('hidden');
        mobileMenu.setAttribute('aria-hidden', 'true');
    };

    window.openMobileNavigation = () => {
        if (mobileMenu) {
            openMenu();
        }
    };

    mobileFab.addEventListener('click', openMenu);
    mobileMenuClose.addEventListener('click', closeMenu);
    mobileMenuBackdrop.addEventListener('click', closeMenu);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && mobileMenu.classList.contains('open')) {
            closeMenu();
        }
    });

    // 📱 Close menu when clicking on profile link
    if (mobileProfileLink) {
        mobileProfileLink.addEventListener('click', closeMenu);
    }

    if (mobileLoginBtn) {
        mobileLoginBtn.addEventListener('click', (event) => {
            event.preventDefault();
            closeMenu();
            if (typeof openAuthModal === 'function') {
                openAuthModal();
            } else {
                document.getElementById('loginBtn')?.click();
            }
        });
    }
})();
