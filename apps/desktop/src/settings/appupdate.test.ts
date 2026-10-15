import { describe, expect, it } from 'vitest';
import { distRow, traceLine } from './appupdate';

describe("settings' update group for a distributed app (designer m_25362)", () => {
  it('says each state in his words', () => {
    expect(distRow({ state: 'none' }, 'desktop-v2026.10.1')).toEqual({ kind: 'current', label: 'bise 2026.10.1', sub: 'up to date' });
    expect(distRow({ state: 'downloading', version: 'desktop-v2026.10.2' }, 'desktop-v2026.10.1')).toMatchObject({ kind: 'getting', sub: 'getting 2026.10.2' });
    expect(distRow({ state: 'ready', version: 'desktop-v2026.10.2' }, 'v1')).toMatchObject({
      label: '2026.10.2 is ready',
      help: 'it installs by itself when you quit or step away. your agents keep running.',
      act: 'restart',
    });
    expect(distRow({ state: 'went_bad', version: 'n' }, 'v1')).toMatchObject({ label: "the new bise didn't start right", act: 'back' });
  });

  it("says why updates are off here, never as a failure", () => {
    // the reason is the row's sub (designer m_26934), no help line under the group
    expect(distRow({ state: 'none', cant: 'disk_image' }, 'v1')).toEqual({ kind: 'off', label: 'updates are off here', sub: "bise runs from the disk image, so it can't update itself." });
    expect(distRow({ state: 'none', cant: 'translocated' }, 'v1')?.sub).toBe("bise isn't in Applications, so it can't replace itself.");
    expect(distRow({ state: 'none', cant: 'read_only' }, 'v1')?.sub).toBe("bise isn't in Applications, so it can't replace itself.");
  });

  it("offers 'move to Applications' where moving fixes it, and says when a move didn't happen", () => {
    expect(distRow({ state: 'none', cant: 'disk_image', move: 'can' }, 'v1')).toEqual({ kind: 'off', label: 'updates are off here', sub: "bise runs from the disk image, so it can't update itself.", act: 'move' });
    expect(distRow({ state: 'none', cant: 'translocated', move: 'can' }, 'v1')).toMatchObject({ sub: "bise isn't in Applications, so it can't replace itself.", act: 'move' });
    expect(distRow({ state: 'none', cant: 'disk_image', move: 'failed' }, 'v1')).toEqual({ kind: 'off', label: 'updates are off here', sub: "bise couldn't move itself. drag it to Applications to get updates.", err: true, act: 'move' });
    expect(distRow({ state: 'none', cant: 'read_only' }, 'v1')?.act).toBeUndefined();
  });

  it('a failure is grey: the download tries again, a refused signature keeps this version', () => {
    expect(distRow({ state: 'failed', version: 'n', why: 'x', reason: 'download' }, 'v1')).toMatchObject({ sub: 'update failed', help: 'the download of n failed. bise tries again later.' });
    expect(distRow({ state: 'failed', version: 'n', why: 'x', reason: 'signature' }, 'x1')?.help).toBe("n was refused: its signature didn't check out. bise keeps x1.");
    expect(distRow({ state: 'failed', version: 'desktop-v2', why: 'x', reason: 'swap' }, 'v1')?.help).toBe("2 couldn't be installed. bise tries again later.");
    expect(distRow({ state: 'failed', version: 'n', why: 'x', reason: 'new_signer' }, 'v1')).toMatchObject({
      help: "this test build can't update itself. download bise once from bise.dev/download; later updates come by themselves.",
      link: 'bise.dev/download',
    });
  });

  it('an app with no updater has no group; a quiet install leaves its trace', () => {
    expect(distRow({ state: 'none' }, null)).toBeNull();
    expect(traceLine({ version: 'v1', updated: null }, 0)).toBeNull();
    const now = Date.UTC(2026, 9, 14, 12);
    expect(traceLine({ version: 'v2', updated: { version: 'desktop-v2026.10.2', at: now - 3600_000 } }, now)).toMatch(/^updated to 2026\.10\.2 · /);
  });
});
