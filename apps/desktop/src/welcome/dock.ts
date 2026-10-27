// The welcome's office docking into the outer card's tile at his first message (page
// new-project-home, pick A; designer m_38080, m_47929): a copy of the welcome stays over the thread
// for DOCK_MS, its office (the scene as drawn, renderer.copyTo) flies into the tile
// (app.outer.world, its frame kept empty while the welcome showed: one office on screen) while its
// words fade; the tile's live office mounts under it as the welcome goes (welcome/shown.ts). Reduced
// motion, or no tile on screen (hidden by him, a panel open, a narrow window): a crossfade in place.
// The geometry is pure (moveOf); fly() is the DOM's. Owner: project-home.

/** the flight, ms (designer m_38070) */
export const DOCK_MS = 400;
/** the words' fade, ms: gone before the office lands */
const WORDS_MS = 200;

export interface Rect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/** The transform that puts `from` whole into `to`, centred (the tile draws the office at its fit), its origin at the top left; null: no flight (a crossfade). Pure. */
export function moveOf(from: Rect, to: Rect | null, reduced: boolean): string | null {
  if (reduced || to === null || from.width <= 0 || from.height <= 0 || to.width <= 0 || to.height <= 0) return null;
  const s = Math.min(to.width / from.width, to.height / from.height);
  const x = to.left + (to.width - from.width * s) / 2 - from.left;
  const y = to.top + (to.height - from.height * s) / 2 - from.top;
  return `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${s.toFixed(4)})`;
}

/** the outer card's tile on screen (app.outer/side3d OuterWorld.tsx), its box; null when it isn't shown */
export function tileTarget(doc: Document): Rect | null {
  const tile = doc.querySelector<HTMLElement>('[data-testid="app.outer.world"]');
  if (tile === null) return null;
  const r = tile.getBoundingClientRect();
  // fixed 12 from the window's right edge: on screen whenever it is laid out
  if (r.width <= 0 || r.height <= 0) return null;
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

/**
 * Fly a copy of the welcome (`root`, still mounted) with its office (`map`, the element holding
 * the canvas) into the tile: `snap` paints the office as drawn onto a 2d canvas; `target` is asked
 * two frames on (the tile's office mounts as the welcome goes).
 */
export function fly(root: HTMLElement, map: HTMLElement | null, snap: ((c: HTMLCanvasElement) => void) | null, target: () => Rect | null, reduced: boolean): void {
  const doc = root.ownerDocument;
  const at = root.getBoundingClientRect();
  const copy = root.cloneNode(true) as HTMLElement;
  copy.removeAttribute('data-testid');
  copy.setAttribute('data-testid', 'welcome.dock');
  copy.setAttribute('aria-hidden', 'true');
  Object.assign(copy.style, { position: 'fixed', left: `${String(at.left)}px`, top: `${String(at.top)}px`, width: `${String(at.width)}px`, margin: '0', zIndex: '40', pointerEvents: 'none' });
  // the office's picture in place of its live canvas (a clone's canvas is blank)
  const mapAt = map?.getBoundingClientRect() ?? null;
  const live = map?.querySelector('canvas') ?? null;
  const copyMap = copy.querySelector<HTMLElement>('[data-dock="map"]');
  if (copyMap !== null && live !== null && snap !== null) {
    const pic = doc.createElement('canvas');
    try {
      snap(pic);
    } catch {
      // nothing drawn: the copy's office is its empty frame, it fades with the words
    }
    pic.style.width = `${String(live.clientWidth)}px`;
    pic.style.height = `${String(live.clientHeight)}px`;
    pic.style.display = 'block';
    copyMap.replaceChildren(pic);
  }
  doc.body.append(copy);
  const done = () => {
    copy.remove();
  };
  const words = [...copy.children].filter((el) => el !== copyMap);
  for (const el of words) el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: WORDS_MS, fill: 'forwards', easing: 'ease-out' });
  // two frames: the tile's office mounts once the welcome let it
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const to = target();
    const move = copyMap === null || mapAt === null ? null : moveOf(mapAt, to, reduced);
    if (copyMap === null || move === null) {
      // a crossfade: the tile's office (if shown) fades in on its own
      copy.animate([{ opacity: 1 }, { opacity: 0 }], { duration: DOCK_MS, fill: 'forwards', easing: 'ease-in-out' }).finished.then(done, done);
      return;
    }
    copyMap.style.transformOrigin = '0 0';
    copyMap.animate([{ transform: 'none', opacity: 1, offset: 0 }, { transform: move, opacity: 1, offset: 0.85 }, { transform: move, opacity: 0, offset: 1 }], { duration: DOCK_MS, fill: 'forwards', easing: 'cubic-bezier(0.2, 0, 0, 1)' }).finished.then(done, done);
  }));
}
