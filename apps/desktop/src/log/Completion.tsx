// /debug completion in the window (designer debug-views v3): a request of the agent's ring as
// its provider got it, the hub's rows (bise_session::completion cut the very body the runtime
// sent, every text redacted there), or the same request as another provider's family would get
// it (the runtime renders it, no call made). The request's head and the system prompt fold at
// the top, then the messages since the compaction, the role at the left and the tokens at the
// right; bash draws as its command, run_typescript as its code, texts as markdown, the rest as
// JSON or text as it is. [ ] step through the ring, r shows each row's raw JSON as sent.
// At the right (above under a pane of 880), the charts of its tokens (Charts.tsx, debug-viz): a
// click on a bar or a bin filters the list (a chip per filter, ⌫ clears, esc goes up one level), a
// click on a message's bar opens it; v hides them. A block the hub cut at 4 KB has 'show more'
// under it (whole.ts: that block of this slot, as asked, whole from the hub).
// Owner: debug-cmd (the charts: debug-viz).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { BodyOf, CompBlock, CompRow, Completion as Comp } from "@/proto";
import { Press } from "@/ds";
import { useCoreEvent, useStore } from "@/store";
import type { Ev } from "@/store/store";
import { useRouter } from "@/app/router";
import { stepOf } from "@/app/listkeys";
import { Markdown } from "@/thread/Markdown";
import { Code } from "@/thread/Code";
import {
  compBlockView,
  compFolds,
  compHits,
  compRole,
  compTitle,
  linesOf,
  shortBytes,
  stepHit,
  tokensWord,
} from "./model";
import { CutFoot, FindLine, K, useScreenKeys } from "./parts";
import { drawn, useWhole, type WholeApi } from "./whole";

/** The request a block's 'show more' names: the one drawn, as it was asked. */
type BlockAsk = Omit<Extract<BodyOf, { of: "block" }>, "of" | "row" | "block">;
import { Charts, selWords } from "./Charts";
import { filterRows, kTokens, sameSel, total, type Filter, type Node } from "./viz";
import { debug } from "@/proto/words_debug.gen";

type CompEv = { ev: "completion" } & Comp;

export function Completion({
  project,
  agent,
  provider,
  onTab,
}: {
  project: string;
  agent: string;
  provider: string | undefined;
  onTab: () => void;
}) {
  const store = useStore();
  const router = useRouter();
  const whole = useWhole(project, agent);
  const [comp, setComp] = useState<Comp | null>(null);
  const [state, setState] = useState<"loading" | "ready" | { error: string }>(
    "loading",
  );
  const [slot, setSlot] = useState<number | undefined>(undefined);
  const [raw, setRaw] = useState(false);
  const [open, setOpen] = useState<ReadonlySet<number>>(new Set());
  const [cursor, setCursor] = useState<number | null>(null);
  const [finding, setFinding] = useState(false);
  const [needle, setNeedle] = useState("");
  const [at, setAt] = useState(0);
  // the charts' level shown, the list's filter, a message opened from the series, the charts shown
  const [drill, setDrill] = useState<readonly string[]>([]);
  const [filter, setFilter] = useState<Filter>({});
  const [pinned, setPinned] = useState<number | null>(null);
  const [charts, setCharts] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);

  // the request asked (the newest at the open; [ ] and r ask another, saying 'loading' then)
  useEffect(() => {
    store.command({
      cmd: "completion",
      project,
      agent,
      ...(slot === undefined ? {} : { slot }),
      ...(provider === undefined ? {} : { provider }),
      ...(raw ? { raw } : {}),
    } as unknown as Parameters<typeof store.command>[0]);
    root.current?.focus();
  }, [store, project, agent, slot, provider, raw]);

  useCoreEvent(
    useCallback(
      (ev: Ev) => {
        if (
          ev.ev === "error" &&
          ev.cmd === "completion" &&
          (ev.project == null || ev.project === project)
        ) {
          setState({ error: ev.text });
          return;
        }
        if ((ev.ev as string) !== "completion") return;
        const c = ev as unknown as CompEv;
        if (c.project !== project || c.agent !== agent) return;
        setComp(c);
        setState("ready");
        setOpen(new Set());
        setCursor(null);
        setPinned(null);
      },
      [project, agent],
    ),
  );

  // the newest request opens at its end, as the history does
  useEffect(() => {
    const el = list.current;
    if (el !== null && state === "ready") el.scrollTop = el.scrollHeight;
  }, [comp, state]);

  const all = useMemo(() => comp?.rows ?? [], [comp]);
  const filtering = filter.sel !== undefined || filter.size !== undefined;
  const rows = useMemo(() => {
    const kept = filterRows(all, filter);
    if (pinned === null || kept.some((r) => r.n === pinned)) return kept;
    return all.filter((r) => r.n === pinned || kept.includes(r));
  }, [all, filter, pinned]);
  const hits = useMemo(() => compHits(rows, needle), [rows, needle]);
  const isOpen = (r: CompRow): boolean => !compFolds(r) || open.has(r.n);

  const reveal = (n: number, block: ScrollLogicalPosition = "nearest") => {
    requestAnimationFrame(() => {
      list.current
        ?.querySelector(`[data-n="${String(n)}"]`)
        ?.scrollIntoView({ block });
    });
  };
  const goHit = (i: number) => {
    if (i < 0) return;
    const n = hits[i];
    if (n === undefined) return;
    setAt(i);
    setCursor(n);
    setOpen((o) => new Set(o).add(n));
    reveal(n, "center");
  };
  const toggle = (n: number) => {
    setOpen((o) => {
      const s = new Set(o);
      if (s.has(n)) s.delete(n);
      else s.add(n);
      return s;
    });
  };
  const toggleAll = () => {
    const foldable = rows.filter(compFolds).map((r) => r.n);
    setOpen((o) =>
      foldable.every((k) => o.has(k)) ? new Set() : new Set(foldable),
    );
  };
  const move = (by: number) => {
    if (rows.length === 0) return;
    const found = rows.findIndex((r) => r.n === cursor);
    const i = found !== -1 ? found : by > 0 ? -1 : rows.length;
    const next = rows[Math.max(0, Math.min(rows.length - 1, i + by))];
    if (next === undefined) return;
    setCursor(next.n);
    reveal(next.n);
  };
  // [ ]: the ring's request before or after the one shown (oldest first)
  const stepRequest = (by: number) => {
    const slots = comp?.slots.filter((s) => s.writing !== true) ?? [];
    const i = slots.findIndex((s) => s.slot === comp?.slot.slot);
    const next = slots[i + by];
    if (i === -1 || next === undefined) return;
    setState("loading");
    setSlot(next.slot);
  };
  const openFind = () => {
    flushSync(() => {
      setFinding(true);
    });
    field.current?.select();
  };
  const closeFind = () => {
    setFinding(false);
    setNeedle("");
    root.current?.focus();
  };

  // a bar: the list keeps its group (again: no group), the charts open the level below
  const onBar = (n: Node) => {
    const same = sameSel(filter.sel, n);
    setFilter((f) => ({ ...f, sel: same ? undefined : n }));
    setPinned(null);
    if (!same && n.deeper && !n.rest) setDrill(n.path);
  };
  // the breadcrumb, or esc: back to that level, the list keeping its group
  const onCrumb = (depth: number) => {
    const path = drill.slice(0, depth);
    setDrill(path);
    setFilter((f) => ({ ...f, sel: path.length === 0 ? undefined : { path } }));
    setPinned(null);
  };
  const onBin = (from: number, to: number) => {
    setFilter((f) => ({ ...f, size: f.size?.from === from && f.size.to === to ? undefined : { from, to } }));
    setPinned(null);
  };
  const onOpenMsg = (n: number) => {
    setPinned(n);
    setCursor(n);
    setOpen((o) => new Set(o).add(n));
    reveal(n, "center");
  };
  const clearFilter = () => {
    setFilter({});
    setDrill([]);
    setPinned(null);
  };

  const onKey = (e: KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey;
    const k = e.key;
    if (mod && (k === "]" || k === "[")) {
      // the other tab; never the window's back / forward too (app/esc-up.ts on window)
      e.preventDefault();
      e.stopPropagation();
      onTab();
      return;
    }
    if (mod && k.toLowerCase() === "f") {
      e.preventDefault();
      openFind();
      return;
    }
    if (mod && k.toLowerCase() === "g") {
      e.preventDefault();
      goHit(stepHit(at, e.shiftKey ? -1 : 1, hits.length));
      return;
    }
    if (mod && k.toLowerCase() === "o") {
      e.preventDefault();
      toggleAll();
      return;
    }
    if (e.target === field.current) return;
    if (mod || e.altKey) return;
    const done = () => {
      e.preventDefault();
      e.stopPropagation();
    };
    if (k === "Escape") {
      done();
      if (finding || needle !== "") closeFind();
      else if (drill.length > 0) onCrumb(drill.length - 1);
      else if (filtering) clearFilter();
      else router.back();
    } else if (k === "Backspace" && filtering) {
      done();
      clearFilter();
    } else if (k === "v") {
      done();
      setCharts((c) => !c);
    } else if (k === "Tab") {
      done();
      onTab();
    } else if (k === "/") {
      done();
      openFind();
    } else if (k === "n" && hits.length > 0) {
      done();
      goHit(stepHit(at, 1, hits.length));
    } else if (k === "N" && hits.length > 0) {
      done();
      goHit(stepHit(at, -1, hits.length));
    } else if (k === "[" || k === "]") {
      done();
      stepRequest(k === "[" ? -1 : 1);
    } else if (k === "r") {
      done();
      setState("loading");
      setRaw((r) => !r);
    } else if (k === "g" || k === "G") {
      done();
      const el = list.current;
      if (el !== null) el.scrollTop = k === "g" ? 0 : el.scrollHeight;
    } else if (stepOf(k) !== 0) {
      done();
      move(stepOf(k));
    } else if ((k === " " || k === "Enter") && cursor !== null) {
      done();
      toggle(cursor);
    }
  };
  useScreenKeys(root, onKey);

  return (
    <div className="lg-pane" tabIndex={-1} ref={root} data-testid="debug.completion">
      {comp !== null && (
        <div className="lg-req" data-testid="comp.title">
          {compTitle(comp)}
          {raw && <span className="lg-raw"> · raw json</span>}
        </div>
      )}
      <div className="lg-cbody">
      <div className="lg-cmain">
      {filtering && (
        <div className="lg-cfilter" data-testid="comp.filter">
          {filter.sel !== undefined && (
            <span className="lg-fchip" data-testid="comp.filter.group">
              {selWords(filter.sel)}
              <Press look="x" data-tip={debug.tip_clear} aria-label={debug.tip_clear} onClick={() => { onCrumb(0); }}>
                ×
              </Press>
            </span>
          )}
          {filter.size !== undefined && (
            <span className="lg-fchip" data-testid="comp.filter.size">
              {debug.chip_size({ from: kTokens(filter.size.from), to: kTokens(filter.size.to) })}
              <Press look="x" data-tip={debug.tip_clear} aria-label={debug.tip_clear} onClick={() => { setFilter((f) => ({ ...f, size: undefined })); }}>
                ×
              </Press>
            </span>
          )}
          <span className="count" data-testid="comp.filter.count">
            {debug.filtered({ shown: rows.length, total: all.length, tokens: kTokens(total(rows, filter.sel)) })}
          </span>
        </div>
      )}
      <div className="lg-list" ref={list} data-testid="comp.list">
        {state === "loading" && comp === null && (
          <div className="lg-note">reading the request…</div>
        )}
        {typeof state === "object" && (
          <div className="lg-note err" data-testid="comp.error">
            {state.error}
          </div>
        )}
        {rows.map((r, i) => (
          <CRow
            key={`${String(comp?.slot.slot)}-${String(r.n)}`}
            row={r}
            rule={r.n > 0 && rows[i - 1]?.role === "system" && r.role !== "system"}
            open={isOpen(r)}
            at={r.n === cursor}
            hit={hits.includes(r.n)}
            onToggle={() => {
              setCursor(r.n);
              toggle(r.n);
            }}
            ask={comp === null ? undefined : { slot: comp.slot.slot, req: comp.slot.req, ...(provider === undefined ? {} : { provider }), ...(raw ? { raw } : {}) }}
            whole={whole}
          />
        ))}
      </div>
      </div>
      {charts && comp !== null && (
        <Charts rows={all} drill={drill} filter={filter} onBar={onBar} onCrumb={onCrumb} onBin={onBin} onOpen={onOpenMsg} />
      )}
      </div>
      <div className="lg-keys" data-testid="comp.keys">
        {finding ? (
          <FindLine
            field={field}
            needle={needle}
            at={at}
            of={hits.length}
            busy={false}
            onNeedle={(n) => {
              setNeedle(n);
              setAt(0);
            }}
            onStep={(by) => {
              goHit(stepHit(at, cursor === hits[at] ? by : 0, hits.length));
            }}
            onClose={closeFind}
          />
        ) : (
          <>
            <span className="lg-keyline">
              <K k="[ ]">request</K>
              <K k="r">raw json</K>
              <K k="⌘F">find</K>
              <K k="⌘G">next</K>
              <K k="⏎">open</K>
              <K k="⌘O">open all</K>
              <K k="⌘]">history</K>
              {filtering && <K k="⌫">{debug.key_clear}</K>}
              <K k="v">{debug.key_charts}</K>
            </span>
            <K k="esc" esc>
              back
            </K>
          </>
        )}
      </div>
    </div>
  );
}

function CRow({
  row,
  rule,
  open,
  at,
  hit,
  onToggle,
  ask,
  whole,
}: {
  row: CompRow;
  rule: boolean;
  open: boolean;
  at: boolean;
  hit: boolean;
  onToggle: () => void;
  /** the request shown, as asked (a block's 'show more' names it) */
  ask: BlockAsk | undefined;
  whole: WholeApi;
}) {
  const id = `comp.row.${String(row.n)}`;
  return (
    <>
      {rule && <div className="lg-rule compact"><span className="w">messages since the compaction</span></div>}
      <div
        className={`lg-e lg-c r-${row.role.replace(/[^a-z_]/gu, "")}${at ? " at" : ""}${hit ? " hit" : ""}`}
        data-n={row.n}
        data-testid={id}
      >
        <div className="lg-h" role="button" onClick={onToggle}>
          <span className="seq">{row.n === 0 ? "" : String(row.n)}</span>
          <span className="label" data-testid={`${id}.role`}>
            {compRole(row)}
          </span>
          <span className="head">{row.head}</span>
          <span className="size">{tokensWord(row.tokens)}</span>
        </div>
        {open ? (
          <div className="lg-b" data-testid={`${id}.body`}>
            {row.blocks.map((b, i) => (
              <Block
                key={i}
                b={b}
                id={`${id}.b${String(i)}`}
                of={ask === undefined ? undefined : { of: "block", ...ask, row: row.n, block: i }}
                whole={whole}
              />
            ))}
          </div>
        ) : (
          <Press look="lg-fold" data-testid={`${id}.fold`} onClick={onToggle}>
            {`▸ ${String(row.blocks.reduce((n, b) => n + linesOf(b.body.text), 0))} lines · ${shortBytes(row.bytes)}`}
          </Press>
        )}
      </div>
    </>
  );
}

/** A block as its kind draws: bash a command box, code highlighted, markdown, JSON, text. */
function Block({ b: sent, id, of, whole }: { b: CompBlock; id: string; of: BodyOf | undefined; whole: WholeApi }) {
  // the block as he reads it: whole once he asked for it (show more)
  const b = of === undefined ? sent : { ...sent, body: drawn(whole.ws, of, sent.body) };
  const v = compBlockView(b);
  return (
    <div className="lg-blk" data-testid={id} data-view={v}>
      {b.label !== undefined && <div className="meta">{b.label}</div>}
      {v === "md" ? (
        <div className="lg-prose">
          <Markdown text={b.body.text} />
        </div>
      ) : v === "cmd" ? (
        <pre className="lg-code lg-cmd">
          <Code text={b.body.text} lang="bash" />
        </pre>
      ) : v === "text" ? (
        <pre className="lg-code">
          <code>{b.body.text}</code>
        </pre>
      ) : (
        <pre className="lg-code">
          <Code text={b.body.text} lang={b.body.lang ?? "text"} />
        </pre>
      )}
      {of === undefined ? (
        sent.body.cut === true && <div className="meta">{debug.cut_at}</div>
      ) : (
        <CutFoot of={of} body={sent.body} whole={whole} id={id} />
      )}
    </div>
  );
}
