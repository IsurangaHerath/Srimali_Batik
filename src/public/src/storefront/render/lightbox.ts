import { escapeHtml } from '../../shared/utils.js';

let lightboxEl: HTMLElement | null = null;

export function initLightbox(): void {
    if (lightboxEl) return;

    lightboxEl = document.createElement('div');
    lightboxEl.className = 'lightbox-overlay';
    lightboxEl.setAttribute('role', 'dialog');
    lightboxEl.setAttribute('aria-modal', 'true');
    lightboxEl.setAttribute('aria-label', 'Image preview');
    lightboxEl.innerHTML = `
        <div class="lightbox-content">
            <button class="lightbox-close-btn" aria-label="Close preview">&times;</button>
            <img src="" alt="">
            <div class="lightbox-caption"></div>
        </div>
    `;
    document.body.appendChild(lightboxEl);

    const closeBtn = lightboxEl.querySelector('.lightbox-close-btn');
    closeBtn?.addEventListener('click', closeLightbox);

    lightboxEl.addEventListener('click', (e) => {
        if (e.target === lightboxEl) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightboxEl?.classList.contains('active')) {
            closeLightbox();
        }
    });
}

export function openLightbox(src: string, caption: string): void {
    if (!lightboxEl) initLightbox();
    if (!lightboxEl) return;

    const img = lightboxEl.querySelector('img');
    const captionEl = lightboxEl.querySelector('.lightbox-caption');

    if (img) {
        img.src = src;
        img.alt = caption;
    }
    if (captionEl) {
        captionEl.textContent = caption;
    }

    lightboxEl.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus trap
    const closeBtn = lightboxEl.querySelector('.lightbox-close-btn') as HTMLElement;
    closeBtn?.focus();
}

export function closeLightbox(): void {
    if (!lightboxEl) return;
    lightboxEl.classList.remove('active');
    document.body.style.overflow = '';

    setTimeout(() => {
        const img = lightboxEl?.querySelector('img');
        if (img) img.src = '';
    }, 300);
}
