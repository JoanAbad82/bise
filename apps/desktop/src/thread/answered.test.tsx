// @vitest-environment happy-dom
// designer m_21561: his own answer reads 'you answered <agent>', its images are the signed part chip.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Entry } from '@/proto';
import { AnsweredRow, shownHead, toYou } from './rows-cards';

const row = (why: string): Entry => ({
  pos: 31,
  at_ms: 1,
  kind: 'answered',
  text: 'the balance on the cart page',
  answered: { agent: 'gift-ui', question: 'which balance?', answer: 'the balance on the cart page', why, images: [{ name: '[Image #1]', path: '/nowhere/shot.png' }] },
});

afterEach(cleanup);

describe('an answered row', () => {
  it("his own answer: 'you answered gift-ui', never 'he answered'; the chip 'image 1', never the tag", () => {
    render(<AnsweredRow e={row('he answered')} />);
    const r = screen.getByTestId('thread.answered.31');
    expect(r.textContent).toContain('you answered gift-ui: which balance?');
    expect(r.textContent).not.toContain('he answered');
    expect(r.textContent).not.toContain('[Image #');
    expect(screen.getByTestId('thread.answered.31.image.1').textContent).toBe('image 1');
    expect(screen.getByTestId('thread.answered.31.image.1').className).toContain('part');
  });
  it("bise's answer for him keeps its words and its why", () => {
    render(<AnsweredRow e={row('the brief says v2')} />);
    const r = screen.getByTestId('thread.answered.31');
    expect(r.textContent).toContain('bise answered gift-ui for you: which balance?');
    expect(r.textContent).toContain('the brief says v2');
  });
});

describe("the hub's words, said to him (designer m_21658)", () => {
  it("'he showed it' -> 'you showed it'; 'you answered main' -> 'you answered bise'", () => {
    expect(toYou('he showed it')).toBe('you showed it');
    expect(toYou('He picked his own, the shell asked him')).toBe('You picked your own, the shell asked you');
    expect(toYou('the brief says v2')).toBe('the brief says v2');
    expect(shownHead('you answered main')).toBe('you answered bise');
    expect(shownHead('you answered gift-ui')).toBe('you answered gift-ui');
  });
});
