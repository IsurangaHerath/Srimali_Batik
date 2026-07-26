import { z } from 'zod';

export const CreateProductSchema = z.object({
    id: z.string().min(1).optional(),
    patternId: z.string().min(1),
    pattern_id: z.string().min(1).optional(),
    name: z.string().min(1).max(200),
    type: z.string().max(100).default(''),
    description: z.string().max(2000).default(''),
    image: z.string().url().or(z.literal('')).default(''),
    price: z.string().max(100).default(''),
    colors: z.array(z.string()).default([]),
});

export const UpdateProductSchema = CreateProductSchema.partial().extend({
    name: z.string().min(1).max(200).optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
