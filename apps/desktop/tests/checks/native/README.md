# tests/checks/native (qa-native)

The checks of what bise does with macOS: the app's keys and menu bar (bar ⛔2), fn (O.5, ⛔4's fn
space, 2.6's fn twice), the capsule (its place, never the keys, quiet moments), the helper's
config. They run offscreen through `tests/harness` like every check: `pnpm test:e2e checks/native`
(give the folder: a bare `native/` also matches other paths and runs every check).

| file | what it proves |
|---|---|
| `mac-keys.spec.ts` | the menu bar is bise's (not `bise-desktop`), every ⛔2 key shows with the standard role; Settings… and Inbox reach the window when no bise window is focused; quitting tells the helper to quit and ends the app |
| `fn.spec.ts` | fn space: the spotlight at the top with the keys, again or esc closes; fn held: the talk at the bottom without the keys, the core gets `talk_start` in < 300 ms, the helper `own_mic`, the release `talk_end`; fn fn: hands-free until the next tap; fn i: the inbox in the window |
| `capsule.spec.ts` | the glass 170 px under the top (fn space) or 96 px above the bottom (the talk), centred, nothing drawn past the window; a card bise pushes shows at the bottom without the keys; a quiet moment (call, sharing, full screen) holds it until it ends; the helper gets `config` (his excluded apps) at start |
| `setup.spec.ts` | S.7: with none granted each permission has its allow and continue for now works, allow asks the helper (perm ask), a refusal offers System Settings (perm open), a grant shows at once; S.5: the core killed, one line says so (app.core), the app starts it again and talks to it (subscribes again), no Terminal |
| `world.ts` | the shared world: the app on FakeHelper + FakeCore, main's stdout lines, the capsule's page, the menu as the menu bar draws it, a click on a menu item |

## What these runs can't see

- **Keys reaching the menu.** A key pressed on the keyboard reaches NSMenu only from the window
  server, with a key window. Offscreen, Playwright's keys (CDP) and `webContents.sendInputEvent`
  go to the renderer, never to the menu (measured: ⌘I ⌘M ⌘W ⌘, change nothing;
  `before-input-event` sees the key). bise's own items are clicked here the way NSMenu clicks them
  (`MenuItem.click`); the native roles (quit, hide, close, minimize, undo...) can't be run from
  here at all on macOS (Electron leaves them to NSMenu).
- **The real fn key.** fn comes from the scripted helper, as the real helper's key machine says it.
- **Focus and activation.** Test windows are never focusable, so "his app stays active" is only
  proven where a real window is shown.
- **The tray.** A test run has no tray (it would sit in his menu bar).

## The macOS VM pass (planned with amb-tools; nothing downloaded yet)

What only a real, shown app with real keys can prove, run in a macOS VM (Apple's
Virtualization.framework, through `tart`), never on his screen:

1. **The keys for real**: ⌘Q ⌘W ⌘H ⌘M ⌘, ⌘I ⌘F ⌘Z ⌘⇧Z ⌘X ⌘C ⌘V ⌘A typed with CGEvent in the guest,
   each item's action seen in the guest's screen and the menu bar's key equivalents in a
   screenshot of the open menus.
2. **fn for real**: the packaged app with the real `bise-mac-helper`, fn held, fn fn, fn space from
   another app in front (TextEdit), through a CGEvent with the fn flag (`maskSecondaryFn`); the
   capsule listens in < 300 ms, TextEdit stays the active app.
3. **The capsule over a full-screen app**: TextEdit full screen, a card pushed: the panel draws on
   that Space (ScreenCaptureKit shot), TextEdit stays active and keeps the keys.
4. **TCC**: one packaged launch (`pnpm dist` with BISE_PACK_BISE / BISE_PACK_HELPER /
   BISE_PACK_SIGN_DIR -> `dist/mac-arm64/bise.app`): the helper's `hello.responsible` is bise.app;
   Accessibility, the mic and the screen asked in setup land on bise.app in System Settings (S.7, S.8).
5. **The glass**: vibrancy over a light and a dark wallpaper, frames while the talk animates.
6. **Setup on a fresh account**: S.1 (no CLI), S.2 (sign in), S.5 (the core killed), S.6 (update from
   a throwaway feed), S.7 (permissions refused then granted) on a new macOS user.

### Without a VM: the same items by hand (about 10 min, on a packaged bise.app)

On his Mac or anyone's, with a throwaway bise home. Each row: what to press, what you must see. A
row that fails: a screenshot and one line to qa-native.

| # | press | see |
|---|---|---|
| 1 | open the bise menu, Edit, Go, Window | the menu says bise (never bise-desktop); each item shows its key: Settings… ⌘, · Hide bise ⌘H · Quit bise ⌘Q · Close Window ⌘W · Undo ⌘Z · Redo ⇧⌘Z · Cut ⌘X · Copy ⌘C · Paste ⌘V · Select All ⌘A · Find ⌘F · Inbox ⌘I · Minimize ⌘M |
| 2 | in the window: ⌘, then ⌘I then ⌘F | settings, then the inbox, then the find bar in a thread |
| 3 | ⌘W, then bise › Settings… from the menu bar | the window closes, bise keeps running; Settings… opens the window on settings |
| 4 | ⌘M, click bise in the Dock; ⌘H, click it again | it minimizes and comes back; it hides and comes back |
| 5 | TextEdit in front: hold fn and say a sentence, let go | the talk shows at the bottom in under 0.3 s; TextEdit's title bar stays active (not greyed); the words reach bise |
| 6 | TextEdit in front: fn fn, speak, then fn once | hands-free shows and stays without holding; the tap ends it |
| 7 | TextEdit in front: fn space, type, esc | the spotlight at the top takes the typing; esc closes it; TextEdit is active again and its caret blinks |
| 8 | TextEdit full screen (⌃⌘F): fn space; then have an agent ask a question | the spotlight and then the card draw over the full-screen TextEdit, on its Space; TextEdit keeps the keys for the card |
| 9 | during a FaceTime call or a screen share: have an agent ask a question | no card shows during the call; it shows when the call ends |
| 10 | click the pearl in the menu bar; right-click it | the dropdown under the pearl; right-click: open bise ⌘0, settings ⌘,, quit ⌘Q |
| 11 | System Settings › Privacy & Security › Accessibility, Microphone, Screen Recording | bise is listed (not bise-mac-helper, not Electron) once setup asked for each |
| 12 | the capsule over a light then a dark wallpaper | the glass blurs what's behind it; no hard edge cut off at its right or bottom |

Cost, to ask the user first: a macOS 26 base image is ~25 GB to download and ~50 GB on disk
(sparse; ~30 GB really written); the VM wants 8 GB of RAM and 4 cores while it runs, about 2-3x
the battery of a test run. His disk had 21 GB free on 2026-10-06: it doesn't fit without room
made first, or an external disk (`TART_HOME`).
