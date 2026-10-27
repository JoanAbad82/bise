// @vitest-environment happy-dom
// ui-review m_47784: a process that ends under its open tab keeps what it printed (one terminal per
// process, never a new one when `live` flips), the follow stops, and a failure known then scrolls
// to its first error.
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CoreCmd, CorePort } from '@/shared/api';
import { Store, StoreProvider } from '@/store';

const made: { lines: string[]; scrolled: number[]; disposed: boolean }[] = [];
vi.mock('@xterm/xterm', () => ({
  Terminal: class {
    cols = 80;
    rows = 24;
    t = { lines: [] as string[], scrolled: [] as number[], disposed: false };
    buffer = { active: { length: 0, viewportY: 0, baseY: 0, getLine: (i: number) => ({ translateToString: () => this.t.lines[i] ?? '' }) } };
    options: Record<string, unknown> = {};
    constructor() { made.push(this.t); }
    loadAddon() {}
    open() {}
    onScroll() { return { dispose() {} }; }
    resize() {}
    write(b: Uint8Array | string, cb?: () => void) {
      const s = typeof b === 'string' ? b : new TextDecoder().decode(b);
      if (s !== '') {
        const parts = s.split('\n');
        if (this.t.lines.length === 0) this.t.lines.push('');
        const end = this.t.lines.length - 1;
        this.t.lines[end] = `${this.t.lines[end] ?? ''}${parts[0] ?? ''}`;
        for (const p of parts.slice(1)) this.t.lines.push(p);
        this.buffer.active.length = this.t.lines.length;
      }
      cb?.();
    }
    scrollToLine(n: number) { this.t.scrolled.push(n); }
    scrollToBottom() {}
    dispose() { this.t.disposed = true; }
  },
}));
vi.mock('@xterm/addon-fit', () => ({ FitAddon: class { proposeDimensions() { return undefined; } } }));
vi.mock('@xterm/xterm/css/xterm.css', () => ({}));
const { Output } = await import('./Output');

afterEach(() => { cleanup(); made.length = 0; });

function setup() {
  const cmds: CoreCmd[] = [];
  const port: CorePort = { send: (c) => cmds.push(c), onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
  const store = new Store(port);
  store.setCore('up');
  return { store, cmds, emit: (ev: Parameters<Store['apply']>[0]) => { store.apply(ev); } };
}

const out = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  return { ev: 'proc_out', project: 'acme', agent: 'perf', id: 'bg2', at: 0, data: btoa(String.fromCharCode(...bytes)), end: bytes.length };
};

describe("a process's output", () => {
  it('ending under its open tab keeps its terminal and what it printed, stops the follow, and opens on its first error', () => {
    const { store, cmds, emit } = setup();
    const draw = (live: boolean, failed: boolean, onErr = vi.fn()) => (
      <StoreProvider store={store}>
        <Output project="acme" agent="perf" id="bg2" none={false} live={live} quiet="" {...(failed ? { openOnError: onErr } : {})} />
      </StoreProvider>
    );
    const r = render(draw(true, false));
    act(() => { emit(out('Running 6 tests\n  ✓ cart\n  ✘ checkout › pays\nError: expect\n1 failed\n')); });
    expect(made.length).toBe(1);
    const onErr = vi.fn();
    r.rerender(draw(false, true, onErr));
    expect(made.length).toBe(1);
    expect(made[0]?.disposed).toBe(false);
    expect(made[0]?.lines.slice(0, 2)).toEqual(['Running 6 tests', '  ✓ cart']);
    const follow = cmds.filter((c) => c.cmd === 'proc_follow').map((c) => (c as { on: boolean }).on);
    expect(follow).toEqual([true, false]);
    expect(cmds.filter((c) => c.cmd === 'proc_out').length).toBe(1);
    expect(made[0]?.scrolled).toEqual([1]);
    expect(onErr).toHaveBeenCalledWith(true);
  });
});
