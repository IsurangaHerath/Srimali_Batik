import { dataManager } from '../shared/dataManager.js';
import { wsManager } from '../shared/websocket.js';
import { renderPatternsList, openPatternModal, savePattern, deletePattern, closeModal, previewImage } from './render/patterns.js';
import { renderProductsList, openProductModal, saveProduct, deleteProduct, populatePatternSelect } from './render/products.js';
import { renderColorsList, openColorModal, saveColor, deleteColor } from './render/colors.js';
import { toast } from '../shared/toast.js';

// ── Tab Management ──
function initTabs(): void {
    const tabs = document.querySelectorAll('.admin-tab');
    const contents = document.querySelectorAll('.admin-tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const target = tab.getAttribute('data-tab');
            const content = document.getElementById(`tab-${target}`);
            if (content) content.classList.add('active');
        });
    });
}

// ── Modal Management ──
function initModals(): void {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal.id);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(m => closeModal(m.id));
        }
    });

    // Form submissions
    const patternForm = document.getElementById('patternForm') as HTMLFormElement;
    patternForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await savePattern(new FormData(patternForm));
    });

    const productForm = document.getElementById('productForm') as HTMLFormElement;
    productForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveProduct(new FormData(productForm));
    });

    const colorForm = document.getElementById('colorForm') as HTMLFormElement;
    colorForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveColor(new FormData(colorForm));
    });

    // Image preview handlers
    const patternImageInput = document.getElementById('patternImage') as HTMLInputElement;
    patternImageInput?.addEventListener('input', () => {
        previewImage(patternImageInput.value, document.getElementById('patternImagePreview') as HTMLElement);
    });

    const productImageInput = document.getElementById('productImage') as HTMLInputElement;
    productImageInput?.addEventListener('input', () => {
        previewImage(productImageInput.value, document.getElementById('productImagePreview') as HTMLElement);
    });
}

// ── Global Actions (exposed for inline onclick handlers) ──
declare global {
    interface Window {
        adminActions: {
            editPattern: (id: string) => void;
            deletePattern: (id: string) => void;
            editProduct: (id: string) => void;
            deleteProduct: (id: string) => void;
            editColor: (id: string) => void;
            deleteColor: (id: string) => void;
        };
    }
}

window.adminActions = {
    editPattern: (id: string) => openPatternModal(id),
    deletePattern: (id: string) => deletePattern(id),
    editProduct: (id: string) => openProductModal(id),
    deleteProduct: (id: string) => deleteProduct(id),
    editColor: (id: string) => openColorModal(id),
    deleteColor: (id: string) => deleteColor(id),
};

// ── Theme Toggle ──
function initTheme(): void {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        toggle.textContent = saved === 'dark' ? '☀️' : '🌙';
        toggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            toggle.textContent = next === 'dark' ? '☀️' : '🌙';
        });
    }
}

// ── Render All ──
function renderAll(): void {
    const patternsList = document.getElementById('patternsList');
    if (patternsList) renderPatternsList(patternsList);

    const productsList = document.getElementById('productsList');
    if (productsList) renderProductsList(productsList);

    const colorsList = document.getElementById('colorsList');
    if (colorsList) renderColorsList(colorsList);

    populatePatternSelect();
}

// ── Main Init ──
async function init(): Promise<void> {
    initTheme();
    initTabs();
    initModals();
    wsManager.connect();

    await dataManager.load();
    renderAll();

    // Re-render when data changes via WebSocket
    dataManager.onChange('all', () => renderAll());

    console.log('Admin panel initialized');
}

// Boot
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
