// spotlight/streaming · the streaming draft in the spotlight (his decision via main m_12381; the
// hub's partial, amb-core m_12358; how it appears: ambient's text-appearing, m_12403). Owner:
// amb-web. The new app on the scripted core (FakeCore), fn+space from the scripted helper, real
// keys; the core plays bise main's partials as the hub sends them (whole text so far, '' clears).
// Passes when:
//   - the first words show in the spotlight's answer from the first partial, with the '∿' sign
//     after the last word and no caret;
//   - an update adds only the new words: the text already shown never moves or redraws (its box
//     unchanged in every frame of the update), and the new words fade (spans with a stagger)
//     then merge back into plain text;
//   - no frame shows a raw ** or backtick while bold or code is still open; a code line shows
//     only once whole, a table only once its separator came;
//   - '' clears: the '∿' leaves; with reduced motion an update has no fade at all.
import { test, expect, FakeCore, FakeHelper, launchDesktop, Recorder, changedInside, type Box } from '../../harness';

const HOME = 'bise-home-00000000';
const A = 'The cold bench takes 4.1 s because';
const B = 'The cold bench takes 4.1 s because the index is walked twice.';
// not in bise-proto's HubEv yet (amb-core adds it with the hub code): sent as the hub will
type Ev = Parameters<FakeCore['send']>[0];
const partial = (text: string, call = '7.1'): Ev => ({ ev: 'partial', project: HOME, agent: 'main', call, text }) as unknown as Ev;

test('spotlight/streaming: bise main\'s reply streams in, only new words fade, nothing shown moves, no raw marks', async () => {
  test.setTimeout(120_000);
  const core = new FakeCore();
  const helper = new FakeHelper();
  const s = await launchDesktop({ core, helper });
  try {
    const { page, app } = s;
    await page.waitForTimeout(1500);
    await helper.send({ ev: 'fn', act: 'key', key: 'space' });
    await expect.poll(() => app.windows().some((p) => p.url().includes('surface=capsule')), { message: 'the capsule window exists' }).toBe(true);
    const cap = app.windows().find((p) => p.url().includes('surface=capsule'));
    if (!cap) throw new Error('no capsule window');
    const input = cap.locator('[data-testid="spot.input"]');
    await expect(input, 'fn+space opens the spotlight').toBeVisible({ timeout: 5000 });
    await input.click();
    await cap.keyboard.type(`why does p99 rise ${Date.now() % 100000}`);
    await cap.keyboard.press('Enter');
    await core.waitCmd((c) => c['cmd'] === 'send' && c['agent'] === 'main');

    // 1. the first words, at once, with the sign and no caret
    await core.send(partial(A));
    const text = cap.locator('[data-testid="spot.answer.text"]');
    await expect(text, 'the first words show').toContainText(A, { timeout: 1000 });
    await expect(cap.locator('[data-testid="spot.answer.text.sign"]'), "the '∿' rides after the last word").toBeVisible();
    expect(await cap.locator('.b-spot-answer .cur').count(), 'no caret').toBe(0);
    await cap.waitForTimeout(500); // its own fade over
    await cap.screenshot({ path: test.info().outputPath('1-first-words.png') });

    // 2. an update: only the new words fade, the shown text never moves
    const shown: Box = await text.evaluate((el, a) => {
      const r = document.createRange();
      const node = Array.from(el.childNodes).find((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').startsWith(a.slice(0, 10)));
      if (!node) throw new Error('no plain text node for the shown words');
      r.setStart(node, 0);
      r.setEnd(node, a.length);
      const b = r.getBoundingClientRect();
      return { x: b.x, y: b.y, width: b.width, height: b.height };
    }, A);
    const cdp = await cap.context().newCDPSession(cap);
    const rec = new Recorder(cdp, cap);
    const frames = await rec.during(async () => {
      await core.send(partial(B));
      await expect(text).toContainText(B, { timeout: 1000 });
      const fades = await cap.locator('[data-testid="spot.answer.text"] .fade').evaluateAll((els) => els.map((e) => [e.textContent, getComputedStyle(e).getPropertyValue('--d')]));
      expect.soft(fades.map((f) => f[0]).join(''), 'only the new words fade').toBe(' the index is walked twice.');
      expect.soft(new Set(fades.map((f) => f[1])).size, 'staggered').toBeGreaterThan(1);
    }, 600);
    expect.soft(changedInside(frames, shown).filter((n) => n > 0), 'the words already shown never redraw or move').toEqual([]);
    expect.soft(await cap.locator('[data-testid="spot.answer.text"] .fade').count(), 'faded words are plain text again').toBe(0);
    await cap.screenshot({ path: test.info().outputPath('2-update.png') });

    // 3. never a raw mark; code and table rows only once whole
    const steps = [
      `${B}\nThe fix: **cache`,
      `${B}\nThe fix: **cache the walk** in \`ind`,
      `${B}\nThe fix: **cache the walk** in \`index.rs\`.\n\`\`\`rust\nlet idx = Index::wa`,
      `${B}\nThe fix: **cache the walk** in \`index.rs\`.\n\`\`\`rust\nlet idx = Index::walk_once(&root);\n\`\`\`\n| run | time |\n`,
      `${B}\nThe fix: **cache the walk** in \`index.rs\`.\n\`\`\`rust\nlet idx = Index::walk_once(&root);\n\`\`\`\n| run | time |\n|---|---|\n| cold | 2.0 s |\n`,
    ];
    const seen: string[] = [];
    for (const st of steps) {
      await core.send(partial(st));
      await cap.waitForTimeout(300);
      seen.push(await text.innerText());
    }
    for (const t of seen) expect.soft(t, 'no raw ** or backtick in any update').not.toMatch(/\*\*|`/);
    expect.soft(seen[2], 'a half code line waits for its newline').not.toContain('Index::wa');
    expect.soft(seen[3], 'the code line shows once whole').toContain('let idx = Index::walk_once(&root);');
    expect.soft(seen[3], 'a table header waits for its separator').not.toContain('run');
    expect.soft(seen[4], 'the table once its separator and a whole row came').toMatch(/run\s+time\s*\n\s*cold\s+2\.0 s/);
    expect.soft(await cap.locator('[data-testid="spot.answer.text"] strong').first().innerText(), 'bold closed in place').toBe('cache the walk');
    await cap.screenshot({ path: test.info().outputPath('3-blocks.png') });

    // 4. '' clears: the sign leaves, the text stays (the entry takes its place)
    await core.send(partial(''));
    await expect(cap.locator('[data-testid="spot.answer.text.sign"]'), "the '∿' leaves").toHaveCount(0, { timeout: 1000 });
    await expect(text).toContainText('cold');

    // 5. reduced motion: a new call streams with no fade at all
    await cap.emulateMedia({ reducedMotion: 'reduce' });
    await core.send(partial('Also the warm run', '8.1'));
    await expect(text).toContainText('Also the warm run', { timeout: 1000 });
    await core.send(partial('Also the warm run reads the cache.', '8.1'));
    await expect(text).toContainText('reads the cache.', { timeout: 1000 });
    expect(await cap.locator('[data-testid="spot.answer.text"] .fade').count(), 'reduced motion: no fade').toBe(0);
    await cap.screenshot({ path: test.info().outputPath('5-reduced.png') });
    // the same answer in the other theme, for the sign-off sheet
    await cap.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
    await cap.waitForTimeout(300);
    await cap.screenshot({ path: test.info().outputPath('6-dark.png') });
    await cap.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
    await cap.waitForTimeout(300);
    await cap.screenshot({ path: test.info().outputPath('7-light.png') });
  } finally {
    await s.close();
  }
});
