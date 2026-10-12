// composer/dictate-anywhere · his try a43609b2 (ambient-lead m_19364, main m_19363), two items:
// (1) « le listening qu'on écrit et le placeholder de l'input sont superposés »: while he dictates,
//     the field's placeholder is hidden; one line shows ('listening…' or his words), never two
//     texts on top of each other. Empty and non-empty composer, light and dark at 1100.
// (2) « j'ai essayé de faire Ctrl+R alors que je n'avais pas le focus dans l'input et il ne s'est
//     rien passé »: ctrl+r anywhere in the window (a thread row clicked, a sidebar row selected)
//     focuses the composer, caret at the end, and starts dictation at once (dictate_start reaches
//     the core); ctrl+r twice from there is voice mode, as in the field. Never: another text field
//     (an agent's rename), a dialog open (the keys sheet), the terminal panel (ctrl+r is the
//     shell's: its reverse search when a `bise pty` is at hand).
// The real thread screen on the scripted core (FakeCore: it records the commands, no mic).
// Owner: amb-web (src/composer/grab.ts, src/composer/pm/PmField.tsx).
import { existsSync, mkdtempSync } from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";
import {
  FakeCore,
  FakeHelper,
  launchDesktop,
  test,
  expect,
} from "../../harness";

const HOME = "bise-home-00000000";
const P = "telemetry-cf9cb2fe";
const agent = (name: string) => ({
  name,
  main: name === "main",
  status: "idle",
  archived: false,
  title: "",
  purpose: "",
  since_ms: 1791100000000,
  waits: 0,
});
const thread = (name: string) => ({
  ev: "thread",
  project: P,
  agent: name,
  entries: [
    {
      pos: 1,
      at_ms: 1791100001000,
      kind: "agent",
      text: `${name} is here: the thumbnails are 380 KB now, want them smaller?`,
    },
  ],
  before: null,
  more: false,
});
const projects = (dir: string) => ({
  ev: "projects",
  projects: [
    {
      project: HOME,
      name: "bise",
      path: "/nowhere",
      git: false,
      home: true,
      order: 0,
      agents: 1,
      working: 0,
      waits: 0,
      running: true,
    },
    {
      project: P,
      name: "telemetry",
      path: dir,
      git: true,
      home: false,
      order: 1,
      agents: 2,
      working: 0,
      waits: 0,
      running: true,
    },
  ],
});
const world = (theme: "light" | "dark") => [
  {
    ev: "prefs",
    prefs: {
      onboarded: true,
      theme,
      context: { shot: true, url: true, file: true, window_text: false },
      excluded_apps: [],
      quiet: {
        call: true,
        share: true,
        fullscreen: true,
        focus: true,
        batch_min: 20,
        away_card: true,
      },
      voice: { fn_hold: true, fn_twice: "spotlight", language: "auto" },
      shots_keep_days: 7,
    },
  },
  projects("/nowhere/telemetry"),
  {
    ev: "welcome",
    project: HOME,
    proto: 1,
    workspace: "/nowhere",
    name: "bise",
  },
  { ev: "agents", project: HOME, agents: [agent("main")] },
  { ev: "agents", project: P, agents: [agent("main"), agent("alpha")] },
  thread("main"),
  thread("alpha"),
];

const field = (page: Page) => page.getByTestId("composer.field");
/** The live dictation node (schema.ts renders it as a '.b-dictation' span, no test id). */
const dictation = (page: Page) => field(page).locator(".b-dictation");
const fieldFocused = (page: Page) =>
  field(page).evaluate((el) => el.contains(document.activeElement));
const mic = (page: Page) =>
  page.getByTestId("composer.mic").getAttribute("data-state");
/** The placeholders drawn in the composer now (the field's '.ph' span). */
const placeholders = (page: Page) =>
  page
    .locator(
      '[data-testid="composer"] .b-field-ph, .b-field-host + .b-field-ph',
    )
    .count();
const starts = (core: FakeCore) =>
  core.cmds().filter((c) => c.cmd === "dictate_start").length;
/** The caret sits right after the dictation node, and the node is the field's last thing. */
const dictationAtEnd = (page: Page) =>
  field(page).evaluate((el) => {
    const d = el.querySelector(".b-dictation");
    if (d === null) return false;
    const r = document.createRange();
    r.selectNodeContents(el);
    r.setStartAfter(d);
    return r.toString().trim() === "";
  });

/** Focus on no field: a thread row clicked (the thread list takes no text). */
async function away(page: Page, name: string): Promise<void> {
  await page.getByTestId("thread.list").getByText(`${name} is here`).click();
  await page.evaluate(() => document.getSelection()?.removeAllRanges());
  expect(await fieldFocused(page), "the composer has no focus").toBe(false);
}

/** The core's answer to the newest `dictate_cancel`: its cancelled final (the real core sends it;
 *  the scripted one is told to here), so the window's mic goes off. */
async function answerCancel(core: FakeCore, seen: number): Promise<void> {
  await expect
    .poll(() => core.cmds().filter((c) => c.cmd === "dictate_cancel").length, {
      message: "the window asks the core to cancel the dictation",
    })
    .toBeGreaterThan(seen);
  const ids = core
    .cmds()
    .filter((c) => c.cmd === "dictate_cancel")
    .slice(seen)
    .map((c) => (c as { id?: unknown }).id)
    .filter((id): id is string => typeof id === "string");
  for (const id of ids)
    await core.send({
      ev: "dictation",
      id,
      text: "",
      final: true,
      cancelled: true,
    } as never);
}
const cancels = (core: FakeCore) =>
  core.cmds().filter((c) => c.cmd === "dictate_cancel").length;

/** esc in the field: the dictation goes, the field as it was. */
async function cancel(page: Page, core: FakeCore): Promise<void> {
  const seen = cancels(core);
  await page.keyboard.press("Escape");
  await answerCancel(core, seen);
  await expect
    .poll(() => mic(page), { message: "esc: the mic is off" })
    .toBe("off");
}

/** The composer's box, a little around it, for designer's sheet. */
async function shot(page: Page, name: string): Promise<void> {
  const box = await page.getByTestId("composer").boundingBox();
  if (box === null) throw new Error("no composer on screen");
  await page.screenshot({
    path: test.info().outputPath(name),
    clip: {
      x: Math.max(0, box.x - 16),
      y: Math.max(0, box.y - 40),
      width: box.width + 32,
      height: box.height + 56,
    },
  });
}

for (const theme of ["light", "dark"] as const) {
  test(`composer/dictate-anywhere (${theme}): ctrl+r in an empty and a non-empty composer hides the placeholder, one line shows`, async () => {
    test.setTimeout(60_000);
    const core = new FakeCore(world(theme) as never);
    const s = await launchDesktop({
      helper: new FakeHelper(),
      core,
      route: `agent/${P}/main`,
      size: "1100x760",
    });
    try {
      const { page } = s;
      await expect(
        page.getByTestId("thread.screen"),
        "main's thread",
      ).toHaveAttribute("data-agent", "main", { timeout: 10_000 });
      await expect(field(page)).toBeVisible();
      await field(page).click();
      expect(
        await placeholders(page),
        "empty: the placeholder shows at rest",
      ).toBe(1);
      await shot(page, `${theme}-0-rest.png`);

      // empty: ctrl+r, 'listening…' alone, no placeholder under it
      await page.keyboard.press("Control+r");
      await expect
        .poll(() => mic(page), { message: "ctrl+r: the mic is on" })
        .toBe("recording");
      await expect(dictation(page), "'listening…' in the field").toHaveText(
        /listening…/,
      );
      expect(
        await placeholders(page),
        "dictating in an empty composer: no placeholder",
      ).toBe(0);
      await shot(page, `${theme}-1-empty-listening.png`);
      await cancel(page, core);
      await expect
        .poll(() => placeholders(page), {
          message: "the dictation gone: the placeholder is back",
        })
        .toBe(1);

      // non-empty: his words then 'listening…' after them, no placeholder
      await page.keyboard.type("note: the tablets ");
      await page.keyboard.press("Control+r");
      await expect.poll(() => mic(page)).toBe("recording");
      await expect(field(page), "his words, then the live part").toContainText(
        "note: the tablets",
      );
      await expect(dictation(page)).toHaveText(/listening…/);
      expect(
        await placeholders(page),
        "dictating after his words: no placeholder",
      ).toBe(0);
      await shot(page, `${theme}-2-typed-listening.png`);
      await cancel(page, core);
      await expect(field(page), "esc: his words stay").toHaveText(
        "note: the tablets ",
      );
      expect(starts(core), "two dictations started").toBe(2);
    } finally {
      await s.close();
    }
  });
}

test("composer/dictate-anywhere: ctrl+r from the thread or a sidebar row takes the composer and dictates at once; twice is voice mode; a text field and a dialog keep theirs", async () => {
  test.setTimeout(90_000);
  const core = new FakeCore(world("light") as never);
  const s = await launchDesktop({
    helper: new FakeHelper(),
    core,
    route: `agent/${P}/main`,
    size: "1100x760",
  });
  try {
    const { page } = s;
    await expect(
      page.getByTestId("thread.screen"),
      "main's thread",
    ).toHaveAttribute("data-agent", "main", { timeout: 10_000 });
    await expect(field(page)).toBeVisible();

    // a thread row clicked, the composer empty
    await away(page, "main");
    await page.keyboard.press("Control+r");
    await expect
      .poll(() => fieldFocused(page), {
        message: "ctrl+r from the thread: the composer has the focus",
      })
      .toBe(true);
    await expect
      .poll(() => mic(page), { message: "…and the mic is on at once" })
      .toBe("recording");
    await core.waitCmd((c) => c.cmd === "dictate_start");
    expect(await placeholders(page), "no placeholder under listening…").toBe(0);
    await page.screenshot({
      path: test.info().outputPath("3-from-thread.png"),
    });
    await cancel(page, core);

    // a thread row clicked, the composer holding a draft: the dictation goes at its end
    await field(page).click();
    await page.keyboard.type("draft words");
    await page.keyboard.press("Home");
    await away(page, "main");
    await page.keyboard.press("Control+r");
    await expect
      .poll(() => mic(page), {
        message:
          "ctrl+r from the thread, a draft in the composer: the mic is on",
      })
      .toBe("recording");
    expect(
      await dictationAtEnd(page),
      "the dictation sits at the draft’s end, the caret after it",
    ).toBe(true);
    await expect(field(page)).toContainText("draft words");
    expect(await placeholders(page)).toBe(0);
    await cancel(page, core);
    await expect(field(page), "esc: the draft as it was").toHaveText(
      "draft words",
    );

    // a sidebar row selected (alpha's): alpha's composer takes it
    await page.getByTestId("app.sidebar.agent.alpha").click();
    await expect(page.getByTestId("thread.screen")).toHaveAttribute(
      "data-agent",
      "alpha",
      { timeout: 5000 },
    );
    expect(
      await fieldFocused(page),
      "the sidebar row has the focus, not the composer",
    ).toBe(false);
    const before = starts(core);
    await page.keyboard.press("Control+r");
    await expect
      .poll(() => mic(page), {
        message: "ctrl+r from the sidebar: the mic is on",
      })
      .toBe("recording");
    expect(await fieldFocused(page), "alpha's composer has the focus").toBe(
      true,
    );
    expect(starts(core), "one dictation started").toBe(before + 1);
    await cancel(page, core);

    // ctrl+r twice from outside: voice mode with alpha, the first press's dictation cancelled
    await away(page, "alpha");
    const seenTwice = cancels(core);
    await page.keyboard.press("Control+r");
    await page.keyboard.press("Control+r");
    const vm = await core.waitCmd((c) => c.cmd === "voice_mode");
    expect(
      vm,
      "ctrl+r twice: voice mode on with the agent in view",
    ).toMatchObject({
      cmd: "voice_mode",
      project: P,
      agent: "alpha",
      on: true,
    });
    // the first press's dictation cancelled (answered as the core would)
    await answerCancel(core, seenTwice);
    await expect
      .poll(() => mic(page), { message: "voice mode: the composer's mic off" })
      .toBe("off");

    // never: another text field (alpha's rename keeps the focus, no dictation)
    await page.getByTestId("thread.more").click();
    const rename = page.locator('[data-testid="agents.rename.alpha"]');
    await expect(rename, "alpha's settings").toBeVisible({ timeout: 3000 });
    await rename.click();
    const n = starts(core);
    await page.keyboard.press("Control+r");
    await page.waitForTimeout(500);
    expect(starts(core), "ctrl+r in the rename field starts nothing").toBe(n);
    expect(
      await rename.evaluate((el) => el === document.activeElement),
      "the rename field keeps the focus",
    ).toBe(true);
    await page.keyboard.press("Escape");

    // never: a dialog open (the keys sheet, ?)
    await page.getByTestId(`app.sidebar.project.${P}`).click();
    await expect(page.getByTestId("thread.screen")).toHaveAttribute(
      "data-agent",
      "main",
      { timeout: 5000 },
    );
    await away(page, "main");
    await page.keyboard.press("?");
    const help = page.locator('[role="dialog"][aria-label="keys"]');
    await expect(help, "? opens the keys sheet").toBeVisible({ timeout: 3000 });
    await page.keyboard.press("Control+r");
    await page.waitForTimeout(500);
    expect(starts(core), "ctrl+r with a dialog open starts nothing").toBe(n);
    expect(
      await fieldFocused(page),
      "the composer stays unfocused under the dialog",
    ).toBe(false);
    await page.screenshot({
      path: test.info().outputPath("4-dialog-keeps.png"),
    });
  } finally {
    await s.close();
  }
});

function bise(): string | undefined {
  const set = process.env["BISE_CHECK_BISE"];
  if (set !== undefined && set.startsWith("/")) return set;
  const repo = path.resolve(__dirname, "..", "..", "..", "..");
  return ["release", "debug"]
    .map((k) => path.join(repo, "rust", "target", k, "bise"))
    .find((p) => existsSync(p));
}

test("composer/dictate-anywhere: with the terminal panel focused, ctrl+r is the shell’s", async () => {
  test.setTimeout(60_000);
  const bin = bise();
  const core = new FakeCore(world("light") as never);
  const s = await launchDesktop({
    helper: new FakeHelper(),
    core,
    route: `agent/${P}/main`,
    size: "1100x760",
    ...(bin === undefined ? {} : { env: { BISE_DESKTOP_PTY: bin } }),
  });
  try {
    const { page } = s;
    if (bin !== undefined) {
      // `bise pty` runs only inside the run's jail: the project's folder goes there
      const home = await s.app.evaluate(() => process.env["HOME"] ?? "");
      await core.send(
        projects(mkdtempSync(path.join(home, "dictate-term-"))) as never,
      );
    }
    await expect(
      page.getByTestId("thread.screen"),
      "main's thread",
    ).toHaveAttribute("data-agent", "main", { timeout: 10_000 });
    await expect(field(page)).toBeVisible();
    await page.keyboard.press("Control+Backquote");
    await expect(
      page.getByTestId("terminal.panel"),
      "⌃` shows the panel",
    ).toBeVisible({ timeout: 3000 });
    const inTerm = () =>
      page.evaluate(
        () =>
          document
            .querySelector('[data-testid="terminal.screen"]')
            ?.contains(document.activeElement) ?? false,
      );
    await expect
      .poll(inTerm, { message: "the terminal has the focus" })
      .toBe(true);
    if (bin !== undefined)
      await expect(page.getByTestId("terminal.screen")).toHaveAttribute(
        "data-state",
        "live",
        { timeout: 10_000 },
      );
    await page.keyboard.press("Control+r");
    await page.waitForTimeout(600);
    expect(starts(core), "ctrl+r in the terminal starts no dictation").toBe(0);
    expect(await inTerm(), "the terminal keeps the focus").toBe(true);
    expect(await mic(page), "the mic stays off").toBe("off");
    if (bin !== undefined) {
      const rows = page.locator('[data-testid="terminal.screen"] .xterm-rows');
      await expect(
        rows,
        "the shell got ctrl+r: its reverse search",
      ).toContainText(/reverse-i-search|bck-i-search/, { timeout: 5000 });
    }
    await page.screenshot({
      path: test.info().outputPath("5-terminal-keeps.png"),
    });
  } finally {
    await s.close();
  }
});
