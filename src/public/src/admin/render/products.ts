import type { Product } from '../../shared/types.js';
import { dataManager } from '../../shared/dataManager.js';
import { toast } from '../../shared/toast.js';
import { getFallbackImage, escapeHtml, generateId } from '../../shared/utils.js';
import { previewImage, populateColorCheckboxes, getSelectedColors, closeModal } from './patterns.js';

export function renderProductsList(container: HTMLElement): void {
    const products = dataManager.getProducts();
    const colors = dataManager.getColors();

    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👗</div>
                <h3 class="empty-state-title">No products yet</h3>
                <p class="empty-state-desc">Click "Add Product" to create your first product.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => {
        const pattern = dataManager.getPatternById(product.pattern_id);
        const colorChips = (product.colors || []).map(cid => {
            const c = colors.find(x => x.id === cid);
            return c ? `<div class="color-chip" style="background:${escapeHtml(c.hex)}" title="${escapeHtml(c.name)}"></div>` : '';
        }).join('');

        return `
            <div class="admin-list-item">
                <div class="admin-list-item-info">
                    <div class="admin-list-item-preview">
                        <img src="${escapeHtml(product.image || getFallbackImage())}" alt="${escapeHtml(product.name)}" onerror="this.src='${getFallbackImage()}'">
                    </div>
                    <div class="admin-list-item-text">
                        <h4>${escapeHtml(product.name)}</h4>
                        <p>Pattern: ${escapeHtml(pattern?.name || 'Unknown')} &nbsp;|&nbsp; Type: ${escapeHtml(product.type)}</p>
                        <p>${escapeHtml(product.description || 'No description')}</p>
                        <p class="text-muted">Price: ${escapeHtml(product.price || 'Not set')}</p>
                        ${colorChips ? `<div class="color-chips">${colorChips}</div>` : ''}
                    </div>
                </div>
                <div class="admin-list-item-actions">
                    <button class="btn btn-secondary btn-sm" onclick="window.adminActions.editProduct('${escapeHtml(product.id)}')" aria-label="Edit ${escapeHtml(product.name)}">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="window.adminActions.deleteProduct('${escapeHtml(product.id)}')" aria-label="Delete ${escapeHtml(product.name)}">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

export function populatePatternSelect(): void {
    const select = document.getElementById('productPattern') as HTMLSelectElement;
    if (!select) return;

    const patterns = dataManager.getPatterns();
    select.innerHTML = patterns.length === 0
        ? '<option value="">Please add a pattern first</option>'
        : patterns.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join('');
}

export function openProductModal(productId: string | null): void {
    if (dataManager.getPatterns().length === 0) {
        toast.error('Please add a pattern first!');
        return;
    }

    const modal = document.getElementById('productModal');
    const title = document.getElementById('productModalTitle');
    const form = document.getElementById('productForm') as HTMLFormElement;
    const preview = document.getElementById('productImagePreview') as HTMLElement;

    if (!modal || !title || !form || !preview) return;

    form.reset();
    preview.innerHTML = '';
    preview.classList.remove('visible');
    populatePatternSelect();

    if (productId) {
        const p = dataManager.getProductById(productId);
        if (!p) return;

        title.textContent = 'Edit Product';
        (document.getElementById('productId') as HTMLInputElement).value = p.id;
        (document.getElementById('productPattern') as HTMLSelectElement).value = p.pattern_id;
        (document.getElementById('productName') as HTMLInputElement).value = p.name;
        (document.getElementById('productType') as HTMLSelectElement).value = p.type || 'Saree';
        (document.getElementById('productDescription') as HTMLTextAreaElement).value = p.description;
        (document.getElementById('productImage') as HTMLInputElement).value = p.image;
        (document.getElementById('productPrice') as HTMLInputElement).value = p.price;
        previewImage(p.image, preview);
        populateColorCheckboxes('productColorsContainer', p.colors || []);
    } else {
        title.textContent = 'Add Product';
        (document.getElementById('productId') as HTMLInputElement).value = '';
        populateColorCheckboxes('productColorsContainer', []);
    }

    modal.classList.add('active');
    const firstInput = modal.querySelector('select, input:not([type=hidden]), textarea') as HTMLElement;
    firstInput?.focus();
}

export async function saveProduct(formData: FormData): Promise<void> {
    const id = formData.get('productId') as string;
    const patternId = formData.get('productPattern') as string;
    const name = (formData.get('productName') as string).trim();
    const type = formData.get('productType') as string;
    const description = (formData.get('productDescription') as string).trim();
    const image = (formData.get('productImage') as string).trim();
    const price = (formData.get('productPrice') as string).trim();
    const colors = getSelectedColors('productColorsContainer');

    if (!name) { toast.error('Product name is required'); return; }
    if (!patternId) { toast.error('Please select a pattern'); return; }

    try {
        if (id) {
            await dataManager.updateProduct(id, { pattern_id: patternId, name, type, description, image, price, colors });
            toast.success('Product updated successfully!');
        } else {
            const dup = dataManager.getProducts().find(p => p.name.toLowerCase() === name.toLowerCase());
            if (dup) { toast.error('A product with this name already exists'); return; }

            await dataManager.createProduct({ id: generateId('prod'), pattern_id: patternId, name, type, description, image, price, colors });
            toast.success('Product created successfully!');
        }
        closeModal('productModal');
    } catch (error) {
        toast.error((error as Error).message || 'Failed to save product');
    }
}

export async function deleteProduct(id: string): Promise<void> {
    const p = dataManager.getProductById(id);
    if (!p) return;
    if (!confirm(`Delete product "${p.name}"?`)) return;

    try {
        await dataManager.deleteProduct(id);
        toast.success('Product deleted');
    } catch (error) {
        toast.error((error as Error).message || 'Failed to delete product');
    }
}
