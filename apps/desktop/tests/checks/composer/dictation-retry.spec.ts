// composer/dictation-retry · designer m_22396 on amb-core's kept takes (276074b2): a take that comes
// back with no words or an error, the core keeping its sound, stays in the field as one line
//   no words: 'didn't catch any words · try again ⌥⏎ · esc drops it'
//   an error: '▲ couldn't transcribe it (<reason>) · try again ⌥⏎ · esc drops it'
// ⌥⏎ or a click on 'try again' sends dictate_retry and the take's chip says transcribing (∿) again; its
// words land in its place; a second failure shows the same line; esc drops it (dictate_cancel).
// One 1100 light crop of each state for designer. The real thread screen on the scripted core.
// Owner: amb-web (src/composer/pm/dictation.ts, pm/schema.ts).
import type { Page } from "@playwright/test";
import { FakeCore, FakeHelper, launchDesktop, test, expect } from "../../harness";

const HOME = "bise-home-00000000";
const P = "telemetry-cf9cb2fe";
const agent = (name: string) => ({ name, main: name === "main", status: "idle", archived: false, title: "", purpose: "", since_ms: 1791100000000, waits: 0 });
const world = [
  {
    ev: "prefs",
    prefs: {
      onboarded: true,
      theme: "light",
      context: { shot: true, url: true, file: true, window_text: false },
      excluded_apps: [],
      quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true },
      voice: { fn_hold: true, fn_twice: "spotlight", language: "auto" },
      shots_keep_days: 7,
    },
  },
  {
    ev: "projects",
    projects: [
      { project: HOME, name: "bise", path: "/nowhere", git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: "telemetry", path: "/nowhere/telemetry", git: true, home: false, order: 1, agents: 1, working: 0, waits: 0, running: true },
    ],
  },
  { ev: "welcome", project: HOME, proto: 1, workspace: "/nowhere", name: "bise" },
  { ev: "agents", project: HOME, agents: [agent("main")] },
  { ev: "agents", project: P, agents: [agent("main")] },
  {
    ev: "thread",
    project: P,
    agent: "main",
    entries: [{ pos: 1, at_ms: 1791100001000, kind: "agent", text: "the thumbnails are 380 KB now, want them smaller?" }],
    before: null,
    more: false,
  },
];

const field = (page: Page) => page.getByTestId("composer.field");
const line = (page: Page) => field(page).locator(".b-dictation");
const mic = (page: Page) => page.getByTestId("composer.mic").getAttribute("data-state");
const cmdsOf = (core: FakeCore, cmd: string) =>
  core
    .cmds()
    .filter((c) => c.cmd === cmd)
    .map((c) => (c as { id?: unknown }).id);

/** The composer's box, a little around it, for designer's sheet. */
async function shot(page: Page, name: string): Promise<void> {
  const box = await page.getByTestId("composer").boundingBox();
  if (box === null) throw new Error("no composer on screen");
  await page.screenshot({
    path: test.info().outputPath(name),
    clip: { x: Math.max(0, box.x - 16), y: Math.max(0, box.y - 40), width: box.width + 32, height: box.height + 56 },
  });
}

test("composer/dictation-retry: a kept take with no words or an error offers 'try again' (⌥⏎ or a click), esc drops it", async () => {
  test.setTimeout(60_000);
  const core = new FakeCore(world as never);
  const s = await launchDesktop({ helper: new FakeHelper(), core, route: `agent/${P}/main`, size: "1100x760" });
  try {
    const { page } = s;
    await expect(page.getByTestId("thread.screen")).toHaveAttribute("data-agent", "main", { timeout: 10_000 });
    await field(page).click();
    await page.keyboard.type("the thumbnails ");
    // a take, stopped: the core comes back with no words and keeps it
    await page.keyboard.press("Control+r");
    const start = await core.waitCmd((c) => c.cmd === "dictate_start");
    const id = (start as { id: string }).id;
    await page.waitForTimeout(600); // past the 400 ms of ctrl+r twice (voice mode)
    await page.keyboard.press("Control+r");
    await core.waitCmd((c) => c.cmd === "dictate_stop");
    await core.send({ ev: "dictation", id, text: "", final: true, kept: true } as never);
    await expect(line(page)).toHaveText("didn't catch any words · try again ⌥⏎ · esc drops it");
    // the field's line is ProseMirror's (at once), the mic React's (its next render): poll
    await expect.poll(() => mic(page), { message: "the mic is off" }).toBe("off");
    await shot(page, "00-no-words.png");

    // ⌥⏎: transcribed once more, the line back to 'transcribing…'
    await page.keyboard.press("Alt+Enter");
    await expect.poll(() => cmdsOf(core, "dictate_retry")).toEqual([id]);
    await expect(line(page).locator(".chip")).toHaveAttribute("data-phase", "transcribing");
    await expect(line(page)).toHaveText("");
    await shot(page, "01-trying-again.png");

    // it fails again, with an error: the same line, its reason; a click tries again
    await core.send({ ev: "dictation", id, text: "", final: true, error: "the transcription timed out.", kept: true } as never);
    // one line (designer m_22494): the reason cuts with … first (or drops whole), the rest never
    await expect(line(page)).toHaveText(/^▲ couldn't transcribe it( \(the transcription ti[^)]*\))? · try again ⌥⏎ · esc drops it$/u);
    await expect.poll(() => line(page).evaluate((e) => e.getClientRects().length), { message: "the error line is one line" }).toBe(1);
    await shot(page, "02-an-error.png");
    await page.getByTestId("composer.dictation.retry").hover();
    await shot(page, "03-an-error-try-again-hovered.png");
    await page.getByTestId("composer.dictation.retry").click();
    await expect.poll(() => cmdsOf(core, "dictate_retry")).toEqual([id, id]);
    await core.send({ ev: "dictation", id, text: "make them 120 KB", final: true } as never);
    await expect(field(page)).toHaveText("the thumbnails make them 120 KB");
    await expect(line(page)).toHaveCount(0);

    // another take that fails: typing keeps its line; esc drops it, the core is told
    await page.keyboard.press("Control+r");
    await expect.poll(() => cmdsOf(core, "dictate_start").length).toBe(2);
    const id2 = cmdsOf(core, "dictate_start")[1] as string;
    await page.waitForTimeout(600);
    await page.keyboard.press("Control+r");
    await expect.poll(() => cmdsOf(core, "dictate_stop").length).toBe(2);
    await core.send({ ev: "dictation", id: id2, text: "", final: true, kept: true } as never);
    await expect(line(page)).toHaveAttribute("data-failed", "");
    await page.keyboard.type(" please");
    await expect(line(page), "typing keeps the line").toHaveAttribute("data-failed", "");
    await page.keyboard.press("Escape");
    await expect.poll(() => cmdsOf(core, "dictate_cancel")).toEqual([id2]);
    await expect(line(page)).toHaveCount(0);
    await expect(field(page)).toContainText("please");
  } finally {
    await s.close();
  }
});
