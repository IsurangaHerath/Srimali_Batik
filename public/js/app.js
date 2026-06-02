/**
 * Main Application Module
 * Handles theme management, navigation, routing, and page initialization.
 */

class App {
    constructor() {
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;

        this.initTheme();
        this.initNavigation();
        this.initScrollToTop();
        await this.renderInitialContent();

        this.isInitialized = true;
        console.log('✅ Srimali Batik initialized');
    }

    // ────────────────────────────────────────
    // Theme
    // ────────────────────────────────────────

    initTheme() {
        const saved      = localStorage.getItem('theme');
        const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme      = saved || (preferDark ? 'dark' : 'light');

        document.documentElement.setAttribute('data-theme', theme);
        this._updateThemeIcons(theme);

        document.querySelectorAll('.theme-toggle').forEach(btn => {
            btn.addEventListener('click', () => this.toggleTheme());
        });
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next    = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        this._updateThemeIcons(next);
    }

    _updateThemeIcons(theme) {
        const icon = theme === 'dark' ? '☀️' : '🌙';
        document.querySelectorAll('.theme-toggle').forEach(btn => btn.textContent = icon);
    }

    // ────────────────────────────────────────
    // Navigation
    // ────────────────────────────────────────

    initNavigation() {
        const mobileBtn = document.getElementById('mobileMenuBtn');
        const navLinks  = document.getElementById('navLinks');
        if (!mobileBtn || !navLinks) return;

        const closeMenu = () => {
            navLinks.classList.remove('active');
            mobileBtn.setAttribute('aria-expanded', 'false');
            mobileBtn.textContent = '☰';
        };

        mobileBtn.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('active');
            mobileBtn.setAttribute('aria-expanded', isOpen);
            mobileBtn.textContent = isOpen ? '✕' : '☰';
        });

        // Close on nav link click
        navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active') &&
                !navLinks.contains(e.target) && !mobileBtn.contains(e.target)) {
                closeMenu();
            }
        });

        // Close on ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('active')) {
                closeMenu();
                mobileBtn.focus();
            }
        });

        // Close on resize to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 1024) closeMenu();
        });

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });

        // Back button in product detail
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => uiRenderer.closeProductDetail());
        }
    }

    // ────────────────────────────────────────
    // Scroll to top
    // ────────────────────────────────────────

    initScrollToTop() {
        const btn = document.getElementById('scrollTop');
        if (!btn) return;

        window.addEventListener('scroll', () => {
            btn.classList.toggle('visible', window.scrollY > 300);
        });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ────────────────────────────────────────
    // Initial content render
    // ────────────────────────────────────────

    async renderInitialContent() {
        await dataManager.loadData();
        if (typeof uiRenderer !== 'undefined') {
            uiRenderer.renderPatternsGrid();
        }
    }
}

// ============================
// BOOT
// ============================

const app = new App();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { app };
}
