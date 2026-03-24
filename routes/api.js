/**
 * API Routes for Srimali Batik
 * Handles CRUD operations for patterns, products, and colors
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { broadcastToAll } = require('../broadcast');

// ============================
// PATTERNS API
// ============================

// Get all patterns
router.get('/patterns', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM patterns ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching patterns:', error);
        res.status(500).json({ error: 'Failed to fetch patterns' });
    }
});

// Get pattern by ID
router.get('/patterns/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM patterns WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pattern not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching pattern:', error);
        res.status(500).json({ error: 'Failed to fetch pattern' });
    }
});

// Create new pattern
router.post('/patterns', async (req, res) => {
    try {
        const { id, name, description, image, colors } = req.body;
        
        if (!id || !name) {
            return res.status(400).json({ error: 'ID and name are required' });
        }
        
        const result = await pool.query(
            'INSERT INTO patterns (id, name, description, image, colors) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [id, name, description || '', image || '', JSON.stringify(colors || [])]
        );
        
        res.status(201).json(result.rows[0]);
        
        // Broadcast to all connected clients (wrapped in try-catch for serverless compatibility)
        try {
            broadcastToAll({
                type: 'pattern_created',
                data: result.rows[0]
            });
        } catch (e) {
            console.log('Broadcast skipped in serverless environment');
        }
    } catch (error) {
        console.error('Error creating pattern:', error);
        if (error.code === '23505') {
            res.status(409).json({ error: 'Pattern with this ID already exists' });
        } else {
            res.status(500).json({ error: 'Failed to create pattern' });
        }
    }
});

// Update pattern
router.put('/patterns/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, image, colors } = req.body;
        
        const result = await pool.query(
            'UPDATE patterns SET name = $1, description = $2, image = $3, colors = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
            [name, description, image, JSON.stringify(colors || []), id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pattern not found' });
        }
        
        res.json(result.rows[0]);
        
        // Broadcast to all connected clients (wrapped in try-catch for serverless compatibility)
        try {
            broadcastToAll({
                type: 'pattern_updated',
                data: result.rows[0]
            });
        } catch (e) {
            console.log('Broadcast skipped in serverless environment');
        }
    } catch (error) {
        console.error('Error updating pattern:', error);
        res.status(500).json({ error: 'Failed to update pattern' });
    }
});

// Delete pattern
router.delete('/patterns/:id', async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        const { id } = req.params;
        
        // Start transaction
        await client.query('BEGIN');
        
        // Delete the pattern (CASCADE will automatically delete associated products)
        const result = await client.query('DELETE FROM patterns WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Pattern not found' });
        }
        
        // Commit transaction
        await client.query('COMMIT');
        
        res.json({ message: 'Pattern deleted successfully', pattern: result.rows[0] });
        
        // Broadcast to all connected clients (wrapped in try-catch for serverless compatibility)
        try {
            broadcastToAll({
                type: 'pattern_deleted',
                data: { id }
            });
        } catch (e) {
            console.log('Broadcast skipped in serverless environment');
        }
    } catch (error) {
        // Rollback transaction on error
        if (client) {
            try {
                await client.query('ROLLBACK');
            } catch (rbError) {
                console.error('Rollback failed:', rbError);
            }
        }
        console.error('Error deleting pattern:', error);
        res.status(500).json({
            error: 'Failed to delete pattern',
            details: error.message,
            code: error.code
        });
    } finally {
        if (client) {
            client.release();
        }
    }
});

// ============================
// PRODUCTS API
// ============================

// Get all products
router.get('/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get products by pattern ID
router.get('/products/pattern/:patternId', async (req, res) => {
    try {
        const { patternId } = req.params;
        const result = await pool.query('SELECT * FROM products WHERE pattern_id = $1 ORDER BY created_at DESC', [patternId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching products by pattern:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get product by ID
router.get('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Create new product
router.post('/products', async (req, res) => {
    try {
        const { id, patternId, name, type, description, image, price, colorImages } = req.body;
        
        if (!id || !patternId || !name) {
            return res.status(400).json({ error: 'ID, patternId, and name are required' });
        }
        
        const result = await pool.query(
            'INSERT INTO products (id, pattern_id, name, type, description, image, price, color_images) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [id, patternId, name, type || '', description || '', image || '', price || '', JSON.stringify(colorImages || {})]
        );
        
        res.status(201).json(result.rows[0]);
        
        // Broadcast to all connected clients (wrapped in try-catch for serverless compatibility)
        try {
            broadcastToAll({
                type: 'product_created',
                data: result.rows[0]
            });
        } catch (e) {
            console.log('Broadcast skipped in serverless environment');
        }
    } catch (error) {
        console.error('Error creating product:', error);
        if (error.code === '23505') {
            res.status(409).json({ error: 'Product with this ID already exists' });
        } else if (error.code === '23503') {
            res.status(400).json({ error: 'Invalid pattern ID' });
        } else {
            res.status(500).json({ error: 'Failed to create product' });
        }
    }
});

// Update product
router.put('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { patternId, name, type, description, image, price, colorImages } = req.body;
        
        const result = await pool.query(
            'UPDATE products SET pattern_id = $1, name = $2, type = $3, description = $4, image = $5, price = $6, color_images = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
            [patternId, name, type, description, image, price, JSON.stringify(colorImages || {}), id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json(result.rows[0]);
        
        // Broadcast to all connected clients (wrapped in try-catch for serverless compatibility)
        try {
            broadcastToAll({
                type: 'product_updated',
                data: result.rows[0]
            });
        } catch (e) {
            console.log('Broadcast skipped in serverless environment');
        }
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product
router.delete('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json({ message: 'Product deleted successfully', product: result.rows[0] });
        
        // Broadcast to all connected clients (wrapped in try-catch for serverless compatibility)
        try {
            broadcastToAll({
                type: 'product_deleted',
                data: { id }
            });
        } catch (e) {
            console.log('Broadcast skipped in serverless environment');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// ============================
// COLORS API
// ============================

// Get all colors
router.get('/colors', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM colors ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching colors:', error);
        res.status(500).json({ error: 'Failed to fetch colors' });
    }
});

// Get color by ID
router.get('/colors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM colors WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Color not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching color:', error);
        res.status(500).json({ error: 'Failed to fetch color' });
    }
});

// Create new color
router.post('/colors', async (req, res) => {
    try {
        const { id, name, hex, darkHex, image } = req.body;
        
        if (!id || !name || !hex || !darkHex) {
            return res.status(400).json({ error: 'ID, name, hex, and darkHex are required' });
        }
        
        const result = await pool.query(
            'INSERT INTO colors (id, name, hex, dark_hex, image) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [id, name, hex, darkHex, image || '']
        );
        
        res.status(201).json(result.rows[0]);
        
        // Broadcast to all connected clients (wrapped in try-catch for serverless compatibility)
        try {
            broadcastToAll({
                type: 'color_created',
                data: result.rows[0]
            });
        } catch (e) {
            console.log('Broadcast skipped in serverless environment');
        }
    } catch (error) {
        console.error('Error creating color:', error);
        if (error.code === '23505') {
            res.status(409).json({ error: 'Color with this ID already exists' });
        } else {
            res.status(500).json({ error: 'Failed to create color' });
        }
    }
});

// Update color
router.put('/colors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, hex, darkHex, image } = req.body;
        
        const result = await pool.query(
            'UPDATE colors SET name = $1, hex = $2, dark_hex = $3, image = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
            [name, hex, darkHex, image, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Color not found' });
        }
        
        res.json(result.rows[0]);
        
        // Broadcast to all connected clients (wrapped in try-catch for serverless compatibility)
        try {
            broadcastToAll({
                type: 'color_updated',
                data: result.rows[0]
            });
        } catch (e) {
            console.log('Broadcast skipped in serverless environment');
        }
    } catch (error) {
        console.error('Error updating color:', error);
        res.status(500).json({ error: 'Failed to update color' });
    }
});

// Delete color
router.delete('/colors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query('DELETE FROM colors WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Color not found' });
        }
        
        res.json({ message: 'Color deleted successfully', color: result.rows[0] });
        
        // Broadcast to all connected clients (wrapped in try-catch for serverless compatibility)
        try {
            broadcastToAll({
                type: 'color_deleted',
                data: { id }
            });
        } catch (e) {
            console.log('Broadcast skipped in serverless environment');
        }
    } catch (error) {
        console.error('Error deleting color:', error);
        res.status(500).json({ error: 'Failed to delete color' });
    }
});

// ============================
// BULK DATA API
// ============================

// Get all data (patterns, products, colors) in one request
router.get('/all', async (req, res) => {
    try {
        const [patternsResult, productsResult, colorsResult] = await Promise.all([
            pool.query('SELECT * FROM patterns ORDER BY created_at DESC'),
            pool.query('SELECT * FROM products ORDER BY created_at DESC'),
            pool.query('SELECT * FROM colors ORDER BY created_at DESC')
        ]);
        
        res.json({
            patterns: patternsResult.rows,
            products: productsResult.rows,
            colors: colorsResult.rows
        });
    } catch (error) {
        console.error('Error fetching all data:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

module.exports = router;
