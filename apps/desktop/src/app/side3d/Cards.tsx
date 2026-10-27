// src/app/side3d · the coins' cards (page folded-side v9, Gabriel's pick, designer m_45474; quiet
// cards, designer m_45869): a
// coin's name and two quiet lines, 12 left of the coin, right-aligned, 232 wide at most, each line
// cut with … . Information only (pointer-events none): a click is the coin's. ⌥ held alone 300 ms
// shows the four at once, no stagger (in 120 ms, out 80 ms; reduced motion: no fade); a hover 400
// ms one, gone on leave (Host). The words are coincard.ts's. Owner: nm-side.
import { side } from '@/proto/words_side.gen';
import type { BubbleId } from './objects';
import { cardWords, type CardPart, type CoinCard } from './coincard';

/** ⌥ held alone this long shows the four cards and the coins' keys (⌥ is a typing key: a French keyboard needs it for { } [ ] |) */
export const CARD_HOLD_MS = 300;
/** a hover this long shows that coin's card: a label, quicker than the ds tips' 400 (designer m_46248, his m_46245) */
export const CARD_HOVER_MS = 150;
/** once a card showed, the next coin's shows at once for this long (sliding down the coins never waits) */
export const CARD_WARM_MS = 1000;
/** the pointer gone this long before the card goes (crossing the gap between coins doesn't blink) */
export const CARD_GRACE_MS = 100;
/** the card's fade out */
export const CARD_OUT_MS = 80;
/** a coin's middle under its top: the caption's block is centred on it (designer m_45869) */
export const COIN_MID = 22;

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

/** One coin's caption, centred on its coin (`top` the coin's): a quiet card in the coin's own fill (designer m_45869); `out`: fading out. */
export function CoinCardView({ id, card, top, out = false }: { id: BubbleId; card: CoinCard; top: number; out?: boolean }) {
  return (
    <div className="s3-tcard" data-out={out || undefined} style={{ top: top + COIN_MID }} aria-hidden="true" title={cardWords(card)} data-testid={out ? `app.bubble.${id}.card.out` : `app.bubble.${id}.card`}>
      <span className="s3-tcard-name">{card.name}</span>
      <Line parts={card.l1} n={1} />
      <Line parts={card.l2} n={2} />
    </div>
  );
}

/** a card's words for a reader, without the name (the coin says it) */
export const cardSays = (c: CoinCard): string => cardWords({ ...c, name: '' }) || side.bubble_none;
