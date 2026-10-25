// A plugin's icon in the plugins place: its office object (bims-link's objectOf(row, picks), drawn
// small by render.ts through bims-objects' makeObject), in glass when off, with its '?' / '✗' badge,
// each explaining itself on hover. Until the object is drawn, and for good without WebGL or for a
// row that brings none, a plain tile: the row's initials. Takes the row as is (bims-link m_40142:
// its pick, its count and its badges come from the row's typed fields). Owner: plug-desktop.
import { tipAttrs } from '@/ds';
import type { Plugin } from '@/proto';
import { settings } from '@/proto/words.gen';
import { useIconUrl, usePicks } from './icons';
import { badgeOf, titleOf } from './model';
import { iconObject } from './spots';

/** the icon's css size: a row's, the plugin page's head */
const PX = { row: 40, head: 56 } as const;

/** 'Linear' -> 'Li', 'image generation' -> 'ig', 'bise-stats' -> 'bs'. Pure. */
export function initialsOf(title: string): string {
  const words = title.split(/[\s\-_:.]+/).filter((w) => w !== '');
  if (words.length >= 2) return `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}`;
  const w = words[0] ?? '?';
  return w.length > 1 ? `${w[0] ?? ''}${w[1] ?? ''}` : w;
}

/** `lit`: drawn as on though the row is off (computer, a built-in not set up yet: on, says Gabriel). */
export function PluginIcon({ row, project, size = 'row', lit = false, testId }: { row: Plugin; project?: string; size?: 'row' | 'head'; lit?: boolean; testId?: string }) {
  const badge = badgeOf(row);
  const picks = usePicks(project);
  const o = iconObject(row, picks, lit);
  const url = useIconUrl(o, PX[size]);
  return (
    <span className={`plg-icon ${size}${row.on || lit || row.state === 'available' ? '' : ' glass'}`} data-kind={row.kind} data-obj={url === null ? undefined : o?.obj}
      aria-hidden={badge === null || undefined} data-testid={testId}>
      {url !== null ? <img className="plg-obj" src={url} alt="" draggable={false} /> : <span className="plg-tile">{initialsOf(titleOf(row))}</span>}
      {badge !== null && (
        <span className={`plg-badge${badge === '✗' ? ' err' : ''}`} {...tipAttrs(badge === '✗' ? settings.plugins_badge_failed : settings.plugins_badge_waits)}>
          {badge}
        </span>
      )}
    </span>
  );
}
