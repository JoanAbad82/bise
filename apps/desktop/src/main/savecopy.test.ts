import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { SaveDialogOptions } from 'electron';
import { cleanName, saveCopy, savedTo, startPath, type SaveDeps } from './savecopy';

/** Stubbed deps: the panel and the test line recorded, never a real panel. */
function deps(over: Partial<SaveDeps> = {}) {
  const panels: SaveDialogOptions[] = [];
  const lines: { from: string; name: string; to: string | null }[] = [];
  const d: SaveDeps = {
    testMode: false,
    testTo: undefined,
    downloads: () => '/h/Downloads',
    panel: (_w, opts) => {
      panels.push(opts);
      return Promise.resolve({ canceled: true });
    },
    line: (rec) => lines.push(rec),
    ...over,
  };
  return { d, panels, lines };
}

const scratch = () => mkdtempSync(join(tmpdir(), 'savecopy-'));

describe('savecopy (art-save)', () => {
  it('names the panel after the file, never a path or an empty name', () => {
    expect(cleanName('deck.pptx', '/s/a/deck/v2/deck.pptx')).toBe('deck.pptx');
    expect(cleanName('../../etc/passwd', '/s/x.csv')).toBe('passwd');
    expect(cleanName('', '/s/a/site/v1/site/')).toBe('site');
    expect(cleanName(42, '/s/x.csv')).toBe('x.csv');
    expect(cleanName('..', '/s/x.csv')).toBe('x.csv');
  });

  it('opens in Downloads, then where he last saved', () => {
    expect(startPath(null, '/h/Downloads', 'deck.pptx')).toBe('/h/Downloads/deck.pptx');
    expect(startPath('/h/Desktop', '/h/Downloads', 'deck.pptx')).toBe('/h/Desktop/deck.pptx');
    expect(savedTo('/t/out.pptx')).toBe('/t/out.pptx');
    expect(savedTo('out.pptx')).toBeNull();
    expect(savedTo(undefined)).toBeNull();
  });

  it('his run: the panel asks, a cancel copies nothing; a pick copies the bytes and is the next start', async () => {
    const dir = scratch();
    const src = join(dir, 'deck.pptx');
    writeFileSync(src, 'v2 bytes');
    const cancel = deps();
    expect(await saveCopy(null, src, 'deck.pptx', cancel.d)).toBeNull();
    expect(cancel.panels[0]?.defaultPath).toBe('/h/Downloads/deck.pptx');
    expect(cancel.panels[0]?.properties).toContain('showOverwriteConfirmation');
    mkdirSync(join(dir, 'Desktop'));
    const to = join(dir, 'Desktop', 'mine.pptx');
    const pick = deps({ panel: () => Promise.resolve({ canceled: false, filePath: to }) });
    expect(await saveCopy(null, src, 'deck.pptx', pick.d)).toEqual({ to });
    expect(readFileSync(to, 'utf8')).toBe('v2 bytes');
    const next = deps();
    await saveCopy(null, src, 'deck.pptx', next.d);
    expect(next.panels[0]?.defaultPath).toBe(join(dir, 'Desktop', 'deck.pptx'));
  });

  it('test mode: no panel, SAVE_COPY_LINE recorded, the env is his answer; a folder copies whole; a failure says why', async () => {
    const dir = scratch();
    const site = join(dir, 'site');
    mkdirSync(join(site, 'css'), { recursive: true });
    writeFileSync(join(site, 'index.html'), '<p>hi');
    writeFileSync(join(site, 'css', 'a.css'), 'p{}');
    const to = join(dir, 'out', 'site');
    const t = deps({ testMode: true, testTo: to });
    expect(await saveCopy(null, site, 'site', t.d)).toEqual({ to });
    expect(t.panels).toEqual([]);
    expect(t.lines).toEqual([{ from: site, name: 'site', to }]);
    expect(readFileSync(join(to, 'css', 'a.css'), 'utf8')).toBe('p{}');
    const off = deps({ testMode: true });
    expect(await saveCopy(null, site, 'site', off.d)).toBeNull();
    expect(off.lines).toEqual([{ from: site, name: 'site', to: null }]);
    const bad = deps({ testMode: true, testTo: join(dir, 'out2', 'x') });
    const r = await saveCopy(null, join(dir, 'missing.pptx'), 'x', bad.d);
    expect(r !== null && 'error' in r).toBe(true);
  });
});
