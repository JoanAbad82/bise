// the hub's word on the answer the composer sent (its label: inbox/Block.tsx answeringOf).
import { describe, expect, it } from 'vitest';
import { answerNoteOf } from './ThreadComposer';

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
