// '@/store': the one store of bise desktop and its hooks (owner: amb-core).
// Read: useProjects, useAgents, useCards, useThreadOrder, useEntry, useTyping,
// usePending, ... Act: useStore().send / answer / stop / subscribeThread /
// olderPage / files (useFiles), askSkills / dictateStart, dictateStop, dictateCancel (useDictation) /
// command(any typed AppCmd | HubCmd). Tests: new Store(fakePort),
// StoreProvider, replay(store, fixtures) from './replay'.
export { Store, TAGS, typed, threadKey, diffKey, type Ev, type EvOf, type Pending, type ThreadOrder, type Diff, type Away, type Dictation, type FilesAnswer, type PrsList } from './store';
export * from './hooks';
export { replay, allFixtureEvents } from './replay';
