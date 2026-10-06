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

// round 10: the side panel, docked right, full height under the menu bar
let sbox = ScreenBox(frame: CGRect(x: 0, y: 0, width: 1512, height: 982), visible: CGRect(x: 0, y: 0, width: 1512, height: 949))
let sglass = CGRect(x: 84, y: 0, width: Placement.sideWidth, height: Placement.sideHeight(on: sbox))
let sf = Placement.side(CGSize(width: 84 + 440, height: sglass.height), glass: sglass, on: sbox)
law("side panel: the glass's right edge on the screen's right edge", sf.minX + sglass.maxX == sbox.visible.maxX)
law("side panel: its top right under the menu bar", sf.maxY == sbox.visible.maxY)
law("side panel: full height of the visible area", sf.height == sbox.visible.height)
law("side panel: the pearl's 84 px at the glass's left", sf.width == 524 && sf.minX == 1512 - 524)
let sideTall = Placement.side(CGSize(width: 524, height: 5000), glass: CGRect(x: 84, y: 0, width: 440, height: 5000), on: sbox)
law("side panel: a page taller than the screen is cut to the visible area", sideTall.minY == sbox.visible.minY && sideTall.maxY == sbox.visible.maxY)
let r2 = ScreenBox(frame: CGRect(x: 1512, y: -200, width: 2560, height: 1440), visible: CGRect(x: 1512, y: -200, width: 2560, height: 1415))
let sf2 = Placement.side(CGSize(width: 524, height: 1415), glass: CGRect(x: 84, y: 0, width: 440, height: 1415), on: r2)
law("side panel on a second screen: docked to that screen's right edge", sf2.minX + 524 == r2.visible.maxX && sf2.maxY == r2.visible.maxY)
law("side panel: no glass key (an older page): the whole box docked right", Placement.side(CGSize(width: 440, height: 949), glass: nil, on: sbox).maxX == sbox.visible.maxX)

// harness A: nothing on his screens, ever (card #428)
let builtin = CGRect(x: 0, y: 0, width: 1512, height: 982)
let ext = CGRect(x: 1512, y: -200, width: 2560, height: 1440)
let offBar = Placement.bar(CGSize(width: 1004, height: 600), glass: CGRect(x: 84, y: 28, width: 860, height: 500), on: Placement.offScreen)
law("harness: the bar placed off-screen touches no screen", !Placement.touches(offBar, screens: [builtin, ext]))
let offSide = Placement.side(CGSize(width: 524, height: 5000), glass: CGRect(x: 84, y: 0, width: 440, height: 5000), on: Placement.offScreen)
law("harness: the side panel placed off-screen touches no screen", !Placement.touches(offSide, screens: [builtin, ext]))
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

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all Always laws hold")
