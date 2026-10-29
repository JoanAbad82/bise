// src/ds · the gust '∿' as an 18x14 SVG (designer's desktop-delight v2, m_24404): one path in
// currentColor, 1.6 round; the caller picks the ink. `drift`: the stroke's dashes drift (7 3, 1.2 s)
// while something works; still under reduced motion (css/gust.css). The send's touch rises it once.
// Shared by the sidebar's project marks (delight-marks) and the composer's send. Owner: amb-kit.
import { cx } from "./cx";

/** The gust's path, the one drawing everywhere (designer m_24404). */
export const GUST_PATH = "M1 7 C4 2.5,7 2.5,9 7 S14 11.5,17 7";

/** '∿' as SVG. */
export function Gust({ drift = false, testId }: { drift?: boolean; testId?: string | undefined }) {
  return (
    <svg className={cx("b-gust", drift && "drift")} viewBox="0 0 18 14" width="18" height="14" aria-hidden="true" data-testid={testId}>
      <path d={GUST_PATH} />
    </svg>
  );
}
