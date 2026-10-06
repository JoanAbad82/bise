// App: the wiring. The core's events go to the capsule's page (and the
// edge pages) unchanged; the page's cmds go to the core, except the app_*
// ones the app does itself; fn and right option become talk_start /
// talk_end + a shot; the permissions are asked one at a time with
// ambient's sentence first (the page shows it; its continue button calls
// macOS's prompt). docs/ambient-app.md §4 is the contract.

import AppKit
import AVFoundation
import UniformTypeIdentifiers

@MainActor
final class AmbientApp: NSObject, NSApplicationDelegate {
    var config: Config
    let capsule: Capsule
    // harness A (Harness.swift), known from the first line of init: every
    // window is made far off his screens and nothing reads TCC (card #428)
    let harnessMode: Bool
    let edge = Edge()
    let keys = Keys()
    let core: Core
    var notify: Notify?
    var sounds: SoundPlayer?
    var askedAt = 0.0             // his last ask the core took ('sent'); its answer gets the keys
    var keyFocus = KeyFocus()     // who has his keystrokes (round 9)
    var content = "none"          // the page's last app_content kind (EscRoute)
    var cardPush = CardPush()     // a card shows the bar once (lead m_8105)
    var desktop: DesktopWindow?   // bise's window (S4, DesktopWindow.swift), made at its first open

    // the state of the split-out parts (App+*.swift: extensions hold no stored properties)
    var lastKey = "fn"                    // App+Talk: the key of the talk (fn, right option)
    var shooting = false                  // App+Talk: a shot is being taken
    // App+Perms, --qa: the states macOS would have, never the real ones; all on unless
    // the QA defaults ask for a first run ('qa.firstRun': all off, so the
    // walk sees every ask), and macOS's prompts answer 'granted' at once
    lazy var fakePerms: PermState = defaults.bool(forKey: "qa.firstRun")
        ? PermState() : PermState(accessibility: .granted, mic: .granted, screen: .granted)
    var trustPoll: Timer?                 // App+Perms
    var helloOn = false                   // App+Perms: the glass shows the hello
    var askShown = false                  // App+Perms: the glass is open for a permission ask
    var globeSaid = false                 // App+Perms: the emoji picker line, once per launch
    var quietHourJob: DispatchWorkItem?   // App+Quiet: the end of his quiet hour
    var quietHourEnds: Date?              // App+Quiet: when it ends (app_quiet until_ms)
    var routeJob: DispatchWorkItem?       // App+Talk: the route line's tab, 4 s at most
    var heldCard: String?                 // a card bise's window holds (CardSeat), not yet in the bar
    var cardSeatSaid: CardSeat = .bar     // the last app_card_seat the bar's page got
    var tabWaiters: [@MainActor (String?) -> Void]?   // App+Front: one active-tab ask at a time
    var awayClock = Away()                // App+Front: while you were away (S9)
    var harnessFront: FrontRaw?           // App+Front: the harness's front-app fixture (never his apps)
    var askedAnchor: BarAnchor?           // where the next show puts the bar (S8; none = bottom centre)
    let mainMenu = MainMenuView() // the hidden main menu: ⌘Q ⌘W ⌘, ⌘H and Edit
    var status: StatusItem?
    var signals: [DispatchSourceSignal] = []
    var qa: QA?                  // --qa only: the QA channel (QA.swift)
    var harness: Harness?        // harness A only: the real app's test input (Harness.swift)
    // never the user's things: QA or harness A (his browser, Terminal,
    // pasteboard, sounds, prompts, login items, settings panes, his screen)
    var sandbox: Bool { qa != nil || harnessMode }

    var phase = "idle"
    var talking = false          // talk_start sent, no talk_end/cancel yet
    var locked = false
    var reduceMotion = false
    // slice 4: what the user set in the settings view (Settings.swift)
    var settings = AppSettings()
    var edgeGlow: Bool { settings.edgeGlow }
    var cards: [Card] = []
    var pagesURL: String?            // the hub's page server (state.pages_url)
    var menuPages: [MenuPage] = []   // "for you" in the :* menu (state.pages)
    var menuWatches: [MenuWatch] = [] // what agents watch (state.timers, roadmap B)
    var settleTalk: (() -> Void)?    // a note-or-not decision still pending
    // it knows when not to talk: a call (the mic busy elsewhere), a meeting (the calendar, opt-in)
    var quiet = QuietMachine()
    var meetingQuiet: Bool { settings.meetingQuiet }
    var calendar: CalendarProbe?
    var quietTimers: [Timer] = []
    var agents = Set<String>()
    // §8 "out of the way": the one visibility state machine (Visibility.swift)
    var vis = Visibility()
    var visJob: DispatchWorkItem?
    var seenCards: Set<String>? = nil   // nil until the first state (no burst at launch)
    var working = false
    var agentStatus: [String: String] = [:]
    // what a page loaded later needs: the last event of each of these kinds
    var memory: [String: [String: Any]] = [:]
    static let remembered: Set<String> = ["hub", "state", "phase", "main"]
    // QA keeps its own settings: never the user's asked/told marks or edge glow
    let defaults: UserDefaults
    // the pages name macOS's settings by version ("Screen & System Audio Recording" on 15+)
    let macosMajor = ProcessInfo.processInfo.operatingSystemVersion.majorVersion

    init(config: Config) {
        harnessMode = config.harness != nil
        if harnessMode {
            // never with his own home: refused before a single window exists
            let env = ProcessInfo.processInfo.environment
            guard HarnessEnv.isolated(env: env, home: NSHomeDirectoryForUser(NSUserName()) ?? NSHomeDirectory()) else {
                FileHandle.standardError.write(Data("bise ambient: harness refused: BISE_HOME must be a throwaway home, not ~/.bise (got \(env["BISE_HOME"] ?? "none"))\n".utf8))
                exit(2)
            }
            CapsulePanel.simulatedKeys = true
            Browser.blocked = true
            Capsule.blockLinks = true
            // every window of the process, AppKit's own too (its text-input
            // indicator, proof run #2), made and kept off his screens
            KeepOff.install()
            // and never in front of his apps (lead m_8679): every activation path refused
            KeepOff.installActivationGuard()
            // and ask the text input system not to show its language indicator
            // at all (this process's registration domain only, never his prefs)
            UserDefaults.standard.register(defaults: ["TSMLanguageIndicatorEnabled": false])
        }
        capsule = Capsule(offScreen: config.harness != nil)
        if config.harness != nil {
            // harness A: a fresh suite each run, never his marks
            UserDefaults.standard.removePersistentDomain(forName: "dev.bise.ambient.harness")
            defaults = UserDefaults(suiteName: "dev.bise.ambient.harness") ?? .standard
        } else {
            defaults = config.qa != nil ? (UserDefaults(suiteName: "dev.bise.ambient.qa") ?? .standard) : .standard
        }
        let c = AmbientApp.remembered(config, defaults)
        // the computer-use broker's socket: <bise home>/run (BISE_HOME, else ~/.bise)
        if let h = c.childEnv["BISE_HOME"] ?? ProcessInfo.processInfo.environment["BISE_HOME"], !h.isEmpty {
            Browser.socketPath = h + "/run/computer-use.sock"
        }
        self.config = c
        core = Core(config: c)
        super.init()
        if let h = c.harness {
            // the guard from the first run-loop tick, before anything shows
            edge.pinnedScreen = { nil }
            let hs = Harness(sock: h.sock, dir: h.dir)
            harness = hs
            hs.startGuard()
        }
    }

    // a launch from Finder or the menu bar has no --bise or --web: the last
    // ones scripts/ambient.sh gave (launchd's PATH doesn't find bise)
    static func remembered(_ config: Config, _ d: UserDefaults) -> Config {
        let fm = FileManager.default
        // QA picks its own bise; a normal launch never runs the PATH's bise
        // while a dev build is there (Config.restoring, lead m_6267)
        // QA and harness A pick their own bise (harness A: his launch's --bise as given)
        if config.harness != nil { return AmbientApp.ownBise(config) }
        var c = config.qa != nil ? config
            : config.restoring(d.dictionary(forKey: "lastLaunch"), isExe: { fm.isExecutableFile(atPath: $0) })
        if c.qa == nil, c.isDevBuild(c.bise) { d.set(c.saved, forKey: "lastLaunch") }
        if c.bise != config.bise { Log.say("app: bise \(config.bise) → \(c.bise) (the last launch's dev build)") }
        if c.bise.contains("/") { d.set(c.bise, forKey: "lastBise") }
        else if let b = d.string(forKey: "lastBise"), fm.isExecutableFile(atPath: b) { c.bise = b }
        if let w = c.web { d.set(w, forKey: "lastWeb") }
        else if let w = d.string(forKey: "lastWeb"), fm.fileExists(atPath: w) { c.web = w }
        if c.childEnv["PATH"] != nil { d.set(c.childEnv["PATH"], forKey: "lastPath") }
        else if let p = d.string(forKey: "lastPath") { c.childEnv["PATH"] = p }
        return AmbientApp.ownBise(c)
    }

    // the core's bise is a path, never PATH's 'bise' (lead m_8079): the one
    // given (or the last launch's), else the bise in or next to the bundle,
    // else "" = no bise (Core says so and doesn't start)
    static func ownBise(_ config: Config) -> Config {
        var c = config
        let fm = FileManager.default
        c.bise = BisePick.resolve(c.bise, bundle: Bundle.main.bundlePath, isExe: { fm.isExecutableFile(atPath: $0) }) ?? ""
        return c
    }

    // MARK: launch and quit

    func applicationDidFinishLaunching(_ n: Notification) {
        try? FileManager.default.createDirectory(atPath: config.ambientDir, withIntermediateDirectories: true)
        Log.open(config.ambientDir + "/app.log")
        // line 1 says which build runs and which bise (lead m_8079, one build dir)
        Log.say("app: up, pid \(getpid()), app \(Bundle.main.bundlePath) (\(BuildDir.kind(bundle: Bundle.main.bundlePath, devDir: config.dev, resolve: { URL(fileURLWithPath: $0).resolvingSymlinksInPath().path }))), bise \(config.bise.isEmpty ? "none (no --bise)" : config.bise), workspace \(config.workspace), web \(config.web ?? "-")")
        if harnessMode { harnessSetup() }
        writePid()
        settings = AppSettings.load { [defaults] in defaults.object(forKey: $0) }
        keys.rightOption = settings.rightOption
        reduceMotion = NSWorkspace.shared.accessibilityDisplayShouldReduceMotion

        // QA and harness A never together: the harness keeps the app's own paths
        if !harnessMode, let m = config.qa.flatMap(QA.Mode.init(rawValue:)) { qaSetup(m) }
        capsule.onCmd = { [weak self] in
            guard let self else { return }
            self.harness?.note("page>app", $0)
            if let qa = self.qa { qa.fromPage($0) } else { self.command($0) }
        }
        capsule.onReady = { [weak self] in self?.pageReady() }
        capsule.onHover = { [weak self] in self?.visFeed(.hover($0)) }
        capsule.onPlaced = { [weak self] in self?.sendIcon() }
        // round 9: the bar's keys (ambient m_6521): the page hears it (its
        // footer shows plain keys when focused, fn chords when pushed), and
        // a click elsewhere closes a bar he opened (never a pushed card)
        capsule.onKeyFocus = { [weak self] on in
            guard let self else { return }
            // a click on the bar (a pushed card too) took the keys; a resign
            // is the bar giving them back (KeyFocus, lead m_6551)
            _ = self.keyFocus.feed(on ? .clicked : .closed)
            self.capsule.post(["ev": "app_focused", "on": on])
            if !on && self.vis.pinned && !self.capsule.hidden { self.visFeed(.dismiss) }
        }
        capsule.watchKey()
        // a click in another app (through the glow, or anywhere): a bar he
        // opened closes, like Spotlight, and the click still goes through;
        // a pushed card: nothing (ambient m_6702)
        capsule.onClickOutside = { [weak self] in
            guard let self, self.vis.pinned, !self.capsule.hidden else { return }
            self.visFeed(.dismiss)
        }
        capsule.load(webDir: config.web)
        mainMenu.on = { [weak self] in self?.menuAct($0) }
        mainMenu.install()
        // at rest nothing on screen: the capsule shows when there is something to see
        edge.load(webDir: config.web)
        edgeSetup()

        // QA: no menu-bar item, no macOS notification, never the real fn
        if qa == nil && harness == nil { statusAndKeys() }
        // harness A: no status item, no banner, never the real fn tap; the
        // socket's keys take the tap's path (Keys.qaEvent → KeyMachine → key)
        if harness != nil { keys.onOut = { [weak self] in self?.key($0) } }
        // QA never plays a sound on his speaker (it logs the cue)
        if !sandbox { sounds = SoundPlayer() }

        core.onEvent = { [weak self] in
            guard let self else { return }
            self.harness?.note("core>app", $0)
            // amb-core a7332576: its first line in harness mode, words from a file, no mic or speaker
            if $0["ev"] as? String == "fake_voice", let hs = self.harness {
                hs.fakeVoice = $0["on"] as? Bool == true ? ($0["words"] as? String ?? "") : nil
                Log.say("harness: core fake voice \(hs.fakeVoice.map { "on (\($0))" } ?? "off")")
            }
            if let qa = self.qa { qa.fromCore($0) } else { self.coreEvent($0) }
        }
        core.onExit = { [weak self] _ in
            guard let self else { return }
            self.harness?.fakeVoice = nil   // a restarted core says it again (or not)
            self.coreEvent(["ev": "hub", "up": false, "workspace": self.config.workspace])
        }
        core.start()

        observe()
        handleSignals()
        if !sandbox { startQuiet() }   // QA and the harness never read the user's mic state or calendar
    }

    func statusAndKeys() {
        let st = StatusItem()
        st.onSpotlight = { [weak self] in self?.spotlight() }
        st.onToggle = { [weak self] in self?.toggleByHand() }
        st.onSettings = { [weak self] in self?.settingsView() }
        // a left click toggles: a second click closes the bar (the user, main m_6965)
        st.onOpen = { [weak self] in
            guard let self else { return }
            switch IconClick.act(shown: !self.capsule.hidden) {
            case .close: self.visFeed(.dismiss)
            case .open: self.menuView()
            }
        }
        st.onPage = { Browser.open($0) }
        st.onCard = { [weak self] id in
            // bise open on that card: the inbox (fn + i) at it
            guard let self else { return }
            self.visFeed(.open)
            self.capsule.post(["ev": "app_key", "key": "i", "card": id])
        }
        st.pages = { [weak self] in self?.menuPages ?? [] }
        st.watches = { [weak self] in self?.menuWatches ?? [] }
        // stop watching: the core asks the hub (every_stop), the agent is told
        st.onStopWatch = { [weak self] id in self?.toCore(["cmd": "every_stop", "id": id]) }
        st.cards = { [weak self] in self?.cards ?? [] }
        st.noAccess = { [weak self] in self.map { $0.permNow().accessibility != .granted } ?? false }
        st.onAccess = { [weak self] in self?.permDo(.settings(.accessibility)) }
        st.isHidden = { [weak self] in self?.capsule.hidden ?? false }
        st.onWindow = { [weak self] in self?.openWindow(nil) }
        st.onDrop = { [weak self] items, link, png in self?.dropped(items, link: link, png: png) }
        st.onQuietHour = { [weak self] in self?.quietHour() }
        st.quietHourEnds = { [weak self] in self?.quietHourEnds }
        status = st
        st.reduceMotion = reduceMotion
        // the icon moved (another item came, the menu bar changed screens)
        NotificationCenter.default.addObserver(forName: NSWindow.didMoveNotification, object: st.iconWindow, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.sendIcon() }
        }

        let nt = Notify()
        nt.onAnswer = { [weak self] card, reply in self?.toCore(["cmd": "answer", "card": card, "reply": reply]) }
        nt.onOpen = { [weak self] in self?.agentsView() }
        // the user: never a silent ignore (a card due while hidden and no banner)
        nt.onRefused = { [weak self] in self?.problem("notifications") }
        notify = nt

        keys.onOut = { [weak self] in self?.key($0) }
        if Keys.trusted {
            keys.start()
        } else {
            // never a silent fn (the dogfood's first launch): say why in the log
            Log.say("keys: no Accessibility for this binary (System Settings → Privacy & Security → Accessibility: remove 'bise ambient', add \(Bundle.main.bundlePath))")
        }
    }

    // the QA channel's doors into the app (QA.swift; only with --qa)
    func qaSetup(_ mode: QA.Mode) {
        let q = QA(mode: mode, dir: config.ambientDir, capsule: capsule, edge: edge)
        q.coreEvent = { [weak self] in self?.coreEvent($0) }
        q.keyOut = { [weak self] in self?.key($0) }
        q.keyEvent = { [weak self] t, e in self?.keys.qaEvent(t, e) ?? false }
        // statusAndKeys() never runs with --qa (no tap, no menu-bar item): the machine's outputs
        // still go to App.key, or a key event through qaEvent dies in KeyMachine (live, 20:47)
        keys.onOut = { [weak self] in self?.key($0) }
        q.pageCmd = { [weak self] in self?.command($0) }
        q.sendCore = { [weak self] in self?.core.send($0) }
        q.visIn = { [weak self] in self?.visFeed($0) }
        q.reduceMotionIn = { [weak self] in self?.setReduceMotion($0) }
        q.keyEvent = { [weak self] t, e in self?.keys.qaEvent(t, e) ?? false }
        q.menuDump = { [weak self] in self?.menuDump() ?? [] }
        q.menuStopWatch = { [weak self] in self?.menuStopWatch($0) }
        q.menuCard = { [weak self] id in
            // as the real card row (StatusItem.onCard): bise open on that card
            guard let self else { return }
            self.visFeed(.open)
            self.capsule.post(["ev": "app_key", "key": "i", "card": id])
        }
        qa = q
        q.start()
    }

    // every cmd for the core: QA mode fakes the voice and drops writes when read-only
    func toCore(_ cmd: [String: Any]) {
        if let qa, !qa.allow(cmd) { return }
        if let h = harness {
            h.note("app>core", cmd)
            // harness A: talk_* only to a core with a fake voice (it never opens the mic)
            if let c = cmd["cmd"] as? String, !HarnessEnv.forward(c, fakeVoice: h.fakeVoice != nil) {
                Log.say("harness: \(c) not sent to the core (no fake voice: it would open the mic)")
                return
            }
        }
        core.send(cmd)
    }

    func applicationWillTerminate(_ n: Notification) {
        core.kill()
        keys.stop()
        qa?.stop()
        harness?.stop()
        try? FileManager.default.removeItem(atPath: pidPath)
        Log.say("app: quit")
    }

    var pidPath: String { config.ambientDir + "/app.pid" }

    func writePid() {
        try? "\(getpid())\n".write(toFile: pidPath, atomically: true, encoding: .utf8)
    }

    // reduced motion (SPEC §1): the system's setting, or QA's (--qa: its
    // scenes set it, and a page reload gets QA's value back, never the system's)
    func setReduceMotion(_ on: Bool) {
        reduceMotion = on
        status?.reduceMotion = on
        capsule.post(["ev": "app_reduce_motion", "on": on])
        edgeSetup()
    }

    func observe() {
        let ws = NSWorkspace.shared.notificationCenter
        ws.addObserver(forName: NSWorkspace.accessibilityDisplayOptionsDidChangeNotification, object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated {
                guard let self, self.qa == nil else { return }   // QA sets its own
                self.setReduceMotion(NSWorkspace.shared.accessibilityDisplayShouldReduceMotion)
            }
        }
        let dn = DistributedNotificationCenter.default()
        dn.addObserver(forName: .init("com.apple.screenIsLocked"), object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.locked = true; self?.sayVisible(); self?.awayLeft() }
        }
        dn.addObserver(forName: .init("com.apple.screenIsUnlocked"), object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.locked = false; self?.sayVisible(); self?.awayBack(unlock: true) }
        }
        // sleep and wake: the core alive, the tap on, the capsule on a real screen
        ws.addObserver(forName: NSWorkspace.screensDidSleepNotification, object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.asleep = true; self?.sayVisible(); self?.awayLeft() }
        }
        for name in [NSWorkspace.didWakeNotification, NSWorkspace.screensDidWakeNotification] {
            ws.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in
                MainActor.assumeIsolated { self?.woke() }
            }
        }
        // a full-screen front app is quiet (SPEC §0): checked on app and Space changes
        for name in [NSWorkspace.didActivateApplicationNotification, NSWorkspace.activeSpaceDidChangeNotification] {
            ws.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in
                MainActor.assumeIsolated { self?.checkFullScreen() }
            }
        }
        // the spotlight's 'in front' row follows his app switches (S9, name only)
        ws.addObserver(forName: NSWorkspace.didActivateApplicationNotification, object: nil, queue: .main) { [weak self] n in
            let app = n.userInfo?[NSWorkspace.applicationUserInfoKey] as? NSRunningApplication
            MainActor.assumeIsolated { self?.frontSwitched(app) }
        }
        // the capsule covered by a full-screen window or another Space: no drawing
        NotificationCenter.default.addObserver(forName: NSWindow.didChangeOcclusionStateNotification, object: capsule.panel, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.sayVisible() }
        }
        // another app came in front of bise's window: a card it held comes to the bar (CardSeat)
        NotificationCenter.default.addObserver(forName: NSApplication.didResignActiveNotification, object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.cardSeatChanged() }
        }
        NotificationCenter.default.addObserver(forName: NSApplication.didChangeScreenParametersNotification, object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated {
                self?.capsule.screensChanged()
                self?.edge.rebuild()
            }
        }
    }

    var asleep = false

    func woke() {
        Log.say("app: wake")
        asleep = false
        if !sandbox { core.check(); keys.reenable() } else { core.check() }
        capsule.screensChanged()
        edge.rebuild()
        sayVisible()
        awayBack(unlock: false)
    }

    // app_visible {on}: the page stops drawing (the orb's frames) while
    // nobody can see it: hidden, covered, the screen locked or asleep
    var visibleSaid: Bool?
    func sayVisible() {
        let on = !capsule.hidden && !locked && !asleep && capsule.panel.occlusionState.contains(.visible)
        guard on != visibleSaid else { return }
        visibleSaid = on
        capsule.post(["ev": "app_visible", "on": on])
    }

    // SIGTERM (scripts/ambient.sh stop): quit clean. SIGUSR1: switch.json.
    func handleSignals() {
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

    func switchWorkspace() {
        var c = config
        let webBefore = c.web
        guard c.apply(switchFile: config.ambientDir + "/switch.json") else {
            Log.say("app: switch: nothing new")
            visFeed(.open)
            return
        }
        c = AmbientApp.ownBise(c)   // a switch's bise is a path too, never PATH's
        Log.say("app: switch to \(c.workspace), bise \(c.bise.isEmpty ? "none" : c.bise)")
        config = c
        capsule.post(["ev": "app_bise", "path": c.bise.isEmpty ? NSNull() : c.bise as Any])
        // the next launch without scripts/ambient.sh comes back here
        if !sandbox, c.isDevBuild(c.bise) { defaults.set(c.saved, forKey: "lastLaunch") }
        memory = [:]
        cards = []
        agents = []
        seenCards = nil
        working = false
        statusIcon()
        core.restart(config: c)
        if c.web != webBefore {
            capsule.load(webDir: c.web)
            edge.load(webDir: c.web)
        } else {
            capsule.reload()
            edge.reload()
        }
        visFeed(.open)
    }

    // MARK: the page

    func pageReady() {
        capsule.post(["ev": "app_reduce_motion", "on": reduceMotion])
        capsule.post(settingsEvent())
        capsule.post(["ev": "app_hidden", "on": capsule.hidden])
        capsule.post(["ev": "app_globe", "use": globeUse()])
        // the bise the 'start bise in a terminal' row names and runs (lead m_8079)
        capsule.post(["ev": "app_bise", "path": config.bise.isEmpty ? NSNull() : config.bise as Any])
        visibleSaid = nil
        sayVisible()
        sendIcon()
        for k in ["hub", "state", "phase", "main"] { if let ev = memory[k] { capsule.post(ev) } }
        if quiet.on { capsule.post(["ev": "app_quiet", "on": true, "why": quiet.why]) }
        firstAsk()
    }

    func edgeSetup() {
        edge.setup(["ev": "app_reduce_motion", "on": reduceMotion])
        edge.setup(settingsEvent())
    }

    func command(_ cmd: [String: Any]) {
        guard let name = cmd["cmd"] as? String else { return }
        switch name {
        case "app_size":
            if let s = CapsuleShape.from(cmd, maxHeight: capsule.maxHeight) { capsule.apply(s) }
        case "app_focus":
            let on = cmd["on"] as? Bool ?? false
            if on { visFeed(.typing(true)); capsule.focus(true) } else { capsule.focus(false); visFeed(.typing(false)) }
        case "app_hide":
            visFeed(.dismiss)
        case "app_content":
            // what the page has to show (amb-web): talk, type, answer, got and
            // needs come from the events the app sees itself; the page adds
            // the short lines (done, failed, a page ready, a key's answer)
            let kind = cmd["kind"] as? String ?? ""
            content = kind
            routeLine(kind == "got" && cmd["route"] as? Bool == true)
            // anything else on the glass ends the hello's claim on it
            if kind != "hello" && kind != "none" { helloOn = false }
            switch kind {
            case "line": visFeed(.line)   // never shows bise by itself (SPEC §0)
            case "open": visFeed(.open)
            case "needs":
                // once per card: the same card said again after a dismiss stays in the icon
                let card = CardPush.key(card: cmd["card"].flatMap { $0 is NSNull ? nil : "\($0)" },
                                        project: cmd["project"] as? String)
                // bise's window in front and key holds it above its composer (CardSeat);
                // a held card isn't counted as shown: it comes to the bar when the window goes
                if cardSeat() == .window {
                    holdCard(card ?? "?")
                } else {
                    heldCard = nil
                    sayCardSeat(.bar)
                    if cardPush.shows(card: card) { visFeed(.card) } else { capsule.refreshMouse() }
                }
            case "batch":
                // the cards held while quiet, now it's over (S9, amb-web m_9033): one bar for them
                let cards = (cmd["cards"] as? [Any] ?? []).map { "\($0)" }
                if let key = CardPush.batchKey(cards) {
                    heldCard = nil
                    sayCardSeat(.bar)
                    if cardPush.shows(card: key) { Log.say("app: \(cards.count) cards held while quiet come to the bar"); visFeed(.card) }
                }
            case "away":
                // the away card (S9, amb-web 2d87bf28): the bar once for it, before any list
                let since = cmd["since"].map { "\($0)" } ?? ""
                if cardPush.shows(card: "away:" + since) { Log.say("app: the away card"); visFeed(.card) }
            case "none":
                // the hello is over (5 s, or fn, esc, a click): its glass goes
                if helloOn { helloOn = false; visFeed(.dismiss) }
            default: break
            }
        case "app_show":
            // the page asks: for n s, or open until dismissed
            visFeed(.show((cmd["for"] as? NSNumber)?.doubleValue))
        case "app_open_url":
            // a page: its tab forward in a running Chromium browser, else a new tab (§2.8)
            if let s = cmd["url"] as? String, let u = URL(string: s), ["http", "https", "file", "x-apple.systempreferences"].contains(u.scheme?.lowercased() ?? "") {
                if let qa { qa.opened(s) } else { Browser.open(s) }
            }
        case "app_copy":
            // ⌘ C on a row or an answer (amb-web d16054d8): his pasteboard;
            // QA never touches it
            guard let text = cmd["text"] as? String, !text.isEmpty else { return }
            if sandbox { Log.say("app: qa: copy \(text.count) chars"); return }
            NSPasteboard.general.clearContents()
            NSPasteboard.general.setString(text, forType: .string)
        case "app_quit":
            // the panel's ⋯ menu 'quit bise ambient' (amb-web 124f6853): ⌘Q's own path
            if let a = MainMenu.pageCmd(name) { menuAct(a) }
        case "app_run_bise":
            runBise()
        case "app_perm":
            permCommand(cmd["perm"] as? String ?? "", cmd["do"] as? String ?? "")
        case "app_setting":
            setting(cmd["key"] as? String ?? "", cmd["value"])
        case "app_ready":
            pageReady()
        case "send":
            // a spotlight send: the front window goes with it (SPEC §3)
            shoot { [weak self] in self?.toCore(cmd) }
        case "app_quiet_hour":
            // the dropdown's 'quiet for 1 h' (on true), its end (on false), or a toggle
            quietHour(cmd["on"] as? Bool)
        case "open_in":
            openIn(cmd)
        case "app_window":
            // ⏎ in the bar, a card, the spotlight: open it in bise's window (S4)
            guard let r = WinRoute.from(route: cmd["route"] as? String, open: cmd["open"] as? [String: Any], current: config.workspace) else {
                Log.say("app: app_window: no route in \(cmd)"); return
            }
            openWindow(r)
            if !capsule.hidden { visFeed(.dismiss) }
        default:
            if name.hasPrefix("app_") { Log.say("app: unknown \(name)") } else { toCore(cmd) }
        }
    }

    func settingsEvent() -> [String: Any] {
        settings.event(macos: macosMajor, radius: Double(capsule.radius), login: !sandbox ? LoginItem.state : .off)
    }

    // app_setting {key, value} from the settings view (fn + ,): app_settings
    // goes back after every change, so the page shows what really holds
    func setting(_ key: String, _ value: Any?) {
        guard let c = SettingChange.parse(key: key, value: value) else {
            Log.say("app: unknown setting \(key)")
            return
        }
        switch c {
        case .meetingQuiet(let on):
            setMeetingQuiet(on)      // asks for the calendar first; posts when settled
            return
        case .launchAtLogin(let on):
            if !sandbox { LoginItem.set(on) }   // QA never touches the user's login items
        case .skipPick:
            pickSkipApps()
            return
        default:
            change(c)
        }
        capsule.post(settingsEvent())
    }

    // a stored setting changes: kept, then what follows from it
    func change(_ c: SettingChange) {
        settings = settings.applying(c)
        settings.store { [defaults] in defaults.set($1, forKey: $0) }
        switch c {
        case .edgeGlow: edgeSetup()
        case .rightOption(let on): keys.rightOption = on
        case .voiceAnswers: sayVoice()
        default: break
        }
    }

    // 'can't reach bise' → 'start bise in a terminal' (amb-web d16054d8):
    // the core gets a fresh start at once, and Terminal opens a .command
    // file that runs bise in his workspace (opening a file needs no
    // Automation permission, unlike scripting Terminal). QA logs it only.
    func runBise() {
        // the app's own bise, never PATH's (lead m_8079)
        guard !config.bise.isEmpty else { Log.say("app: run bise: no bise (launch the app with --bise <path>)"); return }
        core.restart(config: config)
        let path = config.ambientDir + "/start-bise.command"
        let script = Config.startBiseScript(bise: config.bise, workspace: config.workspace,
                                            appRoot: config.childEnv["BISE_APP_ROOT"])
        if sandbox { Log.say("app: qa: run bise (\(path))"); return }
        do {
            try script.write(toFile: path, atomically: true, encoding: .utf8)
            try FileManager.default.setAttributes([.posixPermissions: 0o755], ofItemAtPath: path)
        } catch {
            Log.say("app: run bise: can't write \(path): \(error)")
            return
        }
        let term = URL(fileURLWithPath: "/System/Applications/Utilities/Terminal.app")
        NSWorkspace.shared.open([URL(fileURLWithPath: path)], withApplicationAt: term, configuration: NSWorkspace.OpenConfiguration())
        Log.say("app: run bise in Terminal: \(config.bise) in \(config.workspace.isEmpty ? "~/bise" : config.workspace)")
    }

    // ambient's sounds (Sounds.swift): the plan says which, the player plays
    // it; QA logs the cue and never plays on his speaker
    func cue(_ c: SoundCue) {
        let gate = SoundGate(setting: settings.sounds, uiSounds: SoundPlayer.uiSoundsOn, quiet: quiet.on,
                             focus: SoundPlayer.focusOn)
        guard let s = SoundPlan.sound(for: c, gate) else { return }
        if sandbox { Log.say("app: qa: sound \(s.rawValue)"); return }
        sounds?.play(s)
    }

    // voice answers off: the core never speaks main's answers (text only)
    func sayVoice() {
        // harness A: never his speaker
        toCore(["cmd": "voice", "on": harness == nil && settings.voiceAnswers])
    }

    // the macOS app picker for the never-seen list (ambient's words)
    func pickSkipApps() {
        guard !sandbox else { Log.say("app: qa: no app picker"); return }
        let p = NSOpenPanel()
        p.title = SettingsWords.pickTitle
        p.message = SettingsWords.pickTitle
        p.prompt = SettingsWords.pickAdd
        p.directoryURL = URL(fileURLWithPath: "/Applications")
        p.allowedContentTypes = [.application]
        p.allowsMultipleSelection = true
        p.canChooseDirectories = false
        p.treatsFilePackagesAsDirectories = false
        NSApp.activate(ignoringOtherApps: true)
        p.begin { [weak self] r in
            MainActor.assumeIsolated {
                guard let self else { return }
                if r == .OK {
                    for u in p.urls {
                        let b = Bundle(url: u)
                        let info = b?.localizedInfoDictionary ?? [:]
                        let app = skipApp(bundleID: b?.bundleIdentifier,
                                          displayName: (info["CFBundleDisplayName"] ?? b?.object(forInfoDictionaryKey: "CFBundleDisplayName")) as? String,
                                          bundleName: (info["CFBundleName"] ?? b?.object(forInfoDictionaryKey: "CFBundleName")) as? String,
                                          file: u.path)
                        if let app { self.change(.skipAdd(app)) }
                    }
                }
                self.capsule.post(self.settingsEvent())
            }
        }
    }

    // the menu-bar menu's rows as JSON (QA reads them: in --qa there is no
    // menu-bar item, so they're built from the same state the item uses)
    func menuDump() -> [[String: Any]] {
        let words = (talk: MenuWords.talk, talkKeys: MenuWords.talkKeys, show: MenuWords.show, hide: MenuWords.hide,
                     hideKeys: MenuWords.hideKeys, settings: SettingsWords.menu, settingsKeys: SettingsWords.menuKeys, quit: MenuWords.quit)
        return MenuRows.items(cards: cards.map { MenuCard(id: $0.id, agent: $0.agent, text: $0.text) },
                              pages: menuPages, watches: menuWatches, hidden: capsule.hidden, words: words).map(\.json)
    }

    // QA's 'stop watching' click: what the menu's row does
    func menuStopWatch(_ id: Int) { toCore(["cmd": "every_stop", "id": id]) }

    // MARK: the core's events

    func coreEvent(_ ev: [String: Any]) {
        guard let kind = ev["ev"] as? String else { return }
        desktop?.post(ev)   // bise's window's page hears every core event too
        if AmbientApp.remembered.contains(kind) { memory[kind] = ev }
        if let u = ev["pages_url"] as? String, !u.isEmpty { pagesURL = u }
        defer { Browser.pagesURL = pagesURL }
        // a (re)started core speaks by default: voice answers off is said again
        if kind == "hub", ev["up"] as? Bool == true, !settings.voiceAnswers || harness != nil { sayVoice() }
        switch kind {
        case "phase":
            phase = ev["phase"] as? String ?? phase
            visFeed(.phase(phase))
            if phase == "failed" { status?.failed() }
            statusIcon()
            edge.post(ev)
        case "level":
            if talking { edge.post(ev) }
        case "page":
            if ev["state"] as? String == "ready" { status?.glint() }   // a page ready: the icon only
            if pagesURL == nil, let u = ev["url"] as? String { pagesURL = PageOpen.pagesBase(fromPageURL: u) }
            // a page you're waiting for opens in front, without fn + o (ambient-pages §2.8)
            if ev["front"] as? Bool == true, let url = ev["url"] as? String, PageOpen.isWeb(url) {
                if let qa { qa.opened(url) } else { Browser.open(url) }
            }
        case "state":
            cards = Card.list(ev)
            menuPages = MenuPage.list(ev)
            menuWatches = MenuWatch.list(ev)
            if pagesURL == nil, let p = (ev["pages"] as? [[String: Any]])?.first, let u = p["url"] as? String {
                pagesURL = PageOpen.pagesBase(fromPageURL: u)
            }
            let list = ev["agents"] as? [[String: Any]] ?? []
            agents = Set(list.compactMap { $0["name"] as? String })
            // an agent turning done or failed: the icon's glint or stop (SPEC §0)
            var now: [String: String] = [:]
            for a in list { if let n = a["name"] as? String { now[n] = a["status"] as? String ?? "" } }
            for (n, st) in now where agentStatus[n] != nil && agentStatus[n] != st {
                if st == "done" { status?.glint() }
                if st == "failed" { status?.failed() }
            }
            agentStatus = now
            working = list.contains { $0["working"] as? Bool == true }
            statusIcon()
            // a new item that needs you: the capsule shows it for 6 s
            let ids = Set(cards.map(\.id))
            cue(.cards(now: ids, seen: seenCards))
            // (amb-tools m_8716, D: this path showed the bar for a new card while
            // bise's window was in front and key; the card's seat decides here too)
            if let seen = seenCards, let fresh = cards.last(where: { !seen.contains($0.id) }) {
                if cardSeat() == .window {
                    holdCard(fresh.id)
                } else {
                    visFeed(.card)
                }
            }
            seenCards = ids
            // macOS notifications: the screen locked or you away, not "hidden" (§8)
            notify?.cards(cards, quiet: !locked && !away)
        case "sent":
            askedAt = uptime
            cue(.sent)
            visFeed(.sent)
        case "main":
            visFeed(.mainText)
            // round 9: the answer to his own ask has the keys (he just asked)
            if askedAt > 0, uptime - askedAt < 600 { askedAt = 0; takeKeys(.answerToAsk) }
        default:
            break
        }
        capsule.post(ev)
    }

    func menuAct(_ a: MenuAct) {
        switch a {
        case .window:
            // ⌘0 wherever bise has the keys (the bar included): the window on bise,
            // like the menu's 'open bise ⌘0' (lead m_9077); the bar steps aside
            Log.say("app: ⌘0")
            if !capsule.hidden { visFeed(.dismiss) }
            openWindow("bise")
        case .quit:
            Log.say("app: ⌘Q")
            NSApp.terminate(nil)
        case .settings:
            if let d = desktop, d.window.isKeyWindow { d.open("settings") } else { settingsView() }
        case .hide:
            if let d = desktop, !d.hidden, d.window.isKeyWindow, !harnessMode { NSApp.hide(nil) }
            if !capsule.hidden { visFeed(.dismiss) }
        case .close:
            switch MainMenu.close(windowKey: desktop?.window.isKeyWindow ?? false, windowShown: desktop.map { !$0.hidden } ?? false,
                                  barShown: !capsule.hidden) {
            case .window: desktop?.close()
            case .bar: visFeed(.dismiss)
            case .nothing: break
            }
        case .edit:
            break   // the responder chain does it
        }
    }

    // what he opens takes the keys like Spotlight (round 9, ambient m_6521):
    // fn space, fn 0, fn i, fn , and a click on the menu-bar pearl; what
    // bise pushes (a question, the drafts card, an answer) never does.
    // QA never takes his keys.
    func takeKeys(_ why: KeyFocus.In = .openedByHand) {
        guard qa == nil else { return }
        if keyFocus.feed(why) == .take || !capsule.panel.isKeyWindow { capsule.focus(true) }
    }

    // a menu-bar click: what's going on (the agents and the inbox, fn + 0)
    // where the bar shows (S8, Placement.anchorAtShow): asked for the next
    // show, or the bar moves now; leaving the dropdown tells the page
    func anchor(_ a: BarAnchor) {
        guard !capsule.hidden else { askedAnchor = a; return }
        if case .menu = capsule.anchor, a != capsule.anchor { capsule.post(["ev": "app_menu", "on": false]) }
        capsule.setAnchor(a)
    }

    // a click on the pearl (S8): the dropdown, the bar's page in its menu
    // pane under the icon; the native menu when the page isn't up
    // (harness A: no status item, its fake icon rect off-screen; false = the fallback menu instead)
    @discardableResult
    func menuView(icon fake: NSRect? = nil, pageUp: Bool? = nil) -> Bool {
        guard pageUp ?? capsule.ready, let icon = fake ?? status?.iconRect else { status?.fallbackMenu(); return false }
        anchor(.menu(icon))
        visFeed(.open)
        capsule.post(["ev": "app_menu", "on": true])
        takeKeys()
        return true
    }

    func agentsView() {
        anchor(.top)
        morning()
        visFeed(.open)
        capsule.post(["ev": "app_key", "key": "0"])
        takeKeys()
    }

    // fn , or the menu's settings…: the settings view (amb-web draws it,
    // app_settings carries what it shows)
    func settingsView() {
        anchor(.top)
        visFeed(.open)
        capsule.post(settingsEvent())
        capsule.post(["ev": "app_key", "key": ","])
        takeKeys()
    }

    // fn . or the menu's show/hide: opened by hand = the full view (app_key 0,
    // amb-web's one source for "opened by hand"); shown already = hide
    func toggleByHand() {
        if capsule.hidden { agentsView() } else { visFeed(.dismiss) }
    }

    // app_icon: the menu-bar icon's rect in the capsule page's CSS px, from
    // the web view's top-left (y negative: above the panel), for the grow
    func sendIcon() {
        guard let r = status?.iconRect else { return }
        let p = capsule.panel.frame
        capsule.post(["ev": "app_icon", "x": r.minX - p.minX, "y": p.maxY - r.maxY, "w": r.width, "h": r.height])
    }

    // the menu-bar icon is the status (§8): working (agents or main busy) and
    // the count of items waiting for you
    func statusIcon() {
        let i = iconInputs()
        status?.set(working: i.working, count: i.count)
    }

    // what the pearl is told (working, its count): one source for the icon and the harness
    func iconInputs() -> (working: Bool, count: Int) {
        let mainBusy = ["working", "sending", "speaking"].contains(phase)
        // the cards waiting + the ready pages he hasn't opened (count.json, shared with the web)
        return (working || mainBusy, MenuRows.count(memory["state"] ?? [:]))
    }

    // you away: no key or mouse for 5 minutes
    var away: Bool {
        if harnessMode { return false }   // no session-event read (a TCC preflight) in harness mode
        return CGEventSource.secondsSinceLastEventType(.combinedSessionState, eventType: CGEventType(rawValue: ~0)!) > 300
    }

    // one event into the visibility machine, then the panel follows it
    func visFeed(_ e: VisIn) {
        let t = uptime
        let shown = vis.feed(e, at: t)
        if shown == capsule.hidden {
            if shown {
                capsule.setAnchor(Placement.anchorAtShow(asked: askedAnchor))
                askedAnchor = nil
                capsule.pickScreen()
                capsule.show(fade: reduceMotion)                // in at once at its size, the page fades it in (reduced motion: a 0.15 s panel fade)
                capsule.post(["ev": "app_hidden", "on": false])
                morning()
            } else {
                if case .menu = capsule.anchor { capsule.post(["ev": "app_menu", "on": false]) }
                capsule.post(["ev": "app_hidden", "on": true])  // the page shrinks it into the icon
                capsule.hide(after: reduceMotion ? Capsule.fadeTime : Capsule.leaveTime, fade: reduceMotion)   // then out once the page's 0.12 s leave is drawn (the user, m_6567)
            }
            sayVisible()
            watchClicks(shown)
        }
        capsule.refreshMouse()   // every state change (lead m_8105)
        visJob?.cancel()
        if let at = vis.nextTick(after: t) {
            let job = DispatchWorkItem { [weak self] in MainActor.assumeIsolated { self?.visFeed(.tick) } }
            visJob = job
            DispatchQueue.main.asyncAfter(deadline: .now() + (at - t) + 0.01, execute: job)
        }
    }

    // a click elsewhere hides bise (§8): a global monitor, only while it shows
    var clickMonitor: Any?
    func watchClicks(_ on: Bool) {
        if on, clickMonitor == nil {
            clickMonitor = NSEvent.addGlobalMonitorForEvents(matching: [.leftMouseDown, .rightMouseDown]) { [weak self] _ in
                MainActor.assumeIsolated {
                    guard let self, !self.capsule.panel.frame.contains(NSEvent.mouseLocation) else { return }
                    self.visFeed(.dismiss)
                }
            }
        } else if !on, let m = clickMonitor {
            NSEvent.removeMonitor(m)
            clickMonitor = nil
        }
    }

}
