// The hub's records of what he answered or what was withdrawn, every project's, merged (inbox-record's
// 'inbox_history' / 'inbox_recorded' events, through the store). Owner: inbox-screen.
import type { InboxRecord } from './past';

const NONE: readonly InboxRecord[] = [];

export function useInboxRecords(): readonly InboxRecord[] {
  return NONE;
}
