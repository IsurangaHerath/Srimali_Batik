import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

import { initializeDatabase, getDb } from './db.js';
import { addClient, removeClient, broadcastToOthers } from './broadcast.js';
import patternsRouter from './routes/patterns.js';
import productsRouter from './routes/products.js';
import colorsRouter from './routes/colors.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter, writeLimiter } from './middleware/rateLimiter.js';

import type { PatternRow, ProductRow, ColorRow } from './db.js';
import type { WebSocket as WebSocketType } from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== 'production';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan(isDev ? 'dev' : 'combined'));

// Rate limiting
app.use('/api', apiLimiter);
app.use('/api/patterns', writeLimiter);
app.use('/api/products', writeLimiter);
app.use('/api/colors', writeLimiter);

// Vite dev middleware in development
if (isDev) {
    const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'custom',
        root: path.join(__dirname, '..', 'src', 'public'),
    });
    app.use(vite.middlewares);
} else {
    // Serve built static files
    app.use(express.static(path.join(__dirname, '..', '..', 'public', 'dist')));
}

// API — GET /api/all
app.get('/api/all', (req, res) => {
    try {
        const db = getDb();

        const patterns = db.prepare('SELECT * FROM patterns ORDER BY created_at DESC').all();
        const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
        const colors = db.prepare('SELECT * FROM colors ORDER BY name ASC').all();

        res.json({
            patterns: (patterns as PatternRow[]).map(p => ({
                id: p.id,
                name: p.name,
                description: p.description,
                image: p.image,
                colors: JSON.parse(p.colors || '[]'),
            })),
            products: (products as ProductRow[]).map(p => ({
                id: p.id,
                pattern_id: p.pattern_id,
                name: p.name,
                type: p.type,
                description: p.description,
                image: p.image,
                price: p.price,
                colors: JSON.parse(p.colors || '[]'),
            })),
            colors: (colors as ColorRow[]).map(c => ({
                id: c.id,
                name: c.name,
                hex: c.hex,
                darkHex: c.dark_hex,
                image: c.image,
            })),
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Failed to fetch data', details: (error as Error).message });
    }
});

// API routes
app.use('/api/patterns', patternsRouter);
app.use('/api/products', productsRouter);
app.use('/api/colors', colorsRouter);

// Health check
app.get('/api/_health', (_req, res) => {
    res.json({ status: 'ok', local: true, version: '2.0.0' });
});

// Page routes (for dev mode with Vite)
if (isDev) {
    app.get('/', (req, res) => {
        res.status(200).send('Storefront — served by Vite dev server');
    });
    app.get('/admin', (req, res) => {
        res.status(200).send('Admin panel — served by Vite dev server');
    });
}

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// WebSocket
wss.on('connection', (ws: WebSocketType) => {
    addClient(ws);

    ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to Srimali Batik local server',
    }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            broadcastToOthers(ws, data);
        } catch {
            // Ignore malformed messages
        }
    });

    ws.on('close', () => {
        removeClient(ws);
    });
});

// Startup
function start(): void {
    try {
        initializeDatabase();

        server.listen(PORT, () => {
            console.log('\n========================================');
            console.log('Srimali Batik — Local Server Ready!');
            console.log(`   Storefront : http://localhost:${PORT}`);
            console.log(`   Admin Panel: http://localhost:${PORT}/admin`);
            console.log('========================================\n');
        });
    } catch (error) {
        console.error('Failed to start server:', (error as Error).message);
        process.exit(1);
    }
}

start();
