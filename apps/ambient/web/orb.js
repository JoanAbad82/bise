// bise ambient · the orb: the constellation (SPEC §1). 1,500 points of light, additive, a gaussian
// sprite. Calm (rest, thinking, the kiss) they draw the kiss face (face.js); talking (you, main,
// listening) they become a sphere of radius 0.78 that turns and ripples with the voice. Between the
// two, a smoothstep morph. Reduced motion: the still pixel smile, drawn once in 2D.
//
//   const orb = AmbOrb.create(glCanvas, stillCanvas)
//   orb.frame({ pose, poseMs, lvl, need, still, frozen }, nowMs)   // once per animation frame
//
// The numbers are the mock's (site/content/ambient/orbs.js, cloud()).
(function (root) {
  "use strict";
  const F = root.AmbFace;

  const NP = 1500;
  const PINK = [0.957, 0.651, 0.69], CREAM = [1, 0.93, 0.88];

  // the points project themselves (z pushed back 3.2, focal 2.25) and grow when near
  const VS = `precision highp float;
attribute vec3 pos; attribute float k;
uniform float psz;
varying float vk; varying float vz;
void main(){
  vec3 p = pos; p.z += 3.2;
  gl_Position = vec4(p.x * 2.25 / p.z, p.y * 2.25 / p.z, 0., 1.);
  gl_PointSize = psz * (3.2 / p.z);
  vk = k; vz = p.z;
}`;
  // a gaussian sprite whose opacity follows depth; 20% of the points are cream
  const FS = `precision highp float;
varying float vk; varying float vz;
void main(){
  vec2 c = gl_PointCoord - .5;
  float a = exp(-dot(c, c) * 22.) * clamp(1.1 - (vz - 2.4) * .6, .25, 1.2) * .55;
  vec3 col = mix(vec3(${PINK.join(",")}), vec3(${CREAM.join(",")}), vk);
  gl_FragColor = vec4(col * a, a);
}`;

  // the sphere (a Fibonacci lattice) and each point's own jitter, fixed
  const SPH = new Float32Array(NP * 3), JIT = new Float32Array(NP * 3), KIND = new Float32Array(NP);
  for (let i = 0; i < NP; i++) {
    const y = 1 - ((i + 0.5) / NP) * 2, r = Math.sqrt(1 - y * y), th = i * 2.39996;
    SPH[i * 3] = Math.cos(th) * r; SPH[i * 3 + 1] = y; SPH[i * 3 + 2] = Math.sin(th) * r;
    const h = (n) => { const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };
    JIT[i * 3] = h(1) - 0.5; JIT[i * 3 + 1] = h(2) - 0.5; JIT[i * 3 + 2] = h(3) - 0.5;
    KIND[i] = h(4) < 0.2 ? 1 : 0;
  }

  // the smoothed state: SPEC's rates (the morph 1 - 0.02^dt, the poses 1 - 0.002^dt, the level faster)
  function smoother() {
    return { lvl: 0, listen: 0, think: 0, speak: 0, need: 0, face: 1, flow: 0, last: null };
  }
  function smooth(S, st, t) {
    const dt = S.last == null ? 0 : Math.max(0, Math.min(0.5, t - S.last));
    S.last = t;
    const p = st.pose;
    const tg = { listen: p === "listen" || p === "talk" ? 1 : 0, think: p === "think" ? 1 : 0, speak: p === "speak" ? 1 : 0, need: st.need ? 1 : 0 };
    const k = 1 - Math.pow(0.002, dt), kl = 1 - Math.pow(0.00002, dt);
    for (const n in tg) S[n] += (tg[n] - S[n]) * k;
    S.lvl += ((st.lvl || 0) - S.lvl) * kl;
    // flow, the speed of everything, per second
    S.flow += dt * (0.6 + 0.8 * S.listen + 3.2 * S.lvl + 2.2 * S.think + 0.8 * S.speak);
    const faceT = p === "rest" || p === "kiss" || p === "think" ? 1 : 0;
    S.face += (faceT - S.face) * (1 - Math.pow(0.02, dt));
    if (Math.abs(S.face - faceT) < 1e-3) S.face = faceT;
    if (S.need < 1e-3 && !tg.need) S.need = 0;
    if (S.lvl < 1e-3 && !st.lvl) S.lvl = 0;
    return S;
  }

  function compile(gl) {
    const sh = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  function create(cv, stillCv) {
    let gl = null, G = null, failed = false;
    const S = smoother();
    const pos = new Float32Array(NP * 3);
    let lastKey = "", stillDrawn = "", mode = "";

    function setup() {
      gl = cv.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: false, powerPreference: "low-power" });
      if (!gl) { failed = true; return; }
      try {
        const prog = compile(gl);
        G = { prog, pb: gl.createBuffer(), kb: gl.createBuffer(), aPos: gl.getAttribLocation(prog, "pos"), aK: gl.getAttribLocation(prog, "k"), uPsz: gl.getUniformLocation(prog, "psz") };
        gl.bindBuffer(gl.ARRAY_BUFFER, G.kb); gl.bufferData(gl.ARRAY_BUFFER, KIND, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, G.pb); gl.bufferData(gl.ARRAY_BUFFER, pos.byteLength, gl.DYNAMIC_DRAW);
        failed = false; lastKey = "";
      } catch (e) {
        console.error("orb", e); failed = true;
      }
    }
    cv.addEventListener("webglcontextlost", (e) => { e.preventDefault(); failed = true; G = null; });
    cv.addEventListener("webglcontextrestored", () => setup());
    setup();

    function fit(c) {
      const dpr = Math.min(2, root.devicePixelRatio || 1);
      const w = Math.round((c.clientWidth || 112) * dpr), h = Math.round((c.clientHeight || 112) * dpr);
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; return true; }
      return false;
    }

    // the still pixel smile: face("rest") in round pink dots, drawn once
    function still() {
      const resized = fit(stillCv);
      const key = stillCv.width + "x" + stillCv.height;
      if (!resized && stillDrawn === key) return;
      stillDrawn = key;
      const g = stillCv.getContext("2d"), w = stillCv.width, h = stillCv.height;
      const D = F.face("rest", 0, 0, true);
      const cell = Math.min(w / 45, h / 20), ox = (w - F.FW * cell) / 2, oy = (h - F.FH * cell) / 2;
      g.clearRect(0, 0, w, h); g.fillStyle = "#f4a6b0";
      for (let y = 0; y < F.FH; y++) for (let x = 0; x < F.FW; x++) if (D[y][x]) {
        g.beginPath(); g.arc(ox + x * cell + cell / 2, oy + y * cell + cell / 2, cell * 0.42, 0, 7); g.fill();
      }
    }

    // one frame; returns whether it drew (a settled face is not redrawn)
    function frame(st, nowMs) {
      const useStill = st.still || failed;
      if ((useStill ? "still" : "gl") !== mode) {
        mode = useStill ? "still" : "gl";
        cv.style.display = useStill ? "none" : ""; stillCv.style.display = useStill ? "" : "none";
        lastKey = ""; S.last = null;
      }
      if (useStill) { still(); return false; }
      const t = nowMs / 1000;
      smooth(S, st, t);
      const resized = fit(cv);

      const fpose = st.pose === "kiss" ? "kiss" : st.pose === "think" ? "think" : "rest";
      // frozen (failed, an error): the face held still, no blink
      const D = F.face(fpose, st.poseMs, 0, !!st.frozen);
      // settled on the face, nothing moving: keep the last frame (the always-on capsule sips power)
      const settled = S.face === 1 && S.need === 0 && S.lvl === 0 && S.listen < 1e-3 && S.speak < 1e-3;
      const key = settled ? F.blocks(D).join("") : "";
      if (settled && !resized && key === lastKey) return false;
      lastKey = key;

      const T = F.dots(D);
      const ry = S.flow * 0.35, rx = 0.35 + 0.15 * Math.sin(t * 0.4);
      const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
      const m = S.face * S.face * (3 - 2 * S.face);
      // needs you: the sphere breathes ±6%; the face breathes with it
      const breathe = 1 + S.need * 0.06 * Math.sin(t * 6);
      const amp = 0.05 + 0.3 * S.lvl, fl = S.flow;
      for (let i = 0; i < NP; i++) {
        let x = SPH[i * 3], y = SPH[i * 3 + 1], z = SPH[i * 3 + 2];
        let x2 = 0, y2 = 0, z2 = 0;
        if (m < 1) {
          const n = Math.sin(x * 3 + fl * 1.3) * Math.sin(y * 3.4 - fl) * Math.sin(z * 2.7 + fl * 0.7);
          const n2 = Math.sin(x * 7 - fl * 2) * Math.sin(y * 6 + fl * 1.7) * 0.5;
          const rr = 0.78 * (1 + (n * 0.6 + n2) * amp + 0.05 * S.listen * Math.sin(t * 2 + y * 4)) * breathe;
          x *= rr; y *= rr; z *= rr;
          x2 = x * cy + z * sy; z2 = -x * sy + z * cy;
          y2 = y * cx - z2 * sx; z2 = y * sx + z2 * cx;
        }
        let fx = x2, fy = y2, fz = z2;
        if (T.length) {
          const d = T[(i * 7) % T.length];
          fx = (d[0] + JIT[i * 3] * 0.03) * breathe; fy = (d[1] + JIT[i * 3 + 1] * 0.03) * breathe; fz = JIT[i * 3 + 2] * 0.08;
        }
        pos[i * 3] = x2 + (fx - x2) * m; pos[i * 3 + 1] = y2 + (fy - y2) * m; pos[i * 3 + 2] = z2 + (fz - z2) * m;
      }

      const w = cv.width, h = cv.height;
      gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(G.prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, G.pb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);
      gl.enableVertexAttribArray(G.aPos); gl.vertexAttribPointer(G.aPos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, G.kb);
      gl.enableVertexAttribArray(G.aK); gl.vertexAttribPointer(G.aK, 1, gl.FLOAT, false, 0, 0);
      gl.uniform1f(G.uPsz, Math.max(3, h / 40) * (1 + 0.4 * S.lvl));
      gl.drawArrays(gl.POINTS, 0, NP);
      return true;
    }

    return { frame, state: () => ({ ...S, failed }) };
  }

  root.AmbOrb = { create, NP };
})(typeof window !== "undefined" ? window : globalThis);
