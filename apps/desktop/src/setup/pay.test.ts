import { describe, expect, it } from 'vitest';
import type { Account } from '@/proto';
import { failedWords, keyField, type ProviderCheck } from '@/settings';
import { afterSignIn, keyProviders, PAY_START, phase, pickRow, ready, rows, upOf, startCheck } from './pay';

const acc = (id: string, kind: 'key' | 'subscription', extra: Partial<Account> = {}): Account => ({ id, label: id, kind, state: 'signed_out', provider: id, ...extra });
const ACCOUNTS: Account[] = [
  acc('chatgpt', 'subscription'),
  acc('anthropic', 'key', { label: 'Anthropic', keys_url: 'https://keys.test' }),
  acc('openrouter', 'key', { label: 'OpenRouter' }),
  acc('openai', 'key', { label: 'OpenAI', state: 'signed_in', from: { t: 'env', var: 'OPENAI_API_KEY' } }),
  acc('kimi-code', 'key', { label: 'Kimi', coding: true }),
];
const must = (a: Account | undefined): Account => {
  if (a === undefined) throw new Error('no account');
  return a;
};
const acct = (i: number): Account => must(ACCOUNTS[i]);
const check = (state: ProviderCheck['state'], extra: Partial<ProviderCheck> = {}): ProviderCheck => ({ ev: 'provider_check', id: 'anthropic', name: 'Anthropic', state, model: 'anthropic/claude-opus-5-5', ...extra });

describe('the model step (pay.ts)', () => {
  it('lists the keys found first, then ChatGPT, OpenRouter, an API key, a coding plan key', () => {
    expect(rows(ACCOUNTS).map((r) => (r.t === 'found' ? `found:${r.acc.id}` : r.t))).toEqual(['found:openai', 'chatgpt', 'openrouter', 'api', 'coding']);
    expect(rows(ACCOUNTS.filter((a) => a.coding !== true && a.id !== 'openrouter')).map((r) => r.t)).toEqual(['found', 'chatgpt', 'api']);
    expect(keyProviders(ACCOUNTS, false).map((a) => a.id)).toEqual(['anthropic', 'openrouter', 'openai']);
    expect(keyProviders(ACCOUNTS, true).map((a) => a.id)).toEqual(['kimi-code']);
  });

  it('a found key is checked with no key sent; a pasted one is sent once; only its own answer counts', () => {
    const f = pickRow(PAY_START, { t: 'found', acc: acct(3) }, null);
    expect(f.cmd).toEqual({ cmd: 'provider_use', id: 'openai' });
    const older = check('works');
    const r = startCheck(PAY_START, 'anthropic', 'sk-1', older);
    expect(r.cmd).toEqual({ cmd: 'provider_use', id: 'anthropic', key: 'sk-1' });
    expect(phase(r.s, older)).toBe('checking');
    expect(phase(r.s, check('checking'))).toBe('checking');
    expect(phase(r.s, check('works', { id: 'openai' }))).toBe('checking');
    expect(phase(r.s, check('failed', { why: 'wrong_key' }))).toBe('failed');
    expect(ready(r.s, check('works'))).toBe(true);
    expect(ready(PAY_START, check('works'))).toBe(false);
  });

  it('ChatGPT not signed in: its browser sign-in, then the plan check once accounts say signed in', () => {
    const r = pickRow(PAY_START, { t: 'chatgpt', acc: acct(0) }, null);
    expect(r.cmd).toEqual({ cmd: 'sign_in', id: 'chatgpt' });
    expect(phase(r.s, null)).toBe('signing');
    expect(afterSignIn(r.s, ACCOUNTS, null)).toBeNull();
    const signed = ACCOUNTS.map((a) => (a.id === 'chatgpt' ? { ...a, state: 'signed_in' as const } : a));
    const next = afterSignIn(r.s, signed, null);
    expect(next?.cmd).toEqual({ cmd: 'provider_use', id: 'chatgpt' });
    expect(next && afterSignIn(next.s, signed, null)).toBeNull();
    expect(pickRow(PAY_START, { t: 'chatgpt', acc: must(signed[0]) }, null).cmd).toEqual({ cmd: 'provider_use', id: 'chatgpt' });
  });

  it('esc goes one level up: a key field to its provider list, a check to the list, the list out', () => {
    expect(upOf({ ...PAY_START, view: { t: 'key', id: 'kimi-code' } }, ACCOUNTS)?.view).toEqual({ t: 'which', coding: true });
    expect(upOf({ ...PAY_START, view: { t: 'key', id: 'openrouter' } }, ACCOUNTS)?.view).toEqual({ t: 'openrouter' });
    expect(upOf({ ...PAY_START, view: { t: 'check', id: 'x' }, signing: 'x' }, ACCOUNTS)).toEqual(PAY_START);
    expect(upOf(PAY_START, ACCOUNTS)).toBeNull();
  });
});

describe('the live check in words (settings/keycheck.ts)', () => {
  it('the key field: checking until its own answer', () => {
    const base = check('failed');
    expect(keyField(null, null)).toBe('typing');
    expect(keyField({ id: 'anthropic', base }, base)).toBe('checking');
    expect(keyField({ id: 'anthropic', base }, check('failed'))).toBe('refused');
    expect(keyField({ id: 'anthropic', base }, check('works'))).toBe('added');
  });

  it("each failure says the TUI's words, with the provider's own and the page that fixes it", () => {
    const w = failedWords(check('failed', { why: 'wrong_key', said: 'invalid x-api-key', url: 'https://keys.test', pasted: true }), null, false);
    expect(w).toEqual({ line: 'Anthropic says this key is wrong: “invalid x-api-key”', said: null, fix: { text: 'copy it again from ', url: 'https://keys.test' } });
    expect(failedWords(check('failed', { why: 'no_access', said: 'nope' }), null, false).said).toBe('Anthropic said: “nope”');
    expect(failedWords(check('failed', { why: 'wrong_key' }), 'ANTHROPIC_API_KEY', false).line).toBe("the key in ANTHROPIC_API_KEY doesn't work. Anthropic says it's wrong.");
    expect(failedWords(check('failed', { why: 'no_credit', url: 'https://bill.test' }), null, false)).toMatchObject({ line: 'the key works, but your Anthropic account has no credit yet.', fix: { url: 'https://bill.test' } });
    expect(failedWords(check('failed', { why: 'unreachable', said: 'connection refused' }), null, false).line).toBe("i couldn't reach Anthropic: connection refused.");
    expect(failedWords(check('failed', { why: 'model' }), null, false).line).toBe("Anthropic doesn't know claude-opus-5-5. pick another model.");
  });
});
