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
                    // ensure recipe id is available for comment loading/submission
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
    const modalOverlay = document.getElementById('recipeModal');
    if (!modalOverlay) {
        console.log('Note: recipeModal not found on this page');
        return;
    }
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

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, function (m) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]); });
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

        // Add class to body to prevent background scroll
        document.body.classList.add('modal-open');
        
        // Show modal
        modalOverlay.classList.add('open');
        modalOverlay.setAttribute('aria-hidden', 'false');
        
        // Reset scroll position of modal
        modalOverlay.scrollTop = 0;
        // initialize comments for this modal via shared initializer
        try { if (typeof window.initRecipeModalComments === 'function') window.initRecipeModalComments(data.recipe_id || data.id || ''); } catch (e) { console.error('initRecipeModalComments failed', e); }
    }

    // Shared initializer used by other modules (seasonal modal, dynamic opens)
    window.initRecipeModalComments = function(recipeId) {
        const commentsListEl = document.getElementById('modalCommentsList');
        const commentFormEl = document.getElementById('modalCommentForm');

        function renderComments(items) {
            if (!commentsListEl) return;
            if (!items || items.length === 0) {
                commentsListEl.innerHTML = '<div class="comment-empty">Поки що немає коментарів.</div>';
                return;
            }
            commentsListEl.innerHTML = items.map(c => {
                const time = new Date(c.created_at).toLocaleString('uk-UA');
                const user = c.username || 'Гість';
                const escaped = escapeHtml(c.content);
                return `\n<div class="comment-item"><div class="comment-header"><strong>${escapeHtml(user)}</strong> <span class="comment-time">${time}</span></div><div class="comment-body">${escaped}</div></div>`;
            }).join('');
        }

        function loadComments() {
            if (!recipeId) { if (commentsListEl) commentsListEl.innerHTML = '<div class="comment-empty">Коментарі недоступні</div>'; return; }
            fetch(`backend/get-comments.php?recipe_id=${encodeURIComponent(recipeId)}`)
                .then(r => r.json())
                .then(data => {
                    if (data && data.status === 'success') renderComments(data.comments || []);
                    else if (commentsListEl) commentsListEl.innerHTML = '<div class="comment-empty">Не вдалось завантажити коментарі</div>';
                })
                .catch(err => { console.error('Load comments error', err); if (commentsListEl) commentsListEl.innerHTML = '<div class="comment-empty">Помилка мережі</div>'; });
        }

        // initial load
        loadComments();

        // check session to decide whether to enable posting
        fetch('backend/session.php').then(r => r.json()).then(sess => {
            if (sess && sess.status === 'logged') {
                if (!commentFormEl) return;
                // remove previous listeners by cloning
                const newForm = commentFormEl.cloneNode(true);
                commentFormEl.parentNode.replaceChild(newForm, commentFormEl);
                const form = newForm;
                form.addEventListener('submit', (ev) => {
                    ev.preventDefault();
                    if (!recipeId) { showToast('Неможливо додати коментар', 'error'); return; }
                    const textarea = document.getElementById('modalCommentContent') || form.querySelector('textarea[name="content"]');
                    const text = (textarea && textarea.value || '').trim();
                    if (!text) { showToast('Напишіть коментар', 'error'); return; }
                    const fd = new FormData(); fd.append('recipe_id', recipeId); fd.append('content', text);
                    fetch('backend/add-comment.php', { method: 'POST', body: fd })
                        .then(r => r.json())
                        .then(resp => {
                            if (resp && resp.status === 'success' && resp.comment) {
                                const time = new Date(resp.comment.created_at).toLocaleString('uk-UA');
                                const user = escapeHtml(resp.comment.username || 'Я');
                                const escaped = escapeHtml(resp.comment.content);
                                const html = `\n<div class="comment-item"><div class="comment-header"><strong>${user}</strong> <span class="comment-time">${time}</span></div><div class="comment-body">${escaped}</div></div>`;
                                if (!commentsListEl || !commentsListEl.innerHTML.trim() || commentsListEl.innerHTML.indexOf('comment-item') === -1) commentsListEl.innerHTML = html; else commentsListEl.insertAdjacentHTML('afterbegin', html);
                                if (textarea) textarea.value = '';
                                showToast('Коментар додано', 'success');
                            } else if (resp && resp.status === 'auth_required') {
                                if (typeof openAuthModal === 'function') openAuthModal(); else showToast('Потрібно увійти', 'error');
                            } else {
                                showToast((resp && resp.message) || 'Не вдалося додати коментар', 'error');
                            }
                        })
                        .catch(err => { console.error('Add comment err', err); showToast('Помилка мережі', 'error'); });
                });
            } else {
                // user not logged: replace form with login prompt
                if (!commentFormEl) return;
                const prompt = document.createElement('div');
                prompt.className = 'comment-guest-prompt';
                prompt.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                    <div style="color:var(--muted);">Щоб залишити коментар, будь ласка, увійдіть в акаунт.</div>
                    <div><button class="btn btn-primary" id="guestLoginBtn">Увійти</button></div>
                </div>`;
                commentFormEl.parentNode.replaceChild(prompt, commentFormEl);
                const btn = document.getElementById('guestLoginBtn');
                if (btn) btn.addEventListener('click', () => {
                    try {
                        const overlay = btn.closest('.recipe-modal-overlay.dynamic') || document.querySelector('.recipe-modal-overlay.dynamic');
                        if (overlay) overlay.remove();
                    } catch (e) {}
                    if (typeof window.closeRecipeModal === 'function') window.closeRecipeModal();
                    if (typeof openAuthModal === 'function') openAuthModal();
                });
            }
        }).catch(err => {
            console.error('Session check failed', err);
        });
    };

    function closeModal() {
        modalOverlay.classList.remove('open');
        modalOverlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    }

    // Expose a helper to close recipe modal(s) from other scripts
    window.closeRecipeModal = function() {
        try {
            // prefer using the existing close button if present so all cleanup runs
            const modalCloseBtn = document.getElementById('modalClose');
            if (modalCloseBtn) {
                modalCloseBtn.click();
            } else {
                const modalOverlay = document.getElementById('recipeModal');
                if (modalOverlay) {
                    modalOverlay.classList.remove('open');
                    modalOverlay.setAttribute('aria-hidden', 'true');
                }
            }
        } catch (e) { console.warn('closeRecipeModal static close failed', e); }
        try {
            // remove any dynamic modals (created by recipes.js)
            document.querySelectorAll('.recipe-modal-overlay.dynamic').forEach(m => m.remove());
        } catch (e) { console.warn('closeRecipeModal dynamic removal failed', e); }
        // ensure page scroll restored
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
    };

    // Attach to recipe buttons using event delegation (to handle dynamically added cards)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('recipe-button')) {
            const card = e.target.closest('.recipe-card');
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
                recipe_id: ds.recipeId || ds.recipeid || ds.id || '',
                difficulty,
                time,
                ingredients,
                steps
            };

            openModal(data);
        }
    });

    // Attach to hero CTA button ("Переглянути рецепт") — opens modal with hero recipe
    const cta = document.querySelector('.cta-button');
    if (cta) {
        cta.addEventListener('click', () => {
            const heroTitle = document.querySelector('.hero-content h2')?.textContent.trim();
            const heroImg = document.querySelector('.hero-image img')?.src || '';

            // Try to find a matching recipe card by title on the page
            let matchedCard = Array.from(document.querySelectorAll('.recipe-card')).find(c => {
                const t = (c.querySelector('h4')?.textContent || '').trim();
                return t && heroTitle && t.toLowerCase() === heroTitle.toLowerCase();
            });

            if (matchedCard) {
                // reuse same extraction logic as above
                const title = (matchedCard.querySelector('h4')?.textContent || '').trim();
                const rawBg = matchedCard.querySelector('.recipe-image')?.style.backgroundImage || getComputedStyle(matchedCard.querySelector('.recipe-image')).backgroundImage;
                const imageUrl = extractUrlFromBg(rawBg) || heroImg || 'images/homepage/salad1.jpg';
                const ds = matchedCard.dataset || {};
                const ingredients = ds.ingredients ? ds.ingredients.split('|') : ['Інгредієнт 1', 'Інгредієнт 2'];
                const steps = ds.steps ? ds.steps.split('|') : ['Крок 1: ...', 'Крок 2: ...'];
                const difficulty = ds.difficulty || 'Середня';
                const time = ds.time || matchedCard.querySelector('.cook-time')?.textContent || '';

                openModal({ title, image: imageUrl, difficulty, time, ingredients, steps, recipe_id: ds.recipeId || ds.recipeid || ds.id || '' });
                return;
            }

            // Fallback: use data-* on the CTA button if provided, otherwise simple placeholders
            const ds = cta.dataset || {};
            const ingredients = ds.ingredients ? ds.ingredients.split('|') : ['Інгредієнт 1', 'Інгредієнт 2', 'Інгредієнт 3'];
            const steps = ds.steps ? ds.steps.split('|') : ['Крок 1: ...', 'Крок 2: ...', 'Крок 3: ...'];
            const difficulty = ds.difficulty || document.querySelector('.recipe-card')?.dataset?.difficulty || 'Середня';
            const time = ds.time || document.querySelector('.cook-time')?.textContent || '';

            openModal({ title: heroTitle || 'Рецепт', image: heroImg || 'images/homepage/salad1.jpg', difficulty, time, ingredients, steps, recipe_id: cta.dataset?.recipeId || cta.dataset?.recipeid || cta.dataset?.id || '' });
        });
    }

    // Close handlers
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
})();
