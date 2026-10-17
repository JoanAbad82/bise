import { describe, expect, it } from 'vitest';
import { answeredEv, refusedEv, RESTARTED_WORDS } from './local';

const P = 'acme-1a2b3c4d';
const pick = { agent: 'perf', notice: 'you answered perf: warm', pick: 'warm', question: 'which bench?' };

describe("the window-local events main builds from the core's answers (ipc.ts, the nightly check)", () => {
  it('an answer: card_answered with the hub\'s answer, or a null answer when the step closed none', () => {
    expect(answeredEv({ cmd: 'answer', project: P, card: 9, reply: '2' }, { answer: pick })).toEqual({ ev: 'card_answered', project: P, card: 9, answer: pick });
    expect(answeredEv({ cmd: 'answer', project: P, card: 9, reply: '2' }, {})).toEqual({ ev: 'card_answered', project: P, card: 9, answer: null });
    expect(answeredEv({ cmd: 'answer', project: P, card: 9, reply: '2' }, null)).toEqual({ ev: 'card_answered', project: P, card: 9, answer: null });
  });

  it('a send: sent with its message id, or a null id from an older hub', () => {
    expect(answeredEv({ cmd: 'send', project: P, agent: 'main', text: 'hi', cid: 3 }, { msg_id: 41 })).toEqual({ ev: 'sent', project: P, agent: 'main', cid: 3, msg_id: 41 });
    expect(answeredEv({ cmd: 'send', project: P, agent: 'main', text: 'hi', cid: 3 }, {})).toEqual({ ev: 'sent', project: P, agent: 'main', cid: 3, msg_id: null });
  });

  it('a close taken, or any other command: no event (the rows say it)', () => {
    expect(answeredEv({ cmd: 'close', project: P, card: 9 }, {})).toBeNull();
    expect(answeredEv({ cmd: 'subscribe', project: P, agent: 'main' }, {})).toBeNull();
    expect(answeredEv({ cmd: 'shown', projects: [P] }, {})).toBeNull();
  });

  it("a refusal: card_refused with the core's words; a core gone before it answered says so", () => {
    expect(refusedEv(P, 9, "notification #9 isn't open")).toEqual({ ev: 'card_refused', project: P, card: 9, text: "notification #9 isn't open" });
    expect(refusedEv(P, 9, RESTARTED_WORDS)).toEqual({ ev: 'card_refused', project: P, card: 9, text: RESTARTED_WORDS });
    expect(RESTARTED_WORDS).toMatch(/^bise restarted before your answer was confirmed/);
  });
});
