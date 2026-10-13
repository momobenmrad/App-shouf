import { describe, expect, it } from 'vitest';
import { planParts, remainingParts } from '../src/lib/uploader';

describe('multipart planning', () => {
  it('splits a file into fixed-size parts with a short last part', () => {
    const plan = planParts(40, 16);
    expect(plan).toEqual([
      { partNumber: 1, start: 0, end: 16 },
      { partNumber: 2, start: 16, end: 32 },
      { partNumber: 3, start: 32, end: 40 },
    ]);
  });

  it('resumes only missing or incomplete parts', () => {
    const plan = planParts(40, 16);
    expect(remainingParts(plan, [{ partNumber: 1, size: 16 }, { partNumber: 3, size: 4 }]).map((p) => p.partNumber)).toEqual([2, 3]);
    expect(remainingParts(plan, plan.map((p) => ({ partNumber: p.partNumber, size: p.end - p.start })))).toEqual([]);
  });

  it('refuses plans above the S3 part limit', () => {
    expect(() => planParts(10_001, 1)).toThrow('too many parts');
  });
});
