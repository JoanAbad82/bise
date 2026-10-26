// src/app/side3d · the coins as minis (page folded-side v9, Gabriel's pick, designer m_45474,
// m_45616): when the thread has no room for the coins beside the panel, they go in the thread's
// header (its status slot, right-aligned, 12 after TitleStatus's pill when bise has something to
// say, 12 before ⋯/▯), and over a sheet (or a full-width panel) in its tab row. Each mini: its
// object at 16 on a 20 plate, its count after it (t-12 mono text-3), the agents' accent count a
// pill; 8 apart; the open one on --c-active; ⌥ held, each its key in its count's place. They never
// shrink. A click opens that coin's float under the header (Host). CoinSlot is the element Frame's
// status slot and the panel's tab row mount for them (place.ts setCoinSlot). Owner: nm-side.
import { useCallback } from 'react';
import { Press } from '@/ds';
import { ThingPic } from './Bubbles';
import { bubbleThing, BUBBLES, type BubbleId } from './objects';
import { pillText, type BubbleCount } from './model';
import { setCoinSlot } from './place';

/** a mini's object, css px, on its 20 plate */
export const MINI_PX = 16;

/** Where the minis go: Frame's status slot ('header') and the panel's tab row ('tabs') each mount one. */
export function CoinSlot({ at }: { at: 'header' | 'tabs' }) {
  const ref = useCallback((el: HTMLSpanElement | null) => {
    setCoinSlot(at, el);
  }, [at]);
  return <span ref={ref} className="s3-minis-slot" data-at={at} data-testid={`app.coins.${at}`} />;
}

export interface MiniProps {
  readonly counts: Readonly<Record<BubbleId, BubbleCount>>;
  /** the agents mini's accent count: what waits for him */
  readonly badge: number;
  readonly tips: Readonly<Record<BubbleId, string>>;
  readonly open: BubbleId | null;
  /** ⌥ held: each mini's key ('⌥1') in its count's place */
  readonly keys: ((b: BubbleId) => string) | null;
  readonly onClick: (b: BubbleId) => void;
}

/** The four minis, in the coins' order. */
export function Minis({ counts, badge, tips, open, keys, onClick }: MiniProps) {
  return (
    <span className="s3-minis" data-testid="app.minis">
      {BUBBLES.map((b) => {
        const c = counts[b];
        const n = keys !== null ? keys(b) : c.n > 0 || c.always ? pillText(b, c.n) : '';
        return (
          <Press key={b} look="s3-mini" aria-label={tips[b]} aria-expanded={open === b} aria-haspopup="dialog" data-open={open === b || undefined}
            onClick={() => {
              onClick(b);
            }} data-testid={`app.mini.${b}`}>
            <span className="s3-mini-plate" aria-hidden="true">
              <ThingPic thing={bubbleThing(b)} px={MINI_PX} tile={b === 'agents' ? 'thread' : b === 'artifacts' ? 'artifacts' : b === 'scheduled' ? 'scheduled' : 'terminal'} />
            </span>
            {n !== '' && <span className="s3-mini-n" data-key={keys !== null || undefined} data-zero={(keys === null && c.n <= 0) || undefined} aria-hidden="true" data-testid={`app.mini.${b}.n`}>{n}</span>}
            {b === 'agents' && badge > 0 && keys === null && (
              <span className="s3-mini-badge" aria-hidden="true" data-testid="app.mini.agents.badge">{pillText('agents', badge)}</span>
            )}
          </Press>
        );
      })}
    </span>
  );
}
