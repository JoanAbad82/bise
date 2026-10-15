// Ring: an agent's context used as a 12 px dial (his ask on agent-rows: the filled pie read
// heavy; designer m_25940, m_26307: never a spinner): a 2 px arc in text-2 from 12 o'clock clockwise on
// a full 1 px text-3 track. The composer's tab and the right bar's agent rows draw the same
// one (his ask m_26205). Its words are the caller's (a tip). Owner: amb-kit.

/** The arc's stroke-dasharray for `pct` used, on a circle of pathLength 100: '0 100' at 0, '100 0' full. Pure. */
export function arc(pct: number): string {
  const tenths = Math.round(Math.max(0, Math.min(100, pct)) * 10);
  return `${String(tenths / 10)} ${String((1000 - tenths) / 10)}`;
}

/** The gauge, 12 px. */
export function Ring({ pct, testId }: { pct: number; testId?: string }) {
  return (
    <svg className="b-ring" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" data-testid={testId}>
      <circle className="track" cx="6" cy="6" r="5" />
      {pct > 0 && <circle className="used" cx="6" cy="6" r="5" pathLength={100} strokeDasharray={arc(pct)} transform="rotate(-90 6 6)" />}
    </svg>
  );
}
