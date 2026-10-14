// Dictation's routes (bar I, the core's core/dictate.rs): the core has one
// connection (main's stdio) and every other event goes to every window, but
// a dictation's words go only to the window that started it. Main remembers
// which window sent each `dictate_start {id}` and sends that id's
// `dictation` events there (a refusal or a failure is one too, final with
// its `error`), never to another
// window, never to main's own listeners or the kept snapshot, never to a
// log. A window gone (closed, crashed, reloaded) cancels its dictations (the
// mic goes off); a core gone ends them for their windows (its mic is off
// with it). Voice mode (core/voice_mode.rs) is routed the same way: its
// `voice_mode` events (his heard words, the said sentence) go only to the
// window that turned it on; that window gone turns it off; the core gone
// gives that window its last state. Pure: ipc.ts gives it the window ids
// and does the sending.
// Owner: amb-core.

type Ev = Record<string, unknown>;

/** Where one event of the core goes. */
export type Route = { to: 'all' } | { to: 'window'; window: number; ev: Ev } | { to: 'none' };

export class DictationRoutes {
  /** dictation id -> the window (webContents id) that started it */
  private readonly owners = new Map<string, number>();
  /** voice mode's window and what it is on (one at a time: one mic owner) */
  private voice: { window: number; project: string; agent: string } | null = null;
  /** R8: the window whose `/model` the core may hold (setup_first): its close drops the held line */
  private setupOwner: number | null = null;

  /** A window's command: a `dictate_start` makes that window its id's owner. */
  sent(window: number, cmd: unknown): void {
    if (typeof cmd !== 'object' || cmd === null) return;
    const c = cmd as Ev;
    // a kept take tried again (its first final ended the route): one more final, to the same window
    if ((c.cmd === 'dictate_start' || c.cmd === 'dictate_retry') && typeof c.id === 'string' && c.id.trim() !== '') this.owners.set(c.id, window);
    // voice mode belongs to the window that turned it on (or moved it)
    if (c.cmd === 'voice_mode' && c.on === true && typeof c.project === 'string' && typeof c.agent === 'string') {
      this.voice = { window, project: c.project, agent: c.agent };
    }
    // R8: a typed /model the core may hold until its provider works (one at a time: the newest)
    if (c.cmd === 'slash' && typeof c.line === 'string' && c.line.trim().startsWith('/model ')) this.setupOwner = window;
    if (c.cmd === 'setup_first_cancel' && this.setupOwner === window) this.setupOwner = null;
  }

  /**
   * A dictation event goes to its owner only (none: nobody, never a
   * broadcast); its final (stop, cancel, an error, a refused start) ends the
   * route.
   */
  route(ev: Ev): Route {
    if (ev.ev === 'voice_mode') {
      const v = this.voice;
      if (ev.on === false) this.voice = null;
      return v === null ? { to: 'none' } : { to: 'window', window: v.window, ev };
    }
    // R8: the setup a held /model opens is for the window that typed it
    if (ev.ev === 'setup_first') return this.setupOwner === null ? { to: 'all' } : { to: 'window', window: this.setupOwner, ev };
    if (ev.ev !== 'dictation') return { to: 'all' };
    const id = typeof ev.id === 'string' ? ev.id : '';
    const window = this.owners.get(id);
    if (ev.final === true) this.owners.delete(id);
    return window === undefined ? { to: 'none' } : { to: 'window', window, ev };
  }

  /** A dictation or voice mode holds the mic now (the app's update waits: update/moment.ts). */
  holding(): boolean {
    return this.owners.size > 0 || this.voice !== null;
  }

  /** A window is gone: the `dictate_cancel` commands for its dictations. */
  gone(window: number): Ev[] {
    const cmds: Ev[] = [];
    for (const [id, w] of this.owners) {
      if (w !== window) continue;
      this.owners.delete(id);
      cmds.push({ cmd: 'dictate_cancel', id });
    }
    if (this.voice?.window === window) {
      // never left listening: its last state is for a window that is gone
      cmds.push({ cmd: 'voice_mode', project: this.voice.project, agent: this.voice.agent, on: false });
      this.voice = null;
    }
    // R8: a held /model never runs by surprise once its window is gone
    if (this.setupOwner === window) {
      cmds.push({ cmd: 'setup_first_cancel' });
      this.setupOwner = null;
    }
    return cmds;
  }

  /** The core is gone: its mic is off; each owner gets a cancelled final. */
  coreGone(): Route[] {
    const routes: Route[] = [...this.owners].map(([id, window]) => ({ to: 'window', window, ev: { ev: 'dictation', id, text: '', final: true, cancelled: true } }));
    this.owners.clear();
    const v = this.voice;
    if (v !== null) routes.push({ to: 'window', window: v.window, ev: { ev: 'voice_mode', project: v.project, agent: v.agent, on: false, state: 'listening', note: 'bise stopped' } });
    this.voice = null;
    // a new core holds nothing (memory only)
    this.setupOwner = null;
    return routes;
  }
}
