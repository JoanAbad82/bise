// Words that cut after a whole word with '…' to fit their box, never mid-word (designer's
// agent-waiting-states A: the alarm's note 'if the nightly gate goes red'). The box takes the room
// its row leaves (flex 1 1 0), so a cut never shrinks the room it was measured in; under 3 words
// left, the CSS ellipsis says the rest. The pause line measures the same way. Owner: amb-win.
import { useLayoutEffect, useRef, useState } from 'react';
import { fitNote } from '@/thread/wake';

let canvas: CanvasRenderingContext2D | null | undefined;
/** A text's width in px in `font` (a CSS font shorthand). */
export function textWidth(font: string): (s: string) => number {
  canvas ??= document.createElement('canvas').getContext('2d');
  const ctx = canvas;
  if (ctx === null) return (s) => s.length * 7;
  ctx.font = font;
  return (s) => ctx.measureText(s).width;
}

export function FitWords({ text, className, testId }: { text: string; className: string; testId?: string }) {
  const box = useRef<HTMLSpanElement>(null);
  const [room, setRoom] = useState<{ avail: number; font: string }>({ avail: Infinity, font: '' });
  useLayoutEffect(() => {
    const el = box.current;
    if (el === null) return;
    const measure = () => {
      const avail = el.clientWidth;
      const font = getComputedStyle(el).font;
      setRoom((r) => (r.avail === avail && r.font === font ? r : { avail, font }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, []);
  const shown = room.avail === Infinity || room.font === '' || room.avail === 0 ? text : (fitNote(text, room.avail, textWidth(room.font)) ?? text);
  return (
    <span ref={box} className={className} style={{ flex: '1 1 0' }} data-testid={testId}>
      {shown}
    </span>
  );
}
