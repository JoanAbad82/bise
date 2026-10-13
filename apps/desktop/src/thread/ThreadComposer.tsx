// The thread's composer (amb-web's Composer with this thread's target, sources, drafts, answers
// and slash commands), also mounted under an open artifact and in the bottom block; and its pure
// helpers (about-an-artifact words, the docked card's target). Split out of ThreadScreen.tsx (the
// file cap). Owner: amb-win.
import { memo, useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { Composer, flashWords, useApprovalsFlash, useComposerSources } from '@/composer';
import type { ComposerActions } from '@/composer';
import type { Part } from '@/proto';
import type { Outgoing } from '@/composer/message';
import { threadKey, useApprovals, useCards, useCommands, useCoreEvent, useFiles, useSkills, useStore } from '@/store';
import { useRouter } from '@/app/router';
import { pickCommands, slashLine, slashOf, windowRun } from './commands';
import { HELP_EVENT } from '@/app/keys';
import { keptStorage } from '@/app/keep';
import { cardDraftKey, openInbox } from '@/inbox';
import { emptyEnterAct } from './head';
import { computerRowOf, computerState } from './ComputerLine';

/**
 * The thread's composer, also mounted under an open artifact (amb-kit's src/artifacts/Open.tsx,
 * desktop-screens v6) with `about`: its own drafts, and the message names the artifact.
 */
export const ThreadComposer = memo(function ThreadComposer({
  project,
  agent,
  busy,
  to,
  toEnd,
  divider,
  placeholder,
  answer,
  onStop,
  onEscape,
  quoting,
  onReady,
  onSent,
  about,
  keys,
  lead,
  mark,
}: {
  project: string;
  agent: string;
  busy: boolean;
  to: string;
  /** after the label's first part: the addressee's working gust (LabelMark), else none */
  mark?: ReactNode;
  /** the label line's right: 'esc write a plain message' while it answers (designer v6 s-wait) */
  toEnd?: string | undefined;
  /** else the divider's parts (model · effort · mode · …), '\u0000' between them: each shows whole
   *  or drops whole from the end (desktop-status-line A, thread.css .th-end-parts) */
  divider?: string | undefined;
  /** the field's words when empty (the composer's own 'write to …' when none) */
  placeholder: string | undefined;
  /** the open card his words answer (the inbox block's, any project's), else none */
  answer: CardAt | null;
  onStop: () => void;
  /** an esc the composer's lists didn't take (R18): the screen's (route_cancel, stop); false: nothing to do, the window may go up (esc-up.ts) */
  onEscape?: () => boolean;
  quoting: boolean;
  onReady: (a: ComposerActions) => void;
  /** his send went (the demo tour's step) */
  onSent: () => void;
  /** the artifact his words are about (an open artifact's composer): sent as `about [title](url): …` */
  about?: { id: string; title: string; url: string };
  /** a fixed key line (voice mode while he types: '⏎ send   tab back to voice   esc leave') */
  keys?: string | undefined;
  /** in the box at its left (voice mode's grey pearl while he types) */
  lead?: ReactNode;
}) {
  const store = useStore();
  const router = useRouter();
  // TP-R6 (amb-web's composer/approvals.ts): ⇧⇥ switches the hub's approvals mode yolo ↔ auto like
  // the TUI; for 3 s after a switch the label line's right says it (the TUI's key bar flash)
  const approvals = useApprovals(project);
  const flash = useApprovalsFlash(approvals) && approvals !== null ? flashWords(approvals.mode, approvals.checker, approvals.env) : null;
  const parts =
    divider === undefined || divider === '' ? undefined : (
      <span className="th-end-parts">
        {divider.split('\u0000').map((w, i) => (
          <span key={i}>{i === 0 ? w : ` · ${w}`}</span>
        ))}
      </span>
    );
  const end: ReactNode =
    flash === null ? (toEnd ?? parts) : (
      <span data-testid="composer.flash">
        <span className="flash-word">{flash.word}</span>
        {flash.rest}
      </span>
    );
  const onShiftTab = useCallback(() => {
    store.command({ cmd: 'approvals', project, mode: 'toggle' });
  }, [store, project]);
  // the composer's lists from the core (amb-core's C/A/B 40f14a12): the TUI's
  // commands in its order (window ones ready when their screen exists, the
  // hub's when they run typed), the workspace's $ skills, its @ files ranked
  // by files.rs (a newer query replaces an older one: [] for it)
  const core = useCommands();
  const skills = useSkills(project);
  // while the workspace's first walk runs, an '@' answer is partial and the
  // fuller one comes later (useFiles): when it does, the files source changes
  // once, so an open '@' list asks again and shows it
  const filesSettled = useFiles(project)?.partial !== true;
  const extra = useMemo(
    () => ({
      // a new files source once the walk settles: the composer's '@' asks again
      settled: filesSettled,
      commands: pickCommands(core),
      skills,
      files: (q: string) => store.files(project, q).then((a) => (a === null ? [] : [...a.items, ...(a.folder ? [{ path: a.folder.path, dir: true }] : [])])),
      // ctrl+r twice: voice mode with this agent (amb-home's src/voicemode)
      voice: () => {
        store.voiceMode(project, agent, true);
      },
    }),
    [core, skills, store, project, agent, filesSettled],
  );
  const sources = useComposerSources(project, extra, agent);
  // the hub's word on his answer, where he typed it (main m_21514, amb-core m_21541): a drafts card
  // says where his words went; a refusal says why and gives his words back (never a field that just
  // empties, whichever project's card it was)
  const asked = useRef<{ project: string; text: string } | null>(null);
  const actions = useRef<ComposerActions | null>(null);
  const [note, setNote] = useState<AnswerNote | null>(null);
  useCoreEvent(
    useCallback((ev) => {
      const n = answerNoteOf(ev, asked.current);
      if (n === null) return;
      setNote(n);
      if (n.level === 'err' && asked.current !== null && fieldEmpty()) actions.current?.fill(asked.current.text);
      asked.current = null;
    }, []),
  );
  const ready = useCallback(
    (a: ComposerActions) => {
      actions.current = a;
      onReady(a);
    },
    [onReady],
  );
  const onCommand = useCallback(
    (name: string, args: string) => {
      const at = { project, agent };
      const w = windowRun(name, args, at);
      if (w !== undefined) {
        if ('go' in w) router.go(w.go);
        else if ('inbox' in w) openInbox();
        else if ('app' in w) store.command(w.app);
        else if ('quit' in w) window.bise.quit();
        else window.dispatchEvent(new Event(HELP_EVENT));
        return;
      }
      // every other line he typed goes to the hub as typed: its router runs it (architect m_11011)
      store.command(slashOf(name, args, at));
    },
    [router, store, project, agent],
  );
  const onSend = useCallback(
    (out: Outgoing) => {
      // a '/word' line the composer's list doesn't know is still a command: the hub's router runs it
      // (never a line with typed parts: '/word [Image #1]' or a quoted '/word' is a message)
      const sl = out.files.length === 0 && out.parts === undefined ? slashLine(out.text) : null;
      if (sl !== null) {
        onCommand(sl.name, sl.args);
        return;
      }
      // the open card's answer (any project's: the block lists them all): his words and the images
      // he attached, the hub's one /answer path (R41)
      setNote(null);
      if (answer !== null) {
        // msg-parts: his quotes and pastes go typed (the hub renders the model's text from them)
        asked.current = { project: answer.project, text: out.text };
        // inbox picks (3): this thread, so his row shows here too when the asker's thread is elsewhere
        const from = answer.asker === undefined ? undefined : { at: { project, agent }, asker: answer.asker, words: out.text };
        store.answer(answer.project, answer.card, out.text, out.files, out.parts, from);
        onSent();
        return;
      }
      // ⏎ while a turn runs steers it ('now', as the TUI); the files he
      // attached or dropped go with it (amb-core item H: the hub renders them
      // once, an image as a marker the model sees). Tab's queue: amb-web's
      const text = about === undefined ? out.text : aboutText(about, out.text);
      // S29/L19 W2: stopped until he writes: his message gives the wheel back first (read at send,
      // never subscribed: the rows moving must not re-render the composer)
      const cu = computerRowOf(store.computerLive(), project, agent);
      if (cu !== undefined && computerState(cu) === 'stopped') store.computer('hand_back', cu.key);
      // msg-parts: his quotes, pastes and images go typed, never templated by the window; an
      // artifact's question puts its 'about' lead in front of his words, as a text part too
      const parts = about === undefined || out.parts === undefined ? out.parts : aboutParts(about, out.parts);
      store.send({ project, agent, text, mode: 'now', ...(out.files.length > 0 ? { files: [...out.files] } : {}), ...(parts === undefined ? {} : { parts }) });
      onSent();
    },
    [store, project, agent, onSent, onCommand, answer, about],
  );
  // his drafts, history and queue in the keep's file, never lost by a quit (keep.ts)
  // K2: ⏎ on an empty field does the TUI's act, if one waits (sign in again after expiry)
  const cards = useCards(project);
  const onEmptyEnter = useCallback(() => {
    // S29/L19 W2: he took the wheel: ⏎ on the empty field gives it back ('you took the wheel · ⏎ give it back')
    const cu = computerRowOf(store.computerLive(), project, agent);
    if (cu !== undefined && computerState(cu) === 'paused') {
      store.computer('hand_back', cu.key);
      return;
    }
    // his /restart's row says a newer app is staged: ⏎ restarts the app (amb-home, ambient-lead m_22833)
    const swap = document.querySelector<HTMLButtonElement>('[data-testid="confirm.notice.swap"]');
    if (swap !== null) {
      swap.click();
      return;
    }
    // the thread's last row, read at ⏎ (never subscribed: a new entry must not re-render the composer)
    const key = threadKey(project, agent);
    const lastPos = store.threadOrder(key).order.at(-1);
    const lastKind = lastPos === undefined ? undefined : store.entry(key, lastPos)?.kind;
    const act = emptyEnterAct(cards, agent, lastPos === undefined || lastKind === undefined ? undefined : { kind: lastKind, pos: lastPos });
    if (act === null) return;
    // his undelivered message, last in the thread: its own row sends it again (and says so); gone
    // once sent or dropped, so a second ⏎ does nothing, as the TUI's
    if (act.act === 'again') document.querySelector<HTMLButtonElement>(`[data-testid="thread.notdelivered.${String(act.pos)}.again"]`)?.click();
    else store.command(act.cmd);
  }, [cards, agent, store, project]);
  // the open card that takes words keeps his half answer apart, the thread's draft never moves
  // (amb-home 2b, amb-web's draftKey): the card's own key, the same wherever the block opens it
  const draftKey = answer === null ? undefined : cardDraftKey(answer);
  const field = <Composer target={about === undefined ? `${project}/${agent}` : `${project}/${agent}/artifact/${about.id}`} {...(draftKey === undefined ? {} : { draftKey })} busy={busy} sources={sources} store={keptStorage} to={to} {...(end === undefined ? {} : { toEnd: end })} onShiftTab={onShiftTab} placeholder={placeholder} onEmptyEnter={onEmptyEnter} {...(onEscape === undefined ? {} : { onEscape })} quoting={quoting} onSend={onSend} onCommand={onCommand} onStop={onStop} onReady={ready} {...(keys === undefined ? {} : { keys })} lead={lead} mark={mark} testId="composer" />;
  if (note === null) return field;
  return (
    <>
      <div className={`th-notice ${note.level} th-hubnote`} role={note.level === 'err' ? 'alert' : 'status'} data-testid="composer.answer.note" data-level={note.level}>
        <span className="th-notice-mark" aria-hidden="true">
          {note.level === 'err' ? '✗' : '·'}
        </span>{' '}
        {note.text}
      </div>
      {field}
    </>
  );
});

/** The hub's word on an answer this composer sent: its notice (where his words went) or its refusal. */
export interface AnswerNote {
  readonly level: 'info' | 'err';
  readonly text: string;
}

/** A core event as the note on his last answer, if it is one: the same project, cmd 'answer'. Pure. */
export function answerNoteOf(ev: unknown, asked: { project: string } | null): AnswerNote | null {
  if (asked === null || typeof ev !== 'object' || ev === null) return null;
  const e = ev as { ev?: unknown; cmd?: unknown; project?: unknown; text?: unknown };
  if (e.cmd !== 'answer' || e.project !== asked.project || typeof e.text !== 'string') return null;
  if (e.ev === 'notice') return { level: 'info', text: e.text };
  if (e.ev === 'error') return { level: 'err', text: e.text };
  return null;
}

/** The composer's field holds nothing he typed since (his words come back only into an empty field). */
function fieldEmpty(): boolean {
  return (document.querySelector('[data-testid="composer.field"]')?.textContent ?? '').trim() === '';
}

/** A message about an artifact: `about [its title](its url): his words` (the chip's own link form). Pure. */
export function aboutText(a: { title: string; url: string }, text: string): string {
  return `about [${a.title.replace(/[[\]]/gu, '')}](${a.url}): ${text}`;
}

/** The same lead on typed parts: after his quotes (the hub renders them in front anyway), before his words. Pure. */
export function aboutParts(a: { title: string; url: string }, parts: readonly Part[]): Part[] {
  const lead: Part = { kind: 'text', text: aboutText(a, '') };
  const i = parts.findIndex((p) => p.kind !== 'quote');
  const at = i < 0 ? parts.length : i;
  const next = parts[at];
  // joined with his first words when they are words (parts as a composer makes them: adjacent texts joined)
  if (next?.kind === 'text') return [...parts.slice(0, at), { kind: 'text', text: lead.text + next.text }, ...parts.slice(at + 1)];
  return [...parts.slice(0, at), lead, ...parts.slice(at)];
}

/** A card of a project, as the composer answers it. */
export interface CardAt {
  readonly project: string;
  readonly card: number;
  /** who asked it (inbox picks (3): his row in this thread when the asker's is elsewhere) */
  readonly asker?: string;
}

/** The inbox block's 'where am i' on bise's own view (no project, no agent: 'esc write a plain message'). */
export const HERE_BISE = { project: null, agent: null } as const;

/** The card his words answer while the block has one open, else none (an approval: none). Pure. */
export function answerOf(a: { project: string; answer: number | null; asker?: string } | null): CardAt | null {
  if (a === null || a.answer === null) return null;
  return { project: a.project, card: a.answer, ...(a.asker === undefined ? {} : { asker: a.asker }) };
}

/** The composer's label while it answers a docked card: 'answering perf · which bench do you…' (main is bise). Pure. */
export function answeringLabel(c: { agent: string; question: string }): string {
  const who = c.agent === 'main' ? 'bise' : c.agent;
  const one = c.question.replace(/\s+/gu, ' ').trim();
  const cut = Array.from(one).length > 40 ? `${Array.from(one).slice(0, 39).join('').trimEnd()}…` : one;
  return `answering ${who} · ${cut}`;
}
