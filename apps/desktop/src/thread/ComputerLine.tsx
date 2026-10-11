// S29/L19 W1 + W4 (amb-core's l19 plan, docs/desktop-bar.md:212): an agent that uses his
// computer shows it on one line under its head, from the core's computer_live rows only (state,
// not history: no entry kind). The words are the core's (bise_computer_use::live::line, the TUI's
// line: mark + words, amb-core m_16595); the window only adds ' · 2 min' while it drives.
// Driving: '↖ driving Chrome · amazon.fr · 2 min' with 'take the wheel' and 'stop'; taken:
// '? you took the wheel' (accent: the button 'give it back ⏎' says the rest); stopped: dim; no row:
// nothing. A click sends computer {act, key} and draws nothing until the rows move (no
// optimistic state). A click on the words opens a small still of what it drives (usePeek:
// inline, never stored); esc or a click closes it. Owner: amb-win.
import { useEffect, useState } from 'react';
import type { ComputerAgent } from '@/proto';
import { useComputerLive, usePeek, useStore } from '@/store';
import { useNow } from '@/app/clock';
import { ago } from '@/agents/model';
import { Press } from '@/ds';

export type ComputerState = ComputerAgent['kind'];

/** Which state a row is in: the core's kind (live::line), never inferred here. Pure. */
export function computerState(r: ComputerAgent): ComputerState {
  return r.kind;
}

/**
 * The line's words (l19 plan W1, amb-core m_16595): the core's mark and words as they come,
 * plus ' · 2 min' from since_ms while it drives. No words are built here. Pure.
 */
export function computerWords(r: ComputerAgent, now: number): string {
  // paused: the button carries 'give it back' (designer m_16663): the words stop at the first dot
  if (r.kind === 'paused') return `${r.mark} ${r.words.split(' · ')[0] ?? r.words}`;
  const since = r.kind === 'driving' && r.since_ms != null && r.since_ms > 0 ? ` · ${ago(r.since_ms, now)}` : '';
  return `${r.mark} ${r.words}${since}`;
}

/** The still's caption: 'a still from 15:31 · esc closes' (its arrival time, local). Pure. */
export function stillCaption(at: number | null): string {
  if (at === null) return 'a still · esc closes';
  const d = new Date(at);
  return `a still from ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} · esc closes`;
}

/** This agent's row of his computer use, if it drives (another bise's agents have no project). Pure. */
export function computerRowOf(rows: readonly ComputerAgent[], project: string, agent: string): ComputerAgent | undefined {
  return rows.find((r) => r.project === project && r.agent === agent);
}

export function ComputerLine({ project, agent }: { project: string; agent: string }) {
  const row = computerRowOf(useComputerLive(), project, agent);
  if (row === undefined) return null;
  return <Line row={row} />;
}

function Line({ row }: { row: ComputerAgent }) {
  const store = useStore();
  const now = useNow();
  const [open, setOpen] = useState(false);
  const state = computerState(row);
  const act = (a: 'take' | 'hand_back' | 'stop') => () => {
    store.computer(a, row.key);
  };
  useEffect(() => {
    if (!open) return;
    // esc closes the still and nothing else: caught first (capture), so the thread's esc (stop
    // the turn) and the composer's never see it
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    };
    window.addEventListener('keydown', esc, true);
    return () => {
      window.removeEventListener('keydown', esc, true);
    };
  }, [open]);
  return (
    <div className="th-cu" data-state={state} data-testid="thread.computer">
      <div className="th-cu-line">
        <Press
          look="th-cu-words"
          aria-expanded={open}
          onClick={() => {
            setOpen((o) => !o);
          }}
          data-testid="thread.computer.words"
          title="see what it drives"
        >
          {computerWords(row, now)}
        </Press>
        {state === 'driving' && (
          <>
            <Press look="th-cu-act" onClick={act('take')} data-testid="thread.computer.take">
              take the wheel
            </Press>
            <Press look="th-cu-act" onClick={act('stop')} data-testid="thread.computer.stop">
              stop
            </Press>
          </>
        )}
        {state === 'paused' && (
          <Press look="th-cu-act" onClick={act('hand_back')} data-testid="thread.computer.back">
            give it back <kbd className="th-cu-key">⏎</kbd>
          </Press>
        )}
      </div>
      {open && <Peek rowKey={row.key} onClose={() => { setOpen(false); }} />}
    </div>
  );
}

/** W4: a small still of what it drives, asked while open, kept nowhere. */
function Peek({ rowKey, onClose }: { rowKey: string; onClose: () => void }) {
  const peek = usePeek(rowKey, { on: true, maxWidth: 480 });
  const now = useNow();
  const shot = peek?.shot ?? null;
  const why = peek?.why ?? null;
  // when this still came (a still, not a live view: designer m_16663); a new still moves it
  // (adjusted while rendering, React's 'state from a changed prop' pattern: no effect, no extra pass)
  const [seen, setSeen] = useState<{ shot: typeof shot; at: number | null }>({ shot: null, at: null });
  if (shot !== seen.shot) setSeen({ shot, at: shot === null ? null : now });
  const at = seen.at;
  return (
    <Press look="th-cu-peek" onClick={onClose} data-testid="thread.computer.peek" aria-label="close the still">
      {shot !== null ? (
        <>
          <img src={`data:${shot.mime};base64,${shot.data}`} width={shot.width} height={shot.height} alt="what it drives now" />
          <span className="th-cu-cap" data-testid="thread.computer.peek.cap">{stillCaption(at)}</span>
        </>
      ) : (
        <span className="th-cu-none">{peek === null ? 'looking…' : why === 'too_soon' ? 'looking…' : 'nothing to show'}</span>
      )}
    </Press>
  );
}
