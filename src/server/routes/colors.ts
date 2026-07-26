import { Router } from 'express';
import { getDb } from '../db.js';
import { broadcastToAll } from '../broadcast.js';
import { CreateColorSchema, UpdateColorSchema } from '../schemas/color.schema.js';
import type { ColorRow } from '../db.js';

const router = Router();

router.post('/', (req, res) => {
    try {
        const db = getDb();
        const parsed = CreateColorSchema.parse(req.body);
        const id = parsed.id ?? parsed.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        const existing = db.prepare('SELECT id FROM colors WHERE id = ?').get(id);
        if (existing) {
            return res.status(409).json({ error: 'Color with this ID already exists' });
        }

        db.prepare(
            'INSERT INTO colors (id, name, hex, dark_hex, image) VALUES (?, ?, ?, ?, ?)'
        ).run(id, parsed.name, parsed.hex, parsed.darkHex || parsed.hex, parsed.image || '');

        const result = {
            id,
            name: parsed.name,
            hex: parsed.hex,
            darkHex: parsed.darkHex || parsed.hex,
            image: parsed.image || '',
        };
        broadcastToAll({ type: 'color_created', data: result });
        res.status(201).json(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: (error as import('zod').ZodError).errors });
        }
        console.error('Error creating color:', error);
        res.status(500).json({ error: 'Failed to create color', details: (error as Error).message });
    }
});

router.put('/:id', (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;
        const parsed = UpdateColorSchema.parse(req.body);

        const existing = db.prepare('SELECT id FROM colors WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Color not found' });
        }

        db.prepare(
            `UPDATE colors SET
                name = COALESCE(?, name),
                hex = COALESCE(?, hex),
                dark_hex = COALESCE(?, dark_hex),
                image = COALESCE(?, image),
                updated_at = datetime('now')
             WHERE id = ?`
        ).run(parsed.name, parsed.hex, parsed.darkHex, parsed.image, id);

        const updated = db.prepare('SELECT * FROM colors WHERE id = ?').get(id) as ColorRow;
        const result = {
            id: updated.id,
            name: updated.name,
            hex: updated.hex,
            darkHex: updated.dark_hex,
            image: updated.image,
        };
        broadcastToAll({ type: 'color_updated', data: result });
        res.json(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: (error as import('zod').ZodError).errors });
        }
        console.error('Error updating color:', error);
        res.status(500).json({ error: 'Failed to update color', details: (error as Error).message });
    }
});

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
        res.status(500).json({ error: 'Failed to delete color', details: (error as Error).message });
    }
});

export default router;
