// The terminal panel's pure parts (bar T W25/V13/K26/M16; architect
// m_10140): `bise pty`'s lines (bise-proto's pty.rs, generated types in
// src/proto/pty.ts), which folder a project's shell runs in, a shell's key
// (several per project: the panel's terminal tabs), the clamps, which shell to
// drop when too many run, and the output batches.
import type { PtyCmd, PtyEv } from '../../proto';

export const PTY_EV_TAGS: ReadonlySet<PtyEv['ev']> = new Set(['started', 'data', 'screen', 'exit', 'error']);

/**
 * A shell's id: the project's first shell (n 0: the bottom panel's, the capsule's) is the project's
 * id, as before; the next ones '<project>#<n>' (the panel's terminal tabs, bise fait mac). Null for
 * a bad project or number.
 */
export function shellKey(project: unknown, n: unknown): string | null {
  if (typeof project !== 'string' || project === '') return null;
  if (n === undefined || n === null || n === 0) return project;
  return typeof n === 'number' && Number.isInteger(n) && n > 0 && n < 100 ? `${project}#${String(n)}` : null;
}

/** One line of `bise pty`'s stdout -> an event, or null (not JSON, an unknown tag: dropped). */
export function decodePtyEv(line: string): PtyEv | null {
  let v: unknown;
  try {
    v = JSON.parse(line);
  } catch {
    return null;
  }
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return null;
  const tag = (v as Record<string, unknown>)['ev'];
  return typeof tag === 'string' && PTY_EV_TAGS.has(tag as PtyEv['ev']) ? (v as PtyEv) : null;
}

export function encodePtyCmd(c: PtyCmd): string {
  return `${JSON.stringify(c)}
`;
}

/**
 * The folder a project's shell runs in: its row's path in the core's last
 * `projects` event, absolute; never a path from the page. null: unknown
 * project, or no path.
 */
export function folderOf(project: unknown, rows: readonly unknown[]): string | null {
  if (typeof project !== 'string' || project === '') return null;
  for (const r of rows) {
    if (typeof r !== 'object' || r === null) continue;
    const o = r as Record<string, unknown>;
    if (o['project'] === project && typeof o['path'] === 'string' && o['path'].startsWith('/')) return o['path'];
  }
  return null;
}

/** A size a terminal can have (the same clamps as `bise pty`): 2..500 × 1..200, whole cells. */
export function clampSize(cols: unknown, rows: unknown): { cols: number; rows: number } | null {
  if (typeof cols !== 'number' || typeof rows !== 'number' || !Number.isFinite(cols) || !Number.isFinite(rows)) return null;
  return { cols: Math.min(500, Math.max(2, Math.floor(cols))), rows: Math.min(200, Math.max(1, Math.floor(rows))) };
}

/** Test mode: the bise that runs `bise pty` when it isn't the core's (a FakeCore run still gets a real pty). */
export const PTY_ENV = 'BISE_DESKTOP_PTY';

/**
 * The bise that runs the shells: in test mode BISE_DESKTOP_PTY when it is an
 * absolute path, else the core's (`core`: paths.ts's binPath). Never in a
 * normal run: there the app's own bise runs both.
 */
export function ptyBin(env: Readonly<Record<string, string | undefined>>, testMode: boolean, core: string | null): string | null {
  const set = env[PTY_ENV] ?? '';
  return testMode && set.startsWith('/') ? set : core;
}

/** At most this many shells at once. */
export const MAX_SHELLS = 8;
/** At most this many bytes a write. */
export const MAX_WRITE = 64 * 1024;

/** The shell to end so a new one fits: the least recently used, when `MAX_SHELLS` run. */
export function evictee(lastUse: ReadonlyMap<string, number>, max: number = MAX_SHELLS): string | null {
  if (lastUse.size < max) return null;
  let pick: string | null = null;
  let oldest = Infinity;
  for (const [id, t] of lastUse) {
    if (t < oldest) {
      oldest = t;
      pick = id;
    }
  }
  return pick;
}

/**
 * A shell's output gathered for one frame (16 ms) and sent as one piece:
 * a flood (`cat` of a big file) costs the windows ~60 IPC messages a
 * second, not one per read. `flush` sends what is there at once (before a
 * screen snapshot or an exit, so nothing comes out of order).
 */
export class Batcher {
  private readonly parts = new Map<string, Uint8Array[]>();
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly send: (id: string, bytes: Uint8Array) => void,
    private readonly ms = 16,
    private readonly later: (fn: () => void, ms: number) => ReturnType<typeof setTimeout> = setTimeout,
  ) {}

  push(id: string, bytes: Uint8Array): void {
    const list = this.parts.get(id);
    if (list === undefined) this.parts.set(id, [bytes]);
    else list.push(bytes);
    this.timer ??= this.later(() => {
      this.timer = null;
      for (const k of [...this.parts.keys()]) this.flush(k);
    }, this.ms);
  }

  flush(id: string): void {
    const list = this.parts.get(id);
    if (list === undefined) return;
    this.parts.delete(id);
    this.send(id, concat(list));
  }
}

function concat(list: readonly Uint8Array[]): Uint8Array {
  if (list.length === 1 && list[0] !== undefined) return list[0];
  const out = new Uint8Array(list.reduce((n, b) => n + b.length, 0));
  let at = 0;
  for (const b of list) {
    out.set(b, at);
    at += b.length;
  }
  return out;
}
