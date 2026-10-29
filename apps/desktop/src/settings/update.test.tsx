// @vitest-environment happy-dom
// Settings › general's update group (designer's app-swap v2): the row's five states from
// window.bise.app.update(), the swap on his click without a confirm, a refusal's grey line.
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { AppSwapResult, AppUpdate } from '@/shared/api';
import { UpdateGroup, refusalLine, updateRow, type UpdatePorts } from './update';
import { settings } from '@/proto/words.gen';

afterEach(cleanup);

const A = '20b1044aaaaaaaaaaaaa';
const B = '3f9a2c1bbbbbbbbbbbbb';
const staged: AppUpdate = { state: 'staged', live: A, staged: B, why: null, none: null, failed: null };
const current: AppUpdate = { state: 'current', live: B, staged: null, why: null, none: null, failed: null };
const none = (n: NonNullable<AppUpdate['none']>, why = 'w'): AppUpdate => ({ state: 'none', live: A, staged: null, why, none: n, failed: null });

describe('updateRow', () => {
  it('the five states', () => {
    expect(updateRow(staged, null)).toEqual({ kind: 'ready', to: B, live: A });
    expect(updateRow(current, null)).toEqual({ kind: 'current', live: B });
    expect(updateRow(staged, B)).toEqual({ kind: 'restarting', to: B });
    expect(updateRow({ ...staged, failed: B }, null)).toEqual({ kind: 'failed', to: B, live: A });
    expect(updateRow(none('test_home'), null)).toEqual({ kind: 'test' });
  });
  it("his app off a try bundle, not known yet: no row; a staged build that isn't promoted: up to date", () => {
    expect(updateRow(null, null)).toBeNull();
    expect(updateRow(none('not_try'), null)).toBeNull();
    expect(updateRow({ state: 'none', live: A, staged: null, why: 'w' }, null)).toBeNull();
    expect(updateRow(none('not_gated'), null)).toEqual({ kind: 'current', live: A });
  });
  it('a failure for an older target (a newer promote since): ready again', () => {
    expect(updateRow({ ...staged, failed: 'ffffffff' }, null)?.kind).toBe('ready');
  });
  it('an old checkout or an unreadable script: the build, the why under it', () => {
    expect(updateRow(none('old_checkout', 'this build is too old to update from here. the next try updates it.'), null)).toEqual({
      kind: 'stuck',
      live: A,
      refused: 'old_checkout',
      why: 'this build is too old to update from here. the next try updates it.',
    });
  });
  it('only an unreadable state or a swap that did not start is alarmed', () => {
    expect(refusalLine('newest', 'x').alarm).toBe(false);
    expect(refusalLine('test_home', 'x').alarm).toBe(false);
    expect(refusalLine('old_checkout', 'x').alarm).toBe(false);
    expect(refusalLine('unreadable', 'x').alarm).toBe(true);
    expect(refusalLine('not_started', 'x').alarm).toBe(true);
  });
});

function ports(answer: AppSwapResult): UpdatePorts & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    swap: () => {
      calls.push('swap');
      return Promise.resolve(answer);
    },
    showLog: () => calls.push('log'),
    refresh: () => calls.push('refresh'),
  };
}
const text = (id: string): string => screen.getByTestId(id).textContent.replace(/\s+/g, ' ').trim();

describe('UpdateGroup', () => {
  it("ready: the words, 'restart to update' swaps at once (no confirm) and the row says restarting", async () => {
    const p = ports({ ok: true });
    render(<UpdateGroup update={staged} ports={p} />);
    expect(text('settings.update.label')).toBe('a new build is ready');
    expect(text('settings.update.row')).toContain('3f9a2c1 · you run 20b1044');
    await act(async () => {
      fireEvent.click(screen.getByTestId('settings.update.restart'));
      await Promise.resolve();
    });
    expect(p.calls).toEqual(['swap']);
    expect(text('settings.update.label')).toBe('restarting on 3f9a2c1…');
    expect(text('settings.update.row')).toContain('the window comes back in a moment. your agents keep running.');
    expect(screen.queryByTestId('settings.update.restart')).toBeNull();
  });
  it('a refused swap: back to its state, the refusal in one grey line under it, the state read again', async () => {
    const p = ports({ ok: false, refused: 'newest', why: 'nothing new to install: this is the newest build.' });
    render(<UpdateGroup update={staged} ports={p} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('settings.update.restart'));
      await Promise.resolve();
    });
    expect(p.calls).toEqual(['swap', 'refresh']);
    expect(text('settings.update.label')).toBe('a new build is ready');
    expect(text('settings.update.why')).toBe('nothing new to install: this is the newest build.');
    expect(screen.getByTestId('settings.update.why').getAttribute('data-alarm')).toBeNull();
  });
  it("a swap that didn't start: its line with the red ▲", async () => {
    const p = ports({ ok: false, refused: 'not_started', why: "the update didn't start: spawn python3 ENOENT" });
    render(<UpdateGroup update={staged} ports={p} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('settings.update.restart'));
      await Promise.resolve();
    });
    expect(text('settings.update.why')).toBe("▲ the update didn't start: spawn python3 ENOENT");
    expect(screen.getByTestId('settings.update.why').getAttribute('data-alarm')).toBe('true');
  });
  it('up to date: no button', () => {
    render(<UpdateGroup update={current} ports={ports({ ok: true })} />);
    // the line icon check before the words, never a ✓ glyph (ui-review m_43805)
    expect(text('settings.update.label')).toBe(settings.update_current);
    expect(screen.getByTestId('settings.update.label').querySelector('svg[data-icon="check"]')).not.toBeNull();
    expect(text('settings.update.row')).toContain('you run 3f9a2c1, the newest build');
    expect(screen.queryByRole('button')).toBeNull();
  });
  it("failed: 'try again' swaps, 'show the log' opens it", async () => {
    const p = ports({ ok: true });
    render(<UpdateGroup update={{ ...staged, failed: B }} ports={p} />);
    expect(text('settings.update.label')).toBe("▲ couldn't update to 3f9a2c1");
    expect(text('settings.update.row')).toContain("you're still on 20b1044. nothing is lost.");
    fireEvent.click(screen.getByTestId('settings.update.log'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('settings.update.again'));
      await Promise.resolve();
    });
    expect(p.calls).toEqual(['log', 'swap']);
  });
  it('a test app: grey, no button; his app off a try bundle: no group at all', () => {
    const { container } = render(<UpdateGroup update={none('test_home')} ports={ports({ ok: true })} />);
    expect(text('settings.update.label')).toBe('updates come from the try');
    expect(text('settings.update.row')).toContain('this app runs on a test home, not yours');
    expect(container.querySelector('.settings-update.is-test')).not.toBeNull();
    cleanup();
    render(<UpdateGroup update={none('not_try')} ports={ports({ ok: true })} />);
    expect(screen.queryByTestId('settings.update')).toBeNull();
  });
  it('an unreadable state: the build and the alarmed line', () => {
    render(<UpdateGroup update={none('unreadable', "couldn't read the update's state: Traceback")} ports={ports({ ok: true })} />);
    expect(text('settings.update.label')).toBe('you run 20b1044');
    expect(text('settings.update.why')).toBe("▲ couldn't read the update's state: Traceback");
  });
});
