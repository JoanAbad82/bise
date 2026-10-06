// App, split out of App.swift (rule 6, mechanical): quiet moments (a call, a meeting, full screen).
// The same AmbientApp; its state lives in App.swift.

import AppKit

extension AmbientApp {
    // MARK: quiet (a call, a meeting): the core answers in text, the page holds cards

    var uptime: Double { ProcessInfo.processInfo.systemUptime }

    func startQuiet() {
        // the mic every second: a property read, never the mic itself
        quietTimers.append(Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            MainActor.assumeIsolated {
                guard let self, let running = MicProbe.running() else { return }
                self.quiet.mic(running: running, at: self.uptime)
                self.sayQuiet()
            }
        })
        if meetingQuiet && CalendarProbe.granted { watchMeetings() } else if meetingQuiet { change(.meetingQuiet(false)) }
    }

    func watchMeetings() {
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
    func setMeetingQuiet(_ on: Bool) {
        let done = { [weak self] (on: Bool) in
            guard let self else { return }
            self.change(.meetingQuiet(on))
            if on { self.watchMeetings() } else { self.quiet.meeting(false); self.sayQuiet() }
            self.capsule.post(self.settingsEvent())
        }
        guard on, !sandbox else { done(false); return }
        if CalendarProbe.granted { done(true); return }
        let cal = calendar ?? CalendarProbe()
        calendar = cal
        cal.ask { [weak self] ok in
            if !ok { self?.perm("calendar", "denied") }
            done(ok)
        }
    }

    // the front app's front window covers a whole screen (a video, slides, a game)
    func checkFullScreen() {
        guard !sandbox, let app = NSWorkspace.shared.frontmostApplication,
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
    // quiet for 1 h (the native menu; the dropdown sends app_quiet_hour): again = its end
    func quietHour(_ on: Bool? = nil) {
        let want = on ?? !quiet.paused
        quiet.pause(want)
        quietHourJob?.cancel()
        if want {
            let job = DispatchWorkItem { [weak self] in MainActor.assumeIsolated { self?.quietHour(false) } }
            quietHourJob = job
            DispatchQueue.main.asyncAfter(deadline: .now() + 3600, execute: job)
        }
        Log.say("app: quiet for 1 h \(want ? "on" : "off")")
        sayQuiet()
    }

    func sayQuiet() {
        guard let c = quiet.change() else { return }
        Log.say("app: quiet \(c.on) \(c.why)")
        visFeed(.quiet(c.on))   // quiet: bise never shows by itself
        status?.set(quiet: c.on)
        capsule.post(["ev": "app_quiet", "on": c.on, "why": c.why])
        toCore(["cmd": "quiet", "on": c.on, "why": c.why])
        if !c.on { helloSoon() }   // a hello held by quiet comes now
    }
}
