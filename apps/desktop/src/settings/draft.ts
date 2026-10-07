// DRAFT shape (bar V14/S28/L2, the sign-in under way from the app), hand-written until amb-core
// types it (CoreEv signing {id, url}, AppCmd sign_in_cancel {id}): the accounts page is built and
// tested against it; when those land, this file goes. The approvals (V8) are typed now (HubEv
// approvals, amb-feed eeee43f6) and so are the waiting agents (Card.waiting). Nothing else in the
// app may use this. Owner: amb-kit.

/** The expired ChatGPT sign-in: the agents its expiry stopped, and the sign-in under way. */
export interface SignInDraft {
  /** the agents waiting for it (the hub's signin card's Card.waiting) */
  waiting: readonly string[];
  /** a sign-in under way from the app: its link, to copy (c) */
  signing?: { id: string; url: string } | null;
}
