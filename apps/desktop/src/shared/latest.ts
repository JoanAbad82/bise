// The core's last state events, kept by main (src/main/core/ipc.ts) for a window that loads after
// they went out (amb-tools m_9703: the sidebar stayed empty when the window
// loaded after the first `projects`). Pure. A state event replaces the one
// before it with the same tag (and project); live-only events (a thread's
// entries and typing, a diff, routes, job_end, errors, open) are never kept:
// a window asks for those itself (subscribe, diff...).

/** The tags whose last event is the state now, per project when they carry one. */
export const STATE_TAGS: ReadonlySet<string> = new Set([
  'projects',
  'prefs',
  'accounts',
  'found',
  'welcome',
  'agents',
  'cards',
  'artifacts',
  // a project's live scheduled tasks, whole each time (amb-feed 284bd5c6)
  'scheduled',
  'worktrees',
  'dev_servers',
  'merged',
  'jobs',
  'plugins',
  // each role's model: sent at the core's start, so a window that loads later needs it kept
  // (settings' roles, the voice bar's 'Voxtral · Mistral')
  'roles',
  // the sidebar's '◷ scheduled n' and each agent's next wake (desktop-screens v6)
  'scheduled',
  // a project's hub refused this core: kept until its hub welcomes it again
  'hub_refused',
  // this core can start no hub (its runtime is missing): said once, so a window that loads
  // later needs it kept (CoreLine, settings › projects)
  'broken',
  // a project's approvals mode, checker and rules, whole each time (bar V8/W21): the composer's
  // divider reads its mode and ⇧⇥ flips it (TP-R6); a window that loads after the hub said it
  // showed no mode at all
  'approvals',
]);

export class Latest {
  private readonly last = new Map<string, Record<string, unknown>>();

  /** Keeps `ev` when it is a state event (the newest per tag and project). */
  keep(ev: Record<string, unknown>): void {
    const tag = ev['ev'];
    if (typeof tag !== 'string' || !STATE_TAGS.has(tag)) return;
    const project = typeof ev['project'] === 'string' ? ev['project'] : '';
    // re-inserted: the snapshot keeps the order they last changed in
    const key = `${tag} ${project}`;
    this.last.delete(key);
    this.last.set(key, ev);
    // its hub took this core again (hub_retry): the refusal no longer holds
    if (tag === 'welcome') this.last.delete(`hub_refused ${project}`);
  }

  /** The kept events, oldest change first: replayed in order they give the state now. */
  snapshot(): Record<string, unknown>[] {
    return [...this.last.values()];
  }

  /** The core restarted: what it said before no longer holds. */
  clear(): void {
    this.last.clear();
  }
}
