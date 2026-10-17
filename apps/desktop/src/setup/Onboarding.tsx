// The first launch's screen (route `onboarding`): one step at a time in
// the DS's Onb frame (the pearl, a title, a line, the step's rows, its
// button, the step dots), ⏎ the step's button, esc a step back, "skip for
// now" ends it. Draws model.ts from props; the store-fed screen
// (screen.tsx) gives it the core's accounts and found repos, the helper's
// permissions and fn. Owner: amb-home.
import { useState } from 'react';
import type { Account, AppCmd, Found, Perm } from '@/proto';
import { Act, Button, Check, Chip, Field, Group, Help, Onb, type GroupItem } from '@/ds';
import type { ProviderCheck } from '@/settings';
import { PayStep } from './PayStep';
import { afterSignIn, PAY_START, ready, upOf, type PayState } from './pay';
import {
  allAllowed, back, choose as choose_, chosenTicked, filterFound, finish, fnAct, next, pick, pickChosen, PERMS, START, stepOf, STEPS, ticked,
  type OnbState, type Perms,
} from './model';
import { settings } from '@/proto/words.gen';
import './setup.css';

export interface OnboardingPorts {
  send: (cmd: AppCmd) => void;
  /** a permission: ask = macOS's own prompt while it still allows one, open = its System Settings pane */
  perm: (perm: Perm, action: 'ask' | 'open') => void;
  /** the first launch ended (done or skipped): open bise */
  done: () => void;
  /** the system's folder picker (window.bise.pickFolder, amb-mac): a path, or null when he cancels */
  pickFolder?: () => Promise<string | null>;
  /** a link in his browser (a provider's keys or billing page) */
  open?: (url: string) => void;
}

export interface OnboardingProps {
  accounts: readonly Account[];
  found: readonly Found[];
  perms: Perms;
  /** the helper's last fn act (talk_start, talk_end...), with a counter so the same act twice counts */
  fn?: { act: string; n: number } | null;
  /** provider_use's last answer (the model step's live check) */
  check?: ProviderCheck | null;
  /** the core's last refusal of a sign-in started here (error {cmd: sign_in}): its words */
  signInError?: string | null;
  ports: OnboardingPorts;
  now?: number;
  /** his home folder (window.bise.home), shown as ~ in the paths */
  home?: string;
}

const PERM_WORDS: Record<string, { label: string; sub: string; lost: string }> = {
  mic: { label: settings.perm_mic, sub: settings.onb_mic_sub, lost: settings.onb_mic_lost },
  accessibility: { label: settings.perm_accessibility, sub: settings.onb_accessibility_sub, lost: settings.onb_accessibility_lost },
  screen: { label: settings.perm_screen, sub: settings.onb_screen_sub, lost: settings.onb_screen_lost },
};

export function Onboarding({ accounts, found, perms, fn = null, check = null, signInError = null, ports, now: pinned, home = '' }: OnboardingProps) {
  const [opened] = useState(() => Date.now());
  const now = pinned ?? opened;
  const [st, setSt] = useState<OnbState>(START);
  // the projects step's filter over the found repos
  const [q, setQ] = useState('');
  // the helper's fn acts fold into the state as they come (keyed on n, never re-applied)
  const [seen, setSeen] = useState(0);
  let s = st;
  if (fn !== null && fn.n !== seen) {
    s = fnAct(st, fn.act);
    setSeen(fn.n);
    setSt(s);
  }
  // the model step (pay.ts): a sign-in he started here that ended signed in gets its check, once
  const [pay, setPay] = useState<PayState>(PAY_START);
  const [payAccounts, setPayAccounts] = useState(accounts);
  if (payAccounts !== accounts) {
    setPayAccounts(accounts);
    const r = afterSignIn(pay, accounts, check);
    if (r !== null) {
      ports.send(r.cmd);
      setPay(r.s);
    }
  }
  const ok = ready(pay, check);
  const run = (r: { s: OnbState; cmds: AppCmd[]; done: boolean }) => {
    for (const c of r.cmds) ports.send(c);
    setSt(r.s);
    if (r.done) ports.done();
  };
  const go = () => {
    run(next(s, { signedIn: ok, found, now }));
  };
  const at = stepOf(s);
  const frame = {
    steps: STEPS.length,
    step: s.at,
    testId: `setup.step.${at}`,
  };
  let body;
  switch (at) {
    case 'hello':
      body = (
        <Onb
          {...frame}
          pearl
          title={settings.onb_hello_title}
          sub={settings.onb_hello_sub}
          cta={{ text: settings.onb_start, onClick: go, testId: 'setup.next' }}
        />
      );
      break;
    case 'permissions':
      body = (
        <Onb
          {...frame}
          title={settings.onb_perms_title}
          sub={settings.onb_perms_sub}
          cta={{ text: allAllowed(perms) ? settings.onb_continue : settings.onb_continue_for_now, onClick: go, testId: 'setup.next' }}
        >
          <Group
            testId="setup.perms"
            items={PERMS.map((p) => {
              const g = perms[p];
              const w = PERM_WORDS[p] ?? { label: p, sub: '', lost: '' };
              return {
                id: p,
                label: w.label,
                sub: g === 'denied' ? w.lost : w.sub,
                control:
                  g === 'allowed' ? (
                    <Chip tone="ok">{settings.onb_allowed}</Chip>
                  ) : g === 'denied' ? (
                    <span className="setup-acts">
                      <Chip tone="err">{settings.onb_denied}</Chip>
                      <Button onClick={() => { ports.perm(p, 'open'); }} testId={`setup.perm.${p}.open`}>
                        {settings.open_system_settings}
                      </Button>
                    </span>
                  ) : (
                    <Button onClick={() => { ports.perm(p, 'ask'); }} testId={`setup.perm.${p}`}>
                      {settings.perm_allow}
                    </Button>
                  ),
              };
            })}
          />
        </Onb>
      );
      break;
    case 'model':
      body = (
        <PayStep
          frame={frame}
          accounts={accounts}
          check={check}
          s={pay}
          set={setPay}
          send={ports.send}
          go={go}
          signInError={signInError}
          {...(ports.open ? { open: ports.open } : {})}
        />
      );
      break;
    case 'projects': {
      const items = found.filter((f) => !f.known);
      const n = items.filter((f) => ticked(s, f, now)).length + s.chosen.filter((p) => chosenTicked(s, p)).length;
      const shown = filterFound(items, q);
      const choose = ports.pickFolder;
      // the folders he chose by hand, then the found repos the filter keeps
      const rows: GroupItem[] = [
        ...s.chosen.map((p) => ({
          id: p,
          label: baseName(p),
          sub: homePath(p, home),
          check: (
            <Check
              on={chosenTicked(s, p)}
              label={baseName(p)}
              onChange={() => {
                setSt(pickChosen(s, p));
              }}
              testId={`setup.chosen.${baseName(p)}`}
            />
          ),
          value: settings.onb_chosen,
        })),
        ...shown.map((f) => ({
          id: f.path,
          label: f.name,
          sub: homePath(f.path, home),
          check: (
            <Check
              on={ticked(s, f, now)}
              label={f.name}
              onChange={() => {
                setSt(pick(s, f, now));
              }}
              testId={`setup.found.${f.name}`}
            />
          ),
          value: settings.onb_git({ when: ago(now - f.last_ms) }),
        })),
      ];
      body = (
        <Onb
          {...frame}
          title={settings.onb_projects_title}
          sub={items.length > 0 ? settings.onb_projects_found : settings.onb_projects_none}
          cta={{ text: n > 0 ? settings.onb_add_projects({ n }) : settings.onb_no_project, onClick: go, testId: 'setup.next' }}
        >
          {/* no repo to filter: 'choose a folder…' alone, centred (designer N5) */}
          <div className={items.length > 0 ? 'setup-pick' : 'setup-pick alone'}>
            {items.length > 0 && (
              <Field
                placeholder={settings.onb_filter}
                value={q}
                onChange={(e) => {
                  setQ(e.currentTarget.value);
                }}
                testId="setup.filter"
              />
            )}
            {choose && (
              <Button
                onClick={() => {
                  void choose().then((p) => {
                    if (p !== null && p !== '') setSt((cur) => choose_(cur, p, found));
                  });
                }}
                testId="setup.choose"
              >
                {settings.onb_choose}
              </Button>
            )}
          </div>
          {found.length === 0 && s.chosen.length === 0 ? (
            <Help>{settings.scan_looking}</Help>
          ) : rows.length === 0 ? (
            <Help testId="setup.filter.none">{noRepoWords(q)}</Help>
          ) : (
            <div className="setup-list" data-testid="setup.list">
              <Group testId="setup.found" items={rows} />
            </div>
          )}
        </Onb>
      );
      break;
    }
    case 'fn':
      body = (
        <Onb
          {...frame}
          pearl={{ mood: s.fn === 'down' ? 'listen' : s.tried ? 'done' : 'rest' }}
          fn={s.fn}
          title={settings.onb_fn_title}
          sub={settings.onb_fn_sub}
          cta={{ text: s.tried ? settings.onb_open : settings.onb_open_untried, onClick: go, testId: 'setup.next' }}
        >
          <Help>{s.tried ? settings.onb_fn_done : settings.onb_fn_help}</Help>
        </Onb>
      );
      break;
  }
  return (
    <section
      className="setup"
      data-testid="setup.root"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.defaultPrevented || e.target instanceof HTMLInputElement) return;
        if (e.key === 'Enter' && !e.metaKey && !e.shiftKey) {
          e.preventDefault();
          go();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          // the model step's own levels first (a key field, a provider list, a check)
          const up = at === 'model' ? upOf(pay, accounts) : null;
          if (up !== null) setPay(up);
          else setSt(back(s));
        }
      }}
    >
      {body}
      <div className="setup-foot">
        {s.at > 0 && (
          // designer m_18736: back and skip are Acts; only the step's own action is a Button (pri)
          <Act onClick={() => { setSt(back(s)); }} testId="setup.back">
            {settings.onb_back}
          </Act>
        )}
        {at !== 'fn' && (
          <Act onClick={() => { run(finish(s)); }} testId="setup.skip">
            {settings.onb_skip}
          </Act>
        )}
      </div>
    </section>
  );
}

/**
 * The projects step with no repo to show: a filter that matches none says so; with no filter, there is
 * no repo here (never 'matches ""' or 'clear the filter'; ambient-lead m_12999, designer's N5 words). Pure.
 */
export function noRepoWords(q: string): string {
  return q.trim() === '' ? settings.onb_no_repos : settings.onb_no_match({ q: q.trim() });
}

/**
 * A path as he reads it (the signed rule, ambient m_11825): his home as '~', a long one cut in the
 * middle keeping the last folders: '~/code/shop', '~/…/clients/acme/shop'. Pure.
 */
export function homePath(p: string, home: string, max = 40): string {
  const h = home.replace(/\/+$/, '');
  const s = h !== '' && (p === h || p.startsWith(`${h}/`)) ? `~${p.slice(h.length)}` : p;
  if (s.length <= max) return s;
  const parts = s.split('/');
  const head = parts[0] ?? '';
  let tail = parts.at(-1) ?? '';
  for (let i = parts.length - 2; i > 0 && `${head}/…/${parts[i] ?? ''}/${tail}`.length <= max; i -= 1) tail = `${parts[i] ?? ''}/${tail}`;
  return `${head}/…/${tail}`;
}

/** A path's last part, its name in the list. Pure. */
export function baseName(p: string): string {
  const parts = p.replace(/\/+$/, '').split('/');
  return parts[parts.length - 1] ?? p;
}

function ago(ms: number): string {
  const d = Math.floor(ms / 86_400_000);
  if (d < 1) return settings.age_today;
  if (d < 2) return settings.age_yesterday;
  if (d < 30) return settings.age_days({ n: d });
  if (d < 60) return settings.age_month;
  return settings.age_months({ n: Math.floor(d / 30) });
}
