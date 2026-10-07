// voice/answer-card · bar N14/L8 (amb-home 5b5b6fac): fn's talk answers the inbox card in front of
// him with the TUI's own rule (voicemode::answers::decide). The new app on the REAL core of a
// throwaway world (tests/checks/real.sh brings it up and down; ../world.ts), its hubs on the fake
// provider, the core's fake voice (BISE_AMBIENT_FAKE_VOICE: the words of a file, read and removed at
// each talk's start, no mic, no speech to text), fn from the scripted helper (FakeHelper: talk_start,
// talk_end as the helper's key machine says them). Run: tests/checks/real.sh voice/answer-card.spec.ts
// Passes when, with the inbox open on a world card:
//   - 'the first one' shows the heard line on that card ('→ 1 … · esc undoes'), and after it the
//     hub holds the card no more (answered through the hub, read from its socket), nothing to main;
//   - the same on the next card, then esc within the heard time: the card stays open in the hub;
//   - words that answer nothing ('what time is the standup tomorrow') show no heard line and reach
//     bise's main (its transcript);
//   - with no card in view (the inbox closed) 'the first one' reaches bise's main, no card answered.
// A card that closed between his look and his talk is the core's law (rust/tui ambient tests
// hubs.rs a_talk_answers_the_card_in_view_as_the_tui_decides), as is decide's agreement with the TUI.
import { unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { FakeHelper, test, expect, type Session } from '../../harness';
import { hubOf, hubState, launchReal, realWorld, transcriptHas, type World } from '../world';

const T = {
  field: '[data-testid="composer.field"]',
  setupSkip: '[data-testid="setup.skip"]',
  inbox: '[data-testid="inbox.root"]',
  item: '[data-testid^="inbox.item."]',
  heard: '[data-testid="inbox.heard"]',
};
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

type Card = { id: number; question?: string; text?: string };
/** every open card of every hub, as 'project:id' */
async function openCards(w: World): Promise<Set<string>> {
  const out = new Set<string>();
  for (const h of w.hubs) {
    const st = await hubState(h.sock);
    for (const c of (st['cards'] as Card[] | undefined) ?? []) out.add(`${h.project}:${String(c.id)}`);
  }
  return out;
}

/** opens the inbox the way ⌘I does: the menu item's click (NSMenu's path; offscreen keys never reach the menu) */
async function openInbox(s: Session): Promise<void> {
  await s.app.evaluate(({ Menu, BrowserWindow }) => {
    const find = (items: Electron.MenuItem[]): Electron.MenuItem | undefined => {
      for (const it of items) {
        if (it.accelerator === 'CmdOrCtrl+I') return it;
        const sub = it.submenu ? find(it.submenu.items) : undefined;
        if (sub) return sub;
      }
      return undefined;
    };
    const it = find(Menu.getApplicationMenu()?.items ?? []);
    const click = it?.click as unknown as ((e: unknown, w: Electron.BrowserWindow | null, c: unknown) => void) | undefined;
    click?.call(it, {}, BrowserWindow.getFocusedWindow(), undefined);
  });
  await expect(s.page.locator(T.inbox), 'the inbox opens').toBeVisible({ timeout: 2000 });
}

/** one talk: the fake voice's words, fn held, fn released */
async function talk(helper: FakeHelper, voice: string, words: string): Promise<void> {
  writeFileSync(voice, words);
  await helper.send({ ev: 'fn', act: 'talk_start', by: 'fn' });
  await sleep(250 + 150 * words.split(/\s+/).length);
  await helper.send({ ev: 'fn', act: 'talk_end' });
}

test('voice/answer-card (real core): his talk answers the card in view as the TUI decides, esc undoes, the rest goes to main', async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const home = hubOf(w, 'bise').project;
  const voice = path.join(w.home, 'tmp', 'qa-native-voice.txt');
  const helper = new FakeHelper();
  const s = await launchReal(w, { helper, env: { BISE_AMBIENT_FAKE_VOICE: voice } });
  try {
    const { page } = s;
    await expect(page.locator(`${T.field}, ${T.setupSkip}`).first()).toBeVisible({ timeout: 15_000 }).catch(() => undefined);
    if (await page.locator(T.setupSkip).isVisible()) await page.locator(T.setupSkip).click();
    await expect(page.locator(T.field).first(), "bise's thread on the real core").toBeVisible({ timeout: 15_000 });
    const before = await openCards(w);
    expect(before.size, 'the world holds at least 2 cards').toBeGreaterThanOrEqual(2);

    // 1. 'the first one' picks 1 on the card in view
    await openInbox(s);
    await sleep(800); // the inbox tells the core its card in view (card_in_view) on mount
    await talk(helper, voice, 'the first one');
    const heard = page.locator(T.heard);
    await expect(heard, 'the heard line on the card').toBeVisible({ timeout: 5000 });
    await expect(heard).toContainText(/→ 1/);
    await expect(heard).toContainText(/esc undoes/);
    await page.screenshot({ path: test.info().outputPath('heard.png') });
    await expect.poll(async () => (await openCards(w)).size, { message: 'after the heard time the hub holds one card fewer', timeout: 8000 }).toBe(before.size - 1);
    expect(transcriptHas(w, home, 'main', 'the first one'), "an answered card's words don't go to main").toBe(false);

    // 2. esc within the heard time undoes it
    const mid = await openCards(w);
    await talk(helper, voice, 'the first one');
    await expect(heard, 'the heard line on the next card').toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Escape');
    await sleep(2500);
    expect((await openCards(w)).size, 'esc undid it: the card is still open in the hub').toBe(mid.size);

    // 3. words that answer nothing go to main
    const lost = 'what time is the standup tomorrow';
    await talk(helper, voice, lost);
    await sleep(1500);
    expect(await heard.isVisible(), 'no heard line for words that answer nothing').toBe(false);
    await expect.poll(() => transcriptHas(w, home, 'main', lost), { message: "a no-match reaches bise's main", timeout: 15_000 }).toBe(true);
    expect((await openCards(w)).size, 'and answers no card').toBe(mid.size);

    // 4. no card in view (the inbox closed): his words go to main
    await page.keyboard.press('Escape');
    await expect(page.locator(T.inbox), 'the inbox closes').toBeHidden({ timeout: 2000 });
    await sleep(800);
    const none = 'the first one, for main this time';
    await talk(helper, voice, none);
    await expect.poll(() => transcriptHas(w, home, 'main', none), { message: "with no card in view the words reach bise's main", timeout: 15_000 }).toBe(true);
    expect((await openCards(w)).size, 'and no card is answered').toBe(mid.size);
  } finally {
    await s.close().catch(() => undefined);
    helper.dispose();
    try { unlinkSync(voice); } catch { /* read and removed by the core */ }
  }
});
