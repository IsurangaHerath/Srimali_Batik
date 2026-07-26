import type { AllData, EntityType, Pattern, Product, Color } from './types.js';
import { API_BASE_URL } from './constants.js';

class ApiClient {
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: { 'Content-Type': 'application/json' },
            ...options,
        });

        const data = await response.json().catch(() => ({})) as T & { error?: string; details?: unknown };

        if (!response.ok) {
            throw new Error(data.error || `Request failed (${response.status})`);
        }

        return data as T;
    }

    async getAllData(): Promise<AllData> {
        return this.request<AllData>('/all');
    }

    async create<T extends Pattern | Product | Color>(type: EntityType, data: T): Promise<T> {
        return this.request<T>(`/${type}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async update<T extends Pattern | Product | Color>(type: EntityType, id: string, data: Partial<T>): Promise<T> {
        return this.request<T>(`/${type}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async delete(type: EntityType, id: string): Promise<{ message: string; id: string }> {
        return this.request(`/${type}/${id}`, { method: 'DELETE' });
    }
}

export const api = new ApiClient();
