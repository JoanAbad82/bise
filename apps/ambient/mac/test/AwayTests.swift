
// The laws of Away (S9 'while you were away'), run by build.sh --test after
// src/Away.swift. Clock values only, never his session.

var failures = 0
func law(_ name: String, _ ok: Bool) {
    if ok { print("ok   \(name)") } else { print("FAIL \(name)"); failures += 1 }
}

let t0 = Date(timeIntervalSince1970: 1_000_000)
func at(_ min: Double) -> Date { t0.addingTimeInterval(min * 60) }

var a = Away()
a.left(at: at(0), idle: 0)
law("away: 45 min gone: back says 45 min", a.back(at: at(45)) == 45 * 60 * 1000)
law("away: said once: a second back says nothing", a.back(at: at(46)) == nil)

var short = Away()
short.left(at: at(0), idle: 0)
law("away: 10 min is not away", short.back(at: at(10)) == nil)
law("away: and the absence ends anyway", short.leftAt == nil)

var idle = Away()
idle.left(at: at(20), idle: 15 * 60)   // idle 15 min before the lock
law("away: his idle time before the lock counts", idle.back(at: at(40)) == 35 * 60 * 1000)

var twice = Away()
twice.left(at: at(0), idle: 0)
twice.left(at: at(5), idle: 0)         // lock, then sleep
law("away: lock then sleep is one absence, from the first", twice.back(at: at(30)) == 30 * 60 * 1000)

var never = Away()
law("away: back without leaving says nothing", never.back(at: at(90)) == nil)

law("back: an unlock", Away.isBack(unlock: true, wake: false, locked: false))
law("back: a wake with the screen unlocked", Away.isBack(unlock: false, wake: true, locked: false))
law("back: not a wake on the lock screen (the unlock will say it)", !Away.isBack(unlock: false, wake: true, locked: true))
law("threshold: 30 min (lead m_9029)", Away.threshold == 1800)

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all Away laws hold")
