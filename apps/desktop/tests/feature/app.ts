// The one door from the feature-test helpers (inputs.ts, run.ts) into the app: the proto's
// generated types and fixtures, the store (until state-machine's step replaces it, fast-try p4),
// main's kept state events (a reload's replay) and each screen's own "what I show" function.
// A feature test never imports this (eslint): it reads only run.ts's views and sent commands.
export type { AnswerResult, Card, CoreEv, HubEv, ProjectRow } from '@/proto';
export type { CoreCmd } from '@/shared/api';
export { core_ev, hub_ev } from '@/proto/fixtures.gen';
export { Store, threadKey, type AnswerFrom, type Pending } from '@/store';
export { Latest } from '@/shared/latest';
// the screens' views: the store's own (architect m_29407, m_29221 #2), the ones their components draw from
export type { InboxItem } from '@/inbox/listed';
export type { Effect } from '@/store/machine/types';
