import { describe, expect, it } from 'vitest';
import type { Account } from '@/proto';
import { core_ev } from '@/proto/fixtures.gen';
import { heldOfSetupFirst, type Held } from './hold';
import { decide, keyOf, onLeave, onReady } from './setup-first';

const first = core_ev.find((e) => e.ev === 'setup_first');
if (first?.ev !== 'setup_first') throw new Error('no setup_first fixture');

const ACCOUNTS: Account[] = [
  { id: 'chatgpt', label: 'ChatGPT', kind: 'subscription', state: 'signed_in', provider: 'chatgpt' },
  { id: 'openrouter', label: 'OpenRouter key', kind: 'key', state: 'signed_out', provider: 'openrouter' },
];
const signedIn = ACCOUNTS.map((a) => (a.id === 'openrouter' ? { ...a, state: 'signed_in' as const } : a));

describe('R8: the core holds a keyless /model (setup_first)', () => {
  it("the wait it opens names the provider and the thread, and carries no command (the core sends the line)", () => {
    expect(heldOfSetupFirst(first)).toEqual({
      provider: 'openrouter',
      providerName: 'OpenRouter',
      model: 'openrouter/qwen/qwen3-coder',
      cmd: null,
      from: { project: 'acme-1a2b3c4d', agent: 'perf' },
    });
  });

  it('ready: nothing is sent (the core runs it) and he goes back to the thread he typed it in', () => {
    const held = heldOfSetupFirst(first);
    expect(onReady(held, ACCOUNTS)).toBeNull();
    expect(onReady(held, signedIn)).toEqual({ send: null, back: { screen: 'thread', project: 'acme-1a2b3c4d', agent: 'perf' } });
  });

  it('a window wait (L5) still sends its own command and stays on settings', () => {
    const held: Held = { provider: 'openrouter', providerName: 'OpenRouter', model: 'qwen', cmd: { cmd: 'role_set', role: 'main', model: 'openrouter/qwen' } };
    expect(onReady(held, signedIn)).toEqual({ send: { cmd: 'role_set', role: 'main', model: 'openrouter/qwen' }, back: null });
  });

  it('leaving settings with it not ready drops it; ready, a window wait, or none: nothing', () => {
    const held = heldOfSetupFirst(first);
    expect(onLeave(held, ACCOUNTS)).toEqual({ cmd: 'setup_first_cancel' });
    expect(onLeave(held, signedIn)).toBeNull();
    expect(onLeave({ ...held, cmd: { cmd: 'role_set', role: 'main', model: 'x' } }, ACCOUNTS)).toBeNull();
    expect(onLeave(null, ACCOUNTS)).toBeNull();
  });

  it('acts once per held line, and opens settings only right after his own /model (a replay keeps the wait, moves nothing)', () => {
    expect(decide(first, new Set(), true)).toBe('open');
    expect(decide(first, new Set(), false)).toBe('hold');
    expect(decide(first, new Set([keyOf(first)]), true)).toBe('none');
    expect(keyOf(first)).toBe('cid:12');
    expect(keyOf({ ...first, cid: null })).toBe('acme-1a2b3c4d/perf/openrouter/qwen/qwen3-coder');
  });
});
