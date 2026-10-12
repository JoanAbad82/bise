// A thread's tool rows (each call's state, time, error line, code and output on
// open) and its thinking rows. Owner: amb-win. Split out of rows.tsx (pure move).
import { useEffect, useState } from 'react';
import { Fold, Tool } from '@/ds';
import type { Entry } from '@/proto';
import { useAgents, useStore, useThreadOrder, useToolOut } from '@/store';
import { useFold } from './folds';
import { toolLines, type ToolLine } from './entry';
import type { RowCtx } from './rows';
/**
 * The line under a cut output (designer m_15928): '… 4 KB of 18 KB shown' when the hub knows the
 * whole size (bytes, the cap's unit; shown = the out's UTF-8 bytes), else '… cut after 4 KB'. Pure.
 */
export function cutWords(out: string, total?: number): string {
  const kb = (b: number): string => `${String(Math.max(1, Math.round(b / 1024)))} KB`;
  if (total == null || total <= 0) return '… cut after 4 KB';
  return `… ${kb(new TextEncoder().encode(out).length)} of ${kb(total)} shown`;
}

/** A thinking row's head, as the TUI's words::thought_for: 'thought for 3.2s', 'thought' (time unknown). Pure. */
export function thoughtFor(ms: number): string {
  if (ms <= 0) return 'thought';
  const s = Math.floor(ms / 1000);
  if (ms < 10_000) return `thought for ${String(s)}.${String(Math.floor((ms % 1000) / 100))}s`;
  if (ms < 60_000) return `thought for ${String(s)}s`;
  return `thought for ${String(Math.floor(ms / 60_000))}m${String(Math.floor((ms % 60_000) / 1000))}s`;
}

/** What the model thought: one folded line, open to its words (⌘E opens them all). */
export function ThinkingLine({ pos, head, body }: { pos: number; head: string; body: string }) {
  const [open, setOpen] = useFold(false, pos);
  const toggle = () => {
    setOpen((o) => !o);
  };
  return (
    <div className="th-think" data-testid={`thread.think.${pos}`}>
      <Fold open={open} onToggle={body === '' ? undefined : toggle} testId={`thread.think.${pos}.head`}>
        {head}
      </Fold>
      {open && body !== '' && <div className="th-think-body">{body}</div>}
    </div>
  );
}

/**
 * The call at work now (bar S9): the last step of the thread's last tools row while its agent's
 * turn runs; none otherwise. Its pos and since when.
 */
function useLiveStep(ctx: RowCtx, e: Entry): { pos: number; at: number } | undefined {
  const { order } = useThreadOrder(ctx.tkey);
  const working = useAgents(ctx.project).some((a) => a.name === ctx.agent && a.status === 'working');
  const last = e.tools?.items.at(-1);
  if (!working || last === undefined || order.at(-1) !== e.pos) return undefined;
  return { pos: last.pos, at: last.at_ms };
}

/** Seconds since `at`, ticking once a second while shown (the live call's '∿ 12 s'). */
function useSecondsSince(at: number | undefined): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (at === undefined) return;
    const t = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      clearInterval(t);
    };
  }, [at]);
  return at === undefined ? 0 : Math.max(0, now - at);
}

/** Its tool calls in a row: one counted line, open to the steps. */
export function ToolsRow({ e, ctx }: { e: Entry; ctx: RowCtx }) {
  const [open, setOpen] = useFold(false, e.pos);
  const items = e.tools?.items ?? [];
  // the call at work: '∿' and its running time instead of its mark (S9); the hub doesn't send a
  // call's end, exit or error yet (asked of amb-feed), so the finished ones keep their marks
  const live = useLiveStep(ctx, e);
  const runFor = useSecondsSince(live?.at);
  // designer's desktop-screens v6 (2): its commands and edits as mono lines with their length
  // ('$ lighthouse --preset=mobile …  38 s', '± web/product/Hero.tsx'); the rest fold into
  // their counted words
  const t = toolLines(items);
  return (
    <div className="th-tools" data-testid={`thread.toolrow.${String(e.pos)}`}>
      {t.lines.map((l) => (
        <ToolLineRow key={l.pos} l={l} live={live?.pos === l.pos} runFor={runFor} project={ctx.project} agent={ctx.agent} />
      ))}
      {(t.rest.length > 0 || items.length === 0) && (
        <Tool
          state={open ? 'open' : undefined}
          onToggle={() => {
            setOpen((o) => !o);
          }}
          out={
            // the same rows as the lines above: no bullets, no fill (designer m_14269)
            <div className="th-steps">
              {t.rest.map((r) => (
                <ToolLineRow key={r.pos} l={r} live={false} runFor={0} project={ctx.project} agent={ctx.agent} />
              ))}
            </div>
          }
          testId={`thread.tools.${String(e.pos)}`}
        >
          {t.restWords !== '' ? t.restWords : (e.tools?.summary ?? e.text)}
        </Tool>
      )}
    </div>
  );
}

/**
 * One call's line (R11/S9, the TUI's tool row): its mark and words; on the right its state ('∿ 12 s'
 * while it runs, '✓ 0.3 s' dim, '✗ exit 1 · 2.1 s' in the error tone, never by color alone); a
 * failed call's first error line under it; a click (or ⌘E, the TUI's ctrl+o) opens its code and
 * output.
 */
function ToolLineRow({ l, live, runFor, project, agent }: { l: ToolLine; live: boolean; runFor: number; project: string; agent: string }) {
  const [open, setOpen] = useFold(false);
  const store = useStore();
  // the call's real output (amb-feed dece0fe9): asked once when it opens, its 200-char preview until then
  const full = useToolOut(project, agent, l.pos);
  const finished = !live && (l.state === 'ok' || l.state === 'err');
  const opens = l.code !== '' || l.out !== '' || finished;
  useEffect(() => {
    if (open && finished) store.askToolOut(project, agent, l.pos);
  }, [open, finished, store, project, agent, l.pos]);
  const out = full !== null && 'out' in full && full.out !== '' ? full.out : l.out;
  const id = `thread.tool.${String(l.pos)}`;
  const state = live ? 'run' : l.state;
  return (
    <div className="th-tool" data-state={state || undefined}>
      <div
        className={live ? 'th-tool-line live' : 'th-tool-line'}
        data-testid={id}
        data-live={live || undefined}
        role={opens ? 'button' : undefined}
        tabIndex={opens ? 0 : undefined}
        aria-expanded={opens ? open : undefined}
        onClick={
          opens
            ? () => {
                setOpen((o) => !o);
              }
            : undefined
        }
        onKeyDown={
          opens
            ? (e) => {
                if (e.key !== ' ' && e.key !== 'Enter') return;
                e.preventDefault();
                setOpen((o) => !o);
              }
            : undefined
        }
      >
        <span className="th-tool-mark">{live ? '∿' : l.mark}</span>{' '}
        <span className="th-tool-text">{l.text}</span>
        {l.counts !== '' && (
          <span className="th-tool-count" data-testid={`${id}.count`}>
            {l.counts}
          </span>
        )}
        {live ? (
          <span className="th-tool-time" data-testid={`${id}.time`}>
            {liveTime(runFor)}
          </span>
        ) : (
          l.end !== '' && (
            <span className={l.state === 'err' ? 'th-tool-time err' : 'th-tool-time'} data-testid={`${id}.end`}>
              {l.end}
            </span>
          )
        )}
      </div>
      {/* open, the box shows the error: the red line above it goes (designer m_14103) */}
      {l.err !== '' && !(open && opens) && (
        <div className="th-tool-err" data-testid={`${id}.err`}>
          {l.err}
        </div>
      )}
      {open && opens && (
        <div className="th-tool-open" data-testid={`${id}.open`}>
          {l.code !== '' && <pre className="th-tool-code">{l.code}</pre>}
          {out !== '' && (
            <pre className="th-tool-out" data-testid={`${id}.out`}>
              {out}
            </pre>
          )}
          {full !== null && 'cut' in full && full.cut && (
            <div className="th-tool-cut" data-testid={`${id}.cut`}>
              {cutWords(full.out, full.total)}
            </div>
          )}
          {full !== null && 'error' in full && out === '' && (
            <div className="th-tool-cut" data-testid={`${id}.none`}>
              {full.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** The live call's time: '0 s', '12 s', '1 m 4 s'. Pure. */
export function liveTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${String(s)} s`;
  return `${String(Math.floor(s / 60))} m ${String(s % 60)} s`;
}
