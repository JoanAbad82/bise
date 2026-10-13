// voice/talk-over-sheet · a fn talk the core ends without a send (amb-core 96db3e08, designer
// m_21945): the capsule never stays on 'bise is thinking…'. Passes when, in light and dark, on the
// fake world:
//   - a final 'heard' with no words says 'i didn't hear anything. hold fn and talk.';
//   - the core's 'voice needs a key' says designer's words with the 'settings › voice' link;
//   - the home hub's stop line (3 starts in 2 minutes) passes through as said;
//   - his words answering a card (voice_answer) say '✓ answered acme', then the capsule goes.
// Writes one sheet of the 4 states, light + dark, for designer.
import { writeFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { test, expect } from '../../harness';
import { CAPSULE, capsulePage, onWorld, sleep, type World } from '../native/world';

const P = 'acme-1a2b3c4d';
const prefs = (theme: 'light' | 'dark') => ({
  ev: 'prefs',
  prefs: {
    onboarded: true,
    theme,
    context: { shot: true, url: true, file: true, window_text: false },
    excluded_apps: [],
    quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true },
    voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' },
    shots_keep_days: 7,
  },
});
const STOP = "bise stopped 3 times in 2 minutes (the hub exited: journal.jsonl line 812 isn't json). your next fn talk starts it again.";
const STATES: readonly { name: string; ev: Record<string, unknown>; says: string }[] = [
  { name: 'nothing heard', ev: { ev: 'heard', text: '', final: true }, says: "i didn't hear anything. hold fn and talk." },
  { name: 'no voice key', ev: { ev: 'error', cmd: 'talk_start', text: 'voice needs a key. /voice picks one.' }, says: 'bise needs a voice key to hear you. settings › voice' },
  { name: 'the stop line', ev: { ev: 'error', text: STOP }, says: STOP },
  { name: 'answered', ev: { ev: 'voice_answer', project: P, card: 9, n: 1, line: 'heard "the first one" → 1 cold', ms: 1500 }, says: '✓ answered acme' },
];

/** waits for one more capsule line matching `pred` than there was before `act` */
async function next(w: World, pred: (l: string) => boolean, act: () => Promise<void>, ms = 3000): Promise<void> {
  const had = w.out.of(CAPSULE).filter(pred).length;
  await act();
  await expect.poll(() => w.out.of(CAPSULE).filter(pred).length, { timeout: ms }).toBeGreaterThan(had);
}
const hidden = (l: string): boolean => l === 'hide';

async function talk(w: World): Promise<Page> {
  await next(w, (l) => l.startsWith('show bottom'), () => w.helper.send({ ev: 'fn', act: 'talk_start', by: 'fn' }));
  return capsulePage(w.s);
}
const esc = (w: World): Promise<void> => next(w, hidden, () => w.helper.send({ ev: 'fn', act: 'esc' }));

test('voice/talk-over-sheet: a talk the core ends says why, in light and dark; a card answered fades', async () => {
  const shots: { label: string; png: Buffer }[] = [];
  await onWorld(async (w) => {
    const cap = await talk(w);
    await esc(w);
    for (const t of ['light', 'dark'] as const) {
      await w.core.send(prefs(t) as never);
      await expect.poll(() => cap.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
      for (const s of STATES) {
        await talk(w);
        const line = cap.getByTestId('capsule.talk');
        if (s.name === 'answered') {
          // it goes by itself (OVER_FADE_MS), no esc: shot while it shows
          await next(
            w,
            hidden,
            async () => {
              await w.core.send(s.ev as never);
              await expect(line, `${t} · ${s.name}`).toHaveText(s.says, { timeout: 1000 });
              await sleep(150);
              shots.push({ label: `${t} · ${s.name}`, png: await cap.screenshot() });
            },
            5000,
          );
          continue;
        }
        await w.core.send(s.ev as never);
        await expect(line, `${t} · ${s.name}`).toHaveText(s.says, { timeout: 3000 });
        if (s.name === 'no voice key') await expect(cap.getByTestId('capsule.over.link')).toHaveText('settings › voice');
        await sleep(250);
        shots.push({ label: `${t} · ${s.name}`, png: await cap.screenshot() });
        await esc(w);
      }
    }
    // the sheet: every still, labelled, on its theme's ground
    const page = await w.s.app.firstWindow();
    const cells = shots
      .map((x) => `<figure class="${x.label.startsWith('dark') ? 'd' : 'l'}"><figcaption>${x.label}</figcaption><img src="data:image/png;base64,${x.png.toString('base64')}"></figure>`)
      .join('');
    await page.setContent(
      `<style>body{margin:0;padding:16px;font:13px -apple-system;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;background:#888}figure{margin:0;padding:10px;border-radius:8px}figure.l{background:#f2f1ee;color:#222}figure.d{background:#16161a;color:#ddd}img{width:100%}</style>${cells}`,
    );
    writeFileSync(test.info().outputPath('talk-over-sheet.png'), await page.screenshot({ fullPage: true }));
    for (const [n, x] of shots.entries()) writeFileSync(test.info().outputPath(`${String(n).padStart(2, '0')}-${x.label.replace(/[^a-z0-9]+/giu, '-')}.png`), x.png);
  });
});
