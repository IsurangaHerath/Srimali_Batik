import { z } from 'zod';

export const CreatePatternSchema = z.object({
    id: z.string().min(1).optional(),
    name: z.string().min(1).max(200),
    description: z.string().max(2000).default(''),
    image: z.string().url().or(z.literal('')).default(''),
    colors: z.array(z.string()).default([]),
});

export const UpdatePatternSchema = CreatePatternSchema.partial().extend({
    name: z.string().min(1).max(200).optional(),
});

export type CreatePatternInput = z.infer<typeof CreatePatternSchema>;
export type UpdatePatternInput = z.infer<typeof UpdatePatternSchema>;
