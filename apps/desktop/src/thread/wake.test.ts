import { describe, expect, it } from 'vitest';
import type { Agent, AgentWatch } from '@/proto';
import { alarms, clockAhead, clockPast, paused, pauseLine, waitLen, wakeLine, wakeTail, watchEvent } from './wake';
import WAIT_WORDS from '../../../../rust/proto/fixtures/wait_words.json';

// An agent row from the fixture's few fields, the rest an idle agent's (words.rs does the same).
type FxAgent = { name: string; status?: string; since_ms?: number; waiting_on?: unknown; watching?: unknown[] };
const agent = (x: FxAgent): Pick<Agent, 'name' | 'status' | 'since_ms' | 'waiting_on'> & { watching: AgentWatch[] } => ({
  name: x.name,
  status: (x.status ?? 'idle') as Agent['status'],
  since_ms: x.since_ms ?? 0,
  waiting_on: (x.waiting_on ?? null) as Agent['waiting_on'],
  watching: (x.watching ?? []) as AgentWatch[],
});

describe("agent-waiting-states A: the wait words, words.rs's (wait_words.json)", () => {
  it('a duration for what runs now', () => {
    for (const c of WAIT_WORDS.len) {
      expect(waitLen(c.ms), String(c.ms)).toBe(c.long);
      expect(waitLen(c.ms, true), String(c.ms)).toBe(c.short);
    }
  });

  it("a clock for what's ahead, a relative one for what's past; each instant its own offset", () => {
    for (const c of WAIT_WORDS.ahead) expect(clockAhead(c.at_ms, c.at_off_s, c.now_ms, c.now_off_s), c.why).toBe(c.clock);
    for (const c of WAIT_WORDS.past) expect(clockPast(c.at_ms, c.at_off_s, c.now_ms, c.now_off_s), c.why).toBe(c.clock);
  });

  it('a pause: continues when, the event, a duration; an alarm is no pause', () => {
    for (const c of WAIT_WORDS.pauses) {
      const a = agent(c.agent);
      expect(pauseLine(a, c.now_ms, c.short), c.why).toEqual(c.want);
      expect(paused(a), c.why).toBe(c.want !== null);
    }
  });

  it('an alarm: if the event, until a clock ahead, the hover says when it was set', () => {
    for (const c of WAIT_WORDS.alarms) expect(alarms(agent(c.agent as FxAgent), c.now_ms, () => c.off_s), c.why).toEqual(c.want);
  });

  it("a watch's event", () => {
    expect(watchEvent('bg', 'cargo bench', false)).toBe('cargo bench ends');
    expect(watchEvent('file', 'build.rc', false)).toBe('build.rc appears');
    expect(watchEvent('file', 'the nightly gate goes red', true)).toBe('the nightly gate goes red');
  });
});

describe('event-wake: the wake line (designer page event-wake, words.rs)', () => {
  it("the hub's head, only a non-zero rc red, '–' when he stopped waiting; its folded output", () => {
    const ended = (rc: number | null, text: string) => wakeLine({ text, wake: { id: 1, ev: 'ended', kind: 'bg', what: 'cargo test', rc, after_ms: 1 } });
    expect(ended(101, 'cargo test ended · rc 101 · after 3m10s')).toEqual({
      mark: '·',
      parts: [
        { text: 'cargo test ended', err: false },
        { text: 'rc 101', err: true },
        { text: 'after 3m10s', err: false },
      ],
    });
    expect(ended(0, 'cargo test ended · rc 0 · after 2m04s').parts.some((p) => p.err)).toBe(false);
    expect(wakeLine({ text: 'stopped waiting for the reindex', wake: { id: 1, ev: 'stopped', kind: 'pid', what: 'the reindex', after_ms: 9 } }).mark).toBe('–');
    expect(wakeLine({ text: 'stopped waiting for npm run dev after 24h', wake: { id: 1, ev: 'expired', kind: 'bg', what: 'npm run dev', after_ms: 86_400_000 } }).mark).toBe('–');
    expect(wakeLine({ text: 'the reindex still running after 1h00m', wake: { id: 1, ev: 'still', kind: 'pid', what: 'the reindex', after_ms: 3_600_000 } }).mark).toBe('·');
    expect([wakeTail(0), wakeTail(1), wakeTail(3)]).toEqual([null, 'its last line', 'its last 3 lines']);
  });
});
