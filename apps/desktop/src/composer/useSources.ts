// The composer's lists from the store, for the screen that mounts it (amb-win's thread): the
// project's live agents for `@` and for an agent argument, its archived ones, its open cards by
// number. Files, skills and commands come from the core once amb-core's step 4 generates their
// events (until then their lists are empty: the pickers show nothing, never a guess).
import { useMemo } from 'react';
import { useAgents, useArtifacts, useCards } from '@/store';
import { prefixFirst } from './tokens';
import { NO_SOURCES, type Choice, type ComposerSources } from './sources';

export function useComposerSources(project: string, extra: Partial<ComposerSources> = {}): ComposerSources {
  const agents = useAgents(project);
  const cards = useCards(project);
  const made = useArtifacts(project);
  const { files, skills, commands, saveImage } = extra;
  return useMemo<ComposerSources>(() => {
    const live = agents.filter((a) => !a.archived);
    const lists = {
      agent: live.map((a): Choice => ({ value: a.name, desc: a.title })),
      archived: agents.filter((a) => a.archived).map((a): Choice => ({ value: a.name, desc: a.title })),
      card: cards.map((c): Choice => ({ value: String(c.id), desc: `${c.agent}: ${c.question}` })),
    };
    return {
      agents: live.map((a) => ({ name: a.name, desc: a.title })),
      artifacts: made.map((a) => ({ id: a.id, title: a.title, kind: a.kind, agent: a.agent, url: a.url, atMs: a.at_ms })),
      skills: skills ?? NO_SOURCES.skills,
      commands: commands ?? NO_SOURCES.commands,
      files: files ?? NO_SOURCES.files,
      saveImage: saveImage ?? NO_SOURCES.saveImage,
      choices: (kind, query) => (kind === 'agent' || kind === 'archived' || kind === 'card' ? prefixFirst(lists[kind], query, (c) => c.value) : []),
    };
  }, [agents, cards, made, files, skills, commands, saveImage]);
}
