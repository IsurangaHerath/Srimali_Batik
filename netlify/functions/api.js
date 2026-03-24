const express = require('express');
require('dotenv').config();
const serverless = require('serverless-http');
const cors = require('cors');

// Import database modules
let pool, initializeDatabase, apiRoutes;
try {
    const db = require('../../db');
    pool = db.pool;
    initializeDatabase = db.initializeDatabase;
    apiRoutes = require('../../routes/api');
} catch (error) {
    console.error('Failed to import modules:', error);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Initialize DB with a promise to avoid race conditions
let dbInitPromise = null;

app.use(async (req, res, next) => {
    // If modules failed to load, return error
    if (!initializeDatabase || !apiRoutes) {
        return res.status(500).json({ 
            error: 'Server modules failed to load. Check server logs.',
            details: 'initializeDatabase or apiRoutes is undefined'
        });
    }

    if (!dbInitPromise) {
        console.log('Starting database initialization promise...');
        dbInitPromise = initializeDatabase();
    }

    try {
        await dbInitPromise;
        next();
    } catch (error) {
        console.error('Database initialization failed:', error);
        dbInitPromise = null; // Allow retry on next request
        return res.status(500).json({ 
            error: 'Database connection failed', 
            details: error.message 
        });
    }
});

// Mount the API routes
// Note: The netlify.toml redirects /api/* to /.netlify/functions/api/:splat
// So we should mount routes at root level, not at /api
app.use('/', apiRoutes);

// Export the handler for Netlify Functions
module.exports.handler = serverless(app);

