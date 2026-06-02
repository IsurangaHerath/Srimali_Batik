/**
 * Srimali Batik — Local Server
 * Fully local-only. No cloud services required.
 * Database: SQLite (auto-created at data/srimali.db)
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');

const { initializeDatabase } = require('./src/db');
const { addClient, removeClient, broadcastToOthers } = require('./src/broadcast');

// Route modules
const patternsRouter = require('./src/routes/patterns');
const productsRouter = require('./src/routes/products');
const colorsRouter  = require('./src/routes/colors');

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// ────────────────────────────────────────────────────────────
// Middleware
// ────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ────────────────────────────────────────────────────────────
// API — GET /api/all (fetch all data for the frontend)
// ────────────────────────────────────────────────────────────

app.get('/api/all', (req, res) => {
    try {
        const { getDb } = require('./src/db');
        const db = getDb();

        const patterns = db.prepare('SELECT * FROM patterns ORDER BY created_at DESC').all();
        const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
        const colors   = db.prepare('SELECT * FROM colors   ORDER BY name ASC').all();

        res.json({
            patterns: patterns.map(p => ({
                id:          p.id,
                name:        p.name,
                description: p.description,
                image:       p.image,
                colors:      JSON.parse(p.colors || '[]')
            })),
            products: products.map(p => ({
                id:          p.id,
                pattern_id:  p.pattern_id,
                name:        p.name,
                type:        p.type,
                description: p.description,
                image:       p.image,
                price:       p.price,
                colors:      JSON.parse(p.colors || '[]')
            })),
            colors: colors.map(c => ({
                id:      c.id,
                name:    c.name,
                hex:     c.hex,
                darkHex: c.dark_hex,
                image:   c.image
            }))
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Failed to fetch data', details: error.message });
    }
});

// ────────────────────────────────────────────────────────────
// API — CRUD routes
// ────────────────────────────────────────────────────────────

app.use('/api/patterns', patternsRouter);
app.use('/api/products', productsRouter);
app.use('/api/colors',   colorsRouter);

// ────────────────────────────────────────────────────────────
// API — Health check
// ────────────────────────────────────────────────────────────

app.get('/api/_health', (req, res) => {
    res.json({ status: 'ok', local: true, version: '2.0.0' });
});

// ────────────────────────────────────────────────────────────
// Page routes
// ────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ────────────────────────────────────────────────────────────
// WebSocket — real-time sync between admin & storefront tabs
// ────────────────────────────────────────────────────────────

wss.on('connection', (ws) => {
    addClient(ws);

    ws.send(JSON.stringify({
        type:    'connection',
        message: 'Connected to Srimali Batik local server'
    }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            broadcastToOthers(ws, data);
        } catch (error) {
            // Ignore malformed messages
        }
    });

    ws.on('close', () => {
        removeClient(ws);
    });
});

// ────────────────────────────────────────────────────────────
// Startup
// ────────────────────────────────────────────────────────────

function start() {
    try {
        // Initialize SQLite tables (creates DB file if it doesn't exist)
        initializeDatabase();

        server.listen(PORT, () => {
            console.log('\n========================================');
            console.log('🦋 Srimali Batik — Local Server Ready!');
            console.log(`   🌐 Storefront : http://localhost:${PORT}`);
            console.log(`   📊 Admin Panel: http://localhost:${PORT}/admin`);
            console.log('========================================\n');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

start();
