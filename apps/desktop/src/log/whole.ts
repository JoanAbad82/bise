// /debug's 'show more' (debug-more): a body the hub cut at 4 KB (`LogBody.cut`) read whole. He
// clicks show more: the window asks `log_body {of}` (a history row's pos, or a completion block:
// slot, req, provider, raw, row, block), the hub answers its text (redacted, cut again past 1 MB,
// `total` its whole size) with `of` echoed, and the row draws it; show less folds it back to the
// cut text, show more again shows it without asking. An answer is kept only for the body asked
// (its key), so a late one never lands in another row. Pure but `useWhole`. Owner: debug-more.
import { useCallback, useRef, useState } from "react";
import type { BodyOf, LogBody } from "@/proto";
import { useCoreEvent, useStore } from "@/store";
import type { Ev } from "@/store/store";

/** A body's whole text: being read, shown, folded back, or why it could not be read. */
export type Whole =
  | { readonly state: "reading" }
  | { readonly state: "shown" | "folded"; readonly text: string; readonly cut: boolean; readonly total: number }
  | { readonly state: "error"; readonly text: string };

export type Wholes = ReadonlyMap<string, Whole>;

/** One key per body (the hub leaves `raw: false` and no provider out of its echo). */
export function keyOf(of: BodyOf): string {
  switch (of.of) {
    case "row":
      return `row:${String(of.pos)}`;
    case "block":
      return `block:${String(of.slot)}:${String(of.req)}:${of.provider ?? ""}:${of.raw === true ? "raw" : ""}:${String(of.row)}:${String(of.block)}`;
    default:
      return "unknown";
  }
}

/** Show more: a folded body shows again; one never read (or that failed) is asked (`ask`). */
export function more(ws: Wholes, of: BodyOf): { ws: Wholes; ask: boolean } {
  const k = keyOf(of);
  const w = ws.get(k);
  if (w?.state === "folded") return { ws: new Map(ws).set(k, { ...w, state: "shown" }), ask: false };
  if (w === undefined || w.state === "error") return { ws: new Map(ws).set(k, { state: "reading" }), ask: true };
  return { ws, ask: false };
}

/** Show less: a shown body folds back to its cut text. */
export function less(ws: Wholes, of: BodyOf): Wholes {
  const k = keyOf(of);
  const w = ws.get(k);
  return w?.state === "shown" ? new Map(ws).set(k, { ...w, state: "folded" }) : ws;
}

/** The hub's answer: kept only for a body being read. */
export function answered(ws: Wholes, a: { of: BodyOf; text: string; cut?: boolean; total: number }): Wholes {
  const k = keyOf(a.of);
  if (ws.get(k)?.state !== "reading") return ws;
  return new Map(ws).set(k, { state: "shown", text: a.text, cut: a.cut === true, total: a.total });
}

/** The hub's error for a `log_body`: every body being read says it (the error names no body). */
export function failed(ws: Wholes, text: string): Wholes {
  if (![...ws.values()].some((w) => w.state === "reading")) return ws;
  return new Map([...ws].map(([k, w]) => [k, w.state === "reading" ? { state: "error", text } : w]));
}

/** The body to draw: its whole text while shown, else as the page sent it. */
export function drawn(ws: Wholes, of: BodyOf, body: LogBody): LogBody {
  const w = ws.get(keyOf(of));
  return w?.state === "shown" ? { ...body, text: w.text, cut: w.cut } : body;
}

/** What a screen's rows read of the wholes, and his two gestures. */
export interface WholeApi {
  readonly ws: Wholes;
  readonly more: (of: BodyOf) => void;
  readonly less: (of: BodyOf) => void;
}

/** The screen's wholes for one agent: what each body shows, and his show more / show less. */
export function useWhole(project: string, agent: string): WholeApi {
  const store = useStore();
  // the wholes now (his click decides whether to ask from them, not from the last render)
  const [ws, setWs] = useState<Wholes>(() => new Map());
  const cur = useRef<Wholes>(ws);
  const put = useCallback((w: Wholes) => {
    cur.current = w;
    setWs(w);
  }, []);
  useCoreEvent(
    useCallback(
      (ev: Ev) => {
        if (ev.ev === "error" && ev.cmd === "log_body" && (ev.project == null || ev.project === project)) {
          put(failed(cur.current, ev.text));
          return;
        }
        if (ev.ev !== "log_body" || ev.project !== project || ev.agent !== agent) return;
        put(answered(cur.current, ev));
      },
      [project, agent, put],
    ),
  );
  const onMore = useCallback(
    (of: BodyOf) => {
      const r = more(cur.current, of);
      put(r.ws);
      if (r.ask) store.command({ cmd: "log_body", project, agent, of });
    },
    [store, project, agent, put],
  );
  const onLess = useCallback(
    (of: BodyOf) => {
      put(less(cur.current, of));
    },
    [put],
  );
  return { ws, more: onMore, less: onLess };
}
