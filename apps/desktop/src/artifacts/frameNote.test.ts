import { describe, expect, it } from 'vitest';
import { originOf, readAnchor, readFrameNote } from './frameNote';
import { frameSrc } from './Open';

const SERVER = 'http://127.0.0.1:47438';
const win = { name: 'the frame' };
const frame = { origin: SERVER, window: win };
const from = { origin: SERVER, source: win };
const msg = { bise: 'anchor', artifact: 'q3-xlsx', version: 4, anchor: { kind: 'cell', sheet: 'Summary', range: 'C4:E4' }, quote: '1200 1350' };

describe('readFrameNote: a selection from the side panel frame (plan §9b)', () => {
  it('takes artifact, version, anchor and quote, and nothing else', () => {
    const note = readFrameNote({ ...msg, label: 'Summary!C4:E4', html: '<b>x</b>', extra: 1 }, from, frame);
    expect(note).toEqual({ artifact: 'q3-xlsx', version: 4, anchor: { kind: 'cell', sheet: 'Summary', range: 'C4:E4' }, quote: '1200 1350' });
  });

  it('only from that frame, on the pages server origin', () => {
    expect(readFrameNote(msg, { origin: SERVER, source: { name: 'another frame' } }, frame)).toBeNull();
    expect(readFrameNote(msg, { origin: 'http://127.0.0.1:9999', source: win }, frame)).toBeNull();
    expect(readFrameNote(msg, { origin: 'https://evil.example', source: win }, frame)).toBeNull();
    expect(readFrameNote(msg, from, { origin: null, window: win })).toBeNull();
    expect(readFrameNote(msg, from, { origin: SERVER, window: null })).toBeNull();
  });

  it('drops a message that is not a selection or has a field of the wrong shape', () => {
    expect(readFrameNote({ ...msg, bise: 'esc' }, from, frame)).toBeNull();
    expect(readFrameNote('anchor', from, frame)).toBeNull();
    expect(readFrameNote({ ...msg, artifact: '' }, from, frame)).toBeNull();
    expect(readFrameNote({ ...msg, version: 0 }, from, frame)).toBeNull();
    expect(readFrameNote({ ...msg, version: '4' }, from, frame)).toBeNull();
    expect(readFrameNote({ ...msg, quote: 12 }, from, frame)).toBeNull();
    expect(readFrameNote({ ...msg, anchor: { kind: 'chart', id: 'c1' } }, from, frame)).toBeNull();
  });

  it("keeps the viewer's rev when it has one, a wrong one drops the message", () => {
    expect(readFrameNote({ ...msg, rev: 3 }, from, frame)).toMatchObject({ version: 4, rev: 3 });
    expect(readFrameNote({ ...msg, rev: 'x' }, from, frame)).toBeNull();
  });

  it('his first typed character comes along when it is one printable grapheme, else the message is dropped (architect m_24155)', () => {
    expect(readFrameNote({ ...msg, key: 'w' }, from, frame)).toMatchObject({ key: 'w' });
    expect(readFrameNote({ ...msg, key: 'é' }, from, frame)).toMatchObject({ key: 'é' });
    expect(readFrameNote({ ...msg, key: '👍🏽' }, from, frame)).toMatchObject({ key: '👍🏽' });
    expect(readFrameNote({ ...msg, key: ' ' }, from, frame)).toMatchObject({ key: ' ' });
    for (const bad of ['', 'why', 'Enter', 'Dead', '\n', '\u0007', 3]) expect(readFrameNote({ ...msg, key: bad }, from, frame)).toBeNull();
    expect(readFrameNote(msg, from, frame)).not.toHaveProperty('key');
  });

  it('an empty quote is no quote', () => {
    expect(readFrameNote({ ...msg, quote: '' }, from, frame)).not.toHaveProperty('quote');
    expect(readFrameNote({ ...msg, quote: undefined }, from, frame)).not.toHaveProperty('quote');
  });
});

describe('readAnchor: each kind through the generated Anchor type', () => {
  it('keeps the known fields of each kind', () => {
    const rect = { x: 10, y: 20, w: 30, h: 5 };
    const ok = [
      { kind: 'block', block: 'b3', quote: 'the plan' },
      { kind: 'cell', sheet: 'Q3', range: 'B4' },
      { kind: 'slide', slide: 2 },
      { kind: 'slide', slide: 2, rect },
      { kind: 'shape', slide: 2, shape: 's257/12', quote: 'Revenue' },
      { kind: 'para', para: '3F2A10B7' },
      { kind: 'region', rect },
      { kind: 'region', page: 1, rect },
      { kind: 'text', line: 12, quote: 'fn main' },
    ];
    for (const a of ok) expect(readAnchor(a)).toEqual(a);
  });

  it('drops extra fields and refuses missing or wrong ones', () => {
    expect(readAnchor({ kind: 'cell', sheet: 'Q3', range: 'B4', color: 'red' })).toEqual({ kind: 'cell', sheet: 'Q3', range: 'B4' });
    expect(readAnchor({ kind: 'cell', sheet: 'Q3' })).toBeNull();
    expect(readAnchor({ kind: 'slide', slide: -1 })).toBeNull();
    expect(readAnchor({ kind: 'slide', slide: 1.5 })).toBeNull();
    expect(readAnchor({ kind: 'region', rect: { x: 1, y: 2, w: 3 } })).toBeNull();
    expect(readAnchor({ kind: 'region', rect: { x: 1, y: 2, w: 3, h: Number.NaN } })).toBeNull();
    expect(readAnchor({ kind: 'shape', slide: 1, shape: '' })).toBeNull();
    expect(readAnchor({ kind: 'Unknown' })).toBeNull();
    expect(readAnchor(null)).toBeNull();
    expect(readAnchor([{ kind: 'cell' }])).toBeNull();
  });
});

describe('the frame keeps its src across versions (plan §6)', () => {
  const sheet = { kind: 'sheet', url: '/w/q3.xlsx', version: 4, frame_url: `${SERVER}/a/q3-xlsx/view` };

  it("the current version frames the viewer without a version: a new one doesn't change it", () => {
    expect(frameSrc(sheet, 4, 'dark')).toBe(`${SERVER}/a/q3-xlsx/view?theme=dark`);
    expect(frameSrc({ ...sheet, version: 5 }, 5, 'dark')).toBe(frameSrc(sheet, 4, 'dark'));
  });

  it('the window never builds a url: an older version of a file frames nothing from the newest one', () => {
    expect(frameSrc(sheet, 2, null)).toBeNull();
    expect(frameSrc({ kind: 'file', url: '/w/plan.html', version: 3, frame_url: `${SERVER}/a/plan/3/plan.html` }, 2, null)).toBeNull();
  });

  it("the origin a selection must come from is the frame's own", () => {
    expect(originOf(`${SERVER}/a/q3-xlsx/view?theme=dark`)).toBe(SERVER);
    expect(originOf(null)).toBeNull();
    expect(originOf('about:blank')).toBeNull();
  });
});
