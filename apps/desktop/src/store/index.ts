// '@/store': the one store of bise desktop and its hooks (owner: amb-core).
// Read: useProjects, useAgents, useCards, useThreadOrder, useEntry, useTyping,
// usePending, ... Act: useStore().send / answer / stop / subscribeThread /
// olderPage / files (useFiles), askSkills / dictateStart, dictateStop, dictateCancel (useDictation) / voiceMode, voiceMute, voiceType, voiceSend, voiceCut (useVoiceMode) /
// command(any typed AppCmd | HubCmd). Tests: new Store(fakePort),
// StoreProvider, replay(store, fixtures) from './replay'.
export { Store, TAGS, typed, threadKey, diffKey, takeKey, toolOutKey, type QueuedTake, type ToolOut, type Ev, type EvOf, type Pending, type ThreadOrder, type Diff, type Away, type Confirm, type Dictation, type HubLine, type FilesAnswer, type PrsList, type InboxList, type BranchesList, type VersionsList, type PagesList, type VoiceModeState } from './store';
export * from './hooks';
export type { AnswerAt, AnswerFrom, AnsweredFrom } from './answered';
export type { AnswerJump } from './store';
export { actedKeys, type Acted } from './acted';
export { refusedLine, type Refused } from './refused';
export { replay, allFixtureEvents } from './replay';
