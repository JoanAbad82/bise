// The scripted stand-in for bise-mac-helper in a test run (src/main/helper/run.ts spawns whatever
// BISE_DESKTOP_HELPER names: a sh wrapper that runs this file, fakes/helper.ts; without it a test
// run has no helper). It never taps keys, reads a
// front app or opens the mic: it speaks the frozen lines of rust/proto/src/helper.rs and nothing else.
//   stdout  hello first, then every line a test sends to the control socket (an HelperEv each)
//   stdin   the app's commands (HelperCmd), appended to the log; {"cmd":"quit"} or stdin closed = exit
// env: BISE_HARNESS_HELPER_SOCK  the unix socket a test writes events to (fakes/helper.ts)
//      BISE_HARNESS_HELPER_LOG   the file the commands go to
import { runStub } from './stub-lib.mts';

runStub({
  start: [{ ev: 'hello', proto: 1, version: '0.0.0-harness-stub', pid: process.pid }],
  sock: process.env.BISE_HARNESS_HELPER_SOCK,
  log: process.env.BISE_HARNESS_HELPER_LOG,
  quitCmd: 'quit',
});
