// harness/self/app-entry · main m_24105: no Electron launch on an app with no build. Never starts
// Electron: a folder like apps/desktop with its package.json but no out/main/index.js is refused with
// one line, before the spawn; with the entry, it passes.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { appEntryMissing } from '../appentry';
import { launchDesktop } from '../launch';
import { DESKTOP_DIR } from '../electron';

test('harness/app-entry: an app folder with no build is refused before Electron starts', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'bh-entry-'));
  try {
    writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ main: './out/main/index.js' }));
    expect(appEntryMissing(dir)).toBe(`harness: no app build at ${path.join(dir, 'out', 'main', 'index.js')}: pnpm build first (never launched Electron)`);
    mkdirSync(path.join(dir, 'out', 'main'), { recursive: true });
    writeFileSync(path.join(dir, 'out', 'main', 'index.js'), '');
    expect(appEntryMissing(dir)).toBeNull();
    expect(appEntryMissing(path.join(dir, 'nowhere'))).toBe(`harness: no app at ${path.join(dir, 'nowhere')}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('harness/app-entry: launchDesktop with no build in out/ throws that line and spawns nothing', async () => {
  test.skip(appEntryMissing(DESKTOP_DIR) === null, 'this worktree has a build: the refusal is proved on the temp folder above');
  await expect(launchDesktop({})).rejects.toThrow(/^harness: no app build at .*out\/main\/index\.js: pnpm build first/);
});
