// The map chip in the office's bottom-left corner (brief bims-mapsel, Gabriel: « un petit selector
// de map qui prend pas trop de place, et qui a l'air discret en bas à gauche »): the map's name and
// the ds caret, quiet (office.css .bims-chip, '⤢ fit''s look); a click, ⏎ or space opens the ds
// Dropdown upward with /bims's rows (maps/words.ts mapChoices: the ready maps, the current one ✓),
// two-line (name, mood). A pick is the caller's (RightBar: the same prefs_set as /bims); esc or a
// press away closes it with no change. Its clicks, drags and keys never reach the office under it
// (the menu's portal bubbles through React): no bim opens, no camera moves. The town never mounts
// it (no `onPick`). Owner: bims-mapsel.
import type { SyntheticEvent } from 'react';
import { Dropdown, type PickerRow } from '@/ds';
import { bims } from '@/proto/words_bims.gen';
import type { MapId } from './maps/ids';
import { readyMaps } from './maps';
import { mapChoices, mapName } from './maps/words';

/** The menu's rows: /bims's (mapChoices), each a two-line row with its test id. Pure. */
export function mapRows(offered: readonly MapId[], current: MapId): PickerRow[] {
  return mapChoices(offered, current).map((c) => ({
    id: c.value,
    name: c.label ?? c.value,
    secondary: c.desc,
    ...(c.current === true ? { current: true } : {}),
    ...(c.tip === undefined ? {} : { tip: c.tip }),
    testId: `app.right.bims.map.${c.value}`,
  }));
}

const stop = (e: SyntheticEvent) => {
  e.stopPropagation();
};

export function MapChip({ map, onPick }: { map: MapId; onPick: (id: MapId) => void }) {
  const rows = mapRows(readyMaps(), map);
  return (
    <div onClick={stop} onDoubleClick={stop} onPointerDown={stop} onPointerMove={stop} onKeyDown={stop}>
      <Dropdown
        label={mapName(map)}
        extra="bims-chip"
        name={bims.map_chip_label}
        tip={bims.map_chip_tip}
        testId="app.right.bims.map"
        // above the chip; on its left edge unless that passes the window (pickerPlace 'auto': at 320
        // docked it ends on the chip's right edge, over the thread)
        side="above"
        groups={[{ id: 'maps', rows }]}
        onPick={(id) => {
          const m = rows.find((r) => r.id === id);
          if (m !== undefined && m.current !== true) onPick(id as MapId);
        }}
      />
    </div>
  );
}
