// A project's changes (bar A.6): its branches (the agents' worktrees and
// his others) and what reached main today. Owner: amb-win. Each agent's
// branch opens its review; a merged commit opens read-only.
import { useEffect } from 'react';
import { Act, Empty, PageHero, Row, SectionHead } from '@/ds';
import { hero } from '@/proto/words_hero.gen';
import { useFeatures, useMerged, usePrs, useStore, useWorktrees } from '@/store';
import { distance, stateWords } from './feature';
import { useRouter } from '@/app/router';
import { MAIN } from '@/app/route';
import { clock } from '@/thread/entry';
import { branchEnd, branchesOf } from './model';
import './review.css';
import { useKeptScroll } from '@/app/keep';

export function ChangesScreen({ project }: { project: string }) {
  // where he was in the list comes back after a reload (keep.ts)
  useKeptScroll(`changes:${project}`, () => document.querySelector<HTMLElement>('[data-testid="changes.screen"] .rv-body'));
  const store = useStore();
  const router = useRouter();
  const worktrees = useWorktrees(project);
  const merged = useMerged(project);
  const features = useFeatures(project);
  const prs = usePrs(project);

  // fresh lists on open (the old window's f8e8330a)
  useEffect(() => {
    store.command({ cmd: 'worktrees', project });
    store.command({ cmd: 'merged', project });
    store.command({ cmd: 'features', project });
    store.command({ cmd: 'prs', project });
  }, [store, project]);

  const branches = branchesOf(worktrees);
  return (
    <section className="rv-screen" data-testid="changes.screen" data-project={project}>
      <div className="rv-body">
        {/* the page hero, every full page's first block (ui-review-app #2): it scrolls with the list */}
        <PageHero name="changes" sentence={hero.changes_say} facts={`${branches.length} branches · ${merged.length} merged today`} testId="changes.hero" />
        <Row
          // its open PRs (bar A.7, the TUI's /prs): the count, the list one click away
          name="pull requests"
          end={prs === null ? '…' : prs.items.length === 0 ? 'none open' : prs.head}
          onClick={() => {
            router.go({ screen: 'prs', project });
          }}
          testId="changes.prs"
        />
        {features.length > 0 && <SectionHead>features</SectionHead>}
        {features.map((f) => (
          <Row
            key={f.name}
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
            // the sha is the machine's text (mono), the rest words (designer m_21379 (4))
            end={
              <>
                <span className="rv-mono">{m.sha.slice(0, 7)}</span>
                {[m.by ?? '', clock(m.at_ms)]
                  .filter(Boolean)
                  .map((w) => ` · ${w}`)
                  .join('')}
              </>
            }
            onClick={() => {
              router.go({ screen: 'commit', project, sha: m.sha });
            }}
            testId={`changes.merged.${m.sha.slice(0, 7)}`}
          />
        ))}
        <p className="rv-foot">
          <Act
            onClick={() => {
              router.go({ screen: 'thread', project, agent: MAIN });
            }}
            testId="changes.thread"
          >
            back to its thread
          </Act>
        </p>
      </div>
    </section>
  );
}
