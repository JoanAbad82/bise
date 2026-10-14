// @vitest-environment happy-dom
// The spotlight: its list rules (the capsule's, signed by ambient) and the input that stays one
// node while the list changes under it (bug 7).
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { flat, spotList, type SpotData } from "./list";
import { Spotlight, answerLines, ANSWER_MAX_LINES } from "./Spotlight";
import { cardLine, newBrief, shortPath } from "./words";

afterEach(cleanup);

const D: SpotData = {
  projects: [
    {
      id: "tel",
      name: "telemetry",
      path: "/Users/me/code/telemetry",
      branch: "main",
      agents: 2,
    },
    {
      id: "shop",
      name: "shop",
      path: "/Users/me/code/shop",
      branch: "main",
      agents: 1,
    },
  ],
  agents: [
    {
      name: "perf",
      project: "tel",
      status: "working",
      title: "sort_unstable in the hot query",
    },
    {
      name: "alerts",
      project: "tel",
      status: "idle",
      title: "page on p99 regressions",
    },
  ],
  cards: [
    {
      id: "c1",
      agent: "alerts",
      project: "tel",
      kind: "question",
      text: "Which threshold?",
    },
  ],
  front: {
    app: "Chrome",
    title: "Pricing · Acme",
    url: "https://acme.test/pricing",
  },
};

describe("the spotlight list", () => {
  it("empty: waiting for you, at work, projects with what is in front first, no ⌘ on it", () => {
    const l = spotList(D, "");
    expect(l.sections.map((s) => s.label)).toEqual([
      "waiting for you",
      "at work",
      "projects",
    ]);
    const envs = l.sections[2]?.items ?? [];
    expect(envs[0]).toMatchObject({
      kind: "front",
      name: "Pricing · Acme",
      sub: "in front: acme.test · Chrome",
    });
    expect(envs[1]).toMatchObject({
      kind: "env",
      name: "telemetry",
      n: 1,
      sub: "2 agents · main · ~/code/telemetry",
    });
  });
  it("a word names agents and projects; a sentence asks bise first", () => {
    expect(flat(spotList(D, "perf")).map((i) => i.id)).toEqual([
      "agent.tel.perf",
    ]);
    expect(flat(spotList(D, "tele")).map((i) => i.id)).toEqual([
      "agent.tel.alerts",
      "agent.tel.perf",
      "env.tel",
    ]);
    const ask = spotList(D, "why is the hot query slow for perf");
    expect(ask.mode).toBe("ask");
    expect(flat(ask).map((i) => i.id)).toEqual(["ask", "agent.tel.perf"]);
  });
  it("⌘K's rule (main m_12973): a sentence asks first and keeps the archived agents it names too, after the live ones", () => {
    const old = {
      name: "perf-v1",
      project: "tel",
      status: "done" as const,
      title: "slow hot query, first pass",
      archived: true,
    };
    const d: SpotData = { ...D, agents: [old, ...D.agents] };
    expect(spotList(d, "perf").mode).toBe("names");
    const ask = spotList(d, "why is the hot query slow for perf");
    expect(flat(ask).map((i) => i.id)).toEqual([
      "ask",
      "agent.tel.perf",
      "agent.tel.perf-v1",
    ]);
  });
  it("words: card lines and paths as ambient signed them", () => {
    expect(
      cardLine("t1-97894 is ready to try\n1 commit on t1-97894 · +3 −0"),
    ).toBe("t1-97894 is ready to try · 1 commit · +3 −0");
    expect(shortPath("/Users/me/.bise/gate/w-ambtools/h/code/telemetry")).toBe(
      "~/…/w-ambtools/h/code/telemetry",
    );
  });
  it("a long answer shows its start and says the rest is in bise", () => {
    const long = Array.from({ length: 40 }, (_, i) => `line ${i}`).join("\n");
    expect(answerLines(long).cut).toBe(true);
    expect(answerLines(long).shown.split("\n").length).toBe(ANSWER_MAX_LINES);
    expect(answerLines("short").cut).toBe(false);
  });
});

describe("the spotlight", () => {
  it("a waiting row's trailing item: its project, or its key once it is the active row (designer m_25150)", () => {
    const ui = render(
      <Spotlight data={D} onAsk={vi.fn()} onOpen={vi.fn()} onClose={vi.fn()} />,
    );
    const row = ui.getByTestId("spot.row.card.c1");
    const trail = row.querySelector(".k")?.textContent;
    if (row.getAttribute("aria-selected") === "true") {
      expect(trail).toBe("⏎ answer");
    } else {
      expect(trail).not.toBe("⏎ answer");
      expect(trail ?? "").not.toBe("");
    }
  });
  it("keeps one input node while the list changes, ⏎ on a sentence asks bise", async () => {
    const onAsk = vi.fn();
    const ui = render(
      <Spotlight data={D} onAsk={onAsk} onOpen={vi.fn()} onClose={vi.fn()} />,
    );
    const input = ui.getByTestId("spot.input") as HTMLInputElement;
    for (const v of ["w", "wh", "why is the hot query slow"]) {
      await act(async () => {
        fireEvent.input(input, { target: { value: v } });
        await Promise.resolve();
      });
      expect(ui.getByTestId("spot.input")).toBe(input);
    }
    expect(ui.getByTestId("spot.row.ask")).toBeTruthy();
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
      await Promise.resolve();
    });
    expect(onAsk).toHaveBeenCalledWith("why is the hot query slow");
    expect(input.value).toBe("");
  });
  it("R41: a pasted image and a dropped file are chips, ⏎ asks bise with their paths, ⌫ takes the last away", async () => {
    const onAsk = vi.fn();
    const saveImage = vi.fn((f: File) =>
      Promise.resolve({ path: `/store/${f.name}`, name: f.name }),
    );
    const filePath = (f: File): string => `/Users/me/${f.name}`;
    const ui = render(
      <Spotlight
        data={D}
        onAsk={onAsk}
        onOpen={vi.fn()}
        onClose={vi.fn()}
        saveImage={saveImage}
        filePath={filePath}
      />,
    );
    const input = ui.getByTestId("spot.input") as HTMLInputElement;
    const png = new File([new Uint8Array([137, 80, 78, 71])], "shot.png", {
      type: "image/png",
    });
    await act(async () => {
      fireEvent.paste(input, {
        clipboardData: { files: [png], getData: () => "" },
      });
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(saveImage).toHaveBeenCalledWith(png);
    expect(ui.getByTestId("spot.file.1").textContent).toBe("image 1");
    const notes = new File(["q3"], "q3-notes.md", { type: "text/markdown" });
    const drop = new Event("drop", { cancelable: true }) as Event & {
      dataTransfer: unknown;
    };
    drop.dataTransfer = { files: [notes] };
    await act(async () => {
      window.dispatchEvent(drop);
      await Promise.resolve();
    });
    expect(drop.defaultPrevented).toBe(true);
    expect(ui.getByTestId("spot.file.2").textContent).toBe("q3-notes.md");
    expect(ui.getByTestId("spot.frame").textContent).toContain("⌫ remove");
    // ⌫ at the start: the dropped file goes, the image stays
    await act(async () => {
      fireEvent.keyDown(input, { key: "Backspace" });
      await Promise.resolve();
    });
    expect(ui.queryByTestId("spot.file.2")).toBeNull();
    // the 'ask bise' row says the image goes with his words (designer m_13808)
    await act(async () => {
      fireEvent.input(input, { target: { value: "what is wrong in this" } });
      await Promise.resolve();
    });
    expect(ui.getByTestId("spot.row.ask").textContent).toContain(
      "an image · what is wrong in this",
    );
    // 'perf' alone would open perf: with an image in the spot ⏎ asks bise with it
    await act(async () => {
      fireEvent.input(input, { target: { value: "perf" } });
      await Promise.resolve();
    });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
      await Promise.resolve();
    });
    // msg-parts: the image goes typed by its source alone (no files, no b64_file), then his words
    expect(onAsk).toHaveBeenCalledWith("[Image #1] perf", [
      { kind: "image", name: "[Image #1]", source: "/store/shot.png" },
      { kind: "text", text: "perf" },
    ]);
    expect(ui.queryByTestId("spot.files")).toBeNull();
  });
});

describe("the spotlight rows", () => {
  it("a row that stays listed keeps its element when typing moves it to another group", async () => {
    const ui = render(
      <Spotlight data={D} onAsk={vi.fn()} onOpen={vi.fn()} onClose={vi.fn()} />,
    );
    const input = ui.getByTestId("spot.input") as HTMLInputElement;
    const perf = ui.getByTestId("spot.row.agent.tel.perf");
    await act(async () => {
      fireEvent.input(input, { target: { value: "p" } });
      await Promise.resolve();
    });
    expect(ui.getByTestId("spot.group.found")).toBeTruthy();
    expect(ui.getByTestId("spot.row.agent.tel.perf")).toBe(perf);
  });
});

describe("the routing hold", () => {
  it('shows "→ bise · <project> · N s to change" at once; esc keeps it with bise, ⏎ on another project corrects it', async () => {
    const onRouteKeep = vi.fn();
    const onRouteTo = vi.fn();
    const route = {
      rid: 7,
      to: "tel",
      name: "telemetry",
      until: Date.now() + 2000,
    };
    const ui = render(
      <Spotlight
        data={D}
        route={route}
        onRouteKeep={onRouteKeep}
        onRouteTo={onRouteTo}
        onAsk={vi.fn()}
        onOpen={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(ui.getByTestId("spot.route").textContent).toMatch(
      /^→ bise · telemetry · 2 s to change/u,
    );
    expect(ui.queryByTestId("spot.row.env.tel")).toBeNull();
    const input = ui.getByTestId("spot.input");
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
      await Promise.resolve();
    });
    expect(onRouteTo).toHaveBeenCalledWith("shop");
    await act(async () => {
      fireEvent.keyDown(input, { key: "Escape" });
      await Promise.resolve();
    });
    expect(onRouteKeep).toHaveBeenCalledTimes(1);
  });
});

describe("his ask shows where it is (R18 on 723648da)", () => {
  it("asked, no word back yet: 'asked bise' dim with the ∿; the first words take its place", () => {
    const ui = render(
      <Spotlight
        data={D}
        answer={{ text: "", done: false }}
        onAsk={vi.fn()}
        onOpen={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const a = ui.getByTestId("spot.answer");
    expect(a.dataset.state).toBe("asked");
    expect(a.className).toContain("note");
    expect(a.textContent).toContain("asked bise · the answer shows here");
    expect(ui.getByTestId("spot.answer.text.sign")).toBeTruthy();
    ui.rerender(
      <Spotlight
        data={D}
        answer={{ text: "The cold bench", done: false }}
        onAsk={vi.fn()}
        onOpen={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(ui.getByTestId("spot.answer").dataset.state).toBe("live");
    expect(ui.getByTestId("spot.answer").className).not.toContain("note");
    expect(ui.getByTestId("spot.answer").textContent).not.toContain(
      "asked bise",
    );
  });

  it("sent to another project: a dim line says where its answer is, no ∿", () => {
    const ui = render(
      <Spotlight
        data={D}
        answer={{
          text: "sent to telemetry · its answer is in telemetry's thread",
          done: true,
          note: true,
        }}
        onAsk={vi.fn()}
        onOpen={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const a = ui.getByTestId("spot.answer");
    expect(a.dataset.state).toBe("went");
    expect(a.className).toContain("note");
    expect(ui.queryByTestId("spot.answer.text.sign")).toBeNull();
  });
});

describe("start an agent from the spotlight (bar A.1)", () => {
  it("'/new …' and 'start an agent: …' give the brief; anything else, or no brief, is not one", () => {
    expect(newBrief("/new fix the flaky login test")).toBe(
      "fix the flaky login test",
    );
    expect(newBrief("  Start an agent: profile the hub ")).toBe(
      "profile the hub",
    );
    expect(newBrief("start an agent profile the hub")).toBe("profile the hub");
    expect(newBrief("/new")).toBeUndefined();
    expect(newBrief("start an agent:  ")).toBeUndefined();
    expect(newBrief("/newsletter draft")).toBeUndefined();
    expect(newBrief("please start an agent: x")).toBeUndefined();
  });

  it("the list is one row that starts it", () => {
    const l = spotList(D, "/new profile the hub");
    expect(l.mode).toBe("new");
    expect(flat(l)).toEqual([
      { kind: "new", id: "new", brief: "profile the hub" },
    ]);
  });

  it("⏎ starts it with the brief (not sent to bise), the input clears; with no onNew it goes to bise as words", async () => {
    const onAsk = vi.fn();
    const onNew = vi.fn();
    const ui = render(
      <Spotlight
        data={D}
        onAsk={onAsk}
        onNew={onNew}
        onOpen={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const input = ui.getByTestId("spot.input") as HTMLInputElement;
    await act(async () => {
      fireEvent.input(input, {
        target: { value: "start an agent: profile the hub" },
      });
      await Promise.resolve();
    });
    expect(ui.getByTestId("spot.row.new").textContent).toContain(
      "start an agent",
    );
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
      await Promise.resolve();
    });
    expect(onNew).toHaveBeenCalledWith("profile the hub");
    expect(onAsk).not.toHaveBeenCalled();
    expect(input.value).toBe("");
    cleanup();
    const ask = vi.fn();
    const ui2 = render(
      <Spotlight data={D} onAsk={ask} onOpen={vi.fn()} onClose={vi.fn()} />,
    );
    const in2 = ui2.getByTestId("spot.input") as HTMLInputElement;
    await act(async () => {
      fireEvent.input(in2, { target: { value: "/new profile the hub" } });
      await Promise.resolve();
    });
    await act(async () => {
      fireEvent.keyDown(in2, { key: "Enter" });
      await Promise.resolve();
    });
    expect(ask).toHaveBeenCalledWith("/new profile the hub");
  });
});
