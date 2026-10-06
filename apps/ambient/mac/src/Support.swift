// Support: the launch config (args), the dev dir, the log, JSON lines.

import Foundation

// <bise dev dir>: the same rule as scripts/bins.sh's STATE (and rust/home):
// $BISE_HOME/dev, ~/.bise/dev once migrated, else ~/.local/state/switchboard
func defaultDevDir(env: [String: String]) -> String {
    let home = NSHomeDirectory()
    if let b = env["BISE_HOME"], !b.isEmpty { return b + "/dev" }
    if FileManager.default.fileExists(atPath: home + "/.bise/migrated.json") { return home + "/.bise/dev" }
    return home + "/.local/state/switchboard"
}

struct Config {
    var workspace = ""
    var bise = "bise"
    var web: String? = nil
    var dev = ""
    var childEnv: [String: String] = [:]   // --env K=V: for the core (open drops the shell's env)
    var qa: String? = nil                  // --qa fake|real: the QA channel (QA.swift, plugins/ambient-qa); nil = a normal launch
    var harness: (sock: String, dir: String)? = nil   // harness A (Harness.swift): AMBIENT_HARNESS / BISE_AMBIENT_TEST_INPUT

    // --workspace <ws> --bise <exe> [--web <dir>] [--dev <dir>] [--env K=V]...
    // BISE_AMBIENT_WEB (live dev) wins over --web.
    static func parse(_ argv: [String], env: [String: String]) -> Config {
        var c = Config()
        var i = 1
        func next() -> String? { i += 1; return i < argv.count ? argv[i] : nil }
        while i < argv.count {
            switch argv[i] {
            case "--workspace": c.workspace = next() ?? ""
            case "--bise": c.bise = next() ?? "bise"
            case "--web": c.web = next()
            case "--dev": c.dev = next() ?? ""
            case "--qa": c.qa = next()
            case "--env":
                if let kv = next(), let eq = kv.firstIndex(of: "=") {
                    c.childEnv[String(kv[..<eq])] = String(kv[kv.index(after: eq)...])
                }
            default: break   // -psn_… and the like
            }
            i += 1
        }
        if let w = env["BISE_AMBIENT_WEB"], !w.isEmpty { c.web = w }
        c.harness = HarnessEnv.from(env: env)
        if c.dev.isEmpty { c.dev = defaultDevDir(env: env.merging(c.childEnv) { _, b in b }) }
        return c
    }

    // switch.json, written by scripts/ambient.sh for a running app (SIGUSR1)
    mutating func apply(switchFile path: String) -> Bool {
        guard let d = FileManager.default.contents(atPath: path),
              let o = (try? JSONSerialization.jsonObject(with: d)) as? [String: Any] else { return false }
        var changed = false
        // "workspace": "" (or "home": true) = the home workspace, ~/bise
        let home = o["home"] as? Bool == true
        if let w = home ? "" : o["workspace"] as? String, w != workspace { workspace = w; changed = true }
        if let b = o["bise"] as? String, !b.isEmpty, b != bise { bise = b; changed = true }
        if let w = o["web"] as? String, !w.isEmpty, w != web { web = w; changed = true }
        // env for the core (BISE_APP_ROOT of the try path); an empty value is no news
        for (k, v) in o["env"] as? [String: String] ?? [:] where !v.isEmpty && childEnv[k] != v {
            childEnv[k] = v
            changed = true
        }
        return changed
    }

    var ambientDir: String { dev + "/ambient" }

    // the try path's bise build (scripts/ambient.sh TRY_BISE): it has
    // ambient-core; an installed bise (~/.local/bin/bise) may not
    var devBise: String { dev + "/build/ambient/target/debug/bise" }
    func isDevBuild(_ exe: String) -> Bool { exe.hasPrefix(dev + "/build/") }

    // what a later launch restores (UserDefaults 'lastLaunch')
    var saved: [String: Any] { ["workspace": workspace, "bise": bise, "web": web ?? "", "env": childEnv] }

    // a launch not from scripts/ambient.sh with the dev build (Finder, the
    // login item, macOS's 'Quit & Reopen', which reuses the first launch's
    // args: the dogfood's 06:09 and 06:19 launches with ~/.local/bin/bise,
    // 'unknown command ambient-core' in a loop): the last launch or switch
    // saved, when its bise is a dev build still there; else, with no bise
    // path at all, the dev build when it's there. Never the PATH's bise
    // while a dev build exists.
    func restoring(_ s: [String: Any]?, isExe: (String) -> Bool) -> Config {
        var c = self
        guard !isDevBuild(bise) else { return c }
        if let s, let b = s["bise"] as? String, isDevBuild(b), isExe(b) {
            c.bise = b
            c.workspace = s["workspace"] as? String ?? c.workspace
            if let w = s["web"] as? String, !w.isEmpty { c.web = w }
            for (k, v) in s["env"] as? [String: String] ?? [:] { c.childEnv[k] = v }
            return c
        }
        if isExe(devBise) { c.bise = devBise }
        return c
    }

    // 'start bise in a terminal' (app_run_bise): a .command file Terminal
    // runs, in his workspace (none: the home workspace, ~/bise), with the
    // try path's app root when there is one; every value shell-quoted
    static func startBiseScript(bise: String, workspace: String, appRoot: String?) -> String {
        func q(_ s: String) -> String { "'" + s.replacingOccurrences(of: "'", with: "'\\''") + "'" }
        var lines = ["#!/bin/bash", "# bise ambient: start bise (the capsule's 'can't reach bise')"]
        if let r = appRoot, !r.isEmpty { lines.append("export BISE_APP_ROOT=\(q(r))") }
        lines.append(workspace.isEmpty ? "cd \"$HOME/bise\" 2>/dev/null || cd \"$HOME\"" : "cd \(q(workspace))")
        lines.append("exec \(q(bise))")
        return lines.joined(separator: "\n") + "\n"
    }

    // the line app.log says when the core exits 2 at once: its bise has no
    // ambient-core (an installed bise, older than the app)
    static func coreMissingLine(status: Int32, lived: Double, bise: String) -> String? {
        guard status == 2, lived < 5 else { return nil }
        return "core: \(bise) has no ambient core: run scripts/ambient.sh try"
    }
}

enum Log {
    nonisolated(unsafe) static var handle: FileHandle?

    static func open(_ path: String) {
        if !FileManager.default.fileExists(atPath: path) {
            FileManager.default.createFile(atPath: path, contents: nil)
        }
        handle = FileHandle(forWritingAtPath: path)
        _ = try? handle?.seekToEnd()
    }

    nonisolated(unsafe) static var tap: ((String) -> Void)?   // harness A's events

    static func say(_ s: String) {
        tap?(s)
        let line = "\(ISO8601DateFormatter().string(from: Date())) \(s)\n"
        if let h = handle { try? h.write(contentsOf: Data(line.utf8)) } else { FileHandle.standardError.write(Data(line.utf8)) }
    }
}

// the core's environment (lead m_8079, the user's 'can't reach bise'):
// whatever launched the app (an agent's shell, Ghostty, bise-ambient), the
// core never gets the launcher's agent plumbing: SB_*, BISE_ROLE,
// BISE_AGENT*, BEND_STDIN, BEND_*SOCKET, Ghostty's vars. What it needs
// stays: PATH, HOME, BISE_HOME, BISE_APP_ROOT, the harness switch, keys.
enum CoreEnv {
    static func dropped(_ k: String, _ v: String) -> Bool {
        if k.hasPrefix("SB_") || k.hasPrefix("BISE_AGENT") || k.hasPrefix("GHOSTTY_") { return true }
        if k == "BISE_ROLE" || k == "BEND_STDIN" { return true }
        if k.hasPrefix("BEND_") && k.hasSuffix("SOCKET") { return true }
        if ["TERM", "TERM_PROGRAM", "TERM_PROGRAM_VERSION"].contains(k) { return true }   // a terminal's, never the core's
        return false
    }

    // the app's own env, then the launch's --env K=V, both filtered
    static func make(base: [String: String], launch: [String: String]) -> [String: String] {
        var env = base.filter { !dropped($0.key, $0.value) }
        for (k, v) in launch where !dropped(k, v) { env[k] = v }
        return env
    }
}

// which bise the core runs (lead m_8079): never PATH's 'bise'. A path given
// (--bise, switch.json, the last launch's) if it is an executable; else the
// bise inside or next to the app bundle; else none (a clear 'no bise' state)
enum BisePick {
    static func resolve(_ given: String, bundle: String, isExe: (String) -> Bool) -> String? {
        if given.contains("/") { return isExe(given) ? given : nil }
        let dir = (bundle as NSString).deletingLastPathComponent
        for c in [bundle + "/Contents/MacOS/bise", bundle + "/Contents/Resources/bise", dir + "/bise"] where isExe(c) { return c }
        return nil
    }
}

// where this app runs from (lead m_8079, one build dir): the one path is
// <bise dev dir>/build/ambient (scripts/ambient.sh's rule); anything else is
// a stray copy (an old SB_BUILD_DIR or state dir), said in app.log's line 1
enum BuildDir {
    static func kind(bundle: String, devDir: String) -> String {
        let one = devDir + "/build/ambient/"
        if bundle.hasPrefix(one + "harness/") { return "harness" }
        if bundle.hasPrefix(one) { return "the one path" }
        return "a stray copy (not \(one))"
    }
}

// harness A's click (Harness.mouse): a named window, its local point
enum HarnessClick {
    enum Route: Equatable { case window, through }
    // the page's CSS px (top-left origin) → AppKit's window point (bottom-left)
    static func local(css p: CGPoint, windowHeight h: CGFloat) -> CGPoint { CGPoint(x: p.x, y: h - p.y) }
    // the panel takes the mouse only in its glass; elsewhere the click goes through
    static func route(takesMouse: Bool) -> Route { takesMouse ? .window : .through }
}

// harness A's switch (Harness.swift): AMBIENT_HARNESS=<dir> or
// BISE_AMBIENT_TEST_INPUT=<socket>; honored only with a throwaway home
enum HarnessEnv {
    static func from(env: [String: String]) -> (sock: String, dir: String)? {
        var sock = env["BISE_AMBIENT_TEST_INPUT"] ?? ""
        var dir = env["AMBIENT_HARNESS"] ?? ""
        if sock.isEmpty && dir.isEmpty { return nil }
        if sock.isEmpty { sock = dir + "/test.sock" }
        if dir.isEmpty { dir = (sock as NSString).deletingLastPathComponent }
        return (sock, dir)
    }

    // talk_start/end/cancel reach the core in harness mode only when the core
    // said {ev:'fake_voice', on:true} (amb-core a7332576: words from a file,
    // no mic, no speaker); every other cmd always goes
    static func forward(_ cmd: String, fakeVoice: Bool) -> Bool {
        guard ["talk_start", "talk_end", "talk_cancel"].contains(cmd) else { return true }
        return fakeVoice
    }

    // BISE_HOME set and not his own ~/.bise (`home`: his real home dir)
    static func isolated(env: [String: String], home: String) -> Bool {
        guard let h = env["BISE_HOME"], !h.isEmpty else { return false }
        let a = URL(fileURLWithPath: h).standardizedFileURL.resolvingSymlinksInPath().path
        let b = URL(fileURLWithPath: home + "/.bise").standardizedFileURL.resolvingSymlinksInPath().path
        return a != b
    }
}

enum JSON {
    static func line(_ o: [String: Any]) -> Data? {
        guard JSONSerialization.isValidJSONObject(o),
              var d = try? JSONSerialization.data(withJSONObject: o, options: [.withoutEscapingSlashes]) else { return nil }
        d.append(0x0A)
        return d
    }

    static func string(_ o: [String: Any]) -> String? {
        guard JSONSerialization.isValidJSONObject(o),
              let d = try? JSONSerialization.data(withJSONObject: o, options: [.withoutEscapingSlashes]) else { return nil }
        return String(data: d, encoding: .utf8)
    }

    static func object(_ d: Data) -> [String: Any]? {
        (try? JSONSerialization.jsonObject(with: d)) as? [String: Any]
    }
}

// splits a byte stream into lines
struct LineBuffer {
    private var buf = Data()
    mutating func feed(_ d: Data) -> [Data] {
        buf.append(d)
        var lines: [Data] = []
        while let nl = buf.firstIndex(of: 0x0A) {
            lines.append(buf.subdata(in: buf.startIndex..<nl))
            buf.removeSubrange(buf.startIndex...nl)
        }
        return lines
    }
}
