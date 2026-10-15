// Settings › general's 'update' group (designer's app-swap v2, his pick): his try app replaces
// itself with the newest promoted build, from here. Its five states: ready ('a new build is
// ready', '<new> · you run <old>', 'restart to update': no confirm, drafts kept, agents keep
// running), up to date, restarting (~1 s, then the app quits; no veil), failed (said by the app
// that reopened, with 'try again' and 'show the log') and test app ('updates come from the try',
// in a test app only: never in his). A refused swap says why in one grey line under the group (the
// rewritten sentences, main's refusalWords); only the ▲ of the last two is red. What it reads is
// amb-mac's window.bise.app.update() (src/main/update/tryswap.ts), fed by settings/screen.tsx.
// updateRow is the pure part. Owner: amb-home.
import { Fragment, useState, type ReactNode } from 'react';
import type { AppRefusal, AppSwapResult, AppUpdate } from '@/shared/api';
import { Button, Group } from '@/ds';
import { settings } from '@/proto/words.gen';

/** A template's words with a node in each hole (a sha drawn as Sha): the holes are filled with marks, then the marks give way to the nodes. */
export function withNodes<K extends string>(words: (a: Record<K, string>) => string, nodes: Record<K, ReactNode>): ReactNode {
  // a private-use character marks a hole: never in a word
  const marks = Object.fromEntries(Object.keys(nodes).map((k) => [k, `\uE000${k}\uE000`])) as Record<K, string>;
  return words(marks)
    .split(/\uE000(\w+)\uE000/)
    .map((part, i) => (i % 2 === 0 ? part : <Fragment key={i}>{nodes[part as K]}</Fragment>));
}

/** The row's state (null: no row, his app off a try bundle or not known yet). Pure. */
export type UpdateRow =
  | { readonly kind: 'ready'; readonly to: string; readonly live: string | null }
  | { readonly kind: 'current'; readonly live: string | null }
  | { readonly kind: 'restarting'; readonly to: string }
  | { readonly kind: 'failed'; readonly to: string; readonly live: string | null }
  | { readonly kind: 'test' }
  /** no swap from here and no state to say (an old try checkout, an unreadable script): the build alone, the why under it */
  | { readonly kind: 'stuck'; readonly live: string | null; readonly refused: AppRefusal; readonly why: string };

/** A sha as the row writes it (the mock's 7). */
export const short = (sha: string): string => sha.trim().slice(0, 7).toLowerCase();

/** The row for `u`, `restarting` the build a swap he started goes to (null: none). Pure. */
export function updateRow(u: AppUpdate | null, restarting: string | null): UpdateRow | null {
  if (restarting !== null) return { kind: 'restarting', to: restarting };
  if (u === null) return null;
  switch (u.state) {
    case 'staged': {
      const to = u.staged ?? '';
      return u.failed != null && u.failed === u.staged ? { kind: 'failed', to, live: u.live } : { kind: 'ready', to, live: u.live };
    }
    case 'current':
      return { kind: 'current', live: u.live };
    case 'none':
      switch (u.none ?? 'not_try') {
        case 'test_home':
          return { kind: 'test' };
        case 'not_gated':
          // a plain --try build staged, an old stamp: nothing promoted waits (amb-mac's q5-6)
          return { kind: 'current', live: u.live };
        case 'not_try':
          return null;
        case 'old_checkout':
        case 'unreadable':
          return { kind: 'stuck', live: u.live, refused: u.none ?? 'unreadable', why: u.why ?? '' };
      }
  }
}

/** A refusal's line under the group: its words, alarmed (▲, red) when something broke. Pure. */
export function refusalLine(r: AppRefusal, why: string): { readonly text: string; readonly alarm: boolean } {
  return { text: why, alarm: r === 'unreadable' || r === 'not_started' };
}

export interface UpdatePorts {
  /** the swap, back on this screen (window.bise.app.swap) */
  readonly swap: () => Promise<AppSwapResult>;
  /** 'show the log': restart.log in the window (route report/restart) */
  readonly showLog: () => void;
  /** read the state again (after a refusal) */
  readonly refresh: () => void;
}

const Sha = ({ sha }: { sha: string }) => (
  <span className="settings-sha" data-testid="settings.update.sha">
    {short(sha)}
  </span>
);
const Err = () => <span className="settings-update-err">▲</span>;

function Line({ text, alarm }: { text: string; alarm: boolean }) {
  return (
    <span className="settings-update-why" data-testid="settings.update.why" data-alarm={alarm ? 'true' : undefined}>
      {alarm && (
        <>
          <Err />{' '}
        </>
      )}
      {text.replace(/^▲\s*/, '')}
    </span>
  );
}

/** The general page's 'update' group, or nothing. */
export function UpdateGroup({ update, ports }: { update: AppUpdate | null; ports: UpdatePorts | undefined }) {
  const [restarting, setRestarting] = useState<string | null>(null);
  const [line, setLine] = useState<{ text: string; alarm: boolean } | null>(null);
  const row = updateRow(update, restarting);
  if (row === null) return null;
  const go = (to: string) => {
    if (ports === undefined || restarting !== null) return;
    setLine(null);
    setRestarting(to);
    void ports.swap().then(
      (r) => {
        // ok: the app quits in ~1 s and the row says so until then
        if (r.ok) return;
        setRestarting(null);
        setLine(refusalLine(r.refused, r.why));
        ports.refresh();
      },
      (e: unknown) => {
        setRestarting(null);
        setLine(refusalLine('not_started', settings.update_not_started({ why: e instanceof Error ? e.message : String(e) })));
      },
    );
  };
  let label: ReactNode;
  let sub: ReactNode = undefined;
  let control: ReactNode = undefined;
  switch (row.kind) {
    case 'ready':
      label = settings.update_ready;
      sub = row.live !== null ? withNodes(settings.update_ready_sub, { to: <Sha sha={row.to} />, live: <Sha sha={row.live} /> }) : <Sha sha={row.to} />;
      control = (
        <Button kind="pri" onClick={() => { go(row.to); }} testId="settings.update.restart">
          {settings.update_restart}
        </Button>
      );
      break;
    case 'current':
      label = settings.update_current;
      sub = row.live !== null ? withNodes(settings.update_current_sub, { live: <Sha sha={row.live} /> }) : settings.update_newest;
      break;
    case 'restarting':
      label = withNodes(settings.update_restarting, { to: <Sha sha={row.to} /> });
      sub = settings.update_restarting_sub;
      break;
    case 'failed':
      label = (<><Err /> {withNodes(settings.update_failed, { to: <Sha sha={row.to} /> })}</>);
      sub = row.live !== null ? withNodes(settings.update_still_on, { live: <Sha sha={row.live} /> }) : settings.update_nothing_lost;
      control = (
        <span className="settings-update-acts">
          <Button onClick={() => { go(row.to); }} testId="settings.update.again">
            {settings.update_again}
          </Button>
          <Button onClick={() => { ports?.showLog(); }} testId="settings.update.log">
            {settings.update_log}
          </Button>
        </span>
      );
      break;
    case 'test':
      label = settings.update_test;
      sub = settings.update_test_sub;
      break;
    case 'stuck':
      label = row.live !== null ? withNodes(settings.update_you_run, { live: <Sha sha={row.live} /> }) : settings.update_this_build;
      break;
  }
  const help = line ?? (row.kind === 'stuck' ? refusalLine(row.refused, row.why) : null);
  return (
    <div className={row.kind === 'test' ? 'settings-update is-test' : 'settings-update'} data-state={row.kind}>
      <Group
        title={settings.update_title}
        testId="settings.update"
        items={[{ id: 'row', label: (
              <span className="settings-update-t" data-testid="settings.update.label">
                {label}
              </span>
            ), sub, control }]}
        help={help !== null ? <Line text={help.text} alarm={help.alarm} /> : undefined}
      />
    </div>
  );
}
