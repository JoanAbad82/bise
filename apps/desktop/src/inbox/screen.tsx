// The ⌘I inbox as the shell mounts it (route `inbox`): Inbox fed by the
// store. Every project's open cards come from the core's projects rows
// (a held hub's own cards, else its view.json's), so one list holds what
// waits on him everywhere; an answer is the hub's one /answer path
// (store.answer), a close the hub's one close path (store.close, the
// typed HubCmd close). ThreadInbox: the thread's inbox strip (Strip.tsx)
// fed the same way, for one project. Both show the demo tour's 'card' tip
// (bar L25, useTour) above the item that waits. Owner: amb-home.
import { useCallback, useMemo } from 'react';
import type { ProjectRow } from '@/proto';
import { useProjects, useStore, useVoiceAnswer } from '@/store';
import { useRouter } from '@/app/router';
import { Inbox } from './Inbox';
import { InboxStrip } from './Strip';
import { withConfirmOptions } from './model';
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

export function InboxScreen() {
  const rows = useProjects();
  const store = useStore();
  const router = useRouter();
  const { cards, names, homes } = useMemo(() => inboxOf(rows), [rows]);
  const voice = useVoiceAnswer();
  const inView = useCallback(
    (c: { project: string; card: number } | null) => {
      store.cardInView(c?.project ?? null, c?.card ?? null);
    },
    [store],
  );
  return (
    <Inbox
      cards={cards}
      names={names}
      homes={homes}
      voice={voice}
      tipOf={(c) => <CardTip project={c.project} />}
      ports={{
        inView,
        answer: (project, card, reply) => {
          store.answer(project, card, reply);
        },
        close: (project, card) => {
          store.close(project, card);
        },
        back: () => {
          router.back();
        },
        openPage: (url) => {
          void window.bise.openExternal(url);
        },
      }}
    />
  );
}

/** The strip as the thread mounts it: the project's open items from the store. */
export function ThreadInbox({ project }: { project: string }) {
  const rows = useProjects();
  const store = useStore();
  const router = useRouter();
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
        answer: (p, card, reply) => {
          store.answer(p, card, reply);
        },
        close: (p, card) => {
          store.close(p, card);
        },
        openInbox: () => {
          router.go({ screen: 'inbox' });
        },
        typeAt: () => {
          document.querySelector<HTMLElement>('[data-testid="composer.field"]')?.focus();
        },
        openPage: (url) => {
          void window.bise.openExternal(url);
        },
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
