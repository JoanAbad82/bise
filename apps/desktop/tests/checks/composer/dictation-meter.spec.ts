// composer/dictation-meter · his words (main m_22692, ambient-lead m_22694): the composer's dictation
// "n'a pas l'espèce de UI qui réagit au son de ma voix", match the terminal's. The dictation node
// shows the TUI's voice chip (tui-parity m_22697, rust/tui/src/voice/chip.rs):
//   listening    '● ▂▅▃▆▂▃ <words>': the ● blinks, the 6 bars are his last levels, newest right;
//                silence keeps them flat at the lowest step (never empty)
//   transcribing '∿ ▂▃▅▆▅▃ <words>': the bars stop following the mic and roll a fixed wave
//   reduced motion: the ● stays lit and the wave holds still; the bars still follow his voice.
// His level is the core's level {who: 'you', v} (the fake core sends it here). One 1100 crop of
// each state in light and dark for designer. The real thread screen on the scripted core.
// Owner: amb-web (src/composer/pm/schema.ts, pm/meter.ts).
import type { Page } from "@playwright/test";
import { FakeCore, FakeHelper, launchDesktop, test, expect } from "../../harness";

const HOME = "bise-home-00000000";
const P = "telemetry-cf9cb2fe";
const agent = (name: string) => ({ name, main: name === "main", status: "idle", archived: false, title: "", purpose: "", since_ms: 1791100000000, waits: 0 });
const world = (theme: "light" | "dark") => [
  {
    ev: "prefs",
    prefs: {
      onboarded: true,
      theme,
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

const FLAT = "0,0,0,0,0,0";
const WAVE0 = "1,2,4,5,4,2";
const field = (page: Page) => page.getByTestId("composer.field");
const node = (page: Page) => field(page).locator(".b-dictation");
const meter = (page: Page) => page.getByTestId("composer.dictation.meter");
const bars = (page: Page): Promise<string | null> => meter(page).getAttribute("data-bars");
const chip = (page: Page) => node(page).locator(".chip");
const sign = (page: Page) => node(page).locator(".sign");

/** The composer's box, a little around it, for designer's sheet. */
async function shot(page: Page, name: string): Promise<void> {
  const box = await page.getByTestId("composer").boundingBox();
  if (box === null) throw new Error("no composer on screen");
  // the ● blinks: hold it on its lit frame for the shot, so the sheet shows it
  await page.evaluate(() => {
    const s = document.createElement("style");
    s.id = "shot-lit";
    s.textContent = ".b-dictation .sign { animation: none !important; }";
    document.head.append(s);
  });
  await page.screenshot({
    path: test.info().outputPath(name),
    clip: { x: Math.max(0, box.x - 16), y: Math.max(0, box.y - 40), width: box.width + 32, height: box.height + 56 },
  });
  await page.evaluate(() => {
    document.getElementById("shot-lit")?.remove();
  });
}

/** What the meter shows over `ms`, read every 50 ms while `each` runs (the fake voice). */
async function watch(page: Page, ms: number, each?: (i: number) => Promise<void>): Promise<string[]> {
  const seen: string[] = [];
  for (let i = 0; i * 50 < ms; i++) {
    await each?.(i);
    seen.push((await bars(page)) ?? "");
    await page.waitForTimeout(50);
  }
  return seen;
}

/** A take on, listening: its id. */
async function startTake(page: Page, core: FakeCore): Promise<string> {
  await page.keyboard.press("Control+r");
  const start = await core.waitCmd((c) => c.cmd === "dictate_start" && !core.cmds().some((d) => d.cmd === "dictate_stop" && (d as { id?: string }).id === (c as { id?: string }).id));
  return (start as { id: string }).id;
}

/** His voice: louder and softer, one level every 100 ms (each other read). */
const VOICE = [0.3, 0.8, 0.55, 0.95, 0.4, 0.7, 0.2, 0.65];
const speak = (core: FakeCore) => async (i: number): Promise<void> => {
  if (i % 2 === 0) await core.send({ ev: "level", who: "you", v: VOICE[(i / 2) % VOICE.length] ?? 0.5 } as never);
};

for (const theme of ["light", "dark"] as const) {
  test(`composer/dictation-meter (${theme}): the dictation's bars follow his voice, flat in silence; transcribing rolls the wave`, async () => {
    test.setTimeout(60_000);
    const core = new FakeCore(world(theme) as never);
    const s = await launchDesktop({ helper: new FakeHelper(), core, route: `agent/${P}/main`, size: "1100x760" });
    try {
      const { page } = s;
      await expect(page.getByTestId("thread.screen")).toHaveAttribute("data-agent", "main", { timeout: 10_000 });
      await field(page).click();
      await page.keyboard.type("the thumbnails ");
      const id = await startTake(page, core);

      // listening, no sound yet: the chip alone, ● and six flat bars and the time (no 'listening…')
      await expect(node(page)).toHaveText("");
      await expect(chip(page)).toHaveAttribute("data-phase", "listening");
      await expect(page.getByTestId("composer.mic"), "no mic in the key line while it listens").toBeHidden();
      await page.waitForTimeout(400);
      expect.soft(await bars(page), "silence: the bars flat, at the lowest step").toBe(FLAT);
      await shot(page, `${theme}-00-listening-silence.png`);

      // he speaks: each level comes in on the right, the bars move with it
      const spoken = await watch(page, 1600, speak(core));
      await core.send({ ev: "dictation", id, text: "make them", final: false } as never);
      const more = await watch(page, 500, speak(core));
      const moving = new Set([...spoken, ...more].filter((b) => b !== "" && b !== FLAT));
      expect.soft(moving.size, `the bars move with his voice (${[...moving].slice(0, 6).join(" | ")})`).toBeGreaterThan(4);
      const tall = Math.max(...[...moving].flatMap((b) => b.split(",").map(Number)));
      expect.soft(tall, "a loud word fills a bar (step 6 or 7 of 8)").toBeGreaterThanOrEqual(6);
      await expect(node(page)).toHaveText("make them");
      await shot(page, `${theme}-01-listening-voice.png`);

      // he stops speaking: within 6 samples the bars are flat again
      await core.send({ ev: "level", who: "you", v: 0 } as never);
      await expect.poll(() => bars(page), { message: "quiet again: the bars go flat", timeout: 1500 }).toBe(FLAT);

      // the mic off: '∿', the bars leave his voice and roll the wave, his words stay
      const box = await meter(page).boundingBox();
      await page.waitForTimeout(500); // past ctrl+r twice (voice mode)
      await page.keyboard.press("Control+r");
      await core.waitCmd((c) => c.cmd === "dictate_stop");
      await expect(chip(page)).toHaveAttribute("data-phase", "transcribing");
      await expect(meter(page)).toHaveAttribute("data-phase", "transcribing");
      const rolled = await watch(page, 900, async (i) => {
        if (i % 3 === 0) await core.send({ ev: "level", who: "you", v: 0.9 } as never); // the mic is off: ignored
      });
      const frames = new Set(rolled);
      expect.soft(frames.has(WAVE0), `transcribing: the wave ▂▃▅▆▅▃ (${[...frames].join(" | ")})`).toBe(true);
      expect.soft(frames.size, "the wave rolls").toBeGreaterThan(3);
      const after = await meter(page).boundingBox();
      expect.soft(after?.x, "the meter holds its place from listening to transcribing").toBe(box?.x);
      expect.soft(after?.width, "and its width").toBe(box?.width);
      await expect(node(page)).toHaveText("make them");
      await shot(page, `${theme}-02-transcribing.png`);

      // the words land in its place, the meter goes with the node
      await core.send({ ev: "dictation", id, text: "make them 120 KB", final: true } as never);
      await expect(field(page)).toHaveText("the thumbnails make them 120 KB");
      await expect(node(page)).toHaveCount(0);
    } finally {
      await s.close();
    }
  });
}

test("composer/dictation-meter (800): reduced motion: the ● stays lit, the wave holds still, the bars still follow his voice", async () => {
  test.setTimeout(60_000);
  const core = new FakeCore(world("light") as never);
  const s = await launchDesktop({ helper: new FakeHelper(), core, route: `agent/${P}/main`, size: "800x700" });
  try {
    const { page } = s;
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.getByTestId("thread.screen")).toHaveAttribute("data-agent", "main", { timeout: 10_000 });
    await field(page).click();
    await page.keyboard.type("résume le fil pour le standup ");
    const id = await startTake(page, core);
    await expect(chip(page)).toHaveAttribute("data-phase", "listening");
    expect.soft(await sign(page).evaluate((e) => getComputedStyle(e).animationName), "the ● does not blink").toBe("none");
    const spoken = new Set((await watch(page, 1200, speak(core))).filter((b) => b !== FLAT));
    expect.soft(spoken.size, "the bars still follow his voice (data, as the TUI's)").toBeGreaterThan(2);
    // at 800 the field leaves 160 px of free text beside the whole chip: it keeps its time
    await expect(chip(page), "800: the whole chip").toHaveAttribute("data-fit", "full");
    await shot(page, "800-listening-voice.png");
    await page.waitForTimeout(500);
    await page.keyboard.press("Control+r");
    await core.waitCmd((c) => c.cmd === "dictate_stop");
    await expect(meter(page)).toHaveAttribute("data-phase", "transcribing");
    const still = new Set(await watch(page, 800));
    expect.soft([...still], "transcribing: the wave holds its first frame").toEqual([WAVE0]);
    await core.send({ ev: "dictation", id, text: "ok", final: true } as never);
    await expect(node(page)).toHaveCount(0);
  } finally {
    await s.close();
  }
});

test("composer/dictation-meter (narrow): under 160 px of free text the time drops, then 3 bars, the newest", async () => {
  test.setTimeout(60_000);
  const core = new FakeCore(world("light") as never);
  const s = await launchDesktop({ helper: new FakeHelper(), core, route: `agent/${P}/main`, size: "1100x760" });
  try {
    const { page } = s;
    await expect(page.getByTestId("thread.screen")).toHaveAttribute("data-agent", "main", { timeout: 10_000 });
    await field(page).click();
    await page.keyboard.type("the thumbnails ");
    await startTake(page, core);
    await expect(chip(page)).toHaveAttribute("data-phase", "listening");
    await watch(page, 800, speak(core));
    await expect(chip(page), "1100: the whole chip").toHaveAttribute("data-fit", "full");
    // a narrow field, forced (no window is this narrow): the chip gives up its time, then 3 bars
    const narrow = async (px: number): Promise<string | null> => {
      await page.evaluate((w) => {
        let st = document.getElementById("narrow");
        if (st === null) {
          st = document.createElement("style");
          st.id = "narrow";
          document.head.append(st);
        }
        st.textContent = `.b-composer .b-field { max-width: ${String(w)}px !important; }`;
      }, px);
      await page.waitForTimeout(150);
      return chip(page).getAttribute("data-fit");
    };
    const fits = new Map<number, string | null>();
    for (let px = 320; px >= 180; px -= 10) fits.set(px, await narrow(px));
    const at = (k: string): number | undefined => [...fits.entries()].find(([, f]) => f === k)?.[0];
    const noTimer = at("no-timer");
    const three = at("three");
    expect(noTimer, `the time drops first (${JSON.stringify([...fits])})`).toBeDefined();
    expect(three, "then 3 bars").toBeDefined();
    await narrow(noTimer ?? 260);
    await watch(page, 400, speak(core));
    await expect(chip(page).locator(".t")).toBeHidden();
    await shot(page, "light-03-narrow-no-time.png");
    await narrow(three ?? 200);
    await watch(page, 400, speak(core));
    const shown = await meter(page).locator("i").evaluateAll((is) => is.filter((i) => getComputedStyle(i).display !== "none").length);
    expect.soft(shown, "3 bars").toBe(3);
    await shot(page, "light-04-narrow-three.png");
    await page.keyboard.press("Escape");
    await expect(node(page)).toHaveCount(0);
  } finally {
    await s.close();
  }
});
