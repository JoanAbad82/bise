// The @ $ / list above the composer: the ds Picker (designer's list-menu m_24793, m_25011), one
// 32 px row per entry: its kind's glyph (only when the list mixes kinds: '@' agents, '↗' artifacts,
// none for files; a folder ends with '/'), its name, its description (or a file's folder) inline. The
// editor keeps the keys: the keyboard's row is `active`; a greyed row reads `not yet`. A click picks.
// Its height: up to the room above the composer, less 16.
import { useLayoutEffect, useMemo, useRef, useState, type JSX } from 'react';
import { Picker as DsPicker, type PickerRow } from '@/ds';
import type { Row } from './pick';

/** A row's words on the ds Picker: the kind's glyph out of the label, a file's folder under its name. Pure. */
export function pickerRow(r: Row, testId: string): PickerRow {
  const base = { id: r.id, disabled: r.off, testId: `${testId}.${r.id}`, tip: r.desc === '' ? undefined : `${r.label} · ${r.desc}` };
  const sec = r.desc === '' ? undefined : r.desc;
  switch (r.tag) {
    case 'cmd':
      return { ...base, glyph: '/', name: r.label.replace(/^\//u, ''), secondary: sec };
    case 'skill':
      return { ...base, glyph: '$', name: r.label.replace(/^\$/u, ''), secondary: sec };
    case 'agent':
      return { ...base, glyph: '@', name: r.label.replace(/^@/u, ''), secondary: sec };
    case 'artifact':
      return { ...base, glyph: '↗', name: r.label.replace(/^↗\s*/u, ''), secondary: sec };
    case 'file':
    case 'dir': {
      const path = r.label.replace(/\/$/u, '');
      const cut = path.lastIndexOf('/');
      const name = (cut < 0 ? path : path.slice(cut + 1)) + (r.tag === 'dir' ? '/' : '');
      const folder = cut < 0 ? '' : path.slice(0, cut);
      return { ...base, name, secondary: folder === '' ? undefined : <span className="b-picker-path">{folder}</span>, tip: r.label };
    }
    default:
      return { ...base, name: r.label, secondary: sec };
  }
}

export function Picker({ rows, index, testId, onPick }: { rows: readonly Row[]; index: number; testId: string; onPick: (i: number) => void }): JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);
  useLayoutEffect(() => {
    const top = box.current?.parentElement?.getBoundingClientRect().top;
    if (top !== undefined) setMaxHeight(Math.max(120, top - 8 - 16));
  }, []);
  const groups = useMemo(() => [{ id: 'rows', rows: rows.map((r) => pickerRow(r, testId)) }], [rows, testId]);
  return (
    <div className="b-composer-pick" ref={box}>
      <DsPicker
        groups={groups}
        active={rows[index]?.id ?? null}
        onPick={(id) => {
          const i = rows.findIndex((r) => r.id === id);
          if (i >= 0) onPick(i);
        }}
        maxHeight={maxHeight}
        inline
        testId={testId}
      />
    </div>
  );
}
