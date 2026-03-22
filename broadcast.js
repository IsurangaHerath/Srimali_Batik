/**
 * WebSocket Broadcast Module
 * Handles broadcasting messages to all connected WebSocket clients
 */

// Store connected clients
const clients = new Set();

/**
 * Add a client to the set
 * @param {WebSocket} ws - WebSocket client
 */
function addClient(ws) {
    clients.add(ws);
}

/**
 * Remove a client from the set
 * @param {WebSocket} ws - WebSocket client
 */
function removeClient(ws) {
    clients.delete(ws);
}

/**
 * Broadcast message to all connected clients except the sender
 * @param {WebSocket} sender - The sender WebSocket
 * @param {Object} data - The data to broadcast
 */
function broadcastToOthers(sender, data) {
    clients.forEach((client) => {
        if (client !== sender && client.readyState === 1) { // WebSocket.OPEN = 1
            client.send(JSON.stringify(data));
        }
    });
}

/**
 * Broadcast message to all connected clients
 * @param {Object} data - The data to broadcast
 */
function broadcastToAll(data) {
    clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN = 1
            client.send(JSON.stringify(data));
        }
    });
}

module.exports = {
    addClient,
    removeClient,
    broadcastToOthers,
    broadcastToAll
};
