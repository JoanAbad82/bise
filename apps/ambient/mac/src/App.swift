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
    private var qa: QA?                  // --qa only: the QA channel (QA.swift)

    private var phase = "idle"
    private var talking = false          // talk_start sent, no talk_end/cancel yet
    private var locked = false
    private var reduceMotion = false
    private var edgeGlow = true
    private var cards: [Card] = []
    private var pagesURL: String?            // the hub's page server (state.pages_url)
    private var menuPages: [MenuPage] = []   // "for you" in the :* menu (state.pages)
    private var settleTalk: (() -> Void)?    // a note-or-not decision still pending
    // it knows when not to talk: a call (the mic busy elsewhere), a meeting (the calendar, opt-in)
    private var quiet = QuietMachine()
    private var meetingQuiet = false
    private var calendar: CalendarProbe?
    private var quietTimers: [Timer] = []
    private var agents = Set<String>()
    // §8 "out of the way": the one visibility state machine (Visibility.swift)
    private var vis = Visibility()
    private var visJob: DispatchWorkItem?
    private var seenCards: Set<String>? = nil   // nil until the first state (no burst at launch)
    private var working = false
    private var agentStatus: [String: String] = [:]
    // what a page loaded later needs: the last event of each of these kinds
    private var memory: [String: [String: Any]] = [:]
    private static let remembered: Set<String> = ["hub", "state", "phase", "main"]
    // QA keeps its own settings: never the user's asked/told marks or edge glow
    private let defaults: UserDefaults
    // the pages name macOS's settings by version ("Screen & System Audio Recording" on 15+)
    private let macosMajor = ProcessInfo.processInfo.operatingSystemVersion.majorVersion

    init(config: Config) {
        defaults = config.qa != nil ? (UserDefaults(suiteName: "dev.bise.ambient.qa") ?? .standard) : .standard
        let c = AmbientApp.remembered(config, defaults)
        // the computer-use broker's socket: <bise home>/run (BISE_HOME, else ~/.bise)
        if let h = c.childEnv["BISE_HOME"] ?? ProcessInfo.processInfo.environment["BISE_HOME"], !h.isEmpty {
            Browser.socketPath = h + "/run/computer-use.sock"
        }
        self.config = c
        core = Core(config: c)
        super.init()
    }

    // a launch from Finder or the menu bar has no --bise or --web: the last
    // ones scripts/ambient.sh gave (launchd's PATH doesn't find bise)
    private static func remembered(_ config: Config, _ d: UserDefaults) -> Config {
        var c = config
        let fm = FileManager.default
        if c.bise.contains("/") { d.set(c.bise, forKey: "lastBise") }
        else if let b = d.string(forKey: "lastBise"), fm.isExecutableFile(atPath: b) { c.bise = b }
        if let w = c.web { d.set(w, forKey: "lastWeb") }
        else if let w = d.string(forKey: "lastWeb"), fm.fileExists(atPath: w) { c.web = w }
        if c.childEnv["PATH"] != nil { d.set(c.childEnv["PATH"], forKey: "lastPath") }
        else if let p = d.string(forKey: "lastPath") { c.childEnv["PATH"] = p }
        return c
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

        if let m = config.qa.flatMap(QA.Mode.init(rawValue:)) { qaSetup(m) }
        capsule.onCmd = { [weak self] in
            guard let self else { return }
            if let qa = self.qa { qa.fromPage($0) } else { self.command($0) }
        }
        capsule.onReady = { [weak self] in self?.pageReady() }
        capsule.onHover = { [weak self] in self?.visFeed(.hover($0)) }
        capsule.onPlaced = { [weak self] in self?.sendIcon() }
        capsule.load(webDir: config.web)
        // at rest nothing on screen: the capsule shows when there is something to see
        edge.load(webDir: config.web)
        edgeSetup()

        // QA: no menu-bar item, no macOS notification, never the real fn
        if qa == nil { statusAndKeys() }

        core.onEvent = { [weak self] in
            guard let self else { return }
            if let qa = self.qa { qa.fromCore($0) } else { self.coreEvent($0) }
        }
        core.onExit = { [weak self] _ in
            guard let self else { return }
            self.coreEvent(["ev": "hub", "up": false, "workspace": self.config.workspace])
        }
        core.start()

        observe()
        handleSignals()
        if qa == nil { startQuiet() }   // QA never reads the user's mic state or calendar
    }

    private func statusAndKeys() {
        let st = StatusItem()
        st.onSpotlight = { [weak self] in self?.spotlight() }
        st.onToggle = { [weak self] in self?.toggleByHand() }
        st.onOpen = { [weak self] in self?.agentsView() }
        st.onPage = { Browser.open($0) }
        st.onCard = { [weak self] id in
            // bise open on that card: the inbox (fn + i) at it
            guard let self else { return }
            self.visFeed(.open)
            self.capsule.post(["ev": "app_key", "key": "i", "card": id])
        }
        st.pages = { [weak self] in self?.menuPages ?? [] }
        st.cards = { [weak self] in self?.cards ?? [] }
        st.isHidden = { [weak self] in self?.capsule.hidden ?? false }
        status = st
        st.reduceMotion = reduceMotion
        // the icon moved (another item came, the menu bar changed screens)
        NotificationCenter.default.addObserver(forName: NSWindow.didMoveNotification, object: st.iconWindow, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.sendIcon() }
        }

        let nt = Notify()
        nt.onAnswer = { [weak self] card, reply in self?.toCore(["cmd": "answer", "card": card, "reply": reply]) }
        nt.onOpen = { [weak self] in self?.agentsView() }
        notify = nt

        keys.onOut = { [weak self] in self?.key($0) }
        if Keys.trusted { keys.start() }
    }

    // the QA channel's doors into the app (QA.swift; only with --qa)
    private func qaSetup(_ mode: QA.Mode) {
        let q = QA(mode: mode, dir: config.ambientDir, capsule: capsule, edge: edge)
        q.coreEvent = { [weak self] in self?.coreEvent($0) }
        q.keyOut = { [weak self] in self?.key($0) }
        q.pageCmd = { [weak self] in self?.command($0) }
        q.sendCore = { [weak self] in self?.core.send($0) }
        q.statusItem = { [weak self] in self?.status }
        qa = q
        q.start()
    }

    // every cmd for the core: QA mode fakes the voice and drops writes when read-only
    private func toCore(_ cmd: [String: Any]) {
        if let qa, !qa.allow(cmd) { return }
        core.send(cmd)
    }

    func applicationWillTerminate(_ n: Notification) {
        core.kill()
        keys.stop()
        qa?.stop()
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
                self.status?.reduceMotion = self.reduceMotion
                self.capsule.post(["ev": "app_reduce_motion", "on": self.reduceMotion])
                self.edgeSetup()
            }
        }
        let dn = DistributedNotificationCenter.default()
        dn.addObserver(forName: .init("com.apple.screenIsLocked"), object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.locked = true; self?.sayVisible() }
        }
        dn.addObserver(forName: .init("com.apple.screenIsUnlocked"), object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.locked = false; self?.sayVisible() }
        }
        // sleep and wake: the core alive, the tap on, the capsule on a real screen
        ws.addObserver(forName: NSWorkspace.screensDidSleepNotification, object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.asleep = true; self?.sayVisible() }
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
        // the capsule covered by a full-screen window or another Space: no drawing
        NotificationCenter.default.addObserver(forName: NSWindow.didChangeOcclusionStateNotification, object: capsule.panel, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.sayVisible() }
        }
        NotificationCenter.default.addObserver(forName: NSApplication.didChangeScreenParametersNotification, object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated {
                self?.capsule.screensChanged()
                self?.edge.rebuild()
            }
        }
    }

    private var asleep = false

    private func woke() {
        Log.say("app: wake")
        asleep = false
        if qa == nil { core.check(); keys.reenable() } else { core.check() }
        capsule.screensChanged()
        edge.rebuild()
        sayVisible()
    }

    // app_visible {on}: the page stops drawing (the orb's frames) while
    // nobody can see it: hidden, covered, the screen locked or asleep
    private var visibleSaid: Bool?
    private func sayVisible() {
        let on = !capsule.hidden && !locked && !asleep && capsule.panel.occlusionState.contains(.visible)
        guard on != visibleSaid else { return }
        visibleSaid = on
        capsule.post(["ev": "app_visible", "on": on])
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
            visFeed(.open)
            return
        }
        Log.say("app: switch to \(c.workspace)")
        config = c
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

    private func pageReady() {
        capsule.post(["ev": "app_reduce_motion", "on": reduceMotion])
        capsule.post(settingsEvent())
        capsule.post(["ev": "app_hidden", "on": capsule.hidden])
        capsule.post(["ev": "app_globe", "use": globeUse()])
        visibleSaid = nil
        sayVisible()
        sendIcon()
        for k in ["hub", "state", "phase", "main"] { if let ev = memory[k] { capsule.post(ev) } }
        if quiet.on { capsule.post(["ev": "app_quiet", "on": true, "why": quiet.why]) }
        firstAsk()
    }

    private func edgeSetup() {
        edge.setup(["ev": "app_reduce_motion", "on": reduceMotion])
        edge.setup(settingsEvent())
    }

    private func command(_ cmd: [String: Any]) {
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
            switch cmd["kind"] as? String ?? "" {
            case "line": visFeed(.line)   // never shows bise by itself (SPEC §0)
            case "open": visFeed(.open)
            case "needs": visFeed(.card)
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
        case "app_perm":
            permCommand(cmd["perm"] as? String ?? "", cmd["do"] as? String ?? "")
        case "app_setting":
            setting(cmd["key"] as? String ?? "", cmd["value"])
        case "app_ready":
            pageReady()
        case "send":
            // a spotlight send: the front window goes with it (SPEC §3)
            shoot { [weak self] in self?.toCore(cmd) }
        default:
            if name.hasPrefix("app_") { Log.say("app: unknown \(name)") } else { toCore(cmd) }
        }
    }

    private func settingsEvent() -> [String: Any] {
        ["ev": "app_settings", "edge_glow": edgeGlow, "macos": macosMajor, "radius": capsule.radius, "meeting_quiet": meetingQuiet]
    }

    private func setting(_ key: String, _ value: Any?) {
        switch key {
        case "meeting_quiet":
            setMeetingQuiet(value as? Bool ?? false)
        case "edge_glow":
            edgeGlow = value as? Bool ?? true
            defaults.set(edgeGlow, forKey: "edgeGlow")
            capsule.post(settingsEvent())
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
        if let u = ev["pages_url"] as? String, !u.isEmpty { pagesURL = u }
        defer { Browser.pagesURL = pagesURL }
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
            if let seen = seenCards, !ids.subtracting(seen).isEmpty { visFeed(.card) }
            seenCards = ids
            // macOS notifications: the screen locked or you away, not "hidden" (§8)
            notify?.cards(cards, quiet: !locked && !away)
        case "sent":
            visFeed(.sent)
        case "main":
            visFeed(.mainText)
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
            settleTalk?()       // talk_start always goes before talk_end
            talking = false
            quiet.own(open: false, at: uptime)
            toCore(["cmd": "talk_end"])
            fnEvent("up")
            edge.glow(false)
            status?.set(holding: false)
            visFeed(.talk(false))
        case .cancel:
            guard talking else { return }
            settleTalk?()
            talking = false
            quiet.own(open: false, at: uptime)
            fnEvent("cancel")   // the page sends talk_cancel and says so
            edge.glow(false)
            status?.set(holding: false)
            visFeed(.cancelled)
        case .tap:
            fnEvent("tap")      // the page cuts in when main speaks
        case .key(let k):
            switch k {
            case ".":
                toggleByHand()
            case "space":
                spotlight()
            case "0":
                // fn 0: the full view; fn 0 again closes it (SPEC §0)
                if !capsule.hidden && vis.pinned { visFeed(.dismiss) } else { agentsView() }
            case "i":
                visFeed(.open)
                capsule.post(["ev": "app_key", "key": k])
            default:
                // fn 1…9 answers the top item even while hidden
                capsule.post(["ev": "app_key", "key": k])
            }
        case .plainEsc:
            // esc while main speaks: text only (the page hushes); else it hides bise
            guard !capsule.hidden else { return }
            if phase == "speaking" { capsule.post(["ev": "app_key", "key": "esc"]) } else { visFeed(.dismiss) }
        }
    }

    private var lastKey = "fn"

    private func fnEvent(_ state: String) {
        let ev: [String: Any] = ["ev": "app_fn", "state": state, "key": lastKey]
        capsule.post(ev)
        edge.post(ev)
    }

    // a hold: a voice note when the front window shows a bise page
    // (ambient-pages §4.1), else a talk to main with the front window's shot.
    // Asking the browser has ~150 ms; past that it's a talk to main.
    private func startTalk(_ key: String, state: String) {
        lastKey = key
        if askBeforeTalk() { return }
        capsule.pickScreen()   // the mouse's screen, when displays have their own menu bars
        talking = true
        defer { morning() }   // after the shot's front window is chosen
        quiet.own(open: true, at: uptime)
        visFeed(.talk(true))
        if state == "down" { status?.set(holding: true) }
        // the edge glow only while fn is held (not hands-free)
        if state == "down" && edgeGlow && !reduceMotion { edge.glow(true) }
        // QA never asks the user's browser anything
        guard qa == nil, let base = pagesURL, let front = NSWorkspace.shared.frontmostApplication?.bundleIdentifier,
              PageOpen.browsers.contains(front) else {
            beginTalk(state, page: nil)
            return
        }
        let gate = Once<(id: String, url: String)?>()
        let finish: @MainActor ((id: String, url: String)?) -> Void = { [weak self] page in
            guard gate.settle(page), let self else { return }
            self.settleTalk = nil
            self.beginTalk(state, page: page)
        }
        settleTalk = { finish(nil) }
        Browser.activeTab(front) { url in finish(url.flatMap { PageOpen.pageRef(tab: $0, pagesURL: base) }) }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) { MainActor.assumeIsolated { finish(nil) } }
    }

    private func beginTalk(_ state: String, page: (id: String, url: String)?) {
        var ev: [String: Any] = ["ev": "app_fn", "state": state, "key": lastKey]
        var cmd: [String: Any] = ["cmd": "talk_start"]
        if let p = page {
            ev["page"] = ["id": p.id, "url": p.url]
            cmd["page"] = ["id": p.id, "url": p.url]
            Log.say("app: voice note on \(p.id)")
        }
        capsule.post(ev)
        edge.post(ev)
        toCore(cmd)
        if page == nil { shoot(then: nil) }   // a note: the page is the context, no shot
    }

    // the morning page (roadmap slice E): today's morning-<date>, opened in
    // front once a day at the first fn hold or capsule open after 05:00
    private func morning() {
        guard qa == nil else { return }
        let ids = menuPages.map(\.id)
        guard let due = Morning.due(now: Date(), tz: .current, openedOn: defaults.string(forKey: "morningOpened"), pageIDs: ids),
              let page = menuPages.first(where: { $0.id == due.id }) else { return }
        defaults.set(due.day, forKey: "morningOpened")
        Log.say("app: the morning page \(page.id)")
        Browser.open(page.url)
        // ambient: "good morning" only before 11:00 local
        let greet = Calendar.current.component(.hour, from: Date()) < 11
        capsule.post(["ev": "app_morning", "id": page.id, "title": page.title, "url": page.url, "greet": greet])
        visFeed(.show(4))
    }

    // fn space: the page opens its field and asks app_focus on (typing)
    private func spotlight() {
        morning()
        visFeed(.show(Visibility.brief))   // until the field takes the keys
        capsule.post(["ev": "app_key", "key": "space"])
    }

    // a menu-bar click: what's going on (the agents and the inbox, fn + 0)
    private func agentsView() {
        morning()
        visFeed(.open)
        capsule.post(["ev": "app_key", "key": "0"])
    }

    // fn . or the menu's show/hide: opened by hand = the full view (app_key 0,
    // amb-web's one source for "opened by hand"); shown already = hide
    private func toggleByHand() {
        if capsule.hidden { agentsView() } else { visFeed(.dismiss) }
    }

    // app_icon: the menu-bar icon's rect in the capsule page's CSS px, from
    // the web view's top-left (y negative: above the panel), for the grow
    private func sendIcon() {
        guard let r = status?.iconRect else { return }
        let p = capsule.panel.frame
        capsule.post(["ev": "app_icon", "x": r.minX - p.minX, "y": p.maxY - r.maxY, "w": r.width, "h": r.height])
    }

    // the menu-bar icon is the status (§8): working (agents or main busy) and
    // the count of items waiting for you
    private func statusIcon() {
        let mainBusy = ["working", "sending", "speaking"].contains(phase)
        status?.set(working: working || mainBusy, count: cards.count)
    }

    // you away: no key or mouse for 5 minutes
    private var away: Bool {
        CGEventSource.secondsSinceLastEventType(.combinedSessionState, eventType: CGEventType(rawValue: ~0)!) > 300
    }

    // one event into the visibility machine, then the panel follows it
    private func visFeed(_ e: VisIn) {
        let t = uptime
        let shown = vis.feed(e, at: t)
        if shown == capsule.hidden {
            if shown {
                capsule.pickScreen()
                capsule.show()                                  // in at once, then the page grows it
                capsule.post(["ev": "app_hidden", "on": false])
                morning()
            } else {
                capsule.post(["ev": "app_hidden", "on": true])  // the page shrinks it into the icon
                capsule.hide(after: reduceMotion ? 0.2 : 0.6)   // then out (ambient: 0.6 s back in)
            }
            sayVisible()
            watchClicks(shown)
        }
        visJob?.cancel()
        if let at = vis.nextTick(after: t) {
            let job = DispatchWorkItem { [weak self] in MainActor.assumeIsolated { self?.visFeed(.tick) } }
            visJob = job
            DispatchQueue.main.asyncAfter(deadline: .now() + (at - t) + 0.01, execute: job)
        }
    }

    // a click elsewhere hides bise (§8): a global monitor, only while it shows
    private var clickMonitor: Any?
    private func watchClicks(_ on: Bool) {
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

    // MARK: quiet (a call, a meeting): the core answers in text, the page holds cards

    private var uptime: Double { ProcessInfo.processInfo.systemUptime }

    private func startQuiet() {
        if defaults.object(forKey: "meetingQuiet") != nil { meetingQuiet = defaults.bool(forKey: "meetingQuiet") }
        // the mic every second: a property read, never the mic itself
        quietTimers.append(Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            MainActor.assumeIsolated {
                guard let self, let running = MicProbe.running() else { return }
                self.quiet.mic(running: running, at: self.uptime)
                self.sayQuiet()
            }
        })
        if meetingQuiet && CalendarProbe.granted { watchMeetings() } else if meetingQuiet { meetingQuiet = false }
    }

    private func watchMeetings() {
        let cal = calendar ?? CalendarProbe()
        calendar = cal
        let look = { [weak self] in
            guard let self, self.meetingQuiet else { return }
            self.quiet.meeting(CalendarEvent.meetingNow(cal.around(Date()), now: Date()))
            self.sayQuiet()
        }
        look()
        quietTimers.append(Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { _ in MainActor.assumeIsolated { look() } })
    }

    // the setting (default off): turning it on asks macOS for the calendar, once
    private func setMeetingQuiet(_ on: Bool) {
        let done = { [weak self] (on: Bool) in
            guard let self else { return }
            self.meetingQuiet = on
            self.defaults.set(on, forKey: "meetingQuiet")
            if on { self.watchMeetings() } else { self.quiet.meeting(false); self.sayQuiet() }
            self.capsule.post(self.settingsEvent())
        }
        guard on, qa == nil else { done(false); return }
        if CalendarProbe.granted { done(true); return }
        let cal = calendar ?? CalendarProbe()
        calendar = cal
        cal.ask { [weak self] ok in
            if !ok { self?.perm("calendar", "denied") }
            done(ok)
        }
    }

    // the front app's front window covers a whole screen (a video, slides, a game)
    private func checkFullScreen() {
        guard qa == nil, let app = NSWorkspace.shared.frontmostApplication,
              app.processIdentifier != getpid(),
              let list = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]]
        else { return }
        let mainH = NSScreen.screens.first?.frame.height ?? 0
        let screens = NSScreen.screens.map { CGRect(x: $0.frame.minX, y: mainH - $0.frame.maxY, width: $0.frame.width, height: $0.frame.height) }
        var full = false
        for w in list where (w[kCGWindowOwnerPID as String] as? NSNumber)?.int32Value == app.processIdentifier
            && (w[kCGWindowLayer as String] as? NSNumber)?.intValue == 0 {
            if let bd = w[kCGWindowBounds as String] as? NSDictionary, let b = CGRect(dictionaryRepresentation: bd) {
                full = screens.contains { $0.equalTo(b) }
            }
            break   // the front window only
        }
        quiet.fullScreen(full)
        sayQuiet()
    }

    // a change: the page (app_quiet) and the core (quiet: text only)
    private func sayQuiet() {
        guard let c = quiet.change() else { return }
        Log.say("app: quiet \(c.on) \(c.why)")
        visFeed(.quiet(c.on))   // quiet: bise never shows by itself
        status?.set(quiet: c.on)
        capsule.post(["ev": "app_quiet", "on": c.on, "why": c.why])
        toCore(["cmd": "quiet", "on": c.on, "why": c.why])
    }

    // MARK: the shot

    private var shooting = false

    // the front window to the core (shot), its chip and corners to the
    // pages, then `then` (a send waits for it, at most 1.5 s)
    private func shoot(then: (() -> Void)?) {
        if let qa {   // QA: a fake shot, never the user's screen
            let (ev, bounds) = qa.fakeShot()
            capsule.post(ev)
            if let b = bounds { edge.corners(ev, cgBounds: b) }
            then?()
            return
        }
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
                if let p = r.path { self.toCore(["cmd": "shot", "path": p, "app": r.app, "title": r.title]) }
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
        guard qa == nil else { return }   // QA: no permission is ever asked
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
        guard qa == nil else { return false }
        switch micState {
        case .notDetermined:
            // after 'not now' the mic is never asked again: a hold does nothing
            if !asked("mic") { perm("mic", "ask") }
            return true
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
        guard qa == nil else { return }   // QA: never a macOS prompt or a settings pane
        if action == "settings" {
            let pane = ["accessibility": "Privacy_Accessibility", "mic": "Privacy_Microphone", "screen": "Privacy_ScreenCapture"][p] ?? "Privacy"
            if let u = URL(string: "x-apple.systempreferences:com.apple.preference.security?\(pane)") { NSWorkspace.shared.open(u) }
            return
        }
        if action == "not_now" {
            // no macOS prompt; the refused line once, then never asked again
            // (the menu bar and the spotlight work without the keys)
            markAsked(p)
            deniedOnce(p)
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
