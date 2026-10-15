// a small painted-brush renderer for the identity round 2 (canvas 2D, deterministic).
// a stroke is many bristles along a path: each bristle has its own offset, shade and width;
// the load runs out along the stroke (dry-brush gaps), the ends taper.
(() => {
  const rng = seed => { let s = (seed * 2654435761) >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
  const hex = h => { h = h.replace("#", ""); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  const shade = ([r, g, b], k) => k >= 0 ? [r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k] : [r * (1 + k), g * (1 + k), b * (1 + k)];
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

  // sample a path: [[x,y],...] control points → smooth polyline (Catmull-Rom), ~step px apart
  function sample(pts, step = 4) {
    if (pts.length < 2) return pts.slice();
    const out = [], P = [pts[0], ...pts, pts[pts.length - 1]];
    for (let i = 1; i < P.length - 2; i++) {
      const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
      const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), n = Math.max(2, Math.ceil(len / step));
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  function normals(S) {
    return S.map((p, i) => { const a = S[Math.max(0, i - 1)], b = S[Math.min(S.length - 1, i + 1)]; const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; });
  }
  // the bristles of one brush (kept so a live stroke stays coherent)
  function bristles(o) {
    const R = rng(o.seed || 1), N = o.n || Math.max(6, Math.round(o.w / 1.6));
    return Array.from({ length: N }, (_, b) => ({ off: (b / (N - 1 || 1) - 0.5) * (0.85 + 0.3 * R()), shade: (R() - 0.5) * (o.vary ?? 0.28), lw: (0.55 + 0.9 * R()), dry: R(), seed: R() * 1000 }));
  }
  // o: { w, color, alpha, load (0..1, how far it stays wet), taper, vary, seed, n, press: t=>width factor }
  function stroke(ctx, pts, o) {
    const S = o.sampled ? pts : sample(pts, o.step || 3), Nn = normals(S), base = hex(o.color), B = o.br || bristles(o), R = rng((o.seed || 1) + 7);
    const L = S.length, load = o.load ?? 0.85, alpha = o.alpha ?? 0.9, taper = o.taper ?? 0.18;
    ctx.lineCap = "round";
    for (const br of B) {
      const col = rgba(shade(base, br.shade), 1);
      ctx.strokeStyle = col;
      for (let i = 0; i < L - 1; i++) {
        const t = i / (L - 1);
        const tp = Math.min(1, t / taper, (1 - t) / taper);
        const w = o.w * (o.press ? o.press(t) : 1) * (0.25 + 0.75 * Math.sqrt(Math.max(0, tp)));
        const wet = Math.max(0, 1 - Math.max(0, t - load) / (1 - load + 1e-6));
        if (wet < 1 && R() > wet * 0.9 + br.dry * 0.15) continue; // dry-brush gaps
        const a = alpha * (0.35 + 0.65 * wet) * (0.7 + 0.3 * Math.sin(br.seed + t * 20));
        if (a <= 0.01) continue;
        ctx.globalAlpha = a;
        ctx.lineWidth = Math.max(0.4, (o.w / B.length) * 1.7 * br.lw * (0.4 + 0.6 * tp));
        const p = S[i], q = S[i + 1], n = Nn[i], m = Nn[i + 1];
        const w2 = o.w * (o.press ? o.press((i + 1) / (L - 1)) : 1) * (0.25 + 0.75 * Math.sqrt(Math.max(0, Math.min(1, (t + 1 / L) / taper, (1 - t - 1 / L) / taper))));
        ctx.beginPath(); ctx.moveTo(p[0] + n[0] * br.off * w, p[1] + n[1] * br.off * w); ctx.lineTo(q[0] + m[0] * br.off * w2, q[1] + m[1] * br.off * w2); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }
  // a dab: a short fat stroke (impasto: a light edge)
  function dab(ctx, x, y, size, color, o = {}) {
    const a = (o.angle ?? -20) * Math.PI / 180, l = size * (o.long ?? 0.9);
    const pts = [[x - Math.cos(a) * l / 2, y - Math.sin(a) * l / 2], [x, y + (o.bow ?? 0)], [x + Math.cos(a) * l / 2, y + Math.sin(a) * l / 2]];
    stroke(ctx, pts, { w: size, color, alpha: o.alpha ?? 0.95, load: 1, taper: 0.45, vary: o.vary ?? 0.3, seed: o.seed ?? (x * 7 + y * 13), n: o.n });
    if (o.light) stroke(ctx, pts.map(p => [p[0] - size * 0.12, p[1] - size * 0.18]), { w: size * 0.3, color: o.light, alpha: 0.55, load: 0.6, taper: 0.4, seed: (o.seed ?? 3) + 1, n: 4 });
  }
  // cover a region (an ellipse) with strokes along an angle, softer toward its edge
  function scumble(ctx, cx, cy, rx, ry, o) {
    const R = rng(o.seed || 5), n = o.count || 120, out = [];
    for (let i = 0; i < n; i++) {
      const r = Math.sqrt(R()) * (o.core ?? 1), th = R() * Math.PI * 2, x = cx + Math.cos(th) * rx * r, y = cy + Math.sin(th) * ry * r;
      const edge = 1 - r, ang = (o.angle ?? 0) + (R() - 0.5) * (o.spread ?? 20), len = (o.len ?? 80) * (0.6 + 0.8 * R()), a = ang * Math.PI / 180;
      const col = o.colors[Math.floor(R() * o.colors.length)];
      out.push({ pts: [[x - Math.cos(a) * len / 2, y - Math.sin(a) * len / 2], [x + (R() - 0.5) * 4, y + (R() - 0.5) * 4], [x + Math.cos(a) * len / 2, y + Math.sin(a) * len / 2]],
        o: { w: (o.w ?? 18) * (0.7 + 0.6 * R()), color: col, alpha: (o.alpha ?? 0.5) * (0.35 + 0.65 * Math.pow(edge, o.soft ?? 0.7)), load: 0.55 + 0.4 * R(), taper: 0.3, vary: o.vary ?? 0.2, seed: i * 31 + (o.seed || 5) } });
    }
    if (o.order === "out") out.sort((a, b) => Math.hypot(a.pts[1][0] - cx, a.pts[1][1] - cy) - Math.hypot(b.pts[1][0] - cx, b.pts[1][1] - cy));
    if (!o.defer) out.forEach(s => stroke(ctx, s.pts, s.o));
    return out;
  }
  // a toned, woven ground
  function ground(ctx, w, h, color, o = {}) {
    ctx.fillStyle = color; ctx.fillRect(0, 0, w, h);
    const R = rng(o.seed || 9), base = hex(color);
    for (let i = 0; i < (o.count ?? w * h / 900); i++) {
      const x = R() * w, y = R() * h, l = 6 + R() * 26, a = (o.angle ?? 0) + (R() - 0.5) * 30;
      ctx.strokeStyle = rgba(shade(base, (R() - 0.5) * (o.vary ?? 0.12)), 0.5); ctx.lineWidth = 0.6 + R() * 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a * Math.PI / 180) * l, y + Math.sin(a * Math.PI / 180) * l); ctx.stroke();
    }
  }
  window.BRUSH = { rng, sample, stroke, dab, scumble, ground, bristles, hex, shade, rgba };
})();
