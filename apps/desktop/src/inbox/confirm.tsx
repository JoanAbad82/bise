// The hub's yes/no question in the window (bar I9/C46/S30): archive a
// working agent, and the hub asks "archive it anyway? (y/n)" of this window
// only (bise-proto `confirm`). y answers yes, n answers no (the hub's line
// then shows: "drop of @x cancelled"), esc puts it off: the question leaves
// the window and the hub holds nothing for it (no lock, the agent free for
// any other command); the same command asks again. The bar takes the keys
// while it shows, then gives them back. amb-win mounts it in the thread
// over the composer. Owner: amb-home.
import { useEffect, useRef, type KeyboardEvent } from 'react';
import { Kbd } from '@/ds';
import { useConfirms, useNotice, useStore } from '@/store';
import './inbox.css';

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
      <div className="confirm-bar note" role="status" data-testid="confirm.notice">
        {notice}
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
    const act = { y: yes, n: no, Escape: later }[e.key];
    if (act === undefined) return;
    e.preventDefault();
    e.stopPropagation();
    act();
  };
  return (
    <div className="confirm-bar" role="alertdialog" aria-label={q.text} tabIndex={-1} ref={bar} onKeyDown={onKeyDown} data-testid="confirm.bar">
      <span className="q">{q.text}</span>
      <button type="button" onClick={yes} data-testid="confirm.yes">
        <Kbd>y</Kbd> yes
      </button>
      <button type="button" onClick={no} data-testid="confirm.no">
        <Kbd>n</Kbd> no
      </button>
      <button type="button" onClick={later} data-testid="confirm.later">
        <Kbd>esc</Kbd> later
      </button>
    </div>
  );
}
