// His model accounts (bar S.2, S.3; settings · models and the first
// launch's model step): each subscription with its sign-in, and an API key.
// The core owns them (`accounts` event; sign_in opens his browser, only on
// his click; key_set stores the key, which never comes back in an event).
// Owner: amb-home.
import { useState } from 'react';
import type { Account, AppCmd } from '@/proto';
import { Button, Chip, Field, Group, Help, type GroupItem } from '@/ds';

/** He is signed in to one account at least (the first launch's model step goes on). */
export function signedIn(accounts: readonly Account[]): boolean {
  return accounts.some((a) => a.state === 'signed_in');
}

export function Accounts({ accounts, send }: { accounts: readonly Account[]; send: (cmd: AppCmd) => void }) {
  // the sign-ins he started here: a spinner until the core's next accounts
  const [signing, setSigning] = useState<{ base: readonly Account[]; ids: readonly string[] }>({ base: accounts, ids: [] });
  const busy = signing.base === accounts ? signing.ids : [];
  const [keyFor, setKeyFor] = useState<string | null>(null);
  const [bad, setBad] = useState(false);
  const subs = accounts.filter((a) => a.kind === 'subscription');
  const keys = accounts.filter((a) => a.kind === 'key');
  const key = keys.find((a) => a.state === 'signed_in');
  const items: GroupItem[] = subs.map((a) => ({
    id: a.id,
    label: a.label,
    sub: a.state === 'signed_in' && a.who != null ? a.who : 'sign in with your browser',
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
  const firstKey = keys[0];
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
      <Button onClick={() => { setKeyFor(firstKey.id); setBad(false); }} testId="settings.key.add">
        add a key
      </Button>
    ) : undefined,
  });
  return (
    <>
      <Group testId="settings.models" items={items} />
      {keyFor !== null && (
        <div className="settings-key">
          <Field
            autoFocus
            type="password"
            placeholder="paste your key, then ⏎"
            state={bad ? 'error' : undefined}
            testId="settings.key.field"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                setKeyFor(null);
              } else if (e.key === 'Enter') {
                e.preventDefault();
                const k = e.currentTarget.value.trim();
                if (k === '') {
                  setBad(true);
                  return;
                }
                send({ cmd: 'key_set', id: keyFor, key: k });
                e.currentTarget.value = '';
                setKeyFor(null);
              }
            }}
          />
          <Help err={bad}>{bad ? 'paste a key first' : 'it stays on this Mac; esc cancels'}</Help>
        </div>
      )}
    </>
  );
}
