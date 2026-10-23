import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const APP_CSS = readFileSync('src/app/app.css', 'utf8');

// a project row with no count: its name runs to the row's end (Gabriel, 'type-level-typ…'),
// the end box comes back only under the ⋯
describe('sidebar project names', () => {
  it('an empty end box takes no width at rest', () => {
    expect(APP_CSS).toMatch(
      /\.app-r:not\(:hover\):not\(:has\(\.app-more\.on, \.app-more:focus-within\)\) \.app-tail:empty \{\s*min-width: 0;/,
    );
  });
});
