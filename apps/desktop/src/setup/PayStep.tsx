// The first launch's model step, drawn (pay.ts is its logic; PayStep.tsx: not Pay.tsx, which a case-blind disk takes for pay.ts): the TUI's key step in the window.
// The list (keys found, ChatGPT, OpenRouter, an API key, a coding plan key), a provider list, a
// key field with its keys page, then the live check: checking, failed (why, the provider's own
// words, the page that fixes it) or "it works" with what the model said and what each role runs.
// Owner: amb-home.
import { useRef, type ReactNode } from 'react';
import type { Account, AppCmd, KeyFrom } from '@/proto';
import { Act, Button, Field, Group, Help, Onb, type GroupItem } from '@/ds';
import { failedWords, fromWords, retries, shortModel, type ProviderCheck } from '@/settings';
import { common, settings } from '@/proto/words.gen';
import { CHATGPT, OPENROUTER, keyProviders, openRouterSignIn, phase, pickRow, rows, startCheck, type PayState, type Row } from './pay';

export interface PayProps {
  /** the Onb frame's step dots and test id */
  frame: { steps: number; step: number; testId: string };
  accounts: readonly Account[];
  check: ProviderCheck | null;
  s: PayState;
  set: (s: PayState) => void;
  send: (cmd: AppCmd) => void;
  /** the step's button: on to the next step (enabled once a check works) */
  go: () => void;
  /** a link in his browser (keys, billing) */
  open?: (url: string) => void;
  /** the core refused the sign-in he started (error {cmd: sign_in}): its words */
  signInError?: string | null;
}

export function PayStep({ frame, accounts, check, s, set, send, go, open, signInError = null }: PayProps) {
  const run = (r: { s: PayState; cmd: AppCmd | null }) => {
    if (r.cmd !== null) send(r.cmd);
    set(r.s);
  };
  const ph = phase(s, check);
  const field = useRef<HTMLInputElement>(null);
  const name = (id: string) => accounts.find((a) => a.id === id)?.label ?? id;
  const link = (text: string, url: string | null, id: string): ReactNode =>
    url === null ? (
      text
    ) : (
      <>
        {text}
        <Act onClick={() => open?.(url)} testId={`setup.pay.link.${id}`}>
          {url.replace(/^https?:\/\//, '')}
        </Act>
      </>
    );
  const cont = { text: settings.onb_continue, onClick: go, state: ph === 'works' ? undefined : ('disabled' as const), testId: 'setup.next' };
  const v = s.view;

  if (v.t === 'which') {
    const items: GroupItem[] = keyProviders(accounts, v.coding).map((a) => ({
      id: a.id,
      label: a.label,
      sub: a.state === 'signed_in' ? settings.first_found : undefined,
      onPick: () => {
        set({ ...s, view: { t: 'key', id: a.id } });
      },
    }));
    return (
      <Onb {...frame} title={v.coding ? settings.first_which_plan : settings.first_which_provider} cta={cont}>
        <div className="setup-list">
          <Group list testId="setup.pay.which" items={items} />
        </div>
      </Onb>
    );
  }

  if (v.t === 'openrouter') {
    return (
      <Onb {...frame} title="OpenRouter" sub={settings.first_openrouter_sub} cta={cont}>
        <span className="setup-acts">
          <Button onClick={() => { run(openRouterSignIn(s)); }} testId="setup.pay.openrouter.signin">
            {settings.first_openrouter_sign_in}
          </Button>
          <Button onClick={() => { set({ ...s, view: { t: 'key', id: OPENROUTER } }); }} testId="setup.pay.openrouter.key">
            {settings.first_paste_a_key}
          </Button>
        </span>
      </Onb>
    );
  }

  // "it works": whichever way it came (a pasted key, a key found, a sign-in)
  if (ph === 'works' && check !== null) {
    const title = check.label != null && check.label !== '' ? check.label : shortModel(check.model ?? '');
    return (
      <Onb {...frame} title={settings.first_works({ model: title })} cta={cont}>
        <div className="setup-works" data-testid="setup.pay.works">
          {check.answer != null && (
            <p className="setup-said" data-testid="setup.pay.answer">
              <span className="setup-ok">✓</span> {settings.onb_answered({ answer: check.answer })}
              {check.ms != null && <span className="setup-took">{settings.onb_took({ secs: (check.ms / 1000).toFixed(1) })}</span>}
            </p>
          )}
          {(check.lines ?? []).map((l) => (
            <p key={l} className="setup-dim">{withIds(l)}</p>
          ))}
        </div>
      </Onb>
    );
  }

  if (v.t === 'key') {
    const acc = accounts.find((a) => a.id === v.id);
    const url = acc?.keys_url != null && acc.keys_url !== '' ? acc.keys_url : null;
    const mine = s.sent?.id === v.id;
    const failed = mine && ph === 'failed' && check !== null ? check : null;
    const f = failed !== null ? failedWords(failed, null, false) : null;
    const resend = () => {
      const k = field.current?.value.trim() ?? '';
      if (k !== '' && ph !== 'checking') run(startCheck(s, v.id, k, check));
    };
    // the provider didn't answer: retrying the same key makes sense; a wrong key: he pastes another
    const retry = failed !== null && retries(failed);
    return (
      <Onb
        {...frame}
        title={settings.first_paste_key({ provider: name(v.id) })}
        cta={retry ? { text: settings.onb_try_again, onClick: resend, testId: 'setup.pay.again' } : cont}
      >
        <div className="setup-key">
          <Field
            ref={field}
            autoFocus
            type="password"
            placeholder={settings.key_paste}
            state={f !== null ? 'error' : undefined}
            testId="setup.pay.key"
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              resend();
            }}
          />
          {mine && ph === 'checking' && <Help testId="setup.pay.checking">{settings.first_checking_key}</Help>}
          {f !== null && (
            <div data-testid="setup.pay.failed">
              {/* only the ▲ is red: a whole red line shouts at a paste mistake (designer m_28734) */}
              <Help>
                <span className="setup-mark">▲</span> {f.line}
              </Help>
              {f.said !== null && <Help>{f.said}</Help>}
              {f.fix !== null && <Help>{link(f.fix.text, f.fix.url, 'fix')}</Help>}
            </div>
          )}
          {f === null && !(mine && ph === 'checking') && url !== null && <Help testId="setup.pay.get">{link(settings.first_get_one, url, 'keys')}</Help>}
          {f === null && !(mine && ph === 'checking') && <Help>{settings.first_goes_in_auth}</Help>}
        </div>
      </Onb>
    );
  }

  if (v.t === 'check') {
    const plan = v.id === CHATGPT;
    const acc = accounts.find((a) => a.id === v.id);
    const from = acc?.from != null ? fromWords(acc.from) : null;
    if (ph === 'signing') {
      return (
        <Onb {...frame} title={common.signing_wait({ label: name(v.id) })} cta={cont}>
          {signInError !== null && <p className="setup-dim err" data-testid="setup.pay.signin.err">{signInError}</p>}
        </Onb>
      );
    }
    if (ph === 'failed' && check !== null) {
      const f = failedWords(check, from, plan);
      // a key found that's wrong: he pastes another; a plan or no answer: the same again
      const cta =
        !plan && !retries(check)
          ? { text: settings.first_paste_a_key, onClick: () => { set({ ...s, view: { t: 'key', id: v.id } }); }, testId: 'setup.pay.paste' }
          : {
              text: settings.onb_try_again,
              onClick: () => {
                run(plan ? pickRow(s, { t: 'chatgpt', acc: acc ?? null }, check) : startCheck(s, v.id, undefined, check));
              },
              testId: 'setup.pay.again',
            };
      return (
        <Onb {...frame} title={f.line} cta={cta}>
          <div className="setup-works" data-testid="setup.pay.failed">
            {f.said !== null && <p className="setup-dim">{f.said}</p>}
            {f.fix !== null && <p className="setup-dim">{link(f.fix.text, f.fix.url, 'fix')}</p>}
          </div>
        </Onb>
      );
    }
    return <Onb {...frame} title={plan ? settings.first_checking_plan : settings.first_checking_key} cta={cont} />;
  }

  const items: GroupItem[] = rows(accounts).map((r) => rowItem(r, () => { run(pickRow(s, r, check)); }));
  return (
    <Onb {...frame} title={settings.onb_model_title} sub={settings.onb_pay_sub} cta={cont}>
      <div className="setup-list">
        <Group list testId="setup.pay" items={items} />
      </div>
    </Onb>
  );
}

/** A row of the list: its label, its description (the TUI's words), a click picks it. */
function rowItem(r: Row, pick: () => void): GroupItem {
  switch (r.t) {
    case 'found':
      return { id: `found-${r.acc.id}`, label: r.acc.label, sub: r.acc.from != null ? foundWords(r.acc.from) : settings.first_found, onPick: pick };
    case 'chatgpt':
      return {
        id: 'chatgpt',
        label: settings.first_chatgpt,
        sub: r.acc?.state === 'signed_in' && r.acc.who != null ? settings.first_signed_in({ email: r.acc.who, plan: r.acc.label }) : settings.first_chatgpt_sub,
        onPick: pick,
      };
    case 'openrouter':
      return { id: 'openrouter', label: 'OpenRouter', sub: settings.first_openrouter_way, onPick: pick };
    case 'api':
      return { id: 'api', label: settings.api_key, sub: settings.first_api_key_sub, onPick: pick };
    case 'coding':
      return { id: 'coding', label: settings.first_coding, sub: settings.first_coding_sub, onPick: pick };
  }
}

/** Where a found key comes from, its place in mono: "use the ANTHROPIC_API_KEY from your shell". */
function foundWords(f: KeyFrom): ReactNode {
  const where = fromWords(f);
  const text = f.t === 'env' ? settings.onb_found_env({ var: where }) : settings.onb_found_file({ path: where });
  const i = text.indexOf(where);
  if (where === '' || i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <code>{where}</code>
      {text.slice(i + where.length)}
    </>
  );
}

/** A dim line with its model ids in mono ("main uses <code>anthropic/claude-opus-5-5</code>."). */
function withIds(line: string): ReactNode {
  const parts = line.split(/([\w.-]+\/[\w./-]*[\w-]|[a-z][\w.]*-[\w.-]*\d[\w-]*)/);
  return parts.map((p, i) => (i % 2 === 1 ? <code key={i}>{p}</code> : p));
}
