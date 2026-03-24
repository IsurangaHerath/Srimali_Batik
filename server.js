/**
 * Main Server File for Srimali Batik (Local Development)
 * Updated to use the shared library folder
 */

const express = require('express');
require('dotenv').config();
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');

// Import from the shared library folder used by Netlify Functions
const { initializeDatabase } = require('./netlify/functions/lib/db');
const apiRoutes = require('./netlify/functions/lib/routes');
const { addClient, removeClient, broadcastToOthers } = require('./netlify/functions/lib/broadcast');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes - mount directly at /api to match Netlify redirects
app.use('/api', apiRoutes);

// Health check and init for local dev
app.get('/api/_health', (req, res) => {
    res.json({ status: 'ok', local: true });
});

app.get('/api/_init', async (req, res) => {
    try {
        await initializeDatabase();
        res.json({ message: 'Local database initialized successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve admin.html for admin path
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ============================
// WebSocket for Real-time Sync
// ============================

wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');
    addClient(ws);
    
    ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to Srimali Batik real-time sync'
    }));
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            broadcastToOthers(ws, data);
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    });
    
    ws.on('close', () => {
        removeClient(ws);
    });
});

// ============================
// Start Server
// ============================

async function startServer() {
    try {
        // We don't force init on start to avoid blocking
        server.listen(PORT, () => {
            console.log('\n========================================');
            console.log('🚀 Local Server Ready!');
            console.log(`   🌐 Site: http://localhost:${PORT}`);
            console.log(`   📊 Admin: http://localhost:${PORT}/admin`);
            console.log('========================================\n');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
}

startServer();
