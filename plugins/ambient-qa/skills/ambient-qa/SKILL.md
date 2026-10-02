---
name: ambient-qa
description: QA of bise ambient.app without the user's hands - launch the real app on a throwaway scripted hub, play every SPEC §2 state and get a contact sheet, drive fn, fn + keys and a fake voice that reaches a fake main, read the capsule's model and events, and take PNGs of the capsule and the screen. Load it when you (ambient, ambient-pm, ambient-lead) review a slice of the ambient app, check the UI against SPEC.md, or check an interaction or a flow.
---

# QA of bise ambient.app

The app is the real one (`<bise dev dir>/build/ambient/bise ambient.app`,
built by `scripts/ambient.sh` from the repo the plugin lives in), launched
in QA mode (`--qa fake|real`): a second instance with its own files under
`<bise dev dir>/qa/` and a control socket. Nothing here needs the user.

What QA mode never does: open the mic (the voice is faked inside the app),
play a sound, capture the user's screen, post a macOS notification, take
the keyboard focus, open a URL, ask a permission, listen to the real fn,
or talk to the user's real main. The capsule does show on the screen while
QA runs (top right, like the real one).

## Tools (`tools.ambient_qa.*`) and the same as one-line commands

The CLI is `python3 plugins/ambient-qa/qa.py <cmd>` from the repo root.
Every tool returns JSON; PNG files are written under
`<bise dev dir>/qa/out/` (the paths are in the result).

| tool | CLI | what |
|---|---|---|
| `launch({hub})` | `qa.py launch [--hub fake\|real]` | fake (default): a throwaway hub, tests/e2e.py's scripted provider: main answers `ack: <your words>`. real: your workspace, read-only (nothing is ever sent) |
| `scenes({only, backdrops, at})` | `qa.py scenes [--only talk,needs] [--backdrops dark,bright,busy]` | plays each scene in the app, shoots each moment, returns contact sheets (panel and screen) |
| `list_scenes()` | `qa.py list` | the scene ids and their SPEC §2 states |
| `say({text})` | `qa.py say "words"` | hold fn, the words heard one by one with a voice level, let go: sent to the fake main; waits for main's answer, then "speaks" it word by word. Returns main's text |
| `fn({state})` | `qa.py fn down\|up\|tap\|double\|cancel` | fn through the app's real key path (glow, fake shot, talk) |
| `key({k})` | `qa.py key 1` | fn + key: `space` `1`-`9` `i` `0` `o` `.` `enter` `esc` |
| `inject({ev})` | `qa.py inject '{"ev":"phase","phase":"working"}'` | any contract event (docs/ambient-app.md §4), core or `app_*`/`ui_*` |
| `snapshot({what, backdrop, name})` | `qa.py snapshot --what both --backdrop busy` | `panel`, `screen`, `web` or `both` |
| `state()` | `qa.py state` | the web UI's `model` and `view` (size, pose, words, chips, perm, pane) and the app's side (panel frame, shape, hidden, glow) |
| `events({n})` | `qa.py events 40` | the last events in and out, levels left out |
| `play({events, shots, name})` | - | your own timeline `[[ms, ev], ...]`, shots `[{at: ms, what}]` |
| `reset()` | `qa.py reset` | the capsule starts over, shown |
| `stop()` | `qa.py stop` | quit the QA app and the fake hub |

## The pictures: what is real and what is composited

- The capsule's content (tint, strokes, orb, words, chips, the needs-you
  note) is the app's own WKWebView, drawn by WebKit, at the screen's scale
  (2x on a Retina screen).
- The glass behind it is **composited**: the backdrop blurred (44) and
  saturated (1.9) under the page's two rounded boxes, a dark layer for the
  `.hudWindow` material, the shadow `0 30 80 -24 #000b`. macOS 26 gives an
  app no image of its own windows, and ScreenCaptureKit needs Screen
  Recording and draws the blur flat. Judge the glass's legibility from
  these shots; judge the exact blur on the real screen with the user.
- The backdrop is synthetic: `dark`, `bright`, `busy` (colors, shapes and
  small dark and light text), `none`, or a picture file path. Never the
  user's screen.
- `screen`: the backdrop, a plain menu bar, the capsule at its real place,
  and the edge overlay (the glow, the pink corners) when it shows.
- Names: `<scene>.<backdrop>@<seconds>s.panel.png` (and `.screen.png`,
  `.web.png`): the seconds are the time into the scene.

## How to QA a slice

1. `launch()` (fake hub). Check `hub_up: true` in the result.
2. `scenes()` for the whole SPEC §2 pass, with `backdrops: ["dark",
   "bright", "busy"]` when you judge the glass. Open the sheets
   (`sheets[]`) and each scene's PNGs. Compare each state with SPEC.md
   §2 (size, orb, words) and the mocks.
3. A moment that matters: `play` the scene's events with `shots` at the
   ms you want (`list_scenes`, then your own `at`), or `scenes({only:
   ["talk"], at: [400, 1200, 2000]})`.
4. The flows, through the real key path: `say("...")` (hold fn → words →
   send → main answers → spoken), `fn("double")` hands-free, `key("1")`
   on a card, `key("space")` then `inject({ev: "ui_spot_type", text})`
   and `inject({ev: "ui_spot_send"})` for the spotlight, `key(".")` to
   hide. After each step: `state()` (what the model decided) and
   `snapshot()`.
5. Cards on the fake hub: say `[[bash: sb ask-user "keep the banner on
   mobile?" --options "yes|no"]]`-style scripts to main, or inject a
   `state` event with `cards`.
6. Reduced motion: `inject({ev: "app_reduce_motion", on: true})`; the
   `still` scene plays a whole turn with it.
7. `stop()` when done.

Read-only on your real work: `launch({hub: "real", workspace: ...})`
shows your real agents and cards; nothing you do reaches main.

## Limits

- Main never really speaks: the voice out is played by the app from
  main's text (290 ms per word), like the core's timing, no audio.
- The words you `say` reach main as a typed `send` with the voice flag
  set by QA; the core's mic, listener and image marker are not exercised
  (amb-core's tests cover those).
- The menu-bar `:*` and the macOS notifications are off in QA mode.
- Pages in Chrome (the v2 page loop): use the `computer` plugin's
  screenshots on the fake hub's page server; not this plugin yet.
