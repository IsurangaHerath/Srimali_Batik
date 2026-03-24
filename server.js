/**
 * Main Server File for Srimali Batik
 * Sets up Express server, WebSocket for real-time sync, and API routes
 */

const express = require('express');
require('dotenv').config();
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./db');
const apiRoutes = require('./routes/api');
const { addClient, removeClient, broadcastToOthers } = require('./broadcast');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', apiRoutes);

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
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to Srimali Batik real-time sync'
    }));
    
    // Handle incoming messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received message:', data);
            
            // Broadcast to all other clients
            broadcastToOthers(ws, data);
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    });
    
    // Handle client disconnect
    ws.on('close', () => {
        console.log('WebSocket client disconnected');
        removeClient(ws);
    });
    
    // Handle errors
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        removeClient(ws);
    });
});

// ============================
// Initialize Database and Start Server
// ============================

async function startServer() {
    try {
        // Initialize database schema
        await initializeDatabase();
        console.log('Database initialized successfully');
        
        // Start server with error handling for port conflicts
        server.listen(PORT, () => {
            console.log('\n========================================');
            console.log('🚀 Server Ready! Open in your browser:');
            console.log('========================================');
            console.log(`   🌐 Main Page:   http://localhost:${PORT}`);
            console.log(`   📊 Admin Panel: http://localhost:${PORT}/admin`);
            console.log('========================================\n');
            console.log(`WebSocket server ready for real-time sync`);
        }).on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
                console.error(`   Another process is using port ${PORT}.`);
                console.error(`   To fix this:`);
                console.error(`   1. Find the process: netstat -ano | findstr :${PORT}`);
                console.error(`   2. Kill it: taskkill /PID <PID> /F`);
                console.error(`   Or change the port in .env file`);
                process.exit(1);
            } else {
                console.error('Server error:', err);
                process.exit(1);
            }
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
