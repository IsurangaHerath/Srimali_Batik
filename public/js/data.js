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
            name: 'Red Labyrinth',
            image: 'https://res.cloudinary.com/dpdtltd4f/image/upload/v1774200452/design_pattern_1_jhysuj.png',
            description: 'Intricate red labyrinth batik pattern, handcrafted with traditional techniques.',
            colors: ['red', 'blue', 'green', 'purple']
        },
        {
            id: 'p2',
            name: 'Peacock Majesty',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
            description: 'Majestic peacock inspired traditional Sri Lankan batik',
            colors: ['blue', 'green', 'gold']
        },
        {
            id: 'p3',
            name: 'Elephant Heritage',
            image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
            description: 'Gentle elephant design representing Sri Lankan culture',
            colors: ['green', 'gold', 'black']
        },
        {
            id: 'p4',
            name: 'Lotus Serenity',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
            description: 'Symbol of purity and enlightenment in batik art',
            colors: ['purple', 'pink', 'blue']
        },
        {
            id: 'p5',
            name: 'Ocean Waves',
            image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
            description: 'Inspired by the beautiful Indian ocean waves',
            colors: ['blue', 'green', 'gold']
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
            price: '15,000 LKR'
        },
        {
            id: 'prod2',
            pattern_id: 'p1',
            name: 'Floral Frock',
            type: 'Frock',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=300&fit=crop',
            description: 'Elegant frock with traditional floral patterns',
            price: '8,500 LKR'
        },
        {
            id: 'prod3',
            pattern_id: 'p2',
            name: 'Peacock Saree',
            type: 'Saree',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=300&fit=crop',
            description: 'Stunning saree featuring peacock batik design',
            price: '18,000 LKR'
        },
        {
            id: 'prod4',
            pattern_id: 'p3',
            name: 'Elephant Sarong',
            type: 'Sarong',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=300&fit=crop',
            description: 'Comfortable sarong with elephant heritage design',
            price: '4,500 LKR'
        }
    ],
    colors: [
        { id: 'green', name: 'Green', hex: '#2d5a27', darkHex: '#1e4d1a' },
        { id: 'blue', name: 'Blue', hex: '#1e3a5f', darkHex: '#152a45' },
        { id: 'red', name: 'Red', hex: '#8b2942', darkHex: '#6d2034' },
        { id: 'purple', name: 'Purple', hex: '#4a3068', darkHex: '#3a2552' },
        { id: 'gold', name: 'Gold', hex: '#b8860b', darkHex: '#8b6914' },
        { id: 'black', name: 'Black', hex: '#2d2d2d', darkHex: '#1a1a1a' },
        { id: 'pink', name: 'Pink', hex: '#d63384', darkHex: '#a82667' }
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
        this.dataLoaded = false; // Flag to track data loading status
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
                    patterns: (newData.patterns && newData.patterns.length > 0) ? newData.patterns : defaultData.patterns,
                    products: (newData.products && newData.products.length > 0) ? newData.products : defaultData.products,
                    colors: (newData.colors && newData.colors.length > 0) ? newData.colors : defaultData.colors
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
                console.log('[DEBUG] WebSocket pattern_created received for:', message.data.id);
                // Check if pattern already exists to prevent duplicates
                const existingPatternIndex = this.data.patterns.findIndex(p => p.id === message.data.id);
                if (existingPatternIndex === -1) {
                    console.log('[DEBUG] Pattern not in local array, adding from WebSocket');
                    this.data.patterns.push(message.data);
                } else {
                    console.log('[DEBUG] Pattern already exists in local array, skipping WebSocket add');
                }
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
                console.log('[DEBUG] WebSocket pattern_deleted received for:', message.data.id);
                // Check if pattern exists before trying to delete (prevents double delete)
                const patternToDelete = this.data.patterns.find(p => p.id === message.data.id);
                if (patternToDelete) {
                    console.log('[DEBUG] Pattern exists in local array, deleting from WebSocket');
                    this.data.patterns = this.data.patterns.filter(p => p.id !== message.data.id);
                    this.data.products = this.data.products.filter(p => p.pattern_id !== message.data.id);
                    console.log('[DEBUG] Patterns after WebSocket delete:', this.data.patterns.map(p => p.id));
                } else {
                    console.log('[DEBUG] Pattern already deleted, skipping WebSocket delete');
                }
                if (typeof uiRenderer !== 'undefined') {
                    uiRenderer.renderPatternsGrid();
                }
                break;
            case 'product_created':
                console.log('[DEBUG] WebSocket product_created received for:', message.data.id);
                // Check if product already exists to prevent duplicates
                const existingProductIndex = this.data.products.findIndex(p => p.id === message.data.id);
                if (existingProductIndex === -1) {
                    console.log('[DEBUG] Product not in local array, adding from WebSocket');
                    this.data.products.push(message.data);
                } else {
                    console.log('[DEBUG] Product already exists in local array, skipping WebSocket add');
                }
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
                console.log('[DEBUG] WebSocket product_deleted received for:', message.data.id);
                // Check if product exists before trying to delete (prevents double delete)
                const productToDelete = this.data.products.find(p => p.id === message.data.id);
                if (productToDelete) {
                    console.log('[DEBUG] Product exists in local array, deleting from WebSocket');
                    this.data.products = this.data.products.filter(p => p.id !== message.data.id);
                    console.log('[DEBUG] Products after WebSocket delete:', this.data.products.map(p => p.id));
                } else {
                    console.log('[DEBUG] Product already deleted, skipping WebSocket delete');
                }
                if (typeof adminPanel !== 'undefined') {
                    adminPanel.renderProductsList();
                }
                break;
            case 'color_created':
                // Check if color already exists to prevent duplicates
                if (!this.data.colors.find(c => c.id === message.data.id)) {
                    this.data.colors.push(message.data);
                }
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
                patterns: (data.patterns && data.patterns.length > 0) ? data.patterns : defaultData.patterns,
                products: (data.products && data.products.length > 0) ? data.products : defaultData.products,
                colors: (data.colors && data.colors.length > 0) ? data.colors : defaultData.colors
            };
            this.dataLoaded = true;
        } catch (error) {
            console.error('Error loading data from API:', error);
            // Fallback to default data if API fails
            this.data = defaultData;
            this.dataLoaded = true;
        }
    }

    /**
     * Save data to API (create or update)
     * @param {string} type - The type of data (patterns, products, colors)
     * @param {Object} data - The data to save
     */
    async saveData(type, data) {
        try {
            let response;
            const isUpdate = data.id && this.data[type].find(item => item.id === data.id);
            
            if (isUpdate) {
                // Update existing item
                console.log(`Updating ${type}/${data.id}...`);
                response = await fetch(`${CONFIG.API_BASE_URL}/${type}/${data.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
            } else {
                // Create new item
                console.log(`Creating new ${type}...`);
                response = await fetch(`${CONFIG.API_BASE_URL}/${type}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
            }
            
            const responseData = await response.json().catch(() => ({}));
            console.log(`Save response status: ${response.status}`, responseData);
            
            if (!response.ok) {
                console.error('Save API error response:', responseData);
                let errorMessage = `Failed to save ${type}`;
                if (responseData.details) {
                    errorMessage = responseData.details;
                } else if (responseData.error) {
                    errorMessage = responseData.error;
                } else if (responseData.message) {
                    errorMessage = responseData.message;
                } else if (response.status === 409) {
                    errorMessage = 'Item with this ID already exists';
                } else if (response.status === 400) {
                    errorMessage = 'Invalid request. Please check the data.';
                } else if (response.status === 404) {
                    errorMessage = 'Item not found';
                } else if (response.status === 500) {
                    errorMessage = 'Server error. Please check database connection.';
                } else if (response.status === 0) {
                    errorMessage = 'Network error. Please check if the server is running.';
                }
                throw new Error(errorMessage);
            }
            
            return responseData;
        } catch (error) {
            console.error(`Error saving ${type} to API:`, error);
            // Check if it's a network error (TypeError with 'Failed to fetch' or similar)
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error. Please check if the server is running and try again.');
            }
            // Re-throw with more context
            throw new Error(`Error saving ${type}: ${error.message}`);
        }
    }

    /**
     * Delete data from API
     * @param {string} type - The type of data (patterns, products, colors)
     * @param {string} id - The ID of the item to delete
     */
    async deleteData(type, id) {
        try {
            console.log(`Deleting ${type}/${id} from API...`);
            const url = `${CONFIG.API_BASE_URL}/${type}/${id}`;
            console.log(`DELETE request URL:`, url);
            
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const responseData = await response.json().catch(() => ({}));
            console.log(`Delete response status: ${response.status}`, responseData);
            
            if (!response.ok) {
                console.error('Delete API error response:', responseData);
                // Provide more detailed error message
                let errorMessage = `Failed to delete ${type}`;
                if (responseData.details) {
                    errorMessage = responseData.details;
                } else if (responseData.error) {
                    errorMessage = responseData.error;
                } else if (responseData.message) {
                    errorMessage = responseData.message;
                } else if (response.status === 404) {
                    errorMessage = `${type.slice(0, -1)} not found`;
                } else if (response.status === 500) {
                    errorMessage = 'Server error. Please check database connection.';
                } else if (response.status === 0) {
                    errorMessage = 'Network error. Please check if the server is running.';
                }
                throw new Error(errorMessage);
            }
            
            return responseData;
        } catch (error) {
            console.error(`Error deleting ${type} from API:`, error);
            // Check if it's a network error (TypeError with 'Failed to fetch' or similar)
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error. Please check if the server is running and try again.');
            }
            // Re-throw with more context
            throw new Error(`Error deleting ${type}: ${error.message}`);
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
            console.log('[DEBUG] deletePattern called for id:', id);
            const patternsBefore = this.data.patterns.map(p => p.id);
            const productsBefore = this.data.products.map(p => p.id);
            console.log('[DEBUG] Patterns before delete:', patternsBefore);
            console.log('[DEBUG] Products before delete:', productsBefore);
            
            await this.deleteData('patterns', id);
            console.log('[DEBUG] deleteData completed, now filtering local arrays');
            
            // Filter out the deleted pattern
            this.data.patterns = this.data.patterns.filter(p => p.id !== id);
            console.log('[DEBUG] Patterns after delete:', this.data.patterns.map(p => p.id));
            
            // Also delete associated products - but only those with matching pattern_id
            const initialProductsCount = this.data.products.length;
            this.data.products = this.data.products.filter(p => {
                const shouldKeep = p.pattern_id !== id;
                if (!shouldKeep) {
                    console.log('[DEBUG] Removing product:', p.id, 'due to pattern_id:', p.pattern_id, '=== target id:', id);
                }
                return shouldKeep;
            });
            
            console.log('[DEBUG] Products after delete:', this.data.products.map(p => p.id));
            console.log('[DEBUG] Products deleted:', initialProductsCount - this.data.products.length);
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
            console.log('[DEBUG] addProduct called with:', product.id, product.name);
            const result = await this.saveData('products', product);
            console.log('[DEBUG] addProduct saveData completed, pushing to local array:', result.id);
            this.data.products.push(result);
            console.log('[DEBUG] addProduct completed. Total products now:', this.data.products.length);
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

            // Ensure patternId is used for the API call, not pattern_id
            if (updatedProduct.pattern_id && !updatedProduct.patternId) {
                updatedProduct.patternId = updatedProduct.pattern_id;
            }
            delete updatedProduct.pattern_id;

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
            console.log('[DEBUG] deleteProduct called for id:', id);
            const productsBefore = this.data.products.map(p => p.id);
            console.log('[DEBUG] Products before delete:', productsBefore);
            
            await this.deleteData('products', id);
            console.log('[DEBUG] deleteData completed, now filtering local array');
            
            // Filter out the deleted product - using explicit ID check
            const initialLength = this.data.products.length;
            this.data.products = this.data.products.filter(p => {
                const shouldKeep = p.id !== id;
                console.log('[DEBUG] Checking product:', p.id, 'shouldKeep:', shouldKeep, 'targetId:', id);
                return shouldKeep;
            });
            
            console.log('[DEBUG] Products after delete:', this.data.products.map(p => p.id));
            console.log('[DEBUG] Deleted count:', initialLength - this.data.products.length);
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
