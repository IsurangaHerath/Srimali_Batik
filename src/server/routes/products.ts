import { Router } from 'express';
import { getDb } from '../db.js';
import { broadcastToAll } from '../broadcast.js';
import { CreateProductSchema, UpdateProductSchema } from '../schemas/product.schema.js';
import type { ProductRow } from '../db.js';

const router = Router();

router.post('/', (req, res) => {
    try {
        const db = getDb();
        const parsed = CreateProductSchema.parse(req.body);
        const id = parsed.id ?? `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const patternId = parsed.patternId || parsed.pattern_id;

        const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
        if (existing) {
            return res.status(409).json({ error: 'Product with this ID already exists' });
        }

        const pattern = db.prepare('SELECT id FROM patterns WHERE id = ?').get(patternId);
        if (!pattern) {
            return res.status(400).json({ error: 'Referenced pattern not found' });
        }

        const colorsJson = JSON.stringify(parsed.colors);
        db.prepare(
            'INSERT INTO products (id, pattern_id, name, type, description, image, price, colors) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(id, patternId, parsed.name, parsed.type, parsed.description, parsed.image, parsed.price, colorsJson);

        const result = {
            id,
            pattern_id: patternId,
            name: parsed.name,
            type: parsed.type,
            description: parsed.description,
            image: parsed.image,
            price: parsed.price,
            colors: parsed.colors,
        };
        broadcastToAll({ type: 'product_created', data: result });
        res.status(201).json(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: (error as import('zod').ZodError).errors });
        }
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product', details: (error as Error).message });
    }
});

router.put('/:id', (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;
        const parsed = UpdateProductSchema.parse(req.body);
        const patternId = parsed.patternId || parsed.pattern_id;

        const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (patternId) {
            const pattern = db.prepare('SELECT id FROM patterns WHERE id = ?').get(patternId);
            if (!pattern) {
                return res.status(400).json({ error: 'Referenced pattern not found' });
            }
        }

        const colorsJson = JSON.stringify(parsed.colors ?? []);
        db.prepare(
            `UPDATE products SET
                pattern_id = COALESCE(?, pattern_id),
                name = COALESCE(?, name),
                type = COALESCE(?, type),
                description = COALESCE(?, description),
                image = COALESCE(?, image),
                price = COALESCE(?, price),
                colors = COALESCE(?, colors),
                updated_at = datetime('now')
             WHERE id = ?`
        ).run(patternId, parsed.name, parsed.type, parsed.description, parsed.image, parsed.price, colorsJson, id);

        const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as ProductRow;
        const result = {
            id: updated.id,
            pattern_id: updated.pattern_id,
            name: updated.name,
            type: updated.type,
            description: updated.description,
            image: updated.image,
            price: updated.price,
            colors: JSON.parse(updated.colors || '[]'),
        };
        broadcastToAll({ type: 'product_updated', data: result });
        res.json(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: (error as import('zod').ZodError).errors });
        }
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product', details: (error as Error).message });
    }
});

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
        res.status(500).json({ error: 'Failed to delete product', details: (error as Error).message });
    }
});

export default router;
