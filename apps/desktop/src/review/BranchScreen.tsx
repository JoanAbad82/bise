// A branch's diff by its name (bar C15/W20/V6, the TUI's '/diff sb/x'; route branch/<p>/<branch>).
// An agent's branch (its worktree's) is that agent's review; a branch no agent works on can't be
// diffed yet: the hub's typed diff takes {project, agent, commit?}, no branch (a gap for amb-feed),
// so the screen says so in place, with the changes screen's link. Owner: amb-win.
import { useEffect } from 'react';
import { Empty, Head } from '@/ds';
import { useStore, useWorktrees } from '@/store';
import { useRouter } from '@/app/router';
import { ReviewScreen } from './ReviewScreen';
import './review.css';

/** The agent whose worktree is on that branch, if any. Pure. */
export function agentOfBranch(items: readonly { branch: string; agent?: string | null }[], branch: string): string | undefined {
  return items.find((w) => w.branch === branch && w.agent != null && w.agent !== '')?.agent ?? undefined;
}

export function BranchScreen({ project, branch }: { project: string; branch: string }) {
  const store = useStore();
  const router = useRouter();
  const items = useWorktrees(project);
  // the list fresh: who works on which branch
  useEffect(() => {
    store.command({ cmd: 'worktrees', project });
  }, [store, project]);
  const agent = agentOfBranch(items, branch);
  if (agent !== undefined) return <ReviewScreen project={project} agent={agent} />;
  return (
    <section className="rv-screen" data-testid="branch.screen" data-project={project} data-branch={branch}>
      <Head title={branch} sub="a branch" />
      <div className="rv-body">
        <Empty title="no agent works on this branch">
          <span data-testid="branch.none">
            its diff needs an agent on it for now.{' '}
            <button type="button" className="rv-link" onClick={() => { router.go({ screen: 'changes', project }); }} data-testid="branch.changes">
              see the changes
            </button>
          </span>
        </Empty>
      </div>
    </section>
  );
}
