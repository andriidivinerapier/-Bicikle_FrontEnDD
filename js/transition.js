document.addEventListener('DOMContentLoaded', () => {
    // Показуємо сторінку після завантаження
    document.querySelector('.fade-page').style.opacity = '1';
});

// Додаємо обробник для всіх посилань
document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    
    // Перевіряємо, чи клік був по посиланню і чи це внутрішнє посилання
    if (link && link.href && link.href.startsWith(window.location.origin)) {
        e.preventDefault();
        
        // Анімація fade-out
        document.querySelector('.fade-page').style.opacity = '0';
        
        // Переходимо на нову сторінку після завершення анімації
        setTimeout(() => {
            window.location.href = link.href;
        }, 500); // Час має співпадати з CSS transition
    }
});