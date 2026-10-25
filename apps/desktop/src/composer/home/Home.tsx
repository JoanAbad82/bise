// src/composer/home · the empty home (bise fait mac, mockup 5; designer's pick (c), native-lead
// m_42546): over main's thread before his first words, the bise mark, the question in bise's
// voice ('what should we build in acme?' on a project's main, its project a picker that goes to
// the picked project's main; 'what should we work on?' on bise's own), a line of what goes on
// (who works, what waits) and the ideas: a click fills the composer, never a send. On a project's
// main it sits on the welcome (its office is the picture under it); on bise's it replaces the
// first run, whose 'show me what you can do' stays an idea; with no project yet the no-project
// centre stays (thread/NoProject.tsx). HomeSlot is the one line ThreadScreen mounts. Owner:
// nm-composer.
import { useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { BiseMark, PickerPop, Press, tipAttrs } from '@/ds';
import type { ComposerActions } from '@/composer';
import { useProjects, useStore } from '@/store';
import { useRouter } from '@/app/router';
import { MAIN } from '@/app/route';
import { composer } from '@/proto/words_composer.gen';
import { FirstRunSlot } from '@/thread/ThreadRows';
import { IDEAS, WelcomeSlot } from '@/welcome/Welcome';
import { homeFacts, homeShows } from './rule';
import './home.css';

/** a hole no project name holds: the question's words around its picker */
const HOLE = '\u0000';

/** Whether main's thread shows the home now (rule.ts), from the store: a boolean, so a new entry
 *  re-renders its readers (the memoised composer) only when the answer changes. */
export function useHomeShows(tkey: string, agent: string): boolean {
  const store = useStore();
  return useSyncExternalStore(
    (cb) => {
      const a = store.subscribe(`order:${tkey}`, cb);
      const b = store.subscribe(`pending:${tkey}`, cb);
      return () => {
        a();
        b();
      };
    },
    () => {
      if (agent !== MAIN) return false;
      const view = store.threadOrder(tkey);
      const hasYou = view.order.some((pos) => store.entry(tkey, pos)?.kind === 'you');
      return homeShows(view, hasYou, store.pending(tkey).length);
    },
  );
}

/** Main's empty thread: the home (on the welcome, on a project's main), else what was there. */
export function HomeSlot({ tkey, project, composer: field, bise }: { tkey: string; project: string; composer: RefObject<ComposerActions | null>; bise: boolean }) {
  const rows = useProjects();
  const shows = useHomeShows(tkey, MAIN);
  // bise's own thread before any project: designer's 'no project yet' centre stays (m_12125)
  const noProject = bise && rows.length > 0 && !rows.some((p) => !p.home);
  const fill = (text: string) => {
    field.current?.fill(text);
  };
  if (bise) {
    if (noProject) return <FirstRunSlot tkey={tkey} project={project} composer={field} bise />;
    return shows ? (
      <div className="th-first th-home" data-testid="thread.first">
        <Home project={null} onIdea={fill} />
      </div>
    ) : null;
  }
  return <WelcomeSlot tkey={tkey} project={project} head={shows ? <Home project={project} onIdea={fill} /> : undefined} />;
}

/** The home itself: the mark, the question, its line, the ideas. `project` null: bise's own main. */
export function Home({ project, onIdea }: { project: string | null; onIdea: (text: string) => void }) {
  const rows = useProjects();
  const facts = homeFacts(rows, project);
  const line =
    facts.working === 0 && facts.waits === 0
      ? composer.home_quiet
      : [facts.working > 0 ? composer.home_working({ n: facts.working }) : '', facts.waits > 0 ? composer.home_waits({ n: facts.waits }) : ''].filter((x) => x !== '').join(' · ');
  return (
    <div className="cmp-home" data-testid="composer.home">
      <BiseMark size={32} wink={false} testId="composer.home.mark" />
      <h1 className="cmp-home-q" data-testid="composer.home.question">
        {project === null ? composer.home_question_bise : <Question project={project} />}
      </h1>
      <p className="cmp-home-line" data-testid="composer.home.line">{line}</p>
      <div className="cmp-home-ideas" role="group" aria-label={composer.home_ideas}>
        {IDEAS.map((idea, i) => (
          <Press
            key={idea}
            look="cmp-home-idea"
            // keep the composer's focus and selection: the click must not blur it first
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onClick={() => {
              onIdea(idea);
            }}
            data-testid={`composer.home.idea.${String(i)}`}
          >
            {idea}
          </Press>
        ))}
      </div>
    </div>
  );
}

/** 'what should we build in acme?': the project underlined, a picker that goes to the picked project's main. */
function Question({ project }: { project: string }) {
  const rows = useProjects();
  const router = useRouter();
  const name = rows.find((p) => p.project === project)?.name ?? project;
  const [before = '', after = ''] = composer.home_question({ project: HOLE }).split(HOLE);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const picks = rows.filter((p) => !p.home);
  return (
    <>
      {before}
      <Press ref={trigger} look="cmp-home-proj" aria-haspopup="menu" aria-expanded={open} {...tipAttrs(composer.home_pick({ project: name }))}
        data-testid="composer.home.project"
        onClick={() => {
          setOpen((o) => !o);
        }}>
        {name}
      </Press>
      {after}
      {open && (
        <PickerPop
          anchor={trigger}
          side="below"
          align="start"
          groups={[{ id: 'projects', rows: picks.map((p) => ({ id: p.project, name: p.name, current: p.project === project, testId: `composer.home.project.pick.${p.project}` })) }]}
          onPick={(id) => {
            setOpen(false);
            if (id !== project) router.go({ screen: 'thread', project: id, agent: MAIN });
          }}
          onClose={() => {
            setOpen(false);
          }}
          testId="composer.home.project.menu"
        />
      )}
    </>
  );
}
