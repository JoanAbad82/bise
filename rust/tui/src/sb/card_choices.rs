//! The open cards as `/close` and `/answer`'s card argument (moved out
//! of cards.rs unchanged, its line limit; notif-artifact).

use super::*;

/// The open cards matching `q` (their number, kind, agent or text):
/// the card argument of `/close` and `/answer`.
pub(crate) fn card_choices(app: &App, q: &str) -> Vec<Choice> {
    app.sb
        .sorted_cards()
        .into_iter()
        .filter(|c| card_matches(q, c.id, &[&c.kind, &c.agent, &c.text]))
        .map(|c| {
            let (_, icon, _) = kind_look(&c.kind);
            Choice {
                value: c.id.to_string(),
                label: if super::setup::is_local(c.id) { "setup".into() } else { format!("#{}", c.id) },
                desc: format!("{} @{} · {}", c.kind, c.agent, truncate_chars(&one_line(&c.text), 80)),
                mark: Some((icon, glyph_color(&c.kind))),
            }
        })
        .collect()
}

/// A card for the typed `q`: a number is the start of the card's number
/// (`99` finds #994, never #1999), and a setup card's number (2^50 + n,
/// setup::LOCAL) is not the user's: it matches `setup` instead (`/close
/// 999` had picked a setup card whose id holds "999", and the hub then
/// answered `no open card #1125899906842624`).
fn card_matches(q: &str, id: u64, fields: &[&str]) -> bool {
    let q = q.trim_start_matches('#');
    let local = super::setup::is_local(id);
    if !q.is_empty() && q.bytes().all(|b| b.is_ascii_digit()) {
        return !local && id.to_string().starts_with(q);
    }
    let num = if local { "setup".to_string() } else { id.to_string() };
    crate::commands::matches(q, &[&num, fields[0], fields[1], fields[2]])
}

/// The text on one line: runs of whitespace become one space.
fn one_line(s: &str) -> String {
    s.split_whitespace().collect::<Vec<_>>().join(" ")
}
