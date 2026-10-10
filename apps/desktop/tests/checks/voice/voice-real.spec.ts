// voice/voice-real · voice mode with the agent in view on the REAL core of a throwaway world
// (bar V12/W24/L21/N13; ambient-lead m_16788). Owner: amb-core.
// The app's own core (`bise ambient-core`, the world's bise) runs voice mode with voicemode's fakes
// (BISE_VOICE_FAKE: a 16 kHz WAV as the mic, paced, then silence; BISE_VOICE_FAKE_HEARD: what the
// listener hears; a silent synth on a speaker with a clock): no mic, no sound, no network. The agent
// is shop's checkout on the world's fake provider, which answers 'ack: <his words>'. fn comes from the
// scripted helper (FakeHelper). Run: tests/checks/real.sh voice/voice-real.spec.ts
// Passes when, on shop's checkout (its own thread):
//   - ctrl+r twice in the composer turns voice mode on there: the pane in the composer's place,
//     labelled 'voice mode · with checkout' (the pane follows the core's voice_mode events only);
//   - his heard words show in the pane and reach checkout on shop's hub (its transcript), never
//     shop's main;
//   - checkout's answer comes back said: the pane turns 'speaking', the answer's words in the thread;
//   - fn while it is on is refused by the core: the label line says 'fn talks to bise again when
//     you leave voice mode' for 3 s;
//   - esc ends it: the core's voice_mode off takes the pane away and the composer is back.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { FakeHelper, test, expect, type Session } from '../../harness';
import { hubOf, launchReal, realWorld, transcriptHas, type World } from '../world';

const T = {
  field: '[data-testid="composer.field"]',
  setupSkip: '[data-testid="setup.skip"]',
  pane: '[data-testid="voice.pane"]',
  label: '[data-testid="voice.label"]',
  words: '[data-testid="voice.words"]',
  list: '[data-testid="thread.list"]',
};
const FN_WAITS = 'fn talks to bise again when you leave voice mode';
const AGENT = 'checkout';
const REPO = path.resolve(__dirname, '..', '..', '..', '..', '..');
const WAV = path.join(REPO, 'rust', 'tui', 'src', 'voicemode', 'testdata', 'sentence.wav');

/** The app on checkout's thread with voice mode's fakes; a fresh world's first-run setup is skipped first. */
async function launchVoice(w: World, route: string, heard: string): Promise<{ s: Session; helper: FakeHelper }> {
  const env = { BISE_VOICE_FAKE: WAV, BISE_VOICE_FAKE_HEARD: heard };
  let helper = new FakeHelper();
  let s = await launchReal(w, { route, helper, env });
  await s.page.locator(`${T.field}, ${T.setupSkip}`).first().waitFor({ timeout: 15_000 }).catch(() => undefined);
  if (await s.page.locator(T.setupSkip).isVisible()) {
    await s.page.locator(T.setupSkip).click();
    await s.page.waitForTimeout(500);
    await s.close();
    helper = new FakeHelper();
    s = await launchReal(w, { route, helper, env });
  }
  return { s, helper };
}

test('voice/voice-real (real core): ctrl+r twice on checkout, his words reach it, its answer is said, fn refused, esc ends it', async () => {
  test.setTimeout(180_000);
  const w = realWorld();
  expect(existsSync(WAV), `voicemode's test WAV at ${WAV}`).toBe(true);
  const project = path.basename(path.dirname(hubOf(w, 'shop').sock));
  // letters only: what voice mode says skips ids and hashes (letters and digits mixed, speak.rs
  // classify), so a 'vm812499' token is in checkout's answer but never in the said words
  const n = `vm${String(Date.now() % 1_000_000).replace(/\d/g, (d) => 'abcdefghij'.charAt(Number(d)))}`;
  const heard = `check the cart total ${n}`;
  const note = (type: string, v: unknown) => test.info().annotations.push({ type, description: typeof v === 'string' ? v : JSON.stringify(v) });
  const { s, helper } = await launchVoice(w, `agent/${project}/${AGENT}`, heard);
  try {
    const { page } = s;
    const field = page.locator(T.field).first();
    await expect(field, "checkout's thread on the real core").toBeVisible({ timeout: 15_000 });
    const pane = page.locator(T.pane);

    await test.step('ctrl+r twice: voice mode on checkout, the pane in the composer place', async () => {
      await field.click();
      const t0 = Date.now();
      await page.keyboard.press('Control+r');
      await page.keyboard.press('Control+r');
      await expect(pane, "the pane (the core's voice_mode on)").toBeVisible({ timeout: 10_000 });
      note('pane_ms', Date.now() - t0);
      await expect.soft(page.locator(T.label)).toHaveText(`voice mode · with ${AGENT}`);
      await expect.soft(page.locator(T.field), 'the composer gave its place').toHaveCount(0);
    });

    await test.step('his heard words show, then reach checkout on its project, never shop main', async () => {
      await expect.soft.poll(async () => ((await page.locator(T.words).textContent().catch(() => '')) ?? '').includes(n) || transcriptHas(w, 'shop', AGENT, heard),
        { timeout: 20_000, message: 'the heard words in the pane' }).toBe(true);
      await expect.poll(() => transcriptHas(w, 'shop', AGENT, heard), { timeout: 45_000, message: 'checkout got his words' }).toBe(true);
      expect.soft(transcriptHas(w, 'shop', 'main', heard), "shop's main never got them").toBe(false);
    });

    let litPos = '';
    await test.step("checkout's answer comes back said, its row lit while it speaks", async () => {
      await expect(pane, 'speaking').toHaveAttribute('data-state', 'speaking', { timeout: 45_000 });
      // the bar says only 'speaking' (/p/voice-window); the answer's words are in the thread
      await expect.soft(page.locator(T.words), 'the bar').toHaveText('speaking');
      await expect.soft(page.locator(T.list), "the answer's words in the thread").toContainText(n, { timeout: 10_000 });
      note('said', ((await page.locator(T.words).textContent()) ?? '').trim());
      // the lit ink (the core's voice_mode.lit, amb-web 79dcf3d1): checkout's answer row, and only
      // it, carries '∿ speaking' under it and its words split in ink (said) and faint (not yet)
      const mark = page.locator(`${T.list} [data-testid^="thread.voice."][data-mark="speaking"]`);
      await expect(mark, "'∿ speaking' under one answer").toHaveCount(1, { timeout: 5000 });
      await expect.soft(mark).toHaveText('∿ speaking');
      litPos = ((await mark.getAttribute('data-testid')) ?? '').replace('thread.voice.', '');
      note('lit_pos', litPos);
      await expect(page.getByTestId(`thread.entry.${litPos}`), "the lit row is checkout's answer").toContainText(n);
      const ink = page.locator(`[data-testid="thread.lit.${litPos}"] .vm-said`);
      await expect(ink, 'its said words in ink, the rest faint, while it speaks').toBeAttached({ timeout: 5000 });
      const inked: string[] = [];
      while ((await pane.getAttribute('data-state')) === 'speaking' && inked.length < 40) {
        const t = await ink.textContent({ timeout: 200 }).catch(() => null);
        if (t !== null && inked.at(-1) !== t) inked.push(t);
        await page.waitForTimeout(150);
      }
      note('inked', inked);
      expect.soft(inked.every((t, i) => i === 0 || t.startsWith(inked[i - 1] ?? '')), 'the ink only grows').toBe(true);
      await page.screenshot({ path: test.info().outputPath('speaking.png') });
      // its voice ends: the pane listens again
      await expect.soft(pane, 'listening after the answer').toHaveAttribute('data-state', 'listening', { timeout: 30_000 });
      await expect.soft(page.getByTestId(`thread.voice.${litPos}`), "no '∿ speaking' once it stopped talking").toHaveCount(0);
      note('lit_after_speaking', await page.getByTestId(`thread.lit.${litPos}`).count());
    });

    await test.step('his next turn (tab, typed, sent): the lit goes from that answer', async () => {
      await pane.focus();
      await page.keyboard.press('Tab');
      const typing = page.locator(T.field).first();
      await expect(typing, 'tab: the composer back to type').toBeVisible({ timeout: 5000 });
      const next = `and the shipping ${n}x`;
      await typing.click();
      await page.keyboard.type(next);
      await page.keyboard.press('Enter');
      await expect.poll(() => transcriptHas(w, 'shop', AGENT, next), { timeout: 45_000, message: 'checkout got his typed turn' }).toBe(true);
      await expect(page.getByTestId(`thread.lit.${litPos}`), 'the old answer: no ink').toHaveCount(0, { timeout: 5000 });
      await expect(page.getByTestId(`thread.voice.${litPos}`), "the old answer: no '∿ speaking'").toHaveCount(0);
      // the typed turn's answer is said in turn, and its own row is the one lit
      await expect.soft(pane, 'its answer said').toHaveAttribute('data-state', 'speaking', { timeout: 45_000 });
      const mark = page.locator(`${T.list} [data-testid^="thread.voice."][data-mark="speaking"]`);
      await expect.soft(mark, 'the new answer lit').toHaveCount(1, { timeout: 5000 });
      const pos2 = ((await mark.getAttribute('data-testid', { timeout: 1000 }).catch(() => '')) ?? '').replace('thread.voice.', '');
      note('lit_pos_next', pos2);
      expect.soft(pos2 !== '' && pos2 !== litPos, 'another row than the first answer').toBe(true);
      await expect.soft(pane, 'listening after it').toHaveAttribute('data-state', 'listening', { timeout: 30_000 });
    });

    await test.step('fn while it is on: refused, the label line says so', async () => {
      await helper.send({ ev: 'fn', act: 'talk_start', by: 'fn' });
      await expect(page.locator(T.label), 'fn waits').toHaveText(FN_WAITS, { timeout: 5000 });
      await helper.send({ ev: 'fn', act: 'talk_end' });
      await page.screenshot({ path: test.info().outputPath('fn-waits.png') });
      await expect.soft(page.locator(T.label), 'the label again after 3 s').toHaveText(`voice mode · with ${AGENT}`, { timeout: 6000 });
    });

    await test.step('esc ends it: the core says off, the composer is back', async () => {
      await pane.focus();
      await page.keyboard.press('Escape');
      await expect(pane, "the pane goes (the core's voice_mode off)").toHaveCount(0, { timeout: 10_000 });
      await expect(page.locator(T.field).first(), 'the composer is back').toBeVisible({ timeout: 5000 });
    });
  } finally {
    await s.close();
  }
});
