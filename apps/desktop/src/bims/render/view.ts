// One canvas's view (page town-live p2, architect m_28994): the WebGL renderer, the 2:1 iso camera
// (camera.ts) set from a Fit, the sky's one hemisphere light and one sun with its soft shadow, and
// the context's loss. The office (render/index.ts) and the town (render/town.ts) each draw their
// scenes through one; what goes in the scene is theirs (office-scene.ts, the townscape). Draws only
// when asked. Owner: bims-wire.
import { DirectionalLight, HemisphereLight, OrthographicCamera, PCFShadowMap, Scene, WebGLRenderer, type ColorRepresentation } from 'three';
import { BACK, DIST, type Fit } from './camera';
import type { Palette } from './palette';
import { STYLE } from './style';

export interface View {
  readonly renderer: WebGLRenderer;
  readonly scene: Scene;
  readonly camera: OrthographicCamera;
  readonly hemi: HemisphereLight;
  readonly sun: DirectionalLight;
  /** the camera looks through this fit (its target, its frustum) */
  look(f: Fit): void;
  /** the canvas's drawing buffer for this fit (css px, the style's pixel ratio at most) */
  size(f: Fit): void;
  /** the backdrop; set again only when it changes */
  sky(c: ColorRepresentation): void;
  /** the palette's sky and sun on the two lights (their place and shadow are the caller's) */
  tint(pal: Palette): void;
  render(): void;
  /** the view as drawn, copied onto a 2d canvas of the same pixel size */
  copyTo(target: HTMLCanvasElement): void;
  readonly lost: () => boolean;
  onLost(cb: () => void): void;
  dispose(): void;
}

export function makeView(canvas: HTMLCanvasElement, o: { readonly shadowAuto: boolean; readonly transparent?: boolean }): View {
  // transparent: the page under the cube shows through (the welcome in the thread's column)
  const clear = o.transparent === true;
  const renderer = new WebGLRenderer({ canvas, antialias: STYLE.antialias, alpha: clear, powerPreference: 'low-power' });
  renderer.shadowMap.enabled = STYLE.shadows;
  // PCF with the sun's radius (three r186 folded PCFSoft into it): one soft shadow
  renderer.shadowMap.type = PCFShadowMap;
  renderer.shadowMap.autoUpdate = o.shadowAuto;
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, DIST * 3);
  const hemi = new HemisphereLight();
  const sun = new DirectionalLight();
  scene.add(hemi, sun, sun.target);
  let lost = false;
  let skyNow: ColorRepresentation | null = null;
  const lostCbs: (() => void)[] = [];
  const onLost = (e: Event): void => {
    e.preventDefault();
    lost = true;
    for (const cb of lostCbs) cb();
  };
  canvas.addEventListener('webglcontextlost', onLost);
  return {
    renderer,
    scene,
    camera,
    hemi,
    sun,
    look(f) {
      const t = f.target;
      camera.position.set(t.x + BACK.x * DIST, t.y + BACK.y * DIST, t.z + BACK.z * DIST);
      camera.up.set(0, 1, 0);
      camera.lookAt(t.x, t.y, t.z);
      camera.left = f.left;
      camera.right = f.right;
      camera.top = f.top;
      camera.bottom = f.bottom;
      camera.updateProjectionMatrix();
    },
    size(f) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, STYLE.maxPixelRatio));
      renderer.setSize(f.widthPx, f.heightPx, false);
    },
    sky(c) {
      if (skyNow !== null && typeof c !== 'object' && skyNow === c) return;
      skyNow = c;
      renderer.setClearColor(c, clear ? 0 : 1);
    },
    tint(pal) {
      hemi.color.set(pal.hemi[0]);
      hemi.groundColor.set(pal.hemi[1]);
      hemi.intensity = pal.hemi[2];
      sun.color.set(pal.sun[0]);
      sun.intensity = pal.sun[1];
    },
    render() {
      renderer.render(scene, camera);
    },
    copyTo(target) {
      // drawn again first: the WebGL buffer is not kept past a frame (no preserveDrawingBuffer)
      renderer.render(scene, camera);
      target.getContext('2d')?.drawImage(canvas, 0, 0, target.width, target.height);
    },
    lost: () => lost,
    onLost(cb) {
      lostCbs.push(cb);
    },
    dispose() {
      canvas.removeEventListener('webglcontextlost', onLost);
      renderer.dispose();
    },
  };
}
