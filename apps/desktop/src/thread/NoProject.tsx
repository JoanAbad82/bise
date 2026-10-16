// bise's own thread before he has any project (designer's desktop-screens v6/v7 'no project yet',
// m_12093): bise's ':*' written in mist (bise-presence v10, the 5's matter; in the accent when
// something waits on him), 'bise is here.', what a project gives, 'add a project ⌘N', and from the
// first-run text only its demo, as a quiet button. The composer stays under it: bise answers
// without a project too. Owner: amb-win.
import { Button, Pearl, Press } from '@/ds';
import { thread } from '@/proto/words.gen';
import { useProjects } from '@/store';
import { composer } from '../proto/words.gen';
import { useRouter } from '@/app/router';

export function NoProject({ onDemo }: { onDemo: (text: string) => void }) {
  const router = useRouter();
  const waits = useProjects().some((p) => p.waits > 0);
  return (
    <div className="th-noproj" data-testid="thread.noproject">
      <span className="th-noproj-pearl">
        <Pearl size={120} mood={waits ? 'need' : 'rest'} glyph />
      </span>
      <p className="th-noproj-t">{thread.noproj_title}</p>
      <p className="th-noproj-s">{thread.noproj_says}</p>
      <div className="th-noproj-acts">
        <Button kind="pri" onClick={() => { router.go({ screen: 'settings', page: 'projects' }); }} testId="thread.noproject.add">
          {thread.noproj_add} <kbd>⌘N</kbd>
        </Button>
        <Press
          look="th-noproj-demo"
          // keep the composer's focus and selection: the click must not blur it first
          onMouseDown={(e) => { e.preventDefault(); }}
          onClick={() => { onDemo(composer.demo); }}
          data-testid="thread.noproject.demo"
        >
          {composer.demo}
        </Press>
      </div>
    </div>
  );
}
