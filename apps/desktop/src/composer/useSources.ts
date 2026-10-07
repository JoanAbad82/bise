// The composer's lists from the store, for the screen that mounts it (amb-win's thread): the
// project's live agents for `@` and for an agent argument, its archived ones, its open cards by
// number. Files, skills and commands come from the core once amb-core's step 4 generates their
// events (until then their lists are empty: the pickers show nothing, never a guess).
import { useMemo } from 'react';
import { useAgents, useArtifacts, useCards, useStore } from '@/store';
import { prefixFirst } from './tokens';
import { NO_SOURCES, type Choice, type ComposerSources, type DictatePort } from './sources';

// K4 (the TUI's attach.rs): `inView` is the agent the composer sends to; its row says its model
// and whether that model reads images (`vision`, from bise's model catalog). Images are refused
// only when the catalog says no (`vision === false`): an unknown model is never refused on a guess.
export function useComposerSources(project: string, extra: Partial<ComposerSources> = {}, inView?: string): ComposerSources {
  const agents = useAgents(project);
  const cards = useCards(project);
  const made = useArtifacts(project);
  const store = useStore();
  // the mic through the store (bar I): only this window gets its words, a reload cancels
  const dictate = useMemo<DictatePort>(
    () => ({
      start: () => store.dictateStart(),
      stop: (id) => {
        store.dictateStop(id);
      },
      cancel: (id) => {
        store.dictateCancel(id);
      },
      read: (id) => store.dictation(id),
      subscribe: (id, fn) => store.subscribe(`dictation:${id}`, fn),
      // his voice level from the core's level {who: 'you'} (amb-core 99b3ddd9), for the meter
      level: (fn) => {
        fn(store.level('you'));
        return store.subscribe('level:you', () => {
          fn(store.level('you'));
        });
      },
    }),
    [store],
  );
  const { files, skills, commands, saveImage, voice } = extra;
  return useMemo<ComposerSources>(() => {
    const live = agents.filter((a) => !a.archived);
    const target = inView === undefined ? undefined : agents.find((a) => a.name === inView);
    const noVision = target?.vision === false ? (target.model ?? target.name) : undefined;
    const lists = {
      // an agent argument (/archive, /rename, /stop…) never offers main (the TUI's agent_choices)
      agent: live.filter((a) => !a.main).map((a): Choice => ({ value: a.name, desc: a.title })),
      archived: agents.filter((a) => a.archived).map((a): Choice => ({ value: a.name, desc: a.title })),
      card: cards.map((c): Choice => ({ value: String(c.id), desc: `${c.agent}: ${c.question}` })),
    };
    return {
      // `@` lists the others: not the agent he writes to (the TUI's filter_mentions)
      agents: live.filter((a) => a.name !== inView).map((a) => ({ name: a.name, desc: a.title })),
      artifacts: made.map((a) => ({ id: a.id, title: a.title, kind: a.kind, agent: a.agent, url: a.url, atMs: a.at_ms })),
      skills: skills ?? NO_SOURCES.skills,
      commands: commands ?? NO_SOURCES.commands,
      files: files ?? NO_SOURCES.files,
      saveImage: saveImage ?? NO_SOURCES.saveImage,
      ...(noVision === undefined ? {} : { noVision }),
      dictate,
      ...(voice === undefined ? {} : { voice }),
      choices: (kind, query) => (kind === 'agent' || kind === 'archived' || kind === 'card' ? prefixFirst(lists[kind], query, (c) => c.value) : []),
    };
  }, [agents, cards, made, files, skills, commands, saveImage, inView, dictate, voice]);
}
