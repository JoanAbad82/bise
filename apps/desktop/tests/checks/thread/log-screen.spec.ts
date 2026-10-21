// thread/log-screen · /debug (the TUI's rust/tui/src/logview.rs, designer m_17266 and
// debug-views v3): '/debug' in an agent's composer opens its raw session, read-only, in the
// window. The window asks the hub `log {project, agent}`, draws the newest page at the end (one
// header row per entry with its kind's label, turns and compactions as rules, a body past 6 lines
// folded as '▸ 34 lines · 2.1 KB'), asks `log {before: first pos}` when he scrolls to the top and
// keeps his place, finds in the whole history with ⌘F (`log {find}`, the hub's hits) and counts
// 'n of m'; ⌘] opens the completion tab (`completion {}`: the ring's newest request, bash as a
// command, run_typescript as code, JSON calls, markdown), [ ] step requests, r the raw JSON; esc
// goes back to the thread. FakeCore stands in for the hub. Light + dark shots at 1100.
// Owners: amb-web, debug-cmd.
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
        name: "/debug",
        desc: "the agent in view: its raw session, or a request as its provider got it",
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
  { ev: "log", project: P, agent: "perf", items: newest.map(withPos), more: true },
  { ev: "log", project: P, agent: "perf", items: older.map(withPos), more: false },
  completion(7, 41),
  completion(6, 40),
  { ...completion(7, 41), raw: true },
];
// the hub's rows: pos (paging, hits) here the seq
const withPos = <T extends { seq: number }>(it: T) => ({ ...it, pos: it.seq });
const logCmds = (core: FakeCore) =>
  core.cmds().filter((c) => c.cmd === "log" && !("find" in c));
const findCmds = (core: FakeCore) =>
  core.cmds().filter((c) => c.cmd === "log" && "find" in c);
const compCmds = (core: FakeCore) =>
  core.cmds().filter((c) => c.cmd === "completion");

/** A request of the ring as the hub cuts it (bise_session::completion): the head, the system
 *  prompt, then the messages with a bash call, a run_typescript call and a JSON call. */
function completion(slot: number, req: number) {
  const md = (text: string) => ({ kind: "md", text });
  const code = (lang: string, text: string) => ({ kind: "code", lang, text });
  const row = (n: number, role: string, head: string, blocks: unknown[]) => ({
    n,
    role,
    head,
    blocks,
    bytes: 400 + n * 10,
    tokens: 100 + n * 3,
  });
  const slots = [6, 7].map((s) => ({
    slot: s,
    req: s + 34,
    kind: "anthropic",
    model: "anthropic/claude-opus-5-5",
    at_ms: at(600 + s),
  }));
  return {
    ev: "completion",
    project: P,
    agent: "perf",
    slot: slots.find((s) => s.slot === slot),
    family: "anthropic",
    bytes: 41_200,
    slots,
    rows: [
      row(0, "request", `anthropic · claude-opus-5-5 · 46 tools · request ${String(req)}`, [
        { label: "params", body: code("json", '{\n  "max_tokens": 32000,\n  "stream": true\n}') },
      ]),
      row(1, "system", "the prompt bise sends perf", [md("You are **perf**, an agent of bise.\n\nline\nline\nline\nline\nline")]),
      row(2, "user", "make the product page faster on mobile", [md("make the product page faster on mobile")]),
      row(3, "assistant", "pnpm bench web/product --runs 3", [
        md("i'll bench it first."),
        { label: "tool_use · bash", body: code("bash", "pnpm bench web/product --runs 3") },
      ]),
      row(4, "user", "p50 2.2 s · p95 3.1 s · lcp hero.jpg", [
        { label: "result", body: { kind: "plain", text: "p50 2.2 s · p95 3.1 s · lcp hero.jpg" } },
      ]),
      row(5, "assistant", "read lighthouse.json", [
        {
          label: "tool_use · run_typescript",
          body: code("ts", "const r = JSON.parse(await bash('cat lighthouse.json'));\nreturn r.audits.slice(0, 5).map((a) => a.id);"),
        },
      ]),
      row(6, "assistant", "web_search", [
        { label: "tool_use · web_search", body: code("json", '{\n  "query": "lcp hero image preload",\n  "limit": 5\n}') },
      ]),
      row(7, "assistant", `run ${String(req)}: the page paints in 2.2 s`, [md(`run ${String(req)}: the page paints in **2.2 s** on mobile.`)]),
    ],
  };
}

test("thread/log-screen: /debug opens the raw session (rows, rules, folds), pages older on scroll-up, finds in the whole history, the completion tab, esc back", async () => {
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
    await page.keyboard.type("/debug");
    await page.keyboard.press("Enter");
    const log = page.getByTestId("log");
    const pane = page.getByTestId("debug.history");
    await expect(log, "/debug opens the screen").toBeVisible({ timeout: 5000 });
    await expect.poll(() => logCmds(core), { timeout: 3000 }).toHaveLength(1);
    expect(logCmds(core)[0], "the newest page of the agent in view").toEqual({
      cmd: "log",
      project: P,
      agent: "perf",
    });
    await expect(page.locator(".b-head .t1")).toHaveText("perf · debug");
    await expect(page.getByTestId("log.sub")).toHaveText(
      "read-only · redacted",
    );
    await expect(
      page.getByTestId("log.tab.history"),
      "history is the tab shown",
    ).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId("log.tab.completion")).toHaveAttribute(
      "aria-selected",
      "false",
    );

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
    // designer m_17531: an edit as the thread shows it, '+1 −1' and − / + lines, args one fold below
    const edit = await id(308);
    await expect(page.getByTestId(`${edit}.counts`)).toHaveText("+1−1");
    const dl = page.getByTestId(`${edit}.diff`).locator(".b-dl");
    await expect(dl).toHaveText([
      "−sort_by(|a, b| a.cmp(b))",
      "+sort_unstable()",
    ]);
    await expect(dl.nth(0)).toHaveClass(/rm/);
    await expect(dl.nth(1)).toHaveClass(/ad/);
    await expect(page.getByTestId(`${edit}.args`)).toHaveText("▸ args");
    // the prose's markdown colours are the thread's (ds md.css, his ask m_11451; designer m_17580):
    // bold and inline code read as a .b-md probe outside the screen reads them
    const colorOf = (sel: string) =>
      page
        .locator(`[data-seq="312"] .lg-prose ${sel}`)
        .first()
        .evaluate((el) => getComputedStyle(el).color);
    const md = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.className = "b-md";
      probe.innerHTML = "<p>a <strong>b</strong> <code>c</code></p>";
      document.body.append(probe);
      const of = (s: string) =>
        getComputedStyle(probe.querySelector(s) as Element).color;
      const out = { p: of("p"), strong: of("strong"), code: of("code") };
      probe.remove();
      return out;
    });
    expect(md.strong, "md.css gives bold its own colour").not.toBe(md.p);
    expect(await colorOf("strong"), "bold in md.css's colour").toBe(md.strong);
    expect(await colorOf("code"), "inline code in md.css's colour").toBe(
      md.code,
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
    // designer m_17531 (5): a long entry closed, '▸ 34 lines · 1.2 KB'
    await row(306).scrollIntoViewIfNeeded();
    await shot("5-log-long-closed.png");

    // find: ⌘F, the count at the key line's right, n moves on
    await page.keyboard.press("Meta+f");
    const find = page.getByTestId("log.find");
    await expect(find).toBeFocused();
    await page.keyboard.type("query");
    const count = page.getByTestId("log.count");
    // the hub finds in the whole history (both pages here), the newest hit first
    await expect(count).toHaveText(/^(\d+) of \1$/);
    await expect.poll(() => findCmds(core).at(-1), { timeout: 3000 }).toEqual({
      cmd: "log",
      project: P,
      agent: "perf",
      find: "query",
    });
    const total = Number(
      /of (\d+)/.exec((await count.textContent()) ?? "")?.[1] ?? 0,
    );
    expect(total, "query is in several rows").toBeGreaterThan(2);
    await page.keyboard.press("Enter");
    await expect(count).toHaveText(`${String(total)} of ${String(total)}`);
    await page.keyboard.press("Enter");
    await expect(count, "⏎ wraps to the oldest").toHaveText(
      `1 of ${String(total)}`,
    );
    await page.keyboard.press("Enter");
    await expect(count).toHaveText(`2 of ${String(total)}`);
    // only the matched words are marked (CSS highlights), the current match's on its own
    const marks = await page.evaluate(() => {
      const reg = (CSS as unknown as { highlights: Map<string, Set<Range>> })
        .highlights;
      const words = (name: string): string[] =>
        [...(reg.get(name) ?? new Set<Range>())].map((r) =>
          r.toString().toLowerCase(),
        );
      return { all: words("lg-find"), at: words("lg-find-at") };
    });
    expect(marks.at.length, "the current match is marked").toBeGreaterThan(0);
    expect(
      [...marks.all, ...marks.at].every((w) => w === "query"),
      `marks hold only the word: ${JSON.stringify(marks)}`,
    ).toBe(true);
    await shot("3-log-find.png");
    await page.keyboard.press("Escape");
    await expect(count, "esc in the field clears the find").toHaveCount(0);
    await expect(log, "and stays on /debug").toBeVisible();

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
    await pane.focus();
    await page.keyboard.press("Shift+G");
    await expect.poll(atEnd, { timeout: 3000 }).toBeLessThan(4);
    await shot("6-log-dark-end.png");
    // what he types right after ⌘F all goes in the field, none to the composer
    const focusOf = () =>
      page.evaluate(() => {
        const a = document.activeElement;
        return `${a?.tagName ?? "none"}.${a?.getAttribute("data-testid") ?? ""}`;
      });
    const before = await focusOf();
    await page.keyboard.press("Meta+f");
    const after = await focusOf();
    await expect(find, `focus ${before} -> ${after}`).toHaveCount(1, {
      timeout: 1000,
    });
    await page.keyboard.type("slice");
    await expect(find).toHaveValue("slice");
    await expect(count).toHaveText(/^\d+ of \d+$/);
    await page.keyboard.press("Escape");

    // the completion tab: ⌘] from history, the newest request of the ring as sent
    await pane.focus();
    await page.keyboard.press("Meta+]");
    const comp = page.getByTestId("debug.completion");
    await expect(comp, "⌘] opens completion").toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId("log.tab.completion")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect.poll(() => compCmds(core), { timeout: 3000 }).toHaveLength(1);
    expect(compCmds(core)[0], "the newest request, as sent").toEqual({
      cmd: "completion",
      project: P,
      agent: "perf",
    });
    await expect(page.getByTestId("comp.title")).toHaveText(
      /^request 41 · 2 of 2 kept · anthropic · anthropic\/claude-opus-5-5 · \d\d:\d\d:\d\d · 40\.2 KB$/,
    );
    // the head and the system prompt fold; bash a command box, run_typescript code, JSON
    await expect(page.getByTestId("comp.row.0.fold")).toBeVisible();
    await expect(page.getByTestId("comp.row.1.fold")).toBeVisible();
    await expect(page.getByTestId("comp.row.3.b1")).toHaveAttribute(
      "data-view",
      "cmd",
    );
    await expect(page.getByTestId("comp.row.3.b1")).toContainText(
      "pnpm bench web/product --runs 3",
    );
    await expect(page.getByTestId("comp.row.5.b0")).toHaveAttribute(
      "data-view",
      "code",
    );
    await expect(
      page.getByTestId("comp.row.5.b0").locator("code.language-ts"),
    ).toHaveCount(1);
    await expect(page.getByTestId("comp.row.6.b0")).toHaveAttribute(
      "data-view",
      "code",
    );
    await expect(
      page.getByTestId("comp.row.6.b0").locator("code.language-json"),
    ).toHaveCount(1);
    await expect(page.getByTestId("comp.row.7.b0")).toHaveAttribute(
      "data-view",
      "md",
    );
    await expect(
      page.getByTestId("comp.row.7.b0").locator("strong"),
    ).toHaveText("2.2 s");
    await expect(page.getByTestId("comp.row.2.role")).toHaveText("user");
    await expect(page.getByTestId("comp.row.7")).toContainText("tok");
    await shot("7-debug-completion-dark.png");
    // a find in the request: '1 of 2'
    await page.keyboard.press("Meta+f");
    await page.keyboard.type("hero");
    await expect(page.getByTestId("log.count")).toHaveText("1 of 2");
    await page.keyboard.press("Escape");
    // [ the request before, ] back; r the raw JSON
    await comp.focus();
    await page.keyboard.press("[");
    await expect.poll(() => compCmds(core).at(-1), { timeout: 3000 }).toEqual({
      cmd: "completion",
      project: P,
      agent: "perf",
      slot: 6,
    });
    await expect(page.getByTestId("comp.title")).toHaveText(/^request 40 · 1 of 2 kept/);
    await page.keyboard.press("]");
    await expect(page.getByTestId("comp.title")).toHaveText(/^request 41 · 2 of 2 kept/);
    await page.keyboard.press("r");
    await expect.poll(() => compCmds(core).at(-1), { timeout: 3000 }).toEqual({
      cmd: "completion",
      project: P,
      agent: "perf",
      slot: 7,
      raw: true,
    });
    await expect(page.getByTestId("comp.title")).toContainText("raw json");
    await page.keyboard.press("r");
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "light");
    });
    await expect(page.getByTestId("comp.title")).not.toContainText("raw json");
    await shot("8-debug-completion-light.png");
    // ⌘[ back to history
    await page.keyboard.press("Meta+[");
    await expect(pane).toBeVisible({ timeout: 3000 });

    // esc goes back to the thread
    await pane.focus();
    await page.keyboard.press("Escape");
    await expect(log).toHaveCount(0, { timeout: 3000 });
    await expect(field, "back on the thread").toBeVisible();
  } finally {
    await s.close();
  }
});
