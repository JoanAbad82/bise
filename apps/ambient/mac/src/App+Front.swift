// App: the front app's context at fn (S9, lead m_9025/m_9029). At a hold
// (talk) and at fn space (the spotlight) the app reads the front app
// (FrontRead: Accessibility; a Chromium tab's URL through AppleScript),
// FrontRules decides what leaves, and it goes as {cmd:'fn_context', context}
// to the core (amb-core m_9039: kept for the next turn) and {ev:'app_front'}
// to the bar's page. Never waits more than FrontRules.budget; never reads
// his apps in QA or harness mode (the harness's 'front' op gives a fixture).

import AppKit

// one read in flight: the AX read and, for a Chromium browser, its tab
@MainActor
final class FrontJob {
    var raw: FrontRaw
    var left: Int
    var sent = false
    init(raw: FrontRaw, left: Int) { self.raw = raw; self.left = left }
}

extension AmbientApp {
    func readFront() {
        let skip = settings.skipBundles
        if sandbox {
            // QA and harness: never his front app; only a fixture the harness gave
            if let raw = harnessFront { sendFront(FrontRules.build(raw, skip: skip)) }
            return
        }
        guard let front = NSWorkspace.shared.frontmostApplication,
              front.processIdentifier != ProcessInfo.processInfo.processIdentifier else { return }
        let base = FrontRaw(app: front.localizedName, bundle: front.bundleIdentifier)
        // never-seen apps: not even read
        if SkipList.skips(bundle: base.bundle, title: "", apps: skip) { sendFront(FnCtx()); return }
        // no Accessibility: the app's name only
        guard AXIsProcessTrusted() else { sendFront(FrontRules.build(base, skip: skip)); return }
        let tab = base.bundle.map { PageOpen.browsers.contains($0) } ?? false
        let job = FrontJob(raw: base, left: tab ? 2 : 1)
        let settle: @MainActor () -> Void = { [weak self] in
            guard let self, !job.sent else { return }
            job.sent = true
            self.sendFront(FrontRules.build(job.raw, skip: skip))
        }
        FrontRead.read(pid: front.processIdentifier, app: base.app, bundle: base.bundle, within: FrontRules.budget - 0.03) { r in
            let tabURL = job.raw.tabURL
            job.raw = r
            job.raw.tabURL = tabURL
            job.left -= 1
            if job.left == 0 { settle() }
        }
        if tab, let b = base.bundle {
            askTab(b) { url in
                job.raw.tabURL = url
                job.left -= 1
                if job.left == 0 { settle() }
            }
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + FrontRules.budget) { MainActor.assumeIsolated { settle() } }
    }

    func sendFront(_ c: FnCtx) {
        toCore(["cmd": "fn_context", "context": c.context])
        capsule.post(c.front)
        // what was read, never its content
        Log.say("front: \(c.app ?? "excluded") (\(c.context.keys.sorted().joined(separator: ",")))")
    }

    // the pearl's 'in front' row follows app switches with the name only (no read)
    func frontSwitched(_ app: NSRunningApplication?) {
        guard !sandbox, let app, app.processIdentifier != ProcessInfo.processInfo.processIdentifier else { return }
        let c = FrontRules.build(FrontRaw(app: app.localizedName, bundle: app.bundleIdentifier), skip: settings.skipBundles)
        capsule.post(c.front)
    }

    // S9: a drop on the pearl (StatusItem, or the harness's 'drop' op): the
    // spotlight opens with it (amb-web 2d87bf28); his ⏎ sends it like any
    // typed message. An image with no file is written to <ambient>/drops first.
    @discardableResult
    func dropped(_ items: [DropItem], link: String?, png: Data?) -> [String: Any]? {
        var all = items
        if let png {
            let dir = config.ambientDir + "/drops"
            try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
            let path = dir + "/drop-\(Int(Date().timeIntervalSince1970 * 1000)).png"
            if FileManager.default.createFile(atPath: path, contents: png) { all.append(DropItem(path: path, isDir: false)) }
        }
        guard let ev = DropRules.event(all, url: link) else { Log.say("drop: nothing usable"); return nil }
        Log.say("drop: \((ev["files"] as? [Any])?.count ?? 0) files\(ev["url"] == nil ? "" : " and a link") on the pearl")
        spotlight()
        capsule.post(ev)
        return ev
    }

    // S9 'while you were away': he left at a lock or sleep (minus his idle
    // time then); back at unlock, or at wake when the screen wasn't locked.
    // Never in QA or the harness (his session's events): the 'away' op instead
    func awayLeft() {
        guard !sandbox else { return }
        let idle = CGEventSource.secondsSinceLastEventType(.combinedSessionState, eventType: CGEventType(rawValue: ~0)!)
        awayClock.left(at: Date(), idle: idle)
    }

    func awayBack(unlock: Bool) {
        guard !sandbox, Away.isBack(unlock: unlock, wake: !unlock, locked: locked),
              let ms = awayClock.back(at: Date()) else { return }
        sayAway(ms)
    }

    func sayAway(_ ms: Int) {
        Log.say("app: back after \(ms / 60000) min away")
        toCore(["cmd": "away_back", "away_ms": ms])
        capsule.post(["ev": "app_away", "away_ms": ms])
    }

    // a Chromium browser's active tab, one AppleScript at a time: the voice
    // note's check and the context share the answer
    func askTab(_ bundle: String, _ done: @escaping @MainActor (String?) -> Void) {
        if tabWaiters != nil { tabWaiters?.append(done); return }
        tabWaiters = [done]
        Browser.activeTab(bundle) { [weak self] url in
            let waiting = self?.tabWaiters ?? []
            self?.tabWaiters = nil
            for w in waiting { w(url) }
        }
    }
}
