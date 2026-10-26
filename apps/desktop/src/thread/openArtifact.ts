// An artifact from the thread: the one open beside it (designer's artifact-open page: its row in the
// maker's thread is marked 'open' with an ink outline, never pink; ThreadScreen provides it when the
// window shows an artifact, a thread without one gives undefined), and how a chip opens one (bise
// fait mac, nm-panel m_42788): in the panel's tab (openTab), a browser-only one (a PR, a link) in
// his browser as before (artifacts/leave.ts), never the artifacts/<p>/<id> route any more.
// Owner: nm-thread.
import { createContext, useCallback, useContext } from 'react';
import { useStore } from '@/store';
import { openTab } from '@/app/panel/tabs';
import { leaves, useGoArtifact, type Leaving } from '@/artifacts/leave';

export const OpenArtifactContext = createContext<string | undefined>(undefined);

/** The id of the artifact open beside this thread, if any. */
export function useOpenArtifact(): string | undefined {
  return useContext(OpenArtifactContext);
}

/** Opens an artifact of `project` from the thread: its tab in the panel, or his browser for one that leaves. */
export function useArtifactOpener(): (project: string, id: string, known?: Leaving) => void {
  const store = useStore();
  const leave = useGoArtifact();
  return useCallback(
    (project, id, known) => {
      const a = store.artifacts(project).find((x) => x.id === id) ?? known;
      if (a !== undefined && leaves(a)) leave(project, id, known);
      else openTab({ kind: 'artifact', project, id });
    },
    [store, leave],
  );
}
