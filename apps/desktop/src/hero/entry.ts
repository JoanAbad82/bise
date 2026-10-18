// The hero's entry build (design's hero-entry §2, from Gabriel 18 oct: « elle se construit en partant
// du centre en 2 s »): from 'ready', the town grows out of its middle in 2.4 s, then the camera
// eases from the wide to the film's first shot and the film runs from 2.8 s. One timeline, ms
// from 'ready': the ground slab grows (0-400), the roads and the river draw outward (200-1400),
// every thing pops in by its distance from the middle (400-1800, an ease-in-out on the start
// times), the offices drop in and their furniture pops, the bims pop at their desks 30 ms apart
// (1800-), the words fade in last. Pure timing up top (tested), then what moves the renderer's
// loose things (TownParts) each frame. Owner: hero-town.
import { Box3, type Material, Mesh, type Object3D, Vector3, type WebGLProgramParametersWithUniforms } from 'three';
import type { TownParts } from '@/bims/town/types';

/** the timeline, ms from 'ready' */
export const ENTRY = {
  slab: { from: 0, to: 400 },
  /** the slab's brown edge comes in last of the slab */
  edge: { from: 200, to: 400 },
  roads: { from: 200, to: 1400 },
  /** each thing's start: from + span × easeInOut(d / dmax) ± jitter */
  things: { from: 400, span: 1400, jitter: 40 },
  drop: 240,
  furniture: 180,
  pop: 200,
  bims: { from: 1800, gap: 30, pop: 150 },
  words: { from: 2250, to: 2400 },
  /** the whole map is there: the town settles into its merged draw */
  built: 2400,
  /** the camera's ease from the wide to the first shot */
  cam: { from: 2400, to: 2800 },
  /** the film runs */
  done: 2800,
} as const;

/** an office's drop, css px */
const DROP_PX = 16;
/** the slab's first size */
const SLAB_FROM = 0.92;
/** a thing not in yet: drawn this small, so its shaders compile with the rest */
const NOT_YET = 1e-4;

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/** cubic-bezier(x1, y1, x2, y2) as a function of x in [0, 1] (CSS's timing function). Pure. */
export function bezier(x1: number, y1: number, x2: number, y2: number): (x: number) => number {
  const at = (a: number, b: number, s: number): number => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
  const slope = (a: number, b: number, s: number): number => 3 * a * (1 - s) ** 2 + 6 * (b - a) * s * (1 - s) + 3 * (1 - b) * s * s;
  return (x) => {
    const xx = clamp01(x);
    let s = xx;
    for (let i = 0; i < 8; i++) {
      const d = slope(x1, x2, s);
      if (Math.abs(d) < 1e-6) break;
      s = clamp01(s - (at(x1, x2, s) - xx) / d);
    }
    return at(y1, y2, s);
  };
}

/** the build's global ease (design: cubic-bezier(.65, 0, .35, 1)) */
export const easeInOut = bezier(0.65, 0, 0.35, 1);

/** each thing's own appearance: an ease-out that overshoots 4% (easeOutBack, c = 1.04), then settles. Pure. */
export function popOut(x: number): number {
  const c = 1.04;
  const y = clamp01(x) - 1;
  return 1 + (c + 1) * y ** 3 + c * y * y;
}

/** a small stable number in [-1, 1] for a place: the same thing jitters the same way every load. Pure. */
export function jitterOf(x: number, z: number): number {
  const h = Math.sin(Math.floor(x / 2) * 12.9898 + Math.floor(z / 2) * 78.233) * 43758.5453;
  return (h - Math.floor(h)) * 2 - 1;
}

/** when a thing at distance d of the middle starts to come in, ms. Pure. */
export function thingStart(d: number, dmax: number, x: number, z: number): number {
  const { from, span, jitter } = ENTRY.things;
  return from + span * easeInOut(dmax > 0 ? d / dmax : 0) + jitter * jitterOf(x, z);
}

/** a thing's scale at ms: not yet, popping in over `dur`, there. Pure. */
export function popAt(ms: number, start: number, dur: number): number {
  if (ms < start) return NOT_YET;
  return Math.max(NOT_YET, popOut((ms - start) / dur));
}

/** the roads' reveal: how far from the middle they're drawn at ms, fractions of their reach. Pure. */
export function roadsAt(ms: number): number {
  return easeInOut((ms - ENTRY.roads.from) / (ENTRY.roads.to - ENTRY.roads.from));
}

// ---- what moves the renderer's loose things

interface Pop {
  readonly o: Object3D;
  readonly base: Vector3;
  readonly start: number;
  readonly dur: number;
}

/** a townscape's things, sorted once */
interface ScapeKit {
  readonly slab: readonly { readonly mesh: Mesh; readonly mat: Material; readonly edge: boolean }[];
  readonly pops: readonly Pop[];
  /** the flat things' reach from the middle, town units */
  readonly reach: number;
}

/** an office's world's things, sorted once */
interface WorldKit {
  readonly pops: readonly Pop[];
}

export interface Entry {
  /** move everything to where it is at ms (the renderer draws next); the film's world of `fitScale` town units per css px */
  apply(ms: number, parts: TownParts, fitScale: number): void;
  /** the build is over: every thing at its own size, the clones dropped */
  finish(parts: TownParts | null): void;
}

const box = new Box3();
const size = new Vector3();
const centre = new Vector3();

export function makeEntry(): Entry {
  const scapes = new WeakMap<Object3D, ScapeKit>();
  const worlds = new WeakMap<Object3D, WorldKit>();
  const clones: Material[] = [];
  /** the roads' reveal, shared by every flat thing's material */
  const reveal = { c: { value: { x: 0, y: 0 } }, r: { value: 0 } };
  /** each office's first look: where its things start, by distance */
  let dmax = 0;
  const roots = new Map<Object3D, { y: number; start: number }>();
  const bodies = new Map<Object3D, Vector3>();

  /** a flat thing's material that draws only within reveal.r of the middle */
  function revealing(m: Material): Material {
    const c = m.clone();
    c.onBeforeCompile = (sh: WebGLProgramParametersWithUniforms) => {
      sh.uniforms.uRevealC = reveal.c;
      sh.uniforms.uRevealR = reveal.r;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vRevealXZ;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvRevealXZ = (modelMatrix * vec4(transformed, 1.0)).xz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vRevealXZ;\nuniform vec2 uRevealC;\nuniform float uRevealR;')
        .replace('#include <clipping_planes_fragment>', 'if (distance(vRevealXZ, uRevealC) > uRevealR) discard;\n#include <clipping_planes_fragment>');
    };
    c.customProgramCacheKey = () => 'bims-hero-reveal';
    clones.push(c);
    return c;
  }

  function scapeKit(root: Object3D, at: TownParts['centre']): ScapeKit {
    const had = scapes.get(root);
    if (had) return had;
    const slab: { mesh: Mesh; mat: Material; edge: boolean }[] = [];
    const things: { o: Object3D; d: number; x: number; z: number }[] = [];
    let reach = 0;
    let lawnW = 0;
    root.updateMatrixWorld(true);
    for (const o of root.children) {
      box.setFromObject(o);
      box.getSize(size);
      lawnW = Math.max(lawnW, size.x);
    }
    for (const o of root.children) {
      box.setFromObject(o);
      box.getSize(size);
      box.getCenter(centre);
      const m: Mesh | null = o instanceof Mesh ? (o as Mesh) : null;
      if (m && size.x >= lawnW * 0.9 && !Array.isArray(m.material)) {
        // the floating block: its grass top and its dirt under (the taller one, drawn last)
        const mat = (m.material).clone();
        mat.transparent = true;
        clones.push(mat);
        m.material = mat;
        slab.push({ mesh: m, mat, edge: size.y > 0.5 });
        continue;
      }
      if (m && size.y < 0.1 && !Array.isArray(m.material)) {
        // a road, the river, a dash, a path, a paving: drawn outward from the middle
        m.material = revealing(m.material);
        reach = Math.max(reach, ...[box.min.x, box.max.x].flatMap((x) => [box.min.z, box.max.z].map((z) => Math.hypot(x - at.x, z - at.z))));
        continue;
      }
      things.push({ o, d: Math.hypot(centre.x - at.x, centre.z - at.z), x: centre.x, z: centre.z });
    }
    dmax = Math.max(dmax, ...things.map((t) => t.d));
    const pops = things.map((t) => ({ o: t.o, base: t.o.scale.clone(), start: thingStart(t.d, dmax, t.x, t.z), dur: ENTRY.pop }));
    const kit = { slab, pops, reach };
    scapes.set(root, kit);
    return kit;
  }

  function worldKit(world: Object3D, width: number, start: number): WorldKit {
    const had = worlds.get(world);
    if (had) return had;
    const pops: Pop[] = [];
    world.updateMatrixWorld(true);
    let i = 0;
    for (const o of world.children) {
      if (!o.visible) continue;
      box.setFromObject(o);
      if (box.isEmpty()) continue;
      box.getSize(size);
      // the floor and the walls drop with the office; what stands in it pops after
      if (Math.max(size.x, size.z) >= width * 0.45) continue;
      pops.push({ o, base: o.scale.clone(), start: start + ENTRY.drop + (i++ % 6) * 12, dur: ENTRY.furniture });
    }
    const kit = { pops };
    worlds.set(world, kit);
    return kit;
  }

  const scaleTo = (p: Pop, s: number): void => {
    p.o.scale.set(p.base.x * s, p.base.y * s, p.base.z * s);
  };

  return {
    apply(ms, parts, fitScale) {
      const at = parts.centre;
      if (parts.scape) {
        const k = scapeKit(parts.scape, at);
        const g = easeInOut((ms - ENTRY.slab.from) / (ENTRY.slab.to - ENTRY.slab.from));
        for (const s of k.slab) {
          s.mesh.scale.setScalar(SLAB_FROM + (1 - SLAB_FROM) * g);
          s.mat.opacity = s.edge ? easeInOut((ms - ENTRY.edge.from) / (ENTRY.edge.to - ENTRY.edge.from)) : g;
        }
        reveal.c.value = { x: at.x, y: at.z };
        reveal.r.value = k.reach * roadsAt(ms) + 1e-3;
        for (const p of k.pops) scaleTo(p, popAt(ms, p.start, p.dur));
      }
      const drop = DROP_PX * fitScale * 1.25;
      const bims: { body: Object3D; d: number; name: string }[] = [];
      for (const o of parts.offices) {
        let r = roots.get(o.root);
        if (!r) {
          const d = Math.hypot(o.root.position.x - at.x, o.root.position.z - at.z);
          r = { y: o.root.position.y, start: thingStart(d, Math.max(dmax, d), o.root.position.x, o.root.position.z) };
          roots.set(o.root, r);
        }
        const f = (ms - r.start) / ENTRY.drop;
        o.root.scale.setScalar(ms < r.start ? NOT_YET : 1);
        o.root.position.y = r.y + drop * (1 - popOut(f));
        if (o.world) for (const p of worldKit(o.world, o.width, r.start).pops) scaleTo(p, popAt(ms, p.start, p.dur));
        const d = Math.hypot(o.root.position.x - at.x, o.root.position.z - at.z);
        for (const b of o.bims) bims.push({ body: b.body, d, name: b.name });
      }
      bims.sort((a, b) => a.d - b.d || a.name.localeCompare(b.name));
      bims.forEach((b, i) => {
        let base = bodies.get(b.body);
        if (!base) {
          base = b.body.scale.clone();
          bodies.set(b.body, base);
        }
        const s = popAt(ms, ENTRY.bims.from + i * ENTRY.bims.gap, ENTRY.bims.pop);
        b.body.scale.set(base.x * s, base.y * s, base.z * s);
      });
    },
    finish(parts) {
      for (const o of parts?.offices ?? []) {
        const r = roots.get(o.root);
        o.root.scale.setScalar(1);
        if (r) o.root.position.y = r.y;
        if (o.world) for (const p of worlds.get(o.world)?.pops ?? []) scaleTo(p, 1);
      }
      for (const [body, base] of bodies) body.scale.copy(base);
      bodies.clear();
      roots.clear();
      for (const c of clones.splice(0)) c.dispose();
    },
  };
}

/** the words over the town (names, eggs, pills): their opacity at ms */
export function wordsAt(ms: number): number {
  return easeInOut((ms - ENTRY.words.from) / (ENTRY.words.to - ENTRY.words.from));
}
