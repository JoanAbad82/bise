// src/app/side3d · the 3D bubbles under the world (page native-mac §7, pick A; round 3: B, the coin,
// bims-plugins' spec, designer m_44673): each a 44 opaque coin (side3d.css: the top face, a 3 px
// side one step darker, a soft contact shadow), 36 apart; its object drawn in a 36 square at
// objects.ts objectAt (left 4, top -14: its base on the disc's centre, rising 10 at most, designer
// m_45014) over the plate's own shadow; agents = a bust, artifacts = three sheets, scheduled = the
// hourglass, processes = a laptop (bubble3d.ts), drawn by cache.ts; no WebGL: a plain tile with the
// kind's line icon. One pill centred on the coin's rim lower-left (mono t-12 tabular, 3 digits
// whole, text-2 on --c-raised): the count, none at 0; the agents bubble's is its active agents,
// always shown ('0' in text-3, '99+' past 99), and a second pill on its rim upper-left, the accent:
// what waits for him, hidden at 0, over the object like an app badge (designer m_44986: the pink in
// that one place); ⌥ held, the bubble's key '⌥1' in the bottom pill (pillOf), the top one stays.
// Open: a 2 ring of --c-focus (never the accent). ⌥1-⌥4 open them while the side is folded, ⌥⌘1-⌥⌘4
// always (keys.ts; r2-side 6, designer m_44292). Each has its tip and VoiceOver name ('Agents · 3
// active · 2 waiting for you'). The world folded into one (d3) is a 5th, on top, the same. Owner:
// nm-side; the coin: r3-bubbles; the two pills and the placing: m-bubbles.
import { useState, type ReactNode } from 'react';
import { AppIcon, Press, tipAttrs, type AppIconName } from '@/ds';
import { side } from '@/proto/words_side.gen';
import { useThingPng } from './cache';
import { bubbleThing, objectAt, type BubbleId, type Thing } from './objects';
import { pillText, type BubbleCount } from './model';

/** where a bubble's object square sits on its coin, css px (objects.ts COIN) */
const OBJ = objectAt();

/** the plain tile's icon of each bubble when there is no WebGL */
const TILE: Record<BubbleId, AppIconName> = { agents: 'thread', artifacts: 'artifacts', scheduled: 'scheduled', processes: 'terminal' };

/** A thing's 3D picture, or its plain tile until drawn (or with no WebGL). */
export function ThingPic({ thing, px, tile, className }: { thing: Thing; px: number; tile: AppIconName; className?: string }) {
  const url = useThingPng(thing, px);
  if (url === null) {
    return (
      <span className={`s3-tile ${className ?? ''}`} aria-hidden="true">
        <AppIcon name={tile} size={16} />
      </span>
    );
  }
  return <img className={className} src={url} alt="" draggable={false} width={px} height={px} />;
}

export interface BubbleProps {
  readonly id: BubbleId | 'world';
  /** its bottom pill's count (model bubbleCount); none: no pill (the world) */
  readonly count: BubbleCount | null;
  /** the agents bubble's top pill: what waits for him, hidden at 0 */
  readonly badge?: number;
  /** its tip and VoiceOver name */
  readonly tip: string;
  readonly open: boolean;
  /** its top, px from the side's top */
  readonly top: number;
  readonly onClick: () => void;
  /** the world's thumbnail in place of an object */
  readonly pic?: ReactNode;
  /** ⌥ held: its key ('⌥1'), shown in the count's pill; none: the count */
  readonly hint?: string | undefined;
}

/** The pill on a coin's rim lower-left: ⌥ held, the key in place of the count; else the count, none at 0 unless `always` ('0' then is `zero`: text-3). Pure. */
export function pillOf(b: BubbleId, count: BubbleCount | null, hint: string | undefined): { text: string; key: boolean; zero: boolean } | null {
  if (hint !== undefined) return { text: hint, key: true, zero: false };
  if (count === null || (count.n <= 0 && !count.always)) return null;
  return { text: pillText(b, count.n), key: false, zero: count.n <= 0 };
}

/**
 * The agents bubble's top pill, kept while it fades out (designer m_44986: in, fade and scale .8
 * to 1 in 150 ms; out, a 120 ms fade; a new number does not move): the number it shows and
 * whether it is leaving.
 */
function useBadge(n: number): { readonly n: number; readonly out: boolean } {
  const [kept, setKept] = useState(n);
  if (n > 0 && n !== kept) setKept(n);
  return { n: n > 0 ? n : kept, out: n <= 0 };
}

export function Bubble({ id, count, badge = 0, tip, open, top, onClick, pic, hint }: BubbleProps) {
  const pill = id === 'world' ? null : pillOf(id, count, hint);
  const top2 = useBadge(badge);
  return (
    <Press look="s3-bubble" style={{ top }} aria-label={tip} aria-expanded={id === 'world' ? undefined : open}
      aria-haspopup={id === 'world' ? undefined : 'dialog'} data-open={open || undefined} {...tipAttrs(tip)} onClick={onClick}
      data-testid={`app.bubble.${id}`}>
      <span className="s3-obj" style={{ left: OBJ.left, top: OBJ.top, width: OBJ.size, height: OBJ.size }}>
        {pic ?? (id === 'world' ? null : <ThingPic thing={bubbleThing(id)} px={OBJ.size} tile={TILE[id]} />)}
      </span>
      {pill !== null && id !== 'world' && (
        <span className="s3-count" data-zero={pill.zero || undefined} aria-hidden="true"
          {...tipAttrs(id === 'agents' && !pill.key ? side.active({ n: count?.n ?? 0 }) : undefined)}
          data-testid={`app.bubble.${id}.${pill.key ? 'key' : 'count'}`}>
          {pill.text}
        </span>
      )}
      {id === 'agents' && top2.n > 0 && (
        <span className="s3-count s3-badge" data-accent="" data-out={top2.out || undefined} aria-hidden="true"
          {...tipAttrs(side.waiting_you({ n: top2.n }))} data-testid="app.bubble.agents.badge">
          {pillText('agents', top2.n)}
        </span>
      )}
    </Press>
  );
}

/** The world bubble's name. */
export const WORLD_NAME = side.world;
