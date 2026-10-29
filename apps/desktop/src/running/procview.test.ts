import { describe, expect, it } from 'vitest';
import type { Proc } from '@/proto';
import { stateOf } from './model';
import { curve, durWords, firstError, memWords, metaTail, noneOf, nullOut, pillOf, pipeTo, pushSample, quietOf, titleOf, tmuxSession, type Sample } from './procview';

const NOW = new Date(2026, 9, 27, 14, 6).getTime();
const S = 1_000;
const MIN = 60_000;
const proc = (over: Partial<Proc>): Proc => ({
  id: 'bg3', agent: 'perf', kind: { is: 'bg', n: 3 }, cmd: 'pnpm dev', pid: 21304, started_ms: NOW - 4 * MIN,
  state: { is: 'running' }, out: 'bg', cpu: 12, rss_mb: 412, procs: 3, ...over,
});

describe('a process panel', () => {
  it('titles it by its known name, else by what it runs', () => {
    expect(titleOf({ cmd: 'pnpm --filter web dev --port 5173', name: 'dev server' })).toBe('dev server');
    expect(titleOf({ cmd: 'cargo test -p search --release' })).toBe('cargo test');
    expect(titleOf({ cmd: 'pnpm exec playwright test checkout.spec.ts --project chromium' })).toBe('playwright test');
    expect(titleOf({ cmd: "tmux new-session -d -s docs 'mdbook serve -p 3000'" })).toBe('mdbook serve');
    expect(titleOf({ cmd: '/opt/homebrew/bin/python3 -m http.server 8000' })).toBe('http.server');
    expect(titleOf({ cmd: "/bin/sh -c 'node scripts/watch.mjs'" })).toBe('node');
    expect(titleOf({ cmd: '/bin/sh /Users/me/run.sh' })).toBe('sh');
    expect(titleOf({ cmd: '/Users/me/bin/grafana-server --config x.ini' })).toBe('grafana-server');
  });

  it("says its state in a pill: running, ok, failed (the only red), stopped, unknown code", () => {
    const run = proc({});
    expect(pillOf(run, stateOf(run), NOW)).toMatchObject({ glyph: '∿', tone: 'dim', words: 'running · 4 min' });
    const ok = proc({ state: { is: 'exited', rc: 0 }, started_ms: NOW - 3 * MIN, ended_ms: NOW - 3 * MIN + 134 * S });
    expect(pillOf(ok, stateOf(ok), NOW)).toMatchObject({ glyph: '✓', tone: 'ink', words: 'exit 0 · ran 2 min 14 s' });
    const bad = proc({ state: { is: 'exited', rc: 1 }, started_ms: NOW - MIN, ended_ms: NOW - MIN + 38 * S });
    expect(pillOf(bad, stateOf(bad), NOW)).toMatchObject({ glyph: '✗', tone: 'err', words: 'exit 1 · after 38 s', tip: 'exit 1: the command reported a failure' });
    const you = proc({ state: { is: 'stopped_by_you' }, ended_ms: new Date(2026, 9, 27, 14, 21).getTime() });
    expect(pillOf(you, stateOf(you), NOW)).toMatchObject({ glyph: '–', words: 'stopped by you · 14:21' });
    const unknown = proc({ state: { is: 'exited' }, ended_ms: NOW });
    expect(pillOf(unknown, stateOf(unknown), NOW)).toMatchObject({ glyph: '·', tone: 'dim', words: 'ended · no exit code' });
  });

  it('says where and when, its pid and tree while it runs, how long a stopped one ran', () => {
    const run = proc({ started_ms: new Date(2026, 9, 27, 14, 2).getTime() });
    expect(metaTail(run, stateOf(run), 'acme › perf')).toEqual(['in acme › perf', '14:02', 'pid 21304', '3 processes']);
    const ended = proc({ state: { is: 'exited', rc: 0 }, started_ms: new Date(2026, 9, 27, 13, 40).getTime(), ended_ms: new Date(2026, 9, 27, 13, 42).getTime() });
    expect(metaTail(ended, stateOf(ended), '')).toEqual(['13:40', 'ended 13:42']);
    const you = proc({ state: { is: 'stopped_by_you' }, started_ms: NOW - 23 * MIN, ended_ms: NOW });
    expect(metaTail(you, stateOf(you), 'acme')).toEqual(['in acme', '13:43', 'ran 23 min']);
  });

  it('says why no output is kept, from its command, then where its stdout points', () => {
    expect(noneOf({ cmd: "tmux new-session -d -s docs 'mdbook serve -p 3000'", fd1: 'null' })).toMatchObject({ k: 'tmux', copy: 'tmux attach -t docs' });
    expect(noneOf({ cmd: 'node server.js > /dev/null 2>&1' })).toMatchObject({ k: 'null' });
    expect(noneOf({ cmd: 'node server.js 2>/dev/null', fd1: 'tty' })).toMatchObject({ k: 'tty', why: 'No output kept: it writes to a terminal, not to a file bise can read.' });
    expect(noneOf({ cmd: "tail -f log | grep 'a|b'" })).toMatchObject({ k: 'pipe', why: 'No output kept: its output goes into another program (| grep).' });
    expect(noneOf({ cmd: 'make || true', fd1: 'pipe' })).toMatchObject({ k: 'pipe', why: 'No output kept: its output goes into another program.' });
    expect(noneOf({ cmd: 'x', fd1: 'socket' }).k).toBe('socket');
    expect(noneOf({ cmd: 'x', fd1: 'closed' }).k).toBe('closed');
    expect(noneOf({ cmd: 'x' }).k).toBe('unknown');
    expect(nullOut('a &>/dev/null')).toBe(true);
    expect(nullOut('a 2> /dev/null')).toBe(false);
    expect(pipeTo("echo 'a | b'")).toBeNull();
    expect(tmuxSession('tmux attach -t docs')).toBeNull();
  });

  it("says nothing printed yet while it runs, and that it ended silent", () => {
    const run = proc({ started_ms: NOW - 40 * S });
    expect(quietOf(run, stateOf(run), NOW)).toMatchObject({ k: 'yet', todo: 'Running for 40 s. Its output shows here as soon as it writes.' });
    const done = proc({ state: { is: 'exited', rc: 0 }, ended_ms: NOW });
    expect(quietOf(done, stateOf(done), NOW)).toMatchObject({ k: 'ended', why: 'It ended without printing anything.' });
  });

  it('keeps 2 min of samples, once per scan, and draws them from the right', () => {
    let ring: readonly Sample[] = [];
    for (let i = 0; i < 70; i++) ring = pushSample(ring, { at: i * 2 * S, cpu: i, mb: 100 });
    expect(ring.length).toBe(60);
    expect(ring[0]?.cpu).toBe(10);
    expect(pushSample(ring, { at: 138 * S + 10, cpu: 69, mb: 100 })).toBe(ring);
    expect(curve([1], 240, 40)).toBeNull();
    const c = curve([0, 10], 240, 40, 1);
    expect(c?.line.startsWith('M235.9 40')).toBe(true);
    expect(c?.line.endsWith('L240 3.6')).toBe(true);
    expect(memWords(412)).toBe('412 MB');
    expect(memWords(1229)).toBe('1.2 GB');
    expect(durWords(134 * S)).toBe('2 min 14 s');
    expect(durWords(64 * MIN)).toBe('1 h 4 min');
  });

  it('finds the first error of a failed output', () => {
    expect(firstError(['Running 6 tests', '  ✓ cart', '  ✘ checkout › pays (12.0 s)', 'Error: expect'])).toBe(2);
    expect(firstError(['error[E0308]: mismatched types'])).toBe(0);
    expect(firstError(['all good', 'no errors here'])).toBeNull();
  });
});
