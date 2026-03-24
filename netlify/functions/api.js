const express = require('express');
require('dotenv').config();
const serverless = require('serverless-http');
const cors = require('cors');

// Import database modules
const { initializeDatabase } = require('./lib/db');
const apiRoutes = require('./lib/routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Log all incoming requests to help debug 404s
app.use((req, res, next) => {
    console.log(`[API Request] ${req.method} ${req.path}`);
    next();
});

// Diagnostic Endpoints - Top Priority
app.get('/_health', (req, res) => {
    res.json({ 
        status: 'ok', 
        database_url_set: !!process.env.DATABASE_URL,
        path: req.path,
        env: process.env.NODE_ENV
    });
});

app.get('/_init', async (req, res) => {
    try {
        if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing');
        await initializeDatabase();
        res.json({ message: 'Database schema verified/initialized' });
    } catch (error) {
        console.error('Init Error:', error);
        res.status(500).json({ error: 'Database init failed', details: error.message });
    }
});

// Mount API routes at multiple levels to ensure it matches Netlify's splat behavior
app.use('/.netlify/functions/api', apiRoutes);
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// Catch-all for API 404s
app.use((req, res) => {
    console.warn(`[API 404] No route found for: ${req.method} ${req.path}`);
    res.status(404).json({ 
        error: 'API Route Not Found', 
        path: req.path,
        tip: 'Check if you are using the correct endpoint' 
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('[API CRASH]', err);
    res.status(500).json({
        error: 'Internal Server Error',
        details: err.message
    });
});

module.exports.handler = serverless(app);
