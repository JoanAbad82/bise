// Visibility: when the capsule is on screen (docs/ambient-app.md §8 "out of
// the way"), one pure state machine (the laws in test/VisibilityTests.swift)
// driven by the core's events and the app's. At rest nothing shows: only the
// menu-bar icon. The capsule shows only when there is something to see, then
// goes away by itself:
//   - while you talk (fn held, hands-free) or type (fn space);
//   - `got it` / `on it` after a send or a cancel: 2 s;
//   - main's answer to your turn: from its words (or its voice) until 4 s
//     after the turn or the voice ends;
//   - a new question for you: 8 s (the count stays in the menu bar);
//   - never by itself for done, failed, a page ready, progress (SPEC §0:
//     those live in the icon): a page's short line only extends a capsule
//     already on screen;
//   - quiet (a meeting, a call, full screen): never by itself, only what
//     you do (talk, type, open);
//   - when you open it (option-click, fn ., the menu): until esc, fn ., or
//     a click elsewhere;
// and the mouse over it holds any timed show (1 s more once it leaves).
// esc, fn . or a click elsewhere hide it at any moment, except while you
// talk or type.

import Foundation

enum VisIn: Equatable {
    case talk(Bool)            // a hold or hands-free starts / ends with a send
    case cancelled             // a talk dropped (fn esc ...)
    case typing(Bool)          // the spotlight field has the keys
    case sent                  // the hub took your message (core `sent`)
    case mainText              // main's words of this turn (core `main`)
    case phase(String)         // core `phase`
    case card                  // a new item that needs you
    case line                  // a short line from the page (a key's answer ...)
    case quiet(Bool)           // a meeting, a call, full screen
    case open                  // you opened it: option-click, fn ., the menu
    case dismiss               // esc, fn ., a click elsewhere, app_hide
    case toggle                // fn . : open when hidden, dismiss when shown
    case hover(Bool)           // the mouse over the capsule
    case show(Double?)         // the page asks (app_show): for n s, or nil = open
    case tick                  // a timer: a deadline may have passed
}

// a card shows the bar by itself (8 s) once per card (lead m_8105, harness A
// bug 1c): after a dismiss the page clears its pane and says needs again for
// the same card, which brought the bar back, pushed, with the keys in his
// app. A card the page doesn't name (an older page) still shows each time.
struct CardPush: Equatable {
    private(set) var last: String?
    init() {}

    mutating func shows(card: String?) -> Bool {
        guard let c = card, !c.isEmpty else { return true }
        if c == last { return false }
        last = c
        return true
    }
}

// where a card shows (desktop v9, lead m_8658): bise's window in front and
// key = above its composer (the window's page has it: its 'waiting' line and
// the inbox), the bar doesn't show; the window hidden, not key, or another
// app in front = the bar, bottom centre
enum CardSeat: Equatable {
    case bar, window
    static func seat(windowShown: Bool, windowKey: Bool, appFront: Bool) -> CardSeat {
        windowShown && windowKey && appFront ? .window : .bar
    }
}

// a left click on the menu-bar icon toggles (the user, main m_6965): the bar
// shown in any state (opened by hand, a card's 8 s, an answer) → it closes;
// hidden → the full view opens
enum IconClick: Equatable {
    case open, close
    static func act(shown: Bool) -> IconClick { shown ? .close : .open }
}

struct Visibility {
    static let brief = 2.0         // got it, on it, cancelled
    static let afterAnswer = 4.0
    static let forCard = 8.0
    static let afterHover = 1.0
    static let line = 4.0          // a short line from the page: done, failed, a page ready

    private(set) var talking = false
    private(set) var typing = false
    private(set) var pinned = false        // you opened it
    private(set) var answer = false        // main's answer to your turn is on
    private var mine = false               // main's turn is answering you
    private var until = -1.0               // a timed show's end
    private var hovered = false
    private var heldByHover = false
    private(set) var quiet = false

    init() {}

    func visible(at t: Double) -> Bool {
        talking || typing || pinned || answer || t < until || (hovered && heldByHover)
    }

    // when the caller should tick next, if a timed show is running
    func nextTick(after t: Double) -> Double? { until > t ? until : nil }

    // feed one event at time t: is the capsule visible after it?
    mutating func feed(_ e: VisIn, at t: Double) -> Bool {
        switch e {
        case .talk(let on):
            talking = on
            if !on { show(Visibility.brief, t) }           // got it
        case .cancelled:
            talking = false
            show(Visibility.brief, t)                       // cancelled. nothing sent.
        case .typing(let on):
            typing = on
        case .sent:
            mine = true
            show(Visibility.brief, t)                       // got it / on it
        case .mainText:
            if mine && !quiet { answer = true }
        case .phase(let p):
            switch p {
            case "speaking":
                if !quiet { answer = true }                 // the voice answers you only
            case "done", "failed", "idle":
                if answer { answer = false; show(Visibility.afterAnswer, t) }
                mine = false
            default:
                break
            }
        case .card:
            if !quiet { show(Visibility.forCard, t) }
        case .line:
            if visible(at: t) { show(Visibility.line, t) }
        case .quiet(let on):
            quiet = on
        case .open:
            pinned = true
        case .dismiss:
            pinned = false; answer = false; mine = false; until = -1; heldByHover = false
        case .toggle:
            return feed(visible(at: t) ? .dismiss : .open, at: t)
        case .hover(let on):
            if on {
                heldByHover = visible(at: t)
            } else {
                if heldByHover && until < t + Visibility.afterHover { until = t + Visibility.afterHover }
                heldByHover = false
            }
            hovered = on
        case .show(let s):
            if let s { show(s, t) } else { pinned = true }
        case .tick:
            break
        }
        return visible(at: t)
    }

    private mutating func show(_ s: Double, _ t: Double) {
        if t + s > until { until = t + s }
    }
}
