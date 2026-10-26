// src/app/side3d · a bubble's card (page native-mac §7, mockups 12, 13, 15): 360 wide, 12 left of
// the bubbles, its top on its bubble's and kept 24 inside the window, at most min(window − 48,
// 560) high (layout cardTop, cardMaxH), r 16, glass (--c-overlay + --glass), --e-3; a head of 32
// (its name 13/600, what it counts text-3, then '+' and '▯' open as a tab), its rows (they scroll
// inside under a 24 fade when they overflow), one foot: a rule and a 32 row of 12 text-3 ('3
// archived' · 'all agents ›'), the card's end (no padding under it). Floats over the page with
// its whole shadow (SideHost is fixed at the shell's root: noClip). Its rows: SideRow, 48 high, a
// 40 object, 12 between, a name and a line under it, a dot at the end; its button is a `data-row`
// (SideHost's ↑ ↓ walk the rows, ⏎ opens). Esc and a click outside close it (SideHost). Owner: nm-side.
import type { MouseEventHandler, ReactNode } from 'react';
import { AppIcon, Press, tipAttrs } from '@/ds';
import type { EntityMenu } from '@/ds';
import { side } from '@/proto/words_side.gen';
import type { BubbleId } from './objects';

/** A card's head button (+, ▯): 28, its line icon at 16, its tip and VoiceOver name. */
export function HeadButton({ icon, tip, onClick, testId }: { icon: 'plus' | 'panel'; tip: string; onClick: () => void; testId: string }) {
  return (
    <Press look="s3-icon-btn" aria-label={tip} {...tipAttrs(tip)} onClick={onClick} data-testid={testId}>
      <AppIcon name={icon} size={16} />
    </Press>
  );
}

/** A card's link ('all agents ›'). */
export function SideLink({ children, onClick, testId }: { children: ReactNode; onClick: () => void; testId: string }) {
  return (
    <Press look="s3-link" onClick={onClick} data-testid={testId}>
      {children}
    </Press>
  );
}

export interface FlyoutProps {
  readonly id: BubbleId;
  /** its name ('Agents') and what it counts ('3 working · 1 asks') */
  readonly name: string;
  readonly says: string;
  /** the head's '+' (agents: a new agent; artifacts: add a file) */
  readonly add?: ReactNode;
  /** the head's '▯': the same list as a tab of the panel */
  readonly onPin: () => void;
  /** its top, px from the side's top (aligned on its bubble, kept inside the window) */
  readonly top: number;
  readonly foot: { readonly left: string; readonly right: string; readonly onRight: () => void } | null;
  /** its full page's link on its head ('all processes ›'), when its kinds each keep theirs on their head */
  readonly link?: { readonly text: string; readonly onClick: () => void };
  /** its height at most: the window's (layout cardMaxH, min(window − 48, 560)); its rows scroll inside */
  readonly maxH: number;
  /** its rows overflow: they scroll under a 24 fade at the bottom */
  readonly scrolls?: boolean;
  readonly children: ReactNode;
}

export function Flyout({ id, name, says, add, onPin, top, foot, link, maxH, scrolls = false, children }: FlyoutProps) {
  return (
    <section className="s3-card" style={{ top, maxHeight: maxH }} data-foot={foot !== null || undefined} role="dialog" aria-label={name} data-testid={`app.flyout.${id}`}>
      <header className="s3-card-head">
        <b>{name}</b>
        {says !== '' && <span className="s3-card-says">{says}</span>}
        <span className="s3-card-acts">
          {link !== undefined && (
            <SideLink onClick={link.onClick} testId={`app.flyout.${id}.all`}>
              {link.text}
            </SideLink>
          )}
          {add}
          <HeadButton icon="panel" tip={side.pin_tab} onClick={onPin} testId={`app.flyout.${id}.pin`} />
        </span>
      </header>
      <div className="s3-card-body" data-scrolls={scrolls || undefined}>
        {children}
      </div>
      {foot !== null && (
        <footer className="s3-card-foot">
          <span>{foot.left}</span>
          <SideLink onClick={foot.onRight} testId={`app.flyout.${id}.all`}>
            {foot.right}
          </SideLink>
        </footer>
      )}
    </section>
  );
}

export interface SideRowProps {
  /** the 40 object */
  readonly pic: ReactNode;
  readonly title: ReactNode;
  readonly sub: ReactNode;
  /** the end: a dot (new, running), an age */
  readonly end?: ReactNode;
  readonly label?: string;
  readonly tip?: string;
  readonly onClick: MouseEventHandler<HTMLButtonElement>;
  readonly menu: EntityMenu;
  readonly testId: string;
}

/** A card's row: one button (its click, its focus ring, its VoiceOver name), the entity's menu on a right click. */
export function SideRow({ pic, title, sub, end, label, tip, onClick, menu, testId }: SideRowProps) {
  return (
    <div className="s3-row" onContextMenu={menu.onContextMenu} data-testid={testId}>
      <Press look="s3-row-body" aria-label={label} {...tipAttrs(tip)} onClick={onClick} data-row="">
        <span className="s3-row-pic">{pic}</span>
        <span className="s3-row-lines">
          <span className="s3-row-l1">{title}</span>
          <span className="s3-row-l2">{sub}</span>
        </span>
        {end != null && <span className="s3-row-end">{end}</span>}
      </Press>
    </div>
  );
}

/** A card's empty line. */
export function Empty({ children }: { children: ReactNode }) {
  return <p className="s3-empty">{children}</p>;
}
