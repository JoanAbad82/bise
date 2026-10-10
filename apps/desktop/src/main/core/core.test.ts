import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { CoreExit, CoreState } from '../../shared/api';
import { Backoff, configOf, coreArgs } from './env';
import { initializeLine, INITIALIZED_LINE, LineSplitter, NL, notAnEventLog, readLine, refusedLog, requestOf } from './lines';
import { CoreProcess } from './process';

describe('lines', () => {
  it('gives a line only once its newline came, at any chunk boundary', () => {
    const s = new LineSplitter();
    expect(s.feed('{"ev":"a"')).toEqual([]);
    expect(s.feed('}' + NL + '{"ev"')).toEqual(['{"ev":"a"}']);
    expect(s.feed(':"b"}' + String.fromCharCode(13) + NL + NL)).toEqual(['{"ev":"b"}', '']);
    expect(s.pending).toBe('');
  });

  it('a notification is the event the store reads; an answer has its id; anything else is null', () => {
    expect(readLine('{"jsonrpc":"2.0","method":"hub/welcome","params":{"project":"p"}}')).toEqual({ kind: 'event', ev: { ev: 'welcome', project: 'p' } });
    expect(readLine('{"jsonrpc":"2.0","method":"core/phase","params":{"phase":"idle"}}')).toEqual({ kind: 'event', ev: { ev: 'phase', phase: 'idle' } });
    expect(readLine('{"jsonrpc":"2.0","method":"core/hush"}')).toEqual({ kind: 'event', ev: { ev: 'hush' } });
    expect(readLine('{"jsonrpc":"2.0","id":3,"result":{}}')).toEqual({ kind: 'answer', id: 3, result: {}, error: null });
    expect(readLine('{"jsonrpc":"2.0","id":4,"error":{"code":-32602,"message":"answer: no card id"}}')).toEqual({ kind: 'answer', id: 4, result: null, error: { code: -32602, message: 'answer: no card id' } });
    // the older lines, another family, a request, not JSON: not the protocol
    expect(readLine('{"ev":"welcome","project":"p"}')).toBeNull();
    expect(readLine('{"jsonrpc":"2.0","method":"other/x","params":{}}')).toBeNull();
    expect(readLine('{"jsonrpc":"2.0","id":1,"method":"core/x"}')).toBeNull();
    expect(readLine('[1]')).toBeNull();
    expect(readLine('not json')).toBeNull();
    expect(readLine('')).toBeNull();
  });

  it("a command is a request: hub/<cmd> with a project's hub's tag and its project, core/<cmd> otherwise", () => {
    expect(requestOf(5, { cmd: 'stop', project: 'p', agent: 'a' })).toEqual({ method: 'hub/stop', line: '{"jsonrpc":"2.0","id":5,"method":"hub/stop","params":{"project":"p","agent":"a"}}' + NL });
    expect(requestOf(6, { cmd: 'stop', agent: 'a' })?.method).toBe('core/stop');
    expect(requestOf(7, { cmd: 'skills', project: 'p' })?.method).toBe('core/skills');
    expect(requestOf(8, { cmd: 'computer', act: 'peek', key: 'h.d' })?.line).toBe('{"jsonrpc":"2.0","id":8,"method":"core/computer","params":{"act":"peek","key":"h.d"}}' + NL);
    expect(requestOf(1, { ev: 'x' })).toBeNull();
    expect(requestOf(1, 'stop')).toBeNull();
    expect(requestOf(1, null)).toBeNull();
    expect(JSON.parse(initializeLine('1.2'))).toEqual({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { proto: 1, client: { name: 'bise-desktop', version: '1.2' } } });
    expect(JSON.parse(INITIALIZED_LINE)).toEqual({ jsonrpc: '2.0', method: 'initialized' });
    expect(refusedLog('core/answer', { code: -32602, message: 'answer: no card id' })).toBe('core: core/answer refused (-32602): answer: no card id');
    expect(refusedLog('core/key_set', { code: -32602, message: 'key "sk-SECRET"' })).toBe('core: core/key_set refused (-32602)');
  });

  it("logs a line that is not an event, never a computer use still's bytes (S29)", () => {
    expect(notAnEventLog('not an event')).toBe('core: not an event: not an event');
    expect(notAnEventLog('x'.repeat(300))).toBe(`core: not an event: ${'x'.repeat(200)}`);
    const broken = '{"jsonrpc":"2.0","method":"core/computer_peek","params":{"key":"h.perf","shot":{"data":"U0VDUkVU';
    expect(notAnEventLog(broken)).toBe(`core: not an event: a core/computer_peek line (${String(broken.length)} bytes, not logged)`);
    expect(notAnEventLog('{"ev":"computer_peek","shot":{"data":"U0VDUkVU')).not.toContain('U0VDUkVU');
    expect(notAnEventLog('"shot":{"data":"U0VDUkVU')).not.toContain('U0VDUkVU');
    expect(notAnEventLog('{"jsonrpc":"2.0","method":"core/key_set","params":{"key":"sk-SECRET"')).not.toContain('SECRET');
  });
});

describe('env', () => {
  it('never runs PATH\'s bise: a path or nothing', () => {
    expect(configOf('bise', {})).toBeNull();
    expect(configOf(null, {})).toBeNull();
    expect(configOf('/opt/bise', { BISE_DESKTOP_WORKSPACE: '/w' })).toEqual({ bise: '/opt/bise', workspace: '/w' });
    expect(configOf('/opt/bise', {})).toEqual({ bise: '/opt/bise', workspace: '' });
  });

  it('runs ambient-core on the workspace, or --home', () => {
    expect(coreArgs('')).toEqual(['ambient-core', '--home']);
    expect(coreArgs('/w')).toEqual(['ambient-core', '--workspace', '/w']);
  });

  it('backs off 0.5 doubling to 30, back to 0.5 after a healthy run', () => {
    const b = new Backoff();
    expect([b.after(0), b.after(1), b.after(1)]).toEqual([0.5, 1, 2]);
    for (let i = 0; i < 10; i += 1) b.after(0);
    expect(b.after(0)).toBe(30);
    expect(b.after(60)).toBe(0.5);
  });
});

/**
 * A fake `bise`: speaks JSON-RPC as `ambient-core` does: answers initialize, then
 * (after initialized) a welcome and `after`'s lines; answers each request {} and echoes
 * it; refuses core/nope; exits on core/quit.
 */
function fakeBise(dir: string, after: readonly string[] = ["process.stdout.write('not an event' + NL);"]): string {
  const path = join(dir, 'bise');
  const script = [
    '#!/usr/bin/env node',
    "const NL = String.fromCharCode(10);",
    "const out = (o) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...o }) + NL);",
    "const note = (method, params) => out({ method, params });",
    "process.stderr.write('fake core ' + process.argv.slice(2).join(' ') + NL);",
    "let rest = '';",
    "process.stdin.setEncoding('utf8');",
    "process.stdin.on('data', (c) => { const parts = (rest + c).split(NL); rest = parts.pop(); for (const l of parts) { const m = JSON.parse(l);",
    "  if (m.method === 'initialize') { out({ id: m.id, result: { proto: 1, methods: [], notifications: [] } }); continue; }",
    "  if (m.method === 'initialized') { note('hub/welcome', { project: 'p', proto: 1, workspace: process.cwd(), name: process.argv.slice(2).join(' ') });",
    ...after.map((a) => `    ${a}`),
    "    continue; }",
    "  if (m.method === 'core/quit') process.exit(3);",
    "  if (m.method === 'core/nope') { out({ id: m.id, error: { code: -32601, message: 'unknown method' } }); continue; }",
    "  out({ id: m.id, result: {} }); note('core/echo', { method: m.method, params: m.params }); } });",
    "process.stdin.on('end', () => process.exit(0));",
  ].join(NL);
  writeFileSync(path, script + NL);
  chmodSync(path, 0o755);
  return path;
}

function waitFor(cond: () => boolean, ms = 5000): Promise<void> {
  const t0 = Date.now();
  return new Promise((resolve, reject) => {
    const tick = (): void => {
      if (cond()) {
        resolve();
        return;
      }
      if (Date.now() - t0 > ms) {
        reject(new Error('timed out'));
        return;
      }
      setTimeout(tick, 10);
    };
    tick();
  });
}

describe('CoreProcess', () => {
  it('runs the core, passes events and commands as lines, restarts it after an exit, stops it', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'bise-core-test-'));
    const logFile = join(dir, 'core.log');
    const events: Record<string, unknown>[] = [];
    const states: CoreState[] = [];
    const logs: string[] = [];
    const core = new CoreProcess(
      { config: { bise: fakeBise(dir), workspace: dir }, logFile, env: { PATH: process.env['PATH'], SB_AGENT: 'leak' }, scale: 10 },
      { onEvent: (e) => events.push(e), onState: (s) => states.push(s), log: (l) => logs.push(l) },
    );
    expect(core.send({ cmd: 'stop', project: 'p', agent: 'a' })).toBe(false);
    core.start();
    await waitFor(() => events.length === 1);
    expect(events[0]).toMatchObject({ ev: 'welcome', name: `ambient-core --workspace ${dir}` });
    expect(states).toEqual(['starting', 'up']);
    await waitFor(() => logs.some((l) => l.startsWith('core: not an event: not an event')));

    expect(core.send({ cmd: 'stop', project: 'p', agent: 'a' })).toBe(true);
    expect(core.send({ nope: 1 })).toBe(false);
    await waitFor(() => events.length === 2);
    expect(events[1]).toEqual({ ev: 'echo', method: 'hub/stop', params: { project: 'p', agent: 'a' } });
    // a refused request is logged with its method
    expect(core.send({ cmd: 'nope' })).toBe(true);
    await waitFor(() => logs.some((l) => l === 'core: core/nope refused (-32601): unknown method'));

    // it exits: down, then started again after the backoff (0.5 * 10 ms here)
    core.send({ cmd: 'quit' }); // core/quit: the fake exits
    await waitFor(() => events.filter((e) => e['ev'] === 'welcome').length === 2);
    expect(states).toEqual(['starting', 'up', 'down', 'starting', 'up']);

    core.stop();
    expect(core.state).toBe('down');
    expect(core.send({ cmd: 'stop', project: 'p', agent: 'a' })).toBe(false);
    await waitFor(() => readFileSync(logFile, 'utf8').split(NL).filter((l) => l.startsWith('fake core')).length === 2);
  });

  it("passes a computer use still to the window and never logs it, whole or broken (S29, architect m_14385)", async () => {
    const dir = mkdtempSync(join(tmpdir(), 'bise-core-test-'));
    const data = 'U0VDUkVULVNDUkVFTi1CWVRFUw==';
    const peek = `{"jsonrpc":"2.0","method":"core/computer_peek","params":{"key":"h.perf","shot":{"data":"${data}","mime":"image/jpeg","width":640,"height":400,"at_ms":9}}}`;
    const events: Record<string, unknown>[] = [];
    const logs: string[] = [];
    const core = new CoreProcess(
      { config: { bise: fakeBise(dir, [`process.stdout.write('${peek}' + NL);`, `process.stdout.write('${peek.slice(0, 80)}' + NL);`, "process.stdout.write('done' + NL);"]), workspace: dir }, env: { PATH: process.env['PATH'] }, scale: 10 },
      { onEvent: (e) => events.push(e), onState: () => undefined, log: (l) => logs.push(l) },
    );
    core.start();
    await waitFor(() => logs.some((l) => l === 'core: not an event: done'));
    core.stop();
    expect(events.find((e) => e['ev'] === 'computer_peek')).toEqual({ ev: 'computer_peek', ...(JSON.parse(peek) as { params: object }).params });
    expect(logs.some((l) => l.includes('a core/computer_peek line'))).toBe(true);
    expect(logs.filter((l) => l.includes('U0VDUkVU') || l.includes('"shot"'))).toEqual([]);
  });

  it('a bise that cannot start is down and retried, never a crash', async () => {
    const states: CoreState[] = [];
    const core = new CoreProcess(
      { config: { bise: '/nonexistent/bise', workspace: '' }, scale: 10 },
      { onEvent: () => undefined, onState: (s) => states.push(s), log: () => undefined },
    );
    core.start();
    await waitFor(() => states.filter((s) => s === 'down').length >= 2);
    core.stop();
    expect(states.includes('up')).toBe(false);
  });

  it('says how a run ended: a panic is a crash with its message and the log; only this run\'s stderr counts', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'bise-core-test-'));
    const logFile = join(dir, 'core.log');
    writeFileSync(logFile, `an older run's last words${NL}`);
    const bise = join(dir, 'bise');
    writeFileSync(
      bise,
      [
        '#!/bin/sh',
        'echo "ambient-core: hello" >&2',
        'echo "thread \'main\' panicked at tui/src/ambient/core.rs:120:9:" >&2',
        'echo "no hub for sk-ant-SECRETSECRET1234" >&2',
        "echo 'note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace' >&2",
        'exit 101',
      ].join(NL) + NL,
    );
    chmodSync(bise, 0o755);
    const exits: CoreExit[] = [];
    const core = new CoreProcess(
      { config: { bise, workspace: '' }, logFile, scale: 1000 },
      { onEvent: () => undefined, onState: () => undefined, log: () => undefined, onExit: (e) => exits.push(e) },
    );
    core.start();
    await waitFor(() => exits.length === 1);
    core.stop();
    expect(exits[0]).toMatchObject({ how: 'code', code: 101, crash: true, log: logFile });
    expect(exits[0]?.last).toBe('no hub for …');
  });

  it('a core killed by SIGSEGV is a crash; one that exits 0 is clean; stop() says nothing', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'bise-core-test-'));
    const logFile = join(dir, 'core.log');
    const bise = join(dir, 'bise');
    writeFileSync(bise, ['#!/bin/sh', 'echo "about to fall" >&2', 'kill -SEGV $$'].join(NL) + NL);
    chmodSync(bise, 0o755);
    const exits: CoreExit[] = [];
    const core = new CoreProcess(
      { config: { bise, workspace: '' }, logFile, scale: 1000 },
      { onEvent: () => undefined, onState: () => undefined, log: () => undefined, onExit: (e) => exits.push(e) },
    );
    core.start();
    await waitFor(() => exits.length === 1);
    core.stop();
    expect(exits[0]).toMatchObject({ how: 'signal', signal: 'SIGSEGV', crash: true, last: 'about to fall', log: logFile });

    writeFileSync(bise, ['#!/bin/sh', 'echo "done" >&2', 'exit 0'].join(NL) + NL);
    const clean: CoreExit[] = [];
    const c2 = new CoreProcess(
      { config: { bise, workspace: '' }, logFile, scale: 1000 },
      { onEvent: () => undefined, onState: () => undefined, log: () => undefined, onExit: (e) => clean.push(e) },
    );
    c2.start();
    await waitFor(() => clean.length === 1);
    c2.stop();
    expect(clean[0]).toMatchObject({ how: 'clean', code: 0, crash: false, last: 'done', log: null });
    const n = clean.length;
    c2.start();
    c2.stop();
    await new Promise((r) => setTimeout(r, 200));
    expect(clean.length - n).toBeLessThanOrEqual(1);
  });
});

