// The first launch's screen (route `onboarding`): one step at a time in
// the DS's Onb frame (the pearl, a title, a line, the step's rows, its
// button, the step dots), ⏎ the step's button, esc a step back, "skip for
// now" ends it. Draws model.ts from props; the store-fed screen
// (screen.tsx) gives it the core's accounts and found repos, the helper's
// permissions and fn. Owner: amb-home.
import { useState } from 'react';
import type { Account, AppCmd, Found, Perm } from '@/proto';
import { Button, Check, Chip, Field, Group, Help, Onb, type GroupItem } from '@/ds';
import { Accounts, signedIn, type KeyError } from '@/settings';
import {
  allAllowed, back, choose as choose_, chosenTicked, filterFound, finish, fnAct, next, pick, pickChosen, PERMS, START, stepOf, STEPS, ticked,
  type OnbState, type Perms,
} from './model';
import './setup.css';

export interface OnboardingPorts {
  send: (cmd: AppCmd) => void;
  /** a permission: ask = macOS's own prompt while it still allows one, open = its System Settings pane */
  perm: (perm: Perm, action: 'ask' | 'open') => void;
  /** the first launch ended (done or skipped): open bise */
  done: () => void;
  /** the system's folder picker (window.bise.pickFolder, amb-mac): a path, or null when he cancels */
  pickFolder?: () => Promise<string | null>;
}

export interface OnboardingProps {
  accounts: readonly Account[];
  found: readonly Found[];
  perms: Perms;
  /** the helper's last fn act (talk_start, talk_end...), with a counter so the same act twice counts */
  fn?: { act: string; n: number } | null;
  /** the core's last refusal of a key (bar S.2), shown on the model step's key field */
  keyError?: KeyError | null;
  ports: OnboardingPorts;
  now?: number;
  /** his home folder (window.bise.home), shown as ~ in the paths */
  home?: string;
}

const PERM_WORDS: Record<string, { label: string; sub: string; lost: string }> = {
  mic: { label: 'microphone', sub: 'to talk while you hold fn', lost: "without it, fn can't hear you: you type in the spotlight instead" },
  accessibility: { label: 'accessibility', sub: 'for fn everywhere, and to read the app in front (URL, file, selection)', lost: "without it, fn works only in bise's own windows" },
  screen: { label: 'screen recording', sub: 'for the capture fn adds to your question', lost: 'fn will send your words without a capture' },
};

export function Onboarding({ accounts, found, perms, fn = null, keyError = null, ports, now: pinned, home = '' }: OnboardingProps) {
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
  const ok = signedIn(accounts);
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
          title="hi. i'm bise."
          sub="hold fn and talk to me, from any app. i look after your projects with a team of agents, and i only ask you what needs you."
          cta={{ text: 'start', onClick: go, testId: 'setup.next' }}
        />
      );
      break;
    case 'permissions':
      body = (
        <Onb
          {...frame}
          title="three permissions"
          sub="nothing leaves unless you hold fn. you choose what i read in settings · privacy."
          cta={{ text: allAllowed(perms) ? 'continue' : 'continue for now', onClick: go, testId: 'setup.next' }}
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
                    <Chip tone="ok">✓ allowed</Chip>
                  ) : g === 'denied' ? (
                    <span className="setup-acts">
                      <Chip tone="err">denied</Chip>
                      <Button onClick={() => { ports.perm(p, 'open'); }} testId={`setup.perm.${p}.open`}>
                        open System Settings
                      </Button>
                    </span>
                  ) : (
                    <Button onClick={() => { ports.perm(p, 'ask'); }} testId={`setup.perm.${p}`}>
                      allow
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
        <Onb
          {...frame}
          title="which model?"
          sub="your subscription is enough. you can change it per project."
          cta={{ text: 'continue', onClick: go, state: ok ? undefined : 'disabled', testId: 'setup.next' }}
        >
          <Accounts accounts={accounts} send={ports.send} keyError={keyError} />
          {!ok && <Help>sign in to one of them to go on</Help>}
        </Onb>
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
          value: 'chosen',
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
          value: `git · ${ago(now - f.last_ms)}`,
        })),
      ];
      body = (
        <Onb
          {...frame}
          title="your projects"
          sub={items.length > 0 ? 'i found these repos in your folder. tick the ones bise should work in.' : 'bise works in your repos. choose the folder that has them.'}
          cta={{ text: n > 0 ? `add ${String(n)} ${n === 1 ? 'project' : 'projects'}` : 'continue without a project', onClick: go, testId: 'setup.next' }}
        >
          {/* no repo to filter: 'choose a folder…' alone, centred (designer N5) */}
          <div className={items.length > 0 ? 'setup-pick' : 'setup-pick alone'}>
            {items.length > 0 && (
              <Field
                placeholder="filter: type a name or a path"
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
                choose a folder…
              </Button>
            )}
          </div>
          {found.length === 0 && s.chosen.length === 0 ? (
            <Help>looking in your folders…</Help>
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
          title="try it: hold fn"
          sub="and say, for example, “what moved in storefront this week?”"
          cta={{ text: s.tried ? 'open bise' : 'open bise without trying', onClick: go, testId: 'setup.next' }}
        >
          <Help>{s.tried ? "✓ that's it: bise answers in the capsule, at the bottom of the screen." : 'fn space opens the spotlight · fn fn talks without holding'}</Help>
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
          setSt(back(s));
        }
      }}
    >
      {body}
      <div className="setup-foot">
        {s.at > 0 && (
          <Button kind="ghost" onClick={() => { setSt(back(s)); }} testId="setup.back">
            ← back
          </Button>
        )}
        {at !== 'fn' && (
          <Button kind="ghost" onClick={() => { run(finish(s)); }} testId="setup.skip">
            skip for now
          </Button>
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
  return q.trim() === '' ? 'no repos in this folder. choose a folder…, or continue without one.' : `no repo matches “${q.trim()}”. choose a folder…, or clear the filter.`;
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
  if (d < 1) return 'today';
  if (d < 2) return 'yesterday';
  if (d < 30) return `${String(d)} days ago`;
  if (d < 60) return 'a month ago';
  return `${String(Math.floor(d / 30))} months ago`;
}
