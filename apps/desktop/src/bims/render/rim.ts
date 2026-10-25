// The rimmed cube (hero entry, designer's entry audit §5): a cube of a ground cut into cubes shows
// the dirt on its outer faces only, its top's colour on the sides toward the middle. Shared by the
// hero town's build (hero/entry.ts) and the home islands' ground (sprites/scene.ts). Owner: hero-town.
import type { Color, Material, WebGLProgramParametersWithUniforms } from 'three';

/**
 * A rising cube's material: the slab's dirt on its outer faces only (away from the wave's middle),
 * the grass on its other sides, so the cubes still rising read as lawn, not loose dirt (designer's
 * entry audit §5). The hero's settled slab is the slab's own mesh again; the home islands' ground
 * stays its cubes (designer m_43276). `centre`: the wave's middle (x, z), a uniform the caller moves.
 */
export function rimmedMaterial(m: Material, top: Color, centre: { value: { x: number; y: number } }): Material {
  const c = m.clone();
  const uTop = { value: top };
  c.onBeforeCompile = (sh: WebGLProgramParametersWithUniforms) => {
    sh.uniforms.uWaveC = centre;
    sh.uniforms.uRimTop = uTop;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform vec2 uWaveC;\nvarying float vRimIn;').replace(
      '#include <begin_vertex>',
      [
        '#include <begin_vertex>',
        '#ifdef USE_INSTANCING',
        'vec3 rN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * objectNormal);',
        'vec2 rC = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xz - uWaveC;',
        'float rOut = length(rC) > 1e-3 && length(rN.xz) > 1e-3 ? dot(normalize(rN.xz), normalize(rC)) : 1.0;',
        'vRimIn = abs(rN.y) < 0.5 && rOut < 0.35 ? 1.0 : 0.0;',
        '#else',
        'vRimIn = 0.0;',
        '#endif',
      ].join('\n'),
    );
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uRimTop;\nvarying float vRimIn;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, uRimTop, vRimIn);');
  };
  c.customProgramCacheKey = () => 'bims-hero-rim';
  return c;
}
