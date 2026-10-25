// A plugin's icon in the plugins place: the one seam where its office object's render goes
// (bims-link's objectOf(row, picks) + bims-objects' makeObject, rendered small by plugins-ui's p7).
// Until those land on main it draws a plain tile: the row's initials, glass (faint) when off, and
// its '?' / '✗' badge, each explaining itself on hover. Takes the row as is (bims-link m_40142:
// its pick, its count and its badges come from the row's typed fields). Owner: plug-desktop.
import { tipAttrs } from '@/ds';
import type { Plugin } from '@/proto';
import { settings } from '@/proto/words.gen';
import { badgeOf, titleOf } from './model';

/** 'Linear' -> 'Li', 'image generation' -> 'ig', 'bise-stats' -> 'bs'. Pure. */
export function initialsOf(title: string): string {
  const words = title.split(/[\s\-_:.]+/).filter((w) => w !== '');
  if (words.length >= 2) return `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}`;
  const w = words[0] ?? '?';
  return w.length > 1 ? `${w[0] ?? ''}${w[1] ?? ''}` : w;
}

/** `lit`: drawn as on though the row is off (computer, a built-in not set up yet: on, says Gabriel). */
export function PluginIcon({ row, size = 'row', lit = false, testId }: { row: Plugin; project?: string; size?: 'row' | 'head'; lit?: boolean; testId?: string }) {
  const badge = badgeOf(row);
  return (
    <span className={`plg-icon ${size}${row.on || lit || row.state === 'available' ? '' : ' glass'}`} data-kind={row.kind} aria-hidden={badge === null || undefined} data-testid={testId}>
      <span className="plg-tile">{initialsOf(titleOf(row))}</span>
      {badge !== null && (
        <span className={`plg-badge${badge === '✗' ? ' err' : ''}`} {...tipAttrs(badge === '✗' ? settings.plugins_badge_failed : settings.plugins_badge_waits)}>
          {badge}
        </span>
      )}
    </span>
  );
}
