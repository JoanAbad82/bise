// src/app/side3d · the 3D bubbles under the world (page native-mac §7, pick A; round 3: B, the coin,
// bims-plugins' spec, designer m_44673): each a 44 opaque coin (side3d.css: the top face, a 3 px
// side one step darker, a soft contact shadow), 36 apart; its object drawn in a 54 square at
// objects.ts objectAt (left -5, top -25: 44 high, its base at 55 % of the disc, rising 20) with its
// own contact shadow on the coin's top; agents = a bust, artifacts = three sheets, scheduled = the
// hourglass, processes = a laptop (bubble3d.ts), drawn by cache.ts; no WebGL: a plain tile with the
// kind's line icon. One pill centred on the coin's bottom rim (mono t-12 tabular, 3 digits whole):
// the count, the accent when an agent asks, none at 0; ⌥ held, the bubble's key '⌥1' in the same
// pill (pillOf), gone at release. Open: a 2 ring of --c-focus (never the accent). ⌥1-⌥4 open them
// while the side is folded, ⌥⌘1-⌥⌘4 always (keys.ts; r2-side 6, designer m_44292). Each has its tip
// and VoiceOver name ('Agents · 3 working · 1 asks'). The world folded into one (d3) is a 5th, on
// top, the same. Owner: nm-side; the coin: r3-bubbles.
import type { ReactNode } from 'react';
import { AppIcon, Press, tipAttrs, type AppIconName } from '@/ds';
import { side } from '@/proto/words_side.gen';
import { useThingPng } from './cache';
import { bubbleThing, objectAt, type BubbleId, type Thing } from './objects';

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
  /** its count (none at 0) and whether it is the accent */
  readonly count: { readonly n: number; readonly accent: boolean };
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

/** The pill on a coin's bottom rim: ⌥ held, the key in place of the count (accent kept); else the count, none at 0. Pure. */
export function pillOf(count: BubbleProps['count'], hint: string | undefined): { text: string; accent: boolean; key: boolean } | null {
  if (hint !== undefined) return { text: hint, accent: count.accent, key: true };
  if (count.n <= 0) return null;
  return { text: String(count.n), accent: count.accent, key: false };
}

export function Bubble({ id, count, tip, open, top, onClick, pic, hint }: BubbleProps) {
  const pill = pillOf(count, hint);
  return (
    <Press look="s3-bubble" style={{ top }} aria-label={tip} aria-expanded={id === 'world' ? undefined : open}
      aria-haspopup={id === 'world' ? undefined : 'dialog'} data-open={open || undefined} {...tipAttrs(tip)} onClick={onClick}
      data-testid={`app.bubble.${id}`}>
      <span className="s3-obj" style={{ left: OBJ.left, top: OBJ.top, width: OBJ.size, height: OBJ.size }}>
        {pic ?? (id === 'world' ? null : <ThingPic thing={bubbleThing(id)} px={OBJ.size} tile={TILE[id]} />)}
      </span>
      {pill !== null && (
        <span className="s3-count" data-accent={pill.accent || undefined} aria-hidden="true"
          data-testid={`app.bubble.${id}.${pill.key ? 'key' : 'count'}`}>
          {pill.text}
        </span>
      )}
    </Press>
  );
}

/** The world bubble's name. */
export const WORLD_NAME = side.world;
