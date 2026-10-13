// artifacts/local-file · ambient-lead m_19544 (his try a43609b2: designer's 'barre de droite ·
// prototype interactif', a local .html file, opened as a blank white box: Open.tsx framed its bare
// path and the shell's guard only lets a subframe show the pages server). Architect m_19561: the hub
// gives the row a frame_url on its pages server (amb-feed c5caeffd), Open.tsx frames that.
// Passes when, on the scripted core (FakeCore) with a fake pages server on 127.0.0.1, light and
// dark: the local .html file opens with its own pixels in the window (its blue paper fills the
// frame), a bise page still opens with the kit's paper, and a row from an older hub (a bare path,
// no frame_url) shows an empty body: no frame, no white box, no 'opens in your browser' panel (designer m_21714). Owner: amb-web.
import { readFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import path from "node:path";
import { PNG } from "pngjs";
import type { Page } from "@playwright/test";
import { FakeCore, launchDesktop, test, expect } from "../../harness";

const HOME = "bise-home-00000000";
const SHOP = "shop-1a2b3c4d";
const H = 3600_000;
const KIT = path.resolve(__dirname, "..", "..", "..", "..", "..", "kit");

// the kit's bise page (its paper follows the ?theme= hint) and the agent's own .html file, which
// wears its own colours whatever his theme
const PAGE = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="/kit/tokens.css"><script src="/kit/kit.js" defer></script><style>
body{margin:0;padding:40px 48px;font:17px/1.55 -apple-system,sans-serif;color:var(--ink);background:var(--surface-made)}
</style></head><body><h1>launch recap</h1><p>the recap of the week.</p></body></html>`;
const FILE = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;height:100%;background:rgb(40,110,200);color:#fff;font:600 28px -apple-system,sans-serif}
body{display:flex;align-items:center;justify-content:center}
</style></head><body><h1>barre de droite · prototype</h1></body></html>`;
const BLUE = [40, 110, 200] as const;

function world(now: number, pages: string, theme: "light" | "dark") {
  const base = { agent: "designer", version: 1, new: false };
  return [
    { ev: "prefs", prefs: { onboarded: true, theme } },
    {
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
          project: SHOP,
          name: "storefront",
          path: "/nowhere/shop",
          git: true,
          home: false,
          order: 1,
          agents: 2,
          working: 0,
          waits: 0,
          running: true,
        },
      ],
    },
    {
      ev: "artifacts",
      project: SHOP,
      items: [
        // a local file the hub copied and serves: url stays its bare path (the TUI opens it)
        {
          ...base,
          id: "proto",
          kind: "page",
          title: "barre de droite · prototype interactif",
          at_ms: now - 1 * H,
          url: "/nowhere/.bise/hubs/h/artifacts/proto/v1/proto.html",
          frame_url: `${pages}/a/proto/1/proto.html`,
        },
        {
          ...base,
          id: "recap",
          kind: "page",
          title: "launch recap",
          at_ms: now - 2 * H,
          url: `${pages}/p/recap`,
        },
        // the same file from an older hub: no frame_url
        {
          ...base,
          id: "old",
          kind: "page",
          title: "prototype from an older hub",
          at_ms: now - 3 * H,
          url: "/nowhere/.bise/hubs/h/artifacts/old/v1/old.html",
        },
      ],
    },
  ];
}

/** The share of the frame's pixels within 6 of `rgb` (a screenshot of the window, not the DOM). */
async function share(
  page: Page,
  rgb: readonly [number, number, number],
): Promise<number> {
  const box = await page.getByTestId("artifact.page").boundingBox();
  if (box === null) return 0;
  const png = PNG.sync.read(await page.screenshot({ clip: box }));
  let hit = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    const d = Math.max(
      Math.abs((png.data[i] ?? 0) - rgb[0]),
      Math.abs((png.data[i + 1] ?? 0) - rgb[1]),
      Math.abs((png.data[i + 2] ?? 0) - rgb[2]),
    );
    if (d <= 6) hit++;
  }
  return hit / (png.data.length / 4);
}

test("artifacts/local-file: a local .html artifact and a bise page render in the window, light and dark; an older hub shows no white box", async () => {
  test.setTimeout(150_000);
  const asked: string[] = [];
  const server: Server = createServer((req, res) => {
    const url = req.url ?? "";
    asked.push(url);
    const kit = /^\/kit\/(tokens\.css|kit\.js)/.exec(url);
    if (kit?.[1] !== undefined) {
      res.writeHead(200, {
        "content-type": kit[1].endsWith(".css")
          ? "text/css"
          : "text/javascript",
      });
      res.end(readFileSync(path.join(KIT, kit[1])));
      return;
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(url.startsWith("/a/proto/1/proto.html") ? FILE : PAGE);
  });
  await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok));
  const pages = `http://127.0.0.1:${String((server.address() as { port: number }).port)}`;
  const core = new FakeCore(world(Date.now(), pages, "light") as never);
  const s = await launchDesktop({ core, route: "artifacts" });
  try {
    const { page } = s;
    await expect(page.getByTestId("artifacts.screen")).toBeVisible({
      timeout: 10_000,
    });
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
      await page.waitForTimeout(200);
    };
    const open = async (id: string) => {
      await page.getByTestId(`artifacts.list.row.${id}`).click();
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("artifact.open")).toBeVisible({
        timeout: 5000,
      });
      await expect(page.getByTestId("artifact.title")).toHaveText(/./);
    };
    const close = async () => {
      await page.getByTestId("artifact.close").click();
      await expect(page.getByTestId("artifact.open")).toHaveCount(0, {
        timeout: 5000,
      });
    };
    for (const t of ["light", "dark"] as const) {
      await theme(t);
      // the local file: framed from the pages server, its own blue fills the frame
      await open("proto");
      const src =
        (await page.getByTestId("artifact.page").getAttribute("src")) ?? "";
      expect(
        src.startsWith(`${pages}/a/proto/1/proto.html`),
        `${t}: framed from frame_url, never the bare path (${src})`,
      ).toBe(true);
      await expect(
        page.frameLocator('[data-testid="artifact.page"]').locator("h1"),
      ).toHaveText("barre de droite · prototype", { timeout: 10_000 });
      await expect
        .poll(() => share(page, BLUE), {
          timeout: 5000,
          message: `${t}: the file's own pixels, not a white box`,
        })
        .toBeGreaterThan(0.6);
      await page.screenshot({ path: test.info().outputPath(`file-${t}.png`) });
      await close();
      // a bise page: as before, the kit's paper for his theme
      await open("recap");
      const paper =
        t === "dark" ? ([23, 21, 19] as const) : ([242, 237, 226] as const);
      await expect
        .poll(() => share(page, paper), {
          timeout: 10_000,
          message: `${t}: the bise page's paper`,
        })
        .toBeGreaterThan(0.6);
      await page.screenshot({ path: test.info().outputPath(`page-${t}.png`) });
      await close();
      // an older hub's bare path: the browser line, no frame
      await open("old");
      await expect(
        page.getByTestId("artifact.page"),
        `${t}: no frame for a bare path`,
      ).toHaveCount(0);
      // no 'opens in your browser' panel any more (designer m_21714): the body stays empty, no white box
      await expect(page.locator(".art-open-body iframe")).toHaveCount(0);
      await expect(page.locator(".art-open-body img")).toHaveCount(0);
      await expect(page.locator(".art-empty")).toHaveCount(0);
      await page.screenshot({
        path: test.info().outputPath(`old-hub-${t}.png`),
      });
      await close();
    }
    expect(
      asked.some((u) => u.startsWith("/a/proto/1/proto.html")),
      "the window asked the pages server for the file",
    ).toBe(true);
  } finally {
    await s.close();
    server.close();
  }
});
