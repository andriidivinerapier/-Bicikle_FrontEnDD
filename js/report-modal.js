// report-modal.js — відправка скарг на рецепт або коментар
(function () {
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    async function getSession() {
        try {
            const response = await fetch('backend/session.php');
            const json = await response.json();
            return json;
        } catch (err) {
            console.error('report-modal: session lookup failed', err);
            return { status: 'logged_out' };
        }
    }

    function createReportModal() {
        if (document.getElementById('reportModalOverlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'reportModalOverlay';
        overlay.className = 'report-modal-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.innerHTML = `
            <div class="report-modal" role="dialog" aria-modal="true" aria-labelledby="reportModalTitle">
                <button type="button" class="modal-close" aria-label="Закрити">×</button>
                <div class="report-modal-content">
                    <h3 id="reportModalTitle">Поскарга</h3>
                    <p class="report-target-label"></p>
                    <form id="reportModalForm">
                        <label for="reportReason">Причина скарги</label>
                        <select id="reportReason" name="reason" required>
                            <option value="">Оберіть причину</option>
                            <option value="Спам / реклама">Спам / реклама</option>
                            <option value="Образливий або ненависний контент">Образливий або ненависний контент</option>
                            <option value="Порушення авторських прав">Порушення авторських прав</option>
                            <option value="Неправдива інформація">Неправдива інформація</option>
                            <option value="Інше">Інше</option>
                        </select>
                        <div class="report-details-row" style="display:none;">
                            <label for="reportDetails">Опишіть деталі</label>
                            <textarea id="reportDetails" name="details" rows="5" placeholder="Напишіть, що саме не так."></textarea>
                        </div>
                        <div class="report-actions">
                            <button type="button" class="btn report-cancel">Скасувати</button>
                            <button type="submit" class="btn btn-primary report-submit">Надіслати</button>
                        </div>
                    </form>
                </div>
            </div>`;

        document.body.appendChild(overlay);

        overlay.querySelector('.modal-close').addEventListener('click', closeReportModal);
        overlay.querySelector('.report-cancel').addEventListener('click', closeReportModal);
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) closeReportModal();
        });

        const form = overlay.querySelector('#reportModalForm');
        const reasonSelect = overlay.querySelector('#reportReason');
        const detailsRow = overlay.querySelector('.report-details-row');

        reasonSelect.addEventListener('change', () => {
            if (reasonSelect.value === 'Інше') {
                detailsRow.style.display = 'block';
            } else {
                detailsRow.style.display = 'none';
            }
        });

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            await submitReportForm();
        });
    }

    function openReportModal({ targetType, targetId, targetLabel, targetSource = 'recipes' }) {
        createReportModal();
        const overlay = document.getElementById('reportModalOverlay');
        if (!overlay) return;
        const targetText = targetLabel || (targetType === 'recipe' ? 'Рецепт' : 'Коментар');
        overlay.dataset.targetType = targetType;
        overlay.dataset.targetId = String(targetId || '');
        overlay.dataset.targetSource = targetSource || 'recipes';
        overlay.querySelector('.report-target-label').textContent = `Скарга на: ${targetText}`;
        overlay.querySelector('#reportReason').value = '';
        overlay.querySelector('#reportDetails').value = '';
        overlay.querySelector('.report-details-row').style.display = 'none';
        overlay.querySelector('.report-submit').disabled = false;
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
    }

    function closeReportModal() {
        const overlay = document.getElementById('reportModalOverlay');
        if (!overlay) return;
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
    }

    async function submitReportForm() {
        const overlay = document.getElementById('reportModalOverlay');
        if (!overlay) return;
        const targetType = overlay.dataset.targetType || '';
        const targetId = overlay.dataset.targetId || '';
        const targetSource = overlay.dataset.targetSource || 'recipes';
        const reason = overlay.querySelector('#reportReason')?.value || '';
        const details = overlay.querySelector('#reportDetails')?.value.trim() || '';

        if (!targetType || !targetId) {
            alert('Не вдалось визначити мету скарги.');
            return;
        }
        if (!reason) {
            alert('Будь ласка, оберіть причину скарги.');
            return;
        }
        if (reason === 'Інше' && details === '') {
            alert('Будь ласка, опишіть, чому ви подаєте скаргу.');
            return;
        }

        const formData = new FormData();
        formData.append('target_type', targetType);
        formData.append('target_id', targetId);
        formData.append('reason', reason);
        formData.append('details', details);
        if (targetType === 'recipe') {
            formData.append('target_source', targetSource);
        }

        const submitButton = overlay.querySelector('.report-submit');
        submitButton.disabled = true;

        try {
            const response = await fetch('backend/submit-complaint.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result && result.status === 'success') {
                closeReportModal();
                if (typeof window.showToast === 'function') {
                    window.showToast(result.message || 'Скаргу надіслано.', 'success');
                } else {
                    alert(result.message || 'Скаргу надіслано.');
                }
            } else {
                if (result && result.message) {
                    alert(result.message);
                } else {
                    alert('Помилка при надсиланні скарги.');
                }
            }
        } catch (err) {
            console.error('submitReportForm error', err);
            alert('Помилка при надсиланні скарги.');
        } finally {
            submitButton.disabled = false;
        }
    }

    async function ensureLoggedOrAuth() {
        const session = await getSession();
        if (!session || session.status !== 'logged') {
            if (typeof openAuthModal === 'function') {
                openAuthModal();
            } else {
                const loginBtn = document.getElementById('loginBtn');
                if (loginBtn) loginBtn.click();
            }
            return false;
        }
        return true;
    }

    document.addEventListener('click', async (event) => {
        const reportButton = event.target.closest('.report-recipe-btn');
        if (reportButton) {
            event.preventDefault();
            if (!(await ensureLoggedOrAuth())) return;
            const overlay = reportButton.closest('.recipe-modal-overlay') || document.getElementById('recipeModal');
            if (!overlay) return;
            let recipeId = overlay.dataset.recipeId || overlay.getAttribute('data-recipe-id') || '';
            const targetLabel = overlay.querySelector('#modalTitle')?.textContent?.trim() || 'Рецепт';
            let targetSource = overlay.dataset.source || overlay.dataset.targetSource || 'recipes';
            openReportModal({ targetType: 'recipe', targetId: recipeId, targetLabel, targetSource });
            return;
        }

        const commentBtn = event.target.closest('.comment-action-btn.report');
        if (commentBtn) {
            event.preventDefault();
            if (!(await ensureLoggedOrAuth())) return;
            const commentEl = commentBtn.closest('.comment-item');
            if (!commentEl) return;
            const commentId = commentEl.dataset.commentId || '';
            const commentText = commentEl.querySelector('.comment-content')?.textContent?.trim() || '';
            const snippet = commentText.length > 80 ? commentText.slice(0, 80) + '…' : commentText;
            openReportModal({ targetType: 'comment', targetId: commentId, targetLabel: snippet || 'Коментар' });
        }
    });

    // Expose helper globally for other scripts
    window.openReportModal = openReportModal;
})();
