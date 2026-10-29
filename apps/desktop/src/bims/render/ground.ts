// The ground block's slabs (the floating block under an office, world.ts; the town's lawn,
// townscape.ts) with holes where a map carves under its floor (MapLook.pit: California's bowl), so
// what is carved shows from above. No pit: the plain rounded box, as before. Owner: skate-fix.
import { type BufferGeometry, ExtrudeGeometry, Path, Shape } from 'three';
import type { Box } from '../model';
import type { Style } from './style';

/**
 * A slab w wide (x), h high, d deep (z), centred on (cx, cz), its corners rounded by r seen from
 * above, with a hole through it at each pit (boxes in the same frame as cx, cz). Centred on its own
 * height, as style.box.
 */
export function slabWithPits(style: Style, w: number, h: number, d: number, r: number, cx: number, cz: number, pits: readonly Box[]): BufferGeometry {
  const inside = pits.filter((p) => p.x0 > cx - w / 2 && p.x1 < cx + w / 2 && p.z0 > cz - d / 2 && p.z1 < cz + d / 2);
  if (inside.length === 0) return style.box(w, h, d, r);
  // shape coordinates: x, and -z (laid down by rotateX(-90°)), about the slab's middle
  const s = new Shape();
  const x = -w / 2;
  const y = -d / 2;
  const c = Math.min(r, w / 2, d / 2);
  s.moveTo(x + c, y);
  s.lineTo(x + w - c, y);
  s.quadraticCurveTo(x + w, y, x + w, y + c);
  s.lineTo(x + w, y + d - c);
  s.quadraticCurveTo(x + w, y + d, x + w - c, y + d);
  s.lineTo(x + c, y + d);
  s.quadraticCurveTo(x, y + d, x, y + d - c);
  s.lineTo(x, y + c);
  s.quadraticCurveTo(x, y, x + c, y);
  for (const p of inside) {
    const hole = new Path();
    const [a, b] = [p.x0 - cx, p.x1 - cx];
    const [e, f] = [-(p.z1 - cz), -(p.z0 - cz)];
    hole.moveTo(a, e);
    hole.lineTo(a, f);
    hole.lineTo(b, f);
    hole.lineTo(b, e);
    hole.lineTo(a, e);
    s.holes.push(hole);
  }
  const g = new ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 6 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -h / 2, 0);
  return g;
}
