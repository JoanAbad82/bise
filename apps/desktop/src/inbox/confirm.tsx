// The hub's yes/no question in the window (bar I9/C46/S30): archive a
// working agent, and the hub asks "archive it anyway? (y/n)" of this window
// only (bise-proto `confirm`). The TUI's default is no ([y/N], designer
// m_18733): 'no' is the filled button and ⏎ answers it, 'yes' is the default
// kind; the keycaps say y and n, so a trailing '(y/n)' is dropped from the
// words. y answers yes, n or ⏎ answers no (the hub's line
// then shows: "drop of @x cancelled"), esc puts it off: the question leaves
// the window and the hub holds nothing for it (no lock, the agent free for
// any other command); the same command asks again. The bar takes the keys
// while it shows, then gives them back. amb-win mounts it in the thread
// over the composer. Owner: amb-home.
import { useContext, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { formatRoute } from '@/app/route';
import { RouterContext } from '@/app/router';
import { Act, Button, Kbd } from '@/ds';
import { useConfirms, useNotice, useStore, useVersions } from '@/store';
import { appBuild, appSwap, restartTail, tailWords, type AppBuild, type RestartTail } from './restart';
import './inbox.css';

/** The hub's question without its '(y/n)' / '[y/N]': the keycaps say it. Pure. */
export function confirmWords(text: string): string {
  return text.replace(/\s*[([]\s*y\s*\/\s*n\s*[)\]]\s*$/i, '').trim();
}

/**
 * The hub's last plain line to this window for the project (a typed command's result: /flow,
 * /help, a no's 'drop of @x cancelled', /restart's words) as ONE quiet row at the thread's end
 * (designer's desktop-notices page (1)): the thread's notice look, dim, its '·'. ThreadScreen
 * mounts it after the working row (amb-win m_20575). A refused line stays in ConfirmBar.
 */
export function HubNoteRow({ project }: { project: string }) {
  const notice = useNotice(project);
  const tail = useRestartTail(project, notice?.restart === true);
  if (notice === null || notice.level === 'error') return null;
  // the hub is back (its hello): a restart's words are over; only a staged app still shows
  if (notice.back === true && tail?.kind !== 'staged') return null;
  const words = notice.back === true ? '' : notice.text;
  return (
    <div className="th-notice info th-hubnote" role="status" data-level="info" data-testid="confirm.notice" data-app={tail?.kind}>
      <span className="th-notice-mark" aria-label="note">
        ·
      </span>{' '}
      <span>
        {words}
        {tail !== null && (
          <span data-testid="confirm.notice.app">
            {words === '' ? '' : ' · '}
            {tailWords(tail)}
          </span>
        )}
        {tail?.kind === 'staged' && <SwapAct />}
      </span>
    </div>
  );
}

/** The restart row's app part: this app's build against the hub's version, read once per restart line. */
function useRestartTail(project: string, restart: boolean): RestartTail | null {
  const store = useStore();
  const hub = useVersions(project)?.current ?? null;
  const [app, setApp] = useState<AppBuild | null>(null);
  useEffect(() => {
    if (!restart) return;
    let live = true;
    void appBuild().then((b) => {
      if (live) setApp(b);
    });
    // the hub's version: the versions' current, asked when this window never had them
    if (store.versions(project) === null) store.askVersions(project);
    return () => {
      live = false;
    };
  }, [restart, project, store]);
  return restart ? restartTail(app, hub) : null;
}

/** '⏎ restart to update' (the settings update row's words, designer m_22982): the staged build in place of this one, here again (amb-mac's swap). */
function SwapAct() {
  // the screen he is on, read at his click (the swapped app reopens it)
  const router = useContext(RouterContext);
  const [why, setWhy] = useState<string | null>(null);
  const swap = () => {
    const at = router?.get();
    void appSwap(at === undefined ? undefined : formatRoute(at)).then(setWhy);
  };
  return (
    <>
      {' '}
      <Act onClick={swap} testId="confirm.notice.swap">
        <Kbd>⏎</Kbd> restart to update
      </Act>
      {why !== null && <span className="th-hubnote-why"> · {why}</span>}
    </>
  );
}

/** `plain`: the screen has no thread (so no HubNoteRow): the hub's plain lines show here too. */
export function ConfirmBar({ project, plain = false }: { project: string; plain?: boolean }) {
  const store = useStore();
  const asks = useConfirms(project);
  const notice = useNotice(project);
  const q = asks[0];
  const bar = useRef<HTMLDivElement>(null);
  const before = useRef<Element | null>(null);

  // a question takes the keys; once answered they go back where they were
  useEffect(() => {
    if (q === undefined) return;
    before.current = document.activeElement;
    bar.current?.focus();
    return () => {
      if (before.current instanceof HTMLElement) before.current.focus();
    };
  }, [q]);

  if (q === undefined) {
    if (notice === null) return null;
    // a refused line (his words to fix) stays under the screen; on a thread the hub's plain lines
    // are a quiet row in it (HubNoteRow: nothing under the composer but its keys), on a screen
    // with no thread (agents, review…) they stay here, dim, or he'd never see a no's answer
    if (notice.level === 'error') {
      return (
        <div className="confirm-bar error" role="alert" data-testid="confirm.notice" data-level="error">
          {notice.text}
        </div>
      );
    }
    return plain ? (
      <div className="confirm-bar note" role="status" data-testid="confirm.notice" data-level={notice.level}>
        {notice.text}
      </div>
    ) : null;
  }
  const yes = () => {
    store.confirm(project, q.id, true);
  };
  const no = () => {
    store.confirm(project, q.id, false);
  };
  const later = () => {
    store.putOff(project, q.id);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const act = { y: yes, n: no, Enter: no, Escape: later }[e.key];
    if (act === undefined) return;
    e.preventDefault();
    e.stopPropagation();
    act();
  };
  return (
    <div className="confirm-bar" role="alertdialog" aria-label={confirmWords(q.text)} tabIndex={-1} ref={bar} onKeyDown={onKeyDown} data-testid="confirm.bar">
      <span className="q">{confirmWords(q.text)}</span>
      {/* raw-controls (designer m_18343): the ds's Button and Act, never a bare button; no is the
          default (the TUI's [y/N], designer m_18733): the filled one, and ⏎ */}
      <Button size="sm" onClick={yes} testId="confirm.yes">
        <Kbd>y</Kbd> yes
      </Button>
      <Button kind="pri" size="sm" onClick={no} testId="confirm.no">
        <Kbd>n</Kbd> no
      </Button>
      <Act onClick={later} testId="confirm.later">
        <Kbd>esc</Kbd> later
      </Act>
    </div>
  );
}
