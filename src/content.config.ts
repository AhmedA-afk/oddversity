import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const lessons = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/lessons' }),
  schema: z.object({
    title: z.string(),
    track: z.string(),
    order: z.number().default(0),
    status: z.enum(['live', 'curated', 'coming']).default('live'),
    summary: z.string().optional(),
    duration: z.string().optional(),
    updated: z.string().optional(),
  }),
});

const questions = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/questions' }),
  schema: z.object({
    title: z.string(),
    topic: z.string(),
    description: z.string(),
    order: z.number().default(0),
  }),
});

const scenarios = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/scenarios' }),
  schema: z.object({
    title: z.string(),
    scenario: z.string(),
    description: z.string(),
    order: z.number().default(0),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    published: z.string(),
    updated: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

// Guides: task-shaped, end-to-end walkthroughs. A guide answers "how do I
// actually do X", start to finish, in one page — distinct from a lesson (one
// concept) and from a blog post (an argument).
const guides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // The question a reader typed before they landed here.
    question: z.string(),
    level: z.enum(['beginner', 'intermediate', 'advanced']),
    duration: z.string(),
    published: z.string(),
    updated: z.string().optional(),
    tags: z.array(z.string()).default([]),
    // Ordered steps, mirrored into HowTo structured data.
    steps: z.array(z.string()).default([]),
    // Related lesson paths, e.g. "/learn/rag/chunking-strategies-for-documents"
    related: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

// The Forward Deployed Engineer path. Its own tree (see src/data/fde.ts): id is
// "<phase>/<slug>". A file here is what makes a planned node "live".
const fde = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/fde' }),
  schema: z.object({
    title: z.string(),
    phase: z.string(),
    module: z.string(),
    kind: z.enum(['lesson', 'lab', 'drill', 'bootcamp', 'capstone', 'reference']).default('lesson'),
    summary: z.string(),
    duration: z.string().optional(),
    // YAML turns an unquoted 2026-09-02 into a Date; accept both so an author
    // forgetting the quotes cannot break the build.
    updated: z.union([z.string(), z.date()]).transform((v) => (typeof v === 'string' ? v : v.toISOString().slice(0, 10))).optional(),
    /** What the learner can do afterwards. Rendered as the opening checklist. */
    outcomes: z.array(z.string()).default([]),
    /** The evidence this page leaves in the portfolio, if any. */
    artifact: z.string().optional(),
    /** Source URLs the page's claims trace to. Rendered at the foot. */
    sources: z.array(z.string()).default([]),
  }),
});

export const collections = { lessons, questions, scenarios, blog, guides, fde };
