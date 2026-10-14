// The live pearl (bar ⛔1p, his bug 2: the old pearl flickered): one canvas, one WebGL1 context,
// created once and never re-mounted by a mood or a level change. Props land in a ref; one
// requestAnimationFrame loop eases the mood (moods.ts) and draws at the display's rate while the
// pearl moves (bise works or listens: moods.ts MOVES), and stops once it has settled in any other
// mood: at rest the pearl is one still frame, no loop (ambient-lead m_11707: battery, and his
// 'clignote très bizarrement'); under reduced motion it is always still. A new mood, level or size
// wakes the loop for as long as it needs. The drawing buffer is
// square, sized only when the element's size changes (a ResizeObserver), never per frame: a resize
// clears the buffer, and a cleared frame is a flicker. No CSS transform ever lands on the canvas
// (a scaled WebGL canvas showed as a thin sliver in round 9); the size is the `size` prop and the
// shader's zoom. The background stays transparent: the pearl floats free (lead m_6479, L1).
import { memo, useEffect, useRef, type JSX } from 'react';
import { ease, moves, settled, start, type Mood, type PearlState } from './moods';
import { ARM, EYE_R, EYES, markStroke, STAR } from '../shared/mark';
import { FRAGMENT, markFragment, PINK, VERTEX } from './shader';

export interface LivePearlProps {
  readonly mood: Mood;
  /** The voice level 0..1 (the mic while listening, the voice while speaking). */
  readonly level?: number;
  /** Reduced motion: stands still in every mood (its tint still eases). */
  readonly still?: boolean;
  /** The once-ever hello (ambient m_5702): gathers out of scattered dots over 1.2 s. */
  readonly hello?: boolean;
  /** CSS pixels, square. */
  readonly size: number;
  /** The shader's zoom (1 fills the canvas): grows the pearl without a transform. */
  readonly zoom?: number;
  readonly testId?: string;
  /**
   * The large ':*' in mist instead of the ball (designer's bise-presence v10: onboarding hello,
   * bise's empty thread), in the theme's ink, the ':*' in its accent when he's waited on.
   */
  readonly glyph?: boolean;
}

const HELLO_MS = 1200;
/** Under this many CSS px the pearl is the still CSS one (no WebGL). */
export const SMALL = 20;
/** The moods a small pearl draws in ink; every other one is pink (it calls him or bise is busy). */
const INK: ReadonlySet<Mood> = new Set<Mood>(['rest', 'still', 'away']);
const UNIFORMS = ['res', 't', 'flow', 'variant', 'lvl', 'think', 'need', 'done', 'away', 'listen', 'still', 'gather', 'zoom', 'INK', 'ACC'] as const;
const MARK = markFragment({ eyes: EYES, eyeR: EYE_R, star: STAR, arm: ARM, stroke: markStroke(120) });

/** A CSS colour as 0..1 RGB, through a 2D canvas's fillStyle (it normalizes any CSS colour); null when it can't. */
function rgbOf(css: string): [number, number, number] | null {
  const ctx = document.createElement('canvas').getContext('2d');
  if (ctx === null || css.trim() === '') return null;
  ctx.fillStyle = '#000';
  ctx.fillStyle = css.trim();
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(ctx.fillStyle);
  if (m === null) return null;
  return [parseInt(m[1] ?? '0', 16) / 255, parseInt(m[2] ?? '0', 16) / 255, parseInt(m[3] ?? '0', 16) / 255];
}

interface Gl {
  readonly gl: WebGLRenderingContext;
  readonly u: Readonly<Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>>;
}

function setup(cv: HTMLCanvasElement, glyph: boolean): Gl | null {
  const gl = cv.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  if (gl === null) return null;
  const shader = (type: number, src: string): WebGLShader | null => {
    const s = gl.createShader(type);
    if (s === null) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (gl.getShaderParameter(s, gl.COMPILE_STATUS) !== true) console.error('pearl', gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  const vs = shader(gl.VERTEX_SHADER, VERTEX);
  const fs = shader(gl.FRAGMENT_SHADER, glyph ? MARK : FRAGMENT);
  if (vs === null || fs === null) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = Object.fromEntries(UNIFORMS.map((k) => [k, gl.getUniformLocation(prog, k)])) as Gl['u'];
  for (const [k, v] of Object.entries(PINK)) gl.uniform3fv(gl.getUniformLocation(prog, k), v);
  gl.uniform1f(u.variant, 1);
  return { gl, u };
}

export const LivePearl = memo(function LivePearl(props: LivePearlProps): JSX.Element {
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef(props);
  const wake = useRef<() => void>(() => undefined);
  useEffect(() => {
    live.current = props;
    wake.current(); // a new mood may need the loop again (it sleeps once settled and still)
  });

  useEffect(() => {
    const cv = canvas.current;
    if (cv === null) return;
    const glyph = live.current.glyph === true;
    const g = setup(cv, glyph);
    if (g === null) return;
    const { gl, u } = g;
    // the mark's ink and accent: the theme's, read again when it changes (his pref or the system's)
    const tint = (): void => {
      if (!glyph) return;
      const css = getComputedStyle(cv);
      gl.uniform3fv(u.INK, rgbOf(css.getPropertyValue('--c-text')) ?? [0.5, 0.5, 0.5]);
      gl.uniform3fv(u.ACC, rgbOf(css.getPropertyValue('--c-accent')) ?? [0.96, 0.65, 0.69]);
    };
    tint();
    const retint = (): void => {
      tint();
      wake.current();
    };
    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    scheme.addEventListener('change', retint);
    const themed = new MutationObserver(retint);
    themed.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style', 'class'] });
    let s: PearlState = start(Math.random() * 40);
    let last: number | null = null;
    let raf = 0;
    let helloAt: number | null = null;

    const fit = (): void => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const side = Math.max(1, Math.round(live.current.size * dpr));
      if (cv.width !== side || cv.height !== side) {
        cv.width = side;
        cv.height = side;
      }
    };

    const frame = (now: number): void => {
      raf = 0;
      const p = live.current;
      const t = now / 1000;
      const dt = last === null ? 1 : Math.max(0, t - last);
      last = t;
      const reduce = p.still === true;
      const level = p.level ?? 0;
      s = ease(s, p.mood, level, dt, reduce);
      if (p.hello === true && helloAt === null) helloAt = now;
      const gather = helloAt === null || reduce ? 0 : Math.max(0, 1 - (now - helloAt) / HELLO_MS);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform2f(u.res, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform1f(u.t, s.clock);
      gl.uniform1f(u.flow, s.flow);
      gl.uniform1f(u.lvl, s.voice * level);
      gl.uniform1f(u.think, s.think);
      gl.uniform1f(u.need, s.need);
      gl.uniform1f(u.done, s.done);
      gl.uniform1f(u.away, s.away);
      gl.uniform1f(u.listen, s.listen);
      gl.uniform1f(u.still, s.still);
      gl.uniform1f(u.gather, gather);
      gl.uniform1f(u.zoom, p.zoom ?? 1);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      const calm = !moves(p.mood, reduce) && settled(s, p.mood, reduce) && gather === 0;
      if (!calm) raf = requestAnimationFrame(frame);
    };

    wake.current = () => {
      if (raf === 0) raf = requestAnimationFrame(frame);
    };
    fit();
    const ro = new ResizeObserver(() => {
      fit();
      wake.current();
    });
    ro.observe(cv);
    raf = requestAnimationFrame(frame);
    return () => {
      ro.disconnect();
      themed.disconnect();
      scheme.removeEventListener('change', retint);
      if (raf !== 0) cancelAnimationFrame(raf);
      wake.current = () => undefined;
    };
  }, []);

  if (props.size < SMALL && props.glyph !== true) {
    // under 20 px the shader's dot grid (6 px cells) has no room: in the harness the 14 px pearl
    // drew nothing, on his Mac a white square with a corner smudge (designer's try gate D3). A
    // small pearl is the still CSS one, pink in a mood that calls him, ink otherwise; no WebGL.
    const ink = INK.has(props.mood);
    return (
      <span
        className="b-live-pearl sm"
        style={{
          width: props.size,
          height: props.size,
          display: 'block',
          borderRadius: '50%',
          background: ink
            ? 'radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--c-text) 85%, transparent), color-mix(in srgb, var(--c-text) 30%, transparent) 70%)'
            : 'radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--c-accent) 60%, white), var(--c-accent) 70%)',
        }}
        data-mood={props.mood}
        data-tone={ink ? 'ink' : 'pink'}
        data-testid={props.testId ?? 'pearl'}
        aria-hidden="true"
      />
    );
  }
  return (
    <canvas
      ref={canvas}
      className="b-live-pearl"
      width={1}
      height={1}
      style={{ width: props.size, height: props.size, display: 'block', background: 'transparent' }}
      data-mood={props.mood}
      data-testid={props.testId ?? 'pearl'}
      aria-hidden="true"
    />
  );
});
