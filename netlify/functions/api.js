const express = require('express');
require('dotenv').config();
const serverless = require('serverless-http');
const cors = require('cors');
const path = require('path');

// Diagnostic logging for Netlify environment
console.log('--- Netlify Function Initialization ---');
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

// Import database modules with absolute-like paths for better bundling
let pool, initializeDatabase, apiRoutes;
try {
    // Netlify functions can be picky about relative paths
    // We try to require from the root relative to this function
    const dbPath = path.resolve(__dirname, '../../db');
    const routesPath = path.resolve(__dirname, '../../routes/api');
    
    console.log('Resolved db path:', dbPath);
    console.log('Resolved routes path:', routesPath);
    
    const db = require(dbPath);
    pool = db.pool;
    initializeDatabase = db.initializeDatabase;
    apiRoutes = require(routesPath);
    
    console.log('Modules imported successfully');
} catch (error) {
    console.error('CRITICAL: Failed to import modules:', error);
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
            error: 'Server modules failed to load. Check Netlify logs.',
            details: 'Could not load db or routes modules'
        });
    }

    if (!dbInitPromise) {
        console.log('Attempting to initialize database...');
        if (!process.env.DATABASE_URL) {
            console.error('ERROR: DATABASE_URL is missing in Netlify environment variables!');
            return res.status(500).json({
                error: 'Database configuration missing',
                details: 'DATABASE_URL environment variable is not set'
            });
        }
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

// Health check endpoint
app.get('/_health', (req, res) => {
    res.json({ status: 'ok', db: !!pool });
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
