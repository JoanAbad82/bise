// spotlight/spot-shot · his words (main m_31919): « si je te pose une question avec la spotlight,
// tu vois un screenshot de mon écran ? … l'input de la spotlight [fasse] du line wrapping ».
// The app on the scripted helper and core (fixture world): fn space opens the spotlight, the
// core's {ev:'shot', id} is the still main's Shots asked for. Passes when:
//   - the still shows as a chip first on the field's line ('Safari · stripe.com');
//   - ⏎ sends his words to bise's main with via 'capsule' (the hub's hint) and shot: that id;
//   - the chip's ✕ sends {cmd:'shot_drop', id}; the spotlight closing on a still drops that id;
//   - Screen Recording off: no chip but 'no screenshot · Screen Recording is off', which asks the
//     helper for the pane;
//   - a long ask wraps: the field grows in height, never scrolls sideways, its start in view.
// Writes one sheet for designer: the chip, the wrapped field, the 'no screenshot' chip, light + dark.
// Red before: the field was a one-line <input> (scrollLeft > 0 on a long ask), the ask went as a
// plain send (no via, no shot), the spotlight showed no still.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { test, expect } from '../../harness';
import { CAPSULE, capsulePage, onWorld, sleep, type World } from '../native/world';

const STILL = path.join(__dirname, '../fixtures/checker.png');
const SHOT = (id: number) => ({ ev: 'shot', file: STILL, id, app: 'Safari', title: 'stripe.com' });
const HOME = 'bise-home-00000000';
const LONG =
  'why does the pricing page show the yearly plan at the monthly price when I switch the toggle twice and then reload the page in Safari';
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
const perms = (screen: 'allowed' | 'denied') => ({ ev: 'perms', accessibility: 'allowed', mic: 'allowed', screen });
type Cmd = Record<string, unknown>;
const cmds = (w: World, cmd: string): Cmd[] => w.core.cmds().filter((c) => (c as Cmd)['cmd'] === cmd) as Cmd[];

async function spot(w: World): Promise<Page> {
  const had = w.out.of(CAPSULE).filter((l) => l.startsWith('show top')).length;
  await w.helper.send({ ev: 'fn', act: 'key', key: 'space' } as never);
  await expect.poll(() => w.out.of(CAPSULE).filter((l) => l.startsWith('show top')).length, { timeout: 3000 }).toBeGreaterThan(had);
  const cap = await capsulePage(w.s);
  await expect(cap.getByTestId('spot.input')).toBeVisible({ timeout: 3000 });
  return cap;
}
async function close(w: World, cap: Page): Promise<void> {
  const had = w.out.of(CAPSULE).filter((l) => l === 'hide').length;
  await cap.getByTestId('spot.input').press('Escape');
  await expect.poll(() => w.out.of(CAPSULE).filter((l) => l === 'hide').length, { timeout: 3000 }).toBeGreaterThan(had);
}
/** the field's box: does it scroll sideways, is its start in view, its height */
const fieldBox = (cap: Page) =>
  cap.getByTestId('spot.input').evaluate((el) => {
    const t = el as HTMLTextAreaElement;
    return { tag: t.tagName, sideways: t.scrollWidth > t.clientWidth + 1, left: t.scrollLeft, height: t.getBoundingClientRect().height, line: parseFloat(getComputedStyle(t).lineHeight) };
  });

type Shot = { label: string; png: Buffer };
async function sheet(w: World, shots: readonly Shot[]): Promise<void> {
  const page = await w.s.app.firstWindow();
  const cells = shots
    .map((x) => `<figure class="${x.label.startsWith('dark') ? 'd' : 'l'}"><figcaption>${x.label}</figcaption><img src="data:image/png;base64,${x.png.toString('base64')}"></figure>`)
    .join('');
  await page.setContent(
    `<style>body{margin:0;padding:16px;font:13px -apple-system;display:grid;grid-template-columns:repeat(2,1fr);gap:12px;background:#888}figure{margin:0;padding:10px;border-radius:8px}figure.l{background:#f2f1ee;color:#222}figure.d{background:#16161a;color:#ddd}img{width:100%}</style>${cells}`,
  );
  writeFileSync(test.info().outputPath('spot-shot-sheet.png'), await page.screenshot({ fullPage: true }));
}

test('spotlight/spot-shot: the still rides his ask (via the capsule), ✕ and close drop it; a long ask wraps', async () => {
  const shots: Shot[] = [];
  await onWorld(async (w) => {
    await w.core.send({
      ev: 'projects',
      projects: [{ project: HOME, name: 'bise', path: '/Users/camille/bise', home: true, order: 0, agents: 1, working: 0, waits: 0, git: false, running: true }],
    } as never);
    await w.helper.send(perms('allowed') as never);
    let id = 0;
    for (const t of ['light', 'dark'] as const) {
      await w.core.send(prefs(t) as never);
      const cap = await spot(w);
      await expect.poll(() => cap.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
      id += 1;
      await w.core.send(SHOT(id) as never);
      const chip = cap.getByTestId('spot.shot');
      await expect(chip, `${t}: the still's chip`).toBeVisible({ timeout: 3000 });
      await expect(chip).toContainText('Safari · stripe.com');
      // a long ask: it wraps, grows, never scrolls sideways, its start stays in view
      const field = cap.getByTestId('spot.input');
      await field.click();
      const one = await fieldBox(cap);
      await cap.keyboard.type(LONG);
      const box = await fieldBox(cap);
      expect.soft(box.tag, 'the field wraps (a textarea)').toBe('TEXTAREA');
      expect.soft(box.sideways, `${t}: no sideways scroll`).toBe(false);
      expect.soft(box.left, `${t}: the start of his words in view`).toBe(0);
      expect.soft(box.height, `${t}: the field grew to more lines`).toBeGreaterThan(one.height + box.line / 2);
      await sleep(250);
      shots.push({ label: `${t} · the still and a long ask`, png: await cap.screenshot() });
      if (t === 'light') {
        // ⏎: to bise's main, via the capsule, with that still
        const had = cmds(w, 'send').length;
        await cap.keyboard.press('Enter');
        await expect.poll(() => cmds(w, 'send').length, { timeout: 3000 }).toBe(had + 1);
        const sent = cmds(w, 'send').at(-1) ?? {};
        expect(sent).toMatchObject({ project: HOME, agent: 'main', text: LONG, via: 'capsule', shot: id });
        await w.core.send({ ev: 'shot', file: null } as never);
        await expect(chip).toHaveCount(0);
        await close(w, cap);
        expect(cmds(w, 'shot_drop').filter((c) => c['id'] === id), 'a sent still is never dropped').toEqual([]);
        // the next showing: its ✕ drops that still
        const cap2 = await spot(w);
        id += 1;
        await w.core.send(SHOT(id) as never);
        await expect(cap2.getByTestId('spot.shot')).toBeVisible({ timeout: 3000 });
        await cap2.getByTestId('spot.shot.drop').click();
        await expect.poll(() => cmds(w, 'shot_drop').some((c) => c['id'] === id), { timeout: 3000 }).toBe(true);
        await close(w, cap2);
      } else {
        // closed on its still: that one dropped
        await close(w, cap);
        await expect.poll(() => cmds(w, 'shot_drop').some((c) => c['id'] === id), { timeout: 3000 }).toBe(true);
      }
    }
    // Screen Recording off: no still, the spot says why and opens the pane
    await w.helper.send(perms('denied') as never);
    for (const t of ['light', 'dark'] as const) {
      await w.core.send(prefs(t) as never);
      const cap = await spot(w);
      const why = cap.getByTestId('spot.noshot');
      await expect(why, `${t}: why there is no still`).toHaveText('no screenshot · Screen Recording is off', { timeout: 3000 });
      await sleep(250);
      shots.push({ label: `${t} · no Screen Recording`, png: await cap.screenshot() });
      if (t === 'dark') {
        await why.click();
        await w.helper.waitCmd((c) => {
          const x = c as { cmd?: string; perm?: string; action?: string };
          return x.cmd === 'perm' && x.perm === 'screen' && x.action === 'open';
        });
      }
      await close(w, cap);
    }
    await sheet(w, shots);
  });
});
