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
    // the tool row's '+', mic and menus: the 6% fill and ink (mockup 1: 28 square)
    ['the tools (+, the mic)', /\.cmp-tool:hover,\s*\.b-composer \.cmp-tool\[aria-expanded='true'\]\s*\{[^}]*background: var\(--c-hover\)/],
    ['the send (on or stop, never off)', /\.send:not\(:disabled\):not\(\.off\):hover\s*\{[^}]*background:/],
  ])('%s has a hover', (_, rule) => {
    expect(rules).toMatch(rule);
  });

  it('a row of the @ $ / list: the ds Picker tints the row under the pointer (its active row)', () => {
    const picker = readFileSync(join(__dirname, '../ds/css/picker.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(picker).toMatch(/\.b-picker-row\.on\s*\{[^}]*background:/);
  });

  it('the mic is a 28 square tool beside send, like the +', () => {
    expect(rules).toMatch(/\.b-composer \.cmp-plus,\s*\.b-composer \.cmp-mic\s*\{[^}]*width: var\(--h-control-sm\)/);
  });
});
