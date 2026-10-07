// DRAFT protocol shapes (bar V8/W21 approvals, V14/S28/L2 expired sign-in), hand-written until
// bise-proto types them (amb-kit to ambient-lead, m_10925's answer): the screens are built and
// tested against these; when the generated types land (src/proto), this file goes and its users
// import those instead. Nothing else in the app may use these. Owner: amb-kit.
//
// The hub already speaks approvals to the TUI, untyped (daemon.rs op `approvals` {mode},
// op `remove_rule` {rule}; gate.rs approvals_ev): these mirror its fields.

/** A saved rule: what runs without asking him (approvals.toml). */
export interface RuleDraft {
  /** what remove_rule matches (the hub's own fields, sent back as they came) */
  id: string;
  tool: string;
  pattern: string;
  /** edits under this path */
  path: string;
  /** no project: it applies in every repo */
  every: boolean;
  /** when "always" saved it (ms), when the file says */
  added?: number | null;
  /** 'card #12, api-v2' */
  from: string;
  /** sandbox = false: its commands run outside the sandbox */
  outside: boolean;
}

/** The hub's approvals: the mode, the checker, this repo's saved rules. */
export interface ApprovalsDraft {
  /** 'auto' (the checker decides, else a card) | 'yolo' (everything runs) */
  mode: string;
  /** the mode is forced for this session by BISE_APPROVALS */
  env: boolean;
  /** 'jev' | 'model' | 'off' */
  checker: string;
  /** who checks: TypeSafe, OpenRouter, a chat model's id */
  checker_who: string;
  /** Jev's model id, '' for the others */
  checker_model: string;
  /** the workspace's git root: the rules are its own */
  repo: string;
  rules: readonly RuleDraft[];
  /** a remove the hub refused, in its words */
  error?: string | null;
}

/** The commands the approvals screen sends (draft: HubCmd approvals / remove_rule). */
export type ApprovalsCmd = { cmd: 'approvals'; mode: 'auto' | 'yolo' } | { cmd: 'remove_rule'; rule: string };

/** The expired ChatGPT sign-in (draft): the agents its expiry stopped, and the sign-in under way. */
export interface SignInDraft {
  /** the agents waiting for it (the hub's signin item's, typed) */
  waiting: readonly string[];
  /** a sign-in under way from the app: its link, to copy (c) */
  signing?: { id: string; url: string } | null;
}
