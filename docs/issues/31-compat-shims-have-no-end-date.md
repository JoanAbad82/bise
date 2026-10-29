# 31 · compatibility shims have no end date

Status: closed: the six overdue shims are out, tests/shims.txt registers
the live ones (none today), tests/shims_check.py checks it in the gate.
Label: protocol, debt. Plan: architect's debt-map
pick (#628, Gabriel's go), plan signed by architect (m_29147, m_29151).

## Problem

When a protocol between bise's programs changes, we keep a shim for older
installs, "to remove one release after". No shim said which release, so
none was ever removed. Six were overdue at v2026.10.2-40 /
desktop-v2026.10.4:

1. notif-rename (-35): `sb card` (the old name of `sb notify`) and
   `/cards` (issue 27).
2. file-chips (-35): an older desktop's absolute file paths
   (`SendOpts.files`, `HubCmd::Answer.files`). Every desktop release, from
   desktop-v2026.10.1, sends file parts.
3. A1 (-35): the desktop matching his messages by their words when the
   hub gave no msg_id.
4. The Lexical draft reader (-32): Lexical left on 2026-10-07 (f12916a7),
   before the first desktop release.
5. update.rs `LEGACY_ID`: bundles packed before 0d546db5 said `id=root`.
   Every desktop tag contains 0d546db5, terminal installs move (the branch
   was copy-only), his old dev app's id is `8c13fd8`, and no `root`
   runtime is left on his machine.
6. parts-text: a send's text beside its parts that isn't their render was
   logged, not refused. The window that sends no text beside parts shipped
   in desktop-v2026.10.1 (8ed6bf275), so it was due at desktop-v2026.10.2.

## Plan

1. Remove the six with their tests and docs. A field leaves bise_proto
   only as a removal named in the commit; the released fixtures keep their
   lines and still parse (the field ignored).
2. `tests/shims.txt`: one line per live shim, `<tag> <owner> <removal
   release> <what>`, tab-separated, a removal release being a release tag
   (`v…` or `desktop-v…`).
3. `tests/shims_check.py` (with `--self-test`): a `TODO(<tag>)` whose
   words say it goes in a later release needs its line; a line whose tag
   appears nowhere (stale) or that doesn't parse is red everywhere, land
   included; a line at or past its release (the highest release tag of
   that kind merged into HEAD) is red in quick, full and the nightly, a
   warning in land (an unrelated lander didn't cause it).
4. One line in bise-implement's SKILL.md and in
   docs/architecture-principles.md: a compatibility shim is registered in
   `tests/shims.txt` with its removal release.

Not release-bound, so not registered: `TODO(answer-route)` (the desktop's
`answeredCardOf` and bise_proto's `is_main_answer_note` read the old
words 'card #' of transcripts written before notif-rename; they go when
the clients read the route line's typed card instead of words),
`TODO(notif-open)` (waits on office-artifacts), `TODO(client-protocol
step 7)`.

Exempt for good, not a shim: `rust/proto/src/thread/legacy.rs`, the
reader of the older text lines (the hub's `sb <kind> : <text>`, issue 25;
the runtime's `  obs: <kind>: <text>`, issue 38). Transcripts are never
rewritten and stay on disk, so it lives as long as history does: never
give it a removal release.
