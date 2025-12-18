(function(){
    // Inject modal markup once
    function ensureModal(){
        if (document.getElementById('confirmDeleteModal')) return document.getElementById('confirmDeleteModal');
        const wrap = document.createElement('div');
        wrap.id = 'confirmDeleteModal';
        wrap.className = 'confirm-delete-overlay';
        wrap.setAttribute('aria-hidden','true');
        wrap.innerHTML = `
            <div class="confirm-delete-box" role="dialog" aria-modal="true" aria-labelledby="cdm-title">
                <div class="confirm-delete-title" id="cdm-title">Видалити коментар?</div>
                <div class="confirm-delete-desc" id="cdm-desc">Ви дійсно хочете видалити цей коментар? Цю дію не можна буде скасувати.</div>
                <div class="confirm-delete-actions">
                    <button class="btn cancel" id="cdm-no">Ні</button>
                    <button class="btn confirm" id="cdm-yes">Так</button>
                </div>
            </div>`;
        document.body.appendChild(wrap);
        return wrap;
    }

    function showConfirmDelete(message, title){
        return new Promise((resolve)=>{
            const modal = ensureModal();
            const box = modal.querySelector('.confirm-delete-box');
            const titleEl = modal.querySelector('#cdm-title');
            const descEl = modal.querySelector('#cdm-desc');
            const yes = modal.querySelector('#cdm-yes');
            const no = modal.querySelector('#cdm-no');

            if (title) titleEl.textContent = title;
            if (message) descEl.textContent = message;

            function cleanup(){
                modal.classList.remove('open');
                modal.setAttribute('aria-hidden','true');
                modal.style.display = 'none';
                yes.removeEventListener('click', onYes);
                no.removeEventListener('click', onNo);
                modal.removeEventListener('click', onOverlay);
                document.removeEventListener('keydown', onKey);
            }

            function onYes(e){ e && e.preventDefault(); cleanup(); resolve(true); }
            function onNo(e){ e && e.preventDefault(); cleanup(); resolve(false); }
            function onOverlay(ev){ if (ev.target === modal) { cleanup(); resolve(false); } }
            function onKey(ev){ if (ev.key === 'Escape' || ev.key === 'Esc') { ev.preventDefault(); cleanup(); resolve(false); } }

            yes.addEventListener('click', onYes);
            no.addEventListener('click', onNo);
            modal.addEventListener('click', onOverlay);
            document.addEventListener('keydown', onKey);

            // show
            modal.style.display = 'flex';
            // small timeout to allow styles to apply
            requestAnimationFrame(()=>{ modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); });
            // focus yes by default
            setTimeout(()=>{ try{ yes.focus(); }catch(e){} }, 40);
        });
    }

    // expose helper
    window.showConfirmDelete = showConfirmDelete;
})();
