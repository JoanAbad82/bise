// React's side of the store: one hook per slice, on useSyncExternalStore with
// the slice's own key, so a component re-renders only when what it reads
// changed (a new entry never re-renders the other rows or the composer).
// The store comes from StoreContext: the app's one store (bound to
// window.bise.core) by default, a test's own store through the provider.
import { createContext, createElement, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import type { Account, Agent, PickCommand, PickSkill, RoleRow, Artifact, Card, DevServer, Entry, Feature, Found, Model, Job, JsonValue, Merged, Plugin, ProjectRow, Worktree } from '@/proto';
import type { CorePort, CoreState } from '@/shared/api';
import { diffKey, Store, type Away, type Confirm, type Dictation, type HubLine, type Diff, type FilesAnswer, type Ev, type EvOf, type Pending, type PrsList, type ThreadOrder } from './store';

/**
 * Feeds a store from a core port: its live events, then the state events
 * main kept from before this window loaded (asked after the listener is on:
 * IPC keeps order, so the snapshot is never older than a live event already
 * applied), and the core's state. Returns the unsubscribe.
 */
export function connect(store: Store, port: CorePort): () => void {
  const offEv = port.onEvent((ev) => {
    store.apply(ev);
  });
  const offState = port.onState((s) => {
    store.setCore(s);
  });
  void port.snapshot?.().then((evs) => {
    for (const ev of evs) store.apply(ev);
  });
  void port.state().then((s) => {
    store.setCore(s);
  });
  return () => {
    offEv();
    offState();
  };
}

let appStore: Store | null = null;

/** The app's one store, bound to window.bise.core when there is one (none in a unit test). */
export function getAppStore(): Store {
  if (appStore === null) {
    const port = (globalThis as { bise?: { core?: CorePort } }).bise?.core ?? null;
    appStore = new Store(port);
    if (port !== null) connect(appStore, port);
  }
  return appStore;
}

const StoreContext = createContext<Store | null>(null);

/** A store for the tree below (tests, fixture replay); without it the app's store is used. */
export function StoreProvider(props: { store: Store; children?: ReactNode }): ReactNode {
  return createElement(StoreContext.Provider, { value: props.store }, props.children);
}

export function useStore(): Store {
  return useContext(StoreContext) ?? getAppStore();
}

function useSlice<T>(key: string, read: (s: Store) => T): T {
  const store = useStore();
  return useSyncExternalStore(
    (cb) => store.subscribe(key, cb),
    () => read(store),
  );
}

export const useProjects = (): readonly ProjectRow[] => useSlice('projects', (s) => s.projects());
export const useAgents = (project: string): readonly Agent[] => useSlice(`agents:${project}`, (s) => s.agents(project));
export const useCards = (project: string): readonly Card[] => useSlice(`cards:${project}`, (s) => s.cards(project));
export const useVoiceAnswer = (): EvOf<'voice_answer'> | null => useSlice('voice_answer', (s) => s.voiceAnswer());
export const useConfirms = (project: string): readonly Confirm[] => useSlice(`confirms:${project}`, (s) => s.confirms(project));
export const useNotice = (project: string): HubLine | null => useSlice(`notice:${project}`, (s) => s.notice(project));
/** bar V8/W21: the approvals mode, checker and rules of a project's hub; null until it said. */
export const useApprovals = (project: string): EvOf<'approvals'> | null => useSlice(`approvals:${project}`, (s) => s.approvals(project));
export const usePrefs = (): JsonValue | null => useSlice('prefs', (s) => s.prefs());
export const useAccounts = (): readonly Account[] => useSlice('accounts', (s) => s.accounts());
export const useFound = (): readonly Found[] => useSlice('found', (s) => s.found());
export const useComputerUse = (): EvOf<'computer_use'> | null => useSlice('computer_use', (s) => s.computerUse());
export const usePlugins = (project?: string): readonly Plugin[] | null => useSlice(`plugins:${project ?? ''}`, (s) => s.plugins(project));
export const useArtifacts = (project: string): readonly Artifact[] => useSlice(`artifacts:${project}`, (s) => s.artifacts(project));
export const useWorktrees = (project: string): readonly Worktree[] => useSlice(`worktrees:${project}`, (s) => s.worktrees(project));
export const useDevServers = (project: string): readonly DevServer[] => useSlice(`dev_servers:${project}`, (s) => s.devServers(project));
export const useMerged = (project: string): readonly Merged[] => useSlice(`merged:${project}`, (s) => s.merged(project));
export const usePrs = (project: string): PrsList | null => useSlice(`prs:${project}`, (s) => s.prs(project));
export const useModels = (project: string): readonly Model[] => useSlice(`models:${project}`, (s) => s.models(project));
export const useFeatures = (project: string): readonly Feature[] => useSlice(`features:${project}`, (s) => s.features(project));
export const useJobs = (project: string): readonly Job[] => useSlice(`jobs:${project}`, (s) => s.jobs(project));
export const useDiff = (project: string, agent: string, commit?: string): Diff | null =>
  useSlice(diffKey(project, agent, commit), (s) => s.diff(project, agent, commit));
export const useAway = (): Away | null => useSlice('away', (s) => s.away());
/** Each role's model and effort (V17), at the core's start, after each role_set, at setup_check. */
export const useRoles = (): readonly RoleRow[] => useSlice('roles', (s) => s.roles());
/** The `/` commands (the TUI's list; asked from the core on first use). */
export function useCommands(): readonly PickCommand[] {
  const store = useStore();
  useEffect(() => {
    store.askCommands();
  }, [store]);
  return useSlice('commands', (s) => s.commands());
}
/** A workspace's `$` skills (the TUI's list; read again each time a screen mounts it). */
export function useSkills(project: string): readonly PickSkill[] {
  const store = useStore();
  useEffect(() => {
    if (project !== '') store.askSkills(project);
  }, [store, project]);
  return useSlice(`skills:${project}`, (s) => s.skills(project));
}
/** The newest `@` answer of a project (store.files asks; a partial answer is followed by the full one). */
export const useFiles = (project: string): FilesAnswer | null => useSlice(`files:${project}`, (s) => s.filesNow(project));
/** A voice's loudness now, 0..1 ('you': the mic during a talk or a dictation; 'main': its spoken answer). */
export const useLevel = (who: 'you' | 'main'): number => useSlice(`level:${who}`, (s) => s.level(who));
/** A dictation this window started (store.dictateStart()): its whole text so far, final, cancelled, error. */
export const useDictation = (id: string | null): Dictation | null => useSlice(`dictation:${id ?? ''}`, (s) => (id === null ? null : s.dictation(id)));
export const useCoreState = (): CoreState => useSlice('core', (s) => s.core());

/** A thread's order, before and more (key: threadKey(project, agent)). */
export const useThreadOrder = (key: string): ThreadOrder => useSlice(`order:${key}`, (s) => s.threadOrder(key));
/** One entry: re-renders only when that entry is replaced. */
export const useEntry = (key: string, pos: number): Entry | undefined => useSlice(`entry:${key}:${String(pos)}`, (s) => s.entry(key, pos));
export const useTyping = (key: string): string => useSlice(`typing:${key}`, (s) => s.typing(key));
/** His sends on their way or failed, oldest first. */
export const usePending = (key: string): readonly Pending[] => useSlice(`pending:${key}`, (s) => s.pending(key));

/** Calls `fn` on every applied event (one-shot things: open, route, job_end, error). Keep `fn` stable. */
export function useCoreEvent(fn: (ev: Ev) => void): void {
  const store = useStore();
  useEffect(() => store.onEvent(fn), [store, fn]);
}
