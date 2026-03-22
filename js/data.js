/**
 * Data Management Module
 * Handles all data operations including localStorage persistence
 * and cloud image URL management
 */

// ============================
// CONFIGURATION
// ============================

const CONFIG = {
    STORAGE_KEY: 'srimaliBatikData',
    WHATSAPP_NUMBER: '94769652924',
    // Cloud base URL for images (can be configured for different services)
    CLOUD_BASE_URL: 'https://res.cloudinary.com/demo/image/upload/',
    // Fallback image URL when cloud image fails to load
    FALLBACK_IMAGE: 'https://via.placeholder.com/400x300?text=Image+Not+Available'
};

// ============================
// DEFAULT DATA STRUCTURE
// ============================

const defaultData = {
    patterns: [
        {
            id: 'p1',
            name: 'Floral Elegance',
            image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
            description: 'Handmade floral batik design with intricate patterns'
        },
        {
            id: 'p2',
            name: 'Peacock Majesty',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
            description: 'Majestic peacock inspired traditional Sri Lankan batik'
        },
        {
            id: 'p3',
            name: 'Elephant Heritage',
            image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
            description: 'Gentle elephant design representing Sri Lankan culture'
        },
        {
            id: 'p4',
            name: 'Lotus Serenity',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
            description: 'Symbol of purity and enlightenment in batik art'
        },
        {
            id: 'p5',
            name: 'Ocean Waves',
            image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
            description: 'Inspired by the beautiful Indian Ocean waves'
        }
    ],
    products: [
        {
            id: 'prod1',
            patternId: 'p1',
            name: 'Floral Saree',
            type: 'Saree',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=300&fit=crop',
            description: 'Beautiful handmade saree with floral batik design',
            price: '15,000 LKR',
            colorImages: {}
        },
        {
            id: 'prod2',
            patternId: 'p1',
            name: 'Floral Frock',
            type: 'Frock',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=300&fit=crop',
            description: 'Elegant frock with traditional floral patterns',
            price: '8,500 LKR',
            colorImages: {}
        },
        {
            id: 'prod3',
            patternId: 'p2',
            name: 'Peacock Saree',
            type: 'Saree',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=300&fit=crop',
            description: 'Stunning saree featuring peacock batik design',
            price: '18,000 LKR',
            colorImages: {}
        },
        {
            id: 'prod4',
            patternId: 'p3',
            name: 'Elephant Sarong',
            type: 'Sarong',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=300&fit=crop',
            description: 'Comfortable sarong with elephant heritage design',
            price: '4,500 LKR',
            colorImages: {}
        }
    ],
    colors: [
        { id: 'green', name: 'Green', hex: '#2d5a27', darkHex: '#1e4d1a', image: '' },
        { id: 'blue', name: 'Blue', hex: '#1e3a5f', darkHex: '#152a45', image: '' },
        { id: 'red', name: 'Red', hex: '#8b2942', darkHex: '#6d2034', image: '' },
        { id: 'purple', name: 'Purple', hex: '#4a3068', darkHex: '#3a2552', image: '' },
        { id: 'gold', name: 'Gold', hex: '#b8860b', darkHex: '#8b6914', image: '' },
        { id: 'black', name: 'Black', hex: '#2d2d2d', darkHex: '#1a1a1a', image: '' }
    ]
};

// ============================
// DATA MANAGEMENT CLASS
// ============================

class DataManager {
    constructor() {
        this.data = this.loadData();
    }

    /**
     * Load data from localStorage
     * @returns {Object} The application data
     */
    loadData() {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                // Ensure data has required arrays
                if (!data.patterns) data.patterns = [];
                if (!data.products) data.products = [];
                if (!data.colors) data.colors = [];
                return data;
            } catch (e) {
                console.error('Error parsing stored data:', e);
                return defaultData;
            }
        }
        // Initialize with default data
        this.saveData(defaultData);
        return defaultData;
    }

    /**
     * Save data to localStorage
     * @param {Object} data - The data to save
     */
    saveData(data) {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
        this.data = data;
    }

    /**
     * Get all patterns
     * @returns {Array} Array of patterns
     */
    getPatterns() {
        return this.data.patterns || [];
    }

    /**
     * Get pattern by ID
     * @param {string} id - Pattern ID
     * @returns {Object|null} Pattern object or null
     */
    getPatternById(id) {
        return this.data.patterns.find(p => p.id === id) || null;
    }

    /**
     * Add a new pattern
     * @param {Object} pattern - Pattern object
     */
    addPattern(pattern) {
        if (!this.data.patterns) {
            this.data.patterns = [];
        }
        this.data.patterns.push(pattern);
        this.saveData(this.data);
    }

    /**
     * Update an existing pattern
     * @param {string} id - Pattern ID
     * @param {Object} updates - Updated fields
     */
    updatePattern(id, updates) {
        const index = this.data.patterns.findIndex(p => p.id === id);
        if (index !== -1) {
            this.data.patterns[index] = { ...this.data.patterns[index], ...updates };
            this.saveData(this.data);
        }
    }

    /**
     * Delete a pattern
     * @param {string} id - Pattern ID
     */
    deletePattern(id) {
        this.data.patterns = this.data.patterns.filter(p => p.id !== id);
        // Also delete associated products
        this.data.products = this.data.products.filter(p => p.patternId !== id);
        this.saveData(this.data);
    }

    /**
     * Get all products
     * @returns {Array} Array of products
     */
    getProducts() {
        return this.data.products || [];
    }

    /**
     * Get products by pattern ID
     * @param {string} patternId - Pattern ID
     * @returns {Array} Array of products
     */
    getProductsByPatternId(patternId) {
        return this.data.products.filter(p => p.patternId === patternId);
    }

    /**
     * Get product by ID
     * @param {string} id - Product ID
     * @returns {Object|null} Product object or null
     */
    getProductById(id) {
        return this.data.products.find(p => p.id === id) || null;
    }

    /**
     * Add a new product
     * @param {Object} product - Product object
     */
    addProduct(product) {
        if (!this.data.products) {
            this.data.products = [];
        }
        this.data.products.push(product);
        this.saveData(this.data);
    }

    /**
     * Update an existing product
     * @param {string} id - Product ID
     * @param {Object} updates - Updated fields
     */
    updateProduct(id, updates) {
        const index = this.data.products.findIndex(p => p.id === id);
        if (index !== -1) {
            this.data.products[index] = { ...this.data.products[index], ...updates };
            this.saveData(this.data);
        }
    }

    /**
     * Delete a product
     * @param {string} id - Product ID
     */
    deleteProduct(id) {
        this.data.products = this.data.products.filter(p => p.id !== id);
        this.saveData(this.data);
    }

    /**
     * Get all colors
     * @returns {Array} Array of colors
     */
    getColors() {
        return this.data.colors || [];
    }

    /**
     * Get color by ID
     * @param {string} id - Color ID
     * @returns {Object|null} Color object or null
     */
    getColorById(id) {
        return this.data.colors.find(c => c.id === id) || null;
    }

    /**
     * Add a new color
     * @param {Object} color - Color object
     */
    addColor(color) {
        if (!this.data.colors) {
            this.data.colors = [];
        }
        this.data.colors.push(color);
        this.saveData(this.data);
    }

    /**
     * Update an existing color
     * @param {string} id - Color ID
     * @param {Object} updates - Updated fields
     */
    updateColor(id, updates) {
        const index = this.data.colors.findIndex(c => c.id === id);
        if (index !== -1) {
            this.data.colors[index] = { ...this.data.colors[index], ...updates };
            this.saveData(this.data);
        }
    }

    /**
     * Delete a color
     * @param {string} id - Color ID
     */
    deleteColor(id) {
        this.data.colors = this.data.colors.filter(c => c.id !== id);
        this.saveData(this.data);
    }

    /**
     * Generate a unique ID
     * @param {string} prefix - ID prefix
     * @returns {string} Unique ID
     */
    generateId(prefix = 'item') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Validate image URL
     * @param {string} url - Image URL to validate
     * @returns {boolean} True if valid URL
     */
    isValidImageUrl(url) {
        if (!url) return false;
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get fallback image URL
     * @returns {string} Fallback image URL
     */
    getFallbackImage() {
        return CONFIG.FALLBACK_IMAGE;
    }
}

// Create and export singleton instance
const dataManager = new DataManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { dataManager, CONFIG };
}
