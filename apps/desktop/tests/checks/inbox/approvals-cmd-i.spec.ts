// inbox/approvals-cmd-i · O.1 (docs/desktop-bar.md): approve and deny from ⌘I on a typed approval
// card. Passes when, with the scripted core (FakeCore, fake data) holding two approval cards
// (approval: true, the hub's options '1 allow · 2 always · 3 no'):
//   - the inbox (⌘I's screen) lists both, the approval first, with its options and no field for
//     words (an approval takes its options, never words: core_tests
//     an_approval_card_takes_its_options_never_words);
//   - the key 1 approves the current one: HubCmd answer {card, reply: '1'};
//   - a click on the next one's 'no' denies it: HubCmd answer {card, reply: '3'};
//   - typed words never answer an approval (no answer goes out for them).
// The agent going on after approve is the hub's (the law above, Effect::Confirm); qa-flows runs
// inbox/approvals on the real core later. ⌘I's own key is qa-native's (the native menu).
// Owner: amb-home.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'storefront-1a2b3c4d';
const agent = (name: string) => ({ name, main: name === 'main', status: 'working', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: name === 'main' ? 0 : 1 });
const OPTS = [
  { n: 1, label: 'allow' },
  { n: 2, label: 'always' },
  { n: 3, label: 'no' },
];
const approval = (id: number, who: string, what: string, since: number) => ({
  id,
  project: P,
  kind: 'confirm',
  approval: true,
  rank: 0,
  agent: who,
  question: `${who} wants to run ${what}`,
  options: OPTS,
  urgent: false,
  since_ms: since,
});
const CARDS = [approval(21, 'perf', 'rm -rf target', 1791100100000), approval(22, 'search', 'git push origin sb/search', 1791100200000)];
const world = () => [
  {
    ev: 'prefs',
    prefs: {
      onboarded: true,
      theme: 'light',
      context: { shot: true, url: true, file: true, window_text: false },
      excluded_apps: [],
      quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true },
      voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' },
      shots_keep_days: 7,
    },
  },
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 3, working: 2, waits: 2, running: true, cards: CARDS },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  { ev: 'agents', project: P, agents: [agent('main'), agent('perf'), agent('search')] },
  { ev: 'cards', project: P, cards: CARDS },
];
type Cmd = { cmd?: string; project?: string; card?: number; reply?: string };

test('inbox/approvals-cmd-i: 1 approves the typed approval card, a click on no denies the next, words never answer one', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: 'inbox' });
  try {
    const { page } = s;
    const root = page.getByTestId('inbox.root');
    await expect(root).toBeVisible({ timeout: 10_000 });
    const first = page.getByTestId(`inbox.card.${P}-21`);
    await expect(first).toContainText('perf wants to run rm -rf target');
    await expect(page.getByTestId(`inbox.item.${P}-22`)).toBeVisible();
    await expect(page.getByTestId('inbox.answer'), 'an approval has no field for words').toHaveCount(0);
    for (const o of OPTS) await expect(page.getByTestId(`inbox.card.${P}-21.opt.${String(o.n)}`)).toContainText(o.label);
    await page.screenshot({ path: test.info().outputPath('approvals.png') });

    // words never answer an approval
    await root.focus();
    await page.keyboard.type('yes');
    await page.waitForTimeout(400);
    expect(core.cmds().filter((c) => c.cmd === 'answer'), 'typed words answer nothing').toEqual([]);

    // 1 approves the current one
    await root.focus();
    await page.keyboard.press('1');
    expect(await core.waitCmd((c) => c.cmd === 'answer' && (c as Cmd).card === 21, 3000)).toMatchObject({ project: P, card: 21, reply: '1' });

    // a click on the next one's 'no' denies it
    await core.send({ ev: 'cards', project: P, cards: [CARDS[1]] } as never);
    const no = page.getByTestId(`inbox.card.${P}-22.opt.3`);
    await expect(no).toBeVisible({ timeout: 3000 });
    await no.click();
    expect(await core.waitCmd((c) => c.cmd === 'answer' && (c as Cmd).card === 22, 3000)).toMatchObject({ project: P, card: 22, reply: '3' });
  } finally {
    await s.close();
    core.dispose();
  }
});
