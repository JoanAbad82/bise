// A project's changes (bar A.6): its branches (the agents' worktrees and
// his others) and what reached main today. Owner: amb-win. Each agent's
// branch opens its review; a merged commit opens read-only.
import { useEffect } from 'react';
import { Empty, Head, Row, SectionHead } from '@/ds';
import { useFeatures, useMerged, useStore, useWorktrees } from '@/store';
import { distance, stateWords } from './feature';
import { useRouter } from '@/app/router';
import { MAIN } from '@/app/route';
import { clock } from '@/thread/entry';
import { branchEnd, branchesOf } from './model';
import './review.css';

export function ChangesScreen({ project }: { project: string }) {
  const store = useStore();
  const router = useRouter();
  const worktrees = useWorktrees(project);
  const merged = useMerged(project);
  const features = useFeatures(project);

  // fresh lists on open (the old window's f8e8330a)
  useEffect(() => {
    store.command({ cmd: 'worktrees', project });
    store.command({ cmd: 'merged', project });
    store.command({ cmd: 'features', project });
  }, [store, project]);

  const branches = branchesOf(worktrees);
  return (
    <section className="rv-screen" data-testid="changes.screen" data-project={project}>
      <Head title="changes" sub={`${branches.length} branches · ${merged.length} merged today`} />
      <div className="rv-body">
        {features.length > 0 && <SectionHead>features</SectionHead>}
        {features.map((f) => (
          <Row
            key={f.name}
            kind="ag"
            // a feature: its branch, its agents' work merged into it, tried and merged as one
            name={`ψ ${f.name}`}
            end={`${stateWords(f)} · ${distance(f)}`}
            onClick={() => {
              router.go({ screen: 'feature', project, name: f.name });
            }}
            testId={`changes.feature.${f.name}`}
          />
        ))}
        <SectionHead>branches</SectionHead>
        {branches.length === 0 && <Empty title="no branches">its agents work in the shared folder</Empty>}
        {branches.map((w) => {
          const agent = w.agent;
          return (
            <Row
              key={w.path}
              kind="ag"
              // the branch as the TUI names it ('sb/checkout'), whose worktree it is at the end
              name={w.branch === '' ? 'detached' : w.branch}
              end={`${agent ?? 'yours'} · ${branchEnd(w)}`}
              onClick={
                agent == null
                  ? undefined
                  : () => {
                      router.go({ screen: 'review', project, agent });
                    }
              }
              testId={`changes.branch.${agent ?? 'his'}`}
            />
          );
        })}
        <SectionHead>merged today</SectionHead>
        {merged.length === 0 && <Empty title="nothing merged today" />}
        {merged.map((m) => (
          <Row
            key={m.sha}
            name={m.title}
            end={[m.sha.slice(0, 7), m.by ?? '', clock(m.at_ms)].filter(Boolean).join(' · ')}
            onClick={() => {
              router.go({ screen: 'commit', project, sha: m.sha });
            }}
            testId={`changes.merged.${m.sha.slice(0, 7)}`}
          />
        ))}
        <p className="rv-foot">
          <a
            href="#main"
            onClick={(e) => {
              e.preventDefault();
              router.go({ screen: 'thread', project, agent: MAIN });
            }}
            data-testid="changes.thread"
          >
            back to its thread
          </a>
        </p>
      </div>
    </section>
  );
}
