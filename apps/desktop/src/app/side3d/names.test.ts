// The agents float's names under the heads (Gabriel m_45527: 'desig…', 'side-f…' cut at 48;
// designer m_45535): a 96 cell, the name on one line in it, cut only past 96, so a 12-char name
// stays whole. The real fit is ui-review's shot; this keeps the widths that make it.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const CSS = readFileSync('src/app/side3d/side3d.css', 'utf8');
const rule = (sel: string): string => {
  const at = CSS.indexOf(`${sel} {`);
  expect(at).toBeGreaterThanOrEqual(0);
  return CSS.slice(at, CSS.indexOf('}', at));
};

/** t-12 at 500 in SF Pro: its widest lowercase average, px per char (m, w ~9; i, l ~3; '-' 5) */
const T12_CHAR = 7;

describe('the agents float names', () => {
  it('the head\'s cell is 96 wide and the name takes all of it: a 12-char name fits whole', () => {
    expect(rule('.s3-agent-who')).toMatch(/width: 96px;/);
    const name = rule('.s3-agent-name');
    expect(name).toMatch(/max-width: 100%;/);
    expect(name).toMatch(/white-space: nowrap;/);
    expect(name).toMatch(/color: var\(--c-text-2\);/);
    expect(12 * T12_CHAR).toBeLessThanOrEqual(96);
  });
});
