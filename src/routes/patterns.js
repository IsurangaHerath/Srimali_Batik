/**
 * Patterns Routes
 * CRUD operations for batik patterns.
 * POST   /api/patterns        — create
 * PUT    /api/patterns/:id    — update
 * DELETE /api/patterns/:id    — delete (cascades products)
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
        const { id, name, description, image, colors } = req.body;

        if (!id || !name) {
            return res.status(400).json({ error: 'ID and name are required' });
        }

        // Check for duplicate
        const existing = db.prepare('SELECT id FROM patterns WHERE id = ?').get(id);
        if (existing) {
            return res.status(409).json({ error: 'Pattern with this ID already exists' });
        }

        const colorsJson = JSON.stringify(colors || []);
        db.prepare(`
            INSERT INTO patterns (id, name, description, image, colors)
            VALUES (?, ?, ?, ?, ?)
        `).run(id, name, description || '', image || '', colorsJson);

        const result = { id, name, description: description || '', image: image || '', colors: colors || [] };
        broadcastToAll({ type: 'pattern_created', data: result });
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating pattern:', error);
        res.status(500).json({ error: 'Failed to create pattern', details: error.message });
    }
});

// ──────────────────────────────────────────────
// UPDATE
// ──────────────────────────────────────────────

router.put('/:id', (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;
        const { name, description, image, colors } = req.body;

        const existing = db.prepare('SELECT id FROM patterns WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Pattern not found' });
        }

        const colorsJson = JSON.stringify(colors || []);
        db.prepare(`
            UPDATE patterns
            SET name = ?, description = ?, image = ?, colors = ?, updated_at = datetime('now')
            WHERE id = ?
        `).run(name, description || '', image || '', colorsJson, id);

        const result = { id, name, description: description || '', image: image || '', colors: colors || [] };
        broadcastToAll({ type: 'pattern_updated', data: result });
        res.json(result);
    } catch (error) {
        console.error('Error updating pattern:', error);
        res.status(500).json({ error: 'Failed to update pattern', details: error.message });
    }
});

// ──────────────────────────────────────────────
// DELETE
// ──────────────────────────────────────────────

router.delete('/:id', (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;

        const existing = db.prepare('SELECT id FROM patterns WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Pattern not found' });
        }

        // Delete products first (SQLite cascade is enabled via PRAGMA foreign_keys)
        db.prepare('DELETE FROM products WHERE pattern_id = ?').run(id);
        db.prepare('DELETE FROM patterns WHERE id = ?').run(id);

        broadcastToAll({ type: 'pattern_deleted', data: { id } });
        res.json({ message: 'Pattern deleted successfully', id });
    } catch (error) {
        console.error('Error deleting pattern:', error);
        res.status(500).json({ error: 'Failed to delete pattern', details: error.message });
    }
});

module.exports = router;
