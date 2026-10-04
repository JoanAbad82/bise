// The laws of the hidden main menu (round 10), run by build.sh --test
// through the swift interpreter (cat'ed after src/MainMenu.swift).

import Foundation

var failures = 0
func law(_ name: String, _ ok: Bool) {
    if ok { print("ok   \(name)") } else { print("FAIL \(name)"); failures += 1 }
}

func find(_ key: String, shift: Bool = false) -> MenuAct? {
    MainMenu.all.first { $0.key == key && $0.shift == shift }?.act
}

law("⌘Q quits bise ambient", find("q") == .quit)
law("⌘W closes", find("w") == .close)
law("⌘, opens settings (= fn ,)", find(",") == .settings)
law("⌘H hides bise (= fn .)", find("h") == .hide)
law("⌘A ⌘C ⌘V ⌘X ⌘Z ⇧⌘Z: the field's own editing",
    find("a") == .edit("selectAll:") && find("c") == .edit("copy:") && find("v") == .edit("paste:")
        && find("x") == .edit("cut:") && find("z") == .edit("undo:") && find("z", shift: true) == .edit("redo:"))
let combos = MainMenu.all.map { "\($0.shift ? "⇧" : "")⌘\($0.key)" }
law("no key twice", Set(combos).count == combos.count)
law("the page's own keys are left to it (⌘F ⌘D ⌘O ⌘. ⌘⌫ ⌘↑↓)",
    ["f", "d", "o", ".", "\u{8}", "\u{F700}", "\u{F701}"].allSatisfy { find($0) == nil })

law("⌘W: the panel when it has the keys", MainMenu.close(panelKey: true, panelShown: true, barShown: true) == .panel)
law("⌘W: the bar when it has them (the panel stays)", MainMenu.close(panelKey: false, panelShown: true, barShown: true) == .bar)
law("⌘W: the panel alone shown, clicked away: the panel", MainMenu.close(panelKey: false, panelShown: true, barShown: false) == .panel)
law("⌘W: the bar alone", MainMenu.close(panelKey: false, panelShown: false, barShown: true) == .bar)
law("⌘W: nothing shown, nothing", MainMenu.close(panelKey: false, panelShown: false, barShown: false) == .nothing)

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all MainMenu laws hold")
