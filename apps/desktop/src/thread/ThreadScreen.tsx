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
import { Head, Marker } from '@/ds';
import { Composer, useComposerSources } from '@/composer';
import type { Outgoing } from '@/composer/message';
import { threadKey, useAgents, useCoreState, usePending, useStore, useThreadOrder, useTyping } from '@/store';
import { useMenuAction } from '@/app/menu';
import { dotOf, lineOf } from '@/agents/model';
import { ThreadList, type ThreadListHandle } from './ThreadList';
import { EntryRow, PendingRow, TypingLine, type RowCtx } from './rows';
import { entryKey, pendingKey, posOfKey } from './entry';
import { FindBar } from './FindBar';
import { createFindMark, FindMarkContext } from './findmark';
import { trackRoutes, useHeld } from './routes';
import { createFolds, FoldsContext } from './folds';

export interface ThreadScreenProps {
  project: string;
  agent: string;
  /** bise's own main: 'bise' with its pearl */
  bise?: boolean;
  /** the project's name for the head and the composer's 'you → …' */
  projectName?: string;
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
  const typing = useTyping(tkey);
  const busy = me?.status === 'working' || typing !== '';

  const [findOpen, setFindOpen] = useState(false);
  const [mark] = useState(createFindMark);
  const [folds] = useState(createFolds);
  const list = useRef<ThreadListHandle>(null);
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

  const title = bise ? 'bise' : agent === 'main' ? (projectName ?? project) : agent;
  const sub = bise ? 'every project' : [agent === 'main' ? 'main' : (projectName ?? project), me ? lineOf(me) : ''].filter(Boolean).join(' · ');

  return (
    <FoldsContext value={folds}>
    <FindMarkContext value={mark}>
      <section className="th-screen" data-testid="thread.screen" data-project={project} data-agent={agent} onKeyDown={onKeyDown}>
        <Head title={title} sub={sub} pearl={bise ? 22 : undefined} dot={bise || !me ? undefined : dotOf(me.status)} />
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
        <Rows tkey={tkey} project={project} agent={agent} bise={bise} listRef={list} />
        {stopping && <Marker>stopping {agent}…</Marker>}
        <TypingLine text={typing} />
        <ThreadComposer project={project} agent={agent} busy={busy} to={`you → ${title}`} onStop={stop} />
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
const Rows = memo(function Rows({ tkey, project, agent, bise, listRef }: { tkey: string; project: string; agent: string; bise: boolean; listRef: RefObject<ThreadListHandle | null> }) {
  const store = useStore();
  const view = useThreadOrder(tkey);
  const pending = usePending(tkey);
  const keys = useMemo(() => [...view.order.map(entryKey), ...pending.map((p) => pendingKey(String(p.cid)))], [view, pending]);
  const ctx = useMemo<RowCtx>(() => ({ tkey, project, agent, bise, onLink: openLink }), [tkey, project, agent, bise]);
  const row = useCallback(
    (key: string) => {
      const pos = posOfKey(key);
      return pos === undefined ? <PendingRow ctx={ctx} cid={Number(key.slice(2))} /> : <EntryRow ctx={ctx} pos={pos} />;
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
  if (!view.loaded && keys.length === 0) return <div className="th-list th-loading" data-testid="thread.loading" />;
  return <ThreadList ref={listRef} keys={keys} row={row} more={view.more} onOlder={onOlder} head={<Marker>older messages…</Marker>} testId="thread.list" />;
});

/** amb-web's composer, aimed at this agent; its props stay stable while the thread moves. */
const ThreadComposer = memo(function ThreadComposer({ project, agent, busy, to, onStop }: { project: string; agent: string; busy: boolean; to: string; onStop: () => void }) {
  const store = useStore();
  const sources = useComposerSources(project);
  const onSend = useCallback(
    (out: Outgoing) => {
      // ⏎ while a turn runs steers it ('now', as the TUI); files are @paths
      // in the words already. Tab's queue: amb-web's next step (mode on Outgoing)
      store.send({ project, agent, text: out.text, mode: 'now' });
    },
    [store, project, agent],
  );
  return <Composer target={`${project}/${agent}`} busy={busy} sources={sources} to={to} onSend={onSend} onStop={onStop} testId="composer" />;
});
