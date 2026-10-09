// macOS notifications for the questions bise asks, the shell (plan.ts is the pure part; the user's
// decision 2026-10-09, card #476, lead m_14206). From the core's events: a project's cards as they
// change; a new card knocks only when no bise window had the keys at its arrival. Its notification
// offers its choices and a reply (plan.noteOf); a choice or a reply answers through the core like a
// pick in the window ({cmd:'answer'}, the core unchanged); a click opens the window on the inbox; a
// card answered anywhere takes its notification away. An answer that can't reach the core says so
// in one more notification.
//
// Test mode never posts: each step is a NOTIFY_LINE on stdout, and the harness plays his side
// through two main-process globals: __biseTestFocused (whether a bise window has the keys) and
// __biseTestNotify(key, gesture) (a button, a reply or a click on that notification).
// Owner: amb-mac.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BrowserWindow, Notification, shell } from 'electron';
import { NOTIFY_LINE, type NotifyAuth } from '../../shared/api';
import type { Card } from '../../proto';
import { Arrivals, cardRoute, effectOf, knocks, noteOf, WORDS, type Gesture, type Lang, type Note, type Place } from './plan';

export type NotifyDeps = {
  readonly testMode: boolean;
  readonly lang: Lang;
  /** a command to the core: false when it can't be sent */
  readonly send: (cmd: unknown) => boolean;
  /** the main window, in front, on that route */
  readonly open: (route: string) => void;
  /** where 'asked' is kept across launches (userData) */
  readonly dir: string;
  /** the state to every window */
  readonly broadcast: (s: NotifyAuth) => void;
};

type TestGlobals = {
  __biseTestFocused?: boolean;
  __biseTestNotify?: (key: string, g: Gesture) => boolean;
  /** what macOS answers ask() in a test run ('on' unless the check says) */
  __biseTestNotifyAuth?: NotifyAuth;
};

/** System Settings › Notifications. */
const SETTINGS_URL = 'x-apple.systempreferences:com.apple.Notifications-Settings.extension';

export class Notifier {
  // two sources of a project's cards: its row in the core's projects (every project) and its own
  // cards event (a project a page has shown); each seeds on its first list, so a card one of them
  // hadn't listed yet never knocks at start
  private readonly fromRows = new Arrivals();
  private readonly fromCards = new Arrivals();
  private readonly withCards = new Set<string>();
  private readonly places = new Map<string, Place>();
  private readonly shown = new Map<string, { note: Note; n: Notification | null }>();

  private authState: NotifyAuth;
  /** a quiet moment now (the helper: a call, screen sharing, full screen): a question arrives silent */
  private quiet = false;

  constructor(private readonly d: NotifyDeps) {
    if (d.testMode) {
      const g = globalThis as TestGlobals;
      g.__biseTestFocused = false;
      g.__biseTestNotify = (key, gesture) => this.gesture(key, gesture);
    }
    this.authState = existsSync(this.authFile()) ? this.readAuth() : 'never';
  }

  private authFile(): string {
    return join(this.d.dir, 'notify.json');
  }

  private readAuth(): NotifyAuth {
    try {
      const v = (JSON.parse(readFileSync(this.authFile(), 'utf8')) as { auth?: unknown }).auth;
      return v === 'asked' || v === 'on' || v === 'off' ? v : 'never';
    } catch {
      return 'never';
    }
  }

  /** The helper's quiet moments: during one, a new question's notification makes no sound. */
  setQuiet(on: boolean): void {
    this.quiet = on;
  }

  /** The permission now (the inbox's row reads it). */
  auth(): NotifyAuth {
    return this.authState;
  }

  private setAuth(s: NotifyAuth): void {
    if (s === this.authState) return;
    this.authState = s;
    try {
      writeFileSync(this.authFile(), JSON.stringify({ auth: s }));
    } catch {
      // kept for this run only
    }
    this.d.broadcast(s);
  }

  /**
   * His 'turn on': macOS's own alert follows. A test run answers with __biseTestNotifyAuth. A real
   * run can't read macOS's answer yet (Electron has no API for it: the native helper will, after
   * a0's proof); macOS asks at the first notification, so the state is 'asked'.
   */
  ask(): NotifyAuth {
    if (this.d.testMode) {
      const a = (globalThis as TestGlobals).__biseTestNotifyAuth ?? 'on';
      this.line({ t: 'ask', answer: a });
      this.setAuth(a);
      return a;
    }
    if (this.authState === 'never') this.setAuth('asked');
    return this.authState;
  }

  /** System Settings › Notifications (the row when it's off). */
  openSettings(): void {
    if (this.d.testMode) this.line({ t: 'settings' });
    else void shell.openExternal(SETTINGS_URL);
  }

  /** The core's events: projects rows (names, and their cards), a project's cards. */
  onCoreEvent(ev: Record<string, unknown>): void {
    if (ev['ev'] === 'projects' && Array.isArray(ev['projects'])) {
      for (const p of ev['projects'] as Record<string, unknown>[]) {
        const id = typeof p['project'] === 'string' ? p['project'] : null;
        if (id === null) continue;
        this.places.set(id, { name: typeof p['name'] === 'string' ? p['name'] : id, home: p['home'] === true });
        if (Array.isArray(p['cards'])) this.cards(id, p['cards'] as Card[], 'rows');
      }
      return;
    }
    if (ev['ev'] === 'cards' && typeof ev['project'] === 'string' && Array.isArray(ev['cards'])) this.cards(ev['project'], ev['cards'] as Card[], 'cards');
  }

  private focused(): boolean {
    if (this.d.testMode) return (globalThis as TestGlobals).__biseTestFocused === true;
    return BrowserWindow.getFocusedWindow() !== null;
  }

  private cards(project: string, cards: readonly Card[], from: 'rows' | 'cards'): void {
    if (from === 'cards') this.withCards.add(project);
    const { fresh, gone } = (from === 'rows' ? this.fromRows : this.fromCards).apply(project, cards);
    // a card leaves when its project's own list drops it (its row's when it has no cards event)
    if (from === 'cards' || !this.withCards.has(project)) for (const k of gone) this.close(k);
    if (fresh.length === 0 || !knocks(this.focused())) return;
    for (const c of fresh) this.post(noteOf({ ...c, project }, this.places.get(project), this.d.lang, this.quiet));
  }

  private line(o: unknown): void {
    process.stdout.write(`${NOTIFY_LINE} ${JSON.stringify(o)}\n`);
  }

  private post(note: Note): void {
    if (this.shown.has(note.key)) return;
    if (this.d.testMode) {
      this.shown.set(note.key, { note, n: null });
      this.line({ t: 'post', note });
      return;
    }
    // the very first question while he's elsewhere: macOS's own alert is the ask (designer m_14211)
    if (this.authState === 'never') this.setAuth('asked');
    const w = WORDS[this.d.lang];
    const n = new Notification({
      title: note.title,
      body: note.body,
      silent: note.silent,
      actions: note.actions.map((text) => ({ type: 'button' as const, text })),
      hasReply: note.reply,
      replyPlaceholder: note.placeholder,
      closeButtonText: w.later,
    });
    n.on('action', (_e, index: number) => this.gesture(note.key, { action: index }));
    n.on('reply', (_e, reply: string) => this.gesture(note.key, { reply }));
    n.on('click', () => this.gesture(note.key, { click: true }));
    this.shown.set(note.key, { note, n });
    n.show();
  }

  /** The card left its list (answered anywhere): its notification goes at once. */
  private close(key: string): void {
    const s = this.shown.get(key);
    if (s === undefined) return;
    this.shown.delete(key);
    if (this.d.testMode) this.line({ t: 'close', key });
    else s.n?.close();
  }

  /** His gesture on a notification: an answer through the core, or the window on the inbox. */
  private gesture(key: string, g: Gesture): boolean {
    const s = this.shown.get(key);
    if (s === undefined) return false;
    const e = effectOf(s.note, g);
    if (e.t === 'none') return false;
    if (e.t === 'open') {
      if (this.d.testMode) this.line({ t: 'open', key, route: e.route });
      this.d.open(e.route);
      return true;
    }
    const sent = this.d.send(e.cmd);
    if (this.d.testMode) this.line({ t: 'answer', key, cmd: e.cmd, sent });
    if (!sent) this.failed(s.note);
    return sent;
  }

  /** One more notification: the answer didn't leave; a click opens the inbox where it still waits. */
  private failed(note: Note): void {
    const body = WORDS[this.d.lang].failed(note.title.split(' ')[0] ?? 'bise');
    if (this.d.testMode) {
      this.line({ t: 'failed', key: note.key, body });
      return;
    }
    const n = new Notification({ title: 'bise', body });
    n.on('click', () => {
      this.d.open(cardRoute(note.project, note.card));
    });
    n.show();
  }
}
