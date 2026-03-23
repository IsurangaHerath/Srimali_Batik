/**
 * Admin Panel Module
 * Handles all admin panel functionality including CRUD operations
 * for patterns, products, and colors
 */

// ============================
// ADMIN PANEL CLASS
// ============================

class AdminPanel {
    constructor() {
        this.currentTab = 'patterns';
        this.editingItem = null;
    }

    /**
     * Initialize admin panel
     */
    init() {
        this.renderAll();
        this.attachTabListeners();
        this.attachModalListeners();
    }

    /**
     * Render all admin lists
     */
    renderAll() {
        this.renderPatternsList();
        this.renderProductsList();
        this.renderColorsList();
        this.populatePatternSelect();
    }

    /**
     * Attach tab switching listeners
     */
    attachTabListeners() {
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                document.querySelectorAll('.admin-tab-content').forEach(content => {
                    content.style.display = 'none';
                });
                
                document.getElementById(`tab-${tab.dataset.tab}`).style.display = 'block';
                this.currentTab = tab.dataset.tab;
            });
        });
    }

    /**
     * Attach modal close listeners
     */
    attachModalListeners() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    // ============================
    // PATTERNS MANAGEMENT
    // ============================

    /**
     * Render patterns list in admin panel
     */
    renderPatternsList() {
        const list = document.getElementById('patternsList');
        if (!list) return;

        const patterns = dataManager.getPatterns();
        const colors = dataManager.getColors();
        
        if (patterns.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <p>No patterns yet.</p>
                    <p>Click "Add Pattern" to create one.</p>
                </div>
            `;
            return;
        }

        list.innerHTML = patterns.map(pattern => {
            // Get color names for this pattern
            const patternColors = pattern.colors || [];
            const colorNames = patternColors.map(colorId => {
                const color = colors.find(c => c.id === colorId);
                return color ? color.name : colorId;
            }).join(', ');
            
            return `
                <div class="admin-list-item">
                    <div class="admin-list-item-info">
                        <div class="admin-list-item-preview">
                            <img src="${pattern.image}" alt="${pattern.name}" 
                                 onerror="this.src='${dataManager.getFallbackImage()}'">
                        </div>
                        <div class="admin-list-item-text">
                            <h4>${pattern.name}</h4>
                            <p>${pattern.description}</p>
                            <small class="text-muted">Colors: ${colorNames || 'All colors'}</small>
                        </div>
                    </div>
                    <div class="admin-card-actions">
                        <button class="btn btn-secondary btn-sm" onclick="adminPanel.editPattern('${pattern.id}')">
                            Edit
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="adminPanel.deletePattern('${pattern.id}')">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Open pattern modal for add/edit
     * @param {string} patternId - Pattern ID (null for new)
     */
    openPatternModal(patternId = null) {
        const modal = document.getElementById('patternModal');
        const title = document.getElementById('patternModalTitle');
        const form = document.getElementById('patternForm');
        
        form.reset();
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('imagePreview').style.display = 'none';
        
        if (patternId) {
            const pattern = dataManager.getPatternById(patternId);
            title.textContent = 'Edit Pattern';
            document.getElementById('patternId').value = pattern.id;
            document.getElementById('patternName').value = pattern.name;
            document.getElementById('patternDescription').value = pattern.description;
            document.getElementById('patternImage').value = pattern.image;
            this.previewImage(pattern.image);
            // Populate available colors
            if (typeof populatePatternColors === 'function') {
                populatePatternColors(pattern.colors || []);
            }
        } else {
            title.textContent = 'Add Pattern';
            document.getElementById('patternId').value = '';
            // Populate empty colors (all unchecked)
            if (typeof populatePatternColors === 'function') {
                populatePatternColors([]);
            }
        }
        
        modal.classList.add('active');
    }

    /**
     * Edit pattern
     * @param {string} id - Pattern ID
     */
    editPattern(id) {
        this.openPatternModal(id);
    }

    /**
     * Save pattern (add or update)
     * @param {Event} e - Form submit event
     */
    async savePattern(e) {
        e.preventDefault();
        
        const id = document.getElementById('patternId').value;
        const name = document.getElementById('patternName').value.trim();
        const description = document.getElementById('patternDescription').value.trim();
        const image = document.getElementById('patternImage').value.trim();
        
        // Get selected colors
        const colors = typeof getPatternColorsFromForm === 'function' ? getPatternColorsFromForm() : [];
        
        // Validate image URL (only if provided)
        if (image && !dataManager.isValidImageUrl(image)) {
            uiRenderer.showToast('Please enter a valid image URL', 'error');
            return;
        }
        
        try {
            if (id) {
                // Update existing pattern
                await dataManager.updatePattern(id, { name, description, image, colors });
                uiRenderer.showToast('Pattern updated successfully!', 'success');
            } else {
                // Create new pattern
                const newId = dataManager.generateId('p');
                await dataManager.addPattern({ id: newId, name, description, image, colors });
                uiRenderer.showToast('Pattern created successfully!', 'success');
            }
            
            this.renderAll();
            uiRenderer.renderPatternsGrid();
            this.closeModal('patternModal');
        } catch (error) {
            console.error('Error saving pattern:', error);
            // Show more specific error message to user
            const errorMessage = error.message || 'Failed to save pattern. Please try again.';
            uiRenderer.showToast(errorMessage, 'error');
        }
    }

    /**
     * Delete pattern
     * @param {string} id - Pattern ID
     */
    async deletePattern(id) {
        if (confirm('Are you sure you want to delete this pattern? This will also delete all associated products.')) {
            try {
                await dataManager.deletePattern(id);
                this.renderAll();
                uiRenderer.renderPatternsGrid();
                uiRenderer.showToast('Pattern deleted successfully!', 'success');
            } catch (error) {
                console.error('Error deleting pattern:', error);
                // Show more specific error message to user
                const errorMessage = error.message || 'Failed to delete pattern. Please try again.';
                uiRenderer.showToast(errorMessage, 'error');
            }
        }
    }

    /**
     * Preview image URL
     * @param {string} url - Image URL
     */
    previewImage(url) {
        const preview = document.getElementById('imagePreview');
        if (!preview) return;

        if (url && dataManager.isValidImageUrl(url)) {
            preview.innerHTML = `
                <img src="${url}" alt="Preview" 
                     onerror="this.parentElement.innerHTML='<p class=\\'error\\'>Failed to load image</p>'">
            `;
            preview.style.display = 'block';
        } else {
            preview.innerHTML = '';
            preview.style.display = 'none';
        }
    }

    // ============================
    // PRODUCTS MANAGEMENT
    // ============================

    /**
     * Render products list in admin panel
     */
    renderProductsList() {
        const list = document.getElementById('productsList');
        if (!list) return;

        const products = dataManager.getProducts();
        
        if (products.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <p>No products yet.</p>
                    <p>Click "Add Product" to create one.</p>
                </div>
            `;
            return;
        }

        list.innerHTML = products.map(product => {
            const pattern = dataManager.getPatternById(product.pattern_id);
            return `
                <div class="admin-list-item">
                    <div class="admin-list-item-info">
                        <div class="admin-list-item-preview">
                            <img src="${product.image}" alt="${product.name}"
                                 onerror="this.src='${dataManager.getFallbackImage()}'">
                        </div>
                        <div class="admin-list-item-text">
                            <h4>${product.name}</h4>
                            <p>Pattern: ${pattern ? pattern.name : 'Unknown'} | Type: ${product.type}</p>
                            <p>${product.description}</p>
                            <small class="text-muted">Price: ${product.price || 'Not set'}</small>
                        </div>
                    </div>
                    <div class="admin-card-actions">
                        <button class="btn btn-secondary btn-sm" onclick="adminPanel.editProduct('${product.id}')">
                            Edit
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="adminPanel.deleteProduct('${product.id}')">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Populate pattern select dropdown
     */
    populatePatternSelect() {
        const select = document.getElementById('productPattern');
        if (!select) return;

        const patterns = dataManager.getPatterns();
        
        if (patterns.length === 0) {
            select.innerHTML = '<option value="">Please add a pattern first</option>';
            return;
        }

        select.innerHTML = patterns.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }

    /**
     * Open product modal for add/edit
     * @param {string} productId - Product ID (null for new)
     */
    openProductModal(productId = null) {
        if (dataManager.getPatterns().length === 0) {
            uiRenderer.showToast('Please add a pattern first!', 'error');
            return;
        }
        
        const modal = document.getElementById('productModal');
        const title = document.getElementById('productModalTitle');
        const form = document.getElementById('productForm');
        
        form.reset();
        document.getElementById('productImagePreview').innerHTML = '';
        document.getElementById('productImagePreview').style.display = 'none';
        this.populatePatternSelect();
        
        if (productId) {
            const product = dataManager.getProductById(productId);
            title.textContent = 'Edit Product';
            document.getElementById('productId').value = product.id;
            document.getElementById('productPattern').value = product.pattern_id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productType').value = product.type;
            document.getElementById('productDescription').value = product.description;
            document.getElementById('productImage').value = product.image;
            document.getElementById('productPrice').value = product.price || '';
            this.previewProductImage(product.image);
        } else {
            title.textContent = 'Add Product';
            document.getElementById('productId').value = '';
        }
        
        modal.classList.add('active');
    }

    /**
     * Edit product
     * @param {string} id - Product ID
     */
    editProduct(id) {
        this.openProductModal(id);
    }

    /**
     * Save product (add or update)
     * @param {Event} e - Form submit event
     */
    async saveProduct(e) {
        e.preventDefault();
        
        const id = document.getElementById('productId').value;
        const patternId = document.getElementById('productPattern').value;
        const name = document.getElementById('productName').value.trim();
        const type = document.getElementById('productType').value;
        const description = document.getElementById('productDescription').value.trim();
        const image = document.getElementById('productImage').value.trim();
        const price = document.getElementById('productPrice').value.trim();
        
        // Validate image URL (only if provided)
        if (image && !dataManager.isValidImageUrl(image)) {
            uiRenderer.showToast('Please enter a valid image URL', 'error');
            return;
        }
        
        try {
            if (id) {
                // Update existing product
                await dataManager.updateProduct(id, { patternId, name, type, description, image, price });
                uiRenderer.showToast('Product updated successfully!', 'success');
            } else {
                // Create new product
                const newId = dataManager.generateId('prod');
                await dataManager.addProduct({ id: newId, patternId, name, type, description, image, price });
                uiRenderer.showToast('Product created successfully!', 'success');
            }
            
            this.renderAll();
            this.closeModal('productModal');
        } catch (error) {
            console.error('Error saving product:', error);
            // Show more specific error message to user
            const errorMessage = error.message || 'Failed to save product. Please try again.';
            uiRenderer.showToast(errorMessage, 'error');
        }
    }

    /**
     * Delete product
     * @param {string} id - Product ID
     */
    async deleteProduct(id) {
        if (confirm('Are you sure you want to delete this product?')) {
            try {
                await dataManager.deleteProduct(id);
                this.renderAll();
                uiRenderer.showToast('Product deleted successfully!', 'success');
            } catch (error) {
                console.error('Error deleting product:', error);
                // Show more specific error message to user
                const errorMessage = error.message || 'Failed to delete product. Please try again.';
                uiRenderer.showToast(errorMessage, 'error');
            }
        }
    }

    /**
     * Preview product image URL
     * @param {string} url - Image URL
     */
    previewProductImage(url) {
        const preview = document.getElementById('productImagePreview');
        if (!preview) return;

        if (url && dataManager.isValidImageUrl(url)) {
            preview.innerHTML = `
                <img src="${url}" alt="Preview"
                     onerror="this.parentElement.innerHTML='<p class=\\'error\\'>Failed to load image</p>'">
            `;
            preview.style.display = 'block';
        } else {
            preview.innerHTML = '';
            preview.style.display = 'none';
        }
    }

    // ============================
    // COLORS MANAGEMENT
    // ============================

    /**
     * Render colors list in admin panel
     */
    renderColorsList() {
        const list = document.getElementById('colorsList');
        if (!list) return;

        const colors = dataManager.getColors();
        
        // Deduplicate colors by ID to prevent display and delete issues
        const uniqueColors = colors.reduce((acc, color) => {
            if (!acc.find(c => c.id === color.id)) {
                acc.push(color);
            }
            return acc;
        }, []);
        
        if (uniqueColors.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <p>No colors yet.</p>
                    <p>Click "Add Color" to create one.</p>
                </div>
            `;
            return;
        }

        list.innerHTML = uniqueColors.map(color => `
            <div class="admin-list-item">
                <div class="admin-list-item-info">
                    ${color.image ? `
                        <div class="admin-list-item-preview">
                            <img src="${color.image}" alt="${color.name}"
                                 onerror="this.src='${dataManager.getFallbackImage()}'">
                        </div>
                    ` : `
                        <div class="color-chip" style="background-color: ${color.hex}; width: 40px; height: 40px;"></div>
                    `}
                    <div class="admin-list-item-text">
                        <h4>${color.name}</h4>
                        <p>Hex: ${color.hex} | Dark: ${color.darkHex}</p>
                        ${color.image ? '<small class="text-muted">Has custom image</small>' : ''}
                    </div>
                </div>
                <div class="admin-card-actions">
                    <button class="btn btn-secondary btn-sm" onclick="adminPanel.editColor('${color.id}')">
                        Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="adminPanel.deleteColor('${color.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Open color modal for add/edit
     * @param {string} colorId - Color ID (null for new)
     */
    openColorModal(colorId = null) {
        console.log('[DEBUG] AdminPanel.openColorModal called with colorId:', colorId);
        const modal = document.getElementById('colorModal');
        const title = document.getElementById('colorModalTitle');
        const form = document.getElementById('colorForm');
        
        form.reset();
        
        // Handle optional image preview element if it exists
        const imagePreviewEl = document.getElementById('colorImagePreview');
        if (imagePreviewEl) {
            imagePreviewEl.innerHTML = '';
            imagePreviewEl.style.display = 'none';
        }
        
        if (colorId) {
            const color = dataManager.getColorById(colorId);
            title.textContent = 'Edit Color';
            document.getElementById('colorId').value = color.id;
            document.getElementById('colorName').value = color.name;
            document.getElementById('colorHex').value = color.hex;
            document.getElementById('colorDarkHex').value = color.darkHex;
            
            // Handle optional image input if it exists
            const colorImageInput = document.getElementById('colorImage');
            if (colorImageInput) {
                colorImageInput.value = color.image || '';
                if (color.image) {
                    this.previewColorImage(color.image);
                }
            }
        } else {
            title.textContent = 'Add Color';
            document.getElementById('colorId').value = '';
        }
        
        modal.classList.add('active');
    }

    /**
     * Edit color
     * @param {string} id - Color ID
     */
    editColor(id) {
        this.openColorModal(id);
    }

    async saveColor(e) {
        e.preventDefault();
        
        // Prevent double submission
        if (this._isSavingColor) {
            console.log('[DEBUG] Color save already in progress, ignoring duplicate submit');
            return;
        }
        this._isSavingColor = true;
        
        // Disable submit button to prevent double-click
        const submitBtn = document.querySelector('#colorForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving...';
        }
        
        const id = document.getElementById('colorId').value;
        const name = document.getElementById('colorName').value.trim();
        const hex = document.getElementById('colorHex').value;
        const darkHex = document.getElementById('colorDarkHex').value;
        
        // Handle optional image field if it exists
        let image = '';
        const colorImageInput = document.getElementById('colorImage');
        if (colorImageInput) {
            image = colorImageInput.value.trim();
        }
        
        // Validate image URL (only if provided)
        if (image && !dataManager.isValidImageUrl(image)) {
            this._isSavingColor = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Save Color';
            }
            uiRenderer.showToast('Please enter a valid image URL', 'error');
            return;
        }
        
        try {
            console.log('[DEBUG] Saving color with id:', id, 'name:', name);
            
            if (id) {
                // Update existing color
                await dataManager.updateColor(id, { name, hex, darkHex, image });
                uiRenderer.showToast('Color updated successfully!', 'success');
            } else {
                // Create new color
                const newId = name.toLowerCase().replace(/\s+/g, '-');
                console.log('[DEBUG] Creating new color with id:', newId);
                await dataManager.addColor({ id: newId, name, hex, darkHex, image });
                uiRenderer.showToast('Color created successfully!', 'success');
            }
            
            this.renderAll();
            this.closeModal('colorModal');
        } catch (error) {
            console.error('Error saving color:', error);
            uiRenderer.showToast('Failed to save color. Please try again.', 'error');
        } finally {
            this._isSavingColor = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Save Color';
            }
        }
    }
    
    /**
     * Preview color image URL
     * @param {string} url - Image URL
     */
    previewColorImage(url) {
        const preview = document.getElementById('colorImagePreview');
        if (!preview) return;

        if (url && dataManager.isValidImageUrl(url)) {
            preview.innerHTML = `
                <img src="${url}" alt="Preview"
                     onerror="this.parentElement.innerHTML='<p class=\\'error\\'>Failed to load image</p>'">
            `;
            preview.style.display = 'block';
        } else {
            preview.innerHTML = '';
            preview.style.display = 'none';
        }
    }

    /**
     * Delete color
     * @param {string} id - Color ID
     */
    async deleteColor(id) {
        if (confirm('Are you sure you want to delete this color?')) {
            try {
                await dataManager.deleteColor(id);
                this.renderAll();
                uiRenderer.showToast('Color deleted successfully!', 'success');
            } catch (error) {
                console.error('Error deleting color:', error);
                uiRenderer.showToast('Failed to delete color. Please try again.', 'error');
            }
        }
    }

    // ============================
    // MODAL UTILITIES
    // ============================

    /**
     * Close modal
     * @param {string} modalId - Modal element ID
     */
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }
}

// Create and export singleton instance
const adminPanel = new AdminPanel();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { adminPanel };
}
