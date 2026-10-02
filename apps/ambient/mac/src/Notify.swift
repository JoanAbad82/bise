// Notify: the macOS notification for a new card, only when the capsule is
// hidden or the screen is locked (SPEC §3: bise's own glass note under the
// capsule is the main one; macOS notifications can't take a digit). Two
// buttons: the card's first two options; a card without options gets a
// reply field. A button answers the card; a click on the notification shows
// the capsule. A card that went away takes its notification with it.

import AppKit
import UserNotifications

struct Card {
    var id: String
    var agent: String
    var text: String
    var options: [String]

    static func list(_ state: [String: Any]) -> [Card] {
        guard let cards = state["cards"] as? [[String: Any]] else { return [] }
        return cards.compactMap { c in
            let id: String
            if let s = c["id"] as? String { id = s } else if let n = c["id"] as? NSNumber { id = n.stringValue } else { return nil }
            let opts: [String] = (c["options"] as? [Any] ?? []).compactMap { o in
                if let s = o as? String { return s }
                if let d = o as? [String: Any] { return (d["text"] ?? d["label"]) as? String }
                return nil
            }
            return Card(id: id, agent: c["agent"] as? String ?? "", text: c["text"] as? String ?? "", options: opts)
        }
    }
}

// the words (signed off by ambient). The buttons are the option words
// without digits: a digit promises a key a macOS notification can't take.
enum NotifyWords {
    static func title(_ c: Card) -> String { c.agent.isEmpty ? "bise needs you" : "\(c.agent) needs you" }
    static let reply = "reply"
    static let replyButton = "send"
    static let replyPlaceholder = "type it, or hold fn and say it"
}

@MainActor
final class Notify: NSObject, UNUserNotificationCenterDelegate {
    var onAnswer: ((_ card: String, _ reply: String) -> Void)?
    var onOpen: (() -> Void)?

    private var center: UNUserNotificationCenter { UNUserNotificationCenter.current() }
    private var known = Set<String>()       // card ids seen (notified or not)
    private var shown = Set<String>()       // card ids with a notification out
    private var asked = false
    private var categories: [String: UNNotificationCategory] = [:]
    private var first = true

    override init() {
        super.init()
        center.delegate = self
    }

    // the cards of a `state` event; `quiet` = the capsule shows them itself
    func cards(_ list: [Card], quiet: Bool) {
        let ids = Set(list.map(\.id))
        let gone = shown.subtracting(ids)
        if !gone.isEmpty {
            center.removeDeliveredNotifications(withIdentifiers: gone.map { "card." + $0 })
            center.removePendingNotificationRequests(withIdentifiers: gone.map { "card." + $0 })
            shown.subtract(gone)
            for g in gone { categories.removeValue(forKey: "card." + g) }
        }
        let fresh = list.filter { !known.contains($0.id) }
        known = ids
        // the cards already there at launch were seen in the terminal: no burst
        if first { first = false; return }
        guard !quiet else { return }
        for c in fresh { post(c) }
    }

    private func post(_ c: Card) {
        let go = { [weak self] in
            guard let self else { return }
            let cat = "card." + c.id
            var actions: [UNNotificationAction] = []
            if c.options.isEmpty {
                actions.append(UNTextInputNotificationAction(identifier: "reply", title: NotifyWords.reply, options: [],
                                                             textInputButtonTitle: NotifyWords.replyButton,
                                                             textInputPlaceholder: NotifyWords.replyPlaceholder))
            } else {
                for (i, o) in c.options.prefix(2).enumerated() {
                    actions.append(UNNotificationAction(identifier: "opt.\(i + 1)", title: o, options: []))
                }
            }
            self.categories[cat] = UNNotificationCategory(identifier: cat, actions: actions, intentIdentifiers: [], options: [])
            self.center.setNotificationCategories(Set(self.categories.values))
            let content = UNMutableNotificationContent()
            content.title = NotifyWords.title(c)
            content.body = c.text
            content.categoryIdentifier = cat
            content.userInfo = ["card": c.id]
            content.sound = .default
            self.center.add(UNNotificationRequest(identifier: cat, content: content, trigger: nil)) { err in
                if let err { Log.say("notify: \(err.localizedDescription)") }
            }
            self.shown.insert(c.id)
        }
        if asked { go(); return }
        // asked the first time a notification is due, not at launch
        center.requestAuthorization(options: [.alert, .sound]) { ok, err in
            DispatchQueue.main.async {
                MainActor.assumeIsolated {
                    self.asked = true
                    if ok { go() } else { Log.say("notify: not allowed \(err?.localizedDescription ?? "")") }
                }
            }
        }
    }

    nonisolated func userNotificationCenter(_ c: UNUserNotificationCenter, willPresent n: UNNotification,
                                            withCompletionHandler done: @escaping (UNNotificationPresentationOptions) -> Void) {
        done([.banner, .list, .sound])
    }

    nonisolated func userNotificationCenter(_ c: UNUserNotificationCenter, didReceive r: UNNotificationResponse,
                                            withCompletionHandler done: @escaping () -> Void) {
        let card = r.notification.request.content.userInfo["card"] as? String
        let action = r.actionIdentifier
        let text = (r as? UNTextInputNotificationResponse)?.userText
        DispatchQueue.main.async {
            MainActor.assumeIsolated {
                if let card, action.hasPrefix("opt.") {
                    self.onAnswer?(card, String(action.dropFirst(4)))
                } else if let card, action == "reply", let t = text, !t.trimmingCharacters(in: .whitespaces).isEmpty {
                    self.onAnswer?(card, t)
                } else {
                    self.onOpen?()
                }
            }
        }
        done()
    }
}
