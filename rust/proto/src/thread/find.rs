//! Find in a thread (⌘F, `thread/find`): what of an entry is searched and
//! how a needle matches it. One rule for the hub's search over the whole
//! transcript, the TUI and the desktop (whose `findText` is pinned to this
//! one by `fixtures/find_text.json`). Pure.
//!
//! The words searched: the entry's text, each tool's text, a card's
//! question and option labels, a page's title (thinking is not searched).
//! A match is case-insensitive, without overlaps.

use super::{Entry, Pos};

/// Hits one `thread_hits` carries at most (the newest kept: find starts there).
pub const MAX_HITS: usize = 5000;

/// An entry's searchable words, one part per line.
pub fn find_text(e: &Entry) -> String {
    let mut parts: Vec<&str> = vec![&e.text];
    if let Some(t) = &e.tools {
        parts.extend(t.items.iter().map(|i| i.text.as_str()));
    }
    if let Some(c) = &e.card {
        parts.push(&c.question);
        parts.extend(c.options.iter().map(|o| o.label.as_str()));
    }
    if let Some(p) = &e.page {
        parts.push(&p.title);
    }
    parts.join("\n")
}

/// How many times `needle` is in `text`, case-insensitive, without overlaps
/// (a blank needle: none).
pub fn count_in(text: &str, needle: &str) -> u32 {
    let n = needle.to_lowercase();
    if n.trim().is_empty() {
        return 0;
    }
    text.to_lowercase().matches(n.as_str()).count() as u32
}

/// One entry's hits: its pos and how many matches it holds.
#[derive(Clone, Copy, Debug, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct FindHit {
    pub pos: Pos,
    pub n: u32,
}

/// The entries of `entries` that hold `needle`, in their order.
pub fn hits<'a>(entries: impl IntoIterator<Item = &'a Entry>, needle: &str) -> Vec<FindHit> {
    entries
        .into_iter()
        .filter_map(|e| {
            let n = count_in(&find_text(e), needle);
            (n > 0).then_some(FindHit { pos: e.pos, n })
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counts_case_insensitive_without_overlaps() {
        assert_eq!(count_in("Kumquat kumquat KUMQUAT", "kumquat"), 3);
        assert_eq!(count_in("aaaa", "aa"), 2);
        assert_eq!(count_in("anything", "  "), 0);
        assert_eq!(count_in("Éclair éclair", "ÉCLAIR"), 2);
    }

    /// The desktop's findText (apps/desktop/src/thread/entry.test.ts) reads the same cases.
    #[test]
    fn find_text_matches_the_shared_fixture() {
        let cases: Vec<serde_json::Value> = serde_json::from_str(include_str!("../../fixtures/find_text.json")).unwrap();
        assert!(!cases.is_empty());
        for c in cases {
            let e: Entry = serde_json::from_value(c["entry"].clone()).unwrap();
            assert_eq!(find_text(&e), c["text"].as_str().unwrap(), "{}", c["name"]);
        }
    }

    #[test]
    fn hits_name_the_entries_and_their_counts() {
        let cases: Vec<serde_json::Value> = serde_json::from_str(include_str!("../../fixtures/find_text.json")).unwrap();
        let entries: Vec<Entry> = cases.iter().map(|c| serde_json::from_value(c["entry"].clone()).unwrap()).collect();
        let h = hits(&entries, "deploy");
        assert!(h.iter().all(|x| x.n > 0));
        assert_eq!(h.iter().map(|x| x.pos).collect::<Vec<_>>(), entries.iter().filter(|e| find_text(e).to_lowercase().contains("deploy")).map(|e| e.pos).collect::<Vec<_>>());
    }
}
