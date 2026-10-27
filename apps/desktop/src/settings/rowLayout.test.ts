// settings-width (Gabriel m_48069): on 'Which model does what', the bise and Agents rows squeezed
// their label to one word per line (the model select + the efforts took the row), and the page
// stayed a 640 column in a wide window. A settings row now wraps: the label keeps its 240 at least
// and a control too wide for the rest goes under it; the page grows with the window up to its cap.
// Computed from the stylesheets themselves (happy-dom lays nothing out; vitest gives a css ?raw
// import empty, so they are read from disk), as composer/float/inset.test.ts.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { updatesShown } from './pages';

const read = (rel: string): string => readFileSync(new URL(rel, import.meta.url), 'utf8');
const dsCss = read('../ds/css/settings.css');
const settingsCss = read('./settings.css');
const tokensCss = read('../ds/tokens.css');

/** The declarations of every rule whose selector list holds `sel`, in order (a later one wins). */
function rule(css: string, sel: string): Map<string, string> {
  const blocks = css
    .replace(/\/\*[\s\S]*?\*\//gu, '')
    .split(/(?<=\})/u)
    .filter((block) => block.includes('{') && block.slice(0, block.indexOf('{')).split(',').map((s) => s.trim()).includes(sel));
  if (blocks.length === 0) throw new Error(`no rule for ${sel}`);
  const out = new Map<string, string>();
  for (const b of blocks)
    for (const d of b.slice(b.indexOf('{') + 1, b.lastIndexOf('}')).split(';')) {
      const i = d.indexOf(':');
      if (i > 0) out.set(d.slice(0, i).trim(), d.slice(i + 1).trim());
    }
  return out;
}

/** A token's px from tokens.css. */
function px(name: string): number {
  const m = new RegExp(`${name}:\\s*([^;]+);`, 'u').exec(tokensCss);
  if (m === null) throw new Error(`no token ${name}`);
  const v = (m[1] ?? '').trim();
  const ref = /^var\((--[\w-]+)\)$/u.exec(v);
  return ref !== null ? px(ref[1] ?? '') : Number.parseFloat(v);
}

describe('a settings row', () => {
  it('never squeezes its label: it keeps 240 at least, and a wider control wraps under it', () => {
    expect(rule(dsCss, '.b-settings .b-gi').get('flex-wrap')).toBe('wrap');
    expect(rule(dsCss, '.b-settings .b-gi>.l').get('flex')).toBe('1 1 var(--w-setting-label)');
    expect(px('--w-setting-label')).toBeGreaterThanOrEqual(240);
    // a control or a value never runs past the row; a long value ends in an ellipsis
    expect(rule(dsCss, '.b-settings .b-gi>:not(.l)').get('max-width')).toBe('100%');
    expect(rule(dsCss, '.b-settings .b-gi>.v').get('text-overflow')).toBe('ellipsis');
  });

  it('with any control, is two columns: the label 240 to 320, the control 16 after it (designer m_48077, m_48146)', () => {
    expect(rule(dsCss, '.b-settings .b-gi:has(>.l+*)').get('column-gap')).toBe('var(--s-4)');
    expect(rule(dsCss, '.b-settings .b-gi:has(>.l+*)>.l').get('max-width')).toBe('var(--w-setting-label-max)');
    expect(px('--w-setting-label-max')).toBe(320);
  });

  it("a role's model and its efforts wrap between them when the row has no room", () => {
    const acts = rule(settingsCss, '.settings-row-acts');
    expect(acts.get('flex-wrap')).toBe('wrap');
    expect(acts.get('min-width')).toBe('0');
  });
});

describe('a settings page', () => {
  it('grows with the window past the old 640 column, up to a readable cap, centred', () => {
    const page = rule(dsCss, '.b-settings-page');
    expect(page.get('max-width')).toBe('var(--w-settings-page)');
    expect(page.get('margin')).toBe('0 auto');
    expect(px('--w-settings-page')).toBeGreaterThan(640);
    expect(px('--w-settings-page')).toBeLessThanOrEqual(960);
  });
});

describe("a settings page's text edge (designer m_48227)", () => {
  it('the lead, every help line and the sign-in line start 12 in, as the group heads and the labels', () => {
    expect(rule(dsCss, '.b-settings .b-gt').get('padding')).toBe('0 var(--s-3) var(--s-2)');
    expect(rule(dsCss, '.b-settings-lead').get('padding')).toBe('0 var(--s-3)');
    expect(rule(dsCss, '.b-settings .b-help').get('padding')).toBe('0 var(--s-3)');
    // the sign-in line's words are a help line: its box adds no 12 of its own (ui-review m_48283: 24 in)
    expect(rule(settingsCss, '.settings-signing').has('padding')).toBe(false);
  });
});

describe("general's auto-update card", () => {
  it("takes the 'Updates' head only when no update group above has it", () => {
    expect(updatesShown({ appUpdate: null, dist: null })).toBe(false);
    const info = { version: null, updated: null };
    expect(updatesShown({ appUpdate: null, dist: { state: { state: 'none' }, info, readAt: 0 } })).toBe(false);
    expect(updatesShown({ appUpdate: null, dist: { state: { state: 'none' }, info: { ...info, version: 'desktop-v2026.10.1' }, readAt: 0 } })).toBe(true);
  });
});
