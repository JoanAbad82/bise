// native/fn-voice · fn fn with bise's window in front is voice mode there (lead m_16973): the window
// can't see fn, so main sends the helper's 'double' to that window only (window.bise.onFnVoice) and
// the capsule doesn't start its hands-free talk; anywhere else fn fn keeps the capsule's talk. The
// window is 'in front' through main's test global __biseTestFocused (the harness's windows are
// off-screen, never focused); the page then turns voice mode on for the agent in view (amb-web's
// 2244dc56): the core gets voice_mode {project, agent, on:true}. Owner: amb-mac. The new app on the scripted helper and core.
import { test, expect } from '../../harness';
import { CAPSULE, onWorld, sleep } from './world';

type Counted = { __fnVoice: number; bise: { onFnVoice: (fn: () => void) => () => void } };

test('native/fn-voice: fn fn with the window in front goes to the window, not the capsule; elsewhere the capsule talks', async () => {
  await onWorld(async ({ s, helper, core, out }) => {
    const { page } = s;
    await expect(page.getByTestId('thread.screen')).toBeVisible({ timeout: 10_000 });
    await page.evaluate(() => {
      const w = window as unknown as Counted;
      w.__fnVoice = 0;
      w.bise.onFnVoice(() => {
        w.__fnVoice += 1;
      });
    });
    const heard = (): Promise<number> => page.evaluate(() => (window as unknown as Counted).__fnVoice);
    const front = (v: boolean): Promise<void> =>
      s.app.evaluate((_e, on) => {
        (globalThis as { __biseTestFocused?: boolean }).__biseTestFocused = on;
      }, v);

    // the window in front: fn fn is voice mode there, the capsule stays hidden
    await front(true);
    await helper.send({ ev: 'fn', act: 'double' } as never);
    await expect.poll(heard, { message: 'the window hears fn fn', timeout: 3000 }).toBe(1);
    // amb-web's page (2244dc56): the thread in view turns voice mode on, as ctrl+r twice does
    const on = (await core.waitCmd((c) => (c as { cmd?: string }).cmd === 'voice_mode', 5000)) as unknown as { project?: string; agent?: string; on?: boolean };
    expect(on.on, 'the core gets voice_mode on').toBe(true);
    expect(typeof on.project === 'string' && typeof on.agent === 'string', 'for the agent in view').toBe(true);
    await sleep(800);
    expect(out.of(CAPSULE), 'no capsule talk while the window is in front').toEqual([]);

    // a hold with the window in front still talks in the capsule (only fn fn moves)
    await helper.send({ ev: 'fn', act: 'talk_start', by: 'fn' } as never);
    expect(await out.wait(CAPSULE, (l) => l.startsWith('show')), 'a hold: the capsule talks').toBe('show bottom');
    await helper.send({ ev: 'fn', act: 'cancel' } as never);
    await out.wait(CAPSULE, (l) => l === 'hide');

    // his app in front: fn fn is the capsule's hands-free talk, the window hears nothing
    await front(false);
    const before = out.of(CAPSULE).length;
    await helper.send({ ev: 'fn', act: 'double' } as never);
    await expect.poll(() => out.of(CAPSULE).slice(before), { message: 'fn fn elsewhere: the capsule talks', timeout: 3000 }).toContain('show bottom');
    expect(await heard(), 'the window heard only the first').toBe(1);
  });
});
