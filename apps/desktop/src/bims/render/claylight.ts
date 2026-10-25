// The bims' clay light (page bims-look v6, his pick D): on the bims' materials only, a small warm
// studio environment (one 64×32 equirect, made once, envMapIntensity 0.55) and a little self-warmth
// in their shadows (emissive = colour × WARM × day; day 0 at night, when the lamp pools light them).
// A bim's merged parts (bim.ts) share one vertex-coloured material whose stopped grey and warmth are
// uniforms (onBeforeCompile), so going grey or the day turning never needs a new program. The
// world, the film's signed light and its theme never use any of this. Owner: bims-clay.
import { CanvasTexture, Color, EquirectangularReflectionMapping, type Material, MeshLambertMaterial, MeshStandardMaterial, SRGBColorSpace } from 'three';
import { WORLD } from './palette';
import type { Style } from './style';

/** the self-warmth at full day, a fraction of each colour */
export const WARM = 0.1;
/** how much of the studio environment the bims' clay takes */
export const ENV_I = 0.55;
/** how far a stopped bim goes toward WORLD.grey (rig.grey 1) */
export const GREY_MIX = 0.85;

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
    ? new MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 })
    : new MeshLambertMaterial({ vertexColors: true });
  if (m instanceof MeshStandardMaterial) clayLit(m, false);
  const u = { uGrey: { value: 0 }, uGreyTo: { value: GREY.clone() }, uWarm: { value: 0 } };
  m.userData.toward = [GREY.r, GREY.g, GREY.b, 0];
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
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
