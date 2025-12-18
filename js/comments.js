// comments.js — load and post comments for recipe modal
(function(){
    function $(sel, root=document) { return root.querySelector(sel); }

    function formatDate(dt) {
        const d = new Date(dt);
        if (isNaN(d)) return dt || '';
        return d.toLocaleString();
    }

    let _cachedSession = null;
    let _pendingHighlightCommentId = null;

    function highlightCommentInList(listEl, commentId) {
        if (!listEl || !commentId) return;
        const tryFind = () => {
            const item = listEl.querySelector('.comment-item[data-comment-id="' + commentId + '"]');
            if (item) {
                item.classList.add('comment-highlight');
                try { item.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
                setTimeout(() => { try { item.classList.remove('comment-highlight'); } catch (e) {} }, 3000);
                return true;
            }
            return false;
        };
        // try immediately, otherwise retry a few times while comments load
        if (tryFind()) return;
        let attempts = 0;
        const id = setInterval(() => {
            attempts++;
            if (tryFind() || attempts > 10) clearInterval(id);
        }, 220);
    }
    async function getSession() {
        if (_cachedSession) return _cachedSession;
        try {
            const r = await fetch('backend/session.php');
            const j = await r.json();
            _cachedSession = j;
            return j;
        } catch (e) {
            return { status: 'logged_out' };
        }
    }

    async function renderComments(container, comments) {
        container.innerHTML = '';
        const empty = !comments || comments.length === 0;
        if (empty) {
            container.innerHTML = '<div class="comment-empty">Ще немає коментарів. Будьте першим!</div>';
            container.classList.add('comments-empty');
            return;
        } else {
            container.classList.remove('comments-empty');
        }

        const session = await getSession();

        comments.forEach(c => {
            const el = document.createElement('div');
            el.className = 'comment-item';
            el.dataset.commentId = c.id || '';
            const safeUser = escapeHtml(c.username || 'User');
            el.innerHTML = `
                <div class="comment-meta">
                    <div style="display:flex;gap:0.5rem;align-items:center;">
                        <div class="comment-username">${safeUser}</div>
                        <div class="comment-time">${formatDate(c.created_at || '')}</div>
                    </div>
                    <div class="comment-actions-inline"></div>
                </div>
                <div class="comment-content">${escapeHtml(c.content || '')}</div>
            `;

            // show action buttons if logged in and owner or admin
            const actions = el.querySelector('.comment-actions-inline');
            const isLogged = session && session.status === 'logged';
            const isOwner = isLogged && (parseInt(session.id || 0, 10) === parseInt(c.user_id || 0, 10));
            const isAdmin = isLogged && (session.role === 'admin');
            if (isLogged && (isOwner || isAdmin)) {
                actions.innerHTML = `
                    <button class="comment-action-btn comment-edit" title="Редагувати"><i class="fa fa-edit" aria-hidden="true"></i></button>
                    <button class="comment-action-btn comment-delete" title="Видалити"><i class="fa fa-trash" aria-hidden="true"></i></button>
                `;
            }

            container.appendChild(el);
        });

        // If modal requested a pending highlight, apply it when rendering inside modal
        if (container && container.id === 'modalCommentsList' && _pendingHighlightCommentId) {
            highlightCommentInList(container, _pendingHighlightCommentId);
            _pendingHighlightCommentId = null;
        }

        // attach handlers
        container.querySelectorAll('.comment-edit').forEach(btn => {
            btn.addEventListener('click', (ev) => {
                ev.preventDefault();
                const item = btn.closest('.comment-item');
                if (!item) return;
                const cid = item.dataset.commentId;
                const contentEl = item.querySelector('.comment-content');
                const current = contentEl ? contentEl.textContent.trim() : '';
                // if already editing, ignore
                if (item.querySelector('.comment-edit-area')) return;
                const editHtml = `
                    <div class="comment-edit-area">
                        <textarea>${escapeHtml(current)}</textarea>
                        <div class="comment-edit-controls">
                            <button class="btn btn-secondary cancel-edit">Скасувати</button>
                            <button class="btn btn-primary save-edit">Зберегти</button>
                        </div>
                    </div>`;
                contentEl.style.display = 'none';
                contentEl.insertAdjacentHTML('afterend', editHtml);
                const editArea = item.querySelector('.comment-edit-area');
                editArea.querySelector('.cancel-edit').addEventListener('click', () => {
                    editArea.remove();
                    contentEl.style.display = '';
                });
                editArea.querySelector('.save-edit').addEventListener('click', async () => {
                    const ta = editArea.querySelector('textarea');
                    const newVal = ta.value.trim();
                    if (!newVal) return alert('Коментар порожній');
                    // disable buttons
                    editArea.querySelectorAll('button').forEach(b=>b.disabled=true);
                    try {
                        const fd = new FormData(); fd.append('comment_id', cid); fd.append('content', newVal);
                        const res = await fetch('backend/edit-comment.php', { method: 'POST', body: fd });
                        const j = await res.json();
                        if (j && j.status === 'success') {
                            // reload comments
                            const recipeId = container.dataset.recipeId || '';
                            if (recipeId) loadCommentsFor(recipeId, container);
                        } else {
                            alert(j.message || 'Не вдалося зберегти');
                            editArea.querySelectorAll('button').forEach(b=>b.disabled=false);
                        }
                    } catch (err) {
                        console.error('Edit comment failed', err);
                        alert('Помилка при збереженні коментаря');
                        editArea.querySelectorAll('button').forEach(b=>b.disabled=false);
                    }
                });
            });
        });

        container.querySelectorAll('.comment-delete').forEach(btn => {
            btn.addEventListener('click', async (ev) => {
                ev.preventDefault();
                const item = btn.closest('.comment-item');
                if (!item) return;
                const cid = item.dataset.commentId;
                try {
                    const confirmed = await showDeleteModal();
                    if (!confirmed) return;
                    const fd = new FormData(); fd.append('comment_id', cid);
                    const res = await fetch('backend/delete-comment.php', { method: 'POST', body: fd });
                    const j = await res.json();
                    if (j && j.status === 'success') {
                        const recipeId = container.dataset.recipeId || '';
                        if (recipeId) loadCommentsFor(recipeId, container);
                    } else {
                        console.error('delete-comment response', j);
                        alert(j.message || 'Не вдалося видалити — подивіться консоль');
                    }
                } catch (err) {
                    console.error('Delete comment failed', err);
                    alert('Помилка при видаленні коментаря');
                }
            });
        });
    }

    // --- Delete confirmation modal helper ---
    let _deleteModalEl = null;
    function createDeleteModal() {
        if (_deleteModalEl) return _deleteModalEl;
        const wrap = document.createElement('div');
        wrap.className = 'comment-delete-modal-overlay';
        wrap.innerHTML = `
            <div class="comment-delete-modal" role="dialog" aria-modal="true" aria-labelledby="cdm-title">
                <div class="title" id="cdm-title">Видалити коментар?</div>
                <div class="desc">Ви дійсно хочете видалити цей коментар? Цю дію не можна буде скасувати.</div>
                <div class="actions">
                    <button class="btn cancel">Ні</button>
                    <button class="btn confirm">Так</button>
                </div>
            </div>`;
        document.body.appendChild(wrap);
        _deleteModalEl = wrap;
        return _deleteModalEl;
    }

    function showDeleteModal() {
        return new Promise((resolve) => {
            const overlay = createDeleteModal();
            const dialog = overlay.querySelector('.comment-delete-modal');
            const cancelBtn = overlay.querySelector('.cancel');
            const confirmBtn = overlay.querySelector('.confirm');

            let keyHandler;

            function closeAndResolve(result) {
                // remove interaction listeners to avoid double calls
                cancelBtn.removeEventListener('click', onCancel);
                confirmBtn.removeEventListener('click', onConfirm);
                overlay.removeEventListener('click', onOverlayClick);
                document.removeEventListener('keydown', keyHandler);

                // start closing animation
                dialog.classList.remove('open');
                overlay.classList.remove('open');
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';

                // wait for transitionend on dialog then remove
                const clean = () => {
                    if (overlay && overlay.parentElement) overlay.parentElement.removeChild(overlay);
                    _deleteModalEl = null;
                    resolve(result);
                };
                dialog.addEventListener('transitionend', function te() { dialog.removeEventListener('transitionend', te); clean(); }, { once: true });
                // fallback in case transitionend doesn't fire
                setTimeout(clean, 360);
            }

            function onCancel(e) { e.preventDefault(); closeAndResolve(false); }
            function onConfirm(e) { e.preventDefault(); closeAndResolve(true); }
            function onOverlayClick(ev) { if (ev.target === overlay) closeAndResolve(false); }
            keyHandler = function(ev) { if (ev.key === 'Escape' || ev.key === 'Esc') { ev.preventDefault(); closeAndResolve(false); } };

            cancelBtn.addEventListener('click', onCancel);
            confirmBtn.addEventListener('click', onConfirm);
            overlay.addEventListener('click', onOverlayClick);
            document.addEventListener('keydown', keyHandler);

            // show with animation
            // allow the element to render, then add .open classes
            requestAnimationFrame(() => {
                overlay.classList.add('open');
                dialog.classList.add('open');
                document.body.classList.add('modal-open');
                document.body.style.overflow = 'hidden';
                // focus confirm for accessibility
                setTimeout(()=>{ confirmBtn.focus(); }, 50);
            });
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return (''+str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    async function loadCommentsFor(recipeId, listEl) {
        if (!recipeId) return;
        try { if (listEl) listEl.dataset.recipeId = recipeId; } catch(e) {}
        try {
            const res = await fetch('backend/get-comments.php?recipe_id=' + encodeURIComponent(recipeId));
            const json = await res.json();
            if (json && json.status === 'success') {
                renderComments(listEl, json.comments);
            } else {
                listEl.innerHTML = '<div class="comment-empty">Не вдалося завантажити коментарі.</div>';
            }
        } catch (err) {
            console.error('Comments load error', err);
            listEl.innerHTML = '<div class="comment-empty">Помилка при завантаженні коментарів.</div>';
        }
    }

    async function postComment(recipeId, content) {
        const fd = new FormData();
        fd.append('recipe_id', recipeId);
        fd.append('content', content);
        const res = await fetch('backend/add-comment.php', { method: 'POST', body: fd });
        return res.json();
    }

    function showLoginPrompt(form) {
        // remove existing prompt if any
        const existing = form.parentElement.querySelector('.comment-login-prompt');
        if (existing) existing.remove();
        form.style.display = 'none';
        const wrap = document.createElement('div');
        wrap.className = 'comment-login-prompt';
        wrap.innerHTML = `
            <div style="padding:12px;border-radius:6px;background:#fff6ea;color:#222;margin-bottom:8px;display:flex;gap:8px;align-items:center;justify-content:space-between;">
                <div>Щоб залишити коментар, будь ласка, увійдіть в акаунт.</div>
                <div style="flex:0 0 auto;"><button class="btn btn-primary comment-login-btn">Увійти</button></div>
            </div>`;
        form.parentElement.insertBefore(wrap, form);
        const btn = wrap.querySelector('.comment-login-btn');
        btn.addEventListener('click', (ev) => {
            ev.preventDefault();
            // close any open recipe modal (static or dynamic) before opening auth
            const overlay = form.closest('.recipe-modal-overlay') || document.getElementById('recipeModal');
            if (overlay) {
                try {
                    // if it's a dynamic overlay (created per-recipe), remove it
                    if (overlay.classList.contains('recipe-modal-overlay') && overlay.id !== 'recipeModal') {
                        overlay.remove();
                    } else {
                        overlay.classList.remove('open');
                        overlay.setAttribute('aria-hidden', 'true');
                    }
                } catch (e) { /* ignore */ }
                document.body.classList.remove('modal-open');
                document.body.classList.remove('no-scroll');
                document.body.style.overflow = '';
            }

            if (typeof openAuthModal === 'function') return openAuthModal();
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) return loginBtn.click();
            const auth = document.getElementById('authModal');
            if (auth) {
                auth.setAttribute('aria-hidden', 'false');
                document.body.classList.add('modal-open');
            }
        });
    }

    function removeLoginPrompt(form) {
        const existing = form.parentElement.querySelector('.comment-login-prompt');
        if (existing) existing.remove();
        form.style.display = '';
    }

    // handle modal open events
    document.addEventListener('recipeModalOpen', (e) => {
        const detailRid = e?.detail?.recipeId || '';
        console.debug('recipeModalOpen event, detail.recipeId=', detailRid);
        // Try to find canonical modal elements
        // prefer the visible/most-recent overlay if multiple exist
        const overlays = Array.from(document.querySelectorAll('#recipeModal, .recipe-modal-overlay'));
        if (!overlays || overlays.length === 0) return;
        // choose the last overlay in DOM order (most recently added/opened)
        const overlay = overlays[overlays.length - 1];
        if (!overlay) return;
        const list = overlay.querySelector('#modalCommentsList');
        const form = overlay.querySelector('#modalCommentForm');
        // Resolve recipe id robustly: prefer event detail, then overlay attributes/dataset, then list dataset
        let recipeId = detailRid || overlay.getAttribute('data-recipe-id') || overlay.dataset.recipeId || (list && list.dataset.recipeId) || '';
        // fallback: try to find any child element with data-recipe-id
        if (!recipeId) {
            const any = overlay.querySelector('[data-recipe-id]');
            if (any) recipeId = any.getAttribute('data-recipe-id') || any.dataset.recipeId || '';
        }
        console.debug('Resolved recipeId for comments load:', recipeId);
        if (list && recipeId) loadCommentsFor(recipeId, list);

        // ensure auth state before enabling form
        (async () => {
            const sess = await getSession();
            if (!form) return;
            if (!sess || sess.status !== 'logged') {
                showLoginPrompt(form);
            } else {
                removeLoginPrompt(form);
            }
        })();

        if (form) {
            // avoid binding multiple submit handlers when event fires repeatedly
            if (form.dataset.commentsBound) return;
            form.dataset.commentsBound = '1';

            form.addEventListener('submit', async (ev) => {
                ev.preventDefault();
                const ta = form.querySelector('textarea');
                const btn = form.querySelector('button[type="submit"]');
                if (!ta || !ta.value.trim()) return;
                // prevent duplicate submission from multiple clicks or multiple handlers
                if (form.dataset.posting === '1') return;
                form.dataset.posting = '1';
                btn.disabled = true;
                // resolve recipe id robustly: prefer current DOM attributes (overlay/list) over the captured event detail
                let rid = overlay.getAttribute('data-recipe-id') || (list && list.dataset.recipeId) || recipeId || '';
                if (!rid) {
                    // try to find nearest overlay for dynamic modals
                    const near = form.closest('.recipe-modal-overlay') || form.closest('#recipeModal');
                    if (near) rid = near.getAttribute('data-recipe-id') || near.dataset.recipeId || '';
                }
                if (!rid) {
                    form.dataset.posting = '0';
                    btn.disabled = false;
                    alert('Не вдалось визначити рецепт для додавання коментаря. Спробуйте ще раз.');
                    console.error('postComment aborted: missing recipeId. event.detail=', e?.detail, 'overlay.dataset=', overlay.dataset, 'list.dataset=', list && list.dataset);
                    return;
                }

                const json = await postComment(rid, ta.value.trim());
                btn.disabled = false;
                form.dataset.posting = '0';
                if (json && json.status === 'success') {
                    // reload comments after post
                    ta.value = '';
                    if (list) loadCommentsFor(rid, list);
                } else if (json && json.message) {
                    alert(json.message);
                } else {
                    alert('Не вдалося додати коментар');
                }
            });
        }
    });

    // allow other scripts to request a comment be highlighted when modal opens
    document.addEventListener('highlightComment', (e) => {
        _pendingHighlightCommentId = e && e.detail && e.detail.commentId ? String(e.detail.commentId) : null;
    });

    // Fallback: intercept form submissions globally so we never let the browser perform
    // a full page POST if comments.js wasn't bound before the modal opened.
    document.addEventListener('submit', async (ev) => {
        const form = ev.target;
        if (!form || form.id !== 'modalCommentForm') return;
        // if our recipe modal submit already handled via bound handler, skip
        if (form.dataset.commentsBound) return;
        ev.preventDefault();
        // check session: if not logged, show prompt / open auth
        const sess = await getSession();
        if (!sess || sess.status !== 'logged') {
            showLoginPrompt(form);
            if (typeof openAuthModal === 'function') openAuthModal();
            else {
                const loginBtn = document.getElementById('loginBtn');
                if (loginBtn) loginBtn.click();
            }
            return;
        }
        // mimic the same submit logic as above
        const ta = form.querySelector('textarea');
        const btn = form.querySelector('button[type="submit"]');
        if (!ta || !ta.value.trim()) return;
        if (form.dataset.posting === '1') return;
        form.dataset.posting = '1';
        if (btn) btn.disabled = true;

        // resolve recipe id from closest overlay or dataset
        const near = form.closest('.recipe-modal-overlay') || document.getElementById('recipeModal');
        let rid = '';
        if (near) rid = near.getAttribute('data-recipe-id') || near.dataset.recipeId || '';
        if (!rid) {
            // try any list container
            const list = (near && near.querySelector('#modalCommentsList')) || document.querySelector('#modalCommentsList');
            if (list) rid = list.dataset.recipeId || '';
        }
        if (!rid) {
            form.dataset.posting = '0';
            if (btn) btn.disabled = false;
            alert('Не вдалось визначити рецепт для додавання коментаря.');
            console.error('Global submit fallback: missing recipe id for modalCommentForm', { form });
            return;
        }

        try {
            const json = await postComment(rid, ta.value.trim());
            if (btn) btn.disabled = false;
            form.dataset.posting = '0';
            if (json && json.status === 'success') {
                ta.value = '';
                const list = (near && near.querySelector('#modalCommentsList')) || document.querySelector('#modalCommentsList');
                if (list) loadCommentsFor(rid, list);
            } else if (json && json.message) {
                alert(json.message);
            } else {
                alert('Не вдалося додати коментар');
            }
        } catch (err) {
            console.error('Global submit fallback error', err);
            if (btn) btn.disabled = false;
            form.dataset.posting = '0';
            alert('Помилка при додаванні коментаря');
        }
    });

    // Also support when modal already exists on page and code sets dataset + dispatches
    // Observe recipeModal element for dataset changes (fallback)
    const overlayObserver = new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.type === 'attributes' && m.attributeName === 'data-recipe-id') {
                const overlay = m.target;
                const recipeId = overlay.getAttribute('data-recipe-id') || overlay.dataset.recipeId || '';
                const list = overlay.querySelector('#modalCommentsList');
                if (list) loadCommentsFor(recipeId, list);
            }
        }
    });

    // attach to known overlay(s)
    document.querySelectorAll('#recipeModal, .recipe-modal-overlay').forEach(el => {
        overlayObserver.observe(el, { attributes: true });
    });

})();
