/**
 * Data Management Module
 * Handles all data operations including API persistence
 * and cloud image URL management
 */

// ============================
// CONFIGURATION
// ============================

const CONFIG = {
    API_BASE_URL: window.location.origin + '/api',
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
            pattern_id: 'p1',
            name: 'Floral Saree',
            type: 'Saree',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=300&fit=crop',
            description: 'Beautiful handmade saree with floral batik design',
            price: '15,000 LKR',
            colorImages: {}
        },
        {
            id: 'prod2',
            pattern_id: 'p1',
            name: 'Floral Frock',
            type: 'Frock',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=300&fit=crop',
            description: 'Elegant frock with traditional floral patterns',
            price: '8,500 LKR',
            colorImages: {}
        },
        {
            id: 'prod3',
            pattern_id: 'p2',
            name: 'Peacock Saree',
            type: 'Saree',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=300&fit=crop',
            description: 'Stunning saree featuring peacock batik design',
            price: '18,000 LKR',
            colorImages: {}
        },
        {
            id: 'prod4',
            pattern_id: 'p3',
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
        this.data = {
            patterns: [],
            products: [],
            colors: []
        };
        this.ws = null;
        this.initWebSocket();
        this.loadData();
    }

    /**
     * Initialize WebSocket connection for real-time sync
     */
    initWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        // Only attempt WebSocket if not on Netlify or if we have a real-time server
        // Netlify Functions don't support persistent WebSockets
        if (window.location.host.includes('netlify.app')) {
            console.log('Detected Netlify environment. Using polling for real-time updates instead of WebSockets.');
            this.initPolling();
            return;
        }

        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('WebSocket connected for real-time sync');
        };
        
        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleWebSocketMessage(message);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
        
        this.ws.onclose = () => {
            console.log('WebSocket disconnected, attempting to reconnect...');
            setTimeout(() => this.initWebSocket(), 3000);
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            // Fallback to polling on error
            this.initPolling();
        };
    }

    /**
     * Initialize Polling for real-time updates (fallback for Netlify)
     */
    initPolling() {
        if (this.pollingInterval) return;
        
        console.log('Initializing data polling (10s interval)');
        this.pollingInterval = setInterval(() => {
            this.loadDataSilently();
        }, 10000);
    }

    /**
     * Load data from API without showing full loading state
     * Compares and updates if changes found
     */
    async loadDataSilently() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/all`);
            if (!response.ok) return;
            
            const newData = await response.json();
            
            // Basic check if data changed (length check for simplicity)
            const hasChanged = 
                newData.patterns?.length !== this.data.patterns.length ||
                newData.products?.length !== this.data.products.length ||
                newData.colors?.length !== this.data.colors.length;
            
            if (hasChanged) {
                console.log('Data changes detected via polling, updating UI...');
                this.data = {
                    patterns: newData.patterns || [],
                    products: newData.products || [],
                    colors: newData.colors || []
                };
                
                // Trigger UI updates
                if (typeof uiRenderer !== 'undefined' && uiRenderer.renderPatternsGrid) {
                    uiRenderer.renderPatternsGrid();
                }
                if (typeof adminPanel !== 'undefined') {
                    if (adminPanel.renderProductsList) adminPanel.renderProductsList();
                    if (adminPanel.renderColorsList) adminPanel.renderColorsList();
                }
            }
        } catch (error) {
            // Ignore polling errors to avoid console noise
        }
    }

    /**
     * Handle incoming WebSocket messages
     * @param {Object} message - The message from server
     */
    handleWebSocketMessage(message) {
        switch (message.type) {
            case 'pattern_created':
                this.data.patterns.push(message.data);
                if (typeof uiRenderer !== 'undefined') {
                    uiRenderer.renderPatternsGrid();
                }
                break;
            case 'pattern_updated':
                const patternIndex = this.data.patterns.findIndex(p => p.id === message.data.id);
                if (patternIndex !== -1) {
                    this.data.patterns[patternIndex] = message.data;
                }
                if (typeof uiRenderer !== 'undefined') {
                    uiRenderer.renderPatternsGrid();
                }
                break;
            case 'pattern_deleted':
                this.data.patterns = this.data.patterns.filter(p => p.id !== message.data.id);
                this.data.products = this.data.products.filter(p => p.pattern_id !== message.data.id);
                if (typeof uiRenderer !== 'undefined') {
                    uiRenderer.renderPatternsGrid();
                }
                break;
            case 'product_created':
                this.data.products.push(message.data);
                if (typeof adminPanel !== 'undefined') {
                    adminPanel.renderProductsList();
                }
                break;
            case 'product_updated':
                const productIndex = this.data.products.findIndex(p => p.id === message.data.id);
                if (productIndex !== -1) {
                    this.data.products[productIndex] = message.data;
                }
                if (typeof adminPanel !== 'undefined') {
                    adminPanel.renderProductsList();
                }
                break;
            case 'product_deleted':
                this.data.products = this.data.products.filter(p => p.id !== message.data.id);
                if (typeof adminPanel !== 'undefined') {
                    adminPanel.renderProductsList();
                }
                break;
            case 'color_created':
                this.data.colors.push(message.data);
                if (typeof adminPanel !== 'undefined') {
                    adminPanel.renderColorsList();
                }
                break;
            case 'color_updated':
                const colorIndex = this.data.colors.findIndex(c => c.id === message.data.id);
                if (colorIndex !== -1) {
                    this.data.colors[colorIndex] = message.data;
                }
                if (typeof adminPanel !== 'undefined') {
                    adminPanel.renderColorsList();
                }
                break;
            case 'color_deleted':
                this.data.colors = this.data.colors.filter(c => c.id !== message.data.id);
                if (typeof adminPanel !== 'undefined') {
                    adminPanel.renderColorsList();
                }
                break;
            case 'connection':
                console.log('Server message:', message.message);
                break;
            default:
                console.log('Unknown message type:', message.type);
        }
    }

    /**
     * Load data from API
     */
    async loadData() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/all`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.details || errorData.error || 'Failed to fetch data from API';
                throw new Error(errorMessage);
            }
            const data = await response.json();
            this.data = {
                patterns: data.patterns || [],
                products: data.products || [],
                colors: data.colors || []
            };
            console.log('Data loaded from API successfully');
        } catch (error) {
            console.error('Error loading data from API:', error);
            // Fallback to default data if API fails
            this.data = defaultData;
        }
    }

    /**
     * Save data to API
     * @param {string} type - The type of data (patterns, products, colors)
     * @param {Object} data - The data to save
     */
    async saveData(type, data) {
        try {
            let response;
            if (data.id && this.data[type].find(item => item.id === data.id)) {
                // Update existing item
                response = await fetch(`${CONFIG.API_BASE_URL}/${type}/${data.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
            } else {
                // Create new item
                response = await fetch(`${CONFIG.API_BASE_URL}/${type}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.details || errorData.error || `Failed to save ${type} to API`;
                throw new Error(errorMessage);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error saving ${type} to API:`, error);
            throw error;
        }
    }

    /**
     * Delete data from API
     * @param {string} type - The type of data (patterns, products, colors)
     * @param {string} id - The ID of the item to delete
     */
    async deleteData(type, id) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/${type}/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.details || errorData.error || `Failed to delete ${type} from API`;
                throw new Error(errorMessage);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error deleting ${type} from API:`, error);
            throw error;
        }
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
    async addPattern(pattern) {
        try {
            const result = await this.saveData('patterns', pattern);
            this.data.patterns.push(result);
            return result;
        } catch (error) {
            console.error('Error adding pattern:', error);
            throw error;
        }
    }

    /**
     * Update an existing pattern
     * @param {string} id - Pattern ID
     * @param {Object} updates - Updated fields
     */
    async updatePattern(id, updates) {
        try {
            const pattern = this.data.patterns.find(p => p.id === id);
            if (!pattern) {
                throw new Error('Pattern not found');
            }
            const updatedPattern = { ...pattern, ...updates };
            const result = await this.saveData('patterns', updatedPattern);
            const index = this.data.patterns.findIndex(p => p.id === id);
            if (index !== -1) {
                this.data.patterns[index] = result;
            }
            return result;
        } catch (error) {
            console.error('Error updating pattern:', error);
            throw error;
        }
    }

    /**
     * Delete a pattern
     * @param {string} id - Pattern ID
     */
    async deletePattern(id) {
        try {
            await this.deleteData('patterns', id);
            this.data.patterns = this.data.patterns.filter(p => p.id !== id);
            // Also delete associated products
            this.data.products = this.data.products.filter(p => p.pattern_id !== id);
        } catch (error) {
            console.error('Error deleting pattern:', error);
            throw error;
        }
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
        return this.data.products.filter(p => p.pattern_id === patternId);
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
    async addProduct(product) {
        try {
            const result = await this.saveData('products', product);
            this.data.products.push(result);
            return result;
        } catch (error) {
            console.error('Error adding product:', error);
            throw error;
        }
    }

    /**
     * Update an existing product
     * @param {string} id - Product ID
     * @param {Object} updates - Updated fields
     */
    async updateProduct(id, updates) {
        try {
            const product = this.data.products.find(p => p.id === id);
            if (!product) {
                throw new Error('Product not found');
            }
            const updatedProduct = { ...product, ...updates };
            const result = await this.saveData('products', updatedProduct);
            const index = this.data.products.findIndex(p => p.id === id);
            if (index !== -1) {
                this.data.products[index] = result;
            }
            return result;
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    }

    /**
     * Delete a product
     * @param {string} id - Product ID
     */
    async deleteProduct(id) {
        try {
            await this.deleteData('products', id);
            this.data.products = this.data.products.filter(p => p.id !== id);
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
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
    async addColor(color) {
        try {
            const result = await this.saveData('colors', color);
            this.data.colors.push(result);
            return result;
        } catch (error) {
            console.error('Error adding color:', error);
            throw error;
        }
    }

    /**
     * Update an existing color
     * @param {string} id - Color ID
     * @param {Object} updates - Updated fields
     */
    async updateColor(id, updates) {
        try {
            const color = this.data.colors.find(c => c.id === id);
            if (!color) {
                throw new Error('Color not found');
            }
            const updatedColor = { ...color, ...updates };
            const result = await this.saveData('colors', updatedColor);
            const index = this.data.colors.findIndex(c => c.id === id);
            if (index !== -1) {
                this.data.colors[index] = result;
            }
            return result;
        } catch (error) {
            console.error('Error updating color:', error);
            throw error;
        }
    }

    /**
     * Delete a color
     * @param {string} id - Color ID
     */
    async deleteColor(id) {
        try {
            await this.deleteData('colors', id);
            this.data.colors = this.data.colors.filter(c => c.id !== id);
        } catch (error) {
            console.error('Error deleting color:', error);
            throw error;
        }
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
