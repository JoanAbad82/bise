// @vitest-environment happy-dom
// src/ds · the cursor as macOS draws it (bise fait mac, page native-mac §1: « le curseur flèche
// (pas la main) sur les boutons »). The ds's whole stylesheet (index.css's imports, in order) on its
// clickable components, read back with getComputedStyle: no control shows the hand (the root rule's
// arrow, or a ds rule's own default), a link does. ds/css/base.css owns it; lint.test.ts's arrow
// law counts the screens' own hands. Mutation: base.css's link rule dropped, or a ds stylesheet's
// cursor:pointer on a control, turns this red.
import { cleanup, render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  Act, ArtChip, ArtName, BriefLine, Button, CardLine, Check, Chip, Diff, Group, IconButton, Opts, PickerTrigger,
  SchedHead, SearchButton, Seg, Select, Tabs, Toggle,
} from "./index";

/** what the root rule must reach: a control, or a role that takes a click */
const CLICKABLE = "button, a[href], select, summary, [role=button], [role=link], [role=tab], [role=option], [role=switch], [role=checkbox], [role=radio], [role=menuitem]";
const go = () => undefined;

beforeAll(() => {
  const css = readFileSync(join(__dirname, "index.css"), "utf8");
  const files = [...css.matchAll(/@import "\.\/([\w/.-]+)";/g)].map((m) => m[1] ?? "");
  const style = document.createElement("style");
  style.textContent = files.map((f) => readFileSync(join(__dirname, f), "utf8")).join("\n");
  document.head.append(style);
});
afterEach(cleanup);

describe("the arrow on every ds control, the hand on a link (ds/css/base.css)", () => {
  it("no clickable ds control shows the hand; a link does", () => {
    const { container } = render(
      <div>
        <Button onClick={go}>save</Button>
        <Button kind="pri" onClick={go}>send</Button>
        <IconButton label="close" onClick={go}>×</IconButton>
        <SearchButton label="search or jump" onClick={go} />
        <Act onClick={go}>open</Act>
        <Act kind="ref" onClick={go}>PR #12</Act>
        <Chip onClick={go}>file</Chip>
        <ArtChip title="report" onClick={go} />
        <ArtName onClick={go}>report</ArtName>
        <Seg items={["a", "b"]} on={0} onPick={go} />
        <Toggle on={false} onChange={go} />
        <Check on={false} onChange={go} label="mail" />
        <Select value="a" options={[{ value: "a", label: "a" }]} onChange={go} label="model" />
        <PickerTrigger onClick={go}>all agents</PickerTrigger>
        <Opts items={[{ n: 1, text: "yes" }]} onPick={go} />
        <Tabs items={[{ id: "a", text: "a" }]} onPick={go} />
        <Group items={[{ id: "a", label: "a", onPick: go }]} />
        <Group list items={[{ id: "b", label: "b", onPick: go }]} />
        <SchedHead open={false} onClick={go}>every 30m</SchedHead>
        <BriefLine open={false} onClick={go}>brief</BriefLine>
        <CardLine onClick={go}>bise asks</CardLine>
        <Diff file="a.ts" lines={[{ text: "x", sign: "+" }]} onLine={go} />
        <a href="#x">a link</a>
        <details><summary>more</summary></details>
      </div>,
    );
    const nodes = [...container.querySelectorAll<HTMLElement>(CLICKABLE)].filter((n) => !n.matches(":disabled,[aria-disabled=true]"));
    expect(nodes.length).toBeGreaterThan(20);
    const link = (n: HTMLElement) => n.matches("a[href],[role=link]");
    // ds/css/thread.css's own hands (nm-thread's file, counted in spacing.pending.ts PENDING_HAND)
    const pending = (n: HTMLElement) => n.matches(".b-act.ref,.b-route.handoff,.b-brief-line,.b-card-line");
    const hand = nodes.filter((n) => !link(n) && !pending(n) && getComputedStyle(n).cursor === "pointer").map((n) => n.outerHTML.slice(0, 90));
    expect(hand, "a control with the hand: macOS draws the arrow").toEqual([]);
    const links = nodes.filter(link);
    expect(links.length).toBeGreaterThan(0);
    expect(links.map((n) => getComputedStyle(n).cursor)).toEqual(links.map(() => "pointer"));
  });

  it("a disabled control shows the arrow, even a link", () => {
    const { container } = render(
      <div>
        <Button disabled onClick={go}>save</Button>
        <IconButton label="back" state="disabled" onClick={go}>‹</IconButton>
        <Toggle on onChange={go} state="disabled" />
        <ArtChip title="report" onClick={go} />
      </div>,
    );
    const art = container.querySelector<HTMLElement>(".b-artchip");
    art?.setAttribute("aria-disabled", "true");
    const off = [...container.querySelectorAll<HTMLElement>(":disabled,[aria-disabled=true]")];
    expect(off.length).toBeGreaterThan(2);
    expect(off.map((n) => getComputedStyle(n).cursor)).toEqual(off.map(() => "default"));
  });

  it("a plain element with no role keeps the browser's cursor: the hand means a link", () => {
    const { container } = render(<div><span data-x>words</span></div>);
    expect(getComputedStyle(container.querySelector("[data-x]") as HTMLElement).cursor).not.toBe("pointer");
  });
});
