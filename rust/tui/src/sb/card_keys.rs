//! The open item's divider label and key bar (split out of card_draw.rs, its
//! line limit): `you → ? t3 · your answer` (a question his words answer:
//! answer_target.rs draws its own), the keys it takes and the pairs that
//! fit the width.

use super::*;
use bise_proto::words::inbox;

/// The divider's label while an item is open: `you → ? t3 · your
/// answer`.
pub(crate) fn divider_label(app: &App) -> Option<Vec<Span<'static>>> {
    if !item_open(app) {
        return None;
    }
    let c = app.sb.current_card()?;
    let arrow = if theme::ascii_mode() { "->" } else { "→" };
    // its question closed while your words were typed: they go as a
    // message (designer m_24087)
    if app.sb.closed_in_view().is_some() {
        return Some(vec![
            Span::raw(" "),
            Span::styled(format!("{} {} ", inbox::you, arrow), fg(theme::dim())),
            Span::styled(c.agent.clone(), fg(theme::text())),
            Span::styled(format!(" · {}", inbox::question_closed), fg(theme::dim())),
            Span::raw(" "),
        ]);
    }
    Some(vec![
        Span::raw(" "),
        Span::styled(format!("{} {} ", inbox::you, arrow), fg(theme::dim())),
        Span::styled(format!("{} {}", kind_look(&c.kind).1, c.agent), fg(theme::accent())),
        Span::styled(format!(" · {}", inbox::your_answer), fg(theme::dim())),
        Span::raw(" "),
    ])
}

/// The key bar while an item is open (designer's round 2): in place
/// `1-3 answer   ←→ choose   ↑↓ other items   ctrl+o full screen   esc
/// back to your message` (a hard rule `1 3 answer`; an option
/// highlighted `⏎ always allow` first); full screen `1-3 answer   ↑↓
/// other items   pgup pgdn scroll   ctrl+o back in place   esc back to
/// your message`; text typed `⏎ says no, with your note` (a question
/// `⏎ sends your answer`). No options: `⏎ got it` (done, overlap).
pub(crate) fn key_pairs(app: &App) -> Vec<(&'static str, String)> {
    let sb = &app.sb;
    let Some(c) = sb.current_card() else { return Vec::new() };
    let s = shape(c);
    let n = s.options.len();
    let more = sb.sorted_cards().len() > 1;
    let full = sb.card.full;
    let p = |k: &'static str, l: &str| (k, l.to_string());
    // an item with its own keys (the connectors key: `paste your key ·
    // ⏎ save · ctrl+x not now · esc back`)
    if !s.keys.is_empty() {
        return s.keys.iter().map(|(k, l)| p(k, l)).collect();
    }
    let mut v = Vec::new();
    let back = p("esc", inbox::key_back_message);
    if sb.closed_in_view().is_some() {
        v.push(p("⏎", inbox::key_send_message));
        v.push(back);
        return v;
    }
    // his words answer it (composer-target A): `1-2 answer   ⏎ send the
    // answer   esc to main`, esc names whom his words go to instead
    if let Some(a) = answer_target::answering(app) {
        let typed = !app.ed.text.is_empty();
        match sb.card.opt.filter(|i| *i < n && !typed) {
            Some(i) => v.push(("⏎", cut(&s.options[i], 32))),
            None => {
                if n > 0 && !typed {
                    v.push(p(digits(n), if c.page.is_some() { inbox::key_pick } else { inbox::key_answer }));
                }
                // a page's card (notif-artifact): `1-2 pick   ctrl+t open`
                if c.page.is_some() && !typed {
                    v.push(p("ctrl+t", inbox::key_open));
                }
                v.push(p("⏎", inbox::key_send_answer));
            }
        }
        if n > 0 && !full && !typed {
            v.push(p("←→", inbox::key_choose));
        }
        if more && !typed {
            v.push(p("↑↓", inbox::key_other_items));
        }
        if full {
            v.push(p("pgup pgdn", inbox::key_scroll));
        }
        v.push(if full { p("ctrl+o", inbox::key_in_place) } else { p("ctrl+o", inbox::key_full) });
        v.push(p("esc", &inbox::key_to(&a.esc_to)));
        return v;
    }
    if !app.ed.text.is_empty() {
        v.push(p("⏎", if s.enter == Enter::Deny { inbox::key_says_no } else { inbox::key_sends_answer }));
        v.push(if full { p("ctrl+o", inbox::key_in_place) } else { p("ctrl+o", inbox::key_full) });
        v.push(back);
        return v;
    }
    match sb.card.opt.filter(|i| *i < n) {
        Some(i) => v.push(("⏎", cut(&s.options[i], 32))),
        // a hard rule's card: 1 allow, 3 no (designer)
        None if n > 0 && s.nums == [1, 3] => v.push(p("1 3", inbox::key_answer)),
        // a page's card (notif-artifact): its options pick, ctrl+t opens the page
        None if n > 0 && c.page.is_some() => v.push(p(digits(n), inbox::key_pick)),
        None if n > 0 => v.push(p(digits(n), inbox::key_answer)),
        None if s.enter == Enter::Ack => v.push(p("⏎", inbox::key_got_it)),
        None => {}
    }
    if c.page.is_some() {
        v.push(p("ctrl+t", inbox::key_open));
    }
    if n > 0 && !full {
        v.push(p("←→", inbox::key_choose));
    }
    if more {
        v.push(p("↑↓", inbox::key_other_items));
    }
    if full {
        v.push(p("pgup pgdn", inbox::key_scroll));
        v.push(p("ctrl+o", inbox::key_in_place));
    } else {
        v.push(p("ctrl+o", inbox::key_full));
    }
    v.push(back);
    v
}

/// The pairs of an open item's key bar that fit in `width`: `ctrl+o`
/// goes first, then `←→ choose` and `pgup pgdn`, then esc says `back`
/// (80 columns: `1-3 answer   ↑↓ other items   esc back`); then the
/// others drop from the right, the first pair last.
pub(crate) fn fit_pairs(mut v: Vec<(&'static str, String)>, width: usize) -> Vec<(&'static str, String)> {
    let w = |v: &[(&'static str, String)]| {
        v.iter().map(|(k, l)| k.width() + l.width() + 1).sum::<usize>() + 3 * v.len().saturating_sub(1)
    };
    // the long form needs room to breathe: under 100 columns, the short one
    let roomy = |v: &[(&'static str, String)]| w(v) <= width && width >= 100;
    for k in ["ctrl+o", "←→", "pgup pgdn"] {
        if roomy(&v) {
            return v;
        }
        v.retain(|(key, _)| *key != k);
    }
    if w(&v) > width || width < 100 {
        // `esc to main` (answering) keeps its words: it says where they go
        for (k, l) in v.iter_mut() {
            if *k == "esc" && l == inbox::key_back_message {
                *l = inbox::key_back.into();
            }
        }
    }
    // then from the right, the first pair (what answers) last
    while v.len() > 1 && w(&v) > width {
        if v.len() > 2 {
            v.remove(v.len() - 2);
        } else {
            v.pop();
        }
    }
    v
}
