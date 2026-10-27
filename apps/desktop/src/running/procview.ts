// A process's side panel (designer's page process-panel, Gabriel's m_47397), pure: its title, its
// state pill, its meta line, why no output is kept (by where its stdout points, rows::Proc.fd1, and
// what its command says: tmux, '> /dev/null', '| prog'), its resource samples and their curves, the
// output's first error. The panel (Panel.tsx) only draws these. Owner: proc-panel.
import type { Proc } from '@/proto';
import { running } from '@/proto/words_running.gen';
import { hm, markOf, type St } from './model';

const S = 1_000;
const MIN = 60_000;
const H = 60 * MIN;

/** A duration in the pill's words: '38 s', '2 min 14 s', '1 h 4 min'. */
export function durWords(ms: number): string {
  const t = Math.max(0, Math.round(ms / S));
  if (t < 60) return `${String(t)} s`;
  const m = Math.floor(t / 60);
  if (m < 60) return t % 60 === 0 ? `${String(m)} min` : `${String(m)} min ${String(t % 60)} s`;
  const h = Math.floor(m / 60);
  return m % 60 === 0 ? `${String(h)} h` : `${String(h)} h ${String(m % 60)} min`;
}

/** An age while it runs, coarse: '40 s', '4 min', '2 h'. */
export function ageWords(ms: number): string {
  if (ms < MIN) return `${String(Math.max(0, Math.round(ms / S)))} s`;
  if (ms < H) return `${String(Math.floor(ms / MIN))} min`;
  return `${String(Math.floor(ms / H))} h`;
}

/** Shell words, quotes kept together and taken off ('a "b c"' -> a, b c). */
export function words(cmd: string): string[] {
  const out: string[] = [];
  const re = /'([^']*)'|"((?:\\.|[^"\\])*)"|(\S+)/gu;
  for (let m = re.exec(cmd); m !== null; m = re.exec(cmd)) out.push(m[1] ?? m[2] ?? m[3] ?? '');
  return out;
}

const base = (w: string): string => w.split('/').pop() ?? w;
const isFlag = (w: string): boolean => w.startsWith('-');
const RUNNERS = new Set(['npx', 'bunx', 'exec', 'run', 'dlx', 'uv', 'uvx', 'poetry', 'pipenv']);
const SHELLS = new Set(['sh', 'bash', 'zsh', 'dash']);

/**
 * Its title (the head, t-15/600): the name its hub gave a known server ('dev server'), else what it
 * runs: a tmux session's or 'sh -c' command inside, a runner ('pnpm exec', 'npx') skipped, python's
 * module ('http.server'), and the program without its path with its first word when that is a
 * subcommand ('cargo test', 'playwright test', 'mdbook serve'). Pure.
 */
export function titleOf(p: Pick<Proc, 'cmd' | 'name'>): string {
  if (p.name != null && p.name !== '') return p.name;
  return titleOfCmd(p.cmd);
}

function titleOfCmd(cmd: string): string {
  let w = words(cmd.trim().replace(/^cd\s+\S+\s*(?:&&|;)\s*/u, ''));
  // tmux new-session -d -s docs 'mdbook serve -p 3000': the command inside
  if (base(w[0] ?? '') === 'tmux' && (w[1] === 'new-session' || w[1] === 'new')) {
    const inner = w.slice(2).filter((x, i, a) => !isFlag(x) && !['-s', '-n', '-c', '-t', '-x', '-y'].includes(a[i - 1] ?? '')).pop();
    if (inner !== undefined) return titleOfCmd(inner);
  }
  // sh -c '…': the command inside
  if (SHELLS.has(base(w[0] ?? '')) && w[1] === '-c' && w[2] !== undefined) return titleOfCmd(w[2]);
  // nohup, env A=1, time: what they run
  while (w.length > 1 && (['nohup', 'env', 'time', 'exec'].includes(base(w[0] ?? '')) || /^\w+=/u.test(w[0] ?? ''))) w = w.slice(1);
  const prog = base(w[0] ?? '');
  // python3 -m http.server 8000: the module
  if (/^python\d?(\.\d+)?$/u.test(prog) && w[1] === '-m' && w[2] !== undefined) return w[2];
  // pnpm exec playwright test …: the program after the runner (pnpm --filter web dev: its script)
  let i = 1;
  if (['pnpm', 'npm', 'yarn', 'bun'].includes(prog) || RUNNERS.has(prog)) {
    while (i < w.length && isFlag(w[i] ?? '')) i += (w[i] ?? '').includes('=') ? 1 : 2;
    if (RUNNERS.has(w[i] ?? '')) {
      const next = w[i + 1];
      if (next !== undefined) return titleOfCmd(w.slice(i + 1).join(' '));
    }
    return [prog, w[i]].filter((x) => x !== undefined).join(' ');
  }
  const sub = w[1];
  return sub !== undefined && /^[a-z][\w-]*$/u.test(sub) ? `${prog} ${sub}` : prog;
}

/** Its state pill (designer's table): the glyph (the client's), its tone, its words, its tip. */
export interface Pill {
  readonly glyph: string;
  readonly tone: 'dim' | 'ink' | 'err';
  readonly words: string;
  readonly tip: string;
}

export function pillOf(p: Proc, s: St, now: number): Pill {
  const m = markOf(s);
  const ran = (p.ended_ms ?? now) - p.started_ms;
  switch (s.k) {
    case 'running':
    case 'stopping':
      return { ...m, words: s.k === 'stopping' ? running.stopping : running.pill_running({ age: ageWords(now - p.started_ms) }), tip: running.tip_running };
    case 'exited':
      if (s.rc === null) return { glyph: '·', tone: 'dim', words: running.pill_no_rc, tip: running.tip_no_rc };
      return s.rc === 0
        ? { ...m, words: running.pill_ok({ rc: 0, dur: durWords(ran) }), tip: running.tip_ok }
        : { ...m, words: running.pill_failed({ rc: s.rc, dur: durWords(ran) }), tip: running.tip_failed({ rc: s.rc }) };
    case 'by_you':
      return { ...m, words: running.pill_by_you({ at: hm(s.at) }), tip: running.tip_by_you };
    case 'with':
      return { ...m, words: running.pill_with({ agent: p.agent, at: hm(s.at) }), tip: running.tip_with({ agent: p.agent }) };
  }
}

/** The meta line after 'started by <agent>': where, its start, then its pid and tree while it runs, or how it ended. */
export function metaTail(p: Proc, s: St, where: string): readonly string[] {
  const live = s.k === 'running' || s.k === 'stopping';
  const parts = [where !== '' ? running.meta_in({ place: where }) : '', hm(p.started_ms)];
  if (live) {
    parts.push(running.pid_of({ pid: p.pid }));
    if (p.procs > 1) parts.push(running.meta_procs({ n: p.procs }));
  } else if (s.k === 'by_you' || s.k === 'with') {
    parts.push(running.meta_ran({ dur: durWords((p.ended_ms ?? p.started_ms) - p.started_ms) }));
  } else if (p.ended_ms != null) {
    parts.push(running.meta_ended({ at: hm(p.ended_ms) }));
  }
  return parts.filter((x) => x !== '');
}

/** The tmux session its command makes ('tmux new-session -d -s docs …' -> docs), if any. */
export function tmuxSession(cmd: string): string | null {
  const w = words(cmd);
  const at = w.findIndex((x) => base(x) === 'tmux');
  if (at < 0 || !['new-session', 'new'].includes(w[at + 1] ?? '')) return null;
  const s = w.indexOf('-s', at);
  return s < 0 ? null : (w[s + 1] ?? null);
}

/** Its command sends stdout to /dev/null ('> /dev/null', '&>/dev/null', '1>/dev/null'; never '2>' alone). */
export const nullOut = (cmd: string): boolean => /(?:^|[^2\d])(?:&|1)?>{1,2}\s*\/dev\/null/u.test(cmd);

/** The program its command pipes into last ('… | grep foo' -> grep), outside quotes; none for '||'. */
export function pipeTo(cmd: string): string | null {
  const bare = cmd.replace(/'[^']*'|"(?:\\.|[^"\\])*"/gu, (q) => ' '.repeat(q.length));
  let at = -1;
  for (let i = 0; i < bare.length; i++) {
    if (bare[i] !== '|') continue;
    if (bare[i + 1] === '|' || bare[i - 1] === '|') {
      i++;
      continue;
    }
    at = i;
  }
  if (at < 0) return null;
  const next = words(cmd.slice(at + 1).replace(/^&/u, ''))[0];
  return next === undefined ? null : base(next);
}

/** The empty output's words: why (t-15 text-2), what to do (t-13 text-3), and a command to copy. */
export interface Empty {
  readonly k: 'tmux' | 'null' | 'pipe' | 'tty' | 'socket' | 'closed' | 'unknown' | 'yet' | 'ended';
  readonly why: string;
  readonly todo?: string;
  readonly copy?: string;
}

/** Why no output is kept (its hub reads no file of it): its command first, then where its stdout points. */
export function noneOf(p: Pick<Proc, 'cmd' | 'fd1'>): Empty {
  const tmux = tmuxSession(p.cmd);
  if (tmux !== null) {
    const attach = running.tmux_attach({ name: tmux });
    return { k: 'tmux', why: running.why_tmux, todo: `${running.todo_tmux} ${attach}`, copy: attach };
  }
  if (nullOut(p.cmd) || p.fd1 === 'null') return { k: 'null', why: running.why_null };
  const prog = pipeTo(p.cmd);
  if (prog !== null || p.fd1 === 'pipe') return { k: 'pipe', why: prog !== null ? running.why_pipe_to({ prog }) : running.why_pipe, todo: running.todo_pipe };
  switch (p.fd1) {
    case 'tty':
      return { k: 'tty', why: running.why_tty };
    case 'socket':
      return { k: 'socket', why: running.why_socket };
    case 'closed':
      return { k: 'closed', why: running.why_closed };
    default:
      return { k: 'unknown', why: running.why_unknown };
  }
}

/** Nothing printed (yet): a running one's words, or one that ended silent. */
export function quietOf(p: Proc, s: St, now: number): Empty {
  return s.k === 'running' || s.k === 'stopping' ? { k: 'yet', why: running.empty_yet, todo: running.todo_yet({ age: ageWords(now - p.started_ms) }) } : { k: 'ended', why: running.silent_ended };
}

// ---- resources

/** One sample of its tree: cpu in % of one core, memory in MB, when (ms). */
export interface Sample {
  readonly at: number;
  readonly cpu: number;
  readonly mb: number;
}

/** 2 min of 2 s samples. */
export const SAMPLES = 60;

/** The ring with `s` at its end (the oldest out past `max`); a sample of the same scan (same values within 1 s) is not kept twice. */
export function pushSample(ring: readonly Sample[], s: Sample, max = SAMPLES): readonly Sample[] {
  const last = ring.at(-1);
  if (last !== undefined && s.at - last.at < S && last.cpu === s.cpu && last.mb === s.mb) return ring;
  const next = [...ring, s];
  return next.length > max ? next.slice(next.length - max) : next;
}

export const peakOf = (xs: readonly number[]): number => xs.reduce((a, b) => Math.max(a, b), 0);

/** Memory in its words: '412 MB', '1.2 GB'. */
export function memWords(mb: number): string {
  return mb < 1024 ? `${String(Math.round(mb))} MB` : `${(mb / 1024).toFixed(1)} GB`;
}

/** A percent in its words: '12', '0.5' under 1, '380'. */
export const pctWords = (v: number): string => (v > 0 && v < 1 ? v.toFixed(1) : String(Math.round(v)));

/**
 * A curve's svg paths over `w`×`h` (y down): its line and its area, the samples spread evenly over
 * the last `span` points so the curve fills from the right as samples come; its top is the peak (at
 * least `floor`). None under two samples.
 */
export function curve(vals: readonly number[], w: number, h: number, floor = 1, span = SAMPLES): { readonly line: string; readonly area: string } | null {
  if (vals.length < 2) return null;
  const top = Math.max(floor, peakOf(vals)) * 1.1;
  const step = w / (span - 1);
  const x0 = w - step * (vals.length - 1);
  const pts = vals.map((v, i) => [x0 + i * step, h - (Math.max(0, v) / top) * h] as const);
  const r = (n: number) => Math.round(n * 10) / 10;
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${String(r(x))} ${String(r(y))}`).join(' ');
  const area = `${line} L${String(r(w))} ${String(h)} L${String(r(x0))} ${String(h)} Z`;
  return { line, area };
}

/** The first line of an output that reads as an error ('Error:', 'FAILED', '✘', 'panicked'), for a failed one. */
export function firstError(lines: readonly string[]): number | null {
  const re = /(^|\s)(error(\[\w+\])?:|✘|✗|FAIL(ED)?\b|panicked at|Traceback \(most recent call last\))/iu;
  const i = lines.findIndex((l) => re.test(l));
  return i < 0 ? null : i;
}
