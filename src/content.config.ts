import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const lessons = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/lessons' }),
  schema: z.object({
    title: z.string(),
    track: z.string(),
    order: z.number().default(0),
    status: z.enum(['live', 'curated', 'coming']).default('live'),
    summary: z.string().optional(),
    duration: z.string().optional(),
  }),
});

export const collections = { lessons };
