// The fn talk's still (designer m_21901, ambient-lead m_21915): at fn down (a
// hold or fn fn), one PNG of the front window, asked of the helper
// ({cmd:'shot', id, dir}: Shot.swift, the long side at most 1600 px), handed
// to the core as {cmd:'shot', path, app, title}. The core stores it in the
// image store (Core::take_shot, which deletes the PNG) and sends it with the
// talk. Since the Electron port nothing asked for it, so no talk carried one.
//
// Never captured (the helper skips, nothing is said): bise's own windows, a
// password field with the keys (secure input), the apps of his never-capture
// list (prefs.excluded_apps, the helper's config, over its built-in floor), a
// window its app marks not shareable. Asked only when his switch allows it
// (prefs.context.shot: unset counts as on, as the settings page shows it) and
// Screen Recording is granted: never a TCC prompt from here (the ask is the
// capsule's). A shot that fails, is skipped or comes too late never blocks the
// talk: the talk just goes without it. An off-screen run has no helper, so no
// shot (offscreen.ts).
import type { HelperCmd, HelperEv } from '../../proto';

export type ShotPorts = {
  /** a command to the helper */
  readonly helper: (c: HelperCmd) => void;
  /** a command to the core; false when no core runs */
  readonly core: (cmd: { readonly cmd: 'shot'; readonly path: string; readonly app: string; readonly title: string }) => boolean;
  /** removes a PNG that no talk takes */
  readonly drop: (path: string) => void;
  /** where the helper writes its PNGs */
  readonly dir: string;
};

function obj(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/** His switch, prefs.context.shot: off only when false (unset: on, as settings › privacy shows it). Pure. */
export function shotSwitch(prefs: unknown): boolean {
  return obj(obj(prefs)?.['context'])?.['shot'] !== false;
}

/** A talk asks for a still: his switch on and Screen Recording granted. Pure. */
export function shotWanted(prefs: unknown, screen: string | null): boolean {
  return shotSwitch(prefs) && screen === 'allowed';
}

/** The fn events that start a talk (capsule/machine.ts: a hold, or fn fn hands-free). */
const STARTS: ReadonlySet<string> = new Set(['talk_start', 'double']);

export class Shots {
  private prefs: unknown = null;
  private screen: string | null = null;
  /** the id of the shot the current talk waits for */
  private pending: string | null = null;
  private n = 0;

  constructor(private readonly ports: ShotPorts) {}

  /** His prefs (the core's prefs event). */
  prefsChanged(prefs: unknown): void {
    this.prefs = prefs;
  }

  /** Every helper event (Helper.on). */
  helperEv(ev: HelperEv): void {
    switch (ev.ev) {
      case 'perms':
        this.screen = ev.screen;
        return;
      case 'fn':
        if (STARTS.has(ev.act)) this.start();
        else if (ev.act === 'cancel') this.pending = null;
        return;
      case 'shot':
        this.took(ev.id, ev.path ?? null, ev.app ?? '', ev.title ?? '', ev.skipped === true);
        return;
      default:
        return;
    }
  }

  private start(): void {
    if (!shotWanted(this.prefs, this.screen)) {
      this.pending = null;
      return;
    }
    this.n += 1;
    const id = `fn-${String(this.n)}`;
    this.pending = id;
    this.ports.helper({ cmd: 'shot', id, dir: this.ports.dir });
  }

  private took(id: string, path: string | null, app: string, title: string, skipped: boolean): void {
    const mine = id === this.pending;
    if (mine) this.pending = null;
    if (path === null || path === '') return;
    // a cancelled talk's, an older talk's, a skipped one: no talk takes it
    if (!mine || skipped || !this.ports.core({ cmd: 'shot', path, app, title })) this.ports.drop(path);
  }
}
