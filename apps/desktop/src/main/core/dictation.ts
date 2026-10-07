// Dictation's routes (bar I, the core's core/dictate.rs): the core has one
// connection (main's stdio) and every other event goes to every window, but
// a dictation's words go only to the window that started it. Main remembers
// which window sent each `dictate_start {id}` and sends that id's
// `dictation` events there (a refusal or a failure is one too, final with
// its `error`), never to another
// window, never to main's own listeners or the kept snapshot, never to a
// log. A window gone (closed, crashed, reloaded) cancels its dictations (the
// mic goes off); a core gone ends them for their windows (its mic is off
// with it). Pure: ipc.ts gives it the window ids and does the sending.
// Owner: amb-core.

type Ev = Record<string, unknown>;

/** Where one event of the core goes. */
export type Route = { to: 'all' } | { to: 'window'; window: number; ev: Ev } | { to: 'none' };

export class DictationRoutes {
  /** dictation id -> the window (webContents id) that started it */
  private readonly owners = new Map<string, number>();

  /** A window's command: a `dictate_start` makes that window its id's owner. */
  sent(window: number, cmd: unknown): void {
    if (typeof cmd !== 'object' || cmd === null) return;
    const c = cmd as Ev;
    if (c.cmd === 'dictate_start' && typeof c.id === 'string' && c.id.trim() !== '') this.owners.set(c.id, window);
  }

  /**
   * A dictation event goes to its owner only (none: nobody, never a
   * broadcast); its final (stop, cancel, an error, a refused start) ends the
   * route.
   */
  route(ev: Ev): Route {
    if (ev.ev !== 'dictation') return { to: 'all' };
    const id = typeof ev.id === 'string' ? ev.id : '';
    const window = this.owners.get(id);
    if (ev.final === true) this.owners.delete(id);
    return window === undefined ? { to: 'none' } : { to: 'window', window, ev };
  }

  /** A window is gone: the `dictate_cancel` commands for its dictations. */
  gone(window: number): Ev[] {
    const cmds: Ev[] = [];
    for (const [id, w] of this.owners) {
      if (w !== window) continue;
      this.owners.delete(id);
      cmds.push({ cmd: 'dictate_cancel', id });
    }
    return cmds;
  }

  /** The core is gone: its mic is off; each owner gets a cancelled final. */
  coreGone(): Route[] {
    const routes: Route[] = [...this.owners].map(([id, window]) => ({ to: 'window', window, ev: { ev: 'dictation', id, text: '', final: true, cancelled: true } }));
    this.owners.clear();
    return routes;
  }
}
