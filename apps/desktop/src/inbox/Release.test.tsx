// @vitest-environment happy-dom
// update-dot (designer m_46058): the update card, opened, says it is safe to update now, then the
// release's changelog as markdown, then 'you're on … · full notes on GitHub ↗'; no notes says so.
// Any other card draws nothing of it.
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { settings } from '@/proto/words_settings.gen';
import { ReleaseBody } from './Release';

afterEach(() => {
  cleanup();
});

const card = (notes: string) => ({
  kind: 'update',
  release: { version: 'v2026.10.3', running: 'v2026.10.2', notes },
  link: 'https://github.com/gvergnaud/bise/releases/tag/v2026.10.3',
});

describe('the update card, opened', () => {
  it('the safe line, the changelog as markdown, then the version he runs and the full notes', () => {
    render(<ReleaseBody card={card('## Fixes\n- the inbox keeps your place\n- /update from any thread')} id="c" />);
    expect(screen.getByTestId('c.release.safe').textContent).toBe(settings.bise_update_tip);
    const notes = screen.getByTestId('c.release.notes');
    expect(notes.querySelector('h2')?.textContent).toBe('Fixes');
    expect([...notes.querySelectorAll('li')].map((l) => l.textContent)).toEqual(['the inbox keeps your place', '/update from any thread']);
    expect(screen.getByTestId('c.release.foot').textContent).toBe("you're on v2026.10.2 · full notes on GitHub ↗");
    expect(screen.getByTestId('c.release.link').getAttribute('href')).toBe('https://github.com/gvergnaud/bise/releases/tag/v2026.10.3');
  });
  it('no notes: says so, no changelog box', () => {
    render(<ReleaseBody card={card('  ')} id="c" />);
    expect(screen.getByTestId('c.release.none').textContent).toBe('no notes for this release.');
    expect(screen.queryByTestId('c.release.notes')).toBeNull();
  });
  it('any other card: nothing', () => {
    const { container } = render(<ReleaseBody card={{ ...card('x'), kind: 'question' }} id="c" />);
    expect(container.innerHTML).toBe('');
  });
});
