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

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all Launch laws hold")
