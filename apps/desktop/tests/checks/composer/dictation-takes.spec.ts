// composer/dictation, every kind of take back to back on the REAL core (ambient-lead m_22122, m_22131): his
// ctrl+r dictation fails about one take in two on ad753852 and his words are lost. The new app on a
// throwaway world's real core (tests/checks/real.sh), the core's fake voice (BISE_AMBIENT_FAKE_VOICE:
// the words of a file, read and removed at each dictation's start), real keys only. One launch,
// the fake listener answering at once (the slow listener's flush after BISE_VOICE_FAKE_HEARD_MS is
// the core's own tests'; run(heardMs) still takes it by hand). One take of each kind: a tap on / tap off, a hold (push-to-talk), a tap with ctrl let go late, a stop then a
// new take at once (during the previous take's flush), a take during a fn talk. Passes when every
// take's words reach the field, or (a take during a fn talk) the field says why on screen.
// Each take's mic states, dictation events (id, final, cancelled, error, word count) and the field's
// note go to takes.json (DICTATION_TAKES_OUT, else the test's output folder): the fail pattern.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { test, expect, FakeHelper } from '../../harness';
import { launchReal, realWorld } from '../world';
import { fieldText } from './target';

import { common } from '../../../src/proto/words_common.gen';
const S = {
  field: '[data-testid="composer.field"]',
  mic: '[data-testid="composer.mic"]',
  note: '[data-testid="composer.note"]',
  /** the field's own line for why the mic can't take him (ambient-lead m_22195: not only the note) */
  why: '[data-testid="composer.dictation.why"]',
  setupSkip: '[data-testid="setup.skip"]',
};
const NL = String.fromCharCode(10);
/** a reason the mic can't take him: busy, fn talks */
const REASON = /busy|fn|talk|listen/iu;
type Why = { ms: number | null; where: string | null; text: string };
/** where and how fast a reason shows after the press: the field's own line (or the field), else only the note */
async function whyWithin(page: Page, t0: number, limitMs: number): Promise<Why> {
  let noteAt: Why | null = null;
  while (Date.now() - t0 < limitMs) {
    const r = await page.evaluate((sel) => {
      const read = (q: string): string => {
        const e = document.querySelector<HTMLElement>(q);
        return e !== null && e.offsetParent !== null ? e.textContent : '';
      };
      return { why: read(sel.why), field: read(sel.field), note: read(sel.note) };
    }, { why: S.why, field: S.field, note: S.note });
    const ms = Date.now() - t0;
    if (REASON.test(r.why)) return { ms, where: 'field line', text: r.why.trim() };
    if (REASON.test(r.field)) return { ms, where: 'field', text: r.field.trim() };
    if (noteAt === null && REASON.test(r.note)) noteAt = { ms, where: 'note only', text: r.note.trim() };
    await page.waitForTimeout(10);
  }
  return noteAt ?? { ms: null, where: null, text: '' };
}
const talk = async (p: Page, cmd: 'talk_start' | 'talk_cancel'): Promise<void> => {
  await p.evaluate((c) => { (window as unknown as { bise: { core: { send: (x: unknown) => void } } }).bise.core.send({ cmd: c }); }, cmd);
};

type Keys = {
  page: Page;
  /** the next take's words (the fake listener reads them at the dictation's start) */
  words: (w: string) => void;
  /** the scripted mac helper: fn as the helper says it (talk_start, key space, talk_end...) */
  helper: FakeHelper;
};
type Take = {
  name: string;
  /** the words that must reach the field, one list per dictation of the take */
  words: string[];
  /** a take whose press may be refused returns where and how fast the field said why */
  keys: (k: Keys) => Promise<Why | undefined> | Promise<void>;
  /** the words a fn talk hears before the take: a take during a talk ends the talk as at fn up and
   * gets the mic (amb-core m_22241, ambient-lead m_22267), so the take's words must land and the
   * talk's words are heard (recorded as talkHeard). Every refusal is red, a note only too. */
  talk?: string;
  /** a fn talk whose capsule view was replaced (spotlight) before fn up: the real core must get
   * its talk_end exactly once (amb-web m_22301/m_22308), counted in core.log */
  capsule?: boolean;
  /** the take ends a fn talk that listens (during it, or one whose talk_end never came): the core
   * sends the talk's words to main and says so in one notice, 'fn talk sent to main…' (amb-core
   * 276074b2) */
  ends?: boolean;
  /** a take with no words: its final says kept, then dictate_retry {id} gives its words in one
   * final (amb-core 276074b2 fix 2; checked on the core's events, the window has no try again yet) */
  retry?: boolean;
};

const down = async (p: Page): Promise<void> => {
  await p.keyboard.down('Control');
  await p.keyboard.down('r');
};
const up = async (p: Page): Promise<void> => {
  await p.keyboard.up('r');
  await p.keyboard.up('Control');
};
/** a toggle press: ctrl+r down and up in 60 ms */
const tap = async (p: Page): Promise<void> => {
  await down(p);
  await p.waitForTimeout(60);
  await up(p);
};

const W = (n: number): string => `take${String(n).padStart(2, '0')} ${['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot'].slice(0, 3 + (n % 3)).join(' ')}`;

/** the takes of one launch; n0: the first take's number */
function takes(n0: number): Take[] {
  let n = n0;
  const next = (): string => W(n++);
  const t: Take[] = [];
  const tapTake = (talkMs: number): Take => {
    const w = next();
    return { name: `tap on, ${String(talkMs)} ms, tap off`, words: [w], keys: async ({ page, words }) => {
      words(w);
      await tap(page);
      await page.waitForTimeout(talkMs);
      await tap(page);
    } };
  };
  const holdTake = (holdMs: number): Take => {
    const w = next();
    return { name: `hold ${String(holdMs)} ms (push-to-talk)`, words: [w], keys: async ({ page, words }) => {
      words(w);
      await down(page);
      await page.waitForTimeout(holdMs);
      await up(page);
    } };
  };
  const lateCtrl = (ctrlMs: number): Take => {
    const w = next();
    return { name: `tap with ctrl let go ${String(ctrlMs)} ms late, then talk 1200 ms, tap off`, words: [w], keys: async ({ page, words }) => {
      words(w);
      await page.keyboard.down('Control');
      await page.keyboard.down('r');
      await page.waitForTimeout(60);
      await page.keyboard.up('r');
      await page.waitForTimeout(ctrlMs);
      await page.keyboard.up('Control');
      await page.waitForTimeout(1200);
      // still on (a toggle): this tap stops it; already off (H2): this tap starts a new take, stopped below
      await tap(page);
      await page.waitForTimeout(500);
      if ((await page.locator(S.mic).getAttribute('data-state')) === 'recording') await tap(page);
    } };
  };
  const restart = (gapMs: number): Take => {
    const a = next();
    const b = next();
    return { name: `tap on, 900 ms, tap off, a new take ${String(gapMs)} ms later (the flush), 900 ms, tap off`, words: [a, b], keys: async ({ page, words }) => {
      words(a);
      await tap(page);
      await page.waitForTimeout(900);
      await tap(page);
      await page.waitForTimeout(gapMs);
      words(b);
      await tap(page);
      await page.waitForTimeout(900);
      if ((await page.locator(S.mic).getAttribute('data-state')) === 'recording') await tap(page);
    } };
  };
  const duringTalk = (): Take => {
    const said = `talk${String(n0)} hotel india juliet`;
    const w = next();
    return { name: 'a take while a fn talk listens', words: [w], talk: said, ends: true, keys: async ({ page, words }) => {
      words(said);
      await talk(page, 'talk_start');
      await page.waitForTimeout(400);
      words(w);
      const t0 = Date.now();
      await tap(page);
      const why = await whyWithin(page, t0, 900);
      await page.waitForTimeout(Math.max(0, 900 - (Date.now() - t0)));
      await talk(page, 'talk_cancel');
      await page.waitForTimeout(300);
      if ((await page.locator(S.mic).getAttribute('data-state')) === 'recording') await tap(page);
      return why;
    } };
  };
  // a fn talk through the capsule whose talk view the spotlight replaces before it ends (fn held:
  // talk_start, fn space, fn up; or fn fn hands-free, fn space, a tap), then a take: the talk
  // ended once in the core, the take gets the mic
  const capsuleTalk = (how: 'held' | 'double'): Take => {
    const w = next();
    return { name: `a take after a ${how === 'held' ? 'held' : 'hands-free'} fn talk the spotlight replaced`, words: [w], capsule: true, keys: async ({ page, words, helper }) => {
      await helper.send(how === 'held' ? { ev: 'fn', act: 'talk_start', by: 'fn' } : { ev: 'fn', act: 'double' });
      await page.waitForTimeout(500);
      await helper.send({ ev: 'fn', act: 'key', key: 'space' });
      await page.waitForTimeout(400);
      await helper.send(how === 'held' ? { ev: 'fn', act: 'talk_end' } : { ev: 'fn', act: 'tap' });
      await page.waitForTimeout(400);
      await helper.send({ ev: 'fn', act: 'esc' });
      await page.waitForTimeout(800);
      words(w);
      const t0 = Date.now();
      await tap(page);
      const why = await whyWithin(page, t0, 900);
      await page.waitForTimeout(Math.max(0, 900 - (Date.now() - t0)));
      if ((await page.locator(S.mic).getAttribute('data-state')) === 'recording') await tap(page);
      return why;
    } };
  };
  // a take the listener hears nothing in: its final says kept; dictate_retry {id} replays its sound
  // through a fresh listener, which then hears the words (the core's events, not the field)
  const retryTake = (): Take => {
    const w = next();
    return { name: 'a take with no words, kept, then try again ⌥⏎', words: [w], retry: true, keys: async ({ page, words }) => {
      words('');
      await tap(page);
      await page.waitForTimeout(900);
      await tap(page);
      const kept = async (): Promise<string | null> => page.evaluate(() => {
        const e = (window as unknown as { __dk: { ev: Record<string, unknown>[] } }).__dk.ev.find((x) => x['ev'] === 'dictation' && x['final'] === true && x['kept'] === true);
        return typeof e?.['id'] === 'string' ? e['id'] : null;
      });
      await expect.poll(kept, { timeout: 8000 }).not.toBeNull().catch(() => undefined);
      const id = await kept();
      if (id === null) return undefined;
      // his way (ccd707e7): the field shows the take's line, '… · try again ⌥⏎ · esc drops it', and ⌥⏎ asks it again
      const line = page.locator('[data-testid="composer.dictation"]').first();
      const offer = await line.textContent({ timeout: 5000 }).catch(() => null);
      words(w);
      await page.locator(S.field).first().focus();
      await page.keyboard.press('Alt+Enter');
      return offer !== null && offer.includes(common.try_again) ? undefined : { ms: null, where: "no 'try again' line", text: offer ?? '' };
    } };
  };
  // one take of each kind, under 30 s in all (Gabriel's pick on page e2e-desktop): the repeats
  // and the stuck-talk run are the core's dictation tests' (main/core/dictation.test.ts)
  t.push(tapTake(1200), holdTake(1200), lateCtrl(500), restart(500), duringTalk(), capsuleTalk('held'), retryTake());
  return t;
}

type TakeOut = {
  n: number;
  name: string;
  words: string[];
  landed: boolean[];
  field: string;
  note: string | null;
  mic: string[];
  events: Record<string, unknown>[];
  /** where and how fast the field said why the press was refused (a take that may be refused) */
  why: Why | null;
  /** a take during a fn talk: the talk's own words were heard (null: no talk in this take) */
  talkHeard: boolean | null;
  /** a capsule talk: how many talk_end lines the core logged in the take (must be 1) */
  talkEnds: number | null;
  /** a take that ends a fn talk: the talk's words were sent to main (null: no such talk) */
  talkSent: boolean | null;
  /** the notices the window showed during the take */
  notices: string[];
  /** the core's new core.log lines during the take (ambient-core / talk / dictate: no words) */
  core: string[];
  /** the window's new app.log lines during the take (dictation / mic / talk decisions) */
  app: string[];
  ok: boolean;
};

async function run(heardMs: number | null, n0: number): Promise<TakeOut[]> {
  const w = realWorld();
  const voice = path.join(w.home, 'tmp', `qa-takes-voice-${String(n0)}.txt`);
  const env: Record<string, string> = { BISE_AMBIENT_FAKE_VOICE: voice };
  if (heardMs !== null) env['BISE_VOICE_FAKE_HEARD_MS'] = String(heardMs);
  const helper = new FakeHelper();
  const s = await launchReal(w, { env, helper });
  // the launch's own userData (harness/launch.ts, not the world home's Library): core.log
  // (env.ts coreLogOf) and the window's 'bise:app-log' lines in app.log (amb-web e27d5c84)
  const read = (name: string): string => { try { return readFileSync(path.join(s.userData, name), 'utf8'); } catch { return ''; } };
  const coreLog = (): string => read('core.log');
  const appLog = (): string => read('app.log');
  const out: TakeOut[] = [];
  try {
    const { page } = s;
    const field = page.locator(S.field);
    await expect(page.locator(`${S.field}, ${S.setupSkip}`).first()).toBeVisible({ timeout: 15_000 }).catch(() => undefined);
    if (await page.locator(S.setupSkip).isVisible()) await page.locator(S.setupSkip).click();
    await expect(field, "bise's thread opens with its composer on the real core").toBeVisible({ timeout: 15_000 });
    // what the window sees: the core's dictation and voice_mode events, the mic button's states
    await page.evaluate((micSel) => {
      const g = window as unknown as { __dk: { ev: Record<string, unknown>[]; mic: string[] }; bise: { core: { onEvent: (f: (e: Record<string, unknown>) => void) => void } } };
      g.__dk = { ev: [], mic: [] };
      g.bise.core.onEvent((e) => {
        const text = typeof e['text'] === 'string' ? e['text'] : '';
        // a notice is the core's own words (never his): kept whole when it is about a fn talk
        if (e['ev'] === 'notice' && /fn talk/u.test(text)) g.__dk.ev.push({ t: Date.now(), ev: 'notice', text });
        if (e['ev'] !== 'dictation' && e['ev'] !== 'voice_mode' && e['ev'] !== 'heard') return;
        g.__dk.ev.push({ t: Date.now(), ev: e['ev'], id: e['id'], final: e['final'], cancelled: e['cancelled'], error: e['error'], kept: e['kept'], on: e['on'], words: text === '' ? 0 : text.split(/\s+/u).length, take: /take\d\d/u.exec(text)?.[0] ?? null });
      });
      let last = '';
      window.setInterval(() => {
        const st = document.querySelector(micSel)?.getAttribute('data-state') ?? 'none';
        if (st !== last) g.__dk.mic.push(`${String(Date.now() % 100000)}:${st}`);
        last = st;
      }, 20);
    }, S.mic);
    const text = async (): Promise<string> => (await field.evaluate(fieldText)).trim();
    const mic = (): Promise<string | null> => page.locator(S.mic).getAttribute('data-state');
    const all = takes(n0);
    for (const [i, t] of all.entries()) {
      await field.click();
      await page.keyboard.press('Meta+a');
      await page.keyboard.press('Backspace');
      await page.evaluate(() => { const g = window as unknown as { __dk: { ev: unknown[]; mic: string[] } }; g.__dk.ev = []; g.__dk.mic = []; });
      const logAt = coreLog().length;
      const appAt = appLog().length;
      const why = (await t.keys({ page, helper, words: (x) => { writeFileSync(voice, x); } })) ?? null;
      // the take is over: the mic off and no word coming for a while (the window's own stop wait is 5 s)
      await expect.poll(mic, { timeout: 12_000 }).toBe('off').catch(() => undefined);
      await page.waitForTimeout((heardMs ?? 0) + 1200);
      const got = await text();
      const note = await page.locator(S.note).first().textContent({ timeout: 500 }).catch(() => null);
      const dk = await page.evaluate(() => (window as unknown as { __dk: { ev: Record<string, unknown>[]; mic: string[] } }).__dk);
      // a retried take: kept first, its 'try again' line offered, then ⌥⏎ puts its words in the field
      const kept = t.retry === true ? dk.ev.some((e) => e['kept'] === true) && why === null : true;
      const landed = t.words.map((x) => kept && got.includes(x));
      const notices = dk.ev.filter((e) => e['ev'] === 'notice').map((e) => String(e['text']));
      const talkSent = t.ends === true ? notices.some((x) => x.startsWith('fn talk sent to main')) : null;
      // the fake listener tags each heard event with its words' first word (take13, talk1...)
      const talkHeard = t.talk === undefined ? null : dk.ev.some((e) => e['ev'] === 'heard' && e['take'] === t.talk?.split(' ')[0]);
      const core = coreLog().slice(logAt).split(NL).filter((l) => /ambient-core|talk|dictat/u.test(l)).slice(0, 40);
      const talkEnds = t.capsule === true ? core.filter((l) => /talk_end/u.test(l)).length : null;
      const ok = landed.every(Boolean) && (talkEnds === null || talkEnds === 1) && talkSent !== false;
      const app = appLog().slice(appAt).split(NL).filter((l) => /dictat|mic|talk|transcrib/iu.test(l)).slice(0, 40);
      out.push({ n: n0 + i, name: t.name, words: t.words, landed, field: got, note, mic: dk.mic, events: dk.ev, why, talkHeard, talkEnds, talkSent, notices, core, app, ok });
      // a voice mode a take turned on goes off before the next take
      if (dk.ev.some((e) => e['ev'] === 'voice_mode' && e['on'] === true)) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(800);
      }
    }
  } finally {
    await s.close();
    helper.dispose();
  }
  return out;
}

test('composer/dictation (real core): every kind of take back to back, every take’s words reach the field', async () => {
  test.setTimeout(90_000);
  const all = (await run(null, 1)).map((t) => ({ listener: 'at once', ...t }));
  const file = process.env['DICTATION_TAKES_OUT'] ?? test.info().outputPath('takes.json');
  writeFileSync(file, JSON.stringify(all, null, 1));
  const lost = all.filter((t) => !t.ok).map((t) => `#${String(t.n)} (${t.listener}) ${t.name}: landed ${JSON.stringify(t.landed)}, field '${t.field}', note '${t.note ?? ''}', mic ${t.mic.join(' ')}`);
  expect(lost, `takes whose words never reached the field (${String(lost.length)}/${String(all.length)}; ${file})`).toEqual([]);
});
