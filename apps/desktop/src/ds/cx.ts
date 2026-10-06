// src/ds · the class helpers every component uses (no React here, pure).
//
// The design system's look is its class names (css/*.css, copied from desktop-ds v5's ds.css, split
// per component). A component builds its root's className from a list where false/null/undefined
// are skipped, and a shown state ("hover", "focus", ...) becomes `is-<state>`: the gallery and the
// checks show every state without a mouse; live, the real :hover / :focus-within rules do the job.

export type Cls = string | false | null | undefined;

/** the class names, joined; empty parts skipped */
export function cx(...parts: Cls[]): string {
  let out = "";
  for (const p of parts) if (p) out = out ? out + " " + p : p;
  return out;
}

/** the states a part can be shown in (the reference's `is-*` classes) */
export type UiState = "hover" | "focus" | "active" | "disabled" | "loading" | "error" | "inactive" | "streaming";

/** `is-<state>` for a shown state, or nothing */
export function st(state: UiState | undefined): Cls {
  return state ? "is-" + state : null;
}

/** a progress bar's width in the reference's steps of 5 (`.b-bar > i.w5` … `w100`) */
export function step5(pct: number): number {
  const n = Number.isFinite(pct) ? pct : 0;
  return Math.max(0, Math.min(100, Math.round(n / 5) * 5));
}

/** a child test id: `<id>.<part>`, or nothing when the parent has none */
export function sub(testId: string | undefined, part: string | number): string | undefined {
  return testId ? testId + "." + String(part) : undefined;
}
