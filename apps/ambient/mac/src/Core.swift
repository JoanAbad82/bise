// Core: the child `<bise> ambient-core --workspace <ws>`, one JSON object
// per line each way (docs/ambient-app.md §4). Restarted with a backoff
// (Backoff: 0.5 s doubling to 30 s, back to 0.5 s only after a run that
// lived a minute, so a core that can't start never spins). It exits
// on stdin EOF, so closing its stdin is how we stop it (then SIGTERM).

import Foundation

@MainActor
final class Core {
    var onEvent: (([String: Any]) -> Void)?
    var onExit: ((Int32) -> Void)?

    private var config: Config
    private var proc: Process?
    private var input: FileHandle?
    private var lines = LineBuffer()
    private var gen = 0
    private var stopped = true
    private var backoff = Backoff()
    private var startedAt = Date()
    private var lived = 0.0          // how long the last run lived (0: it couldn't start)
    private var saidMissing = false  // 'this bise has no ambient core', said once per bise

    init(config: Config) { self.config = config }

    func start() {
        stopped = false
        launch()
    }

    // a new workspace or bise: stop the old core, start a fresh one now
    func restart(config: Config) {
        self.config = config
        saidMissing = false
        stop()
        backoff.reset()
        start()
    }

    func stop() {
        stopped = true
        gen += 1
        guard let p = proc else { return }
        proc = nil
        try? input?.close()
        input = nil
        if p.isRunning {
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { if p.isRunning { p.terminate() } }
        }
    }

    // at quit: no time for EOF to land, SIGTERM at once
    func kill() {
        stopped = true
        gen += 1
        try? input?.close()
        if let p = proc, p.isRunning { p.terminate() }
        proc = nil
    }

    func send(_ cmd: [String: Any]) {
        guard let d = JSON.line(cmd) else { Log.say("core: not JSON: \(cmd)"); return }
        guard let h = input else { Log.say("core: down, dropped \(cmd["cmd"] ?? "?")"); return }
        do { try h.write(contentsOf: d) } catch { Log.say("core: write failed: \(error)") }
    }

    // after a wake: a dead core starts now (not after its backoff)
    func check() {
        guard !stopped else { return }
        if let p = proc, p.isRunning { return }
        Log.say("core: not running after a wake, starting it")
        backoff.reset()
        launch()
    }

    private func launch() {
        // never PATH's 'bise' (lead m_8079): no bise path = a clear 'no bise'
        // state, said once, no retry loop
        guard config.bise.contains("/") else {
            Log.say("core: no bise: launch the app with --bise <path to bise> (never PATH's 'bise')")
            stopped = true
            DispatchQueue.main.async { [weak self] in MainActor.assumeIsolated { self?.onExit?(127) } }
            return
        }
        startedAt = Date()
        lived = 0
        gen += 1
        let g = gen
        let p = Process()
        // no workspace (launched from Finder or the menu bar): the home workspace, ~/bise
        let args = config.workspace.isEmpty ? ["ambient-core", "--home"] : ["ambient-core", "--workspace", config.workspace]
        p.executableURL = URL(fileURLWithPath: config.bise)
        p.arguments = args
        // never the launcher's agent plumbing (SB_*, BISE_ROLE, Ghostty's...)
        p.environment = CoreEnv.make(base: ProcessInfo.processInfo.environment, launch: config.childEnv)
        if !config.workspace.isEmpty { p.currentDirectoryURL = URL(fileURLWithPath: config.workspace) }

        let inPipe = Pipe(), outPipe = Pipe()
        p.standardInput = inPipe
        p.standardOutput = outPipe
        let errPath = config.ambientDir + "/core.log"
        if !FileManager.default.fileExists(atPath: errPath) { FileManager.default.createFile(atPath: errPath, contents: nil) }
        if let err = FileHandle(forWritingAtPath: errPath) {
            _ = try? err.seekToEnd()
            p.standardError = err
        }
        outPipe.fileHandleForReading.readabilityHandler = { [weak self] h in
            let d = h.availableData
            if d.isEmpty { h.readabilityHandler = nil }
            DispatchQueue.main.async { MainActor.assumeIsolated { self?.read(d, g) } }
        }
        p.terminationHandler = { [weak self] p in
            let status = p.terminationStatus
            DispatchQueue.main.async { MainActor.assumeIsolated { self?.exited(g, status) } }
        }
        do {
            try p.run()
        } catch {
            Log.say("core: can't start \(config.bise): \(error)")
            retry(g)
            return
        }
        Log.say("core: started pid \(p.processIdentifier) for \(config.workspace)")
        proc = p
        input = inPipe.fileHandleForWriting
        lines = LineBuffer()
        startedAt = Date()
    }

    private func read(_ d: Data, _ g: Int) {
        guard g == gen else { return }
        for line in lines.feed(d) where !line.isEmpty {
            if let ev = JSON.object(line), ev["ev"] is String {
                onEvent?(ev)
            } else {
                Log.say("core: not an event: \(String(decoding: line.prefix(200), as: UTF8.self))")
            }
        }
    }

    private func exited(_ g: Int, _ status: Int32) {
        guard g == gen else { return }
        Log.say("core: exited \(status)")
        proc = nil
        lived = Date().timeIntervalSince(startedAt)
        // a bise without ambient-core: say it once, not a silent loop
        if let line = Config.coreMissingLine(status: status, lived: lived, bise: config.bise), !saidMissing {
            saidMissing = true
            Log.say(line)
        }
        try? input?.close()
        input = nil
        onExit?(status)
        retry(g)
    }

    private func retry(_ g: Int) {
        guard !stopped else { return }
        let wait = backoff.after(lived: lived)
        Log.say("core: restart in \(wait) s")
        DispatchQueue.main.asyncAfter(deadline: .now() + wait) { [weak self] in
            MainActor.assumeIsolated {
                guard let self, !self.stopped, g == self.gen else { return }
                self.launch()
            }
        }
    }
}
