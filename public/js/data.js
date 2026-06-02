/**
 * Data Management Module — Local-Only Version
 * All data operations go through the local Express API (/api/*).
 * WebSocket provides real-time sync between open tabs.
 * No cloud services, no authentication, no polling fallback.
 */

// ============================
// CONFIGURATION
// ============================

const CONFIG = {
    API_BASE_URL:    '/api',
    WHATSAPP_NUMBER: '94769652924',
    // Inline SVG fallback — no external network request needed
    FALLBACK_IMAGE: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmMGU4Ii8+PHRleHQgeD0iNTAlIiB5PSI0NSUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmaWxsPSIjYzhiODk4Ij7wn6a3PC90ZXh0Pjx0ZXh0IHg9IjUwJSIgeT0iNjUlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iI2E4OTg4OCI+SW1hZ2Ugbm90IHNldDwvdGV4dD48L3N2Zz4='
};

// ============================
// DATA MANAGEMENT CLASS
// ============================

class DataManager {
    constructor() {
        this.data = { patterns: [], products: [], colors: [] };
        this.dataLoaded = false;
        this.ws = null;
        this._connectWebSocket();
    }

    // ──────────────────────────────────────────
    // WebSocket — real-time sync across tabs
    // ──────────────────────────────────────────

    _connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl    = `${protocol}//${window.location.host}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('✅ WebSocket connected');
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this._handleWebSocketMessage(message);
            } catch (err) {
                // Ignore malformed messages
            }
        };

        this.ws.onclose = () => {
            // Reconnect after 3 seconds
            setTimeout(() => this._connectWebSocket(), 3000);
        };

        this.ws.onerror = () => {
            // Will trigger onclose — reconnect handled there
        };
    }

    /**
     * Handle incoming WebSocket messages from the server.
     * Keeps local in-memory data in sync without a full reload.
     */
    _handleWebSocketMessage(message) {
        const { type, data } = message;

        switch (type) {
            // ── Patterns ──
            case 'pattern_created':
                if (!this.data.patterns.find(p => p.id === data.id)) {
                    this.data.patterns.unshift(data);
                }
                this._refreshUI('patterns');
                break;

            case 'pattern_updated':
                const pi = this.data.patterns.findIndex(p => p.id === data.id);
                if (pi !== -1) this.data.patterns[pi] = data;
                this._refreshUI('patterns');
                break;

            case 'pattern_deleted':
                this.data.patterns = this.data.patterns.filter(p => p.id !== data.id);
                this.data.products = this.data.products.filter(p => p.pattern_id !== data.id);
                this._refreshUI('patterns');
                break;

            // ── Products ──
            case 'product_created':
                if (!this.data.products.find(p => p.id === data.id)) {
                    this.data.products.unshift(data);
                }
                this._refreshUI('products');
                break;

            case 'product_updated':
                const prdi = this.data.products.findIndex(p => p.id === data.id);
                if (prdi !== -1) this.data.products[prdi] = data;
                this._refreshUI('products');
                break;

            case 'product_deleted':
                this.data.products = this.data.products.filter(p => p.id !== data.id);
                this._refreshUI('products');
                break;

            // ── Colors ──
            case 'color_created':
                if (!this.data.colors.find(c => c.id === data.id)) {
                    this.data.colors.push(data);
                    this.data.colors.sort((a, b) => a.name.localeCompare(b.name));
                }
                this._refreshUI('colors');
                break;

            case 'color_updated':
                const ci = this.data.colors.findIndex(c => c.id === data.id);
                if (ci !== -1) this.data.colors[ci] = data;
                this._refreshUI('colors');
                break;

            case 'color_deleted':
                this.data.colors = this.data.colors.filter(c => c.id !== data.id);
                this._refreshUI('colors');
                break;

            default:
                break; // 'connection' message etc. — ignore
        }
    }

    /**
     * Trigger the appropriate UI refresh based on entity type.
     */
    _refreshUI(type) {
        if (typeof uiRenderer !== 'undefined' && uiRenderer.renderPatternsGrid) {
            uiRenderer.renderPatternsGrid();
        }
        if (typeof adminPanel !== 'undefined') {
            if (adminPanel.renderAll) adminPanel.renderAll();
        }
    }

    // ──────────────────────────────────────────
    // Load all data from server
    // ──────────────────────────────────────────

    async loadData() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/all`);
            if (!response.ok) throw new Error(`Server returned ${response.status}`);

            const raw = await response.json();
            this.data = {
                patterns: raw.patterns || [],
                products: raw.products || [],
                colors:   raw.colors   || []
            };

            if (this.data.patterns.length === 0) {
                console.log('ℹ️ Database is empty. Add your first pattern in the Admin Panel!');
            }

            this.dataLoaded = true;
        } catch (error) {
            console.error('❌ Error loading data from server:', error.message);
            // Keep empty arrays — don't crash the UI
            this.data = { patterns: [], products: [], colors: [] };
            this.dataLoaded = true;
        }
    }

    // ──────────────────────────────────────────
    // Generic save (POST = create, PUT = update)
    // ──────────────────────────────────────────

    async _save(type, data) {
        const isUpdate = data.id && this.data[type].find(item => item.id === data.id);
        const url      = isUpdate
            ? `${CONFIG.API_BASE_URL}/${type}/${data.id}`
            : `${CONFIG.API_BASE_URL}/${type}`;
        const method   = isUpdate ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            const msg = result.details || result.error || `Failed to save (${response.status})`;
            throw new Error(msg);
        }

        return result;
    }

    // ──────────────────────────────────────────
    // Generic delete
    // ──────────────────────────────────────────

    async _delete(type, id) {
        const response = await fetch(`${CONFIG.API_BASE_URL}/${type}/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            const msg = result.details || result.error || `Failed to delete (${response.status})`;
            throw new Error(msg);
        }

        return result;
    }

    // ──────────────────────────────────────────
    // PATTERNS
    // ──────────────────────────────────────────

    getPatterns()       { return this.data.patterns || []; }
    getPatternById(id)  { return this.data.patterns.find(p => p.id === id) || null; }

    async addPattern(pattern) {
        const result = await this._save('patterns', pattern);
        if (!this.data.patterns.find(p => p.id === result.id)) {
            this.data.patterns.unshift(result);
        }
        return result;
    }

    async updatePattern(id, updates) {
        const existing = this.getPatternById(id);
        if (!existing) throw new Error('Pattern not found');
        const result = await this._save('patterns', { ...existing, ...updates });
        const idx = this.data.patterns.findIndex(p => p.id === id);
        if (idx !== -1) this.data.patterns[idx] = result;
        return result;
    }

    async deletePattern(id) {
        await this._delete('patterns', id);
        this.data.patterns = this.data.patterns.filter(p => p.id !== id);
        this.data.products = this.data.products.filter(p => p.pattern_id !== id);
    }

    // ──────────────────────────────────────────
    // PRODUCTS
    // ──────────────────────────────────────────

    getProducts()            { return this.data.products || []; }
    getProductById(id)       { return this.data.products.find(p => p.id === id) || null; }
    getProductsByPatternId(patternId) {
        return this.data.products.filter(p => p.pattern_id === patternId);
    }

    async addProduct(product) {
        const result = await this._save('products', product);
        if (!this.data.products.find(p => p.id === result.id)) {
            this.data.products.unshift(result);
        }
        return result;
    }

    async updateProduct(id, updates) {
        const existing = this.getProductById(id);
        if (!existing) throw new Error('Product not found');

        // Normalize patternId field name
        const merged = { ...existing, ...updates };
        if (merged.pattern_id && !merged.patternId) {
            merged.patternId = merged.pattern_id;
        }
        delete merged.pattern_id;

        const result = await this._save('products', merged);
        const idx = this.data.products.findIndex(p => p.id === id);
        if (idx !== -1) this.data.products[idx] = result;
        return result;
    }

    async deleteProduct(id) {
        await this._delete('products', id);
        this.data.products = this.data.products.filter(p => p.id !== id);
    }

    // ──────────────────────────────────────────
    // COLORS
    // ──────────────────────────────────────────

    getColors()       { return this.data.colors || []; }
    getColorById(id)  { return this.data.colors.find(c => c.id === id) || null; }

    async addColor(color) {
        const result = await this._save('colors', color);
        if (!this.data.colors.find(c => c.id === result.id)) {
            this.data.colors.push(result);
            this.data.colors.sort((a, b) => a.name.localeCompare(b.name));
        }
        return result;
    }

    async updateColor(id, updates) {
        const existing = this.getColorById(id);
        if (!existing) throw new Error('Color not found');
        const result = await this._save('colors', { ...existing, ...updates });
        const idx = this.data.colors.findIndex(c => c.id === id);
        if (idx !== -1) this.data.colors[idx] = result;
        return result;
    }

    async deleteColor(id) {
        await this._delete('colors', id);
        this.data.colors = this.data.colors.filter(c => c.id !== id);
    }

    // ──────────────────────────────────────────
    // Utilities
    // ──────────────────────────────────────────

    generateId(prefix = 'item') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    isValidImageUrl(url) {
        if (!url) return false;
        try { new URL(url); return true; } catch { return false; }
    }

    getFallbackImage() {
        return CONFIG.FALLBACK_IMAGE;
    }
}

// ============================
// SINGLETON INSTANCE
// ============================

const dataManager = new DataManager();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { dataManager, CONFIG };
}
