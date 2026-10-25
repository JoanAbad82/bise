// src/app/menus · useEntityMenu: a thing's native menu (bise fait mac, page native-mac mockup 9 and
// decision d4): the same menu on a right click and on its '…' (ds MoreButton), built from one pure
// action registry and shown by macOS (window.bise.popupMenu, Electron's Menu.popup). Every screen
// wires it in its own files: <ListRow onContextMenu={m.onContextMenu} end={<MoreButton menu={m} />} />.
// The contract nm-ds set for the wave (its shape is the ds's EntityMenu: a ds file never imports
// the app); nm-menus fills it. Owner: nm-menus.
import type { EntityMenu } from '@/ds';
import type { Entity } from '@/shared/entity';

/** `e`'s menu: onContextMenu for a right click on its row or tab, open() for its '…'. */
export const useEntityMenu: (e: Entity) => EntityMenu = () => {
  // STUB(native-mac): nm-menus
  return NO_MENU;
};

const NO_MENU: EntityMenu = {
  onContextMenu: () => undefined,
  open: () => undefined,
};
