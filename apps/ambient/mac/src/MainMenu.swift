// MainMenu: the hidden main menu (round 10, the user: "il n'y a pas de
// commande Q pour quitter"). bise ambient is a menu-bar app (LSUIElement):
// macOS never draws this menu, but its key equivalents work whenever bise
// has the keys (the bar or bise's window is the key window), and only
// then: never his front app's ⌘Q. WKWebView hands every ⌘ key to the page
// first; the ones the page doesn't take (it never takes these) reach here.
// The Edit items have no target: they go down the responder chain to the
// web view's field (⌘A/C/V/X/Z, ⇧⌘Z, pasting a long text).

import AppKit

enum MenuAct: Equatable {
    case quit, close, settings, hide
    case window             // open bise: the window on bise (⌘0, lead m_9077)
    case edit(String)       // a standard editing action, by its selector
}

struct MenuKey: Equatable {
    var title: String
    var key: String
    var shift = false
    var act: MenuAct
}

enum MainMenu {
    // the table (pure: the laws in test/MainMenuTests.swift)
    static let app: [MenuKey] = [
        MenuKey(title: "open bise", key: "0", act: .window),
        MenuKey(title: "settings…", key: ",", act: .settings),
        MenuKey(title: "hide bise", key: "h", act: .hide),
        MenuKey(title: "quit bise ambient", key: "q", act: .quit),
    ]
    static let file: [MenuKey] = [
        MenuKey(title: "close", key: "w", act: .close),
    ]
    static let edit: [MenuKey] = [
        MenuKey(title: "undo", key: "z", act: .edit("undo:")),
        MenuKey(title: "redo", key: "z", shift: true, act: .edit("redo:")),
        MenuKey(title: "cut", key: "x", act: .edit("cut:")),
        MenuKey(title: "copy", key: "c", act: .edit("copy:")),
        MenuKey(title: "paste", key: "v", act: .edit("paste:")),
        MenuKey(title: "select all", key: "a", act: .edit("selectAll:")),
    ]
    // bise's window (S4): ⌘M, down the responder chain to the key window
    static let window: [MenuKey] = [
        MenuKey(title: "minimize", key: "m", act: .edit("performMiniaturize:")),
    ]
    static var all: [MenuKey] { app + file + edit + window }

    // a page's cmd that is a menu key's act (the panel's ⋯ menu, amb-web
    // 124f6853): 'quit bise ambient' takes ⌘Q's own path
    static func pageCmd(_ cmd: String) -> MenuAct? {
        switch cmd {
        case "app_quit": return .quit
        default: return nil
        }
    }

    // ⌘W: bise's window when it has the keys (S4: hidden, the app stays),
    // else the bar (esc's order)
    enum CloseWhat: Equatable { case window, bar, nothing }
    static func close(windowKey: Bool = false, windowShown: Bool = false, barShown: Bool) -> CloseWhat {
        if windowShown && windowKey { return .window }
        if barShown { return .bar }
        if windowShown { return .window }
        return .nothing
    }
}

// the menu itself, its actions through closures (App owns what they do)
@MainActor
final class MainMenuView: NSObject {
    var on: ((MenuAct) -> Void)?

    func install() {
        let bar = NSMenu()
        bar.addItem(submenu("bise ambient", MainMenu.app))
        bar.addItem(submenu("File", MainMenu.file))
        bar.addItem(submenu("Edit", MainMenu.edit))
        bar.addItem(submenu("Window", MainMenu.window))
        NSApp.mainMenu = bar
    }

    private func submenu(_ title: String, _ keys: [MenuKey]) -> NSMenuItem {
        let top = NSMenuItem(title: title, action: nil, keyEquivalent: "")
        let m = NSMenu(title: title)
        for k in keys {
            let it: NSMenuItem
            if case .edit(let sel) = k.act {
                // no target: the responder chain (the web view's field)
                it = NSMenuItem(title: k.title, action: NSSelectorFromString(sel), keyEquivalent: k.key)
            } else {
                it = NSMenuItem(title: k.title, action: #selector(act(_:)), keyEquivalent: k.key)
                it.target = self
                it.representedObject = MainMenuView.tag(k.act)
            }
            it.keyEquivalentModifierMask = k.shift ? [.command, .shift] : [.command]
            m.addItem(it)
        }
        top.submenu = m
        return top
    }

    private static func tag(_ a: MenuAct) -> String {
        switch a {
        case .quit: return "quit"
        case .close: return "close"
        case .settings: return "settings"
        case .hide: return "hide"
        case .window: return "window"
        case .edit(let s): return s
        }
    }

    @objc private func act(_ sender: NSMenuItem) {
        switch sender.representedObject as? String {
        case "quit": on?(.quit)
        case "close": on?(.close)
        case "settings": on?(.settings)
        case "hide": on?(.hide)
        case "window": on?(.window)
        default: break
        }
    }
}
