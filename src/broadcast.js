/**
 * WebSocket Broadcast Module
 * Keeps a registry of connected clients and provides broadcast helpers.
 * Used for real-time sync between admin panel and public storefront.
 */

const clients = new Set();

function addClient(ws) {
    clients.add(ws);
}

function removeClient(ws) {
    clients.delete(ws);
}

/**
 * Broadcast a message to all connected clients except the sender.
 */
function broadcastToOthers(sender, data) {
    const payload = JSON.stringify(data);
    clients.forEach(client => {
        if (client !== sender && client.readyState === 1) {
            client.send(payload);
        }
    });
}

/**
 * Broadcast a message to ALL connected clients (including sender).
 * Used by API routes to notify all open tabs of data changes.
 */
function broadcastToAll(data) {
    const payload = JSON.stringify(data);
    clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(payload);
        }
    });
}

module.exports = { addClient, removeClient, broadcastToOthers, broadcastToAll };
