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
                <div class="adm-modal-input" id="adm-input-wrap" style="display:none;margin-top:8px;">
                    <label id="adm-input-label" for="adm-input" style="display:block;margin-bottom:6px;font-weight:600;color:var(--adm-modal-text);">Значення</label>
                    <input id="adm-input" type="text" placeholder="">
                </div>
                <div class="adm-modal-reason" id="adm-reason-wrap" style="display:none;margin-top:8px;">
                    <label id="adm-reason-label" for="adm-reason" style="display:block;margin-bottom:6px;font-weight:600;color:var(--adm-modal-text);">Причина (опціонально)</label>
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
            const inputWrap = modal.querySelector('#adm-input-wrap');
            const inputLabel = modal.querySelector('#adm-input-label');
            const inputField = modal.querySelector('#adm-input');
            const reasonWrap = modal.querySelector('#adm-reason-wrap');
            const reasonLabel = modal.querySelector('#adm-reason-label');
            const reasonTextarea = modal.querySelector('#adm-reason');
            const btnYes = modal.querySelector('#adm-confirm');
            const btnNo = modal.querySelector('#adm-cancel');

            // Set texts and visibility
            titleEl.textContent = opts.title || 'Підтвердження';
            descEl.textContent = opts.message || '';
            inputWrap.style.display = opts.inputType ? 'block' : 'none';
            inputLabel.textContent = opts.inputLabel || 'Значення';
            reasonWrap.style.display = opts.showReason ? 'block' : 'none';
            reasonLabel.textContent = opts.reasonLabel || 'Причина (опціонально)';

            const useInput = Boolean(opts.inputType);
            if (useInput) {
                inputField.type = opts.inputType;
                inputField.value = opts.defaultInput || '';
                inputField.placeholder = opts.placeholder || '';
                inputField.min = opts.inputMin !== undefined ? opts.inputMin : '';
                inputField.max = opts.inputMax !== undefined ? opts.inputMax : '';
                inputField.step = opts.inputStep !== undefined ? opts.inputStep : '';
            }

            reasonTextarea.value = opts.defaultReason || '';
            reasonTextarea.placeholder = opts.reasonPlaceholder || 'Опишіть причину (опціонально)';

            // Allow customizing button labels and confirm button class (approve/reject)
            btnYes.textContent = opts.confirmText || 'Так';
            // If cancelText is explicitly null/false, hide the cancel button
            if (opts.cancelText === null || opts.cancelText === false) {
                btnNo.style.display = 'none';
            } else {
                btnNo.style.display = '';
                btnNo.textContent = (typeof opts.cancelText === 'string' && opts.cancelText.length) ? opts.cancelText : 'Ні';
            }
            // Clean custom classes then add requested class
            btnYes.classList.remove('approve','reject');
            if (opts.confirmClass) {
                btnYes.classList.add(opts.confirmClass);
            } else if (opts.cancelText === null || opts.cancelText === false) {
                // When cancel button is hidden, make confirm button stand out as a destructive/red action
                btnYes.classList.add('reject');
            }

            function cleanup(){
                modal.classList.remove('open');
                modal.setAttribute('aria-hidden','true');
                modal.style.display = 'none';
                btnYes.removeEventListener('click', onYes);
                btnNo.removeEventListener('click', onNo);
                modal.removeEventListener('click', onOverlay);
                document.removeEventListener('keydown', onKey);
            }
            function onYes(e){ e && e.preventDefault(); const inputValue = useInput ? inputField.value.trim() : null; const reasonValue = reasonTextarea.value.trim(); cleanup(); resolve({confirmed:true, input: inputValue, reason: reasonValue}); }
            function onNo(e){ e && e.preventDefault(); cleanup(); resolve({confirmed:false}); }
            function onOverlay(ev){ if (ev.target === modal) { cleanup(); resolve({confirmed:false}); } }
            function onKey(ev){ if (ev.key === 'Escape' || ev.key === 'Esc') { ev.preventDefault(); onNo(); } }

            btnYes.addEventListener('click', onYes);
            if (btnNo.style.display !== 'none') btnNo.addEventListener('click', onNo);
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
