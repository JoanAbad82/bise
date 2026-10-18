// bims/avoid · bims never walk through each other (task bims-avoid), on FakeCore rows, off screen:
// 12 bims, half at work and half idle, then the two halves swap twice, so most of the office walks
// across at once. It records the office's canvas (CDP screencast) through both swaps and counts,
// from the renderer's own trace, the frames where two bims came closer than two bodies while one
// walked. Frames: .harness-cache/bims-shots/avoid-<CLIP_TAG>/ (frame-NNNN.png, times.json), the
// before/after clip bims signs. Passes when no walking pair came that close. Owner: bims-avoid.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { test, expect, Recorder } from '../../harness';
import { agent, mainAgent, snap } from '../../../src/bims/fixtures';
import { BODY_R } from '../../../src/bims/avoid';
import { P, open, probe, rowsOf, settle, showOffice, sleep, type Placed } from './world';

test.describe.configure({ timeout: 240_000 });

const A = ['ada', 'bob', 'cy', 'dee', 'eli', 'fay'];
const B = ['gus', 'hal', 'ivy', 'jo', 'kit', 'lou'];
const rows = (work: readonly string[]) =>
  snap([mainAgent({ status: 'working' }), ...[...A, ...B].map((n) => agent(n, { status: work.includes(n) ? 'working' : 'idle' }))]);

/** the trace's walking pairs closer than two bodies: one line each (time, names, distance) */
function close(trace: readonly Placed[]): string[] {
  const byT = new Map<number, Placed[]>();
  for (const p of trace) byT.set(p.t, [...(byT.get(p.t) ?? []), p]);
  const last = new Map<string, Placed>();
  const out: string[] = [];
  for (const t of [...byT.keys()].sort((x, y) => x - y)) {
    const now = byT.get(t) ?? [];
    const moved = new Set(now.filter((p) => { const q = last.get(p.name); return q !== undefined && Math.hypot(p.x - q.x, p.z - q.z) > 1e-4; }).map((p) => p.name));
    for (let i = 0; i < now.length; i++) {
      for (let j = i + 1; j < now.length; j++) {
        const a = now[i] as Placed;
        const b = now[j] as Placed;
        if (!moved.has(a.name) && !moved.has(b.name)) continue;
        if (a.op < 0.5 || b.op < 0.5) continue;
        const d = Math.hypot(a.x - b.x, a.z - b.z);
        if (d < 2 * BODY_R) out.push(`${t.toFixed(2)} ${a.name}~${b.name} ${d.toFixed(2)}`);
      }
    }
    for (const p of now) last.set(p.name, p);
  }
  return out;
}

test('bims walk round each other: two halves of the office swap places twice', async () => {
  const tag = process.env['CLIP_TAG'] ?? 'after';
  const dir = path.resolve(__dirname, '..', '..', '..', '.harness-cache', 'bims-shots', `avoid-${tag}`);
  mkdirSync(dir, { recursive: true });
  const { s, core } = await open(rows(A), { width: 1400 });
  const errors: string[] = [];
  s.page.on('pageerror', (e) => errors.push(String(e)));
  s.page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  try {
    await showOffice(s);
    // a grown office (stage 9: the lounge, the terrace), the same for the before and after films
    const g = { jobs_done: 100, days_used: 14, artifacts_made: 120 };
    await s.page.evaluate((x) => { (window as unknown as { __biseGrow?: unknown }).__biseGrow = x; }, g);
    await core.send({ ev: 'growth', project: P, growth: g } as never);
    await settle(s, 1500, 15_000);
    const canvas = await s.page.getByTestId('app.right.bims.canvas').boundingBox();
    if (canvas === null) throw new Error('no office canvas');
    const rec = new Recorder(s.cdp, s.page);
    await rec.start();
    await core.send(rowsOf(rows(B)) as never);
    await sleep(9000);
    await core.send(rowsOf(rows(A)) as never);
    await sleep(9000);
    const frames = await rec.stop();
    const trace = (await probe(s.page))?.trace ?? [];
    // the canvas, cropped from each frame
    const times: number[] = [];
    frames.forEach((f, i) => {
      const k = f.scale;
      const x0 = Math.round(canvas.x * k);
      const y0 = Math.round(canvas.y * k);
      const w = Math.min(Math.round(canvas.width * k), f.png.width - x0);
      const h = Math.min(Math.round(canvas.height * k), f.png.height - y0);
      const out = new PNG({ width: w, height: h });
      PNG.bitblt(f.png, out, x0, y0, w, h, 0, 0);
      writeFileSync(path.join(dir, `frame-${String(i).padStart(4, '0')}.png`), PNG.sync.write(out));
      times.push(f.t);
    });
    const breaks = close(trace);
    writeFileSync(path.join(dir, 'times.json'), JSON.stringify({ times, breaks, traced: trace.length, project: P, errors }));
    expect(frames.length, 'the swaps were filmed').toBeGreaterThan(30);
    if (tag === 'after') expect(breaks, 'no two walking bims closer than two bodies').toEqual([]);
  } finally {
    await s.close();
  }
});
