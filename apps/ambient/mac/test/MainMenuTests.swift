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

law("the panel's ⋯ 'quit bise ambient' (app_quit): ⌘Q's own act", MainMenu.pageCmd("app_quit") == .quit)
law("other page cmds are not menu acts", MainMenu.pageCmd("app_copy") == nil && MainMenu.pageCmd("app_hide") == nil)

law("⌘W: bise's window when it has the keys (hidden, the app stays)", MainMenu.close(windowKey: true, windowShown: true, barShown: true) == .window)
law("⌘W: the bar first when the bar has the keys over the window", MainMenu.close(windowKey: false, windowShown: true, barShown: true) == .bar)
law("⌘W: the window alone shown: the window", MainMenu.close(windowKey: false, windowShown: true, barShown: false) == .window)
law("⌘W: the bar alone", MainMenu.close(barShown: true) == .bar)
law("⌘W: nothing shown, nothing", MainMenu.close(barShown: false) == .nothing)
law("⌘M minimizes the key window", find("m") == .edit("performMiniaturize:"))

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all MainMenu laws hold")
