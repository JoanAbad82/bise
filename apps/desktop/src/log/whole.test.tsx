// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { BodyOf, LogItem } from "@/proto";
import type { CoreCmd, CorePort } from "@/shared/api";
import { Store, StoreProvider } from "@/store";
import { createRouter, RouterContext } from "@/app/router";
import { debug } from "@/proto/words_debug.gen";
import { LogScreen } from "./LogScreen";
import { answered, drawn, failed, keyOf, less, more, type Wholes } from "./whole";

const P = "acme-1a2b3c4d";
const row = (pos: number): BodyOf => ({ of: "row", pos });
const cutBody = { kind: "plain" as const, text: "a".repeat(4096), cut: true };

afterEach(cleanup);

describe("a cut body read whole (show more)", () => {
  it("asks once, shows the answer for its body only, folds back and shows again without asking", () => {
    let ws: Wholes = new Map();
    const first = more(ws, row(7));
    expect(first.ask).toBe(true);
    ws = first.ws;
    expect(more(ws, row(7)).ask).toBe(false);
    // a late answer for another row never lands
    ws = answered(ws, { of: row(8), text: "other", total: 5 });
    expect(drawn(ws, row(8), cutBody)).toEqual(cutBody);
    ws = answered(ws, { of: row(7), text: "whole text", total: 10 });
    expect(drawn(ws, row(7), cutBody)).toEqual({ ...cutBody, text: "whole text", cut: false });
    ws = less(ws, row(7));
    expect(drawn(ws, row(7), cutBody)).toEqual(cutBody);
    const again = more(ws, row(7));
    expect(again.ask).toBe(false);
    expect(drawn(again.ws, row(7), cutBody).text).toBe("whole text");
  });

  it("a failed read says why and asks again on the next click", () => {
    const ws = failed(more(new Map(), row(3)).ws, "no row 3 in the session log");
    expect(ws.get(keyOf(row(3)))).toEqual({ state: "error", text: "no row 3 in the session log" });
    expect(more(ws, row(3)).ask).toBe(true);
  });

  it("a block's key is the hub's echo whatever it leaves out (raw false, no provider)", () => {
    const asked: BodyOf = { of: "block", slot: 2, req: 7, raw: false, row: 4, block: 1 };
    const echo: BodyOf = { of: "block", slot: 2, req: 7, row: 4, block: 1 };
    expect(keyOf(asked)).toBe(keyOf(echo));
    expect(keyOf({ ...echo, raw: true })).not.toBe(keyOf(echo));
  });

  it("the history: show more asks log_body, draws the whole text, show less folds it back", () => {
    const cmds: CoreCmd[] = [];
    const port: CorePort = { send: (c) => cmds.push(c), onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve("up") };
    const store = new Store(port);
    store.setCore("up");
    const v = render(
      <StoreProvider store={store}>
        <RouterContext value={createRouter({ screen: "bise" })}>
          <LogScreen project={P} agent="perf" />
        </RouterContext>
      </StoreProvider>,
    );
    const whole = `${"x".repeat(4096)}THE END`;
    const item: LogItem = { seq: 4, pos: 300, role: "result", ok: true, tool: "bash", head: "cargo test", body: { kind: "plain", text: whole.slice(0, 4096), cut: true } };
    act(() => {
      store.apply({ ev: "log", project: P, agent: "perf", items: [item], more: false });
    });
    const id = "log.row.300";
    const openIt = v.queryByTestId(`${id}.fold`);
    if (openIt !== null) fireEvent.click(openIt);
    expect(v.getByTestId(`${id}.cut`).textContent).toContain(debug.cut_at);
    expect(v.getByTestId(`${id}.body`).textContent).not.toContain("THE END");
    fireEvent.click(v.getByTestId(`${id}.more`));
    expect(cmds.filter((c) => c.cmd === "log_body")).toEqual([{ cmd: "log_body", project: P, agent: "perf", of: { of: "row", pos: 300 } }]);
    expect(v.getByTestId(`${id}.cut`).textContent).toBe(debug.reading_whole);
    act(() => {
      store.apply({ ev: "log_body", project: P, agent: "perf", of: { of: "row", pos: 300 }, text: whole, total: whole.length });
    });
    expect(v.getByTestId(`${id}.body`).textContent).toContain("THE END");
    fireEvent.click(v.getByTestId(`${id}.less`));
    expect(v.getByTestId(`${id}.body`).textContent).not.toContain("THE END");
    fireEvent.click(v.getByTestId(`${id}.more`));
    expect(v.getByTestId(`${id}.body`).textContent).toContain("THE END");
    expect(cmds.filter((c) => c.cmd === "log_body")).toHaveLength(1);
  });
});
