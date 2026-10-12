// Input validation for every API route and admin form.
import { z } from 'zod';

const COUNTRY = /^[A-Z]{2}$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

/** {ar?, fr?, en?} with empty strings dropped. */
export const i18nTextSchema = (max = 200) =>
  z
    .object({ ar: optionalText(max), fr: optionalText(max), en: optionalText(max) })
    .strict()
    .transform((v) => Object.fromEntries(Object.entries(v).filter(([, s]) => s !== undefined)) as Record<string, string>);

export const requiredI18nText = (max = 200) =>
  i18nTextSchema(max).refine((v) => Object.keys(v).length > 0, { message: 'au moins une langue est requise' });

export const countryListSchema = z
  .array(z.string().trim().toUpperCase().regex(COUNTRY))
  .max(250)
  .transform((list) => [...new Set(list)]);

export const accessSchema = z.enum(['free', 'subscriber']);
export const publishStatusSchema = z.enum(['draft', 'published', 'archived']);

export const titleUpsertSchema = z.object({
  kind: z.enum(['movie', 'series']),
  slug: z.string().trim().toLowerCase().max(120).regex(SLUG),
  name: requiredI18nText(200),
  synopsis: i18nTextSchema(4000),
  release_year: z.coerce.number().int().min(1900).max(2100).nullable().optional(),
  maturity_rating: z.enum(['all', '10+', '12+', '16+', '18+']).default('all'),
  access: accessSchema,
  status: publishStatusSchema,
  featured: z.boolean().default(false),
  geo_allow: countryListSchema.default([]),
  poster_path: z.string().max(300).nullable().optional(),
  backdrop_path: z.string().max(300).nullable().optional(),
  asset_id: z.uuid().nullable().optional(),
  genre_ids: z.array(z.uuid()).max(10).default([]),
});
export type TitleUpsert = z.infer<typeof titleUpsertSchema>;

export const seasonUpsertSchema = z.object({
  title_id: z.uuid(),
  number: z.coerce.number().int().min(1).max(200),
  name: i18nTextSchema(200).default({}),
});

export const episodeUpsertSchema = z.object({
  season_id: z.uuid(),
  number: z.coerce.number().int().min(1).max(1000),
  name: requiredI18nText(200),
  synopsis: i18nTextSchema(4000).default({}),
  access: accessSchema.nullable().default(null),
  status: publishStatusSchema,
  asset_id: z.uuid().nullable().optional(),
});

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-matroska',
  'video/webm',
  'video/mpeg',
  'video/x-msvideo',
] as const;

export const MAX_UPLOAD_BYTES = 100 * 1024 ** 3; // 100 GiB
export const UPLOAD_PART_BYTES = 16 * 1024 ** 2; // 16 MiB → 6 400 parts for 100 GiB (S3 limit: 10 000)

export const createUploadSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  contentType: z.enum(ALLOWED_VIDEO_TYPES),
});

export const presignPartsSchema = z.object({
  partNumbers: z.array(z.number().int().min(1).max(10_000)).min(1).max(100),
});

export const completeUploadSchema = z.object({
  parts: z
    .array(z.object({ partNumber: z.number().int().min(1).max(10_000), etag: z.string().min(1).max(200) }))
    .min(1)
    .max(10_000),
});

export const artworkUploadSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  size: z.number().int().positive().max(10 * 1024 ** 2),
});

export const deviceIdSchema = z.string().regex(/^[A-Za-z0-9_-]{8,64}$/);

export const playbackSessionSchema = z.object({
  titleId: z.uuid(),
  episodeId: z.uuid().optional(),
  deviceId: deviceIdSchema,
});

export const heartbeatSchema = z.object({
  sessionId: z.uuid(),
  positionSeconds: z.number().min(0).max(1_000_000),
  durationSeconds: z.number().min(0).max(1_000_000).optional(),
  ended: z.boolean().optional(),
});

export const checkoutSchema = z.object({ planCode: z.string().regex(/^[a-z0-9_]+$/) });

export const licenseInfoSchema = z.object({
  holder: z.string().trim().min(1).max(200),
  agreement_ref: z.string().trim().min(1).max(120),
  expires_at: z
    .string()
    .regex(ISO_DATE)
    .refine((d) => !Number.isNaN(Date.parse(`${d}T00:00:00Z`)) && new Date(`${d}T00:00:00Z`).toISOString().startsWith(d), {
      message: 'date invalide',
    }),
  territories: countryListSchema.refine((l) => l.length > 0, { message: 'au moins un territoire' }),
  notes: z.string().trim().max(2000).optional(),
});

export const channelUpsertSchema = z.object({
  slug: z.string().trim().toLowerCase().max(80).regex(SLUG),
  name: requiredI18nText(120),
  logo_path: z.string().max(300).nullable().optional(),
  category: z.enum(['general', 'news', 'sports', 'kids', 'entertainment', 'religious', 'music', 'documentary']),
  country: z.string().toUpperCase().regex(COUNTRY),
  language: z.string().toLowerCase().regex(/^[a-z]{2}$/),
  status: z.enum(['active', 'inactive']),
  access: accessSchema,
});

export const channelSourceUpsertSchema = z.object({
  channel_id: z.uuid(),
  label: z.string().trim().min(1).max(80),
  kind: z.enum(['external_hls', 'internal_ingest']),
  url: z.url({ protocol: /^https?$/ }),
  priority: z.number().int().min(1).max(20),
  enabled: z.boolean().default(true),
  license_info: licenseInfoSchema,
});
