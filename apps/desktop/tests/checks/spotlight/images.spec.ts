// spotlight/images · R41 (his words via main m_13700: « le modèle doit voir ces images que je
// paste »; ambient-lead m_13732). Owner: amb-web. The new app on the scripted core (FakeCore), fn+space
// from the scripted helper.
// Passes when:
//   - a real ⌘V of a PNG (staged on the test clipboard through main's TEST_CLIP_HOOK) in the spot's
//     field makes an '[Image #1]' chip with its thumbnail drawn, before his words;
//   - an image dropped on the pearl (the drop lands on the spot's hole under it) makes '[Image #2]';
//   - ⏎ sends {cmd:'send', agent:'main', text: '[Image #1] [Image #2] ' + his words, parts:
//     [{kind:'image', name:'[Image #1]', source}, {kind:'image', name:'[Image #2]', source},
//     {kind:'text', text: his words}]} to the core: no files, no b64_file (msg-parts, m_18029);
//   - each source is a file in the test home's image store (BISE_HOME/images) with the PNG's bytes,
//     so the hub can make the image block the model sees (qa-native's $FAKE_BODIES read is the
//     model side of R41);
//   - the chips leave with the send.
// Shots for designer: light + dark with the two chips and words.
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";
import {
  test,
  expect,
  FakeCore,
  FakeHelper,
  launchDesktop,
} from "../../harness";

type Ev = Parameters<FakeCore["send"]>[0];
const HOME = "bise-home-00000000";
const PNG_FILE = path.join(__dirname, "../fixtures/checker.png");

async function openSpot(
  helper: FakeHelper,
  app: { windows: () => Page[] },
): Promise<Page> {
  await helper.send({ ev: "fn", act: "key", key: "space" });
  await expect
    .poll(() => app.windows().some((p) => p.url().includes("surface=capsule")))
    .toBe(true);
  const cap = app.windows().find((p) => p.url().includes("surface=capsule"));
  if (!cap) throw new Error("no capsule window");
  await expect(cap.locator('[data-testid="spot.input"]')).toBeVisible({
    timeout: 5000,
  });
  return cap;
}

test("spotlight/images: ⌘V of an image and an image dropped on the pearl are chips, sent to main as image parts from the image store", async () => {
  test.setTimeout(90_000);
  const core = new FakeCore();
  const helper = new FakeHelper();
  const s = await launchDesktop({ core, helper });
  try {
    const { app } = s;
    await s.page.waitForTimeout(1500);
    await core.send({
      ev: "projects",
      projects: [
        {
          project: HOME,
          name: "bise",
          path: "/Users/camille/bise",
          home: true,
          order: 0,
          agents: 1,
          working: 0,
          waits: 0,
          git: false,
          running: true,
        },
      ],
    } as unknown as Ev);
    await core.send({ ev: "cards", project: HOME, cards: [] } as unknown as Ev);
    const cap = await openSpot(helper, app);
    const input = cap.locator('[data-testid="spot.input"]');

    // ⌘V of a PNG
    await input.click();
    const staged = await app.evaluate(
      (_e, file) =>
        (
          globalThis as unknown as {
            __biseTestClip?: (o: unknown) => Promise<boolean>;
          }
        ).__biseTestClip?.({ file }) ?? false,
      PNG_FILE,
    );
    expect(
      staged,
      "main's test hook read the PNG and every window took it",
    ).toBe(true);
    await cap.keyboard.press("Meta+V");
    const one = cap.locator('[data-testid="spot.file.1"]');
    await expect(one, "the pasted PNG is a chip").toHaveText("[Image #1]", {
      timeout: 5000,
    });
    await expect(one).toHaveAttribute("data-kind", "image");
    expect(
      await one
        .locator("img")
        .evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0),
      "its thumbnail is drawn",
    ).toBe(true);
    await expect(input, "no file name typed as words").toHaveValue("");

    // an image dropped on the pearl: the drop lands on what is under it (the spot's hole)
    const b64 = readFileSync(PNG_FILE).toString("base64");
    const target = await cap.evaluate((data: string) => {
      const pearl = document
        .querySelector(".b-cap-pearl")
        ?.getBoundingClientRect();
      if (!pearl) return "no pearl";
      const under = document.elementFromPoint(
        pearl.x + pearl.width / 2,
        pearl.y + pearl.height / 2,
      );
      if (!under) return "nothing under the pearl";
      const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
      const dt = new DataTransfer();
      dt.items.add(new File([bytes], "board.png", { type: "image/png" }));
      under.dispatchEvent(
        new DragEvent("dragover", {
          dataTransfer: dt,
          bubbles: true,
          cancelable: true,
        }),
      );
      const drop = new DragEvent("drop", {
        dataTransfer: dt,
        bubbles: true,
        cancelable: true,
      });
      under.dispatchEvent(drop);
      return drop.defaultPrevented
        ? under.className
        : `not taken by ${under.className}`;
    }, b64);
    expect(target, "the drop on the pearl is the spot's (no navigation)").toBe(
      "b-cap-hole",
    );
    await expect(
      cap.locator('[data-testid="spot.file.2"]'),
      "the dropped image is a chip",
    ).toHaveText("[Image #2]", { timeout: 5000 });

    await input.pressSequentially("what is wrong in these");
    await expect(cap.locator('[data-testid="spot.frame"] .keys')).toHaveText(
      "⏎ send to bise   ⌫ remove   esc close",
    );
    await expect(
      cap.locator('[data-testid="spot.row.ask"]'),
      "the ask row says the images go too (designer m_13808)",
    ).toContainText("2 images · what is wrong in these");
    await cap.screenshot({ path: test.info().outputPath("light-chips.png") });
    await cap.emulateMedia({ colorScheme: "dark" });
    await cap.waitForTimeout(200);
    await cap.screenshot({ path: test.info().outputPath("dark-chips.png") });
    await cap.emulateMedia({ colorScheme: "light" });

    await input.press("Enter");
    const sent = (await core.waitCmd(
      (c) => c["cmd"] === "send",
      5000,
    )) as Record<string, unknown>;
    expect(sent["project"]).toBe(HOME);
    expect(sent["agent"]).toBe("main");
    // msg-parts (main 18a32ce3, ambient-lead m_18029): each image goes as a typed part with its
    // source alone (the hub stores it), never text + files; the same as the thread's d68b4867
    expect(
      sent["files"],
      `no files beside parts: ${JSON.stringify(sent)}`,
    ).toBeUndefined();
    const parts = (sent["parts"] ?? []) as Record<string, unknown>[];
    expect(
      parts.map((p) => p["kind"]),
      JSON.stringify(sent),
    ).toEqual(["image", "image", "text"]);
    expect(parts.map((p) => p["name"])).toEqual([
      "[Image #1]",
      "[Image #2]",
      undefined,
    ]);
    expect(
      parts.map((p) => p["b64_file"]),
      "no b64_file: the hub stores them",
    ).toEqual([undefined, undefined, undefined]);
    expect(parts[2]?.["text"], "his words").toBe("what is wrong in these");
    const text = typeof sent["text"] === "string" ? sent["text"] : "";
    expect(text, "the labels, then his words, like the thread").toBe(
      "[Image #1] [Image #2] what is wrong in these",
    );
    const files = parts
      .slice(0, 2)
      .map((p) => (typeof p["source"] === "string" ? p["source"] : ""));
    const want = readFileSync(PNG_FILE);
    for (const f of files) {
      expect(text, "no path in his words").not.toContain(f);
      expect(path.isAbsolute(f), f).toBe(true);
      expect(f, "in the image store, the TUI's").toMatch(
        /\/images\/[0-9a-f]{64}\.png$/u,
      );
      expect(readFileSync(f).equals(want), `${f} holds the PNG's bytes`).toBe(
        true,
      );
    }
    await expect(
      cap.locator('[data-testid="spot.files"]'),
      "the chips left with the send",
    ).toHaveCount(0);
  } finally {
    await s.close();
  }
});
