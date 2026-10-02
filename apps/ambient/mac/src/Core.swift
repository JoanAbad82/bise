// Core: the child `<bise> ambient-core --workspace <ws>`, one JSON object
// per line each way (docs/ambient-app.md §4). Restarted with a backoff
// (0.5 s doubling to 30 s, back to 0.5 s after a minute alive). It exits
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
    private var backoff = 0.5
    private var startedAt = Date()

    init(config: Config) { self.config = config }

    func start() {
        stopped = false
        launch()
    }

    // a new workspace or bise: stop the old core, start a fresh one now
    func restart(config: Config) {
        self.config = config
        stop()
        backoff = 0.5
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

    private func launch() {
        gen += 1
        let g = gen
        let p = Process()
        // no workspace (launched from Finder or the menu bar): the home workspace, ~/bise
        let args = config.workspace.isEmpty ? ["ambient-core", "--home"] : ["ambient-core", "--workspace", config.workspace]
        if config.bise.contains("/") {
            p.executableURL = URL(fileURLWithPath: config.bise)
            p.arguments = args
        } else {   // a bare name: through PATH
            p.executableURL = URL(fileURLWithPath: "/usr/bin/env")
            p.arguments = [config.bise] + args
        }
        var env = ProcessInfo.processInfo.environment
        for (k, v) in config.childEnv { env[k] = v }
        p.environment = env
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
        try? input?.close()
        input = nil
        onExit?(status)
        retry(g)
    }

    private func retry(_ g: Int) {
        guard !stopped else { return }
        if Date().timeIntervalSince(startedAt) > 60 { backoff = 0.5 }
        let wait = backoff
        backoff = min(backoff * 2, 30)
        Log.say("core: restart in \(wait) s")
        DispatchQueue.main.asyncAfter(deadline: .now() + wait) { [weak self] in
            MainActor.assumeIsolated {
                guard let self, !self.stopped, g == self.gen else { return }
                self.launch()
            }
        }
    }
}
