// thread/log-screen · TP-N2 (docs/terminal-parity.md; the TUI's rust/tui/src/logview.rs, designer
// m_17266): '/log' in an agent's composer opens its raw session, read-only, in the window. The
// window asks the hub `log {project, agent}`, draws the newest page at the end (one header row per
// entry with its kind's label, turns and compactions as rules, a body past 6 lines folded as
// '▸ 34 lines · 2.1 KB'), asks `log {before: first seq}` when he scrolls to the top and keeps his
// place, finds with ⌘F and counts 'n of m', and esc goes back to the thread. FakeCore stands in
// for the hub (its world holds the two pages). Light + dark shots at 1100. Owner: amb-web.
import { FakeCore, launchDesktop, test, expect } from "../../harness";

const P = "acme-1a2b3c4d";
const T0 = 1791100000000;
const agent = (name: string) => ({
  name,
  main: name === "main",
  status: "idle",
  archived: false,
  title: "",
  purpose: "",
  since_ms: T0,
  waits: 0,
});
const at = (s: number) => T0 + s * 1000;
const longOut = Array.from(
  { length: 34 },
  (_, i) =>
    `test query::case_${String(i).padStart(2, "0")} ... ${i === 21 ? "FAILED" : "ok"}  (${String(12 + i)} ms)`,
).join("\n");

// the newest page: seq 300..312, older remain
const newest = [
  {
    seq: 300,
    turn: 8,
    at_ms: at(600),
    role: "event",
    head: "",
    rule: "compacted · 42k → 9k",
  },
  {
    seq: 301,
    turn: 8,
    at_ms: at(601),
    role: "summary",
    head: "what happened so far",
    body: {
      kind: "md",
      text: "perf found the slow **sort** in `query.rs` and is testing a fix.",
    },
  },
  {
    seq: 302,
    turn: 9,
    at_ms: at(610),
    role: "event",
    head: "",
    rule: "turn 9 · 801k in (399k cached) · 95 out",
  },
  {
    seq: 303,
    turn: 9,
    at_ms: at(611),
    role: "you",
    head: "run the query tests again",
    body: { kind: "md", text: "run the query tests again" },
  },
  {
    seq: 304,
    turn: 9,
    at_ms: at(612),
    role: "thinking",
    head: "the sort is fixed; check the slow case",
    body: {
      kind: "md",
      text: "the sort is fixed; check the slow case first, then the whole suite.",
    },
  },
  {
    seq: 305,
    turn: 9,
    at_ms: at(613),
    role: "call",
    tool: "bash",
    head: "$ cargo test -q query",
    body: { kind: "code", lang: "bash", text: "cargo test -q query" },
  },
  {
    seq: 306,
    turn: 9,
    at_ms: at(617),
    role: "result",
    tool: "bash",
    ok: false,
    head: "test query::case_21 ... FAILED",
    meta: "call_7 failed · exit 101 · 4.2 s",
    body: { kind: "plain", text: longOut },
  },
  {
    seq: 307,
    turn: 9,
    at_ms: at(618),
    role: "injected",
    head: "bise_state: 3 agents working",
    body: { kind: "md", text: "bise_state: 3 agents working" },
  },
  {
    seq: 308,
    turn: 9,
    at_ms: at(620),
    role: "call",
    tool: "edit",
    head: "± edit src/query.rs",
    body: {
      kind: "code",
      lang: "json",
      text: '{"path":"src/query.rs","old":"sort_by(|a, b| a.cmp(b))","new":"sort_unstable()"}',
    },
  },
  {
    seq: 309,
    turn: 9,
    at_ms: at(621),
    role: "result",
    tool: "edit",
    ok: true,
    head: "edited src/query.rs",
    body: { kind: "plain", text: "edited src/query.rs (1 line)" },
  },
  {
    seq: 312,
    turn: 9,
    at_ms: at(640),
    role: "assistant",
    head: "case 21 was the empty slice; fixed and green",
    body: {
      kind: "md",
      text: "case 21 was the **empty slice**: `sort_unstable` on it is fine, the old guard returned early.\n\nall 34 query tests pass now, the slow one in 12 ms.",
    },
  },
];
// the page before 300
const older = [
  {
    seq: 120,
    turn: 4,
    at_ms: at(300),
    role: "event",
    head: "",
    rule: "turn 4 · 210k in (180k cached) · 40 out",
  },
  {
    seq: 121,
    turn: 4,
    at_ms: at(301),
    role: "you",
    head: "why is the search page slow?",
    body: { kind: "md", text: "why is the search page slow?" },
  },
  {
    seq: 122,
    turn: 4,
    at_ms: at(305),
    role: "assistant",
    head: "looking at the query plan first",
    body: { kind: "md", text: "looking at the query plan first." },
  },
];
const world = () => [
  {
    ev: "projects",
    projects: [
      {
        project: P,
        name: "acme",
        path: "/nowhere/acme",
        git: true,
        home: false,
        order: 0,
        agents: 2,
        working: 0,
        waits: 0,
        running: true,
      },
    ],
  },
  {
    ev: "welcome",
    project: P,
    proto: 1,
    workspace: "/nowhere/acme",
    name: "acme",
  },
  { ev: "agents", project: P, agents: [agent("main"), agent("perf")] },
  {
    ev: "commands",
    items: [
      {
        name: "/log",
        desc: "the agent's raw session log",
        args: [],
        runs: "window",
        runnable: true,
      },
    ],
  },
  {
    ev: "thread",
    project: P,
    agent: "perf",
    entries: [
      {
        pos: 1,
        at_ms: at(640),
        kind: "agent",
        text: "case 21 was the empty slice; fixed and green.",
      },
    ],
    before: null,
    more: false,
  },
  { ev: "log", project: P, agent: "perf", items: newest, more: true },
  { ev: "log", project: P, agent: "perf", items: older, more: false },
];
const logCmds = (core: FakeCore) => core.cmds().filter((c) => c.cmd === "log");

test("thread/log-screen: /log opens the raw session (rows, rules, folds), pages older on scroll-up, finds, esc back", async () => {
  test.setTimeout(120_000);
  const core = new FakeCore(
    world() as unknown as ConstructorParameters<typeof FakeCore>[0],
  );
  const s = await launchDesktop({
    core,
    route: `agent/${P}/perf`,
    size: "1100x760",
  });
  try {
    const { page } = s;
    const shot = (name: string) =>
      page.screenshot({ path: test.info().outputPath(name) });
    const field = page.locator('[data-testid="composer.field"]');
    await expect(field).toBeVisible({ timeout: 10_000 });
    await field.click();
    await page.keyboard.type("/log");
    await page.keyboard.press("Enter");
    const log = page.getByTestId("log");
    await expect(log, "/log opens the screen").toBeVisible({ timeout: 5000 });
    await expect.poll(() => logCmds(core), { timeout: 3000 }).toHaveLength(1);
    expect(logCmds(core)[0], "the newest page of the agent in view").toEqual({
      cmd: "log",
      project: P,
      agent: "perf",
    });
    await expect(page.locator(".b-head .t1")).toHaveText("perf · session log");
    await expect(page.getByTestId("log.sub")).toHaveText(
      "read-only · redacted",
    );
    await expect(
      page.getByTestId("log.tab.model"),
      "'what the model got' has its tab, greyed",
    ).toHaveAttribute("aria-disabled", "true");

    const row = (seq: number) =>
      page.locator(`[data-testid^="log.row."][data-seq="${String(seq)}"]`);
    const id = async (seq: number) =>
      (await row(seq).getAttribute("data-testid")) ?? "";
    await expect(row(312)).toBeVisible({ timeout: 5000 });
    // labels: the TUI's role column
    const label = async (seq: number) =>
      page.getByTestId(`${await id(seq)}.label`).textContent();
    expect(await label(303)).toBe("› you");
    expect(await label(312)).toBe("● perf");
    expect(await label(305)).toBe("$ bash");
    expect(await label(306)).toBe("✗ result");
    expect(await label(307)).toBe("⊕ bise");
    // rules: the turn faint, the compaction green
    await expect(page.getByTestId("log.rule.302")).toHaveText(
      "turn 9 · 801k in (399k cached) · 95 out",
    );
    await expect(page.getByTestId("log.rule.300")).toHaveClass(/compact/);
    // the 34-line result folds with the TUI's words; a short body stays open
    const fold = page.getByTestId(`${await id(306)}.fold`);
    await expect(fold).toHaveText(/^▸ 34 lines · \d\.\d KB$/);
    await expect(page.getByTestId(`${await id(312)}.body`)).toContainText(
      "all 34 query tests pass now",
    );
    // opens at the end: the newest entry in view
    const list = page.getByTestId("log.list");
    const atEnd = () =>
      list.evaluate((el) => el.scrollHeight - el.scrollTop - el.clientHeight);
    expect(await atEnd(), "opens at the end").toBeLessThan(4);
    // the key line stays one line at 1100 and 'esc back' is always in it, last (keys drop from the end)
    const keys = page.getByTestId("log.keys");
    const kb = await keys.boundingBox();
    const eb = await keys.locator(".lg-k.esc").boundingBox();
    const fb = await keys.locator(".lg-k").first().boundingBox();
    expect(eb, "esc back shows").not.toBeNull();
    expect(
      Math.abs((eb?.y ?? 0) - (fb?.y ?? 99)),
      "esc back is on the first key's row (one line)",
    ).toBeLessThanOrEqual(2);
    expect(
      (eb?.x ?? 0) + (eb?.width ?? 0),
      "esc back is inside the line",
    ).toBeLessThanOrEqual((kb?.x ?? 0) + (kb?.width ?? 0));
    await shot("1-log-end.png");

    // space opens a fold (cursor on it), ⌘O opens all
    await fold.click();
    await expect(page.getByTestId(`${await id(306)}.body`)).toContainText(
      "case_21 ... FAILED",
    );
    await expect(page.getByTestId(`${await id(306)}.body`)).toContainText(
      "call_7 failed · exit 101 · 4.2 s",
    );
    await shot("2-log-result-open.png");
    await page.keyboard.press("Space");
    await expect(
      page.getByTestId(`${await id(306)}.fold`),
      "space folds it again",
    ).toBeVisible();

    // find: ⌘F, the count at the key line's right, n moves on
    await page.keyboard.press("Meta+f");
    const find = page.getByTestId("log.find");
    await expect(find).toBeFocused();
    await page.keyboard.type("query");
    const count = page.getByTestId("log.count");
    await expect(count).toHaveText(/^1 of \d+$/);
    const total = Number(
      /of (\d+)/.exec((await count.textContent()) ?? "")?.[1] ?? 0,
    );
    expect(total, "query is in several rows").toBeGreaterThan(2);
    await page.keyboard.press("Enter");
    await expect(count).toHaveText(`1 of ${String(total)}`);
    await page.keyboard.press("Enter");
    await expect(count).toHaveText(`2 of ${String(total)}`);
    await shot("3-log-find.png");
    await page.keyboard.press("Escape");
    await expect(count, "esc in the field clears the find").toHaveCount(0);
    await expect(log, "and stays on /log").toBeVisible();

    // scroll to the top: the page before 300, his place kept
    const anchor = row(301);
    // where the anchor sits once the list is at its top (the scroll below is what asks)
    const top = await list.evaluate((el) => el.scrollTop);
    const y0 = ((await anchor.boundingBox())?.y ?? 0) + top;
    await list.evaluate((el) => {
      el.scrollTop = 0;
    });
    await expect.poll(() => logCmds(core), { timeout: 3000 }).toHaveLength(2);
    expect(logCmds(core)[1]).toEqual({
      cmd: "log",
      project: P,
      agent: "perf",
      before: 300,
    });
    await expect(row(121)).toHaveCount(1, { timeout: 3000 });
    await expect(
      page.getByTestId("log.more"),
      "no older rows left",
    ).toHaveCount(0);
    const order = await page
      .locator('[data-testid^="log.row."][data-seq]')
      .evaluateAll((els) => els.map((e) => Number(e.getAttribute("data-seq"))));
    expect(order, "oldest first").toEqual([...order].sort((a, b) => a - b));
    expect(
      (await anchor.boundingBox())?.y ?? 0,
      "the older page goes above, the rows he read stay put",
    ).toBeLessThan(y0 + 1);
    await shot("4-log-older.png");

    // dark
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "dark");
    });
    await page.getByTestId(`${await id(306)}.fold`).click();
    await row(306).scrollIntoViewIfNeeded();
    await shot("5-log-dark-result.png");
    await page.keyboard.press("Meta+f");
    await page.keyboard.type("slice");
    await expect(count).toHaveText(/^1 of \d+$/);
    await shot("6-log-dark-find.png");
    await page.keyboard.press("Escape");
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "light");
    });

    // esc goes back to the thread
    await log.focus();
    await page.keyboard.press("Escape");
    await expect(log).toHaveCount(0, { timeout: 3000 });
    await expect(field, "back on the thread").toBeVisible();
  } finally {
    await s.close();
  }
});
