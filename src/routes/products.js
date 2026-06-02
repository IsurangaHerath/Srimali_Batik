/**
 * Products Routes
 * CRUD operations for batik products.
 * POST   /api/products        — create
 * PUT    /api/products/:id    — update
 * DELETE /api/products/:id    — delete
 */

const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { broadcastToAll } = require('../broadcast');

// ──────────────────────────────────────────────
// CREATE
// ──────────────────────────────────────────────

router.post('/', (req, res) => {
    try {
        const db = getDb();
        const { id, patternId, pattern_id, name, type, description, image, price, colors } = req.body;
        const pId = patternId || pattern_id;

        if (!id || !name) {
            return res.status(400).json({ error: 'ID and name are required' });
        }

        const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
        if (existing) {
            return res.status(409).json({ error: 'Product with this ID already exists' });
        }

        const colorsJson = JSON.stringify(colors || []);
        db.prepare(`
            INSERT INTO products (id, pattern_id, name, type, description, image, price, colors)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, pId, name, type || '', description || '', image || '', price || '', colorsJson);

        const result = { id, pattern_id: pId, name, type: type || '', description: description || '', image: image || '', price: price || '', colors: colors || [] };
        broadcastToAll({ type: 'product_created', data: result });
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product', details: error.message });
    }
});

// ──────────────────────────────────────────────
// UPDATE
// ──────────────────────────────────────────────

router.put('/:id', (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;
        const { patternId, pattern_id, name, type, description, image, price, colors } = req.body;
        const pId = patternId || pattern_id;

        const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const colorsJson = JSON.stringify(colors || []);
        db.prepare(`
            UPDATE products
            SET pattern_id = ?, name = ?, type = ?, description = ?, image = ?, price = ?, colors = ?, updated_at = datetime('now')
            WHERE id = ?
        `).run(pId, name, type || '', description || '', image || '', price || '', colorsJson, id);

        const result = { id, pattern_id: pId, name, type: type || '', description: description || '', image: image || '', price: price || '', colors: colors || [] };
        broadcastToAll({ type: 'product_updated', data: result });
        res.json(result);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product', details: error.message });
    }
});

// ──────────────────────────────────────────────
// DELETE
// ──────────────────────────────────────────────

router.delete('/:id', (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;

        const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Product not found' });
        }

        db.prepare('DELETE FROM products WHERE id = ?').run(id);

        broadcastToAll({ type: 'product_deleted', data: { id } });
        res.json({ message: 'Product deleted successfully', id });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product', details: error.message });
    }
});

module.exports = router;
