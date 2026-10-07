// His model accounts (bar S.2, S.3; settings · models and the first
// launch's model step): each subscription with its sign-in, and an API key.
// The core owns them (`accounts` event; sign_in opens his browser, only on
// his click; key_set stores the key, which never comes back in an event).
// Owner: amb-home.
import { useState } from 'react';
import type { Account, AppCmd } from '@/proto';
import { Button, Chip, Field, Group, Help, type GroupItem } from '@/ds';
import type { SignInDraft } from './draft';

/** He is signed in to one account at least (the first launch's model step goes on). */
export function signedIn(accounts: readonly Account[]): boolean {
  return accounts.some((a) => a.state === 'signed_in');
}

/** the core's last refusal of a key (error {cmd: key_set}), counted so the same words twice count */
export interface KeyError {
  n: number;
  text: string;
}

/** a refusal's words for him: the core's text without its account id ("anthropic-key: …") */
export function keyErrorWords(text: string, id: string | null): string {
  const t = id !== null && text.startsWith(`${id}: `) ? text.slice(id.length + 2) : text;
  return t.trim() === '' ? 'the provider refused this key' : t.trim();
}

/**
 * The key's field after ⏎ (bar S.2): it stays, with what he typed, while the core checks; a
 * refusal newer than the send shows in place (field in error, the core's words); the key in the
 * core's accounts closes it. Pure, for the tests.
 */
export function keyField(
  sent: { n: number; base: readonly Account[] } | null,
  keyError: KeyError | null,
  accounts: readonly Account[],
  id: string | null,
): 'typing' | 'checking' | 'refused' | 'added' {
  if (sent === null) return 'typing';
  if (keyError !== null && keyError.n > sent.n) return 'refused';
  if (accounts !== sent.base && accounts.some((a) => a.id === id && a.state === 'signed_in')) return 'added';
  return 'checking';
}

/** A model waiting for its provider's setup (bar L5, hold.ts): which provider, and for which model. */
export interface Want {
  provider: string;
  providerName: string;
  model: string;
}

/** An account sets up `provider` (Account.provider; an older core: its id). */
export const ofProvider = (a: Account, provider: string): boolean => (a.provider ?? a.id) === provider;

/** An expired sign-in's line (bar V14 / S28): it expired, and the agents it stopped wait. */
export function expiredWords(waiting: readonly string[]): string {
  if (waiting.length === 0) return 'your sign-in expired: sign in again';
  const names = waiting.length <= 3 ? waiting.join(', ') : `${waiting.slice(0, 2).join(', ')} and ${String(waiting.length - 2)} more`;
  return `your sign-in expired: ${names} ${waiting.length === 1 ? 'waits' : 'wait'}`;
}

export interface AccountsProps {
  accounts: readonly Account[];
  send: (cmd: AppCmd) => void;
  keyError?: KeyError | null;
  want?: Want | null;
  /** the expired sign-in: the agents waiting, the sign-in under way (draft.ts until typed) */
  signin?: SignInDraft | null;
  /** copy the sign-in link (c) */
  copy?: (text: string) => void;
  /** cancel the sign-in under way (esc) */
  cancelSignIn?: (id: string) => void;
}

export function Accounts({ accounts, send, keyError = null, want = null, signin = null, copy, cancelSignIn }: AccountsProps) {
  // the sign-ins he started here: a spinner until the core's next accounts
  const [signing, setSigning] = useState<{ base: readonly Account[]; ids: readonly string[] }>({ base: accounts, ids: [] });
  const busy = signing.base === accounts ? signing.ids : [];
  const [picked, setKeyFor] = useState<string | null>(null);
  // a waiting model whose provider is set up by a key: its field is open from the start (esc closes it)
  const [closedFor, setClosedFor] = useState<Want | null>(null);
  const wantKey = want !== null ? accounts.find((a) => a.kind === 'key' && ofProvider(a, want.provider) && a.state !== 'signed_in') : undefined;
  const keyFor = picked ?? (wantKey !== undefined && closedFor !== want ? wantKey.id : null);
  const [bad, setBad] = useState(false);
  // the key he sent: the refusals counted before it don't count for it
  const [sent, setSent] = useState<{ n: number; base: readonly Account[] } | null>(null);
  const field = keyField(sent, keyError, accounts, keyFor);
  if (field === 'added') {
    setKeyFor(null);
    setSent(null);
    if (want !== null) setClosedFor(want);
  }
  const subs = accounts.filter((a) => a.kind === 'subscription');
  const keys = accounts.filter((a) => a.kind === 'key');
  const key = keys.find((a) => a.state === 'signed_in');
  const items: GroupItem[] = subs.map((a) => ({
    id: a.id,
    label: a.label,
    sub:
      a.state === 'signed_in' && a.who != null
        ? a.who
        : a.state === 'expired'
          ? expiredWords(signin?.waiting ?? [])
          : want !== null && ofProvider(a, want.provider)
          ? `sign in for ${want.model}`
          : 'sign in with your browser',
    control:
      a.state === 'signed_in' ? (
        <Chip tone="ok" testId={`settings.account.${a.id}.ok`}>✓ signed in</Chip>
      ) : (
        <Button
          state={busy.includes(a.id) ? 'loading' : undefined}
          onClick={() => {
            setSigning({ base: accounts, ids: [...busy, a.id] });
            send({ cmd: 'sign_in', id: a.id });
          }}
          testId={`settings.account.${a.id}`}
        >
          {a.state === 'expired' ? 'sign in again' : 'sign in'}
        </Button>
      ),
  }));
  const firstKey = wantKey ?? keys[0];
  items.push({
    id: 'key',
    label: 'an API key',
    sub: key ? `${key.label}${key.who != null ? ` · ${key.who}` : ''}` : 'Anthropic, OpenAI, Mistral…',
    control: key ? (
      <span className="settings-row-acts">
        <Chip tone="ok">✓ added</Chip>
        <Button kind="ghost" onClick={() => { send({ cmd: 'key_remove', id: key.id }); }} testId={`settings.key.${key.id}.remove`}>
          remove
        </Button>
      </span>
    ) : firstKey ? (
      <Button onClick={() => { setKeyFor(firstKey.id); setBad(false); setSent(null); }} testId="settings.key.add">
        add a key
      </Button>
    ) : undefined,
  });
  return (
    <>
      {want !== null && (
        <Help testId="settings.models.want">
          {`${want.model} needs ${want.providerName}: sign in or add its key here, then it's set.`}
        </Help>
      )}
      <Group testId="settings.models" items={items} />
      {(() => {
        // a sign-in under way from here: the browser has it; c copies its link, esc cancels (V14 / L2)
        const s = signin?.signing ?? null;
        const id = s?.id ?? subs.find((a) => busy.includes(a.id))?.id ?? null;
        if (id === null) return null;
        const label = accounts.find((a) => a.id === id)?.label ?? id;
        const url = s !== null && s.id === id ? s.url : null;
        const cancel = () => {
          if (cancelSignIn) cancelSignIn(id);
          setSigning({ base: accounts, ids: busy.filter((x) => x !== id) });
        };
        return (
          <div
            className="settings-signing"
            tabIndex={-1}
            data-testid="settings.signing"
            onKeyDown={(e) => {
              if (e.key === 'c' && url !== null && copy) {
                e.preventDefault();
                copy(url);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
              }
            }}
          >
            <Help>{`waiting for you to sign in to ${label} in your browser…`}</Help>
            <span className="settings-row-acts">
              {url !== null && copy && (
                <Button kind="ghost" onClick={() => { copy(url); }} testId="settings.signing.copy">
                  copy the link
                </Button>
              )}
              <Button kind="ghost" onClick={cancel} testId="settings.signing.cancel">
                cancel
              </Button>
            </span>
          </div>
        );
      })()}
      {keyFor !== null && (
        <div className="settings-key">
          <Field
            autoFocus
            type="password"
            placeholder="paste your key, then ⏎"
            state={bad || field === 'refused' ? 'error' : undefined}
            testId="settings.key.field"
            onChange={() => {
              // he fixes the key: the refusal was for the last one
              if (field === 'refused') setSent(null);
              if (bad) setBad(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                setKeyFor(null);
                setSent(null);
                if (want !== null) setClosedFor(want);
              } else if (e.key === 'Enter') {
                e.preventDefault();
                const k = e.currentTarget.value.trim();
                if (k === '') {
                  setBad(true);
                  return;
                }
                if (field === 'checking') return; // one send per key
                send({ cmd: 'key_set', id: keyFor, key: k });
                setSent({ n: keyError?.n ?? 0, base: accounts });
              }
            }}
          />
          <Help err={bad || field === 'refused'} testId="settings.key.help">
            {bad
              ? 'paste a key first'
              : field === 'refused' && keyError !== null
                ? `${keyErrorWords(keyError.text, keyFor)}. check it, then ⏎ again`
                : field === 'checking'
                  ? 'checking the key with the provider…'
                  : 'it stays on this Mac; esc cancels'}
          </Help>
        </div>
      )}
    </>
  );
}
