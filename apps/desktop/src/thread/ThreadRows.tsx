// The thread's list: its rows (entries, his sends not landed yet, the live reply), the folded
// runs of messages between agents, and the first-run block over an empty main thread. Split out
// of ThreadScreen.tsx (the file cap); ThreadScreen mounts it. Owner: amb-win.
import { memo, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { Marker, Press } from '@/ds';
import type { ComposerActions } from '@/composer';
import { thread } from '@/proto/words.gen';
import { useAgents, useEntry, useProjects, usePending, useStore, useThreadOrder } from '@/store';
import { usePartialText } from '@/shared/partial';
import { LIVE, liveKey, useLive, useStill } from './live';
import { FirstRun, showsFirstRun } from '@/setup';
import { ThreadList, type ThreadListHandle } from './ThreadList';
import { EntryRow, PendingRow, gapOf, type RowCtx } from './rows';
import { entryKey, namedRows, pendingKey, placeSteered, posOfKey } from './entry';
import { NoProject } from './NoProject';
import { landedEchoes, retryRuns } from './tiers';
import { foldedRuns, runKey, runWords, withRuns } from './runs';
import { absolute } from './paths';
import { FoldsContext } from './folds';
import { FindMarkContext } from './findmark';
import { GapRow, isGapKey, withGap } from './gap';
import { useGoArtifact } from '@/artifacts/leave';

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

/**
 * The first-run text (bar L1 / M18, amb-kit's FirstRun) in main's thread
 * while he has said nothing there and main is the project's only agent: its
 * "show me what you can do" puts the words in the composer, selected (never
 * a send); then its last line says ⏎ tries it. Gone once he said something.
 */
export function FirstRunSlot({ tkey, project, composer, bise }: { tkey: string; project: string; composer: RefObject<ComposerActions | null>; bise: boolean }) {
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

export const Rows = memo(function Rows({ tkey, project, agent, bise, listRef, onReading }: { tkey: string; project: string; agent: string; bise: boolean; listRef: RefObject<ThreadListHandle | null>; onReading?: (reading: boolean) => void }) {
  const store = useStore();
  const view = useThreadOrder(tkey);
  const pending = usePending(tkey);
  // entries only: his sends not landed yet are the list's tail, outside the
  // virtual list, so his row is drawn in ⏎'s own frame (bar ⛔3: < 100 ms)
  // R13: more than 3 agent-to-agent messages in a row fold into '▸ 4 messages between 2 agents'
  // ctrl+o / ⌘E open and close every fold, the runs of messages between agents too (designer's
  // desktop-notices (c)): a press (its version) sets them all; a click still opens one in place
  const folds = useContext(FoldsContext);
  const foldAll = useSyncExternalStore(
    (l) => folds.subscribe(l),
    () => folds.get(),
  );
  const [runsOpen, setRunsOpen] = useState<{ open: ReadonlySet<number>; v: number }>(() => ({ open: new Set(), v: foldAll.v }));
  const openRuns = runsOpen.open;
  const setOpenRuns = useCallback((f: (s: ReadonlySet<number>) => ReadonlySet<number>) => {
    setRunsOpen((x) => ({ open: f(x.open), v: x.v }));
  }, []);
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
  // a press since the last render: every run listed now opens, or every one folds
  if (runsOpen.v !== foldAll.v) setRunsOpen({ open: foldAll.open ? new Set(runs.map((r) => r.start)) : new Set(), v: foldAll.v });
  // ⌘F's current match in a folded run: the run opens, so its row is there to reveal and mark
  // (find-scroll: ⏎ went to it and nothing moved, his 'ça reste au premier match')
  const mark = useContext(FindMarkContext);
  const findAt = useSyncExternalStore(
    (l) => mark.subscribe(l),
    () => mark.get(),
  );
  // once per match he goes to: closed again by his click, the fold stays closed
  const [openedFor, setOpenedFor] = useState<number | undefined>(undefined);
  const holder = findAt === undefined || findAt === openedFor ? undefined : runs.find((r) => !openRuns.has(r.start) && r.members.includes(findAt));
  if (holder !== undefined) {
    setOpenedFor(findAt);
    setOpenRuns((open) => new Set([...open, holder.start]));
  }
  // a window around a far entry (his answer weeks back, store/window.ts): the gap row between it
  // and the latest, under the window's last row
  const gap = view.gap;
  const listed = useMemo(() => withGap(withRuns(shown, runs, openRuns, entryKey), gap?.hi), [shown, runs, openRuns, gap?.hi]);
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
  const goArtifact = useGoArtifact();
  const ctx = useMemo<RowCtx>(
    () => ({
      tkey,
      project,
      agent,
      bise,
      onLink: openLink,
      onArtifact: (id: string) => {
        goArtifact(project, id);
      },
      ...(base === undefined
        ? {}
        : {
            onPath: (path: string, line?: number) => {
              void (window as Partial<Window>).bise?.openPath(absolute(path, base), line === undefined ? {} : { line });
            },
          }),
    }),
    [tkey, project, agent, bise, base, goArtifact],
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
      if (isGapKey(key)) return <GapRow project={project} agent={agent} />;
      if (key === LIVE) return live.entry === null ? null : <EntryRow ctx={ctx} pos={-1} prev={lastPos < 0 ? undefined : lastPos} live={live.entry} still={still} carry={heads.carry} />;
      const pos = posOfKey(key);
      return pos === undefined ? null : <EntryRow ctx={ctx} pos={pos} prev={prevOf.get(pos)} next={nextOf.get(pos)} still={still} named={heads.named.has(pos)} afterFold={afterFold.has(pos)} underFold={underFold.has(pos)} retries={retries.runs.get(pos)} />;
    },
    [ctx, prevOf, nextOf, runs, openRuns, setOpenRuns, live.entry, lastPos, still, heads, afterFold, underFold, foldGap, retries, project, agent],
  );
  const onOlder = useCallback(() => {
    store.olderPage(project, agent);
  }, [store, project, agent]);
  // scrolled up: the store keeps the entries near the one he reads (trim.ts), the far ones are paged back
  const onRead = useCallback(
    (key: string) => {
      // an entry's row, or a folded run's (its first entry)
      const pos = posOfKey(key) ?? (key.startsWith('r:') ? Number(key.slice(2)) : undefined);
      if (pos !== undefined) store.reading(project, agent, pos);
    },
    [store, project, agent],
  );
  // his own send goes to the bottom even when he had scrolled up
  const sent = pending.length;
  const last = useRef(sent);
  useEffect(() => {
    if (sent > last.current) listRef.current?.scrollToEnd();
    last.current = sent;
  }, [sent, listRef]);
  // his messages on their way; the ones the hub holds until the turn ends are the composer's
  // drawer (QueueDrawer.tsx), never bubbles here: a sent one lands as his normal bubble
  const tail = pending.length === 0 ? undefined : (
    <div className="th-tail">
      {pending.map((p) => (
        <PendingRow key={pendingKey(String(p.cid))} ctx={ctx} cid={p.cid} />
      ))}
    </div>
  );
  if (!view.loaded && keys.length === 0 && tail === undefined) return <div className="th-list th-loading" data-testid="thread.loading" />;
  // one list per thread (key): another agent's thread is a new mount, so it opens at its end or
  // where he left it (keep.ts), never with the last thread's scroll, stick or opened rows
  return <ThreadList key={tkey} ref={listRef} keys={keys} row={row} more={view.more} onOlder={onOlder} head={<Marker>{thread.older_messages}</Marker>} tail={tail} testId="thread.list" keepKey={tkey} holdPart=".th-row" reactKey={reactKey} onRead={onRead} {...(onReading === undefined ? {} : { onReading })} />;
});
