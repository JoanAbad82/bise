// The women's hair measure (docs/brand/bims.md "women among the bims"): for one cut, one headwear and
// one outfit, how many of its hair's vertices go through what they must not: the torso's worn volume
// (the bean, the collar, the hood, a strap) at a head angle, the headwear's closed parts (the headset's
// band and cups, a peak, a pompom) or out through a hat's crown above its rim, and over the eyes; and how
// many skull vertices show through a shell of hair. The law (hair-clip.test.ts) and the turnaround
// sheets read it. Tests and studios only, never the app. Owner: bims-girls.
import { Matrix4, type Mesh, Object3D, SphereGeometry, Vector3 } from 'three';
import { type Bim, hangPitch, makeBim } from './bim';
import { HAT_K, HEAD_R } from './laptop';
import { CUTS, CUT_HATS, type Cut, type HeadWear, KINDS, type Kind, outfitOf } from './palette';
import type { Rot } from './pose';
import { STYLE } from './style';
import { deepIn, type Volume, volumeOf } from './outfits.testkit';

/** every cut with every headwear it may wear (bare first) */
export const CUT_WEARS: readonly { readonly cut: Cut; readonly hat: HeadWear }[] = CUTS.flatMap((cut) => (['bare', ...CUT_HATS[cut]] as const).map((hat) => ({ cut, hat })));

/** the name whose colours the sheets and the law dress every cut in (its hair, hat and outfit colours) */
const NAME = 'bim-3';

export function herBim(cut: Cut, hat: HeadWear, kind: Kind, merge = false): Bim {
  return makeBim(NAME, false, STYLE, { ...outfitOf(NAME, false), cut, hat, kind }, undefined, merge);
}

const meshesUnder = (o: Object3D, keep: (m: Mesh) => boolean, stop: ReadonlySet<Object3D> = new Set()): Mesh[] => {
  const out: Mesh[] = [];
  const walk = (x: Object3D): void => {
    for (const c of x.children) {
      if (stop.has(c)) continue;
      if ((c as Mesh).isMesh && keep(c as Mesh)) out.push(c as Mesh);
      walk(c);
    }
  };
  walk(o);
  return out;
};

const part = (b: Bim, n: string): Object3D => {
  const o = b.group.getObjectByName(n);
  if (!o) throw new Error(`no ${n}`);
  return o;
};

/** the hair's vertices in the head's space (at rest), and a ponytail's in its hang's (it turns about its tie: bim.ts hangPitch) */
function hairPoints(b: Bim): { pts: Vector3[]; hang: Vector3[]; at: Vector3 } {
  const head = part(b, 'head');
  const hang = head.getObjectByName('hang');
  b.group.updateMatrixWorld(true);
  const inv = new Matrix4().copy(head.matrixWorld).invert();
  const hangInv = hang ? new Matrix4().copy(hang.matrixWorld).invert() : null;
  const under = (m: Object3D): boolean => {
    for (let p: Object3D | null = m; p && p !== head; p = p.parent) if (p === hang) return true;
    return false;
  };
  const pts: Vector3[] = [];
  const hung: Vector3[] = [];
  for (const m of meshesUnder(head, (x) => x.userData.hair === true)) {
    const inHang = hangInv !== null && under(m);
    const to = new Matrix4().multiplyMatrices(inHang && hangInv ? hangInv : inv, m.matrixWorld);
    const pos = m.geometry.getAttribute('position');
    for (let i = 0; i < pos.count; i++) (inHang ? hung : pts).push(new Vector3().fromBufferAttribute(pos, i).applyMatrix4(to));
  }
  return { pts: [...pts, ...hung.map((p) => p.clone().add(hang?.position ?? new Vector3()))], hang: hung, at: hang?.position.clone() ?? new Vector3() };
}

/** each torso's worn volume, one per outfit, in the body's space (it never bends) */
const torsos = new Map<Kind, { vol: Volume; headAt: Matrix4 }>();
function torsoOf(kind: Kind): { vol: Volume; headAt: Matrix4 } {
  const had = torsos.get(kind);
  if (had) return had;
  const b = herBim('long', 'bare', kind);
  const body = part(b, 'body');
  const parts = new Set(['head', 'body', 'armL', 'armR', 'legL', 'legR'].map((n) => part(b, n)));
  b.group.updateMatrixWorld(true);
  const toBody = new Matrix4().copy(body.matrixWorld).invert();
  const vol = volumeOf(meshesUnder(body, (m) => m.userData.worn === true, parts), toBody);
  // the head's place in the body (its rotation is the rig's)
  const head = part(b, 'head');
  const headAt = new Matrix4().makeTranslation(head.position.x, head.position.y, head.position.z);
  b.dispose();
  const t = { vol, headAt };
  torsos.set(kind, t);
  return t;
}

/** hair this close to the skull hugs it (its shells: R + 0.004 .. R + 0.012): the torso law reads it as the skull */
const HUG = 0.012;

export interface HairMeasure {
  /** hair vertices deep in the torso's worn volume with the head turned by `head` */
  torsoAt(head: Rot): number;
  /** hair vertices through the headwear (its closed parts, or out of a crown above its rim) */
  readonly headwear: number;
  /** skull vertices out through a shell of hair */
  readonly skull: number;
  /** hair vertices over the eyes */
  readonly eyes: number;
  dispose(): void;
}

export function hairMeasure(cut: Cut, hat: HeadWear, kind: Kind): HairMeasure {
  const b = herBim(cut, hat, kind);
  const head = part(b, 'head');
  b.group.updateMatrixWorld(true);
  const inv = new Matrix4().copy(head.matrixWorld).invert();
  const hp = hairPoints(b);
  const pts = hp.pts;
  const low = pts.slice(0, pts.length - hp.hang.length).filter((p) => p.y < 0.05);
  const hugless = low.filter((p) => p.length() >= HEAD_R + HUG);
  // the headwear: what the hat group holds that is not hair
  const worn = meshesUnder(head, (m) => m.userData.hair !== true && m.userData.worn === true && m.parent !== head && m.parent?.scale.x === HAT_K);
  const crowns: { c: Vector3; r: number; rim: number }[] = [];
  const closed: Mesh[] = [];
  for (const m of worn) {
    const g = m.geometry;
    if (g instanceof SphereGeometry && g.parameters.thetaLength < Math.PI - 1e-3) {
      const c = new Vector3().setFromMatrixPosition(m.matrixWorld).applyMatrix4(inv);
      const r = g.parameters.radius * HAT_K;
      crowns.push({ c, r, rim: c.y + r * Math.cos(g.parameters.thetaLength) });
    } else closed.push(m);
  }
  const hatVol = closed.length > 0 ? volumeOf(closed, inv) : null;
  let headwear = 0;
  for (const p of pts) {
    if (hatVol && deepIn(hatVol, p)) headwear++;
    else if (crowns.some((k) => p.y > k.rim + 0.004 && p.distanceTo(k.c) > k.r + 0.003)) headwear++;
  }
  // the skull through a shell: a skull vertex in a shell's span but outside its radius
  const skullGeo = new SphereGeometry(HEAD_R, 32, 24);
  const sp = skullGeo.getAttribute('position');
  let skull = 0;
  const shells = meshesUnder(head, (m) => m.userData.shell !== undefined).map((m) => m.userData.shell as { r: number; t0: number; t1: number; phi0: number; span: number; y: number; z: number; tilt?: number });
  const v = new Vector3();
  for (let i = 0; i < sp.count; i++) {
    v.fromBufferAttribute(sp, i);
    for (const s of shells) {
      // in the shell's own frame: it is turned by -tilt about x (bim.ts arc)
      const d = new Vector3(v.x, v.y - s.y, v.z - s.z).applyAxisAngle(new Vector3(1, 0, 0), s.tilt ?? 0);
      const len = d.length();
      const t = Math.acos(Math.max(-1, Math.min(1, d.y / len)));
      if (t < s.t0 || t > s.t1) continue;
      // three's sphere: x = -r cos φ sin θ, z = r sin φ sin θ; the shell spans φ0 to φ0 + span
      const phi = Math.atan2(d.z, -d.x);
      const into = (((phi - s.phi0) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      if (into > s.span) continue;
      if (len > s.r - 0.002) skull++;
    }
  }
  skullGeo.dispose();
  // over the eyes: in front of the face, at the eyes' height (bim.ts EY 0.01, ER 0.044, EX 0.09)
  const eyes = pts.filter((p) => p.z > 0.15 && Math.abs(p.x) < 0.15 && Math.abs(p.y - 0.01) < 0.055).length;
  const { vol, headAt } = torsoOf(kind);
  const turned = new Object3D();
  return {
    headwear,
    skull,
    eyes,
    torsoAt(rot) {
      turned.rotation.set(rot[0], rot[1], rot[2]);
      turned.updateMatrix();
      const to = new Matrix4().multiplyMatrices(headAt, turned.matrix);
      let n = 0;
      // hair hugging the skull (within HUG of it: the shells, the nape's band) is the skull's own surface: the head
      // sits into the collar by design (the bims have no neck), and the law is about hair standing off it
      for (const p of hugless) if (deepIn(vol, v.copy(p).applyMatrix4(to))) n++;
      // the ponytail turned about its tie as apply() turns it
      const hangTo = new Matrix4().multiplyMatrices(to, new Matrix4().makeTranslation(hp.at.x, hp.at.y, hp.at.z)).multiply(new Matrix4().makeRotationX(hangPitch(rot)));
      for (const p of hp.hang) if (deepIn(vol, v.copy(p).applyMatrix4(hangTo))) n++;
      return n;
    },
    dispose() {
      b.dispose();
    },
  };
}

export { KINDS };
