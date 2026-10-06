// The laws of a launch's bise (Config.restoring, Config.coreMissingLine),
// run by build.sh --test through the swift interpreter (cat'ed after
// src/Support.swift).

import Foundation

var failures = 0
func law(_ name: String, _ ok: Bool) {
    if ok { print("ok   \(name)") } else { print("FAIL \(name)"); failures += 1 }
}

let dev = "/u/.bise/dev"
let devBise = dev + "/build/ambient/target/debug/bise"
let installed = "/u/.local/bin/bise"
func cfg(_ bise: String, ws: String = "") -> Config {
    var c = Config()
    c.dev = dev
    c.bise = bise
    c.workspace = ws
    return c
}
let saved: [String: Any] = ["workspace": "/u/lab/repo", "bise": devBise, "web": "/u/web",
                            "env": ["BISE_APP_ROOT": "/u/lab/repo", "PATH": "/bin"]]
let all: (String) -> Bool = { _ in true }
let none: (String) -> Bool = { _ in false }

let reopen = cfg(installed).restoring(saved, isExe: all)
law("macOS's reopen with the installed bise: the last dev launch, whole",
    reopen.bise == devBise && reopen.workspace == "/u/lab/repo" && reopen.web == "/u/web"
        && reopen.childEnv["BISE_APP_ROOT"] == "/u/lab/repo")
law("a dev build given: kept as given", cfg(devBise, ws: "/w").restoring(saved, isExe: all).workspace == "/w")
law("no saved launch, no bise path: the dev build when it's there", cfg("bise").restoring(nil, isExe: all).bise == devBise)
law("no saved launch, the installed bise given, a dev build there: the dev build",
    cfg(installed).restoring(nil, isExe: all).bise == devBise)
law("no dev build anywhere: what was given", cfg(installed).restoring(saved, isExe: none).bise == installed)
law("a saved launch that wasn't a dev build: not restored",
    cfg(installed).restoring(["bise": "/opt/bise", "workspace": "/x"], isExe: { $0 == "/opt/bise" }).bise == installed)
law("the saved launch's bise is gone: the dev build if there",
    cfg(installed).restoring(saved, isExe: { $0 == devBise }).bise == devBise
        && cfg(installed).restoring(["bise": dev + "/build/old/bise"], isExe: { $0 == devBise }).bise == devBise)
law("saved round-trips", cfg(devBise, ws: "/w").restoring(cfg(devBise, ws: "/w").saved, isExe: all).bise == devBise)

law("core exits 2 at once: one line naming the bise and the fix",
    Config.coreMissingLine(status: 2, lived: 0.2, bise: installed) == "core: \(installed) has no ambient core: run scripts/ambient.sh try")
law("core exits 2 after running a while: not that", Config.coreMissingLine(status: 2, lived: 60, bise: installed) == nil)
law("other exits: not that", Config.coreMissingLine(status: 1, lived: 0.2, bise: installed) == nil)

// 'start bise in a terminal' (app_run_bise, amb-web d16054d8)
let nl = String(UnicodeScalar(10))
let run = Config.startBiseScript(bise: devBise, workspace: "/u/lab/my repo", appRoot: "/u/lab/repo")
law("run bise: in his workspace, quoted", run.contains("cd '/u/lab/my repo'\n"))
law("run bise: the dev bise, exec'd last", run.hasSuffix("exec '\(devBise)'\n"))
law("run bise: the try path's app root", run.contains("export BISE_APP_ROOT='/u/lab/repo'\n"))
law("run bise: no workspace: the home one", Config.startBiseScript(bise: "bise", workspace: "", appRoot: nil).contains("cd \"$HOME/bise\""))
law("run bise: a quote in a path can't break out",
    Config.startBiseScript(bise: "/a/it's/bise", workspace: "/w", appRoot: nil).contains("exec '/a/it'\\''s/bise'"))
law("run bise: a shell script", run.hasPrefix("#!/bin/bash\n"))

// harness A's switch: off by default, only with a throwaway home
law("harness: off without its env", HarnessEnv.from(env: ["BISE_HOME": "/tmp/h"]) == nil)
law("harness: AMBIENT_HARNESS=<dir> → <dir>/test.sock",
    HarnessEnv.from(env: ["AMBIENT_HARNESS": "/tmp/a"]).map { $0.sock == "/tmp/a/test.sock" && $0.dir == "/tmp/a" } == true)
law("harness: BISE_AMBIENT_TEST_INPUT=<socket> wins for the socket",
    HarnessEnv.from(env: ["AMBIENT_HARNESS": "/tmp/a", "BISE_AMBIENT_TEST_INPUT": "/tmp/b/x.sock"]).map { $0.sock == "/tmp/b/x.sock" } == true)
law("harness: isolated = BISE_HOME set and not his ~/.bise", HarnessEnv.isolated(env: ["BISE_HOME": "/tmp/h/home"], home: "/Users/g"))
law("harness: his own ~/.bise is never isolated", !HarnessEnv.isolated(env: ["BISE_HOME": "/Users/g/.bise"], home: "/Users/g"))
law("harness: his ~/.bise written another way neither", !HarnessEnv.isolated(env: ["BISE_HOME": "/Users/g/./.bise/"], home: "/Users/g"))
law("harness: no BISE_HOME = not isolated", !HarnessEnv.isolated(env: [:], home: "/Users/g"))
// bug 4's path: the core's fake voice (amb-core a7332576)
law("harness: talk_start is dropped while the core has no fake voice (it would open the mic)", !HarnessEnv.forward("talk_start", fakeVoice: false))
law("harness: talk_end and talk_cancel too", !HarnessEnv.forward("talk_end", fakeVoice: false) && !HarnessEnv.forward("talk_cancel", fakeVoice: false))
law("harness: with the core's fake voice on, talk_start/end/cancel go to the core",
    HarnessEnv.forward("talk_start", fakeVoice: true) && HarnessEnv.forward("talk_end", fakeVoice: true) && HarnessEnv.forward("talk_cancel", fakeVoice: true))
law("harness: every other cmd always goes", HarnessEnv.forward("send", fakeVoice: false) && HarnessEnv.forward("answer", fakeVoice: true))

// the core's env (lead m_8079): never the launcher's agent plumbing
let agentShell = ["PATH": "/usr/bin:/bin", "HOME": "/Users/g", "BISE_HOME": "/Users/g/.bise", "SB_SOCKET": "/x.sock", "SB_BUILD_DIR": "/b",
                  "BISE_ROLE": "task", "BISE_AGENT": "amb-mac", "BISE_AGENT_ID": "7", "BEND_STDIN": "/fifo", "BEND_HUB_SOCKET": "/h.sock",
                  "GHOSTTY_RESOURCES_DIR": "/g", "TERM_PROGRAM": "ghostty", "TERM": "xterm-ghostty", "OPENAI_API_KEY": "k", "LANG": "fr_FR.UTF-8"]
let ce = CoreEnv.make(base: agentShell, launch: ["BISE_APP_ROOT": "/repo", "PATH": "/opt/homebrew/bin:/usr/bin:/bin", "SB_HUB": "/x"])
law("core env: no SB_*, even from --env", !ce.keys.contains { $0.hasPrefix("SB_") })
law("core env: no BISE_ROLE, no BISE_AGENT*", ce["BISE_ROLE"] == nil && !ce.keys.contains { $0.hasPrefix("BISE_AGENT") })
law("core env: no BEND_STDIN, no BEND_*SOCKET", ce["BEND_STDIN"] == nil && ce["BEND_HUB_SOCKET"] == nil)
law("core env: no Ghostty or terminal vars", ce["GHOSTTY_RESOURCES_DIR"] == nil && ce["TERM_PROGRAM"] == nil && ce["TERM"] == nil)
law("core env: keeps BISE_HOME, HOME, LANG and the provider keys", ce["BISE_HOME"] == "/Users/g/.bise" && ce["HOME"] == "/Users/g" && ce["LANG"] != nil && ce["OPENAI_API_KEY"] == "k")
law("core env: the launch's --env wins (PATH, BISE_APP_ROOT)", ce["PATH"] == "/opt/homebrew/bin:/usr/bin:/bin" && ce["BISE_APP_ROOT"] == "/repo")
law("core env: the harness switch reaches the core (its fake voice)", CoreEnv.make(base: ["AMBIENT_HARNESS": "/h"], launch: [:])["AMBIENT_HARNESS"] == "/h")

// the core's bise (lead m_8079): never PATH's 'bise'
let exes: Set<String> = ["/b/bise", "/Apps/bise ambient.app/Contents/MacOS/bise", "/Other/bise"]
let isExe: (String) -> Bool = { exes.contains($0) }
law("bise: a given path that runs is the one", BisePick.resolve("/b/bise", bundle: "/Apps/bise ambient.app", isExe: isExe) == "/b/bise")
law("bise: a given path that doesn't run: none, never another", BisePick.resolve("/gone/bise", bundle: "/Apps/bise ambient.app", isExe: isExe) == nil)
law("bise: no path given: the one inside the bundle", BisePick.resolve("bise", bundle: "/Apps/bise ambient.app", isExe: isExe) == "/Apps/bise ambient.app/Contents/MacOS/bise")
law("bise: no path given, none in the bundle: the one next to it", BisePick.resolve("bise", bundle: "/Other/bise ambient.app", isExe: isExe) == "/Other/bise")
law("bise: nothing: none (a clear no-bise state), never PATH", BisePick.resolve("bise", bundle: "/Nowhere/bise ambient.app", isExe: isExe) == nil)
law("bise: an empty given: same rule", BisePick.resolve("", bundle: "/Nowhere/bise ambient.app", isExe: isExe) == nil)

// one build dir (lead m_8079): which copy runs, said in app.log's line 1
law("build dir: the one path", BuildDir.kind(bundle: "/Users/g/.bise/dev/build/ambient/bise ambient.app", devDir: "/Users/g/.bise/dev") == "the one path")
law("build dir: the try's new/ is the one path too", BuildDir.kind(bundle: "/Users/g/.bise/dev/build/ambient/new/bise ambient.app", devDir: "/Users/g/.bise/dev") == "the one path")
law("build dir: the harness build", BuildDir.kind(bundle: "/Users/g/.bise/dev/build/ambient/harness/bise ambient.app", devDir: "/Users/g/.bise/dev") == "harness")
law("build dir: the old state dir's copy is a stray",
    BuildDir.kind(bundle: "/Users/g/.local/state/switchboard/build/ambient/bise ambient.app", devDir: "/Users/g/.bise/dev").hasPrefix("a stray copy"))
law("build dir: an unmigrated home's state dir is its one path",
    BuildDir.kind(bundle: "/Users/g/.local/state/switchboard/build/ambient/bise ambient.app", devDir: "/Users/g/.local/state/switchboard") == "the one path")

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all Launch laws hold")
