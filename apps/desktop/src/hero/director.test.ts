// The director's rules (bims-film v4): the shot list keeps its holds and its wides, the camera
// leaves before the action, glides never cut, the spring never overshoots, the subject sits in the
// safe frame, and the visitor keeps the camera until he lets it go.
import { describe, expect, it } from 'vitest';
import { FILM_S, FLIGHT_FRAME, KILN, PAGE, SHOTS } from './cast';
import { aimCam, aimInMap, FADE_X, fitCam, glideCam, glideOf, GLIDE_MIN_S, holdCam, inFrame, inside, LEAD_S, MIN_ZOOM, resumes, RESUME_IDLE_S, SAFE, shotAt, springStep, still } from './director';
import { panAround, zoomAround } from './gestures';
import { eggWords } from './overlay';

describe('the shot list', () => {
  it('moves at least every 8 s and holds each shot at least 1 s (bims-film v13)', () => {
    const holds = SHOTS.map((s, i) => ({ s, hold: (SHOTS[i + 1]?.at ?? FILM_S) - s.at }));
    for (const { hold } of holds) {
      expect(hold).toBeGreaterThanOrEqual(1);
      expect(hold).toBeLessThanOrEqual(8);
    }
  });

  it('opens on kiln after the wave and closes on the wide the next wave starts from, the fold kept to the end', () => {
    expect(SHOTS[0]?.subject).toEqual({ k: 'office', office: KILN });
    const last = SHOTS.at(-1);
    expect(last?.size).toBe('wide');
    expect(last?.at).toBe(PAGE.fold);
    expect(shotAt(SHOTS, FILM_S - 0.05)).toBe(SHOTS.length - 1);
    expect(shotAt(SHOTS, 0)).toBe(0);
  });

  it('leaves LEAD_S before the action', () => {
    const k = SHOTS.findIndex((s) => s.at === 76);
    const s = SHOTS[k];
    if (s === undefined) return;
    expect(shotAt(SHOTS, s.at - LEAD_S - 0.01)).toBe(k - 1);
    expect(shotAt(SHOTS, s.at - LEAD_S + 0.01)).toBe(k);
  });

  it('never glides faster than 600 ms', () => {
    for (let i = 1; i < SHOTS.length; i++) {
      const to = SHOTS[i];
      if (to) expect(glideOf(SHOTS[i - 1] ?? null, to).dur).toBeGreaterThanOrEqual(GLIDE_MIN_S);
    }
  });
});

describe('the camera', () => {
  it('fits a box inside the frame it is given', () => {
    const c = fitCam({ u0: 0.4, u1: 0.6, v0: 0.4, v1: 0.6 }, { x0: 0.3, x1: 0.85, y0: 0.1, y1: 0.9 });
    const a = inFrame(c, { u: 0.4, v: 0.4 });
    const b = inFrame(c, { u: 0.6, v: 0.6 });
    expect(a.u).toBeGreaterThanOrEqual(0.3 - 1e-9);
    expect(b.u).toBeLessThanOrEqual(0.85 + 1e-9);
    expect(a.v).toBeGreaterThanOrEqual(0.1 - 1e-9);
    expect(b.v).toBeLessThanOrEqual(0.9 + 1e-9);
  });

  it('puts the subject on the safe point', () => {
    const c = aimCam({ u: 0.5, v: 0.5 }, 4);
    const p = inFrame(c, { u: 0.5, v: 0.5 });
    expect(p.u).toBeCloseTo(SAFE.x);
    expect(p.v).toBeCloseTo(SAFE.y);
  });

  it('never leaves the town', () => {
    const c = holdCam({ zoom: 0.2, u: -3, v: 9 });
    expect(c.zoom).toBe(MIN_ZOOM);
    // farther than the fit: the whole fit stays in view
    expect(inFrame(c, { u: 0, v: 0 }).u).toBeGreaterThanOrEqual(-0.2 - 1e-9);
    expect(inFrame(c, { u: 1, v: 1 }).v).toBeLessThanOrEqual(1.2 + 1e-9);
    const d = holdCam({ zoom: 2, u: -3, v: 9 });
    expect(d).toEqual({ zoom: 2, u: 0.25 - 0.1, v: 0.75 + 0.1 });
  });

  it('glides from one cam to the other, rising halfway when asked', () => {
    const a = { zoom: 6, u: 0.3, v: 0.4 };
    const b = { zoom: 6, u: 0.7, v: 0.6 };
    expect(glideCam(a, b, 0, null)).toEqual(holdCam(a));
    expect(glideCam(a, b, 1, null)).toEqual(holdCam(b));
    expect(glideCam(a, b, 0.5, 3).zoom).toBeCloseTo(3);
  });

  it('follows without overshoot', () => {
    let s = still({ zoom: 2, u: 0.3, v: 0.5 });
    const to = { zoom: 2, u: 0.6, v: 0.5 };
    let max = 0;
    for (let i = 0; i < 300; i++) {
      s = springStep(s, to, 1 / 60);
      max = Math.max(max, s.cam.u);
    }
    expect(max).toBeLessThanOrEqual(0.6 + 1e-9);
    expect(s.cam.u).toBeCloseTo(0.6, 3);
  });
});

describe('the visitor', () => {
  it('keeps the camera while his pointer is on the town or for RESUME_IDLE_S after his last gesture', () => {
    const h = { k: 'visitor' as const, last: 100, follow: null };
    expect(resumes(h, 100 + RESUME_IDLE_S - 1, false)).toBe(false);
    expect(resumes(h, 100 + RESUME_IDLE_S + 1, true)).toBe(false);
    expect(resumes(h, 100 + RESUME_IDLE_S + 1, false)).toBe(true);
    expect(resumes({ k: 'film' }, 1e9, false)).toBe(false);
  });

  it('zooms around his fingers and pans with them', () => {
    const c = zoomAround({ zoom: 2, u: 0.5, v: 0.5 }, 2, 0.25, 0.75);
    const before = { u: 0.5 + (0.25 - 0.5) / 2, v: 0.5 + (0.75 - 0.5) / 2 };
    const p = inFrame(c, before);
    expect(p.u).toBeCloseTo(0.25);
    expect(p.v).toBeCloseTo(0.75);
    const m = panAround({ zoom: 4, u: 0.5, v: 0.5 }, 0.1, 0);
    expect(m.u).toBeCloseTo(0.475);
  });
});

describe('the eggs words', () => {
  it('never jokes with bise signs', () => {
    expect(eggWords('!')).toBe('…');
    expect(eggWords('combo ×2')).toBe('combo ×2');
  });
});

describe('a film shot near the map’s edge', () => {
  it('keeps its subject on its frame point and the lawn under the whole frame but the page’s fade (designer m_32505)', () => {
    const diamond = [
      { u: 0.5, v: 0 },
      { u: 1, v: 0.5 },
      { u: 0.5, v: 1 },
      { u: 0, v: 0.5 },
    ];
    const at = { u: 0.6, v: 0.25 };
    const c = aimInMap(at, 2, SAFE.x, SAFE.y, diamond);
    const p = inFrame(c, at);
    expect(p.u).toBeCloseTo(SAFE.x, 6);
    expect(p.v).toBeCloseTo(SAFE.y, 6);
    for (const [x, y] of [[FADE_X, 0], [1, 0], [FADE_X, 1], [1, 1]] as const) {
      expect(inside(diamond, { u: c.u + (x - 0.5) / c.zoom, v: c.v + (y - 0.5) / c.zoom })).toBe(true);
    }
    // in the middle, nothing to give: its own zoom
    expect(aimInMap({ u: 0.5, v: 0.5 }, 3, SAFE.x, SAFE.y, diamond).zoom).toBe(3);
  });
});

describe("where a film shot puts its subject (designer m_32742: the chat bottom right, the controls top right, the fade 40%)", () => {
  it('is never in the fade, under the feed or under the controls, at any box from 860 px up', () => {
    const points = [SAFE, FLIGHT_FRAME, ...SHOTS.flatMap((s) => (s.frame ? [s.frame] : []))];
    for (const [w, h] of [[860, 640], [1000, 700], [1100, 800], [1440 * 0.6, 900]] as const) {
      const feed = { x0: 1 - (24 + (w * (1 / 0.6) < 1200 ? 260 : 300)) / w, y0: 1 - (24 + 230) / h };
      const controls = { x0: 1 - 200 / w, y1: 64 / h };
      for (const p of points) {
        expect(p.x, `${String(w)}: out of the fade`).toBeGreaterThan(FADE_X);
        expect(p.x >= feed.x0 && p.y >= feed.y0, `${String(w)}x${String(h)}: (${String(p.x)}, ${String(p.y)}) under the feed`).toBe(false);
        expect(p.x >= controls.x0 && p.y <= controls.y1, `${String(w)}: under the controls`).toBe(false);
      }
    }
  });
});
