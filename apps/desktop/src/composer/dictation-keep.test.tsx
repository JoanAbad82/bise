// @vitest-environment happy-dom
// A ctrl+r take survives a chat switch, a project switch (the field goes) and a relaunch (his ask,
// dictation-keep): still transcribed, it goes on and he sees it when he is back; finished, its words
// are in that chat's input; failed, its line and 'try again' are still there and work. On a fake
// transcriber (the store's port as the composer sees it): never his mic.
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Composer } from './Composer';
import type { ComposerActions } from './actions';
import { load, type Store } from './drafts';
import { entryOf, entrySegments } from './entry';
import { landTake, unparkAll } from './parked';
import { NO_SOURCES, type DictatePort, type DictateState } from './sources';

afterEach(() => {
  cleanup();
  unparkAll();
});

/** The core's transcriber, faked: `say(id, state)` is its next dictation event. `known` false: a
 *  fresh window after a relaunch (it has seen no take yet). */
function fakeTranscriber() {
  const states = new Map<string, DictateState>();
  const subs = new Map<string, Set<() => void>>();
  const calls: string[] = [];
  let n = 0;
  const say = (id: string, st: Partial<DictateState>): void => {
    states.set(id, { text: '', final: false, cancelled: false, error: null, ...st });
    for (const fn of subs.get(id) ?? []) fn();
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
    cancel: (id) => {
      calls.push(`cancel ${id}`);
      say(id, { final: true, cancelled: true });
    },
    retry: (id) => {
      calls.push(`retry ${id}`);
      states.set(id, { text: '', final: false, cancelled: false, error: null });
    },
    drop: (id) => calls.push(`drop ${id}`),
    done: (id) => calls.push(`done ${id}`),
    read: (id) => states.get(id) ?? null,
    subscribe: (id, fn) => {
      const s = subs.get(id) ?? new Set();
      s.add(fn);
      subs.set(id, s);
      return () => s.delete(fn);
    },
  };
  return { port, calls, say };
}

const memStore = (): Store => {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};

async function mount(store: Store, mic: ReturnType<typeof fakeTranscriber>, target = 'p/main') {
  const got: { a: ComposerActions | null } = { a: null };
  const el = (t: string) => <Composer target={t} store={store} sources={{ ...NO_SOURCES, dictate: mic.port }} onSend={vi.fn()} onReady={(a) => (got.a = a)} />;
  const ui = render(el(target));
  await act(async () => {
    await Promise.resolve();
  });
  if (got.a === null) throw new Error('composer not ready');
  const a = got.a;
  const go = async (t: string): Promise<void> => {
    await act(async () => {
      ui.rerender(el(t));
      await Promise.resolve();
    });
  };
  const say = async (id: string, st: Partial<DictateState>): Promise<void> => {
    await act(async () => {
      mic.say(id, st);
      await Promise.resolve();
    });
  };
  const run = async (f: () => void): Promise<void> => {
    await act(async () => {
      f();
      await Promise.resolve();
    });
  };
  const field = (): string => ui.getByTestId('composer.field').textContent;
  const take = () => ui.queryByTestId('composer.dictation');
  return { ...ui, a, go, say, run, field, take };
}

const draft = (store: Store, key: string) => entrySegments(load(store, key).draft ?? 'null');

describe('dictation-keep: a take survives a switch and a relaunch', () => {
  it('still transcribed at a chat switch: the mic goes off, it goes on, and he sees it when he is back; its words land there', async () => {
    const store = memStore();
    const mic = fakeTranscriber();
    const f = await mount(store, mic);
    await f.run(() => {
      f.a.insertText('fix:');
      f.a.dictate();
    });
    await f.say('d1', { text: 'the login' });
    await f.go('p/perf'); // another chat while he talks
    expect(mic.calls).toEqual(['start d1', 'stop d1']); // never a hot mic for a chat he left
    expect(f.take(), 'not in the other chat').toBeNull();
    expect(draft(store, 'p/main')).toEqual([{ kind: 'text', text: 'fix:' }, { kind: 'take', id: 'd1' }]);
    await f.say('d1', { text: 'the login test' }); // a late partial: nothing goes in this field
    expect(f.field()).toBe('');
    await f.go('p/main');
    expect(f.take(), 'its chip is back, transcribing').not.toBeNull();
    await f.say('d1', { text: 'the login test', final: true });
    expect(f.field()).toBe('fix: the login test');
    expect(mic.calls.at(-1)).toBe('done d1'); // the core lets its sound go
  });

  it('finished while he is away (a project switch: the field went): its words are in that chat\'s input on his return', async () => {
    const store = memStore();
    const mic = fakeTranscriber();
    const f = await mount(store, mic);
    await f.run(() => {
      f.a.insertText('note');
      f.a.dictate();
    });
    f.unmount(); // another project: this composer goes
    expect(mic.calls).toEqual(['start d1', 'stop d1']);
    mic.say('d1', { text: 'on garde la file', final: true });
    expect(draft(store, 'p/main')).toEqual([{ kind: 'text', text: 'note on garde la file' }]);
    expect(mic.calls.at(-1)).toBe('done d1');
    const back = await mount(store, mic);
    expect(back.field()).toBe('note on garde la file');
    expect(back.take()).toBeNull();
  });

  it("failed while he is away: the error is still there when he is back, and 'try again' works", async () => {
    const store = memStore();
    const mic = fakeTranscriber();
    const f = await mount(store, mic);
    await f.run(() => {
      f.a.dictate();
    });
    await f.go('p/perf');
    await f.say('d1', { final: true, kept: true, error: 'the listener: 503.' });
    expect(draft(store, 'p/main')).toEqual([{ kind: 'take', id: 'd1', failed: 'the listener: 503' }]);
    expect(mic.calls).not.toContain('done d1'); // the core keeps its sound for the retry
    await f.go('p/main');
    expect(f.take()?.hasAttribute('data-failed')).toBe(true);
    expect(f.getByTestId('composer.dictation.retry')).toBeTruthy();
    await f.run(() => {
      fireEvent.click(f.getByTestId('composer.dictation.retry'));
    });
    expect(mic.calls.at(-1)).toBe('retry d1');
    await f.say('d1', { text: 'found it', final: true });
    expect(f.field()).toBe('found it');
  });

  it('a relaunch: a take still transcribed at the quit is asked again and lands; a failed one keeps its line and retries', async () => {
    const store = memStore();
    // the draft the last run left: words, a take in flight, a failed take
    store.setItem('bise.composer.v1.p/main', JSON.stringify({ draft: entryOf([{ kind: 'text', text: 'a' }, { kind: 'take', id: 'd7-1' }, { kind: 'text', text: ' b ' }, { kind: 'take', id: 'd8-1', failed: 'offline' }]), history: [] }));
    const mic = fakeTranscriber(); // a fresh window: it knows no take
    const f = await mount(store, mic);
    expect(mic.calls).toEqual(['retry d7-1']); // the core transcribes its sound again (on disk)
    expect(f.getAllByTestId('composer.dictation')).toHaveLength(2);
    await f.say('d7-1', { text: 'back again', final: true });
    // the failed take's line after his words (its text is the line's: '▲ couldn't transcribe it (offline) · try again')
    expect(f.field()).toMatch(/^a back again b ▲.*\(offline\)/u);
    expect(f.getAllByTestId('composer.dictation')).toHaveLength(1);
    expect(f.take()?.hasAttribute('data-failed')).toBe(true);
    await f.run(() => {
      fireEvent.click(f.getByTestId('composer.dictation.retry'));
    });
    expect(mic.calls.at(-1)).toBe('retry d8-1');
    await f.say('d8-1', { text: 'and this', final: true });
    expect(f.field()).toBe('a back again b and this');
  });
});

describe('landTake: a final into a saved draft', () => {
  const base = [{ kind: 'text', text: 'x' }, { kind: 'take', id: 'd1' }, { kind: 'text', text: ' y' }] as const;
  const st = (p: Partial<DictateState>): DictateState => ({ text: '', final: true, cancelled: false, error: null, ...p });
  it('not final: nothing changes', () => {
    expect(landTake(base, 'd1', st({ final: false, text: 'hi' }))).toBeNull();
  });
  it('words in its place, a space after a word', () => {
    expect(landTake(base, 'd1', st({ text: ' hi ' }))).toEqual({ segs: [{ kind: 'text', text: 'x' }, { kind: 'text', text: ' hi' }, { kind: 'text', text: ' y' }], landed: 'words' });
  });
  it('no words, kept: failed with its short reason; not kept or cancelled: its place goes', () => {
    expect(landTake(base, 'd1', st({ kept: true, error: 'down.' }))?.segs[1]).toEqual({ kind: 'take', id: 'd1', failed: 'down' });
    expect(landTake(base, 'd1', st({}))).toEqual({ segs: [base[0], base[2]], landed: 'gone' });
    expect(landTake(base, 'd1', st({ cancelled: true, text: 'x' }))?.landed).toBe('gone');
  });
  it('its place lost: the words at the end, never lost', () => {
    expect(landTake([{ kind: 'text', text: 'x' }], 'd9', st({ text: 'late' }))?.segs).toEqual([{ kind: 'text', text: 'x' }, { kind: 'text', text: ' late' }]);
  });
});
