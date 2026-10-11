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
import { useEffect, useRef, type KeyboardEvent } from 'react';
import { Act, Button, Kbd } from '@/ds';
import { useConfirms, useNotice, useStore } from '@/store';
import './inbox.css';

/** The hub's question without its '(y/n)' / '[y/N]': the keycaps say it. Pure. */
export function confirmWords(text: string): string {
  return text.replace(/\s*[([]\s*y\s*\/\s*n\s*[)\]]\s*$/i, '').trim();
}

export function ConfirmBar({ project }: { project: string }) {
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
    return notice === null ? null : (
      <div className={`confirm-bar ${notice.level}`} role={notice.level === 'error' ? 'alert' : 'status'} data-testid="confirm.notice" data-level={notice.level}>
        {notice.text}
      </div>
    );
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
