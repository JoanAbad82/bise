// The review (bar A.6): an agent's change, or one commit already on main,
// file by file. Owner: amb-win. The old window's S7 rules, kept: a merged
// change or a commit from 'merged today' is read-only ('merged · e0f3df5
// · 14:05', no merge, no ask for changes); a merge happens only by his
// click on the agent's open merge card (the hub's one /answer path).
import { useEffect } from 'react';
import { Button, Diff, Empty, Head, Skel } from '@/ds';
import { useCards, useDiff, useMerged, useStore } from '@/store';
import { clock } from '@/thread/entry';
import { useRouter } from '@/app/router';
import { MAIN } from '@/app/route';
import { fileHead, headLine, linesOf, mergeCardOf, mergedSha, totals } from './model';
import './review.css';

export function ReviewScreen({ project, agent, commit }: { project: string; agent: string; commit?: string }) {
  const store = useStore();
  const router = useRouter();
  const diff = useDiff(project, agent, commit);
  const merged = useMerged(project);
  const cards = useCards(project);

  // the diff once on open (the hub answers `diff`), the merged list fresh
  useEffect(() => {
    store.command(commit === undefined ? { cmd: 'diff', project, agent } : { cmd: 'diff', project, agent, commit });
    store.command({ cmd: 'merged', project });
  }, [store, project, agent, commit]);

  const done = mergedSha(diff, commit) !== undefined;
  const card = done ? undefined : mergeCardOf(cards, agent);
  const title = commit === undefined ? agent : `commit ${commit.slice(0, 7)}`;
  const line = headLine(diff, { commit, merged, clock });

  return (
    <section className="rv-screen" data-testid="review.screen" data-project={project} data-agent={agent}>
      <Head
        title={title}
        sub={[line, diff && diff.files.length > 0 ? totals(diff) : ''].filter(Boolean).join(' · ')}
        dot={done ? 'ok' : undefined}
        end={
          <>
            {card !== undefined && (
              <Button
                kind="pri"
                onClick={() => {
                  store.answer(project, card.id, '1');
                }}
                testId="review.merge"
              >
                merge into main
              </Button>
            )}
            <Button
              kind="ghost"
              onClick={() => {
                router.go({ screen: 'thread', project, agent: commit === undefined ? agent : MAIN });
              }}
              testId="review.thread"
            >
              thread
            </Button>
          </>
        }
      />
      <div className="rv-body" data-testid="review.files">
        {diff === null ? (
          <Skel />
        ) : diff.files.length === 0 ? (
          <Empty title="no changes to show">{diff.note ?? 'nothing differs from its base'}</Empty>
        ) : (
          diff.files.map((f, i) => (
            <div key={f.path} className="rv-file">
              {f.note != null && f.note !== '' && <p className="rv-note">{f.note}</p>}
              <Diff file={fileHead(f)} add={f.add} rm={f.del} lines={linesOf(f)} testId={`review.file.${i}`} />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
