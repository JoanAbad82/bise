// One inbox (designer m_19631): there is no ⌘I screen any more, the block at
// the bottom of every view (Block.tsx) holds what waits on him everywhere.
// inboxOf reads every project's open cards from the core's projects rows (a
// held hub's own cards, else its view.json's). ThreadInbox: the thread's
// inbox strip (Strip.tsx) fed from the store for one project; an answer is
// the hub's one /answer path (store.answer), a close the hub's one close path
// (store.close); its 'open the inbox' opens the block in place. It shows the
// demo tour's 'card' tip (bar L25, useTour) above the item that waits.
// Owner: amb-home.
import { useCallback, useMemo } from 'react';
import type { ProjectRow } from '@/proto';
import { useProjects, useStore } from '@/store';
import { InboxStrip } from './Strip';
import { openInbox } from './Block';
import { withConfirmOptions } from './model';
import { useOptAct } from './optAct';
import { Tip } from '@/setup';
import { useTour } from '@/setup/useTour';

/** Every project's cards, and each project's name, from the projects rows. */
export function inboxOf(rows: readonly ProjectRow[]) {
  return {
    // a gated call's options are the TUI's (the hub sends none): withConfirmOptions
    cards: rows.flatMap((r) => (r.cards ?? []).map(withConfirmOptions)),
    names: Object.fromEntries(rows.map((r) => [r.project, r.name])),
    homes: new Set(rows.filter((r) => r.home).map((r) => r.project)),
  };
}

/** The strip as the thread mounts it: the project's open items from the store. */
export function ThreadInbox({ project }: { project: string }) {
  const rows = useProjects();
  const store = useStore();
  const doAct = useOptAct();
  const row = rows.find((r) => r.project === project);
  const cards = useMemo(() => (row?.cards ?? []).map(withConfirmOptions), [row]);
  const inView = useCallback(
    (c: { project: string; card: number } | null) => {
      store.cardInView(c?.project ?? null, c?.card ?? null);
    },
    [store],
  );
  return (
    <InboxStrip
      project={project}
      {...(row ? { name: row.name, home: row.home } : {})}
      cards={cards}
      tip={<CardTip project={project} />}
      ports={{
        // answer-in-thread A: an answer's row says 'answered from the inbox screen'; the window stays here
        pick: (p, card, n) => store.do({ i: 'pick', project: p, card, n, from: { at: null, inbox: true } }),
        close: (p, card) => {
          store.do({ i: 'close', project: p, card });
        },
        openInbox: () => {
          openInbox();
        },
        typeAt: () => {
          document.querySelector<HTMLElement>('[data-testid="composer.field"]')?.focus();
        },
        act: doAct,
        inView,
      }}
    />
  );
}

/** bar L25: the demo tour's 'card' tip (amb-kit's words, amb-win's one tour per
 * project), above the item that waits: in the thread's strip and over ⌘I's open item. */
function CardTip({ project }: { project: string }) {
  const { tip, snap } = useTour(project);
  return tip === 'card' ? <Tip tip="card" snap={snap} /> : null;
}
