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

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all Always laws hold")
