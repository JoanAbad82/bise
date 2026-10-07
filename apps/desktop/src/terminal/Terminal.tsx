// The terminal panel under the screen (bar T W25/V13/K26/M16): a real shell
// in the project's folder (main runs it: src/main/term, `bise pty`), drawn by
// xterm. ⌃` (or View > Terminal) shows and hides it; hidden, it stays mounted
// and its shell runs on, so showing it again is the same shell. Drag its top
// edge to resize. While it has the focus every key is the shell's except ⌘
// keys (⌘C / ⌘V copy and paste) and ⌃`. Owner: amb-win.
import { memo, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { Terminal as Xterm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { dragHeight, shellTakes, shortPath, writesOf } from './model';
import { panel, usePanel } from './panel';
import { useProjects } from '@/store';
import './terminal.css';

/** The panel for the project in view; nothing until it was first shown. */
export const TerminalPanel = memo(function TerminalPanel({ project }: { project: string | undefined }) {
  const p = usePanel();
  const folder = useProjects().find((x) => x.project === project)?.path ?? '';
  const box = useRef<HTMLDivElement>(null);
  if (!p.opened || project === undefined) return null;
  return (
    <section
      ref={box}
      className="term-panel"
      data-testid="terminal.panel"
      data-project={project}
      data-shown={p.shown}
      hidden={!p.shown}
      style={{ height: p.height }}
    >
      <Grip box={box} />
      <div className="term-head" data-testid="terminal.head">
        <span>terminal · {shortPath(folder, (window as { bise?: { home?: string } }).bise?.home || undefined)}</span>
        <button
          type="button"
          className="term-hide"
          onClick={() => {
            panel.hide();
          }}
          data-testid="terminal.hide"
        >
          ⌃` hide
        </button>
      </div>
      {/* one shell view per project: another project's shell runs on in main */}
      <ShellView key={project} project={project} shown={p.shown} />
    </section>
  );
});

/** The top edge: drag it up for a taller panel (M16). */
function Grip({ box }: { box: React.RefObject<HTMLDivElement | null> }) {
  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    const avail = box.current?.parentElement?.clientHeight ?? window.innerHeight;
    const startH = panel.get().height;
    const startY = e.clientY;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const move = (m: PointerEvent) => {
      panel.setHeight(dragHeight(startH, startY, m.clientY, avail));
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  };
  return <div className="term-grip" data-testid="terminal.grip" role="separator" aria-orientation="horizontal" onPointerDown={onDown} />;
}

type Life = { s: 'opening' } | { s: 'live' } | { s: 'failed'; why: string } | { s: 'ended'; code: number | null };

/** One project's shell drawn by xterm: opened at mount, its screen redrawn from main's snapshot. */
function ShellView({ project, shown }: { project: string; shown: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef<{ term: Xterm; fit: () => void; restart: () => void } | null>(null);
  const [life, setLife] = useState<Life>({ s: 'opening' });

  useEffect(() => {
    const api = (window as Partial<Window>).bise?.term;
    const el = host.current;
    if (api === undefined || el === null) {
      setLife({ s: 'failed', why: 'no terminal here' });
      return;
    }
    const term = new Xterm({
      fontFamily: cssVar('--font-mono') || 'ui-monospace, Menlo, monospace',
      fontSize: 12,
      lineHeight: 1.2,
      cursorBlink: true,
      scrollback: 5000,
      theme: themeOf(),
    });
    const fitter = new FitAddon();
    term.loadAddon(fitter);
    term.open(el);
    // ⌘ keys stay the app's (copy, paste, ⌘K...), ⌃` hides the panel
    term.attachCustomKeyEventHandler((e) => shellTakes(e));

    let id: string | undefined;
    let early: Uint8Array[] = [];
    let gone = false;
    const fit = () => {
      if (el.clientWidth === 0 || el.clientHeight === 0) return; // hidden: fit when shown
      try {
        fitter.fit();
      } catch {
        // not laid out yet
      }
    };
    const offData = api.onData((from, bytes) => {
      if (from !== project) return;
      if (id === undefined) early.push(bytes);
      else term.write(bytes);
    });
    const offExit = api.onExit((from, code) => {
      if (from !== project || gone) return;
      id = undefined;
      setLife({ s: 'ended', code });
    });
    const open = async () => {
      fit();
      setLife({ s: 'opening' });
      const r = await api.open(project, term.cols, term.rows);
      if (gone) return;
      if ('error' in r) {
        setLife({ s: 'failed', why: r.error });
        return;
      }
      id = r.id;
      // a shell already running: redraw its screen as it is now
      if (r.screen !== null) {
        term.write('\x1bc');
        term.write(r.screen);
      }
      for (const b of early) term.write(b);
      early = [];
      api.resize(r.id, term.cols, term.rows);
      setLife({ s: 'live' });
    };
    const keys = term.onData((d) => {
      if (id === undefined) return;
      for (const w of writesOf(d)) api.write(id, w);
    });
    const sized = term.onResize(({ cols, rows }) => {
      if (id !== undefined) api.resize(id, cols, rows);
    });
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    live.current = {
      term,
      fit,
      restart: () => {
        term.reset();
        void open();
      },
    };
    void open();
    return () => {
      // the shell runs on in main (kept while hidden, another project in view)
      gone = true;
      ro.disconnect();
      keys.dispose();
      sized.dispose();
      offData();
      offExit();
      term.dispose();
      live.current = null;
    };
  }, [project]);

  // shown: fit to the panel and take the keys; hidden: give them back to the screen
  useEffect(() => {
    const l = live.current;
    if (l === null) return;
    if (shown) {
      l.fit();
      l.term.focus();
    } else if (host.current?.contains(document.activeElement)) {
      l.term.blur();
      document.querySelector<HTMLElement>('[data-testid="composer.field"]')?.focus();
    }
  }, [shown]);

  return (
    <div className="term-body">
      <div ref={host} className="term-host" data-testid="terminal.screen" data-state={life.s} />
      {life.s === 'failed' && (
        <p className="term-line" data-testid="terminal.failed">
          the terminal could not start: {life.why}
        </p>
      )}
      {life.s === 'ended' && (
        <p className="term-line" data-testid="terminal.ended">
          the shell ended{life.code !== null ? ` (${String(life.code)})` : ''} ·{' '}
          <button
            type="button"
            className="term-again"
            data-testid="terminal.restart"
            onClick={() => {
              live.current?.restart();
            }}
          >
            start a new one
          </button>
        </p>
      )}
    </div>
  );
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** xterm's colors from the ds palette (dark or light, as his theme). */
function themeOf() {
  const bg = cssVar('--p-bg') || '#141211';
  const text = cssVar('--p-text') || '#ece6da';
  return {
    background: bg,
    foreground: text,
    cursor: cssVar('--p-accent') || text,
    cursorAccent: bg,
    selectionBackground: cssVar('--p-rule') || '#4a4540',
  };
}
