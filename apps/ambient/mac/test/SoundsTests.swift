// The laws of SoundPlan, run by build.sh --test through the swift
// interpreter (cat'ed after src/Sounds.swift).

import Foundation

var failures = 0
func law(_ name: String, _ ok: Bool) {
    if ok { print("ok   \(name)") } else { print("FAIL \(name)"); failures += 1 }
}

let on = SoundGate()
func s(_ c: SoundCue, _ g: SoundGate = on) -> Sound? { SoundPlan.sound(for: c, g) }

law("the mic opens for a talk: listen", s(.talkOpened) == .listen)
law("the core takes his ask: think", s(.sent) == .think)
law("a new card opens the glass: need", s(.cards(now: ["7"], seen: [])) == .need)
law("a new card among old ones: need once", s(.cards(now: ["3", "7"], seen: ["3"])) == .need)

law("a chord (fn 1, fn o, fn ., fn space): nothing", s(.chord) == nil)
law("fn up: no end sound (think follows)", s(.talkEnd) == nil)
law("a cancelled hold: nothing", s(.cancelled) == nil)
law("a hold that asks a permission instead: nothing", s(.talkAsked) == nil)
law("main's answer, done, failed, a page: nothing", [SoundCue.mainText, .done, .failed, .page].allSatisfy { s($0) == nil })
law("he opens the inbox, a re-show, the fold into the count: nothing",
    [SoundCue.inboxOpened, .reshow, .fold].allSatisfy { s($0) == nil })
law("the first state after a launch: no need", s(.cards(now: ["7"], seen: nil)) == nil)
law("the same cards again: no need", s(.cards(now: ["7"], seen: ["7"])) == nil)
law("a card closed: no need", s(.cards(now: [], seen: ["7"])) == nil)

let every: [SoundCue] = [.talkOpened, .sent, .cards(now: ["9"], seen: [])]
law("the 'sounds' setting off: silent", every.allSatisfy { s($0, SoundGate(setting: false)) == nil })
law("macOS UI sound effects off: silent", every.allSatisfy { s($0, SoundGate(uiSounds: false)) == nil })
law("quiet (a call, a meeting, full screen): silent", every.allSatisfy { s($0, SoundGate(quiet: true)) == nil })
law("a Focus / Do Not Disturb: silent", every.allSatisfy { s($0, SoundGate(focus: true)) == nil })

let rec = #"{"data":[{"storeAssertionRecords":[{"assertionDetails":{"assertionDetailsModeIdentifier":"com.apple.donotdisturb.mode.default"}}]}]}"#
law("Focus: a record → on", SoundPlan.focusOn(assertions: rec.data(using: .utf8)))
law("Focus: no record → off", !SoundPlan.focusOn(assertions: #"{"data":[{"storeAssertionRecords":[]}]}"#.data(using: .utf8)))
law("Focus: an unreadable file → off", !SoundPlan.focusOn(assertions: nil) && !SoundPlan.focusOn(assertions: Data("x".utf8)))

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all Sounds laws hold")
