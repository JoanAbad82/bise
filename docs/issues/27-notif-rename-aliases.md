# 27 · the old word 'card' as a command, for one release

Status: closed (issue 31): the `"card"` arm and `/cards` are gone; `sb
card` is an unknown command (cli/tests.rs). Label: cli, words.
Plan: page notif-rename, signed by designer (m_24653) and architect
(m_24654).

## Why

Gabriel's ask: what waits in his inbox for his answer is a
**notification**, for him and for the agents (one language). The words
they read changed; the habits did not change at once: running agents'
prompts still say `sb card` until they respawn, and his fingers still
type `/cards`. So the old commands stay as hidden aliases for one
release, then go.

## The aliases, and when they go

| old | new | where | goes |
|---|---|---|---|
| `sb card "<q>" [--for] [--page]` | `sb notify` | `rust/switchboard/src/cli.rs` (`"notify" \| "card"`, TODO(notif-rename)) | the release after notif-rename |
| `sb card --withdraw N "why"` | `sb notify --withdraw N` | same arm | same |
| `/cards` | `/inbox` | `rust/tui/src/sb.rs`, `rust/proto/src/commands.rs` | same |

## What keeps the old name for good (not aliases)

- `data-card="none"` in a page already published: stored data, read for
  good by `pages/questions.rs`; the lint refuses it in a new publish
  ("data-card is now data-notify").
- The wire and the code: a notification is a **card** on the wire and in
  the code (rpc `card/answer`, `card/close`, `hub/cards`, `card/open`;
  journal `card_opened`, `card_closed`; feed `sb card ::`,
  `sb card-closed ::`; json `card` fields; `Card` types). Old journals,
  old transcripts and older apps across a release read them; renaming
  them gains nothing anyone sees. See `docs/client-protocol.md`.

## Done when

The release after notif-rename: the `"card"` arm and `/cards` are gone,
their tests say the old words are unknown commands.
