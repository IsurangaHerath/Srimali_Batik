import { dataManager } from '../shared/dataManager.js';
import { wsManager } from '../shared/websocket.js';
import { renderPatternsGrid, initLazyLoading, openProductDetail, closeProductDetail } from './render/patterns.js';
import { initLightbox } from './render/lightbox.js';
import { toast } from '../shared/toast.js';

// ── Theme Management ──
function initTheme(): void {
    const saved = localStorage.getItem('theme');
    const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (preferDark ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcons(theme);

    document.querySelectorAll('.theme-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            updateThemeIcons(next);
            toast.info(`Switched to ${next} mode`);
        });
    });
}

function updateThemeIcons(theme: string): void {
    const icon = theme === 'dark' ? '☀️' : '🌙';
    document.querySelectorAll('.theme-toggle').forEach(btn => {
        btn.textContent = icon;
        btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    });
}

// ── Navigation ──
function initNavigation(): void {
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    if (!mobileBtn || !navLinks) return;

    const closeMenu = () => {
        navLinks.classList.remove('active');
        mobileBtn.setAttribute('aria-expanded', 'false');
        mobileBtn.textContent = '☰';
    };

    mobileBtn.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('active');
        mobileBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        mobileBtn.textContent = isOpen ? '✕' : '☰';
    });

    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

    document.addEventListener('click', (e) => {
        if (navLinks.classList.contains('active') &&
            !navLinks.contains(e.target as Node) && !mobileBtn.contains(e.target as Node)) {
            closeMenu();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('active')) {
            closeMenu();
            mobileBtn.focus();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024) closeMenu();
    });

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (this: HTMLAnchorElement, e: Event) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href') || '');
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // Active nav highlighting
    const navItems = navLinks.querySelectorAll('a');
    const sections = document.querySelectorAll('section[id]');

    const highlightNav = () => {
        let current = '';
        sections.forEach(section => {
            const top = (section as HTMLElement).offsetTop - 100;
            if (window.scrollY >= top) {
                current = section.getAttribute('id') || '';
            }
        });
        navItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('href') === `#${current}`);
        });
    };

    window.addEventListener('scroll', highlightNav);
    highlightNav();

    // Back button
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', closeProductDetail);
    }

    // Scroll to top
    const scrollTop = document.getElementById('scrollTop');
    if (scrollTop) {
        window.addEventListener('scroll', () => {
            scrollTop.classList.toggle('visible', window.scrollY > 300);
        });
        scrollTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// ── Main Init ──
async function init(): Promise<void> {
    initTheme();
    initNavigation();
    initLightbox();
    wsManager.connect();

    await dataManager.load();

    const patternsGrid = document.getElementById('patternsGrid');
    if (patternsGrid) {
        renderPatternsGrid(patternsGrid);
    }

    // Re-render when data changes via WebSocket
    dataManager.onChange('all', () => {
        const grid = document.getElementById('patternsGrid');
        if (grid) renderPatternsGrid(grid);
    });

    // Handle hash-based routing for product detail
    const hash = window.location.hash;
    if (hash.startsWith('#pattern-')) {
        const patternId = hash.replace('#', '');
        setTimeout(() => openProductDetail(patternId), 300);
    }

    console.log('Srimali Batik initialized');
}

// Boot
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
