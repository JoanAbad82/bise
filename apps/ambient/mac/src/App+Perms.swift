// App, split out of App.swift (rule 6, mechanical): permissions one at a time, the hello, problems that aren't asks.
// The same AmbientApp; its state lives in App.swift.

import AppKit
import AVFoundation
import UniformTypeIdentifiers

extension AmbientApp {
    // MARK: permissions, one at a time (SPEC §5.8, PermPlan in Perms.swift)

    func perm(_ p: String, _ state: String) {
        capsule.post(["ev": "app_perm", "perm": p, "state": state])
    }

    var micGrant: Grant {
        switch AVCaptureDevice.authorizationStatus(for: .audio) {
        case .authorized: return .granted
        case .denied, .restricted: return .denied
        default: return .unknown
        }
    }

    // macOS's states (or QA's), and what the capsule already asked and said
    func permNow() -> PermState {
        var s = sandbox ? fakePerms
            : PermState(accessibility: Keys.trusted ? .granted : .unknown, mic: micGrant, screen: Shot.allowed ? .granted : .unknown)
        s.asked = Set(Perm.allCases.map(\.rawValue).filter { defaults.bool(forKey: "asked.\($0)") })
        s.told = Set(Perm.allCases.map(\.rawValue).filter { defaults.bool(forKey: "told.\($0)") })
        s.had = Set(Perm.allCases.map(\.rawValue).filter { defaults.bool(forKey: "had.\($0)") })
        return s
    }

    func permSave(_ s: PermState) {
        for p in Perm.allCases.map(\.rawValue) {
            if s.asked.contains(p) { defaults.set(true, forKey: "asked.\(p)") }
            // told goes both ways: a refusal is said again once per launch (PermPlan.launch)
            defaults.set(s.told.contains(p), forKey: "told.\(p)")
            if s.had.contains(p) { defaults.set(true, forKey: "had.\(p)") }
        }
        if sandbox { fakePerms = s }
    }

    // one plan step: the state in, the plan, the state out, then its doings
    func permStep(_ plan: (inout PermState) -> [PermDo]) {
        var s = permNow()
        let dos = plan(&s)
        permSave(s)
        for d in dos { permDo(d) }
    }

    func permDo(_ d: PermDo) {
        switch d {
        case .ask(let p):
            // an ask needs him: the glass shows it (first-run walk: the launch's
            // Accessibility ask sat in a hidden panel)
            perm(p.rawValue, "ask")
            askShown = true
            visFeed(.open)
        case .denied(let p):
            // the refused line, once: 8 s on the glass, then gone (first-run
            // walk: after 'not now' it stayed pinned)
            perm(p.rawValue, "denied")
            visFeed(.show(Visibility.forCard))
        case .granted(let p):
            perm(p.rawValue, "granted")
            if p == .accessibility { helloSoon() }
        case .startKeys: if !sandbox, !keys.running { keys.start() }
        case .watchTrust: if !sandbox { pollTrust() }
        case .settings(let p):
            // QA never opens a settings pane
            guard !sandbox else { Log.say("app: qa: settings pane for \(p.rawValue)"); return }
            if let u = SettingsPane.url(p.rawValue) { NSWorkspace.shared.open(u) }
        case .prompt(let p): prompt(p)
        }
    }

    // macOS's own prompt (QA: a fake one, granted after 0.6 s)
    func prompt(_ p: Perm) {
        if sandbox {
            Log.say("app: qa: fake macOS prompt for \(p.rawValue)")
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) { [weak self] in
                MainActor.assumeIsolated { self?.permStep { PermPlan.answered(p, granted: true, &$0) } }
            }
            return
        }
        switch p {
        case .accessibility:
            Keys.prompt()
        case .mic:
            AVCaptureDevice.requestAccess(for: .audio) { ok in
                DispatchQueue.main.async {
                    MainActor.assumeIsolated { self.permStep { PermPlan.answered(.mic, granted: ok, &$0) } }
                }
            }
        case .screen:
            let ok = CGRequestScreenCaptureAccess()
            permStep { PermPlan.answered(.screen, granted: ok, &$0) }
        }
    }

    // at launch: Accessibility first (nothing works without fn)
    func firstAsk() {
        permStep { PermPlan.launch(&$0) }
        if permNow().accessibility == .granted { helloSoon() }
    }

    // MARK: the hello, once ever (ambient m_5701; amb-web draws it)

    // QA: only on a first-run walk, so the scenes never meet it
    var helloSaid: Bool {
        defaults.bool(forKey: "saidHello") || (qa != nil && !defaults.bool(forKey: "qa.firstRun"))
    }

    func helloSoon() {
        guard !helloSaid else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + Hello.delay) { [weak self] in
            MainActor.assumeIsolated { self?.hello() }
        }
    }

    // said at most once; while quiet it waits (sayQuiet asks again when it ends)
    func hello() {
        guard Hello.due(said: helloSaid, accessibility: permNow().accessibility, quiet: quiet.on) else { return }
        defaults.set(true, forKey: "saidHello")
        Log.say("app: hello")
        helloOn = true
        capsule.post(["ev": "app_hello"])
        visFeed(.show(Hello.cap))
    }

    // macOS has no callback for Accessibility: look every 2 s until granted
    func pollTrust() {
        guard trustPoll == nil else { return }
        trustPoll = Timer.scheduledTimer(withTimeInterval: 2, repeats: true) { [weak self] t in
            MainActor.assumeIsolated {
                guard let self, Keys.trusted else { return }
                t.invalidate()
                self.trustPoll = nil
                self.permStep { PermPlan.answered(.accessibility, granted: true, &$0) }
            }
        }
    }

    // the first hold: the mic, then the screen, each its sentence first;
    // true = an ask is showing (or the mic is off), no talk this time
    func askBeforeTalk() -> Bool {
        var talk = true
        var why = ""
        permStep { s in
            let h = PermPlan.hold(&s)
            talk = h.talk
            why = PermPlan.holdWhy(s, h.do)
            return h.do
        }
        // every hold's decision in app.log (the dogfood, B2)
        Log.say(talk ? "keys: hold → talk" + (why.isEmpty ? "" : " (\(why))") : "keys: hold ignored: \(why)")
        return !talk
    }

    // the page's answer to an ask: continue, not now, settings
    func permCommand(_ p: String, _ action: String) {
        // the problems that aren't asks (the user: every error with the way
        // back): their line's 'settings' opens the pane
        if action == "settings", let pane = SettingsPane.url(p) {
            if sandbox { Log.say("app: qa: settings pane for \(p)"); return }
            NSWorkspace.shared.open(pane)
            return
        }
        guard let perm = Perm(rawValue: p) else { return }
        // answered: the glass the ask opened goes (first-run walk: it stayed
        // pinned on the last ask after every permission was granted); the
        // next ask, if any, opens it again after macOS's prompt
        if askShown {
            askShown = false
            visFeed(.dismiss)
        }
        permStep { PermPlan.command(perm, action, &$0) }
    }

    // MARK: problems that aren't asks (the user: never a silent ignore)

    // the tap swallows fn's own events, so macOS's 🌐 action shouldn't fire;
    // if its emoji picker still shows up after a fn tap, say so once per
    // launch with the way back (Keyboard › Press 🌐 key to › Do Nothing)
    func globeCheck() {
        guard !sandbox, !globeSaid, globeUse() != "none" else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { [weak self] in
            MainActor.assumeIsolated {
                guard let self, !self.globeSaid else { return }
                let list = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]] ?? []
                let owners = list.compactMap { $0[kCGWindowOwnerName as String] as? String }
                guard Globe.fired(owners: owners) else { return }
                self.globeSaid = true
                Log.say("keys: macOS's 🌐 key action fired (\(globeUse())): said, with the Keyboard pane")
                self.problem("globe")
            }
        }
    }

    // a problem's line on the glass (the page's words; its 'settings' button
    // sends app_perm {perm, do:'settings'})
    func problem(_ p: String) {
        perm(p, "denied")
        visFeed(.show(Visibility.forCard))
    }
}
