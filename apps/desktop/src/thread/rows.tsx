// A thread's rows: one entry, one send not confirmed yet. Owner: amb-win.
//
// Each row reads its own data with the store's per-key hooks (useEntry,
// usePending), so a new or replaced entry re-renders that row alone; the
// list above it only holds keys. Memo'd on their props (strings, numbers).
import { memo, useEffect, useState } from 'react';
import { Answered, Art, Button, Chip, Fold, Marker, Msg, Opts, Tool } from '@/ds';
import type { Entry } from '@/proto';
import { useAgents, useCoreState, useEntry, usePending, useProjects, useStore, useThreadOrder } from '@/store';
import { useHoldOf, type Hold } from './routes';
import { useFold } from './folds';
import { Markdown } from './Markdown';
import { clock, whoOf } from './entry';
import { useIsCurrent } from './findmark';

/** What a row needs of its thread. */
export interface RowCtx {
  readonly tkey: string;
  readonly project: string;
  readonly agent: string;
  /** bise's own main (the pearl, 'bise') */
  readonly bise: boolean;
  readonly onLink: (url: string) => void;
  /** a file path named in an answer, relative to the agent's folder (M4, B14) */
  readonly onPath?: (path: string, line?: number) => void;
}

export const EntryRow = memo(function EntryRow({ ctx, pos }: { ctx: RowCtx; pos: number }) {
  const e = useEntry(ctx.tkey, pos);
  const hit = useIsCurrent(pos);
  if (e === undefined) return null;
  return (
    <div className={hit ? 'th-row th-hit' : 'th-row'} data-testid={`thread.entry.${pos}`} data-kind={e.kind} data-from={e.from ?? undefined}>
      <EntryBody e={e} ctx={ctx} />
    </div>
  );
});

function EntryBody({ e, ctx }: { e: Entry; ctx: RowCtx }) {
  switch (e.kind) {
    case 'tools':
      return <ToolsRow e={e} />;
    case 'card':
      return <CardRow e={e} ctx={ctx} />;
    case 'page':
      return e.page ? (
        <Art
          title={`↗ ${e.page.title}`}
          meta={[e.page.v == null ? '' : `v${e.page.v}`, clock(e.at_ms)].filter(Boolean).join(' · ')}
          onClick={() => {
            if (e.page) ctx.onLink(e.page.url);
          }}
          testId={`thread.page.${e.pos}`}
        />
      ) : (
        <Marker>{e.text}</Marker>
      );
    case 'stopped':
      // ⛔6: the hub's typed fact of a stop (amb-core 515aa58d), at its pos
      return (
        <Marker>
          ■ {e.text === '' ? 'stopped' : e.text}
          {e.at_ms > 0 ? ` · ${clock(e.at_ms)}` : ''}
        </Marker>
      );
    case 'report':
      return <Marker>{e.report ? `${e.report.kind} · ${e.text}` : e.text}</Marker>;
    case 'you':
      return <YouRow e={e} ctx={ctx} />;
    case 'to_agent':
      return <ToAgentRow e={e} ctx={ctx} />;
    // amb-feed's batch 2 (b8cb4b1e): the lines the hub's fold used to drop
    case 'thinking':
      return <ThinkingLine pos={e.pos} head={e.text === '' ? thoughtFor(e.thinking?.ms ?? 0) : e.text} body={e.thinking?.text ?? ''} />;
    case 'compacting':
      return (
        <div className="th-compact" data-testid={`thread.compacting.${e.pos}`}>
          <Marker>compacting its context…</Marker>
        </div>
      );
    case 'compacted':
      return <CompactedRow e={e} />;
    case 'notice':
      return <NoticeRow e={e} />;
    case 'not_delivered':
      return <NotDeliveredRow e={e} ctx={ctx} />;
    case 'unknown':
      // a kind from a newer hub: its words, plain and dim
      return (
        <div className="th-unknown" data-testid={`thread.unknown.${e.pos}`}>
          {e.text}
        </div>
      );
    default: {
      const who = whoOf(e, ctx);
      return (
        <Msg from={who.from} name={who.name} indent={who.indent} time={clock(e.at_ms)} av={who.from === 'you' ? 'y' : undefined}>
          {e.thinking != null && <ThinkingLine pos={e.pos} head={thoughtFor(e.thinking.ms)} body={e.thinking.text} />}
          <Markdown text={e.text} onLink={ctx.onLink} onPath={ctx.onPath} />
        </Msg>
      );
    }
  }
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
function ThinkingLine({ pos, head, body }: { pos: number; head: string; body: string }) {
  const [open, setOpen] = useFold();
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

/** The summary its context was compacted to: one folded line. */
function CompactedRow({ e }: { e: Entry }) {
  const [open, setOpen] = useFold();
  const toggle = () => {
    setOpen((o) => !o);
  };
  return (
    <div className="th-compact" data-testid={`thread.compacted.${e.pos}`}>
      <Fold open={open} onToggle={e.text === '' ? undefined : toggle} testId={`thread.compacted.${e.pos}.head`}>
        context compacted
      </Fold>
      {open && e.text !== '' && <div className="th-think-body">{e.text}</div>}
    </div>
  );
}

/** A notice's mark by level (the TUI's: info dim, warn ▲, err ✗): the tone is said in a glyph and words, never by color alone. */
export const NOTICE_MARK = { info: '·', warn: '▲', err: '✗', unknown: '·' } as const;

function NoticeRow({ e }: { e: Entry }) {
  const level = e.notice?.level ?? 'info';
  const text = e.notice?.text ?? e.text;
  return (
    <div className={`th-notice ${level}`} data-level={level} data-testid={`thread.notice.${e.pos}`}>
      <span className="th-notice-mark" aria-label={level === 'err' ? 'error' : level === 'warn' ? 'warning' : 'note'}>
        {NOTICE_MARK[level]}
      </span>
      <span>{text}</span>
    </div>
  );
}

/** His message didn't reach the agent (BISE-86): send it again, or drop it from view. */
function NotDeliveredRow({ e, ctx }: { e: Entry; ctx: RowCtx }) {
  const store = useStore();
  const [gone, setGone] = useState<'sent' | 'dropped' | null>(null);
  const nd = e.not_delivered;
  const to = nd?.to ?? ctx.agent;
  const text = nd?.text ?? e.text;
  if (gone === 'dropped') return null;
  const again = () => {
    store.send({ project: ctx.project, agent: to, text, mode: 'now' });
    setGone('sent');
  };
  const drop = () => {
    setGone('dropped');
  };
  return (
    <div
      className="th-notdelivered"
      data-testid={`thread.notdelivered.${e.pos}`}
      tabIndex={-1}
      onKeyDown={(k) => {
        if (gone !== null) return;
        if (k.key === 'Enter') again();
        else if (k.key === 'Escape') drop();
        else return;
        k.preventDefault();
        k.stopPropagation();
      }}
    >
      <div className="th-notdelivered-head">
        <span aria-label="error">✗</span> not delivered to {to}
      </div>
      <div className="th-notdelivered-text">{text}</div>
      {gone === 'sent' ? (
        <div className="th-waits">sent again</div>
      ) : (
        <div className="th-notdelivered-acts">
          <Button kind="ghost" onClick={again} testId={`thread.notdelivered.${e.pos}.again`}>
            ⏎ send again
          </Button>
          <Button kind="ghost" onClick={drop} testId={`thread.notdelivered.${e.pos}.drop`}>
            esc drop
          </Button>
        </div>
      )}
    </div>
  );
}

/** A message of his longer than this folds to its first lines (tui-parity B11, the TUI's You(_, _, open)). */
export const LONG_LINES = 12;
export const LONG_CHARS = 1200;
const SHOWN_LINES = 6;

/** The folded words of a long message, or none when it shows whole. Pure. */
export function foldOf(text: string): { head: string; lines: number } | undefined {
  const lines = text.split('\n');
  if (lines.length <= LONG_LINES && text.length <= LONG_CHARS) return undefined;
  const head = lines.slice(0, SHOWN_LINES).join('\n');
  return { head: head.length > LONG_CHARS ? `${head.slice(0, LONG_CHARS)}…` : head, lines: lines.length };
}

function YouRow({ e, ctx }: { e: Entry; ctx: RowCtx }) {
  const [open, setOpen] = useFold();
  const fold = foldOf(e.text);
  const toggle = () => {
    setOpen((o) => !o);
  };
  return (
    <Msg from="you" name="you" av="y" time={clock(e.at_ms)}>
      <Markdown text={fold === undefined || open ? e.text : fold.head} onLink={ctx.onLink} onPath={ctx.onPath} />
      {fold !== undefined && (
        <Fold open={open} onToggle={toggle} testId={`thread.fold.${e.pos}`}>
          {open ? 'fold it' : `show all · ${String(fold.lines)} lines`}
        </Fold>
      )}
    </Msg>
  );
}

/** Its tool calls in a row: one counted line, open to the steps. */
function ToolsRow({ e }: { e: Entry }) {
  const [open, setOpen] = useFold();
  const items = e.tools?.items ?? [];
  return (
    <Tool
      state={open ? 'open' : undefined}
      onToggle={() => {
        setOpen((o) => !o);
      }}
      out={
        <ul className="th-steps">
          {items.map((t) => (
            <li key={t.pos}>{t.text}</li>
          ))}
        </ul>
      }
      testId={`thread.tools.${e.pos}`}
    >
      {e.tools?.summary ?? e.text}
    </Tool>
  );
}

/**
 * What this agent sent another (amb-feed eb752406, bar A.3): '→ main' and
 * its words, indented as an exchange; one that waits for the reply is its
 * question (the TUI's '✉ gift-ui → main'). When main opened a card for it,
 * that card follows with only its options and says it waits for him; with
 * no card, the question waits for main (ambient m_10689: one copy of it).
 */
function ToAgentRow({ e, ctx }: { e: Entry; ctx: RowCtx }) {
  const to = e.to ?? 'main';
  const next = useNeighbor(ctx.tkey, e.pos, 1);
  const carded = e.asks === true && next !== undefined && cardFollows(e, next);
  return (
    <Msg
      from="agent"
      name={toAgentName(ctx.agent, to, e.asks === true)}
      indent
      time={clock(e.at_ms)}
      testId={`thread.to.${String(e.pos)}`}
      after={
        e.asks === true && !carded ? (
          <span className="th-waits main" data-testid={`thread.asks.${String(e.pos)}`}>
            waits for {to}
          </span>
        ) : undefined
      }
    >
      <Markdown text={e.text} onLink={ctx.onLink} onPath={ctx.onPath} />
    </Msg>
  );
}

/** A card entry right after the ask it answers (same words): the ask carries the question. Pure. */
export function cardFollows(ask: Entry, card: Entry): boolean {
  return ask.kind === 'to_agent' && ask.asks === true && card.kind === 'card' && card.card != null && card.card.question.trim() === ask.text.trim();
}

/** '1 or 2', '1, 2 or 3': the digits that answer a card. Pure. */
export function digitsOf(ns: readonly number[]): string {
  const d = ns.map(String);
  return d.length <= 1 ? (d[0] ?? '') : `${d.slice(0, -1).join(', ')} or ${d.at(-1) ?? ''}`;
}

/** The entry before (-1) or after (+1) this one in the thread's order. */
function useNeighbor(tkey: string, pos: number, dir: -1 | 1): Entry | undefined {
  const { order } = useThreadOrder(tkey);
  const i = order.indexOf(pos);
  const at = i < 0 ? undefined : order[i + dir];
  return useEntry(tkey, at ?? -1);
}

/** A to_agent row's name: '✉ gift-ui → main' when it asks, else 'gift-ui → main'. Pure. */
export function toAgentName(from: string, to: string, asks: boolean): string {
  return `${asks ? '✉ ' : ''}${from} → ${to}`;
}

/**
 * A card it asked: open, its options answer it, tagged 'waits for you · 1
 * or 2'; answered, a line. Right after the ask it answers, the ask carries
 * the question and the card only its options (one copy of it).
 */
function CardRow({ e, ctx }: { e: Entry; ctx: RowCtx }) {
  const store = useStore();
  const prev = useNeighbor(ctx.tkey, e.pos, -1);
  const c = e.card;
  if (!c) return <Marker>{e.text}</Marker>;
  const follows = prev !== undefined && cardFollows(prev, e);
  if (c.answered) return <Answered testId={`thread.card.${String(c.id)}`}>{follows ? '✓ answered' : `✓ answered: ${c.question}`}</Answered>;
  const opts = (
    <>
      <Opts
        items={c.options.map((o) => ({ n: o.n, text: o.label }))}
        onPick={(n) => {
          store.answer(ctx.project, c.id, String(n));
        }}
        testId={`thread.card.${String(c.id)}.opt`}
      />
      <span className="th-waits you" data-testid={`thread.card.${String(c.id)}.waits`}>
        waits for you · {digitsOf(c.options.map((o) => o.n))}
      </span>
    </>
  );
  if (follows) {
    return (
      <div className="th-card-opts" data-testid={`thread.card.${String(c.id)}`}>
        {opts}
      </div>
    );
  }
  return (
    <Msg from={ctx.bise && ctx.agent === 'main' ? 'bise' : 'agent'} name={ctx.agent} time={clock(e.at_ms)} testId={`thread.card.${String(c.id)}`}>
      <Markdown text={c.question} onLink={ctx.onLink} />
      {opts}
    </Msg>
  );
}

/**
 * His send before its entry lands: shown at once (bar ⛔3), dimmed while
 * sending; failed, one line with retry and dismiss (never a send with no
 * trace). His words stay here and in the composer's history.
 */
export const PendingRow = memo(function PendingRow({ ctx, cid }: { ctx: RowCtx; cid: number }) {
  const store = useStore();
  const p = usePending(ctx.tkey).find((x) => x.cid === cid);
  const hold = useHoldOf(store, ctx.tkey, cid);
  const connecting = useConnecting(ctx.project);
  if (p === undefined) return null;
  // a routed send: its route's state is the row's (lead m_9854)
  const failed = p.state === 'failed' && hold?.state !== 'sent';
  const state = hold !== undefined && hold.state !== 'cancelled' ? hold.state : p.state;
  const time = hold?.state === 'held' ? undefined : hold?.state === 'sent' ? `sent to ${hold.name}` : failed ? `not sent${p.why !== undefined && p.why !== 'not sent' ? ` · ${p.why}` : ''}` : (connecting ?? 'sending…');
  return (
    <div className={failed ? 'th-row th-pending th-failed' : hold?.state === 'sent' ? 'th-row th-routed' : 'th-row th-pending'} data-testid={`thread.pending.${cid}`} data-state={state}>
      <Msg from="you" name="you" av="y" time={time} state={failed ? 'error' : undefined}>
        <Markdown text={p.text} onLink={ctx.onLink} />
      </Msg>
      {hold?.state === 'held' && <HoldLine hold={hold} />}
      {failed && (
        <div className="th-failed-acts">
          <Button
            kind="ghost"
            onClick={() => {
              store.retry(ctx.tkey, cid);
            }}
            testId={`thread.retry.${cid}`}
          >
            retry
          </Button>
          <Button
            kind="ghost"
            onClick={() => {
              store.dismiss(ctx.tkey, cid);
            }}
            testId={`thread.dismiss.${cid}`}
          >
            dismiss
          </Button>
        </div>
      )}
    </div>
  );
});

/**
 * The wait before a send can go, named (lead m_10108): while the core
 * starts or the project's hub hasn't said who it is yet (no agents from it:
 * its welcome comes first), 'connecting to bise…'; none once connected.
 */
function useConnecting(project: string): string | undefined {
  const core = useCoreState();
  const agents = useAgents(project);
  const row = useProjects().find((p) => p.project === project);
  if (core === 'up' && agents.length > 0) return undefined;
  return `connecting to ${row === undefined || row.home ? 'bise' : row.name}…`;
}

/** Seconds left to change a held route, ticking while it shows. */
function useLeft(until: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => {
      setNow(Date.now());
    }, 200);
    return () => {
      clearInterval(t);
    };
  }, []);
  return Math.max(0, Math.ceil((until - now) / 1000));
}

/**
 * 'to shop · 2 s to change': bise holds his words for a project's main.
 * Keep it with bise (a click here or esc: route_cancel) or pick another
 * project (route_correct); the hub ends it with route_done.
 */
function HoldLine({ hold }: { hold: Hold }) {
  const store = useStore();
  const left = useLeft(hold.until);
  const others = useProjects().filter((p) => !p.home && p.project !== hold.to);
  return (
    <div className="th-hold" data-testid="thread.route" role="status" title={hold.why}>
      <span className="th-hold-to">
        to {hold.name} · {left} s to change
      </span>
      <Button
        kind="ghost"
        onClick={() => {
          store.command({ cmd: 'route_cancel', project: hold.home, rid: hold.rid });
        }}
        testId="thread.route.keep"
      >
        keep it with bise (esc)
      </Button>
      {others.map((o) => (
        <Chip
          key={o.project}
          onClick={() => {
            store.command({ cmd: 'route_correct', project: hold.home, rid: hold.rid, to: o.project });
          }}
          testId={`thread.route.to.${o.project}`}
        >
          {o.name}
        </Chip>
      ))}
    </div>
  );
}

/** The line under the newest row while a turn runs: its current step. */
export function TypingLine({ text }: { text: string }) {
  if (text === '') return null;
  return (
    <div className="th-typing" data-testid="thread.typing" aria-live="polite">
      <Fold>{text}</Fold>
    </div>
  );
}
