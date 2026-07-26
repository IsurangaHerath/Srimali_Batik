import { z } from 'zod';

export const CreateColorSchema = z.object({
    id: z.string().min(1).optional(),
    name: z.string().min(1).max(100),
    hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color'),
    darkHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color').optional(),
    image: z.string().url().or(z.literal('')).default(''),
});

export const UpdateColorSchema = CreateColorSchema.partial().extend({
    name: z.string().min(1).max(100).optional(),
    hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color').optional(),
});

export type CreateColorInput = z.infer<typeof CreateColorSchema>;
export type UpdateColorInput = z.infer<typeof UpdateColorSchema>;
