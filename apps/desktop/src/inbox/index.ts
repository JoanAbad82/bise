// src/inbox: one inbox (bar ⛔5, O.1; designer m_19631). Owner: amb-home.
// Block.tsx is the inbox: the block at the bottom of every view, every
// project's items, opened in place by ⌘I, /inbox, a notification or the
// capsule (openInbox); there is no inbox screen. InboxCard.tsx is one item as
// a card (the capsule's bottom cards mount it alone, amb-web); model.ts is its
// state and keys, order.ts its order (the hub's rank). Strip.tsx is the
// thread's inbox strip (stripRows.ts its rules), ThreadInbox (screen.tsx) the
// one line the thread mounts.
export { InboxCard, kindTitle, titleOf, PICKED_MS, type InboxCardActs, type InboxCardProps } from './InboxCard';
export { sortCards, cardKey } from './order';
export { takesWords, pickWaits } from './model';
export { InboxBlock, openInbox, answeringOf, blockList, useNotifyAuth, type Answering, type Here, type InboxBlockProps } from './Block';
export { inboxDrafts, makeDrafts, type Drafts } from './drafts';
export { ThreadInbox, inboxOf } from './screen';
export { ConfirmBar } from './confirm';
export { InboxStrip, useStripCard, type InboxStripProps, type StripPorts } from './Strip';
