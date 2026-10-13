// inbox card v2 item 7: the composer's label while it answers the docked card.
import { describe, expect, it } from 'vitest';
import { answeringLabel } from './ThreadComposer';

describe('answering a docked card', () => {
  it("names who asks (main is bise) and cuts the question to one short line", () => {
    expect(answeringLabel({ agent: 'perf', question: 'which bench?' })).toBe('answering perf · which bench?');
    expect(answeringLabel({ agent: 'main', question: 'merge  gift-cards\ninto main?' })).toBe('answering bise · merge gift-cards into main?');
    const long = answeringLabel({ agent: 'perf', question: 'a'.repeat(80) });
    expect(long).toBe(`answering perf · ${'a'.repeat(39)}…`);
  });
});
