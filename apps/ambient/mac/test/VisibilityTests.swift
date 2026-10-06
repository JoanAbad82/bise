// The laws of Visibility (docs/ambient-app.md §8 "out of the way"), run by
// build.sh --test through the swift interpreter (cat'ed after
// src/Visibility.swift).

var failures = 0
func law(_ name: String, _ ok: Bool) {
    if ok { print("ok   \(name)") } else { print("FAIL \(name)"); failures += 1 }
}

// a script of (event, time); the visibility at the given probe times
func run(_ steps: [(VisIn, Double)], probe: [Double]) -> [Bool] {
    var v = Visibility()
    var out: [Bool] = []
    var i = 0
    for p in probe {
        while i < steps.count && steps[i].1 <= p { _ = v.feed(steps[i].0, at: steps[i].1); i += 1 }
        out.append(v.visible(at: p))
    }
    return out
}

law("at rest: nothing on screen", !Visibility().visible(at: 0))
law("talking: shown; let go: got it for 2 s, then gone",
    run([(.talk(true), 0), (.talk(false), 5)], probe: [1, 6, 6.9, 7.1]) == [true, true, true, false])
law("cancelled: 2 s, then gone",
    run([(.talk(true), 0), (.cancelled, 1)], probe: [2.5, 3.5]) == [true, false])
law("typing: shown while the field has the keys",
    run([(.typing(true), 0), (.typing(false), 3)], probe: [1, 3.5]) == [true, false])
law("a send: on it for 2 s, then gone while main works",
    run([(.sent, 0), (.phase("working"), 0.5)], probe: [1.5, 2.5, 30]) == [true, false, false])
law("main's answer to your turn: shown until 4 s after the turn ends",
    run([(.sent, 0), (.phase("working"), 1), (.mainText, 10), (.phase("done"), 20)], probe: [5, 11, 19, 23.9, 24.1])
        == [false, true, true, true, false])
law("the voice keeps it: hidden 4 s after the voice ends",
    run([(.sent, 0), (.mainText, 5), (.phase("done"), 6), (.phase("speaking"), 7), (.phase("idle"), 30)], probe: [20, 33, 34.5])
        == [true, true, false])
law("main's words that aren't an answer to you: nothing",
    run([(.mainText, 0), (.phase("done"), 1)], probe: [0.5, 2]) == [false, false])
law("a new question for you: 8 s, then gone",
    run([(.card, 0)], probe: [7.9, 8.1]) == [true, false])
law("a page's line never shows bise by itself",
    run([(.line, 0)], probe: [1]) == [false])
law("a page's line extends a capsule already on screen",
    run([(.talk(true), 0), (.talk(false), 1), (.line, 2)], probe: [5.5, 6.1]) == [true, false])
law("quiet: a question doesn't show bise (it waits in the count)",
    run([(.quiet(true), 0), (.card, 1)], probe: [2]) == [false])
law("quiet: main's answer doesn't show by itself",
    run([(.quiet(true), 0), (.sent, 1), (.mainText, 4), (.phase("speaking"), 5)], probe: [4.5, 6]) == [false, false])
law("quiet: what you do still shows (talk, open)",
    run([(.quiet(true), 0), (.talk(true), 1), (.open, 2)], probe: [1.5, 30]) == [true, true])
law("quiet ends: questions show again",
    run([(.quiet(true), 0), (.quiet(false), 1), (.card, 2)], probe: [3]) == [true])
law("opened: it stays",
    run([(.open, 0)], probe: [100, 1000]) == [true, true])
law("opened, then esc / fn . / a click elsewhere: gone",
    run([(.open, 0), (.dismiss, 10)], probe: [9, 11]) == [true, false])
law("dismiss hides an answer at any moment",
    run([(.sent, 0), (.mainText, 3), (.dismiss, 4), (.phase("done"), 5)], probe: [3.5, 4.5, 6]) == [true, false, false])
law("dismiss never hides you while you talk",
    run([(.talk(true), 0), (.dismiss, 1)], probe: [2]) == [true])
law("fn . toggles: hidden -> open, open -> hidden",
    run([(.toggle, 0), (.toggle, 5)], probe: [1, 6]) == [true, false])
law("fn . during a timed show hides it (8 s question)",
    run([(.card, 0), (.toggle, 1)], probe: [2]) == [false])
law("the mouse over it holds a timed show, then 1 s once it leaves",
    run([(.card, 0), (.hover(true), 3), (.hover(false), 20)], probe: [10, 20.5, 21.5]) == [true, true, false])
law("the mouse passing over a hidden capsule's place shows nothing",
    run([(.hover(true), 0)], probe: [1]) == [false])
law("the page asks to show for n s",
    run([(.show(3), 0)], probe: [2, 4]) == [true, false])
law("the page asks to show, no time: open until dismissed",
    run([(.show(nil), 0), (.dismiss, 50)], probe: [40, 51]) == [true, false])
law("a card during an answer: the later end wins",
    run([(.sent, 0), (.mainText, 1), (.phase("done"), 2), (.card, 5)], probe: [6.5, 12.5, 13.5]) == [true, true, false])
var v = Visibility()
_ = v.feed(.card, at: 0)
law("nextTick: the timed show's end", v.nextTick(after: 1) == 8 && v.nextTick(after: 9) == nil)

// ambient's gate run 1 (m_5333): fn held always shows the glass, also
// right after a launch and after you hid it (fn ., esc, a click away)
law("the first hold after a launch shows it",
    run([(.talk(true), 0)], probe: [0, 0.5, 1.06, 7.31]) == [true, true, true, true])
law("a hold after you hid it shows it",
    run([(.open, 0), (.dismiss, 1), (.talk(true), 2)], probe: [1.5, 2, 7.31]) == [false, true, true])
law("a hold after fn . (toggle) hid it shows it",
    run([(.toggle, 0), (.toggle, 1), (.talk(true), 2)], probe: [1.5, 2.5]) == [false, true])
law("hands-free after you hid it shows it",
    run([(.card, 0), (.dismiss, 1), (.talk(true), 2), (.talk(false), 10)], probe: [1.5, 9, 11, 12.1]) == [false, true, true, false])
law("hidden by you: news stays in the icon, your hold doesn't",
    run([(.open, 0), (.dismiss, 1), (.line, 2), (.talk(true), 3)], probe: [2.5, 3.5]) == [false, true])

// ambient's gate (3): done and failed live in the icon, never the glass
law("main's turn done or failed without your talk never shows it",
    run([(.phase("working"), 0), (.phase("done"), 1), (.phase("working"), 2), (.phase("failed"), 3)], probe: [0.5, 1.5, 3.5, 9]) == [false, false, false, false])
law("an agent's done or failed line (app_content line) never shows it",
    run([(.line, 0), (.phase("idle"), 1), (.line, 2)], probe: [0.5, 1.5, 2.5]) == [false, false, false])
law("done after you hid it stays hidden",
    run([(.open, 0), (.dismiss, 1), (.phase("done"), 2), (.line, 3)], probe: [2.5, 3.5]) == [false, false])

// the menu-bar icon's left click toggles (the user, main m_6965)
law("icon click with the bar hidden: the full view opens", IconClick.act(shown: false) == .open)
law("icon click with the bar shown: it closes", IconClick.act(shown: true) == .close)

// a card shows the bar once (lead m_8105, harness A bug 1c)
var cp = CardPush()
law("card: a new card shows the bar", cp.shows(card: "c1"))
law("card: the same card said again after a dismiss doesn't", !cp.shows(card: "c1"))
law("card: the next card does", cp.shows(card: "c2"))
law("card: an older page that names no card shows each time", cp.shows(card: nil) && cp.shows(card: nil))

// where a card shows (desktop v9, lead m_8658)
law("card seat: the window in front and key: above its composer, no bar", CardSeat.seat(windowShown: true, windowKey: true, appFront: true) == .window)
law("card seat: the window hidden: the bar", CardSeat.seat(windowShown: false, windowKey: false, appFront: false) == .bar)
law("card seat: the window shown but not key (the bar or another panel has the keys): the bar", CardSeat.seat(windowShown: true, windowKey: false, appFront: true) == .bar)
law("card seat: another app in front (the window behind it): the bar", CardSeat.seat(windowShown: true, windowKey: true, appFront: false) == .bar)

// a card the window held comes to the bar when the window goes (lead m_8679, B)
var held = CardPush()
let heldSeat = CardSeat.seat(windowShown: true, windowKey: true, appFront: true)
law("card seat B: held by the window, not counted as shown", heldSeat == .window && held.last == nil)
let laterSeat = CardSeat.seat(windowShown: false, windowKey: false, appFront: true)
law("card seat B: the window closed: the held card goes to the bar and shows", laterSeat == .bar && held.shows(card: "1"))
law("card seat B: and only once", !held.shows(card: "1"))

// card ids are per hub: the same id in two projects is two cards (amb-tools m_8858)
var many = CardPush()
law("card key: home's #4 and acme's #4 each show the bar",
    many.shows(card: CardPush.key(card: "4", project: "acme")) && many.shows(card: CardPush.key(card: "4", project: "bise")))
law("card key: a page that names no project keys by id alone", CardPush.key(card: "4", project: nil) == "4")
law("card key: no card, no key (an older page: shows each time)", CardPush.key(card: nil, project: "acme") == nil)

// the quiet batch (S9, amb-web m_9033): one bar per batch
var bp = CardPush()
law("batch: the cards held while quiet show the bar once", bp.shows(card: CardPush.batchKey(["acme#4", "bise#2"])))
law("batch: the same batch said again, in any order, doesn't", !bp.shows(card: CardPush.batchKey(["bise#2", "acme#4"])))
law("batch: an empty batch has no key (nothing to show)", CardPush.batchKey([]) == nil && CardPush.batchKey([""]) == nil)
law("batch: a quiet bar never shows for a card",
    { var v = Visibility(); _ = v.feed(.quiet(true), at: 0); _ = v.feed(.card, at: 1); return !v.visible(at: 2) }())

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all Visibility laws hold")
