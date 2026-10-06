# tests/harness: what exists (amb-tools)

The Playwright harness for bise desktop. Checks import it: `import { test, expect, ... } from '../../harness'`.
Run: `pnpm test:e2e` (self-tests + `tests/checks/**`), one worker. Ask amb-tools for anything missing.

## The rules it enforces
- **Never on his screen.** Every window is offscreen-rendered and never shown (`webPreferences.offscreen` +
  `show:false`). A shown window at -30000 is clamped by macOS onto his display (qa-type m_9499), whatever
  `getBounds()` says, so the proof reads the window server, not Electron.
- **Proof step + watch.** `native/watch.swift` samples `CGWindowListCopyWindowInfo` for the app's pid and its
  children every 100 ms, and the front app. The first window on screen or the app frontmost kills the app
  and fails the test. A Dock icon or a focused window fails it too. This runs at launch and at close.
- **No Dock icon, ever.** The harness's Electron is a clone of `node_modules/electron/dist` marked
  `LSUIElement=1` and re-signed ad hoc, in `.harness-cache/` (`electron.ts`).
- **Throwaway.** Every launch gets a temp `userData`, and nothing reads his Library. The mic is a wav file and
  the clipboard is never his.

## Launch (`launch.ts`): each returns a Session `{ app, page, cdp, proof, watch, close }`
| what | how |
|---|---|
| today's old window (composer, ⌘I, send) on `winfake.js` | `launchOld('window')`, fixture `oldWindow` |
| today's old capsule (spotlight, pearl) on `fakecore.js` | `launchOld('capsule')`, fixture `oldCapsule` |
| the new app (`apps/desktop/out`, `BISE_DESKTOP_TEST=1`) | `launchDesktop()`, fixture `desktop` |
| any HTML file | `launchPage(file)` |
| fake microphone | `launch*({ micWav: 'x.wav' })` (Chromium's fake capture device) |

Focus emulation is on, so the caret is drawn even though the window is never focused.

## Measure
| file | what |
|---|---|
| `frames.ts` | `Recorder` (CDP screencast: every drawn frame, PNG + time) · `changedOutside/Inside(frames, box)` · `flashes(frames, box)` (a frame unlike both neighbors: flicker) · `maxJump` · `changeSeries` · `fps` · `pngBytes` |
| `typing.ts` | `typeAndWatch(page, field, text, watch[])`: real keys one by one, then `replacedNodes`, `focusLost`, `caretJumps`, `value` · `watchMutations/readMutations` |
| `caret.ts` | `caretBlinks(page, field)`: the caret's box is drawn and blinks (shots 300 ms apart differ) · `caretBox` |
| `text.ts` | `textProblems(page, root, minPx)`: text that is clipped, offscreen or tiny |
| `perf.ts` | `watchPerf/readPerf` (long tasks, layout shift) · `wheel(page, target)` |
| `inputs.ts` | `dropFiles` (CDP drag, the real drop path) · `pasteImage` (a paste event carrying the image, the one exception: his pasteboard is never written) |
| `proof.ts` | `Watch`, `prove`, `violationsIn` |

Self-tests (`self/harness.spec.ts`, fixture `fixtures/typing.html`): each detector passes on a good field and
fails on a bad one. Measured: 59.5 fps off screen, caret blinks, 0 replaced nodes and 0 pixels changed outside
a good field, and the innerHTML rewrite is caught.

## Electron
pnpm 10 skips Electron's postinstall, and in an agent shell its 130 MB download fails (EFBIG, the
tool's file-size limit). Run it once from launchd:
`launchctl submit -l <you>.ei -- /bin/bash -c 'cd <worktree>/apps/desktop && PATH=<your PATH> node node_modules/electron/install.js > $TMPDIR/ei.log 2>&1'`.
Or point `BISE_HARNESS_ELECTRON_DIST` at a folder holding an Electron.app that is already patched
(a shared one: `~/.bise/dev/electron-dist/v44.5.1-lsui`).

## Coming
data-testid convention `<area>.<thing>[.<id>]` + its lint · `show me` (any screen, any fixture state, to PNGs and frames) · the macOS VM pass for qa-native.
