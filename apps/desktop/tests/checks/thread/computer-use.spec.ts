// thread/computer-use · S29/L19 on the REAL core (amb-core bf199372 rows, amb-win 69269638 window),
// next to the TUI on the same hub, ambient-lead m_16661 / m_16676. Owner: qa-flows.
// Runs on amb-core's fake computer-use world (its l19 plan, the QA seam: a fake state.json writer and
// a fake ctl socket that answers pause/resume/stop/peek with a canned still, under the throwaway
// home's paths, never his browser or apps). Until the seam is on ambient-app the check skips itself.
// The seam as this check calls it (to match amb-core's when it lands):
//   qa.py world computer <project> <agent> driving|paused|stopped|none [place]   one agent's state
//   qa.py world computer-log                                                    the ctl calls, JSON
// Passes when, on shop's checkout (its own thread), next to the TUI:
//   - driving: the window's line says the core's words ('↖ driving Chrome · amazon.fr', then the
//     window's ' · N min'), 'take the wheel' and 'stop' are there, the sidebar's checkout row has
//     its '↖' mark, and the TUI's status row says the same words;
//   - 'take the wheel' reaches the fake broker (a pause for checkout) and the line turns to
//     '? you took the wheel · ⏎ give it back' (paused) in both;
//   - ⏎ on the empty composer while paused hands it back (a resume, nothing sent to checkout) and the
//     line turns back to driving;
//   - stopped: a message to checkout hands it back first (a resume), then the message reaches it;
//   - a click on the words opens the peek (the canned still); esc closes only it: the line stays and
//     no stop reaches the broker.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubOf, launchOn, realWorld, transcriptHas, tui, tuiAgents, tuiClick, tuiReady, type Tui } from '../world';

const T = {
  field: '[data-testid="composer.field"]',
  line: '[data-testid="thread.computer"]',
  words: '[data-testid="thread.computer.words"]',
  take: '[data-testid="thread.computer.take"]',
  stop: '[data-testid="thread.computer.stop"]',
  back: '[data-testid="thread.computer.back"]',
  peek: '[data-testid="thread.computer.peek"]',
  mark: '[data-testid="app.sidebar.agent.checkout.computer"]',
};
const AGENT = 'checkout';
const PLACE = 'Chrome · amazon.fr';
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

// as world.ts's own qa(): from the repo's root (qa.py finds the world from there; without the cwd
// it said 'no world up' and the first run skipped itself)
// (one folder deeper than world.ts: tests/checks/thread)
const REPO = path.resolve(__dirname, '..', '..', '..', '..', '..');
const QA = path.join(REPO, '.agents', 'plugins', 'ambient-qa', 'qa.py');
const qa = (args: string[]): string => execFileSync('python3', ['-B', QA, ...args], { cwd: REPO, encoding: 'utf8', timeout: 60_000, stdio: ['ignore', 'pipe', 'pipe'] });
/** Whether the fake computer-use world is there (amb-core's seam, 197d9c59): skipped only when qa.py has no such command. */
function seam(): boolean {
  try {
    qa(['world', 'computer-log']);
    return true;
  } catch (e) {
    const why = String((e as { stderr?: unknown }).stderr ?? e);
    if (/invalid choice|unknown|unrecognized/i.test(why)) return false;
    throw new Error(`qa.py world computer-log failed: ${why.slice(-400)}`);
  }
}
const setState = (state: 'driving' | 'paused' | 'stopped' | 'none') => qa(['world', 'computer', 'shop', AGENT, state, ...(state === 'none' ? [] : [PLACE])]);
const ctlCalls = (): { act: string; agent?: string }[] => {
  try {
    return JSON.parse(qa(['world', 'computer-log'])) as { act: string; agent?: string }[];
  } catch {
    return [];
  }
};
const flat = (s: string): string => s.replace(/\s+/g, ' ');

test("thread/computer-use: the live line, take, ⏎ gives it back, a message to a stopped agent hands back, the peek, next to the TUI", async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  test.skip(!seam(), "amb-core's fake computer-use world (qa.py world computer) isn't on this branch yet");
  const shop = hubOf(w, 'shop');
  const project = path.basename(path.dirname(shop.sock));
  const n = `cu${String(Date.now() % 1_000_000)}`;
  const note = (type: string, v: unknown) => test.info().annotations.push({ type, description: typeof v === 'string' ? v : JSON.stringify(v) });
  const s = await launchOn(w, `agent/${project}/${AGENT}`, T.field);
  let t: Tui | undefined;
  try {
    const { page } = s;
    await expect(page.locator(T.field).first(), "checkout's thread").toBeVisible({ timeout: 15_000 });
    t = tui(w, 'shop');
    await tuiReady(t);
    // the TUI opens on main's thread: its live line is checkout's, shown with checkout in view (a
    // click on its panel row, as his mouse does); the first run read main's screen and missed it
    // by its panel number (⌥N, the TUI's own key): a click on the word lands on the first
    // 'checkout' of the screen, an inbox card's words (second run)
    const num = tuiAgents(t.screen()).find((a) => a.name === AGENT)?.n;
    if (num !== undefined) t.keys(`M-${String(num)}`);
    else tuiClick(t, AGENT);
    await sleep(1500);
    test.info().attachments.push({ name: 'tui-on-checkout', contentType: 'text/plain', body: Buffer.from(t.screen()) });
    const term = t;
    const acts = (act: string) => ctlCalls().filter((c) => c.act === act && (c.agent === undefined || c.agent === AGENT)).length;

    await test.step('driving: the line, its acts, the sidebar mark, the TUI says the same', async () => {
      setState('driving');
      const line = page.locator(T.line);
      await expect.soft(line, 'the live line').toHaveAttribute('data-state', 'driving', { timeout: 10_000 });
      await expect.soft(page.locator(T.words), "the core's words").toContainText(`↖ driving ${PLACE}`, { timeout: 5000 });
      await expect.soft(page.locator(T.take), 'take the wheel').toBeVisible();
      await expect.soft(page.locator(T.stop), 'stop').toBeVisible();
      await expect.soft(page.locator(T.mark), "the sidebar's mark on checkout").toBeVisible({ timeout: 5000 });
      await expect.soft.poll(() => flat(term.screen()).includes(`driving ${PLACE}`), { timeout: 10_000, message: "the TUI's row says the same" }).toBe(true);
      note('driving', { window: ((await page.locator(T.words).textContent()) ?? '').trim() });
      await page.screenshot({ path: test.info().outputPath('driving.png') });
    });

    await test.step('take the wheel: a pause, then paused in both', async () => {
      const before = acts('pause');
      await page.locator(T.take).click();
      await expect.soft.poll(() => acts('pause'), { timeout: 10_000, message: 'the broker got a pause for checkout' }).toBeGreaterThan(before);
      await expect.soft(page.locator(T.line), 'paused').toHaveAttribute('data-state', 'paused', { timeout: 10_000 });
      // amb-win e93879d4: the words '? you took the wheel', the act a button 'give it back ⏎'
      await expect.soft(page.locator(T.words), "the core's words").toContainText('? you took the wheel', { timeout: 5000 });
      await expect.soft(page.locator(T.back), "its 'give it back' button").toContainText('give it back', { timeout: 5000 });
      await expect.soft.poll(() => flat(term.screen()).includes('you took the wheel'), { timeout: 10_000, message: "the TUI's row says the same" }).toBe(true);
      await page.screenshot({ path: test.info().outputPath('paused.png') });
    });

    await test.step('⏎ on the empty composer gives it back, nothing sent', async () => {
      const before = acts('resume');
      const field = page.locator(T.field).first();
      await field.click();
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.press('Backspace');
      await page.keyboard.press('Enter');
      await expect.soft.poll(() => acts('resume'), { timeout: 10_000, message: 'the broker got a resume' }).toBeGreaterThan(before);
      await expect.soft(page.locator(T.line), 'driving again').toHaveAttribute('data-state', 'driving', { timeout: 10_000 });
      expect.soft(transcriptHas(w, 'shop', AGENT, 'sb you'), 'no message reached checkout').toBe(false);
    });

    await test.step('stopped: a message hands it back first, then reaches checkout', async () => {
      setState('stopped');
      await expect.soft(page.locator(T.line), 'stopped').toHaveAttribute('data-state', 'stopped', { timeout: 10_000 });
      note('stopped', { window: ((await page.locator(T.words).textContent()) ?? '').trim() });
      await page.screenshot({ path: test.info().outputPath('stopped.png') });
      const before = acts('resume');
      const field = page.locator(T.field).first();
      await field.click();
      await page.keyboard.type(`go on with the cart ${n}`);
      await page.keyboard.press('Enter');
      await expect.soft.poll(() => acts('resume'), { timeout: 10_000, message: 'the broker got a resume (hand back)' }).toBeGreaterThan(before);
      await expect.soft.poll(() => transcriptHas(w, 'shop', AGENT, `go on with the cart ${n}`), { timeout: 30_000, message: 'then the message reached checkout' }).toBe(true);
    });

    await test.step('the peek: a click opens the still, esc closes only it', async () => {
      setState('driving');
      await expect(page.locator(T.line)).toHaveAttribute('data-state', 'driving', { timeout: 10_000 });
      const stops = acts('stop');
      await page.locator(T.words).click();
      await expect.soft(page.locator(T.peek), 'the still opens').toBeVisible({ timeout: 10_000 });
      await expect.soft(page.locator(`${T.peek} img`), 'with an image').toBeVisible({ timeout: 10_000 });
      await page.screenshot({ path: test.info().outputPath('peek.png') });
      await page.keyboard.press('Escape');
      await expect.soft(page.locator(T.peek), 'esc closes the still').toBeHidden({ timeout: 5000 });
      await expect.soft(page.locator(T.line), 'and only it: the line stays').toHaveAttribute('data-state', 'driving');
      await sleep(1000);
      expect.soft(acts('stop'), 'no stop reached the broker').toBe(stops);
    });
    setState('none');
  } finally {
    t?.close();
    await s.close();
  }
});
