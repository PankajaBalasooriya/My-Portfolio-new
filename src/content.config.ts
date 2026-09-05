import { defineCollection, reference, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

/* -------------------------------------------------------------------------- */
/* Prose collections (MDX/Markdown)                                            */
/* -------------------------------------------------------------------------- */

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        tags: z.array(z.string()).default([]),
        draft: z.boolean().default(false),
        heroImage: image().optional(),
        heroAlt: z.string().optional(),
      })
      .refine((data) => !data.heroImage || !!data.heroAlt, {
        message: 'heroAlt is required whenever heroImage is set',
        path: ['heroAlt'],
      }),
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        summary: z.string(),
        role: z.string(),
        period: z.string(),
        tags: z.array(z.string()).default([]),
        stack: z.array(z.string()).default([]),
        repo: z.string().url().optional(),
        demo: z.string().url().optional(),
        featured: z.boolean().default(false),
        /** Ascending. Lower sorts first within the featured and full lists. */
        order: z.number().default(999),
        cover: image().optional(),
        coverAlt: z.string().optional(),
      })
      .refine((data) => !data.cover || !!data.coverAlt, {
        message: 'coverAlt is required whenever cover is set',
        path: ['coverAlt'],
      }),
});

/* -------------------------------------------------------------------------- */
/* CV data collections (YAML)                                                  */
/*                                                                            */
/* Dates here are month-precision strings ("2025-01"), deliberately not Date:  */
/* a real Date would invent a day and drag timezone drift onto the print CV.   */
/* They sort correctly as strings. `formatMonth`/`formatRange` render them.    */
/* -------------------------------------------------------------------------- */

/** "2025", "2025-01" — the shape every CV date field takes. */
const monthString = z
  .string()
  .regex(/^\d{4}(-\d{2})?$/, 'Expected "YYYY" or "YYYY-MM"');

const experience = defineCollection({
  loader: file('./src/data/experience.yaml'),
  schema: z.object({
    id: z.string(),
    org: z.string(),
    role: z.string(),
    location: z.string(),
    start: monthString,
    /** Omit for a role still held; renders as "Present". */
    end: monthString.optional(),
    bullets: z.array(z.string()).default([]),
    /** Filename inside public/logos, e.g. "exertion-games-lab.svg". */
    logo: z.string().optional(),
    /** Optional override for dark mode; rarely needed given the light chip. */
    logoDark: z.string().optional(),
    order: z.number().optional(),
  }),
});

const education = defineCollection({
  loader: file('./src/data/education.yaml'),
  schema: z.object({
    id: z.string(),
    institution: z.string(),
    credential: z.string(),
    start: monthString,
    end: monthString.optional(),
    details: z.array(z.string()).default([]),
    /** Splits the Education section into higher education and school. */
    kind: z.enum(['university', 'school']).default('university'),
    location: z.string().optional(),
    /**
     * Ascending, applied before recency. Without it an ongoing minor outranks
     * the primary degree, since open-ended entries sort to the top.
     */
    order: z.number().optional(),
    /** Filename inside public/logos, e.g. "university-of-moratuwa.svg". */
    logo: z.string().optional(),
    logoDark: z.string().optional(),
  }),
});

const research = defineCollection({
  loader: file('./src/data/research.yaml'),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    authors: z.array(z.string()).min(1),
    venue: z.string(),
    year: z.number().int(),
    type: z.enum(['paper', 'demo', 'poster', 'preprint']),
    /**
     * Where the work actually is in the review process. An under-review
     * submission must never read as published, so this is data rather than
     * prose folded into `venue`, and it drives the sort order.
     */
    status: z
      .enum(['published', 'accepted', 'conditionally-accepted', 'under-review'])
      .default('published'),
    doi: z.string().optional(),
    pdf: z.string().optional(),
    code: z.string().url().optional(),
    abstract: z.string().optional(),
    /** Optional link through to the project case study. */
    project: reference('projects').optional(),
  }),
});

/**
 * Tools and technologies, grouped by domain. Deliberately no proficiency
 * scores: they are unverifiable, age badly, and say less than the grouping,
 * which shows the span from hardware through firmware to learning.
 */
const stack = defineCollection({
  loader: file('./src/data/stack.yaml'),
  schema: z.object({
    id: z.string(),
    label: z.string(),
    items: z.array(z.string()).min(1),
    order: z.number().default(999),
  }),
});

const awards = defineCollection({
  loader: file('./src/data/awards.yaml'),
  schema: z.object({
    id: z.string(),
    /** The competition or programme — the scannable part. */
    title: z.string(),
    /** The result, kept separate from the title so it can be styled. */
    placement: z.string().optional(),
    issuer: z.string(),
    date: monthString,
    description: z.string().optional(),
  }),
});

/** Courses and certifications — single-date, so not part of the timelines. */
const certificates = defineCollection({
  loader: file('./src/data/certificates.yaml'),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    issuer: z.string(),
    date: monthString,
    details: z.array(z.string()).default([]),
    url: z.string().url().optional(),
  }),
});

const volunteering = defineCollection({
  loader: file('./src/data/volunteering.yaml'),
  schema: z.object({
    id: z.string(),
    org: z.string(),
    role: z.string(),
    start: monthString,
    end: monthString.optional(),
    description: z.string().optional(),
  }),
});

export const collections = {
  blog,
  projects,
  experience,
  education,
  stack,
  research,
  awards,
  certificates,
  volunteering,
};
