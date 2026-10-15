// The inbox screen as the shell mounts it (route inbox/all, the sidebar's '? inbox' row): every
// project's open cards (the same list the block above the composer shows, blockList) and the
// hub's records of what he answered or what was withdrawn (useInboxRecords), into InboxView
// (List.tsx). ⏎ on a waiting item opens it above this screen's composer (openInbox, as ⌘I); on a
// past one, the item whole in the pane beside the list; ⌘⏎ goes to his answer: the thread at that
// very entry (its record's pos: the store reads the page around it, however old) with one
// th-flash, a history step (answered-link's openAnswer, the one jump), or the page in the window
// at its block (notif-open's useOptAct). Owner: inbox-screen.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useProjects, useStore, useThreadOrder } from '@/store';
import { useRouter } from '@/app/router';
import { useKeptScroll } from '@/app/keep';
import { threadKey, type Store } from '@/store';
import { openInbox } from './Block';
import { useOptAct } from './optAct';
import { useWaitingList } from './waiting';
import { InboxView } from './List';
import { openAnswer } from '@/thread/answerlink';
import { useInboxRecords } from './records';
import type { InboxRecord, Jump } from './past';

export function InboxScreen() {
  const rows = useProjects();
  const store = useStore();
  const router = useRouter();
  const records = useInboxRecords(rows);
  useKeptScroll('inbox', () => document.querySelector<HTMLElement>('[data-testid="inbox.list"]'));
  // the block's own list, bise's notifications ask included: one inbox, one number (designer m_25639)
  const cards = useWaitingList();
  const names = useMemo(() => Object.fromEntries(rows.map((r) => [r.project, r.name])), [rows]);
  const projects = useMemo(() => rows.map((r) => ({ project: r.project, name: r.name })), [rows]);
  // the detail's thread, read while it shows: its next line ('perf went on: …') comes with it
  const [looked, setLooked] = useState<InboxRecord | null>(null);
  const at = looked?.thread ?? null;
  const lookKey = at === null || looked === null ? '' : threadKey(looked.project, at.agent);
  useThreadOrder(lookKey);
  useEffect(() => {
    if (looked === null || at === null) return;
    store.subscribeThread(looked.project, at.agent);
    return () => {
      store.unsubscribeThread(looked.project, at.agent);
    };
  }, [store, looked, at]);
  const optAct = useOptAct();
  const jump = useCallback(
    (j: Jump) => {
      if (j.kind === 'thread') {
        openAnswer(router, { project: j.project, agent: j.agent, card: j.card, ...(j.pos === undefined ? {} : { pos: j.pos }) });
        return;
      }
      // a page answer: the page in the window beside the thread, at the block he answered (notif-open's useOptAct)
      optAct(j.project, { act: 'open', artifact: j.page, at: j.block ?? null });
    },
    [router, optAct],
  );
  return (
    <InboxView
      cards={cards}
      records={records.items}
      answered={records.answered}
      {...(records.more ? { onEnd: records.older } : {})}
      names={names}
      projects={projects}
      nextOf={(r) => nextLine(store, r)}
      onDetail={setLooked}
      pageTitle={(project, page) => store.artifacts(project).find((a) => a.id === page)?.title}
      ports={{
        answer: (project, card) => {
          openInbox({ project, card });
        },
        jump,
        openPage: (project, page, block) => {
          optAct(project, { act: 'open', artifact: page, at: block ?? null });
        },
      }}
    />
  );
}

/**
 * The asker's first line after his answer (the detail's 'perf went on: …'), when the store already
 * holds that part of its thread; none otherwise (inbox-record keeps it out of the record: the
 * thread is its owner).
 */
function nextLine(store: Store, r: InboxRecord): string | undefined {
  const at = r.thread;
  if (at == null) return undefined;
  const key = threadKey(r.project, at.agent);
  const view = store.threadOrder(key);
  // his answer's part of the thread isn't held yet: what came after it isn't known
  const first = view.order[0];
  if (first === undefined || at.pos < first) return undefined;
  for (const pos of view.order) {
    if (pos <= at.pos) continue;
    // past the window's gap: not what came next (store/window.ts)
    if (view.gap !== undefined && at.pos <= view.gap.lo && pos >= view.gap.hi) return undefined;
    const e = store.entry(key, pos);
    if (e?.kind === 'agent' && e.text.trim() !== '') return e.text.trim().split('\n')[0];
  }
  return undefined;
}
