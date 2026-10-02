// App: the wiring. The core's events go to the capsule's page (and the
// edge pages) unchanged; the page's cmds go to the core, except the app_*
// ones the app does itself; fn and right option become talk_start /
// talk_end + a shot; the permissions are asked one at a time with
// ambient's sentence first (the page shows it; its continue button calls
// macOS's prompt). docs/ambient-app.md §4 is the contract.

import AppKit
import AVFoundation

@MainActor
final class AmbientApp: NSObject, NSApplicationDelegate {
    private var config: Config
    private let capsule = Capsule()
    private let edge = Edge()
    private let keys = Keys()
    private let core: Core
    private var notify: Notify?
    private var status: StatusItem?
    private var signals: [DispatchSourceSignal] = []

    private var phase = "idle"
    private var talking = false          // talk_start sent, no talk_end/cancel yet
    private var locked = false
    private var reduceMotion = false
    private var edgeGlow = true
    private var cards: [Card] = []
    // what a page loaded later needs: the last event of each of these kinds
    private var memory: [String: [String: Any]] = [:]
    private static let remembered: Set<String> = ["hub", "state", "phase", "main"]
    private let defaults = UserDefaults.standard

    init(config: Config) {
        self.config = config
        core = Core(config: config)
        super.init()
    }

    // MARK: launch and quit

    func applicationDidFinishLaunching(_ n: Notification) {
        try? FileManager.default.createDirectory(atPath: config.ambientDir, withIntermediateDirectories: true)
        Log.open(config.ambientDir + "/app.log")
        Log.say("app: up, pid \(getpid()), workspace \(config.workspace), bise \(config.bise), web \(config.web ?? "-")")
        writePid()
        if defaults.object(forKey: "edgeGlow") != nil { edgeGlow = defaults.bool(forKey: "edgeGlow") }
        if defaults.object(forKey: "rightOption") != nil { keys.rightOption = defaults.bool(forKey: "rightOption") }
        reduceMotion = NSWorkspace.shared.accessibilityDisplayShouldReduceMotion

        capsule.onCmd = { [weak self] in self?.command($0) }
        capsule.onReady = { [weak self] in self?.pageReady() }
        capsule.load(webDir: config.web)
        capsule.show()
        edge.load(webDir: config.web)
        edgeSetup()

        let st = StatusItem()
        st.onSpotlight = { [weak self] in self?.spotlight() }
        st.onToggle = { [weak self] in self?.toggleHidden() }
        st.isHidden = { [weak self] in self?.capsule.hidden ?? false }
        status = st

        let nt = Notify()
        nt.onAnswer = { [weak self] card, reply in self?.core.send(["cmd": "answer", "card": card, "reply": reply]) }
        nt.onOpen = { [weak self] in self?.setHidden(false) }
        notify = nt

        keys.onOut = { [weak self] in self?.key($0) }
        if Keys.trusted { keys.start() }

        core.onEvent = { [weak self] in self?.coreEvent($0) }
        core.onExit = { [weak self] _ in
            guard let self else { return }
            self.coreEvent(["ev": "hub", "up": false, "workspace": self.config.workspace])
        }
        core.start()

        observe()
        handleSignals()
    }

    func applicationWillTerminate(_ n: Notification) {
        core.kill()
        keys.stop()
        try? FileManager.default.removeItem(atPath: pidPath)
        Log.say("app: quit")
    }

    private var pidPath: String { config.ambientDir + "/app.pid" }

    private func writePid() {
        try? "\(getpid())\n".write(toFile: pidPath, atomically: true, encoding: .utf8)
    }

    private func observe() {
        let ws = NSWorkspace.shared.notificationCenter
        ws.addObserver(forName: NSWorkspace.accessibilityDisplayOptionsDidChangeNotification, object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated {
                guard let self else { return }
                self.reduceMotion = NSWorkspace.shared.accessibilityDisplayShouldReduceMotion
                self.capsule.post(["ev": "app_reduce_motion", "on": self.reduceMotion])
                self.edgeSetup()
            }
        }
        let dn = DistributedNotificationCenter.default()
        dn.addObserver(forName: .init("com.apple.screenIsLocked"), object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.locked = true }
        }
        dn.addObserver(forName: .init("com.apple.screenIsUnlocked"), object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.locked = false }
        }
        NotificationCenter.default.addObserver(forName: NSApplication.didChangeScreenParametersNotification, object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated {
                self?.capsule.screensChanged()
                self?.edge.rebuild()
            }
        }
    }

    // SIGTERM (scripts/ambient.sh stop): quit clean. SIGUSR1: switch.json.
    private func handleSignals() {
        for sig in [SIGTERM, SIGINT, SIGUSR1] {
            signal(sig, SIG_IGN)
            let s = DispatchSource.makeSignalSource(signal: sig, queue: .main)
            s.setEventHandler { [weak self] in
                MainActor.assumeIsolated {
                    guard let self else { return }
                    if sig == SIGUSR1 { self.switchWorkspace() } else { NSApp.terminate(nil) }
                }
            }
            s.resume()
            signals.append(s)
        }
    }

    private func switchWorkspace() {
        var c = config
        let webBefore = c.web
        guard c.apply(switchFile: config.ambientDir + "/switch.json") else {
            Log.say("app: switch: nothing new")
            setHidden(false)
            return
        }
        Log.say("app: switch to \(c.workspace)")
        config = c
        memory = [:]
        cards = []
        core.restart(config: c)
        if c.web != webBefore {
            capsule.load(webDir: c.web)
            edge.load(webDir: c.web)
        } else {
            capsule.reload()
            edge.reload()
        }
        setHidden(false)
    }

    // MARK: the page

    private func pageReady() {
        capsule.post(["ev": "app_reduce_motion", "on": reduceMotion])
        capsule.post(["ev": "app_settings", "edge_glow": edgeGlow])
        capsule.post(["ev": "app_hidden", "on": capsule.hidden])
        capsule.post(["ev": "app_globe", "use": globeUse()])
        for k in ["hub", "state", "phase", "main"] { if let ev = memory[k] { capsule.post(ev) } }
        firstAsk()
    }

    private func edgeSetup() {
        edge.setup(["ev": "app_reduce_motion", "on": reduceMotion])
        edge.setup(["ev": "app_settings", "edge_glow": edgeGlow])
    }

    private func command(_ cmd: [String: Any]) {
        guard let name = cmd["cmd"] as? String else { return }
        switch name {
        case "app_size":
            if let s = CapsuleShape.from(cmd, maxHeight: capsule.maxHeight) { capsule.apply(s) }
        case "app_focus":
            capsule.focus(cmd["on"] as? Bool ?? false)
        case "app_hide":
            setHidden(cmd["hidden"] as? Bool ?? cmd["on"] as? Bool ?? true)
        case "app_open_url":
            if let s = cmd["url"] as? String, let u = URL(string: s), ["http", "https", "file", "x-apple.systempreferences"].contains(u.scheme ?? "") {
                NSWorkspace.shared.open(u)
            }
        case "app_perm":
            permCommand(cmd["perm"] as? String ?? "", cmd["do"] as? String ?? "")
        case "app_setting":
            setting(cmd["key"] as? String ?? "", cmd["value"])
        case "app_ready":
            pageReady()
        case "send":
            // a spotlight send: the front window goes with it (SPEC §3)
            shoot { [weak self] in self?.core.send(cmd) }
        default:
            if name.hasPrefix("app_") { Log.say("app: unknown \(name)") } else { core.send(cmd) }
        }
    }

    private func setting(_ key: String, _ value: Any?) {
        switch key {
        case "edge_glow":
            edgeGlow = value as? Bool ?? true
            defaults.set(edgeGlow, forKey: "edgeGlow")
            capsule.post(["ev": "app_settings", "edge_glow": edgeGlow])
            edgeSetup()
        case "right_option":
            keys.rightOption = value as? Bool ?? true
            defaults.set(keys.rightOption, forKey: "rightOption")
        default:
            Log.say("app: unknown setting \(key)")
        }
    }

    // MARK: the core's events

    private func coreEvent(_ ev: [String: Any]) {
        guard let kind = ev["ev"] as? String else { return }
        if AmbientApp.remembered.contains(kind) { memory[kind] = ev }
        switch kind {
        case "phase":
            phase = ev["phase"] as? String ?? phase
            edge.post(ev)
        case "level":
            if talking { edge.post(ev) }
        case "state":
            cards = Card.list(ev)
            status?.setNeedsYou(!cards.isEmpty)
            notify?.cards(cards, quiet: !capsule.hidden && !locked)
        default:
            break
        }
        capsule.post(ev)
    }

    // MARK: keys

    private func key(_ o: KeyOut) {
        switch o {
        case .talkStart(let k):
            startTalk(k == .fn ? "fn" : "right_option", state: "down")
        case .double:
            startTalk("fn", state: "double")
        case .talkEnd:
            guard talking else { return }
            talking = false
            core.send(["cmd": "talk_end"])
            fnEvent("up")
            edge.glow(false)
        case .cancel:
            guard talking else { return }
            talking = false
            fnEvent("cancel")   // the page sends talk_cancel and says so
            edge.glow(false)
        case .tap:
            fnEvent("tap")      // the page cuts in when main speaks
        case .key(let k):
            switch k {
            case ".":
                if capsule.hidden { setHidden(false) } else { capsule.post(["ev": "app_key", "key": k]) }
            case "space":
                spotlight()
            default:
                if capsule.hidden && (k == "i" || k == "0") { setHidden(false) }
                capsule.post(["ev": "app_key", "key": k])
            }
        }
    }

    private var lastKey = "fn"

    private func fnEvent(_ state: String) {
        let ev: [String: Any] = ["ev": "app_fn", "state": state, "key": lastKey]
        capsule.post(ev)
        edge.post(ev)
    }

    private func startTalk(_ key: String, state: String) {
        lastKey = key
        if askBeforeTalk() { return }
        talking = true
        fnEvent(state)
        core.send(["cmd": "talk_start"])
        if edgeGlow && !reduceMotion { edge.glow(true) }
        shoot(then: nil)
    }

    private func spotlight() {
        if capsule.hidden { setHidden(false) }
        capsule.post(["ev": "app_key", "key": "space"])
    }

    private func toggleHidden() { setHidden(!capsule.hidden) }

    private func setHidden(_ h: Bool) {
        guard h != capsule.hidden else { return }
        if h { capsule.hide() } else { capsule.show() }
        capsule.post(["ev": "app_hidden", "on": h])
    }

    // MARK: the shot

    private var shooting = false

    // the front window to the core (shot), its chip and corners to the
    // pages, then `then` (a send waits for it, at most 1.5 s)
    private func shoot(then: (() -> Void)?) {
        guard Shot.allowed, !shooting else { then?(); return }
        shooting = true
        var done = false
        let finish = { if !done { done = true; then?() } }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { MainActor.assumeIsolated { finish() } }
        let dir = config.ambientDir + "/shots"
        Task { @MainActor [weak self] in
            let r = await Shot.take(into: dir)
            guard let self else { return }
            self.shooting = false
            if let r {
                if let p = r.path { self.core.send(["cmd": "shot", "path": p, "app": r.app, "title": r.title]) }
                let ev: [String: Any] = ["ev": "app_shot", "app": r.app, "title": r.title, "skipped": r.skipped]
                self.capsule.post(ev)
                if let b = r.bounds, !r.skipped { self.edge.corners(ev, cgBounds: b) }
            }
            finish()
        }
    }

    // MARK: permissions, one at a time (SPEC §5.8)

    private func perm(_ p: String, _ state: String) {
        capsule.post(["ev": "app_perm", "perm": p, "state": state])
    }

    private func asked(_ p: String) -> Bool { defaults.bool(forKey: "asked.\(p)") }
    private func markAsked(_ p: String) { defaults.set(true, forKey: "asked.\(p)") }

    // a refusal is said once, then never again
    private func deniedOnce(_ p: String) {
        guard !defaults.bool(forKey: "told.\(p)") else { return }
        defaults.set(true, forKey: "told.\(p)")
        perm(p, "denied")
    }

    private var trustPoll: Timer?

    // at launch: Accessibility first (nothing works without fn)
    private func firstAsk() {
        if Keys.trusted {
            if !keys.running { keys.start() }
            return
        }
        if asked("accessibility") { deniedOnce("accessibility") } else { perm("accessibility", "ask") }
        pollTrust()
    }

    // macOS has no callback for Accessibility: look every 2 s until granted
    private func pollTrust() {
        guard trustPoll == nil else { return }
        trustPoll = Timer.scheduledTimer(withTimeInterval: 2, repeats: true) { [weak self] t in
            MainActor.assumeIsolated {
                guard let self, Keys.trusted else { return }
                t.invalidate()
                self.trustPoll = nil
                self.keys.start()
                self.perm("accessibility", "granted")
            }
        }
    }

    private var micState: AVAuthorizationStatus { AVCaptureDevice.authorizationStatus(for: .audio) }

    // the first hold: the mic, then the screen, each its sentence first;
    // true = an ask is showing, no talk this time
    private func askBeforeTalk() -> Bool {
        switch micState {
        case .notDetermined: perm("mic", "ask"); return true
        case .denied, .restricted: deniedOnce("mic")
        default: break
        }
        if !Shot.allowed {
            if !asked("screen") { perm("screen", "ask"); return true }
            deniedOnce("screen")
        }
        return false
    }

    private func permCommand(_ p: String, _ action: String) {
        if action == "settings" {
            let pane = ["accessibility": "Privacy_Accessibility", "mic": "Privacy_Microphone", "screen": "Privacy_ScreenCapture"][p] ?? "Privacy"
            if let u = URL(string: "x-apple.systempreferences:com.apple.preference.security?\(pane)") { NSWorkspace.shared.open(u) }
            return
        }
        guard action == "continue" else { return }
        markAsked(p)
        switch p {
        case "accessibility":
            Keys.prompt()
            pollTrust()
        case "mic":
            AVCaptureDevice.requestAccess(for: .audio) { ok in
                DispatchQueue.main.async {
                    MainActor.assumeIsolated {
                        self.perm("mic", ok ? "granted" : "denied")
                        if !ok { self.defaults.set(true, forKey: "told.mic") }
                        // the next one right after, still one at a time
                        if ok && !Shot.allowed && !self.asked("screen") { self.perm("screen", "ask") }
                    }
                }
            }
        case "screen":
            let ok = CGRequestScreenCaptureAccess()
            perm("screen", ok ? "granted" : "denied")
            if !ok { defaults.set(true, forKey: "told.screen") }
        default:
            break
        }
    }
}
