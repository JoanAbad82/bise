// When nobody looks at the pearl (bims-fix m_28756: two GPU helpers at ~29% CPU for 55 min while
// bise worked and he worked elsewhere): the window hidden, or not in front. LivePearl has no loop
// then. The capsule's window is shown inactive (the voice pearl while he talks from another app):
// there only hidden counts. One set of window listeners for every pearl of the window. Focus is
// the last focus/blur event's, seeded by document.hasFocus() (the test harness never focuses its
// offscreen window: seeded as in front there, as App.tsx's useStill counts only hidden); a blur
// while hasFocus() stays true is focus moving into one of the window's frames (an artifact),
// still in front. Owner: pearl-idle.

export interface Seen {
  readonly hidden: boolean;
  /** the window in front */
  readonly focused: boolean;
  /** the capsule's window: shown inactive, never focused */
  readonly capsule: boolean;
}

/** Nobody looks: hidden, or (outside the capsule) not in front. Pure. */
export function awayOf(w: Seen): boolean {
  return w.hidden || (!w.capsule && !w.focused);
}

type Listener = () => void;

const listeners = new Set<Listener>();
let focused = true;
let wired = false;
let was = '';

const bise = (): { test?: boolean; surface?: string } | undefined => (window as { bise?: { test?: boolean; surface?: string } }).bise;
const seenNow = (): Seen => ({ hidden: document.hidden, focused, capsule: bise()?.surface === 'capsule' });
const sig = (w: Seen): string => `${String(w.hidden)}${String(w.focused)}`;

/** Whether nobody looks at the window now. */
export function awayNow(): boolean {
  return awayOf(seenNow());
}

function tell(): void {
  const now = sig(seenNow());
  if (now === was) return;
  was = now;
  for (const l of listeners) l();
}

function wire(): void {
  if (wired) return;
  wired = true;
  focused = bise()?.test === true || document.hasFocus();
  was = sig(seenNow());
  window.addEventListener('focus', () => {
    focused = true;
    tell();
  });
  window.addEventListener('blur', () => {
    focused = document.hasFocus();
    tell();
  });
  document.addEventListener('visibilitychange', tell);
}

/** `l` hears every change of the window's hidden or in front (read awayNow()); the result stops it. */
export function watchAway(l: Listener): () => void {
  wire();
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
