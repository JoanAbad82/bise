// Harness: the real app's test input (harness A, lead m_7962, ops agreed
// with amb-tools m_7963-m_7968). Only when the app runs with an isolated
// home (BISE_HOME set and not ~/.bise) and AMBIENT_HARNESS=<dir> or
// BISE_AMBIENT_TEST_INPUT=<socket>; else the app refuses to start. Unlike
// --qa, the app keeps its normal path (core spawn, perms plan, focus logic,
// main menu, KeyMachine); only what would touch the user goes: no fn tap,
// no sound, no mic (talk_* never reach the core), no notification, no
// status item, no browser/Terminal/pasteboard/System Settings, and the
// panels sit far off every screen (Placement.offScreen), a guard quits the
// app if any of its windows touches a real screen (the user: 'nothing in
// his face, ever', card #428), and it never activates or takes focus.
//
// The socket: one JSON line each way, {id, op, ...} → {id, ok, ...|error}
// (qa.sock's framing). Mouse events go through NSApp.postEvent with the
// window AppKit would pick at that point (AppKit's own hit test and
// first-click rules); keys go through the tap's path first (KeyMachine:
// plain esc hides bise, fn chords) then to the window that has bise's keys,
// the way NSApplication would (⌘: the window's key equivalents, the page
// first, then the main menu; else window.sendEvent). By default no panel
// becomes really key (his keyboard stays his): a panel that takes the keys
// gets CapsulePanel.testKey; AMBIENT_HARNESS_REAL_FOCUS=1 = the real one.

import AppKit
import WebKit

@MainActor
final class Harness {
    static let ops = ["ping", "state", "mouse", "key", "type", "fn", "voice", "shot", "eval", "events", "quit"]

    // the app's doors, wired by App
    var bar: (() -> Capsule)?
    var side: (() -> Capsule?)?
    var keyEvent: ((CGEventType, CGEvent) -> Bool)?    // Keys.qaEvent: the tap's own path
    var appState: (() -> [String: Any])?
    // the core's fake voice (its words file) once it said {ev:'fake_voice', on:true}; nil = none
    var fakeVoice: String?

    let sockPath: String
    let dir: String
    private var guardTimer: Timer?
    private var listenFD: Int32 = -1
    private var acceptSrc: DispatchSourceRead?
    private struct Client { let src: DispatchSourceRead; var buf = Data() }
    private var clients: [Int32: Client] = [:]

    // every line the app says, sends or hears, numbered (op events)
    private var lines: [[String: Any]] = []
    private var seq = 0
    private let started = ProcessInfo.processInfo.systemUptime

    init(sock: String, dir: String) {
        sockPath = sock
        self.dir = dir
    }

    // MARK: what happened (events)

    func note(_ kind: String, _ body: Any) {
        seq += 1
        lines.append(["n": seq, "t": ms(), "kind": kind, "body": body])
        if lines.count > 4000 { lines.removeFirst(lines.count - 4000) }
    }

    private func ms() -> Int { Int((ProcessInfo.processInfo.systemUptime - started) * 1000) }

    // MARK: the socket

    func start() {
        try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
        unlink(sockPath)
        let fd = socket(AF_UNIX, SOCK_STREAM, 0)
        guard fd >= 0 else { Log.say("harness: no socket: \(errno)"); return }
        var addr = sockaddr_un()
        addr.sun_family = sa_family_t(AF_UNIX)
        let path = Array(sockPath.utf8CString)
        guard path.count <= MemoryLayout.size(ofValue: addr.sun_path) else {
            Log.say("harness: socket path too long: \(sockPath)"); close(fd); return
        }
        withUnsafeMutableBytes(of: &addr.sun_path) { b in for (i, c) in path.enumerated() { b[i] = UInt8(bitPattern: c) } }
        let old = umask(0o177)
        let r = withUnsafePointer(to: &addr) {
            $0.withMemoryRebound(to: sockaddr.self, capacity: 1) { bind(fd, $0, socklen_t(MemoryLayout<sockaddr_un>.size)) }
        }
        umask(old)
        guard r == 0, listen(fd, 8) == 0 else { Log.say("harness: bind/listen failed: \(errno)"); close(fd); return }
        chmod(sockPath, 0o600)
        listenFD = fd
        let src = DispatchSource.makeReadSource(fileDescriptor: fd, queue: .main)
        src.setEventHandler { [weak self] in MainActor.assumeIsolated { self?.acceptOne() } }
        src.resume()
        acceptSrc = src
        Log.say("harness: listening on \(sockPath)")
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
        let src = DispatchSource.makeReadSource(fileDescriptor: fd, queue: .main)
        src.setEventHandler { [weak self] in MainActor.assumeIsolated { self?.readable(fd) } }
        clients[fd] = Client(src: src)
        src.resume()
    }

    private func readable(_ fd: Int32) {
        var chunk = [UInt8](repeating: 0, count: 65536)
        let n = read(fd, &chunk, chunk.count)
        guard n > 0 else { drop(fd); return }
        clients[fd]?.buf.append(contentsOf: chunk[0..<n])
        while let nl = clients[fd]?.buf.firstIndex(of: 0x0A) {
            guard var c = clients[fd] else { return }
            let line = c.buf[c.buf.startIndex..<nl]
            c.buf.removeSubrange(c.buf.startIndex...nl)
            clients[fd] = c
            guard let req = JSON.object(Data(line)) else { reply(fd, ["ok": false, "error": "not a JSON object"]); continue }
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
        case "ping": return ping()
        case "state": return await state()
        case "mouse": return try await mouse(q)
        case "key": return try await key(q)
        case "type": return try await typeText(q)
        case "fn": return try await fn(q)
        case "voice":
            // the words the core's fake voice hears at the next talk (its file); then fn hold
            guard let file = fakeVoice, !file.isEmpty else {
                throw Failure(description: "the core has no fake voice (no {ev:'fake_voice', on:true} yet): talk_* stay in the app")
            }
            let words = q["words"] as? String ?? ""
            try words.write(toFile: file, atomically: true, encoding: .utf8)
            note("harness>voice", ["file": file, "chars": words.count])
            return ["file": file, "chars": words.count]
        case "shot": return try await shot(q)
        case "eval": return try await eval(q)
        case "events":
            let since = (q["since"] as? NSNumber)?.intValue ?? 0
            return ["events": lines.filter { ($0["n"] as? Int ?? 0) > since }, "last": seq]
        case "quit":
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { NSApp.terminate(nil) }
            return [:]
        default:
            throw Failure(description: "unknown op \(op) (ops: \(Harness.ops.joined(separator: ", ")))")
        }
    }

    private func sidePanel() -> Capsule? { side.flatMap { $0() } }

    private func windowInfo(_ c: Capsule?) -> Any {
        guard let c else { return NSNull() }
        let f = c.panel.frame
        return ["frame": ["x": f.minX, "y": f.minY, "w": f.width, "h": f.height], "visible": c.panel.isVisible,
                "hidden": c.hidden, "test_key": c.panel.testKey, "key": c.panel.isKeyWindow,
                "real_key": NSApp.keyWindow === c.panel, "ignores_mouse": c.panel.ignoresMouseEvents,
                "window": c.panel.windowNumber, "first_responder": c.panel.firstResponder.map { String(describing: type(of: $0)) as Any } ?? NSNull()]
    }

    private func ping() -> [String: Any] {
        let b = bar?()
        return ["pid": Int(getpid()), "mode": "test", "ops": Harness.ops, "offscreen": true,
                "bundle": Bundle.main.bundlePath, "argv": CommandLine.arguments,
                "home": ProcessInfo.processInfo.environment["BISE_HOME"] ?? "", "screens": NSScreen.screens.map { r($0.frame) }, "windows": NSApp.windows.map { ["frame": r($0.frame), "visible": $0.isVisible, "class": String(describing: type(of: $0))] as [String: Any] },
                "status_item": false, "fake_voice": fakeVoice ?? NSNull(), "bar": windowInfo(b), "side": windowInfo(sidePanel()),
                "app_active": NSApp.isActive,
                "key_window": NSApp.keyWindow.map { String(describing: type(of: $0)) as Any } ?? NSNull(),
                "front_app": NSWorkspace.shared.frontmostApplication?.bundleIdentifier ?? NSNull()]
    }

    private func model(_ c: Capsule?) async -> Any {
        guard let c else { return NSNull() }
        let s = await js(c.web, "(() => { const a = window.ambient; const m = a && a.model ? a.model() : null; return JSON.stringify(m); })()")
        return s.flatMap { (try? JSONSerialization.jsonObject(with: Data($0.utf8), options: [.fragmentsAllowed])) } ?? NSNull()
    }

    private func state() async -> [String: Any] {
        var r = appState?() ?? [:]
        r["bar"] = windowInfo(bar?())
        r["side"] = windowInfo(sidePanel())
        r["bar_model"] = await model(bar?())
        r["side_model"] = await model(sidePanel())
        return r
    }

    // MARK: the mouse

    private func r(_ f: CGRect) -> [String: Any] { ["x": f.minX, "y": f.minY, "w": f.width, "h": f.height] }

    // {window: bar|side, x, y}: the named window and its point (the page's CSS
    // px from its top-left). No screen-point lookup: the panels sit at -30000,
    // where nothing that looks windows up by screen point finds them (amb-tools
    // m_8085: every click came back window: none)
    private func target(_ q: [String: Any]) throws -> (Capsule, String, NSPoint) {
        guard let x = (q["x"] as? NSNumber)?.doubleValue, let y = (q["y"] as? NSNumber)?.doubleValue else {
            throw Failure(description: "mouse needs window: bar|side, x, y (the page's CSS px from that window's top-left)")
        }
        let name = (q["window"] as? String) == "side" ? "side" : "bar"
        guard let c = name == "side" ? sidePanel() : bar?() else { throw Failure(description: "mouse: no \(name) window yet") }
        let local = HarnessClick.local(css: CGPoint(x: x, y: y), windowHeight: c.panel.frame.height)
        return (c, name, local)
    }

    // a click as AppKit takes it: the panel's mouse rule at that point first
    // (glass only, Capsule.mouseAt, what the real pointer's moves set), then
    // the NSEvent with the window's number and its local point straight into
    // NSApp.sendEvent: NSWindow.sendEvent, its first-click and key rules, the
    // content view's hitTest, the web view. Never HID, never a screen lookup.
    private func mouse(_ q: [String: Any]) async throws -> [String: Any] {
        let (c, name, local) = try target(q)
        let w: NSWindow = c.panel
        let kind = q["kind"] as? String ?? "click"
        // no right click: a context menu is a window macOS keeps on a real screen
        if (q["button"] as? String) == "right" { throw Failure(description: "no right click in harness mode: its context menu would open on a real screen") }
        let clicks = (q["clicks"] as? NSNumber)?.intValue ?? 1
        let mods = flags(q["mods"] as? [String] ?? [])
        guard w.isVisible else { throw Failure(description: "mouse: the \(name) is not shown (open it first)") }
        c.mouseAt(w.convertPoint(toScreen: local))
        let takes = !w.ignoresMouseEvents
        guard HarnessClick.route(takesMouse: takes) == .window else {
            // outside the glass: on his screen the click goes through to the app below
            if kind == "click" || kind == "down" { for x in [bar?(), sidePanel()].compactMap({ $0 }) { x.clickedOutside() } }
            note("harness>mouse", ["kind": kind, "window": name, "through": true])
            return ["window": name, "ignores_mouse": true, "through": true]
        }
        var hit = "none"
        if let cv = w.contentView, let v = cv.hitTest(cv.superview?.convert(local, from: nil) ?? local) { hit = String(describing: type(of: v)) }
        // the page's reaction: what its document got
        _ = await js(c.web, """
        (() => { window.__hz = [];
          if (!window.__hzOn) { window.__hzOn = true;
            const n = g => g && g.tagName ? g.tagName.toLowerCase() + (g.id ? '#' + g.id : '') : String(g);
            for (const t of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'])
              document.addEventListener(t, e => { const q = e.target && e.target.closest ? e.target.closest('[data-qa]') : null;
                window.__hz.push({type: t, target: n(e.target), qa: q ? q.getAttribute('data-qa') : null, trusted: e.isTrusted}); }, true); }
          return 'ok'; })()
        """)
        var steps: [NSEvent.EventType] = []
        switch kind {
        case "click": steps = [.leftMouseDown, .leftMouseUp]
        case "down": steps = [.leftMouseDown]
        case "up": steps = [.leftMouseUp]
        default: throw Failure(description: "mouse kind: click, down, up (no move: a hover tooltip is a window macOS may put on a real screen)")
        }
        for (i, t) in steps.enumerated() {
            if i > 0 { try? await Task.sleep(nanoseconds: 60_000_000) }
            guard let ev = NSEvent.mouseEvent(with: t, location: local, modifierFlags: mods, timestamp: ProcessInfo.processInfo.systemUptime,
                                              windowNumber: w.windowNumber, context: nil, eventNumber: 0, clickCount: clicks, pressure: 1) else { continue }
            NSApp.sendEvent(ev)
        }
        try? await Task.sleep(nanoseconds: UInt64(((q["settle_ms"] as? NSNumber)?.doubleValue ?? 250) * 1_000_000))
        let dom = (await js(c.web, "JSON.stringify(window.__hz || [])"))
            .flatMap { (try? JSONSerialization.jsonObject(with: Data($0.utf8))) as? [[String: Any]] } ?? []
        note("harness>mouse", ["kind": kind, "window": name, "hit_view": hit, "dom": dom.count])
        return ["window": name, "window_number": w.windowNumber, "local": ["x": local.x, "y": local.y], "ignores_mouse": false,
                "hit_view": hit, "dom": dom, "clicked": dom.contains { $0["type"] as? String == "click" },
                "key": w.isKeyWindow, "first_responder": w.firstResponder.map { String(describing: type(of: $0)) as Any } ?? NSNull()]
    }

    // MARK: keys

    private func flags(_ names: [String]) -> NSEvent.ModifierFlags {
        var f: NSEvent.ModifierFlags = []
        for m in names {
            switch m {
            case "cmd": f.insert(.command)
            case "shift": f.insert(.shift)
            case "alt": f.insert(.option)
            case "ctrl": f.insert(.control)
            case "fn": f.insert(.function)
            default: break
            }
        }
        return f
    }

    private static let named: [String: (UInt16, String)] = [
        "left": (123, "\u{F702}"), "right": (124, "\u{F703}"), "down": (125, "\u{F701}"), "up": (126, "\u{F700}"),
        "esc": (53, "\u{1B}"), "enter": (36, "\r"), "return": (36, "\r"), "tab": (48, "\t"), "space": (49, " "),
        "delete": (51, "\u{7F}"), "backspace": (51, "\u{7F}"),
    ]
    private static let letters: [Character: UInt16] = [
        "a": 0, "s": 1, "d": 2, "f": 3, "h": 4, "g": 5, "z": 6, "x": 7, "c": 8, "v": 9, "b": 11, "q": 12, "w": 13,
        "e": 14, "r": 15, "y": 16, "t": 17, "1": 18, "2": 19, "3": 20, "4": 21, "6": 22, "5": 23, "=": 24, "9": 25,
        "7": 26, "-": 27, "8": 28, "0": 29, "]": 30, "o": 31, "u": 32, "[": 33, "i": 34, "p": 35, "l": 37, "j": 38,
        "'": 39, "k": 40, ";": 41, "\\": 42, ",": 43, "/": 44, "n": 45, "m": 46, ".": 47, "`": 50,
    ]

    private func keyCode(_ k: String) -> (UInt16, String) {
        if let n = Harness.named[k.lowercased()] { return n }
        if let c = k.lowercased().first, k.count == 1, let code = Harness.letters[c] { return (code, k) }
        return (0, k)
    }

    // the window that has bise's keys: the test-key one (or the real key one)
    private func keyTarget() -> (NSWindow, String)? {
        for (c, name) in [(sidePanel(), "side"), (bar?(), "bar")] {
            guard let c, c.panel.isVisible else { continue }
            if c.panel.isKeyWindow { return (c.panel, name) }
        }
        return nil
    }

    private func press(_ k: String, mods: [String], kind: String) async throws -> [String: Any] {
        let (code, chars) = keyCode(k)
        let f = flags(mods)
        var out: [String: Any] = ["key": k]
        for down in kind == "press" ? [true, false] : [kind == "down"] {
            // the tap first, as the real keyboard: KeyMachine may take it (fn chords) or act on it (plain esc)
            if let cg = CGEvent(keyboardEventSource: nil, virtualKey: code, keyDown: down) {
                var cf: CGEventFlags = []
                if f.contains(.command) { cf.insert(.maskCommand) }
                if f.contains(.shift) { cf.insert(.maskShift) }
                if f.contains(.option) { cf.insert(.maskAlternate) }
                if f.contains(.control) { cf.insert(.maskControl) }
                if f.contains(.function) { cf.insert(.maskSecondaryFn) }
                cg.flags = cf
                if keyEvent?(down ? .keyDown : .keyUp, cg) == true { out["tap_took"] = true; continue }
            }
            guard let (w, name) = keyTarget() else {
                out["to"] = "none"     // on his Mac: his front app gets it
                continue
            }
            out["to"] = name
            let shown = f.contains(.shift) ? chars.uppercased() : chars
            guard let ev = NSEvent.keyEvent(with: down ? .keyDown : .keyUp, location: .zero, modifierFlags: f,
                                            timestamp: ProcessInfo.processInfo.systemUptime, windowNumber: w.windowNumber,
                                            context: nil, characters: shown, charactersIgnoringModifiers: chars,
                                            isARepeat: false, keyCode: code) else { continue }
            if down && f.contains(.command) {
                // NSApplication's order: the key window's key equivalents (the page first), then the main menu
                if !w.performKeyEquivalent(with: ev) {
                    out["menu_took"] = NSApp.mainMenu?.performKeyEquivalent(with: ev) ?? false
                    if out["menu_took"] as? Bool != true { w.sendEvent(ev) }
                }
            } else {
                w.sendEvent(ev)
            }
            out["first_responder"] = w.firstResponder.map { String(describing: type(of: $0)) as Any } ?? NSNull()
        }
        try? await Task.sleep(nanoseconds: 30_000_000)
        return out
    }

    private func key(_ q: [String: Any]) async throws -> [String: Any] {
        guard let k = q["key"] as? String, !k.isEmpty else { throw Failure(description: "key needs key: left|right|up|down|esc|enter|tab|space|delete|<char>") }
        let r = try await press(k, mods: q["mods"] as? [String] ?? [], kind: q["kind"] as? String ?? "press")
        note("harness>key", r)
        return r
    }

    private func typeText(_ q: [String: Any]) async throws -> [String: Any] {
        guard let text = q["text"] as? String else { throw Failure(description: "type needs text") }
        var to: Set<String> = []
        for ch in text {
            let s = String(ch)
            let up = ch.isUppercase
            let r = try await press(up ? s.lowercased() : s, mods: up ? ["shift"] : [], kind: "press")
            if let t = r["to"] as? String { to.insert(t) }
        }
        note("harness>type", ["chars": text.count])
        return ["chars": text.count, "to": Array(to)]
    }

    // MARK: fn, as the tap hands it to KeyMachine

    private func fnEvent(_ down: Bool) -> Bool {
        guard let e = CGEvent(keyboardEventSource: nil, virtualKey: 63, keyDown: down) else { return false }
        e.type = .flagsChanged
        e.flags = down ? .maskSecondaryFn : []
        return keyEvent?(.flagsChanged, e) ?? false
    }

    private func fn(_ q: [String: Any]) async throws -> [String: Any] {
        let kind = q["kind"] as? String ?? q["state"] as? String ?? "tap"
        let from = seq
        let t0 = ms()
        switch kind {
        case "down": _ = fnEvent(true)
        case "up": _ = fnEvent(false)
        case "tap":
            _ = fnEvent(true); try? await Task.sleep(nanoseconds: 80_000_000); _ = fnEvent(false)
        case "hold":
            _ = fnEvent(true)
            let hold = (q["ms"] as? NSNumber)?.doubleValue ?? 1200
            try? await Task.sleep(nanoseconds: UInt64(hold * 1_000_000))
            _ = fnEvent(false)
        default: throw Failure(description: "fn kind: down, up, tap, hold")
        }
        try? await Task.sleep(nanoseconds: 150_000_000)
        // what left for the core and the page meanwhile, ms from the fn down
        let during = lines.filter { ($0["n"] as? Int ?? 0) > from }.map { l -> [String: Any] in
            var m = l; m["ms"] = (l["t"] as? Int ?? 0) - t0; return m
        }
        let r: [String: Any] = ["kind": kind, "events": during,
                                "words": q["words"] != nil ? "ignored: no voice boundary in this core yet" : NSNull()]
        note("harness>fn", ["kind": kind])
        return r
    }

    // MARK: shots and the page

    // the web views' own snapshots only: never a screen or window capture
    private func shot(_ q: [String: Any]) async throws -> [String: Any] {
        let what = q["what"] as? String ?? "bar"
        let c = what == "side" ? sidePanel() : bar?()
        guard let c else { throw Failure(description: "shot what: bar (= panel), side; that one doesn't exist yet") }
        let shots = dir + "/shots"
        try? FileManager.default.createDirectory(atPath: shots, withIntermediateDirectories: true)
        let path = shots + "/\(what)-\(ms()).png"
        let snap: NSImage? = await withCheckedContinuation { k in c.web.takeSnapshot(with: nil) { i, _ in k.resume(returning: i) } }
        guard let img = snap?.cgImage(forProposedRect: nil, context: nil, hints: nil) else { throw Failure(description: "shot \(what): the page gave no snapshot") }
        guard let png = NSBitmapImageRep(cgImage: img).representation(using: .png, properties: [:]) else { throw Failure(description: "shot: no PNG") }
        try png.write(to: URL(fileURLWithPath: path))
        return ["png": path, "how": "page snapshot (no native glass)", "w": img.width, "h": img.height, "visible": c.panel.isVisible]
    }

    // MARK: the guard (card #428): no window of this app on any real screen

    // false = this window touches a real screen: said, then the app quits at once
    func check(_ w: NSWindow) -> Bool {
        guard Placement.touches(w.frame, screens: NSScreen.screens.map(\.frame)) else { return true }
        Log.say("harness: GUARD: window \(String(describing: type(of: w))) #\(w.windowNumber) frame \(w.frame) visible \(w.isVisible) onscreen \(w.occlusionState.contains(.visible)) alpha \(w.alphaValue) level \(w.level.rawValue) touches a real screen \(NSScreen.screens.map(\.frame)): quitting now")
        if w.isVisible { w.orderOut(nil) }
        exit(3)
    }

    // every window AppKit has, shown or not, and every window the window
    // server has for this pid (on screen or not), against every display
    func checkAll() {
        for w in NSApp.windows { _ = check(w) }
        var n: UInt32 = 0
        CGGetActiveDisplayList(0, nil, &n)
        var ids = [CGDirectDisplayID](repeating: 0, count: Int(n))
        CGGetActiveDisplayList(n, &ids, &n)
        let displays = ids.map { CGDisplayBounds($0) }      // CG global coords, like the list's bounds
        let me = getpid()
        let list = CGWindowListCopyWindowInfo([.optionAll], kCGNullWindowID) as? [[String: Any]] ?? []
        for w in list where (w[kCGWindowOwnerPID as String] as? NSNumber)?.int32Value == me {
            guard let b = w[kCGWindowBounds as String] as? NSDictionary, let r = CGRect(dictionaryRepresentation: b) else { continue }
            if Placement.touches(r, screens: displays) {
                let num = (w[kCGWindowNumber as String] as? NSNumber)?.intValue ?? -1
                let on = (w[kCGWindowIsOnscreen as String] as? NSNumber)?.boolValue ?? false
                let alpha = (w[kCGWindowAlpha as String] as? NSNumber)?.doubleValue ?? -1
                let layer = (w[kCGWindowLayer as String] as? NSNumber)?.intValue ?? -1
                let cls = NSApp.windows.first { $0.windowNumber == num }.map { String(describing: type(of: $0)) } ?? "not an NSWindow"
                Log.say("harness: GUARD: window server window #\(num) (\(cls)) bounds \(r) onscreen \(on) alpha \(alpha) layer \(layer) touches a display \(displays): quitting now")
                for x in NSApp.windows where x.windowNumber == num { x.orderOut(nil) }
                exit(3)
            }
        }
    }

    // every 50 ms from the first run-loop tick, on a screen change, and when any window moves or shows
    func startGuard() {
        let nc = NotificationCenter.default
        for n in [NSWindow.didMoveNotification, NSWindow.didResizeNotification, NSWindow.didChangeScreenNotification,
                  NSWindow.didChangeOcclusionStateNotification, NSApplication.didChangeScreenParametersNotification] {
            nc.addObserver(forName: n, object: nil, queue: .main) { [weak self] _ in MainActor.assumeIsolated { self?.checkAll() } }
        }
        guardTimer = Timer.scheduledTimer(withTimeInterval: 0.05, repeats: true) { [weak self] _ in MainActor.assumeIsolated { self?.checkAll() } }
        checkAll()
    }

    private func js(_ web: WKWebView, _ src: String) async -> String? {
        await withCheckedContinuation { k in
            web.evaluateJavaScript(src) { v, _ in k.resume(returning: v as? String) }
        }
    }

    private func eval(_ q: [String: Any]) async throws -> [String: Any] {
        guard let src = q["js"] as? String, !src.isEmpty else { throw Failure(description: "eval needs js") }
        let c = (q["window"] as? String) == "side" ? sidePanel() : bar?()
        guard let c else { throw Failure(description: "eval: no such window yet") }
        let wrapped = "(() => { const v = (\n\(src)\n); return typeof v === 'string' ? v : JSON.stringify(v === undefined ? null : v); })()"
        return ["value": await js(c.web, wrapped) ?? NSNull()]
    }
}
