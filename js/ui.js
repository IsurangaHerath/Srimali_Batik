/**
 * UI Rendering Module
 * Handles all UI rendering, image loading, and user interactions
 */

// ============================
// UI UTILITIES
// ============================

const UIUtils = {
    /**
     * Create image element with lazy loading and error handling
     * @param {string} src - Image source URL
     * @param {string} alt - Alt text for image
     * @param {string} className - CSS class name
     * @returns {HTMLElement} Image element
     */
    createLazyImage(src, alt, className = '') {
        const img = document.createElement('img');
        img.dataset.src = src;
        img.alt = alt;
        img.className = `lazy-image ${className}`;
        img.loading = 'lazy';
        
        // Add error handler for broken images
        img.onerror = function() {
            this.src = dataManager.getFallbackImage();
            this.classList.add('image-error');
        };
        
        return img;
    },

    /**
     * Create skeleton loader for images
     * @param {string} className - CSS class name
     * @returns {HTMLElement} Skeleton element
     */
    createSkeleton(className = '') {
        const skeleton = document.createElement('div');
        skeleton.className = `skeleton ${className}`;
        return skeleton;
    },

    /**
     * Debounce function for performance optimization
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function for performance optimization
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// ============================
// LAZY IMAGE LOADER
// ============================

class LazyImageLoader {
    constructor() {
        this.imageObserver = null;
        this.init();
    }

    /**
     * Initialize Intersection Observer for lazy loading
     */
    init() {
        if ('IntersectionObserver' in window) {
            this.imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.loadImage(img);
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });
        }
    }

    /**
     * Observe image element for lazy loading
     * @param {HTMLElement} img - Image element to observe
     */
    observe(img) {
        if (this.imageObserver && img.dataset.src) {
            this.imageObserver.observe(img);
        } else {
            // Fallback for browsers without IntersectionObserver
            this.loadImage(img);
        }
    }

    /**
     * Load image from data-src attribute
     * @param {HTMLElement} img - Image element
     */
    loadImage(img) {
        if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            
            img.onload = () => {
                img.classList.add('loaded');
                // Hide skeleton if present as previous sibling
                const prev = img.previousElementSibling;
                if (prev && prev.classList.contains('skeleton')) {
                    prev.style.display = 'none';
                }
            };

            // If image is already in cache
            if (img.complete) {
                img.onload();
            }
        }
    }

    /**
     * Disconnect observer
     */
    disconnect() {
        if (this.imageObserver) {
            this.imageObserver.disconnect();
        }
    }
}

// Create singleton instance
const lazyLoader = new LazyImageLoader();

// ============================
// UI RENDERING CLASS
// ============================

class UIRenderer {
    constructor() {
        this.currentPattern = null;
        this.selectedColor = null;
        this.initLightbox();
    }

    /**
     * Initialize Lightbox events
     */
    initLightbox() {
        const lightbox = document.getElementById('lightbox');
        const closeBtn = document.getElementById('lightboxClose');
        
        if (!lightbox || !closeBtn) return;

        closeBtn.addEventListener('click', () => {
            lightbox.classList.remove('active');
        });

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.classList.remove('active');
            }
        });

        // Close on ESC key
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                lightbox.classList.remove('active');
            }
        });
    }

    /**
     * Open Lightbox with specific image
     * @param {string} src - Image source
     * @param {string} caption - Image caption
     */
    openLightbox(src, caption) {
        const lightbox = document.getElementById('lightbox');
        const img = document.getElementById('lightboxImage');
        const captionElem = document.getElementById('lightboxCaption');
        
        if (!lightbox || !img) return;

        img.src = src;
        captionElem.textContent = caption;
        lightbox.classList.add('active');
    }

    /**
     * Render patterns grid on homepage
     */
    renderPatternsGrid() {
        const grid = document.getElementById('patternsGrid');
        if (!grid) {
            return;
        }

        // Check if data is loaded
        if (!dataManager.data || !dataManager.data.patterns) {
            setTimeout(() => this.renderPatternsGrid(), 500);
            return;
        }

        const patterns = dataManager.getPatterns();
        
        if (patterns.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <p>No designs available yet.</p>
                    <p>Please add designs in the admin panel.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = patterns.map(pattern => `
            <div class="pattern-card" data-pattern-id="${pattern.id}">
                <div class="pattern-image-container">
                    <img 
                        src="${pattern.image}" 
                        alt="${pattern.name}"
                        class="pattern-image"
                    >
                </div>
                <div class="pattern-info">
                    <h3>${pattern.name}</h3>
                    <p>${pattern.description}</p>
                    <button class="view-btn" data-pattern-id="${pattern.id}">
                        View Products
                    </button>
                </div>
            </div>
        `).join('');

        // Initialize lazy loading for new images
        this.initLazyLoading();

        // Add click handlers
        this.attachPatternCardListeners();
    }

    /**
     * Attach click listeners to pattern cards
     */
    attachPatternCardListeners() {
        document.querySelectorAll('.pattern-card').forEach(card => {
            const patternId = card.dataset.patternId;
            const pattern = dataManager.getPatternById(patternId);
            
            // Image click opens lightbox
            const imgContainer = card.querySelector('.pattern-image-container');
            if (imgContainer && pattern) {
                imgContainer.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openLightbox(pattern.image, pattern.name);
                });
            }

            // Card click opens detail view
            card.addEventListener('click', (e) => {
                this.openProductDetail(patternId);
            });
        });

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const patternId = btn.dataset.patternId;
                this.openProductDetail(patternId);
            });
        });
    }

    /**
     * Initialize lazy loading for images
     */
    initLazyLoading() {
        document.querySelectorAll('.lazy-image').forEach(img => {
            lazyLoader.observe(img);
        });
    }

    /**
     * Open product detail view
     * @param {string} patternId - Pattern ID
     */
    openProductDetail(patternId) {
        try {
            this.currentPattern = dataManager.getPatternById(patternId);
            this.selectedColor = null;

            if (!this.currentPattern) {
                console.error('Pattern not found:', patternId);
                return;
            }

            // Hide other sections with null checks
            const navbar = document.querySelector('.navbar');
            const hero = document.querySelector('.hero');
            const heroNew = document.querySelector('.hero-new');
            const designs = document.getElementById('designs');
            const about = document.getElementById('about');
            const contact = document.getElementById('contact');
            const footer = document.querySelector('.footer');
            
            if (navbar) navbar.style.display = 'none';
            if (hero) hero.style.display = 'none';
            if (heroNew) heroNew.style.display = 'none';
            if (designs) designs.style.display = 'none';
            if (about) about.style.display = 'none';
            if (contact) contact.style.display = 'none';
            if (footer) footer.style.display = 'none';

            // Update detail view
            const detailPatternName = document.getElementById('detailPatternName');
            if (detailPatternName) {
                detailPatternName.textContent = this.currentPattern.name;
            }
            
            // Render pattern preview with lazy loading
            const previewContainer = document.getElementById('detailPatternPreview');
            if (previewContainer) {
                previewContainer.innerHTML = `
                    <div class="skeleton skeleton-preview"></div>
                    <img 
                        data-src="${this.currentPattern.image}" 
                        alt="${this.currentPattern.name}"
                        class="detail-pattern-image lazy-image"
                        loading="lazy"
                        id="currentDetailImage"
                    >
                `;
                this.initLazyLoading();

                // Add click listener for detail preview
                setTimeout(() => {
                    const detailImg = document.getElementById('detailPatternPreview');
                    if (detailImg) {
                        detailImg.addEventListener('click', () => {
                            const img = detailImg.querySelector('img');
                            if (img && img.src) {
                                this.openLightbox(img.src, this.currentPattern.name);
                            }
                        });
                    }
                }, 100);

                // Render color swatches and products
                this.renderColorSwatches();
                this.renderProductsGrid();

                // Show product detail section
                const productDetail = document.getElementById('productDetail');
                if (productDetail) {
                    productDetail.classList.add('active');
                }
                window.scrollTo(0, 0);
            }
        } catch (error) {
            console.error('Error opening product detail:', error);
        }
    }

    /**
     * Close product detail view
     */
    closeProductDetail() {
        document.getElementById('productDetail').classList.remove('active');
        
        // Show other sections with null checks
        const navbar = document.querySelector('.navbar');
        const hero = document.querySelector('.hero');
        const heroNew = document.querySelector('.hero-new');
        const designs = document.getElementById('designs');
        const about = document.getElementById('about');
        const contact = document.getElementById('contact');
        const footer = document.querySelector('.footer');
        
        if (navbar) navbar.style.display = 'flex';
        if (hero) hero.style.display = 'flex';
        if (heroNew) heroNew.style.display = 'flex';
        if (designs) designs.style.display = 'block';
        if (about) about.style.display = 'block';
        if (contact) contact.style.display = 'block';
        if (footer) footer.style.display = 'block';
        
        this.currentPattern = null;
        this.selectedColor = null;
        window.location.hash = '';
    }

    /**
     * Render color swatches
     */
    renderColorSwatches() {
        const container = document.getElementById('colorSwatches');
        if (!container) return;

        // Get all colors and filter to only show colors available for this pattern
        const allColors = dataManager.getColors();
        const patternColors = this.currentPattern && this.currentPattern.colors ? this.currentPattern.colors : [];
        const colors = patternColors.length > 0 
            ? allColors.filter(c => patternColors.includes(c.id)) 
            : allColors;
        
        container.innerHTML = colors.map(color => `
            <div class="color-swatch"
                 data-color-id="${color.id}"
                 data-color="${color.name}"
                 style="background-color: ${color.hex};"
                 title="${color.name}">
            </div>
        `).join('');

        // Add click handlers
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                this.selectColor(swatch.dataset.colorId, swatch.dataset.color);
            });
        });
    }

    /**
     * Select a color
     * @param {string} colorId - Color ID
     * @param {string} colorName - Color name
     */
    selectColor(colorId, colorName) {
        this.selectedColor = { id: colorId, name: colorName };
        
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        document.querySelector(`[data-color-id="${colorId}"]`).classList.add('active');
        
        document.getElementById('selectedColorName').textContent = colorName;
        
        // Note: Image no longer changes when selecting a color
        // Colors are now only for information/selection purposes
    }
    
    /**
     * Update pattern preview image based on selected color
     * @param {string} colorId - Color ID
     */
    updatePatternPreviewForColor(colorId) {
        const color = dataManager.getColorById(colorId);
        const previewContainer = document.getElementById('detailPatternPreview');
        
        if (!previewContainer || !this.currentPattern) return;
        
        // Use color-specific image if available, otherwise use pattern image
        const imageUrl = (color && color.image) ? color.image : this.currentPattern.image;
        
        previewContainer.innerHTML = `
            <div class="skeleton skeleton-preview"></div>
            <img
                data-src="${imageUrl}"
                alt="${this.currentPattern.name} - ${color ? color.name : 'Default'}"
                class="detail-pattern-image lazy-image"
                loading="lazy"
            >
        `;
        
        // Initialize lazy loading for the new image
        this.initLazyLoading();
    }

    /**
     * Render products grid
     */
    renderProductsGrid() {
        const container = document.getElementById('productsGrid');
        if (!container || !this.currentPattern) return;

        const products = dataManager.getProductsByPatternId(this.currentPattern.id);

        if (products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No products available for this design.</p>
                    <p>Please add products in the panel.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = products.map(product => {
            // Get image URL based on selected color
            const imageUrl = this.getProductImageForColor(product);
            
            return `
                <div class="product-card" data-product-id="${product.id}">
                    <div class="product-image-container" data-product-img="${imageUrl}" data-product-name="${product.name}">
                        <div class="skeleton skeleton-image"></div>
                        <img
                            data-src="${imageUrl}"
                            alt="${product.name}"
                            class="product-image lazy-image"
                            loading="lazy"
                        >
                        <span class="product-type-badge">${product.type}</span>
                    </div>
                    <div class="product-info">
                        <h4>${product.name}</h4>
                        <p>${product.description}</p>
                        <p class="product-price">${product.price || 'Price on request'}</p>
                        <button class="whatsapp-btn" data-product-id="${product.id}" data-product-name="${product.name}">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            Order via WhatsApp
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Initialize lazy loading
        this.initLazyLoading();

        // Add image click listeners for product cards
        document.querySelectorAll('.product-image-container').forEach(container => {
            container.addEventListener('click', (e) => {
                e.stopPropagation();
                const imgSrc = container.dataset.productImg;
                const productName = container.dataset.productName;
                this.openLightbox(imgSrc, productName);
            });
        });

        // Add WhatsApp button listeners
        document.querySelectorAll('.whatsapp-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = btn.dataset.productId;
                const productName = btn.dataset.productName;
                this.orderViaWhatsApp(productId, productName);
            });
        });
    }
    
    /**
     * Get product image URL based on selected color
     * @param {Object} product - Product object
     * @returns {string} Image URL
     */
    getProductImageForColor(product) {
        // Return default product image (color-specific images are no longer used)
        return product.image;
    }

    /**
     * Order product via WhatsApp
     * @param {string} productId - Product ID
     * @param {string} productName - Product name
     */
    orderViaWhatsApp(productId, productName) {
        const patternName = this.currentPattern ? this.currentPattern.name : 'Not selected';
        const colorText = this.selectedColor ? this.selectedColor.name : 'Not selected yet — please advise';
        
        const message = `Hello Srimali Batik! 👋
I would like to place an order:

🎨 Design: ${patternName}
👗 Product: ${productName}
🎨 Color: ${colorText}

Please confirm availability and price. Thank you!`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
    }

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type (success, error, info)
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
            <span>${message}</span>
        `;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Create and export singleton instance
const uiRenderer = new UIRenderer();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { uiRenderer, UIUtils, lazyLoader };
}
