// App, split out of App.swift (rule 6, mechanical): keys, fn and talks, the spotlight and the finder, the shot.
// The same AmbientApp; its state lives in App.swift.

import AppKit
import AVFoundation

extension AmbientApp {
    // MARK: keys

    func key(_ o: KeyOut) {
        if let line = KeyLog.line(o) { Log.say(line) }
        switch o {
        case .talkStart(let k):
            startTalk(k == .fn ? "fn" : "right_option", state: "down")
        case .double:
            startTalk("fn", state: "double")
            globeCheck()
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
            globeCheck()
        case .key(let k):
            switch k {
            case ".":
                toggleByHand()
            case "space":
                spotlight()
            case "a":
                agentsFinder()
            case "0":
                // fn 0: the full view; fn 0 again closes it (SPEC §0)
                if !capsule.hidden && vis.pinned { visFeed(.dismiss) } else { agentsView() }
            case ",":
                settingsView()
            case "i":
                anchor(.top)
                visFeed(.open)
                capsule.post(["ev": "app_key", "key": k])
                takeKeys()
            default:
                // fn 1…9 answers the top item even while hidden
                capsule.post(["ev": "app_key", "key": k])
            }
        case .plainEsc:
            // EscRoute (lead m_8105): while the bar has the keys the page acts
            // on the esc it gets (a pane steps back, a card is put off); else
            // main speaking: the page hushes; else it hides bise
            switch EscRoute.route(barShown: !capsule.hidden, barHasKeys: capsule.panel.isKeyWindow,
                                  pageReady: capsule.ready, speaking: phase == "speaking", content: content) {
            case .page, .nothing: break
            case .post: capsule.post(["ev": "app_key", "key": "esc"])
            case .dismiss: visFeed(.dismiss)
            }
        }
    }

    func fnEvent(_ state: String) {
        let ev: [String: Any] = ["ev": "app_fn", "state": state, "key": lastKey]
        capsule.post(ev)
        edge.post(ev)
    }

    // a hold: a voice note when the front window shows a bise page
    // (ambient-pages §4.1), else a talk to main with the front window's shot.
    // Asking the browser has ~150 ms; past that it's a talk to main.
    func startTalk(_ key: String, state: String) {
        lastKey = key
        helloOn = false   // a hold ends the hello at once: the talk (or the mic ask) takes the glass
        if askBeforeTalk() { return }
        cue(.talkOpened)       // before our own mic counts as a call
        capsule.pickScreen()   // the mouse's screen, when displays have their own menu bars
        talking = true
        defer { morning() }   // after the shot's front window is chosen
        readFront()           // S9: the front app's context, before any page of ours comes in front
        quiet.own(open: true, at: uptime)
        visFeed(.talk(true))
        if state == "down" { status?.set(holding: true) }
        // the edge glow only while fn is held (not hands-free)
        if state == "down" && edgeGlow && !reduceMotion { edge.glow(true) }
        // QA never asks the user's browser anything
        guard !sandbox, let base = pagesURL, let front = NSWorkspace.shared.frontmostApplication?.bundleIdentifier,
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
        askTab(front) { url in finish(url.flatMap { PageOpen.pageRef(tab: $0, pagesURL: base) }) }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) { MainActor.assumeIsolated { finish(nil) } }
    }

    func beginTalk(_ state: String, page: (id: String, url: String)?) {
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
    func morning() {
        guard !sandbox else { return }
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
    // the route line after a talk (S8, amb-web c091e239: content {kind:'got',
    // route:true}): a plain tab goes to the page as app_key 'tab' while it
    // shows (fn esc already does), and never more than 4 s
    func routeLine(_ on: Bool) {
        guard keys.routeOpen != on else { return }
        keys.routeOpen = on
        routeJob?.cancel()
        guard on else { return }
        let job = DispatchWorkItem { [weak self] in MainActor.assumeIsolated { self?.keys.routeOpen = false } }
        routeJob = job
        DispatchQueue.main.asyncAfter(deadline: .now() + 4, execute: job)
    }

    func spotlight() {
        anchor(.top)
        readFront()   // S9: before the morning page could come in front
        morning()
        visFeed(.show(Visibility.brief))   // until the field takes the keys
        capsule.post(["ev": "app_key", "key": "space"])
        takeKeys()
    }

    // fn a (round 10): every agent in the finder; the page opens it at 860
    // and asks app_focus on, like fn space
    func agentsFinder() {
        anchor(.top)
        visFeed(.show(Visibility.brief))   // until the field takes the keys
        capsule.post(["ev": "app_key", "key": "a"])
        takeKeys()
    }

    // MARK: the shot

    // the front window to the core (shot), its chip and corners to the
    // pages, then `then` (a send waits for it, at most 1.5 s)
    func shoot(then: (() -> Void)?) {
        if let qa {   // QA: a fake shot, never the user's screen
            let (ev, bounds) = qa.fakeShot()
            capsule.post(ev)
            if let b = bounds { edge.corners(ev, cgBounds: b) }
            then?()
            return
        }
        // harness A: never his screen
        if harness != nil { Log.say("harness: no shot"); then?(); return }
        guard Shot.allowed, !shooting else { then?(); return }
        shooting = true
        var done = false
        let finish = { if !done { done = true; then?() } }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { MainActor.assumeIsolated { finish() } }
        let dir = config.ambientDir + "/shots"
        let skip = settings.skipBundles   // built-in + the user's never-seen apps
        Task { @MainActor [weak self] in
            let r = await Shot.take(into: dir, skip: skip)
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
}
