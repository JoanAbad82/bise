// @vitest-environment happy-dom
// The workshop's floor as drawn (render/maps/workshop-floor.ts on maps/workshop-floor.ts, page
// bims-workshop): every corner's pieces stand inside their floor boxes (what a walk keeps off), no
// other mesh goes through a corner piece (a cozy plant, a stage's piece, a desk), the Vespa inside
// its box, no two faces of a corner or a pod beam in one plane (coplanar.ts), and one night light per
// pod, no more (budget.spec.ts measures the frames).
import { describe, expect, it } from 'vitest';
import { Box3, Group, Mesh, type Object3D, PointLight, Vector3 } from 'three';
import { crowd } from '../../fixtures';
import { layoutOf } from '../../maps';
import { LAST_STAGE, NO_GROW } from '../../growth';
import type { Box } from '../../model';
import { type WorkshopOffice, vespaBox } from '../../maps/workshop';
import { CORNERS, cornerOf, podAt } from '../../maps/workshop-floor';
import { buildWorld } from '../world';
import { kitOf } from '../kit';
import { coplanarClashes } from '../coplanar';
import { STYLE } from '../style';
import { LOOKS, lookOf } from './index';
import { corner, podBeam } from './workshop-floor';

/** float noise, a raised knob a hair past its piece */
const SLACK = 0.02;
/** a mesh this low is a rug: walked on */
const FLAT = 0.09;
/** a mesh's floor area past this is the room's own (a floor, a wall), not a piece */
const BIG = 6;

const turn = (): Promise<void> => new Promise((done) => { setTimeout(done, 0); });
const kit = () => kitOf(STYLE, LOOKS.workshop.pal(false));
const fmt = (b: Box3): string => `${b.min.toArray().map((v) => v.toFixed(2)).join(',')}..${b.max.toArray().map((v) => v.toFixed(2)).join(',')}`;
const ws = (n: number): WorkshopOffice => layoutOf(crowd(n).agents, 'workshop') as WorkshopOffice;

function boxes(root: Object3D, keep: (m: Object3D) => boolean): Box3[] {
  root.updateMatrixWorld(true);
  const out: Box3[] = [];
  root.traverse((m) => { if (m instanceof Mesh && keep(m)) out.push(new Box3().setFromObject(m, true)); });
  return out;
}

/** a mesh's floor box sampled every 0.05: each sample in one of the pieces (with slack) */
function inside(b: Box3, pieces: readonly Box[]): boolean {
  const nx = Math.max(1, Math.ceil((b.max.x - b.min.x) / 0.05));
  const nz = Math.max(1, Math.ceil((b.max.z - b.min.z) / 0.05));
  for (let i = 0; i <= nx; i++) {
    for (let j = 0; j <= nz; j++) {
      const x = b.min.x + ((b.max.x - b.min.x) * i) / nx;
      const z = b.min.z + ((b.max.z - b.min.z) * j) / nz;
      if (!pieces.some((p) => x >= p.x0 - SLACK && x <= p.x1 + SLACK && z >= p.z0 - SLACK && z <= p.z1 + SLACK)) return false;
    }
  }
  return true;
}

describe('the workshop floor as drawn', () => {
  it('each corner stands inside its pieces, no two of its faces in one plane', () => {
    CORNERS.forEach((kind, i) => {
      const c = cornerOf(i, 0);
      expect(c.kind).toBe(kind);
      const root = new Group();
      corner(kit(), root, c, i);
      const out = boxes(root, () => true).filter((b) => b.max.y >= FLAT && !inside(b, c.pieces)).map(fmt);
      expect(out, kind).toEqual([]);
      expect(coplanarClashes(root), kind).toEqual([]);
    });
  });

  it('a pod beam has no two faces in one plane, one light', () => {
    const root = new Group();
    podBeam(kit(), root, podAt(0));
    expect(coplanarClashes(root)).toEqual([]);
    let lights = 0;
    root.traverse((o) => { if (o instanceof PointLight) lights++; });
    expect(lights).toBe(1);
  });

  it('nothing goes through a corner piece, the Vespa inside its box, stages 0 and last, 13 to 31 desks', async () => {
    const bad: string[] = [];
    for (const n of [13, 19, 25, 31]) {
      const o = ws(n);
      for (const stage of [0, LAST_STAGE]) {
        const w = buildWorld(o, 'main', STYLE, lookOf('workshop'), false, { ...NO_GROW, stage });
        const all: { b: Box3; corner: unknown; vespa: boolean }[] = [];
        w.root.updateMatrixWorld(true);
        w.root.traverse((m) => {
          if (!(m instanceof Mesh)) return;
          let vespa = false;
          for (let p: Object3D | null = m; p; p = p.parent) if (p.name === 'vespa') vespa = true;
          all.push({ b: new Box3().setFromObject(m, true), corner: m.userData.corner, vespa });
        });
        w.dispose();
        o.corners.forEach((c, i) => {
          for (const piece of c.pieces) {
            const v = new Box3(new Vector3(piece.x0 + 0.05, FLAT, piece.z0 + 0.05), new Vector3(piece.x1 - 0.05, 2.5, piece.z1 - 0.05));
            // a room-wide mesh (the floor, a wall, a merged cozy set: its pieces checked by clip.test.ts) never counts
            for (const m of all) if (m.corner !== i && m.b.max.y >= FLAT && (m.b.max.x - m.b.min.x) * (m.b.max.z - m.b.min.z) < BIG && m.b.intersectsBox(v)) bad.push(`${String(n)} desks, stage ${String(stage)}: ${fmt(m.b)} through the ${c.kind}`);
          }
        });
        if (o.vespa) {
          const vb = vespaBox(o.vespa);
          for (const m of all) if (m.vespa && m.b.max.y >= FLAT && !inside(m.b, [vb])) bad.push(`${String(n)} desks: the Vespa's ${fmt(m.b)} off its box`);
        }
        await turn();
      }
    }
    expect([...new Set(bad)].slice(0, 12)).toEqual([]);
  }, 120_000);

  it('one night light per pod past the four pools', () => {
    for (const n of [12, 19, 31]) {
      const o = ws(n);
      const w = buildWorld(o, 'main', STYLE, lookOf('workshop'), false, NO_GROW);
      let lights = 0;
      w.root.traverse((x) => { if (x instanceof PointLight) lights++; });
      w.dispose();
      expect(lights, `${String(n)} desks`).toBe(4 + o.pods.length);
    }
  });
});
