/**
 * WebSocket Broadcast Module
 * Handles broadcasting messages to all connected WebSocket clients
 * Updated to be safe for serverless environments
 */

// Store connected clients
const clients = new Set();

/**
 * Add a client to the set
 * @param {WebSocket} ws - WebSocket client
 */
function addClient(ws) {
    if (clients) clients.add(ws);
}

/**
 * Remove a client from the set
 * @param {WebSocket} ws - WebSocket client
 */
function removeClient(ws) {
    if (clients) clients.delete(ws);
}

/**
 * Broadcast message to all connected clients except the sender
 * @param {WebSocket} sender - The sender WebSocket
 * @param {Object} data - The data to broadcast
 */
function broadcastToOthers(sender, data) {
    if (!clients) return;
    clients.forEach((client) => {
        if (client !== sender && client.readyState === 1) { // WebSocket.OPEN = 1
            try {
                client.send(JSON.stringify(data));
            } catch (e) {
                console.error('Failed to send message to client', e);
            }
        }
    });
}

/**
 * Broadcast message to all connected clients
 * @param {Object} data - The data to broadcast
 */
function broadcastToAll(data) {
    if (!clients) return;
    clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN = 1
            try {
                client.send(JSON.stringify(data));
            } catch (e) {
                console.error('Failed to send message to client', e);
            }
        }
    });
    
    // In serverless environments, we might want to log that broadcast was called
    if (process.env.NETLIFY) {
        console.log('Broadcast called in serverless environment:', data.type);
    }
}

module.exports = {
    addClient,
    removeClient,
    broadcastToOthers,
    broadcastToAll
};
