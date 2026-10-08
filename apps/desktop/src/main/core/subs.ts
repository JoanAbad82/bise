// Thread subscriptions across windows (his bug 6 / R18, amb-web m_12869):
// the core keeps ONE set of subscribed agents per project for the whole app
// (rust/tui/src/ambient/core/hubs.rs track()), but every window (the main
// window, the capsule) subscribes on its own. So main counts who holds each
// project/agent: a subscribe always goes to the core (it answers that
// window's page), an unsubscribe only when no other window still holds it,
// and a window gone (closed, crashed, reloaded) gives up its holds the same
// way. A core that starts again knows nothing: every window says its
// subscriptions again (the store's sayAgain), so the counts start over.
// Pure: ipc.ts gives it the window ids and does the sending.
// Owner: amb-core.

type Cmd = Record<string, unknown>;

const key = (project: string, agent: string): string => `${project}/${agent}`;

export class SubRoutes {
  /** project/agent -> the windows (webContents ids) that hold it */
  private readonly holders = new Map<string, { project: string; agent: string; windows: Set<number> }>();

  /** A window's command: what goes to the core (the command itself, or nothing for an unsubscribe others still need). */
  sent(window: number, cmd: unknown): unknown[] {
    if (typeof cmd !== 'object' || cmd === null) return [cmd];
    const c = cmd as Cmd;
    if ((c.cmd !== 'subscribe' && c.cmd !== 'unsubscribe') || typeof c.project !== 'string' || typeof c.agent !== 'string') return [cmd];
    const k = key(c.project, c.agent);
    if (c.cmd === 'subscribe') {
      const h = this.holders.get(k) ?? { project: c.project, agent: c.agent, windows: new Set<number>() };
      h.windows.add(window);
      this.holders.set(k, h);
      return [cmd];
    }
    const h = this.holders.get(k);
    if (h === undefined) return [cmd];
    h.windows.delete(window);
    if (h.windows.size > 0) return [];
    this.holders.delete(k);
    return [cmd];
  }

  /** A window gone: an unsubscribe for each thread no other window holds. */
  gone(window: number): Cmd[] {
    const out: Cmd[] = [];
    for (const [k, h] of this.holders) {
      if (!h.windows.delete(window) || h.windows.size > 0) continue;
      this.holders.delete(k);
      out.push({ cmd: 'unsubscribe', project: h.project, agent: h.agent });
    }
    return out;
  }

  /** A new core: nothing is subscribed there; the windows say theirs again. */
  clear(): void {
    this.holders.clear();
  }
}
