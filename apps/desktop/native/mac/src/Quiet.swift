// Quiet: when bise must not talk (docs/ambient-roadmap.md "it knows when
// not to talk"), as pure logic (cut from the Swift app): QuietMonitor.swift
// samples the mic, the cameras and a shared screen, the helper reads full
// screen, this decides, and the helper says {ev:'quiet', on, why} on a
// change. A call = the default input device or a camera runs while bise's
// own mic is closed. The calendar isn't read (Gabriel, Apple audit #554:
// no calendar permission). While quiet the core answers in text only and
// the capsule holds the non-urgent cards.
//
// The mic is shared: while bise talks (and a few seconds after, while the
// core closes its mic) "the device runs" says nothing, so the call state is
// frozen then. A call starts after `onAfter` s of a busy device and ends
// after `offAfter` s of a free one (a blip is not a call).

import Foundation

struct QuietMachine {
    var onAfter = 2.0
    var offAfter = 3.0
    var ownGrace = 3.0          // after bise's own talk ends, the device may still run

    private(set) var call = false
    private(set) var fullScreen = false
    private(set) var camera = false     // a camera runs somewhere: a video call (S9)
    private(set) var sharing = false    // his screen is shared or recorded (S9)
    private var camBusySince: Double? = nil
    private var camFreeSince: Double? = nil
    private var busySince: Double? = nil
    private var freeSince: Double? = nil
    private var ownOpen = false
    private var ownClosedAt = -1000.0
    private var said: (on: Bool, why: String)? = nil

    init() {}

    var on: Bool { call || camera || sharing || fullScreen }
    // a call wins (the mic or a camera): it's the one that's live; then a shared
    // screen, full screen. His 'quiet for 1 h' is the tray's
    // (Electron ORs it in). macOS Focus isn't read (no API without a new
    // permission: lead m_9029). The words are bise_proto::helper::QuietWhy's.
    var why: String {
        call || camera ? "call" : sharing ? "sharing" : fullScreen ? "full_screen" : ""
    }

    // bise's own mic (talk_start .. talk_end / cancel)
    mutating func own(open: Bool, at t: Double) {
        if ownOpen && !open { ownClosedAt = t }
        ownOpen = open
    }

    private func ownBusy(_ t: Double) -> Bool { ownOpen || t - ownClosedAt < ownGrace }

    // a sample of the default input device: is it running somewhere?
    mutating func mic(running: Bool, at t: Double) {
        if ownBusy(t) { busySince = nil; freeSince = nil; return }   // frozen: can't tell
        if running {
            freeSince = nil
            if busySince == nil { busySince = t }
            if !call, let b = busySince, t - b >= onAfter { call = true }
        } else {
            busySince = nil
            if freeSince == nil { freeSince = t }
            if call, let f = freeSince, t - f >= offAfter { call = false }
        }
    }

    // a sample of the cameras: does one run somewhere? bise never opens one,
    // so no grace; the same on/off delays as the mic (a blip is not a call)
    mutating func camera(running: Bool, at t: Double) {
        if running {
            camFreeSince = nil
            if camBusySince == nil { camBusySince = t }
            if !camera, let b = camBusySince, t - b >= onAfter { camera = true }
        } else {
            camBusySince = nil
            if camFreeSince == nil { camFreeSince = t }
            if camera, let f = camFreeSince, t - f >= offAfter { camera = false }
        }
    }

    // his screen is shared or recorded (a call's share, a recording app)
    mutating func sharing(_ now: Bool) { sharing = now }

    // the front app fills a screen (a video, a talk, a game)
    mutating func fullScreen(_ now: Bool) { fullScreen = now }

    // the app_quiet event to send, only when (on, why) changed
    mutating func change() -> (on: Bool, why: String)? {
        let now = (on, why)
        if let s = said, s.on == now.0, s.why == now.1 { return nil }
        // the first word is only worth saying when it's quiet
        if said == nil && !now.0 { said = now; return nil }
        said = now
        return now
    }
}
