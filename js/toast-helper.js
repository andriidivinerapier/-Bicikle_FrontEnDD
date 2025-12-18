(function(){
    if (typeof window.showToast === 'function') return;
    window.showToast = function(message, type='info'){
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.position = 'fixed';
            container.style.right = '20px';
            container.style.bottom = '20px';
            container.style.zIndex = 100000;
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'flex-end';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'toast-item';
        toast.style.marginTop = '8px';
        toast.style.padding = '10px 14px';
        toast.style.borderRadius = '8px';
        toast.style.color = '#fff';
        toast.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
        toast.style.fontSize = '0.95rem';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 200ms ease, transform 200ms ease';

        if (type === 'success') toast.style.background = '#28a745';
        else if (type === 'error') toast.style.background = '#e74c3c';
        else toast.style.background = '#333';

        toast.textContent = message;
        container.appendChild(toast);

        requestAnimationFrame(()=>{ toast.style.opacity = '1'; toast.style.transform = 'translateY(-6px)'; });
        setTimeout(()=>{ toast.style.opacity = '0'; toast.style.transform = ''; setTimeout(()=>toast.remove(),400); }, 3000);
    };
})();
