// The laws of bise's window (S4, src/WinRules.swift), run by build.sh
// --test through the swift interpreter (cat'ed after src/Always.swift and
// src/WinRules.swift).

import Foundation

var failures = 0
func law(_ name: String, _ ok: Bool) {
    if ok { print("ok   \(name)") } else { print("FAIL \(name)"); failures += 1 }
}

// keys (lead m_8194, amb-win m_8203)
func k(_ key: String, cmd: Bool = true, shift: Bool = false, alt: Bool = false, ctrl: Bool = false) -> WinKey {
    WinKeys.route(key: key, cmd: cmd, shift: shift, alt: alt, ctrl: ctrl)
}
law("keys: ⌘Q quits, ⌘W closes the window, ⌘H hides, ⌘M minimizes: the menu's, never the page's",
    ["q", "w", "h", "m"].allSatisfy { k($0) == .menu })
law("keys: ⌘0 and ⌘1-9 reach the page", (0...9).allSatisfy { k("\($0)") == .page })
law("keys: ⌘K ⌘I ⌘D ⌘E ⌘F ⌘J ⌘. ⌘N ⌘⌫ ⌘[ ⌘] ⌘, reach the page",
    ["k", "i", "d", "e", "f", "j", ".", "n", "delete", "[", "]", ","].allSatisfy { k($0) == .page })
law("keys: ⇧⌘A reaches the page (⌘A stays select all)", k("a", shift: true) == .page && k("a") == .native)
law("keys: ⌘Z ⇧⌘Z ⌘C ⌘V ⌘X: native in fields", [k("z"), k("z", shift: true), k("c"), k("v"), k("x")].allSatisfy { $0 == .native })
law("keys: ⌥0-9 and ctrl+1-9 are plain keydowns for the page", (0...9).allSatisfy { k("\($0)", cmd: false, alt: true) == .page && k("\($0)", cmd: false, ctrl: true) == .page })
law("keys: ctrl+c never quits (the page's; ⌘. interrupts)", k("c", cmd: false, ctrl: true) == .page && k(".") == .page)
law("keys: ⌘ with ⌥ or ⇧ on a menu letter is the page's (⌥⌘W, ⇧⌘Q)", k("w", alt: true) == .page && k("q", shift: true) == .page)

// deep links (amb-win's routes)
law("route: a project's agent", WinRoute.from(route: nil, open: ["project": "telemetry", "agent": "fix-p99"], current: "ws") == "agent/telemetry/fix-p99")
law("route: a project", WinRoute.from(route: nil, open: ["project": "telemetry"], current: "ws") == "project/telemetry")
law("route: an agent of the bar's own project", WinRoute.from(route: nil, open: ["agent": "a1"], current: "harness") == "agent/harness/a1")
law("route: an agent and no project known: nothing", WinRoute.from(route: nil, open: ["agent": "a1"], current: nil) == nil)
law("route: nothing named: bise's thread", WinRoute.from(route: nil, open: nil, current: "ws") == "bise" && WinRoute.from(route: nil, open: [:], current: "ws") == "bise")
law("route: a route as given when the page knows it",
    ["inbox", "settings/keys", "review/p/a", "artifacts", "environments", "add-project", "bise"].allSatisfy { WinRoute.from(route: $0, open: nil, current: nil) == $0 })
law("route: an unknown route: nothing", WinRoute.from(route: "javascript:alert(1)", open: nil, current: nil) == nil)
law("route: a slash in a name is escaped", WinRoute.from(route: nil, open: ["project": "a/b", "agent": "c"], current: nil) == "agent/a%2Fb/c")

// where it comes back (lead m_8202)
let mainScreen = ScreenBox(frame: CGRect(x: 0, y: 0, width: 1512, height: 982), visible: CGRect(x: 0, y: 0, width: 1512, height: 949))
let ext = ScreenBox(frame: CGRect(x: 1512, y: 0, width: 2560, height: 1440), visible: CGRect(x: 1512, y: 0, width: 2560, height: 1415))
func inside(_ f: CGRect, _ s: ScreenBox) -> Bool { s.visible.contains(f) }
let first = WinFrame.restore(saved: nil, screens: [mainScreen], main: 0)
law("frame: the first open is centered on the main screen, 1280 x 820 at most", inside(first, mainScreen) && first.width == 1280 && first.height == 820 && abs(first.midX - 756) < 1)
let onExt = CGRect(x: 1800, y: 300, width: 1400, height: 900)
law("frame: its last frame on a screen still there comes back as it was", WinFrame.restore(saved: onExt, screens: [mainScreen, ext], main: 0) == onExt)
let gone = WinFrame.restore(saved: onExt, screens: [mainScreen], main: 0)
law("frame: its screen gone: on the main screen, never off every screen", inside(gone, mainScreen))
law("frame: half off a screen: pulled fully onto it", inside(WinFrame.restore(saved: CGRect(x: 1100, y: 100, width: 800, height: 600), screens: [mainScreen], main: 0), mainScreen))
law("frame: title bar under the menu bar or off the top: back on the screen",
    inside(WinFrame.restore(saved: CGRect(x: 100, y: 800, width: 800, height: 600), screens: [mainScreen], main: 0), mainScreen))
law("frame: bigger than the screen: the screen's size", WinFrame.restore(saved: CGRect(x: 0, y: 0, width: 4000, height: 3000), screens: [mainScreen], main: 0) == mainScreen.visible)

// the activation policy (lead m_8202)
law("policy: a Dock icon and ⌘Tab only while the window shows", WinPolicy.policy(windowShown: true, harness: false) == .regular && WinPolicy.policy(windowShown: false, harness: false) == .accessory)
law("policy: the harness never changes it (never activates)", WinPolicy.policy(windowShown: true, harness: true) == .unchanged)

// a drop: the folders add projects
law("drop: folders only, each once, in order",
    WinDrop.folders([("/a/x", true), ("/a/f.txt", false), ("/a/y/", true), ("/a/x", true)]) == ["/a/x", "/a/y"])
law("drop: no folder: nothing for the core (the page's drop)", WinDrop.folders([("/a/f.txt", false)]).isEmpty)

// the hidden title bar moves the window
law("drag: the top 38 px strip until the page says", WinDrag.moves(at: CGPoint(x: 500, y: 10), drag: nil, width: 1280) && !WinDrag.moves(at: CGPoint(x: 500, y: 60), drag: nil, width: 1280))
let rs = WinDrag.rects([[0, 0, 240, 52], [300, 0, 900, 52]])
law("drag: the page's rects (win_size drag) and nowhere else", rs?.count == 2 && WinDrag.moves(at: CGPoint(x: 400, y: 20), drag: rs, width: 1280) && !WinDrag.moves(at: CGPoint(x: 260, y: 20), drag: rs, width: 1280))
law("drag: the page says none: nothing moves it", !WinDrag.moves(at: CGPoint(x: 10, y: 10), drag: WinDrag.rects([]), width: 1280))

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all Win laws hold")
