const express = require('express');
require('dotenv').config();
const serverless = require('serverless-http');
const cors = require('cors');

// Diagnostic logging
console.log('--- Netlify Function Start ---');

// Import database modules from internal lib folder
// This is much safer for Netlify bundling
const { initializeDatabase } = require('./lib/db');
const apiRoutes = require('./lib/routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Optimized database initialization
// We don't run this on every request to avoid 502 timeouts
// Instead, we provide an explicit init endpoint if needed
app.get('/_init', async (req, res) => {
    try {
        await initializeDatabase();
        res.json({ message: 'Database initialized/verified successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Database init failed', details: error.message });
    }
});

// Health check endpoint
app.get('/_health', (req, res) => {
    res.json({ status: 'ok', database_url_set: !!process.env.DATABASE_URL });
});

// Mount the API routes
app.use('/', apiRoutes);

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error in API:', err);
    res.status(500).json({
        error: 'Internal server error',
        details: err.message
    });
});

// Export the handler for Netlify Functions
module.exports.handler = serverless(app);
