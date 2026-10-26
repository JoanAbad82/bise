// His model accounts (bar S.2, S.3; settings · models and the first
// launch's model step): each subscription with its sign-in, and an API key.
// The core owns them (`accounts` event; sign_in opens his browser, only on
// his click; provider_use checks a key live and saves it once it works; it never comes back in an event).
// Owner: amb-home.
import { useState } from 'react';
import type { Account, AppCmd } from '@/proto';
import { Act, AppIcon, Button, Chip, Field, Group, Help, type GroupItem } from '@/ds';
import { common, settings } from '@/proto/words.gen';
import { failedWords, keyField, type ProviderCheck, type Sent } from './keycheck';

/**
 * The expired ChatGPT sign-in (bar V14 / S28 / L2): the agents its expiry stopped (the hub's
 * signin card's Card.waiting) and the sign-in under way from the app (the core's signing: the
 * link his browser opened, to copy; useSigning).
 */
export interface SignIn {
  waiting: readonly string[];
  signing?: { readonly id: string; readonly url: string } | null;
}

/** He is signed in to one account at least (the first launch's model step goes on). */
export function signedIn(accounts: readonly Account[]): boolean {
  return accounts.some((a) => a.state === 'signed_in');
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
  if (waiting.length === 0) return settings.expired_alone;
  const names = waiting.length <= 3 ? waiting.join(', ') : settings.names_more({ names: waiting.slice(0, 2).join(', '), more: waiting.length - 2 });
  return waiting.length === 1 ? settings.expired_waits({ names }) : settings.expired_wait({ names });
}

export interface AccountsProps {
  accounts: readonly Account[];
  send: (cmd: AppCmd) => void;
  /** provider_use's last answer (the store's provider_check): the key field's check */
  check?: ProviderCheck | null;
  want?: Want | null;
  /** the expired sign-in: the agents waiting, the sign-in under way */
  signin?: SignIn | null;
  /** copy the sign-in link (c) */
  copy?: (text: string) => void;
  /** cancel the sign-in under way (esc): AppCmd sign_in_cancel {id} */
  cancelSignIn?: (id: string) => void;
}

export function Accounts({ accounts, send, check = null, want = null, signin = null, copy, cancelSignIn }: AccountsProps) {
  // the sign-ins he started here: a spinner until the core's next accounts
  const [signing, setSigning] = useState<{ base: readonly Account[]; ids: readonly string[] }>({ base: accounts, ids: [] });
  const busy = signing.base === accounts ? signing.ids : [];
  const [picked, setKeyFor] = useState<string | null>(null);
  // a waiting model whose provider is set up by a key: its field is open from the start (esc closes it)
  const [closedFor, setClosedFor] = useState<Want | null>(null);
  const wantKey = want !== null ? accounts.find((a) => a.kind === 'key' && ofProvider(a, want.provider) && a.state !== 'signed_in') : undefined;
  const keyFor = picked ?? (wantKey !== undefined && closedFor !== want ? wantKey.id : null);
  const [bad, setBad] = useState(false);
  // the key he sent: checked live by the core (provider_use), saved only once it works
  const [sent, setSent] = useState<Sent | null>(null);
  const field = keyField(sent, check);
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
          ? settings.sign_in_for({ model: want.model })
          : settings.sign_in_browser,
    control:
      a.state === 'signed_in' ? (
        <Chip tone="ok" testId={`settings.account.${a.id}.ok`}>
          <AppIcon name="check" size={14} />
          {settings.signed_in}
        </Chip>
      ) : (
        <Button
          state={busy.includes(a.id) ? 'loading' : undefined}
          onClick={() => {
            setSigning({ base: accounts, ids: [...busy, a.id] });
            send({ cmd: 'sign_in', id: a.id });
          }}
          testId={`settings.account.${a.id}`}
        >
          {a.state === 'expired' ? settings.sign_in_again : settings.sign_in}
        </Button>
      ),
  }));
  const firstKey = wantKey ?? keys[0];
  items.push({
    id: 'key',
    label: settings.api_key_row,
    sub: key ? `${key.label}${key.who != null ? ` · ${key.who}` : ''}` : settings.api_key_sub,
    control: key ? (
      <span className="settings-row-acts">
        <Chip tone="ok">
          <AppIcon name="check" size={14} />
          {settings.key_added}
        </Chip>
        <Button kind="ghost" onClick={() => { send({ cmd: 'key_remove', id: key.id }); }} testId={`settings.key.${key.id}.remove`}>
          {settings.key_remove}
        </Button>
      </span>
    ) : firstKey ? (
      <Button onClick={() => { setKeyFor(firstKey.id); setBad(false); setSent(null); }} testId="settings.key.add">
        {settings.key_add}
      </Button>
    ) : undefined,
  });
  return (
    <>
      {want !== null && (
        <Help testId="settings.models.want">
          {settings.model_needs({ model: want.model, provider: want.providerName })}
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
            <Help>{common.signing_wait({ label })}</Help>
            <span className="settings-row-acts">
              {url !== null && copy && (
                <Act onClick={() => { copy(url); }} testId="settings.signing.copy">
                  {settings.signing_copy}
                </Act>
              )}
              <Act onClick={cancel} testId="settings.signing.cancel">
                {settings.cancel}
              </Act>
            </span>
          </div>
        );
      })()}
      {keyFor !== null && (
        <div className="settings-key">
          <Field
            autoFocus
            type="password"
            placeholder={settings.key_paste}
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
                send({ cmd: 'provider_use', id: keyFor, key: k });
                setSent({ id: keyFor, base: check });
              }
            }}
          />
          <Help err={bad || field === 'refused'} testId="settings.key.help">
            {bad
              ? settings.key_first
              : field === 'refused' && check !== null
                ? settings.key_check({ why: failedWords(check, null, false).line.replace(/\.$/, '') })
                : field === 'checking'
                  ? settings.key_checking
                  : settings.key_stays}
          </Help>
        </div>
      )}
    </>
  );
}
