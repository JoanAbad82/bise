// Words that cut after a whole word with '…' to fit their box, never mid-word (designer's
// agent-waiting-states A: the alarm's note 'if the nightly gate goes red'). The box takes the room
// its row leaves (flex 1 1 0), so a cut never shrinks the room it was measured in; under 3 words
// left, the CSS ellipsis says the rest. The pause line measures the same way. Owner: amb-win.
import { useLayoutEffect, useRef, useState } from 'react';
import { fitNote } from '@/thread/wake';
import { textWidth, wholeWords } from '@/ds';

/**
 * `whole`: cut by `wholeWords` (one whole word at least, else nothing), its whole text on hover.
 * `chip`: the words sit in a chip that hugs them (an artifact's title, desktop-agents-bar §5): the
 * box is the room, the chip its class, `pad` its sides; the cut is measured in the chip's font.
 */
export function FitWords({ text, className, testId, chip, whole = false }: { text: string; className: string; testId?: string; chip?: { className: string; pad: number }; whole?: boolean }) {
  const box = useRef<HTMLSpanElement>(null);
  const [room, setRoom] = useState<{ avail: number; font: string }>({ avail: Infinity, font: '' });
  useLayoutEffect(() => {
    const el = box.current;
    if (el === null) return;
    const measure = () => {
      const inner = chip === undefined ? null : el.firstElementChild;
      const avail = Math.max(0, el.clientWidth - (chip?.pad ?? 0));
      const font = getComputedStyle(inner ?? el).font;
      setRoom((r) => (r.avail === avail && r.font === font ? r : { avail, font }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [chip]);
  const measured = room.avail !== Infinity && room.font !== '';
  const shown = whole
    ? measured
      ? wholeWords(text, room.avail, textWidth(room.font))
      : text
    : !measured || room.avail === 0
      ? text
      : (fitNote(text, room.avail, textWidth(room.font)) ?? text);
  return (
    <span ref={box} className={className} style={{ flex: '1 1 0' }} title={whole && shown !== text ? text : undefined} data-testid={chip === undefined ? testId : undefined}>
      {chip === undefined ? shown : (
        <span className={chip.className} data-testid={testId}>
          {shown}
        </span>
      )}
    </span>
  );
}
