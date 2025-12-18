(function(){
    // Create admin modal markup and expose helpers
    function ensureAdminModal(){
        if (document.getElementById('admDeleteModal')) return document.getElementById('admDeleteModal');
        const wrap = document.createElement('div');
        wrap.id = 'admDeleteModal';
        wrap.className = 'adm-modal-overlay';
        wrap.setAttribute('aria-hidden','true');
        wrap.innerHTML = `
            <div class="adm-modal-box" role="dialog" aria-modal="true" aria-labelledby="adm-title">
                <div class="adm-modal-header">
                    <div class="adm-modal-title" id="adm-title">Підтвердження</div>
                </div>
                <div class="adm-modal-desc" id="adm-desc">Ви дійсно хочете виконати цю дію?</div>
                <div class="adm-modal-reason" id="adm-reason-wrap" style="display:none;">
                    <label for="adm-reason" style="display:block;margin-bottom:6px;font-weight:600;color:var(--adm-modal-text);">Причина видалення (буде надіслано/записано)</label>
                    <textarea id="adm-reason" placeholder="Опишіть причину (опціонально)"></textarea>
                </div>
                <div class="adm-modal-actions">
                    <button class="adm-btn cancel" id="adm-cancel">Ні</button>
                    <button class="adm-btn confirm" id="adm-confirm">Так</button>
                </div>
            </div>`;
        document.body.appendChild(wrap);
        return wrap;
    }

    function showAdminModal(opts = {}){
        return new Promise((resolve)=>{
            const modal = ensureAdminModal();
            const titleEl = modal.querySelector('#adm-title');
            const descEl = modal.querySelector('#adm-desc');
            const reasonWrap = modal.querySelector('#adm-reason-wrap');
            const reasonInput = modal.querySelector('#adm-reason');
            const btnYes = modal.querySelector('#adm-confirm');
            const btnNo = modal.querySelector('#adm-cancel');

            titleEl.textContent = opts.title || 'Підтвердження';
            descEl.textContent = opts.message || '';
            reasonWrap.style.display = opts.showReason ? 'block' : 'none';
            if (reasonInput) reasonInput.value = opts.defaultReason || '';

            function cleanup(){
                modal.classList.remove('open');
                modal.setAttribute('aria-hidden','true');
                modal.style.display = 'none';
                btnYes.removeEventListener('click', onYes);
                btnNo.removeEventListener('click', onNo);
                modal.removeEventListener('click', onOverlay);
                document.removeEventListener('keydown', onKey);
            }
            function onYes(e){ e && e.preventDefault(); const reason = reasonInput ? reasonInput.value.trim() : ''; cleanup(); resolve({confirmed:true, reason}); }
            function onNo(e){ e && e.preventDefault(); cleanup(); resolve({confirmed:false}); }
            function onOverlay(ev){ if (ev.target === modal) { cleanup(); resolve({confirmed:false}); } }
            function onKey(ev){ if (ev.key === 'Escape' || ev.key === 'Esc') { ev.preventDefault(); onNo(); } }

            btnYes.addEventListener('click', onYes);
            btnNo.addEventListener('click', onNo);
            modal.addEventListener('click', onOverlay);
            document.addEventListener('keydown', onKey);

            modal.style.display = 'flex';
            requestAnimationFrame(()=>{ modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); });
            setTimeout(()=>{ try{ btnYes.focus(); }catch(e){} }, 40);
        });
    }

    // Expose globally for admin-panel usage
    window.showAdminModal = showAdminModal;
})();
