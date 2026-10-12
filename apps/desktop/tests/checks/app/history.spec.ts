// app/history · back and forward like a browser, esc up the hierarchy (designer's desktop-history,
// ambient-lead m_19717/m_19725; the seam agreed with amb-win m_19808).
//   - esc in each context: an agent → its project's main → bise; a list → the place before; a
//     composer with words puts them away and stays; an open popup (⌘K) keeps its esc.
//   - ⌘[ ⌘] and the mouse's side buttons walk the stack; none acts while a sheet is open.
//   - ‹ › in the title bar: faint and inert with nothing on that side; a click walks; a right-click
//     lists the last places, a pick jumps there.
//   - a reload keeps the stack (sessionStorage); keep.ts still picks the start route.
// Shots for designer, light and dark: the arrows at the start, then with the ‹ menu open.
// Owner: amb-web. The new app on the scripted core's fixture world, with acme's docs made idle (it
// works in the fixtures, and a busy turn takes the esc first: thread/esc-order's).
import type { Page } from "@playwright/test";
import { FakeCore, launchDesktop, test, expect } from "../../harness";

const ACME = "acme-1a2b3c4d";
const T = {
  thread: '[data-testid="thread.screen"]',
  field: '[data-testid="composer.field"]',
  back: '[data-testid="app.title.back"]',
  forward: '[data-testid="app.title.forward"]',
  backMenu: '[data-testid="app.title.back.menu"]',
  place: '[data-testid="app.title.back.place"]',
  crumb: '[data-testid="app.title.crumb"]',
  sched: '[data-testid="scheduled.screen"]',
  palette: '[data-testid="app.palette"]',
};
const sleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

/** Where the window is: 'agent:<a>' for a project thread, 'bise', 'scheduled', or the crumb. */
async function where(page: Page): Promise<string> {
  if (await page.locator(T.sched).isVisible()) return "scheduled";
  const th = page.locator(T.thread).first();
  if (await th.isVisible()) {
    const project = (await th.getAttribute("data-project")) ?? "";
    const agent = (await th.getAttribute("data-agent")) ?? "";
    if (project === ACME) return `agent:${agent}`;
  }
  const crumb = ((await page.locator(T.crumb).textContent()) ?? "").trim();
  return crumb === "bise" || crumb === "" ? "bise" : `crumb:${crumb}`;
}

test("app/history: esc goes up, ⌘[ ⌘] and the side buttons walk, ‹ › and their menu, a reload keeps the stack", async () => {
  test.setTimeout(120_000);
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `agent/${ACME}/docs` });
  const { page } = s;
  const at = (want: string, why: string) =>
    expect.poll(() => where(page), { message: why, timeout: 5000 }).toBe(want);
  const stays = async (want: string, why: string) => {
    await sleep(300);
    expect(await where(page), why).toBe(want);
  };
  const theme = async (t: "light" | "dark") => {
    await core.send({
      ev: "prefs",
      prefs: { onboarded: true, theme: t },
    } as never);
    await expect
      .poll(
        () => page.evaluate(() => document.documentElement.dataset["theme"]),
        { timeout: 5000 },
      )
      .toBe(t);
    await sleep(200);
  };
  const side = (button: 3 | 4) =>
    page.evaluate((b) => {
      window.dispatchEvent(
        new MouseEvent("mousedown", { button: b, bubbles: true }),
      );
      window.dispatchEvent(
        new MouseEvent("mouseup", { button: b, bubbles: true }),
      );
    }, button);
  try {
    const agent = (name: string) => ({
      name,
      dir: name,
      main: name === "main",
      status: "idle",
      archived: false,
      title: "",
      purpose: "",
      since_ms: 1791100000000,
      waits: 0,
      watching: [],
    });
    await core.send({
      ev: "agents",
      project: ACME,
      agents: [agent("main"), agent("docs")],
    } as never);
    await at("agent:docs", "the start route");
    await expect(page.locator(T.field).first()).toBeVisible({ timeout: 5000 });

    await test.step("at the start: both arrows faint and inert", async () => {
      await expect(page.locator(T.back)).toBeDisabled();
      await expect(page.locator(T.forward)).toBeDisabled();
      for (const t of ["light", "dark"] as const) {
        await theme(t);
        await page.screenshot({
          path: test.info().outputPath(`start-${t}.png`),
        });
      }
      await theme("light");
    });

    await test.step("a composer with words: esc puts them away, the window stays", async () => {
      await page.locator(T.field).first().click();
      await page.keyboard.type("half a thought");
      await page.keyboard.press("Escape");
      await expect(page.locator(T.field).first()).toHaveText("");
      await stays("agent:docs", "his words were the esc");
      await expect(page.locator(T.back)).toBeDisabled();
    });

    await test.step("an empty composer: esc goes up, agent → the project's main → bise", async () => {
      await page.locator(T.field).first().click();
      await page.keyboard.press("Escape");
      await at("agent:main", "an agent's esc: its project's main");
      await expect(page.locator(T.back)).toBeEnabled();
      await page.locator(T.field).first().click();
      await page.keyboard.press("Escape");
      await at("bise", "the project's main: bise");
      await page.keyboard.press("Escape");
      await stays("bise", "bise is the top: esc does nothing");
    });

    await test.step("⌘[ ⌘] walk the stack", async () => {
      await page.keyboard.press("Meta+BracketLeft");
      await at("agent:main", "⌘[");
      await page.keyboard.press("Meta+BracketLeft");
      await at("agent:docs", "⌘[ again");
      await expect(page.locator(T.back)).toBeDisabled();
      await expect(page.locator(T.forward)).toBeEnabled();
      await page.keyboard.press("Meta+BracketRight");
      await at("agent:main", "⌘]");
      await page.keyboard.press("Meta+BracketLeft");
      await at("agent:docs", "⌘[ back to docs");
    });

    await test.step("a list: esc goes back to the place before", async () => {
      await page.locator('[data-testid="app.sidebar.scheduled"]').click();
      await at("scheduled", "the sidebar opens the scheduled list");
      await expect(
        page.locator(T.forward),
        "a new place drops the future",
      ).toBeDisabled();
      await page.keyboard.press("Escape");
      await at("agent:docs", "the list's esc: back");
    });

    await test.step("an open popup keeps esc; a sheet stops ⌘[ ⌘] and the side buttons", async () => {
      await page.keyboard.press("Meta+k");
      await expect(page.locator(T.palette)).toBeVisible({ timeout: 3000 });
      await page.keyboard.press("Meta+BracketRight");
      await side(4);
      await stays("agent:docs", "nothing walks under ⌘K");
      await page.keyboard.press("Escape");
      await expect(page.locator(T.palette)).toBeHidden();
      await stays("agent:docs", "⌘K's esc closed it, nothing else");
    });

    await test.step("the side buttons: 4 forward, 3 back", async () => {
      await side(4);
      await at("scheduled", "button 4");
      await side(3);
      await at("agent:docs", "button 3");
    });

    await test.step("‹ › clicks walk; a right-click lists the places, a pick jumps", async () => {
      await page.locator(T.forward).click();
      await at("scheduled", "› click");
      await page.locator(T.back).click();
      await at("agent:docs", "‹ click");
      await page.locator(T.field).first().click();
      await page.keyboard.press("Escape");
      await at("agent:main", "esc up");
      await page.locator(T.field).first().click();
      await page.keyboard.press("Escape");
      await at("bise", "esc up again");
      for (const t of ["light", "dark"] as const) {
        await theme(t);
        await page.locator(T.back).click({ button: "right" });
        await expect(page.locator(T.backMenu)).toBeVisible({ timeout: 3000 });
        await expect(
          page.locator(T.back),
          "a mouse press never focuses ‹ (no keyboard ring, designer m_19953)",
        ).not.toBeFocused();
        await expect(
          page.locator(T.place),
          "the nearest first: main, then docs",
        ).toHaveCount(2);
        await page.screenshot({
          path: test.info().outputPath(`menu-${t}.png`),
        });
        if (t === "light") {
          await page.keyboard.press("Escape");
          await expect(page.locator(T.backMenu)).toBeHidden();
          await stays("bise", "the menu's esc closes it only");
        }
      }
      await theme("light");
      await page.locator(T.place).nth(1).click();
      await at("agent:docs", "the second place: two steps back");
      await expect(page.locator(T.backMenu)).toBeHidden();
      await expect(page.locator(T.forward)).toBeEnabled();
    });

    await test.step("a reload keeps the stack around the kept route", async () => {
      await page.keyboard.press("Meta+BracketRight");
      await at("agent:main", "⌘] to the middle");
      await sleep(600); // past the keep's write
      // a real window has no '#route=' (the test's start route sits there, and test mode reads it
      // before keep.ts): drop it, then reload as he would
      await page.evaluate(() => {
        history.replaceState(null, "", location.pathname + location.search);
      });
      await page.reload();
      await at("agent:main", "keep.ts brings the route back");
      await expect(page.locator(T.back)).toBeEnabled({ timeout: 5000 });
      await expect(page.locator(T.forward)).toBeEnabled();
      await page.keyboard.press("Meta+BracketLeft");
      await at("agent:docs", "the past survived the reload");
      await page.keyboard.press("Meta+BracketRight");
      await page.keyboard.press("Meta+BracketRight");
      await at("bise", "and the future");
    });
  } finally {
    await s.close().catch(() => undefined);
    core.dispose();
  }
});
