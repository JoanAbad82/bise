// 'show me': one screen in one state, out of his sight, to PNGs. Driven by showme.mjs through the
// env var SHOWME (JSON): { surface, state, framesMs, out, size }.
//   surface  desktop      the app (apps/desktop/out) on the scripted core (fixture world) and helper;
//                         state = a route (bise, inbox, agent/<p>/<a>, ...),
//                         passed as BISE_DESKTOP_ROUTE
//            <file.html>  any page; state = its query string
//   framesMs record that long after the state settles: every drawn frame to frames/NNNN.png + frames.json
// It writes shot.png (the settled screen) and meta.json (surface, state, proof, frame count, fps).
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { changeSeries, FakeCore, FakeHelper, fps, launchDesktop, launchPage, pngBytes, Recorder, test, type Session } from '../index';

type Ask = { surface: string; state?: string; framesMs?: number; out: string; size?: string };

const ask = JSON.parse(process.env['SHOWME'] ?? '{}') as Ask;

async function open(a: Ask): Promise<Session> {
  const o = a.size ? { size: a.size } : {};
  if (a.surface === 'desktop') {
    // the fixture world (every event of rust/proto/fixtures) from the scripted core, and the scripted helper
    return launchDesktop({ ...o, core: new FakeCore(), helper: new FakeHelper(), ...(a.state ? { route: a.state } : {}) });
  }
  const s = await launchPage(a.surface, o);
  if (a.state) await s.page.goto(`${pathToFileURL(path.resolve(a.surface)).href}?${a.state}`);
  return s;
}

test('show me', async () => {
  test.setTimeout(120_000);
  mkdirSync(ask.out, { recursive: true });
  const s = await open(ask);
  try {
    await s.page.waitForLoadState('load');
    await s.page.waitForTimeout(800);
    writeFileSync(path.join(ask.out, 'shot.png'), await s.page.screenshot({ caret: 'initial' }));
    let frames = 0, rate = 0;
    if (ask.framesMs) {
      const rec = new Recorder(s.cdp, s.page);
      const got = await rec.during(() => s.page.waitForTimeout(ask.framesMs ?? 0), 0);
      const dir = path.join(ask.out, 'frames');
      mkdirSync(dir, { recursive: true });
      got.forEach((f, i) => { writeFileSync(path.join(dir, `${String(i).padStart(4, '0')}.png`), pngBytes(f)); });
      const vp = s.page.viewportSize() ?? { width: 0, height: 0 };
      const whole = { x: 0, y: 0, width: vp.width, height: vp.height };
      writeFileSync(path.join(ask.out, 'frames.json'), JSON.stringify({ t: got.map((f) => f.t), change: changeSeries(got, whole) }));
      frames = got.length;
      rate = fps(got);
    }
    writeFileSync(path.join(ask.out, 'meta.json'), JSON.stringify({ ...ask, proof: s.proof, frames, fps: rate }, null, 1));
  } finally {
    await s.close();
  }
});
