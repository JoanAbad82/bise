//! Round 10's agents view (ambient-lead m_7026, identity10 #data): the
//! rows of the list and an agent's preview, pure functions over the hub's
//! snapshot and the typed entries of its thread (the hub folds them,
//! bise-proto; the core's own fold copy went in desktop S3b step 1). The
//! core keeps the state and does the I/O (core/agents_view.rs).

use bise_proto::app_rows::PreviewAction;
use bise_proto::rows::{Opt, Page};
use bise_proto::thread::{Entry, EntryCard, EntryKind, PageRef};
use serde_json::json;

/// Open cards not found in the feed sit after every line (their pos):
/// `CARD_POS + id`, stable, so an answer replaces the same entry.
pub const CARD_POS: u64 = 1_000_000_000;

/// The first line of a text, clipped.
pub fn one_line(s: &str, max: usize) -> String {
    let l = s.lines().map(str::trim).find(|l| !l.is_empty()).unwrap_or("");
    crate::render::truncate_chars(l, max)
}

/// A page as an entry or a preview shows it, from the hub's pages.
pub fn page_ref(id: &str, pages: &[Page]) -> PageRef {
    let p = pages.iter().find(|p| p.id == id);
    let title = p.map(|p| p.title.clone()).filter(|t| !t.is_empty()).unwrap_or_else(|| id.replace('-', " "));
    PageRef { id: id.to_string(), title, v: p.map(|p| p.version), url: p.map_or("", |p| p.url.as_str()).to_string() }
}

/// A card as an entry shows it: the question without its options, the
/// options, answered when it is not open any more.
pub fn card_ref(id: u64, kind: &str, agent: &str, text: &str, open: bool) -> EntryCard {
    let options = crate::sb::ambient_options(kind, agent, text);
    let (body, listed) = crate::sb::split_choices(text);
    let question = if !listed.is_empty() && listed.iter().eq(options.iter().map(|(_, l)| l)) { body } else { text.to_string() };
    let options = options.into_iter().map(|(n, label)| Opt { n: n as u32, label, act: None }).collect();
    EntryCard { id, question: question.trim().to_string(), options, answered: !open, kind: None, agent: None, closed: None }
}

/// An open card not in the agent's thread as an entry after it (at
/// `CARD_POS + id`); `card` answered: the panel fades it.
pub fn card_entry(card: EntryCard) -> Entry {
    let v = json!({"pos": CARD_POS + card.id, "at_ms": 0, "kind": "card", "text": card.question, "card": card});
    serde_json::from_value(v).expect("a card entry is an Entry")
}

/// The preview's last actions (newest last): its tool steps, its
/// messages, its reports, pages and lands, one line each.
pub fn actions(entries: &[Entry], n: usize) -> Vec<PreviewAction> {
    let mut out = Vec::new();
    for e in entries {
        let one = |kind: &str| PreviewAction { at_ms: e.at_ms, kind: kind.to_string(), text: one_line(&e.text, 120) };
        match e.kind {
            EntryKind::Tools => {
                for i in e.tools.iter().flat_map(|t| &t.items) {
                    let kind = if i.land { "land" } else { "tool" };
                    out.push(PreviewAction { at_ms: i.at_ms, kind: kind.to_string(), text: i.text.clone() });
                }
            }
            EntryKind::Agent => out.push(one("message")),
            EntryKind::Report => out.push(one("report")),
            EntryKind::Page => out.push(one("page")),
            _ => {}
        }
    }
    let skip = out.len().saturating_sub(n);
    out.split_off(skip)
}
