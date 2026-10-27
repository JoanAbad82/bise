// A process's output in a read-only terminal (designer's running-procs: the terminal panel's
// renderer, xterm): its last part asked once (proc_out), then followed while shown (proc_follow
// on, off when it goes); the chunks go through out.ts so each byte is written once, in order.
// xterm keeps its end in view until he scrolls up ('↓ follows the end'); scrolled up, 'jump to
// end ↓' at its bottom right. Long lines wrap at the box's width (designer m_41694 #9). Nothing
// printed yet: `quiet`'s line where its first line will be, on the same box, so nothing moves when
// bytes come (#10). No output kept: one dim line instead. Owner: procs-desktop.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Terminal as Xterm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useStore } from '@/store';
import { bytesOf, newlines, printed, START, take } from './out';
import { firstError } from './procview';
import { Press } from '@/ds';
import { running } from '@/proto/words_running.gen';

export interface OutputProps {
  readonly project: string;
  readonly agent: string;
  readonly id: string;
  /** its hub keeps no output of it */
  readonly none: boolean;
  /** follow it while it runs */
  readonly live: boolean;
  /** what it shows while it has printed nothing (model quietWords; the panel's dashed frame) */
  readonly quiet: ReactNode;
  /** what it shows when no output is kept (the panel's why); none: the screen's dim line */
  readonly empty?: ReactNode;
  /** how many lines it has printed, as they come (the panel's 'N lines') */
  readonly onLines?: (n: number) => void;
  /** a failed one: once its kept output is in, its first error at the top (firstError); `found` says whether one was */
  readonly openOnError?: (found: boolean) => void;
  /** ⌘C with a selection: copy it (the screen's key) */
  readonly onTerm?: (term: Xterm | null) => void;
}

export function Output({ project, agent, id, none, live, quiet, empty, onLines, openOnError, onTerm }: OutputProps) {
  const store = useStore();
  const host = useRef<HTMLDivElement>(null);
  const held = useRef<Xterm | null>(null);
  const count = useRef(onLines);
  const err = useRef(openOnError);
  const scan = useRef<(() => void) | null>(null);
  // it printed something (its quiet line goes), he scrolled up from its end (the jump shows)
  const [said, setSaid] = useState(false);
  const [up, setUp] = useState(false);
  useEffect(() => {
    // one Output per process (the pane is keyed by it): `said` and `up` start fresh with it
    const el = host.current;
    if (none || el === null) return;
    const term = new Xterm({
      fontFamily: cssVar('--font-mono') || 'ui-monospace, Menlo, monospace',
      // mono 12/1.5 (designer m_38536)
      fontSize: 12,
      lineHeight: 1.5,
      disableStdin: true,
      cursorBlink: false,
      cursorInactiveStyle: 'none',
      convertEol: true,
      scrollback: 5000,
      // its ground is the box's (--c-raised): xterm draws none of its own
      allowTransparency: true,
      theme: themeOf(),
    });
    const fitter = new FitAddon();
    term.loadAddon(fitter);
    term.open(el);
    held.current = term;
    onTerm?.(term);
    // its rows and columns fill the box: a long line wraps at its edge (designer m_41694 #9)
    const fit = () => {
      if (el.clientWidth === 0 || el.clientHeight === 0) return;
      const d = fitter.proposeDimensions();
      if (d === undefined || !Number.isFinite(d.rows) || !Number.isFinite(d.cols)) return;
      const cols = Math.max(1, d.cols);
      if (cols !== term.cols || d.rows !== term.rows) term.resize(cols, Math.max(1, d.rows));
    };
    // scrolled up from its end: 'jump to end ↓'
    const scrolled = term.onScroll(() => {
      const b = term.buffer.active;
      setUp(b.viewportY < b.baseY);
    });
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    // the first error's line, in the error ink (designer m_47812): that line only, the rest keeps
    // the program's own colours; drawn again when the theme changes
    let errAt: number | null = null;
    let errMark: { dispose: () => void } | undefined;
    const markErr = () => {
      errMark?.dispose();
      errMark = undefined;
      if (errAt === null) return;
      const b = term.buffer.active;
      const marker = term.registerMarker(errAt - (b.baseY + b.cursorY));
      errMark = term.registerDecoration({ marker, width: term.cols, foregroundColor: cssVar('--p-err') || '#ff5a52' });
    };
    // his theme changes while it is open (the system's, or the app's data-theme): its ink follows
    const retheme = () => {
      term.options.theme = themeOf();
      markErr();
    };
    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    scheme.addEventListener('change', retheme);
    const themed = new MutationObserver(retheme);
    themed.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    let state = START;
    let lines = 0;
    let partial = false;
    let loaded = false;
    let scanned = false;
    // a failed one opens on its first error (designer's process-panel): once what it kept is in,
    // and once it is known to have failed (it may fail while the tab is open)
    scan.current = () => {
      if (scanned || !loaded || err.current === undefined) return;
      scanned = true;
      term.write('', () => {
        const b = term.buffer.active;
        const text = Array.from({ length: b.length }, (_, i) => b.getLine(i)?.translateToString(true) ?? '');
        const at = firstError(text);
        if (at !== null) {
          term.scrollToLine(Math.max(0, at - 1));
          errAt = at;
          markErr();
        }
        err.current?.(at !== null);
      });
    };
    const off = store.onEvent((ev) => {
      if (ev.ev !== 'proc_out' || ev.project !== project || ev.agent !== agent || ev.id !== id) return;
      const s = take(state, { at: ev.at, bytes: bytesOf(ev.data), end: ev.end });
      state = s.state;
      for (const b of s.write) {
        term.write(b);
        lines += newlines(b);
        partial = b.length > 0 ? b[b.length - 1] !== 10 : partial;
      }
      if (s.write.length > 0) count.current?.(lines + (partial ? 1 : 0));
      if (printed(state)) setSaid(true);
      if (s.ask !== null) store.command({ cmd: 'proc_out', project, agent, id, from: s.ask });
      if (s.ask === null && state.next !== null && state.next >= ev.end) {
        loaded = true;
        scan.current?.();
      }
    });
    store.command({ cmd: 'proc_out', project, agent, id });
    return () => {
      scan.current = null;
      errMark?.dispose();
      off();
      ro.disconnect();
      scheme.removeEventListener('change', retheme);
      themed.disconnect();
      scrolled.dispose();
      held.current = null;
      onTerm?.(null);
      term.dispose();
    };
    // one terminal per process: it ending under the open tab keeps what it printed (ui-review
    // m_47784: a new terminal there asked again and showed nothing); only the follow stops
  }, [store, project, agent, id, none, onTerm]);
  // the follow, while it runs (after the first ask above: effects run in order)
  useEffect(() => {
    if (none || !live) return;
    store.command({ cmd: 'proc_follow', project, agent, id, on: true });
    return () => {
      store.command({ cmd: 'proc_follow', project, agent, id, on: false });
    };
  }, [store, project, agent, id, none, live]);
  // the latest callbacks, read when bytes come; a failure known now: its first error in view
  useEffect(() => {
    count.current = onLines;
    err.current = openOnError;
    scan.current?.();
  }, [onLines, openOnError]);
  if (none) {
    if (empty !== undefined) return <>{empty}</>;
    return (
      <p className="run-none" data-testid="running.out.none">
        {running.no_output}
      </p>
    );
  }
  return (
    <div className="run-box">
      <div ref={host} className="run-term" data-testid="running.out.term" />
      {/* where its first line will be: the box keeps its size when bytes come */}
      {!said && (
        <p className="run-quiet" data-testid="running.out.quiet">
          {quiet}
        </p>
      )}
      {up && (
        <Press look="run-jump" onClick={() => { held.current?.scrollToBottom(); }} data-testid="running.out.jump">
          {running.jump_end}
        </Press>
      )}
    </div>
  );
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * xterm's colors: no ground of its own (the box's --c-raised shows through: a color-mix value xterm
 * can't read fell back to black, the sign shot of m_38536), the palette's ink, the ds selection.
 */
function themeOf() {
  const clear = 'rgba(0, 0, 0, 0)';
  const text = cssVar('--p-text') || '#ece6da';
  return { background: clear, foreground: text, cursor: clear, cursorAccent: clear, selectionBackground: cssVar('--p-sel') || '#33292c' };
}
