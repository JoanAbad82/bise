// Ring: an agent's context used as a 12 px dial, after Codex's (his ask on ring-look; designer
// m_26952): a 2 px arc with round caps from 12 o'clock clockwise on a full 2 px track as wide, the
// arc text-2 at rest and ink from 70 %, no hue at any percent (a full context waits on nobody). The
// caps are inside the arc: it spans exactly 0..pct, a dot at a few percent. The composer's tab and
// the right bar's agent rows draw the same one (his ask m_26205). Its words are the caller's (a
// tip). Owner: amb-kit.

/** From this percent the arc is in ink (designer m_26952), as the bar shows its percent from 70. */
export const RING_WARN_PCT = 70;

/** The circle's length in px (r 5), and a round cap's reach past its dash's end (half the 2 px stroke).
 *  In px, not pathLength: Chrome scales pathLength by its own circle length (30.6, not 31.4). */
const AROUND = 2 * Math.PI * 5;
const CAP = 1;

/** The arc's stroke-dasharray and stroke-dashoffset in px for `pct` used: the dash is shortened by
 *  its two caps and starts one cap in, so with round caps it covers exactly 0..pct (never past 12
 *  o'clock); under two caps' length it is a dot. null at 0 (no arc). Pure. */
export function arc(pct: number): { dash: string; offset: string } | null {
  const p = Math.max(0, Math.min(100, pct));
  if (p <= 0) return null;
  const hundredth = (n: number) => String(Math.round(n * 100) / 100);
  const len = Math.max(0.01, (p / 100) * AROUND - 2 * CAP);
  return { dash: `${hundredth(len)} ${hundredth(AROUND - len)}`, offset: hundredth(-CAP) };
}

/** The gauge, 12 px. */
export function Ring({ pct, testId }: { pct: number; testId?: string }) {
  const a = arc(pct);
  return (
    <svg className="b-ring" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" data-testid={testId} data-warn={pct >= RING_WARN_PCT || undefined}>
      <circle className="track" cx="6" cy="6" r="5" />
      {a !== null && <circle className="used" cx="6" cy="6" r="5" strokeDasharray={a.dash} strokeDashoffset={a.offset} transform="rotate(-90 6 6)" />}
    </svg>
  );
}
