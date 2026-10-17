// Bar O.6 (every control hovers): each control the composer draws has a hover in composer.css,
// even where the ds part has none of its own (the send). The harness check
// composer/controls proves it on screen (hit at its center, a change under the pointer).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// read from disk: vitest hands css imports over empty (its css: false)
const rules = readFileSync(join(__dirname, 'composer.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

describe('composer controls hover (bar O.6)', () => {
  it.each([
    // the key line's controls: the words go grey -> ink, never a fill (his m_29136)
    ['the mic', /\.keys \.mic:hover,\s*\.b-composer \.keys \.mic:hover \.kk\s*\{[^}]*color: var\(--c-text\)/],
    ['the send (on or stop, never off)', /\.send:not\(:disabled\):not\(\.off\):hover\s*\{[^}]*background:/],
  ])('%s has a hover', (_, rule) => {
    expect(rules).toMatch(rule);
  });

  it('a row of the @ $ / list: the ds Picker tints the row under the pointer (its active row)', () => {
    const picker = readFileSync(join(__dirname, '../ds/css/picker.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(picker).toMatch(/\.b-picker-row\.on\s*\{[^}]*background:/);
  });

  it("the mic is as wide as its words, no padding, no fill on hover: the key line's gaps are even (his m_29136)", () => {
    const mic = /\.keys \.mic \{([^}]*)\}/.exec(rules)?.[1] ?? '';
    expect(mic).toMatch(/padding: 0;/);
    expect(mic).toMatch(/margin: 0;/);
    expect(mic).not.toMatch(/min-width/);
    expect(rules).not.toMatch(/\.keys \.mic:hover\s*\{[^}]*background:/);
  });
});
