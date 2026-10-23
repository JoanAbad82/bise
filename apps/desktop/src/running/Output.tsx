// A process's output in a read-only terminal (designer's running-procs: the terminal panel's
// renderer, xterm): its last part asked once (proc_out), then followed while shown (proc_follow
// on, off when it goes); the chunks go through out.ts so each byte is written once, in order.
// xterm keeps its end in view until he scrolls up ('↓ follows the end'). No output kept: one dim
// line instead. Owner: procs-desktop.
import { useEffect, useRef } from 'react';
import { Terminal as Xterm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useStore } from '@/store';
import { bytesOf, START, take } from './out';
import { running } from '@/proto/words_running.gen';

export interface OutputProps {
  readonly project: string;
  readonly agent: string;
  readonly id: string;
  /** its hub keeps no output of it */
  readonly none: boolean;
  /** follow it while it runs */
  readonly live: boolean;
  /** ⌘C with a selection: copy it (the screen's key) */
  readonly onTerm?: (term: Xterm | null) => void;
}

export function Output({ project, agent, id, none, live, onTerm }: OutputProps) {
  const store = useStore();
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
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
    onTerm?.(term);
    // its rows fill the box; its columns never fewer than WIDE, so a long line is never wrapped: the box scrolls sideways
    const fit = () => {
      if (el.clientWidth === 0 || el.clientHeight === 0) return;
      const d = fitter.proposeDimensions();
      if (d === undefined || !Number.isFinite(d.rows) || !Number.isFinite(d.cols)) return;
      const cols = Math.max(d.cols, WIDE);
      if (cols !== term.cols || d.rows !== term.rows) term.resize(cols, Math.max(1, d.rows));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    // his theme changes while it is open (the system's, or the app's data-theme): its ink follows
    const retheme = () => {
      term.options.theme = themeOf();
    };
    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    scheme.addEventListener('change', retheme);
    const themed = new MutationObserver(retheme);
    themed.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    let state = START;
    const off = store.onEvent((ev) => {
      if (ev.ev !== 'proc_out' || ev.project !== project || ev.agent !== agent || ev.id !== id) return;
      const s = take(state, { at: ev.at, bytes: bytesOf(ev.data), end: ev.end });
      state = s.state;
      for (const b of s.write) term.write(b);
      if (s.ask !== null) store.command({ cmd: 'proc_out', project, agent, id, from: s.ask });
    });
    store.command({ cmd: 'proc_out', project, agent, id });
    if (live) store.command({ cmd: 'proc_follow', project, agent, id, on: true });
    return () => {
      if (live) store.command({ cmd: 'proc_follow', project, agent, id, on: false });
      off();
      ro.disconnect();
      scheme.removeEventListener('change', retheme);
      themed.disconnect();
      onTerm?.(null);
      term.dispose();
    };
  }, [store, project, agent, id, none, live, onTerm]);
  if (none) {
    return (
      <p className="run-none" data-testid="running.out.none">
        {running.no_output}
      </p>
    );
  }
  return <div ref={host} className="run-term" data-testid="running.out.term" />;
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** The fewest columns: an output's long line scrolls sideways instead of wrapping. */
const WIDE = 320;

/**
 * xterm's colors: no ground of its own (the box's --c-raised shows through: a color-mix value xterm
 * can't read fell back to black, the sign shot of m_38536), the palette's ink, the ds selection.
 */
function themeOf() {
  const clear = 'rgba(0, 0, 0, 0)';
  const text = cssVar('--p-text') || '#ece6da';
  return { background: clear, foreground: text, cursor: clear, cursorAccent: clear, selectionBackground: cssVar('--p-sel') || '#33292c' };
}
