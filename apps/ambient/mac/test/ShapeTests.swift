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
law("too small a box: no shape", CapsuleShape.from(["w": 10, "h": 98], maxHeight: 700) == nil)

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all Shape laws hold")
