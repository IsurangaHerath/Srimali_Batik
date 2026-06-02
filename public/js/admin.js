/**
 * Admin Panel Module — Local-Only Version
 * No password authentication — admin is open on localhost.
 * Full CRUD for patterns, products, and colors.
 */

class AdminPanel {
    constructor() {
        this.currentTab  = 'patterns';
        this.editingItem = null;
        // Prevent double-submission flags
        this._isSavingPattern = false;
        this._isSavingProduct = false;
        this._isSavingColor   = false;
    }

    // ────────────────────────────────────────────────
    // INITIALIZATION
    // ────────────────────────────────────────────────

    init() {
        this.renderAll();
        this._attachTabListeners();
        this._attachModalListeners();
    }

    renderAll() {
        this.renderPatternsList();
        this.renderProductsList();
        this.renderColorsList();
        this._populatePatternSelect();
    }

    _attachTabListeners() {
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');
                document.getElementById(`tab-${tab.dataset.tab}`).style.display = 'block';
                this.currentTab = tab.dataset.tab;
            });
        });
    }

    _attachModalListeners() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal(modal.id);
            });
        });

        // Close modals on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(m => this.closeModal(m.id));
            }
        });
    }

    // ────────────────────────────────────────────────
    // PATTERNS
    // ────────────────────────────────────────────────

    renderPatternsList() {
        const list = document.getElementById('patternsList');
        if (!list) return;

        const patterns = dataManager.getPatterns();
        const colors   = dataManager.getColors();

        if (patterns.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎨</div>
                    <p>No patterns yet.</p>
                    <p>Click <strong>"+ Add Pattern"</strong> to create your first one.</p>
                </div>`;
            return;
        }

        list.innerHTML = patterns.map(pattern => {
            const colorNames = (pattern.colors || [])
                .map(cid => { const c = colors.find(x => x.id === cid); return c ? c.name : null; })
                .filter(Boolean).join(', ') || 'All colors';

            return `
            <div class="admin-list-item">
                <div class="admin-list-item-info">
                    <div class="admin-list-item-preview">
                        <img src="${pattern.image || ''}" alt="${pattern.name}"
                             onerror="this.src='${dataManager.getFallbackImage()}'">
                    </div>
                    <div class="admin-list-item-text">
                        <h4>${this._esc(pattern.name)}</h4>
                        <p>${this._esc(pattern.description)}</p>
                        <small class="text-muted">Colors: ${colorNames}</small>
                    </div>
                </div>
                <div class="admin-card-actions">
                    <button class="btn btn-secondary btn-sm" onclick="adminPanel.openPatternModal('${pattern.id}')">Edit</button>
                    <button class="btn btn-danger btn-sm"    onclick="adminPanel.deletePattern('${pattern.id}')">Delete</button>
                </div>
            </div>`;
        }).join('');
    }

    openPatternModal(patternId = null) {
        const modal = document.getElementById('patternModal');
        const title = document.getElementById('patternModalTitle');
        document.getElementById('patternForm').reset();
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('imagePreview').style.display = 'none';

        if (patternId) {
            const p = dataManager.getPatternById(patternId);
            title.textContent = 'Edit Pattern';
            document.getElementById('patternId').value          = p.id;
            document.getElementById('patternName').value        = p.name;
            document.getElementById('patternDescription').value = p.description;
            document.getElementById('patternImage').value       = p.image;
            this.previewImage(p.image);
            this.populatePatternColors(p.colors || []);
        } else {
            title.textContent = 'Add Pattern';
            document.getElementById('patternId').value = '';
            this.populatePatternColors([]);
        }

        modal.classList.add('active');
        modal.querySelector('input:not([type=hidden])').focus();
    }

    async savePattern(e) {
        e.preventDefault();
        if (this._isSavingPattern) return;
        this._isSavingPattern = true;

        const submitBtn = document.querySelector('#patternForm button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Saving…'; }

        try {
            const id          = document.getElementById('patternId').value.trim();
            const name        = document.getElementById('patternName').value.trim();
            const description = document.getElementById('patternDescription').value.trim();
            const image       = document.getElementById('patternImage').value.trim();
            const colors      = this.getPatternColorsFromForm();

            if (!name) { uiRenderer.showToast('Pattern name is required', 'error'); return; }
            if (image && !dataManager.isValidImageUrl(image)) {
                uiRenderer.showToast('Please enter a valid image URL', 'error'); return;
            }

            if (id) {
                await dataManager.updatePattern(id, { name, description, image, colors });
                uiRenderer.showToast('Pattern updated successfully!', 'success');
            } else {
                // Duplicate name check
                const dup = dataManager.getPatterns().find(p => p.name.toLowerCase() === name.toLowerCase());
                if (dup) { uiRenderer.showToast('A pattern with this name already exists', 'error'); return; }

                await dataManager.addPattern({ id: dataManager.generateId('p'), name, description, image, colors });
                uiRenderer.showToast('Pattern created successfully!', 'success');
            }

            this.renderAll();
            if (typeof uiRenderer !== 'undefined') uiRenderer.renderPatternsGrid();
            this.closeModal('patternModal');
        } catch (error) {
            uiRenderer.showToast(error.message || 'Failed to save pattern', 'error');
        } finally {
            this._isSavingPattern = false;
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Pattern'; }
        }
    }

    async deletePattern(id) {
        const p = dataManager.getPatternById(id);
        if (!p) return;
        if (!confirm(`Delete pattern "${p.name}"?\n\nThis will also delete all products under this pattern.`)) return;

        try {
            await dataManager.deletePattern(id);
            this.renderAll();
            if (typeof uiRenderer !== 'undefined') uiRenderer.renderPatternsGrid();
            uiRenderer.showToast('Pattern deleted', 'success');
        } catch (error) {
            uiRenderer.showToast(error.message || 'Failed to delete pattern', 'error');
        }
    }

    previewImage(url) {
        const preview = document.getElementById('imagePreview');
        if (!preview) return;
        if (url && dataManager.isValidImageUrl(url)) {
            preview.innerHTML = `<img src="${url}" alt="Preview"
                onerror="this.parentElement.innerHTML='<p class=\\'error\\'>Failed to load image</p>'">`;
            preview.style.display = 'block';
        } else {
            preview.innerHTML = '';
            preview.style.display = 'none';
        }
    }

    // ────────────────────────────────────────────────
    // PRODUCTS
    // ────────────────────────────────────────────────

    renderProductsList() {
        const list = document.getElementById('productsList');
        if (!list) return;

        const products = dataManager.getProducts();
        const colors   = dataManager.getColors();

        if (products.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👗</div>
                    <p>No products yet.</p>
                    <p>Click <strong>"+ Add Product"</strong> to create your first one.</p>
                </div>`;
            return;
        }

        list.innerHTML = products.map(product => {
            const pattern    = dataManager.getPatternById(product.pattern_id);
            const colorChips = (product.colors || []).map(cid => {
                const c = colors.find(x => x.id === cid);
                return c ? `<div class="color-chip" style="background:${c.hex}" title="${c.name}"></div>` : '';
            }).join('');

            return `
            <div class="admin-list-item">
                <div class="admin-list-item-info">
                    <div class="admin-list-item-preview">
                        <img src="${product.image || ''}" alt="${product.name}"
                             onerror="this.src='${dataManager.getFallbackImage()}'">
                    </div>
                    <div class="admin-list-item-text">
                        <h4>${this._esc(product.name)}</h4>
                        <p>Pattern: ${pattern ? this._esc(pattern.name) : 'Unknown'} &nbsp;|&nbsp; Type: ${this._esc(product.type)}</p>
                        <p>${this._esc(product.description)}</p>
                        <small class="text-muted">Price: ${product.price || 'Not set'}</small>
                        ${colorChips ? `<div class="color-chips">${colorChips}</div>` : ''}
                    </div>
                </div>
                <div class="admin-card-actions">
                    <button class="btn btn-secondary btn-sm" onclick="adminPanel.openProductModal('${product.id}')">Edit</button>
                    <button class="btn btn-danger btn-sm"    onclick="adminPanel.deleteProduct('${product.id}')">Delete</button>
                </div>
            </div>`;
        }).join('');
    }

    _populatePatternSelect() {
        const select = document.getElementById('productPattern');
        if (!select) return;
        const patterns = dataManager.getPatterns();
        select.innerHTML = patterns.length === 0
            ? '<option value="">Please add a pattern first</option>'
            : patterns.map(p => `<option value="${p.id}">${this._esc(p.name)}</option>`).join('');
    }

    openProductModal(productId = null) {
        if (dataManager.getPatterns().length === 0) {
            uiRenderer.showToast('Please add a pattern first!', 'error');
            return;
        }

        const modal = document.getElementById('productModal');
        const title = document.getElementById('productModalTitle');
        document.getElementById('productForm').reset();
        document.getElementById('productImagePreview').innerHTML = '';
        document.getElementById('productImagePreview').style.display = 'none';
        this._populatePatternSelect();

        if (productId) {
            const p = dataManager.getProductById(productId);
            title.textContent = 'Edit Product';
            document.getElementById('productId').value          = p.id;
            document.getElementById('productPattern').value     = p.pattern_id;
            document.getElementById('productName').value        = p.name;
            document.getElementById('productType').value        = p.type;
            document.getElementById('productDescription').value = p.description;
            document.getElementById('productImage').value       = p.image;
            document.getElementById('productPrice').value       = p.price || '';
            this.previewProductImage(p.image);
            this._populateProductColors(p.colors || []);
        } else {
            title.textContent = 'Add Product';
            document.getElementById('productId').value = '';
            this._populateProductColors([]);
        }

        modal.classList.add('active');
        modal.querySelector('select, input:not([type=hidden])').focus();
    }

    async saveProduct(e) {
        e.preventDefault();
        if (this._isSavingProduct) return;
        this._isSavingProduct = true;

        const submitBtn = document.querySelector('#productForm button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Saving…'; }

        try {
            const id          = document.getElementById('productId').value.trim();
            const patternId   = document.getElementById('productPattern').value;
            const name        = document.getElementById('productName').value.trim();
            const type        = document.getElementById('productType').value;
            const description = document.getElementById('productDescription').value.trim();
            const image       = document.getElementById('productImage').value.trim();
            const price       = document.getElementById('productPrice').value.trim();
            const colors      = this._getProductColorsFromForm();

            if (!name) { uiRenderer.showToast('Product name is required', 'error'); return; }
            if (image && !dataManager.isValidImageUrl(image)) {
                uiRenderer.showToast('Please enter a valid image URL', 'error'); return;
            }

            if (id) {
                await dataManager.updateProduct(id, { patternId, name, type, description, image, price, colors });
                uiRenderer.showToast('Product updated successfully!', 'success');
            } else {
                const dup = dataManager.getProducts().find(p => p.name.toLowerCase() === name.toLowerCase());
                if (dup) { uiRenderer.showToast('A product with this name already exists', 'error'); return; }

                await dataManager.addProduct({ id: dataManager.generateId('prod'), patternId, name, type, description, image, price, colors });
                uiRenderer.showToast('Product created successfully!', 'success');
            }

            this.renderAll();
            this.closeModal('productModal');
        } catch (error) {
            uiRenderer.showToast(error.message || 'Failed to save product', 'error');
        } finally {
            this._isSavingProduct = false;
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Product'; }
        }
    }

    async deleteProduct(id) {
        const p = dataManager.getProductById(id);
        if (!p) return;
        if (!confirm(`Delete product "${p.name}"?`)) return;

        try {
            await dataManager.deleteProduct(id);
            this.renderAll();
            uiRenderer.showToast('Product deleted', 'success');
        } catch (error) {
            uiRenderer.showToast(error.message || 'Failed to delete product', 'error');
        }
    }

    previewProductImage(url) {
        const preview = document.getElementById('productImagePreview');
        if (!preview) return;
        if (url && dataManager.isValidImageUrl(url)) {
            preview.innerHTML = `<img src="${url}" alt="Preview"
                onerror="this.parentElement.innerHTML='<p class=\\'error\\'>Failed to load image</p>'">`;
            preview.style.display = 'block';
        } else {
            preview.innerHTML = '';
            preview.style.display = 'none';
        }
    }

    _populateProductColors(selectedColors = []) {
        const container = document.getElementById('productColorsContainer');
        if (!container) return;
        container.innerHTML = dataManager.getColors().map(color => `
            <label class="color-checkbox-item ${selectedColors.includes(color.id) ? 'selected' : ''}" data-color-id="${color.id}">
                <input type="checkbox" name="productColors" value="${color.id}" ${selectedColors.includes(color.id) ? 'checked' : ''}>
                <div class="color-chip" style="background-color:${color.hex};"></div>
                <span class="color-label">${this._esc(color.name)}</span>
            </label>`).join('');

        container.querySelectorAll('.color-checkbox-item').forEach(item => {
            item.addEventListener('click', function(e) {
                if (e.target.tagName !== 'INPUT') {
                    const cb = this.querySelector('input');
                    cb.checked = !cb.checked;
                }
                this.classList.toggle('selected', this.querySelector('input').checked);
            });
        });
    }

    _getProductColorsFromForm() {
        return [...document.querySelectorAll('input[name="productColors"]:checked')].map(i => i.value);
    }

    // ────────────────────────────────────────────────
    // COLORS
    // ────────────────────────────────────────────────

    renderColorsList() {
        const list = document.getElementById('colorsList');
        if (!list) return;

        // Deduplicate by ID just in case
        const seen    = new Set();
        const colors  = dataManager.getColors().filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });

        if (colors.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎨</div>
                    <p>No colors yet.</p>
                    <p>Click <strong>"+ Add Color"</strong> to create your first one.</p>
                </div>`;
            return;
        }

        list.innerHTML = colors.map(color => `
            <div class="admin-list-item">
                <div class="admin-list-item-info">
                    <div class="color-chip" style="background:${color.hex}; width:48px; height:48px; border-radius:8px; flex-shrink:0;"></div>
                    <div class="admin-list-item-text">
                        <h4>${this._esc(color.name)}</h4>
                        <p>Hex: <code>${color.hex}</code> &nbsp;|&nbsp; Dark: <code>${color.darkHex}</code></p>
                    </div>
                </div>
                <div class="admin-card-actions">
                    <button class="btn btn-secondary btn-sm" onclick="adminPanel.openColorModal('${color.id}')">Edit</button>
                    <button class="btn btn-danger btn-sm"    onclick="adminPanel.deleteColor('${color.id}')">Delete</button>
                </div>
            </div>`).join('');
    }

    openColorModal(colorId = null) {
        const modal = document.getElementById('colorModal');
        const title = document.getElementById('colorModalTitle');
        document.getElementById('colorForm').reset();

        if (colorId) {
            const c = dataManager.getColorById(colorId);
            title.textContent = 'Edit Color';
            document.getElementById('colorId').value      = c.id;
            document.getElementById('colorName').value    = c.name;
            document.getElementById('colorHex').value     = c.hex;
            document.getElementById('colorDarkHex').value = c.darkHex || c.hex;
        } else {
            title.textContent = 'Add Color';
            document.getElementById('colorId').value = '';
        }

        modal.classList.add('active');
        document.getElementById('colorName').focus();
    }

    async saveColor(e) {
        e.preventDefault();
        if (this._isSavingColor) return;
        this._isSavingColor = true;

        const submitBtn = document.querySelector('#colorForm button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Saving…'; }

        try {
            const id      = document.getElementById('colorId').value.trim();
            const name    = document.getElementById('colorName').value.trim();
            const hex     = document.getElementById('colorHex').value;
            const darkHex = document.getElementById('colorDarkHex').value;

            if (!name) { uiRenderer.showToast('Color name is required', 'error'); return; }

            if (id) {
                await dataManager.updateColor(id, { name, hex, darkHex });
                uiRenderer.showToast('Color updated successfully!', 'success');
            } else {
                const newId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                await dataManager.addColor({ id: newId, name, hex, darkHex });
                uiRenderer.showToast('Color created successfully!', 'success');
            }

            this.renderAll();
            this.closeModal('colorModal');
        } catch (error) {
            uiRenderer.showToast(error.message || 'Failed to save color', 'error');
        } finally {
            this._isSavingColor = false;
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Color'; }
        }
    }

    async deleteColor(id) {
        const c = dataManager.getColorById(id);
        if (!c) return;
        if (!confirm(`Delete color "${c.name}"?`)) return;

        try {
            await dataManager.deleteColor(id);
            this.renderAll();
            uiRenderer.showToast('Color deleted', 'success');
        } catch (error) {
            uiRenderer.showToast(error.message || 'Failed to delete color', 'error');
        }
    }

    // ────────────────────────────────────────────────
    // PATTERN COLOR HELPERS (used by HTML onsubmit)
    // ────────────────────────────────────────────────

    populatePatternColors(selectedColors = []) {
        const container = document.getElementById('patternColorsContainer');
        if (!container) return;
        container.innerHTML = dataManager.getColors().map(color => `
            <label class="color-checkbox-item ${selectedColors.includes(color.id) ? 'selected' : ''}" data-color-id="${color.id}">
                <input type="checkbox" name="patternColors" value="${color.id}" ${selectedColors.includes(color.id) ? 'checked' : ''}>
                <div class="color-chip" style="background-color:${color.hex};"></div>
                <span class="color-label">${this._esc(color.name)}</span>
            </label>`).join('');

        container.querySelectorAll('.color-checkbox-item').forEach(item => {
            item.addEventListener('click', function(e) {
                if (e.target.tagName !== 'INPUT') {
                    const cb = this.querySelector('input');
                    cb.checked = !cb.checked;
                }
                this.classList.toggle('selected', this.querySelector('input').checked);
            });
        });
    }

    getPatternColorsFromForm() {
        return [...document.querySelectorAll('input[name="patternColors"]:checked')].map(i => i.value);
    }

    // ────────────────────────────────────────────────
    // MODAL UTILITIES
    // ────────────────────────────────────────────────

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    }

    // ────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ────────────────────────────────────────────────

    /** Escape HTML to prevent XSS in template strings */
    _esc(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}

// ============================
// SINGLETON INSTANCE
// ============================

const adminPanel = new AdminPanel();

// Global helpers referenced by HTML onsubmit attributes
window.populatePatternColors  = (sel) => adminPanel.populatePatternColors(sel);
window.getPatternColorsFromForm = ()  => adminPanel.getPatternColorsFromForm();
