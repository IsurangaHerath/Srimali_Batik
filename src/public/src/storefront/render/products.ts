import type { Product } from '../../shared/types.js';
import { dataManager } from '../../shared/dataManager.js';
import { WHATSAPP_NUMBER, getFallbackImage, escapeHtml } from '../../shared/utils.js';
import { openLightbox } from './lightbox.js';

export function renderProductsGrid(container: HTMLElement, patternId: string): void {
    const pattern = dataManager.getPatternById(patternId);
    if (!pattern) return;

    const products = dataManager.getProductsByPatternId(patternId);

    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👗</div>
                <h3 class="empty-state-title">No products yet</h3>
                <p class="empty-state-desc">Products for this design will appear here.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map((product: Product) => {
        const colorText = dataManager.getSelectedColor?.()?.name || 'Not selected';
        return `
            <article class="product-card">
                <div class="product-card-image">
                    <div class="skeleton skeleton-image"></div>
                    <img
                        data-src="${escapeHtml(product.image || getFallbackImage())}"
                        alt="${escapeHtml(product.name)}"
                        class="lazy-image"
                        loading="lazy"
                    >
                    <span class="product-type-badge">${escapeHtml(product.type)}</span>
                </div>
                <div class="product-card-body">
                    <h4 class="product-card-title">${escapeHtml(product.name)}</h4>
                    <p class="product-card-desc">${escapeHtml(product.description)}</p>
                    <p class="product-card-price">${escapeHtml(product.price || 'Price on request')}</p>
                    <button class="whatsapp-btn" data-product-name="${escapeHtml(product.name)}" aria-label="Order ${escapeHtml(product.name)} via WhatsApp">
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004A9.87 9.87 0 016.97 23.02l-.36-.214L2.869 24l.997-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Order via WhatsApp
                    </button>
                </div>
            </article>
        `;
    }).join('');

    initLazyLoading(container);
    attachProductListeners(container);
}

function attachProductListeners(container: HTMLElement): void {
    container.querySelectorAll('.product-card-image').forEach(imgContainer => {
        imgContainer.addEventListener('click', (e) => {
            e.stopPropagation();
            const img = imgContainer.querySelector('img');
            const name = img?.alt || 'Product';
            openLightbox(img?.src || '', name);
        });
    });

    container.querySelectorAll('.whatsapp-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            orderViaWhatsApp(btn.getAttribute('data-product-name') || '');
        });
    });
}

function initLazyLoading(container: HTMLElement): void {
    if (!('IntersectionObserver' in window)) {
        container.querySelectorAll('.lazy-image').forEach(img => {
            (img as HTMLImageElement).src = (img as HTMLImageElement).dataset.src || '';
        });
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target as HTMLImageElement;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.onload = () => img.classList.add('loaded');
                    img.onerror = () => {
                        img.src = getFallbackImage();
                        img.classList.add('loaded', 'error');
                    };
                    img.removeAttribute('data-src');
                }
                observer.unobserve(img);
            }
        });
    }, { rootMargin: '50px 0px', threshold: 0.01 });

    container.querySelectorAll('.lazy-image[data-src]').forEach(img => {
        observer.observe(img);
    });
}

export function orderViaWhatsApp(productName: string): void {
    const patternName = dataManager.getCurrentPattern()?.name || 'Not selected';
    const colorText = dataManager.getSelectedColor()?.name || 'Not selected yet — please advise';

    const message = `Hello Srimali Batik! I would like to place an order:

Design: ${patternName}
Product: ${productName}
Color: ${colorText}

Please confirm availability and price. Thank you!`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}