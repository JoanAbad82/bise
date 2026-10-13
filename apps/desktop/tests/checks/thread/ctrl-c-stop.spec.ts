// thread/ctrl-c-stop · K6 (docs/terminal-parity.md; ambient-pm m_17250, lead m_17252): ctrl+c stops
// the turn in the window like the TUI's (rust/tui/src/input.rs: a running turn is interrupted
// first). It is the one key that stops a turn: esc never does (his ask main m_22205, esc-order.spec). Copy is ⌘C on the Mac, so ctrl+c is free; but
// with text selected in the thread, ctrl+c does nothing else (he may be copying by habit).
//   - text selected in the thread: ctrl+c sends no stop;
//   - no selection, the caret in the composer with a draft: ctrl+c sends HubCmd stop for the agent
//     in view, and the draft stays;
//   - ⌘C on the same selection never stops.
// Owner: amb-web. The new app on the scripted core's fixture world: acme's perf is working.
import { FakeCore, launchDesktop, test, expect } from "../../harness";

const ACME = "acme-1a2b3c4d";
const T = {
  thread: '[data-testid="thread.screen"]',
  list: '[data-testid="thread.list"]',
  field: '[data-testid="composer.field"]',
};
const sleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

test("thread/ctrl-c-stop: ctrl+c stops the working turn, but not while text is selected", async () => {
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `agent/${ACME}/perf` });
  const { page } = s;
  const stops = () => core.cmds().filter((c) => c.cmd === "stop");
  try {
    await expect(page.locator(T.thread)).toHaveAttribute("data-project", ACME, {
      timeout: 10_000,
    });
    const field = page.locator(T.field);
    await field.click();
    await page.keyboard.type("garde ça");

    await test.step("a selection in the thread: ctrl+c and ⌘C send no stop", async () => {
      // qa-native m_17570: one packed run sent a stop here. The window only stops on a collapsed
      // selection, so the check's own Range was gone at the key: set right after the typing, on the
      // first row while perf's working thread was still drawing. Select, then let two frames and
      // 200 ms pass and keep it only if it is still in the list; and note the selection the window
      // saw at the ctrl+c keydown, so a lost selection reads as the check's, a kept one as the app's.
      const select = () =>
        page.locator(T.list).evaluate(async (el) => {
          const row = el.querySelector('[data-testid^="thread.entry."]');
          if (row === null) return "";
          const r = document.createRange();
          r.selectNodeContents(row);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(r);
          await new Promise((ok) =>
            requestAnimationFrame(() => requestAnimationFrame(ok)),
          );
          await new Promise((ok) => setTimeout(ok, 200));
          const now = window.getSelection();
          const kept =
            now !== null &&
            !now.isCollapsed &&
            now.rangeCount > 0 &&
            el.contains(now.getRangeAt(0).commonAncestorContainer);
          return kept ? now.toString() : "";
        });
      let picked = "";
      for (let i = 0; i < 3 && picked.trim() === ""; i++)
        picked = await select();
      expect(
        picked.trim(),
        "some thread text is selected, and it stays",
      ).not.toBe("");
      await page.evaluate(() => {
        const w = window as unknown as { ctrlCSel?: string };
        window.addEventListener(
          "keydown",
          (e) => {
            if (e.key === "c" && e.ctrlKey && w.ctrlCSel === undefined) {
              const s = window.getSelection();
              w.ctrlCSel =
                s === null || s.isCollapsed ? "collapsed" : "selected";
            }
          },
          { capture: true },
        );
      });
      await page.keyboard.press("Control+c");
      await page.keyboard.press("Meta+c");
      await sleep(400);
      const seen = await page.evaluate(
        () => (window as unknown as { ctrlCSel?: string }).ctrlCSel,
      );
      expect(seen, "the selection was still there at the ctrl+c keydown").toBe(
        "selected",
      );
      expect(stops(), "his selection: ctrl+c is not a stop").toEqual([]);
      await page.screenshot({
        path: test.info().outputPath("1-selected-no-stop.png"),
      });
    });

    await test.step("no selection, caret in the composer: ctrl+c stops the turn, the draft stays", async () => {
      await field.click();
      await page.keyboard.press("End");
      expect(
        await page.evaluate(() => window.getSelection()?.isCollapsed ?? true),
      ).toBe(true);
      await page.keyboard.press("Control+c");
      await core.waitCmd(
        (c) => c.cmd === "stop" && c.project === ACME && c.agent === "perf",
      );
      expect(stops(), "one stop").toHaveLength(1);
      await expect(field, "the composer keeps his draft").toHaveText(
        "garde ça",
      );
      // 'stopping perf…' sits in the thread's column, on the composer's left and width (amb-web
      // m_17316 saw it flush left outside the column; lead m_17322)
      const stopping = page.getByTestId("thread.stopping");
      await expect(stopping).toHaveText("stopping perf…");
      const box = await stopping.boundingBox();
      const col = await page
        .locator('[data-testid="thread.screen"] .b-composer')
        .first()
        .boundingBox();
      expect(box !== null && col !== null, "both drawn").toBe(true);
      if (box !== null && col !== null) {
        expect(
          Math.abs(box.x - col.x),
          "the stopping line's left = the column's",
        ).toBeLessThanOrEqual(1);
        expect(
          Math.abs(box.width - col.width),
          "the stopping line's width = the column's",
        ).toBeLessThanOrEqual(1);
      }
      await page.screenshot({
        path: test.info().outputPath("2-ctrl-c-stopping.png"),
      });
    });
  } finally {
    await s.close();
  }
});
