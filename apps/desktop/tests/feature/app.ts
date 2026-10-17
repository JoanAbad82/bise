// The one door from the feature-test helpers (inputs.ts, run.ts) into the app: the proto's
// generated types and fixtures, the store (until state-machine's step replaces it, fast-try p4),
// main's kept state events (a reload's replay) and each screen's own "what I show" function.
// A feature test never imports this (eslint): it reads only run.ts's views and sent commands.
export type { AnswerResult, Card, CoreEv, HubEv, ProjectRow } from '@/proto';
export type { CoreCmd } from '@/shared/api';
export { core_ev, hub_ev } from '@/proto/fixtures.gen';
export { Store, type AnswerFrom } from '@/store';
export { Latest } from '@/shared/latest';
// the screens' views: the app's own functions, the ones their components draw from (architect m_29407)
export { inboxCards } from '@/inbox/Block';
