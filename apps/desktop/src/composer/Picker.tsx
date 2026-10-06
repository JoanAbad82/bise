// The @ $ / list above the composer: amb-kit's Menu, one MenuItem per row (memo'd, keyed by the
// row's id, so a new keystroke updates the rows that changed and leaves the others as they are).
// The keyboard's row is `on`; a greyed row reads `not yet`. A click picks; the keys are Brain's.
import { useEffect, useRef, type JSX } from 'react';
import { Menu, MenuItem } from '@/ds';
import type { Row } from './pick';

export function Picker({ rows, index, testId, onPick }: { rows: readonly Row[]; index: number; testId: string; onPick: (i: number) => void }): JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // keep the keyboard's row in view, without scrolling the page
    const el = box.current?.querySelector<HTMLElement>(`[data-row="${index}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [index]);
  return (
    <div className="b-composer-pick" ref={box} onMouseDown={(e) => { e.preventDefault(); }}>
      <Menu testId={testId}>
        {rows.map((r, i) => (
          <div key={r.id} data-row={i}>
            <MenuItem on={i === index} disabled={r.off} hotkey={r.desc} testId={`${testId}.${r.id}`} onClick={() => { onPick(i); }}>
              <span className={`tag ${r.tag}`}>{r.label}</span>
            </MenuItem>
          </div>
        ))}
      </Menu>
    </div>
  );
}
