// native/fn · bar O.5 (fn from rest), ⛔4's fn+space part, 2.6's fn twice. What fn means comes from
// the helper (bise_proto::helper FnAct: its key machine decides tap, hold, double, fn + key); the
// scripted helper says it here exactly as the real one would, and the checks read what the app did
// with it: the capsule window's state (main's CAPSULE_LINE on stdout), what the capsule's page draws,
// and what the app told the core and the helper (their command logs). The real fn key (HID) and his
// app staying in front are the VM pass's.
//   fn space   the spotlight at the top, with the keys; again: gone; esc: gone
//   fn held    the talk at the bottom, never the keys; the core starts listening at once (< 300 ms)
//              and the helper is told bise holds the mic (own_mic, so quiet's mic sample skips it);
//              released: the core ends the talk
//   fn fn      hands-free: the talk shows and stays after the release, until the next tap
//   fn i       the inbox in the window, the capsule gone
import { test, expect } from '../../harness';
import { CAPSULE, capsulePage, ids, onWorld, sleep } from './world';

/** a core command's tag (the talk commands aren't in bise-proto's AppCmd yet: read as strings) */
const tag = (c: unknown): string => {
  const t = (c as { cmd?: unknown }).cmd;
  return typeof t === 'string' ? t : '';
};

test('native/fn: fn space opens the spotlight with the keys; again or esc closes it', async () => {
  await onWorld(async ({ s, helper, out }) => {
    const cap = await capsulePage(s);
    await helper.send({ ev: 'fn', act: 'key', key: 'space' });
    expect(await out.wait(CAPSULE, (l) => l.startsWith('show')), 'fn space shows the capsule at the top with the keys').toBe('show top keys');
    await expect(cap.getByTestId('spot.input'), 'the spotlight is drawn with its field').toBeVisible();
    await helper.send({ ev: 'fn', act: 'key', key: 'space' });
    await out.wait(CAPSULE, (l) => l === 'hide');
    await expect(cap.getByTestId('spot.input'), 'fn space again closes it').toBeHidden();
    await helper.send({ ev: 'fn', act: 'key', key: 'space' });
    await expect(cap.getByTestId('spot.input')).toBeVisible();
    await helper.send({ ev: 'fn', act: 'esc' });
    await expect(cap.getByTestId('spot.input'), 'esc closes it').toBeHidden();
    expect(out.of(CAPSULE), 'show, hide, show, hide: nothing else').toEqual(['show top keys', 'hide', 'show top keys', 'hide']);
  });
});

test('native/fn: fn held talks at the bottom without the keys, and the core listens within 300 ms', async () => {
  await onWorld(async ({ s, helper, core, out }) => {
    const cap = await capsulePage(s);
    const before = core.cmds().length;
    const t0 = Date.now();
    await helper.send({ ev: 'fn', act: 'talk_start', by: 'fn' });
    expect(await out.wait(CAPSULE, (l) => l.startsWith('show')), 'the talk shows at the bottom and never takes the keys').toBe('show bottom');
    await expect(cap.getByTestId('capsule.talk'), 'the talk is drawn').toBeVisible();
    // the effect outside the app: the core (which owns the mic) was told to listen
    const listen = await core.waitCmd((c) => tag(c) === 'talk_start', 300).catch(() => null);
    expect(listen, `the core got talk_start within 300 ms (it got ${JSON.stringify(core.cmds().slice(before))})`).not.toBeNull();
    expect(Date.now() - t0).toBeLessThan(1000);
    const mic = await helper.waitCmd((c) => c.cmd === 'own_mic' && c.open, 500).catch(() => null);
    expect.soft(mic, 'the helper was told bise holds the mic (else his own talk reads as a call: quiet)').not.toBeNull();
    await helper.send({ ev: 'fn', act: 'talk_end' });
    const end = await core.waitCmd((c) => tag(c) === 'talk_end', 500).catch(() => null);
    expect.soft(end, 'the release ends the talk in the core').not.toBeNull();
  });
});

test('native/fn: fn twice is hands-free until the next tap', async () => {
  await onWorld(async ({ s, helper, core, out }) => {
    const cap = await capsulePage(s);
    await helper.send({ ev: 'fn', act: 'double' });
    const shown = await out.wait(CAPSULE, (l) => l.startsWith('show'), 1000).catch(() => null);
    expect(shown, 'fn fn shows the talk at the bottom, without the keys').toBe('show bottom');
    await expect(cap.getByTestId('capsule.talk'), 'the talk is drawn').toBeVisible();
    expect.soft(core.cmds().some((c) => tag(c) === 'talk_start'), 'the core listens').toBe(true);
    await sleep(600);
    await expect(cap.getByTestId('capsule.talk'), 'it stays with no key held').toBeVisible();
    await helper.send({ ev: 'fn', act: 'tap' });
    const ended = await core.waitCmd((c) => tag(c) === 'talk_end', 1000).catch(() => null);
    expect(ended, 'the next tap ends it in the core').not.toBeNull();
  });
});

test('native/fn: fn i opens the inbox in the window and closes the capsule', async () => {
  await onWorld(async ({ s, helper, out }) => {
    await helper.send({ ev: 'fn', act: 'key', key: 'space' });
    await out.wait(CAPSULE, (l) => l.startsWith('show'));
    await helper.send({ ev: 'fn', act: 'key', key: 'i' });
    await out.wait(CAPSULE, (l) => l === 'hide');
    await expect
      .poll(async () => (await ids(s.page)).some((i) => i === 'inbox' || i.startsWith('inbox.') || i === 'app.notyet.inbox'), { message: 'the window is on the inbox', timeout: 1500 })
      .toBe(true);
  });
});
