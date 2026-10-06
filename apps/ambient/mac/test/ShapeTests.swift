// The laws of CapsuleShape (app_size → the blur's rects), run by build.sh
// --test through the swift interpreter (cat'ed after src/Shape.swift).

import CoreGraphics
import Foundation

var failures = 0
func law(_ name: String, _ ok: Bool) {
    if ok { print("ok   \(name)") } else { print("FAIL \(name)"); failures += 1 }
}

// amb-web m_6490: the pearl at the left, overlapping the glass by 12 px
let msg: [String: Any] = ["cmd": "app_size", "w": 416, "h": 98, "radius": 16,
                          "glass": ["x": 56, "y": 0, "w": 360, "h": 98]]
let s = CapsuleShape.from(msg, maxHeight: 700)!
let panel = CGSize(width: 416, height: 98)
let rects = s.blurRects(panel: panel)
law("the glass is read", s.glass == CGRect(x: 56, y: 0, width: 360, height: 98))
law("the blur only behind the glass", rects == [CGRect(x: 56, y: 0, width: 360, height: 98)])
law("never behind the pearl: nothing left of the glass", rects.allSatisfy { $0.minX >= 56 })

let wide = s.blurRects(panel: CGSize(width: 500, height: 120))
law("a wider panel (shrinks 650 ms later): anchored at the top right", wide == [CGRect(x: 140, y: 0, width: 360, height: 98)])

var withNote = msg
withNote["note"] = ["y": 110, "h": 60, "radius": 16]
let n = CapsuleShape.from(withNote, maxHeight: 700)!
law("the note under the glass, as wide as the glass",
    n.blurRects(panel: CGSize(width: 416, height: 170)) == [CGRect(x: 56, y: 0, width: 360, height: 98), CGRect(x: 56, y: 110, width: 360, height: 60)])
law("the window holds the note", n.box == CGSize(width: 416, height: 170))

let old = CapsuleShape.from(["w": 360, "h": 84, "radius": 16], maxHeight: 700)!
law("an older page without glass: the whole box", old.glass == nil && old.blurRects(panel: CGSize(width: 360, height: 84)) == [CGRect(x: 0, y: 0, width: 360, height: 84)])
law("a glass past the box is cut to it",
    CapsuleShape.from(["w": 400, "h": 98, "glass": ["x": 56, "y": 0, "w": 900, "h": 98]], maxHeight: 700)!.glass?.maxX == 400)
law("an empty glass is ignored", CapsuleShape.from(["w": 400, "h": 98, "glass": ["x": 56, "y": 0, "w": 0, "h": 98]], maxHeight: 700)!.glass == nil)
// ghost glass (ambient gate pass 2): the page says no glass, the blur goes
var none = msg
none["glass"] = NSNull()
law("glass: null → no blur at all", CapsuleShape.from(none, maxHeight: 700)!.blurRects(panel: panel).isEmpty)
law("a glass with no height → no blur at all",
    CapsuleShape.from(["w": 840, "h": 98, "glass": ["x": 80, "y": 28, "w": 700, "h": 0]], maxHeight: 700)!.blurRects(panel: panel).isEmpty)
law("no glass key at all (an older page) → the whole box still", !CapsuleShape.from(["w": 360, "h": 84], maxHeight: 700)!.blurRects(panel: CGSize(width: 360, height: 84)).isEmpty)
// the mouse only inside the glass (ambient m_6702: a click 10 px outside
// reaches the app below)
let box = CGSize(width: 840, height: 338)
let r9 = CapsuleShape.from(["w": 840, "h": 338, "radius": 26, "glass": ["x": 80, "y": 28, "w": 700, "h": 218]], maxHeight: 700)!
law("mouse: inside the glass, taken", r9.takesMouse(at: CGPoint(x: 400, y: 100), panel: box))
law("mouse: 10 px left of the glass, through", !r9.takesMouse(at: CGPoint(x: 70, y: 100), panel: box))
law("mouse: 10 px above the glass, through", !r9.takesMouse(at: CGPoint(x: 400, y: 18), panel: box))
law("mouse: 10 px under the glass (its drawn shadow), through", !r9.takesMouse(at: CGPoint(x: 400, y: 256), panel: box))
law("mouse: on the pearl (x 4..68), through", !r9.takesMouse(at: CGPoint(x: 36, y: 60), panel: box))
law("mouse: no glass shown, nothing taken", !CapsuleShape.from(none, maxHeight: 700)!.takesMouse(at: CGPoint(x: 400, y: 50), panel: panel))
// lead m_8105: the pass-through from where the pointer is now (screen
// coords, y up), whatever moved last; the panel at (100, 500), 840 x 338
let fr = CGRect(x: 100, y: 500, width: 840, height: 338)
law("pointer over the glass: the panel takes the click (no move needed)",
    !r9.ignoresMouse(pointer: CGPoint(x: 100 + 400, y: 500 + 338 - 100), frame: fr))
law("pointer left of the glass: through", r9.ignoresMouse(pointer: CGPoint(x: 100 + 70, y: 500 + 338 - 100), frame: fr))
law("pointer elsewhere on the screen: through", r9.ignoresMouse(pointer: CGPoint(x: 5, y: 5), frame: fr))
law("no pointer known: in doubt the glass takes the click", !r9.ignoresMouse(pointer: nil, frame: fr))
law("a new glass under the same still pointer changes the answer",
    !CapsuleShape.from(["w": 840, "h": 338, "glass": ["x": 0, "y": 0, "w": 840, "h": 338]], maxHeight: 700)!
        .ignoresMouse(pointer: CGPoint(x: 100 + 70, y: 500 + 338 - 100), frame: fr))
law("the page says no glass: through", CapsuleShape.from(none, maxHeight: 700)!.ignoresMouse(pointer: CGPoint(x: 500, y: 700), frame: fr))
law("too small a box: no shape", CapsuleShape.from(["w": 10, "h": 98], maxHeight: 700) == nil)

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all Shape laws hold")
