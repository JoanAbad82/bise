import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const APP_CSS = readFileSync('src/app/app.css', 'utf8');

// a row's name runs to the row's end (Gabriel, 'type-level-typ…'): the name takes the free width,
// and the end box (the 10 box of the dot or the ring) is drawn only when the row has an end (Sidebar's Row)
describe('sidebar names', () => {
  it('the name takes the row width left', () => {
    expect(APP_CSS).toMatch(/\.app-s-row \.nm \{\s*flex: 1;\s*min-width: 0;/);
  });
});
