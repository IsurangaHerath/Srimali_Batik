/**
 * Main Application Module
 * Handles application initialization, routing, theme management,
 * and global event listeners
 */

// ============================
// APPLICATION CLASS
// ============================

class App {
    constructor() {
        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.isInitialized) return;

        // Initialize theme
        this.initTheme();

        // Initialize routing
        this.initRouting();

        // Initialize navigation
        this.initNavigation();

        // Initialize scroll to top
        this.initScrollToTop();

        // Render initial content (async to wait for data)
        await this.renderInitialContent();

        // Initialize admin panel
        adminPanel.init();

        this.isInitialized = true;
        console.log('Srimali Batik application initialized');
    }

    /**
     * Initialize theme management
     */
    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            document.getElementById('themeToggle').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        } else if (prefersDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.getElementById('themeToggle').textContent = '☀️';
        }

        // Add theme toggle listener
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
    }

    /**
     * Toggle theme between light and dark
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        document.getElementById('themeToggle').textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }

    /**
     * Initialize routing
     */
    initRouting() {
        // Handle hash changes
        window.addEventListener('hashchange', () => {
            this.handleRoute();
        });

        // Handle initial route
        this.handleInitialRoute();
    }

    /**
     * Handle initial route on page load
     */
    handleInitialRoute() {
        const path = window.location.pathname;
        const hash = window.location.hash;
        
        // If navigating to /admin, redirect to #admin
        if (path === '/admin' || path.endsWith('/admin')) {
            window.location.hash = '#admin';
            return;
        }

        this.handleRoute();
    }

    /**
     * Handle route changes
     */
    handleRoute() {
        const hash = window.location.hash;
        const adminPanel = document.getElementById('adminPanel');
        const hero = document.getElementById('home');
        const designsSection = document.getElementById('designs');
        const aboutSection = document.getElementById('about');
        const contactSection = document.getElementById('contact');
        const footer = document.querySelector('.footer');

        if (hash === '#admin' || hash === '/admin') {
            // Show admin panel
            adminPanel.classList.add('active');
            hero.style.display = 'none';
            designsSection.style.display = 'none';
            aboutSection.style.display = 'none';
            contactSection.style.display = 'none';
            footer.style.display = 'none';
            document.getElementById('productDetail').classList.remove('active');
            adminPanel.renderAll();
        } else {
            // Show frontend
            adminPanel.classList.remove('active');
            hero.style.display = 'flex';
            designsSection.style.display = 'block';
            aboutSection.style.display = 'block';
            contactSection.style.display = 'block';
            footer.style.display = 'block';
            uiRenderer.renderPatternsGrid();
        }
    }

    /**
     * Initialize navigation
     */
    initNavigation() {
        // Mobile menu toggle
        document.getElementById('mobileMenuBtn').addEventListener('click', () => {
            document.getElementById('navLinks').classList.toggle('active');
        });

        // Close mobile menu on link click
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                document.getElementById('navLinks').classList.remove('active');
            });
        });

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                // Don't prevent default for admin link
                if (href === '#admin') {
                    return;
                }

                e.preventDefault();
                const target = document.querySelector(href);
                if (target && !target.classList.contains('admin-panel')) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // Back to designs button
        document.getElementById('backBtn').addEventListener('click', () => {
            uiRenderer.closeProductDetail();
        });
    }

    /**
     * Initialize scroll to top button
     */
    initScrollToTop() {
        const scrollTop = document.getElementById('scrollTop');
        
        // Show/hide scroll to top button
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollTop.classList.add('visible');
            } else {
                scrollTop.classList.remove('visible');
            }
        });

        // Scroll to top on click
        scrollTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /**
     * Render initial content
     */
    async renderInitialContent() {
        // Wait for data to be loaded from API
        await dataManager.loadData();
        uiRenderer.renderPatternsGrid();
    }

    /**
     * Show frontend (hide admin panel)
     */
    showFrontend() {
        window.location.hash = '';
    }
}

// ============================
// GLOBAL FUNCTIONS
// ============================

// These functions are called from HTML onclick attributes
// They delegate to the appropriate module

function showFrontend() {
    app.showFrontend();
}

function openPatternModal(patternId = null) {
    adminPanel.openPatternModal(patternId);
}

function openProductModal(productId = null) {
    adminPanel.openProductModal(productId);
}

function openColorModal(colorId = null) {
    adminPanel.openColorModal(colorId);
}

function closeModal(modalId) {
    adminPanel.closeModal(modalId);
}

function savePattern(e) {
    adminPanel.savePattern(e);
}

function saveProduct(e) {
    adminPanel.saveProduct(e);
}

function saveColor(e) {
    adminPanel.saveColor(e);
}

function previewImage(url) {
    adminPanel.previewImage(url);
}

function previewProductImage(url) {
    adminPanel.previewProductImage(url);
}

// ============================
// INITIALIZATION
// ============================

// Create app instance
const app = new App();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app.init();
    });
} else {
    app.init();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { app };
}
