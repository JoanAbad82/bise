// inbox/card-fit · the inbox card v2 (ambient m_11273, mock site/content/ambient/inbox-card.html): the
// docked card's text never leaves its box. Passes when, at thread-column widths 720, 520 and 380 px (the
// mock's; the window is the sidebar + the column) and the 1100 px window,
// in light and dark, with the mock's 3 long French option labels and a 2-option approval:
//   - every option label sits inside its row, every row inside the card, the header's parts, the
//     question and the footer's keys inside the card, the card inside the window;
//   - no label, row, footer or card is wider inside than its box (scrollWidth ≤ clientWidth);
//   - the card docks in the flow: under the thread's list, over the composer, never over either;
//   - the header says 'bise asks' (main's card), the project cut on one line.
// Writes one sheet (light + dark at 720/520/380, the approval, a hover row and a keyboard-on row)
// for ambient's sign-off. The scripted core (FakeCore), fake data. Owner: amb-home.
import { writeFileSync } from 'node:fs';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const Q = 'Tu veux que je relance la migration des comptes maintenant, ou on attend la fenêtre de maintenance de ce soir ?';
const OPTS = [
  'relance-la maintenant sur les comptes de test d’abord, puis sur la production si tout passe sans erreur',
  'attends la fenêtre de maintenance de ce soir à 22 h',
  'laisse tomber pour cette semaine : on en reparle lundi avec l’équipe data et on garde l’ancien schéma en attendant',
];
const APPROVAL = { id: 7, project: P, kind: 'merge', rank: 0, approval: true, agent: 'main', question: 'merge sb/streaming into main?', options: [{ n: 1, label: 'merge into main' }, { n: 2, label: 'not now' }], urgent: false, since_ms: 1791100300000 };
const QUESTION = { id: 9, project: P, kind: 'question', rank: 1, agent: 'main', question: Q, options: OPTS.map((label, i) => ({ n: i + 1, label })), urgent: false, since_ms: 1791100310000 };
const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 });
const prefs = (theme: 'light' | 'dark' | 'system') => ({
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
const world = () => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'acme-storefront-checkout', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 1, working: 0, waits: 2, running: true, cards: [APPROVAL, QUESTION] },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme-storefront-checkout' },
  { ev: 'agents', project: P, agents: [agent('main')] },
  {
    ev: 'thread',
    project: P,
    agent: 'main',
    entries: [
      { pos: 1, at_ms: 1791100001000, kind: 'user', text: 'la migration des comptes, on en est où ?' },
      { pos: 2, at_ms: 1791100002000, kind: 'agent', text: 'les scripts sont prêts et testés sur une copie. il me faut ton feu vert pour la lancer, une question ci-dessous.' },
    ],
    before: null,
    more: false,
  },
];

// the thread column's widths (ambient's mock: 720, 520, 380), the window = the sidebar + the column; and
// the default window (1100). The sidebar keeps its width at any window (asked amb-win m_11377).
const WIDTHS = [0, 720, 520, 380] as const;
const SHEET = [720, 520, 380] as const;
const HEIGHT = 720;

/** What leaves its box in the docked card (and the dock vs the list and the composer), as lines. */
function misfits(): string[] {
  const out: string[] = [];
  const card = document.querySelector<HTMLElement>('[data-testid="strip.dock"] .ic');
  if (!card) return ['no docked card'];
  const r = (e: Element) => e.getBoundingClientRect();
  const inside = (c: DOMRect, p: DOMRect) => c.left >= p.left - 0.5 && c.right <= p.right + 0.5 && c.top >= p.top - 0.5 && c.bottom <= p.bottom + 0.5;
  const box = (b: DOMRect) => `[${String(Math.round(b.left))},${String(Math.round(b.top))} ${String(Math.round(b.width))}x${String(Math.round(b.height))}]`;
  const name = (e: Element) => `${e.className}${e.textContent ? ` "${e.textContent.slice(0, 30)}"` : ''} ${box(r(e))}`;
  const cr = r(card);
  const where = `card ${box(cr)} in ${String(window.innerWidth)}x${String(window.innerHeight)}, its scrollHeight ${String(card.scrollHeight)}`;
  if (cr.left < 0 || cr.right > window.innerWidth + 0.5) out.push(`the card ${String(cr.left)}..${String(cr.right)} leaves the window ${String(window.innerWidth)}`);
  // the rows scroll inside their list when the card is at its cap: across, inside the card; down, inside the list
  const opts = card.querySelector('.ic-opts');
  for (const opt of Array.from(card.querySelectorAll<HTMLElement>('.ic-opt'))) {
    const o = r(opt);
    if (o.left < cr.left - 0.5 || o.right > cr.right + 0.5) out.push(`row out of the card: ${name(opt)}`);
    if (opts instanceof HTMLElement && o.bottom - r(opts).top + opts.scrollTop > opts.scrollHeight + 0.5) out.push(`row out of its list: ${name(opt)}`);
    for (const part of Array.from(opt.querySelectorAll<HTMLElement>('.ic-l, .ic-n'))) if (!inside(r(part), o)) out.push(`label out of its row: ${name(part)}`);
  }
  for (const e of Array.from(card.querySelectorAll<HTMLElement>('.ic-h > *, .ic-q, .ic-foot, .ic-foot button, .ic-opts'))) if (!inside(r(e), cr)) out.push(`out of the card: ${name(e)}`);
  for (const e of [card, ...Array.from(card.querySelectorAll<HTMLElement>('.ic-opt, .ic-l, .ic-foot, .ic-h'))]) {
    if (e.scrollWidth > e.clientWidth + 1) out.push(`wider inside than its box (${String(e.scrollWidth)} > ${String(e.clientWidth)}): ${name(e)}`);
  }
  const dock = document.querySelector('[data-testid="strip.dock"]');
  const list = document.querySelector('[data-testid="thread.list"]');
  const comp = document.querySelector('[data-testid="composer"]');
  if (dock && list && r(dock).top < r(list).bottom - 1) out.push('the card overlaps the thread');
  if (dock && comp && r(dock).bottom > r(comp).top + 1) out.push('the card overlaps the composer');
  return out.length > 0 ? [where, ...out] : out;
}

test('inbox/card-fit: the docked card keeps every label in its box at 1100/720/520/380 px, light and dark', async () => {
  test.setTimeout(180_000);
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${P}` });
  const shots: { label: string; png: Buffer }[] = [];
  try {
    const { page } = s;
    await expect(page.getByTestId('strip'), 'the strip with the two items').toBeVisible({ timeout: 10_000 });
    const win = await s.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0]?.id ?? -1);
    // the sidebar's width: the window minus the thread column
    const side = await page.evaluate(() => window.innerWidth - (document.querySelector('[data-testid="thread.screen"]')?.getBoundingClientRect().width ?? window.innerWidth));
    const size = async (w: number, h: number) => {
      await s.app.evaluate(({ BrowserWindow }, [id, w2, h2]) => BrowserWindow.fromId(id ?? -1)?.setContentSize(w2 ?? 0, h2 ?? 0), [win, w, h]);
      await expect.poll(() => page.evaluate(() => window.innerWidth), { timeout: 5000 }).toBe(w);
    };
    const theme = async (t: 'light' | 'dark') => {
      await core.send(prefs(t) as never);
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
    };
    const dock = async (n: 1 | 2, id: number) => {
      await page.keyboard.press('Escape');
      await page.keyboard.press(`Control+Digit${String(n)}`);
      await expect(page.getByTestId(`strip.card.${P}-${String(id)}`)).toBeVisible({ timeout: 3000 });
    };
    const fits = async (what: string) => {
      const bad = await page.evaluate(misfits);
      if (bad.length > 0) writeFileSync(test.info().outputPath(`misfit-${what.replace(/\W+/g, '-')}.png`), await page.screenshot());
      expect(bad, `${what}: ${bad.join(' | ')}`).toEqual([]);
    };
    for (const t of ['light', 'dark'] as const) {
      await theme(t);
      for (const w of WIDTHS) {
        await size(w === 0 ? 1100 : Math.round(side) + w, HEIGHT);
        await dock(2, QUESTION.id);
        await expect(page.getByTestId(`strip.card.${P}-9`)).toContainText('bise asks');
        await fits(`${t} ${w === 0 ? 'window 1100' : `column ${String(w)}`} question`);
        if ((SHEET as readonly number[]).includes(w)) shots.push({ label: `${t} · column ${String(w)} px`, png: await page.screenshot() });
        await dock(1, APPROVAL.id);
        await fits(`${t} ${w === 0 ? 'window 1100' : `column ${String(w)}`} approval`);
        if (t === 'dark' && w === 520) shots.push({ label: 'dark · column 520 px · approval', png: await page.screenshot() });
      }
    }
    // a hover row (light) and a keyboard-on row (dark), at 720
    await theme('light');
    await size(Math.round(side) + 720, HEIGHT);
    await dock(2, QUESTION.id);
    await page.getByTestId(`strip.card.${P}-9.opt.2`).hover();
    shots.push({ label: 'light · column 720 px · hover on 2', png: await page.screenshot() });
    await theme('dark');
    await page.mouse.move(0, 0);
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId(`strip.card.${P}-9.opt.1`)).toHaveClass(/\bon\b/);
    shots.push({ label: 'dark · column 720 px · keyboard on 1', png: await page.screenshot() });

    // the sheet: every shot at half size, labelled
    await size(1800, 1300);
    const cells = shots
      .map((x) => `<figure><figcaption>${x.label}</figcaption><img src="data:image/png;base64,${x.png.toString('base64')}"></figure>`)
      .join('');
    await page.setContent(
      `<style>body{margin:0;background:#777;font:12px ui-monospace,monospace;color:#eee}main{display:flex;flex-wrap:wrap;gap:10px;padding:10px;align-items:flex-start}figure{margin:0}figcaption{margin:0 0 3px}img{display:block;zoom:.5;border-radius:6px}</style><main>${cells}</main>`,
    );
    const sheet = await page.screenshot({ fullPage: true });
    writeFileSync(test.info().outputPath('card-fit-sheet.png'), sheet);
  } finally {
    await s.close();
    core.dispose();
  }
});
