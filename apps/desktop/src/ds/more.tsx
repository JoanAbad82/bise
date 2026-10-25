// src/ds · MoreButton: the '…' at a row's end and in a bar (bise fait mac, page native-mac §6 and
// mockup 9): 28 × 28, r 6, the AppIcon 'more' at 16, text-3 until hovered; its VoiceOver name and
// tip are the ds's words. It replaces the text action links (rename, remove, restore, stop, all ›)
// on the rows. A click opens the entity's native menu: the screen hands it useEntityMenu(e)'s
// result (app/menus/use.ts, nm-menus), whose shape is EntityMenu here (a ds file never imports the
// app: purity.mts). Pure render of its props. Owner: nm-ds.
import type { MouseEvent, MouseEventHandler } from "react";
import { ds } from "@/proto/words_ds.gen";
import { AppIcon } from "./icons-app";
import { tipAttrs } from "./tip";

/** What a thing's menu gives a screen (app/menus/use.ts useEntityMenu): the right click, and open() for its '…'. */
export interface EntityMenu {
  /** on a row's or a tab's contextmenu: the native menu at the pointer */
  readonly onContextMenu: (e: MouseEvent<HTMLElement>) => void;
  /** the '…': the same menu, under the button */
  readonly open: () => void;
}

export interface MoreButtonProps {
  /** useEntityMenu(e) of the thing it is the '…' of */
  menu: EntityMenu;
  testId?: string;
}

export function MoreButton({ menu, testId }: MoreButtonProps) {
  // a ListRow keeps its end beside its body's button, so this click never reaches the row's
  const click: MouseEventHandler<HTMLButtonElement> = () => {
    menu.open();
  };
  return (
    <button type="button" className="b-more" aria-label={ds.more_actions} aria-haspopup="menu" {...tipAttrs(ds.more_actions)}
      onClick={click} onContextMenu={menu.onContextMenu} data-testid={testId}>
      <AppIcon name="more" size={16} />
    </button>
  );
}
