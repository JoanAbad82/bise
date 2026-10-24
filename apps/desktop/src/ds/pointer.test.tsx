// @vitest-environment happy-dom
// src/ds · the hand on every thing he can click (his words: « chaque élément interactif, chaque
// bouton, chaque chose sur lequel tu peux cliquer ... devrait avoir un cursor pointer »). The ds's
// whole stylesheet (index.css's imports, in order) on its clickable components, read back with
// getComputedStyle: each control shows the hand, a disabled one the arrow. ds/css/base.css owns it;
// lint.test.ts's pointer law keeps screens from undoing it. Mutation: base.css's :where(...) rule
// dropped turns this red.
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

describe("the hand on every ds control (ds/css/base.css)", () => {
  it("every clickable ds component shows the pointer", () => {
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
    const arrow = nodes.filter((n) => getComputedStyle(n).cursor !== "pointer").map((n) => n.outerHTML.slice(0, 90));
    expect(arrow, "a control without the hand").toEqual([]);
  });

  it("a disabled control shows the arrow, even one whose own rule says pointer", () => {
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

  it("a plain element with no role keeps the browser's cursor: the hand means a click", () => {
    const { container } = render(<div><span data-x>words</span></div>);
    expect(getComputedStyle(container.querySelector("[data-x]") as HTMLElement).cursor).not.toBe("pointer");
  });
});
