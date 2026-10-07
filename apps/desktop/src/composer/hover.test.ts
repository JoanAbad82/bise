// Bar O.6 (every control hovers): each control the composer draws has a hover in composer.css,
// even where the ds part has none of its own (the send, the menu's rows). The harness check
// composer/controls proves it on screen (hit at its center, a change under the pointer).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// read from disk: vitest hands css imports over empty (its css: false)
const rules = readFileSync(join(__dirname, 'composer.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

describe('composer controls hover (bar O.6)', () => {
  it.each([
    ['the mic', /\.keys \.mic:hover\s*\{[^}]*background:/],
    ['the send (on or stop, never off)', /\.send:not\(:disabled\):not\(\.off\):hover\s*\{[^}]*background:/],
    ['a row of the @ $ / list (not the picked one)', /\.b-composer-pick \.b-mi:not\(\.on\):not\(\.dis\):hover\s*\{[^}]*background:/],
  ])('%s has a hover', (_, rule) => {
    expect(rules).toMatch(rule);
  });

  it("the mic's hover padding sits in a negative margin: the key line never moves", () => {
    const mic = /\.keys \.mic \{([^}]*)\}/.exec(rules)?.[1] ?? '';
    expect(mic).toMatch(/padding: 1px 4px/);
    expect(mic).toMatch(/margin: -1px -4px/);
  });
});
