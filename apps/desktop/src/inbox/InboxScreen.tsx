// The inbox screen as the shell mounts it (route inbox/all, the sidebar's '? inbox' row): every
// project's open cards (the same list the block above the composer shows, blockList) and the
// hub's records of what he answered or what was withdrawn (useInboxRecords), into InboxView
// (List.tsx). ⏎ on a waiting item opens it above this screen's composer (openInbox, as ⌘I); a past
// one goes to his answer: the thread at it with one th-flash, a history step (answered-link's
// openAnswer, the one jump), or the page at its block. Owner: inbox-screen.
import { useCallback, useMemo } from 'react';
import { useActed, useProjects, useStore } from '@/store';
import { useRouter } from '@/app/router';
import { useKeptScroll } from '@/app/keep';
import { actedKeys, threadKey, type Store } from '@/store';
import { blockList, openInbox } from './Block';
import { InboxView } from './List';
import { openAnswer } from '@/thread/answerlink';
import { useInboxRecords } from './records';
import type { InboxRecord, Jump } from './past';

export function InboxScreen() {
  const rows = useProjects();
  const acted = useActed();
  const store = useStore();
  const router = useRouter();
  const records = useInboxRecords(rows);
  useKeptScroll('inbox', () => document.querySelector<HTMLElement>('[data-testid="inbox.list"]'));
  const cards = useMemo(() => blockList(rows, actedKeys(acted)), [rows, acted]);
  const names = useMemo(() => Object.fromEntries(rows.map((r) => [r.project, r.name])), [rows]);
  const projects = useMemo(() => rows.map((r) => ({ project: r.project, name: r.name })), [rows]);
  const jump = useCallback(
    (j: Jump) => {
      if (j.kind === 'thread') {
        openAnswer(router, { project: j.project, agent: j.agent, card: j.card });
        return;
      }
      const url = store.pages(j.project)?.items.find((p) => p.id === j.page)?.url;
      if (url !== undefined) void window.bise.openExternal(j.block === undefined ? url : `${url.replace(/#.*$/u, '')}#${j.block}`);
    },
    [router, store],
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
      ports={{
        answer: (project, card) => {
          openInbox({ project, card });
        },
        jump,
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
  for (const pos of store.threadOrder(key).order) {
    if (pos <= at.pos) continue;
    const e = store.entry(key, pos);
    if (e?.kind === 'agent' && e.text.trim() !== '') return e.text.trim().split('\n')[0];
  }
  return undefined;
}
