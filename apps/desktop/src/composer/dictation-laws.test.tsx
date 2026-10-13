// @vitest-environment happy-dom
// The field's dictation never loses a take to a key (his 'je perds tous mes messages', ambient-lead
// m_22121): one law per cause found in the window, each failing on main 2c68d194.
//   H0 the window waits for the core's final as long as the core does (a batch listener flushes late);
//   H1 a ctrl+r while a take is still transcribed starts a new take, the old one's words still land;
//   H2 the press's first release decides: ctrl let go late after a quick r is still a toggle;
//   H4 a stop then a start within 400 ms is a new take, not voice mode cancelling the take;
//   and a take whose node went (the field cleared) puts its words at the caret.
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Composer } from './Composer';
import type { ComposerActions } from './actions';
import type { Store } from './drafts';
import { NO_SOURCES, type DictatePort, type DictateState } from './sources';
import { DICTATE_STOP_WAIT_MS } from '@/store/store';

afterEach(cleanup);

/** A mic the test drives: `say(id, state)` is the core's next dictation event. */
function testMic() {
  const states = new Map<string, DictateState>();
  const subs = new Map<string, () => void>();
  const calls: string[] = [];
  let n = 0;
  const say = (id: string, st: Partial<DictateState>): void => {
    states.set(id, { text: '', final: false, cancelled: false, error: null, ...st });
    subs.get(id)?.();
  };
  const port: DictatePort = {
    start: () => {
      n += 1;
      const id = `d${String(n)}`;
      calls.push(`start ${id}`);
      states.set(id, { text: '', final: false, cancelled: false, error: null });
      return id;
    },
    stop: (id) => calls.push(`stop ${id}`),
    // the store's cancel: over at once, no words
    cancel: (id) => {
      calls.push(`cancel ${id}`);
      say(id, { final: true, cancelled: true });
    },
    read: (id) => states.get(id) ?? null,
    subscribe: (id, fn) => {
      subs.set(id, fn);
      return () => subs.delete(id);
    },
  };
  return { port, calls, say };
}

const memStore = (): Store => {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};

async function mount() {
  const mic = testMic();
  const voice = vi.fn();
  const got: { a: ComposerActions | null } = { a: null };
  const ui = render(<Composer target="p/main" store={memStore()} sources={{ ...NO_SOURCES, dictate: mic.port, voice }} onSend={vi.fn()} onReady={(a) => (got.a = a)} />);
  await act(async () => {
    await Promise.resolve();
  });
  if (got.a === null) throw new Error('composer not ready');
  const field = ui.getByTestId('composer.field');
  /** one key event at time `t` (ms), ctrl held for 'r' */
  const key = async (type: 'keydown' | 'keyup', k: string, t: number): Promise<void> => {
    await act(async () => {
      const e = new KeyboardEvent(type, { key: k, ctrlKey: k === 'r' || (type === 'keydown' && k === 'Control'), bubbles: true, cancelable: true });
      Object.defineProperty(e, 'timeStamp', { value: t });
      field.dispatchEvent(e);
      await Promise.resolve();
    });
  };
  /** ctrl+r: ctrl and r down at t, r up after `rUp` ms, ctrl up after `ctrlUp` ms */
  const press = async (t: number, rUp = 60, ctrlUp = 90): Promise<void> => {
    await key('keydown', 'Control', t - 10);
    await key('keydown', 'r', t);
    const ups: [string, number][] = [['r', t + rUp], ['Control', t + ctrlUp]];
    ups.sort((x, y) => x[1] - y[1]);
    for (const [k, at] of ups) await key('keyup', k, at);
  };
  const say = async (id: string, st: Partial<DictateState>): Promise<void> => {
    await act(async () => {
      mic.say(id, st);
      await Promise.resolve();
    });
  };
  const mode = (): string | undefined => ui.getByTestId('composer.mic').dataset.state;
  return { ...ui, mic, voice, a: got.a, field, press, say, mode };
}

describe('dictation: a take is never lost to a key', () => {
  it('H0: the window waits past the core (120 s) for a stopped take\'s final', () => {
    expect(DICTATE_STOP_WAIT_MS).toBeGreaterThan(120_000);
  });

  it("H1: ctrl+r while a take is transcribed starts a new take; the first one's words still land in its place", async () => {
    const f = await mount();
    await f.press(0);
    await f.say('d1', { text: 'the first take' });
    await f.press(3000); // the mic off: d1 is transcribed
    expect(f.mode()).toBe('transcribing');
    await f.press(4000); // he goes on talking at once
    expect(f.mic.calls).toEqual(['start d1', 'stop d1', 'start d2']);
    expect(f.mode()).toBe('recording');
    await f.say('d2', { text: 'and a second' });
    await f.say('d1', { text: 'the first take', final: true });
    expect(f.field.textContent).toContain('the first take');
    expect(f.mode(), 'd2 still listens').toBe('recording');
    await f.press(7000);
    await f.say('d2', { text: 'and a second', final: true });
    expect(f.field.textContent).toBe('the first take and a second');
    expect(f.mode()).toBe('off');
    expect(f.voice).not.toHaveBeenCalled();
  });

  it("H1: the stopped take's node says 'transcribing…' until its final, however long", async () => {
    const f = await mount();
    await f.press(0);
    await f.press(3000);
    expect(f.getByTestId('composer.dictation').textContent).toBe('transcribing…');
  });

  it('H2: a quick r with ctrl let go late is a toggle: the mic stays on', async () => {
    const f = await mount();
    await f.press(0, 60, 900);
    expect(f.mic.calls).toEqual(['start d1']);
    expect(f.mode()).toBe('recording');
  });

  it('H2: held past 400 ms it is push-to-talk: its release stops the mic', async () => {
    const f = await mount();
    await f.press(0, 900, 950);
    expect(f.mic.calls).toEqual(['start d1', 'stop d1']);
  });

  it('H4: a stop then a start within 400 ms is a new take, never voice mode cancelling the stopped one', async () => {
    const f = await mount();
    await f.press(0);
    await f.say('d1', { text: 'keep these words' });
    await f.press(3000);
    await f.press(3200);
    expect(f.voice).not.toHaveBeenCalled();
    expect(f.mic.calls).toEqual(['start d1', 'stop d1', 'start d2']);
    await f.say('d1', { text: 'keep these words', final: true });
    expect(f.field.textContent).toContain('keep these words');
  });

  it('H4: a real double press from idle is voice mode, its fresh take cancelled', async () => {
    const f = await mount();
    await f.press(0);
    await f.press(200);
    expect(f.voice).toHaveBeenCalledTimes(1);
    expect(f.mic.calls).toEqual(['start d1', 'cancel d1']);
    expect(f.mode()).toBe('off');
  });

  it('a take whose node went (the field cleared) puts its words at the caret', async () => {
    const f = await mount();
    await f.press(0);
    await f.press(3000);
    await act(async () => {
      f.a.fill('');
      await Promise.resolve();
    });
    await f.say('d1', { text: 'still mine', final: true });
    expect(f.field.textContent).toBe('still mine');
  });
});
