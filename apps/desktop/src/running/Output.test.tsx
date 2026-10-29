// @vitest-environment happy-dom
// ui-review m_47784: a process that ends under its open tab keeps what it printed (one terminal per
// process, never a new one when `live` flips), the follow stops, and a failure known then scrolls
// to its first error.
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CoreCmd, CorePort } from '@/shared/api';
import { Store, StoreProvider } from '@/store';

const made: { lines: string[]; scrolled: number[]; disposed: boolean; inked: { line: number; color: string | undefined }[] }[] = [];
const scrolls: { scrollBy: (y: number) => void }[] = [];
vi.mock('@xterm/xterm', () => ({
  Terminal: class {
    cols = 80;
    rows = 24;
    t = { lines: [] as string[], scrolled: [] as number[], disposed: false, inked: [] as { line: number; color: string | undefined }[] };
    // what it printed, line by line; its rows are those lines cut at `cols` (a cut row isWrapped)
    logical: string[] = [];
    wrapped: boolean[] = [];
    buffer = { active: { length: 0, viewportY: 0, baseY: 0, cursorY: 0, getLine: (i: number) => ({ isWrapped: this.wrapped[i] === true, translateToString: () => this.t.lines[i] ?? '' }) } };
    // the cursor sits on the last line (no scroll in the mock: baseY 0)
    registerMarker(offset: number) { return { line: this.buffer.active.length - 1 + offset }; }
    // xterm's experimental API: it throws without allowProposedApi (ui-review m_47820's grey line)
    registerDecoration(o: { marker: { line: number }; foregroundColor?: string }) {
      if (this.options['allowProposedApi'] !== true) throw new Error('You must set the allowProposedApi option to true to use proposed API');
      this.t.inked.push({ line: o.marker.line, color: o.foregroundColor });
      return { dispose() {} };
    }
    options: Record<string, unknown>;
    scrolledBy: (() => void) | null = null;
    constructor(o: Record<string, unknown> = {}) { this.options = { ...o }; made.push(this.t); scrolls.push(this); }
    loadAddon() {}
    open() {}
    onScroll(fn: () => void) { this.scrolledBy = fn; return { dispose() {} }; }
    /** he scrolls the view to row `y` */
    scrollBy(y: number) { this.buffer.active.viewportY = y; this.scrolledBy?.(); }
    resize() {}
    write(b: Uint8Array | string, cb?: () => void) {
      const s = typeof b === 'string' ? b : new TextDecoder().decode(b);
      if (s !== '') {
        const parts = s.split('\n');
        if (this.logical.length === 0) this.logical.push('');
        const end = this.logical.length - 1;
        this.logical[end] = `${this.logical[end] ?? ''}${parts[0] ?? ''}`;
        for (const p of parts.slice(1)) this.logical.push(p);
        const rows: string[] = [];
        this.wrapped = [];
        for (const l of this.logical) {
          for (let at = 0; at === 0 || at < l.length; at += this.cols) {
            rows.push(l.slice(at, at + this.cols));
            this.wrapped.push(at > 0);
          }
        }
        this.t.lines = rows;
        this.buffer.active.length = rows.length;
        this.buffer.active.cursorY = rows.length - 1;
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

afterEach(() => { cleanup(); made.length = 0; scrolls.length = 0; });

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
    // that line only, in the error ink (designer m_47812): '  ✘ checkout › pays' is line 2
    expect(made[0]?.inked.map((x) => x.line)).toEqual([2]);
    expect(made[0]?.inked[0]?.color).toMatch(/^#[0-9a-f]{6}$/iu);
    // he scrolls away from it: the sub goes back to its lines (designer m_47822)
    act(() => { scrolls[0]?.scrollBy(5); });
    expect(onErr).toHaveBeenLastCalledWith(false);
  });

  it("inks a long error line's soft-wrapped rest too, never the program's next line (designer m_47845)", () => {
    const { store, emit } = setup();
    const draw = (live: boolean) => (
      <StoreProvider store={store}>
        <Output project="acme" agent="perf" id="bg2" none={false} live={live} quiet="" {...(live ? {} : { openOnError: vi.fn() })} />
      </StoreProvider>
    );
    const r = render(draw(true));
    // 'Error: …' is 100 characters at 80 columns: rows 1 and 2; 'old < 2s' then is a line of its own
    const long = `Error: expect(locator).toBeVisible() failed after waiting for the pay button to be ${'x'.repeat(16)}`;
    act(() => { emit(out(`Running 1 test\n${long}\nold < 2s\n`)); });
    r.rerender(draw(false));
    expect(made[0]?.lines.slice(0, 4)).toEqual(['Running 1 test', long.slice(0, 80), long.slice(80), 'old < 2s']);
    expect(made[0]?.inked.map((x) => x.line)).toEqual([1, 2]);
  });
});
