// The eggs' bodies (pure, no three): a bim's Rig with its egg played on top (eggs.ts says which):
// the salto, the hop and its coin, the kickflip, the moonwalk, the box held up, the tap, the clap,
// the dance, the look up, the golden pineapple, the sunglasses. The state's own pose stays under it:
// an egg only moves what its picture needs. A timed egg asks for frames while it plays ('walk'); a
// lasting one (shades, golden, lookup, stare) is a still pose. Owner: bims-follow.
import type { BimEgg } from '../eggs';
import { isPoke } from '../pokes';
import { pokeRig } from './poke';
import type { Rig, Rot } from './pose';

const ease = (u: number): number => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
const add = (r: Rot, d: Rot): Rot => [r[0] + d[0], r[1] + d[1], r[2] + d[2]];

/** a bim's rig with its egg on top; null egg: the rig as is */
export function eggRig(rig: Rig, egg: BimEgg | null): Rig {
  if (egg === null) return rig;
  // his poke (pokes.ts) beats an egg: its body is render/poke.ts's; the word alone asks for no frame
  if (isPoke(egg.kind)) return egg.kind === 'word' ? rig : { ...pokeRig(rig, egg.kind, egg.since, egg.dur), motion: 'walk' };
  const u = Number.isFinite(egg.dur) ? Math.min(1, Math.max(0, egg.since / egg.dur)) : 0;
  const s = egg.since;
  const timed = Number.isFinite(egg.dur);
  const out = ((): Rig => {
    switch (egg.kind) {
      case 'salto':
        return { ...rig, y: rig.y + Math.sin(Math.PI * u) * 0.7, body: add(rig.body, [-2 * Math.PI * ease(u), 0, 0]), mouth: 'laugh' };
      case 'hop':
        return { ...rig, y: rig.y + Math.sin(Math.PI * u) * 0.35, props: { ...rig.props, coin: u } };
      case 'kickflip':
        return { ...rig, y: rig.y + Math.sin(Math.PI * u) * 0.3, body: add(rig.body, [0, 2 * Math.PI * ease(u), 0]), props: { ...rig.props, skate: true }, mouth: 'laugh' };
      case 'moonwalk':
        return { ...rig, dir: rig.dir + Math.PI };
      case 'itemget':
        return { ...rig, armL: [-Math.PI * 0.95, 0, 0.2], armR: [-Math.PI * 0.95, 0, -0.2], props: { ...rig.props, crate: true, crateUp: true }, mouth: 'oh' };
      case 'tap':
        return { ...rig, armR: [-1.3 + Math.sin(s * 18) * 0.25, 0, 0] };
      case 'clap': {
        // up from its chair, the paper down, both hands up before its face, three claps (bims m_31555:
        // seated, behind its paper, the clap read as work)
        const c = 0.35 + Math.sin(s * 6.3) * 0.3;
        return { ...rig, y: Math.max(rig.y, 0), legL: 0, legR: 0, armL: [-1.5, 0, c], armR: [-1.5, 0, -c], mouth: 'laugh', props: { ...rig.props, newspaper: false } };
      }
      case 'dance':
        return { ...rig, armL: [-1.5, 0, 0], armR: [-1.5, 0, 0], body: add(rig.body, [0, 0, Math.sin(s * 6) * 0.2]), y: rig.y + Math.abs(Math.sin(s * 6)) * 0.08 };
      case 'lookup':
        return { ...rig, head: [-0.6, rig.head[1], rig.head[2]], mouth: 'oh' };
      case 'golden':
        return { ...rig, props: { ...rig.props, pine: true, golden: true } };
      case 'shades':
        return { ...rig, props: { ...rig.props, glasses: true } };
      case 'speedrun':
      case 'combo':
      case 'stare':
      case 'tetris':
      case 'loop':
        // their words (eggs.ts labels) or his plane's flight (index.ts) are the egg
        return rig;
    }
  })();
  return timed && egg.kind !== 'moonwalk' ? { ...out, motion: 'walk' } : out;
}
