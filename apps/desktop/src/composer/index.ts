// The composer: a ProseMirror editor (TipTap core) the app never rewrites per keystroke (Composer.tsx).
export { Composer, type ComposerProps } from './Composer';
export type { AnchorPick, ComposerActions, FieldBar } from './actions';
export type { Outgoing } from './message';
export { useComposerSources } from './useSources';
export { NO_SOURCES, type ComposerSources, type PickAgent, type PickCommand, type PickFile, type PickSkill, type SavedImage, type ArgKind, type Choice } from './sources';
export { flashWords, useApprovalsFlash, FLASH_MS, type ApprovalsEv } from './approvals';
