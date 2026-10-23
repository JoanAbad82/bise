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
      fontSize: 12,
      lineHeight: 1.2,
      disableStdin: true,
      cursorBlink: false,
      cursorInactiveStyle: 'none',
      convertEol: true,
      scrollback: 5000,
      theme: themeOf(),
    });
    const fitter = new FitAddon();
    term.loadAddon(fitter);
    term.open(el);
    onTerm?.(term);
    const fit = () => {
      if (el.clientWidth === 0 || el.clientHeight === 0) return;
      try {
        fitter.fit();
      } catch {
        // not laid out yet
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
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

/** xterm's colors from the ds palette, as the terminal panel's. */
function themeOf() {
  const bg = cssVar('--p-bg') || '#141211';
  const text = cssVar('--p-text') || '#ece6da';
  return { background: bg, foreground: text, cursor: bg, cursorAccent: bg, selectionBackground: cssVar('--p-rule') || '#4a4540' };
}
