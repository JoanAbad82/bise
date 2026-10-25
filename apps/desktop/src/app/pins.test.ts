// Pins (d5): his pinned agents read from the prefs, a pin and an unpin as the list prefs_set
// writes, a renamed agent's old key dropped, a dead pin never shown.
import { describe, expect, it } from 'vitest';
import type { Agent } from '@/proto';
import { isPinned, livePins, namesOf, pinned, pinsOf } from './pins';

const agent = (name: string) => ({ name }) as Agent;

describe('pinsOf', () => {
  it('reads every project’s pins in pin order, strings only, each once', () => {
    const prefs = { pins: { acme: ['perf', 'docs', 'perf', 3], shop: ['gift-cards'] }, theme: 'dark' };
    expect(pinsOf(prefs)).toEqual([
      { project: 'acme', agent: 'perf' },
      { project: 'acme', agent: 'docs' },
      { project: 'shop', agent: 'gift-cards' },
    ]);
  });

  it('reads nothing from no prefs or a broken value', () => {
    expect(pinsOf(null)).toEqual([]);
    expect(pinsOf({ pins: ['perf'] })).toEqual([]);
    expect(namesOf('perf')).toEqual([]);
  });
});

describe('pinned', () => {
  it('adds a pin at the end, once', () => {
    expect(pinned(['docs'], 'perf', true)).toEqual(['docs', 'perf']);
    expect(pinned(['perf', 'docs'], 'perf', true)).toEqual(['docs', 'perf']);
  });

  it('removes an unpinned agent', () => {
    expect(pinned(['docs', 'perf'], 'perf', false)).toEqual(['docs']);
  });

  it('drops the names no longer in the rows (a rename’s old key)', () => {
    expect(pinned(['old-name', 'docs'], 'perf', true, ['docs', 'perf'])).toEqual(['docs', 'perf']);
  });
});

describe('livePins', () => {
  it('shows only the pins whose agent is still in its project’s rows', () => {
    const pins = [
      { project: 'acme', agent: 'perf' },
      { project: 'acme', agent: 'gone' },
    ];
    const live = livePins(pins, (p) => (p === 'acme' ? [agent('perf'), agent('docs')] : []));
    expect(live).toEqual([{ project: 'acme', agent: 'perf' }]);
    expect(isPinned(live, 'acme', 'perf')).toBe(true);
    expect(isPinned(live, 'acme', 'gone')).toBe(false);
  });
});
