// The window's own keys (settings/keys.ts lists them; tui-parity K14, V1,
// W14, F1, F5, F7, V3, K16): what a key does, as a pure decision, and the
// one listener in the shell that acts on it. Owner: amb-win.
//
// ⌘0 bise · ⌘1-9 a project in his order · ⌥0 the project's main · ⌥1-9
// its agents in the panel's order · ⌘K the agent palette · ⌘D the agent's
// changes · ⌘⇧A the artifacts · ⌘E fold/unfold everything · ⌘/ the key
// list · end back to the bottom · ctrl+y copy a code
// block · ⌥↑/⌥↓ the previous / next agent (empty composer).
// Keys are read by `code` (⌥1 types '¡' on a Mac keyboard) and taken in the
// capture phase, so the composer never gets the character.
import type { Agent, ProjectRow } from '@/proto';
import { liveOf, rankedOf } from '@/agents/model';
import { MAIN, projectOf, type Route } from './route';
import { projectsOf } from './siderows';
import { panelKeyOf, type PanelKey } from './panel/keys';

/** A window event that opens the key list (the composer's /help and /shortcuts). */
export const HELP_EVENT = 'bise:help';

/** What a screen does for a key (the thread listens with useAppAction). */
export type ScreenAction = 'fold-all' | 'stop' | 'to-end' | 'copy-code' | 'side-1' | 'side-2' | 'side-3' | 'side-4';

/** What the window's frame does: show or hide the sidebar (⌘\), the right panel (⌥⌘0). */
export type FrameAction = 'sidebar' | 'panel';

export type KeyAct =
  | { readonly go: Route }
  | { readonly palette: true }
  | { readonly help: true }
  | { readonly screen: ScreenAction }
  | { readonly frame: FrameAction }
  /** ⌘N: New agent in the project in view, else bise's own (newagent.tsx) */
  | { readonly newAgent: string }
  /** the tabbed panel's keys (app/panel/keys.ts): ⌘T, ⌘W, ⌘⇧[ ], ⌘P, ⌘L, ⌥⌘S, ⌥⌘D */
  | { readonly panel: PanelKey };

export interface KeyLike {
  readonly key: string;
  readonly code: string;
  readonly metaKey: boolean;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
}

export interface KeyCtx {
  readonly route: Route;
  readonly projects: readonly ProjectRow[];
  readonly agents: (project: string) => readonly Agent[];
  /** focus is in a field with text (the composer, find, a setting) */
  readonly typing: boolean;
  /** the project's ⌥ numbers as the sidebar shows them (agents/model numbersOf); none: the hub's rank */
  readonly numbers?: (project: string) => ReadonlyMap<string, number>;
  /** the tabbed panel is open: ⌘W and ⌘⇧[ ] are its */
  readonly panelOpen?: boolean;
}

const digit = (code: string): number | undefined => (/^Digit[0-9]$/.test(code) ? Number(code.slice(5)) : undefined);

/** The project a key acts on: the route's, else bise's own. */
function here(c: KeyCtx): string | undefined {
  return projectOf(c.route) ?? c.projects.find((p) => p.home)?.project;
}

/** The agents of the panel, numbered for ⌥1-9: live, main out, in the panel's order. */
export function panelAgents(agents: readonly Agent[]): Agent[] {
  return liveOf(agents).filter((a) => !a.main);
}

/** What a key does here; none: not the window's key. Pure. */
export function keyAction(e: KeyLike, c: KeyCtx): KeyAct | undefined {
  const only = (m: 'meta' | 'alt' | 'ctrl' | 'none', shift = false) =>
    e.metaKey === (m === 'meta') && e.altKey === (m === 'alt') && e.ctrlKey === (m === 'ctrl') && e.shiftKey === shift;
  const n = digit(e.code);
  if (n !== undefined && only('meta')) {
    if (n === 0) return { go: { screen: 'bise' } };
    const p = projectsOf(c.projects)[n - 1];
    return p ? { go: { screen: 'thread', project: p.project, agent: MAIN } } : undefined;
  }
  if (n !== undefined && only('alt')) {
    const p = here(c);
    if (p === undefined) return undefined;
    if (n === 0) return { go: { screen: 'thread', project: p, agent: MAIN } };
    const nums = c.numbers?.(p) ?? rankedOf(liveOf(c.agents(p)));
    const name = [...nums].find(([, k]) => k === n)?.[0];
    return name !== undefined ? { go: { screen: 'thread', project: p, agent: name } } : undefined;
  }
  if (only('meta') && e.code === 'KeyK') return { palette: true };
  const pk = panelKeyOf(e, c.panelOpen === true);
  if (pk !== undefined) return { panel: pk };
  // bise fait mac (page native-mac §6): ⌘\ the sidebar, ⌥⌘0 the panel, ⌘N New agent, ⌘, settings
  if (only('meta') && e.code === 'Backslash') return { frame: 'sidebar' };
  if (e.metaKey && e.altKey && !e.ctrlKey && !e.shiftKey && e.code === 'Digit0') return { frame: 'panel' };
  // ⌥⌘1-⌥⌘4: the right side's bubbles, agents, artifacts, scheduled, processes (native-mac d1; app/side3d)
  if (e.metaKey && e.altKey && !e.ctrlKey && !e.shiftKey && n !== undefined && n >= 1 && n <= 4) return { screen: `side-${String(n)}` as ScreenAction };
  if (only('meta') && e.code === 'KeyN') {
    const p = here(c);
    return p === undefined ? undefined : { newAgent: p };
  }
  if (only('meta') && e.code === 'Comma') return { go: { screen: 'settings' } };
  if (only('meta') && e.code === 'KeyD') {
    const r = c.route;
    if (r.screen === 'thread' && r.agent !== MAIN) return { go: { screen: 'review', project: r.project, agent: r.agent } };
    const p = here(c);
    return p ? { go: { screen: 'changes', project: p } } : undefined;
  }
  if (only('meta', true) && e.code === 'KeyA') {
    const p = here(c);
    return p ? { go: { screen: 'artifacts', project: p } } : undefined;
  }
  if (only('meta') && e.code === 'KeyE') return { screen: 'fold-all' };
  // the TUI's ctrl+o (ctrlhint.rs: open everything closed, else close what is open), the composer
  // focused or not: the window's capture listener takes it before the field (macOS's 'open line')
  if (only('ctrl') && e.code === 'KeyO') return { screen: 'fold-all' };
  // the key list over the window (amb-web 1e60fbd6, src/help): ⌘/ only; '?' is his to type, a
  // message may start with it (main m_22096)
  if ((only('meta') || only('meta', true)) && e.code === 'Slash') return { help: true }; // ⌘/, ⌘? (designer m_22100)
  if (only('ctrl') && e.code === 'KeyY') return { screen: 'copy-code' };
  if (only('none') && e.key === 'End' && !c.typing) return { screen: 'to-end' };
  if (only('alt') && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && !c.typing) {
    const r = c.route;
    const p = here(c);
    if (p === undefined) return undefined;
    const list = [MAIN, ...panelAgents(c.agents(p)).map((a) => a.name)];
    const at = r.screen === 'thread' && r.project === p ? list.indexOf(r.agent) : -1;
    const next = list[Math.min(list.length - 1, Math.max(0, at + (e.key === 'ArrowDown' ? 1 : -1)))];
    return next !== undefined ? { go: { screen: 'thread', project: p, agent: next } } : undefined;
  }
  return undefined;
}

/** Focus is in a field that has text: plain keys (end, ⌥↑↓) are its own. */
export function typingIn(el: Element | null): boolean {
  if (el === null) return false;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return el.value !== '';
  if (el instanceof HTMLElement && el.isContentEditable) return el.textContent.trim() !== '';
  return false;
}
