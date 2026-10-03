import CoreGraphics
import Foundation

// the page's boxes in CSS px (app_size): the panel's box at the top right
// of the web view (the pearl and the glass), the glass inside it, and the
// optional note under the glass. Pure (the laws in test/ShapeTests.swift).
// The pearl floats with no background (the user's dogfood, L1): the blur
// only behind the glass rect and the note, never behind the pearl.
struct CapsuleShape: Equatable {
    var w: CGFloat = 360
    var h: CGFloat = 84
    var radius: CGFloat = 44
    var note: Note? = nil
    // the glass inside the box (amb-web m_6490: {x, y, w, h}, x = 56 with
    // the pearl at its left); nil = the whole box (an older page)
    var glass: CGRect? = nil
    var noGlass = false     // the page said no glass: no blur anywhere
    struct Note: Equatable { var y: CGFloat; var h: CGFloat; var radius: CGFloat }

    // the window must hold both boxes
    var box: CGSize {
        var hh = h
        if let n = note { hh = max(hh, n.y + n.h) }
        if let g = glass { hh = max(hh, g.maxY) }
        return CGSize(width: w, height: hh)
    }

    static func from(_ c: [String: Any], maxHeight: CGFloat) -> CapsuleShape? {
        func num(_ o: [String: Any], _ k: String) -> CGFloat? { (o[k] as? NSNumber).map { CGFloat($0.doubleValue) } }
        guard let w = num(c, "w"), let h = num(c, "h"), w >= 40, h >= 20 else { return nil }
        var s = CapsuleShape(w: min(w, 900), h: min(h, maxHeight), radius: num(c, "radius") ?? 40, note: nil)
        if let n = c["note"] as? [String: Any], let y = num(n, "y"), let nh = num(n, "h"), nh > 0 {
            s.note = Note(y: y, h: min(nh, max(0, maxHeight - y)), radius: num(n, "radius") ?? 24)
        }
        // 'glass': null, or a glass with no height: the page shows no glass
        // (a leave, a pearl-only moment): no blur at all, on that same frame
        if c["glass"] is NSNull { s.noGlass = true }
        if let g = c["glass"] as? [String: Any], (num(g, "h") ?? 1) <= 0 || (num(g, "w") ?? 1) <= 0 { s.noGlass = true }
        if let g = c["glass"] as? [String: Any], let gx = num(g, "x"), let gy = num(g, "y"),
           let gw = num(g, "w"), let gh = num(g, "h"), gw > 0, gh > 0 {
            // inside the box, never past it
            let x = max(0, min(gx, s.w - 1)), y = max(0, gy)
            s.glass = CGRect(x: x, y: y, width: min(gw, s.w - x), height: min(gh, maxHeight - y))
        }
        return s
    }

    // where the blur goes, in the panel's flipped coords (y down), the box
    // anchored at the panel's top right: the glass (the whole box without
    // one), then the note under it, as wide as the glass
    func blurRects(panel: CGSize) -> [CGRect] {
        if noGlass { return [] }
        let bx = panel.width - w
        let g = glass ?? CGRect(x: 0, y: 0, width: w, height: h)
        var out = [CGRect(x: bx + g.minX, y: g.minY, width: g.width, height: g.height)]
        if let n = note { out.append(CGRect(x: bx + g.minX, y: n.y, width: g.width, height: n.h)) }
        return out
    }
}
