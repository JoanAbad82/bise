// /log in the window (tui-parity N2, designer m_17266): the agent's raw session as the TUI's
// rust/tui/src/logview.rs draws it, read-only and redacted by the hub. The hub answers
// `log {project, agent, before?}` with a page of LogItems (newest rows, oldest first, `more`
// when older remain); the screen opens at the end, asks the page before when he scrolls to
// the top, and keeps his place. One header row per entry ('#seq  time  label  head … size'),
// its body under it on a rail in the kind's colour (prose in the thread's sans at 680, tools
// in the code box), folds past 6 lines ('▸ 34 lines · 2.1 KB'), turns and compactions as
// rules. Keys: ⌘F or / find (n N), f filter, g G top / bottom, ↑↓ j k move, space open,
// ⌘O open all, r reload, esc back. 'what the model got' (the TUI's tab) comes later: its
// tab is in the head, greyed. Owner: amb-web.
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import type { LogItem } from "@/proto";
import { Head, Input, Press } from "@/ds";
import { useCoreEvent, useStore } from "@/store";
import type { Ev } from "@/store/store";
import { useRouter } from "@/app/router";
import { stepOf } from "@/app/listkeys";
import { Markdown } from "@/thread/Markdown";
import { Code } from "@/thread/Code";
import {
  codeText,
  editDiff,
  findCount,
  findRows,
  foldLabel,
  folds,
  kindOf,
  kindsIn,
  labelOf,
  matchesIn,
  prose,
  ruleKind,
  shown,
  sizeOf,
  timeOf,
  type EditDiff,
  type Kind,
} from "./model";
import "./log.css";

/** A row and the key it keeps across pages (an older page goes before it). */
interface Row {
  readonly key: number;
  readonly it: LogItem;
}

/** Ask the page before when he is this close to the top. */
const NEAR_TOP = 240;

export function LogScreen({
  project,
  agent,
}: {
  project: string;
  agent: string;
}) {
  const store = useStore();
  const router = useRouter();
  const [rows, setRows] = useState<readonly Row[]>([]);
  const [more, setMore] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | { error: string }>(
    "loading",
  );
  const [open, setOpen] = useState<ReadonlySet<number>>(new Set());
  const [cursor, setCursor] = useState<number | null>(null);
  const [hidden, setHidden] = useState<ReadonlySet<Kind>>(new Set());
  const [filtering, setFiltering] = useState(false);
  const [finding, setFinding] = useState(false);
  const [needle, setNeedle] = useState("");
  const [at, setAt] = useState(0);
  // an older page asked, not answered yet
  const [paging, setPaging] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLElement>(null);
  const field = useRef<HTMLInputElement>(null);
  // the page asked (undefined: the newest), its scroll height before (an older page keeps his place)
  const asked = useRef<{ before?: number; height: number } | null>(null);
  const keys = useRef({ old: 0, next: 1 });

  // the hub's command, and what was asked (no React state: the open's effect calls it)
  const send = useCallback(
    (before?: number) => {
      asked.current = {
        ...(before === undefined ? {} : { before }),
        height: list.current?.scrollHeight ?? 0,
      };
      store.command(
        before === undefined
          ? { cmd: "log", project, agent }
          : { cmd: "log", project, agent, before },
      );
    },
    [store, project, agent],
  );
  const ask = (before?: number) => {
    setPaging(before !== undefined);
    send(before);
  };
  useEffect(() => {
    send();
    root.current?.focus();
  }, [send]);

  useCoreEvent(
    useCallback(
      (ev: Ev) => {
        if (
          ev.ev === "error" &&
          ev.cmd === "log" &&
          (ev.project == null || ev.project === project)
        ) {
          asked.current = null;
          setPaging(false);
          setState({ error: ev.text });
          return;
        }
        if (ev.ev !== "log" || ev.project !== project || ev.agent !== agent)
          return;
        const q = asked.current;
        if (q?.before === undefined) {
          // the newest page: the rows from scratch (an open, a reload)
          const k = keys.current;
          k.old = 0;
          k.next = ev.items.length + 1;
          setRows(ev.items.map((it, i) => ({ key: i + 1, it })));
          setOpen(new Set());
          setCursor(null);
        } else {
          const k = keys.current;
          setRows((rs) => {
            const first = rs[0]?.it.seq;
            const older =
              first === undefined
                ? ev.items
                : ev.items.filter((o) => o.seq <= first);
            k.old -= older.length;
            return [...older.map((it, i) => ({ key: k.old + i, it })), ...rs];
          });
        }
        setMore(ev.more);
        setPaging(false);
        setState("ready");
      },
      [project, agent],
    ),
  );

  // the newest page opens at the end; an older one keeps the row he was reading where it was
  useLayoutEffect(() => {
    const el = list.current;
    const q = asked.current;
    if (el === null || q === null || state !== "ready") return;
    asked.current = null;
    el.scrollTop =
      q.before === undefined
        ? el.scrollHeight
        : el.scrollTop + (el.scrollHeight - q.height);
  }, [rows, state]);

  const onScroll = () => {
    const el = list.current;
    const first = rows[0]?.it.seq;
    if (el === null || !more || asked.current !== null || first === undefined)
      return;
    if (el.scrollTop < NEAR_TOP) ask(first);
  };

  const visible = useMemo(
    () => rows.filter((r) => shown(r.it, hidden)),
    [rows, hidden],
  );
  const entries = useMemo(
    () => visible.filter((r) => r.it.rule === undefined),
    [visible],
  );
  const hits = useMemo(
    () =>
      findRows(
        visible.map((r) => r.it),
        needle,
      ).map((i) => visible[i]?.key ?? 0),
    [visible, needle],
  );
  const kinds = useMemo(() => kindsIn(rows.map((r) => r.it)), [rows]);

  // the find marks only the matched words, in the selection's tint (the current match's row
  // stronger), through the CSS highlight API: the rows' DOM stays as drawn (designer m_17531)
  useLayoutEffect(() => {
    const reg = typeof CSS === "undefined" ? undefined : CSS.highlights;
    const el = list.current;
    if (reg === undefined || el === null) return;
    const all = new Highlight();
    const cur = new Highlight();
    if (needle.trim() !== "") {
      const current = hits[at];
      for (const row of el.querySelectorAll<HTMLElement>(".lg-e.hit")) {
        const mine = row.dataset.key === String(current) ? cur : all;
        for (const r of rangesIn(row, needle)) mine.add(r);
      }
    }
    reg.set("lg-find", all);
    reg.set("lg-find-at", cur);
    return () => {
      reg.delete("lg-find");
      reg.delete("lg-find-at");
    };
  }, [needle, hits, at, visible, open]);
  const isOpen = (r: Row): boolean => !folds(r.it) || open.has(r.key);

  const reveal = (key: number, block: ScrollLogicalPosition = "nearest") => {
    requestAnimationFrame(() => {
      list.current
        ?.querySelector(`[data-key="${String(key)}"]`)
        ?.scrollIntoView({ block });
    });
  };
  const goHit = (i: number) => {
    if (hits.length === 0) return;
    const n = ((i % hits.length) + hits.length) % hits.length;
    const key = hits[n] ?? 0;
    setAt(n);
    setCursor(key);
    setOpen((o) => new Set(o).add(key));
    reveal(key, "center");
  };
  const toggle = (key: number) => {
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  };
  const toggleAll = () => {
    const foldable = rows.filter((r) => folds(r.it)).map((r) => r.key);
    setOpen((o) =>
      foldable.every((k) => o.has(k)) ? new Set() : new Set(foldable),
    );
  };
  const move = (by: number) => {
    if (entries.length === 0) return;
    // no cursor yet: a step down starts above the first row, a step up below the last (so ↓ is
    // the first, ↑ the last, home the first, end the last)
    const found = entries.findIndex((r) => r.key === cursor);
    const i = found !== -1 ? found : by > 0 ? -1 : entries.length;
    const next = entries[Math.max(0, Math.min(entries.length - 1, i + by))];
    if (next === undefined) return;
    setCursor(next.key);
    reveal(next.key);
  };
  const edge = (top: boolean) => {
    const el = list.current;
    if (el !== null) el.scrollTop = top ? 0 : el.scrollHeight;
    const r = top ? entries[0] : entries.at(-1);
    if (r !== undefined) setCursor(r.key);
  };
  const reload = () => {
    setState("loading");
    ask();
  };
  // a click on a row: the cursor there, and the keys stay the screen's (a fold's button goes away)
  const pick = (key: number) => {
    setCursor(key);
    root.current?.focus({ preventScroll: true });
  };
  // the field drawn and focused inside the key's event: what he types right after ⌘F goes in it,
  // never to the composer (a frame later, the first letters went there)
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

  const onKey = (e: KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === "f") {
      e.preventDefault();
      openFind();
      return;
    }
    if (mod && e.key.toLowerCase() === "o") {
      e.preventDefault();
      toggleAll();
      return;
    }
    if (e.target === field.current) return;
    if (mod || e.altKey) return;
    const k = e.key;
    const done = () => {
      e.preventDefault();
      e.stopPropagation();
    };
    if (k === "Escape") {
      done();
      if (filtering) setFiltering(false);
      else if (finding || needle !== "") closeFind();
      else router.back();
    } else if (k === "/") {
      done();
      openFind();
    } else if (k === "n" && hits.length > 0) {
      done();
      goHit(at + 1);
    } else if (k === "N" && hits.length > 0) {
      done();
      goHit(at - 1);
    } else if (k === "f") {
      done();
      setFiltering((f) => !f);
    } else if (k === "g") {
      done();
      edge(true);
    } else if (k === "G") {
      done();
      edge(false);
    } else if (stepOf(k) !== 0) {
      // the shared list keys (app/listkeys.ts): ↑/k ↓/j, pgup/pgdn ten, home/end
      done();
      move(stepOf(k));
    } else if ((k === " " || k === "Enter") && cursor !== null) {
      done();
      toggle(cursor);
    } else if (k === "r") {
      done();
      reload();
    }
  };
  // the screen's keys on window in the capture phase, as the thread's: they run before
  // type-anywhere (composer/grab.ts, on document), so f g G j k n r stay /log's and never send
  // the focus to the composer. Only while the focus is in the screen.
  const keyRef = useRef(onKey);
  useLayoutEffect(() => {
    keyRef.current = onKey;
  });
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const el = root.current;
      if (el !== null && el.contains(document.activeElement)) keyRef.current(e);
    };
    window.addEventListener("keydown", h, true);
    return () => {
      window.removeEventListener("keydown", h, true);
    };
  }, []);

  const title = `${agent} · session log`;
  return (
    <section className="lg" data-testid="log" tabIndex={-1} ref={root}>
      <Head
        title={title}
        sub={<span data-testid="log.sub">read-only · redacted</span>}
        end={
          <span className="lg-tabs" role="tablist">
            <span
              className="lg-tab on"
              role="tab"
              aria-selected="true"
              data-testid="log.tab.full"
            >
              full history
            </span>
            <span
              className="lg-tab"
              role="tab"
              aria-selected="false"
              aria-disabled="true"
              title="later"
              data-testid="log.tab.model"
            >
              what the model got
            </span>
          </span>
        }
      />
      {filtering && (
        <div className="lg-filter" data-testid="log.filter">
          {kinds.map((k) => (
            <Press
              key={k}
              look={`lg-chip k-${k}${hidden.has(k) ? " off" : ""}`}
              data-testid={`log.filter.${k}`}
              aria-pressed={!hidden.has(k)}
              onClick={() => {
                setHidden((h) => {
                  const n = new Set(h);
                  if (n.has(k)) n.delete(k);
                  else n.add(k);
                  return n;
                });
              }}
            >
              {k}
            </Press>
          ))}
        </div>
      )}
      <div
        className="lg-list"
        ref={list}
        onScroll={onScroll}
        data-testid="log.list"
      >
        {more && (
          <div className="lg-more" data-testid="log.more">
            {paging ? "reading older entries…" : "↑ older entries"}
          </div>
        )}
        {state === "loading" && rows.length === 0 && (
          <div className="lg-note">reading the session log…</div>
        )}
        {typeof state === "object" && (
          <div className="lg-note err" data-testid="log.error">
            {state.error}
          </div>
        )}
        {visible.map((r) =>
          r.it.rule !== undefined ? (
            <Rule key={r.key} row={r} />
          ) : (
            <Entry
              key={r.key}
              row={r}
              agent={agent}
              open={isOpen(r)}
              at={r.key === cursor}
              hit={hits.includes(r.key)}
              onToggle={toggle}
              onPick={pick}
            />
          ),
        )}
      </div>
      <div className="lg-keys" data-testid="log.keys">
        {finding ? (
          <span className="lg-find">
            <span className="w">find</span>
            <Input
              ref={field}
              data-testid="log.find"
              value={needle}
              placeholder="words in the log"
              onChange={(e) => {
                setNeedle(e.target.value);
                setAt(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  e.stopPropagation();
                  closeFind();
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  goHit(
                    e.shiftKey
                      ? at - 1
                      : at + 1 - (cursorIsHit(cursor, hits, at) ? 0 : 1),
                  );
                }
              }}
            />
          </span>
        ) : (
          <>
            <span className="lg-keyline">
              <K k="⌘F">find</K>
              <K k="n N">next / previous</K>
              <K k="f">filter</K>
              <K k="g G">top / bottom</K>
              <K k="space">open</K>
              <K k="⌘O">open all</K>
              <K k="r">reload</K>
            </span>
            <K k="esc" esc>
              back
            </K>
          </>
        )}
        {needle.trim() !== "" && (
          <span className="lg-count" data-testid="log.count">
            {findCount(at, hits.length)}
          </span>
        )}
      </div>
    </section>
  );
}

/** A needle's places in a row's words as DOM ranges (a match may span the code's colour spans). */
function rangesIn(row: HTMLElement, needle: string): Range[] {
  const nodes: Text[] = [];
  const walk = document.createTreeWalker(row, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n !== null; n = walk.nextNode())
    nodes.push(n as Text);
  const starts: number[] = [];
  let text = "";
  for (const n of nodes) {
    starts.push(text.length);
    text += n.data;
  }
  // the text node and offset at a place in the joined words
  const at = (pos: number, end: boolean): [Text, number] | null => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const s = starts[i] ?? 0;
      const node = nodes[i];
      if (node !== undefined && (end ? pos > s : pos >= s))
        return [node, pos - s];
    }
    return null;
  };
  const len = needle.trim().length;
  return matchesIn(text, needle).flatMap((m) => {
    const a = at(m, false);
    const b = at(m + len, true);
    if (a === null || b === null) return [];
    const r = document.createRange();
    r.setStart(a[0], a[1]);
    r.setEnd(b[0], b[1]);
    return [r];
  });
}

/** ⏎ in the field: the first press goes to the current match, the next ones move on. */
const cursorIsHit = (
  cursor: number | null,
  hits: readonly number[],
  at: number,
): boolean => cursor !== null && hits[at] === cursor;

function K({
  k,
  esc = false,
  children,
}: {
  k: string;
  esc?: boolean;
  children: string;
}) {
  return (
    <span className={esc ? "lg-k esc" : "lg-k"}>
      <kbd>{k}</kbd> {children}
    </span>
  );
}

function Rule({ row }: { row: Row }) {
  const rule = row.it.rule ?? "";
  return (
    <div
      className={`lg-rule ${ruleKind(rule)}`}
      data-key={row.key}
      data-testid={`log.rule.${String(row.it.seq)}`}
    >
      <span className="w">{rule}</span>
    </div>
  );
}

function Entry({
  row,
  agent,
  open,
  at,
  hit,
  onToggle,
  onPick,
}: {
  row: Row;
  agent: string;
  open: boolean;
  at: boolean;
  hit: boolean;
  onToggle: (key: number) => void;
  onPick: (key: number) => void;
}) {
  const { it, key } = row;
  const kind = kindOf(it);
  const size = sizeOf(it);
  const diff = editDiff(it);
  const id = `log.row.${String(key)}`;
  return (
    <div
      className={`lg-e k-${kind}${at ? " at" : ""}${hit ? " hit" : ""}`}
      data-key={key}
      data-testid={id}
      data-seq={it.seq}
      data-kind={kind}
    >
      <div
        className="lg-h"
        onClick={() => {
          onPick(key);
          if (folds(it)) onToggle(key);
        }}
      >
        <span className="seq">{it.seq === 0 ? "" : `#${String(it.seq)}`}</span>
        <span className="time">{timeOf(it.at_ms)}</span>
        <span className="label" data-testid={`${id}.label`}>
          {labelOf(it, agent)}
        </span>
        <span className="head" data-testid={`${id}.head`}>
          {it.head}
          {diff !== null && (
            <span className="counts" data-testid={`${id}.counts`}>
              {diff.add > 0 && <span className="ok">+{diff.add}</span>}
              {diff.rm > 0 && <span className="er">−{diff.rm}</span>}
            </span>
          )}
        </span>
        {size !== "" && <span className="size">{size}</span>}
      </div>
      {it.body !== undefined &&
        (open ? (
          <div className="lg-b" data-testid={`${id}.body`}>
            {it.meta !== undefined && it.meta !== "" && (
              <div className="meta">{it.meta}</div>
            )}
            {diff === null ? (
              <Body it={it} />
            ) : (
              <Edit it={it} diff={diff} id={id} />
            )}
            {it.body.cut === true && <div className="meta">cut at 4 KB</div>}
          </div>
        ) : (
          <Press
            look="lg-fold"
            data-testid={`${id}.fold`}
            onClick={() => {
              onPick(key);
              onToggle(key);
            }}
          >
            {foldLabel(it)}
          </Press>
        ))}
    </div>
  );
}

/** An edit as the thread shows it: − / + lines in the thread's tints, the raw args one fold below. */
function Edit({ it, diff, id }: { it: LogItem; diff: EditDiff; id: string }) {
  const [args, setArgs] = useState(false);
  return (
    <>
      <div className="b-diff lg-diff" data-testid={`${id}.diff`}>
        {diff.lines.map((l, i) => (
          <div key={i} className={l.sign === "+" ? "b-dl ad" : "b-dl rm"}>
            <i>{l.sign === "+" ? "+" : "−"}</i>
            {l.text}
          </div>
        ))}
      </div>
      {args ? (
        <Body it={it} />
      ) : (
        <Press
          look="lg-fold args"
          data-testid={`${id}.args`}
          onClick={() => {
            setArgs(true);
          }}
        >
          ▸ args
        </Press>
      )}
    </>
  );
}

function Body({ it }: { it: LogItem }) {
  if (prose(it)) {
    return (
      <div className={`lg-prose${it.role === "thinking" ? " thinking" : ""}`}>
        <Markdown text={it.body?.text ?? ""} breaks={it.role === "you"} />
      </div>
    );
  }
  const { text, lang } = codeText(it);
  return (
    <pre className="lg-code">
      {lang === "text" ? <code>{text}</code> : <Code text={text} lang={lang} />}
    </pre>
  );
}
