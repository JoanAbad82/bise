// src/app/side3d · the coins' cards (page folded-side v9, Gabriel's pick, designer m_45474): a
// coin's name and two quiet lines, 12 left of the coin, right-aligned, 232 wide at most, each line
// cut with … . Information only (pointer-events none): a click is the coin's. ⌥ held alone 300 ms
// shows the four at once, no stagger (in 120 ms, out 80 ms; reduced motion: no fade); a hover 400
// ms one, gone on leave (Host). The words are coincard.ts's. Owner: nm-side.
import { side } from '@/proto/words_side.gen';
import type { BubbleId } from './objects';
import { cardWords, type CardPart, type CoinCard } from './coincard';

/** ⌥ held alone this long shows the four cards and the coins' keys (⌥ is a typing key: a French keyboard needs it for { } [ ] |) */
export const CARD_HOLD_MS = 300;
/** a hover this long shows that coin's card (the ds tip's TIP_DELAY_MS) */
export const CARD_HOVER_MS = 400;
/** the card's top above its coin's: the card (64) centred on the coin (44) */
export const CARD_LIFT = 10;

function Line({ parts, n }: { parts: readonly CardPart[]; n: 1 | 2 }) {
  if (parts.length === 0) return null;
  return (
    <span className="s3-tcard-line" data-n={n}>
      {parts.map((p, i) => (
        <span key={i} className="s3-tcard-part" data-tone={p.tone}>
          {i > 0 && p.tone !== 'link' ? <span className="s3-tcard-sep">{' · '}</span> : i > 0 ? ' · ' : null}
          {p.tone === 'chip' ? <span className="b-artchip s3-tcard-chip"><span className="b-artchip-title">{p.text}</span></span> : p.text}
        </span>
      ))}
    </span>
  );
}

/** One coin's card, its top `top` (its coin's less CARD_LIFT). */
export function CoinCardView({ id, card, top }: { id: BubbleId; card: CoinCard; top: number }) {
  return (
    <div className="s3-tcard" style={{ top: top - CARD_LIFT }} aria-hidden="true" title={cardWords(card)} data-testid={`app.bubble.${id}.card`}>
      <span className="s3-tcard-name">{card.name}</span>
      <Line parts={card.l1} n={1} />
      <Line parts={card.l2} n={2} />
    </div>
  );
}

/** a card's words for a reader, without the name (the coin says it) */
export const cardSays = (c: CoinCard): string => cardWords({ ...c, name: '' }) || side.bubble_none;
