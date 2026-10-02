# bise ambient: the desktop app (architecture and build plan)

Status: building, on the local feature branch `ambient-app` only (never main, never pushed).
Lead: the task `ambient-lead` (tech, integration). Design lead: `ambient` (look, motion, behavior,
words; it signs off the screens), with `designer` for the brand. The design spec is ambient's
`SPEC.md` next to the mocks (`site/content/ambient/`, untracked, local: http://127.0.0.1:4747/content/ambient/).
The mocks stay out of git; the app's own code (the constellation port included) is new code in
`apps/ambient/`.

## 1. What v1 is (done when)

A macOS app, always on: the glass capsule top right with the constellation orb. Hold fn (or right
⌥ alone) to talk to main; let go to send. Main's answer shows word by word and is said aloud when you
talked. The capsule lists the agents. A card (an agent's question, a confirm) shows bise's own glass
notification under the capsule (a macOS notification when the capsule is hidden or the screen is
locked); fn + digit answers it. On fn down and on a spotlight send, one screenshot of the front
window goes to main with the message (never shown; pink corners and `main sees <App> · <title>`).

Everything talks to the same hub as the TUI, always to main's thread: the terminal and the capsule
are two views of one thread.

## 2. The architecture

Three pieces, two processes, one new native binary:

```
 bise ambient.app (Swift, AppKit)                        bise ambient-core (Rust, in bend-tui)
 ┌──────────────────────────────────────┐   stdio JSON  ┌─────────────────────────────────────┐
 │ capsule NSPanel ─ WKWebView (web UI) │◀─────────────▶│ hub client (hub.sock, like the TUI) │
 │ edge-glow overlay window             │   lines       │ mic + listener (voicemode: cpal,    │
 │ menu-bar :* item                     │               │   Voxtral realtime / batch STT)     │
 │ fn / right ⌥ capture (CGEventTap)    │               │ TTS + speaker (voicemode)           │
 │ ScreenCaptureKit front-window shot   │               │ screenshot → image store → marker   │
 │ notifications (UNUserNotification)   │               │ state/lines → compact UI events     │
 └──────────────────────────────────────┘               └─────────────────────────────────────┘
        apps/ambient/mac/   apps/ambient/web/                  rust/tui/src/ambient/
```

Why this split:

- **Swift for the OS.** A non-activating, all-Spaces, transparent always-on-top panel, an
  `NSVisualEffectView` (`.hudWindow`), a CGEventTap for fn, ScreenCaptureKit, UNUserNotification
  with actions: all first-class in AppKit/Swift, verbose and fragile through Rust's objc2. It builds
  with `swiftc` and the Command Line Tools (no Xcode project): one `build.sh`.
- **A web view for the look.** The constellation is WebGL (the mocks' `orbs.js` `cloud()`); the
  capsule's states, words and motion are CSS/JS in the mocks. Porting them to a WKWebView keeps the
  signed-off look exact and lets ambient review screens in a plain browser (`dev.html`, a fake core).
- **Rust for bise.** The hub protocol, the voice pipeline (`rust/tui/src/voicemode`: CpalMic,
  RealtimeListener/BatchListener, VoxtralTts, the speaker, the voice config and keys through
  `bise_catalog`) and the image markers (`bend-images`) already exist in Rust. The core is a
  subcommand of the `bise` binary (`bise ambient-core`, a module of bend-tui so it reaches
  `voicemode` and the `sb` wire parsing): **no new Rust binary**.
- **One new native binary, one stable path.** `scripts/ambient.sh build` compiles the Swift app
  into `<bise dev dir>/build/ambient/bise ambient.app` (`<bise dev dir>` = bins.sh's `$STATE`), and
  only when its sources' hash changed (like bins.sh). Never another copy, never spawned by tests
  (the EDR deletes fresh unsigned binaries), never `pkill` by name: the app writes its pid to
  `<bise dev dir>/ambient/app.pid` and `scripts/ambient.sh stop` kills that pid. Ad-hoc signed,
  bundle id `dev.bise.ambient`.
- **Launch.** `bise ambient` (in a repo) finds the workspace like the TUI does, builds the app if
  needed and `open`s it with `--args --workspace <ws> --bise <its own exe>`; the app spawns
  `<bise> ambient-core --workspace <ws>` and restarts it if it dies (backoff). A second
  `bise ambient` for another repo switches the app's workspace (v1: one workspace at a time).
- **Permissions.** Accessibility: one active CGEventTap (keyDown, keyUp, flagsChanged) sees fn
  and right ⌥ held alone and swallows the fn + key combos (fn + 1 must not type a 1 in the front
  app; a listen-only tap, Input Monitoring, cannot swallow); every other event passes untouched,
  and the tap re-enables itself when macOS disables it on a timeout. Screen Recording asked on the first
  fn hold with ambient's sentence first; Microphone: the core is the app's child, so macOS asks for
  the app (`NSMicrophoneUsageDescription` in Info.plist). Ad-hoc signing ties these grants to the
  binary's hash: each rebuild can ask again. Fix (needs the user, not blocking): a local
  self-signed code-signing certificate, so the grants survive rebuilds.

## 3. Data flow

- **Talk.** fn down → app: `shot` (ScreenCaptureKit, front window of its screen, skip list) +
  `talk_start` to the core; the core opens the mic and the listener, streams `heard` partials and
  `level`. fn up → `talk_end`: the core waits for the final words (≤ 1.5 s), sends
  `{"op":"input","focus":"main","text": words + image marker}` to the hub, remembers "voice out".
- **Main answers.** The core follows main's feed (`line` events, `wire::parse`): `obs: turn_started`
  → phase `working`; tool intents → `working` with a line; `obs: assistant:` → `main` text;
  `turn_done` → phase `done`. When the last input was voice, the core says main's message
  (`voicemode::speak::speakable` → TTS → speaker) and emits `word` indexes in step with the speaker's
  clock and `level` with who=`main`.
- **The tasks.** The hub's `state` event → `state` with the agents (name, status, note, report,
  working) and the user's cards (`model::user_kind`).
- **Cards.** A new card → the web UI shows the needs-you glass; the app sends a macOS notification
  if the capsule is hidden or the screen locked. An answer → `/answer <id> <reply>` as main's input
  (what the TUI does, `sb/cards.rs answer`).
- **The screenshot** goes to the image store (`bend_images::store_file`) as a marker in the message;
  the app deletes its PNG at once, the core forgets it after main's turn. (Check: the REPL rebuilds
  later requests from the store; deleting the stored copy after the turn must degrade to a text
  placeholder, else keep the stored copy and say so to ambient.)

## 4. The contract: app ⇄ core (stdio, one JSON object per line)

Owned by ambient-lead; a change goes through ambient-lead. The app forwards every core event to
the web UI unchanged (`window.ambient.recv(ev)`), adds its own (`app_*`), and forwards the web UI's
`cmd`s for the core (`window.webkit.messageHandlers.bise.postMessage(cmd)`).

Commands to the core (stdin):

| cmd | fields | meaning |
|---|---|---|
| `talk_start` | | fn down: open the mic and the listener |
| `talk_end` | | fn up: finish the words, send them to main |
| `talk_cancel` | | fn + esc: drop them (`cancelled. nothing sent.`) |
| `shot` | `path`, `app`, `title` | a front-window PNG for the next message (the core stores it, then deletes `path`) |
| `send` | `text` | spotlight ⏎: send to main (with the pending shot) |
| `answer` | `card`, `reply` | answer a card (`"1"`, `"yes"`, words) |
| `hush` | | esc while main speaks: stop the voice, keep the text |
| `cut_in` | | tap fn while main speaks: stop the voice (then `talk_start`) |
| `quiet` | `on` (bool), `why`: `call`/`meeting` | the user is on a call or in a meeting (the app's read): answer in text only, no TTS |

Events from the core (stdout):

| ev | fields | meaning |
|---|---|---|
| `hub` | `up` (bool), `workspace` | connected / lost (the core reconnects) |
| `state` | `agents: [{name, status, note, report, working, turn_ms}]`, `cards: [{id, kind, agent, text, options}]` | the task list and the user's cards (`options`: the card's numbered choices, parsed) |
| `phase` | `phase`: `idle` `listening` `sending` `working` `speaking` `done` `failed`, `line?` | main's turn, for the orb's pose and the words |
| `heard` | `text`, `final` | your live transcript |
| `level` | `who`: `you` `main`, `v` 0..1 | the voice level, ~30 Hz while someone talks |
| `main` | `text`, `turn` | main's message of this turn (whole, replaces the previous one) |
| `word` | `turn`, `i` | main's voice reached word `i` |
| `sent` | `text`, `voice` (bool), `shot` (bool) | the hub took the message |
| `error` | `text` | one sentence for the user (no key, no env) |
| `page` | `id`, `title`, `agent`, `version`, `url`, `at_ms`, `state`, `front` (bool) | a page published or changed state (docs/ambient-pages.md §2.3); `front`: main published it in the user's turn, or its agent was born since the user's last turn started: open it without fn + o |

`state` also carries `pages: [{id, title, agent, version, url, at_ms, state, open_notes}]`, newest
first (the capsule's "for you").

The process rules: the core exits on stdin EOF (the app died: no orphan); its stderr goes to
`<bise dev dir>/ambient/core.log`, the app's own log to `<bise dev dir>/ambient/app.log`.

Launch: `scripts/ambient.sh open --workspace <ws> --bise <exe> [--web <dir>]` builds when the hash
changed (stopping the running app first), opens the app at its one path; when the app already runs
with another workspace it writes `<bise dev dir>/ambient/switch.json` and sends SIGUSR1 to the pid
in `app.pid` (`open` ignores `--args` on a running app). `bise ambient` execs that script from the
app root (v1 is dev-only).

App-only events to the web UI: `app_quiet` (`on`, `why`: `call`/`meeting`: text only, non-urgent
cards wait; replayed after a reload; `app_settings.meeting_quiet` off by default, `app_setting
{key: "meeting_quiet"}` toggles it, turning it on is when macOS asks for the calendar), `app_fn` (`state`: `down`/`up`/`double`/`tap`/`cancel`, `key`:
`fn`/`right_option`; the web UI turns them into `cut_in`/`hush`/`talk_cancel`), `app_globe` (`use`:
`none`/`input`/`emoji`/`dictation`/`unknown`: macOS's "press 🌐 to"), `app_shot` (`app`, `title`,
`skipped`, `frame: {x, y, w, h}` for the pink corners), `app_perm` (`perm`: `screen`/`mic`/
`accessibility`, `state`: `granted`/`denied`/`ask`), `app_settings` (`edge_glow`, `radius`: macOS's
own window corner radius in px, read at runtime; the capsule and the needs-you glass use it, no
pill), `app_hidden`
(bool), `app_reduce_motion` (bool), `app_key` (fn + key: `space`, `1`…`9`, `i`, `0`, `o`, `.`,
`enter`, `esc`). Web UI commands `app_perm` (`perm`, `do`: `continue` opens macOS's prompt,
`settings` opens its pane, `not_now`: the refused path, its one line once, the menu bar and the
spotlight keep working), `app_setting` (`key`: `edge_glow`/`right_option`, `value`); `app_hide`
takes an optional `hidden` (bool; none: toggle).
Web UI commands for the app (not forwarded): `app_size` (`w`, `h`, `radius`: the capsule's frame
follows the content; optional `note: {y, h, radius}`: the needs-you glass under the capsule, in the
same web view, so the blur view masks two rounded rects), `app_focus` (`on`: the panel takes the
keys while the spotlight field is open, gives them back after), `app_open_url` (`url`), `app_hide`.

## 5. Slices

Each slice ends with something the user can run (`bise ambient`).

1. **Walking skeleton.** The app opens the capsule (glass, the web view, the idle constellation),
   starts the core, the core connects the hub; spotlight (a text box, fn + space later: a menu-bar
   click for now) sends to main; main's answer and the agents' list show. Menu-bar `:*`.
2. **Hold fn to talk.** The fn tap (Accessibility) and right ⌥; fn + space spotlight; mic, live words, send, the orb
   follows the voice; main's answer said aloud with lit words; hush and cut-in; the edge glow; the
   front-window shot with the corners and the chip, the skip list, the permission ask.
3. **Needs you.** Cards: the glass notification under the capsule, fn + 1…9 answers, the macOS
   notification with two buttons when hidden or locked, `✓ cookies has it.`, done and failed lines.
   **= v1, the done-when.**
4. **The keys.** fn fn hands-free, fn + esc, fn + i (inbox), fn + 0 (agents), fn + ., fn + ⏎,
   fn + o; the globe-key check (🌐 + letter shortcuts, "press 🌐 to"); the
   settings (edge glow, fallback key, skip list).
5. **Outputs.** "for you": pages, PRs, docs, images; local viewers with the note layer, voice notes
   pinned at the mouse, `send` to the agent that made the output.

## 6. Who owns what (one owner per file)

| agent | owns | slices |
|---|---|---|
| **ambient-lead** | `docs/ambient-app.md` (the contract §4), integration, the gates, `sb land` | all |
| **amb-core** | `rust/tui/src/ambient/**`, its lines in `rust/tui/src/lib.rs` and `rust/harness/src/main.rs` (`ambient`, `ambient-core`) | 1-3: hub, voice, cards |
| **amb-mac** | `apps/ambient/mac/**`, `scripts/ambient.sh` | 1-4: panel, fn, shots, notifications, build |
| **amb-web** | `apps/ambient/web/**` (incl. `dev.html` + the fake core) | 1-4: capsule, constellation, states, words |
| (later) **amb-outputs** | the viewers and note layer | 5 |

Shared files nobody owns (Cargo.toml, Cargo.lock, a new crate dependency): ask ambient-lead.

## 7. How we work

- Commit with `sb land "<long subject>"` (no `--here`) from your worktree: it lands on `ambient-app`.
  Before: `tests/gate.sh quick` (Rust), `apps/ambient/mac/build.sh --check` (Swift type-check, no
  binary), the web UI's checks (`node apps/ambient/web/check.mjs`).
- Never open the mic, play a sound, take a screenshot or start the app on the user's Mac from a test:
  fakes and fixtures (voicemode's ScriptedMic, `say -o` + `afconvert`, a fake hub socket). The
  real app runs only when the user (or the lead, once per slice) launches it.
- Screens go to ambient for review (a `dev.html` URL or a screenshot of the web UI); words come from
  ambient's `W`, never invented.
- Done: `sb report done` to main and `sb send ambient-lead` the same (SHAs, what works, what not).

## 8. Out of the way (the user, 2026-10-02, via main m_5029)

His words: "at rest, la ui devrait carrément disparaître … une menubar icon qui nous indique si il
y a du travail en background ou pas, le nombre d'inbox messages auquel on doit répondre … même
quand ça travaille, il faudrait qu'on puisse cacher la UI et seulement avoir une indication que
quelque chose se passe … out of the way … [les UI] ne doivent pas toujours être affichées".

This replaces v1's "idle capsule shown by default" (SPEC §5.5). The behavior, built now; the look
(round 6) comes through the tokens and ambient's icon when picked:

- **At rest: nothing on screen.** No capsule, no edge. Only the menu-bar icon.
- **The menu-bar icon is the status** (vision §3 G, ambient-pm 715aca9d, which wins where this
  differs): still when idle; moving quietly while work runs (ambient's design; until then a subtle
  animation of the glyph); a number = things waiting for him (questions, approvals, unopened pages),
  none at 0; accent when something needs him. A click opens the **full view** (the capsule with
  what's running, needs you, for you); esc or a click away closes it. The right-click menu stays
  (commands).
- **The capsule shows only when there is something to see**, then goes away by itself:
  - while he talks (fn held, hands-free) or types (fn + space), and the edge glow while fn is held;
  - main's answer to his own turn: it shows, then hides 4 s after the end of the turn (or after
    the voice ends), unless the mouse is over it;
  - `got it` / `on it` after a send: brief (2 s), then hidden: the work goes on in the menu bar;
  - a new item that needs him: the capsule shows it for 6 s (the card, `1 yes 2 no`), then hides;
    the count stays in the menu bar; fn + 1…9 still answers the top item while hidden;
  - when he opens it (the icon, fn + .), it stays until esc, fn + ., or a click elsewhere.
- **Hide while working**: esc, fn + . or a click on the icon hides it at any moment; then nothing
  brings it back while agents work except his own talk or a new needs-you; the menu bar keeps the
  sign. A spoken answer keeps speaking when hidden (esc while speaking = text only, as
  before).
- macOS notifications stay for the screen locked or the user away (v1 rule), not for "hidden".

Owners: amb-mac (the visibility policy in the app: one state machine, the menu-bar icon states and
count), amb-web (the capsule's own timers move to the app's policy: it asks `app_hide`/`app_show`
through the contract; no idle view), ambient (the icon and its states, words), ambient-pm (the
vision's §3 and the QA checklist).
