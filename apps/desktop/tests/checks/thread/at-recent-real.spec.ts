// thread/at-recent-real · Gabriel (task at-recent, designer m_24034): browsing a folder in the @
// list shows the last modified first, folders and files mixed (Finder's Date Modified), the same
// order as the terminal (both come from the core's files::pick, rust/tui/src/files.rs). Owner:
// at-recent. The NEW app on the REAL core over the throwaway world (../world.ts): '@<folder>/' on a
// throwaway folder with set mtimes (outside the workspace: the core reads that one folder), rows
// read in order. Real keys only.
import { mkdtempSync, mkdirSync, utimesSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test, expect } from '../../harness';
import { launchReal, realWorld } from '../world';

const T = {
  field: '[data-testid="composer.field"]',
  setupSkip: '[data-testid="setup.skip"]',
  picker: '[data-testid="composer.pick"]',
  fileRow: '[data-testid^="composer.pick.file."]',
};

// newest first: what the list must show
const ORDER = ['report.pdf', 'new-folder', 'notes.md', 'old-folder', 'a-oldest.txt'];

test('thread/at-recent-real: @<folder>/ lists the newest first, folders and files mixed', async () => {
  const w = realWorld();
  const dir = mkdtempSync(path.join(os.tmpdir(), 'at-recent-'));
  for (const n of ORDER) {
    if (n.includes('.')) writeFileSync(path.join(dir, n), '');
    else mkdirSync(path.join(dir, n));
  }
  ORDER.forEach((n, i) => {
    const t = 1_700_000_000 - i * 3600;
    utimesSync(path.join(dir, n), t, t);
  });
  const s = await launchReal(w);
  try {
    const { page } = s;
    await expect(page.locator(`${T.field}, ${T.setupSkip}`).first()).toBeVisible({ timeout: 10_000 }).catch(() => undefined);
    if (await page.locator(T.setupSkip).isVisible()) await page.locator(T.setupSkip).click();
    const field = page.locator(T.field).first();
    await expect(field, "bise's thread opens with its composer on the real core").toBeVisible({ timeout: 10_000 });
    await field.click();
    await page.keyboard.type(`@${dir}/`);
    await expect(page.locator(T.picker)).toBeVisible({ timeout: 3000 });
    const names = async (): Promise<string[]> => {
      const ids = await page.locator(T.picker).locator(T.fileRow).evaluateAll((rs) => rs.map((r) => r.getAttribute('data-testid') ?? ''));
      return ids.map((id) => id.replace(/\/$/, '').split('/').at(-1) ?? '').filter((n) => ORDER.includes(n));
    };
    await expect.poll(names, { message: 'the newest first, folders and files mixed', timeout: 5000 }).toEqual(ORDER);
  } finally {
    await s.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
