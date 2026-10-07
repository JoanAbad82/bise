// review/prs-list · bar A.7 (amb-feed 66faffe3): a project's open PRs as the TUI's /prs, reached
// from the changes screen: number, branch, agents, state in words (failing checks named), and a
// click opens the PR in his browser. Owner: amb-win (lead m_10378). The new app on the scripted
// core (a world with 2 open PRs); the link read outside the page, on main's test-mode stdout line
// 'bise-desktop: external <url>', never his browser.
import {
  FakeCore,
  FakeHelper,
  launchDesktop,
  test,
  expect,
} from "../../harness";
import { Lines } from "../native/world";

const HOME = "bise-home-00000000";
const EXTERNAL = "bise-desktop: external";

const world = () => [
  {
    ev: "prefs",
    prefs: {
      onboarded: true,
      theme: "system",
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
  {
    ev: "projects",
    projects: [
      {
        project: HOME,
        name: "bise",
        path: "/nowhere",
        git: true,
        home: true,
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
    project: HOME,
    proto: 1,
    workspace: "/nowhere",
    name: "bise",
  },
  {
    ev: "agents",
    project: HOME,
    agents: [
      {
        name: "main",
        main: true,
        status: "idle",
        archived: false,
        title: "",
        purpose: "",
        since_ms: 1791100000000,
        waits: 0,
      },
      {
        name: "dark-mode",
        main: false,
        status: "done",
        archived: false,
        title: "",
        purpose: "",
        since_ms: 1791100000000,
        waits: 0,
      },
    ],
  },
];

// the hub's answer to the window's 'prs' ask (the stub answers only diff/worktrees/dev_servers/merged)
const prs = {
  ev: "prs",
  project: HOME,
  head: "2 PRs open",
  items: [
    {
      number: 412,
      url: "https://github.com/acme/acme/pull/412",
      branch: "sb/dark-mode",
      agents: ["dark-mode"],
      state: "open",
      checks: "fail",
      failing: ["e2e"],
      review: "changes",
      words: "changes asked · checks fail: e2e",
      text: "",
    },
    {
      number: 415,
      url: "https://github.com/acme/acme/pull/415",
      branch: "sb/perf",
      agents: [],
      state: "draft",
      checks: "running",
      review: "none",
      words: "draft · checks running",
      text: "",
    },
  ],
};

test("review/prs-list: the changes screen opens the PR list; rows say it in words; a click opens the PR in his browser", async () => {
  const helper = new FakeHelper();
  const core = new FakeCore(
    world() as unknown as ConstructorParameters<typeof FakeCore>[0],
  );
  const s = await launchDesktop({ helper, core, route: `changes/${HOME}` });
  const out = new Lines();
  s.app.process().stdout?.setEncoding("utf8");
  s.app.process().stdout?.on("data", (d: string) => {
    out.push(d);
  });
  try {
    const { page } = s;
    await core.waitCmd((c) => c.cmd === "prs", 10_000);
    await core.send(prs as unknown as Parameters<FakeCore["send"]>[0]);
    await expect(
      page.getByTestId("changes.prs"),
      "the changes say how many PRs are open",
    ).toContainText("2 PRs open", { timeout: 10_000 });
    await page.getByTestId("changes.prs").click();
    await expect(page.getByTestId("prs.screen")).toBeVisible({ timeout: 5000 });
    const row = page.getByTestId("prs.row.412");
    await expect(row).toContainText("#412");
    await expect(row).toContainText("sb/dark-mode");
    await expect(row).toContainText("dark-mode");
    await expect(
      page.getByTestId("prs.words.412"),
      "its state in words, the failing check named",
    ).toHaveText("changes asked · checks fail: e2e");
    await expect(row).toHaveAttribute("data-tone", "err");
    await expect(page.getByTestId("prs.row.415")).toContainText("no agent");
    await expect(page.getByTestId("prs.words.415")).toHaveText(
      "draft · checks running",
    );
    expect(
      (await page.getByTestId("prs.row.415").innerText()).match(/draft/g)?.length,
      "'draft' once, on the right (ambient m_10689)",
    ).toBe(1);
    await page.screenshot({ path: test.info().outputPath("prs.png") });
    await row.click();
    const url = await out.wait(EXTERNAL, () => true, 3000);
    expect(url, "the PR opens in his browser").toBe(
      "https://github.com/acme/acme/pull/412",
    );
  } finally {
    await s.close();
    helper.dispose();
    core.dispose();
  }
});
