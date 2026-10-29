// One-time hints (bar S36, the TUI's hints.rs, BISE-61): no tour, each hint shows once per
// user, next to the thing, the first time it happens (the first agent: under its sidebar row;
// the first card: above the thread's inbox strip). It is marked seen in the same `hints` pref
// as the TUI's ({first_agent: true, …} in prefs.json, through prefs_set 'hints.<name>'), the
// first time it is drawn, so a hint seen in the terminal or the window never shows again, after a
// restart too. It goes when used (the agent looked into, the card opened) or after his next
// message. Under the test harness the hints are off unless the prefs carry a `hints` object (the
// TUI's tests: off unless a test gives a store). Owner: amb-win.
import { useEffect, useSyncExternalStore } from 'react';
import { Kbd } from '@/ds';
import type { JsonValue } from '@/proto';
import { usePrefs, useStore } from '@/store';

/** The TUI's hint keys (hints.rs Hint::key); the window draws first_agent and first_card. */
export type HintName = 'first_agent' | 'first_level3' | 'first_card' | 'first_steer' | 'first_yolo' | 'first_auto';

/** The words (hints.rs text, the Mac's keys); `{…}` is a key. */
export const HINT_TEXT: Partial<Record<HintName, string>> = {
  first_agent: 'new: your agents. they work in the background. {⌥1} to look inside, {esc} to come back.',
  first_card: 'this is your inbox. when an agent needs you, it waits here instead of interrupting you. {ctrl 1} opens it, or click it. ↓',
};

/** The hints marked seen in a prefs value, or null when the hints are off. Pure. */
export function seenOf(prefs: JsonValue | null, test: boolean): Record<string, boolean> | null {
  if (prefs === null || typeof prefs !== 'object' || Array.isArray(prefs)) return null;
  const h = prefs.hints;
  const obj = h !== undefined && h !== null && typeof h === 'object' && !Array.isArray(h) ? h : null;
  if (obj === null) return test ? null : {};
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === true]));
}

/** The session's hints: the ones up now (drawn, not used yet) and the ones done. */
const up = new Set<HintName>();
const done = new Set<HintName>();
let version = 0;
const subs = new Set<() => void>();
function bump(): void {
  version += 1;
  for (const f of subs) f();
}
function subscribe(f: () => void): () => void {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
}

/**
 * Whether a hint shows: up already this session, or `now` (its thing just happened) and never
 * seen; a hint once used never comes back. Pure (the session sets given).
 */
export function shows(name: HintName, now: boolean, seen: Record<string, boolean> | null, isUp: boolean, isDone: boolean): boolean {
  if (seen === null || isDone) return false;
  if (isUp) return true;
  return now && seen[name] !== true;
}

/** The hint was used (the agent looked into, the card opened): it goes. */
export function hintUsed(name: HintName): void {
  if (!up.has(name) || done.has(name)) return;
  up.delete(name);
  done.add(name);
  bump();
}

/** His message: every hint up goes (hints.rs user_message). */
export function hintsUserMessage(): void {
  if (up.size === 0) return;
  for (const n of up) done.add(n);
  up.clear();
  bump();
}

/** For the tests: a fresh session. */
export function resetHints(): void {
  up.clear();
  done.clear();
  bump();
}

const testMode = (): boolean => (window as Partial<Window>).bise?.test === true;

/** Whether `name` shows now; the first time it does, it is marked seen for good. */
export function useHint(name: HintName, now: boolean): boolean {
  useSyncExternalStore(subscribe, () => version);
  const store = useStore();
  const seen = seenOf(usePrefs(), testMode());
  const on = shows(name, now, seen, up.has(name), done.has(name));
  useEffect(() => {
    if (!on || up.has(name)) return;
    up.add(name);
    store.command({ cmd: 'prefs_set', key: `hints.${name}`, value: true });
    bump();
  }, [on, name, store]);
  return on;
}

/** A hint's note: its words, keys drawn as keys. */
export function Hint({ name }: { name: HintName }) {
  const text = HINT_TEXT[name] ?? '';
  const parts = text.split(/(\{[^}]*\})/).filter((p) => p !== '');
  return (
    <div className="setup-tip app-hint" role="note" data-testid={`app.hint.${name}`}>
      {parts.map((p, i) => (p.startsWith('{') ? <Kbd key={i}>{p.slice(1, -1)}</Kbd> : <span key={i}>{p}</span>))}
    </div>
  );
}
