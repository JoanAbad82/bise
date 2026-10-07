// bise's own thread before he has any project (designer's desktop-screens v6/v7 'no project yet',
// m_12093): its pearl, 'bise is here.', what a project gives, 'add a project ⌘N', and from the
// first-run text only its demo, as a quiet button. The composer stays under it: bise answers
// without a project too. Owner: amb-win.
import { Button } from '@/ds';
import { BisePearl } from '@/app/BisePearl';
import { DEMO } from '@/setup';
import { useRouter } from '@/app/router';

export function NoProject({ onDemo }: { onDemo: (text: string) => void }) {
  const router = useRouter();
  return (
    <div className="th-noproj" data-testid="thread.noproject">
      <span className="th-noproj-pearl">
        <BisePearl size={40} />
      </span>
      <p className="th-noproj-t">bise is here.</p>
      <p className="th-noproj-s">add a project to give it its own bise. bise will route what you ask to it.</p>
      <div className="th-noproj-acts">
        <Button kind="pri" onClick={() => { router.go({ screen: 'settings', page: 'projects' }); }} testId="thread.noproject.add">
          add a project <kbd>⌘N</kbd>
        </Button>
        <button
          type="button"
          className="th-noproj-demo"
          // keep the composer's focus and selection: the click must not blur it first
          onMouseDown={(e) => { e.preventDefault(); }}
          onClick={() => { onDemo(DEMO); }}
          data-testid="thread.noproject.demo"
        >
          {DEMO}
        </button>
      </div>
    </div>
  );
}
