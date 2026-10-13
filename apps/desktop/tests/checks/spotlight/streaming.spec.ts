// spotlight/streaming · the streaming draft in the spotlight (his decision via main m_12381; the
// hub's partial, amb-core m_12358; how it appears: ambient's text-appearing, m_12403). Owner:
// amb-web. The new app on the scripted core (FakeCore), fn+space from the scripted helper, real
// keys; the core plays bise main's partials as the hub sends them (R40: the new text at its
// offset, '' clears).
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
// sent as the hub sends since R40 (main 35509c3b): only the new text at `off`, in UTF-16 units (a
// JS string's length); off 0 starts again (a new call too), '' at 0 clears. One sender per test.
type Ev = Parameters<FakeCore['send']>[0];
const deltas = () => {
  let last = { call: '', text: '' };
  return (text: string, call = '7.1'): Ev => {
    const off = text !== '' && call === last.call && text.startsWith(last.text) ? last.text.length : 0;
    last = { call, text };
    return { ev: 'partial', project: HOME, agent: 'main', call, off, text: text.slice(off) } as unknown as Ev;
  };
};

test('spotlight/streaming: bise main\'s reply streams in, only new words fade, nothing shown moves, no raw marks', async () => {
  test.setTimeout(120_000);
  const partial = deltas();
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
    const subMain = (c: Record<string, unknown>): boolean => c['cmd'] === 'subscribe' && c['agent'] === 'main' && c['project'] === HOME;
    const subsBefore = core.cmds().filter(subMain).length;
    await cap.keyboard.press('Enter');
    await core.waitCmd((c) => c['cmd'] === 'send' && c['agent'] === 'main');
    // R18 (qa-native m_12853): another window's unsubscribe dropped the capsule's follow of main
    // (one set per project in the core), so the answer never came: the ask follows main again
    // first, and the fresh page it brings back (main's older answers) is never taken for his answer
    const cmds = core.cmds();
    const sendAt = cmds.findIndex((c) => c['cmd'] === 'send' && c['agent'] === 'main');
    const subAts = cmds.map((c, i) => (subMain(c) ? i : -1)).filter((i) => i >= 0);
    expect(subAts.length, 'the ask subscribes to main again').toBeGreaterThan(subsBefore);
    expect(subAts[subsBefore] ?? Infinity, 'before it sends').toBeLessThan(sendAt);
    await core.send({ ev: 'thread', project: HOME, agent: 'main', entries: [{ pos: 900_000, at_ms: Date.now() - 60_000, kind: 'agent', text: 'an older answer of main' }], before: null, more: false } as unknown as Ev);
    await cap.waitForTimeout(300);

    // 0. his ask shows it went before any word comes back (R18 on 723648da: the spot fell back
    // to its list with no sign of the ask): 'asked bise' with the '∿', in the answer's place
    const answer = cap.locator('[data-testid="spot.answer"]');
    await expect(answer, 'the ask shows at once, before bise answers').toHaveAttribute('data-state', 'asked', { timeout: 1000 });
    await expect(answer).toContainText('asked bise');
    await expect(answer, 'an older answer in the fresh page is not his').not.toContainText('an older answer');
    await expect(cap.locator('[data-testid="spot.answer.text.sign"]'), "the '∿' while bise writes").toBeVisible();

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

// designer m_12432 + ambient m_12433: the '∿' after a code box or a table (in its bottom margin,
// out of the layout, so its leaving moves nothing), the table drawn as the thread's, main's card
// rows read 'bise', the dark panel (a stand-in for the glass behind it), and the capsule's 320 px
// cap: a long spoken answer keeps its first lines above, scrolled, the newest at the bottom.
test("spotlight/streaming: the '∿' after a block moves nothing, tables as the thread's, main's cards read bise, the capsule's cap scrolls", async () => {
  test.setTimeout(120_000);
  const partial = deltas();
  const core = new FakeCore();
  const helper = new FakeHelper();
  const s = await launchDesktop({ core, helper });
  try {
    const { app } = s;
    await s.page.waitForTimeout(1500);
    const card = (id: number, agent: string, question: string, approval = false): Record<string, unknown> => ({
      // rank 0, older than the fixture's: the spotlight lists the cards in the inbox block's order
      // (one-inbox 3), so these lead and ⏎ on the first waiting row is main's mail
      id, project: HOME, kind: approval ? 'confirm' : 'question', rank: 0, agent, question,
      options: [{ n: 1, label: 'yes' }, { n: 2, label: 'no' }], urgent: false, since_ms: 1791100310000, ...(approval ? { approval: true } : {}),
    });
    await core.send({ ev: 'cards', project: HOME, cards: [card(11, 'main', 'send the mail to legal?'), card(12, 'main', 'run the release script?', true)] } as unknown as Ev);
    await helper.send({ ev: 'fn', act: 'key', key: 'space' });
    await expect.poll(() => app.windows().some((p) => p.url().includes('surface=capsule'))).toBe(true);
    const cap = app.windows().find((p) => p.url().includes('surface=capsule'));
    if (!cap) throw new Error('no capsule window');
    const input = cap.locator('[data-testid="spot.input"]');
    await expect(input).toBeVisible({ timeout: 5000 });

    // main's card rows read 'bise' (shownName, as the window)
    await expect(cap.locator(`[data-testid="spot.row.card.${HOME}.11"]`), "main's question card reads '? bise'").toContainText('? bise', { timeout: 2000 });
    await expect(cap.locator(`[data-testid="spot.row.card.${HOME}.12"]`), "main's approval reads '! bise'").toContainText('! bise');
    expect(await cap.getByText(/^[?!] main$/).count(), "no '? main' row").toBe(0);
    await cap.screenshot({ path: test.info().outputPath('8-cards.png') });

    // R03 (qa-native's 233c325a reshoot): ⏎ on the first waiting row ('↵ answer') opens that
    // card's answer in place (its options and keys), never closes the capsule to nothing; esc
    // goes back to the list; a digit answers it, and once it's gone the list is back
    const cardView = cap.locator('[data-testid="capsule.card.view"]');
    await input.click();
    await cap.keyboard.press('Enter');
    await expect(cardView, "⏎ on '? bise' shows its card in the capsule").toBeVisible({ timeout: 2000 });
    await expect(cardView, 'the card is the one picked').toContainText('send the mail to legal?');
    await expect(cardView, 'its options show').toContainText('yes');
    // test mode never shows a real window (main only prints CAPSULE_LINE): a hide would come back
    // as the capsule's state (shown: false) and drop the view to none, so the card still drawn a
    // beat later is the proof it stayed up
    await cap.waitForTimeout(400);
    await expect(cardView, 'the capsule stays up on the card').toBeVisible();
    await cap.screenshot({ path: test.info().outputPath('8-card-answer.png') });
    await cap.keyboard.press('Escape');
    await expect(input, 'esc goes back to the list').toBeVisible({ timeout: 2000 });
    await expect(cardView).toHaveCount(0);
    await input.click();
    await cap.keyboard.press('Enter');
    await expect(cardView).toBeVisible({ timeout: 2000 });
    await cap.keyboard.press('1');
    await core.waitCmd((c) => c['cmd'] === 'answer' && c['card'] === 11 && c['reply'] === '1');
    await core.send({ ev: 'cards', project: HOME, cards: [card(12, 'main', 'run the release script?', true)] } as unknown as Ev);
    await expect(input, 'answered: back to the list').toBeVisible({ timeout: 2000 });
    await expect(cap.locator(`[data-testid="spot.row.card.${HOME}.11"]`)).toHaveCount(0);

    await input.click();
    await cap.keyboard.type(`how do the benches compare ${Date.now() % 100000}`);
    await cap.keyboard.press('Enter');
    await core.waitCmd((c) => c['cmd'] === 'send' && c['agent'] === 'main');
    const text = cap.locator('[data-testid="spot.answer.text"]');
    const sign = cap.locator('[data-testid="spot.answer.text.sign"]');
    const box = async (sel: string): Promise<Box> => {
      const b = await cap.locator(sel).last().boundingBox();
      if (!b) throw new Error(`no box for ${sel}`);
      return b;
    };
    // the dark panel: what the glass behind it looks like in dark (a stand-in: the real glass is
    // macOS vibrancy over his screen); the sheet's earlier dark shot was the glass over its grey
    const backdrop = async (color: string, theme: 'dark' | 'light'): Promise<void> => {
      await cap.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme });
      await cap.evaluate(([c, t]) => {
        document.documentElement.dataset['theme'] = t;
        document.documentElement.style.background = c;
      }, [color, theme] as const);
      await cap.waitForTimeout(300);
    };

    // a code box last: the sign under it, out of the layout
    const code = 'The fix caches the walk:\n```rust\nlet idx = Index::walk_once(&root);\n```\n';
    await core.send(partial(code, '9.1'));
    await expect(text).toContainText('walk_once', { timeout: 1000 });
    await expect(sign, "after a code box the '∿' is out of the layout").toHaveClass(/after/);
    const codeBox = await box('[data-testid="spot.answer.text"] .box');
    const signAt = await sign.boundingBox();
    expect.soft((signAt?.y ?? 0) + 0.5, "the '∿' sits under the code box").toBeGreaterThanOrEqual(codeBox.y + codeBox.height);
    expect.soft(Math.abs((signAt?.x ?? 0) - codeBox.x), "at the answer's left edge").toBeLessThan(2);
    await cap.waitForTimeout(500);
    await cap.screenshot({ path: test.info().outputPath('9-code-last.png') });

    // a table last: drawn as the thread's (ui font, header 600 over a 1 px rule, tabular numbers)
    const table = `${code}| run | time |\n|---|---|\n| cold | 2.0 s |\n| warm | 0.31 s |\n`;
    await core.send(partial(table, '9.1'));
    await expect(text).toContainText('warm', { timeout: 1000 });
    await expect(sign).toHaveClass(/after/);
    const look = await cap.locator('[data-testid="spot.answer.text"] .table').evaluate((t) => {
      const th = t.querySelector('.th');
      const cell = t.querySelector('.tr:not(.th) > span');
      const cs = (e: Element | null): CSSStyleDeclaration | null => (e ? getComputedStyle(e) : null);
      const rows = Array.from(t.querySelectorAll('.tr')).map((r) => Array.from(r.children).map((c) => Math.round(c.getBoundingClientRect().x)));
      return {
        headWeight: cs(th?.firstElementChild ?? null)?.fontWeight, rule: cs(th)?.borderBottomWidth, numbers: cs(t)?.fontVariantNumeric,
        mono: (cs(cell)?.fontFamily ?? '').toLowerCase().includes('mono'), columns: rows.map((r) => r.join(',')),
      };
    });
    expect.soft(look.headWeight, 'the header in 600').toBe('600');
    expect.soft(look.rule, 'over a 1 px rule').toBe('1px');
    expect.soft(look.numbers, 'tabular numbers').toContain('tabular-nums');
    expect.soft(look.mono, 'the ui font, not mono').toBe(false);
    expect.soft(new Set(look.columns).size, `the columns line up, from the header: ${look.columns.join(' | ')}`).toBe(1);
    const tableBox = await box('[data-testid="spot.answer.text"] .table');
    const signT = await sign.boundingBox();
    expect.soft((signT?.y ?? 0) + 0.5, "the '∿' sits under the table").toBeGreaterThanOrEqual(tableBox.y + tableBox.height);
    await cap.waitForTimeout(500);
    await cap.screenshot({ path: test.info().outputPath('10-table-last.png') });
    // its leaving moves nothing
    await core.send(partial('', '9.1'));
    await expect(sign).toHaveCount(0, { timeout: 1000 });
    const after = await box('[data-testid="spot.answer.text"] .table');
    expect.soft(after, "the '∿' leaving moves nothing").toEqual(tableBox);

    // the dark panel and the glass over the sheet's grey, the same answer
    await backdrop('#2a2a2c', 'dark');
    await cap.screenshot({ path: test.info().outputPath('11-dark-panel.png') });
    const colors = await cap.locator('.b-spot-answer').evaluate((el) => [getComputedStyle(el).color, getComputedStyle(document.documentElement).getPropertyValue('--c-text').trim()]);
    expect.soft(colors[0], 'the answer is --c-text on the dark panel').not.toBe('');
    await backdrop('#8e8e93', 'dark');
    await cap.screenshot({ path: test.info().outputPath('11b-dark-on-grey.png') });
    await backdrop('#f2f2f4', 'light');
    await cap.screenshot({ path: test.info().outputPath('11c-light-panel.png') });
    await backdrop('', 'dark');
    await cap.evaluate(() => { delete document.documentElement.dataset['theme']; });
    await cap.emulateMedia({ reducedMotion: 'no-preference', colorScheme: 'dark' });

    // the capsule's cap: a long spoken answer grows to 320 px, then scrolls, the first lines above
    await cap.keyboard.press('Escape');
    await helper.send({ ev: 'fn', act: 'talk_start', by: 'fn' });
    await cap.waitForTimeout(400);
    await helper.send({ ev: 'fn', act: 'talk_end' });
    await core.waitCmd((c) => c['cmd'] === 'talk_end');
    const lines = Array.from({ length: 14 }, (_, i) => `Line ${String(i + 1)}: the cold bench walks the index again.`);
    for (let n = 2; n <= lines.length; n += 3) {
      await core.send(partial(lines.slice(0, n).join('\n'), '10.1'));
      await cap.waitForTimeout(300);
    }
    await core.send(partial(lines.join('\n'), '10.1'));
    const answer = cap.locator('[data-testid="capsule.answer"]');
    await expect(answer, 'the talk reaches its answer view').toBeVisible({ timeout: 2000 });
    await expect(answer).toContainText('Line 14', { timeout: 1000 });
    await cap.waitForTimeout(400);
    const m = await answer.evaluate((el) => ({ h: el.clientHeight, sh: el.scrollHeight, top: el.scrollTop, all: el.textContent }));
    expect.soft(m.h, 'it stops growing at 320 px').toBeLessThanOrEqual(320);
    expect.soft(m.sh, 'then it scrolls').toBeGreaterThan(m.h);
    expect.soft(m.sh - m.top - m.h, 'the newest line at the bottom').toBeLessThan(4);
    expect.soft(m.all, 'the first lines are still there, above').toContain('Line 1:');
    const mask = (): Promise<string> => answer.evaluate((el) => getComputedStyle(el).maskImage);
    expect.soft(await mask(), "scrolled: the top line fades out over 16 px, never cut (designer m_21358)").toContain('gradient');
    await cap.screenshot({ path: test.info().outputPath('12-cap-scrolled.png') });
    await answer.evaluate((el) => { el.scrollTop = 0; });
    await cap.waitForTimeout(200);
    expect.soft(await mask(), 'at the top of the text, no fade').toBe('none');
    await cap.screenshot({ path: test.info().outputPath('12b-cap-top.png') });
  } finally {
    await s.close();
  }
});
