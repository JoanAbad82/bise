import { describe, expect, it } from 'vitest';
import type { Entry } from '@/proto';
import { hub_ev } from '@/proto/fixtures.gen';
import { GROUP_GAP_MS, TOOL_LINES, briefOf, chipOf, dropAuthor, handoffOf, stepTime, toolEnd, toolLines, toolTime, clock, dayLabel, entryKey, findText, groupHead, pendingKey, posOfKey, reportLine, reportStatus, schedHead, toolWords, sameDay, stripContext, whenOf, whoOf } from './entry';
import { search } from './find';

const e = (over: Partial<Entry>): Entry => ({ pos: 1, at_ms: 0, kind: 'agent', text: '', ...over });

describe('thread rows', () => {
  it('keys: entries by pos, sends by cid, never the same', () => {
    expect(entryKey(12)).toBe('e:12');
    expect(posOfKey(entryKey(12))).toBe(12);
    expect(posOfKey(pendingKey('12'))).toBeUndefined();
  });

  it("who speaks: his words, bise's main with the pearl, an agent, a message from another agent", () => {
    expect(whoOf(e({ kind: 'you' }), { agent: 'perf', bise: false }).from).toBe('you');
    expect(whoOf(e({}), { agent: 'main', bise: true })).toEqual({ from: 'bise', name: 'bise', indent: false });
    expect(whoOf(e({}), { agent: 'main', bise: false })).toEqual({ from: 'bise', name: 'bise', indent: false });
    expect(whoOf(e({ kind: 'from_agent', from: 'docs' }), { agent: 'main', bise: false })).toEqual({ from: 'agent', name: 'docs', indent: true });
  });

  it('a clock in his zone', () => {
    expect(clock(Date.UTC(2026, 0, 2, 14, 5), 'UTC')).toBe('14:05');
    expect(clock(0)).toBe('');
  });

  it("⌘F finds a tools entry's steps in the fixture's thread", () => {
    const entries = hub_ev.flatMap((ev) => (ev.ev === 'thread' ? ev.entries : ev.ev === 'entry' ? [ev.entry] : []));
    const found = search(
      entries.map((x) => ({ pos: x.pos, text: findText(x) })),
      'slow',
    );
    expect(found.matches.length).toBeGreaterThan(0);
  });
});

describe('M14: a turn time on hover', () => {
  const NOW = Date.UTC(2026, 9, 14, 15, 0);
  it("today's turn shows its clock, an older day's its date too, no time shows nothing", () => {
    expect(whenOf(Date.UTC(2026, 9, 14, 9, 46), NOW, 'UTC')).toBe('09:46');
    expect(whenOf(Date.UTC(2026, 9, 12, 7, 0), NOW, 'UTC')).toBe('12 Oct 07:00');
    expect(whenOf(0, NOW, 'UTC')).toBe('');
  });
});

describe('batch 3a: a message between two other agents', () => {
  it("names both ('perf → docs'), and only the sender when it is to the agent in view", () => {
    const m = e({ kind: 'from_agent', from: 'perf', to: 'docs' });
    expect(whoOf(m, { agent: 'main', bise: false }).name).toBe('perf → docs');
    expect(whoOf(m, { agent: 'docs', bise: false }).name).toBe('perf');
    expect(whoOf(e({ kind: 'from_agent', from: 'perf' }), { agent: 'main', bise: false }).name).toBe('perf');
  });
});

describe("the thread's reading (ambient m_11777)", () => {
  const ctx = { agent: 'main', bise: true };
  const T = Date.UTC(2026, 9, 6, 9, 46);

  it('a group opens on a new author, after 5 min of silence, on a new day; notices open nothing', () => {
    const a = e({ at_ms: T });
    expect(groupHead(undefined, a, ctx, 'UTC')).toBe(true);
    expect(groupHead(a, e({ at_ms: T + 60_000 }), ctx, 'UTC')).toBe(false);
    expect(groupHead(a, e({ at_ms: T + GROUP_GAP_MS + 1 }), ctx, 'UTC')).toBe(true);
    expect(groupHead(a, e({ kind: 'you', at_ms: T + 1 }), ctx, 'UTC')).toBe(true);
    expect(groupHead(e({ kind: 'you', at_ms: T }), e({ kind: 'you', at_ms: T + 1 }), ctx, 'UTC')).toBe(false);
    expect(groupHead(a, e({ kind: 'notice', at_ms: T + 1 }), ctx, 'UTC')).toBe(true);
    expect(groupHead(e({ kind: 'from_agent', from: 'docs' }), e({ kind: 'from_agent', from: 'perf' }), ctx, 'UTC')).toBe(true);
    const late = Date.UTC(2026, 9, 6, 23, 58);
    expect(groupHead(e({ at_ms: late }), e({ at_ms: late + 3 * 60_000 }), ctx, 'UTC')).toBe(true);
  });

  it("days: 'today', 'yesterday', then 'mon 6 oct'", () => {
    expect(sameDay(T, T + 3_600_000, 'UTC')).toBe(true);
    expect(sameDay(0, T, 'UTC')).toBe(true);
    expect(dayLabel(T, T + 3_600_000, 'UTC')).toBe('today');
    expect(dayLabel(T, T + 86_400_000, 'UTC')).toBe('yesterday');
    expect(dayLabel(T, T + 3 * 86_400_000, 'UTC')).toBe('tue 6 oct');
  });

  it('his words never show the screen_context block', () => {
    const t = 'why is this slow?\n\n<screen_context app="Ghostty">\nThis is what was in front of the user\ntitle: x\n</screen_context>\n';
    expect(stripContext(t)).toBe('why is this slow?');
    expect(stripContext('<screen_context app="X">a</screen_context>\nhi')).toBe('hi');
    expect(stripContext('a < b, no block')).toBe('a < b, no block');
  });

  it('the chip cuts the path, never the app or the host; a url opens, a shot alone is not kept', () => {
    expect(chipOf({ app: 'Chrome', url: 'http://localhost:4801/settings' })).toEqual({
      label: '◫ with Chrome · localhost:4801/sett…',
      open: { url: 'http://localhost:4801/settings' },
      tip: undefined,
    });
    expect(chipOf({ app: 'Zed', file: '/repo/src/main.rs', url: 'https://a.dev/' })?.label).toBe('◫ with Zed · a.dev/ +1');
    expect(chipOf({ app: 'Zed', file: '/repo/src/main.rs' })?.open).toEqual({ file: '/repo/src/main.rs' });
    expect(chipOf({ app: 'Ghostty', shot: 'x.png' })).toEqual({ label: '◫ with Ghostty', open: null, tip: "the screenshot isn't kept" });
    expect(chipOf({ app: 'Ghostty', title: 'zsh — harness' })?.label).toBe('◫ with Ghostty · zsh — harness');
    expect(chipOf({})).toBeNull();
  });

  it("a row that starts with its author's name drops it: the name line says it (ambient m_11934)", () => {
    expect(dropAuthor('perf: the parsed copy cuts it', 'perf')).toBe('the parsed copy cuts it');
    expect(dropAuthor('performance: fine', 'perf')).toBe('performance: fine');
    expect(dropAuthor('the perf: fine', 'perf')).toBe('the perf: fine');
    expect(dropAuthor('hi', '')).toBe('hi');
  });
});

describe("the agent view's tool rows (designer's desktop-screens v6 (2))", () => {
  it("a step's length: '38 s', '1 m 12 s', '2 m', none under 1 s", () => {
    expect(stepTime(38_400)).toBe('38 s');
    expect(stepTime(72_000)).toBe('1 m 12 s');
    expect(stepTime(120_000)).toBe('2 m');
    expect(stepTime(400)).toBe('');
  });

  it('commands and edits are lines with their length; reads and searches fold into counted words', () => {
    const T = 1_791_100_000_000;
    const t = toolLines([
      { pos: 1, at_ms: T, text: 'src/a.rs', kind: 'read' },
      { pos: 2, at_ms: T + 1000, text: 'lighthouse --preset=mobile /p/tee-classic', kind: 'run' },
      { pos: 3, at_ms: T + 39_000, text: 'web/product/Hero.tsx', kind: 'edit' },
      { pos: 4, at_ms: T + 40_000, text: 'reviews', kind: 'search' },
    ]);
    expect(t.lines.map(({ pos, mark, text, time, end }) => ({ pos, mark, text, time, end }))).toEqual([
      { pos: 2, mark: '$', text: 'lighthouse --preset=mobile /p/tee-classic', time: '38 s', end: '38 s' },
      { pos: 3, mark: '±', text: 'web/product/Hero.tsx', time: '1 s', end: '1 s' },
    ]);
    expect(t.rest.map((r) => r.pos)).toEqual([1, 4]);
    expect(t.restWords).toBe('read 1 file, searched once');
    const many = toolLines(Array.from({ length: 8 }, (_, i) => ({ pos: i, at_ms: 0, text: `cmd ${String(i)}`, kind: 'run' })));
    expect(many.lines).toHaveLength(TOOL_LINES);
    expect(many.restWords).toBe('ran 2 commands');
  });

  it("R11/S9: each call's state on its line as the TUI's: ✓ time, ✗ exit · time with its error line, code and output to open", () => {
    expect(toolTime(300)).toBe('0.3 s');
    // rounded as the TUI's {:.1}, never floored (qa-flows' tools-real: '✓ 0.1s' there)
    expect(toolTime(60)).toBe('0.1 s');
    expect(toolTime(2_160)).toBe('2.2 s');
    expect(toolTime(4_120)).toBe('4.1 s');
    expect(toolTime(12_400)).toBe('12 s');
    expect(toolTime(64_000)).toBe('1 m 4 s');
    const t = toolLines([
      { pos: 1, at_ms: 0, text: 'cargo test', kind: 'run', state: 'ok', ms: 300, code: 'cargo test', out: 'ok: 12 passed' },
      { pos: 2, at_ms: 0, text: 'npm run lint', kind: 'run', state: 'err', ms: 2_100, exit: 1, err: 'src/a.ts:3 unused x', code: 'npm run lint', out: 'exit 1: src/a.ts:3 unused x' },
      { pos: 3, at_ms: 0, text: 'read_file: {"path":"gone.rs"}', kind: 'read', state: 'err', err: 'no such file' },
      { pos: 4, at_ms: 0, text: 'src/b.rs', kind: 'read', state: 'ok', ms: 10 },
      { pos: 5, at_ms: 0, text: 'cargo build', kind: 'run', state: 'run' },
    ]);
    expect(t.lines.map((l) => [l.pos, l.mark, l.state, l.end, l.err])).toEqual([
      [1, '$', 'ok', '✓ 0.3 s', ''],
      [2, '$', 'err', '✗ exit 1 · 2.1 s', 'src/a.ts:3 unused x'],
      [3, '', 'err', '✗', 'no such file'],
      [5, '$', 'run', '', ''],
    ]);
    expect(t.lines[1]).toMatchObject({ code: 'npm run lint', out: 'exit 1: src/a.ts:3 unused x' });
    // the failed read is a line: it isn't counted again in the words
    expect(t.restWords).toBe('read 1 file');
    expect(toolEnd({ pos: 1, at_ms: 0, text: '', kind: 'run', state: 'err', exit: 0 }, '')).toBe('✗');
    expect(toolEnd({ pos: 1, at_ms: 0, text: '', kind: 'run', state: 'ok' }, '3 s')).toBe('✓');
  });
});

describe("a project's bise hands off (designer's desktop-screens v6 (3))", () => {
  it("reads the hub's spawn notice: the agent and its brief's first line", () => {
    expect(handoffOf('✚ main → new agent @perf : product page speed\nmore words')).toEqual({ agent: 'perf', brief: 'product page speed' });
    expect(handoffOf('✚ main → new task @t : x')).toEqual({ agent: 't', brief: 'x' });
    expect(handoffOf('✚ main → new agent @solo')).toEqual({ agent: 'solo', brief: '' });
    expect(handoffOf('session restored · 6 messages')).toBeNull();
  });
});

describe('D14 / D15: a report is a status line, a command reads once', () => {
  it("'[report: blocked] waiting for your answer: …' -> 'blocked · waiting for your answer' (the card says the question)", () => {
    expect(reportLine('[report: blocked] waiting for your answer: cart page or checkout only?')).toBe('blocked · waiting for your answer');
    expect(reportLine('[report: done] p95 at 180 ms, nothing to fix.\n- ran 3 times')).toBe('done · p95 at 180 ms, nothing to fix.');
    expect(reportStatus('[report: done] p95 at 180 ms, nothing to fix.\n- ran 3 times')).toBe('✓ done · p95 at 180 ms, nothing to fix.');
    expect(reportStatus('[report: failed] the staging token expired.')).toBe('✗ failed · the staging token expired.');
    expect(reportStatus('[report: blocked] waiting for your answer: x?')).toBe('blocked · waiting for your answer');
    expect(reportStatus('a plain message')).toBeNull();
    expect(reportLine('a plain answer')).toBeNull();
    expect(reportLine('waiting for your answer: x', 'blocked')).toBe('blocked · waiting for your answer');
  });
  it("'bash: bash /Users/…' reads '$ bash /Users/…'; a tool's args object never shows", () => {
    expect(toolWords('bash: bash /Users/me/x.sh')).toBe('bash /Users/me/x.sh');
    expect(toolWords('cargo test')).toBe('cargo test');
    expect(toolWords('edit: {"file_path":"panels.md"}')).toBe('edit panels.md');
    expect(toolWords('read_file: {"path":"a.rs"}')).toBe('read_file a.rs');
    expect(toolWords('bash: {"command":"ls -la\\nmore"}')).toBe('ls -la');
    expect(toolWords('grep: {"pattern":"slow","path":"src"}')).toBe('grep src');
    expect(toolWords('web_fetch: {"url":"https://x.test"}')).toBe('web_fetch https://x.test');
    expect(toolWords('todo: {"items":[1,2]}')).toBe('todo');
    expect(toolWords('looking for the slow query')).toBe('looking for the slow query');
    const t = toolLines([{ pos: 1, at_ms: 0, text: 'edit: {"file_path":"panels.md"}', kind: 'edit' }, { pos: 2, at_ms: 0, text: 'read_file: {"path":"a.rs"}', kind: 'read' }]);
    expect(t.lines[0]?.text).toBe('edit panels.md');
    // a folded read opens to a row with the TUI's verb (designer m_14269)
    expect(t.rest[0]?.text).toBe('read a.rs');
  });
});

describe("N2: a scheduled task's line names the agent, not the task's number", () => {
  it("'main scheduled #1 for dashboards · every 30m · next 16:56' -> 'main scheduled dashboards · …'", () => {
    expect(schedHead('main scheduled #1 for dashboards · every 30m · next 16:56')).toBe('main scheduled dashboards · every 30m · next 16:56');
    expect(schedHead('main scheduled #48 for perf · every 2m · 6 times · next 14:22')).toBe('main scheduled perf · every 2m · 6 times · next 14:22');
    expect(schedHead('a plain line')).toBe('a plain line');
    // never the internal number (designer m_14246)
    expect(schedHead('scheduled #48 ended · stopped by you', 'perf')).toBe('scheduled perf ended · stopped by you');
    expect(schedHead('scheduled #48 ended · stopped by you')).toBe('a scheduled task ended · stopped by you');
  });
});

describe('briefOf (the hub brief, the TUI is_brief)', () => {
  it('reads the name, the objective and the body without its heading', () => {
    const text = '# Task `gift-ui`\n\nObjective: make the gift page fast\n\nNo end criterion: this is a long-running task. Stay available.\n';
    expect(briefOf(text)).toEqual({ name: 'gift-ui', objective: 'make the gift page fast', body: 'Objective: make the gift page fast\n\nNo end criterion: this is a long-running task. Stay available.' });
  });
  it('is none for any other text, a heading elsewhere included', () => {
    expect(briefOf('make the gift page fast')).toBeNull();
    expect(briefOf('see # Task `x`')).toBeNull();
    expect(briefOf('# Tasks')).toBeNull();
  });
});
