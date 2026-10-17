// The thread's queued messages for the composer's drawer (QueueDrawer.tsx, designer m_25146): the
// hub owns them (issue 23), this reads its Agent.queued and runs its three ops. Send now is
// queued_steer (the hub steers it in with its own id, architect m_25139); edit and delete are
// queued_take: edit puts his words (and chips, from his parts) back in the field once the hub gave
// them back; delete lets them go, and for 4 s the head offers 'undo' (queued again, at the end).
// ↑ in the empty field edits the newest. Nothing optimistic: a row leaves when the hub's agents
// event no longer lists it.
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type { ComposerActions } from '@/composer/actions';
import type { QueueSlot } from '@/composer/Composer';
import { entryOf } from '@/composer/entry';
import type { Outgoing } from '@/composer/message';
import { attachedCounts, segmentsOfParts } from '@/composer/partsback';
import { rowExtra, type QueueRow } from '@/composer/QueueDrawer';
import { useAgents, useCoreEvent, useStore } from '@/store/hooks';
import type { Ev } from '@/store/types';
import { shownName } from '@/agents/model';
import type { Part } from '@/proto';

/** how long the head offers 'undo' after a delete */
export const UNDO_MS = 4000;

type Queued = { readonly id: number; readonly text: string; readonly parts?: readonly Part[] };

/** A queued message as a drawer row: its words on one line, what goes with them after. Pure. */
export function queueRow(q: Queued): QueueRow {
  const { images, others } = attachedCounts(q.parts);
  const words = (q.parts === undefined ? q.text : q.parts.map((p) => (p.kind === 'text' ? p.text : ' ')).join('')).split(/\s+/u).filter((w) => w !== '').join(' ');
  return { id: q.id, text: words === '' ? q.text.split(/\s+/u).join(' ').trim() : words, extra: rowExtra(images, others) };
}

/** His taken-back message as a composer entry: his chips from his parts, else his words. Pure. */
export function takenEntry(t: { readonly text: string; readonly parts?: readonly Part[] }): string {
  return entryOf(t.parts !== undefined && t.parts.length > 0 ? segmentsOfParts(t.parts) : [{ kind: 'text', text: t.text }]);
}

export function useThreadQueue(project: string, agent: string, composer: RefObject<ComposerActions | null>): {
  readonly slot: QueueSlot;
  readonly onQueue: (o: Outgoing) => void;
  readonly onEditNewest: () => boolean;
} {
  const store = useStore();
  const queued = useAgents(project).find((a) => a.name === agent)?.queued;
  const rows = useMemo(() => (queued ?? []).map(queueRow), [queued]);
  // the one take in flight: its id and why (edit: into the field; delete: kept for undo)
  const asked = useRef<{ id: number; how: 'edit' | 'delete' } | null>(null);
  const [deleted, setDeleted] = useState<{ text: string; parts?: readonly Part[] } | null>(null);
  // the hub's answer to that take: his words (and parts), or a refusal (said on the line over the
  // composer; the row stays as the hub has it)
  useCoreEvent(
    useCallback(
      (ev: Ev) => {
        const a = asked.current;
        if (a === null) return;
        if (ev.ev === 'error' && ev.cmd === 'queued_take' && ev.project === project) {
          asked.current = null;
          return;
        }
        if (ev.ev !== 'queued_taken' || ev.project !== project || ev.agent !== agent || ev.id !== a.id) return;
        asked.current = null;
        const t = { text: ev.text, ...(ev.parts == null ? {} : { parts: ev.parts }) };
        if (a.how === 'edit') {
          composer.current?.putBack(takenEntry(t));
          composer.current?.focusEnd();
        } else setDeleted(t);
      },
      [project, agent, composer],
    ),
  );
  useEffect(() => {
    if (deleted === null) return;
    const t = window.setTimeout(() => {
      setDeleted(null);
    }, UNDO_MS);
    return () => {
      window.clearTimeout(t);
    };
  }, [deleted]);
  const take = useCallback(
    (id: number, how: 'edit' | 'delete') => {
      asked.current = { id, how };
      store.queuedTake(project, agent, id);
    },
    [store, project, agent],
  );
  const onQueue = useCallback(
    (o: Outgoing) => {
      store.send({ project, agent, text: o.text, mode: 'queued', ...(o.parts === undefined ? {} : { parts: o.parts }) });
    },
    [store, project, agent],
  );
  const onEditNewest = useCallback(() => {
    const id = rows.at(-1)?.id;
    if (id === undefined) return false;
    take(id, 'edit');
    return true;
  }, [take, rows]);
  const slot = useMemo<QueueSlot>(
    () => ({
      rows,
      who: shownName(agent),
      deleted: deleted !== null,
      onSteer: (id) => {
        store.queuedSteer(project, agent, id);
      },
      onEdit: (id) => {
        take(id, 'edit');
      },
      onDelete: (id) => {
        take(id, 'delete');
      },
      onUndo: () => {
        if (deleted === null) return;
        store.send({ project, agent, text: deleted.text, mode: 'queued', ...(deleted.parts === undefined ? {} : { parts: [...deleted.parts] }) });
        setDeleted(null);
      },
    }),
    [rows, agent, deleted, store, project, take],
  );
  return { slot, onQueue, onEditNewest };
}
