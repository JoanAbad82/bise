// The composer's notice (his m_29126: a refused '/bime' stayed in a box under the
// composer for many messages and pushed it up): what shows there, and which keys end it.
import { describe, expect, it } from 'vitest';
import { endsLine, monoRuns } from '@/composer';
import { noticeOf, refusedSlashOf } from './ThreadComposer';
import type { HubLine } from '@/store';

const refused: HubLine = { text: 'unknown command: /bime · see /help', level: 'error' };
const plain: HubLine = { text: 'drop of @perf cancelled', level: 'note' };

describe('noticeOf', () => {
  it("a refused line is the notice's error, on every screen", () => {
    expect(noticeOf(refused, null, false)).toEqual({ line: { level: 'err', text: refused.text, testId: 'confirm.notice' }, hub: refused });
    expect(noticeOf(refused, null, true)?.line.level).toBe('err');
  });
  it("the refused line wins over the composer's own note", () => {
    expect(noticeOf(refused, { level: 'info', text: 'nothing waits' }, false)?.hub).toBe(refused);
  });
  it("the composer's note shows, owned by no hub line", () => {
    expect(noticeOf(null, { level: 'info', text: 'nothing waits' }, false)).toEqual({ line: { level: 'info', text: 'nothing waits', testId: 'composer.answer.note' }, hub: null });
  });
  it("a plain hub line shows only where no thread row says it", () => {
    expect(noticeOf(plain, null, false)).toBeNull();
    expect(noticeOf(plain, null, true)).toEqual({ line: { level: 'info', text: plain.text, testId: 'confirm.notice' }, hub: plain });
    expect(noticeOf({ ...plain, restart: true, back: true }, null, true)).toBeNull();
  });
  it('nothing said: nothing shows', () => {
    expect(noticeOf(null, null, true)).toBeNull();
  });
});

describe('monoRuns', () => {
  it('commands and paths in mono, the words around them not (designer m_29135)', () => {
    expect(monoRuns('unknown command: /bime · see /help')).toEqual([
      { text: 'unknown command: ', mono: false },
      { text: '/bime', mono: true },
      { text: ' · see ', mono: false },
      { text: '/help', mono: true },
    ]);
    expect(monoRuns('no such file (src/a.ts).')).toEqual([
      { text: 'no such file (', mono: false },
      { text: 'src/a.ts', mono: true },
      { text: ').', mono: false },
    ]);
    expect(monoRuns('~/bise/taste.md kept')).toEqual([
      { text: '~/bise/taste.md', mono: true },
      { text: ' kept', mono: false },
    ]);
  });
  it('plain words and a lone slash stay sans', () => {
    expect(monoRuns('yes / no, and/or')).toEqual([{ text: 'yes / no, and/or', mono: false }]);
  });
});

describe('refusedSlashOf', () => {
  it("the hub's refusal or notice for a slash line of this project; anything else is not", () => {
    expect(refusedSlashOf({ ev: 'error', cmd: 'slash', project: 'p', text: 'x' }, 'p')).toBe(true);
    expect(refusedSlashOf({ ev: 'notice', cmd: 'slash', project: 'p', text: 'x' }, 'p')).toBe(false);
    expect(refusedSlashOf({ ev: 'error', cmd: 'slash', project: 'q', text: 'x' }, 'p')).toBeNull();
    expect(refusedSlashOf({ ev: 'error', cmd: 'queued_steer', project: 'p', text: 'x' }, 'p')).toBeNull();
  });
});

describe('endsLine', () => {
  it('any key ends it, esc and ⏎ too; a lone modifier never', () => {
    for (const k of ['a', 'Escape', 'Enter', 'Backspace', '/', 'ArrowUp']) expect(endsLine(k)).toBe(true);
    for (const k of ['Shift', 'Control', 'Alt', 'Meta']) expect(endsLine(k)).toBe(false);
  });
});
