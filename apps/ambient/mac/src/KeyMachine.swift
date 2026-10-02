// KeyMachine: what fn and right option mean, as a pure state machine (no
// AppKit, no event tap): Keys.swift feeds it the tap's events and acts on
// its outputs. Tested by build.sh --test (the swift interpreter, no binary).
//
// fn (and right option, the fallback for keyboards without fn):
//   held past `holdAfter` with no other key   -> talkStart; release -> talkEnd
//   tapped (released before `holdAfter`)      -> tap; two taps within
//                                                `doubleWithin` -> double:
//                                                hands-free, until the
//                                                next tap or fn release -> talkEnd
// fn + a bise key (SPEC §4) is swallowed, before or after the hold began:
//   fn + esc while talking -> cancel; any other bise key while talking
//   -> cancel, then the key. fn + another key (arrows, delete, F-keys)
//   passes and spoils the hold. Right option never swallows: any key or
//   modifier with it spoils it (it's ⌥ + a letter, typing).

import Foundation

enum TalkKey: Equatable { case fn, rightOption }

enum KeyOut: Equatable {
    case talkStart(TalkKey)
    case talkEnd
    case cancel
    case tap
    case double
    case key(String)
    case plainEsc                // esc without fn: passes, and hides bise (§8)
}

// a key event as the machine sees it
enum KeyIn: Equatable {
    case fnDown, fnUp
    case roptDown, roptUp
    case otherModifiers          // shift, control, option (left), command changed
    case keyDown(Int, repeated: Bool)
    case keyUp(Int)
    case tick                    // a timer: maybe the hold threshold passed
}

// the bise keys after fn (SPEC §4), by macOS virtual key code (ANSI
// positions: fn + 1 is the key 1 of the top row, whatever the layout)
let biseKeys: [Int: String] = [
    49: "space", 18: "1", 19: "2", 20: "3", 21: "4", 23: "5", 22: "6", 26: "7",
    28: "8", 25: "9", 29: "0", 34: "i", 31: "o", 47: ".", 36: "enter", 76: "enter",
    53: "esc",
]

struct KeyMachine {
    var holdAfter: Double = 0.25
    var doubleWithin: Double = 0.4
    var rightOption = true       // the fallback key (a setting)

    private(set) var fnIsDown = false
    private var fnAt = 0.0
    private var fnSpoiled = false    // a key came with fn: not a talk, not a tap
    private var roptIsDown = false
    private var roptAt = 0.0
    private var roptSpoiled = false
    private(set) var talking: TalkKey? = nil   // a hold is on
    private(set) var handsFree = false
    private var lastTap = -10.0
    private var swallowed = Set<Int>()   // key codes whose keyDown we ate: eat their keyUp

    init() {}

    // the time the caller should call `.tick` at, if any
    var nextTick: Double? {
        if fnIsDown && !fnSpoiled && talking == nil { return fnAt + holdAfter }
        if roptIsDown && !roptSpoiled && talking == nil { return roptAt + holdAfter }
        return nil
    }

    // feed one event at time `t` (seconds): (swallow it?, what to do)
    mutating func feed(_ e: KeyIn, at t: Double) -> (swallow: Bool, out: [KeyOut]) {
        var out: [KeyOut] = []
        var swallow = false
        switch e {
        case .fnDown:
            if !fnIsDown { fnIsDown = true; fnAt = t; fnSpoiled = false }
        case .fnUp:
            guard fnIsDown else { break }
            fnIsDown = false
            if talking == .fn {
                talking = nil
                out.append(.talkEnd)
            } else if handsFree && !fnSpoiled {
                handsFree = false
                out.append(.talkEnd)
            } else if !fnSpoiled && t - fnAt < holdAfter {
                out.append(contentsOf: tapped(t))
            }
        case .roptDown:
            guard rightOption, !roptIsDown else { break }
            roptIsDown = true; roptAt = t
            roptSpoiled = fnIsDown || talking != nil
        case .roptUp:
            guard roptIsDown else { break }
            roptIsDown = false
            if talking == .rightOption {
                talking = nil
                out.append(.talkEnd)
            } else if !roptSpoiled && t - roptAt < holdAfter {
                out.append(contentsOf: tapped(t))
            }
        case .otherModifiers:
            if roptIsDown { out.append(contentsOf: spoilRopt()) }
        case .keyDown(let code, let repeated):
            if fnIsDown, let name = biseKeys[code] {
                swallow = true
                swallowed.insert(code)
                if repeated { break }
                fnSpoiled = true
                if name == "esc" && (talking != nil || handsFree) {
                    talking = nil; handsFree = false
                    out.append(.cancel)
                } else {
                    if talking != nil { talking = nil; out.append(.cancel) }
                    out.append(.key(name))
                }
            } else {
                if code == 53 && !fnIsDown && !repeated { out.append(.plainEsc) }
                if fnIsDown && !fnSpoiled {
                    fnSpoiled = true
                    if talking == .fn { talking = nil; out.append(.cancel) }
                }
                if roptIsDown { out.append(contentsOf: spoilRopt()) }
            }
        case .keyUp(let code):
            if swallowed.remove(code) != nil { swallow = true }
        case .tick:
            if talking == nil && !handsFree {
                if fnIsDown && !fnSpoiled && t - fnAt >= holdAfter {
                    talking = .fn; out.append(.talkStart(.fn))
                } else if roptIsDown && !roptSpoiled && t - roptAt >= holdAfter {
                    talking = .rightOption; out.append(.talkStart(.rightOption))
                }
            }
        }
        return (swallow, out)
    }

    private mutating func spoilRopt() -> [KeyOut] {
        guard !roptSpoiled else { return [] }
        roptSpoiled = true
        if talking == .rightOption { talking = nil; return [.cancel] }
        return []
    }

    private mutating func tapped(_ t: Double) -> [KeyOut] {
        if handsFree {
            handsFree = false
            return [.talkEnd]
        }
        if t - lastTap < doubleWithin {
            lastTap = -10
            handsFree = true
            return [.double]
        }
        lastTap = t
        return [.tap]
    }
}
