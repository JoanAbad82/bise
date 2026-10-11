// A thread's message rows: his bubbles (delivery marks, quotes, folds of a long
// message), his sends not confirmed yet, his queued messages, the route hold and
// the agent's typing line. Owner: amb-win. Split out of rows.tsx (pure move).
import { memo, useEffect, useState, type ReactNode } from 'react';
import { Button, Chip, Fold, Press } from '@/ds';
import type { Entry } from '@/proto';
import { useAgents, useCoreState, useHubRefused, usePending, useProjects, useStore, useQueuedTake } from '@/store';
import { refusedLead } from '@/app/Refused';
import { useHoldOf, type Hold } from './routes';
import { useFold } from './folds';
import { Markdown } from './Markdown';
import { chipOf, clock, deliveryMark, lastOfRun, stripContext } from './entry';
import { shownName } from '@/agents/model';
import { saidFor, useSaidMs } from '@/voicemode';
import type { RowCtx } from './rows';
import { Thumb } from './rows-cards';
import { youView, type YouView } from './parts';
import { lineCount, quoteAbout } from '@/composer/message';
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

/**
 * His words on the right in a soft bubble (designer's messages-right v1; the look lives in
 * thread.css '.th-you'): no 'you' line, the side says who spoke. A dim head over it only when it
 * says something ('to perf', '✓ you answered gift-ui'); inside, a quote, then his words, then what
 * rides with them; under it, its time (always under the last bubble of a run, on hover for the
 * others) or its state ('sending…', 'not sent…') in the time's place.
 */
export function YouBubble({
  head,
  children,
  under,
  timeAlways = true,
  state,
  testId,
}: {
  head?: ReactNode;
  children?: ReactNode;
  under?: ReactNode;
  /** false: the time shows on hover only (a bubble inside a run) */
  timeAlways?: boolean;
  state?: 'sending' | 'failed' | 'queued';
  testId?: string;
}) {
  return (
    <div className="th-you" data-state={state} data-testid={testId}>
      {head != null && head !== '' && (
        <div className="th-you-head" data-testid={testId === undefined ? undefined : `${testId}.head`}>
          {head}
        </div>
      )}
      {children != null && <div className="b-text th-bubble">{children}</div>}
      {under != null && under !== '' && (
        <div className={timeAlways ? 'th-you-under' : 'th-you-under th-hover'} data-testid={testId === undefined ? undefined : `${testId}.under`}>
          {under}
        </div>
      )}
    </div>
  );
}

export function YouRow({ e, ctx, next }: { e: Entry; ctx: RowCtx; next: Entry | undefined }) {
  const [open, setOpen] = useFold(false, e.pos);
  // the fn context block the hub appended never shows: a chip from the typed context instead;
  // the quotes he sent in front of his words show first in his bubble, with their rail and source
  // msg-parts: his message comes from its typed parts, never from Entry.text (the model's templated
  // text; the fold gives every 'you' entry its parts since msg-parts sha c). No parts (an older
  // hub): the text drawn plain, never parsed for tags (architect's delta review D1)
  const view = e.parts != null && e.parts.length > 0 ? youView(e.parts) : null;
  const quotes = view !== null ? view.quotes.map((q) => ({ source: q.from, text: q.text, about: q.file !== '' ? quoteAbout(q.from, q.text, q) : '' })) : [];
  const text = view !== null ? view.words : stripContext(e.text);
  const fold = foldOf(text);
  const toggle = () => {
    setOpen((o) => !o);
  };
  const chip = e.context != null ? chipOf(e.context) : null;
  // in bise's or a main's thread, a message that went to someone else says so; to the owner, nothing
  const to = e.to != null && e.to !== '' && e.to !== ctx.agent ? `to ${e.to}` : undefined;
  // a steer: the hub's receipt says where the agent read it (the list placed it there), with
  // 'steered · perf read it mid-turn' under it (amb-feed 9633cd2a; no more guessing from neighbors)
  const steered = e.steered_at != null;
  // his turn by voice (designer's voice-window page (1)): 'said · 0:06' under it, how long he talked
  const saidMs = useSaidMs(ctx.project, ctx.agent, text);
  // the delivery mark after the time or the 'said' line (designer's messages-right v3); a steered
  // one's 'steered · … read it mid-turn' line is its ✓✓, so it gets none
  const mark = steered ? null : deliveryMark(e.delivery, shownName(to !== undefined && e.to != null ? e.to : ctx.agent));
  const lead = steered ? `steered · ${shownName(ctx.agent)} read it mid-turn` : saidMs !== null ? saidFor(saidMs) : e.at_ms > 0 ? clock(e.at_ms) : undefined;
  const under =
    mark === null ? (
      lead
    ) : (
      <>
        {lead}
        {lead !== undefined && ' '}
        <span className="th-mark" data-tone={mark.tone} title={mark.tip} aria-label={mark.tip} data-testid={`thread.you.${String(e.pos)}.mark`}>
          {mark.glyph}
        </span>
      </>
    );
  return (
    <YouBubble head={to} under={under} timeAlways={steered || saidMs !== null || lastOfRun(e, next)} testId={`thread.you.${String(e.pos)}`}>
      {quotes.map((q, i) => (
        <blockquote key={i} className="th-you-quote" data-testid={`thread.you.${String(e.pos)}.quote.${String(i + 1)}`}>
          {q.source !== '' && <span className="th-you-quote-src">{q.about !== '' ? q.about : shownName(q.source)}</span>}
          <span className="th-you-quote-text">{q.text}</span>
        </blockquote>
      ))}
      {text !== '' && <Markdown text={fold === undefined || open ? text : fold.head} onLink={ctx.onLink} onPath={ctx.onPath} breaks />}
      {fold !== undefined && (
        <Fold open={open} onToggle={toggle} testId={`thread.fold.${e.pos}`}>
          {open ? 'fold it' : `show all · ${String(fold.lines)} lines`}
        </Fold>
      )}
      {view !== null && <PartChips view={view} ctx={ctx} pos={e.pos} />}
      {chip !== null && (
        <div className="b-ctx">
          <ContextChip chip={chip} ctx={ctx} pos={e.pos} />
        </div>
      )}
    </YouBubble>
  );
}

/**
 * What rides with his words when his message came as parts (msg-parts): one row of chips, wrapping
 * only when the bubble is full (designer m_17969): his long pastes ('▤ 1 · 240 lines', a click shows
 * the paste), his other files (open in his editor), his images (the thumbnail, else the no-file
 * glyph slot, and 'image 1' or its file name in ink). The artifact chip's look: 1 px line, r 9,
 * 6 px apart; never the accent (pink is for what waits on him). Never a tag.
 */
function PartChips({ view, ctx, pos }: { view: YouView; ctx: RowCtx; pos: number }) {
  const [shown, setShown] = useState<number | null>(null);
  const paste = view.pastes.find((p) => p.n === shown);
  if (view.pastes.length === 0 && view.images.length === 0 && view.files.length === 0) return null;
  const id = `thread.you.${String(pos)}`;
  return (
    <>
      <div className="th-parts" data-testid={`${id}.parts`}>
        {view.pastes.map((p) => (
          <Press
            key={`p${String(p.n)}`}
            look="th-part"
            data-kind="paste"
            aria-expanded={shown === p.n}
            onClick={() => {
              setShown((s) => (s === p.n ? null : p.n));
            }}
            data-testid={`${id}.paste.${String(p.n)}`}
          >
            ▤ {p.n} · {lineCount(p.text)} lines
          </Press>
        ))}
        {view.files.map((f) => (
          <Press
            key={f}
            look="th-part"
            data-kind="file"
            title={f}
            onClick={() => {
              if (ctx.onPath !== undefined) ctx.onPath(f);
              else void (window as Partial<Window>).bise?.openPath(f, {});
            }}
            data-testid={`${id}.file`}
          >
            {f.split('/').at(-1) ?? f}
          </Press>
        ))}
        {view.images.map((img, i) => (
          <span key={`${img.path}#${String(i)}`} className="th-part" data-kind="image" title={img.path} data-testid={`${id}.image.${String(i + 1)}`}>
            <Thumb path={img.path} />
            <span className="th-part-img">{partImageWords(img.name, i)}</span>
          </span>
        ))}
      </div>
      {paste !== undefined && (
        <pre className="th-part-paste" data-testid={`${id}.paste.${String(paste.n)}.text`}>
          {paste.text}
        </pre>
      )}
    </>
  );
}

/** An image part's chip words: its file name when it has one, else 'image 1' (its order here), never the '[Image #n]' tag (designer m_17969). Pure. */
export function partImageWords(name: string, i: number): string {
  return name !== '' && !name.startsWith('[') ? name : `image ${String(i + 1)}`;
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
    <Press look="th-ctx" disabled={run === undefined} title={chip.tip} onClick={run} data-testid={`thread.context.${String(pos)}`}>
      {chip.label}
    </Press>
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
  // under his bubble, in its time's place (messages-right v1): 'sending…' until it lands, the
  // reason it wasn't sent in --c-err with 'try again' (his words stay in the bubble), where it went
  const queued = p.mode === 'queued' && !failed && hold === undefined;
  const why = p.why !== undefined && p.why !== 'not sent' ? `: ${p.why}` : '';
  const under =
    hold?.state === 'held' ? undefined : hold?.state === 'sent' ? `sent to ${hold.name}` : failed ? (
      <span className="th-you-fail">
        <span className="th-you-err">{`▲ not sent${why}`}</span>
        <Press
          look="th-you-act"
          onClick={() => {
            store.retry(ctx.tkey, cid);
          }}
          data-testid={`thread.retry.${cid}`}
        >
          try again
        </Press>
        <Press
          look="th-you-act"
          onClick={() => {
            store.dismiss(ctx.tkey, cid);
          }}
          data-testid={`thread.dismiss.${cid}`}
        >
          drop
        </Press>
      </span>
    ) : queued ? (
      `queued · sends when ${ctx.agent}'s turn ends`
    ) : (
      (connecting ?? 'sending…')
    );
  return (
    <div className={failed ? 'th-row th-pending th-failed' : hold?.state === 'sent' ? 'th-row th-routed' : 'th-row th-pending'} data-testid={`thread.pending.${cid}`} data-state={state} data-side="you">
      <YouBubble under={under} state={failed ? 'failed' : queued ? 'queued' : 'sending'}>
        <Markdown text={p.text} onLink={ctx.onLink} breaks />
      </YouBubble>
      {hold?.state === 'held' && <HoldLine hold={hold} />}
    </div>
  );
});

/**
 * One of his messages the hub holds until the agent's turn ends (rows::Agent.queued, draft;
 * messages-right v1): a dashed bubble, dim words, 'queued · sends when perf's turn ends'. When it
 * goes, the hub drops it from the list and it lands as his normal bubble. No edit / drop yet: no
 * command takes a queued message back (asked of amb-feed).
 */
/**
 * His message the hub holds until the agent's turn ends (designer's messages-right, amb-feed
 * 34c35175): a dashed bubble, 'queued · sends when perf's turn ends', then 'edit · drop'. Both take
 * it back (queued_take); edit puts its words back in the composer for him to resend, drop lets it
 * go. The row itself leaves when the agents event no longer lists it (nothing drawn before); a
 * refusal (already delivered, no longer waiting) shows the hub's words under it.
 */
export const QueuedRow = memo(function QueuedRow({ ctx, q }: { ctx: RowCtx; q: { id: number; text: string } }) {
  const who = shownName(ctx.agent);
  const store = useStore();
  const taken = useQueuedTake(ctx.project, ctx.agent, q.id);
  const [asked, setAsked] = useState<'edit' | 'drop' | null>(null);
  const [given, setGiven] = useState(false);
  // edit: his words go back in the composer once, when the hub gave them back
  if (asked === 'edit' && !given && taken !== null && 'text' in taken) {
    setGiven(true);
    ctx.onTakeBack?.(taken.text);
  }
  const take = (how: 'edit' | 'drop') => () => {
    setAsked(how);
    setGiven(false);
    store.queuedTake(ctx.project, ctx.agent, q.id);
  };
  const id = `thread.queued.${String(q.id)}`;
  const refused = asked !== null && taken !== null && 'error' in taken ? taken.error : null;
  return (
    <div className="th-row th-queued" data-side="you" data-testid={id}>
      <YouBubble
        under={
          <>
            <span>queued · sends when {who}'s turn ends</span>
            <span className="th-queued-acts">
              <Press look="th-queued-act" onClick={take('edit')} disabled={asked !== null && refused === null} data-testid={`${id}.edit`}>
                edit
              </Press>
              <span aria-hidden="true"> · </span>
              <Press look="th-queued-act" onClick={take('drop')} disabled={asked !== null && refused === null} data-testid={`${id}.drop`}>
                drop
              </Press>
            </span>
          </>
        }
        state="queued"
        testId={`${id}.bubble`}
      >
        <Markdown text={q.text} onLink={ctx.onLink} breaks />
      </YouBubble>
      {refused !== null && (
        <div className="th-queued-err" role="status" data-testid={`${id}.error`}>
          {refused}
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
