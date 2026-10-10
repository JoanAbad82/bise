// How the core ended, for the window (bar S.5 'shows its last log line', O.4
// crash; lead m_10687). Pure: process.ts reads what the core wrote to its log
// during that run and calls exitOf; ipc.ts sends the result with the core's
// state. A crash is a fatal signal (SIGSEGV, SIGABRT, SIGBUS, SIGILL, SIGFPE,
// SIGTRAP) or a Rust panic in its stderr; then the window can point at the log
// (reveal it in Finder, copy its path). The last line is trimmed, clipped and
// redacted: never a key or a token.
import type { CoreExit } from '../../shared/api';

const CRASH_SIGNALS = new Set(['SIGSEGV', 'SIGABRT', 'SIGBUS', 'SIGILL', 'SIGFPE', 'SIGTRAP', 'SIGSYS']);
const PANIC = /^thread '.*' panicked at/;
const MAX = 300;

/** A line fit for the window: no key, no token, no password; at most 300 characters. */
export function redactLine(line: string): string {
  let s = line.trim();
  // a key_set command echoed in a log (the Rust core's setup::redact rule)
  if (s.includes('key_set')) {
    try {
      const v = JSON.parse(s) as Record<string, unknown>;
      if (v['cmd'] === 'key_set') s = JSON.stringify({ ...v, key: '…' });
    } catch {
      s = "(a key_set line that isn't JSON)";
    }
  }
  s = s
    // provider keys: sk-…, sk-ant-…, AIza…, ghp_…, xox…-
    .replace(/\b(sk-[A-Za-z0-9_-]{6,}|AIza[0-9A-Za-z_-]{10,}|gh[pousr]_[A-Za-z0-9]{10,}|xox[abprs]-[A-Za-z0-9-]{8,})/g, '…')
    // Authorization: Bearer …
    .replace(/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{6,}/gi, '$1 …')
    // key=…, token: …, "api_key":"…", password=…
    .replace(/(["']?\b[\w-]*(?:key|token|secret|password|passwd|auth)[\w-]*["']?\s*[:=]\s*)(["']?)[^\s"',}]+\2/gi, '$1$2…$2');
  return s.length > MAX ? `${s.slice(0, MAX - 1)}…` : s;
}

/** Whether the core's stderr of that run says a Rust panic. */
export function panicked(lines: readonly string[]): boolean {
  return lines.some((l) => PANIC.test(l.trim()));
}

/**
 * The line that says why: a panic's message (Rust ≥ 1.73 puts it on the line
 * after 'panicked at <file>:<line>:<col>:'), else the last line that isn't
 * blank or Rust's backtrace hint. '' when it wrote nothing.
 */
export function lastLine(lines: readonly string[]): string {
  const ls = lines.map((l) => l.trim());
  const p = ls.findLastIndex((l) => PANIC.test(l));
  if (p >= 0) {
    const at = ls[p] ?? '';
    const next = ls[p + 1] ?? '';
    return redactLine(at.endsWith(':') && next !== '' && !next.startsWith('note:') ? next : at);
  }
  for (let i = ls.length - 1; i >= 0; i -= 1) {
    const l = ls[i] ?? '';
    if (l === '' || l.startsWith('note: run with `RUST_BACKTRACE') || l === 'stack backtrace:') continue;
    return redactLine(l);
  }
  return '';
}

/**
 * How it ended: a clean exit (code 0), an exit code, or a signal; a crash for
 * a fatal signal or a panic. `tail`: what it wrote to its log during that run.
 * `log`: the log's path, given only for a crash (the report to look at).
 */
export function exitOf(code: number | null, signal: string | null, tail: string, logPath: string | null, now: number): CoreExit {
  const lines = tail.split(/\r?\n/);
  const crash = (signal !== null && CRASH_SIGNALS.has(signal)) || panicked(lines);
  const how: CoreExit['how'] = signal !== null ? 'signal' : code === 0 ? 'clean' : 'code';
  return { how, code: signal !== null ? null : code, signal, crash, last: lastLine(lines), log: crash ? logPath : null, at_ms: now };
}

/** A core that could not even start (no such file, not executable): its reason as the last line. */
export function failedToStart(reason: string, now: number): CoreExit {
  return { how: 'failed', code: null, signal: null, crash: false, last: redactLine(reason), log: null, at_ms: now };
}

/** How many crashes in how long make main stop restarting the core (designer: 3 in 10 min). */
export const CRASH_LOOP = { count: 3, ms: 10 * 60 * 1000 } as const;

/**
 * The crashes still in the window after this one (`times`: earlier crash times, any order) and
 * whether main stops restarting: the third crash in 10 min stops it. Pure.
 */
export function crashLoop(times: readonly number[], now: number): { readonly times: number[]; readonly count: number; readonly stop: boolean } {
  const kept = [...times.filter((t) => now - t < CRASH_LOOP.ms && t <= now), now];
  return { times: kept, count: kept.length, stop: kept.length >= CRASH_LOOP.count };
}

/**
 * The reason in designer's words ('core exited with signal 11', 'core exited with code 101', a
 * panic's message): `signals` maps a signal name to its number (os.constants.signals). Pure.
 */
export function reasonOf(e: CoreExit, signals: Readonly<Record<string, number>>): string {
  if (e.how === 'failed') return `core couldn't start: ${e.last}`;
  if (e.signal !== null) return `core exited with signal ${String(signals[e.signal] ?? e.signal)}`;
  if (e.crash && e.last !== '') return `core panicked: ${e.last}`;
  return `core exited with code ${String(e.code ?? '?')}`;
}
