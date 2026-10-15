# bise ambient · design spec (A glass + the pearl, out of the way)

Owner: `ambient` (design lead). Brand sign-off: `designer`. Build: `ambient-lead`.
The mocks are the reference. When the mocks and this file disagree, this file wins.
Mocks (local, `site/content/serve.py` on :4747):

| page | what |
|---|---|
| `/content/ambient/a.html?orb=cloud` | the whole flow: idle, hold fn, main answers, agents, needs you, output + notes, spotlight, state sheet |
| `/content/ambient/glass2.html?orb=cloud` | the orb alone, every state, the screen edge, real mic (`my mic`) |
| `/content/ambient/keys.html` | the key map, interactive (space = fn) |
| `orbs.js` | the shaders and the constellation (`cloud()`): reuse its numbers |
| `amb.js` | `W`: the words (signed off), `face()`: the kiss face's dots, the same as `rust/tui/src/voicemode/kiss.rs` |

## 0. Out of the way (the user, 2 Oct, overrides older rules below)

**Validated by the user (2 Oct): `/content/ambient/identity8.html`** is the reference: direction A's glass, the pink mist pearl as bise's body, out of the way, the moods, the menu-bar states, 13 feature screens. The painted rounds (identity2-7) are history.

- **At rest, nothing on screen.** No idle capsule. The only always-on sign is the menu-bar icon.
- **The menu-bar icon is the pearl** (§1, "the pearl"): 18 px, plus extras to its right.
  | state | the pearl (mood) | extra |
  |---|---|---|
  | nothing running, nothing waiting | `still`: no motion, a little dim | none |
  | agents working | `work`: the mist turns slowly (a whirlpool) | none |
  | N things wait for you (cards, approvals, notes to answer) | as above (still or turning) | a pink count `N` (`#f4a6b0`, text `#2a141b`), never blinking |
  | an agent done, or a page ready | `done`: a cream glint for 8 s | none |
  | an agent failed | `fail`: the mist stops and dims for 8 s | a small `▲` (`#ff9a8a`) for 8 s |
  | you hold fn | `listen`: brighter, faster with your voice | none |
  | quiet (a meeting, a call, full screen) | `away`: lilac dusk | a small `☾`; the count stays |
  Pink is the only color that asks for you. Reduced motion: the pearl is still in every state; only its tint changes.
- **When the capsule shows**, it grows out of the pearl in the menu bar (scale from the icon, 0.75 s expo out, `cubic-bezier(.16,1,.3,1)`) and opens under it; it goes back into the pearl the same way (0.6 s expo in, `cubic-bezier(.7,0,.84,0)`).
  - **You hold fn or fn space:** it shows while you talk, stays while bise answers, and goes back in 4 s after the answer ends. The pointer over it keeps it open.
  - **A question for you:** it shows once, for 8 s, with the question, then goes back in and leaves the count. Answers: fn 1 / fn 2, a click on the marble, hold fn and say it.
  - **A click on the marble, or fn 0:** it shows the agents and what waits for you, until esc, a click elsewhere, or fn 0 again.
  - **Never** for done, failed, a page ready, an agent's progress: those live in the marble only (and in the menu: "needs you", "for you").
- **Hide it any time:** esc, a click elsewhere, or fn . sends it back in at once. bise finishes saying the answer unless you hold fn again. Hidden stays hidden until you call it or the next question comes.
- **Meetings, calls, full screen:** it never shows by itself, and bise doesn't speak. Questions wait in the count.

## 1. The pieces

- **The capsule.** A floating panel, top right, 20 px from the screen edge and 12 px under the menu bar, always above other windows, on every Space, not in the Dock or cmd-tab.
  - **Size.** Idle is 360 × 84; open is 470 wide, and its height follows the content. The corner radius is macOS's own window radius (26 px on Tahoe, read from the system), not a pill: the user wants it to read as a window. Its full height is at most 70% of the screen; past that, it scrolls inside.
  - **The glass.** Fill: a gradient from `#2a2224` at 56% to `#1a1516` at 72%. Behind it: a blur of 44 and saturation 1.9. On macOS, use an `NSVisualEffectView` (material `.hudWindow`, dark) with that tint on top. Around the edge: a 1 px inner stroke `#ffffff1f` (12%), a 1 px top highlight `#ffffff33` (20%), and a shadow `0 30px 80px -24px #000b` (round 8 values, validated by the user; they replace `#ffffff26` / `#ffffff38`).
  - **Text.** System font (SF): 16 / 1.35 for the text. Agent names, glyphs and keys use JetBrains Mono at 11.5 to 13.
  - **Colors.** The accent is `#f4a6b0`. Text is `#fff`; dim text is `#ffffffa0`; faint text is `#ffffff70`.
- **The pearl (bise's body; replaces the constellation).** A ball of pink mist with no rim, a cream light inside, lilac in its shadows, its edge thinning into the air and breaking into dots of light. Reference implementation: `/content/ambient/marble.js`, variant `1` (the mist pearl), palette `pink`: one WebGL1 fragment shader, copy it as is.
  - **Where:** in the capsule's left, 68 px (top-left aligned with the first line of text); in the menu bar, 18 px (36 px @2x); in a page's frame, 36 px; the app icon, 1024 px still (`rest`) on the dark glass color `#1a1516`, macOS squircle.
  - **Palette** (vec3, linear 0-1): dark `UMBER .14 .05 .11`, body `AMBER .96 .56 .64` (= `#f4a6b0`), light `CREAM 1 .93 .91`, needs you `ROSE 1 .38 .60`, done `OLIVE 1 .87 .66` (a warm cream), away `EMBER .58 .46 .96` (lilac).
  - **Moods** (each a target; every value eases toward it with `1 - e^(-dt/0.3)`, so a change takes ~0.9 s): 
    | mood | speed | think | need | done | away | listen | voice | still |
    |---|---|---|---|---|---|---|---|---|
    | `rest` (capsule open, nothing special) | .18 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
    | `still` (menu bar, nothing going on) | 0 | 0 | 0 | 0 | .25 | 0 | 0 | 1 |
    | `listen` (fn held) | .7 | 0 | 0 | 0 | 0 | 1 | 1 | 0 |
    | `speak` (bise talks) | .5 | 0 | 0 | 0 | 0 | .4 | .6 | 0 |
    | `work` (agents running) | .45 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
    | `need` (a question) | .2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
    | `done` (8 s) | .25 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
    | `fail` (8 s) | 0 | 0 | 0 | 0 | .5 | 0 | 0 | 1 |
    | `away` (quiet) | .06 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
    `flow += dt · speed · (1 + 1.2 · voice · level)`; `level` is the real mic level (fn held) or the TTS level (bise talks). `think` swirls the mist into a whirlpool; `need`, `done`, `away` tint it; `still` stops the 7 s breath.
  - **Cost:** one small quad. At 18 px, render at 36 px @2x and at most 30 fps; when `still`, draw once and stop. The menu bar can't host a web view cheaply: amb-mac renders the same shader with Metal/Core Image, or plays pre-rendered loops (one 3 s loop per mood, 36 × 36, from the reference shader).
- **The screen edge.** While fn is held, a glow runs along every edge of the screen. It is a mix of iridescent colors and pink. Its width is 7 + 42 × level px, and its alpha follows a smoothed listening value. It's a full-screen, click-through overlay above everything. It is off under reduced motion, and the setting `edge glow` (default: on) turns it off.
- **The app's name:** `bise ambient.app`, all lowercase (Finder, Dock, permission prompts, notification header).
- **The menu-bar icon:** the pearl, 18 px, and its states (§0). Replaces the `:*` glyph.
- **Reduced motion** (the macOS setting, or bise's own): no edge glow. The pearl is still in every mood (its tint still changes). The capsule appears and leaves with a 0.2 s fade, no scale. Text appears without fades.
- **Tokens by role** (one file for the capsule's web UI and the page kit; an identity is a swap of this file):
  | token | dark (capsule, page frame, notes) | light (page paper) | what |
  |---|---|---|---|
  | `--surface-talk` | `linear-gradient(#2a2224 56%, #1a1516 72%)` + blur 44, saturation 1.9 | same (the frame and notes float as glass over the paper) | what bise says, the glass |
  | `--surface-made` | n/a | `#f2ede2` with a light grain | what agents make, the paper |
  | `--ink` | `#ffffff` | `#1d1a17` | text |
  | `--dim` | `#ffffffa0` | `#1d1a17a6` | secondary text |
  | `--faint` | `#ffffff70` | `#1d1a1773` | labels, keys |
  | `--accent` | `#f4a6b0` | `#c8264a` | only what waits for you; your voice |
  | `--on-accent` | `#2a141b` | `#ffffff` | text on the accent |
  | `--pen` | `#f4a6b0` | `#c8264a` | your notes |
  | `--working` | `#ffffffa0` | `#1d1a17a6` | work in progress: shown by motion (a breathing dot), not by a color |
  | `--ok` | `#cfe8c0` | `#3f6b35` | done ✓ |
  | `--risk` | `#ff9a8a` | `#b3261e` | failed ▲, risk kickers |
  | `--line` | `#ffffff12` | `#1d1a171c` | rules between rows |
  Type: the system font (SF) for the glass; Newsreader for page prose and h1 (600); JetBrains Mono for agent names, keys, numbers, kickers.

## 2. States and words

The words are `W` in `amb.js`, signed off by designer. Don't change them without designer.

| state | capsule | orb | words |
|---|---|---|---|
| idle | small | the face, resting, blinking | `nothing needs you. 3 agents working.` (all quiet: `all quiet. hold fn to talk.`) |
| hold fn | opens, plus the edge glow | the sphere, following your voice | `listening` / `let go of fn to send`, then your words as you say them (a live transcript), and `main sees Chrome · localhost:4801/settings` |
| let go | open | the face, the `*` turning | `:* got it.`, then `main is on it.` (under the `main` label: `on it.`) |
| main speaks | open | the sphere, following main's voice | main's answer, word by word with the voice. New agents pop in as chips: `∿ dark-mode` |
| end of turn | open, then small after 4 s | the kiss, once (1 s) | |
| needs you | small, plus bise's own notification under it | the face; the sphere breathing | `? cookies needs you` / `keep the banner on mobile?` / `1 yes` `2 no` / `or hold fn and say it` |
| answered | | the kiss | `✓ cookies has it.` |
| done | | the kiss | `<name> is done.` from the task list; the result (`perf is done: signup 4.1 s → 0.9 s.`, sometimes the light touch `three seconds back, every signup.`) only when it's main's words for you. Never the agent's report. Held 8 s, then the count line |
| failed | | the face, still | `▲ <name> failed.` from the task list; the reason (`release couldn't publish: the checksum didn't match. main is on it.`) only from main's words for you. No joke |

Motion:
- arrivals: expo out (`cubic-bezier(.16,1,.3,1)`), 0.45 to 0.6 s;
- pops (chips, pins): back out, 0.5 s;
- the capsule opening: a 0.6 s spring on width and radius;
- words: 0.24 s per word for you (they follow the transcript), 0.28 to 0.3 s for main (they follow its voice).

## 3. Behavior

- **Always main.** Voice and spotlight go to main's thread on bise's backend. The terminal and the capsule are two views of the same thread.
- **Screen context** (the user's request): on fn down, and on every message sent from spotlight, take one screenshot of the front window and attach it to the message for main. It's never shown to you. The only signs are pink corners framing that window for 1.1 s (fade in, then out) and the chip `main sees <App> · <title or URL>`. It isn't kept after main's turn (§5).
- **Voice out.** Main answers aloud when you talked. When you typed, it answers in text. `esc` while it speaks: `i'll stop talking. the rest is in text.`; tapping fn cuts in (`main stopped. go ahead.`).
- **Needs you.** Use bise's own notification, in the same glass and placed under the capsule. macOS notifications can't take a digit. When the capsule is hidden or the screen is locked, also send a macOS notification with two buttons.
- **Outputs.** The agents serve pages, docs and images on localhost; bise's note layer opens on them in your browser. Hold fn there and the voice note is pinned where your mouse is. `send` gives every note to the agent that made the output. Order in "for you": pages first, then PRs, docs, images.

## 4. Keys (`keys.html`, signed off)

fn is bise's key. Hold it to talk. fn + another key acts from anywhere. Inside the panel, plain keys work as in the TUI.

| keys | action |
|---|---|
| hold fn | talk to main; let go to send |
| fn fn | hands-free: `hands-free. tap fn to send.` |
| fn + esc | cancel: `cancelled. nothing sent.` |
| tap fn while main speaks | cut in |
| esc while main speaks | text only |
| fn + space | spotlight (⏎ send to main · tab start an agent · ⌘⏎ open · ↑ edit the last message · esc) |
| fn + 1…9 | answer the top question with option N: `✓ cookies has it: yes.` |
| fn + ⏎ | open the top item where it lives |
| fn + i | the inbox (↑↓ choose · 1-9 answer · l later: `later. it comes back in an hour.` · esc) |
| fn + 0 | the agents (1-9 open in the terminal · space preview · ⌘k find) |
| fn + o | the newest output |
| fn + . | hide or show the capsule: `quiet. i'm still here.` / `fn + . to show me again` |
| in a viewer | hold fn: a voice note at the mouse · p pin · d draw · t type · ⌘z undo · ⌘⏎ send the notes |

Check every fn + key against macOS's globe-key shortcuts on a real Mac. Avoid 🌐E, F, A, N, C, Q, H and the arrows.

## 5. Decided (open questions from the gallery, settled with ambient-lead)

1. **When the screenshot is taken:** on fn down, and on every spotlight message. Only the front window, of the screen it's on.
2. **Never captured** (default list, editable in settings): password managers (1Password, Bitwarden, Keychain Access), private or incognito browser windows, System Settings. When the front window is on the list, nothing is captured and the chip says `main doesn't see this window`.
3. **The screen recording permission:** asked the first time you hold fn, not at install. The ask is one sentence before macOS's own prompt: `main sees the window you're on when you talk. nothing is kept.`
4. **The fn setting:** at first launch, if "press 🌐 to" isn't "do nothing", bise shows the switch. Keyboards without fn: right ⌥ held alone does the same; it can be changed in the settings.
5. ~~**Always there:** the idle capsule is shown by default; fn + . hides it.~~ **Replaced by §0 (out of the way):** at rest nothing is on screen; the menu-bar marble is the only always-on sign.
6. **Talking straight to an agent** (fn + ⌥ + digit): not in v1. Voice goes to main.
7. **The edge glow:** on by default, with a setting.

8. **Permissions (first launch, one at a time, each just before macOS's own prompt).** Each ask is one sentence in the capsule, then a `continue` button that opens macOS's prompt.
   - **Accessibility** (the fn key; an active event tap, so fn + 1 doesn't also type a 1): `to hear fn in every app, bise needs Accessibility. it only uses fn and the keys you press with it.`
   - **The microphone:** `hold fn and talk. the mic is on only while you talk to bise: fn held, or hands-free until you tap fn.`
   - **Screen recording** (asked on the first fn hold, decision 3): `when you talk, main sees the window in front. it goes to your model with your words, and isn't kept.` (true: amb-core deletes the PNG and its stored copy when main's turn ends; later turns see `[image unavailable]`.)
   - **Refused:** one line, once, then no more nagging: `without Accessibility, bise can't hear fn. turn it on in System Settings › Privacy & Security › Accessibility.` The same pattern works for the mic and screen recording.
   - Capitalize the names of macOS settings (Accessibility). Lines signed off by designer.

Open, for the user later: none blocking. Defaults 2, 5 and 7 are ours, and the user can override them.
