// The hero's entry build (design's hero-entry §2; Gabriel's review, main m_31507: « comme une vague
// ou une goutte de pluie dans une mare »): from 'ready', the town rises out of its middle like a
// ripple. The lawn is cut into cubes that rise and settle by their distance from the middle, one
// wave (0-1950 ms); the roads and the river ride their cubes up; each thing (a tree, a house, an
// office) comes with its cube, a beat after it; the offices' furniture pops, then the bims pop at
// their desks 30 ms apart (1800-), the words fade in last; the camera eases from the wide to the
// film's first shot (2400-2800). Pure timing up top (tested), then what moves the renderer's loose
// things (TownParts) each frame. Owner: hero-town.
import { Box3, InstancedMesh, type Material, Matrix4, Mesh, type Object3D, Quaternion, Vector3, type WebGLProgramParametersWithUniforms } from 'three';
import { STYLE } from '@/bims/render/style';
import type { TownParts } from '@/bims/town/types';

/** the timeline, ms from 'ready' */
export const ENTRY = {
  /** the cubes: the middle's starts at `from`, the lawn's corners' `span` later; each rises in `dur` */
  tiles: { from: 0, span: 1500, dur: 450 },
  /** a thing (a tree, a house, a road's dash...) comes a beat after its cube, over `dur` */
  thing: { after: 120, dur: 220 },
  drop: 240,
  furniture: 180,
  bims: { from: 1800, gap: 30, pop: 150 },
  words: { from: 2250, to: 2400 },
  /** the whole map is there: the town settles into its merged draw */
  built: 2400,
  /** the camera's ease from the wide to the first shot */
  cam: { from: 2400, to: 2800 },
  /** the film runs */
  done: 2800,
} as const;

/** a cube's side, town units (the lawn in about two hundred: every one drawn each frame of the build) */
export const CELL = 4;
/** how far below its place a cube starts its rise, town units */
const RISE = 1.6;
/** an office's drop, css px */
const DROP_PX = 16;
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

/** when the cube at distance d of the middle starts to rise, ms: one wave, the middle first. Pure. */
export function tileStart(d: number, dmax: number): number {
  return ENTRY.tiles.from + ENTRY.tiles.span * (dmax > 0 ? Math.min(1, d / dmax) : 0);
}

/** a cube at ms: its scale (NOT_YET before it starts) and how far under its place it still is (town units). Pure. */
export function tileAt(ms: number, start: number): { readonly s: number; readonly y: number } {
  if (ms < start) return { s: NOT_YET, y: -RISE };
  const p = clamp01((ms - start) / ENTRY.tiles.dur);
  return { s: Math.max(NOT_YET, popOut(p)), y: p >= 1 ? 0 : -RISE * (1 - p) ** 3 };
}

/** a thing's scale at ms: not yet, popping in over `dur`, there. Pure. */
export function popAt(ms: number, start: number, dur: number): number {
  if (ms < start) return NOT_YET;
  return Math.max(NOT_YET, popOut((ms - start) / dur));
}

/** the lawn cut into cubes: as many as fit CELL, each the same size, so they tile it exactly. Pure. */
export function gridOf(lawn: TownParts['lawn']): { readonly nx: number; readonly nz: number; readonly cw: number; readonly cd: number } {
  const w = lawn.x1 - lawn.x0;
  const d = lawn.z1 - lawn.z0;
  const nx = Math.max(1, Math.round(w / CELL));
  const nz = Math.max(1, Math.round(d / CELL));
  return { nx, nz, cw: w / nx, cd: d / nz };
}

/** the middle of the cube a point of the lawn is on. Pure. */
export function cellOf(lawn: TownParts['lawn'], x: number, z: number): { readonly x: number; readonly z: number } {
  const g = gridOf(lawn);
  const i = Math.min(g.nx - 1, Math.max(0, Math.floor((x - lawn.x0) / g.cw)));
  const j = Math.min(g.nz - 1, Math.max(0, Math.floor((z - lawn.z0) / g.cd)));
  return { x: lawn.x0 + (i + 0.5) * g.cw, z: lawn.z0 + (j + 0.5) * g.cd };
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
  /** the cubes: the slab's dirt and its grass top, one instance each per cell */
  readonly tiles: readonly { readonly mesh: InstancedMesh; readonly y: number }[];
  readonly cells: readonly { readonly x: number; readonly z: number; readonly start: number }[];
  readonly pops: readonly Pop[];
}

export interface Entry {
  /** move everything to where it is at ms (the renderer draws next); the film's world of `fitScale` town units per css px */
  apply(ms: number, parts: TownParts, fitScale: number): void;
  /** the build is over: every thing at its own size (the loose town is kept for the fold and the next loop) */
  finish(parts: TownParts | null): void;
}

const box = new Box3();
const size = new Vector3();
const centre = new Vector3();
const m4 = new Matrix4();
const q0 = new Quaternion();
const p3 = new Vector3();
const s3 = new Vector3();

export function makeEntry(): Entry {
  const scapes = new WeakMap<Object3D, ScapeKit>();
  const worlds = new WeakMap<Object3D, readonly Pop[]>();
  const clones: Material[] = [];
  /** the wave, shared by every flat thing's material (the roads, the river, the paths ride their cubes) */
  const wave = {
    ms: { value: 0 },
    c: { value: { x: 0, y: 0 } },
    o: { value: { x: 0, y: 0 } },
    cell: { value: { x: CELL, y: CELL } },
    n: { value: { x: 1, y: 1 } },
    dmax: { value: 1 },
  };
  let dmax = 0;
  const roots = new Map<Object3D, { y: number; start: number }>();
  const bodies = new Map<Object3D, Vector3>();

  /** a flat thing's material that rides the wave: each vertex with its cube, unseen before it */
  function riding(m: Material): Material {
    const c = m.clone();
    c.onBeforeCompile = (sh: WebGLProgramParametersWithUniforms) => {
      sh.uniforms.uWaveMs = wave.ms;
      sh.uniforms.uWaveC = wave.c;
      sh.uniforms.uWaveO = wave.o;
      sh.uniforms.uWaveCell = wave.cell;
      sh.uniforms.uWaveN = wave.n;
      sh.uniforms.uWaveDmax = wave.dmax;
      const head = `uniform float uWaveMs;\nuniform vec2 uWaveC;\nuniform vec2 uWaveO;\nuniform vec2 uWaveCell;\nuniform vec2 uWaveN;\nuniform float uWaveDmax;\nvarying float vWaveP;`;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\n${head}`).replace(
        '#include <begin_vertex>',
        [
          '#include <begin_vertex>',
          'vec2 wXZ = (modelMatrix * vec4(transformed, 1.0)).xz;',
          'vec2 wIJ = clamp(floor((wXZ - uWaveO) / uWaveCell), vec2(0.0), uWaveN - 1.0);',
          'vec2 wCC = uWaveO + (wIJ + 0.5) * uWaveCell;',
          `float wSt = ${ENTRY.tiles.from.toFixed(1)} + ${ENTRY.tiles.span.toFixed(1)} * min(1.0, distance(wCC, uWaveC) / uWaveDmax);`,
          `vWaveP = clamp((uWaveMs - wSt) / ${ENTRY.tiles.dur.toFixed(1)}, 0.0, 1.0);`,
          `transformed.y -= ${RISE.toFixed(2)} * pow(1.0 - vWaveP, 3.0);`,
        ].join('\n'),
      );
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vWaveP;')
        .replace('#include <clipping_planes_fragment>', 'if (vWaveP <= 0.0) discard;\n#include <clipping_planes_fragment>');
    };
    c.customProgramCacheKey = () => 'bims-hero-wave';
    clones.push(c);
    return c;
  }

  function scapeKit(root: Object3D, parts: TownParts): ScapeKit {
    const had = scapes.get(root);
    if (had) return had;
    const { lawn, centre: at } = parts;
    const g = gridOf(lawn);
    const inPit = (x: number, z: number): boolean => parts.pits.some((p) => x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1);
    const cells: { x: number; z: number; start: number }[] = [];
    let far = 0;
    for (let i = 0; i < g.nx; i++) {
      for (let j = 0; j < g.nz; j++) {
        const x = lawn.x0 + (i + 0.5) * g.cw;
        const z = lawn.z0 + (j + 0.5) * g.cd;
        far = Math.max(far, Math.hypot(x - at.x, z - at.z));
        if (!inPit(x, z)) cells.push({ x, z, start: 0 });
      }
    }
    dmax = Math.max(dmax, far);
    const cellsTimed = cells.map((c) => ({ ...c, start: tileStart(Math.hypot(c.x - at.x, c.z - at.z), dmax) }));
    wave.c.value = { x: at.x, y: at.z };
    wave.o.value = { x: lawn.x0, y: lawn.z0 };
    wave.cell.value = { x: g.cw, y: g.cd };
    wave.n.value = { x: g.nx, y: g.nz };
    wave.dmax.value = dmax;

    const lawnW = lawn.x1 - lawn.x0;
    const slabs: Mesh[] = [];
    const pops: Pop[] = [];
    root.updateMatrixWorld(true);
    for (const o of [...root.children]) {
      box.setFromObject(o);
      box.getSize(size);
      box.getCenter(centre);
      const m: Mesh | null = o instanceof Mesh ? (o as Mesh) : null;
      // flat things first: the road, the river and its banks cross the whole lawn too, and as cubes
      // they covered the grass (the build's lawn read grey, then jumped to green when it settled)
      if (m && size.y < 0.1 && !Array.isArray(m.material)) {
        // a road, the river, a dash, a path, a paving: each vertex rides its cube up
        m.material = riding(m.material);
        continue;
      }
      if (m && size.x >= lawnW * 0.9 && !Array.isArray(m.material)) {
        // the floating block (its dirt, its grass): drawn as its cubes while they rise, itself again once settled
        slabs.push(m);
        continue;
      }
      const cc = cellOf(lawn, centre.x, centre.z);
      pops.push({ o, base: o.scale.clone(), start: tileStart(Math.hypot(cc.x - at.x, cc.z - at.z), dmax) + ENTRY.thing.after, dur: ENTRY.thing.dur });
    }
    const tiles = slabs.map((s) => {
      box.setFromObject(s);
      box.getSize(size);
      box.getCenter(centre);
      // the town's own box (its vertex colours, its bevel): a cube reads as a piece of the slab
      const mesh = new InstancedMesh(STYLE.box(g.cw, size.y, g.cd), s.material as Material, cellsTimed.length);
      // no shadow of their own while they rise (a few hundred cubes in every shadow pass: the build stalled)
      mesh.castShadow = false;
      mesh.receiveShadow = s.receiveShadow;
      mesh.frustumCulled = false;
      s.visible = false;
      root.add(mesh);
      return { mesh, y: centre.y };
    });
    const kit: ScapeKit = { tiles, cells: cellsTimed, pops };
    scapes.set(root, kit);
    return kit;
  }

  function worldPops(world: Object3D, width: number, start: number): readonly Pop[] {
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
    worlds.set(world, pops);
    return pops;
  }

  const scaleTo = (p: Pop, s: number): void => {
    p.o.scale.set(p.base.x * s, p.base.y * s, p.base.z * s);
  };

  // every frame of the build, all of them: the unseen full frame before 'ready' sets them settled, frame 0 sets them back
  function moveTiles(k: ScapeKit, ms: number): void {
    for (const t of k.tiles) {
      for (let i = 0; i < k.cells.length; i++) {
        const c = k.cells[i];
        if (c === undefined) continue;
        const a = tileAt(ms, c.start);
        p3.set(c.x, t.y + a.y, c.z);
        s3.setScalar(a.s);
        t.mesh.setMatrixAt(i, m4.compose(p3, q0, s3));
      }
      t.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  return {
    apply(ms, parts, fitScale) {
      const at = parts.centre;
      wave.ms.value = ms;
      if (parts.scape) {
        const k = scapeKit(parts.scape, parts);
        moveTiles(k, ms);
        for (const p of k.pops) scaleTo(p, popAt(ms, p.start, p.dur));
      }
      const drop = DROP_PX * fitScale * 1.25;
      const bims: { body: Object3D; d: number; name: string }[] = [];
      for (const o of parts.offices) {
        let r = roots.get(o.root);
        if (!r) {
          const cc = cellOf(parts.lawn, o.root.position.x, o.root.position.z);
          r = { y: o.root.position.y, start: tileStart(Math.hypot(cc.x - at.x, cc.z - at.z), Math.max(dmax, 1)) + ENTRY.thing.after };
          roots.set(o.root, r);
        }
        const f = (ms - r.start) / ENTRY.drop;
        o.root.scale.setScalar(ms < r.start ? NOT_YET : 1);
        o.root.position.y = r.y + drop * (1 - popOut(f));
        if (o.world) for (const p of worldPops(o.world, o.width, r.start)) scaleTo(p, popAt(ms, p.start, p.dur));
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
        if (o.world) for (const p of worlds.get(o.world) ?? []) scaleTo(p, 1);
      }
      for (const [body, base] of bodies) body.scale.copy(base);
      bodies.clear();
      roots.clear();
      // the wave's materials stay: the loose roads and river keep them for the fold and the next
      // loop's build (disposed, their program would compile again then: a stall)
    },
  };
}

/** the words over the town (names, eggs, pills): their opacity at ms */
export function wordsAt(ms: number): number {
  return easeInOut((ms - ENTRY.words.from) / (ENTRY.words.to - ENTRY.words.from));
}
