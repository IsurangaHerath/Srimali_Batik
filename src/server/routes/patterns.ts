import { Router } from 'express';
import { getDb } from '../db.js';
import { broadcastToAll } from '../broadcast.js';
import { CreatePatternSchema, UpdatePatternSchema } from '../schemas/pattern.schema.js';
import type { PatternRow } from '../db.js';

const router = Router();

router.post('/', (req, res) => {
    try {
        const db = getDb();
        const parsed = CreatePatternSchema.parse(req.body);
        const id = parsed.id ?? `p-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const existing = db.prepare('SELECT id FROM patterns WHERE id = ?').get(id);
        if (existing) {
            return res.status(409).json({ error: 'Pattern with this ID already exists' });
        }

        const nameDup = db.prepare('SELECT id FROM patterns WHERE LOWER(name) = LOWER(?)').get(parsed.name);
        if (nameDup) {
            return res.status(409).json({ error: 'A pattern with this name already exists' });
        }

        const colorsJson = JSON.stringify(parsed.colors);
        db.prepare(
            'INSERT INTO patterns (id, name, description, image, colors) VALUES (?, ?, ?, ?, ?)'
        ).run(id, parsed.name, parsed.description, parsed.image, colorsJson);

        const result = {
            id,
            name: parsed.name,
            description: parsed.description,
            image: parsed.image,
            colors: parsed.colors,
        };
        broadcastToAll({ type: 'pattern_created', data: result });
        res.status(201).json(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: (error as import('zod').ZodError).errors });
        }
        console.error('Error creating pattern:', error);
        res.status(500).json({ error: 'Failed to create pattern', details: (error as Error).message });
    }
});

router.put('/:id', (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;
        const parsed = UpdatePatternSchema.parse(req.body);

        const existing = db.prepare('SELECT id FROM patterns WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Pattern not found' });
        }

        if (parsed.name) {
            const nameDup = db.prepare(
                'SELECT id FROM patterns WHERE LOWER(name) = LOWER(?) AND id != ?'
            ).get(parsed.name);
            if (nameDup) {
                return res.status(409).json({ error: 'A pattern with this name already exists' });
            }
        }

        const colorsJson = JSON.stringify(parsed.colors ?? []);
        db.prepare(
            `UPDATE patterns SET
                name = COALESCE(?, name),
                description = COALESCE(?, description),
                image = COALESCE(?, image),
                colors = COALESCE(?, colors),
                updated_at = datetime('now')
             WHERE id = ?`
        ).run(parsed.name, parsed.description, parsed.image, colorsJson, id);

        const updated = db.prepare('SELECT * FROM patterns WHERE id = ?').get(id) as PatternRow;
        const result = {
            id: updated.id,
            name: updated.name,
            description: updated.description,
            image: updated.image,
            colors: JSON.parse(updated.colors || '[]'),
        };
        broadcastToAll({ type: 'pattern_updated', data: result });
        res.json(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: (error as import('zod').ZodError).errors });
        }
        console.error('Error updating pattern:', error);
        res.status(500).json({ error: 'Failed to update pattern', details: (error as Error).message });
    }
});

router.delete('/:id', (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;

        const existing = db.prepare('SELECT id, name FROM patterns WHERE id = ?').get(id) as { id: string; name: string };
        if (!existing) {
            return res.status(404).json({ error: 'Pattern not found' });
        }

        db.prepare('DELETE FROM products WHERE pattern_id = ?').run(id);
        db.prepare('DELETE FROM patterns WHERE id = ?').run(id);

        broadcastToAll({ type: 'pattern_deleted', data: { id } });
        res.json({ message: 'Pattern deleted successfully', id });
    } catch (error) {
        console.error('Error deleting pattern:', error);
        res.status(500).json({ error: 'Failed to delete pattern', details: (error as Error).message });
    }
});

export default router;
