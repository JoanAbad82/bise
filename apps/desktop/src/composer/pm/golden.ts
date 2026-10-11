// The composer's wire, golden (architect m_11500 (1)): for each content, the exact text and files
// the send carries, and its typed parts when it has quotes or pastes (msg-parts). engine.test.tsx proves both engines give these bytes; the table stays as the
// fixture once the Lexical engine is gone, with fixtures/lexical-entries.json (each content as
// the Lexical engine saved it, for the old-draft reader).
import type { Chip, Outgoing } from '../message';

export const img: Chip = { kind: 'image', n: 1, path: '/Users/g/shot.png', name: 'shot.png' };
export const paste: Chip = { kind: 'paste', n: 2, text: Array.from({ length: 14 }, (_, i) => `line ${i + 1}`).join('\n') };
export const quote: Chip = { kind: 'quote', n: 3, text: 'fn a() {}\nfn b() {}', from: 'perf vs main', at: { file: 'src/q.rs', new: '10-11', old: '' } };
export const artifact: Chip = { kind: 'artifact', n: 4, id: 'a1', title: 'Q3 [plan]', url: 'https://bise.dev/m/q3' };

/** A message as paragraphs of parts: a string is text ('\n' a line break), an object a chip. */
export type Part = string | Chip;
export type Content = readonly (readonly Part[])[];

export const CASES: readonly { name: string; content: Content; golden: Outgoing }[] = [
  { name: 'plain text', content: [['ça va ? 👍']], golden: { text: 'ça va ? 👍', files: [] } },
  { name: 'line breaks and trimmed ends', content: [['  first\nsecond\n\n']], golden: { text: 'first\nsecond', files: [] } },
  { name: 'two paragraphs (an old draft)', content: [['one'], ['two']], golden: { text: 'one\ntwo', files: [] } },
  { name: 'an image', content: [['see ', img, ' here']], golden: { text: 'see [Image #1] here', files: [], parts: [{ kind: 'text', text: 'see ' }, { kind: 'image', name: '[Image #1]', source: '/Users/g/shot.png' }, { kind: 'text', text: ' here' }] } },
  {
    name: 'a long paste',
    content: [['look: ', paste]],
    golden: { text: `look: <pasted n="2" lines="14">\n${(paste as { text: string }).text}\n</pasted>`, files: [], parts: [{ kind: 'text', text: 'look: ' }, { kind: 'paste', n: 2, text: (paste as { text: string }).text }] },
  },
  {
    name: 'a quote of diff lines',
    content: [[quote, 'why this order?']],
    golden: {
      text: '<selection from="perf vs main" file="src/q.rs" new="10-11">\nfn a() {}\nfn b() {}\n</selection>\nwhy this order?',
      files: [],
      // msg-parts: the same message typed (the hub renders the text above from it)
      parts: [{ kind: 'quote', from: 'perf vs main', text: 'fn a() {}\nfn b() {}', file: 'src/q.rs', new: '10-11' }, { kind: 'text', text: 'why this order?' }],
    },
  },
  { name: 'an artifact', content: [['read ', artifact]], golden: { text: 'read [Q3 plan](https://bise.dev/m/q3)', files: [] } },
  { name: 'a code fence', content: [['```ts\nconst a = 1;\n  return a;\n```']], golden: { text: '```ts\nconst a = 1;\n  return a;\n```', files: [] } },
  { name: 'say/steer word dropped', content: [['steer use v2']], golden: { text: 'use v2', files: [] } },
];

