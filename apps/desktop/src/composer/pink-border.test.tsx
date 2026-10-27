// @vitest-environment happy-dom
// The composer's border is pink whenever his words go to an agent that is not the project's main,
// never for main (his m_47126, designer m_47129): an agent opened directly, an inbox reply to
// another agent's item, one with an artifact open behind it. pinkState (thread/tab.ts) says
// which; this checks what the frame draws for each: the real ComposerFrame with the real
// stylesheets, read back with getComputedStyle (happy-dom lays nothing out: the cascade's values).
// Mutation: ds/css/composer.css's border back to '.box.ans:not(.quiet)' turns the quiet case red.
import { cleanup, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ComposerFrame } from '@/ds';
import { pinkState } from '../thread/tab';

const css = ['../ds/tokens.css', '../ds/css/composer.css', './composer.css'];

beforeAll(() => {
  const style = document.createElement('style');
  style.textContent = css.map((f) => readFileSync(join(__dirname, f), 'utf8')).join(String.fromCharCode(10));
  document.head.append(style);
});
afterEach(cleanup);

/** the accent's 1.5 px ring, the token resolved as the cascade gives it */
const BORDER = /^0 0 0 1\.5px #b8416b$/u;
const base = { answer: null, aboutPink: undefined, about: false, agent: 'perf', voiceTyping: false, otherTip: (a: string) => `to ${a}, not bise` };

/** The box's border as the frame draws pinkState's answer. */
function border(o: Parameters<typeof pinkState>[0]): string {
  const ps = pinkState(o);
  const v = render(
    <ComposerFrame send="off" answering={ps.pink} {...(ps.quiet ? { quiet: true } : {})} head={<span />} testId="composer">
      <span />
    </ComposerFrame>,
  );
  const out = getComputedStyle(v.getByTestId('composer.box')).boxShadow;
  cleanup();
  return out;
}

describe('the composer border says whom his words go to', () => {
  it('an agent opened directly: the pink border', () => {
    expect(border(base)).toMatch(BORDER);
  });
  it("an inbox reply to another agent's item (closed, an approval, a choice), an artifact open behind it too: the pink border", () => {
    expect(border({ ...base, agent: 'main', answer: { asker: 'perf', free: 'deny' } })).toMatch(BORDER);
    expect(border({ ...base, agent: 'main', answer: { asker: 'perf', closed: true }, about: true })).toMatch(BORDER);
  });
  it("another agent's open question: the pink border", () => {
    expect(border({ ...base, agent: 'main', answer: { asker: 'perf', tip: 'q' } })).toMatch(BORDER);
  });
  it('main: never the pink border, its open question neither', () => {
    expect(border({ ...base, agent: 'main' })).not.toMatch(BORDER);
    expect(border({ ...base, agent: 'main', answer: { asker: 'main', tip: 'q' } })).not.toMatch(BORDER);
  });
});
