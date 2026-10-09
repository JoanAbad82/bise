// A thread's rows: one entry, one send not confirmed yet. Owner: amb-win.
//
// Each row reads its own data with the store's per-key hooks (useEntry,
// usePending), so a new or replaced entry re-renders that row alone; the
// list above it only holds keys. Memo'd on their props (strings, numbers).
import { memo, useEffect, useState, type ReactNode } from 'react';
import { Answered, Button, Chip, Fold, Marker, Msg, Opts, Pearl, Tool } from '@/ds';
import type { Entry } from '@/proto';
import { useAgents, useCoreState, useEntry, useHubRefused, usePending, useProjects, useStore, useThreadOrder } from '@/store';
import { refusedLead } from '@/app/Refused';
import { useHoldOf, type Hold } from './routes';
import { useFold } from './folds';
import { Answer, Markdown } from './Markdown';
import { THOUGHT_MS, briefOf, chipOf, clock, dayLabel, groupHead, sameDay, dropAuthor, handoffOf, reportStatus, schedHead, stripContext, thoughtNothing, toolLines, whoOf, type ToolLine } from './entry';
import { useToday } from '@/app/clock';
import { useRouter } from '@/app/router';
import { useIsCurrent } from './findmark';
import { shownName } from '@/agents/model';

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

export const EntryRow = memo(function EntryRow({ ctx, pos, prev, live, still = false }: { ctx: RowCtx; pos: number; prev?: number | undefined; live?: Entry | undefined; still?: boolean }) {
  // the live row (live.ts) is this same row drawing the entry it becomes, so
  // the entry takes its place with nothing unmounted (text-appearing v2 (4))
  const stored = useEntry(ctx.tkey, pos);
  const e = live ?? stored;
  const before = useEntry(ctx.tkey, prev ?? -1);
  const hit = useIsCurrent(pos);
  const today = useToday();
  if (e === undefined) return null;
  const p = prev === undefined ? undefined : before;
  // one 'session restored' row, never the same notice stacked (the TUI's)
  if (e.kind === 'notice' && p?.kind === 'notice' && (p.notice?.text ?? p.text) === (e.notice?.text ?? e.text)) return null;
  // ambient m_11777: a day separator between days; a name line opens a group (a new author, 5
  // min of silence); the rows inside show their time on hover in its place
  const day = e.at_ms > 0 && (p === undefined || !sameDay(p.at_ms, e.at_ms)) ? dayLabel(e.at_ms, today) : null;
  const head = groupHead(p, e, ctx);
  return (
    <>
      {day !== null && (
        <div className="th-day" data-testid={`thread.day.${pos}`}>
          <span>{day}</span>
        </div>
      )}
      <div className={hit ? 'th-row th-hit' : 'th-row'} data-testid={live === undefined ? `thread.entry.${pos}` : 'thread.stream'} data-kind={e.kind} data-from={e.from ?? undefined} data-head={head}>
        {/* a turn that opens on its work (tools, a thinking) still shows who and when */}
        {head && (e.kind === 'tools' || (e.kind === 'thinking' && !thoughtNothing(e))) && <NameLine e={e} ctx={ctx} />}
        <EntryBody e={e} ctx={ctx} head={head} live={live !== undefined} still={still} />
      </div>
    </>
  );
});

/** The name line of a group that opens on its work: Msg's own line ('bise 09:46', the pearl at 14 px). */
function NameLine({ e, ctx }: { e: Entry; ctx: RowCtx }) {
  const who = whoOf(e, ctx);
  return (
    <div className="b-who" data-testid={`thread.who.${String(e.pos)}`}>
      {who.from === 'bise' && <Pearl size={14} />}
      <b>{who.name}</b>
      {e.at_ms > 0 && <span className="b-time">{clock(e.at_ms)}</span>}
    </div>
  );
}

function EntryBody({ e, ctx, head, live, still }: { e: Entry; ctx: RowCtx; head: boolean; live: boolean; still: boolean }) {
  // the hub's brief opens a task's thread: one quiet row, the brief folded under it (designer; the TUI's is_brief)
  const brief = e.kind === 'you' || e.kind === 'from_agent' || e.kind === 'agent' ? briefOf(e.text) : null;
  if (brief !== null) return <BriefRow pos={e.pos} name={brief.name} objective={brief.objective} body={brief.body} ctx={ctx} />;
  switch (e.kind) {
    case 'tools':
      return <ToolsRow e={e} ctx={ctx} />;
    case 'card':
      return <CardRow e={e} ctx={ctx} />;
    case 'page':
      return e.page ? (
        <ArtChip
          title={e.page.title}
          meta={[e.page.v == null ? '' : `v${String(e.page.v)}`, clock(e.at_ms)].filter(Boolean).join(' · ')}
          onOpen={() => {
            if (e.page) ctx.onLink(e.page.url);
          }}
          testId={`thread.page.${String(e.pos)}`}
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
      // a status line, never the '[report: …]' bracket form (designer D14)
    {
      const line = reportStatus(e.text, e.report?.kind) ?? e.text;
      // only what waits on him takes the accent: every done or failed line is dim (designer m_13926)
      return (
        <div className="th-report" data-waits={line.startsWith('blocked') || undefined} data-testid={`thread.report.${String(e.pos)}`}>
          <Marker>{line}</Marker>
        </div>
      );
    }
    case 'you':
      return <YouRow e={e} ctx={ctx} head={head} />;
    case 'to_agent':
      return <ToAgentRow e={e} ctx={ctx} />;
    // amb-feed's batch 2 (b8cb4b1e): the lines the hub's fold used to drop
    case 'thinking':
      // nothing thought under 1 s shows nothing (ambient m_11777, the TUI's)
      // (the hub's own head words 'thought for 0.0s' too)
      if (thoughtNothing(e)) return null;
      return <ThinkingLine pos={e.pos} head={e.text === '' ? thoughtFor(e.thinking?.ms ?? 0) : e.text} body={e.thinking?.text ?? ''} />;
    case 'compacting':
      return (
        <div className="th-compact" data-testid={`thread.compacting.${e.pos}`}>
          <Marker>compacting its context…</Marker>
        </div>
      );
    case 'compacted':
      return <CompactedRow e={e} />;
    // R12: a failed turn is its own row with why, in the TUI's words (proto words::turn_failed: '✗ turn
    // failed: provider 500', a missing key's line; a plan line, its own words, a ▲), never a silent stop
    case 'turn_failed': {
      const level = e.turn_failed != null && e.text === e.turn_failed.why ? 'warn' : 'err';
      return (
        <div className={`th-notice ${level}`} data-level={level} data-testid={`thread.failed.${String(e.pos)}`}>
          <span className="th-notice-mark" aria-label={level === 'err' ? 'error' : 'warning'}>
            {NOTICE_MARK[level]}
          </span>
          <span>{e.text}</span>
        </div>
      );
    }
    case 'notice':
      return <NoticeRow e={e} ctx={ctx} />;
    case 'not_delivered':
      return <NotDeliveredRow e={e} ctx={ctx} />;
    // amb-feed's batch 3a (5d4189cb): the hub's news lines, typed
    case 'landed':
      return <LandedRow e={e} ctx={ctx} />;
    case 'pr':
      return <PrRow e={e} ctx={ctx} />;
    case 'artifact':
      return <MadeRow e={e} ctx={ctx} />;
    case 'answered':
      return <AnsweredRow e={e} />;
    case 'approval':
      return <ApprovalRow e={e} />;
    // batch 3b (6e9d68f8): a scheduled task's ◷ line
    case 'scheduled':
      return <ScheduledRow e={e} />;
    case 'unknown':
      // a kind from a newer hub: its words, plain and dim
      return (
        <div className="th-unknown" data-testid={`thread.unknown.${e.pos}`}>
          {e.text}
        </div>
      );
    default: {
      const who = whoOf(e, ctx);
      // an agent's '[report: blocked] …' message: its status line (designer D14, the TUI's report_parts)
      const report = reportStatus(e.text);
      if (report !== null) {
        return (
          <div className="th-report" data-waits={report.startsWith('blocked') || undefined} data-testid={`thread.report.${String(e.pos)}`}>
            <Marker>{who.from === 'agent' && (e.from ?? ctx.agent) !== ctx.agent ? `${who.name}: ${report}` : report}</Marker>
          </div>
        );
      }
      return (
        <Msg from={who.from} name={who.name} indent={who.indent} time={clock(e.at_ms)} head={head}>
          {e.thinking != null && e.thinking.ms >= THOUGHT_MS && <ThinkingLine pos={e.pos} head={thoughtFor(e.thinking.ms)} body={e.thinking.text} />}
          <Answer text={dropAuthor(e.text, e.from ?? ctx.agent)} live={live} still={still} onLink={ctx.onLink} onPath={ctx.onPath} />
        </Msg>
      );
    }
  }
}

/** A news line's mark: what it means, never its color alone. */
function NewsLine({ mark, tone, testId, children }: { mark: string; tone: 'ok' | 'err' | 'plain' | 'dim'; testId: string; children: ReactNode }) {
  return (
    <div className={`th-news ${tone}`} data-testid={testId} data-tone={tone}>
      <span className="th-news-mark" aria-hidden="true">
        {mark}
      </span>
      <span className="th-news-text">{children}</span>
    </div>
  );
}

/** 'perf landed on main · a1b2c3d · 3 files +42 −18': the sha opens the commit. */
function LandedRow({ e, ctx }: { e: Entry; ctx: RowCtx }) {
  const router = useRouter();
  const l = e.landed;
  if (l == null) return <Marker>{e.text}</Marker>;
  return (
    <NewsLine mark="✓" tone="ok" testId={`thread.landed.${e.pos}`}>
      {l.agent} landed on {l.target} ·{' '}
      <button
        type="button"
        className="th-news-link"
        onClick={() => {
          router.go({ screen: 'commit', project: ctx.project, sha: l.sha });
        }}
        data-testid={`thread.landed.${e.pos}.sha`}
      >
        {l.sha.slice(0, 7)}
      </button>
      {e.text !== '' ? ` · ${e.text}` : ''}
    </NewsLine>
  );
}

/** A PR's news: its number opens it; failing / done / news said by its mark and words. */
function PrRow({ e, ctx }: { e: Entry; ctx: RowCtx }) {
  const p = e.pr;
  if (p == null) return <Marker>{e.text}</Marker>;
  const [mark, tone] = p.state === 'failing' ? (['▲', 'err'] as const) : p.state === 'done' ? (['✓', 'dim'] as const) : (['•', 'plain'] as const);
  return (
    <NewsLine mark={mark} tone={tone} testId={`thread.pr.${e.pos}`}>
      <button
        type="button"
        className="th-news-link"
        onClick={() => {
          ctx.onLink(p.url);
        }}
        data-testid={`thread.pr.${e.pos}.link`}
      >
        PR #{p.number}
      </button>{' '}
      · {p.text}
    </NewsLine>
  );
}

/** What an agent made: a card that opens it (its page, else the project's artifacts). */
function MadeRow({ e, ctx }: { e: Entry; ctx: RowCtx }) {
  const router = useRouter();
  const m = e.made;
  if (m == null) return <Marker>{e.text}</Marker>;
  return (
    <ArtChip
      title={m.title}
      meta={[m.kind_word, m.v > 1 ? `v${String(m.v)}` : ''].filter(Boolean).join(' · ')}
      onOpen={() => {
        // designer's v6 (2): an artifact opens in the window, its own screen
        router.go({ screen: 'artifacts', project: ctx.project, id: m.id });
      }}
      testId={`thread.artifact.${String(e.pos)}`}
    />
  );
}

/** An artifact or a page as one line (designer m_12065 (2)): '↗ product page, before / after   page · v2', 1 px line, r 9, fit-content, no thumbnail box. */
function ArtChip({ title, meta, onOpen, testId }: { title: string; meta: string; onOpen: () => void; testId: string }) {
  return (
    <button type="button" className="th-art" onClick={onOpen} data-testid={testId}>
      <span className="th-art-title">↗ {title}</span>
      {meta !== '' && <span className="th-art-meta">{meta}</span>}
    </button>
  );
}

/** Main answered an agent's question for him: the question, the answer, and why, dim. */
function AnsweredRow({ e }: { e: Entry }) {
  const a = e.answered;
  if (a == null) return <Marker>{e.text}</Marker>;
  return (
    <div className="th-answered" data-testid={`thread.answered.${e.pos}`}>
      <NewsLine mark="↳" tone="plain" testId={`thread.answered.${e.pos}.head`}>
        answered {a.agent} for you: {a.question} → <b>{a.answer}</b>
      </NewsLine>
      {a.why !== '' && <div className="th-news-note">{a.why}</div>}
    </div>
  );
}

/** His answer to an approval, folded: allowed or said no, and his words under it. */
function ApprovalRow({ e }: { e: Entry }) {
  const a = e.approval;
  if (a == null) return <Marker>{e.text}</Marker>;
  return (
    <div className="th-approval" data-testid={`thread.approval.${e.pos}`} data-ok={a.ok}>
      <NewsLine mark={a.ok ? '✓' : '✕'} tone={a.ok ? 'ok' : 'dim'} testId={`thread.approval.${e.pos}.head`}>
        {a.text}
      </NewsLine>
      {a.note != null && a.note !== '' && <div className="th-news-note">{a.note}</div>}
    </div>
  );
}

/** Thinking under this long shows no row: entry.ts owns it (ambient m_11777). */
export { THOUGHT_MS };

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

/** The summary its context was compacted to: one folded line. */
/**
 * A scheduled task (sb every) set, run or ended, as the TUI's faint '◷ head ▸' row (wire.rs
 * Scheduled): the head is the hub's words as sent; the words it sends open under it (none: no ▸).
 */
function ScheduledRow({ e }: { e: Entry }) {
  const [open, setOpen] = useFold(false, e.pos);
  const s = e.scheduled;
  const head = s?.head ?? e.text;
  const words = s?.words ?? '';
  return (
    <div className="th-sched" data-testid={`thread.scheduled.${e.pos}`} data-id={s?.id}>
      <span className="th-news-mark" aria-hidden="true">
        ◷
      </span>
      {words === '' ? (
        <span className="th-sched-head">{schedHead(head)}</span>
      ) : (
        // its words open on a click, with no chevron (designer N2: '◷ main scheduled dashboards · every 30m · next 16:56')
        <button
          type="button"
          className="th-sched-head"
          aria-expanded={open}
          onClick={() => {
            setOpen((o) => !o);
          }}
          data-testid={`thread.scheduled.${e.pos}.head`}
        >
          {schedHead(head)}
        </button>
      )}
      {open && words !== '' && (
        <div className="th-sched-words" data-testid={`thread.scheduled.${e.pos}.words`}>
          {words}
        </div>
      )}
    </div>
  );
}

function CompactedRow({ e }: { e: Entry }) {
  const [open, setOpen] = useFold(false, e.pos);
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

function NoticeRow({ e, ctx }: { e: Entry; ctx: RowCtx }) {
  const level = e.notice?.level ?? 'info';
  const text = e.notice?.text ?? e.text;
  // a main's handoff (designer's v6 (3)): '→ perf · product page speed', opens its thread
  const handoff = level === 'info' ? handoffOf(text) : null;
  if (handoff !== null) return <HandoffRow pos={e.pos} to={handoff.agent} brief={handoff.brief} ctx={ctx} />;
  // 'session restored · 14:02', one row centred like a day separator (ambient m_11777)
  if (level === 'info' && text.startsWith('session restored')) {
    return (
      <div className="th-day th-restored" data-testid={`thread.notice.${e.pos}`}>
        <span>{e.at_ms > 0 ? `session restored · ${clock(e.at_ms)}` : 'session restored'}</span>
      </div>
    );
  }
  return (
    <div className={`th-notice ${level}`} data-level={level} data-testid={`thread.notice.${e.pos}`}>
      <span className="th-notice-mark" aria-label={level === 'err' ? 'error' : level === 'warn' ? 'warning' : 'note'}>
        {NOTICE_MARK[level]}
      </span>
      <span>{text}</span>
    </div>
  );
}

/** 'bise started gift-ui · <objective>': the task's brief as one dim row; a click unfolds the whole brief under a rail. */
function BriefRow({ pos, name, objective, body, ctx }: { pos: number; name: string; objective: string; body: string; ctx: RowCtx }) {
  const [open, setOpen] = useFold(false, pos);
  return (
    <div className="th-brief" data-open={open || undefined} data-testid={`thread.brief.${String(pos)}`}>
      <button
        type="button"
        className="th-brief-line"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
        }}
      >
        <span className="th-brief-chev" aria-hidden="true">
          ▸
        </span>
        <span className="th-brief-words">
          bise started {name}
          {objective !== '' && ` · ${objective}`}
        </span>
      </button>
      {open && (
        <div className="th-brief-body" data-testid={`thread.brief.${String(pos)}.body`}>
          <Markdown text={body} onLink={ctx.onLink} onPath={ctx.onPath} />
        </div>
      )}
    </div>
  );
}

/** '→ perf · product page speed': who a main handed a job to, its role (else the brief); a click opens its thread. */
function HandoffRow({ pos, to, brief, ctx }: { pos: number; to: string; brief: string; ctx: RowCtx }) {
  const router = useRouter();
  const a = useAgents(ctx.project).find((x) => x.name === to);
  const role = a !== undefined && a.purpose !== '' ? a.purpose : brief;
  return (
    <button
      type="button"
      className="th-handoff"
      onClick={() => {
        router.go({ screen: 'thread', project: ctx.project, agent: to });
      }}
      data-testid={`thread.handoff.${String(pos)}`}
    >
      → {to}
      {role !== '' && <span className="th-handoff-role"> · {role}</span>}
    </button>
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

function YouRow({ e, ctx, head }: { e: Entry; ctx: RowCtx; head: boolean }) {
  const [open, setOpen] = useFold(false, e.pos);
  // the fn context block the hub appended never shows: a chip from the typed context instead
  const text = stripContext(e.text);
  const fold = foldOf(text);
  const toggle = () => {
    setOpen((o) => !o);
  };
  const chip = e.context != null ? chipOf(e.context) : null;
  return (
    <Msg
      from="you"
      name="you"
      time={clock(e.at_ms)}
      head={head}
      context={chip === null ? undefined : <ContextChip chip={chip} ctx={ctx} pos={e.pos} />}
    >
      <Markdown text={fold === undefined || open ? text : fold.head} onLink={ctx.onLink} onPath={ctx.onPath} breaks />
      {fold !== undefined && (
        <Fold open={open} onToggle={toggle} testId={`thread.fold.${e.pos}`}>
          {open ? 'fold it' : `show all · ${String(fold.lines)} lines`}
        </Fold>
      )}
    </Msg>
  );
}

/** '◫ with Chrome · localhost:4801/sett…': a url opens in his browser, a file in his editor; a shot alone isn't kept. */
function ContextChip({ chip, ctx, pos }: { chip: NonNullable<ReturnType<typeof chipOf>>; ctx: RowCtx; pos: number }) {
  const open = chip.open;
  const run =
    open === null
      ? undefined
      : 'url' in open
        ? () => {
            ctx.onLink(open.url);
          }
        : () => {
            void (window as Partial<Window>).bise?.openPath(open.file, {});
          };
  return (
    <button type="button" className="th-ctx" disabled={run === undefined} title={chip.tip} onClick={run} data-testid={`thread.context.${String(pos)}`}>
      {chip.label}
    </button>
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
function ToolsRow({ e, ctx }: { e: Entry; ctx: RowCtx }) {
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
        <ToolLineRow key={l.pos} l={l} live={live?.pos === l.pos} runFor={runFor} />
      ))}
      {(t.rest.length > 0 || items.length === 0) && (
        <Tool
          state={open ? 'open' : undefined}
          onToggle={() => {
            setOpen((o) => !o);
          }}
          out={
            <ul className="th-steps">
              {t.rest.map((r) => (
                <li key={r.pos}>{r.text}</li>
              ))}
            </ul>
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
function ToolLineRow({ l, live, runFor }: { l: ToolLine; live: boolean; runFor: number }) {
  const [open, setOpen] = useFold(false);
  const opens = l.code !== '' || l.out !== '';
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
        <span className="th-tool-mark">{live ? '∿' : l.mark}</span> <span className="th-tool-text">{l.text}</span>
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
          {l.out !== '' && <pre className="th-tool-out">{l.out}</pre>}
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
  // its report to bise ('[report: blocked] …'): a status line, never the tag (designer D14 in agent
  // threads, cb1f2b44); a blocked one the question card right under it already says: nothing
  const report = reportStatus(e.text);
  if (report !== null) {
    if (carded) return null;
    return (
      <div className="th-report" data-waits={report.startsWith('blocked') || undefined} data-testid={`thread.report.${String(e.pos)}`}>
        <Marker>{report}</Marker>
      </div>
    );
  }
  return (
    <Msg
      from="agent"
      name={toAgentName(shownName(ctx.agent), shownName(to), e.asks === true)}
      indent
      time={clock(e.at_ms)}
      testId={`thread.to.${String(e.pos)}`}
      after={
        e.asks === true && !carded ? (
          <span className="th-waits main" data-testid={`thread.asks.${String(e.pos)}`}>
            waits for {shownName(to)}
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
    <Msg from={ctx.bise && ctx.agent === 'main' ? 'bise' : 'agent'} name={shownName(ctx.agent)} time={clock(e.at_ms)} testId={`thread.card.${String(c.id)}`}>
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
      <Msg from="you" name="you" time={time} state={failed ? 'error' : undefined}>
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
  // its hub refused this core: say so, never an endless 'connecting…' (lead m_11347; the
  // hub's words and the retry are on the line over the composer)
  const refused = useHubRefused(project) !== null;
  const name = row === undefined || row.home ? 'bise' : row.name;
  if (refused) return refusedLead(name);
  if (core === 'up' && agents.length > 0) return undefined;
  return `connecting to ${name}…`;
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
        → bise · {hold.name} · {left} s to change
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
