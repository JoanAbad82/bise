// src/ds · noClip: a test helper for what floats with a shadow (bise fait mac, plan native-mac-plan
// v4 §2: « ombres et objets 3D coupés par un parent en overflow: hidden »). The world, the bubbles'
// 3D objects, their cards and the floating composer are mounted at the shell's root (SideHost,
// FloatHost) so no parent clips them; noClip walks an element's ancestors up to the root and fails
// on any that would: an overflow other than visible, or a paint containment. nm-side and
// nm-composer call it in their render tests. Reads computed styles only. Owner: nm-ds.

/** The ancestors of `el` (up to `root`, the document's element by default) that clip it, one line each: 'div.app-main overflow-y: auto'. */
export function clippers(el: Element, root: Element | null = el.ownerDocument.documentElement): string[] {
  const out: string[] = [];
  for (let n = el.parentElement; n !== null && n !== root; n = n.parentElement) {
    const s = getComputedStyle(n);
    const name = `${n.tagName.toLowerCase()}${n.classList.length > 0 ? `.${[...n.classList].join(".")}` : ""}`;
    // a DOM that keeps the shorthand unexpanded (happy-dom) gives it for both axes
    const both = s.overflow.split(/\s+/);
    for (const [prop, value] of [["overflow-x", s.overflowX || both[0]], ["overflow-y", s.overflowY || both[1] || both[0]]] as const) {
      if (value !== "" && value !== "visible") out.push(`${name} ${prop}: ${value}`);
    }
    const contain = s.getPropertyValue("contain");
    if (/\b(paint|strict|content)\b/.test(contain)) out.push(`${name} contain: ${contain}`);
  }
  return out;
}

/** Throws, naming each ancestor of `el` that clips it (clippers); nothing when none does. */
export function noClip(el: Element, root?: Element | null): void {
  const found = clippers(el, root);
  if (found.length > 0) throw new Error(`clipped by ${String(found.length)} ancestor(s): ${found.join(" | ")}`);
}
