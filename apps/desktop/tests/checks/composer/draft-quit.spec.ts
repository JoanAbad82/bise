// composer/draft-quit · ambient-lead m_19524 (main m_19518: his app restarts on each new cut, his
// drafts must survive). The composer writes its draft 400 ms after the last key (PmField's
// debounce); a quit inside those 400 ms used to lose the last keys. Passes when, on the scripted
// core (FakeCore), in perf's thread: words typed, the draft not yet written (checked in the
// renderer's storage), the app quits the normal way (app.quit, as the update swap does); the app
// relaunched on the same userData shows the words in perf's composer, the last keys included.
import { rmSync } from "node:fs";
import path from "node:path";
import {
  FakeCore,
  launchDesktop,
  testUserData,
  test,
  expect,
} from "../../harness";

const ACME = "acme-1a2b3c4d";
const ROUTE = `agent/${ACME}/perf`;
const DRAFT = "typed just before the quit";
const FIELD = '[data-testid="composer.field"]';

test("composer/draft-quit: words typed inside the draft debounce survive a quit and a relaunch", async () => {
  test.setTimeout(90_000);
  const userData = testUserData();
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: ROUTE, userData });
  try {
    const { page } = s;
    const field = page.locator(FIELD).first();
    await expect(field, "perf's composer").toBeVisible({ timeout: 10_000 });
    await field.click();
    await page.keyboard.type(DRAFT);
    await expect(field).toContainText(DRAFT);
    // inside the debounce: nothing of the draft in the storage yet
    const written = await page.evaluate((last) => {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) ?? "";
        if (
          k.startsWith("bise.composer.v1.") &&
          (localStorage.getItem(k) ?? "").includes(last)
        )
          return true;
      }
      return false;
    }, "quit");
    expect(written, "the quit comes inside the 400 ms debounce").toBe(false);
    const gone = new Promise<void>((r) =>
      s.app.process().once("exit", () => {
        r();
      }),
    );
    await s.app
      .evaluate(({ app }) => {
        app.quit();
      })
      .catch(() => undefined);
    await Promise.race([gone, new Promise<void>((r) => setTimeout(r, 10_000))]);
  } finally {
    await s.close();
    core.dispose();
  }

  const core2 = new FakeCore();
  const s2 = await launchDesktop({ core: core2, route: ROUTE, userData });
  try {
    const { page } = s2;
    await expect(
      page.getByTestId("thread.screen"),
      "perf's thread",
    ).toHaveAttribute("data-agent", "perf", { timeout: 10_000 });
    await expect(
      page.locator(FIELD).first(),
      "his words, the last keys included",
    ).toContainText(DRAFT, { timeout: 5000 });
    await page.screenshot({ path: test.info().outputPath("relaunch.png") });
  } finally {
    await s2.close();
    core2.dispose();
    rmSync(path.dirname(userData), { recursive: true, force: true });
  }
});
