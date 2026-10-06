// src/inbox: the ⌘I inbox (bar ⛔5, O.1). Owner: amb-home.
// Inbox.tsx draws it from props (every project's cards, the acts as ports);
// InboxCard.tsx is one item as a card (the capsule's bottom cards mount it
// alone, amb-web); model.ts is its state and keys, order.ts its order (the
// hub's rank). The screen the shell mounts (reading src/store) comes with
// the store.
export { Inbox, type InboxPorts, type InboxProps } from './Inbox';
export { InboxCard, kindTitle, takesWords, type InboxCardActs, type InboxCardProps } from './InboxCard';
export { sortCards, cardKey } from './order';
export { InboxScreen, inboxOf } from './screen';
