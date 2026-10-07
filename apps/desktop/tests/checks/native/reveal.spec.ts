// native/reveal · window.bise.quickLook and showInFinder (lead m_11947, amb-kit's artifacts
// screen): a file in one of his project folders (the core's projects rows) opens in Quick Look or
// in Finder; a file outside his home and his projects is refused. Test mode prints the effect
// ('bise-desktop: quicklook|reveal <path>'), never a panel or a Finder window. Owner: amb-mac.
// The new app on the scripted core.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { FakeCore, test, expect } from '../../harness';
import { onWorld } from './world';

const HOME = 'bise-home-00000000';
const ROOT = mkdtempSync(path.join(tmpdir(), 'reveal-'));
const PROJECT = path.join(ROOT, 'shop');
const OUTSIDE = path.join(ROOT, 'elsewhere');
mkdirSync(path.join(PROJECT, 'out'), { recursive: true });
mkdirSync(OUTSIDE, { recursive: true });
const SHOT = path.join(PROJECT, 'out', 'shot.png');
const SECRET = path.join(OUTSIDE, 'secret.txt');
writeFileSync(SHOT, 'png');
writeFileSync(SECRET, 'no');
test.afterAll(() => {
  rmSync(ROOT, { recursive: true, force: true });
});

const world = () => [
  { ev: 'projects', projects: [{ project: HOME, name: 'shop', path: PROJECT, git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true }] },
  { ev: 'welcome', project: HOME, proto: 1, workspace: PROJECT, name: 'shop' },
];

test("native/reveal: a project's file opens in Quick Look and Finder; a file outside his home and projects is refused", async () => {
  await onWorld(
    async ({ s, out }) => {
      const call = (fn: 'quickLook' | 'showInFinder', p: string) =>
        s.page.evaluate(([f, q]) => (window as unknown as { bise: Record<string, (x: string) => Promise<boolean>> }).bise[f]?.(q) ?? Promise.resolve(false), [fn, p] as const);
      // the projects row reaches main a moment after load
      await expect.poll(() => call('quickLook', SHOT), { message: "the project's file in Quick Look", timeout: 10_000 }).toBe(true);
      expect(await out.wait('bise-desktop: quicklook', () => true, 3000), 'the quicklook line names it').toBe(SHOT);
      expect(await call('showInFinder', SHOT), 'shown in Finder').toBe(true);
      expect(await out.wait('bise-desktop: reveal', () => true, 3000), 'the reveal line names it').toBe(SHOT);
      expect(await call('quickLook', SECRET), 'outside his home and projects: refused').toBe(false);
      expect(await call('showInFinder', SECRET), 'refused in Finder too').toBe(false);
      expect(await call('quickLook', `${PROJECT}/../elsewhere/secret.txt`), 'a .. escape: refused').toBe(false);
      expect(out.of('bise-desktop: quicklook').length + out.of('bise-desktop: reveal').length, 'no line for a refusal').toBe(2);
    },
    { core: new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]) },
  );
});
