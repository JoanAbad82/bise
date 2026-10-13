// inbox card v2 item 7: the composer's label while it answers the docked card.
import { describe, expect, it } from 'vitest';
import { answeringLabel, answerNoteOf } from './ThreadComposer';

describe('answering a docked card', () => {
  it("names who asks (main is bise) and cuts the question to one short line", () => {
    expect(answeringLabel({ agent: 'perf', question: 'which bench?' })).toBe('answering perf · which bench?');
    expect(answeringLabel({ agent: 'main', question: 'merge  gift-cards\ninto main?' })).toBe('answering bise · merge gift-cards into main?');
    const long = answeringLabel({ agent: 'perf', question: 'a'.repeat(80) });
    expect(long).toBe(`answering perf · ${'a'.repeat(39)}…`);
  });
});

describe("the hub's word on his answer (main m_21514)", () => {
  const asked = { project: 'shop-ab9f3c3b' };
  it("takes the answering project's notice or error for cmd 'answer', nothing else", () => {
    const text = 'sent to main: "Ou sont les drafts?". the drafts still wait for you.';
    expect(answerNoteOf({ ev: 'notice', project: asked.project, cmd: 'answer', text }, asked)).toEqual({ level: 'info', text });
    expect(answerNoteOf({ ev: 'error', project: asked.project, cmd: 'answer', text: "card #4 isn't open" }, asked)).toEqual({ level: 'err', text: "card #4 isn't open" });
    expect(answerNoteOf({ ev: 'notice', project: 'other', cmd: 'answer', text }, asked)).toBeNull();
    expect(answerNoteOf({ ev: 'notice', project: asked.project, cmd: 'slash', text }, asked)).toBeNull();
    expect(answerNoteOf({ ev: 'notice', project: asked.project, text }, asked)).toBeNull();
    expect(answerNoteOf({ ev: 'notice', project: asked.project, cmd: 'answer', text }, null)).toBeNull();
  });
});
