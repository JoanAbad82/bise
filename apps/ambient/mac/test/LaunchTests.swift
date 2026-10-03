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

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all Launch laws hold")
