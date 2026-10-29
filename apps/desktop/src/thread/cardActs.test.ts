// His free text with an inbox item open (his rule m_44704): every kind takes it and the item
// leaves the open state. Per kind: the inbox block's answeringOf → the composer's answerOf →
// cardActs, run through a real Store as the composer runs them; out: the hub commands it sent and
// the store's inbox items. No open item: nothing of the card's, his words go as a message.
import { describe, expect, it } from 'vitest';
import type { Card, ProjectRow } from '@/proto';
import { Store } from '@/store';
import type { CoreCmd } from '@/shared/api';
import { answeringOf } from '@/inbox/Block';
import { answerOf, cardActs } from './ThreadComposer';

const P = 'acme-1a2b3c4d';
const HERE = { project: P, agent: 'main' };
const NOW = 1_791_100_000_000;

function cardOf(id: number, kind: string, approval: boolean): Card {
  return { agent: 'perf', id, kind, approval, options: [{ n: 1, label: 'yes' }, { n: 2, label: 'no' }], project: P, question: `${kind}?`, rank: 1, since_ms: NOW, urgent: false };
}

function rowOf(cards: Card[]): ProjectRow {
  return { project: P, name: 'acme', path: '/x/acme', home: false, git: true, order: 1, running: true, agents: 1, waits: cards.length, working: 0, cards };
}

/** His free text 'not on friday' sent with `c` open: the commands that left, the inbox after. */
function sendWith(c: Card | null): { sent: CoreCmd[]; open: number[] } {
  const sent: CoreCmd[] = [];
  const s = new Store({ send: (cmd) => { sent.push(cmd); } }, { now: () => NOW, asides: { read: () => undefined, write: () => undefined } });
  s.setCore('up');
  s.apply({ ev: 'projects', projects: [rowOf(c === null ? [] : [c])] });
  const out = { text: 'not on friday' };
  const a = answerOf(c === null ? null : answeringOf(c, HERE, 'acme'));
  if (a === null) s.send({ project: HERE.project, agent: HERE.agent, text: out.text, mode: 'now' });
  else for (const x of cardActs(a, out, HERE)) if (x.act === 'send') s.send(x.send); else s.do(x.do);
  return { sent, open: s.inboxItems().map((i) => i.id) };
}

const cmds = (sent: CoreCmd[]) => sent.map((c) => {
  const r = c as unknown as Record<string, unknown>;
  return { cmd: r['cmd'], card: r['card'], reply: r['reply'], agent: r['agent'], text: r['text'] };
});

describe('free text with an item open answers it and closes it, for every kind (his rule m_44704)', () => {
  it('a question: his text is its answer', () => {
    const r = sendWith(cardOf(9, 'question', false));
    expect(cmds(r.sent)).toEqual([{ cmd: 'answer', card: 9, reply: 'not on friday', agent: undefined, text: undefined }]);
    expect(r.open).toEqual([]);
  });

  it("a tool call's approval: refused, his text the reason (the hub's 'deny: <why>')", () => {
    const r = sendWith(cardOf(10, 'confirm', true));
    expect(cmds(r.sent)).toEqual([{ cmd: 'answer', card: 10, reply: 'deny: not on friday', agent: undefined, text: undefined }]);
    expect(r.open).toEqual([]);
  });

  for (const kind of ['merge', 'feature_try', 'feature_merge', 'update', 'signin']) {
    it(`a ${kind} item: his text steers its agent, then the item closes`, () => {
      const r = sendWith(cardOf(12, kind, true));
      const c = cmds(r.sent);
      expect(c.filter((x) => x.cmd === 'close')).toEqual([{ cmd: 'close', card: 12, reply: undefined, agent: undefined, text: undefined }]);
      expect(r.sent.some((x) => JSON.stringify(x).includes('"not on friday"') && JSON.stringify(x).includes('"perf"'))).toBe(true);
      expect(c.some((x) => x.cmd === 'answer')).toBe(false);
      expect(r.open).toEqual([]);
    });
  }

  it("an approval that is not a tool call (a batch's 'send the 3 replies?'): a steer, then closed, never a 'deny:' answer", () => {
    const r = sendWith(cardOf(31, 'question', true));
    expect(cmds(r.sent).map((x) => x.cmd)).toContain('close');
    expect(cmds(r.sent).some((x) => x.cmd === 'answer')).toBe(false);
    expect(r.open).toEqual([]);
  });

  it('no item open: a plain message to his thread, no card command', () => {
    const r = sendWith(null);
    expect(cmds(r.sent).some((x) => x.cmd === 'answer' || x.cmd === 'close')).toBe(false);
    expect(r.sent.some((x) => JSON.stringify(x).includes('"not on friday"'))).toBe(true);
  });
});
