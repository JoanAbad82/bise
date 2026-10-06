# tests/harness/vm: the macOS VM pass (amb-tools, for qa-native)

This is what only a real, shown app with real keys can prove: NSMenu key equivalents, fn, focus, TCC, and
the glass over a full-screen app. It runs in a macOS VM (tart, Virtualization.framework), never on his screen.
qa-native owns the checks (`tests/checks/native`). This folder holds the VM and the means to drive it.

## His limits (card #444), enforced in `vm.ts`
- tart only. VMs are named `bise*` in `~/.tart`, and `bise-vm-cleanup` removes them and the image.
- 4 GB of memory and 2 cores (`tart set` before every start). Headless: `tart run --no-graphics`. The proof's
  watch follows tart's pid: a tart window on his screen, or tart in front, stops the VM.
- Up only while a check runs: `down()` stops it. A watchdog stops it if the test process dies.
- Disk floor (lead m_9830): it won't start under 8 GB free on `/`, and a running VM is stopped at once.
  Nothing of his is ever deleted.
- Inside: the image's own throwaway user (`admin`) and a fake hub (qa-native's guest kit).

## The image (once)
`tart clone ghcr.io/cirruslabs/macos-tahoe-base:latest bise-base` (26.9 GB compressed), run from a
launchd job because the agent shell's file-size limit kills it. tart itself comes from its GitHub release
(`~/.bise/dev/tart`, linked as `~/.local/bin/tart`): the brew formula is broken on this brew.
`bise-vm` is an APFS clone of `bise-base`, made by the first `Vm.up()`.

## API
```ts
import { Vm } from '../../harness/vm/vm';
const vm = await Vm.up({ dirs: { qa: '/abs/guest-kit' } });   // read-only, in the guest at /Volumes/My Shared Files/qa
await vm.exec(['sw_vers']);                                     // as admin, through tart's guest agent
await vm.exec(['open', '/Applications/bise.app'], { aqua: true }); // in his GUI session (launchctl asuser 501)
await vm.put('/host/file', '/Users/admin/file');                // one file through the agent's stdin
const png = await vm.vnc.shot();                                // the guest's screen, PNG (Virtualization's VNC)
await vm.vnc.keys('Meta+q');                                    // real HID keys: Meta = ⌘, Alt = ⌥, Control, Shift
await vm.vnc.type('hello'); await vm.vnc.click(720, 450);       // characters; a click at screen pixels
await vm.down();                                                // always: it stops the VM, throws if a rule broke
```
`rfb.ts` is the VNC client: RFB 3.8, None or VNC auth (`des.ts`, since Node's OpenSSL has no DES), Raw
and DesktopSize. VNC has no fn keysym, so fn comes from qa-native's `biseqa` (CGEvent with
maskSecondaryFn) run with `{ aqua: true }`.

Self-test: `BISE_HARNESS_VM=1 pnpm test:e2e harness/self/vm` brings it up and checks the limits
(memory and cores read in the guest). A ⌘Q sent over VNC must quit TextEdit, then the VM goes down.
