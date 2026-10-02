// bise ambient · the kiss face, 41 × 18 dots. Pure. A port of rust/tui/src/voicemode/kiss.rs
// (`frame`), number for number: the colon on the left, the mouth on the right; at rest the
// sideways smile `)`, thinking the turning `*`, speaking the open mouth and its arcs, the kiss.
// The constellation draws these dots in light; reduced motion draws `face("rest")` still.
(function (root) {
  "use strict";

  const FW = 41, FH = 18;
  const CX = 23, CY = 8.5;
  const BREATH_MS = 1200, TURN_MS = 150, QUIET = 0.08, STILL_LEVEL = 0.45;
  const BLINK_EVERY_MS = 4200, BLINK_MS = 180, KISS_MS = 1000;
  const SMILE_H = 5.5, SMILE = 3, SMILE_IN = 3.6, SMILE_TALK = 3.5;
  const PUFF = [[9, -2, 2], [12, -3, 2], [14, -4, 1.5]], PUFF_MS = 120;
  const KISS_PUCKER_MS = 150, KISS_BLOW_MS = 300, KISS_SMILE_MS = 800;

  function arcsFor(v) {
    return v < 0.15 ? 0 : v < 0.4 ? 1 : v < 0.7 ? 2 : 3;
  }

  // pose: listen | talk | think | speak | kiss | rest; ms: the time in the pose (the kiss) or the
  // clock (blinks, breath, the turning *); lvl: main's voice 0..1; still: one still frame.
  // Returns FH rows of FW 0/1 dots.
  function face(pose, ms, lvl, still) {
    const D = Array.from({ length: FH }, () => new Uint8Array(FW));
    // JS Math.round, as kiss.rs's `set`
    const set = (x, y) => {
      x = Math.floor(x + 0.5); y = Math.floor(y + 0.5);
      if (x >= 0 && y >= 0 && x < FW && y < FH) D[y][x] = 1;
    };
    const eyes = (shut) => {
      for (const y0 of [4, 11]) for (let y = y0; y < y0 + 3; y++) {
        if (shut && y !== y0 + 1) continue;
        for (let x = 6; x < 10; x++) set(x, y);
      }
    };
    const starAt = (r, rot, x0, y0) => {
      for (let a = 0; a < 3; a++) {
        const g = rot + a * Math.PI / 3;
        for (let s = -r; s <= r; s += 0.25) {
          const x = x0 + s * Math.sin(g) * 1.15, y = y0 - s * Math.cos(g);
          set(x, y); set(x + 0.5, y);
        }
      }
    };
    const star = (r, rot) => starAt(r, rot, CX, CY);
    const paren = (h, b) => {
      for (let y = CY - h; y <= CY + h; y += 0.25) {
        const u = (y - CY) / h, x = CX - 1.5 + b * (1 - u * u);
        set(x, y); set(x + 1, y);
      }
    };
    const ring = (rx, ry) => {
      const ix = Math.max(0.5, rx - 1.7), iy = Math.max(0.5, ry - 1.4);
      for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
        const dx = x - CX, dy = y - CY;
        if ((dx / rx) ** 2 + (dy / ry) ** 2 <= 1 && (dx / ix) ** 2 + (dy / iy) ** 2 > 1) D[y][x] = 1;
      }
    };
    const arcs = (v) => {
      for (let j = 0; j < arcsFor(v); j++) {
        const rx = 12 + 2.5 * j, ry = 5.5 + 1.5 * j;
        for (let a = -0.9; a <= 0.9; a += 0.04) set(CX + rx * Math.cos(a), CY + ry * Math.sin(a));
      }
    };
    const kiss = (k) => {
      if (k < KISS_PUCKER_MS) return paren(SMILE_H, 1.2);
      if (k < KISS_BLOW_MS) return star(3, 0);
      if (k < KISS_SMILE_MS) {
        star(5, 0);
        const p = PUFF[Math.floor((k - KISS_BLOW_MS) / PUFF_MS)];
        if (p) starAt(p[2], 0, CX + p[0], CY + p[1]);
        return;
      }
      paren(SMILE_H, SMILE);
    };
    const breathing = () => paren(SMILE_H, !still && Math.floor(ms / BREATH_MS) % 2 === 1 ? SMILE_IN : SMILE);

    ms = Math.max(0, ms || 0);
    // the eyes blink now and then; never while it speaks or kisses
    const blinks = pose === "kiss" ? ms >= KISS_MS : pose !== "speak";
    eyes(!still && blinks && ms % BLINK_EVERY_MS >= BLINK_EVERY_MS - BLINK_MS);
    if (pose === "listen") breathing();
    else if (pose === "talk") paren(SMILE_H, SMILE_TALK);
    else if (pose === "think") star(5, ((still ? 0 : Math.floor(ms / TURN_MS)) % 24) * Math.PI / 12);
    else if (pose === "speak") {
      const v = still ? STILL_LEVEL : Math.min(1, Math.max(0, lvl || 0));
      if (v < QUIET) breathing(); else { ring(4.5 + v * 2.5, 1.8 + v * 6.5); arcs(v); }
    } else if (pose === "kiss" && !still && ms < KISS_MS) kiss(ms);
    else if (pose === "kiss") breathing();
    else paren(SMILE_H, SMILE);
    return D;
  }

  // the dots as half blocks (the terminal's rows), for check.mjs against kiss.rs
  function blocks(D) {
    const rows = [];
    for (let r = 0; r < FH / 2; r++) {
      let s = "";
      for (let x = 0; x < FW; x++) {
        const a = D[2 * r][x], b = D[2 * r + 1][x];
        s += a && b ? "█" : a ? "▀" : b ? "▄" : " ";
      }
      rows.push(s);
    }
    return rows;
  }

  // the inked dots as [x, y] in a unit box centred on the face (the constellation's targets)
  function dots(D) {
    const out = [];
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) if (D[y][x]) out.push([(x - 21) / 19, -(y - 8.5) / 19]);
    return out;
  }

  root.AmbFace = { face, blocks, dots, arcsFor, FW, FH, KISS_MS, BLINK_EVERY_MS };
})(typeof window !== "undefined" ? window : globalThis);
