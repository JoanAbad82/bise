// Quiet: when bise must not talk (docs/ambient-roadmap.md "it knows when
// not to talk"), as pure logic: QuietMonitor.swift samples the mic and the
// calendar, this decides. A call = the default input device runs while
// bise's own mic is closed; a meeting = a calendar event now. While quiet
// the core answers in text only and the capsule holds the non-urgent cards.
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
    private(set) var meeting = false
    private(set) var fullScreen = false
    private var busySince: Double? = nil
    private var freeSince: Double? = nil
    private var ownOpen = false
    private var ownClosedAt = -1000.0
    private var said: (on: Bool, why: String)? = nil

    init() {}

    var on: Bool { call || meeting || fullScreen }
    // a call wins: it's the one that's live; then a meeting, then full screen
    var why: String { call ? "call" : meeting ? "meeting" : fullScreen ? "full_screen" : "" }

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

    mutating func meeting(_ now: Bool) { meeting = now }

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

// a calendar event, as much as the decision needs (EventKit's EKEvent in the app)
struct CalendarEvent {
    var start: Date
    var end: Date
    var allDay: Bool
    var busy: Bool          // availability isn't "free"
    var declined: Bool      // my own answer is "declined"
    var attendees: Int      // other people invited

    // a meeting now: a timed, busy event with other people, not declined, around `now`
    static func meetingNow(_ events: [CalendarEvent], now: Date) -> Bool {
        events.contains { e in
            !e.allDay && e.busy && !e.declined && e.attendees > 0 && e.start <= now && now < e.end
        }
    }
}
