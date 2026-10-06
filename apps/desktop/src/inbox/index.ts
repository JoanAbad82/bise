// src/inbox: the ⌘I inbox (bar ⛔5, O.1). Owner: amb-home.
// Inbox.tsx draws it from props (every project's cards, the acts as ports);
// model.ts is its state and keys, order.ts its order (the hub's rank). The
// screen the shell mounts (reading src/store) comes with the store.
export { Inbox, type InboxPorts, type InboxProps } from './Inbox';
export { sortCards, cardKey } from './order';
