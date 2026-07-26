import type { AllData, Pattern, Product, Color } from '../shared/types.js';
import { api } from '../shared/api.js';
import { wsManager } from '../shared/websocket.js';
import { WS_EVENT_TYPES } from '../shared/constants.js';

class DataManager {
    private data: AllData = { patterns: [], products: [], colors: [] };
    private loaded = false;
    private currentPattern: Pattern | null = null;
    private selectedColor: Color | null = null;

    constructor() {
        this.initWebSocket();
    }

    private initWebSocket(): void {
        wsManager.on(WS_EVENT_TYPES.PATTERN_CREATED, (data) => {
            const pattern = data as Pattern;
            if (!this.data.patterns.find(p => p.id === pattern.id)) {
                this.data.patterns.unshift(pattern);
            }
            this.emitChange('patterns');
        });

        wsManager.on(WS_EVENT_TYPES.PATTERN_UPDATED, (data) => {
            const pattern = data as Pattern;
            const idx = this.data.patterns.findIndex(p => p.id === pattern.id);
            if (idx !== -1) this.data.patterns[idx] = pattern;
            this.emitChange('patterns');
        });

        wsManager.on(WS_EVENT_TYPES.PATTERN_DELETED, (data) => {
            const { id } = data as { id: string };
            this.data.patterns = this.data.patterns.filter(p => p.id !== id);
            this.data.products = this.data.products.filter(p => p.pattern_id !== id);
            this.emitChange('patterns');
        });

        wsManager.on(WS_EVENT_TYPES.PRODUCT_CREATED, (data) => {
            const product = data as Product;
            if (!this.data.products.find(p => p.id === product.id)) {
                this.data.products.unshift(product);
            }
            this.emitChange('products');
        });

        wsManager.on(WS_EVENT_TYPES.PRODUCT_UPDATED, (data) => {
            const product = data as Product;
            const idx = this.data.products.findIndex(p => p.id === product.id);
            if (idx !== -1) this.data.products[idx] = product;
            this.emitChange('products');
        });

        wsManager.on(WS_EVENT_TYPES.PRODUCT_DELETED, (data) => {
            const { id } = data as { id: string };
            this.data.products = this.data.products.filter(p => p.id !== id);
            this.emitChange('products');
        });

        wsManager.on(WS_EVENT_TYPES.COLOR_CREATED, (data) => {
            const color = data as Color;
            if (!this.data.colors.find(c => c.id === color.id)) {
                this.data.colors.push(color);
                this.data.colors.sort((a, b) => a.name.localeCompare(b.name));
            }
            this.emitChange('colors');
        });

        wsManager.on(WS_EVENT_TYPES.COLOR_UPDATED, (data) => {
            const color = data as Color;
            const idx = this.data.colors.findIndex(c => c.id === color.id);
            if (idx !== -1) this.data.colors[idx] = color;
            this.emitChange('colors');
        });

        wsManager.on(WS_EVENT_TYPES.COLOR_DELETED, (data) => {
            const { id } = data as { id: string };
            this.data.colors = this.data.colors.filter(c => c.id !== id);
            this.emitChange('colors');
        });
    }

    private changeListeners = new Map<string, Set<() => void>>();

    onChange(type: string, callback: () => void): () => void {
        if (!this.changeListeners.has(type)) {
            this.changeListeners.set(type, new Set());
        }
        this.changeListeners.get(type)!.add(callback);
        return () => this.changeListeners.get(type)?.delete(callback);
    }

    private emitChange(type: string): void {
        this.changeListeners.get(type)?.forEach(cb => cb());
        // Also emit general refresh
        this.changeListeners.get('all')?.forEach(cb => cb());
    }

    async load(): Promise<AllData> {
        if (this.loaded) return this.data;

        try {
            this.data = await api.getAllData();
            this.loaded = true;
        } catch (error) {
            console.error('Failed to load data:', error);
            this.data = { patterns: [], products: [], colors: [] };
        }

        return this.data;
    }

    getPatterns(): Pattern[] { return this.data.patterns; }
    getPatternById(id: string): Pattern | null { return this.data.patterns.find(p => p.id === id) || null; }

    getProducts(): Product[] { return this.data.products; }
    getProductById(id: string): Product | null { return this.data.products.find(p => p.id === id) || null; }
    getProductsByPatternId(patternId: string): Product[] {
        return this.data.products.filter(p => p.pattern_id === patternId);
    }

    getColors(): Color[] { return this.data.colors; }
    getColorById(id: string): Color | null { return this.data.colors.find(c => c.id === id) || null; }

    getCurrentPattern(): Pattern | null { return this.currentPattern; }
    getSelectedColor(): Color | null { return this.selectedColor; }
    setCurrentPattern(pattern: Pattern | null): void { this.currentPattern = pattern; }
    setSelectedColor(color: Color | null): void { this.selectedColor = color; }

    async createPattern(pattern: Omit<Pattern, 'id'> & { id?: string }): Promise<Pattern> {
        const result = await api.create('patterns', pattern as Pattern);
        if (!this.data.patterns.find(p => p.id === result.id)) {
            this.data.patterns.unshift(result);
        }
        return result;
    }

    async createProduct(product: Omit<Product, 'id'> & { id?: string }): Promise<Product> {
        const result = await api.create('products', product as Product);
        if (!this.data.products.find(p => p.id === result.id)) {
            this.data.products.unshift(result);
        }
        return result;
    }

    async createColor(color: Omit<Color, 'id'> & { id?: string }): Promise<Color> {
        const result = await api.create('colors', color as Color);
        if (!this.data.colors.find(c => c.id === result.id)) {
            this.data.colors.push(result);
            this.data.colors.sort((a, b) => a.name.localeCompare(b.name));
        }
        return result;
    }

    async updatePattern(id: string, updates: Partial<Pattern>): Promise<Pattern> {
        const result = await api.update('patterns', id, updates);
        const idx = this.data.patterns.findIndex(p => p.id === id);
        if (idx !== -1) this.data.patterns[idx] = result;
        return result;
    }

    async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
        const result = await api.update('products', id, updates);
        const idx = this.data.products.findIndex(p => p.id === id);
        if (idx !== -1) this.data.products[idx] = result;
        return result;
    }

    async updateColor(id: string, updates: Partial<Color>): Promise<Color> {
        const result = await api.update('colors', id, updates);
        const idx = this.data.colors.findIndex(c => c.id === id);
        if (idx !== -1) this.data.colors[idx] = result;
        return result;
    }

    async deletePattern(id: string): Promise<void> {
        await api.delete('patterns', id);
        this.data.patterns = this.data.patterns.filter(p => p.id !== id);
        this.data.products = this.data.products.filter(p => p.pattern_id !== id);
    }

    async deleteProduct(id: string): Promise<void> {
        await api.delete('products', id);
        this.data.products = this.data.products.filter(p => p.id !== id);
    }

    async deleteColor(id: string): Promise<void> {
        await api.delete('colors', id);
        this.data.colors = this.data.colors.filter(c => c.id !== id);
    }
}

export const dataManager = new DataManager();
