// The waiting line over the composer (designer's desktop-status-line, his pick A): the state in
// words first, whole, text-2 ('waiting since 04:12', 'waiting for 12 min'), then ' · ' and the
// oldest watch's note in text-3, the only part that cuts, after a whole word with '…'; under 3
// words left the note drops. ' and 1 more' when it waits for several; the title lists them all.
// Digits mono. Never the accent: nothing of it waits on him. The words are wake.ts's (words.rs's
// twin). Owner: amb-win.
import { useLayoutEffect, useRef, useState } from 'react';
import type { Agent } from '@/proto';
import { useNow } from '@/app/clock';
import { digitRuns, fitNote, waitingLine, waitsEvent } from './wake';

let canvas: CanvasRenderingContext2D | null | undefined;
function textWidth(font: string): (s: string) => number {
  canvas ??= document.createElement('canvas').getContext('2d');
  const ctx = canvas;
  if (ctx === null) return (s) => s.length * 7;
  ctx.font = font;
  return (s) => ctx.measureText(s).width;
}

export function WaitingLine({ a }: { a: Agent | undefined }) {
  const now = useNow();
  const line = a === undefined || a.archived || !waitsEvent(a) ? null : waitingLine(a.watching, now);
  const box = useRef<HTMLDivElement>(null);
  // the note's room and font, read from the DOM after layout (never during render)
  const [room, setRoom] = useState<{ avail: number; font: string }>({ avail: Infinity, font: '' });
  // the room the note has: the line's width less its whole parts (state, ' · ', ' and 1 more')
  useLayoutEffect(() => {
    const el = box.current;
    if (el === null) return;
    const measure = () => {
      const whole = Array.from(el.querySelectorAll<HTMLElement>('[data-whole]'), (x) => x.getBoundingClientRect().width);
      const font = getComputedStyle(el.querySelector('.th-wait-note') ?? el).font;
      const avail = el.clientWidth - whole.reduce((s, w) => s + w, 0) - 1;
      setRoom((r) => (r.avail === avail && r.font === font ? r : { avail, font }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [line?.state, line?.more]);
  if (line === null) return null;
  const note = room.avail === Infinity || room.font === '' ? line.note : fitNote(line.note, room.avail, textWidth(room.font));
  return (
    <div ref={box} className="th-live th-waiting" data-testid="thread.waiting" aria-live="polite" title={line.title}>
      <span className="th-wait-state" data-whole="">
        {digitRuns(line.state).map((r, i) =>
          r.digits ? (
            <span key={i} className="th-wait-num">
              {r.text}
            </span>
          ) : (
            r.text
          ),
        )}
      </span>
      <span className="th-wait-sep" data-whole="" hidden={note === null}>
        {' · '}
      </span>
      {/* always in the DOM, its font measured; empty when it drops */}
      <span className="th-wait-note" data-testid="thread.waiting.note">
        {note ?? ''}
      </span>
      {line.more !== '' && (
        <span className="th-wait-more" data-whole="">
          {line.more}
        </span>
      )}
    </div>
  );
}
