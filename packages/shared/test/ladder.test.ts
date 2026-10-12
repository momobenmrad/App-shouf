import { describe, expect, it } from 'vitest';
import { selectRenditions } from '../src/ladder';

describe('selectRenditions', () => {
  it('produces the full ladder for a 1080p source', () => {
    expect(selectRenditions(1920, 1080).map((r) => r.name)).toEqual(['240p', '360p', '480p', '720p', '1080p']);
  });
  it('never upscales', () => {
    expect(selectRenditions(1280, 720).map((r) => r.name)).toEqual(['240p', '360p', '480p', '720p']);
  });
  it('keeps 1080p for slightly cropped sources and caps the height', () => {
    const top = selectRenditions(1920, 1040).at(-1)!;
    expect(top.name).toBe('1080p');
    expect(top.height).toBe(1040);
  });
  it('follows the source aspect ratio with even widths', () => {
    const r = selectRenditions(1920, 800); // 2.40:1
    expect(r.every((x) => x.width % 2 === 0 && x.height % 2 === 0)).toBe(true);
    expect(r.find((x) => x.name === '720p')!.width).toBe(1728);
  });
  it('always outputs at least one rendition for tiny sources', () => {
    expect(selectRenditions(320, 180)).toHaveLength(1);
  });
});
