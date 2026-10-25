// /debug completion's charts (designer debug-viz v5, Gabriel's ask): where the request's tokens go
// (sorted bars, one level at a time under a breadcrumb), the sizes of the chosen group's parts
// (a histogram from 0 to its p99) and each message's tokens in the body's order (the group in ink).
// Every click filters the list (Completion keeps the filter); a click on a message's bar opens it.
// One grey for what is not picked, ink for what is; every mark has its tip. Under a pane of 880 the
// column goes above the list, one chart at a time behind three tabs (log.css, @container).
// The numbers are the hub's (bise_session::completion::groups): viz.ts only sums and bins them.
// Owner: debug-viz.
import { useMemo, useState } from "react";
import type { CompKind, CompRole, CompRow } from "@/proto";
import { Press } from "@/ds";
import { debug } from "@/proto/words_debug.gen";
import { histogram, kTokens, level, peaks, sameSel, series, share, topPart, total, type Filter, type Node, type Sel } from "./viz";

type Tab = "tokens" | "sizes" | "series";

const ROLE: Record<CompRole, string> = {
  system: debug.role_system,
  user: debug.role_user,
  assistant: debug.role_assistant,
  tool_call: debug.role_tool_call,
  tool_result: debug.role_tool_result,
  unknown: debug.kind_other,
};
const KIND: Record<CompKind, string> = {
  prompt: debug.kind_prompt,
  tools: debug.kind_tools,
  params: debug.kind_params,
  mid: debug.kind_mid,
  words: debug.kind_words,
  agent_message: debug.kind_agent_message,
  bise_state: debug.kind_bise_state,
  preamble: debug.kind_preamble,
  summary: debug.kind_summary,
  note: debug.kind_note,
  tagged: debug.kind_tagged,
  text: debug.kind_text,
  thinking: debug.kind_thinking,
  image: debug.kind_image,
  tool: debug.kind_other,
  other: debug.kind_other,
  unknown: debug.kind_other,
};

/** A level's key as he reads it: a role or a kind through the words, a name as it is. */
export function keyWord(key: string): string {
  if (key === "other") return debug.kind_other;
  if (key.startsWith("n:")) return key.slice(2);
  if (key.startsWith("k:")) return (KIND as Record<string, string | undefined>)[key.slice(2)] ?? key.slice(2);
  return (ROLE as Record<string, string | undefined>)[key] ?? key;
}

/** A group's words: its path's last key ('tool result › bash' in the chips). */
export function selWords(s: Sel): string {
  const words = s.path.map(keyWord);
  return s.exclude === undefined ? words.join(" › ") : [...words, debug.kind_other].join(" › ");
}

export function Charts({
  rows,
  drill,
  filter,
  onBar,
  onCrumb,
  onBin,
  onOpen,
}: {
  rows: readonly CompRow[];
  drill: readonly string[];
  filter: Filter;
  onBar: (n: Node) => void;
  onCrumb: (depth: number) => void;
  onBin: (from: number, to: number) => void;
  onOpen: (n: number) => void;
}) {
  const [tab, setTab] = useState<Tab>("tokens");
  const sel = filter.sel;
  const nodes = useMemo(() => level(rows, drill), [rows, drill]);
  const whole = useMemo(() => total(rows), [rows]);
  if (whole === 0) {
    return (
      <aside className="lg-charts" data-testid="comp.charts">
        <div className="lg-note">{debug.no_parts}</div>
      </aside>
    );
  }
  const tabs: [Tab, string][] = [
    ["tokens", debug.tab_tokens],
    ["sizes", debug.tab_sizes],
    ["series", debug.tab_series],
  ];
  return (
    <aside className="lg-charts" data-testid="comp.charts" data-tab={tab}>
      <div className="lg-ctabs" role="tablist">
        {tabs.map(([t, w]) => (
          <Press key={t} role="tab" aria-selected={tab === t} look={tab === t ? "ct on" : "ct"} onClick={() => { setTab(t); }} data-testid={`comp.charts.tab.${t}`}>
            {w}
          </Press>
        ))}
      </div>
      <Bars nodes={nodes} drill={drill} whole={whole} sel={sel} onBar={onBar} onCrumb={onCrumb} />
      <Sizes rows={rows} sel={sel} size={filter.size} onBin={onBin} />
      <Series rows={rows} sel={sel} onOpen={onOpen} />
    </aside>
  );
}

function Bars({ nodes, drill, whole, sel, onBar, onCrumb }: { nodes: Node[]; drill: readonly string[]; whole: number; sel: Sel | undefined; onBar: (n: Node) => void; onCrumb: (depth: number) => void }) {
  const max = Math.max(1, ...nodes.map((n) => n.tokens));
  const crumbs = [debug.crumb_all, ...drill.map(keyWord)];
  const leaf = nodes.every((n) => !n.deeper);
  return (
    <section className="lg-chart" data-chart="tokens" data-testid="comp.chart.tokens">
      <div className="lg-ct">
        <span className="t">{debug.where_title}</span>
        <span className="n" data-tip={debug.tip_est}>
          {debug.total_est({ total: kTokens(whole) })}
        </span>
      </div>
      <div className="lg-crumbs" data-testid="comp.chart.crumbs">
        {crumbs.map((c, i) => (
          <span key={i}>
            {i > 0 && <span className="sep"> › </span>}
            {i === crumbs.length - 1 ? (
              <span className="at">{c}</span>
            ) : (
              <Press look="up" onClick={() => { onCrumb(i); }}>
                {c}
              </Press>
            )}
          </span>
        ))}
      </div>
      <div className="lg-bars">
        {nodes.map((n) => {
          const on = sameSel(sel, n);
          const name = keyWord(n.key);
          return (
            <Press
              key={n.key}
             
              look={`lg-bar${on ? " on" : ""}`}
              onClick={() => { onBar(n); }}
              data-tip={debug.tip_bar({ name, tokens: kTokens(n.tokens), share: share(n.tokens, whole) })}
              data-testid={`comp.chart.bar.${n.key}`}
            >
              <span className="name">{name}</span>
              <span className="track">
                <span className="fill" style={{ width: `${String((100 * n.tokens) / max)}%` }} />
              </span>
              <span className="v">{kTokens(n.tokens)}</span>
              <span className="pc">{share(n.tokens, whole)}</span>
            </Press>
          );
        })}
      </div>
      <div className="lg-hint">{leaf ? debug.hint_leaf : debug.hint_bars}</div>
    </section>
  );
}

function Sizes({ rows, sel, size, onBin }: { rows: readonly CompRow[]; sel: Sel | undefined; size: Filter["size"]; onBin: (from: number, to: number) => void }) {
  const h = useMemo(() => histogram(rows, sel), [rows, sel]);
  const max = Math.max(1, ...h.bins.map((b) => b.count));
  const what = sel === undefined ? debug.crumb_all : selWords(sel);
  const ticks = [0, 1, 2, 3, 4].map((i) => kTokens(Math.round(((h.bins.at(-1)?.to ?? 0) * i) / 4)));
  return (
    <section className="lg-chart" data-chart="sizes" data-testid="comp.chart.sizes">
      <div className="lg-ct">
        <span className="t">{debug.sizes_title({ what })}</span>
        <span className="n">{debug.sizes_axis}</span>
      </div>
      <div className="lg-hist">
        {h.bins.map((b, i) => {
          const on = size !== undefined && size.from === b.from && size.to === b.to;
          return (
            <Press
              key={i}
             
              look={`lg-bin${on ? " on" : ""}`}
              disabled={b.count === 0}
              onClick={() => { onBin(b.from, b.to); }}
              data-tip={debug.tip_bin({ from: kTokens(b.from), to: kTokens(b.to), n: b.count })}
              data-testid={`comp.chart.bin.${String(i)}`}
            >
              <span className="fill" style={{ height: `${String((100 * b.count) / max)}%` }} />
            </Press>
          );
        })}
      </div>
      <div className="lg-axis">
        {ticks.map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
      <div className="lg-hint">{debug.sizes_foot({ n: h.n, median: kTokens(h.median), over: h.over })}</div>
    </section>
  );
}

function Series({ rows, sel, onOpen }: { rows: readonly CompRow[]; sel: Sel | undefined; onOpen: (n: number) => void }) {
  const bars = useMemo(() => series(rows, sel), [rows, sel]);
  const top = useMemo(() => peaks(bars, 3), [bars]);
  const byN = useMemo(() => new Map(rows.map((r) => [r.n, r])), [rows]);
  const max = Math.max(1, ...bars.map((b) => b.tokens));
  const W = Math.max(1, bars.length);
  const H = 100;
  const what = (n: number): string => {
    const r = byN.get(n);
    const p = r === undefined ? undefined : topPart(r, sel);
    if (p === undefined) return r?.role ?? "";
    return [p.role === "tool_call" || p.role === "tool_result" ? keyWord(p.role) : keyWord(`k:${p.kind}`), ...(p.names ?? [])].join(" ");
  };
  const label = (n: number, t: number) => `#${String(n)} · ${kTokens(t)} · ${what(n)}`;
  const first = top[0];
  // its label at the left of its dot when the peak is in the right half (it stays in the chart)
  const firstAt = first === undefined ? 0 : bars.findIndex((b) => b.n === first.n);
  // a bar is about 1 px wide: a click opens the tallest bar within 3 of it
  const open = (i: number) => {
    let best = i;
    for (let j = Math.max(0, i - 3); j <= Math.min(bars.length - 1, i + 3); j++) {
      if ((bars[j]?.picked ?? 0) > (bars[best]?.picked ?? 0)) best = j;
    }
    const b = bars[best];
    if (b !== undefined) onOpen(b.n);
  };
  return (
    <section className="lg-chart" data-chart="series" data-testid="comp.chart.series">
      <div className="lg-ct">
        <span className="t">{debug.series_title}</span>
        <span className="n">{bars.length > 0 ? `#${String(bars[0]?.n ?? 1)} → #${String(bars.at(-1)?.n ?? 1)}` : ""}</span>
      </div>
      <div className="lg-series">
        <svg viewBox={`0 0 ${String(W)} ${String(H)}`} preserveAspectRatio="none" aria-hidden="true">
          {bars.map((b, i) => {
            const h = (H * b.tokens) / max;
            const ph = (H * b.picked) / max;
            return (
              <g key={b.n}>
                <rect className="all" x={i + 0.1} width={0.8} y={H - h} height={h} />
                {sel !== undefined && ph > 0 && <rect className="pick" x={i + 0.1} width={0.8} y={H - ph} height={ph} />}
              </g>
            );
          })}
        </svg>
        <div className="hits">
          {bars.map((b, i) => (
            <Press key={b.n} look="hit" tabIndex={-1} onClick={() => { open(i); }} data-tip={debug.tip_message({ pos: String(b.n), what: what(b.n), tokens: kTokens(b.tokens) })} data-testid={`comp.chart.msg.${String(b.n)}`} />
          ))}
        </div>
        {first !== undefined && (
          <Press
           
            look="peak"
            style={{ left: `${String((100 * (firstAt + 0.5)) / W)}%`, bottom: `${String((100 * first.picked) / max)}%` }}
            onClick={() => { onOpen(first.n); }}
            data-tip={label(first.n, first.picked)}
            data-testid="comp.chart.peak"
          >
            <span className="dot" />
            <span className={firstAt > W / 2 ? "lab left" : "lab"}>{label(first.n, first.picked)}</span>
          </Press>
        )}
      </div>
      {top.length > 1 && (
        <div className="lg-next">
          <span>{debug.series_next}</span>
          {top.slice(1).map((b) => (
            <Press key={b.n} look="nx" onClick={() => { onOpen(b.n); }} data-tip={label(b.n, b.picked)} data-testid={`comp.chart.next.${String(b.n)}`}>
              {label(b.n, b.picked)}
            </Press>
          ))}
        </div>
      )}
      <div className="lg-hint">{debug.hint_series}</div>
    </section>
  );
}
