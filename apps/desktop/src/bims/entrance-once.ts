// Which banners have played their entrance (render/entrance.ts) in this window's run: the landing's
// islands play theirs once per visit (site/bims-islands.ts, sessionStorage), so a banner plays its
// own the first time its page opens after the window starts, never again on a re-render, a theme
// change, a resize or coming back to the page. A reload is a new visit. No three here: the entry
// chunk reads it. Owner: banner-entrance.

export type BannerId = 'inbox' | 'scheduled' | 'artifacts' | 'plugins';

const played = new Set<BannerId>();

/** whether this banner's entrance is still to play in this run */
export const toEnter = (id: BannerId): boolean => !played.has(id);

/** its entrance has started: never again in this run */
export function entered(id: BannerId): void {
  played.add(id);
}
