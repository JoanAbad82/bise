// @vitest-environment happy-dom
// src/ds · the hand on everything he clicks (his m_44190, round 2 of native-mac: « il manque des
// cursor pointer sur un grand nombre d'elements interactifs »). The ds's whole stylesheet
// (index.css's imports, in order) on its clickable components and on the whole gallery, read back
// with getComputedStyle: every control, clicked role and link shows the hand, a disabled one the
// arrow, a text field its text cursor. In the gallery, every element React gave an onClick is a
// control or carries its role (a plain div he clicks is a red: give it the role). ds/css/base.css
// owns the rule; lint.test.ts's hand law counts the screens' own cursors. Mutation: base.css's
// rule back to cursor:default, a role dropped from Group's rows, or a ds rule's cursor:default on a
// control, turns this red.
import { cleanup, render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { Gallery, SECTIONS } from "./gallery/Gallery";
import {
  Act, ArtChip, ArtName, BriefLine, Button, CardLine, Check, Chip, Diff, Field, Filters, Group, IconButton, ListRow, MenuItem, MoreButton, Opts,
  PickerTrigger, RowAction, SchedHead, SearchButton, Seg, Select, Tabs, TextArea, Toggle, type EntityMenu,
} from "./index";

/** what the root rule reaches: a control, or a role that takes a click, or a link */
const CLICKABLE = [
  "button", "a[href]", "select", "summary", "label[for]", "input[type=checkbox]", "input[type=radio]",
  "[role=button]", "[role=link]", "[role=tab]", "[role=option]", "[role=switch]", "[role=checkbox]", "[role=radio]",
  "[role=menuitem]", "[role=menuitemradio]", "[role=menuitemcheckbox]",
].join(",");
const OFF = ":disabled,[aria-disabled=true],[aria-disabled=true] *";
const go = () => undefined;
const menu: EntityMenu = { onContextMenu: go, open: go };

beforeAll(() => {
  const css = readFileSync(join(__dirname, "index.css"), "utf8");
  const files = [...css.matchAll(/@import "\.\/([\w/.-]+)";/g)].map((m) => m[1] ?? "");
  const style = document.createElement("style");
  style.textContent = files.map((f) => readFileSync(join(__dirname, f), "utf8")).join(String.fromCharCode(10));
  document.head.append(style);
});
afterEach(cleanup);

/** React's own props on a DOM node (its onClick, not a copy of which components take one) */
function clicked(n: Element): boolean {
  const key = Object.keys(n).find((k) => k.startsWith("__reactProps$"));
  const props = key === undefined ? undefined : (n as unknown as Record<string, { onClick?: unknown } | undefined>)[key];
  return typeof props?.onClick === "function";
}
const name = (n: Element) => n.outerHTML.slice(0, 100);
/** a wrapper that only keeps a click from what is under it (bims/MapChip's, around its chip): no
 * words of its own, and each of its children a control or holding one. Not a thing he aims at. */
const wrapper = (n: Element) =>
  n.children.length > 0 && [...n.childNodes].every((c) => c.nodeType !== 3 || (c.textContent ?? "").trim() === "")
  && [...n.children].every((c) => c.matches(CLICKABLE) || c.querySelector(CLICKABLE) !== null);
/** the law on a rendered tree: what he clicks has its role, and every live one shows the hand */
function law(root: HTMLElement): { roleless: string[]; arrow: string[]; count: number } {
  const all = [...root.querySelectorAll<HTMLElement>("*")];
  const roleless = all.filter((n) => clicked(n) && !n.matches(CLICKABLE) && !wrapper(n)).map(name);
  const live = all.filter((n) => n.matches(CLICKABLE) && !n.matches(OFF));
  const arrow = live.filter((n) => getComputedStyle(n).cursor !== "pointer").map(name);
  return { roleless, arrow, count: live.length };
}

describe("the hand on everything he clicks (ds/css/base.css)", () => {
  it("every clickable ds control shows the hand, a link too", () => {
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
        <Filters items={[{ id: "w", label: "waiting" }, { id: "a", label: "answered" }]} on="w" onPick={go} />
        <Group items={[{ id: "a", label: "a", onPick: go }]} />
        <Group list items={[{ id: "b", label: "b", onPick: go }]} />
        <ListRow title="perf" sub="acme" onClick={go} end={<><RowAction onClick={go}>answer</RowAction><MoreButton menu={menu} /></>} />
        <MenuItem onClick={go}>rename</MenuItem>
        <SchedHead open={false} onClick={go}>every 30m</SchedHead>
        <BriefLine open={false} onClick={go}>brief</BriefLine>
        <CardLine onClick={go}>bise asks</CardLine>
        <Diff file="a.ts" lines={[{ text: "x", sign: "+" }]} onLine={go} />
        <a href="#x">a link</a>
        <details><summary>more</summary></details>
      </div>,
    );
    const { roleless, arrow, count } = law(container);
    expect(count).toBeGreaterThan(25);
    expect(roleless, "a plain element he clicks: give it its role").toEqual([]);
    expect(arrow, "a control without the hand").toEqual([]);
  });

  it("a disabled control shows the arrow, even a link", () => {
    const { container } = render(
      <div>
        <Button disabled onClick={go}>save</Button>
        <IconButton label="back" state="disabled" onClick={go}>‹</IconButton>
        <Toggle on onChange={go} state="disabled" />
        <MenuItem disabled onClick={go}>rename</MenuItem>
        <ArtChip title="report" onClick={go} />
      </div>,
    );
    container.querySelector<HTMLElement>(".b-artchip")?.setAttribute("aria-disabled", "true");
    const off = [...container.querySelectorAll<HTMLElement>(":disabled,[aria-disabled=true]")];
    expect(off.length).toBeGreaterThan(3);
    expect(off.map((n) => getComputedStyle(n).cursor)).toEqual(off.map(() => "default"));
  });

  it("a text field keeps its text cursor, a plain element no hand", () => {
    const { container } = render(<div><Field defaultValue="sk-test" /><TextArea defaultValue="words" /><span data-x>words</span></div>);
    const fields = [...container.querySelectorAll<HTMLElement>("input,textarea,[data-x]")];
    expect(fields.length).toBe(3);
    expect(fields.filter((n) => getComputedStyle(n).cursor === "pointer").map(name)).toEqual([]);
  });

});

// the gallery, one section per test (the whole of it in one render took 0.6 s alone and 5-10 s
// under a loaded Mac, past vitest's 5 s): each section dark | light, as the gallery draws it
describe("every gallery section: what he clicks has its role, and shows the hand", () => {
  let total = 0;
  for (const name of Object.keys(SECTIONS)) {
    it(name, () => {
      const { container } = render(<Gallery only={[name]} />);
      const { roleless, arrow, count } = law(container);
      total += count;
      expect(roleless, "a plain element he clicks: give it its role (button, option, tab, link...)").toEqual([]);
      expect(arrow, "a clickable element without the hand: a stylesheet puts the arrow back on it").toEqual([]);
    });
  }
  it("walked them all: the gallery's clickables add up", () => {
    expect(total).toBeGreaterThan(100);
  });
});
