// The first launch's screen (route `onboarding`, desktop-onboarding v4):
// four steps in the DS's Onb frame (a 480 px column: the mark, a title, a
// line, the step's rows, its button, the step dots), '← back' top left and
// 'skip for now' top right; ⏎ the step's button, esc a step back. hello
// shows bise's typed ':*' (never the mist pearl); the last step, first, is
// a real composer: ⏎ sends his first message to bise and opens bise with it
// running, an idea chip fills the composer, holding fn works too, 'open
// bise' leaves without asking. Draws model.ts from props; the store-fed
// screen (screen.tsx) gives it the core's accounts and found repos, the
// helper's permissions and fn. Owner: amb-home.
import { useEffect, useRef, useState } from 'react';
import type { Account, AppCmd, Found } from '@/proto';
import { Act, Button, Check, Chip, Field, Group, Help, Kbd, Kiss, Onb, type GroupItem } from '@/ds';
import { Composer } from '@/composer';
import type { ComposerActions } from '@/composer/actions';
import type { ProviderCheck } from '@/settings';
import { PayStep } from './PayStep';
import { afterSignIn, PAY_START, ready, upOf, type PayState } from './pay';
import {
  back, baseName, choose as choose_, chosenTicked, filterFound, finish, firstSend, fnAct, ideas, next, pick, pickChosen, START, stepOf, STEPS, ticked, tickedNames,
  type OnbState,
} from './model';
import type { Perms } from './perms';
import { settings } from '@/proto/words.gen';
import './setup.css';

export interface OnboardingPorts {
  send: (cmd: AppCmd) => void;
  /** the first launch ended (done, skipped, or his first message sent): open bise */
  done: () => void;
  /** the system's folder picker (window.bise.pickFolder, amb-mac): a path, or null when he cancels */
  pickFolder?: () => Promise<string | null>;
  /** a link in his browser (a provider's keys or billing page) */
  open?: (url: string) => void;
}

export interface OnboardingProps {
  accounts: readonly Account[];
  /** Claude Code is signed in with a Claude plan: the model step points at its monthly API credits */
  claudePlan?: boolean;
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

/** The marks' sizes: hello's ':*' (designer's A, 112 px) and the first message's. */
const HELLO_KISS = 112;
const FIRST_KISS = 48;

/** A fn sentinel in onb_first_fn's words, where the key chip goes. */
const FN_HOLE = '\u0000';

export function Onboarding({ accounts, claudePlan = false, found, perms, fn = null, check = null, signInError = null, ports, now: pinned, home = '' }: OnboardingProps) {
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
  // he held fn on the first message and let go, the mic his: bise has his words; the first launch ends there
  const saidByFn = stepOf(s) === 'first' && s.tried && perms.mic === 'allowed';
  const ended = useRef(false);
  useEffect(() => {
    if (!saidByFn || ended.current) return;
    ended.current = true;
    for (const c of finish(s).cmds) ports.send(c);
    ports.done();
  }, [saidByFn, s, ports]);
  // the first message's composer (its fill for an idea chip)
  const composer = useRef<ComposerActions | null>(null);
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
          mark={<Kiss size={HELLO_KISS} pop turn testId="setup.mark" />}
          title={settings.onb_hello_title}
          sub={settings.onb_hello_sub}
          cta={{ text: settings.onb_start, onClick: go, testId: 'setup.next' }}
        />
      );
      break;
    case 'model':
      body = (
        <PayStep
          frame={frame}
          accounts={accounts}
          claudePlan={claudePlan}
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
    case 'first': {
      const [before = '', after = ''] = settings.onb_first_fn({ key: FN_HOLE }).split(FN_HOLE);
      body = (
        <Onb {...frame} mark={<Kiss size={FIRST_KISS} testId="setup.mark" />} title={settings.onb_first_title}>
          <div className="setup-first" data-testid="setup.first">
            <Composer
              target="onboarding/first"
              placeholder={settings.onb_first_placeholder}
              onSend={(out) => {
                const r = firstSend(s, out.text);
                if (r !== null) run(r);
              }}
              onReady={(a) => {
                composer.current = a;
                a.focus();
              }}
              testId="setup.composer"
            />
            <div className="setup-ideas" data-testid="setup.ideas">
              {ideas(tickedNames(s, found, now)).map((t, i) => (
                // an idea fills the composer, never sends (designer's brief §2.4)
                <Chip key={t} onClick={() => { composer.current?.fill(t); }} testId={`setup.idea.${String(i)}`}>
                  {t}
                </Chip>
              ))}
            </div>
            <p className="setup-fnline" data-testid="setup.fnline">
              {before}
              <Kbd>fn</Kbd>
              {after}
            </p>
          </div>
        </Onb>
      );
      break;
    }
  }
  return (
    <section
      className="setup"
      data-testid="setup.root"
      tabIndex={-1}
      onKeyDown={(e) => {
        // the fields and the first message's composer keep their keys (its ⏎ sends, its esc is its own)
        if (e.defaultPrevented || e.target instanceof HTMLInputElement || (e.target instanceof HTMLElement && e.target.isContentEditable)) return;
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
      {/* designer m_18736: back and skip are Acts; only the step's own action is a Button (pri). v4: at the top,
          '← back' left, 'skip for now' right ('open bise' on the first message: it leaves without asking) */}
      <div className="setup-top">
        <span>
          {s.at > 0 && (
            <Act onClick={() => { setSt(back(s)); }} testId="setup.back">
              {settings.onb_back}
            </Act>
          )}
        </span>
        <Act onClick={() => { run(finish(s)); }} testId={at === 'first' ? 'setup.open' : 'setup.skip'}>
          {at === 'first' ? settings.onb_open : settings.onb_skip}
        </Act>
      </div>
      {body}
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

function ago(ms: number): string {
  const d = Math.floor(ms / 86_400_000);
  if (d < 1) return settings.age_today;
  if (d < 2) return settings.age_yesterday;
  if (d < 30) return settings.age_days({ n: d });
  if (d < 60) return settings.age_month;
  return settings.age_months({ n: Math.floor(d / 30) });
}
