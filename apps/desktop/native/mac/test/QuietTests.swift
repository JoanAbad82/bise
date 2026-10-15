// The laws of QuietMachine, run by build.sh --test through the swift
// interpreter (cat'ed after src/Quiet.swift). Never reads a real mic.

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

var fs = QuietMachine()
fs.fullScreen(true)
law("full screen is quiet, why full_screen", fs.change().map { "\($0.on):\($0.why)" } == "true:full_screen")
_ = samples(&fs, true, 0, 3)
law("a call outranks full screen", fs.why == "call")
_ = samples(&fs, false, 4, 8)
law("the call ends, full screen goes on: why full_screen again", fs.on && fs.why == "full_screen")
fs.fullScreen(false)
law("full screen ends: off", fs.change().map { "\($0.on):\($0.why)" } == "false:")

var start = QuietMachine()
law("nothing to say at start when it's not quiet", start.change() == nil)

// S9: a camera in use is a call; a shared screen is quiet (lead m_9025)
func cams(_ m: inout QuietMachine, _ running: Bool, _ t0: Double, _ t1: Double) -> [String] {
    var out: [String] = []
    var t = t0
    while t <= t1 + 1e-9 {
        m.camera(running: running, at: t)
        if let c = m.change() { out.append("\(c.on ? "on" : "off"):\(c.why)") }
        t += 1
    }
    return out
}
var cam = QuietMachine()
law("camera: a camera running for 2 s is a call", cams(&cam, true, 0, 3) == ["on:call"])
law("camera: free for 3 s ends it", cams(&cam, false, 4, 8) == ["off:"])
var blip = QuietMachine()
law("camera: a 1 s blip is not a call", cams(&blip, true, 0, 1) + cams(&blip, false, 2, 5) == [])
var own2 = QuietMachine()
own2.own(open: true, at: 0)
law("camera: bise's own talk doesn't freeze the camera (bise never opens one)", cams(&own2, true, 0, 3) == ["on:call"])

var sh = QuietMachine()
sh.sharing(true)
law("sharing: a shared screen is quiet, why sharing", sh.change().map { "\($0.on):\($0.why)" } == "true:sharing")
sh.fullScreen(true)
law("sharing: outranks full screen (the screen is seen)", sh.why == "sharing")
_ = samples(&sh, true, 0, 3)
law("sharing: a call during a share names the call", sh.why == "call")
sh.sharing(false); sh.fullScreen(false)
law("sharing: all over: off once the call ends", samples(&sh, false, 4, 8) == ["off:"] && !sh.on)

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all Quiet laws hold")
