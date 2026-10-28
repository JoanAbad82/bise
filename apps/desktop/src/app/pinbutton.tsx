// The hover pin (his m_49100, native-lead m_49106): a row's own ds glyph button that takes its end's
// place while the pointer is on the row (or the button has the keyboard's focus), 'Pin' / 'Unpin'
// in its tip; the whole row stays the open target. A pinned row shows the quiet pin mark at rest
// (PinMark), the pages too. Its click pins or unpins through pins.ts, never opens the row. The rows
// that carry it place it (side3d.css .s3-pin, the pages' own CSS). Owner: nm-frame.
import { AppIcon, IconButton, tipAttrs } from '@/ds';
import { menus } from '@/proto/words_menus.gen';
import { frame } from '@/proto/words_frame.gen';
import { pinThing, type PinKind } from './pins';

/** What a row needs to carry its pin: its thing, and whether it is pinned now. */
export interface PinOf {
  readonly kind: PinKind;
  readonly project: string;
  /** its pin id (pins.ts: a name, an artifact id, a timer id, procPinId) */
  readonly id: string;
  readonly on: boolean;
}

/** The hover pin: pins or unpins `pin`'s thing. */
export function PinButton({ pin, look, testId }: { pin: PinOf; look?: string; testId: string }) {
  return (
    <span className={look ?? 's3-pin'} data-on={pin.on || undefined}>
      <IconButton
        size="row"
        label={pin.on ? menus.unpin : menus.pin}
        pressed={pin.on}
        onClick={(e) => {
          e.stopPropagation();
          pinThing(pin.kind, pin.project, pin.id, !pin.on);
        }}
        testId={testId}
      >
        <AppIcon name="pin" size={14} />
      </IconButton>
    </span>
  );
}

/** A pinned row's quiet mark at rest: the pin, text-3, its tip 'Pinned'. */
export function PinMark({ testId }: { testId: string }) {
  return (
    <span className="b-pinmark" aria-label={frame.pinned} {...tipAttrs(frame.pinned)} data-testid={testId}>
      <AppIcon name="pin" size={14} />
    </span>
  );
}
