// The laws of Backoff and Placement, run by build.sh --test through the
// swift interpreter (cat'ed after src/Always.swift).

import Foundation

var failures = 0
func law(_ name: String, _ ok: Bool) {
    if ok { print("ok   \(name)") } else { print("FAIL \(name)"); failures += 1 }
}

var b = Backoff()
law("a core that dies at once: 0.5, 1, 2, 4 ... up to 30",
    [b.after(lived: 0), b.after(lived: 1), b.after(lived: 0), b.after(lived: 2)] == [0.5, 1, 2, 4])
for _ in 0..<10 { _ = b.after(lived: 0) }
law("never more than 30 s", b.after(lived: 0) == 30)
law("never spins: a start that fails keeps the long delay", b.after(lived: 0) == 30)
law("a run that lived a minute starts again at 0.5", b.after(lived: 61) == 0.5)
var c = Backoff()
_ = c.after(lived: 0); _ = c.after(lived: 0)
c.reset()
law("reset (a wake, a new workspace): 0.5 again", c.after(lived: 0) == 0.5)

let main = ScreenBox(frame: CGRect(x: 0, y: 0, width: 1512, height: 982), visible: CGRect(x: 0, y: 0, width: 1512, height: 949))
let right = ScreenBox(frame: CGRect(x: 1512, y: -200, width: 2560, height: 1440), visible: CGRect(x: 1512, y: -200, width: 2560, height: 1415))
law("one menu bar: the first screen, wherever the mouse is",
    Placement.screen([main, right], mouse: CGPoint(x: 2000, y: 100), separateSpaces: false) == 0)
law("separate Spaces: the mouse's screen", Placement.screen([main, right], mouse: CGPoint(x: 2000, y: 100), separateSpaces: true) == 1)
law("the mouse between screens: the first", Placement.screen([main, right], mouse: CGPoint(x: -50, y: -50), separateSpaces: true) == 0)
law("no screen: none", Placement.screen([], mouse: .zero, separateSpaces: true) == nil)

let f = Placement.frame(CGSize(width: 360, height: 84), on: main)
law("top right: 20 px from the edge, 12 px under the menu bar", f.maxX == 1492 && f.maxY == 937 && f.width == 360)
let g = Placement.frame(CGSize(width: 470, height: 84), on: right)
law("on the second screen, in its own coordinates", g.maxX == 4052 && g.maxY == 1203)
let tall = Placement.frame(CGSize(width: 470, height: 2000), on: main)
law("never off-screen: a box taller than the screen stays inside", tall.minY >= main.visible.minY && tall.maxY <= main.visible.maxY)
let dock = ScreenBox(frame: CGRect(x: 0, y: 0, width: 1512, height: 982), visible: CGRect(x: 0, y: 0, width: 1440, height: 949))
law("a Dock on the right: the capsule stays left of it", Placement.frame(CGSize(width: 360, height: 84), on: dock).maxX <= 1440)

// round 9: the Spotlight-like bar (ambient m_6521)
let mac = ScreenBox(frame: CGRect(x: 0, y: 0, width: 1512, height: 982), visible: CGRect(x: 0, y: 0, width: 1512, height: 949))
let glass = CGRect(x: 76, y: 0, width: 700, height: 68)
let bar = Placement.bar(CGSize(width: 776, height: 70), glass: glass, on: mac)
law("bar: the glass centered on the screen", bar.minX + glass.midX == mac.frame.midX)
law("bar: the glass's top 170 px below the screen's top", bar.maxY == 982 - 170)
law("bar: the pearl at its left, inside the panel", bar.minX + 76 == bar.minX + glass.minX && bar.minX >= 0)
let taller = Placement.bar(CGSize(width: 776, height: 400), glass: CGRect(x: 76, y: 0, width: 700, height: 400), on: mac)
law("bar: it grows downward, the top never moves", taller.maxY == bar.maxY && taller.minX == bar.minX)
let huge = Placement.bar(CGSize(width: 776, height: 2000), glass: glass, on: mac)
law("bar: never off the screen", huge.minY >= mac.visible.minY && huge.maxY <= mac.visible.maxY)
let side = ScreenBox(frame: CGRect(x: 1512, y: 0, width: 1920, height: 1080), visible: CGRect(x: 1512, y: 0, width: 1920, height: 1055))
let onSide = Placement.bar(CGSize(width: 776, height: 70), glass: glass, on: side)
law("bar: on another screen, centered on that one", onSide.minX + glass.midX == side.frame.midX && onSide.maxY == 1080 - 170)
law("bar: an older page without glass: the whole box centered",
    Placement.bar(CGSize(width: 400, height: 70), glass: nil, on: mac).midX == mac.frame.midX)
law("bar's screen: the key window's", Placement.activeScreen([mac, side], keyWindowScreen: 1, mouse: .zero) == 1)
law("bar's screen: no key window: the mouse's", Placement.activeScreen([mac, side], keyWindowScreen: nil, mouse: CGPoint(x: 2000, y: 100)) == 1)
law("bar's screen: neither: the first", Placement.activeScreen([mac, side], keyWindowScreen: nil, mouse: CGPoint(x: -9, y: -9)) == 0)
law("bar's screen: a stale key screen index: the mouse's", Placement.activeScreen([mac], keyWindowScreen: 3, mouse: CGPoint(x: 5, y: 5)) == 0)

// round 9: who has his keys (KeyFocus, lead m_6551)
var kf = KeyFocus()
law("keys: a pushed card never takes them", kf.feed(.pushed) == .nothing && !kf.bar)
law("keys: a click on the pushed card takes them", kf.feed(.clicked) == .take && kf.bar)
law("keys: its close (a pick, esc, a click away) hands them back at once", kf.feed(.closed) == .giveBack && !kf.bar)
law("keys: a second close hands back nothing", kf.feed(.closed) == .nothing)
law("keys: what he opens takes them, once", kf.feed(.openedByHand) == .take && kf.feed(.openedByHand) == .nothing)
law("keys: a push while he has the bar changes nothing", kf.feed(.pushed) == .nothing && kf.bar)
_ = kf.feed(.closed)
law("keys: the answer to his own ask takes them", kf.feed(.answerToAsk) == .take)
law("keys: and its close hands them back", kf.feed(.closed) == .giveBack)

// harness A: nothing on his screens, ever (card #428)
let builtin = CGRect(x: 0, y: 0, width: 1512, height: 982)
let ext = CGRect(x: 1512, y: -200, width: 2560, height: 1440)
let offBar = Placement.bar(CGSize(width: 1004, height: 600), glass: CGRect(x: 84, y: 28, width: 860, height: 500), on: Placement.offScreen)
law("harness: the bar placed off-screen touches no screen", !Placement.touches(offBar, screens: [builtin, ext]))
law("harness guard: a panel on the built-in screen", Placement.touches(CGRect(x: 400, y: 300, width: 700, height: 100), screens: [builtin, ext]))
law("harness guard: a panel 1 pt over the edge", Placement.touches(CGRect(x: -699, y: 300, width: 700, height: 100), screens: [builtin]))
law("harness guard: a panel on a second screen", Placement.touches(CGRect(x: 3000, y: 0, width: 524, height: 900), screens: [builtin, ext]))
law("harness guard: an empty frame is nothing", !Placement.touches(.zero, screens: [builtin]))
law("harness guard: no screens, nothing touches", !Placement.touches(CGRect(x: 0, y: 0, width: 10, height: 10), screens: []))

// harness A's keep-off: AppKit's own windows too (TUINSWindow at 0,0, proof run #2)
let tui = CGRect(x: 0, y: 0, width: 500, height: 500)
law("keep-off: a window at 0,0 on the built-in goes off every screen, same size",
    Placement.keepOff(tui, screens: [builtin]).size == tui.size && !Placement.touches(Placement.keepOff(tui, screens: [builtin]), screens: [builtin, ext]))
law("keep-off: a window already off-screen stays where it is",
    Placement.keepOff(CGRect(x: -30000, y: -30000, width: 524, height: 900), screens: [builtin]) == CGRect(x: -30000, y: -30000, width: 524, height: 900))
law("keep-off: on a second screen too", !Placement.touches(Placement.keepOff(CGRect(x: 2000, y: 100, width: 50, height: 20), screens: [builtin, ext]), screens: [builtin, ext]))

// the panel's keys (round 10): opened by hand, it takes them; esc/⌘W hands them back
var pk = KeyFocus()
law("panel keys: opening it takes them", pk.feed(.openedByHand) == .take)
law("panel keys: a click in it while it has them: nothing more", pk.feed(.clicked) == .nothing)
law("panel keys: esc or ⌘W hands them back to his app", pk.feed(.closed) == .giveBack)
law("panel keys: a click in it later takes them again", pk.feed(.clicked) == .take)

// esc without fn (lead m_8105, harness A bug 1c)
func esc(_ shown: Bool, keys: Bool, ready: Bool = true, speaking: Bool = false, _ content: String) -> EscRoute {
    EscRoute.route(barShown: shown, barHasKeys: keys, pageReady: ready, speaking: speaking, content: content)
}
law("esc: fn 0 / fn i open with the keys: the page's (steps back, the app keeps the bar and the keys)", esc(true, keys: true, "open") == .page)
law("esc: a card with the keys: the page's (puts it off)", esc(true, keys: true, "needs") == .page)
law("esc: the spotlight field, a talk, the hello with the keys: the page's",
    [esc(true, keys: true, "type"), esc(true, keys: true, "talk"), esc(true, keys: true, "hello")] == [.page, .page, .page])
law("esc: a pushed card without the keys: the app hides the bar", esc(true, keys: false, "needs") == .dismiss)
law("esc: nothing to step back from (none, a line, got, an answer) even with the keys: the app hides it",
    [esc(true, keys: true, "none"), esc(true, keys: true, "line"), esc(true, keys: true, "got"), esc(true, keys: true, "answer")] == [.dismiss, .dismiss, .dismiss, .dismiss])
law("esc: main speaks with the keys: the page hushes on its own key", esc(true, keys: true, speaking: true, "answer") == .page)
law("esc: main speaks without the keys: the app tells the page", esc(true, keys: false, speaking: true, "answer") == .post)
law("esc: the page not loaded: the app hides the bar", esc(true, keys: true, ready: false, "open") == .dismiss)
law("esc: the bar hidden: his esc only", esc(false, keys: false, "none") == .nothing)

// S8 (desktop v9): cards and the talk at the bottom centre, the dropdown under the icon
let low = Placement.bar(CGSize(width: 776, height: 70), glass: glass, on: mac, at: .bottom)
law("bottom: the glass centered on the screen", low.minX + glass.midX == mac.frame.midX)
law("bottom: the glass's bottom 96 px above the visible area's (the Dock)", low.maxY - glass.maxY == mac.visible.minY + Placement.barBottom)
let lowTall = Placement.bar(CGSize(width: 776, height: 400), glass: CGRect(x: 76, y: 0, width: 700, height: 400), on: mac, at: .bottom)
law("bottom: it grows upward, the glass's bottom never moves", lowTall.maxY - 400 == low.maxY - glass.maxY)
law("bottom: never off the screen", Placement.bar(CGSize(width: 776, height: 2000), glass: glass, on: mac, at: .bottom).maxY <= mac.visible.maxY)
let icon = CGRect(x: 1300, y: 949, width: 30, height: 33)
let drop = Placement.bar(CGSize(width: 776, height: 300), glass: glass, on: mac, at: .menu(icon))
law("menu: the glass's top 6 px under the icon (the DS)", drop.maxY == icon.minY - Placement.menuGap)
law("menu: near the right edge, kept on the screen (not centered past it)", drop.maxX <= mac.visible.maxX && drop.minX >= mac.visible.minX)
let iconMid = CGRect(x: 700, y: 949, width: 30, height: 33)
law("menu: centered on the icon when there is room", Placement.bar(CGSize(width: 776, height: 300), glass: glass, on: mac, at: .menu(iconMid)).minX + glass.midX == iconMid.midX)
law("anchor: what bise brings shows at the bottom", Placement.anchorAtShow(asked: nil) == .bottom)
law("anchor: what he opens shows where it asked (top, the dropdown)",
    Placement.anchorAtShow(asked: .top) == .top && Placement.anchorAtShow(asked: .menu(icon)) == .menu(icon))
// harness A's fake pearl (App.harnessIcon, status_click): top right of the off-screen box
let fakeIcon = CGRect(x: Placement.offScreen.frame.maxX - 220, y: Placement.offScreen.frame.maxY - 24, width: 30, height: 24)
let fakeDrop = Placement.bar(CGSize(width: 776, height: 300), glass: glass, on: Placement.offScreen, at: .menu(fakeIcon))
law("harness: the dropdown under the fake pearl touches no screen and sits under it",
    !Placement.touches(fakeDrop, screens: [builtin, ext]) && fakeDrop.maxY == fakeIcon.minY - Placement.menuGap)
law("harness: the bar at the bottom or under an icon stays off-screen there",
    !Placement.touches(Placement.bar(CGSize(width: 1004, height: 600), glass: glass, on: Placement.offScreen, at: .bottom), screens: [builtin, ext]))

// the keys back (lead m_8549): the spotlight over bise's window gives them to the window
law("keys back: the window had them and still shows: the window", KeyBack.after(fromWindow: true, windowShown: true, fromApp: false) == .window)
law("keys back: the window had them but closed since: his app", KeyBack.after(fromWindow: true, windowShown: false, fromApp: true) == .app)
law("keys back: his app had them: his app", KeyBack.after(fromWindow: false, windowShown: true, fromApp: true) == .app)
law("keys back: nobody to give them to: nothing", KeyBack.after(fromWindow: false, windowShown: false, fromApp: false) == .nothing)

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all Always laws hold")
