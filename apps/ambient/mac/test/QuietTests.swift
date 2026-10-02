// The laws of QuietMachine and CalendarEvent.meetingNow, run by build.sh
// --test through the swift interpreter (cat'ed after src/Quiet.swift).
// Never reads a real mic or calendar.

import Foundation

var failures = 0
func law(_ name: String, _ ok: Bool) {
    if ok { print("ok   \(name)") } else { print("FAIL \(name)"); failures += 1 }
}

// samples of the device each second from t0 to t1 (inclusive), collecting changes
func samples(_ m: inout QuietMachine, _ running: Bool, _ t0: Double, _ t1: Double) -> [String] {
    var out: [String] = []
    var t = t0
    while t <= t1 + 1e-9 {
        m.mic(running: running, at: t)
        if let c = m.change() { out.append("\(c.on ? "on" : "off"):\(c.why)") }
        t += 1
    }
    return out
}

var m = QuietMachine()
law("a busy device for 2 s is a call", samples(&m, true, 0, 3) == ["on:call"])
law("a free device for 3 s ends it", samples(&m, false, 4, 8) == ["off:"])

var b = QuietMachine()
law("a 1 s blip is not a call", samples(&b, true, 0, 1) + samples(&b, false, 2, 5) == [])

var own = QuietMachine()
own.own(open: true, at: 0)
law("bise's own talk running the mic is not a call", samples(&own, true, 0, 10) == [])
own.own(open: false, at: 10)
law("nor the 3 s after bise's mic closed", samples(&own, true, 11, 12) == [])
law("a device still busy after the grace: a call (2 s later)", samples(&own, true, 13, 16) == ["on:call"])

var frozen = QuietMachine()
_ = samples(&frozen, true, 0, 3)
frozen.own(open: true, at: 4)
law("a call stays a call while bise's mic is open (frozen)", samples(&frozen, false, 4, 12) == [] && frozen.call)

var mt = QuietMachine()
mt.meeting(true)
law("a meeting is quiet, why meeting", mt.change().map { "\($0.on):\($0.why)" } == "true:meeting")
_ = samples(&mt, true, 0, 3)
law("a call during a meeting: why call", mt.why == "call")
_ = samples(&mt, false, 4, 8)
law("the call ends, the meeting goes on: why meeting again", mt.on && mt.why == "meeting")
mt.meeting(false)
law("the meeting ends: off", mt.change().map { "\($0.on):\($0.why)" } == "false:")

var fs = QuietMachine()
fs.fullScreen(true)
law("full screen is quiet, why full_screen", fs.change().map { "\($0.on):\($0.why)" } == "true:full_screen")
fs.meeting(true)
law("a meeting outranks full screen", fs.change().map { $0.why } == "meeting")

var start = QuietMachine()
law("nothing to say at start when it's not quiet", start.change() == nil)

let now = Date(timeIntervalSince1970: 1_800_000_000)
func ev(_ s: Double, _ e: Double, allDay: Bool = false, busy: Bool = true, declined: Bool = false, people: Int = 2) -> CalendarEvent {
    CalendarEvent(start: now.addingTimeInterval(s), end: now.addingTimeInterval(e), allDay: allDay, busy: busy, declined: declined, attendees: people)
}
law("a meeting around now", CalendarEvent.meetingNow([ev(-600, 600)], now: now))
law("not before it starts, not at its end",
    !CalendarEvent.meetingNow([ev(60, 600)], now: now) && !CalendarEvent.meetingNow([ev(-600, 0)], now: now))
law("all-day, free, declined or alone: not a meeting",
    !CalendarEvent.meetingNow([ev(-600, 600, allDay: true), ev(-600, 600, busy: false), ev(-600, 600, declined: true), ev(-600, 600, people: 0)], now: now))

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all Quiet laws hold")
