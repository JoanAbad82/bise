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
- **Its own home (main m_9882).** Every launch gets a throwaway `HOME`, with `BISE_HOME` and `~/bise` inside it, a
  `TMPDIR` and a `userData`, all made by the harness (`isolation.ts`). The app's whole environment is a short
  allowlist plus that home. A caller's `env` can't set HOME, BISE_HOME, TMPDIR, SB_* or XDG_*, and a
  `BISE_DESKTOP_WORKSPACE` outside the home is refused.
- **The sentinel.** It reads the process table every second, from launch to close. Two things kill the run:
  sbd or launchctl in the app's process tree not pointing into the test home, and any new hub on his real
  `~/.bise` (a gate's hub with its own `SB_STATE_DIR` isn't his). At close it kills everything the run started,
  orphans included, plus anything living in the test home (hubs started through launchd, with their launchd
  jobs). Self-test: `self/isolation.spec.ts`, which includes amb-mac's 22:33 case on a fake bise.
- **Nothing of his.** The mic is a wav file, the clipboard is never his, and his Library is never read.

## Launch (`launch.ts`): each returns a Session `{ app, page, cdp, proof, watch, close }`
| what | how |
|---|---|
| the app (`apps/desktop/out`, `BISE_DESKTOP_TEST=1`) | `launchDesktop()`, fixture `desktop` |
| any HTML file (the harness's self-tests on `fixtures/`) | `launchPage(file)`, in `pageapp/main.js` (emitted from `pageapp/main.ts` by `scripts/ts_emit.ts`) |
| fake microphone | `launch*({ micWav: 'x.wav' })` (Chromium's fake capture device) |
| the scripted core | `launchDesktop({ core: new FakeCore() })`: its start world is every fixture of `rust/proto/fixtures` (or `new FakeCore([...events])`, or `'none'`). `core.send(ev)` sends more events, and `core.cmds()` / `core.waitCmd(pred)` read what the app sent the core (`fakes/core-stub.mts`). Without it, the core stays `down`. |
| the scripted Mac helper | `launchDesktop({ helper: new FakeHelper() })`: hello at start. `helper.send({ev:'fn',act:'talk_start',by:'fn'})` sends events, and `helper.cmds()` / `waitCmd` read the app's commands (`fakes/helper-stub.mts`). Without it, there is no helper. |
| a start screen | `launchDesktop({ route: 'settings' })` (BISE_DESKTOP_ROUTE, read by amb-mac's main in test mode); `'inbox'` / `'inbox?card=<p>/<id>'` open the inbox block in place on the kept screen (there is no inbox screen) |

The session's `page` is the app's main window (`window.bise.surface === 'window'`). Use `surfacePage(app, 'capsule')` for the capsule; any window is in `session.app.windows()`.
`session.blocked()` lists what the guards stopped: new windows, navigations, windows that weren't offscreen.

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

A WebGL canvas that stopped drawing (the bims office at rest, any still loop, reduced motion) comes out
blank in `page.screenshot` about 0.4 s after its last frame, `preserveDrawingBuffer` or not, while the
window shows it: off-screen rendering's capture, not the app (checked on a bare WebGL page, bims-reduced).
Read what is shown from the screencast: `Recorder`, or `shotOf` in `checks/bims/world.ts`.

Self-tests (`self/harness.spec.ts`, fixture `fixtures/typing.html`): each detector passes on a good field and
fails on a bad one. Measured: 59.5 fps off screen, caret blinks, 0 replaced nodes and 0 pixels changed outside
a good field, and the innerHTML rewrite is caught.

## Electron
pnpm 10 skips Electron's postinstall, and in an agent shell its 130 MB download fails (EFBIG, the
tool's file-size limit). Run it once from launchd:
`launchctl submit -l <you>.ei -- /bin/bash -c 'cd <worktree>/apps/desktop && PATH=<your PATH> node node_modules/electron/install.js > $TMPDIR/ei.log 2>&1'`.
Or point `BISE_HARNESS_ELECTRON_DIST` at a folder holding an Electron.app that is already patched
(a shared one: `~/.bise/dev/electron-dist/v44.5.1-lsui`).

## Test ids (guarantee 4)
Checks find things only by `data-testid`. In components, pass the id as the `testId` prop, and the ds puts it on the element.
- Name: `<area>.<thing>[.<id>]`, lowercase kebab-case parts joined by dots: `composer.editor`, `inbox.card.c-search`,
  `thread.msg.42`. A sub-part adds `.<i>` (`sub(testId, i)`). Areas are listed in `lint/testid.mts`: `AREAS`.
- Lint: `lint/testid.mts` is the ESLint plugin `bise-testid`. `name` checks literal and template ids. `present`
  flags what a person can act on without an id: a native control, a click/key/change handler, an interactive
  role, `contentEditable`. A spread counts as present.
- The list: `node tests/harness/lint/testids.mts [--md]` (with type stripping: `NODE_OPTIONS=--experimental-strip-types`) prints every id in `src/**/*.tsx` with its file:line.

## Show me
`node tests/harness/showme/showme.mts <surface> [state] [--frames <ms>] [--out <dir>] [--size <w>x<h>]` shows one screen
in one state, out of his sight. It writes `shot.png` and `meta.json` (with the proof), and with `--frames` also every
drawn frame (`frames/NNNN.png`, `frames.json`: times and change per frame).
- `desktop [route]`: the app from `out/` (`pnpm build` first), on the scripted core (the fixture world) and
  the scripted helper, opened on that route (`agent/acme-1a2b3c4d/perf`, `settings`, ...).
- `<file.html> [query]`: any page.

## Coming
named fixture worlds (more than "every fixture") as the screens need them · the macOS VM pass for qa-native.
