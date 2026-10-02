// QA: the debug control channel of bise ambient.app, only when launched
// with `--qa fake|real` (plugins/ambient-qa drives it). Never in a normal
// launch: without the flag App never builds this.
//
// A unix socket, 0600, at <dev>/ambient/qa.sock (the QA launch gives the
// app its own dev dir, so its pid, logs and socket never touch the user's
// app). One JSON object per line each way: {"id", "op", ...} in,
// {"id", "ok", ...} out. The ops:
//
//   ping                      the app's pid, mode, workspace, page ready
//   inject {ev}               an event as if real: a core event goes through
//                             App's core path (memory, cards, edge), an app_*
//                             or ui_* event to the pages (app_fn lights the
//                             glow, app_shot with a frame the pink corners)
//   fn {state, key}           the fn tap's output (down up tap double cancel)
//   key {k}                   fn + k (space 1-9 i 0 o . enter esc)
//   say {text, per_word_ms}   hold fn, the words as heard partials with a
//                             fake voice level, let go: the words go to main
//                             as a send (the fake hub's main answers); main's
//                             answer is then "spoken": phase speaking, word
//                             indexes and a level, like the core with a voice
//   cmd {cmd}                 a command as if from the page
//   shot {app, title, skipped, frame}   what the fake front-window shot says
//   snapshot {what, backdrop, dir, name}   PNGs: panel, screen (composite)
//   state                     the web UI's model and view, the app's frames
//   events {n, levels}        the last n events in and out
//   play {events, shots, respond, dir, prefix, backdrop}
//                             a timeline [[ms, ev]] played into the app,
//                             snapshots at given ms; the core is muted
//   sheet {items, out, cols, title}   a contact sheet PNG of labeled images
//   reset                     the pages start over, the panel shown
//   quit
//
// What QA mode never does: open the mic (talk_start never reaches the core:
// the voice is faked here), play a sound, take a screenshot of the user's
// screen (the shot is fake; snapshots are the app's own web views drawn
// over a synthetic backdrop, with the glass composited: macOS 15+ gives no
// window images of its own and ScreenCaptureKit needs Screen Recording and
// draws the blur flat anyway), post a macOS notification, take the keyboard
// focus, open a URL, ask a permission, or listen to the real fn. With
// `--qa real` (the user's workspace, read-only) nothing reaches the core but
// what the core needs to run: no send, no answer, no talk.

import AppKit
import WebKit
import CoreImage

@MainActor
final class QA {
    enum Mode: String { case fake, real }

    let mode: Mode
    var readOnly: Bool { mode == .real }

    // the app's doors, wired by App
    var coreEvent: (([String: Any]) -> Void)?   // as if from the core (App.coreEvent)
    var keyOut: ((KeyOut) -> Void)?             // as if from the fn tap (App.key)
    var pageCmd: (([String: Any]) -> Void)?     // as if from the page (App.command)
    var sendCore: (([String: Any]) -> Void)?    // to the core itself (Core.send)

    private let capsule: Capsule
    private let edge: Edge
    private let sockPath: String
    private let started = Date()

    init(mode: Mode, dir: String, capsule: Capsule, edge: Edge) {
        self.mode = mode
        self.capsule = capsule
        self.edge = edge
        sockPath = dir + "/qa.sock"
    }

    // MARK: the log of events, in and out

    private struct Entry { let t: Double; let dir: String; let ev: [String: Any] }
    private var log: [Entry] = []
    private let logMax = 2000

    func saw(_ dir: String, _ ev: [String: Any]) {
        log.append(Entry(t: Date().timeIntervalSince(started), dir: dir, ev: ev))
        if log.count > logMax { log.removeFirst(log.count - logMax) }
    }

    // MARK: the app's hooks

    private var muted = false              // a play runs: the real core's events wait
    private var lastCore: [String: [String: Any]] = [:]
    private var respond: [String: [[Any]]] = [:]   // a play's answers to the page's cmds

    // the real core's events: logged, then to App (or held while a play runs)
    func fromCore(_ ev: [String: Any]) {
        saw("core>app", ev)
        guard let kind = ev["ev"] as? String else { return }
        if ["hub", "state", "phase", "main"].contains(kind) { lastCore[kind] = ev }
        if muted { return }
        if voice.turn, speakOut(ev) { return }
        coreEvent?(ev)
    }

    // the page's cmds: logged; the ones QA mode never does are answered here
    func fromPage(_ cmd: [String: Any]) {
        saw("page>app", cmd)
        let name = cmd["cmd"] as? String ?? ""
        switch name {
        case "app_perm":
            // never macOS's prompt: `continue` is granted, like the fake core
            let p = cmd["perm"] as? String ?? ""
            if cmd["do"] as? String == "continue" {
                after(0.6) { self.toPage(["ev": "app_perm", "perm": p, "state": "granted"]) }
            }
        case "app_focus":
            // never the user's keys: the spotlight field is typed through ui_spot_type
            break
        case "app_open_url":
            opened(cmd["url"] as? String ?? "")
        default:
            pageCmd?(cmd)
        }
    }

    // a URL the app would open in the user's browser: logged, never opened
    func opened(_ url: String) {
        saw("qa", ["ev": "qa_open_url", "url": url])
    }

    // App's cmds for the core: the voice is ours, read-only drops writes;
    // false = not sent
    func allow(_ cmd: [String: Any]) -> Bool {
        let name = cmd["cmd"] as? String ?? ""
        if muted {
            saw("app>core(muted)", cmd)
            answerMuted(cmd)
            return false
        }
        switch name {
        case "talk_start": voiceStart(); saw("app>core(qa)", cmd); return false
        case "talk_end": voiceEnd(); saw("app>core(qa)", cmd); return false
        case "talk_cancel": voiceStop(); emit(["ev": "phase", "phase": "idle"]); saw("app>core(qa)", cmd); return false
        case "hush":
            speakStop()
            emit(["ev": "phase", "phase": "done"])
            saw("app>core(qa)", cmd); return false
        case "cut_in":
            speakStop()
            emit(["ev": "phase", "phase": "idle"])
            saw("app>core(qa)", cmd); return false
        case "shot":
            saw("app>core(qa)", cmd); return false
        default:
            if readOnly { saw("app>core(read-only, dropped)", cmd); return false }
            saw("app>core", cmd)
            return true
        }
    }

    // MARK: the fake front-window shot

    var shotApp = "Chrome"
    var shotTitle = "localhost:4801/settings"
    var shotSkipped = false
    var shotFrame: CGRect?     // CG coords of the main screen, top-left origin

    // what App posts on fn down and on a spotlight send
    func fakeShot() -> (ev: [String: Any], bounds: CGRect?) {
        let s = NSScreen.screens.first?.frame ?? NSRect(x: 0, y: 0, width: 1440, height: 900)
        let b = shotFrame ?? CGRect(x: (s.width - 720) / 2, y: (s.height - 520) / 2, width: 720, height: 520)
        let ev: [String: Any] = ["ev": "app_shot", "app": shotApp, "title": shotTitle, "skipped": shotSkipped,
                                 "frame": ["x": b.minX, "y": b.minY, "w": b.width, "h": b.height]]
        return (ev, shotSkipped ? nil : b)
    }

    // MARK: the fake voice (no mic, no speaker)

    private struct Voice {
        var listening = false
        var turn = false            // the last send was voice: main's answer is spoken
        var words: [String] = []    // what `say` will be heard saying
        var heard = 0
        var startedAt = Date()
        var timer: Timer?
        var perWord = 0.24
        var onEnd: (() -> Void)?
    }
    private var voice = Voice()

    private func emit(_ ev: [String: Any]) {
        saw("qa>app", ev)
        coreEvent?(ev)
    }

    // fn down reached the core: listening, a level at 30 Hz, the words
    private func voiceStart() {
        voice.timer?.invalidate()
        voice.listening = true
        voice.heard = 0
        voice.startedAt = Date()
        emit(["ev": "phase", "phase": "listening"])
        voice.timer = Timer.scheduledTimer(withTimeInterval: 1.0 / 30, repeats: true) { [weak self] _ in
            MainActor.assumeIsolated { self?.voiceTick() }
        }
    }

    private func voiceTick() {
        let t = Date().timeIntervalSince(voice.startedAt)
        let talking = !voice.words.isEmpty && voice.heard < voice.words.count
        let v = talking ? QA.level(t - 0.3, seed: 0) : 0.02
        coreEvent?(["ev": "level", "who": "you", "v": (v * 1000).rounded() / 1000])
        let due = Int((t - 0.4) / voice.perWord) + 1
        if !voice.words.isEmpty, due > voice.heard, voice.heard < voice.words.count {
            voice.heard = min(due, voice.words.count)
            emit(["ev": "heard", "text": voice.words.prefix(voice.heard).joined(separator: " "), "final": false])
            if voice.heard == voice.words.count, let end = voice.onEnd {
                voice.onEnd = nil
                after(0.5) { end() }
            }
        }
    }

    private func voiceStop() {
        voice.timer?.invalidate()
        voice.timer = nil
        voice.listening = false
    }

    // fn up: the words to main as a send (the core would send them with a marker)
    private func voiceEnd() {
        let text = voice.words.joined(separator: " ")
        voiceStop()
        voice.words = []
        emit(["ev": "phase", "phase": "sending"])
        guard !text.isEmpty else {
            after(0.3) { self.emit(["ev": "phase", "phase": "idle"]) }
            return
        }
        after(0.3) {
            self.emit(["ev": "heard", "text": text, "final": true])
            if self.readOnly {
                self.saw("qa", ["ev": "qa_note", "text": "read-only: not sent: \(text)"])
                self.emit(["ev": "phase", "phase": "idle"])
                return
            }
            self.voice.turn = true
            let cmd: [String: Any] = ["cmd": "send", "text": text]
            self.saw("app>core", cmd)
            self.sendCore?(cmd)
        }
    }

    // main's answer to a voice turn: said aloud, word by word
    private var speaking: Timer?
    private var spokenTurn: Any?

    private func speakOut(_ ev: [String: Any]) -> Bool {
        switch ev["ev"] as? String {
        case "sent":
            var e = ev
            e["voice"] = true
            coreEvent?(e)
            return true
        case "main":
            coreEvent?(ev)
            let words = (ev["text"] as? String ?? "").split(separator: " ").count
            let turn = ev["turn"] ?? NSNull()
            spokenTurn = turn
            speakStop()
            after(0.1) { self.speak(turn: turn, words: words) }
            return true
        case "phase":
            // the core's done (no voice there): ours comes after the words
            let p = ev["phase"] as? String
            if speaking != nil || spokenTurn != nil, p == "done" || p == "speaking" { return true }
            return false
        default:
            return false
        }
    }

    private func speak(turn: Any, words: Int) {
        emit(["ev": "phase", "phase": "speaking"])
        let start = Date()
        var said = -1
        speaking = Timer.scheduledTimer(withTimeInterval: 1.0 / 30, repeats: true) { [weak self] _ in
            MainActor.assumeIsolated {
                guard let self else { return }
                let t = Date().timeIntervalSince(start)
                let i = Int(t / 0.29)
                if i >= words {
                    self.speakStop()
                    self.voice.turn = false
                    self.spokenTurn = nil
                    self.emit(["ev": "phase", "phase": "done"])
                    return
                }
                self.coreEvent?(["ev": "level", "who": "main", "v": (QA.level(t, seed: 2) * 1000).rounded() / 1000])
                if i > said { said = i; self.emit(["ev": "word", "turn": turn, "i": i]) }
            }
        }
    }

    private func speakStop() {
        speaking?.invalidate()
        speaking = nil
        if voice.turn { voice.turn = false; spokenTurn = nil }
    }

    // a voice's level: syllables and pauses (fakecore.js's voice())
    static func level(_ t: Double, seed: Double) -> Double {
        if t < 0 { return 0 }
        let syl = pow(max(0, sin(t * 11 + seed) * 0.5 + 0.5), 1.4)
        let phrase = 0.55 + 0.45 * sin(t * 2.1 + seed * 3.1)
        let pause = (t * 0.9 + seed).truncatingRemainder(dividingBy: 2.6) > 2.25 ? 0.08 : 1
        return min(1, syl * phrase * pause * 1.1)
    }

    private func after(_ s: Double, _ f: @escaping @MainActor () -> Void) {
        DispatchQueue.main.asyncAfter(deadline: .now() + s) { MainActor.assumeIsolated { f() } }
    }

    // MARK: inject: an event as if real

    private var glowOn = false
    private var reduce = false
    private var edgeGlow = true

    func inject(_ ev: [String: Any]) {
        guard let kind = ev["ev"] as? String else { return }
        if kind.hasPrefix("app_") || kind.hasPrefix("ui_") {
            toPage(ev)
            switch kind {
            case "app_fn":
                edge.post(ev)
                let st = ev["state"] as? String ?? ""
                if st == "down" || st == "double" { setGlow(true) }
                if st == "up" || st == "cancel" { setGlow(false) }
            case "app_shot":
                if ev["skipped"] as? Bool != true, let f = ev["frame"] as? [String: Any] {
                    func n(_ k: String) -> CGFloat { CGFloat((f[k] as? NSNumber)?.doubleValue ?? 0) }
                    edge.corners(ev, cgBounds: CGRect(x: n("x"), y: n("y"), width: n("w"), height: n("h")))
                }
            case "app_reduce_motion":
                reduce = ev["on"] as? Bool ?? false
                edge.setup(ev)
            case "app_settings":
                edgeGlow = ev["edge_glow"] as? Bool ?? true
                edge.setup(ev)
            default: break
            }
        } else {
            saw("qa>app", ev)
            coreEvent?(ev)
            if kind == "level", glowOn { edge.post(ev) }
        }
    }

    private func toPage(_ ev: [String: Any]) {
        saw("qa>page", ev)
        capsule.post(ev)
    }

    private func setGlow(_ on: Bool) {
        glowOn = on && edgeGlow && !reduce
        edge.glow(glowOn)
    }

    // a play's answer to a cmd the muted core would have taken
    private func answerMuted(_ cmd: [String: Any]) {
        guard let name = cmd["cmd"] as? String, let list = respond[name] else { return }
        for item in list {
            guard item.count == 2, let ms = (item[0] as? NSNumber)?.doubleValue, let ev = item[1] as? [String: Any] else { continue }
            let e = QA.fill(ev, cmd) as? [String: Any] ?? ev
            after(ms / 1000) { self.inject(e) }
        }
    }

    // "$text" and the like in a respond event: the cmd's own field
    private static func fill(_ v: Any, _ cmd: [String: Any]) -> Any {
        if let s = v as? String, s.hasPrefix("$"), let r = cmd[String(s.dropFirst())] { return r }
        if let s = v as? String { return s }
        if let o = v as? [String: Any] { return o.mapValues { fill($0, cmd) } }
        if let a = v as? [Any] { return a.map { fill($0, cmd) } }
        return v
    }

    // MARK: the socket

    private var listenFD: Int32 = -1
    private var acceptSrc: DispatchSourceRead?
    private var clients: [Int32: (src: DispatchSourceRead, buf: LineBuffer)] = [:]

    func start() {
        unlink(sockPath)
        let fd = socket(AF_UNIX, SOCK_STREAM, 0)
        guard fd >= 0 else { Log.say("qa: socket failed"); return }
        var addr = sockaddr_un()
        addr.sun_family = sa_family_t(AF_UNIX)
        let path = Array(sockPath.utf8CString)
        guard path.count <= MemoryLayout.size(ofValue: addr.sun_path) else {
            Log.say("qa: socket path too long: \(sockPath)"); close(fd); return
        }
        withUnsafeMutableBytes(of: &addr.sun_path) { b in for (i, c) in path.enumerated() { b[i] = UInt8(bitPattern: c) } }
        let old = umask(0o177)
        let r = withUnsafePointer(to: &addr) {
            $0.withMemoryRebound(to: sockaddr.self, capacity: 1) { bind(fd, $0, socklen_t(MemoryLayout<sockaddr_un>.size)) }
        }
        umask(old)
        guard r == 0, listen(fd, 8) == 0 else { Log.say("qa: bind/listen failed: \(errno)"); close(fd); return }
        chmod(sockPath, 0o600)
        listenFD = fd
        let src = DispatchSource.makeReadSource(fileDescriptor: fd, queue: .main)
        src.setEventHandler { [weak self] in MainActor.assumeIsolated { self?.acceptOne() } }
        src.resume()
        acceptSrc = src
        Log.say("qa: mode \(mode.rawValue), listening on \(sockPath)")
    }

    func stop() {
        for (fd, c) in clients { c.src.cancel(); close(fd) }
        clients = [:]
        acceptSrc?.cancel()
        if listenFD >= 0 { close(listenFD) }
        unlink(sockPath)
    }

    private func acceptOne() {
        let fd = accept(listenFD, nil, nil)
        guard fd >= 0 else { return }
        var on: Int32 = 1
        setsockopt(fd, SOL_SOCKET, SO_NOSIGPIPE, &on, socklen_t(MemoryLayout<Int32>.size))
        let src = DispatchSource.makeReadSource(fileDescriptor: fd, queue: .main)
        src.setEventHandler { [weak self] in MainActor.assumeIsolated { self?.readable(fd) } }
        src.resume()
        clients[fd] = (src, LineBuffer())
    }

    private func readable(_ fd: Int32) {
        var bytes = [UInt8](repeating: 0, count: 65536)
        let n = read(fd, &bytes, bytes.count)
        guard n > 0, var c = clients[fd] else { drop(fd); return }
        let lines = c.buf.feed(Data(bytes[0..<n]))
        clients[fd] = c
        for line in lines where !line.isEmpty {
            guard let req = JSON.object(line) else { reply(fd, ["ok": false, "error": "not JSON"]); continue }
            Task { @MainActor in
                var r: [String: Any]
                do { r = try await self.handle(req) } catch { r = ["ok": false, "error": "\(error)"] }
                if r["ok"] == nil { r["ok"] = true }
                if let id = req["id"] { r["id"] = id }
                self.reply(fd, r)
            }
        }
    }

    private func drop(_ fd: Int32) {
        clients[fd]?.src.cancel()
        clients[fd] = nil
        close(fd)
    }

    private func reply(_ fd: Int32, _ r: [String: Any]) {
        guard clients[fd] != nil else { return }
        let d = JSON.line(r) ?? JSON.line(["ok": false, "id": r["id"] ?? NSNull(), "error": "reply not JSON"])!
        d.withUnsafeBytes { p in
            var off = 0
            while off < d.count {
                let w = write(fd, p.baseAddress!.advanced(by: off), d.count - off)
                if w <= 0 { break }
                off += w
            }
        }
    }

    struct Failure: Error, CustomStringConvertible { let description: String }

    // MARK: the ops

    private func handle(_ q: [String: Any]) async throws -> [String: Any] {
        let op = q["op"] as? String ?? ""
        switch op {
        case "ping":
            return ["pid": Int(getpid()), "mode": mode.rawValue, "ready": capsule.ready, "uptime": Date().timeIntervalSince(started)]
        case "inject":
            guard let ev = q["ev"] as? [String: Any], ev["ev"] is String else { throw Failure(description: "inject needs ev: {ev: ...}") }
            inject(ev)
            return [:]
        case "fn":
            let st = q["state"] as? String ?? ""
            let k: TalkKey = (q["key"] as? String) == "right_option" ? .rightOption : .fn
            switch st {
            case "down": keyOut?(.talkStart(k))
            case "up": keyOut?(.talkEnd)
            case "tap": keyOut?(.tap)
            case "double": keyOut?(.double)
            case "cancel": keyOut?(.cancel)
            default: throw Failure(description: "fn state: down up tap double cancel")
            }
            return [:]
        case "key":
            guard let k = q["k"] as? String ?? q["key"] as? String else { throw Failure(description: "key needs k") }
            keyOut?(.key(k))
            return [:]
        case "say":
            return try await say(q)
        case "cmd":
            guard let c = q["cmd"] as? [String: Any], c["cmd"] is String else { throw Failure(description: "cmd needs cmd: {cmd: ...}") }
            fromPage(c)
            return [:]
        case "shot":
            if let a = q["app"] as? String { shotApp = a }
            if let t = q["title"] as? String { shotTitle = t }
            if let s = q["skipped"] as? Bool { shotSkipped = s }
            if let f = q["frame"] as? [String: Any] {
                func n(_ k: String) -> CGFloat { CGFloat((f[k] as? NSNumber)?.doubleValue ?? 0) }
                shotFrame = CGRect(x: n("x"), y: n("y"), width: n("w"), height: n("h"))
            }
            return fakeShot().ev
        case "snapshot":
            return try await snapshot(q)
        case "state":
            return await state()
        case "events":
            let n = (q["n"] as? NSNumber)?.intValue ?? 50
            let levels = q["levels"] as? Bool ?? false
            let list = log.filter { levels || ($0.ev["ev"] as? String) != "level" }.suffix(n)
            return ["events": list.map { ["t": ($0.t * 1000).rounded() / 1000, "dir": $0.dir, "ev": $0.ev] as [String: Any] }]
        case "play":
            return try await play(q)
        case "sheet":
            return try sheet(q)
        case "backdrop":
            backdrop = q["kind"] as? String ?? "dark"
            return ["backdrop": backdrop]
        case "reset":
            await reset()
            return [:]
        case "quit":
            after(0.1) { NSApp.terminate(nil) }
            return [:]
        default:
            throw Failure(description: "unknown op \(op)")
        }
    }

    // hold fn, say the words, let go; replies once the words are sent
    private func say(_ q: [String: Any]) async throws -> [String: Any] {
        guard let text = q["text"] as? String, !text.isEmpty else { throw Failure(description: "say needs text") }
        if let ms = (q["per_word_ms"] as? NSNumber)?.doubleValue { voice.perWord = max(0.05, ms / 1000) }
        voice.words = text.split(separator: " ").map(String.init)
        let hold = q["hold"] as? Bool ?? true
        await withCheckedContinuation { (k: CheckedContinuation<Void, Never>) in
            voice.onEnd = { k.resume() }
            if !voice.listening { keyOut?(.talkStart(.fn)) }
            if !voice.listening {   // the app didn't start a talk (a perm ask?)
                voice.onEnd = nil
                k.resume()
            }
        }
        if hold && voice.listening { keyOut?(.talkEnd) }
        return ["said": text, "sent": !readOnly]
    }

    private func reset() async {
        speakStop()
        voiceStop()
        voice = Voice()
        setGlow(false)
        if capsule.hidden { pageCmd?(["cmd": "app_hide", "hidden": false]) }
        _ = await js(capsule.web, "window.ambient && window.ambient.reset && window.ambient.reset(); 'ok'")
        edge.reload()
    }

    // MARK: state

    private func js(_ web: WKWebView, _ src: String) async -> String? {
        await withCheckedContinuation { (k: CheckedContinuation<String?, Never>) in
            web.evaluateJavaScript(src) { v, err in
                if let err { Log.say("qa: js: \(err)") }
                k.resume(returning: v as? String)
            }
        }
    }

    private func state() async -> [String: Any] {
        let src = "JSON.stringify({model: window.ambient && window.ambient.model(), view: window.ambient && window.ambient.view(), fps: window.ambient && window.ambient.fps()})"
        var out: [String: Any] = [:]
        if let s = await js(capsule.web, src), let o = JSON.object(Data(s.utf8)) {
            out = o
        }
        let f = capsule.panel.frame
        let sh = capsule.shape
        var shape: [String: Any] = ["w": sh.w, "h": sh.h, "radius": capsule.radius]
        if let n = sh.note { shape["note"] = ["y": n.y, "h": n.h, "radius": n.radius] }
        out["app"] = [
            "mode": mode.rawValue, "hidden": capsule.hidden, "visible": capsule.panel.isVisible,
            "panel": ["x": f.minX, "y": f.minY, "w": f.width, "h": f.height],
            "shape": shape, "glow": glowOn, "listening": voice.listening, "speaking": speaking != nil,
            "edge_visible": edge.views.map { $0.window.isVisible },
        ] as [String: Any]
        return out
    }

    // MARK: play: a timeline into the app, snapshots on the way

    private func play(_ q: [String: Any]) async throws -> [String: Any] {
        let events = (q["events"] as? [[Any]] ?? []).compactMap { e -> (Double, [String: Any])? in
            guard e.count == 2, let ms = (e[0] as? NSNumber)?.doubleValue, let ev = e[1] as? [String: Any] else { return nil }
            return (ms, ev)
        }
        let shots = (q["shots"] as? [[String: Any]] ?? []).compactMap { s -> (Double, [String: Any])? in
            guard let ms = (s["at"] as? NSNumber)?.doubleValue else { return nil }
            return (ms, s)
        }
        respond = q["respond"] as? [String: [[Any]]] ?? [:]
        let dir = q["dir"] as? String ?? NSTemporaryDirectory()
        let prefix = q["prefix"] as? String ?? "play"
        let bd = q["backdrop"] as? String
        if q["reset"] as? Bool ?? true { await reset() }
        muted = q["mute_core"] as? Bool ?? true
        defer {
            muted = false
            respond = [:]
        }
        // one timeline: events first at the same ms, then shots
        var items: [(ms: Double, ev: [String: Any]?, shot: [String: Any]?)] = []
        for (ms, ev) in events { items.append((ms, ev, nil)) }
        for (ms, s) in shots { items.append((ms + 0.5, nil, s)) }
        items.sort { $0.ms < $1.ms }
        let t0 = Date()
        var files: [[String: Any]] = []
        for it in items {
            let wait = it.ms / 1000 - Date().timeIntervalSince(t0)
            if wait > 0.002 { try await Task.sleep(nanoseconds: UInt64(wait * 1e9)) }
            if let ev = it.ev { inject(ev) }
            if let s = it.shot {
                var sq = s
                sq["dir"] = dir
                if sq["backdrop"] == nil, let bd { sq["backdrop"] = bd }
                let at = (s["at"] as? NSNumber)?.doubleValue ?? 0
                if sq["name"] == nil { sq["name"] = String(format: "%@@%.2fs", prefix, at / 1000) }
                var r = try await snapshot(sq)
                r["at_ms"] = at
                r["label"] = s["label"] ?? NSNull()
                files.append(r)
            }
        }
        if let tail = (q["tail_ms"] as? NSNumber)?.doubleValue, tail > 0 {
            try await Task.sleep(nanoseconds: UInt64(tail * 1e6))
        }
        // the real core's last word comes back
        if q["restore"] as? Bool ?? true {
            for k in ["hub", "state", "phase"] { if let ev = lastCore[k] { coreEvent?(ev) } }
        }
        return ["shots": files, "played": events.count]
    }

    // MARK: snapshots

    var backdrop = "dark"

    private func webImage(_ web: WKWebView) async -> CGImage? {
        await withCheckedContinuation { (k: CheckedContinuation<CGImage?, Never>) in
            let c = WKSnapshotConfiguration()
            c.afterScreenUpdates = true
            web.takeSnapshot(with: c) { img, err in
                if let err { Log.say("qa: snapshot: \(err)") }
                k.resume(returning: img?.cgImage(forProposedRect: nil, context: nil, hints: nil))
            }
        }
    }

    // what: panel (the capsule and its note, on the backdrop's patch, with
    // its shadow), screen (the whole main screen: backdrop, edge overlay,
    // panel), web (the panel's web view alone, transparent), both
    private func snapshot(_ q: [String: Any]) async throws -> [String: Any] {
        let what = q["what"] as? String ?? "both"
        let dir = q["dir"] as? String ?? NSTemporaryDirectory()
        let name = q["name"] as? String ?? String(format: "shot-%.0f", Date().timeIntervalSince1970 * 1000)
        let bd = q["backdrop"] as? String ?? backdrop
        try FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
        guard let screen = NSScreen.screens.first else { throw Failure(description: "no screen") }
        let scale = (q["scale"] as? NSNumber).map { CGFloat($0.doubleValue) } ?? screen.backingScaleFactor
        let shownPanel = capsule.panel.isVisible
        let web = shownPanel ? await webImage(capsule.web) : nil
        var out: [String: Any] = ["backdrop": bd, "hidden": !shownPanel]

        let sf = screen.frame
        let pf = capsule.panel.frame
        // the panel in top-left screen coords
        let panelTL = CGRect(x: pf.minX - sf.minX, y: sf.maxY - pf.maxY, width: pf.width, height: pf.height)
        let back = Backdrop.image(bd, size: sf.size, scale: scale)

        if what == "web" || what == "both" || what == "all" {
            if let web {
                let p = dir + "/" + name + ".web.png"
                try PNG.write(web, p)
                out["web"] = p
            }
        }
        if what == "panel" || what == "both" || what == "all" {
            let m: CGFloat = 56
            // the shadow's room, inside the screen (the capsule sits 20 px from its edge)
            let rect = panelTL.insetBy(dx: -m, dy: -m).intersection(CGRect(origin: .zero, size: sf.size))
            let img = Composite.draw(size: rect.size, scale: scale) { ctx in
                ctx.translateBy(x: -rect.minX, y: -rect.minY)
                if let back { ctx.draw(back, in: CGRect(origin: .zero, size: sf.size), flipped: true) }
                if shownPanel { self.drawPanel(ctx, at: panelTL, web: web, back: back, screen: sf.size, scale: scale) }
            }
            let p = dir + "/" + name + ".panel.png"
            try PNG.write(img, p)
            out["panel"] = p
        }
        if what == "screen" || what == "both" || what == "all" {
            var edgeImg: CGImage?
            if let ov = edge.views.first, ov.window.isVisible { edgeImg = await webImage(ov.web) }
            let menuH = sf.maxY - screen.visibleFrame.maxY
            let img = Composite.draw(size: sf.size, scale: scale) { ctx in
                if let back { ctx.draw(back, in: CGRect(origin: .zero, size: sf.size), flipped: true) }
                // the menu bar, plain (the user's own is never captured)
                ctx.setFillColor(CGColor(gray: 0.08, alpha: 0.35))
                ctx.fill(CGRect(x: 0, y: 0, width: sf.width, height: menuH))
                if shownPanel { self.drawPanel(ctx, at: panelTL, web: web, back: back, screen: sf.size, scale: scale) }
                if let e = edgeImg { ctx.draw(e, in: CGRect(origin: .zero, size: sf.size), flipped: true) }
            }
            let p = dir + "/" + name + ".screen.png"
            try PNG.write(img, p)
            out["screen"] = p
        }
        return out
    }

    // the glass: the backdrop blurred (44) and saturated (1.9) under the
    // page's two rounded boxes, the material's dark, the shadow, then the
    // web view on top (it draws the tint, the strokes, the orb, the words)
    private func drawPanel(_ ctx: CGContext, at r: CGRect, web: CGImage?, back: CGImage?, screen: CGSize, scale: CGFloat) {
        let s = capsule.shape
        let rad = capsule.radius
        let x = r.maxX - s.w
        var boxes = [CGRect(x: x, y: r.minY, width: s.w, height: s.h)]
        if let n = s.note { boxes.append(CGRect(x: x, y: r.minY + n.y, width: s.w, height: n.h)) }
        let path = CGMutablePath()
        for b in boxes { path.addRoundedRect(in: b, cornerWidth: min(rad, b.height / 2), cornerHeight: min(rad, b.height / 2)) }

        // shadow 0 30px 80px -24px #000b: the shape drawn far away, its shadow brought back
        ctx.saveGState()
        let far: CGFloat = 20000
        let shrunk = CGMutablePath()
        for b in boxes {
            let i = b.insetBy(dx: 24, dy: 24)
            if i.width > 0, i.height > 0 { shrunk.addRoundedRect(in: i.offsetBy(dx: far, dy: 0), cornerWidth: max(0, min(rad - 24, i.height / 2)), cornerHeight: max(0, min(rad - 24, i.height / 2))) }
        }
        // shadow offsets are in device space (y up in a bitmap context)
        ctx.setShadow(offset: CGSize(width: -far * scale, height: -30 * scale), blur: 80 * scale, color: CGColor(gray: 0, alpha: 0.73))
        ctx.addPath(shrunk)
        ctx.setFillColor(CGColor(gray: 0, alpha: 1))
        ctx.fillPath()
        ctx.restoreGState()

        ctx.saveGState()
        ctx.addPath(path)
        ctx.clip()
        if let back, let glass = Backdrop.glass(back, scale: scale) {
            ctx.draw(glass, in: CGRect(origin: .zero, size: screen), flipped: true)
        }
        // .hudWindow, dark: a deep neutral over the blur (an approximation)
        ctx.setFillColor(CGColor(red: 0.11, green: 0.10, blue: 0.11, alpha: 0.55))
        ctx.fill(r)
        ctx.restoreGState()

        if let web { ctx.draw(web, in: r, flipped: true) }
    }

    // MARK: the contact sheet

    private func sheet(_ q: [String: Any]) throws -> [String: Any] {
        let items = (q["items"] as? [[String: Any]] ?? []).compactMap { it -> (CGImage, String)? in
            guard let p = it["path"] as? String, let img = PNG.read(p) else { return nil }
            return (img, it["label"] as? String ?? (p as NSString).lastPathComponent)
        }
        guard !items.isEmpty, let out = q["out"] as? String else { throw Failure(description: "sheet needs items [{path, label}] and out") }
        let cols = max(1, (q["cols"] as? NSNumber)?.intValue ?? 4)
        let title = q["title"] as? String ?? ""
        // tiles in points (the images keep their pixels, drawn at 1/2)
        let tileW = CGFloat((q["tile_w"] as? NSNumber)?.doubleValue ?? 560)
        let labelH: CGFloat = 30, gap: CGFloat = 20, top: CGFloat = title.isEmpty ? gap : 64
        // each row as tall as its tallest tile (at most 1.6 times the width)
        let heights = items.map { min(CGFloat($0.0.height) * tileW / CGFloat($0.0.width), tileW * 1.6) }
        let rows = (items.count + cols - 1) / cols
        var rowY: [CGFloat] = [], rowH: [CGFloat] = []
        var y = top
        for r in 0..<rows {
            let h = heights[(r * cols)..<min(items.count, (r + 1) * cols)].max() ?? 100
            rowY.append(y); rowH.append(h)
            y += h + labelH + gap
        }
        let size = CGSize(width: CGFloat(cols) * (tileW + gap) + gap, height: y)
        let img = Composite.draw(size: size, scale: 2) { ctx in
            ctx.setFillColor(CGColor(red: 0.07, green: 0.065, blue: 0.07, alpha: 1))
            ctx.fill(CGRect(origin: .zero, size: size))
            if !title.isEmpty { Composite.text(ctx, title, at: CGPoint(x: gap, y: 20), size: 22, color: .white, mono: false) }
            for (i, (im, label)) in items.enumerated() {
                let c = i % cols, r = i / cols
                let x = gap + CGFloat(c) * (tileW + gap)
                let y = rowY[r], tileH = rowH[r]
                let w = CGFloat(im.width), h = CGFloat(im.height)
                let k = min(tileW / w, tileH / h)
                let dr = CGRect(x: x + (tileW - w * k) / 2, y: y, width: w * k, height: h * k)
                ctx.setFillColor(CGColor(gray: 1, alpha: 0.04))
                ctx.fill(CGRect(x: x, y: y, width: tileW, height: tileH))
                ctx.draw(im, in: dr, flipped: true)
                Composite.text(ctx, label, at: CGPoint(x: x, y: y + tileH + 7), size: 13, color: NSColor(white: 1, alpha: 0.8), mono: true)
            }
        }
        try PNG.write(img, out)
        return ["sheet": out, "count": items.count, "w": img.width, "h": img.height]
    }
}

// MARK: drawing helpers

extension CGContext {
    // a CGImage into a top-left (flipped) context, the right way up
    func draw(_ img: CGImage, in r: CGRect, flipped: Bool) {
        guard flipped else { draw(img, in: r); return }
        saveGState()
        translateBy(x: r.minX, y: r.maxY)
        scaleBy(x: 1, y: -1)
        draw(img, in: CGRect(origin: .zero, size: r.size))
        restoreGState()
    }
}

enum Composite {
    // a bitmap in points with top-left origin, `scale` px per point
    static func draw(size: CGSize, scale: CGFloat, _ body: (CGContext) -> Void) -> CGImage {
        let w = max(1, Int((size.width * scale).rounded())), h = max(1, Int((size.height * scale).rounded()))
        let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0,
                            space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        ctx.translateBy(x: 0, y: CGFloat(h))
        ctx.scaleBy(x: scale, y: -scale)
        body(ctx)
        return ctx.makeImage()!
    }

    static func text(_ ctx: CGContext, _ s: String, at p: CGPoint, size: CGFloat, color: NSColor, mono: Bool) {
        let font = mono ? NSFont.monospacedSystemFont(ofSize: size, weight: .regular) : NSFont.systemFont(ofSize: size, weight: .semibold)
        let g = NSGraphicsContext(cgContext: ctx, flipped: true)
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = g
        (s as NSString).draw(at: p, withAttributes: [.font: font, .foregroundColor: color])
        NSGraphicsContext.restoreGraphicsState()
    }
}

enum PNG {
    static func write(_ img: CGImage, _ path: String) throws {
        let rep = NSBitmapImageRep(cgImage: img)
        guard let d = rep.representation(using: .png, properties: [:]) else { throw QA.Failure(description: "PNG encode failed") }
        try d.write(to: URL(fileURLWithPath: path))
    }

    static func read(_ path: String) -> CGImage? {
        guard let img = NSImage(contentsOfFile: path) else { return nil }
        return img.cgImage(forProposedRect: nil, context: nil, hints: nil)
    }
}

// the synthetic wallpapers behind the glass: never the user's screen
@MainActor
enum Backdrop {
    private static var cache: [String: CGImage] = [:]
    private static var glassCache: [ObjectIdentifier: CGImage] = [:]

    // dark, bright, busy, none, or a picture file
    static func image(_ kind: String, size: CGSize, scale: CGFloat) -> CGImage? {
        let key = "\(kind) \(size.width)x\(size.height)@\(scale)"
        if let c = cache[key] { return c }
        var img: CGImage?
        switch kind {
        case "none", "": return nil
        case "dark": img = gradient(size, scale, [(0.04, 0.05, 0.08), (0.10, 0.11, 0.17)], blobs: false)
        case "bright": img = gradient(size, scale, [(0.96, 0.95, 0.92), (0.86, 0.90, 0.96)], blobs: false)
        case "busy": img = busy(size, scale)
        default:
            if let file = PNG.read((kind as NSString).expandingTildeInPath) {
                img = Composite.draw(size: size, scale: scale) { ctx in
                    // cover the screen
                    let k = max(size.width / CGFloat(file.width), size.height / CGFloat(file.height))
                    let w = CGFloat(file.width) * k, h = CGFloat(file.height) * k
                    ctx.draw(file, in: CGRect(x: (size.width - w) / 2, y: (size.height - h) / 2, width: w, height: h), flipped: true)
                }
            }
        }
        if let img { cache[key] = img }
        return img
    }

    private static func gradient(_ size: CGSize, _ scale: CGFloat, _ c: [(CGFloat, CGFloat, CGFloat)], blobs: Bool) -> CGImage {
        Composite.draw(size: size, scale: scale) { ctx in
            let cs = CGColorSpace(name: CGColorSpace.sRGB)!
            let g = CGGradient(colorsSpace: cs, colors: c.map { CGColor(red: $0.0, green: $0.1, blue: $0.2, alpha: 1) } as CFArray, locations: nil)!
            ctx.drawLinearGradient(g, start: .zero, end: CGPoint(x: size.width * 0.4, y: size.height), options: [.drawsBeforeStartLocation, .drawsAfterEndLocation])
        }
    }

    // colors, shapes and small dark and light text: the glass must read on it
    private static func busy(_ size: CGSize, _ scale: CGFloat) -> CGImage {
        Composite.draw(size: size, scale: scale) { ctx in
            let cs = CGColorSpace(name: CGColorSpace.sRGB)!
            let g = CGGradient(colorsSpace: cs, colors: [CGColor(red: 0.98, green: 0.78, blue: 0.25, alpha: 1), CGColor(red: 0.20, green: 0.55, blue: 0.95, alpha: 1), CGColor(red: 0.95, green: 0.35, blue: 0.55, alpha: 1)] as CFArray, locations: nil)!
            ctx.drawLinearGradient(g, start: .zero, end: CGPoint(x: size.width, y: size.height), options: [.drawsBeforeStartLocation, .drawsAfterEndLocation])
            var seed: UInt64 = 7
            func rnd() -> CGFloat { seed = seed &* 6364136223846793005 &+ 1442695040888963407; return CGFloat((seed >> 33) % 10000) / 10000 }
            for _ in 0..<40 {
                ctx.setFillColor(CGColor(red: rnd(), green: rnd(), blue: rnd(), alpha: 0.75))
                let r = 40 + rnd() * 220
                ctx.fillEllipse(in: CGRect(x: rnd() * size.width, y: rnd() * size.height, width: r, height: r))
            }
            let words = "the quick brown fox jumps over the lazy dog · settings · signup 4.1 s → 0.9 s · cookies · release"
            var y: CGFloat = 0
            var i = 0
            while y < size.height {
                let dark = i % 2 == 0
                Composite.text(ctx, words + " " + words, at: CGPoint(x: CGFloat(i % 3) * -40, y: y), size: 13 + CGFloat(i % 4) * 3,
                               color: dark ? NSColor(white: 0, alpha: 0.85) : NSColor(white: 1, alpha: 0.9), mono: i % 3 == 0)
                y += 22 + CGFloat(i % 4) * 4
                i += 1
            }
        }
    }

    // the backdrop as seen through the glass: blur 44, saturation 1.9
    static func glass(_ back: CGImage, scale: CGFloat) -> CGImage? {
        let id = ObjectIdentifier(back)
        if let c = glassCache[id] { return c }
        let ci = CIImage(cgImage: back).clampedToExtent()
        guard let blur = CIFilter(name: "CIGaussianBlur", parameters: [kCIInputImageKey: ci, kCIInputRadiusKey: 44 * scale / 2]),
              let sat = CIFilter(name: "CIColorControls", parameters: [kCIInputImageKey: blur.outputImage as Any, kCIInputSaturationKey: 1.9]),
              let outImg = sat.outputImage else { return nil }
        let r = CGRect(x: 0, y: 0, width: back.width, height: back.height)
        let img = CIContext().createCGImage(outImg, from: r)
        if let img { glassCache[id] = img }
        return img
    }
}
