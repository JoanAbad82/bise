// The unlock moment (three; page bims-office v14, bims m_27978): a new stage's piece is brought in.
// Two bims of the office's crew (no agent's: they have no row, no label) walk from the door to where
// it goes carrying a crate each (the land queue's carry, pose.ts), in UNLOCK_WALK s; the piece pops
// up as they arrive, they stay a moment and fade. Reduced motion: no walk, the piece is there.
// Office.tsx says when (Look.unlock) and shows the "new: <thing>" label (growth.ts). Owner: bims-grow.
import { type Object3D, type Scene } from 'three';
import type { Activity, Office, Pose, Pt, Segment } from '../model';
import { UNLOCK_LABEL, UNLOCK_WALK } from '../growth';
import { along, path } from '../paths';
import { makeBim, type Bim } from './bim';
import { castShadows } from './world';
import { rigOf } from './pose';
import type { MapLook } from './maps/look';
import type { Style } from './style';

/** how far apart the two carriers walk, sideways */
const SIDE = 0.35;
/** the piece's pop as they arrive, s */
const POP = 0.4;

export interface Unlock {
  /** the moment at t: hides the piece until it is brought in; true while something moves */
  update(t: number, o: Office, u: { readonly stage: number; readonly at: number } | undefined, piece: Object3D | undefined, reduced: boolean, look: MapLook): boolean;
  dispose(): void;
}

export function makeUnlock(scene: Scene, style: Style): Unlock {
  const crew: Bim[] = [];
  const ensure = (): Bim[] => {
    if (crew.length === 0) {
      for (const n of ['crew-a', 'crew-b']) {
        const b = makeBim(n, false, style);
        if (style.shadows) castShadows(b.group);
        b.group.visible = false;
        scene.add(b.group);
        crew.push(b);
      }
    }
    return crew;
  };
  const hide = (): void => {
    for (const b of crew) b.group.visible = false;
  };
  return {
    update(t, o, u, piece, reduced, look) {
      if (!u) { hide(); if (piece) piece.scale.setScalar(1); return false; }
      const s = t - u.at;
      const end = UNLOCK_WALK + UNLOCK_LABEL;
      if (reduced || s >= end || s < 0) {
        hide();
        if (piece) { piece.visible = true; piece.scale.setScalar(1); }
        return false;
      }
      // the piece: hidden while it is carried, then a quick pop from its floor
      if (piece) {
        const p = (s - UNLOCK_WALK) / POP;
        piece.visible = p > 0;
        const k = Math.min(1, Math.max(0.01, p));
        piece.scale.setScalar(k);
      }
      const to: Pt = look.pieceAt(o, u.stage);
      const walk = path(o, o.door, to);
      const speed = Math.max(0.5, walk.len / UNLOCK_WALK);
      const act: Activity = { k: 'landing', at: 'queue' };
      const spot = { x: to.x, z: to.z, wz: to.z, ax: to.x, face: 0 };
      const seg: Segment = { t: u.at, act, sig: 'unlock', spot, path: walk, speed, from: 'starting' };
      const d = Math.min(walk.len, s * speed);
      const here = along(walk, d);
      const moving = d < walk.len;
      ensure().forEach((b, i) => {
        const side = (i === 0 ? -1 : 1) * SIDE;
        // sideways from the way they walk
        const pose: Pose = { x: here.x + Math.cos(here.dir) * side, z: here.z - Math.sin(here.dir) * side, dir: here.dir, moving, since: s, seg };
        const rig = rigOf({ pose, t, main: false, phase: i * 0.5, reduced: false });
        // they fade out over the label's last second
        const fade = Math.min(1, Math.max(0, end - s));
        b.apply({ ...rig, opacity: Math.min(rig.opacity, fade) });
        b.group.visible = true;
      });
      return true;
    },
    dispose() {
      for (const b of crew) { scene.remove(b.group); b.dispose(); }
      crew.length = 0;
    },
  };
}
