(function(){
    function $(sel, root=document){ return root.querySelector(sel); }
    function escapeHtml(s){ if(!s) return ''; return (''+s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    function formatDate(dt){ const d = new Date(dt); if(isNaN(d)) return dt||''; return d.toLocaleString(); }

    const listEl = document.getElementById('myCommentsList');
    const refreshBtn = document.getElementById('refreshMyComments');
    const perPageDefault = 10;
    let currentPage = 1;
    let totalPages = 1;

    function renderPagination(container){
        // remove existing
        const existing = container.querySelector('.my-comments-pagination');
        if(existing) existing.remove();
        const wrap = document.createElement('div'); wrap.className = 'my-comments-pagination';
        const prev = document.createElement('button'); prev.className='pag-btn prev'; prev.textContent='← Попередня'; prev.disabled = currentPage <= 1;
        const next = document.createElement('button'); next.className='pag-btn next'; next.textContent='Наступна →'; next.disabled = currentPage >= totalPages;
        wrap.appendChild(prev);
        // simple numeric pages (show up to 7 pages centered)
        const pagesWrap = document.createElement('div'); pagesWrap.className='pag-pages';
        const maxVisible = 7;
        let start = Math.max(1, currentPage - Math.floor(maxVisible/2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        if(end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
        for(let p = start; p <= end; p++){
            const pb = document.createElement('button'); pb.className='pag-btn page'; pb.textContent = p; pb.setAttribute('data-page', String(p));
            if(p===currentPage) { pb.classList.add('active'); pb.setAttribute('aria-current','page'); }
            pb.addEventListener('click', (ev)=>{
                ev.preventDefault();
                const targetPage = Number(pb.dataset.page || p);
                if(targetPage === currentPage) return;
                currentPage = targetPage;
                try { const u = new URL(window.location.href); u.searchParams.set('tab','comments'); u.searchParams.set('page', String(currentPage)); window.history.replaceState(null,'',u.toString()); } catch(e) {}
                loadMyComments(currentPage);
            });
            pagesWrap.appendChild(pb);
        }
        wrap.appendChild(pagesWrap);
        wrap.appendChild(next);
        prev.addEventListener('click', ()=>{ if(currentPage>1){ currentPage--; try { const u = new URL(window.location.href); u.searchParams.set('tab','comments'); u.searchParams.set('page', String(currentPage)); window.history.replaceState(null,'',u.toString()); } catch(e) {} loadMyComments(currentPage); } });
        next.addEventListener('click', ()=>{ if(currentPage<totalPages){ currentPage++; try { const u = new URL(window.location.href); u.searchParams.set('tab','comments'); u.searchParams.set('page', String(currentPage)); window.history.replaceState(null,'',u.toString()); } catch(e) {} loadMyComments(currentPage); } });
        container.appendChild(wrap);
    }

    // Modal confirmation helper using existing #confirmModal in profile.html
    function showConfirmModal(message, title) {
        return new Promise((resolve) => {
            const overlay = document.getElementById('confirmModal');
            if (!overlay) {
                // fallback to native confirm
                return resolve(window.confirm(message));
            }
            const msgEl = document.getElementById('confirmModalMessage');
            const titleEl = document.getElementById('confirmModalTitle');
            // Prefer existing buttons; if missing, create them to ensure visibility
            let yesBtn = document.getElementById('confirmModalYes');
            let noBtn = document.getElementById('confirmModalNo');
            const actionsContainer = overlay.querySelector('.confirm-modal-actions');
            if (!yesBtn || !noBtn) {
                // remove any stale children
                if (actionsContainer) actionsContainer.innerHTML = '';
                if (!noBtn) {
                    noBtn = document.createElement('button');
                    noBtn.id = 'confirmModalNo';
                    noBtn.className = 'btn btn-secondary';
                    noBtn.textContent = 'Ні';
                    if (actionsContainer) actionsContainer.appendChild(noBtn);
                }
                if (!yesBtn) {
                    yesBtn = document.createElement('button');
                    yesBtn.id = 'confirmModalYes';
                    yesBtn.className = 'btn btn-danger';
                    yesBtn.textContent = 'Так';
                    if (actionsContainer) actionsContainer.appendChild(yesBtn);
                }
            }

            if (msgEl) msgEl.textContent = message || '';
            if (titleEl && title) titleEl.textContent = title;

            function cleanup() {
                yesBtn.removeEventListener('click', onYes);
                noBtn.removeEventListener('click', onNo);
                overlay.classList.remove('open');
                overlay.setAttribute('aria-hidden', 'true');
                // ensure it's hidden for older browsers
                overlay.style.display = 'none';
                overlay.removeEventListener('click', onOverlayClick);
            }

            function onYes(e) { e.preventDefault(); cleanup(); resolve(true); }
            function onNo(e) { e.preventDefault(); cleanup(); resolve(false); }

            function onOverlayClick(ev) {
                if (ev.target === overlay) { cleanup(); resolve(false); }
            }

            yesBtn.addEventListener('click', onYes);
            noBtn.addEventListener('click', onNo);

            // show overlay (use both class and explicit display to be robust)
            overlay.style.display = 'flex';
            overlay.classList.add('open');
            overlay.setAttribute('aria-hidden', 'false');
            overlay.addEventListener('click', onOverlayClick);
            // focus yes button for accessibility
            setTimeout(()=> { try { yesBtn.focus(); } catch(e){} }, 50);
        });
    }

    async function loadMyComments(page = 1){
        if(!listEl) return;
        currentPage = page || currentPage || 1;
        listEl.innerHTML = '<div class="my-comments-loading">Завантаження коментарів…</div>';
        try{
            const url = `backend/get-user-comments.php?page=${encodeURIComponent(currentPage)}&per_page=${encodeURIComponent(perPageDefault)}`;
            const res = await fetch(url);
            const j = await res.json();
            if(!j) throw new Error('Невірний відповідь сервера');
            if(j.status === 'logged_out'){
                listEl.innerHTML = '<div class="my-comments-empty">Щоб побачити ваші коментарі, будь ласка, увійдіть в акаунт.</div>';
                const btn = document.createElement('button'); btn.className='btn btn-primary'; btn.textContent='Увійти';
                btn.addEventListener('click', ()=>{ const loginBtn=document.getElementById('loginBtn'); if(loginBtn) loginBtn.click(); });
                listEl.appendChild(btn);
                return;
            }

            if(j.status !== 'success' || !Array.isArray(j.comments)){
                listEl.innerHTML = '<div class="my-comments-error">Не вдалося завантажити коментарі.</div>';
                return;
            }

            const comments = j.comments;
            totalPages = j.pages || 1;

            // update history url to reflect current page when loading programmatically
            try { const u = new URL(window.location.href); u.searchParams.set('tab','comments'); u.searchParams.set('page', String(currentPage)); window.history.replaceState(null,'',u.toString()); } catch(e){}

            listEl.innerHTML = '';
            // ensure header area remains above — listEl should be below header in DOM
            comments.forEach(c => {
                const item = document.createElement('div'); item.className = 'my-comment-item'; item.dataset.commentId = c.id || '';
                const recipeTitle = escapeHtml(c.recipe_title || 'Рецепт');
                const recipeId = c.recipe_id || '';
                const recipeLink = `<a class="recipe-link" href="recipes.html?recipe_id=${encodeURIComponent(recipeId)}">${recipeTitle}</a>`;
                item.innerHTML = `
                    <div class="my-comment-meta">
                        <div class="left">${recipeLink}<div class="time">${formatDate(c.created_at||'')}</div></div>
                        <div class="my-comment-actions">
                            <button class="btn-edit">Редагувати</button>
                            <button class="btn-delete">Видалити</button>
                        </div>
                    </div>
                    <div class="my-comment-content">${escapeHtml(c.content || '')}</div>
                `;
                listEl.appendChild(item);
                // attach click on recipe link to open recipe modal and highlight the comment
                const link = item.querySelector('.recipe-link');
                if (link) {
                    link.addEventListener('click', async (ev) => {
                        ev.preventDefault();
                        const itemEl = link.closest('.my-comment-item');
                        const cid = itemEl ? itemEl.dataset.commentId : null;
                        // resolve recipe id from href or dataset
                        let rid = '';
                        try { const u = new URL(link.href, window.location.href); rid = u.searchParams.get('recipe_id') || ''; } catch (e) { rid = link.dataset.recipeId || ''; }

                        // try to find existing recipe card on page
                        let card = null;
                        try { card = document.querySelector('.recipe-card[data-recipe-id="' + rid + '"]'); } catch (e) { card = null; }

                        if (card) {
                            const btn = card.querySelector('.recipe-button');
                            if (btn) btn.click();
                            else if (typeof openRecipeModal === 'function') openRecipeModal(card);
                        } else {
                            // create a temporary minimal card so profile/recipes modal opener can use it
                            // attempt to fetch full recipe data from backend to populate modal fields
                            let recipeData = null;
                            try {
                                const rresp = await fetch('backend/get-recipe.php?id=' + encodeURIComponent(rid));
                                const jr = await rresp.json();
                                if (jr && jr.status === 'success' && jr.recipe) recipeData = jr.recipe;
                            } catch (e) { console.error('Failed to fetch recipe for modal:', e); }

                            const temp = document.createElement('div');
                            temp.className = 'recipe-card';
                            temp.style.display = 'none';
                            temp.dataset.recipeId = rid || '';
                            temp.dataset.ingredients = (recipeData && (recipeData.ingredients || recipeData.ingredients === '') ) ? (recipeData.ingredients || '') : '';
                            temp.dataset.steps = (recipeData && (recipeData.instructions || recipeData.instructions === '')) ? (recipeData.instructions || '') : '';
                            temp.dataset.difficulty = (recipeData && recipeData.difficulty) ? recipeData.difficulty : '';
                            temp.dataset.time = (recipeData && (recipeData.cooking_time || recipeData.time)) ? (recipeData.cooking_time || recipeData.time) : '';
                            const imageUrl = (recipeData && recipeData.image_path) ? recipeData.image_path : '';
                            temp.innerHTML = `<div class="recipe-image" style="background-image: url('${escapeHtml(imageUrl)}');"></div><div class="recipe-info"><h4>${escapeHtml(link.textContent || 'Рецепт')}</h4><div class="recipe-meta"><div class="meta-left"><span class="cook-time"></span></div><div class="meta-right"><button class="recipe-button">Рецепт</button></div></div></div>`;
                            document.body.appendChild(temp);
                            // trigger opener (profile.js listens for clicks on .recipe-button)
                            const tb = temp.querySelector('.recipe-button');
                            if (tb) tb.click();
                            // remove temp after a short delay
                            setTimeout(() => { try { temp.remove(); } catch (e) {} }, 3000);
                        }

                        // ask comments module to highlight the comment in modal when it loads
                        if (cid) document.dispatchEvent(new CustomEvent('highlightComment', { detail: { commentId: String(cid) } }));
                    });
                }
            });

            renderPagination(listEl);

            // attach handlers
            listEl.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', async (ev)=>{
                    const item = btn.closest('.my-comment-item'); if(!item) return;
                    const cid = item.dataset.commentId;
                    // Use the shared styled modal if available, fallback to native confirm
                    let confirmed = false;
                    try{
                        if (typeof window.showConfirmDelete === 'function') {
                            confirmed = await window.showConfirmDelete('Ви дійсно хочете видалити цей коментар?','Видалити коментар?');
                        } else {
                            confirmed = confirm('Ви дійсно хочете видалити цей коментар?');
                        }
                    }catch(e){ confirmed = false; }
                    if (!confirmed) return;
                    try{
                        const fd = new FormData(); fd.append('comment_id', cid);
                        const res = await fetch('backend/delete-comment.php', { method: 'POST', body: fd });
                        const j = await res.json();
                        if(j && j.status === 'success') {
                            if (typeof window.showToast === 'function') window.showToast('Ваш коментар успішно видалено', 'success');
                            else if (typeof window.showAuthToast === 'function') window.showAuthToast('Ваш коментар успішно видалено', 'success');
                            else alert('Ваш коментар успішно видалено');
                            loadMyComments(currentPage);
                        } else {
                            if (j && j.message) {
                                if (typeof window.showToast === 'function') window.showToast(j.message, 'error');
                                else alert(j.message);
                            } else {
                                alert('Не вдалося видалити коментар');
                            }
                        }
                    }catch(e){ console.error(e); alert('Помилка при видаленні'); }
                });
            });

            listEl.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', (ev)=>{
                    const item = btn.closest('.my-comment-item'); if(!item) return;
                    if(item.querySelector('.comment-edit-area')) return;
                    const contentEl = item.querySelector('.my-comment-content'); const current = contentEl ? contentEl.textContent.trim() : '';
                    contentEl.style.display = 'none';
                    const edit = document.createElement('div'); edit.className='comment-edit-area';
                    edit.innerHTML = `<textarea>${escapeHtml(current)}</textarea><div class="comment-edit-controls"><button class="cancel btn">Скасувати</button><button class="save btn btn-primary">Зберегти</button></div>`;
                    contentEl.insertAdjacentElement('afterend', edit);
                    edit.querySelector('.cancel').addEventListener('click', ()=>{ edit.remove(); contentEl.style.display=''; });
                    edit.querySelector('.save').addEventListener('click', async ()=>{
                        const ta = edit.querySelector('textarea'); const val = ta.value.trim(); if(!val) return alert('Коментар порожній');
                        const cid = item.dataset.commentId;
                        try{
                            const fd = new FormData(); fd.append('comment_id', cid); fd.append('content', val);
                            const res = await fetch('backend/edit-comment.php', { method: 'POST', body: fd });
                            const j = await res.json();
                            if(j && j.status === 'success') { loadMyComments(currentPage); }
                            else alert(j.message || 'Не вдалося зберегти');
                        }catch(e){ console.error(e); alert('Помилка при збереженні'); }
                    });
                });
            });

        }catch(err){ console.error(err); listEl.innerHTML = '<div class="my-comments-error">Помилка при завантаженні коментарів.</div>'; }
    }

    if(refreshBtn) refreshBtn.addEventListener('click', (e)=>{ loadMyComments(1); });

    // Load when user opens tab
    document.addEventListener('click', (e)=>{
        const btn = e.target.closest && e.target.closest('.profile-tab-btn');
        if(!btn) return;
        if(btn.dataset && btn.dataset.tab === 'comments') setTimeout(()=>loadMyComments(1), 80);
    });

    // Expose simple API to show/hide and trigger loading from other scripts
    window.showMyComments = function(page){ if(!listEl) return; listEl.style.display = ''; var initialPage = 1; try { const u = new URL(window.location.href); initialPage = Number(page || u.searchParams.get('page') || 1) || 1; } catch(e) { initialPage = Number(page) || 1; } loadMyComments(initialPage); };
    window.hideMyComments = function(){ if(!listEl) return; listEl.style.display = 'none'; };

    // Refresh comments when a notification indicates a comment was deleted
    document.addEventListener('notificationsUpdated', (ev) => {
        try {
            const notes = ev && ev.detail ? ev.detail : [];
            if (!Array.isArray(notes) || notes.length === 0) return;
            for (const n of notes) {
                if (!n || !n.message) continue;
                const m = String(n.message);
                if (m.indexOf('Ваш коментар') !== -1 && /видал/i.test(m)) {
                    try { loadMyComments(currentPage); } catch (e) { console.error('reload my comments failed', e); }
                    break;
                }
            }
        } catch (e) { console.error('notificationsUpdated handler error', e); }
    });

    // Auto-load when page param requests comments
    document.addEventListener('DOMContentLoaded', ()=>{
        try{
            const url = new URL(window.location.href);
            if(url.searchParams.get('tab') === 'comments') {
                const p = Number(url.searchParams.get('page') || 1) || 1;
                if(window.showMyComments) window.showMyComments(p);
            }
        }catch(e){}
    });

})();
