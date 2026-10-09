import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { CoreExit, CoreState } from '../../shared/api';
import { Backoff, configOf, coreArgs, coreEnv } from './env';
import { eventOf, LineSplitter, lineOf, NL, notAnEventLog } from './lines';
import { CoreProcess } from './process';

describe('lines', () => {
  it('gives a line only once its newline came, at any chunk boundary', () => {
    const s = new LineSplitter();
    expect(s.feed('{"ev":"a"')).toEqual([]);
    expect(s.feed('}' + NL + '{"ev"')).toEqual(['{"ev":"a"}']);
    expect(s.feed(':"b"}' + String.fromCharCode(13) + NL + NL)).toEqual(['{"ev":"b"}', '']);
    expect(s.pending).toBe('');
  });

  it('an event is a JSON object with a string ev; a command an object with a string cmd', () => {
    expect(eventOf('{"ev":"welcome","project":"p"}')).toEqual({ ev: 'welcome', project: 'p' });
    expect(eventOf('{"cmd":"x"}')).toBeNull();
    expect(eventOf('[1]')).toBeNull();
    expect(eventOf('not json')).toBeNull();
    expect(eventOf('')).toBeNull();
    expect(lineOf({ cmd: 'stop', project: 'p', agent: 'a' })).toBe('{"cmd":"stop","project":"p","agent":"a"}' + NL);
    expect(lineOf({ ev: 'x' })).toBeNull();
    expect(lineOf('stop')).toBeNull();
    expect(lineOf(null)).toBeNull();
  });

  it("logs a line that is not an event, never a computer use still's bytes (S29)", () => {
    expect(notAnEventLog('not an event')).toBe('core: not an event: not an event');
    expect(notAnEventLog('x'.repeat(300))).toBe(`core: not an event: ${'x'.repeat(200)}`);
    const broken = '{"ev":"computer_peek","key":"h.perf","shot":{"data":"U0VDUkVU';
    expect(notAnEventLog(broken)).toBe(`core: not an event: a computer_peek line (${String(broken.length)} bytes, not logged)`);
    expect(notAnEventLog('"shot":{"data":"U0VDUkVU')).not.toContain('U0VDUkVU');
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

  it("drops the launcher's agent plumbing and the app's own config", () => {
    const env = coreEnv({ HOME: '/h', PATH: '/bin', SB_AGENT: 'x', BISE_ROLE: 'r', BEND_HUB_SOCKET: 's', TERM: 'xterm', GHOSTTY_X: '1', BISE_DESKTOP_BISE: '/b', ELECTRON_RUN_AS_NODE: '1', BISE_HOME: '/bh' });
    expect(env).toEqual({ HOME: '/h', PATH: '/bin', BISE_HOME: '/bh' });
  });

  it('backs off 0.5 doubling to 30, back to 0.5 after a healthy run', () => {
    const b = new Backoff();
    expect([b.after(0), b.after(1), b.after(1)]).toEqual([0.5, 1, 2]);
    for (let i = 0; i < 10; i += 1) b.after(0);
    expect(b.after(0)).toBe(30);
    expect(b.after(60)).toBe(0.5);
  });
});

/** A fake `bise`: answers `ambient-core` with a welcome, echoes each command, exits on {cmd:'quit'}. */
function fakeBise(dir: string, after: readonly string[] = ["process.stdout.write('not an event' + NL);"]): string {
  const path = join(dir, 'bise');
  const script = [
    '#!/usr/bin/env node',
    "const NL = String.fromCharCode(10);",
    "const out = (o) => process.stdout.write(JSON.stringify(o) + NL);",
    "process.stderr.write('fake core ' + process.argv.slice(2).join(' ') + NL);",
    "out({ ev: 'welcome', project: 'p', proto: 1, workspace: process.cwd(), name: process.argv.slice(2).join(' ') });",
    ...after,
    "let rest = '';",
    "process.stdin.setEncoding('utf8');",
    "process.stdin.on('data', (c) => { const parts = (rest + c).split(NL); rest = parts.pop(); for (const l of parts) { const cmd = JSON.parse(l); if (cmd.cmd === 'quit') process.exit(3); out({ ev: 'echo', cmd }); } });",
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
    expect(events[1]).toEqual({ ev: 'echo', cmd: { cmd: 'stop', project: 'p', agent: 'a' } });

    // it exits: down, then started again after the backoff (0.5 * 10 ms here)
    core.send({ cmd: 'quit' });
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
    const peek = `{"ev":"computer_peek","key":"h.perf","shot":{"data":"${data}","mime":"image/jpeg","width":640,"height":400,"at_ms":9}}`;
    const events: Record<string, unknown>[] = [];
    const logs: string[] = [];
    const core = new CoreProcess(
      { config: { bise: fakeBise(dir, [`process.stdout.write('${peek}' + NL);`, `process.stdout.write('${peek.slice(0, 80)}' + NL);`, "process.stdout.write('done' + NL);"]), workspace: dir }, env: { PATH: process.env['PATH'] }, scale: 10 },
      { onEvent: (e) => events.push(e), onState: () => undefined, log: (l) => logs.push(l) },
    );
    core.start();
    await waitFor(() => logs.some((l) => l === 'core: not an event: done'));
    core.stop();
    expect(events.find((e) => e['ev'] === 'computer_peek')).toEqual(JSON.parse(peek));
    expect(logs.some((l) => l.includes('a computer_peek line'))).toBe(true);
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

