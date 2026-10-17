import { describe, expect, it } from 'vitest';
import { crashLoop, earlyEnd, exitOf, failedToStart, lastLine, reasonOf, redactLine } from './exit';

const NL = String.fromCharCode(10);

describe('earlyEnd (architect m_18354: a core that ends before initialize never loops in silence)', () => {
  const code = (last: string) => exitOf(1, null, last, null, 0);
  const crash = exitOf(null, 'SIGSEGV', '', '/log', 0);
  const NO_ROOT = 'repl-live not found: no VERSION next to the executable';
  it.each([
    ['a first early end restarts and remembers its line', null, code(NO_ROOT), false, { last: NO_ROOT, giveUp: false }],
    ['the same early end twice in a row gives up', NO_ROOT, code(NO_ROOT), false, { last: NO_ROOT, giveUp: true }],
    ['another line before initialize: one more try', NO_ROOT, code('ambient-core: refused: jail'), false, { last: 'ambient-core: refused: jail', giveUp: false }],
    ['a run that wrote nothing twice gives up too', '', code(''), false, { last: '', giveUp: true }],
    ['a crash after initialize restarts as today (crashLoop counts it)', NO_ROOT, crash, true, { last: null, giveUp: false }],
    ['an exit code after initialize restarts and resets', NO_ROOT, code(NO_ROOT), true, { last: null, giveUp: false }],
    ['a clean exit never gives up', '', exitOf(0, null, '', null, 0), false, { last: null, giveUp: false }],
  ] as const)('%s', (_name, prev, e, answered, want) => {
    expect(earlyEnd(prev, e, answered)).toEqual(want);
  });
});

describe('exitOf', () => {
  it('a clean exit, an exit code, a signal', () => {
    expect(exitOf(0, null, `bye${NL}`, '/u/core.log', 5)).toEqual({ how: 'clean', code: 0, signal: null, crash: false, last: 'bye', log: null, at_ms: 5 });
    expect(exitOf(2, null, `ambient-core: no hub${NL}`, '/u/core.log', 5)).toMatchObject({ how: 'code', code: 2, crash: false, last: 'ambient-core: no hub', log: null });
    expect(exitOf(null, 'SIGTERM', '', '/u/core.log', 5)).toMatchObject({ how: 'signal', code: null, signal: 'SIGTERM', crash: false, last: '', log: null });
  });

  it('a crash: a fatal signal or a Rust panic, with the log to look at', () => {
    for (const sig of ['SIGSEGV', 'SIGABRT', 'SIGBUS', 'SIGILL']) {
      expect(exitOf(null, sig, `working${NL}`, '/u/core.log', 5)).toMatchObject({ how: 'signal', crash: true, log: '/u/core.log', last: 'working' });
    }
    const panic = [`ambient-core: hello`, `thread 'main' panicked at tui/src/ambient/core.rs:120:9:`, `index out of bounds: the len is 0 but the index is 3`, 'note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace', ''].join(NL);
    expect(exitOf(101, null, panic, '/u/core.log', 5)).toMatchObject({ how: 'code', code: 101, crash: true, log: '/u/core.log', last: 'index out of bounds: the len is 0 but the index is 3' });
  });
});

describe('lastLine', () => {
  it('the last line that says something; an old-style panic line itself', () => {
    expect(lastLine(['a', 'b', '', '  '])).toBe('b');
    expect(lastLine([])).toBe('');
    expect(lastLine(["thread 'main' panicked at 'boom', src/x.rs:1:2", 'note: run with `RUST_BACKTRACE=1` ...'])).toBe("thread 'main' panicked at 'boom', src/x.rs:1:2");
  });
});

describe('redactLine', () => {
  it('never a key, a token or a password', () => {
    const lines = [
      'auth failed for sk-ant-api03-ABCDEFGHIJKLMNOP',
      'GET /v1 Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.payload.sig',
      'MISTRAL_API_KEY=abcdef123456 not set',
      '{"cmd":"provider_use","id":"anthropic","key":"sk-secret-1234567"}',
      'config: {"api_key": "s3cr3tvalue", "model": "x"}',
      'token: ghp_abcdefghijklmnopqrst',
      'password=hunter22',
    ];
    for (const l of lines) {
      const r = redactLine(l);
      for (const secret of ['ABCDEFGHIJKLMNOP', 'eyJhbGciOiJIUzI1NiJ9', 'abcdef123456', 'sk-secret', 's3cr3tvalue', 'ghp_abcdefghij', 'hunter22']) expect(r).not.toContain(secret);
    }
    expect(redactLine('{"cmd":"provider_use","key":"sk-x"')).toBe("(a provider_use line that isn't JSON)");
    expect(redactLine('  the hub did not start  ')).toBe('the hub did not start');
  });
  it('at most 300 characters', () => {
    expect(redactLine('x'.repeat(1000))).toHaveLength(300);
  });
});

describe('failedToStart', () => {
  it('says why, never a crash', () => {
    expect(failedToStart('spawn /nope ENOENT', 1)).toEqual({ how: 'failed', code: null, signal: null, crash: false, last: 'spawn /nope ENOENT', log: null, at_ms: 1 });
  });
});

describe('crashLoop (designer: after 3 crashes in 10 min it stops trying)', () => {
  const min = 60 * 1000;
  it('a first and a second crash restart; the third within 10 min stops', () => {
    expect(crashLoop([], 0)).toEqual({ times: [0], count: 1, stop: false });
    expect(crashLoop([0], 2 * min)).toMatchObject({ count: 2, stop: false });
    expect(crashLoop([0, 2 * min], 9 * min)).toMatchObject({ count: 3, stop: true });
  });
  it('crashes older than 10 min no longer count', () => {
    expect(crashLoop([0, 2 * min], 11 * min)).toMatchObject({ times: [2 * min, 11 * min], count: 2, stop: false });
  });
});

describe('reasonOf (the words after the colon)', () => {
  const sig = { SIGSEGV: 11, SIGABRT: 6 };
  const base = { code: null, signal: null, crash: false, last: '', log: null, at_ms: 0 } as const;
  it('a signal by its number, an exit code, a panic by its message, a failed start', () => {
    expect(reasonOf({ ...base, how: 'signal', signal: 'SIGSEGV', crash: true }, sig)).toBe('core exited with signal 11');
    expect(reasonOf({ ...base, how: 'code', code: 2 }, sig)).toBe('core exited with code 2');
    expect(reasonOf({ ...base, how: 'code', code: 101, crash: true, last: 'index out of bounds' }, sig)).toBe('core panicked: index out of bounds');
    expect(reasonOf({ ...base, how: 'failed', last: 'ENOENT' }, sig)).toBe("core couldn't start: ENOENT");
    expect(reasonOf({ ...base, how: 'signal', signal: 'SIGWHAT', crash: true }, sig)).toBe('core exited with signal SIGWHAT');
  });
});
