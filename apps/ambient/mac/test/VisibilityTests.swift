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
law("a new item that needs you: 6 s, then gone",
    run([(.card, 0)], probe: [5.9, 6.1]) == [true, false])
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
law("fn . during a timed show hides it",
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
    run([(.sent, 0), (.mainText, 1), (.phase("done"), 2), (.card, 5)], probe: [6.5, 10.5, 11.5]) == [true, true, false])
var v = Visibility()
_ = v.feed(.card, at: 0)
law("nextTick: the timed show's end", v.nextTick(after: 1) == 6 && v.nextTick(after: 7) == nil)

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all Visibility laws hold")
