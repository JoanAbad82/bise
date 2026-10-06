// The ⌘I inbox as the shell mounts it (route `inbox`): Inbox fed by the
// store. Every project's open cards come from the core's projects rows
// (a held hub's own cards, else its view.json's), so one list holds what
// waits on him everywhere; an answer is the hub's one /answer path
// (store.answer). Close waits for the typed HubCmd close (amb-core): until
// then the inbox has no close key or button. Owner: amb-home.
import { useMemo } from 'react';
import type { ProjectRow } from '@/proto';
import { useProjects, useStore } from '@/store';
import { useRouter } from '@/app/router';
import { Inbox } from './Inbox';

/** Every project's cards, and each project's name, from the projects rows. */
export function inboxOf(rows: readonly ProjectRow[]) {
  return {
    cards: rows.flatMap((r) => r.cards ?? []),
    names: Object.fromEntries(rows.map((r) => [r.project, r.name])),
  };
}

export function InboxScreen() {
  const rows = useProjects();
  const store = useStore();
  const router = useRouter();
  const { cards, names } = useMemo(() => inboxOf(rows), [rows]);
  return (
    <Inbox
      cards={cards}
      names={names}
      ports={{
        answer: (project, card, reply) => {
          store.answer(project, card, reply);
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
