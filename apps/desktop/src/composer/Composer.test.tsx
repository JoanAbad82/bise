// @vitest-environment happy-dom
// The composer mounted: its field is one node for its whole life (bug 1: never re-created by a
// prop change or a send), its words reach onSend, a command line runs, the draft survives a
// remount. Typing through the real key path is qa-type's (tests/checks/composer, Playwright).
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Composer } from './Composer';
import type { ComposerActions } from './actions';
import type { Store } from './drafts';
import { NO_SOURCES } from './sources';
import { entryOf, entrySegments } from './entry';
import { buildMessage, type Segment } from './message';

afterEach(cleanup);

const memStore = (): Store => {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};

async function mount(extra: Partial<Parameters<typeof Composer>[0]> = {}) {
  const got: { a: ComposerActions | null } = { a: null };
  const onSend = vi.fn();
  const store = extra.store ?? memStore();
  const ui = render(
    <Composer target="p/main" store={store} onSend={onSend} onReady={(a) => (got.a = a)} {...extra} />,
  );
  await act(async () => {
    await Promise.resolve();
  });
  if (got.a === null) throw new Error('composer not ready');
  return { ...ui, onSend, store, act: got.a };
}

describe('the composer', () => {
  it('keeps one field node through prop changes and sends', async () => {
    const { getByTestId, rerender, onSend, act: a, store } = await mount();
    const field = getByTestId('composer.field');
    expect(field.getAttribute('contenteditable')).toBe('true');
    await act(async () => {
      a.insertText('ça va ?\nsecond line');
      await Promise.resolve();
    });
    rerender(<Composer target="p/main" store={store} onSend={onSend} busy tab="to bise" />);
    expect(getByTestId('composer.field')).toBe(field);
    await act(async () => {
      a.submit();
      await Promise.resolve();
    });
    expect(onSend).toHaveBeenCalledWith({ text: 'ça va ?\nsecond line' });
    expect(getByTestId('composer.field')).toBe(field);
    expect(field.textContent).toBe('');
  });

  it("quote(text, from): a quote chip at the caret, then his words; the send carries it as a quote part at its place, with its number (amb-win, his m_22231)", async () => {
    const { getByTestId, onSend, act: a } = await mount();
    await act(async () => {
      a.quote('one\ntwo\nthree', 'main');
      a.insertText('why 03:00?');
      await Promise.resolve();
    });
    const chip = getByTestId('composer.chip.1');
    expect(chip.getAttribute('data-kind')).toBe('quote');
    await act(async () => {
      a.quote('   ', 'main');
      a.submit();
      await Promise.resolve();
    });
    const sent = onSend.mock.calls[0]?.[0] as { text: string; parts?: unknown[] } | undefined;
    // typed: the quote part where its chip was, then his words; the hub renders the model's tag (delta review D2)
    expect(sent?.parts).toEqual([{ kind: 'quote', from: 'main', text: 'one\ntwo\nthree', n: 1 }, { kind: 'text', text: ' why 03:00?' }]);
    expect(sent?.text).toBe('❝ 1 why 03:00?');
  });

  it('fill(text): the field holds the words alone, all selected, and nothing is sent (L1/M18, amb-kit)', async () => {
    const { getByTestId, onSend, act: a } = await mount();
    const field = getByTestId('composer.field');
    await act(async () => {
      a.insertText('an old draft');
      a.fill('show me what you can do');
      await Promise.resolve();
    });
    expect(field.textContent).toBe('show me what you can do');
    expect(onSend).not.toHaveBeenCalled();
    // selected: what he types next replaces it
    await act(async () => {
      a.insertText('hi');
      await Promise.resolve();
    });
    expect(field.textContent).toBe('hi');
    expect(getByTestId('composer.field')).toBe(field);
  });

  it("R18: esc no list took goes to the screen while busy or on a blank field (ProseMirror swallows esc's default); else, or when the screen did nothing, his words go to history", async () => {
    const onEscape = vi.fn();
    const esc = (el: Element) => {
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true, cancelable: true }));
    };
    const busy = await mount({ busy: true, onEscape });
    const field = busy.getByTestId('composer.field');
    await act(async () => {
      busy.act.insertText('hello');
      await Promise.resolve();
    });
    esc(field);
    // esc never stops a turn (ctrl+c does, main m_22205): the screen gets it first (a route hold);
    // it did nothing here, so his words go to history as at rest
    expect(onEscape, 'busy: the screen first').toHaveBeenCalledTimes(1);
    expect(field.textContent, 'the screen did nothing: put away').toBe('');
    busy.unmount();

    const idle = await mount({ onEscape, target: 'p/other' });
    const f2 = idle.getByTestId('composer.field');
    esc(f2);
    expect(onEscape, 'blank: the screen (keep with bise, ...)').toHaveBeenCalledTimes(2);
    await act(async () => {
      idle.act.insertText('later');
      await Promise.resolve();
    });
    esc(f2);
    expect(onEscape, 'idle with words: put away, not the screen').toHaveBeenCalledTimes(2);
    expect(f2.textContent).toBe('');
  });

  it('runs a typed command line instead of sending it', async () => {
    const onCommand = vi.fn();
    const sources = { ...NO_SOURCES, commands: [{ name: '/model', desc: 'set the model', args: true, ready: true }] };
    const { onSend, act: a } = await mount({ sources, onCommand });
    await act(async () => {
      a.insertText('/model opus');
      a.submit();
      await Promise.resolve();
    });
    expect(onCommand).toHaveBeenCalledWith('/model', 'opus');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('colors a code block as he types, keeps the caret and the text (B9/W8)', async () => {
    const { getByTestId, onSend, act: a } = await mount();
    const field = getByTestId('composer.field');
    await act(async () => {
      a.insertText('- a\n```rust\nfn main');
      await Promise.resolve();
    });
    const styleOf = (word: string): string | null =>
      Array.from(field.querySelectorAll('span')).find((s) => s.textContent === word)?.getAttribute('style') ?? null;
    expect(styleOf('fn')).toContain('--c-accent');
    expect(styleOf(' main')).toBeNull();
    // the caret stayed at the end through the redraw: more words land after 'main'
    await act(async () => {
      a.insertText('() {}\n```');
      await Promise.resolve();
    });
    await act(async () => {
      a.submit();
      await Promise.resolve();
    });
    expect(onSend).toHaveBeenCalledWith({ text: '- a\n```rust\nfn main() {}\n```' });
  });

  it('keeps the draft of each target across a remount', async () => {
    const store = memStore();
    const first = await mount({ store });
    await act(async () => {
      first.act.insertText('half a thought');
      await Promise.resolve();
    });
    first.unmount();
    const again = await mount({ store });
    expect(again.getByTestId('composer.field').textContent).toBe('half a thought');
    again.unmount();
    const other = await mount({ store, target: 'p/other' });
    expect(other.getByTestId('composer.field').textContent).toBe('');
  });

  it('reads the entries it saved ({v:2,segs}): his draft, history and queue come back whole (lead m_11680)', async () => {
    const segs: Segment[] = [
      { kind: 'text', text: 'café 👋 déjà\nligne 2 ' },
      { kind: 'chip', chip: { kind: 'paste', n: 1, text: 'a\nb' } },
      { kind: 'text', text: ' fin' },
    ];
    const v2 = entryOf(segs);
    expect(JSON.parse(v2)).toMatchObject({ v: 2 });
    // each place an entry is read: the draft, a history line (↑), a queued message
    expect(entrySegments(v2)).toEqual(segs);
    const store = memStore();
    const queued = entryOf([{ kind: 'text', text: 'après ça 🎉' }]);
    store.setItem('bise.composer.v1.p/main', JSON.stringify({ draft: v2, history: [v2], queue: [queued] }));
    const onSend = vi.fn();
    const onQueue = vi.fn();
    const got: { a: ComposerActions | null } = { a: null };
    const el = (busy: boolean) => <Composer target="p/main" store={store} busy={busy} onSend={onSend} onQueue={onQueue} onReady={(a) => (got.a = a)} />;
    const ui = render(el(true));
    await act(async () => {
      await Promise.resolve();
    });
    expect(ui.getByTestId('composer.field').textContent).toContain('café 👋 déjà');
    expect(ui.getByTestId('composer.field').textContent).toContain('ligne 2');
    expect(ui.getByTestId('composer.field').textContent).toContain('fin');
    // an older window's queued one goes to the hub's queue once, whole (issue 23)
    expect(onQueue).toHaveBeenCalledTimes(1);
    expect(onQueue).toHaveBeenLastCalledWith(buildMessage([{ kind: 'text', text: 'après ça 🎉' }]));
    await act(async () => {
      ui.rerender(el(false)); // the turn ends: the window sends nothing itself (the hub does)
      await Promise.resolve();
    });
    expect(onSend).not.toHaveBeenCalled();
    await act(async () => {
      got.a?.submit(); // the draft sends exactly what the TipTap engine would have sent
      await Promise.resolve();
    });
    expect(onSend).toHaveBeenLastCalledWith(buildMessage(segs));
  });
});
