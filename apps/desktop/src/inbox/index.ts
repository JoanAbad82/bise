// src/inbox: the ⌘I inbox (bar ⛔5, O.1). Owner: amb-home.
// Inbox.tsx draws it from props (every project's cards, the acts as ports);
// InboxCard.tsx is one item as a card (the capsule's bottom cards mount it
// alone, amb-web); model.ts is its state and keys, order.ts its order (the
// hub's rank). The screen the shell mounts (reading src/store) comes with
// the store. Strip.tsx is the thread's inbox strip (stripRows.ts its rules),
// ThreadInbox (screen.tsx) the one line the thread mounts.
export { Inbox, type InboxPorts, type InboxProps } from './Inbox';
export { InboxCard, kindTitle, titleOf, PICKED_MS, type InboxCardActs, type InboxCardProps } from './InboxCard';
export { sortCards, cardKey } from './order';
export { takesWords, pickWaits } from './model';
export { inboxDrafts, makeDrafts, type Drafts } from './drafts';
export { InboxScreen, ThreadInbox, inboxOf } from './screen';
export { ConfirmBar } from './confirm';
export { InboxStrip, useStripCard, type InboxStripProps, type StripPorts } from './Strip';
