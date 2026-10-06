// biseqa: the VM pass's probe, run INSIDE the macOS guest (never on his Mac), in the guest user's
// Aqua session (launchctl asuser). It posts what VNC can't type (fn: VNC has no fn keysym) and reads
// what the window server says (the front app, bise's windows on screen).
//
//   biseqa fn hold <ms>          fn down, <ms>, fn up (flagsChanged, keycode 63, maskSecondaryFn)
//   biseqa fn twice              two fn taps 120 ms apart
//   biseqa fn key <keycode>      fn down, the key down/up carrying the fn flag, fn up (space = 49)
//   biseqa front                 {"bundle","pid","name"} of the frontmost app
//   biseqa windows <owner>       every on-screen window of that owner: layer, bounds, alpha, onscreen
//   biseqa screen                the main screen's size in points and its scale
//   biseqa trusted               {"accessibility": AXIsProcessTrusted()} for this probe
//   biseqa ocr <png>             the text Vision reads in a frame, one JSON line per text box
//                                {"text","x","y","w","h"} in pixels from the top left (runs on the
//                                host too: it reads a file, never a screen)
//
// The events go in at the HID tap (cghidEventTap), so every session tap sees them as it sees a
// keyboard: bise-mac-helper's tap included. Posting needs this probe to be trusted for
// Accessibility in the guest (granted once over VNC, README.md). Build: swiftc -O biseqa.swift.
import AppKit
import ApplicationServices
import CoreGraphics
import Foundation
import Vision

let kVKFunction: CGKeyCode = 63

func post(_ e: CGEvent?) {
    e?.post(tap: .cghidEventTap)
}

func fnFlag(_ down: Bool) {
    let e = CGEvent(keyboardEventSource: nil, virtualKey: kVKFunction, keyDown: down)
    e?.type = .flagsChanged
    e?.flags = down ? .maskSecondaryFn : []
    post(e)
}

func sleepMs(_ ms: Int) {
    usleep(useconds_t(ms * 1000))
}

func json(_ v: Any) {
    let d = try? JSONSerialization.data(withJSONObject: v, options: [.sortedKeys])
    print(String(data: d ?? Data("null".utf8), encoding: .utf8) ?? "null")
}

let args = Array(CommandLine.arguments.dropFirst())
switch args.first {
case "fn":
    switch args.dropFirst().first {
    case "hold":
        let ms = Int(args.dropFirst(2).first ?? "") ?? 800
        fnFlag(true)
        sleepMs(ms)
        fnFlag(false)
    case "twice":
        fnFlag(true); sleepMs(60); fnFlag(false)
        sleepMs(120)
        fnFlag(true); sleepMs(60); fnFlag(false)
    case "key":
        let code = CGKeyCode(Int(args.dropFirst(2).first ?? "") ?? 49)
        fnFlag(true)
        sleepMs(40)
        for down in [true, false] {
            let k = CGEvent(keyboardEventSource: nil, virtualKey: code, keyDown: down)
            k?.flags = .maskSecondaryFn
            post(k)
            sleepMs(30)
        }
        fnFlag(false)
    default:
        FileHandle.standardError.write(Data("biseqa fn hold <ms> | twice | key <keycode>\n".utf8))
        exit(2)
    }
    sleepMs(50)
case "front":
    let a = NSWorkspace.shared.frontmostApplication
    json(["bundle": a?.bundleIdentifier ?? "", "pid": Int(a?.processIdentifier ?? -1), "name": a?.localizedName ?? ""])
case "windows":
    let owner = args.dropFirst().first ?? "bise"
    let list = (CGWindowListCopyWindowInfo([.optionOnScreenOnly], kCGNullWindowID) as? [[String: Any]]) ?? []
    let mine = list.filter { ($0[kCGWindowOwnerName as String] as? String) == owner }.map { w -> [String: Any] in
        let b = (w[kCGWindowBounds as String] as? [String: Any]) ?? [:]
        return [
            "layer": w[kCGWindowLayer as String] as? Int ?? 0,
            "name": w[kCGWindowName as String] as? String ?? "",
            "alpha": w[kCGWindowAlpha as String] as? Double ?? 0,
            "onscreen": w[kCGWindowIsOnscreen as String] as? Bool ?? false,
            "x": b["X"] ?? 0, "y": b["Y"] ?? 0, "w": b["Width"] ?? 0, "h": b["Height"] ?? 0,
        ]
    }
    json(mine)
case "ocr":
    guard let file = args.dropFirst().first, let img = NSImage(contentsOfFile: file),
          let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        FileHandle.standardError.write(Data("biseqa ocr <png>: can't read the image\n".utf8))
        exit(2)
    }
    let req = VNRecognizeTextRequest()
    req.recognitionLevel = .accurate
    req.usesLanguageCorrection = false
    try? VNImageRequestHandler(cgImage: cg).perform([req])
    let W = Double(cg.width), H = Double(cg.height)
    for o in req.results ?? [] {
        guard let t = o.topCandidates(1).first else { continue }
        let b = o.boundingBox
        json(["text": t.string, "x": Int(b.minX * W), "y": Int((1 - b.maxY) * H), "w": Int(b.width * W), "h": Int(b.height * H)])
    }
case "screen":
    let f = NSScreen.main?.frame ?? .zero
    json(["w": Int(f.width), "h": Int(f.height), "scale": Double(NSScreen.main?.backingScaleFactor ?? 1)])
case "trusted":
    json(["accessibility": AXIsProcessTrusted()])
default:
    FileHandle.standardError.write(Data("biseqa fn ... | front | windows <owner> | trusted | ocr <png>\n".utf8))
    exit(2)
}
