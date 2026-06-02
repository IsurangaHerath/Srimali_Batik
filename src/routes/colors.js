/**
 * Colors Routes
 * CRUD operations for batik colors.
 * POST   /api/colors        — create
 * PUT    /api/colors/:id    — update
 * DELETE /api/colors/:id    — delete
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
        const { id, name, hex, darkHex, image } = req.body;

        if (!id || !name || !hex) {
            return res.status(400).json({ error: 'ID, name, and hex color are required' });
        }

        const existing = db.prepare('SELECT id FROM colors WHERE id = ?').get(id);
        if (existing) {
            return res.status(409).json({ error: 'Color with this ID already exists' });
        }

        db.prepare(`
            INSERT INTO colors (id, name, hex, dark_hex, image)
            VALUES (?, ?, ?, ?, ?)
        `).run(id, name, hex, darkHex || hex, image || '');

        const result = { id, name, hex, darkHex: darkHex || hex, image: image || '' };
        broadcastToAll({ type: 'color_created', data: result });
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating color:', error);
        res.status(500).json({ error: 'Failed to create color', details: error.message });
    }
});

// ──────────────────────────────────────────────
// UPDATE
// ──────────────────────────────────────────────

router.put('/:id', (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;
        const { name, hex, darkHex, image } = req.body;

        const existing = db.prepare('SELECT id FROM colors WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Color not found' });
        }

        db.prepare(`
            UPDATE colors
            SET name = ?, hex = ?, dark_hex = ?, image = ?, updated_at = datetime('now')
            WHERE id = ?
        `).run(name, hex, darkHex || hex, image || '', id);

        const result = { id, name, hex, darkHex: darkHex || hex, image: image || '' };
        broadcastToAll({ type: 'color_updated', data: result });
        res.json(result);
    } catch (error) {
        console.error('Error updating color:', error);
        res.status(500).json({ error: 'Failed to update color', details: error.message });
    }
});

// ──────────────────────────────────────────────
// DELETE
// ──────────────────────────────────────────────

router.delete('/:id', (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;

        const existing = db.prepare('SELECT id FROM colors WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Color not found' });
        }

        db.prepare('DELETE FROM colors WHERE id = ?').run(id);

        broadcastToAll({ type: 'color_deleted', data: { id } });
        res.json({ message: 'Color deleted successfully', id });
    } catch (error) {
        console.error('Error deleting color:', error);
        res.status(500).json({ error: 'Failed to delete color', details: error.message });
    }
});

module.exports = router;
