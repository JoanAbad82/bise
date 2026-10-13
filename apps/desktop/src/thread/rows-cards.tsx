// A thread's card rows: cards and their answers, approvals, 'you answered' rows,
// image chips, and one agent's message to another. Owner: amb-win. Split out of
// rows.tsx (pure move).
import { useState, type ReactNode } from 'react';
import { useFold } from './folds';
import { Act, Answered, CardLine, Marker, Press } from '@/ds';
import { openInbox } from '@/inbox/Block';
import type { Entry } from '@/proto';
import { useEntry, useThreadOrder } from '@/store';
import { Markdown } from './Markdown';
import { clock, lastOfRun, reportStatus } from './entry';
import { shownName } from '@/agents/model';
import { YouBubble } from './rows-messages';
import { NewsLine, ReportRow } from './rows-news';
import type { RowCtx } from './rows';
import { youView } from './parts';
/** Main answered an agent's question for him: the question, the answer, and why, dim. */
export function AnsweredRow({ e }: { e: Entry }) {
  const a = e.answered;
  if (a == null) return <Marker>{e.text}</Marker>;
  return (
    <div className="th-answered" data-testid={`thread.answered.${e.pos}`}>
      <NewsLine mark="↳" tone="plain" testId={`thread.answered.${e.pos}.head`}>
        answered {a.agent} for you: {a.question} → <b>{a.answer}</b>
      </NewsLine>
      {a.why !== '' && <div className="th-news-note">{a.why}</div>}
      <ImageChips images={a.images ?? []} testId={`thread.answered.${e.pos}`} />
    </div>
  );
}

/**
 * R36: the images he pasted with an answer, each the one image chip of the window (the composer's,
 * the spotlight's, ⌘I's): its 16 px thumbnail read from his source path and its label ('[Image #1]');
 * never the hub's marker or a path in the words.
 */
export function ImageChips({ images, testId }: { images: readonly { name: string; path: string }[]; testId: string }) {
  if (images.length === 0) return null;
  return (
    <div className="th-images">
      {images.map((img, i) => (
        <span key={`${img.path}#${String(i)}`} className="b-chip image" data-kind="image" data-testid={`${testId}.image.${String(i + 1)}`}>
          <Thumb path={img.path} />
          {/* designer's R36 rule: always '[Image #n]' (its order in this message), never the
              store's file name (a sha .png on real data) */}
          <span className="lbl">{imageLabel(i)}</span>
        </span>
      ))}
    </div>
  );
}

/**
 * A chip's 16 px image slot: his file's thumbnail, or, when there's no file (an older hub's raw
 * line) or it's gone, the same slot with a faint image glyph, so every chip reads the same
 * (designer m_15943).
 */
export function Thumb({ path }: { path?: string }) {
  const [gone, setGone] = useState(false);
  if (path == null || path === '' || gone) {
    return (
      <span className="thumb none" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="16" height="16"><rect x="2.5" y="3.5" width="11" height="9" rx="1.5" fill="none" stroke="currentColor" /><circle cx="6" cy="6.5" r="1" fill="currentColor" /><path d="M3 11.5l3.5-3 2.5 2 2-1.5 2.5 2" fill="none" stroke="currentColor" /></svg>
      </span>
    );
  }
  return <img className="thumb" src={fileUrl(path)} alt="" onError={() => { setGone(true); }} />;
}

/** An answer's n-th image chip label: '[Image #n]', whatever the file is called. Pure. */
export function imageLabel(i: number): string {
  return `[Image #${String(i + 1)}]`;
}

/** A local file's URL for an img (the window's CSP allows file:). Pure. */
export function fileUrl(path: string): string {
  return `file://${path.split('/').map(encodeURIComponent).join('/')}`;
}

/**
 * His answer to main's own card, in the same order as every '✓ you answered' row (designer
 * m_15420): line 1 what was asked, line 2 his words, line 3 a chip for each '[Image #n]' he sent.
 */
export function CardAnsweredRow({ pos, a, at, timeAlways }: { pos: number; a: { card: number; question: string; words: string }; at: number; timeAlways: boolean }) {
  const images = a.words.match(/\[Image #\d+\]/gu) ?? [];
  const words = withoutImageMarks(a.words);
  const id = `thread.cardanswer.${String(pos)}`;
  // something he said: on his side, '✓ you answered: <question>' dim over his bubble (messages-right)
  return (
    <div className="th-approval" data-card={a.card}>
      <YouBubble
        head={<AnsweredHead ok>{`you answered: ${a.question}`}</AnsweredHead>}
        under={at > 0 ? clock(at) : undefined}
        timeAlways={timeAlways}
        testId={id}
      >
        {words === '' && images.length === 0 ? undefined : (
          <>
            {words !== '' && <div data-testid={`${id}.words`}>{words}</div>}
            {images.length > 0 && (
              <div className="th-images">
                {images.map((_, i) => (
                  <span key={i} className="b-chip image" data-kind="image" data-testid={`${id}.image.${String(i + 1)}`}>
                    <Thumb />
                    <span className="lbl">{imageLabel(i)}</span>
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </YouBubble>
    </div>
  );
}

/** '✓ you answered gift-ui': the dim head over his answer's bubble, the mark saying it with no color alone. */
/** The mark of his answer: '✓' allowed, '✕' said no, '·' when the hub doesn't say. Pure. */
export function answeredMark(ok: boolean | null | undefined): string {
  return ok === true ? '✓' : ok === false ? '✕' : '·';
}

function AnsweredHead({ ok, children }: { ok: boolean | null | undefined; children: ReactNode }) {
  // ✓ only when the hub says allowed, ✕ only when it says no, a neutral '·' when it doesn't say
  // (the real core leaves ok empty today: an allowed answer must never read ✕; lead m_16314)
  const mark = answeredMark(ok);
  return (
    <>
      <span className={ok === true ? 'th-you-mark ok' : 'th-you-mark'} data-ok={ok === true ? 'yes' : ok === false ? 'no' : 'unknown'}>
        {mark}
      </span>
      {children}
    </>
  );
}

/**
 * The hub's approval text split into its head and his words: 'you answered main: this one' ->
 * head 'you answered main', words 'this one'; a text with no words is all head, and so is a
 * decision ('you said no to perf: rm -rf target': its tail is what he decided on, not his words;
 * his note goes in the bubble), word for word as the TUI says it (lead m_18803). Pure.
 */
export function approvalParts(text: string): { head: string; words: string } {
  const m = /^(you answered [^:]+?):\s*([\s\S]+)$/u.exec(text.trim());
  if (m === null) return { head: text.trim(), words: '' };
  return { head: (m[1] ?? '').trim(), words: (m[2] ?? '').trim() };
}

/**
 * His words without the '[Image #n]' marks the hub kept in them: the chips under the row are the
 * images, so the words never say them a second time (designer m_15891). Pure.
 */
export function withoutImageMarks(words: string): string {
  return words.replace(/\[Image #\d+\]/gu, ' ').replace(/\s+/gu, ' ').replace(/\s+([:,.])/gu, '$1').trim();
}

/** His answer to an approval, folded: allowed or said no, and his words under it. */
export function ApprovalRow({ e, next }: { e: Entry; next: Entry | undefined }) {
  const a = e.approval;
  if (a == null) return <Marker>{e.text}</Marker>;
  // msg-parts: his answer's own parts (the note's), when the hub sent them: his words and images
  // from them, never from the templated text (no tag shows); the head stays the hub's words
  const view = e.parts != null && e.parts.length > 0 ? youView(e.parts) : null;
  // his images ride only in its parts since main 9ae8e01f (ApprovalFold.images is gone)
  const images = view?.images ?? [];
  // the chips draw his images: their marks leave the words (once, never twice)
  const chips = images.length > 0;
  const say = (s: string): string => (chips ? withoutImageMarks(s).replace(/:$/u, '') : s);
  const parts = approvalParts(say(a.text));
  const note = view !== null ? view.words : a.note == null ? '' : say(a.note);
  // his words (after the head's ':' or the note), then the image chips under them, in his bubble;
  // with parts, the words are the parts' alone (the head's tail is the same answer, templated)
  const words = view !== null ? note : [parts.words, note].filter((w) => w !== '').join('\n');
  return (
    <div className="th-approval" data-ok={a.ok}>
      <YouBubble
        head={<AnsweredHead ok={a.ok}>{parts.head}</AnsweredHead>}
        under={e.at_ms > 0 ? clock(e.at_ms) : undefined}
        timeAlways={lastOfRun(e, next)}
        testId={`thread.approval.${e.pos}`}
      >
        {words === '' && !chips ? undefined : (
          <>
            {words !== '' && <div className="th-you-words" data-testid={`thread.approval.${e.pos}.words`}>{words}</div>}
            <ImageChips images={images} testId={`thread.approval.${e.pos}`} />
          </>
        )}
      </YouBubble>
    </div>
  );
}

/**
 * What this agent sent another (amb-feed eb752406, bar A.3): '→ main' and
 * its words, indented as an exchange; one that waits for the reply is its
 * question (the TUI's '✉ gift-ui → main'). When main opened a card for it,
 * that card follows with only its options and says it waits for him; with
 * no card, the question waits for main (ambient m_10689: one copy of it).
 */
export function ToAgentRow({ e, ctx, chained = false }: { e: Entry; ctx: RowCtx; chained?: boolean }) {
  const to = e.to ?? 'main';
  const next = useNeighbor(ctx.tkey, e.pos, 1);
  const carded = e.asks === true && next !== undefined && cardFollows(e, next);
  // its report to bise ('[report: blocked] …'): a status line, never the tag (designer D14 in agent
  // threads, cb1f2b44); a blocked one the question card right under it already says: nothing
  const report = reportStatus(e.text);
  if (report !== null) {
    if (carded) return null;
    return <ReportRow pos={e.pos} line={report} text={e.text} next={next} ctx={ctx} waits={report.startsWith('blocked')} />;
  }
  return (
    <AgentNote
      pos={e.pos}
      from={shownName(ctx.agent)}
      to={shownName(to)}
      text={e.text}
      ctx={ctx}
      testId={`thread.to.${String(e.pos)}`}
      chip={!chained || e.asks === true}
      tag={
        e.asks === true && !carded ? (
          <span className="th-waits main" data-testid={`thread.asks.${String(e.pos)}`}>
            waits for {shownName(to)}
          </span>
        ) : undefined
      }
    />
  );
}

/** How many lines of an agent's message show folded (designer's desktop-notices (a): 2). */
const NOTE_LINES = 2;
/** Past this many characters the two folded lines are likely cut: '… ▸' says there is more. */
const NOTE_CHARS = 160;

/**
 * A message between agents (designer's thread tiers m_19387, tier 4): never body prose in the thread,
 * whoever wrote it. One dim mono row: the ✉ chip 'sender → receiver' (the sender in ink, the rest
 * text-3), then at most two rows of its words at +16 px, then '… ▸' when there is more; a click on
 * the chip or on '… ▸' opens it whole (markdown), again folds it. `chip` false: the message before
 * went the same way and its chip says it for both (designer m_19784 (2)); the words still open it.
 */
export function AgentNote({ pos, from, to, text, ctx, testId, tag, chip = true }: { pos: number; from: string; to: string; text: string; ctx: RowCtx; testId: string; tag?: ReactNode; chip?: boolean }) {
  // ctrl+o / ⌘E open and close it with every fold; a click opens it in place (desktop-notices (c))
  const [open, setOpen] = useFold(false, pos);
  const lines = text.split('\n').filter((l) => l.trim() !== '');
  const more = lines.length > NOTE_LINES || text.length > NOTE_CHARS;
  const toggle = () => {
    setOpen((o) => !o);
  };
  return (
    <div className="th-note" data-open={open || undefined} data-testid={testId} data-pos={pos}>
      {(chip || tag !== undefined) && (
        <div className="th-note-head">
          {chip && (
            <Press look="th-note-chip" aria-expanded={open} onClick={toggle} data-testid={`${testId}.chip`}>
              {/* the spaces read in its text; the flex gap draws them */}
              <span className="th-note-faint" aria-hidden="true">
                ✉
              </span>{' '}
              <span className="th-note-from">{from}</span>{' '}
              <span className="th-note-faint">→</span>{' '}
              <span className="th-note-to">{to}</span>
            </Press>
          )}
          {tag}
        </div>
      )}
      {/* desktop-notices (a): its words sans 13 text-3 at +16, two lines, then '… ▸' when there's more */}
      {text !== '' &&
        (open ? (
          <div className="th-note-text" data-testid={`${testId}.text`}>
            <Markdown text={text} onLink={ctx.onLink} onPath={ctx.onPath} />
          </div>
        ) : (
          <div className="th-note-line" data-testid={`${testId}.text`}>
            {/* explicit lines: one row each, cut with …; a single paragraph: two wrapped lines. The
                last row ends with '… ▸' when there is more (designer m_20621 (2)) */}
            {(lines.length <= 1 ? [lines[0] ?? text] : lines.slice(0, NOTE_LINES)).map((l, i, shown) => (
              <div key={i} className={lines.length <= 1 ? 'th-note-row para' : 'th-note-row'}>
                <span className="th-note-text">{l}</span>
                {more && i === shown.length - 1 && (
                  <Act onClick={toggle} testId={`${testId}.more`}>
                    … ▸
                  </Act>
                )}
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}

/** A card entry right after the ask it answers (same words): the ask carries the question. Pure. */
export function cardFollows(ask: Entry, card: Entry): boolean {
  return ask.kind === 'to_agent' && ask.asks === true && card.kind === 'card' && card.card != null && card.card.question.trim() === ask.text.trim();
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
export function CardRow({ e, ctx }: { e: Entry; ctx: RowCtx }) {
  const prev = useNeighbor(ctx.tkey, e.pos, -1);
  const c = e.card;
  if (!c) return <Marker>{e.text}</Marker>;
  const follows = prev !== undefined && cardFollows(prev, e);
  if (c.answered) return <Answered testId={`thread.card.${String(c.id)}`}>{follows ? '✓ answered' : `✓ answered: ${c.question}`}</Answered>;
  // b (his card #476, designer m_15612): the inbox block is the one place to answer; the thread says
  // one dim line that points there, never a second copy with its options. A click opens it there.
  return (
    <CardLine
      text={cardLine(shownName(ctx.agent), c.question, follows)}
      testId={`thread.card.${String(c.id)}`}
      onClick={() => {
        openInbox({ project: ctx.project, card: c.id });
      }}
    />
  );
}

/**
 * An open card's line in the thread (designer m_15612): '? bise asks: which branch first? · in the
 * inbox below'; right under the ask it answers (the ask carries the question), '? waits for you · in
 * the inbox below'. Pure.
 */
export function cardLine(who: string, question: string, follows: boolean): string {
  if (follows) return '? waits for you · in the inbox below';
  const first = question.split('\n').find((l) => l.trim() !== '')?.trim() ?? '';
  return first === '' ? `? ${who} asks · in the inbox below` : `? ${who} asks: ${first} · in the inbox below`;
}
