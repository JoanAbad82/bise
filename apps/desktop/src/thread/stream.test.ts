import { describe, expect, it } from 'vitest';
import { dropOpenMarks, openFence, streamView } from './stream';

describe('what a streamed answer shows while it grows (text-appearing v2)', () => {
  it('a word cut in its middle waits for its end', () => {
    expect(streamView('The cold bench takes 4.1 s because the ind')).toBe('The cold bench takes 4.1 s because the ');
    expect(streamView('The cold bench ')).toBe('The cold bench ');
    expect(streamView('The')).toBe('');
    // the stream ended: the whole text
    expect(streamView('The cold', true)).toBe('The cold');
  });
  it('in an open code block a half line waits for its newline', () => {
    const t = 'see:\n\n```rust\nfn main() {\n    let x';
    expect(openFence(t)).toBe(true);
    expect(streamView(t)).toBe('see:\n\n```rust\nfn main() {\n');
    expect(openFence('```rust\nfn a() {}\n```\n')).toBe(false);
  });
  it('a table shows once its separator came, then each row once whole', () => {
    expect(streamView('sizes:\n\n| a | b |\n')).toBe('sizes:\n');
    expect(streamView('sizes:\n\n| a | b |\n|---|---|\n| 1 | 2')).toBe('sizes:\n\n| a | b |\n|---|---|\n');
    expect(streamView('sizes:\n\n| a | b |\n|---|---|\n| 1 | 2 |\n')).toBe('sizes:\n\n| a | b |\n|---|---|\n| 1 | 2 |\n');
  });
  it('an unclosed ** or backtick never shows its raw marks', () => {
    expect(dropOpenMarks('it is **really ')).toBe('it is really ');
    expect(dropOpenMarks('it is **really** fast')).toBe('it is **really** fast');
    expect(dropOpenMarks('run `cargo ')).toBe('run cargo ');
    expect(dropOpenMarks('run `cargo test` and **then ')).toBe('run `cargo test` and then ');
    // a ** inside inline code is code, not a mark
    expect(dropOpenMarks('`a ** b` ok ')).toBe('`a ** b` ok ');
    expect(streamView('first.\n\nit is **really fast ')).toBe('first.\n\nit is really fast ');
    // only the last block is open: an earlier closed one stays as written
    expect(streamView('**a** b\n\nc **d ')).toBe('**a** b\n\nc d ');
  });
});
