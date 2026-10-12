// A thread's news rows: landed, PRs, artifacts, scheduled tasks, compaction,
// notices, a task's brief, a handoff, a message not delivered. Owner: amb-win.
// Split out of rows.tsx (pure move).
import { useState, type ReactNode } from 'react';
import { Act, BriefLine, Button, Fold, Marker, Press, SchedHead } from '@/ds';
import type { Entry } from '@/proto';
import { useAgents, useStore } from '@/store';
import { useFold } from './folds';
import { Markdown } from './Markdown';
import { clock, handoffOf, schedHead } from './entry';
import { wakeLine, wakeTail } from './wake';
import { useRouter } from '@/app/router';
import type { RowCtx } from './rows';
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
export function ArtChip({ title, meta, onOpen, testId }: { title: string; meta: string; onOpen: () => void; testId: string }) {
  return (
    <Press look="th-art" onClick={onOpen} data-testid={testId}>
      <span className="th-art-title">↗ {title}</span>
      {meta !== '' && <span className="th-art-meta">{meta}</span>}
    </Press>
  );
}

/** The summary its context was compacted to: one folded line. */
/**
 * A scheduled task (sb every) set, run or ended, as the TUI's faint '◷ head ▸' row (wire.rs
 * Scheduled): the head is the hub's words as sent; the words it sends open under it (none: no ▸).
 */
export function ScheduledRow({ e, ctx }: { e: Entry; ctx: RowCtx }) {
  const [open, setOpen] = useFold(false, e.pos);
  const s = e.scheduled;
  const head = s?.head ?? e.text;
  const words = s?.words ?? '';
  // one line (H3, designer m_19832): '◷ main scheduled the p99 check · every 30 min · next 20:11 ▸',
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

export function CompactedRow({ e }: { e: Entry }) {
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

/**
 * event-wake (designer's page): a watch's end, the hub's own line ('· cargo test ended · rc 101 ·
 * after 3m10s'), dim, only a non-zero rc in the error tone; '–' when he stopped waiting; its last
 * output lines folded ('▸ its last 3 lines', ⌘E / a click opens them, mono).
 */
export function WakeRow({ e }: { e: Entry }) {
  const [open, setOpen] = useFold(false, e.pos);
  const { mark, parts } = wakeLine(e);
  const tail = e.wake?.tail ?? [];
  const words = wakeTail(tail.length);
  return (
    <div className="th-wake" data-testid={`thread.wake.${String(e.pos)}`}>
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

export function NoticeRow({ e, ctx }: { e: Entry; ctx: RowCtx }) {
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
  // '▲ turn interrupted' / '▲ turn interrupted by main' (proto words.rs): the TUI draws it dim, a
  // stop he or main asked for, read under a cut reply as stopped, not as a failure
  const interrupted = level === 'warn' && (text === 'turn interrupted' || text.startsWith('turn interrupted by '));
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
          <Markdown text={body} onLink={ctx.onLink} onPath={ctx.onPath} />
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
