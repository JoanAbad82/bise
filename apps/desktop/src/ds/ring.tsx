// Ring: an agent's context used as a 12 px gauge (designer m_25940, never read as a spinner): a filled
// wedge in text-2 from 12 o'clock clockwise, inside a 1 px text-3 circle. The composer's tab and the
// right bar's agent rows draw the same one (his ask m_26205). Its words are the caller's (a tip).
// Owner: amb-kit.

/** The wedge's path for `pct` used, in a 12-unit box, radius 4; '' at 0, null when full. Pure. */
export function wedge(pct: number): string | null {
  const p = Math.max(0, Math.min(100, pct)) / 100;
  if (p >= 1) return null;
  if (p <= 0) return "";
  const r = 4;
  const a = p * 2 * Math.PI;
  const x = (6 + r * Math.sin(a)).toFixed(3);
  const y = (6 - r * Math.cos(a)).toFixed(3);
  return `M6 6 L6 ${String(6 - r)} A${String(r)} ${String(r)} 0 ${p > 0.5 ? 1 : 0} 1 ${x} ${y} Z`;
}

/** The gauge, 12 px. */
export function Ring({ pct, testId }: { pct: number; testId?: string }) {
  const d = wedge(pct);
  return (
    <svg className="b-ring" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" data-testid={testId}>
      <circle className="track" cx="6" cy="6" r="5.5" />
      {d === null ? <circle className="used" cx="6" cy="6" r={4} /> : d !== "" && <path className="used" d={d} />}
    </svg>
  );
}
