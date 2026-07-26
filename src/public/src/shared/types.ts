export interface Pattern {
    id: string;
    name: string;
    description: string;
    image: string;
    colors: string[];
}

export interface Product {
    id: string;
    pattern_id: string;
    name: string;
    type: string;
    description: string;
    image: string;
    price: string;
    colors: string[];
}

export interface Color {
    id: string;
    name: string;
    hex: string;
    darkHex: string;
    image: string;
}

export interface AllData {
    patterns: Pattern[];
    products: Product[];
    colors: Color[];
}

export type EntityType = 'patterns' | 'products' | 'colors';

export type WSEventType =
    | 'connection'
    | 'pattern_created'
    | 'pattern_updated'
    | 'pattern_deleted'
    | 'product_created'
    | 'product_updated'
    | 'product_deleted'
    | 'color_created'
    | 'color_updated'
    | 'color_deleted';

export interface WSMessage {
    type: WSEventType;
    data: unknown;
    message?: string;
}

export type ToastType = 'success' | 'error' | 'info';
