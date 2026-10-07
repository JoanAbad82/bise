// @vitest-environment happy-dom
// The composer mounted: its field is one node for its whole life (bug 1: never re-created by a
// prop change or a send), its words reach onSend, a command line runs, the draft survives a
// remount. Typing through the real key path is qa-type's (tests/checks/composer, Playwright).
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Composer } from './Composer';
import type { ComposerActions } from './Brain';
import type { Store } from './drafts';
import { NO_SOURCES } from './sources';

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
    rerender(<Composer target="p/main" store={store} onSend={onSend} busy to="you → bise" />);
    expect(getByTestId('composer.field')).toBe(field);
    await act(async () => {
      a.submit();
      await Promise.resolve();
    });
    expect(onSend).toHaveBeenCalledWith({ text: 'ça va ?\nsecond line', files: [] });
    expect(getByTestId('composer.field')).toBe(field);
    expect(field.textContent).toBe('');
  });

  it("quote(text, from): a quote chip at the caret, then his words; the send puts the TUI's <selection> in front (amb-win)", async () => {
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
    const sent = (onSend.mock.calls[0]?.[0] as { text: string } | undefined)?.text ?? '';
    expect(sent.startsWith('<selection from="main">')).toBe(true);
    expect(sent).toContain('one\ntwo\nthree');
    expect(sent.trim().endsWith('why 03:00?')).toBe(true);
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
    expect(onSend).toHaveBeenCalledWith({ text: '- a\n```rust\nfn main() {}\n```', files: [] });
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
});
