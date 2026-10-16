// The window's marks (designer's desktop-delight v2, his yes on A): bise's ':*' (the ds's BiseMark,
// fed with what waits on him and whether bise works), a project's mark (the TUI's breath
// '· ~ ∿ ≈ ∿ ~' while an agent works, his pick #9: working/Signs.tsx's MarkBreath on the window's
// one clock, a still '∿' under reduced motion or out of focus; '?' when it asks him, '·' quiet), and
// the done kiss (':*' lifts and fades, '✓' comes, 600 ms, once per finish). They replace the
// pearl in the window; the pearl stays the capsule's. The kiss is CSS (marks.css), none under
// reduced motion: the final state only. The states are marks.ts's. Owner: amb-win.
import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import type { Agent, ProjectRow } from '@/proto';
import { useProjects, useStore } from '@/store';
import { BiseMark, tipAttrs } from '@/ds';
import { biseMark, finished, KISS_HOLD_MS, KISS_MS, projectMark, type ProjectMarkKind } from './markstates';
import { biseTip } from './tipwords';
import { MarkBreath } from '@/working/Signs';
import './marks.css';

// ---- the done kiss: who finished when, for the whole window

const seen = new Map<string, Agent['status']>();
/** '<project>/<agent>' and '<project>' -> when its kiss started; each goes when its kiss ends */
const kissAt = new Map<string, number>();
const listeners = new Set<() => void>();
const tell = () => {
  for (const l of listeners) l();
};

/** A kiss for `key` from `now`, gone after `ms`. */
function kiss(key: string, now: number, ms: number): void {
  kissAt.set(key, now);
  setTimeout(() => {
    if (kissAt.get(key) === now) kissAt.delete(key);
    tell();
  }, ms);
}

/** A project's agents as the hub sent them: the ones that just finished get their kiss. */
export function noteAgents(project: string, agents: readonly Agent[], now: number): void {
  const done = finished(seen, project, agents);
  for (const a of agents) seen.set(`${project}/${a.name}`, a.status);
  if (done.length === 0) return;
  for (const n of done) kiss(`${project}/${n}`, now, KISS_MS);
  // its project's mark holds the '✓' a little longer, then shows its state again
  kiss(project, now, KISS_MS + KISS_HOLD_MS);
  tell();
}

/** The window's watch on every project's agents (App mounts it once). */
export function useKissWatch(): void {
  const store = useStore();
  const ids = useProjects()
    .map((p) => p.project)
    .join('\n');
  useEffect(() => {
    const list = ids === '' ? [] : ids.split('\n');
    const offs = list.map((p) => {
      noteAgents(p, store.agents(p), Date.now());
      return store.subscribe(`agents:${p}`, () => {
        noteAgents(p, store.agents(p), Date.now());
      });
    });
    return () => {
      for (const off of offs) off();
    };
  }, [store, ids]);
}

/** When the kiss of `key` started, while it plays; undefined: none. */
function useKiss(key: string): number | undefined {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => kissAt.get(key),
  );
}

/** ':*' lifts 8 px, grows 1.2 and fades; '✓' fades in. A remount mid-way goes on where it was. */
function Kiss({ at, testId }: { at: number; testId?: string | undefined }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const late = `-${String(Math.max(0, Date.now() - at))}ms`;
    for (const c of ref.current?.children ?? []) (c as HTMLElement).style.animationDelay = late;
  }, [at]);
  return (
    <span className="mk-kiss" ref={ref} data-testid={testId}>
      <span className="mk-kiss-from">:*</span>
      <span className="mk-kiss-to">✓</span>
    </span>
  );
}

/** An agent's '✓' in the right bar: its kiss while it plays, then the plain sign. */
export function DoneSign({ project, agent, glyph, testId }: { project: string; agent: string; glyph: string; testId?: string }) {
  const at = useKiss(`${project}/${agent}`);
  return at !== undefined ? <Kiss at={at} testId={testId} /> : <>{glyph}</>;
}

// ---- the marks

const GLYPH: Record<Exclude<ProjectMarkKind, 'works'>, string> = { asks: '?', quiet: '·' };

/** A project's mark in its 18 px column; its kiss when one of its agents just finished. */
export function ProjectMark({ p, tip, testId }: { p: Pick<ProjectRow, 'project' | 'waits' | 'working' | 'missing'>; tip?: string; testId?: string }) {
  const kind = projectMark(p);
  const at = useKiss(p.project);
  return (
    <span className={`mk mk-pj ${kind}`} {...tipAttrs(tip)} data-mark={at !== undefined ? 'kiss' : kind} data-testid={testId}>
      {at !== undefined ? <Kiss at={at} /> : kind === 'works' ? <MarkBreath /> : GLYPH[kind]}
    </span>
  );
}

/** bise's ':*' in the window (the ds's drawing): the accent when anything waits on him, its star
 *  turning while bise works, its tip; `size`: its box (14 px in a row). */
export function LiveBiseMark({ size = 14, testId }: { size?: number; testId?: string }) {
  const m = biseMark(useProjects());
  return <BiseMark waits={m.waits > 0} working={m.working > 0} size={size} tip={biseTip(m.waits, m.working)} testId={testId} />;
}
