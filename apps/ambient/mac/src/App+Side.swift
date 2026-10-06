// App, split out of App.swift (rule 6, mechanical): the side panel (round 10).
// The same AmbientApp; its state lives in App.swift.

import AppKit

extension AmbientApp {
    // MARK: the side panel (round 10): an agent's history, docked right

    func makeSide() -> Capsule {
        if let s = side { return s }
        let s = Capsule(side: true, offScreen: harnessMode)

        s.onCmd = { [weak self] in self?.harness?.note("panel>app", $0); self?.panelCmd($0) }
        s.onReady = { [weak self] in self?.panelReady() }
        s.onKeyFocus = { [weak self] on in
            guard let self else { return }
            _ = self.panelKeys.feed(on ? .clicked : .closed)
            self.side?.post(["ev": "app_focused", "on": on])
        }
        s.watchKey()
        s.load(webDir: config.web)
        side = s
        return s
    }

    // the panel page's cmds: its box, its agent, its close; the rest goes
    // the bar's way (core cmds to the core, app_* here)
    func panelCmd(_ cmd: [String: Any]) {
        switch cmd["cmd"] as? String ?? "" {
        case "app_size":
            if let s = side, let sh = CapsuleShape.from(cmd, maxHeight: s.maxHeight) { s.apply(sh) }
        case "app_panel":
            if case .open(let a) = PanelCmd.from(cmd) { openPanel(a) }
        case "app_panel_close", "app_hide":
            closePanel()
        case "app_focus":
            if qa == nil { side?.focus(cmd["on"] as? Bool ?? false) }
        default:
            if let qa { qa.fromPage(cmd) } else { command(cmd) }
        }
    }

    func panelReady() {
        guard let s = side else { return }
        s.post(["ev": "app_reduce_motion", "on": reduceMotion])
        s.post(settingsEvent())
        for k in ["hub", "state", "phase", "main"] { if let ev = memory[k] { s.post(ev) } }
        if let a = panelAgent { s.post(["ev": "app_panel", "agent": a, "on": true, "h": s.sideHeight]) }
    }

    // {cmd:'app_panel', agent} from the bar (⏎ on an agent) or the panel
    // (⌘↑↓ re-points it): shown already = the same window, its new agent
    func openPanel(_ agent: String?) {
        guard let agent, !agent.isEmpty else { return }
        let s = makeSide()
        let shown = !s.hidden
        panelAgent = agent
        let ev: [String: Any] = ["ev": "app_panel", "agent": agent, "on": true, "h": s.sideHeight]
        s.post(ev)
        capsule.post(ev)
        guard !shown else { return }
        Log.say("panel: open on \(agent)")
        s.pickScreen()
        s.show(fade: reduceMotion)
        // it takes the keys first, then the bar goes: his app never gets them
        // in between (QA never takes his keys)
        if qa == nil, panelKeys.feed(.openedByHand) == .take || !s.panel.isKeyWindow { s.focus(true) }
        if !capsule.hidden { visFeed(.dismiss) }
    }

    // esc, ⌘W, the page's close, ⌘H: both pages hear it, the keys go back
    func closePanel() {
        guard let s = side, !s.hidden else { return }
        Log.say("panel: close")
        let off: [String: Any] = ["ev": "app_panel", "on": false]
        s.post(off)
        capsule.post(off)
        panelAgent = nil
        _ = panelKeys.feed(.closed)
        s.hide(after: reduceMotion ? Capsule.fadeTime : Capsule.leaveTime, fade: reduceMotion)
    }

    // the hidden main menu's keys (only while bise has the keys)
}
