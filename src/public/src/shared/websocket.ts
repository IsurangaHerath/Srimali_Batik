import type { WSMessage, WSEventType } from './types.js';

type EventHandler = (data: unknown) => void;

class WebSocketManager {
    private ws: WebSocket | null = null;
    private handlers = new Map<WSEventType, Set<EventHandler>>();
    private reconnectTimeout = 3000;

    connect(): void {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data) as WSMessage;
                this.handleMessage(message);
            } catch {
                // Ignore malformed messages
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected, reconnecting...');
            setTimeout(() => this.connect(), this.reconnectTimeout);
        };

        this.ws.onerror = () => {
            // Will trigger onclose
        };
    }

    private handleMessage(message: WSMessage): void {
        const handlers = this.handlers.get(message.type);
        if (handlers) {
            handlers.forEach(handler => handler(message.data));
        }
    }

    on(event: WSEventType, handler: EventHandler): () => void {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }
        this.handlers.get(event)!.add(handler);

        return () => {
            this.handlers.get(event)?.delete(handler);
        };
    }

    send(data: unknown): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }
}

export const wsManager = new WebSocketManager();
