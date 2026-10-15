// voice/talk-still · the front window's still on a fn talk (designer m_21903, contract
// ambient-lead m_21911, core amb-core 80c58567, fn ⌫ amb-mac 65679520). Passes when, on the fake
// world:
//   - the core's {ev:'shot'} during a talk shows one row under his words: the image chip
//     'Safari · stripe.com', and the keys line 'fn ⌫ no screenshot';
//   - the chip's ✕ (on hover) and fn ⌫ (the helper's fn key 'delete') each send {cmd:'shot_drop'},
//     and the core's {ev:'shot', file:null} takes the row away while the talk goes on;
//   - with Screen Recording not given and prefs.context.shot absent, a talk shows the ask once:
//     [not now] sets context.shot false, [open System Settings] asks the helper for the pane.
// Writes one sheet for designer: the chip light + dark, the ✕ hovered, the ask light + dark.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { test, expect } from '../../harness';
import { CAPSULE, capsulePage, onWorld, sleep, type World } from '../native/world';

const STILL = path.join(__dirname, '../fixtures/checker.png');
const SHOT = { ev: 'shot', file: STILL, app: 'Safari', title: 'stripe.com' };
const prefs = (theme: 'light' | 'dark', shot: boolean | undefined) => ({
  ev: 'prefs',
  prefs: {
    onboarded: true,
    theme,
    context: { ...(shot === undefined ? {} : { shot }), url: true, file: true, window_text: false },
    excluded_apps: [],
    quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true },
    voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' },
    shots_keep_days: 7,
  },
});
const perms = (screen: 'allowed' | 'ask' | 'denied') => ({ ev: 'perms', accessibility: 'allowed', mic: 'allowed', screen });

/** waits for one more capsule line matching `pred` than there was before `act` */
async function next(w: World, pred: (l: string) => boolean, act: () => Promise<void>, ms = 3000): Promise<void> {
  const had = w.out.of(CAPSULE).filter(pred).length;
  await act();
  await expect.poll(() => w.out.of(CAPSULE).filter(pred).length, { timeout: ms }).toBeGreaterThan(had);
}
async function talk(w: World): Promise<Page> {
  await next(w, (l) => l.startsWith('show corner'), () => w.helper.send({ ev: 'fn', act: 'talk_start', by: 'fn' }));
  return capsulePage(w.s);
}
const esc = (w: World): Promise<void> => next(w, (l) => l === 'hide', () => w.helper.send({ ev: 'fn', act: 'esc' }));
const drops = (w: World): number => w.core.cmds().filter((c) => (c as { cmd?: string }).cmd === 'shot_drop').length;
async function theme(w: World, cap: Page, t: 'light' | 'dark', shot: boolean | undefined): Promise<void> {
  await w.core.send(prefs(t, shot) as never);
  await expect.poll(() => cap.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
}

type Shot = { label: string; png: Buffer };
async function sheet(w: World, shots: readonly Shot[]): Promise<void> {
  const page = await w.s.app.firstWindow();
  const cells = shots
    .map((x) => `<figure class="${x.label.startsWith('dark') ? 'd' : 'l'}"><figcaption>${x.label}</figcaption><img src="data:image/png;base64,${x.png.toString('base64')}"></figure>`)
    .join('');
  await page.setContent(
    `<style>body{margin:0;padding:16px;font:13px -apple-system;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;background:#888}figure{margin:0;padding:10px;border-radius:8px}figure.l{background:#f2f1ee;color:#222}figure.d{background:#16161a;color:#ddd}img{width:100%}</style>${cells}`,
  );
  writeFileSync(test.info().outputPath('talk-still-sheet.png'), await page.screenshot({ fullPage: true }));
  for (const [n, x] of shots.entries()) writeFileSync(test.info().outputPath(`${String(n).padStart(2, '0')}-${x.label.replace(/[^a-z0-9]+/giu, '-')}.png`), x.png);
}

test("voice/talk-still: the still's chip under his words, ✕ and fn ⌫ drop it, the talk goes on; the Screen Recording ask once", async () => {
  const shots: Shot[] = [];
  await onWorld(async (w) => {
    await w.helper.send(perms('allowed') as never);
    const cap = await talk(w);
    await esc(w);
    for (const t of ['light', 'dark'] as const) {
      await theme(w, cap, t, true);
      await talk(w);
      await w.core.send(SHOT as never);
      const row = cap.getByTestId('capsule.shot');
      await expect(row, `${t}: the chip under his words`).toBeVisible({ timeout: 3000 });
      await expect(cap.getByTestId('capsule.shot.chip')).toContainText('Safari · stripe.com');
      await expect(cap.getByTestId('capsule.keys')).toHaveText('fn ⌫ no screenshot');
      await expect(cap.getByTestId('capsule.ask'), 'allowed: no ask').toHaveCount(0);
      // the mouse off the chip: its ✕ shows on hover only
      await cap.mouse.move(1, 1);
      await expect(cap.getByTestId('capsule.shot.drop'), `${t}: no ✕ without hover`).toBeHidden();
      await sleep(250);
      shots.push({ label: `${t} · talking with the still`, png: await cap.screenshot() });

      if (t === 'light') {
        // the ✕ on hover, its click drops it
        await cap.getByTestId('capsule.shot.chip').hover();
        await expect(cap.getByTestId('capsule.shot.drop')).toBeVisible();
        await sleep(150);
        shots.push({ label: `${t} · the chip hovered, its ✕`, png: await cap.screenshot() });
        const had = drops(w);
        await cap.getByTestId('capsule.shot.drop').click();
        await expect.poll(() => drops(w), { timeout: 3000 }).toBe(had + 1);
      } else {
        // fn ⌫: the helper's fn key 'delete' during the talk
        const had = drops(w);
        await w.helper.send({ ev: 'fn', act: 'key', key: 'delete' } as never);
        await expect.poll(() => drops(w), { timeout: 3000 }).toBe(had + 1);
      }
      await w.core.send({ ev: 'shot', file: null } as never);
      await expect(row, `${t}: the row goes`).toHaveCount(0);
      await expect(cap.getByTestId('capsule.keys')).toHaveCount(0);
      await expect(cap.getByTestId('capsule.talk'), `${t}: the talk goes on`).toBeVisible();
      await esc(w);
    }

    // the ask: Screen Recording not given, never asked; 'not now' sets the pref
    await w.helper.send(perms('ask') as never);
    await theme(w, cap, 'light', undefined);
    await talk(w);
    const ask = cap.getByTestId('capsule.ask');
    await expect(ask, 'the ask under his words').toBeVisible({ timeout: 3000 });
    await expect(ask).toContainText("bise can see the window you're on when you talk. it needs Screen Recording for that.");
    // its sentence is t-13 text-2, like the capsule's other lines (designer m_22031)
    const look = await ask.locator('.t').evaluate((el) => {
      const probe = document.createElement('span');
      probe.style.cssText = 'font-size: var(--t-13); color: var(--c-text-2)';
      document.body.append(probe);
      const want = getComputedStyle(probe);
      const got = getComputedStyle(el);
      const r = { size: got.fontSize, color: got.color, wantSize: want.fontSize, wantColor: want.color };
      probe.remove();
      return r;
    });
    expect(look.size, "the ask's sentence is t-13").toBe(look.wantSize);
    expect(look.size).toBe('13px');
    expect(look.color, "the ask's sentence is text-2").toBe(look.wantColor);
    await sleep(250);
    shots.push({ label: 'light · the ask', png: await cap.screenshot() });
    await cap.getByTestId('capsule.ask.later').click();
    await w.core.waitCmd((c) => {
      const x = c as { cmd?: string; key?: string; value?: unknown };
      return x.cmd === 'prefs_set' && x.key === 'context.shot' && x.value === false;
    });
    await expect(ask).toHaveCount(0);
    await esc(w);
    await talk(w);
    await sleep(300);
    await expect(ask, 'asked once').toHaveCount(0);
    await esc(w);
  });

  // the ask in dark, on a fresh run (it shows once a run): [open System Settings] asks the helper
  // for the pane
  await onWorld(async (w) => {
    await w.helper.send(perms('denied') as never);
    await w.core.send(prefs('dark', undefined) as never);
    const cap = await talk(w);
    await expect.poll(() => cap.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe('dark');
    const ask = cap.getByTestId('capsule.ask');
    await expect(ask, 'dark: the ask').toBeVisible({ timeout: 3000 });
    await sleep(250);
    shots.push({ label: 'dark · the ask', png: await cap.screenshot() });
    await cap.getByTestId('capsule.ask.open').click();
    await w.helper.waitCmd((c) => {
      const x = c as { cmd?: string; perm?: string; action?: string };
      return x.cmd === 'perm' && x.perm === 'screen' && x.action === 'open';
    });
    await expect(ask).toHaveCount(0);
    await sheet(w, shots);
  });
});
