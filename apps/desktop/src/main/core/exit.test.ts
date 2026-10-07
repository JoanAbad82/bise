import { describe, expect, it } from 'vitest';
import { exitOf, failedToStart, lastLine, redactLine } from './exit';

const NL = String.fromCharCode(10);

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
      '{"cmd":"key_set","id":"anthropic","key":"sk-secret-1234567"}',
      'config: {"api_key": "s3cr3tvalue", "model": "x"}',
      'token: ghp_abcdefghijklmnopqrst',
      'password=hunter22',
    ];
    for (const l of lines) {
      const r = redactLine(l);
      for (const secret of ['ABCDEFGHIJKLMNOP', 'eyJhbGciOiJIUzI1NiJ9', 'abcdef123456', 'sk-secret', 's3cr3tvalue', 'ghp_abcdefghij', 'hunter22']) expect(r).not.toContain(secret);
    }
    expect(redactLine('{"cmd":"key_set","key":"sk-x"')).toBe("(a key_set line that isn't JSON)");
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
