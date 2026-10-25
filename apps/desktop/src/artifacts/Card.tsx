// One card of the gallery (page artifacts-gallery v7, block b-card, every state): the picture, a
// name and one line (density rule 1, grid.ts lineOf). On hover or focus only, in place, nothing
// moving (rule 2): ··· (its menu), the pick circle, the extension at the picture's corner, a link's
// '↗ domain'. One hue, for what is new: the pink 'new' chip (rule 3); the cursor and a pick are a
// 2 px ink ring, several picked fill their circles. A stack: two sheets behind its cover and its
// count at the top right ('16 shots saved in one turn: opens as a sheet'). Every mark has its tip
// (page block tips). The picture inside the 16:10 box is art-thumbs' <Thumb>. Owner: art-grid.
import { memo, type HTMLAttributes, type MouseEvent } from 'react';
import { Press, tipAttrs } from '@/ds';
import { Thumb, thumbExt } from './thumbs';
import { countTip, domainOf, extTip, isNew, lineTip, titleOf, topOf, type Card } from './gallery';
import { library } from '@/proto/words_library.gen';
import { panel } from '@/proto/words_panel.gen';
import { leaves, type Item } from './model';

/** How a click picked: ⌘ adds or takes one, shift picks the run up to it. */
export interface PickHow {
  readonly meta: boolean;
  readonly shift: boolean;
}

/** The picture of a card: the 16:10 box, the stack's sheets behind, the marks on its corners. */
export function CardPic({ card, it, visible, picked, onPick, onMenu, testId }: {
  card: Card | null;
  it: Item;
  visible: boolean;
  /** several picked: the circle filled */
  picked: boolean;
  onPick?: (how: PickHow) => void;
  onMenu?: (at: { x: number; y: number }) => void;
  testId: string;
}) {
  const ext = thumbExt(it);
  const out = leaves(it.a);
  const domain = domainOf(it.a);
  const stack = card?.kind === 'stack' ? card : null;
  return (
    <span className={`art-card-pic${stack ? ' stack' : ''}`}>
      {stack && <span className="art-card-s2" aria-hidden="true" />}
      {stack && <span className="art-card-s1" aria-hidden="true" />}
      <span className="art-card-th" data-testid={`${testId}.pic`}>
        <Thumb item={it} visible={visible} />
        {ext !== null && !out && <span className="art-card-x" data-testid={`${testId}.ext`} {...tipAttrs(extTip(it))}>{ext}</span>}
        {stack && <span className="art-card-n" data-testid={`${testId}.count`} {...tipAttrs(countTip(stack))}>{stack.items.length}</span>}
        {out && <span className="art-card-lk" data-testid={`${testId}.out`} {...tipAttrs(library.tip_leaves)}>{domain === '' ? '↗' : `↗ ${domain}`}</span>}
      </span>
      {onPick && (
        <Press tabIndex={-1} look={`art-card-ck${picked ? ' y' : ''}`} aria-label="pick" aria-pressed={picked}
          data-testid={`${testId}.pick`} {...tipAttrs(library.tip_pick)}
          onClick={(e) => { e.stopPropagation(); onPick({ meta: true, shift: false }); }}>
          {picked ? '✓' : ''}
        </Press>
      )}
      {onMenu && (
        <Press tabIndex={-1} look="art-card-mb" aria-label="more" data-testid={`${testId}.menu`} {...tipAttrs(library.tip_more)}
          onClick={(e) => {
            e.stopPropagation();
            const r = e.currentTarget.getBoundingClientRect();
            onMenu({ x: r.left, y: r.bottom });
          }}>
          ···
        </Press>
      )}
    </span>
  );
}

export interface CardProps {
  card: Card;
  /** the line under its name (grid.ts lineOf) */
  line: string;
  /** the keyboard cursor: its ring */
  on: boolean;
  /** in his multi-pick */
  picked: boolean;
  /** several picked: the circles fill */
  many: boolean;
  /** in the virtualizer's range (art-thumbs draws these first) */
  visible: boolean;
  onPick: (key: string, how: PickHow) => void;
  onOpen: (card: Card) => void;
  onMenu?: (key: string, at: { x: number; y: number }) => void;
  dragOf?: (key: string) => HTMLAttributes<HTMLElement>;
  testId: string;
}

/** One card, every state of block b-card. */
export const ArtCard = memo(function ArtCard({ card, line, on, picked, many, visible, onPick, onOpen, onMenu, dragOf, testId }: CardProps) {
  const it = topOf(card);
  const name = titleOf(card);
  const menu = onMenu === undefined ? undefined : (at: { x: number; y: number }) => { onMenu(card.key, at); };
  return (
    <div {...dragOf?.(card.key)} className={`art-card${on ? ' on' : ''}${picked ? ' picked' : ''}`} role="option" aria-selected={on || picked}
      data-row={card.key} data-testid={testId} data-stack={card.kind === 'stack' || undefined}
      onClick={(e: MouseEvent) => { onPick(card.key, { meta: e.metaKey || e.ctrlKey, shift: e.shiftKey }); }}
      onDoubleClick={() => { onOpen(card); }}
      onContextMenu={menu === undefined ? undefined : (e) => { e.preventDefault(); menu({ x: e.clientX, y: e.clientY }); }}>
      <CardPic card={card} it={it} visible={visible} picked={many && picked}
        onPick={(how) => { onPick(card.key, how); }} {...(menu === undefined ? {} : { onMenu: menu })} testId={testId} />
      <span className="art-card-tt">
        <span className="art-card-t1" {...tipAttrs(name)}>{name}</span>
        {isNew(card) && <span className="art-new" data-testid={`${testId}.new`} {...tipAttrs(library.tip_new)}>{panel.new_chip}</span>}
      </span>
      <span className="art-card-mt" data-testid={`${testId}.line`} {...tipAttrs(lineTip(card))}>{line}</span>
    </div>
  );
});
