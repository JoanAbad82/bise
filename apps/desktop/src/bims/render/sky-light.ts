// The sky on a view's two lights (bims-sky): sky.ts says the light (pure), this puts it on the
// hemisphere and the key light, aims the key from the sun's or the moon's side over a centre, and
// sets its shadow's darkness and softness. The office (render/index.ts) and the town (render/town.ts)
// call it per frame while a blend runs, once when it rests. Owner: bims-sky.
import { Color, type ColorRepresentation, type DirectionalLight, type HemisphereLight } from 'three';
import type { Light } from '../sky';

/** how far the key stands from what it lights (inside the shadow camera's near/far) */
const KEY_DIST = 16;
/** the shadow's softness: the clear sun's radius, and how much clouds add */
const RADIUS = 8;
const RADIUS_SOFT = 14;

export function applyLight(hemi: HemisphereLight, key: DirectionalLight, l: Light, at: { x: number; y: number; z: number }, dist = KEY_DIST): void {
  hemi.color.set(l.hemi);
  hemi.groundColor.set(l.ground);
  hemi.intensity = l.hemiI;
  key.color.set(l.key);
  key.intensity = l.keyI;
  key.target.position.set(at.x, at.y, at.z);
  key.position.set(at.x + l.dir.x * dist, at.y + l.dir.y * dist, at.z + l.dir.z * dist);
  key.target.updateMatrixWorld();
  key.shadow.intensity = l.shadow;
  key.shadow.radius = RADIUS + RADIUS_SOFT * l.soft;
}

/** the backdrop: the paper leaning a little to the air */
export function backdropOf(paper: ColorRepresentation, l: Light): Color {
  return new Color(paper).lerp(new Color(l.air), l.airMix);
}
