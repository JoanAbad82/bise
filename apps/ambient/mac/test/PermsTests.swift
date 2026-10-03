// The laws of PermPlan (SPEC §5.8, the first-run walk, ambient-lead
// m_5594), run by build.sh --test through the swift interpreter (cat'ed
// after src/Perms.swift). Never a real permission or prompt.

import Foundation

var failures = 0
func law(_ name: String, _ ok: Bool) {
    if ok { print("ok   \(name)") } else { print("FAIL \(name)"); failures += 1 }
}

// a first run, every answer 'continue' and granted
var s = PermState()
law("first launch: only Accessibility is asked", PermPlan.launch(&s) == [.ask(.accessibility), .watchTrust])
law("continue: macOS's Accessibility prompt", PermPlan.command(.accessibility, "continue", &s) == [.prompt(.accessibility), .watchTrust])
law("Accessibility on: said, then the fn tap starts", PermPlan.answered(.accessibility, granted: true, &s) == [.granted(.accessibility), .startKeys])
var h = PermPlan.hold(&s)
law("the first hold asks the mic and doesn't talk", h.talk == false && h.do == [.ask(.mic)])
law("continue: macOS's mic prompt", PermPlan.command(.mic, "continue", &s) == [.prompt(.mic)])
law("mic granted: the screen is asked right after, one at a time",
    PermPlan.answered(.mic, granted: true, &s) == [.granted(.mic), .ask(.screen)])
law("continue: macOS's screen prompt", PermPlan.command(.screen, "continue", &s) == [.prompt(.screen)])
law("screen granted: said, nothing more", PermPlan.answered(.screen, granted: true, &s) == [.granted(.screen)])
h = PermPlan.hold(&s)
law("all granted: a hold talks, nothing asked", h.talk && h.do.isEmpty)
law("the next launch with everything on: no ask, keys on", PermPlan.launch(&s) == [.startKeys])

// before Accessibility: fn can't reach bise
var pre = PermState()
_ = PermPlan.launch(&pre)
h = PermPlan.hold(&pre)
law("fn before Accessibility is granted: nothing, no mic ask", !h.talk && h.do.isEmpty)

// never asked twice
var t = PermState()
_ = PermPlan.launch(&t)
_ = PermPlan.command(.accessibility, "continue", &t)
law("a relaunch before Accessibility is on: the refused line once, no second ask",
    PermPlan.launch(&t) == [.denied(.accessibility), .watchTrust])
law("the launch after that: nothing said, still watching", PermPlan.launch(&t) == [.watchTrust])
law("a second continue on an ask already answered: nothing", PermPlan.command(.mic, "continue", &s).isEmpty)

// not now
var n = PermState(accessibility: .granted)
_ = PermPlan.hold(&n)
law("not now on the mic: the refused line once", PermPlan.command(.mic, "not_now", &n) == [.denied(.mic)])
h = PermPlan.hold(&n)
law("after not now: a hold neither asks nor talks", !h.talk && h.do.isEmpty)
law("not now twice: still one line", PermPlan.command(.mic, "not_now", &n).isEmpty)

// refused in macOS's prompt
var r = PermState(accessibility: .granted)
_ = PermPlan.hold(&r)
_ = PermPlan.command(.mic, "continue", &r)
law("mic refused in macOS: the line once, no screen ask", PermPlan.answered(.mic, granted: false, &r) == [.denied(.mic)])
h = PermPlan.hold(&r)
law("mic refused: a hold doesn't talk, says nothing again", !h.talk && h.do.isEmpty)

// the screen left off: talks without the shot
var sc = PermState(accessibility: .granted, mic: .granted)
h = PermPlan.hold(&sc)
law("mic on, screen never asked: this hold asks the screen, no talk", !h.talk && h.do == [.ask(.screen)])
_ = PermPlan.command(.screen, "not_now", &sc)
h = PermPlan.hold(&sc)
law("screen not now: holds talk without the shot, nothing said again", h.talk && h.do.isEmpty)

// one at a time: an ask never comes with another
var all = PermState()
var asks = PermPlan.launch(&all).filter { if case .ask = $0 { return true }; return false }
law("launch asks one thing at most", asks.count <= 1)
_ = PermPlan.answered(.accessibility, granted: true, &all)
asks = PermPlan.hold(&all).do.filter { if case .ask = $0 { return true }; return false }
law("a hold asks one thing at most", asks.count == 1)
law("settings opens the pane, changes nothing", PermPlan.command(.screen, "settings", &all) == [.settings(.screen)])

// a rebuilt binary lost Accessibility (ad-hoc signed: macOS keys the grant
// on its hash): never a silent fn (the dogfood's first launch, lead m_6252)
var lost = PermState(accessibility: .granted)
law("a launch with Accessibility on: remembered as had", PermPlan.launch(&lost) == [.startKeys] && lost.had.contains("accessibility"))
lost.accessibility = .unknown
lost.asked = ["accessibility"]
lost.told = ["accessibility"]
law("Accessibility lost after a rebuild: the line again, watching, even if told before",
    PermPlan.launch(&lost) == [.denied(.accessibility), .watchTrust])
law("and at every launch until it's back", PermPlan.launch(&lost) == [.denied(.accessibility), .watchTrust])
law("back on: granted, keys on", PermPlan.answered(.accessibility, granted: true, &lost) == [.granted(.accessibility), .startKeys])
var never = PermState(asked: ["accessibility"], told: ["accessibility"])
law("his own 'not now' (never had): still said once ever, not again", PermPlan.launch(&never) == [.watchTrust])
var first = PermState()
_ = PermPlan.answered(.accessibility, granted: true, &first)
law("granted by the prompt: remembered as had", first.had.contains("accessibility"))

// why a hold went the way it did, for app.log (the dogfood, B2)
func why(_ st: PermState) -> (Bool, String) {
    var s2 = st
    let h = PermPlan.hold(&s2)
    return (h.talk, PermPlan.holdWhy(s2, h.do))
}
law("hold why: no Accessibility", why(PermState()) == (false, "no Accessibility"))
law("hold why: the first hold asks the mic", why(PermState(accessibility: .granted)) == (false, "asking the mic first"))
law("hold why: mic off in System Settings", why(PermState(accessibility: .granted, mic: .denied)) == (false, "the mic is off in System Settings"))
law("hold why: mic left at not now", why(PermState(accessibility: .granted, asked: ["mic"])) == (false, "the mic was left at not now"))
law("hold why: the screen asked after the mic", why(PermState(accessibility: .granted, mic: .granted)) == (false, "asking the screen first"))
law("hold why: talks without the shot", why(PermState(accessibility: .granted, mic: .granted, asked: ["screen"])) == (true, "without the screen shot"))
law("hold why: all on, nothing to say", why(PermState(accessibility: .granted, mic: .granted, screen: .granted)) == (true, ""))

// the hello: once ever, after Accessibility, never while quiet
law("hello: due once Accessibility is on", Hello.due(said: false, accessibility: .granted, quiet: false))
law("hello: not before Accessibility", !Hello.due(said: false, accessibility: .unknown, quiet: false))
law("hello: never while quiet (it waits)", !Hello.due(said: false, accessibility: .granted, quiet: true))
law("hello: never twice", !Hello.due(said: true, accessibility: .granted, quiet: false))

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all Perms laws hold")
