// The welcome's pictures when the office can't draw (WebGL lost, the renderer failed; designer
// m_38080): page new-project-home's B, three still drawings of the bims' world in the theme's inks,
// each with its number for the legend under it: 1 his words to the lead, 2 the agents side by side
// at their desks, 3 the inbox asking his call. Owner: project-home.

/** a bim, standing at (x, y): its top, its two sides */
function Bim({ x, y, h = 13 }: { x: number; y: number; h?: number }) {
  return (
    <>
      <polygon className="wp-bt" points={`${String(x - 6)},${String(y)} ${String(x)},${String(y - 3)} ${String(x + 6)},${String(y)} ${String(x)},${String(y + 3)}`} />
      <polygon className="wp-bl" points={`${String(x - 6)},${String(y)} ${String(x)},${String(y + 3)} ${String(x)},${String(y + 3 + h)} ${String(x - 6)},${String(y + h)}`} />
      <polygon className="wp-br" points={`${String(x)},${String(y + 3)} ${String(x + 6)},${String(y)} ${String(x + 6)},${String(y + h)} ${String(x)},${String(y + 3 + h)}`} />
    </>
  );
}

/** a desk at (x, y), its top's middle */
function Desk({ x, y }: { x: number; y: number }) {
  return (
    <>
      <polygon className="wp-dt" points={`${String(x - 16)},${String(y)} ${String(x)},${String(y - 8)} ${String(x + 16)},${String(y)} ${String(x)},${String(y + 8)}`} />
      <polygon className="wp-dl" points={`${String(x - 16)},${String(y)} ${String(x)},${String(y + 8)} ${String(x)},${String(y + 16)} ${String(x - 16)},${String(y + 8)}`} />
      <polygon className="wp-dr" points={`${String(x)},${String(y + 8)} ${String(x + 16)},${String(y)} ${String(x + 16)},${String(y + 8)} ${String(x)},${String(y + 16)}`} />
    </>
  );
}

function Say() {
  return (
    <svg viewBox="0 0 200 138" aria-hidden="true">
      <rect className="wp-fl" x="14" y="30" width="130" height="34" rx="12" />
      <text className="wp-lb" x="79" y="52" textAnchor="middle">
        fix the tests, and…
      </text>
      <Bim x={160} y={88} h={24} />
    </svg>
  );
}

function Side() {
  return (
    <svg viewBox="0 0 200 138" aria-hidden="true">
      <polygon className="wp-fl" points="100,24 188,68 100,112 12,68" />
      {[
        [58, 62],
        [100, 80],
        [142, 62],
      ].map(([x = 0, y = 0]) => (
        <g key={x}>
          <Desk x={x} y={y} />
          <Bim x={x} y={y + 3} />
        </g>
      ))}
    </svg>
  );
}

function Inbox() {
  return (
    <svg viewBox="0 0 200 138" aria-hidden="true">
      <rect className="wp-fl" x="16" y="28" width="168" height="82" rx="8" />
      <text className="wp-lb" x="30" y="54">
        ? tests · merge it?
      </text>
      <rect className="wp-pri" x="30" y="70" width="64" height="22" rx="5" />
      <rect className="wp-gh" x="102" y="70" width="70" height="22" rx="5" />
      <text className="wp-on" x="62" y="85" textAnchor="middle">
        merge
      </text>
      <text className="wp-lb" x="137" y="85" textAnchor="middle">
        not yet
      </text>
    </svg>
  );
}

/** the three pictures in a row, numbered as the legend */
export function Pictures() {
  return (
    <div className="welcome-pics" data-testid="welcome.pictures">
      {[Say, Side, Inbox].map((Pic, i) => (
        <div key={i} className="welcome-pic">
          <Pic />
          <span className="welcome-n">{i + 1}</span>
        </div>
      ))}
    </div>
  );
}
