import { describe, expect, it } from 'vitest';
import { channelSourceUpsertSchema, createUploadSchema, licenseInfoSchema, titleUpsertSchema } from '../src/schemas';
import { sanitizeFilename } from '../src/storage-keys';

describe('schemas', () => {
  it('normalises a title and drops empty translations', () => {
    const t = titleUpsertSchema.parse({
      kind: 'movie',
      slug: 'Le-Film',
      name: { fr: ' Le film ', ar: '' },
      synopsis: {},
      access: 'free',
      status: 'draft',
      geo_allow: ['tn', 'TN', 'fr'],
    });
    expect(t.slug).toBe('le-film');
    expect(t.name).toEqual({ fr: 'Le film' });
    expect(t.geo_allow).toEqual(['TN', 'FR']);
  });

  it('requires at least one language for a title name', () => {
    expect(() =>
      titleUpsertSchema.parse({ kind: 'movie', slug: 'x', name: { fr: '  ' }, synopsis: {}, access: 'free', status: 'draft' }),
    ).toThrow();
  });

  it('rejects unsupported uploads', () => {
    expect(createUploadSchema.safeParse({ filename: 'a.exe', size: 10, contentType: 'application/x-msdownload' }).success).toBe(
      false,
    );
    expect(createUploadSchema.safeParse({ filename: 'a.mp4', size: 10, contentType: 'video/mp4' }).success).toBe(true);
  });

  it('validates licence information', () => {
    const ok = { holder: 'TT', agreement_ref: 'A-1', expires_at: '2027-02-28', territories: ['tn'] };
    expect(licenseInfoSchema.parse(ok).territories).toEqual(['TN']);
    expect(licenseInfoSchema.safeParse({ ...ok, expires_at: '2027-02-30' }).success).toBe(false);
    expect(licenseInfoSchema.safeParse({ ...ok, territories: [] }).success).toBe(false);
    expect(licenseInfoSchema.safeParse({ ...ok, holder: '' }).success).toBe(false);
  });

  it('accepts only http(s) source URLs', () => {
    const base = {
      channel_id: '3f2b8c1e-1d2a-4c6b-9e7f-0a1b2c3d4e5f',
      label: 'Principale',
      kind: 'external_hls',
      priority: 1,
      license_info: { holder: 'TT', agreement_ref: 'A', expires_at: '2027-01-01', territories: ['TN'] },
    };
    expect(channelSourceUpsertSchema.safeParse({ ...base, url: 'https://cdn.example/live.m3u8' }).success).toBe(true);
    expect(channelSourceUpsertSchema.safeParse({ ...base, url: 'file:///etc/passwd' }).success).toBe(false);
  });

  it('sanitises filenames used in object keys', () => {
    expect(sanitizeFilename('../../Mon Film (2026).mp4')).toBe('Mon_Film_2026.mp4');
    expect(sanitizeFilename('فيلم.mp4')).toBe('source.mp4');
    expect(sanitizeFilename('noext')).toBe('noext');
  });
});
