// thread/approval-raw · the raw data under news-real's approval row (105f0c5d: '✕ you said no to
// release' with no data-ok), for amb-feed and amb-win (ambient-lead m_16334). Owner: qa-flows.
// The NEW app on the REAL core over the throwaway world (amb-tools' seed: release's forced push,
// his no with the note 'use a branch, never force main'). Records, as attachments:
//   - every core event the window got that names that push: the kept snapshot (what a page gets on
//     start) and the live events after a re-subscribe of shop's thread (another screen, then back);
//   - the lines of shop's main transcript.log that name it, in either form (core-f, issue 25
//     chunk F): the record 'sb approval :: {how, who, what, note}' / 'sb answered :: {…}' or the
//     older text 'sb approval : …' / 'sb answered : …' (the filter's ' :' matches both).
// Passes when the entry the row is drawn from is an approval whose ok is a boolean.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubOf, launchOn, realWorld } from '../world';

const T = {
  field: '[data-testid="composer.field"]',
  list: '[data-testid="thread.list"]',
  approval: '[data-testid^="thread.approval."]',
};
const PUSH = 'git push --force';

type Ev = Record<string, unknown>;
type CoreApi = { core: { snapshot: () => Promise<Ev[]>; onEvent: (fn: (ev: Ev) => void) => () => void } };

/** The entries of an event (a thread page, one entry, or anything else) that name the push. */
function entriesNaming(evs: readonly Ev[], words: string): { ev: string; entry: unknown }[] {
  const out: { ev: string; entry: unknown }[] = [];
  for (const ev of evs) {
    const kind = typeof ev['ev'] === 'string' ? ev['ev'] : typeof ev['kind'] === 'string' ? ev['kind'] : '?';
    const list = Array.isArray(ev['entries']) ? (ev['entries'] as unknown[]) : ev['entry'] !== undefined ? [ev['entry']] : [ev];
    for (const e of list) if (JSON.stringify(e).includes(words)) out.push({ ev: kind, entry: e });
  }
  return out;
}

test("thread/approval-raw: the approval row's entry as the window got it, and its transcript line", async () => {
  test.setTimeout(180_000);
  const w = realWorld();
  const shop = hubOf(w, 'shop');
  const project = path.basename(path.dirname(shop.sock));
  const attach = (name: string, v: unknown) => test.info().attachments.push({ name, contentType: 'application/json', body: Buffer.from(JSON.stringify(v, null, 2)) });
  const s = await launchOn(w, `project/${project}`, T.field);
  try {
    const { page } = s;
    const row = page.locator(T.list).locator(T.approval).filter({ hasText: PUSH }).first();
    await expect(row, "the seeded approval row in shop's thread").toBeVisible({ timeout: 30_000 });
    const rowId = (await row.getAttribute('data-testid')) ?? '';
    const ok = await row.locator('xpath=ancestor-or-self::*[contains(@class,"th-approval")][1]').getAttribute('data-ok').catch(() => null);
    test.info().annotations.push({ type: 'row', description: JSON.stringify({ id: rowId, dataOk: ok, text: ((await row.textContent()) ?? '').trim().slice(0, 200) }) });

    // what main kept and gives a page on start
    const snap = await page.evaluate(() => (globalThis as unknown as { bise: CoreApi }).bise.core.snapshot());
    const fromSnap = entriesNaming(snap, PUSH);
    attach('snapshot-entries.json', fromSnap);

    // the live events of a fresh subscribe: another screen, then shop's thread again
    await page.evaluate(() => {
      const g = globalThis as unknown as { bise: CoreApi; __qaEvs?: Ev[] };
      g.__qaEvs = [];
      g.bise.core.onEvent((ev) => { g.__qaEvs?.push(ev); });
    });
    await page.locator('[data-testid="app.sidebar.bise"]').click({ timeout: 10_000 });
    await page.waitForTimeout(800);
    await page.locator(`[data-testid="app.sidebar.project.${project}"]`).click({ timeout: 10_000 });
    await expect(row, 'the row again').toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(1500);
    const live = await page.evaluate(() => (globalThis as unknown as { __qaEvs?: Ev[] }).__qaEvs ?? []);
    const fromLive = entriesNaming(live, PUSH);
    attach('live-entries.json', fromLive);
    attach('live-event-kinds.json', live.map((e) => e['ev'] ?? e['kind'] ?? '?'));

    // the transcript lines it came from
    const log = path.join(path.dirname(shop.sock), 'agents', 'main', 'transcript.log');
    let lines: string[] = [];
    try {
      lines = readFileSync(log, 'utf8').split('\n').filter((l) => l.includes(PUSH) || /sb (approval|answered) ::? /.test(l));
    } catch (e) {
      lines = [`unreadable: ${String(e)}`];
    }
    attach('transcript-lines.json', { file: log, lines });
    test.info().annotations.push({ type: 'counts', description: JSON.stringify({ snapshot: fromSnap.length, live: fromLive.length, transcript: lines.length }) });

    const entries = [...fromSnap, ...fromLive].map((x) => x.entry as Ev);
    const approval = entries.find((e) => e['kind'] === 'approval');
    test.info().annotations.push({ type: 'kinds', description: JSON.stringify(entries.map((e) => e['kind'])) });
    expect.soft(approval, 'the row comes from an approval entry').toBeDefined();
    expect.soft(typeof (approval?.['approval'] as Ev | undefined)?.['ok'], "its approval.ok is a boolean").toBe('boolean');
  } finally {
    await s.close();
  }
});
