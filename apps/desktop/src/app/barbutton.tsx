// The window bar's one button (bise fait mac, page native-mac §6): 28 × 28, r 6, its line icon 16,
// text-2 at rest, the same hover, press and pressed grounds (app.css .app-bar-b), a no-drag region.
// Every button in the bar is one: the lead's sidebar button, the right group's page '…' (a page's
// <InBar>), the side-card button and the panel's ▯ (his m_49507: the '…' was the ds row's, text-3
// and its own press; the ▯ an IconButton at 24). Owner: nm-frame.
import type { MouseEvent } from 'react';
import { AppIcon, Kbd, Press, tipAttrs, type AppIconName, type EntityMenu } from '@/ds';
import { ds } from '@/proto/words_ds.gen';
import { frame } from '@/proto/words_frame.gen';

export interface BarButtonProps {
  icon: AppIconName;
  /** what it does: its VoiceOver name, and its tip with `keys` after it */
  label: string;
  /** its key ('⌘B'): in its tip, and its keycap in place of the glyph while `hint` */
  keys?: string;
  /** its tip when the label already says the key (the panel's words) */
  tip?: string;
  /** its modifier is held (held.ts): the keycap shows in place of the glyph */
  hint?: boolean;
  /** a toggle's state (aria-pressed) */
  pressed?: boolean;
  disabled?: boolean;
  /** it opens a menu (aria-haspopup: menus/use.ts anchors the menu under it) */
  menu?: boolean;
  onClick: () => void;
  onContextMenu?: (e: MouseEvent<HTMLElement>) => void;
  testId: string;
}

/** A title bar button: 28 × 28, its line icon 16, its tip with its key; `hint`: its keycap in place of its glyph. */
export function BarButton({ icon, label, keys, tip, hint, pressed, disabled, menu, onClick, onContextMenu, testId }: BarButtonProps) {
  const hasKeys = keys !== undefined && keys !== '';
  return (
    <Press
      look="app-bar-b"
      aria-label={label}
      aria-pressed={pressed}
      aria-haspopup={menu === true ? 'menu' : undefined}
      disabled={disabled}
      {...tipAttrs(tip ?? (hasKeys ? frame.tip_key({ what: label, key: keys }) : label))}
      onClick={onClick}
      onContextMenu={onContextMenu}
      data-testid={testId}
    >
      {hint === true && hasKeys ? (
        <span className="app-keyhint" data-testid={`${testId}.hint`}>
          <Kbd>{keys}</Kbd>
        </span>
      ) : (
        <AppIcon name={icon} size={16} />
      )}
    </Press>
  );
}

/** A page's '…' in the bar (through <InBar>): its entity's menu under it, its right click the same menu. */
export function BarMore({ menu, testId }: { menu: EntityMenu; testId: string }) {
  return <BarButton icon="more" label={ds.more_actions} menu onClick={menu.open} onContextMenu={menu.onContextMenu} testId={testId} />;
}
