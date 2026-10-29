// A stack open (page artifacts-gallery v7, block b-pages 'a stack open'): its contact sheet. Under
// the screen's header (Screen.tsx, art-folders: the path, its name, ···): one line ('amb-home
// saved 16 shots in one turn · today 14:02'), the filter chips taken from its names ('all 16 · dark
// · light · 1400 · 800', one at a time), then every picture with its caption in mono. The keys are
// the grid's (←→ ↑↓, ⏎ opens one, space looks, @, v, c, r) and esc goes back to the cards.
// Owner: art-grid.
import { useState, type KeyboardEvent } from 'react';
import { Press } from '@/ds';
import { CardPic } from './Card';
import { useGridKeys } from './gridKeys';
import { captionOf, chipsOf, sheetItems, sheetLine, type Card, type Stack } from './gallery';
import { rowKey } from './List';
import type { Item } from './model';
import { library } from '@/proto/words_library.gen';
import './cards.css';

export interface SheetProps {
  readonly stack: Stack;
  readonly now: number;
  readonly onOpen: (it: Item) => void;
  readonly onLook?: (it: Item) => void;
  readonly onPut?: (it: Item) => void;
  /** esc: back to the cards */
  readonly onBack: () => void;
  readonly testId: string;
}

export function StackSheet({ stack, now, onOpen, onLook, onPut, onBack, testId }: SheetProps) {
  const chips = chipsOf(stack);
  const [chip, setChip] = useState<string | null>(null);
  const items = sheetItems(stack, chip);
  const itemOf = (c: Card | undefined): Item | undefined => (c?.kind === 'one' ? c.it : undefined);
  const byId = new Map(items.map((it) => [`${it.project}/${it.a.id}`, it]));
  const { ref, onKeyDown, cards, cols, sel, setSel } = useGridKeys<HTMLDivElement>({
    items,
    view: 'grid',
    days: false,
    stacks: false,
    onOpen: (k) => {
      const it = byId.get(k);
      if (it) onOpen(it);
    },
    onKey: (e: KeyboardEvent, k) => {
      if (rowKey(e, k === null ? undefined : byId.get(k), { onOpen, ...(onLook ? { onLook } : {}), ...(onPut ? { onPut } : {}) })) return true;
      if (e.key !== 'Escape' || e.metaKey || e.ctrlKey || e.altKey) return false;
      if (chip !== null) setChip(null);
      else onBack();
      return true;
    },
  });
  return (
    <div ref={ref} tabIndex={-1} className="art-sheet-wrap" onKeyDown={onKeyDown} data-testid={testId}>
      <div className="art-sheet-sub" data-testid={`${testId}.line`}>{sheetLine(stack, now)}</div>
      {chips.length > 0 && (
        <div className="art-sheet-chips">
          <Press look={`art-chip${chip === null ? ' on' : ''}`} aria-pressed={chip === null} onClick={() => { setChip(null); }} data-testid={`${testId}.chip.all`}>
            {library.sheet_all({ n: stack.items.length })}
          </Press>
          {chips.map((c) => (
            <Press key={c} look={`art-chip${chip === c ? ' on' : ''}`} aria-pressed={chip === c} onClick={() => { setChip(chip === c ? null : c); }}
              data-testid={`${testId}.chip.${c}`}>
              {c}
            </Press>
          ))}
        </div>
      )}
      <div className="art-sheet" role="listbox" style={{ gridTemplateColumns: `repeat(${String(cols)}, minmax(0, 1fr))` }}>
        {cards.map((c) => {
          const it = itemOf(c);
          if (it === undefined) return null;
          const on = sel === c.key;
          return (
            <div key={c.key} className={`art-card sheet${on ? ' on' : ''}`} role="option" aria-selected={on} data-row={c.key}
              data-testid={`${testId}.item.${it.a.id}`} onClick={() => { setSel(c.key); onOpen(it); }}>
              <CardPic card={null} it={it} visible picked={false} testId={`${testId}.item.${it.a.id}`} />
              <span className="art-sheet-cp">{captionOf(it, stack.title)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
