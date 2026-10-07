// @vitest-environment happy-dom
// Dictation in the composer (bar I / 2.6): the whole text REPLACES the dictated part, the caret is
// kept, one final ends it, cancel removes its words, an error keeps them and says why.
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Composer } from './Composer';
import type { ComposerActions } from './Brain';
import { dictated, replaceOp } from './dictate';
import type { Store } from './drafts';
import { NO_SOURCES, type DictatePort, type DictateState } from './sources';

afterEach(cleanup);

describe('the dictated part', () => {
  it('gets a space after a word, none after a space or at the start', () => {
    expect(dictated('fix it', 'note:')).toBe(' fix it');
    expect(dictated('fix it', 'note: ')).toBe('fix it');
    expect(dictated('fix it', '')).toBe('fix it');
    expect(dictated('  ', 'note:')).toBe('');
  });
  it('is replaced from where it began, only the chars that changed, the caret kept', () => {
    // the caret at its end follows the new end
    expect(replaceOp(6, 'fix the', 'fix the login', 13)).toEqual({ from: 13, to: 13, insert: ' login', caret: 19 });
    // a correction rewrites from the first changed char
    expect(replaceOp(0, 'fix the log', 'fix the blog', 11)).toEqual({ from: 8, to: 11, insert: 'blog', caret: 12 });
    // he typed after it: his caret shifts with the change; before it: it stays
    expect(replaceOp(0, 'fix', 'fix it', 5)).toEqual({ from: 3, to: 3, insert: ' it', caret: 8 });
    expect(replaceOp(4, 'fix', 'fix it', 2)).toEqual({ from: 7, to: 7, insert: ' it', caret: 2 });
    // cancelled: the words go
    expect(replaceOp(6, 'fix it', '', 12)).toEqual({ from: 6, to: 12, insert: '', caret: 6 });
    expect(replaceOp(0, 'same', 'same', 4)).toBeNull();
  });
});

/** A mic the test drives: `say(id, state)` is the core's next dictation event. */
function testMic() {
  const states = new Map<string, DictateState>();
  const subs = new Map<string, () => void>();
  const calls: string[] = [];
  let n = 0;
  const port: DictatePort = {
    start: () => {
      n += 1;
      const id = `d${String(n)}`;
      calls.push(`start ${id}`);
      states.set(id, { text: '', final: false, cancelled: false, error: null });
      return id;
    },
    stop: (id) => calls.push(`stop ${id}`),
    cancel: (id) => calls.push(`cancel ${id}`),
    read: (id) => states.get(id) ?? null,
    subscribe: (id, fn) => {
      subs.set(id, fn);
      return () => subs.delete(id);
    },
  };
  const say = (id: string, st: Partial<DictateState>): void => {
    states.set(id, { text: '', final: false, cancelled: false, error: null, ...st });
    subs.get(id)?.();
  };
  return { port, calls, say };
}

const memStore = (): Store => {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};

async function mount(port: DictatePort) {
  const got: { a: ComposerActions | null } = { a: null };
  const onSend = vi.fn();
  const ui = render(<Composer target="p/main" store={memStore()} sources={{ ...NO_SOURCES, dictate: port }} onSend={onSend} onReady={(a) => (got.a = a)} />);
  await act(async () => {
    await Promise.resolve();
  });
  if (got.a === null) throw new Error('composer not ready');
  return { ...ui, onSend, a: got.a };
}

const step = async (fn: () => void): Promise<void> => {
  await act(async () => {
    fn();
    await Promise.resolve();
  });
};

describe('dictation in the composer', () => {
  it('the words go in at the caret after what he typed, replaced as they grow, never sent', async () => {
    const mic = testMic();
    const { getByTestId, onSend, a } = await mount(mic.port);
    const field = getByTestId('composer.field');
    const button = getByTestId('composer.mic');
    expect(button.dataset.state).toBe('off');
    await step(() => {
      a.insertText('note:');
      a.dictate();
    });
    expect(mic.calls).toEqual(['start d1']);
    expect(getByTestId('composer.mic').dataset.state).toBe('recording');
    expect(getByTestId('composer.keys').dataset.mode).toBe('recording');
    await step(() => {
      mic.say('d1', { text: 'on garde' });
    });
    await step(() => {
      mic.say('d1', { text: 'on garde la file' });
    });
    expect(field.textContent).toBe('note: on garde la file');
    await step(() => {
      a.dictate(); // the mic off
    });
    expect(mic.calls).toEqual(['start d1', 'stop d1']);
    expect(getByTestId('composer.mic').dataset.state).toBe('transcribing');
    await step(() => {
      mic.say('d1', { text: "on garde la file d'attente", final: true });
    });
    expect(field.textContent).toBe("note: on garde la file d'attente");
    expect(getByTestId('composer.mic').dataset.state).toBe('off');
    await step(() => {
      a.insertText(' !');
    });
    expect(field.textContent).toBe("note: on garde la file d'attente !");
    expect(onSend).not.toHaveBeenCalled();
  });

  it('cancelled: its words go and the text around them stays', async () => {
    const mic = testMic();
    const { getByTestId, a } = await mount(mic.port);
    await step(() => {
      a.insertText('keep ');
      a.dictate();
    });
    await step(() => {
      mic.say('d1', { text: 'some words' });
    });
    expect(getByTestId('composer.field').textContent).toBe('keep some words');
    await step(() => {
      mic.say('d1', { text: '', final: true, cancelled: true });
    });
    expect(getByTestId('composer.field').textContent).toBe('keep ');
    expect(getByTestId('composer.mic').dataset.state).toBe('off');
  });

  it('an error keeps the words said so far and says why in the strip', async () => {
    const mic = testMic();
    const { getByTestId, a } = await mount(mic.port);
    await step(() => {
      a.dictate();
    });
    await step(() => {
      mic.say('d1', { text: 'half a', final: true, error: 'the listener failed.' });
    });
    expect(getByTestId('composer.field').textContent).toBe('half a');
    expect(getByTestId('composer.note').textContent).toBe('the listener failed.');
    expect(getByTestId('composer.mic').dataset.state).toBe('off');
  });
});
