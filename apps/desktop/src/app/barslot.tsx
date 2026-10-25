// The page's room in the window's bar (bise fait mac, app-polish #4; native-lead m_42140): the
// title bar draws <BarSlot/> right of the crumb, before the panel's tabs and its ▯; a page renders
// <InBar>{its BarSearch, its right-side action}</InBar> anywhere in its tree and that content shows
// in the bar (a portal), gone when the page unmounts. One page's content at a time: the route's
// screen (App.tsx remounts the screen on each route). The slot drags the window like the bar;
// what a page puts in it does not (app.css .app-barslot > *). Owner: nm-frame.
import { useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

let slot: HTMLElement | null = null;
const listeners = new Set<() => void>();

function setSlot(el: HTMLElement | null): void {
  if (slot === el) return;
  slot = el;
  for (const l of listeners) l();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** The bar's slot element now (null: no bar drawn, the onboarding's window). */
function useSlot(): HTMLElement | null {
  return useSyncExternalStore(subscribe, () => slot);
}

/** The slot, in the title bar (Frame.tsx): empty until a page fills it. */
export function BarSlot() {
  return <div ref={setSlot} className="app-barslot" data-testid="app.bar.slot" />;
}

/** What a page shows in the window's bar: its search, its action; nothing once the page leaves. */
export function InBar({ children }: { children: ReactNode }) {
  const el = useSlot();
  return el === null ? null : createPortal(children, el);
}
