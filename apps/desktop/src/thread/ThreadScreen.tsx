// One agent's thread: its head, its entries, its current step, ⌘F, and
// amb-web's composer. Owner: amb-win. Bar ⛔3 (a send shows at once),
// ⛔4 (readable answers), ⛔6 (esc stops the turn), 3.3 (writing to one
// agent: the composer's target is this agent), 3.4 (⌘F).
//
// What re-renders what (the reset's flicker rule): the list re-renders
// when its keys change (an entry or a send comes or goes); each row reads
// its own data; the composer is memo'd with stable props, so neither an
// entry, a step nor a send ever re-renders it.
import { memo, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { Button, Head, Marker, Press } from '@/ds';
import { Composer, flashWords, useApprovalsFlash, useComposerSources } from '@/composer';
import type { ComposerActions } from '@/composer';
import type { Part } from '@/proto';
import { quoteFrom, quoteKey, quoteText } from './quote';
import type { Outgoing } from '@/composer/message';
import { threadKey, useAgents, useApprovals, useModels, useCards, useCommands, useCoreState, useEntry, useFiles, useProjects, usePending, useSkills, useStore, useThreadOrder, useTyping } from '@/store';
import { usePartialText } from '@/shared/partial';
import { LIVE, liveKey, useLive, useStill } from './live';
import { useMenuAction } from '@/app/menu';
import { useRouter } from '@/app/router';
import { pickCommands, slashLine, slashOf, windowRun } from './commands';
import { HELP_EVENT } from '@/app/keys';
import { MAIN } from '@/app/route';
import { RefusedLine } from '@/app/Refused';
import { keep, keptStorage } from '@/app/keep';
import { FirstRun, showsFirstRun, Tip } from '@/setup';
import { useTour } from '@/setup/useTour';
import { takeQuotes } from '@/review/quote';
import { copyText, QuotePop } from '@/quote/QuotePop';
import { Hint, hintUsed, hintsUserMessage, useHint } from '@/app/hints';
import { InboxBlock, type Answering } from '@/inbox';
import { dotOf, lineOf, shownName } from '@/agents/model';
import { Tune } from '@/agents/Tune';
import { AgentHead, BiseHead, LiveLine, StartingLine } from './AgentHead';
import { composerWords, dividerEnd, emptyEnter, emptyEnterAct, nothingOwnYet, usageLine } from './head';
import { waitAge, waitSince, waitsEvent } from './wake';
import { useNow } from '@/app/clock';
import { SignInLine, useThreadSignIn } from './signin';
import { ThreadList, type ThreadListHandle } from './ThreadList';
import { EntryRow, PendingRow, QueuedRow, TypingLine, gapOf, type RowCtx } from './rows';
import { ComputerLine, computerRowOf, computerState } from './ComputerLine';
import { entryKey, namedRows, pendingKey, placeSteered, posOfKey } from './entry';
import { FindBar } from './FindBar';
import { NoProject } from './NoProject';
import { landedEchoes, retryRuns } from './tiers';
import { foldedRuns, runKey, runWords, withRuns } from './runs';
import { BisePearl } from '@/app/BisePearl';
import { createFindMark, FindMarkContext } from './findmark';
import { trackRoutes, useHeld } from './routes';
import { absolute } from './paths';
import { createFolds, FoldsContext } from './folds';
import { ThreadVoice, TYPING_END, typingLabelOf, useVoiceHere, VoiceTypePearl, VOICE_TYPING_KEYS } from '@/voicemode';

export interface ThreadScreenProps {
  project: string;
  agent: string;
  /** bise's own main: 'bise' with its pearl */
  bise?: boolean;
  /** the project's name for the head and the composer's 'you → …' */
  projectName?: string;
}

/** The agent's folder: its worktree, else its project's checkout; none until the rows come. */
function useBase(project: string, agent: string): string | undefined {
  const a = useAgents(project).find((x) => x.name === agent);
  const row = useProjects().find((p) => p.project === project);
  return a?.worktree ?? row?.path;
}

/** A link from an answer: his browser, through main (http/https/mailto only). */
function openLink(url: string) {
  const bise = (window as Partial<Window>).bise;
  void bise?.openExternal(url);
}

export function ThreadScreen({ project, agent, bise = false, projectName }: ThreadScreenProps) {
  const store = useStore();
  const tkey = threadKey(project, agent);

  // the thread's pages and live entries while it is shown, asked again
  // when a restarted core comes up (a new core holds no subscription)
  const core = useCoreState();
  const live = core !== 'down';
  useEffect(() => {
    if (!live) return;
    store.subscribeThread(project, agent);
    return () => {
      store.unsubscribeThread(project, agent);
    };
  }, [store, project, agent, live]);

  // bise's routing holds of his sends here (read before the first send)
  trackRoutes(store);
  const held = useHeld(store, tkey);

  const me = useAgents(project).find((a) => a.name === agent);
  // S40/W3: the TUI's divider on the composer's label line: model · effort · approvals mode · state · context
  const approvals = useApprovals(project);
  const models = useModels(project);
  const now = useNow();
  const divider =
    me === undefined
      ? ''
      : dividerEnd({
          model: me.model,
          modelLabel: models.find((m) => m.id === me.model)?.label,
          effort: me.effort,
          mode: approvals?.mode,
          // event-wake (designer m_17827): while it waits for an event the label follows the head
          // ('… waiting · 2m'), never 'idle', the word he misread
          status: waitsEvent(me) ? `… waiting · ${waitAge(now - (waitSince(me.watching) ?? now))}` : me.status,
          turnMs: me.status === 'working' ? (me.turn_ms ?? now - me.since_ms) : null,
          // named like the head's gauge ('context 42k · 17%'), none at 0% (designer m_14523: a bare
          // '15 · 0%' read as nothing)
          context: usageLine(me.usage?.words),
        });
  // voice mode on this agent: its pane takes the composer's place (amb-home's src/voicemode)
  const voice = useVoiceHere(project, agent);
  const typing = useTyping(tkey);
  const busy = me?.status === 'working' || typing !== '';

  // ⌘F's bar stays open across a reload (keep.ts: an open panel, no age); its folds too
  const findKey = `find.open:${project}/${agent}`;
  const [findOpen, setFindOpenState] = useState(() => keep.view(findKey) === true);
  const setFindOpen = useCallback(
    (on: boolean) => {
      setFindOpenState(on);
      keep.setView(findKey, on ? true : undefined);
    },
    [findKey],
  );
  const [mark] = useState(createFindMark);
  const [folds] = useState(() => createFolds(`${project}/${agent}`));
  const list = useRef<ThreadListHandle>(null);
  // H10 (designer m_19835): scrolled up to read, the inbox block is one line and the composer's keys line hides
  const [reading, setReading] = useState(false);
  // his bug 3: a selection in the thread, then a key, quotes it in the composer
  const section = useRef<HTMLElement>(null);
  const composer = useRef<ComposerActions | null>(null);
  // his queued message taken back to edit (QueuedRow): its words at the composer's caret, for him to resend
  const takeBack = useCallback((text: string) => {
    composer.current?.insertText(text);
    composer.current?.focusEnd();
  }, []);
  const onComposer = useCallback(
    (a: ComposerActions) => {
      composer.current = a;
      // V7: lines quoted in the review come in as chips, then the key he typed
      const q = takeQuotes(project, agent);
      if (q === null) return;
      // after the composer's own listeners are up (its strip reads the chips on an update)
      setTimeout(() => {
        for (const x of q.quotes) a.quote(x.text, q.from, x.at);
        a.insertText(q.key);
      }, 0);
    },
    [project, agent],
  );
  const quote = useThreadQuote(section, composer, agent);
  const quoting = quote.quoting;
  // L25: the demo's tips; 'inside' and 'end' sit at the thread's top, his send moves the tour
  const tour = useTour(project);
  const tourSent = useRef(tour.sent);
  useEffect(() => {
    tourSent.current = tour.sent;
  }, [tour.sent]);
  const onSent = useCallback(() => {
    tourSent.current();
    // S36: his message puts the one-time hints away
    hintsUserMessage();
  }, []);
  const topTip = (tour.tip === 'inside' && tour.snap.focus === agent) || tour.tip === 'end' ? tour.tip : null;
  useMenuAction('find', () => {
    setFindOpen(true);
  });
  // the window's keys (app/keys.ts): ⌘E everything folded, ⌘. stop,
  // end back to the bottom, ctrl+y copy a code block
  useMenuAction('fold-all', () => {
    // the row at the top of the view keeps its y while everything opens or closes (designer m_17092)
    list.current?.holdView();
    folds.toggle();
  });
  useMenuAction('to-end', () => {
    list.current?.scrollToEnd();
  });
  useMenuAction('copy-code', () => {
    const code = codeToCopy(document);
    if (code !== undefined) void (window as Partial<Window>).bise?.copy(code);
  });

  // ⛔6: a stop he asked, shown until the turn's end or a new entry
  const [stopping, setStopping] = useState(false);
  const stop = useCallback(() => {
    store.stop(project, agent);
    setStopping(true);
  }, [store, project, agent]);
  if (stopping && !busy) setStopping(false);
  useMenuAction('stop', () => {
    if (busy) stop();
  });

  /**
   * The thread's esc, once no list or popup took it (R18, the TUI's order): while bise holds his
   * words, keep them with bise (route_cancel); while the agent works, stop the turn. The composer
   * calls it itself (ProseMirror preventDefaults every Escape); an esc from elsewhere bubbles here.
   */
  // memo'd: the composer is (a new entry never re-renders it)
  const escape = useCallback((): boolean => {
    if (findOpen) return false;
    if (held !== undefined) store.command({ cmd: 'route_cancel', project: held.home, rid: held.rid });
    else if (busy) stop();
    else return false;
    return true;
  }, [findOpen, held, busy, store, stop]);
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !e.defaultPrevented) {
      if (escape()) e.preventDefault();
    } else if (e.key === 'c' && e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && !e.defaultPrevented) {
      // K6, the TUI's ctrl+c (ambient-pm m_17250): it stops the turn too; copy is ⌘C on the Mac, so
      // ctrl+c is free, but with text selected it does nothing else (he may be copying by habit)
      if (busy && (window.getSelection()?.isCollapsed ?? true)) {
        e.preventDefault();
        stop();
      }
    } else if (e.key === 'f' && e.metaKey && !e.shiftKey && !e.altKey && !e.ctrlKey) {
      e.preventDefault();
      setFindOpen(true);
    }
  };

  const [tuning, setTuning] = useState(false);
  // a project's main is bise (ambient m_11437): 'bise · acme', the project dim
  const title = bise || agent !== 'main' ? shownName(bise ? 'main' : agent) : 'bise';
  const headTitle =
    agent === 'main' && !bise ? (
      <>
        bise
        <span className="th-title-project" data-testid="thread.title.project">
          {' · '}
          {projectName ?? project}
        </span>
      </>
    ) : (
      title
    );
  // b1/b2 (his card #476): the inbox block over the composer tells what his words do while one of
  // its items is open in place: a question's answer ('answering perf · …'), or a plain message
  // with what an approval waits for; esc folds the item and his words are a message again
  const [answering, setAnswering] = useState<Answering | null>(null);
  // R15: an expired sign-in stopped this agent and his browser is on it: c on the empty composer
  // copies the link, esc cancels (the TUI's resign.rs keys)
  const cardsHere = useCards(project);
  const signIn = useThreadSignIn(emptyEnter(cardsHere, agent) !== null);
  const onKeyDownCapture = (e: KeyboardEvent) => {
    const field = e.target instanceof HTMLElement ? e.target.closest('[data-testid="composer.field"]') : null;
    if (signIn.on && field !== null && field.textContent.trim() === '' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      if (e.key === 'Escape' || e.key === 'c') {
        e.preventDefault();
        e.stopPropagation();
        if (e.key === 'c') signIn.copy();
        else signIn.cancel();
        return;
      }
    }
  };
  // a project's main: its counts (tui-parity W2), else the agent's line
  const all = useAgents(project);
  const counts = agent === 'main' ? countsOf(all) : '';
  const router = useRouter();
  // the counts open the agents list (bar A.2: the TUI's /agents and panel)
  const countsLink =
    counts === '' ? null : (
      <a
        href="#agents"
        className="th-agents-link"
        onClick={(e) => {
          e.preventDefault();
          router.go({ screen: 'agents', project });
        }}
        data-testid="thread.agents"
      >
        {counts}
      </a>
    );
  const lead = bise ? 'every project' : agent === 'main' ? '' : (projectName ?? project);
  // its context gauge, named ('context 42k · 17%'), none while it says nothing ('0%': designer D7b)
  const gauge = bise ? '' : usageLine(me?.usage?.words);
  const sub = (
    <>
      {/* bise's own head: 'every project' alone (designer D7b) */}
      {bise ? (
        lead
      ) : agent === 'main' && countsLink !== null ? (
        lead === '' ? (
          countsLink
        ) : (
          <>
            {lead} · {countsLink}
          </>
        )
      ) : (
        [lead, agent !== 'main' && me ? lineOf(me) : ''].filter(Boolean).join(' · ')
      )}
      {gauge !== '' && (
        <span className="th-gauge" data-testid="thread.usage">
          {' · '}
          {gauge}
        </span>
      )}
      {/* voice mode on this agent (ambient's spec m_11632, amb-home m_11684) */}
      {voice !== 'off' && (
        <span className="th-voice" data-testid="thread.voice">
          {' · voice mode'}
        </span>
      )}
    </>
  );

  // designer's v6 (5): an agent whose thread has nothing of its own yet (his first message at most) is starting
  const order = useThreadOrder(tkey);
  // once it writes (a streamed reply, live.ts) it isn't starting any more, even between the
  // partial's clear and its entry (sticky for this thread: the line never comes back mid-turn)
  const writing = usePartialText(project, agent) !== null;
  const [wrote, setWrote] = useState<string | null>(null);
  if (writing && wrote !== tkey) setWrote(tkey);
  const fresh = !bise && agent !== MAIN && me !== undefined && !me.archived && order.loaded && nothingOwnYet(order.order.map((pos) => store.entry(tkey, pos)?.kind)) && me.status === 'working' && me.waits === 0 && !writing && wrote !== tkey;
  // designer's desktop-screens v6 (1): '⋯' at the head's right (rename, model, reasoning)
  const more =
    me && !me.archived && !bise ? (
      <Button
        kind="ghost"
        title={me.main ? 'model, reasoning' : 'rename, model, reasoning'}
        onClick={() => {
          setTuning((x) => !x);
        }}
        testId="thread.more"
      >
        ⋯
      </Button>
    ) : undefined;
  return (
    <FoldsContext value={folds}>
    <FindMarkContext value={mark}>
      <section ref={section} className="th-screen" data-testid="thread.screen" data-project={project} data-agent={agent} data-quoting={quoting} data-answering={answering !== null} data-reading={reading} onKeyDown={onKeyDown} onKeyDownCapture={onKeyDownCapture}>
        {bise || !me || me.archived ? (
          <Head title={headTitle} sub={sub} lead={bise ? <BisePearl size={14} /> : undefined} dot={bise || !me ? undefined : dotOf(me.status)} />
        ) : agent === MAIN ? (
          <BiseHead project={project} name={projectName ?? project} more={more} />
        ) : (
          <AgentHead project={project} a={me} more={more} note={voice !== 'off' ? 'voice mode' : undefined} starting={fresh} />
        )}
        {/* S29/L19 W1: it drives his computer: one line under the head, from computer_live only */}
        {!bise && <ComputerLine project={project} agent={agent} />}
        {tuning && me && !me.archived && (
          <Tune
            key={me.name}
            project={project}
            a={me}
            onRenamed={(to) => {
              setTuning(false);
              // the thread follows its new name
              router.go({ screen: 'thread', project, agent: to });
            }}
          />
        )}
        {findOpen && (
          <FindBar
            tkey={tkey}
            project={project}
            agent={agent}
            mark={mark}
            onGo={(pos) => list.current?.scrollTo(entryKey(pos))}
            onClose={() => {
              setFindOpen(false);
            }}
          />
        )}
        {topTip !== null && (
          <div className="th-tip">
            <Tip tip={topTip} snap={tour.snap} />
          </div>
        )}
        {/* the list and, over an empty one, the first-run block centred in the column (his try:
            it sat bottom-left at the column's edge) */}
        <div className="th-main">
          <Rows tkey={tkey} project={project} agent={agent} bise={bise} listRef={list} onTakeBack={takeBack} onReading={setReading} />
          {agent === MAIN && me?.archived !== true && <FirstRunSlot tkey={tkey} project={project} composer={composer} bise={bise} />}
        </div>
        {/* in the thread's column like the lines under it (amb-web m_17316: it sat flush left) */}
        {stopping && (
          <div className="th-stopping" data-testid="thread.stopping">
            <Marker>stopping {agent}…</Marker>
          </div>
        )}
        {fresh && <StartingLine a={me} />}
        {!bise && agent !== MAIN && !fresh && <LiveLine a={me} />}
        {signIn.on && <SignInLine copied={signIn.copied} />}
        <TypingLine text={typing} />
        {/* W7/K24: the project's open items over the composer's divider (amb-home f44d082e) */}
        {/* its hub refused this core: the hub's words and a retry, over the composer (lead m_11347) */}
        <RefusedLine project={project} name={bise ? 'bise' : (projectName ?? project)} className="app-refused th-refused" testId="thread.refused" />
        <CardHint project={project} />
        {/* b1/b2: every project's open items, one opened in place (amb-home's InboxBlock, eb3da983) */}
        <InboxBlock here={bise ? HERE_BISE : { project, agent }} onAnswer={setAnswering} reading={reading} />
        {me?.archived === true ? (
          <History project={project} agent={agent} />
        ) : voice === 'pane' ? (
          <ThreadVoice project={project} agent={agent} />
        ) : (
          <>
          {voice === 'typing' && <ThreadVoice project={project} agent={agent} />}
          <ThreadComposer
            project={project}
            agent={agent}
            busy={busy}
            // an open item: the block's words (a question's 'answering perf · …', or an approval's
            // 'to bise · the merge waits for 1 or 2' where his words stay a plain message, ambient m_8773);
            // voice mode while he types: 'to perf · voice paused', 'tab back to voice' (designer's voice-window (1))
            to={voice === 'typing' ? typingLabelOf(agent) : answering !== null ? answering.label : composerWords(title).label}
            toEnd={voice === 'typing' ? TYPING_END : (answering?.end ?? (divider === '' ? undefined : divider))}
            keys={voice === 'typing' ? VOICE_TYPING_KEYS : undefined}
            lead={voice === 'typing' ? <VoiceTypePearl /> : undefined}
            placeholder={answering?.answer != null ? 'your answer, then ⏎' : composerWords(title).placeholder}
            answer={answerOf(answering)}
            onStop={stop}
            onEscape={escape}
            quoting={quoting}
            onReady={onComposer}
            onSent={onSent}
          />
          </>
        )}
        {quote.pop !== null && (
          <span className="q-float" style={{ left: quote.pop.x, top: quote.pop.y }}>
            <QuotePop testId="thread.quote.pop" onAsk={quote.ask} onCopy={quote.copy} />
          </span>
        )}
      </section>
    </FindMarkContext>
    </FoldsContext>
  );
}

/**
 * ctrl+y's block (the TUI's codeblock.rs): the code block under the mouse,
 * else the newest one drawn in the thread. Its text, as written.
 */
export function codeToCopy(doc: Document): string | undefined {
  const hovered = doc.querySelector('.th-list pre:hover code, .th-list pre:hover');
  if (hovered !== null) return hovered.textContent;
  const all = doc.querySelectorAll('.th-list pre code');
  const last = all.item(all.length - 1) as Element | null;
  return last === null ? undefined : last.textContent;
}

/** The list: entries by pos, then his sends not confirmed yet. */
/**
 * The first-run text (bar L1 / M18, amb-kit's FirstRun) in main's thread
 * while he has said nothing there and main is the project's only agent: its
 * "show me what you can do" puts the words in the composer, selected (never
 * a send); then its last line says ⏎ tries it. Gone once he said something.
 */
function FirstRunSlot({ tkey, project, composer, bise }: { tkey: string; project: string; composer: RefObject<ComposerActions | null>; bise: boolean }) {
  const store = useStore();
  const rows = useProjects();
  // bise's own thread before any project: designer's 'no project yet' centre (m_12093), demo only
  const noProject = bise && rows.length > 0 && !rows.some((p) => !p.home);
  const view = useThreadOrder(tkey);
  const pending = usePending(tkey);
  const live = useAgents(project).filter((a) => !a.archived).length;
  const [ready, setReady] = useState(false);
  // his words in the thread: an entry of his, or a send of his on its way
  const said = pending.length > 0 || view.order.some((pos) => store.entry(tkey, pos)?.kind === 'you');
  if (!view.loaded || !showsFirstRun(said, live)) return null;
  // over an empty list: centred in the thread's column, both ways; under entries of main's: in the
  // column, at the list's end
  const centred = view.order.length === 0;
  return (
    <div className={centred ? 'th-first' : 'th-first after'} data-testid="thread.first">
      {noProject ? (
        <NoProject
          onDemo={(text) => {
            composer.current?.fill(text);
          }}
        />
      ) : (
        <FirstRun
          ready={ready}
          onFill={(text) => {
            composer.current?.fill(text);
            setReady(true);
          }}
        />
      )}
    </div>
  );
}

const Rows = memo(function Rows({ tkey, project, agent, bise, listRef, onTakeBack, onReading }: { tkey: string; project: string; agent: string; bise: boolean; listRef: RefObject<ThreadListHandle | null>; onTakeBack?: (text: string) => void; onReading?: (reading: boolean) => void }) {
  const store = useStore();
  const view = useThreadOrder(tkey);
  const pending = usePending(tkey);
  // entries only: his sends not landed yet are the list's tail, outside the
  // virtual list, so his row is drawn in ⏎'s own frame (bar ⛔3: < 100 ms)
  // R13: more than 3 agent-to-agent messages in a row fold into '▸ 4 messages between 2 agents'
  const [openRuns, setOpenRuns] = useState<ReadonlySet<number>>(() => new Set());
  // a steer shows where the agent read it (its receipt's pos), not where it was written
  // (the store bumps the order when a steered_at comes, so this recomputes)
  // one land per sha (designer m_19387): the hub's line that says again a typed land leaves the list
  const placed = useMemo(() => {
    const echoes = landedEchoes(view.order, (pos) => store.entry(tkey, pos));
    const order = echoes.size === 0 ? view.order : view.order.filter((pos) => !echoes.has(pos));
    return placeSteered(order, (pos) => store.entry(tkey, pos)?.steered_at);
  }, [view, store, tkey]);
  // H9 (designer m_19832): a model call's retries, one row that updates in place; the tries before
  // the last leave the list, their words open under its ▸
  const retries = useMemo(() => retryRuns(placed, (pos) => store.entry(tkey, pos)), [placed, store, tkey]);
  const shown = useMemo(() => (retries.hidden.size === 0 ? placed : placed.filter((pos) => !retries.hidden.has(pos))), [placed, retries]);
  const runs = useMemo(() => foldedRuns(shown, (pos) => store.entry(tkey, pos), agent), [shown, store, tkey, agent]);
  const listed = useMemo(() => withRuns(shown, runs, openRuns, entryKey), [shown, runs, openRuns]);
  // the reply being written (streaming): a live row at the end, drawn as the entry it becomes,
  // which takes its place with the same key (live.ts, text-appearing v2)
  const partial = usePartialText(project, agent);
  const lastPos = view.order.at(-1) ?? -1;
  const lastKind = useEntry(tkey, lastPos)?.kind;
  const live = useLive(partial, lastPos, lastKind);
  const still = useStill();
  const keys = useMemo(() => (live.entry === null ? listed : [...listed, LIVE]), [listed, live.entry]);
  const liveCall = live.call;
  const handed = live.handed;
  const reactKey = useCallback(
    (key: string) => {
      if (key === LIVE) return liveCall === null ? key : liveKey(liveCall);
      const pos = posOfKey(key);
      return (pos === undefined ? undefined : handed.get(pos)) ?? key;
    },
    [liveCall, handed],
  );
  // relative paths in its answers are under the agent's folder: its worktree, else the project's
  const base = useBase(project, agent);
  const ctx = useMemo<RowCtx>(
    () => ({
      tkey,
      project,
      agent,
      bise,
      onLink: openLink,
      ...(onTakeBack === undefined ? {} : { onTakeBack }),
      ...(base === undefined
        ? {}
        : {
            onPath: (path: string, line?: number) => {
              void (window as Partial<Window>).bise?.openPath(absolute(path, base), line === undefined ? {} : { line });
            },
          }),
    }),
    [tkey, project, agent, bise, base, onTakeBack],
  );
  // each row reads the one before it: its group and its day (ambient m_11777)
  const prevOf = useMemo(() => new Map(shown.map((p, i) => [p, shown[i - 1]])), [shown]);
  // and the one after it: his last bubble of a run shows its time (messages-right v1)
  const nextOf = useMemo(() => new Map(shown.map((p, i) => [p, shown[i + 1]])), [shown]);
  // H2: one name line per author run, never on a tool row (entry.ts namedRows)
  const heads = useMemo(() => namedRows(shown, (pos) => store.entry(tkey, pos), { agent, bise }), [shown, store, tkey, agent, bise]);
  // H1: the row under a folded run follows the fold's quiet row
  const afterFold = useMemo(() => {
    const out = new Set<number>();
    for (const r of runs) {
      const last = r.members.at(-1);
      const after = openRuns.has(r.start) || last === undefined ? undefined : nextOf.get(last);
      if (after !== undefined) out.add(after);
    }
    return out;
  }, [runs, openRuns, nextOf]);
  // the first message of an open run sits 8 px under its fold row (designer m_19912 (2))
  const underFold = useMemo(() => new Set(runs.filter((r) => openRuns.has(r.start)).map((r) => r.start)), [runs, openRuns]);
  // H1: the fold is a quiet row: 4 px under another, 12 under a message or prose
  const foldGap = useCallback(
    (start: number) => {
      const before = prevOf.get(start);
      const p = before === undefined ? undefined : store.entry(tkey, before);
      return p === undefined ? undefined : gapOf(p, { kind: 'fold' });
    },
    [prevOf, store, tkey],
  );
  const row = useCallback(
    (key: string) => {
      const run = key.startsWith('r:') ? runs.find((r) => runKey(r.start) === key) : undefined;
      if (run !== undefined) {
        const open = openRuns.has(run.start);
        return (
          <Press
            look="th-run"
            aria-expanded={open}
            onClick={() => {
              setOpenRuns((s) => {
                const next = new Set(s);
                if (next.has(run.start)) next.delete(run.start);
                else next.add(run.start);
                return next;
              });
            }}
            data-testid={`thread.run.${String(run.start)}`}
            data-gap={foldGap(run.start)}
          >
            {runWords(run, open)}
          </Press>
        );
      }
      if (key === LIVE) return live.entry === null ? null : <EntryRow ctx={ctx} pos={-1} prev={lastPos < 0 ? undefined : lastPos} live={live.entry} still={still} carry={heads.carry} />;
      const pos = posOfKey(key);
      return pos === undefined ? null : <EntryRow ctx={ctx} pos={pos} prev={prevOf.get(pos)} next={nextOf.get(pos)} still={still} named={heads.named.has(pos)} afterFold={afterFold.has(pos)} underFold={underFold.has(pos)} retries={retries.runs.get(pos)} />;
    },
    [ctx, prevOf, nextOf, runs, openRuns, live.entry, lastPos, still, heads, afterFold, underFold, foldGap, retries],
  );
  const onOlder = useCallback(() => {
    store.olderPage(project, agent);
  }, [store, project, agent]);
  // his own send goes to the bottom even when he had scrolled up
  const sent = pending.length;
  const last = useRef(sent);
  useEffect(() => {
    if (sent > last.current) listRef.current?.scrollToEnd();
    last.current = sent;
  }, [sent, listRef]);
  // his messages the hub holds until this agent's turn ends (rows::Agent.queued, draft): dashed
  // bubbles at the bottom, oldest first; a sent one becomes his normal bubble (messages-right v1)
  const queued = useAgents(project).find((a) => a.name === agent)?.queued;
  const tail = pending.length === 0 && (queued ?? []).length === 0 ? undefined : (
    <div className="th-tail">
      {pending.map((p) => (
        <PendingRow key={pendingKey(String(p.cid))} ctx={ctx} cid={p.cid} />
      ))}
      {(queued ?? []).map((q) => (
        <QueuedRow key={`q:${String(q.id)}`} ctx={ctx} q={q} />
      ))}
    </div>
  );
  if (!view.loaded && keys.length === 0 && tail === undefined) return <div className="th-list th-loading" data-testid="thread.loading" />;
  return <ThreadList ref={listRef} keys={keys} row={row} more={view.more} onOlder={onOlder} head={<Marker>older messages…</Marker>} tail={tail} testId="thread.list" keepKey={tkey} holdPart=".th-row" reactKey={reactKey} {...(onReading === undefined ? {} : { onReading })} />;
});

/** "3 agents · 1 at work · 2 waiting": a project's live agents (main out). Pure. */
export function countsOf(agents: readonly { main: boolean; archived: boolean; status: string; waits: number }[]): string {
  const live = agents.filter((a) => !a.main && !a.archived);
  if (live.length === 0) return '';
  const work = live.filter((a) => a.status === 'working').length;
  const waits = agents.reduce((n, a) => n + a.waits, 0);
  return [`${String(live.length)} ${live.length === 1 ? 'agent' : 'agents'}`, work > 0 ? `${String(work)} at work` : '', waits > 0 ? `${String(waits)} waiting for you` : ''].filter(Boolean).join(' · ');
}

/** An archived agent's thread is history only (tui-parity C47): no composer, a way to restore it. */
function History({ project, agent }: { project: string; agent: string }) {
  const store = useStore();
  return (
    <div className="th-history" data-testid="thread.archived">
      {/* designer's ⌘K screen (amb-win m_11920): '<name> is archived · ⌘⏎ restore' */}
      <span>{agent} is archived ·</span>
      <Button
        kind="ghost"
        onClick={() => {
          store.command({ cmd: 'unarchive', project, agent });
        }}
        testId="thread.restore"
      >
        <kbd>⌘⏎</kbd> restore
      </Button>
    </div>
  );
}

/**
 * Text selected in this thread's list: quoting while there is some (the
 * composer's key bar says typing asks about it) and the selection pop under it
 * (src/quote); a printable key (Space too) then puts it in the composer as a
 * quote chip at the caret followed by that key, ⌘' as the chip alone
 * (quote.ts), a click on the pop's ask words as the chip alone. Capture phase
 * on the window, before the window's own keys.
 */
function useThreadQuote(section: RefObject<HTMLElement | null>, composer: RefObject<ComposerActions | null>, agent: string): ThreadQuote {
  const [quoting, setQuoting] = useState(false);
  const [pop, setPop] = useState<PopAt | null>(null);
  const inList = useCallback((): Selection | undefined => {
    const sel = document.getSelection();
    if (sel === null || sel.isCollapsed || sel.rangeCount === 0) return undefined;
    const box = section.current?.querySelector('[data-testid="thread.list"]');
    return box != null && box.contains(sel.getRangeAt(0).commonAncestorContainer) ? sel : undefined;
  }, [section]);
  /** The selection into the composer as a quote chip at its caret; true when it went in. */
  const take = useCallback((): boolean => {
    const sel = inList();
    const acts = composer.current;
    if (sel === undefined || acts === null) return false;
    const text = quoteText(String(sel));
    if (text === '') return false;
    const at = sel.anchorNode instanceof Element ? sel.anchorNode : (sel.anchorNode?.parentElement ?? null);
    const row = at?.closest('.th-row');
    const from = quoteFrom(row?.getAttribute('data-kind'), row?.getAttribute('data-from'), agent);
    // the thread's selection goes first: cleared after, it would take the field's caret with it
    sel.removeAllRanges();
    setQuoting(false);
    setPop(null);
    acts.quote(text, from);
    return true;
  }, [inList, composer, agent]);
  useEffect(() => {
    const place = () => {
      const sel = inList();
      setQuoting(sel !== undefined && quoteText(String(sel)) !== '');
      setPop(sel === undefined ? null : popAt(sel.getRangeAt(0), section.current?.querySelector('[data-testid="thread.list"]') ?? null));
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;
      const k = quoteKey(e);
      if (k === undefined || inList() === undefined) return;
      e.preventDefault();
      e.stopPropagation();
      // a letter, a digit, Space: the quote, then that key (lead m_11968: Space starts it too)
      if (take() && k === 'type') composer.current?.insertText(e.key);
    };
    document.addEventListener('selectionchange', place);
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('selectionchange', place);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [section, composer, inList, take]);
  const copy = useCallback(() => {
    const sel = inList();
    if (sel !== undefined) copyText(quoteText(String(sel)));
  }, [inList]);
  return { quoting, pop, ask: take, copy };
}

interface PopAt {
  readonly x: number;
  readonly y: number;
}

interface ThreadQuote {
  readonly quoting: boolean;
  /** where the selection pop sits (fixed, the window's coordinates), or null: none */
  readonly pop: PopAt | null;
  readonly ask: () => boolean;
  readonly copy: () => void;
}

/** Height of the pop with its gap to the text (12 px words, 3 px padding). */
const POP_H = 30;

/**
 * Under the selection's last line, at its left; over its first line when the list has no room
 * under it (the thread opens at its end); kept inside the list; null when the selection is out
 * of view.
 */
function popAt(r: Range, list: Element | null): PopAt | null {
  const rects = Array.from(r.getClientRects()).filter((x) => x.width > 0 && x.height > 0);
  const first = rects[0];
  const last = rects.at(-1);
  const box = list?.getBoundingClientRect();
  if (first === undefined || last === undefined || box === undefined) return null;
  if (last.bottom < box.top || first.top > box.bottom) return null;
  const under = last.bottom + 6;
  const y = under + POP_H <= box.bottom ? under : Math.max(box.top + 4, first.top - POP_H);
  const line = under + POP_H <= box.bottom ? last : first;
  const left = Math.min(...rects.filter((x) => Math.abs(x.bottom - line.bottom) < 2).map((x) => x.left));
  return { x: Math.max(box.left + 8, Math.min(left, box.right - 280)), y };
}

/**
 * S36: the first card's one-time hint, over the thread's inbox strip; it goes when the
 * project has no open card any more (answered, closed) or after his next message.
 */
function CardHint({ project }: { project: string }) {
  const n = useProjects().find((p) => p.project === project)?.cards?.length ?? 0;
  const on = useHint('first_card', n > 0);
  useEffect(() => {
    if (n === 0) hintUsed('first_card');
  }, [n]);
  return on ? (
    <div className="th-hint">
      <Hint name="first_card" />
    </div>
  ) : null;
}

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
}: {
  project: string;
  agent: string;
  busy: boolean;
  to: string;
  /** the label line's right: 'esc write a plain message' while it answers (designer v6 s-wait) */
  toEnd?: string | undefined;
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
  const end: ReactNode =
    flash === null ? toEnd : (
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
  const onCommand = useCallback(
    (name: string, args: string) => {
      const at = { project, agent };
      const w = windowRun(name, args, at);
      if (w !== undefined) {
        if ('go' in w) router.go(w.go);
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
      if (answer !== null) {
        // msg-parts: his quotes and pastes go typed (the hub renders the model's text from them)
        store.answer(answer.project, answer.card, out.text, out.files, out.parts);
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
  return <Composer target={about === undefined ? `${project}/${agent}` : `${project}/${agent}/artifact/${about.id}`} busy={busy} sources={sources} store={keptStorage} to={to} {...(end === undefined ? {} : { toEnd: end })} onShiftTab={onShiftTab} placeholder={placeholder} onEmptyEnter={onEmptyEnter} {...(onEscape === undefined ? {} : { onEscape })} quoting={quoting} onSend={onSend} onCommand={onCommand} onStop={onStop} onReady={onReady} {...(keys === undefined ? {} : { keys })} lead={lead} testId="composer" />;
});

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
}

/** The inbox block's 'where am i' on bise's own view (no project, no agent: 'esc write a plain message'). */
export const HERE_BISE = { project: null, agent: null } as const;

/** The card his words answer while the block has one open, else none (an approval: none). Pure. */
export function answerOf(a: { project: string; answer: number | null } | null): CardAt | null {
  return a === null || a.answer === null ? null : { project: a.project, card: a.answer };
}

/** The composer's label while it answers a docked card: 'answering perf · which bench do you…' (main is bise). Pure. */
export function answeringLabel(c: { agent: string; question: string }): string {
  const who = c.agent === 'main' ? 'bise' : c.agent;
  const one = c.question.replace(/\s+/gu, ' ').trim();
  const cut = Array.from(one).length > 40 ? `${Array.from(one).slice(0, 39).join('').trimEnd()}…` : one;
  return `answering ${who} · ${cut}`;
}
