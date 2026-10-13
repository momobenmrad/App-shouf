import { describe, expect, it } from 'vitest';
import { parseXmltv, parseXmltvDate, selectProgrammes } from '../src/xmltv';

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<tv generator-info-name="test">
  <channel id="watania1.tn">
    <display-name lang="ar">الوطنية 1</display-name>
    <display-name lang="fr">Watania 1</display-name>
  </channel>
  <programme start="20261013190000 +0100" stop="20261013200000 +0100" channel="watania1.tn">
    <title lang="ar">الأخبار</title>
    <title lang="fr">Journal t&#233;l&#233;vis&#233;</title>
    <desc lang="fr"><![CDATA[Le JT de 20h & ses invités]]></desc>
    <category>News</category>
    <rating system="FR"><value>Tous publics</value></rating>
  </programme>
  <programme start="20261013195000 +0100" stop="20261013213000 +0100" channel="watania1.tn">
    <title>Film du soir</title>
  </programme>
  <programme start="20261013213000 +0100" stop="20261013213000 +0100" channel="watania1.tn">
    <title>Bogus zero-length</title>
  </programme>
  <programme start="20261013220000" stop="20261013230000" channel="other.tn">
    <title lang="en">Elsewhere</title>
  </programme>
</tv>`;

describe('parseXmltvDate', () => {
  it('handles offsets, missing time parts and garbage', () => {
    expect(parseXmltvDate('20261013190000 +0100')).toBe('2026-10-13T18:00:00.000Z');
    expect(parseXmltvDate('20261013')).toBe('2026-10-13T00:00:00.000Z');
    expect(parseXmltvDate('20261013 -0500')).toBe('2026-10-13T05:00:00.000Z');
    expect(parseXmltvDate('yesterday')).toBeNull();
  });
});

describe('parseXmltv', () => {
  const doc = parseXmltv(XML);
  it('reads channels with their display names', () => {
    expect(doc.channels).toEqual([{ id: 'watania1.tn', names: ['الوطنية 1', 'Watania 1'] }]);
  });
  it('reads programmes with multilingual titles, decoded text, categories and ratings', () => {
    const jt = doc.programmes[0]!;
    expect(jt.start).toBe('2026-10-13T18:00:00.000Z');
    expect(jt.title).toEqual({ ar: 'الأخبار', fr: 'Journal télévisé' });
    expect(jt.description.fr).toBe('Le JT de 20h & ses invités');
    expect(jt.category).toBe('News');
    expect(jt.rating).toBe('Tous publics');
  });
  it('drops zero-length programmes and applies the fallback language', () => {
    expect(doc.programmes.map((p) => Object.values(p.title)[0])).toEqual(['الأخبار', 'Film du soir', 'Elsewhere']);
    expect(doc.programmes[1]!.title).toEqual({ fr: 'Film du soir' });
  });
});

describe('selectProgrammes', () => {
  it('filters by channel and window and trims overlaps', () => {
    const doc = parseXmltv(XML);
    const list = selectProgrammes(doc, 'watania1.tn', '2026-10-13T00:00:00.000Z', '2026-10-14T00:00:00.000Z');
    expect(list.map((p) => [p.start, p.end])).toEqual([
      ['2026-10-13T18:00:00.000Z', '2026-10-13T18:50:00.000Z'],
      ['2026-10-13T18:50:00.000Z', '2026-10-13T20:30:00.000Z'],
    ]);
    expect(selectProgrammes(doc, 'other.tn', '2026-10-13T22:30:00.000Z', '2026-10-14T00:00:00.000Z')).toHaveLength(1);
    expect(selectProgrammes(doc, 'other.tn', '2026-10-14T00:00:00.000Z', '2026-10-15T00:00:00.000Z')).toHaveLength(0);
  });
});
