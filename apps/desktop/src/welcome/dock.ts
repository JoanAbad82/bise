// The welcome's office docking into the outer card's tile at his first message (page
// new-project-home, pick A; designer m_38080, m_47929, m_47950): at the send a copy of the welcome
// stays over the thread, its words fade and its office (the scene as drawn, renderer.copyTo) flies
// DOCK_MS into the tile (app.outer.world, its frame kept empty while the welcome showed: one office
// on screen), whole at its fit; it holds there until the tile's live office, mounted at its fit
// under it, has drawn, then goes in one frame (the same picture). Reduced motion: no flight, the
// centre's office stays until the tile's drew, then a 120 ms swap. No tile on screen (hidden by
// him, a panel open, a narrow window): a crossfade in place. The geometry is pure (moveOf); fly()
// is the DOM's. Owner: project-home.

/** the flight, ms (designer m_38070) */
export const DOCK_MS = 400;
/** the words' fade, ms: gone before the office lands */
const WORDS_MS = 200;
/** reduced motion: the centre's office gives way to the tile's, ms (designer m_47950: 120 at most) */
const SWAP_MS = 120;
/** the longest a landed copy waits for the tile's office to draw, ms */
const HOLD_MAX_MS = 2500;

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

/** the tile's live office has drawn its first frame (bims/Office data-shown), or can't draw: the copy can go */
export function tileDrawn(doc: Document): boolean {
  return doc.querySelector('[data-testid="app.outer.world"] [data-testid="app.right.bims"]:is([data-shown], [data-state="lost"])') !== null;
}

/**
 * Fly a copy of the welcome (`root`, still mounted) with its office (`map`, the element holding
 * the canvas) into the tile: `snap` paints the office as drawn onto a 2d canvas; `target` is the
 * tile's box (its frame is there before the send); `drawn` says its live office drew; `landed` once
 * the copy gave way to it (the tile's camera and chrome come then, shown.ts).
 */
export function fly(root: HTMLElement, map: HTMLElement | null, snap: ((c: HTMLCanvasElement) => void) | null, target: () => Rect | null, drawn: () => boolean, reduced: boolean, landed: () => void): void {
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
  let ended = false;
  const done = () => {
    if (ended) return;
    ended = true;
    copy.remove();
    landed();
  };
  const words = [...copy.children].filter((el) => el !== copyMap);
  for (const el of words) el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: WORDS_MS, fill: 'forwards', easing: 'ease-out' });
  // the tile's frame is on screen already (shown.ts kept it while the welcome showed): the flight leaves now
  const to = target();
  const move = copyMap === null || mapAt === null ? null : moveOf(mapAt, to, reduced);
  if (to === null || copyMap === null) {
    // no tile: a crossfade in place
    copy.animate([{ opacity: 1 }, { opacity: 0 }], { duration: DOCK_MS, fill: 'forwards', easing: 'ease-in-out' }).finished.then(done, done);
    return;
  }
  if (move === null) {
    // reduced motion: the office stays in the centre until the tile's is drawn, then goes as it shows (designer m_47950)
    whenDrawn(doc, drawn, () => {
      landed();
      copy.animate([{ opacity: 1 }, { opacity: 0 }], { duration: SWAP_MS, fill: 'forwards', easing: 'ease-out' }).finished.then(done, done);
    });
    return;
  }
  // the whole flight, on the compositor (the tile's office mounts on the main thread meanwhile)
  copyMap.style.transformOrigin = '0 0';
  copyMap.style.willChange = 'transform';
  const flight = copyMap.animate([{ transform: 'none' }, { transform: move }], { duration: DOCK_MS, fill: 'forwards', easing: 'ease-in-out' });
  // landed: the copy holds on the tile until its live office is drawn under it, the same picture, then goes in one frame
  flight.finished.then(() => {
    whenDrawn(doc, drawn, () => requestAnimationFrame(done));
  }, done);
}

/** `then` once `drawn()` says so (checked each frame), or after HOLD_MAX_MS: a copy never stays */
function whenDrawn(doc: Document, drawn: () => boolean, then: () => void): void {
  const win = doc.defaultView;
  if (win === null) {
    then();
    return;
  }
  let t0: number | null = null;
  const step = (now: number) => {
    t0 ??= now;
    if (drawn() || now - t0 >= HOLD_MAX_MS) then();
    else win.requestAnimationFrame(step);
  };
  win.requestAnimationFrame(step);
}
