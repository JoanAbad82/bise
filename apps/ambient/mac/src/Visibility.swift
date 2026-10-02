// Visibility: when the capsule is on screen (docs/ambient-app.md §8 "out of
// the way"), one pure state machine (the laws in test/VisibilityTests.swift)
// driven by the core's events and the app's. At rest nothing shows: only the
// menu-bar icon. The capsule shows only when there is something to see, then
// goes away by itself:
//   - while you talk (fn held, hands-free) or type (fn space);
//   - `got it` / `on it` after a send or a cancel: 2 s;
//   - main's answer to your turn: from its words (or its voice) until 4 s
//     after the turn or the voice ends;
//   - a new item that needs you: 6 s (the count stays in the menu bar);
//   - a short line the page has (done, failed, a page ready): 4 s;
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
    case open                  // you opened it: option-click, fn ., the menu
    case dismiss               // esc, fn ., a click elsewhere, app_hide
    case toggle                // fn . : open when hidden, dismiss when shown
    case hover(Bool)           // the mouse over the capsule
    case show(Double?)         // the page asks (app_show): for n s, or nil = open
    case tick                  // a timer: a deadline may have passed
}

struct Visibility {
    static let brief = 2.0         // got it, on it, cancelled
    static let afterAnswer = 4.0
    static let forCard = 6.0
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
            if mine { answer = true }
        case .phase(let p):
            switch p {
            case "speaking":
                answer = true                               // the voice answers you only
            case "done", "failed", "idle":
                if answer { answer = false; show(Visibility.afterAnswer, t) }
                mine = false
            default:
                break
            }
        case .card:
            show(Visibility.forCard, t)
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
