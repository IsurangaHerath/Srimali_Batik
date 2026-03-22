const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const { pool, initializeDatabase } = require('../../db');
const apiRoutes = require('../../routes/api');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize DB on the first request
let dbInitialized = false;

app.use(async (req, res, next) => {
    if (!dbInitialized) {
        try {
            await initializeDatabase();
            dbInitialized = true;
        } catch (error) {
            console.error('Database initialization failed:', error);
        }
    }
    next();
});

// Mount the API routes
// Note: In serverless, the base path depends on how it's called.
// We'll use a rewrite in netlify.toml to map /api/* to this function.
app.use('/api', apiRoutes);

// Export the handler for Netlify Functions
module.exports.handler = serverless(app);
