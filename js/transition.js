document.addEventListener('DOMContentLoaded', () => {
    // Показуємо сторінку після завантаження — додаємо клас visible
    const container = document.querySelector('.fade-page');
    if (container) container.classList.add('visible');
});

// Додаємо обробник для посилань — перевіряємо чи це внутрішнє (same-origin або відносне)
document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    // Ігноруємо посилання, які виводять назовні або мають спеціальні схеми
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || link.target === '_blank') return;

    // Обчислимо URL відносно поточної сторінки — працює і для file://
    let linkUrl;
    try {
        linkUrl = new URL(href, window.location.href);
    } catch (err) {
        return; // невірний URL
    }

    // Якщо origin збігається — це внутрішнє посилання
    const isInternal = (linkUrl.origin === window.location.origin);
    // У випадку file: origin може бути 'null' — тоді порівняємо шлях
    const sameFileProtocol = window.location.protocol === 'file:' && linkUrl.pathname && linkUrl.pathname !== '';

    if (isInternal || sameFileProtocol) {
        e.preventDefault();
        const container = document.querySelector('.fade-page');
        if (container) {
            container.classList.remove('visible');
            container.classList.add('fade-out');
        }

        // Почекаємо завершення transition (500ms у CSS)
        setTimeout(() => {
            // Для відносних посилань використовуємо повний href
            window.location.href = linkUrl.href;
        }, 500);
    }
});