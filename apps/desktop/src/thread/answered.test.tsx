// @vitest-environment happy-dom
// designer m_21561: his own answer reads 'you answered <agent>', its images are the signed part chip.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Entry } from '@/proto';
import { AnsweredRow } from './rows-cards';

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
    expect(r.textContent).toContain('answered gift-ui for you: which balance?');
    expect(r.textContent).toContain('the brief says v2');
  });
});
