// The plugins' objects' laws (bims-plugins plan p1), on every object the registry builds:
// - palette: no colour of it reads as the accent pink or the error red (spec §1 rule 2);
// - coplanar: no two of its faces in one plane (they would z-fight, coplanar.ts);
// - foot: every mesh inside the foot it declares (centred on the origin, from the floor up), so a
//   corner's placement (p4) can trust the foot: nothing of it pokes into a desk or a walk;
// - glass: off, every material at 30% at most, no shadow cast, no contact shadow;
// - compact: its compact one never takes more floor than the full one.
import { Box3, type Material, Mesh, type MeshStandardMaterial, type Object3D } from 'three';
import { describe, expect, it } from 'vitest';
import { coplanarClashes } from '../coplanar';
import { readsAsAttention } from '../palette.testkit';
import { GLASS, INK } from './kit';
import { COMPACT, familyOf, FAMILIES, MAKER_IDS, makeObject, type MakeOpts, OBJ_IDS, type ObjId } from './index';

/** float noise and a rounded edge */
const SLACK = 0.02;
/** a tilted leg's end may sink this far into the floor (never seen) */
const SINK = 0.03;
/** what n changes: its parts (the shelf's books, the rack's lights) and its kind (the printer's pages, the plant's pot) */
const BY_N: readonly ObjId[] = ['shelf', 'rack', 'printer', 'plant'];
const nsOf = (id: ObjId): readonly number[] => (BY_N.includes(id) ? [1, 2, 3, 5, 12] : [5]);
/** two faces turned the same way this close draw in turns; 2 mm is ~100 times the depth buffer's step at DIST (camera.ts) */
const PLANE_GAP = 0.002;
/** a smaller overlap is a sliver at the office's scale (walls.test.ts) */
const PLANE_AREA = 1e-3;

function meshes(root: Object3D): Mesh[] {
  root.updateMatrixWorld(true);
  const out: Mesh[] = [];
  root.traverse((m) => { if (m instanceof Mesh) out.push(m as Mesh); });
  return out;
}

const mats = (m: Mesh): Material[] => (Array.isArray(m.material) ? m.material : [m.material]);

/** the pieces of `id` that stand out of its foot, with how far */
function outOfFoot(id: ObjId, o: MakeOpts): string[] {
  const { group, foot } = makeObject(id, o);
  const bad: string[] = [];
  const b = new Box3();
  for (const [i, m] of meshes(group).entries()) {
    if (m.userData.contact === true) continue;
    b.setFromObject(m);
    const over = Math.max(-foot.w / 2 - b.min.x, b.max.x - foot.w / 2, -foot.d / 2 - b.min.z, b.max.z - foot.d / 2, -b.min.y - SINK + SLACK, b.max.y - foot.h);
    if (over > SLACK) bad.push(`#${i} ${over.toFixed(3)} out (x ${b.min.x.toFixed(2)}..${b.max.x.toFixed(2)}, y ${b.min.y.toFixed(2)}..${b.max.y.toFixed(2)}, z ${b.min.z.toFixed(2)}..${b.max.z.toFixed(2)})`);
  }
  return bad;
}

/** p1's objects: the 30 signed ones, the cat on a walk and its cushion; p2 adds to them, never drops one */
const P1: readonly string[] = ['chess', 'pingpong', 'arcade', 'pinball', 'babyfoot', 'piano', 'jukebox', 'shelf', 'library', 'telescope', 'easel', 'printer', 'plant', 'campfire', 'cat', 'catwalk', 'cushion', 'dog', 'aquarium', 'mailbox', 'booth', 'visio', 'rack', 'macdesk', 'scooter', 'bike', 'calendar', 'files', 'trophies', 'extinguisher', 'charts', 'packing'];
/** the collection table (page bims-plugins): 10 a family; animals keep their walk and cushion poses on top, garden its potted plant (any plugin with no object of its own) */
const PER_FAMILY = 10;
const EXTRA: Partial<Record<keyof typeof FAMILIES, number>> = { garden: 1, animals: 2 };

describe('objects', () => {
  it('keeps every p1 object, each in one family, never more than the collection table holds', () => {
    expect(P1.filter((id) => !OBJ_IDS.includes(id as ObjId))).toEqual([]);
    expect(new Set(OBJ_IDS).size).toBe(OBJ_IDS.length);
    for (const [f, makers] of Object.entries(FAMILIES)) {
      if (f !== 'office') expect(Object.keys(makers).length, f).toBeLessThanOrEqual(PER_FAMILY + (EXTRA[f as keyof typeof FAMILIES] ?? 0));
    }
    expect(Object.keys(FAMILIES)).toEqual(['games', 'music', 'knowledge', 'workshop', 'kitchen', 'garden', 'animals', 'comms', 'machines', 'travel', 'office']);
    expect(familyOf('arcade')).toBe('games');
    expect(familyOf('calendar')).toBe('office');
  });

  it('ids.ts lists every maker, in the families order, and nothing else', () => {
    const ids: readonly string[] = OBJ_IDS;
    expect(MAKER_IDS.filter((id) => !ids.includes(id)), 'makers missing from ids.ts').toEqual([]);
    expect(ids.filter((id) => !MAKER_IDS.includes(id as ObjId)), 'ids.ts ids with no maker').toEqual([]);
    expect(MAKER_IDS).toEqual(OBJ_IDS);
  });

  // one test per object and law: a red names the object, and each stays in its time budget
  describe.each(OBJ_IDS)('%s', (id) => {
    it('never draws the accent pink or the error red', () => {
      const bad = new Set<string>();
      for (const n of nsOf(id)) {
        for (const m of meshes(makeObject(id, { n, night: 1 }).group)) {
          for (const mat of mats(m)) {
            const s = mat as MeshStandardMaterial;
            for (const c of [s.color.getHexString(), ...(s.emissiveIntensity > 0 ? [s.emissive.getHexString()] : [])]) {
              const a = readsAsAttention(`#${c}`);
              if (a) bad.add(`#${c} reads as ${a}`);
            }
          }
        }
      }
      expect([...bad]).toEqual([]);
    });

    it('has no two faces in one plane', () => {
      const bad: string[] = [];
      // the printer's pages change with n; the rest only in colour or count
      for (const n of id === 'printer' ? [1, 2, 3] : [5]) {
        // only faces seen from above count: the camera never looks from under the floor
        const cs = coplanarClashes(makeObject(id, { n }).group, PLANE_GAP, PLANE_AREA, 'same').filter((c) => c.ny > -0.5);
        for (const c of cs) bad.push(`n ${n}: ${c.a} / ${c.b} ${c.area.toFixed(4)}`);
      }
      expect(bad).toEqual([]);
    }, 20_000);

    it('keeps every piece inside the foot it declares, on, off and compact, whatever its parts', () => {
      const bad: string[] = [];
      for (const n of nsOf(id)) {
        for (const o of [{}, { off: true }, { compact: true }] as const) {
          const out = outOfFoot(id, { ...o, n });
          if (out.length > 0) bad.push(`n ${n} ${JSON.stringify(o)}: ${out.join('; ')}`);
        }
      }
      expect(bad).toEqual([]);
    });

    it('is glass when off: ink at 30% at most, no hue, no shadow, no contact shadow', () => {
      const ms = meshes(makeObject(id, { off: true, night: 1 }).group);
      expect(ms.length).toBeGreaterThan(0);
      for (const m of ms) {
        expect(m.castShadow, 'casts a shadow').toBe(false);
        expect(m.userData.contact, 'keeps its contact shadow').toBeUndefined();
        for (const mat of mats(m)) {
          expect(mat.transparent && mat.opacity <= GLASS + 1e-6, `opacity ${mat.opacity}`).toBe(true);
          expect((mat as MeshStandardMaterial).emissiveIntensity, 'glows in glass').toBe(0);
          // glass loses its hue: one neutral, ink (designer m_40518)
          expect('#' + (mat as MeshStandardMaterial).color.getHexString(), 'a hue in glass').toBe(INK);
        }
      }
      // on the floor, a contact shadow under it (nothing floats); a wall object hangs, none
      const made = makeObject(id);
      expect(meshes(made.group).some((m) => m.userData.contact === true), 'its contact shadow').toBe(made.wall !== true);
    });

    it('is smaller compact: its compact one, or itself scaled down', () => {
      const full = makeObject(id).foot;
      const small = makeObject(id, { compact: true });
      expect(small.foot.w * small.foot.d).toBeLessThan(full.w * full.d);
      expect(small.group.name).toBe(COMPACT[id] ?? id);
    });
  });

  it('hangs every wall object (the calendar among them) with its back on z = -d/2', () => {
    const walls = OBJ_IDS.filter((id) => makeObject(id).wall);
    expect(walls).toContain('calendar');
    for (const id of walls) {
      const { group, foot } = makeObject(id);
      const b = new Box3().setFromObject(group);
      expect(Math.abs(b.min.z + foot.d / 2), id).toBeLessThan(SLACK);
    }
  });
});
