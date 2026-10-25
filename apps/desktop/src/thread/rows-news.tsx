// A thread's news rows: landed, PRs, artifacts, scheduled tasks, compaction,
// notices, a task's brief, a handoff, a message not delivered. Owner: amb-win.
// Split out of rows.tsx (pure move).
import { useOpenArtifact } from './openArtifact';
import { useState, type ReactNode } from 'react';
import { Act, ArtChip, BriefLine, Button, Fold, Marker, Press, SchedHead } from '@/ds';
import type { Entry } from '@/proto';
import { thread } from '@/proto/words.gen';
import { useAgents, useArtifacts, useStore } from '@/store';
import { leaves, LEAVES, useGoArtifact } from '@/artifacts/leave';
import { glyphOf } from '@/artifacts/model';
import { useFold } from './folds';
import { useFoldHint } from './foldHint';
import { Markdown } from './Markdown';
import { clock, handoffOf, repeatsReport, reportBody, schedHead } from './entry';
import { wakeLine, wakeTail } from './wake';
import { useRouter } from '@/app/router';
import type { RowCtx } from './rows';
import { retryOf, retryWords, typedRetry, type Retry } from './tiers';
/** A news line's mark: what it means, never its color alone. */
export function NewsLine({ mark, tone, testId, children }: { mark: string; tone: 'ok' | 'err' | 'plain' | 'dim'; testId: string; children: ReactNode }) {
  return (
    <div className={`th-news ${tone}`} data-testid={testId} data-tone={tone}>
      <span className="th-news-mark" aria-hidden="true">
        {mark}
      </span>
      <span className="th-news-text">{children}</span>
    </div>
  );
}

/** The machine's own bits of a line in mono (designer m_19832: a sha, a path, a number pair like '+12 −2'), the words sans. Pure. */
export function machineParts(text: string): { text: string; mono: boolean }[] {
  const out: { text: string; mono: boolean }[] = [];
  const re = /[+−-]\d+(?:\s+[+−-]\d+)*/gu;
  let at = 0;
  for (const m of text.matchAll(re)) {
    const i = m.index;
    if (i > at) out.push({ text: text.slice(at, i), mono: false });
    out.push({ text: m[0], mono: true });
    at = i + m[0].length;
  }
  if (at < text.length) out.push({ text: text.slice(at), mono: false });
  return out;
}

/** Words with their machine bits in mono. */
function Machine({ text }: { text: string }) {
  return (
    <>
      {machineParts(text).map((p, i) =>
        p.mono ? (
          <span key={i} className="th-mono">
            {p.text}
          </span>
        ) : (
          p.text
        ),
      )}
    </>
  );
}

/** '✓ perf landed on main · a1b2c3d · 3 files +42 −18', quiet as a wake (H5): the sha opens the commit. */
export function LandedRow({ e, ctx }: { e: Entry; ctx: RowCtx }) {
  const router = useRouter();
  const l = e.landed;
  if (l == null) return <Marker>{e.text}</Marker>;
  return (
    <NewsLine mark="✓" tone="plain" testId={`thread.landed.${e.pos}`}>
      {l.agent} landed on {l.target} ·{' '}
      <Act
        kind="ref"
        onClick={() => {
          router.go({ screen: 'commit', project: ctx.project, sha: l.sha });
        }}
        testId={`thread.landed.${e.pos}.sha`}
      >
        <span className="th-mono">{l.sha.slice(0, 7)}</span>
      </Act>
      {e.text !== '' && (
        <>
          {' · '}
          <Machine text={e.text} />
        </>
      )}
    </NewsLine>
  );
}

/** A PR's news: its number opens it; failing / done / news said by its mark and words. */
export function PrRow({ e, ctx }: { e: Entry; ctx: RowCtx }) {
  const p = e.pr;
  if (p == null) return <Marker>{e.text}</Marker>;
  // the TUI's PR mark (theme::G_PR '↑', render.rs pr_lines), toned by its state: failing in the
  // error tone, done dim (designer m_19784 (3)); the words after it say the checks, never color alone
  const tone = p.state === 'failing' ? 'err' : p.state === 'done' ? 'dim' : 'plain';
  const mark = '↑';
  return (
    <NewsLine mark={mark} tone={tone} testId={`thread.pr.${e.pos}`}>
      <Act
        kind="ref"
        onClick={() => {
          ctx.onLink(p.url);
        }}
        testId={`thread.pr.${e.pos}.link`}
      >
        PR #{p.number}
      </Act>{' '}
      · {p.text}
    </NewsLine>
  );
}

/** What an agent made: a card that opens it (its page, else the project's artifacts). */
export function MadeRow({ e, ctx }: { e: Entry; ctx: RowCtx }) {
  const artifacts = useArtifacts(ctx.project);
  const goArtifact = useGoArtifact();
  const openId = useOpenArtifact();
  const m = e.made;
  if (m == null) return <Marker>{e.text}</Marker>;
  // a browser-only one (a PR, a link): '↗' in place of its kind and version (designer m_21714)
  const out = leaves(artifacts.find((x) => x.id === m.id) ?? m);
  return (
    <ArtChip
      open={openId === m.id}
      glyph={glyphOf(m.kind)}
      title={m.title}
      meta={out ? LEAVES : [m.kind_word, m.v > 1 ? `v${String(m.v)}` : ''].filter(Boolean).join(' · ')}
      onClick={() => {
        // designer's v6 (2): an artifact opens in the window, its own screen; a browser-only one his browser
        goArtifact(ctx.project, m.id, m);
      }}
      testId={`thread.artifact.${String(e.pos)}`}
    />
  );
}

/**
 * A scheduled task (sb every) set, run or ended, as the TUI's faint '◷ head ▸' row (wire.rs
 * Scheduled): the head is the hub's words as sent; the words it sends open under it (none: no ▸).
 */
export function ScheduledRow({ e, ctx }: { e: Entry; ctx: RowCtx }) {
  const [open, setOpen] = useFold(false, e.pos);
  const s = e.scheduled;
  const head = s?.head ?? e.text;
  const words = s?.words ?? '';
  // one line (H3, designer m_19832): '◷ bise scheduled the p99 check · every 30 min · next 20:11 ▸',
  // cut with …; '▸' only when it has words to open
  return (
    <div className="th-sched" data-testid={`thread.scheduled.${e.pos}`} data-id={s?.id}>
      <div className="th-sched-line">
        <span className="th-news-mark" aria-hidden="true">
          ◷
        </span>
        {words === '' ? (
          <SchedHead>{schedHead(head, ctx.agent === 'main' ? null : ctx.agent)}</SchedHead>
        ) : (
          <SchedHead
            open={open}
            onClick={() => {
              setOpen((o) => !o);
            }}
            testId={`thread.scheduled.${e.pos}.head`}
          >
            {schedHead(head, ctx.agent === 'main' ? null : ctx.agent)}
            <span className="th-sched-chev" aria-hidden="true">
              {open ? ' ▾' : ' ▸'}
            </span>
          </SchedHead>
        )}
      </div>
      {open && words !== '' && (
        <div className="th-sched-words" data-testid={`thread.scheduled.${e.pos}.words`}>
          {words}
        </div>
      )}
    </div>
  );
}

/**
 * The summary its context was compacted to: one folded line; a click or ⌃O opens the whole summary
 * as markdown (the hub sends it whole; an older transcript's 40-char preview shows as it came).
 */
export function CompactedRow({ e, ctx }: { e: Entry; ctx: RowCtx }) {
  const [open, setOpen] = useFold(false, e.pos);
  const hint = useFoldHint();
  const toggle = () => {
    setOpen((o) => !o);
  };
  return (
    <div className="th-compact" data-testid={`thread.compacted.${e.pos}`}>
      <Fold open={open} onToggle={e.text === '' ? undefined : toggle} hint={e.text === '' ? undefined : hint} testId={`thread.compacted.${e.pos}.head`}>
        {thread.compacted}
      </Fold>
      {open && e.text !== '' && (
        <div className="th-compact-body" data-testid={`thread.compacted.${e.pos}.body`}>
          <Markdown text={e.text} onLink={ctx.onLink} onArtifact={ctx.onArtifact} onPath={ctx.onPath} />
        </div>
      )}
    </div>
  );
}

/**
 * event-wake (designer's page): a watch's end, the hub's own line ('· cargo test ended · rc 101 ·
 * after 3m10s'), dim, only a non-zero rc in the error tone; '–' when he stopped waiting; its last
 * output lines folded ('▸ its last 3 lines', ⌘E / a click opens them, mono).
 */
export function WakeRow({ e, ctx }: { e: Entry; ctx: RowCtx }) {
  const [open, setOpen] = useFold(false, e.pos);
  const hint = useFoldHint();
  const line = wakeLine(e);
  // another agent's wake, main's copy of it (amb-feed 11e5fbbc wake.agent): tier 4, dim, never red,
  // named for whom (designer m_19383: nothing addressed to another agent in ink)
  const other = e.wake?.agent != null && e.wake.agent !== '' && e.wake.agent !== ctx.agent ? e.wake.agent : null;
  const mark = line.mark;
  const parts = other === null ? line.parts : [{ text: thread.wake_of({ agent: other, head: line.parts[0]?.text ?? '' }), err: false }, ...line.parts.slice(1).map((p) => ({ ...p, err: false }))];
  const tail = e.wake?.tail ?? [];
  const words = wakeTail(tail.length);
  return (
    <div className="th-wake" data-for={other ?? undefined} data-testid={`thread.wake.${String(e.pos)}`}>
      <div className="th-wake-head">
        <span className="th-wake-mark" aria-hidden="true">
          {mark}
        </span>
        {parts.map((p, i) => (
          <span key={i} className={p.err ? 'th-wake-err' : undefined} data-err={p.err || undefined}>
            {/* a flex item drops its leading space: the one before '·' is kept unbreakable */}
            {i > 0 && '\u00a0· '}
            {p.text}
          </span>
        ))}
        {words !== null && (
          <Fold
            open={open}
            onToggle={() => {
              setOpen((o) => !o);
            }}
            hint={hint}
            testId={`thread.wake.${String(e.pos)}.fold`}
          >
            {words}
          </Fold>
        )}
      </div>
      {open && tail.length > 0 && <pre className="th-wake-out">{tail.join('\n')}</pre>}
    </div>
  );
}

/** A notice's mark by level (the TUI's: info dim, warn ▲, err ✗): the tone is said in a glyph and words, never by color alone. */
export const NOTICE_MARK = { info: '·', warn: '▲', err: '✗', unknown: '·' } as const;

export function NoticeRow({ e, ctx, retries }: { e: Entry; ctx: RowCtx; retries?: readonly string[] | undefined }) {
  const level = e.notice?.level ?? 'info';
  const text = e.notice?.text ?? e.text;
  // the hub's typed retry first (dd17152f), else its words (an older hub)
  const retry = e.notice?.retry != null ? typedRetry(e.notice.retry) : retryOf(text);
  if (retry !== null) return <RetryRow pos={e.pos} retry={retry} tries={retries ?? [text]} />;
  // a main's handoff (designer's v6 (3)): '→ perf · product page speed', opens its thread
  const handoff = level === 'info' ? handoffOf(text) : null;
  if (handoff !== null) return <HandoffRow pos={e.pos} to={handoff.agent} brief={handoff.brief} ctx={ctx} />;
  // 'session restored · 14:02', one row centred like a day separator (ambient m_11777)
  if (level === 'info' && text.startsWith(thread.restored)) {
    return (
      <div className="th-day th-restored" data-testid={`thread.notice.${e.pos}`}>
        <span>{e.at_ms > 0 ? thread.restored_at({ at: clock(e.at_ms) }) : thread.restored}</span>
      </div>
    );
  }
  // '▲ turn interrupted' / '▲ turn interrupted by main' (the catalog's words): the TUI draws it dim,
  // a stop he or main asked for, read under a cut reply as stopped, not as a failure
  const interrupted = level === 'warn' && (text === thread.turn_interrupted || text.startsWith(thread.turn_interrupted_by({ by: '' })));
  return (
    <div className={`th-notice ${level}${interrupted ? ' interrupted' : ''}`} data-level={level} data-testid={`thread.notice.${e.pos}`}>
      <span className="th-notice-mark" aria-label={level === 'err' ? 'error' : level === 'warn' ? 'warning' : 'note'}>
        {NOTICE_MARK[level]}
      </span>
      <span>{text}</span>
    </div>
  );
}

/** 'bise started gift-ui · <objective>': the task's brief as one dim row; a click unfolds the whole brief under a rail. */
export function BriefRow({ pos, name, objective, body, ctx }: { pos: number; name: string; objective: string; body: string; ctx: RowCtx }) {
  const [open, setOpen] = useFold(false, pos);
  return (
    <div className="th-brief" data-open={open || undefined} data-testid={`thread.brief.${String(pos)}`}>
      <BriefLine
        open={open}
        onClick={() => {
          setOpen((o) => !o);
        }}
      >
        bise started {name}
        {objective !== '' && ` · ${objective}`}
      </BriefLine>
      {open && (
        <div className="th-brief-body" data-testid={`thread.brief.${String(pos)}.body`}>
          <Markdown text={body} onLink={ctx.onLink} onArtifact={ctx.onArtifact} onPath={ctx.onPath} />
        </div>
      )}
    </div>
  );
}

/** '✚ new agent perf · product page speed' (H11, designer m_19832): a quiet row, its role (else the brief); its name opens its thread. */
function HandoffRow({ pos, to, brief, ctx }: { pos: number; to: string; brief: string; ctx: RowCtx }) {
  const router = useRouter();
  const a = useAgents(ctx.project).find((x) => x.name === to);
  const role = a !== undefined && a.purpose !== '' ? a.purpose : brief;
  return (
    <NewsLine mark="✚" tone="plain" testId={`thread.handoff.${String(pos)}`}>
      new agent{' '}
      <Act
        kind="ref"
        onClick={() => {
          router.go({ screen: 'thread', project: ctx.project, agent: to });
        }}
        testId={`thread.handoff.${String(pos)}.name`}
      >
        {to}
      </Act>
      {role !== '' && ` · ${role}`}
    </NewsLine>
  );
}

/** His message didn't reach the agent (BISE-86): send it again, or drop it from view. */
export function NotDeliveredRow({ e, ctx }: { e: Entry; ctx: RowCtx }) {
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
        <span aria-label="error">✗</span> {thread.not_delivered({ to })}
      </div>
      <div className="th-notdelivered-text">{text}</div>
      {gone === 'sent' ? (
        <div className="th-waits">{thread.sent_again}</div>
      ) : (
        <div className="th-notdelivered-acts">
          <Button kind="ghost" onClick={again} testId={`thread.notdelivered.${e.pos}.again`}>
            ⏎ {thread.send_again}
          </Button>
          <Button kind="ghost" onClick={drop} testId={`thread.notdelivered.${e.pos}.drop`}>
            esc {thread.drop}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * An agent's report (tui-parity H8, designer m_19832): one line, never two loud copies. When the
 * message under it says the same words, one quiet row '✓ report ▸' (the message stays the reply);
 * else its status line, cut with …, and '▸ report' when it has more to read. Either opens in place.
 */
export function ReportRow({ pos, line, text, next, ctx, waits }: { pos: number; line: string; text: string; next: Entry | undefined; ctx: RowCtx; waits: boolean }) {
  const [open, setOpen] = useFold(false, pos);
  const body = reportBody(text);
  const dup = next !== undefined && (next.kind === 'agent' || next.kind === 'from_agent' || next.kind === 'to_agent') && repeatsReport(body, next.text);
  const more = dup || body.includes('\n');
  const toggle = () => {
    setOpen((o) => !o);
  };
  const whole = open && body !== '' && (
    <div className="th-report-body" data-testid={`thread.report.${String(pos)}.body`}>
      <Markdown text={body} onLink={ctx.onLink} onArtifact={ctx.onArtifact} onPath={ctx.onPath} />
    </div>
  );
  if (dup) {
    // its words stay (designer, ambient-lead m_20040): '✓ <summary>… ▸ report', sans 13, text-2
    const mark = /^[✓✗] /u.exec(line)?.[0] ?? '· ';
    return (
      <div className="th-report" data-dup="true" data-testid={`thread.report.${String(pos)}`}>
        <Press look="th-report-fold" aria-expanded={open} onClick={toggle} data-testid={`thread.report.${String(pos)}.fold`}>
          <span className="th-news-mark" aria-hidden="true">
            {mark.trim()}
          </span>
          <span className="th-report-words">{body.split('\n')[0] ?? ''}</span>
          <span className="th-report-more">{open ? '▾ report' : '▸ report'}</span>
        </Press>
        {whole}
      </div>
    );
  }
  return (
    <div className="th-report" data-waits={waits || undefined} data-testid={`thread.report.${String(pos)}`}>
      <div className="th-report-line">
        <Marker>{line}</Marker>
        {more && (
          <Act onClick={toggle} testId={`thread.report.${String(pos)}.more`}>
            {open ? '▾ report' : '▸ report'}
          </Act>
        )}
      </div>
      {whole}
    </div>
  );
}

/**
 * A model call's retries as one row that updates in place (tui-parity H9, designer m_19832): '▲ model
 * call failed · retry 3 of 10 in 4 s ▸', the ▲ dim and the words text-2; in --c-err only when the last
 * try failed. Each try's full words open under its ▸.
 */
function RetryRow({ pos, retry, tries }: { pos: number; retry: Retry; tries: readonly string[] }) {
  const [open, setOpen] = useFold(false, pos);
  // red only once the last try failed; a run that went through dims (amb-feed: end 'recovered')
  const done = retry.end === 'recovered' || retry.end === 'unknown';
  const failed = !done && retry.next === undefined;
  return (
    <div className="th-retry" data-failed={failed || undefined} data-done={done || undefined} data-testid={`thread.notice.${String(pos)}`}>
      <Press
        look="th-retry-line"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
        }}
        data-testid={`thread.notice.${String(pos)}.retry`}
      >
        <span className="th-news-mark" aria-label={failed ? 'error' : 'warning'}>
          ▲
        </span>
        <span className="th-retry-words">{retryWords(retry)}</span>
        <span className="th-sched-chev" aria-hidden="true">
          {open ? ' ▾' : ' ▸'}
        </span>
      </Press>
      {open && (
        <ol className="th-retry-tries" data-testid={`thread.notice.${String(pos)}.tries`}>
          {tries.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
