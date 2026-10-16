// events.ts: hub/activity -> the office's BimEvent, on fake events.
import { describe, expect, it } from 'vitest';
import type { Ev } from '@/store';
import type { ActivityEv } from '@/proto';
import { bimEventOf } from './events';

const P = 'acme-1a2b3c4d';
const act = (item: ActivityEv, project = P): Ev => ({ ev: 'activity', project, item });
const msg = (from: Extract<ActivityEv, { kind: 'message' }>['from'], to: Extract<ActivityEv, { kind: 'message' }>['to']): ActivityEv => ({
  kind: 'message',
  id: 7,
  from,
  to,
  mode: 'queued',
  expects_reply: true,
  at_ms: 1_700_000_000_500,
});

describe('hub/activity in the office', () => {
  it('his message: a plane from you to the agent, its mode and expects_reply kept, t in seconds', () => {
    expect(bimEventOf(act(msg({ who: 'you' }, { who: 'agent', name: 'perf' })), P)).toEqual({
      kind: 'message',
      from: { who: 'you' },
      to: { who: 'agent', name: 'perf' },
      mode: 'queued',
      expectsReply: true,
      t: 1_700_000_000.5,
    });
  });
  it("an agent's message to another keeps both names", () => {
    const e = bimEventOf(act(msg({ who: 'agent', name: 'main' }, { who: 'agent', name: 'perf' })), P);
    expect(e?.kind === 'message' ? [e.from, e.to] : null).toEqual([
      { who: 'agent', name: 'main' },
      { who: 'agent', name: 'perf' },
    ]);
  });
  it('bise, github or an unknown party draw nothing', () => {
    expect(bimEventOf(act(msg({ who: 'bise' }, { who: 'agent', name: 'perf' })), P)).toBeNull();
    expect(bimEventOf(act(msg({ who: 'agent', name: 'perf' }, { who: 'github' })), P)).toBeNull();
    expect(bimEventOf(act(msg({ who: 'unknown' }, { who: 'you' })), P)).toBeNull();
  });
  it('a report: a sheet to main', () => {
    expect(bimEventOf(act({ kind: 'report', agent: 'perf', report: 'done', at_ms: 2000 }), P)).toEqual({ kind: 'report', agent: 'perf', report: 'done', t: 2 });
  });
  it('unknown, another project, another event: nothing', () => {
    expect(bimEventOf(act({ kind: 'unknown' }), P)).toBeNull();
    expect(bimEventOf(act(msg({ who: 'you' }, { who: 'agent', name: 'perf' }), 'other-00000000'), P)).toBeNull();
    expect(bimEventOf({ ev: 'job_end', project: P } as unknown as Ev, P)).toBeNull();
  });
});
