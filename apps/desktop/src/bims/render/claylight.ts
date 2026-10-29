// The bims' clay light (page bims-look v6, his pick D): on the bims' materials only, a small warm
// studio environment (one 64×32 equirect, made once, envMapIntensity 0.55) and a little self-warmth
// in their shadows (emissive = colour × WARM × day; day 0 at night, when the lamp pools light them).
// A bim's merged parts (bim.ts) share one vertex-coloured material whose stopped grey and warmth are
// uniforms (onBeforeCompile), so going grey or the day turning never needs a new program.
// Their clay itself (page bims-look-2, his pick B « la pâte »): the merged parts' shader adds a warm
// glow where the key's light turns to shade (wrap lighting, as clay lets a little light through), a
// soft rim on the edges, both fading out on dark colours (main's black stays as dark), and a faint
// thumb-pressed grain fixed on the part (object space: it never swims as the bim moves). The
// world, the film's signed light and its theme never use any of this. Owner: bims-clay-2.
import { CanvasTexture, Color, EquirectangularReflectionMapping, type Material, MeshLambertMaterial, MeshStandardMaterial, SRGBColorSpace } from 'three';
import { WORLD } from './palette';
import type { Style } from './style';

/** the self-warmth at full day, a fraction of each colour */
export const WARM = 0.1;
/** how much of the studio environment the bims' clay takes */
export const ENV_I = 0.55;
/** how far a stopped bim goes toward WORLD.grey (rig.grey 1) */
export const GREY_MIX = 0.85;
/**
 * the clay of the merged parts (page bims-look-2 B, signed by designer m_41822): its roughness, how
 * far the wrap reaches past the terminator, the warm glow there, the rim on the edges, the grain's
 * depth and its frequency (per office unit, on the part)
 */
export const CLAY = { rough: 0.65, wrap: 0.7, glow: 0.9, rim: 0.2, grain: 0.06, freq: 55 } as const;

/** a cheap 3D value noise for the grain (GLSL), and the parts' object-space position */
const GRAIN_PARS = `
varying vec3 vObj;
float clayHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float clayNoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(clayHash(i), clayHash(i + vec3(1, 0, 0)), f.x), mix(clayHash(i + vec3(0, 1, 0)), clayHash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(clayHash(i + vec3(0, 0, 1)), clayHash(i + vec3(1, 0, 1)), f.x), mix(clayHash(i + vec3(0, 1, 1)), clayHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
`;
const f = (n: number): string => n.toFixed(3);
/** the grain: the normal tilted by the noise's gradient on the part */
const GRAIN = `
{ vec3 q = vObj * ${f(CLAY.freq)}; float n0 = clayNoise(q);
  vec3 g = vec3(clayNoise(q + vec3(1, 0, 0)) - n0, clayNoise(q + vec3(0, 1, 0)) - n0, clayNoise(q + vec3(0, 0, 1)) - n0);
  normal = normalize(normal - (mat3(viewMatrix) * g) * ${f(CLAY.grain)}); }
`;
/** the warm glow past the terminator (the key: the first directional light) and the rim, both off on dark colours */
const GLOW = `
{ float clayLum = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  float clayLit = smoothstep(0.04, 0.3, clayLum);
#if NUM_DIR_LIGHTS > 0
  float nl = dot(normal, directionalLights[0].direction);
  float wrapd = max(0.0, (nl + ${f(CLAY.wrap)}) / (1.0 + ${f(CLAY.wrap)})) - max(0.0, nl);
  reflectedLight.indirectDiffuse += vec3(1.0, 0.45, 0.3) * diffuseColor.rgb * directionalLights[0].color * wrapd * ${f(CLAY.glow)} * clayLit;
#endif
  float fr = pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 3.0);
  reflectedLight.indirectDiffuse += diffuseColor.rgb * vec3(1.0, 0.92, 0.85) * fr * ${f(CLAY.rim)} * clayLit; }
`;

let env: CanvasTexture | null = null;
/** the studio: a warm vertical gradient, a soft window up front-left (the key's side); one for every bim */
function studio(): CanvasTexture {
  if (env) return env;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 32;
  const g = c.getContext('2d');
  if (g) {
    const v = g.createLinearGradient(0, 0, 0, 32);
    v.addColorStop(0, '#fff6e6');
    v.addColorStop(0.45, '#f3e6d6');
    v.addColorStop(0.6, '#cdbfae');
    v.addColorStop(1, '#8a7f73');
    g.fillStyle = v;
    g.fillRect(0, 0, 64, 32);
    const w = g.createRadialGradient(22, 9, 1, 22, 9, 12);
    w.addColorStop(0, 'rgba(255,255,255,0.9)');
    w.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = w;
    g.fillRect(0, 0, 64, 32);
  }
  env = new CanvasTexture(c);
  env.mapping = EquirectangularReflectionMapping;
  env.colorSpace = SRGBColorSpace;
  return env;
}

/**
 * A bim's own material lit as clay: the studio's reflections (clay style only). `warm`: its colour
 * comes back as a little emissive by day (warmth(), never on a glow). userData.warm tells the town's
 * bake (merge.ts) that this emissive is only warmth, so it bakes like a matte one.
 */
export function clayLit(m: Material, warm: boolean): void {
  if (!(m instanceof MeshStandardMaterial)) return;
  m.envMap = studio();
  m.envMapIntensity = ENV_I;
  if (warm) {
    m.userData.warm = true;
    m.emissiveIntensity = 1;
  }
}

/** a warm material's emissive for the day (0..1): its colour now (grey included) × WARM × day */
export function warmth(m: Material, day: number): void {
  if (m.userData.warm !== true || !(m instanceof MeshStandardMaterial)) return;
  m.emissive.copy(m.color).multiplyScalar(WARM * day);
}

const GREY = new Color(WORLD.grey);

/** the merged parts' material: what bim.ts sets on it */
export interface PartsMaterial {
  readonly material: Material;
  /** a stopped bim: 0..1 (rig.grey), toward WORLD.grey by GREY_MIX */
  grey(k: number): void;
  /** the day (0..1): the self-warmth */
  day(d: number): void;
}

/**
 * One bim's merged parts' material: white × the vertices' colours, the stopped grey and the warmth as
 * uniforms. Its userData.toward ([r, g, b, k]) tells the town's bake (merge.ts) the grey to bake in.
 */
export function partsMaterial(style: Style): PartsMaterial {
  const m = style.name === 'clay'
    ? new MeshStandardMaterial({ vertexColors: true, roughness: CLAY.rough, metalness: 0 })
    : new MeshLambertMaterial({ vertexColors: true });
  const clay = style.name === 'clay';
  if (m instanceof MeshStandardMaterial) clayLit(m, false);
  const u = { uGrey: { value: 0 }, uGreyTo: { value: GREY.clone() }, uWarm: { value: 0 } };
  m.userData.toward = [GREY.r, GREY.g, GREY.b, 0];
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    if (clay) {
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vObj;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\n${GRAIN_PARS}`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${GRAIN}`)
        .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>\n${GLOW}`);
    }
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uGrey;\nuniform vec3 uGreyTo;\nuniform float uWarm;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, uGreyTo, uGrey);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * uWarm;');
  };
  // one program for every bim (the same code), apart from three's own materials
  m.customProgramCacheKey = () => 'bim-parts';
  return {
    material: m,
    grey(k) {
      u.uGrey.value = k * GREY_MIX;
      m.userData.toward = [GREY.r, GREY.g, GREY.b, k * GREY_MIX];
    },
    day(d) {
      u.uWarm.value = style.name === 'clay' ? WARM * d : 0;
    },
  };
}
