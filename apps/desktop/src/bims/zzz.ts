// A sleeping bim's 'z z Z' (Gabriel: asleep, head on its keyboard, some z's float over its head):
// three letters in the overlay over its head, rising and fading in turn (office.css, a CSS loop), so
// a still office still draws no frame (budget.spec (3)): only a draw moves them, with their bim or
// his camera. They step at 7.5 fps, pause while the window is away (Office.tsx data-away, the
// loop's own flag), and show none under reduced motion (architect m_28263). Owner: bims-hover.
import type { ActivityKind, BimFrame } from './model';

/** The kinds that sleep at their desk, head down (render/pose.ts 'sleep'). */
const ASLEEP: ReadonlySet<ActivityKind> = new Set<ActivityKind>(['sleep', 'waitagent']);

/** The bims asleep and arrived at their desk now: their z's show. Pure. */
export function sleepers(frames: readonly BimFrame[]): string[] {
  return frames.filter((f) => ASLEEP.has(f.pose.seg.act.k) && !f.pose.moving).map((f) => f.name);
}

/** Each sleeper's z's at its head (css px in the office), the others' gone. The box is the overlay's z layer. */
export function placeZzz(box: HTMLElement, heads: ReadonlyMap<string, { readonly x: number; readonly y: number }>): void {
  const keep = new Set<string>();
  for (const [name, h] of heads) {
    keep.add(name);
    let el = box.querySelector<HTMLElement>(`:scope > [data-bim="${CSS.escape(name)}"]`);
    if (el === null) {
      el = document.createElement('div');
      el.className = 'bims-zzz';
      el.dataset.bim = name;
      el.dataset.testid = `app.right.bims.zzz.${name}`;
      el.setAttribute('aria-hidden', 'true');
      for (const z of ['z', 'z', 'Z']) {
        const s = document.createElement('span');
        s.textContent = z;
        el.append(s);
      }
      box.append(el);
    }
    el.style.transform = `translate(${h.x.toFixed(1)}px, ${h.y.toFixed(1)}px)`;
  }
  for (const el of [...box.children]) {
    if (el instanceof HTMLElement && !keep.has(el.dataset.bim ?? '')) el.remove();
  }
}
