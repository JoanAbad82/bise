// The agent's rename, inline in the window bar's title (bise fait mac, nm-menus m_42167): the '…'
// menu's Rename asks the screen that shows the agent (app/menus/actions.ts useEntityAction); the
// thread in view takes it and puts a field in place of the bar's title (nm-frame's <InTitle>).
// ⏎ or a click away sends the hub's rename (agents/actions.ts renameAgent, today's command), esc
// keeps the name; once the hub's rows have the new name the thread follows it (its route). Only
// the thread that is the route's screen takes it (a thread in a panel's tab has no bar title).
// Owner: nm-thread.
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/ds';
import type { Agent } from '@/proto';
import { thread } from '@/proto/words.gen';
import { useStore } from '@/store';
import { InTitle } from '@/app/barslot';
import { useEntityAction } from '@/app/menus/actions';
import { useRouter } from '@/app/router';
import { nameProblem, renameAgent } from '@/agents/actions';

/** What a rename does with his words: send `to`, or nothing (empty, the same name, a bad one). Pure. */
export function renameTo(words: string | null, from: string, agents: readonly Agent[]): string | null {
  const to = words?.trim() ?? '';
  if (to === '' || to === from) return null;
  return nameProblem(to, agents, from) === undefined ? to : null;
}

/** The menu's Rename for this thread's agent (`take`: this thread is the route's screen), and its field. */
export function TitleRename({ project, agent, agents, take }: { project: string; agent: string; agents: readonly Agent[]; take: boolean }) {
  const store = useStore();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  // the name sent, until the hub's rows have it: then the thread follows it (once)
  const sent = useRef<string | null>(null);
  useEntityAction('rename', (e) => {
    if (!take || e.kind !== 'agent' || e.project !== project || e.agent !== agent) return false;
    setEditing(true);
    return true;
  });
  useEffect(() => {
    const to = sent.current;
    if (to !== null && agents.some((a) => a.name === to)) {
      sent.current = null;
      router.go({ screen: 'thread', project, agent: to });
    }
  }, [agents, router, project]);
  if (!editing) return null;
  const done = (words: string | null) => {
    setEditing(false);
    const to = renameTo(words, agent, agents);
    if (to !== null && renameAgent(store, project, agent, to)) sent.current = to;
  };
  return (
    <InTitle>
      <Input
        look="th-rename"
        autoFocus
        defaultValue={agent}
        aria-label={thread.rename_field({ agent })}
        onFocus={(e) => {
          e.currentTarget.select();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') done(e.currentTarget.value);
          else if (e.key === 'Escape') {
            e.stopPropagation();
            done(null);
          }
        }}
        onBlur={(e) => {
          done(e.currentTarget.value);
        }}
        data-testid="thread.rename"
      />
    </InTitle>
  );
}
