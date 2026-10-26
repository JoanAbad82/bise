// The empty thread's line (designer's v6 (5), the working page): '· checkout is starting · its own
// folder, sb/checkout', the '·' pulsing. The thread's head is the window's bar since bise fait mac
// (nm-frame's title and subtitle, the '…' menu in the bar): the agent head that sat here went.
// Owner: nm-thread.
import type { Agent } from '@/proto';
import { thread } from '@/proto/words.gen';
import { Pulse } from '@/working/Signs';

/** The empty thread (v6 (5), the working page): '· checkout is starting · its own folder, sb/checkout', the '·' pulsing. */
export function StartingLine({ a }: { a: Agent }) {
  const where = a.branch != null && a.branch !== '' ? thread.own_folder({ branch: a.branch }) : thread.project_folder;
  return (
    <div className="th-live th-starting" role="status" data-testid="thread.starting">
      <Pulse kind="starting" />
      <span className="th-live-words">
        <b className="th-live-name">{a.name}</b> {thread.is_starting}
        <span className="th-live-dot"> · </span>
        <span className="th-live-act">{where}</span>
      </span>
    </div>
  );
}
