// One agent's thread: its head, its entries, its current step, ⌘F, and
// amb-web's composer. Owner: amb-win. Bar ⛔3 (a send shows at once),
// ⛔4 (readable answers), ⛔6 (esc stops the turn), 3.3 (writing to one
// agent: the composer's target is this agent), 3.4 (⌘F).
//
// What re-renders what (the reset's flicker rule): the list re-renders
// when its keys change (an entry or a send comes or goes); each row reads
// its own data; the composer is memo'd with stable props, so neither an
// entry, a step nor a send ever re-renders it.
import { memo, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { Button, Head, Marker } from '@/ds';
import { Composer, useComposerSources } from '@/composer';
import type { ComposerActions } from '@/composer/Brain';
import { quoteFrom, quoteKey, quoteText } from './quote';
import type { Outgoing } from '@/composer/message';
import { threadKey, useAgents, useCommands, useCoreState, useFiles, useProjects, usePending, useSkills, useStore, useThreadOrder, useTyping } from '@/store';
import { useMenuAction } from '@/app/menu';
import { useRouter } from '@/app/router';
import { pickCommands, slashLine, slashOf, windowRun } from './commands';
import { HELP_EVENT } from '@/app/keys';
import { MAIN } from '@/app/route';
import { FirstRun, showsFirstRun, Tip } from '@/setup';
import { useTour } from '@/setup/useTour';
import { takeQuotes } from '@/review/quote';
import { Hint, hintUsed, hintsUserMessage, useHint } from '@/app/hints';
import { ThreadInbox, takesWords, useStripCard } from '@/inbox';
import { dotOf, lineOf, shownName } from '@/agents/model';
import { Tune } from '@/agents/Tune';
import { ThreadList, type ThreadListHandle } from './ThreadList';
import { EntryRow, PendingRow, TypingLine, type RowCtx } from './rows';
import { entryKey, pendingKey, posOfKey } from './entry';
import { FindBar } from './FindBar';
import { createFindMark, FindMarkContext } from './findmark';
import { trackRoutes, useHeld } from './routes';
import { absolute } from './paths';
import { createFolds, FoldsContext } from './folds';
import { ThreadVoice, useVoiceHere } from '@/voicemode';

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
  // voice mode on this agent: its pane takes the composer's place (amb-home's src/voicemode)
  const voice = useVoiceHere(project, agent);
  const typing = useTyping(tkey);
  const busy = me?.status === 'working' || typing !== '';

  const [findOpen, setFindOpen] = useState(false);
  const [mark] = useState(createFindMark);
  const [folds] = useState(createFolds);
  const list = useRef<ThreadListHandle>(null);
  // his bug 3: a selection in the thread, then a key, quotes it in the composer
  const section = useRef<HTMLElement>(null);
  const composer = useRef<ComposerActions | null>(null);
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
  const quoting = useThreadQuote(section, composer, agent);
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

  const onKeyDown = (e: KeyboardEvent) => {
    // esc while bise holds his words: keep them with bise (route_cancel)
    if (e.key === 'Escape' && !e.defaultPrevented && held !== undefined && !findOpen) {
      e.preventDefault();
      store.command({ cmd: 'route_cancel', project: held.home, rid: held.rid });
    }
    // the composer leaves a plain esc unhandled while busy (amb-web m_9540)
    else if (e.key === 'Escape' && !e.defaultPrevented && busy && !findOpen) {
      e.preventDefault();
      stop();
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
  // inbox card v2 item 7 (ambient m_11273, amb-home 98ac9ea7): while the strip's card is docked
  // and takes words, the composer answers it; esc makes it a plain message again (that card);
  // an approval never takes words: his words stay a message and the card keeps waiting
  const docked = useStripCard(project);
  const dockedKey = docked === null ? null : `${docked.project}-${String(docked.id)}`;
  const [plainFor, setPlainFor] = useState<string | null>(null);
  const answering = docked !== null && takesWords(docked) && plainFor !== dockedKey ? docked : null;
  const onKeyDownCapture = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || answering === null || dockedKey === null) return;
    if (!(e.target instanceof HTMLElement) || e.target.closest('[data-testid="composer.field"]') === null) return;
    e.preventDefault();
    e.stopPropagation();
    setPlainFor(dockedKey);
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
  // its context gauge, the hub's words as sent (the TUI's divider: '42k · 17%')
  const gauge = me?.usage?.words ?? '';
  const sub = (
    <>
      {agent === 'main' && countsLink !== null ? (
        lead === '' ? (
          countsLink
        ) : (
          <>
            {lead} · {countsLink}
          </>
        )
      ) : (
        [lead, !bise && agent !== 'main' && me ? lineOf(me) : ''].filter(Boolean).join(' · ')
      )}
      {gauge !== '' && (
        <span className="th-gauge" data-testid="thread.usage">
          {' · '}
          {gauge}
        </span>
      )}
    </>
  );

  return (
    <FoldsContext value={folds}>
    <FindMarkContext value={mark}>
      <section ref={section} className="th-screen" data-testid="thread.screen" data-project={project} data-agent={agent} data-quoting={quoting} onKeyDown={onKeyDown} onKeyDownCapture={onKeyDownCapture}>
        <Head
          title={headTitle}
          sub={sub}
          pearl={bise ? 22 : undefined}
          dot={bise || !me ? undefined : dotOf(me.status)}
          end={
            me && !me.archived && !bise ? (
              <Button
                kind="ghost"
                title={me.main ? 'model, reasoning' : 'rename, model, reasoning'}
                onClick={() => {
                  setTuning((x) => !x);
                }}
                testId="thread.more"
              >
                …
              </Button>
            ) : undefined
          }
        />
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
        <Rows tkey={tkey} project={project} agent={agent} bise={bise} listRef={list} />
        {agent === MAIN && me?.archived !== true && <FirstRunSlot tkey={tkey} project={project} composer={composer} />}
        {stopping && <Marker>stopping {agent}…</Marker>}
        <TypingLine text={typing} />
        {/* W7/K24: the project's open items over the composer's divider (amb-home f44d082e) */}
        <CardHint project={project} />
        <ThreadInbox project={project} />
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
            to={answering === null ? `you → ${title}` : answeringLabel(answering)}
            placeholder={answering === null ? undefined : 'your answer, then ⏎'}
            answer={answering === null ? null : answering.id}
            onStop={stop}
            quoting={quoting}
            onReady={onComposer}
            onSent={onSent}
          />
          </>
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
function FirstRunSlot({ tkey, project, composer }: { tkey: string; project: string; composer: RefObject<ComposerActions | null> }) {
  const store = useStore();
  const view = useThreadOrder(tkey);
  const pending = usePending(tkey);
  const live = useAgents(project).filter((a) => !a.archived).length;
  const [ready, setReady] = useState(false);
  // his words in the thread: an entry of his, or a send of his on its way
  const said = pending.length > 0 || view.order.some((pos) => store.entry(tkey, pos)?.kind === 'you');
  if (!view.loaded || !showsFirstRun(said, live)) return null;
  return (
    <FirstRun
      ready={ready}
      onFill={(text) => {
        composer.current?.fill(text);
        setReady(true);
      }}
    />
  );
}

const Rows = memo(function Rows({ tkey, project, agent, bise, listRef }: { tkey: string; project: string; agent: string; bise: boolean; listRef: RefObject<ThreadListHandle | null> }) {
  const store = useStore();
  const view = useThreadOrder(tkey);
  const pending = usePending(tkey);
  // entries only: his sends not landed yet are the list's tail, outside the
  // virtual list, so his row is drawn in ⏎'s own frame (bar ⛔3: < 100 ms)
  const keys = useMemo(() => view.order.map(entryKey), [view]);
  // relative paths in its answers are under the agent's folder: its worktree, else the project's
  const base = useBase(project, agent);
  const ctx = useMemo<RowCtx>(
    () => ({
      tkey,
      project,
      agent,
      bise,
      onLink: openLink,
      ...(base === undefined
        ? {}
        : {
            onPath: (path: string, line?: number) => {
              void (window as Partial<Window>).bise?.openPath(absolute(path, base), line === undefined ? {} : { line });
            },
          }),
    }),
    [tkey, project, agent, bise, base],
  );
  const row = useCallback(
    (key: string) => {
      const pos = posOfKey(key);
      return pos === undefined ? null : <EntryRow ctx={ctx} pos={pos} />;
    },
    [ctx],
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
  const tail = pending.length === 0 ? undefined : (
    <div className="th-tail">
      {pending.map((p) => (
        <PendingRow key={pendingKey(String(p.cid))} ctx={ctx} cid={p.cid} />
      ))}
    </div>
  );
  if (!view.loaded && keys.length === 0 && tail === undefined) return <div className="th-list th-loading" data-testid="thread.loading" />;
  return <ThreadList ref={listRef} keys={keys} row={row} more={view.more} onOlder={onOlder} head={<Marker>older messages…</Marker>} tail={tail} testId="thread.list" />;
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
      <span>{agent} is archived: its thread is history only</span>
      <Button
        kind="ghost"
        onClick={() => {
          store.command({ cmd: 'unarchive', project, agent });
        }}
        testId="thread.restore"
      >
        restore it
      </Button>
    </div>
  );
}

/** amb-web's composer, aimed at this agent; its props stay stable while the thread moves. */
/**
 * Text selected in this thread's list: true while there is some (the
 * composer's key bar says typing asks about it); a printable key then puts it
 * in the composer as a quote chip followed by that key, ⌘' as the chip alone
 * (quote.ts). Capture phase on the window, before the window's own keys.
 */
function useThreadQuote(section: RefObject<HTMLElement | null>, composer: RefObject<ComposerActions | null>, agent: string): boolean {
  const [quoting, setQuoting] = useState(false);
  useEffect(() => {
    const inList = (): Selection | undefined => {
      const sel = document.getSelection();
      if (sel === null || sel.isCollapsed || sel.rangeCount === 0) return undefined;
      const box = section.current?.querySelector('[data-testid="thread.list"]');
      return box != null && box.contains(sel.getRangeAt(0).commonAncestorContainer) ? sel : undefined;
    };
    const onSel = () => {
      setQuoting(inList() !== undefined);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;
      const k = quoteKey(e);
      if (k === undefined) return;
      const sel = inList();
      const acts = composer.current;
      if (sel === undefined || acts === null) return;
      const text = quoteText(String(sel));
      if (text === '') return;
      const at = sel.anchorNode instanceof Element ? sel.anchorNode : (sel.anchorNode?.parentElement ?? null);
      const row = at?.closest('.th-row');
      e.preventDefault();
      e.stopPropagation();
      const from = quoteFrom(row?.getAttribute('data-kind'), row?.getAttribute('data-from'), agent);
      // the thread's selection goes first: cleared after, it would take the field's caret with it
      sel.removeAllRanges();
      setQuoting(false);
      acts.quote(text, from);
      if (k === 'type') acts.insertText(e.key);
    };
    document.addEventListener('selectionchange', onSel);
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('selectionchange', onSel);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [section, composer, agent]);
  return quoting;
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

const ThreadComposer = memo(function ThreadComposer({
  project,
  agent,
  busy,
  to,
  placeholder,
  answer,
  onStop,
  quoting,
  onReady,
  onSent,
}: {
  project: string;
  agent: string;
  busy: boolean;
  to: string;
  /** the field's words when empty (the composer's own 'write to …' when none) */
  placeholder: string | undefined;
  /** the docked card his words answer (item 7), else none */
  answer: number | null;
  onStop: () => void;
  quoting: boolean;
  onReady: (a: ComposerActions) => void;
  /** his send went (the demo tour's step) */
  onSent: () => void;
}) {
  const store = useStore();
  const router = useRouter();
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
      const sl = out.files.length === 0 ? slashLine(out.text) : null;
      if (sl !== null) {
        onCommand(sl.name, sl.args);
        return;
      }
      // the docked card's answer: his words, the hub's one /answer path (files go as a message)
      if (answer !== null && out.files.length === 0) {
        store.answer(project, answer, out.text);
        onSent();
        return;
      }
      // ⏎ while a turn runs steers it ('now', as the TUI); the files he
      // attached or dropped go with it (amb-core item H: the hub renders them
      // once, an image as a marker the model sees). Tab's queue: amb-web's
      store.send({ project, agent, text: out.text, mode: 'now', ...(out.files.length > 0 ? { files: [...out.files] } : {}) });
      onSent();
    },
    [store, project, agent, onSent, onCommand, answer],
  );
  return <Composer target={`${project}/${agent}`} busy={busy} sources={sources} to={to} placeholder={placeholder} quoting={quoting} onSend={onSend} onCommand={onCommand} onStop={onStop} onReady={onReady} testId="composer" />;
});

/** The composer's label while it answers a docked card: 'answering perf · which bench do you…' (main is bise). Pure. */
export function answeringLabel(c: { agent: string; question: string }): string {
  const who = c.agent === 'main' ? 'bise' : c.agent;
  const one = c.question.replace(/\s+/gu, ' ').trim();
  const cut = Array.from(one).length > 40 ? `${Array.from(one).slice(0, 39).join('').trimEnd()}…` : one;
  return `answering ${who} · ${cut}`;
}
