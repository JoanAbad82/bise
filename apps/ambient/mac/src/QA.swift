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
import ScreenCaptureKit
import UniformTypeIdentifiers

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
    var visIn: ((VisIn) -> Void)?               // the Visibility machine's input (App.visFeed), as the real keys feed it
    var reduceMotionIn: ((Bool) -> Void)?       // App's reduce motion (its native fades), as the system setting feeds it
    var menuDump: (() -> [[String: Any]])?      // the menu-bar menu's rows (App.menuDump): --qa has no menu-bar item
    var menuStopWatch: ((Int) -> Void)?         // the 'stop watching' row's action (App.menuStopWatch)
    var menuCard: ((Any) -> Void)?              // a card row's action: bise open on that card (App, as StatusItem.onCard)
    var keyEvent: ((CGEventType, CGEvent) -> Bool)?  // an event as the tap hands it (Keys.qaEvent): the real key path,
                                                // KeyMachine and all, without a tap (a QA app never takes his fn)

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
            // App's permission plan runs on fake states in QA (amb-mac 1f531e9f):
            // it fakes macOS's prompt as granted itself (never TCC, never a
            // settings pane) and moves the plan on (mic granted -> screen ask)
            if let pageCmd {
                pageCmd(cmd)
            } else if cmd["do"] as? String == "continue" {
                let p = cmd["perm"] as? String ?? ""
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
            // the keys also enter amb-mac's Visibility machine, as App.key
            // feeds it (ambient's gate run 2: a hold reached the web only, so
            // the glass never came in); what shows is then the app's own call
            if kind == "app_fn" || kind == "app_key" { feedVisibility(ev) }
            // reduced motion is App's (amb-mac m_5564): it posts app_reduce_motion
            // itself, keeps it across page reloads (pageReady used to post the
            // system's false over a scene's true, so the web still grew) and fades
            // its native panel; the page only hears it from App
            if kind == "app_reduce_motion", reduceMotionIn != nil { saw("qa>app", ev) } else { toPage(ev) }
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
                reduceMotionIn?(reduce)   // the native panel's fade too (amb-mac m_5534)
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

    // App.key's feeds: a hold or hands-free starts a talk, a cancel drops
    // it (its end comes with the send: the core's `sent`), fn space the
    // spotlight (brief until the field takes the keys), fn . and esc
    // dismiss, any other key opens a view
    private func feedVisibility(_ ev: [String: Any]) {
        guard let visIn else { return }
        let kind = ev["ev"] as? String ?? ""
        if kind == "app_fn" {
            switch ev["state"] as? String ?? "" {
            case "down", "double": visIn(.talk(true))
            case "cancel": visIn(.cancelled)
            default: break
            }
            return
        }
        switch ev["key"] as? String ?? "" {
        case "space": visIn(.show(Visibility.brief))
        case "esc": visIn(.dismiss)
        case ".": visIn(.toggle)
        default: visIn(.open)
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
        case "menu":
            // the menu-bar menu as its rows, in order (amb-mac a069b924)
            return ["rows": menuDump?() ?? []]
        case "menu_click":
            // a row clicked: what the real row does, never the user's browser
            guard let kind = q["kind"] as? String else { throw Failure(description: "menu_click needs kind (and ref)") }
            let ref = q["ref"]
            switch kind {
            case "stop":
                guard let id = (ref as? NSNumber)?.intValue ?? Int(ref as? String ?? "") else { throw Failure(description: "stop needs ref: the timer id") }
                menuStopWatch?(id)
            case "page", "watch":
                guard let url = ref as? String, !url.isEmpty else { throw Failure(description: "\(kind) needs ref: its page URL") }
                opened(url)
            case "card":
                guard let ref else { throw Failure(description: "card needs ref: its card id") }
                menuCard?(ref)
            default:
                throw Failure(description: "menu_click: kind stop, page, watch or card (\(kind) is not clickable here)")
            }
            saw("qa", ["ev": "qa_menu_click", "kind": kind, "ref": ref ?? NSNull()])
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
        case "css":
            // another look on the same app: CSS (a tokens file) on the capsule and the edges, kept across reloads
            css = q["css"] as? String ?? ""
            applyCSS()
            return ["bytes": css.utf8.count]
        case "backdrop":
            backdrop = q["kind"] as? String ?? "dark"
            return ["backdrop": backdrop]
        case "reset":
            await reset()
            return [:]
        case "menubar":
            return try await menubar(q)
        case "pearl":
            return try pearlFrames(q)
        case "click":
            return try await click(q)
        case "keyev":
            return try keyev(q)
        case "keys":
            return try await keys(q)
        case "alpha":
            return try await alpha(q)
        case "hover":
            return try await hover(q)
        case "clickables":
            // every visible thing a click acts on, in the page's order, tagged data-qa-i so `click`
            // can aim at each one (ambient-pm m_6584: every button the capsule shows, once each)
            let sel = q["selector"] as? String ?? "button, [role=button], a[href], [data-act], [data-key], [onclick], li[data-n], label"
            // info hints are text, not targets (ambient m_6608: amb-web marks them data-qa-info)
            let quoted = String(data: try JSONSerialization.data(withJSONObject: [sel]), encoding: .utf8) ?? "[\"\"]"
            let src = """
            (() => { const out = []; let i = 0;
              for (const el of document.querySelectorAll(\(quoted)[0])) {
                const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
                if (r.width < 2 || r.height < 2 || cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
                if (el.hasAttribute('data-qa-info') || el.closest('[data-qa-info]')) continue;
                if (out.some(o => o.el.contains(el))) continue;   // a row's own inner button is the row's
                el.setAttribute('data-qa-i', String(i));
                out.push({el, i: i++, tag: el.tagName.toLowerCase(), qa: el.getAttribute('data-qa'), label: (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 60),
                          x: r.left, y: r.top, w: r.width, h: r.height, cursor: cs.cursor});
              }
              return JSON.stringify(out.map(({el, ...o}) => o)); })()
            """
            let s = await js(capsule.web, src) ?? "[]"
            return ["items": (try? JSONSerialization.jsonObject(with: Data(s.utf8))) as? [[String: Any]] ?? []]
        case "rest":
            await reset()
            NSApp.deactivate()
            try? await Task.sleep(nanoseconds: 200_000_000)
            return ["hidden": capsule.hidden, "visible": capsule.panel.isVisible, "active": NSApp.isActive,
                    "front_is_us": NSWorkspace.shared.frontmostApplication?.processIdentifier == getpid()]
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

    // MARK: the real input paths (the dogfood day: his clicks did nothing and fn from rest did
    // nothing, while the page-JS and socket paths passed)

    // a keyboard event as the tap hands it, through Keys.qaEvent (KeyMachine, its hold threshold,
    // App.key): {kind: fn_down|fn_up|down|up, code (down/up), fn (down/up: fn held),
    // words + per_word_ms (fn_down: what the fake mic hears once the talk starts)}
    private func keyev(_ q: [String: Any]) throws -> [String: Any] {
        guard let keyEvent else { throw Failure(description: "no key door in this app (QA.keyEvent, wired by amb-mac's Keys.qaEvent): rebuild it") }
        let kind = q["kind"] as? String ?? ""
        if kind == "fn_down", let w = q["words"] as? String, !w.isEmpty {
            if let ms = (q["per_word_ms"] as? NSNumber)?.doubleValue { voice.perWord = max(0.05, ms / 1000) }
            voice.words = w.split(separator: " ").map(String.init)
        }
        let type: CGEventType
        let e: CGEvent?
        switch kind {
        case "fn_down", "fn_up":
            e = CGEvent(keyboardEventSource: nil, virtualKey: 63, keyDown: kind == "fn_down")
            e?.type = .flagsChanged
            e?.flags = kind == "fn_down" ? .maskSecondaryFn : []
            type = .flagsChanged
        case "down", "up":
            guard let code = (q["code"] as? NSNumber)?.uint16Value else { throw Failure(description: "keyev \(kind) needs code") }
            e = CGEvent(keyboardEventSource: nil, virtualKey: code, keyDown: kind == "down")
            if q["fn"] as? Bool ?? false { e?.flags = .maskSecondaryFn }
            type = kind == "down" ? .keyDown : .keyUp
        default:
            throw Failure(description: "keyev kind: fn_down, fn_up, down, up")
        }
        guard let e else { throw Failure(description: "no CGEvent") }
        let swallowed = keyEvent(type, e)
        saw("qa>keys", ["kind": kind, "swallowed": swallowed])
        return ["swallowed": swallowed]
    }

    // one click with the mouse, as the window server would deliver it: a CGEvent left down/up at
    // the element's screen point, posted to this QA app's own pid (never the HID tap: his pointer
    // never moves and no other app can get it). What it reports, layer by layer: the window the
    // window server has at that point and the panel's mouse settings; whether AppKit saw the
    // events and which view the panel hit-tests there; whether the page got pointerdown/click on
    // that element. What it can't catch: a window of another app above the panel still lets this
    // click through (see window_at_point), and the hover/cursor under a real moving pointer.
    private func click(_ q: [String: Any]) async throws -> [String: Any] {
        guard let sel = q["selector"] as? String, !sel.isEmpty else { throw Failure(description: "click needs selector") }
        let panel = capsule.panel, web = capsule.web
        guard panel.isVisible else { throw Failure(description: "the capsule is not on screen: nothing to click (open it first)") }
        if q["deactivate"] as? Bool ?? true { NSApp.deactivate() }   // bise not frontmost: the first click must act
        let quoted = String(data: try JSONSerialization.data(withJSONObject: [sel]), encoding: .utf8) ?? "[\"\"]"
        let probe = """
        (() => {
          const el = document.querySelector(\(quoted)[0]);
          window.__qaHits = [];
          if (!window.__qaHitsOn) {
            window.__qaHitsOn = true;
            const name = g => g && g.tagName ? g.tagName.toLowerCase() + (g.id ? '#' + g.id : '') + (typeof g.className === 'string' && g.className.trim() ? '.' + g.className.trim().split(/\\s+/).join('.') : '') : String(g);
            for (const t of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'])
              document.addEventListener(t, e => window.__qaHits.push({type: t, target: name(e.target), trusted: e.isTrusted,
                inside: !!(window.__qaEl && e.target && e.target.nodeType === 1 && (window.__qaEl.contains(e.target) || e.target.contains(window.__qaEl)))}), true);
          }
          if (!el) return JSON.stringify({found: false});
          window.__qaEl = el;
          const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          const top = document.elementFromPoint(cx, cy), cs = getComputedStyle(el);
          return JSON.stringify({found: true, x: cx, y: cy, w: r.width, h: r.height,
            top_is_el: !!top && (top === el || el.contains(top)), top: top ? top.tagName.toLowerCase() + (top.id ? '#' + top.id : '') : null,
            pointer_events: cs.pointerEvents, cursor: top ? getComputedStyle(top).cursor : cs.cursor, visibility: cs.visibility, opacity: cs.opacity});
        })()
        """
        guard let s = await js(web, probe), let el = JSON.object(Data(s.utf8)) else { throw Failure(description: "click: the page didn't answer") }
        guard el["found"] as? Bool == true else { return ["selector": sel, "found": false, "clicked": false] }
        let zoom = web.pageZoom
        let x = CGFloat((el["x"] as? NSNumber)?.doubleValue ?? 0) * zoom, y = CGFloat((el["y"] as? NSNumber)?.doubleValue ?? 0) * zoom
        let inWin = web.convert(NSPoint(x: x, y: web.isFlipped ? y : web.bounds.height - y), to: nil)
        let onScreen = panel.convertPoint(toScreen: inWin)                 // AppKit: bottom-left of the main screen
        let mainH = NSScreen.screens.first?.frame.height ?? 0
        let cg = CGPoint(x: onScreen.x, y: mainH - onScreen.y)              // CG: top-left
        // the window server's view of that point
        let topNum = NSWindow.windowNumber(at: onScreen, belowWindowWithWindowNumber: 0)
        var atPoint = topNum == panel.windowNumber ? "panel" : "none"
        if topNum != panel.windowNumber, topNum > 0,
           let info = CGWindowListCopyWindowInfo([.optionIncludingWindow], CGWindowID(topNum)) as? [[String: Any]], let w = info.first {
            let pid = (w[kCGWindowOwnerPID as String] as? NSNumber)?.int32Value
            atPoint = pid == getpid() ? "this app: window \(topNum)" : "another app: \(w[kCGWindowOwnerName as String] as? String ?? "?")"
        }
        var hitView = "none", hitInWeb = false
        if let cv = panel.contentView, let v = cv.hitTest(cv.superview?.convert(inWin, from: nil) ?? inWin) {
            hitView = String(describing: type(of: v))
            hitInWeb = v === web || v.isDescendant(of: web)
        }
        // AppKit: what reaches the app's event loop
        final class Seen { var list: [[String: Any]] = [] }
        let seen = Seen()
        let mon = NSEvent.addLocalMonitorForEvents(matching: [.leftMouseDown, .leftMouseUp]) { e in
            seen.list.append(["type": e.type == .leftMouseDown ? "down" : "up",
                              "window": e.window === panel ? "panel" : (e.window.map { String(describing: type(of: $0)) } ?? "none")])
            return e
        }
        defer { if let mon { NSEvent.removeMonitor(mon) } }
        // appkit (default): the mouse event the window server hands the app once it routed the click
        // to the panel (window_at_point says whether it would), into the app's event queue
        // (NSApp.postEvent: monitors, NSApplication.sendEvent, NSWindow.sendEvent with its
        // first-click / key rules, the web view's hit test). point / window: a CGEvent posted to this
        // pid; live (20:55) AppKit got those with no window at all, so they never reach a view.
        let route = q["route"] as? String ?? "appkit"
        if route == "appkit" {
            for (t, wait) in [(NSEvent.EventType.leftMouseDown, UInt64(0)), (.leftMouseUp, UInt64(70_000_000))] {
                if wait > 0 { try? await Task.sleep(nanoseconds: wait) }
                guard let ev = NSEvent.mouseEvent(with: t, location: inWin, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                                                  windowNumber: panel.windowNumber, context: nil, eventNumber: 0, clickCount: 1, pressure: 1) else { continue }
                NSApp.postEvent(ev, atStart: false)
            }
        }
        for (t, wait) in route == "appkit" ? [] : [(CGEventType.leftMouseDown, UInt64(0)), (.leftMouseUp, UInt64(70_000_000))] {
            if wait > 0 { try? await Task.sleep(nanoseconds: wait) }
            guard let ev = CGEvent(mouseEventSource: nil, mouseType: t, mouseCursorPosition: cg, mouseButton: .left) else { continue }
            ev.setIntegerValueField(.mouseEventClickState, value: 1)
            if route == "window" {
                ev.setIntegerValueField(.mouseEventWindowUnderMousePointer, value: Int64(panel.windowNumber))
                ev.setIntegerValueField(.mouseEventWindowUnderMousePointerThatCanHandleThisEvent, value: Int64(panel.windowNumber))
            }
            ev.postToPid(getpid())
        }
        try? await Task.sleep(nanoseconds: UInt64(((q["settle_ms"] as? NSNumber)?.doubleValue ?? 400) * 1_000_000))
        let hits = (await js(web, "JSON.stringify(window.__qaHits || [])"))
            .flatMap { (try? JSONSerialization.jsonObject(with: Data($0.utf8))) as? [[String: Any]] } ?? []
        let clicked = hits.contains { ($0["type"] as? String) == "click" && ($0["inside"] as? Bool ?? false) }
        let r: [String: Any] = [
            "selector": sel, "found": true, "clicked": clicked, "route": route,
            "element": el, "screen": ["x": cg.x, "y": cg.y],
            "panel": ["window": panel.windowNumber, "visible": panel.isVisible, "key": panel.isKeyWindow,
                      "ignores_mouse": panel.ignoresMouseEvents, "level": panel.level.rawValue, "alpha": panel.alphaValue],
            "app_active": NSApp.isActive, "window_at_point": atPoint, "hit_view": hitView, "hit_in_web": hitInWeb,
            "appkit": seen.list, "dom": hits,
        ]
        saw("qa>click", ["selector": sel, "clicked": clicked])
        return r
    }

    // keys typed into the panel, as the keyboard would deliver them to this app (round 9's bar:
    // ambient-lead m_6514): each {code, flags: [cmd, shift, alt, ctrl], text?} becomes a CGEvent
    // key down + up posted to this QA app's own pid (never the HID tap: nothing reaches his front
    // app). It does not focus anything itself: the panel takes keys only if the app made it key
    // (what the user's keys would need too). Reports the panel's key state, what AppKit saw and the
    // page's keydown/input events.
    private func keys(_ q: [String: Any]) async throws -> [String: Any] {
        let seq = q["seq"] as? [[String: Any]] ?? []
        guard !seq.isEmpty else { throw Failure(description: "keys needs seq: [{code, flags?, text?}]") }
        let panel = capsule.panel, web = capsule.web
        _ = await js(web, """
        (() => { window.__qaKeys = [];
          if (!window.__qaKeysOn) { window.__qaKeysOn = true;
            const name = g => g && g.tagName ? g.tagName.toLowerCase() + (g.id ? '#' + g.id : '') : String(g);
            for (const t of ['keydown', 'keyup', 'input'])
              document.addEventListener(t, e => window.__qaKeys.push({type: t, key: e.key || null, data: e.data || null,
                meta: !!e.metaKey, target: name(e.target), trusted: e.isTrusted}), true); }
          return 'ok'; })()
        """)
        final class Seen { var list: [[String: Any]] = [] }
        let seen = Seen()
        let mon = NSEvent.addLocalMonitorForEvents(matching: [.keyDown]) { e in
            seen.list.append(["code": Int(e.keyCode), "chars": e.characters ?? "", "window": e.window === panel ? "panel" : (e.window.map { String(describing: type(of: $0)) } ?? "none")])
            return e
        }
        defer { if let mon { NSEvent.removeMonitor(mon) } }
        let keyBefore = panel.isKeyWindow
        for k in seq {
            let code = (k["code"] as? NSNumber)?.uint16Value ?? 0
            var flags: CGEventFlags = []
            for f in k["flags"] as? [String] ?? [] {
                switch f {
                case "cmd": flags.insert(.maskCommand)
                case "shift": flags.insert(.maskShift)
                case "alt": flags.insert(.maskAlternate)
                case "ctrl": flags.insert(.maskControl)
                default: break
                }
            }
            let text = k["text"] as? String
            for down in [true, false] {
                guard let ev = CGEvent(keyboardEventSource: nil, virtualKey: code, keyDown: down) else { continue }
                ev.flags = flags
                if let text, !text.isEmpty {
                    let u = Array(text.utf16)
                    ev.keyboardSetUnicodeString(stringLength: u.count, unicodeString: u)
                }
                ev.postToPid(getpid())
                try? await Task.sleep(nanoseconds: 25_000_000)
            }
            try? await Task.sleep(nanoseconds: UInt64(((q["gap_ms"] as? NSNumber)?.doubleValue ?? 60) * 1_000_000))
        }
        try? await Task.sleep(nanoseconds: 300_000_000)
        let dom = (await js(web, "JSON.stringify(window.__qaKeys || [])"))
            .flatMap { (try? JSONSerialization.jsonObject(with: Data($0.utf8))) as? [[String: Any]] } ?? []
        saw("qa>keys", ["n": seq.count, "dom": dom.count])
        return ["panel": ["visible": panel.isVisible, "key_before": keyBefore, "key": panel.isKeyWindow],
                "app_active": NSApp.isActive, "appkit": seen.list, "dom": dom]
    }

    // the panel's own pixels with their alpha (ambient m_6592 (5), pm's 'the pearl floats free',
    // and the 'no invisible margin' click check): ScreenCaptureKit's capture of this one window
    // alone (desktop independent, no shadow), saved as a PNG, then alpha sampled at the pearl's 4
    // corners and on a ring `ring` px outside its disc, and `outside` px outside the glass's edges
    // and corners (alpha 0 there: the window server lets a click through to the app below).
    private func alpha(_ q: [String: Any]) async throws -> [String: Any] {
        let panel = capsule.panel, web = capsule.web
        guard panel.isVisible else { throw Failure(description: "the capsule is not on screen") }
        let content = try await SCShareableContent.excludingDesktopWindows(false, onScreenWindowsOnly: true)
        guard let win = content.windows.first(where: { $0.windowID == CGWindowID(panel.windowNumber) }) else {
            throw Failure(description: "the panel is not among ScreenCaptureKit's windows (Screen Recording for this app?)")
        }
        let filter = SCContentFilter(desktopIndependentWindow: win)
        let conf = SCStreamConfiguration()
        let scale = CGFloat(filter.pointPixelScale)
        conf.width = Int((win.frame.width * scale).rounded())
        conf.height = Int((win.frame.height * scale).rounded())
        conf.showsCursor = false
        conf.ignoreShadowsSingleWindow = true
        let img = try await SCScreenshotManager.captureImage(contentFilter: filter, configuration: conf)
        let dir = q["dir"] as? String ?? NSTemporaryDirectory()
        try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
        let path = dir + "/" + (q["name"] as? String ?? "alpha") + ".png"
        if let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: path) as CFURL, UTType.png.identifier as CFString, 1, nil) {
            CGImageDestinationAddImage(dest, img, nil)
            _ = CGImageDestinationFinalize(dest)
        }
        // RGBA bytes, premultiplied: alpha is byte 3
        let w = img.width, h = img.height
        var px = [UInt8](repeating: 0, count: w * h * 4)
        px.withUnsafeMutableBytes { buf in
            if let ctx = CGContext(data: buf.baseAddress, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                                   space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) {
                ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
            }
        }
        let kx = CGFloat(w) / panel.frame.width, ky = CGFloat(h) / panel.frame.height
        let zoom = web.pageZoom
        // a page point (CSS px) → its alpha (nil: outside the window, where nothing of it can take a click)
        func a(_ x: CGFloat, _ y: CGFloat) -> Int? {
            let inWin = web.convert(NSPoint(x: x * zoom, y: web.isFlipped ? y * zoom : web.bounds.height - y * zoom), to: nil)
            let ix = Int((inWin.x * kx).rounded(.down)), iy = Int(((panel.frame.height - inWin.y) * ky).rounded(.down))
            guard ix >= 0, iy >= 0, ix < w, iy < h else { return nil }
            return Int(px[(iy * w + ix) * 4 + 3])
        }
        func rect(_ sel: String) async -> CGRect? {
            let qs = String(data: (try? JSONSerialization.data(withJSONObject: [sel])) ?? Data(), encoding: .utf8) ?? "[\"\"]"
            guard let s = await js(web, "(() => { const e = document.querySelector(\(qs)[0]); if (!e) return null; const r = e.getBoundingClientRect(); return JSON.stringify([r.left, r.top, r.width, r.height]); })()"),
                  let v = (try? JSONSerialization.jsonObject(with: Data(s.utf8))) as? [Double], v.count == 4, v[2] > 0, v[3] > 0 else { return nil }
            return CGRect(x: v[0], y: v[1], width: v[2], height: v[3])
        }
        var out: [String: Any] = ["png": path, "size": [w, h], "scale": scale]
        let ring = CGFloat((q["ring"] as? NSNumber)?.doubleValue ?? 6)
        if let p = await rect(q["pearl"] as? String ?? "#amb canvas.pearl, canvas.pearl") {
            let corners = [(p.minX + 0.5, p.minY + 0.5), (p.maxX - 0.5, p.minY + 0.5), (p.minX + 0.5, p.maxY - 0.5), (p.maxX - 0.5, p.maxY - 0.5)]
            let r = min(p.width, p.height) / 2 + ring
            let ringA = (0..<36).map { i -> Int? in
                let t = CGFloat(i) * .pi / 18
                return a(p.midX + r * cos(t), p.midY + r * sin(t))
            }
            out["pearl"] = ["rect": [p.minX, p.minY, p.width, p.height], "corners": corners.map { a($0.0, $0.1) as Any },
                            "ring_px": ring, "ring_max": ringA.compactMap { $0 }.max() ?? 0, "center": a(p.midX, p.midY) as Any]
        } else {
            out["pearl"] = NSNull()
        }
        let off = CGFloat((q["outside"] as? NSNumber)?.doubleValue ?? 10)
        if let g = await rect(q["glass"] as? String ?? "#amb [data-qa=glass]") {
            let pts: [(String, CGFloat, CGFloat)] = [("top", g.midX, g.minY - off), ("bottom", g.midX, g.maxY + off), ("left", g.minX - off, g.midY),
                                                    ("right", g.maxX + off, g.midY), ("top-left", g.minX - off, g.minY - off), ("top-right", g.maxX + off, g.minY - off),
                                                    ("bottom-left", g.minX - off, g.maxY + off), ("bottom-right", g.maxX + off, g.maxY + off)]
            var o: [String: Any] = [:]
            for (k, x, y) in pts { o[k] = a(x, y).map { $0 as Any } ?? "outside the window" }
            out["glass"] = ["rect": [g.minX, g.minY, g.width, g.height], "outside_px": off, "alpha_outside": o]
        } else {
            out["glass"] = NSNull()
        }
        return out
    }

    // the glass as the page draws it now, for a frame strip (ambient m_6608: no frame with a
    // scale other than 1 or a size change on a show): its rect, transform, scale and opacity, and
    // the rect the app blurs (Shape.glass from app_size)
    func glassNow() async -> [String: Any] {
        let src = """
        (() => { const g = document.querySelector('#amb [data-qa=glass]'); if (!g) return JSON.stringify(null);
          const r = g.getBoundingClientRect(), cs = getComputedStyle(g), m = cs.transform;
          let sx = 1, sy = 1;
          if (m && m !== 'none') { const v = m.match(/matrix\\(([^)]+)\\)/); if (v) { const n = v[1].split(',').map(Number); sx = Math.hypot(n[0], n[1]); sy = Math.hypot(n[2], n[3]); } }
          return JSON.stringify({rect: [r.left, r.top, r.width, r.height], transform: m, scale: [sx, sy], opacity: +cs.opacity}); })()
        """
        var out: [String: Any] = [:]
        if let s = await js(capsule.web, src), let o = JSON.object(Data(s.utf8)) { out = o }
        if let g = capsule.shape.glass { out["app"] = [g.minX, g.minY, g.width, g.height] }
        out["panel_visible"] = capsule.panel.isVisible
        return out
    }

    // the pointer over an element without moving his pointer (ambient m_6592 (4): the pushed
    // question stays while the pointer is over it): mouseMoved events at the element's point posted
    // into the app's queue with the panel's window number, `ms` long; reports the page's
    // pointerover/mouseover/pointermove on it. A real pointer also drives the window server's
    // tracking areas (cursor shape, enter/exit), which this can't.
    private func hover(_ q: [String: Any]) async throws -> [String: Any] {
        guard let sel = q["selector"] as? String, !sel.isEmpty else { throw Failure(description: "hover needs selector") }
        let panel = capsule.panel, web = capsule.web
        guard panel.isVisible else { throw Failure(description: "the capsule is not on screen") }
        let quoted = String(data: try JSONSerialization.data(withJSONObject: [sel]), encoding: .utf8) ?? "[\"\"]"
        guard let s = await js(web, """
        (() => { const el = document.querySelector(\(quoted)[0]); if (!el) return null; window.__qaHov = [];
          if (!window.__qaHovOn) { window.__qaHovOn = true;
            for (const t of ['pointerover', 'mouseover', 'pointermove', 'mouseenter', 'pointerleave'])
              document.addEventListener(t, e => window.__qaHov.push({type: t, inside: !!(window.__qaHovEl && e.target && e.target.nodeType === 1 && window.__qaHovEl.contains(e.target))}), true); }
          window.__qaHovEl = el; const r = el.getBoundingClientRect(); return JSON.stringify([r.left + r.width / 2, r.top + r.height / 2]); })()
        """), let v = (try? JSONSerialization.jsonObject(with: Data(s.utf8))) as? [Double], v.count == 2 else {
            return ["selector": sel, "found": false]
        }
        let zoom = web.pageZoom
        let base = web.convert(NSPoint(x: v[0] * zoom, y: web.isFlipped ? v[1] * zoom : web.bounds.height - v[1] * zoom), to: nil)
        let ms = (q["ms"] as? NSNumber)?.doubleValue ?? 1000
        let t0 = Date()
        var i = 0
        while Date().timeIntervalSince(t0) * 1000 < ms {
            let p = NSPoint(x: base.x + CGFloat(i % 3) - 1, y: base.y)
            if let ev = NSEvent.mouseEvent(with: .mouseMoved, location: p, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                                           windowNumber: panel.windowNumber, context: nil, eventNumber: 0, clickCount: 0, pressure: 0) {
                NSApp.postEvent(ev, atStart: false)
            }
            i += 1
            try? await Task.sleep(nanoseconds: 50_000_000)
        }
        let dom = (await js(web, "JSON.stringify(window.__qaHov || [])"))
            .flatMap { (try? JSONSerialization.jsonObject(with: Data($0.utf8))) as? [[String: Any]] } ?? []
        let over = dom.contains { ($0["inside"] as? Bool ?? false) && ["pointerover", "mouseover", "pointermove"].contains($0["type"] as? String ?? "") }
        return ["selector": sel, "found": true, "over": over, "moves": i, "dom": Array(dom.prefix(20)), "visible_after": panel.isVisible]
    }

    private func reset() async {
        speakStop()
        voiceStop()
        voice = Voice()
        setGlow(false)
        // every scene starts at rest, out of the way (SPEC §0): the glass
        // comes in only when the app's own Visibility says so (ambient's gate
        // run 2: a QA show here put 'perf is done.' in a glass nobody opened)
        if !capsule.hidden, let visIn {
            // a scene left fn held (listen): its talk ends first, a dismiss
            // alone keeps a talk's glass in
            visIn(.cancelled)
            visIn(.dismiss)
            try? await Task.sleep(nanoseconds: 800_000_000)   // the 0.6 s back into the icon
        }
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
        // shots run beside the timeline: a slow composite never delays the
        // next event (frames every 80 ms stay on time); each says when it
        // was really taken (taken_ms)
        var pending: [Task<[String: Any], Never>] = []
        for it in items {
            let wait = it.ms / 1000 - Date().timeIntervalSince(t0)
            if wait > 0.002 { try await Task.sleep(nanoseconds: UInt64(wait * 1e9)) }
            if let ev = it.ev { inject(ev) }
            if let s = it.shot {
                var sq = s
                sq["dir"] = dir
                if sq["backdrop"] == nil, let bd { sq["backdrop"] = bd }
                if sq["screen_h"] == nil, let h = q["screen_h"] { sq["screen_h"] = h }
                let at = (s["at"] as? NSNumber)?.doubleValue ?? 0
                if sq["name"] == nil { sq["name"] = String(format: "%@@%.2fs", prefix, at / 1000) }
                let taken = Date().timeIntervalSince(t0) * 1000
                let label = s["label"] ?? NSNull()
                pending.append(Task { @MainActor in
                    var r: [String: Any]
                    do { r = try await self.snapshot(sq) } catch { r = ["error": "\(error)"] }
                    r["glass"] = await self.glassNow()
                    r["at_ms"] = at
                    r["taken_ms"] = taken.rounded()
                    r["label"] = label
                    return r
                })
            }
        }
        var files: [[String: Any]] = []
        for t in pending { files.append(await t.value) }
        if let tail = (q["tail_ms"] as? NSNumber)?.doubleValue, tail > 0 {
            try await Task.sleep(nanoseconds: UInt64(tail * 1e6))
        }
        // the real core's last word comes back
        if q["restore"] as? Bool ?? true {
            for k in ["hub", "state", "phase"] { if let ev = lastCore[k] { coreEvent?(ev) } }
        }
        return ["shots": files, "played": events.count]
    }

    // MARK: another look (css)

    private var css = ""

    // the CSS as a <style id="qa-css"> after the page's own: now, and in every
    // later load (a user script next to the app's boot script)
    private func applyCSS() {
        let lit = JSON.string(["css": css]) ?? "{\"css\":\"\"}"
        let js = "(function(){var c=(\(lit)).css;var s=document.getElementById('qa-css');if(!c){if(s)s.remove();return;}if(!s){s=document.createElement('style');s.id='qa-css';}s.textContent=c;(document.head||document.documentElement).appendChild(s);})();"
        for web in [capsule.web] + edge.views.map({ $0.web }) {
            let ucc = web.configuration.userContentController
            ucc.removeAllUserScripts()
            ucc.addUserScript(WKUserScript(source: Capsule.bootJS, injectionTime: .atDocumentStart, forMainFrameOnly: true))
            ucc.addUserScript(WKUserScript(source: js, injectionTime: .atDocumentEnd, forMainFrameOnly: true))
            web.evaluateJavaScript(js, completionHandler: nil)
        }
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
            // screen_h: only the top of the screen (the capsule, the note, the top glow)
            let cropH = (q["screen_h"] as? NSNumber).map { CGFloat($0.doubleValue) }.flatMap { $0 > 0 ? min($0, sf.height) : nil } ?? sf.height
            let img = Composite.draw(size: CGSize(width: sf.width, height: cropH), scale: scale) { ctx in
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
        // only where the app blurs (amb-mac's Shape.blurRects: the glass rect from the page's
        // app_size, then the note), never the whole box: the pearl sits on the screen itself
        // (ambient m_6608: the composite blurred the whole 840x338 panel, a square under the pearl)
        let boxes = s.blurRects(panel: r.size).map { $0.offsetBy(dx: r.minX, dy: r.minY) }
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

    // MARK: the menu-bar item (ambient's gate item 7)

    // the states SPEC §0 gives the 18 px pearl, in an order where each one
    // wins over what is left of the one before (IconLook.of's precedence)
    static let menubarStates = ["still", "work", "need", "away", "done", "fail", "listen"]
    // each state's IconLook, from amb-mac's own rules (IconLook.of)
    static func menubarLook(_ s: String, count: Int) -> IconLook? {
        func of(working: Bool = false, count c: Int = 0, quiet: Bool = false, holding: Bool = false, glint: Bool = false, failed: Bool = false) -> IconLook {
            IconLook.of(working: working, count: c, quiet: quiet, holding: holding,
                        glintUntil: glint ? 1 : -1, failedUntil: failed ? 1 : -1, now: 0, reduceMotion: false)
        }
        switch s {
        case "still": return of()
        case "work": return of(working: true)
        case "need": return of(count: count)
        case "away": return of(quiet: true)
        case "done": return of(glint: true)
        case "fail": return of(failed: true)
        case "listen": return of(holding: true)
        default: return nil
        }
    }

    // each state's icon as amb-mac composes it (StatusItem.compose: the
    // pearl's frame, the ▲/☾, the rose pill; no menu-bar item is made),
    // written at 1x and 2x, transparent and on a light and a dark menu-bar
    // strip; `frames`: that many frames of a moving mood's loop (0: all)
    private func menubar(_ q: [String: Any]) async throws -> [String: Any] {
        let dir = q["dir"] as? String ?? NSTemporaryDirectory()
        try FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
        let count = (q["count"] as? NSNumber)?.intValue ?? 2
        let want = (q["frames"] as? NSNumber)?.intValue ?? 1
        let states = (q["states"] as? [String]) ?? QA.menubarStates
        let pearl = PearlFrames()
        var out: [[String: Any]] = []
        // one strip width for all (ambient m_5479: sizes compare on the sheet)
        let stripW = states.compactMap { QA.menubarLook($0, count: count) }
            .compactMap { StatusItem.compose($0, frame: 0, pearl: pearl)?.size.width }.max().map { $0 + 12 } ?? 30
        for s in states {
            guard let look = QA.menubarLook(s, count: count) else {
                throw Failure(description: "menubar state \(s): one of \(QA.menubarStates.joined(separator: ", "))")
            }
            let n = pearl.count(look.mood)
            if n == 0 { throw Failure(description: "no pearl frames for \(look.mood.rawValue) in the app bundle (the :* fallback)") }
            let frames = look.moving ? (want <= 0 ? n : min(want, n)) : 1
            var files: [String] = []
            var size = NSSize.zero
            for f in 0..<frames {
                guard let img = StatusItem.compose(look, frame: f, pearl: pearl) else { continue }
                size = img.size
                let base = dir + "/" + s + (frames > 1 ? String(format: "-%02d", f) : "")
                for (suffix, scale, strip) in [("@1x", 1.0, nil), ("@2x", 2.0, nil), (".light@2x", 2.0, "light"), (".dark@2x", 2.0, "dark")] as [(String, CGFloat, String?)] {
                    guard let cg = QA.render(img, scale: scale, strip: strip, width: strip == nil ? nil : stripW) else { continue }
                    try PNG.write(cg, base + suffix + ".png")
                    files.append(base + suffix + ".png")
                }
            }
            out.append(["state": s, "mood": look.mood.rawValue, "extra": look.extra, "count": look.count, "frames": frames,
                        "loop": n, "files": files, "size": [size.width, size.height]])
        }
        return ["states": out, "dir": dir, "strip_w": stripW]
    }

    // an image at a scale: transparent, or on a menu-bar strip (24 pt tall,
    // 6 pt each side) in the light or dark appearance
    static func render(_ img: NSImage, scale: CGFloat, strip: String?, width: CGFloat? = nil) -> CGImage? {
        let pad: CGFloat = strip == nil ? 0 : 6
        // a strip `width` wide (the widest state's): every strip the same size, the icon left-aligned
        let size = NSSize(width: max(width ?? 0, img.size.width + 2 * pad), height: strip == nil ? img.size.height : 24)
        let w = Int((size.width * scale).rounded(.up)), h = Int((size.height * scale).rounded(.up))
        guard w > 0, h > 0, let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0,
                                               space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return nil }
        if let strip {
            ctx.setFillColor(strip == "light" ? CGColor(srgbRed: 0.93, green: 0.93, blue: 0.94, alpha: 1) : CGColor(srgbRed: 0.13, green: 0.12, blue: 0.13, alpha: 1))
            ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
        }
        ctx.scaleBy(x: scale, y: scale)
        let appearance = NSAppearance(named: strip == "light" ? .aqua : .darkAqua) ?? NSAppearance.currentDrawing()
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(cgContext: ctx, flipped: false)
        appearance.performAsCurrentDrawingAppearance {
            img.draw(in: NSRect(x: pad, y: (size.height - img.size.height) / 2, width: img.size.width, height: img.size.height))
        }
        NSGraphicsContext.restoreGraphicsState()
        return ctx.makeImage()
    }

    // every frame amb-mac plays per mood (PearlFrames: the bundle's
    // <mood>-NN.png), at 1x and 2x, transparent
    private func pearlFrames(_ q: [String: Any]) throws -> [String: Any] {
        let dir = q["dir"] as? String ?? NSTemporaryDirectory()
        try FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
        let pearl = PearlFrames()
        var out: [String: Any] = [:]
        for m in [IconLook.Mood.still, .work, .listen, .done, .fail, .away] {
            let n = pearl.count(m)
            for f in 0..<n {
                guard let img = pearl.image(m, frame: f) else { continue }
                for (suffix, scale) in [("@1x", 1.0), ("@2x", 2.0)] as [(String, CGFloat)] {
                    if let cg = QA.render(img, scale: scale, strip: nil) {
                        try PNG.write(cg, dir + "/" + String(format: "%@-%02d%@.png", m.rawValue, f, suffix))
                    }
                }
            }
            out[m.rawValue] = n
        }
        return ["frames": out, "dir": dir]
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
