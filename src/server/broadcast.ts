import WebSocket from 'ws';

const clients = new Set<WebSocket>();

export function addClient(ws: WebSocket): void {
    clients.add(ws);
}

export function removeClient(ws: WebSocket): void {
    clients.delete(ws);
}

export function broadcastToOthers(sender: WebSocket, data: unknown): void {
    const payload = JSON.stringify(data);
    clients.forEach(client => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}

export function broadcastToAll(data: unknown): void {
    const payload = JSON.stringify(data);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}
