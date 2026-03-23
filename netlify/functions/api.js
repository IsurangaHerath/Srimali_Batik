const express = require('express');
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

// Initialize DB on the first request
let dbInitialized = false;
let dbInitError = null;

app.use(async (req, res, next) => {
    if (dbInitError) {
        console.error('Database initialization previously failed:', dbInitError);
        return res.status(500).json({ 
            error: 'Database connection failed', 
            details: dbInitError.message 
        });
    }
    
    if (!dbInitialized) {
        try {
            console.log('Initializing database...');
            await initializeDatabase();
            dbInitialized = true;
            console.log('Database initialized successfully');
        } catch (error) {
            dbInitError = error;
            console.error('Database initialization failed:', error);
            return res.status(500).json({ 
                error: 'Database connection failed', 
                details: error.message 
            });
        }
    }
    next();
});

// Mount the API routes
// Note: The netlify.toml redirects /api/* to /.netlify/functions/api/:splat
// So we should mount routes at root level, not at /api
app.use('/', apiRoutes);

// Export the handler for Netlify Functions
module.exports.handler = serverless(app);
