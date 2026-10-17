// The composer's wire, golden (architect m_11500 (1)): for each content, the exact text
// the send carries, and its typed parts when it has a quote, a paste or an image (msg-parts: then
// the text is his words with the chips' labels, never the model's template, delta review D2). engine.test.tsx proves the engine gives these bytes (the
// table was the Lexical engine's too before it went).
import type { Chip, Outgoing } from '../message';

export const img: Chip = { kind: 'image', n: 1, path: '/Users/g/shot.png', name: 'shot.png' };
export const paste: Chip = { kind: 'paste', n: 2, text: Array.from({ length: 14 }, (_, i) => `line ${i + 1}`).join('\n') };
export const quote: Chip = { kind: 'quote', n: 3, text: 'fn a() {}\nfn b() {}', from: 'perf vs main', at: { file: 'src/q.rs', new: '10-11', old: '' } };
export const artifact: Chip = { kind: 'artifact', n: 4, id: 'a1', title: 'Q3 [plan]', url: 'https://bise.dev/m/q3' };

/** A message as paragraphs of parts: a string is text ('\n' a line break), an object a chip. */
export type Part = string | Chip;
export type Content = readonly (readonly Part[])[];

export const CASES: readonly { name: string; content: Content; golden: Outgoing }[] = [
  { name: 'plain text', content: [['ça va ? 👍']], golden: { text: 'ça va ? 👍' } },
  { name: 'line breaks and trimmed ends', content: [['  first\nsecond\n\n']], golden: { text: 'first\nsecond' } },
  { name: 'two paragraphs (an old draft)', content: [['one'], ['two']], golden: { text: 'one\ntwo' } },
  { name: 'an image', content: [['see ', img, ' here']], golden: { text: 'see [Image #1] here', parts: [{ kind: 'text', text: 'see ' }, { kind: 'image', name: '[Image #1]', source: '/Users/g/shot.png' }, { kind: 'text', text: ' here' }] } },
  {
    name: 'a long paste',
    content: [['look: ', paste]],
    golden: { text: 'look: ▤ 2', parts: [{ kind: 'text', text: 'look: ' }, { kind: 'paste', n: 2, text: (paste as { text: string }).text }] },
  },
  {
    name: 'a quote of diff lines',
    content: [[quote, 'why this order?']],
    golden: {
      text: '❝ 3 why this order?',
      // msg-parts: the message typed; the hub renders the model's text from it, the window never;
      // the quote where its chip was, with its number (his m_22231)
      parts: [{ kind: 'quote', from: 'perf vs main', text: 'fn a() {}\nfn b() {}', file: 'src/q.rs', new: '10-11', n: 3 }, { kind: 'text', text: ' why this order?' }],
    },
  },
  { name: 'an artifact', content: [['read ', artifact]], golden: { text: 'read [Q3 plan](https://bise.dev/m/q3)' } },
  { name: 'a code fence', content: [['```ts\nconst a = 1;\n  return a;\n```']], golden: { text: '```ts\nconst a = 1;\n  return a;\n```' } },
  { name: 'say/steer word dropped', content: [['steer use v2']], golden: { text: 'use v2' } },
];

