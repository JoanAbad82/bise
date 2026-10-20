//! `bise office run` ↔ bend-jsrt's script mode (architect m_23785): one
//! JSON object per line on jsrt's stdout ([`JsrtEv`], tagged `"ev"`) and
//! stdin ([`HarnessCmd`], tagged `"cmd"`).
//!
//! jsrt runs the script and does the file ops itself, behind its door
//! check (`rust/jsrt/src/door.rs`); it knows no hub. After a write it says
//! `wrote` and waits for one `answer`: the harness has sent the
//! `sb artifact add` request on `SB_SOCKET` by then, so `run.write`
//! resolves once the hub has the version (or said why not).
//!
//! The fixtures (`fixtures/office_ev.jsonl`, `fixtures/office_cmd.jsonl`)
//! are the one source; a name is added, never renamed or retyped.

use crate::anchor::Anchor;
use crate::rows::{ArtifactBack, ArtifactLive};
use crate::{decode, is_false, parse};
use serde::{Deserialize, Serialize};
use serde_json::Value;

/// The most anchors a save's changed list carries (the SDK's
/// `CHANGED_CAP`, the hub's `artifacts_turns::CHANGED_CAP`).
pub const CHANGED_CAP: usize = 24;

/// The `changed` field of the `sb artifact add` request `run.write`
/// sends (plan §9b): the anchors of what the save changed. Read at the
/// hub's door: a list that is not one reads as none (no detail, never a
/// refused add), past the cap it is cut.
#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
pub struct Changed(pub Vec<Anchor>);

impl Changed {
    /// An `sb artifact add` request's `changed` field
    /// (`sb::Artifact::Add`): None when it is not a list.
    pub fn of_value(v: &Value) -> Option<Changed> {
        let mut list: Vec<Anchor> = serde_json::from_value(v.clone()).ok()?;
        list.truncate(CHANGED_CAP);
        Some(Changed(list))
    }
}

/// What jsrt's script mode says.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "ev", rename_all = "snake_case")]
pub enum JsrtEv {
    /// a `console.log` (or `.error`, `.warn`) line of the script
    Log { line: String },
    /// a file was written (whole, by rename): the harness tells the hub,
    /// then answers
    Wrote {
        /// absolute, after the door check
        path: String,
        /// `run.write(.., { artifact: true })`: a new artifact when it is
        /// not one yet; else only a next version of one that already is
        #[serde(default, skip_serializing_if = "is_false")]
        artifact: bool,
        /// what the write changed from the file it replaced, as the SDK's
        /// `changedAnchors` says it (at most [`CHANGED_CAP`]); none: a new
        /// file, or the SDK could not say
        #[serde(default, skip_serializing_if = "Option::is_none")]
        changed: Option<Vec<Anchor>>,
    },
    /// the script ended well
    Done,
    /// the script failed (a door refusal, an exception, the time cap)
    Error { message: String },
    #[serde(skip)]
    Unknown { tag: String, raw: Value },
}

impl JsrtEv {
    pub const TAGS: &'static [&'static str] = &["log", "wrote", "done", "error"];

    pub fn decode(line: &str) -> Result<JsrtEv, String> {
        decode(parse(line)?, "ev", Self::TAGS, |tag, raw| JsrtEv::Unknown { tag, raw })
    }

    pub fn to_value(&self) -> Value {
        match self {
            JsrtEv::Unknown { raw, .. } => raw.clone(),
            e => serde_json::to_value(e).expect("a JsrtEv encodes"),
        }
    }
}

/// What the harness answers jsrt.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "cmd", rename_all = "snake_case")]
pub enum HarnessCmd {
    /// the answer to `wrote`: the hub's words (`ok` false: the file is
    /// written, the hub refused the version, `text` says why)
    Answer { ok: bool, text: String },
    #[serde(skip)]
    Unknown { tag: String, raw: Value },
}

impl HarnessCmd {
    pub const TAGS: &'static [&'static str] = &["answer"];

    pub fn decode(line: &str) -> Result<HarnessCmd, String> {
        decode(parse(line)?, "cmd", Self::TAGS, |tag, raw| HarnessCmd::Unknown { tag, raw })
    }

    pub fn to_value(&self) -> Value {
        match self {
            HarnessCmd::Unknown { raw, .. } => raw.clone(),
            c => serde_json::to_value(c).expect("a HarnessCmd encodes"),
        }
    }
}

/// What the live words of an artifact are made from (plan §6; the hub
/// fills it, [`live_words`] says it).
#[derive(Clone, Debug, PartialEq)]
pub struct LiveState<'a> {
    /// its maker (the agent whose turn made the newest version)
    pub agent: &'a str,
    /// that turn still runs
    pub working: bool,
    /// the newest version
    pub v: u32,
    /// what its newest save changed (None: that save said nothing)
    pub rev_changed: Option<&'a [Anchor]>,
    /// what the version changed from the one before, its saves together
    pub changed: Option<&'a [Anchor]>,
}

/// The words a window draws over an artifact while its maker saves it
/// (designer m_23868): `∿ deck is updating · slide 2` while the turn
/// runs, then `v3 · 2 slides changed` with its `← v2` link; v1 at rest
/// says nothing.
/// One function for the viewer's SSE frame and the row's `live`.
pub fn live_words(s: &LiveState) -> Option<ArtifactLive> {
    if s.working {
        let strip = match s.rev_changed.and_then(where_words) {
            Some(w) => format!("∿ {} is updating · {}", s.agent, w),
            None => format!("∿ {} is updating", s.agent),
        };
        return Some(ArtifactLive { strip: Some(strip), ..ArtifactLive::default() });
    }
    if s.v < 2 {
        return None;
    }
    let line = match s.changed.and_then(count_words) {
        Some(c) => format!("v{} · {}", s.v, c),
        None => format!("v{}", s.v),
    };
    let back = ArtifactBack { text: format!("← v{}", s.v - 1), v: s.v - 1 };
    Some(ArtifactLive { strip: None, line: Some(line), back: Some(back) })
}

/// The slides a list names (a shape's slide too), in order, once each.
fn slides_of(list: &[Anchor]) -> Vec<u32> {
    let mut out = Vec::new();
    for a in list {
        if let Anchor::Slide { slide, .. } | Anchor::Shape { slide, .. } = a {
            if !out.contains(slide) {
                out.push(*slide);
            }
        }
    }
    out
}

/// `2`, `2 and 5`, `2, 3 and 5`, `2, 3, 5 and 4 more`.
fn and_list(xs: &[u32]) -> String {
    let s: Vec<String> = xs.iter().map(u32::to_string).collect();
    match s.len() {
        0 => String::new(),
        1 => s[0].clone(),
        2..=3 => format!("{} and {}", s[..s.len() - 1].join(", "), s[s.len() - 1]),
        n => format!("{} and {} more", s[..3].join(", "), n - 3),
    }
}

/// The cells a range covers (`B4` 1, `B4:D9` 18); 1 when it can't say.
fn cells_in(range: &str) -> u64 {
    fn corner(s: &str) -> Option<(u64, u64)> {
        let s = s.replace('$', "");
        let split = s.find(|c: char| c.is_ascii_digit())?;
        let (col, row) = s.split_at(split);
        let col = col.bytes().try_fold(0u64, |n, b| b.is_ascii_uppercase().then(|| n * 26 + (b - b'A' + 1) as u64))?;
        Some((col, row.parse().ok()?))
    }
    let mut parts = range.split(':');
    let (Some(a), b) = (parts.next().and_then(corner), parts.next().and_then(corner)) else { return 1 };
    let b = b.unwrap_or(a);
    (a.0.abs_diff(b.0) + 1) * (a.1.abs_diff(b.1) + 1)
}

fn plural(n: u64, one: &str, many: &str) -> String {
    format!("{} {}", n, if n == 1 { one } else { many })
}

/// Where the newest save was, for the strip: `slide 2`, `slides 2 and 5`,
/// `Q3!B4`, `Q3!B4:D9`, `4 cells`, `a paragraph`, `3 paragraphs`.
fn where_words(list: &[Anchor]) -> Option<String> {
    let slides = slides_of(list);
    if !slides.is_empty() {
        let one = if slides.len() == 1 { "slide" } else { "slides" };
        return Some(format!("{} {}", one, and_list(&slides)));
    }
    let cells: Vec<(&str, &str)> = list.iter().filter_map(|a| if let Anchor::Cell { sheet, range } = a { Some((sheet.as_str(), range.as_str())) } else { None }).collect();
    if let [(sheet, range)] = cells.as_slice() {
        return Some(format!("{}!{}", sheet, range));
    }
    if !cells.is_empty() {
        return Some(plural(cells.iter().map(|(_, r)| cells_in(r)).sum(), "cell", "cells"));
    }
    let paras = list.iter().filter(|a| matches!(a, Anchor::Para { .. })).count();
    match paras {
        0 => None,
        1 => Some("a paragraph".into()),
        n => Some(plural(n as u64, "paragraph", "paragraphs")),
    }
}

/// What a version changed, for the line: `2 slides changed`, `5 cells
/// changed`, `1 paragraph changed`; None when the list names nothing.
fn count_words(list: &[Anchor]) -> Option<String> {
    let slides = slides_of(list).len() as u64;
    let cells: u64 = list.iter().map(|a| if let Anchor::Cell { range, .. } = a { cells_in(range) } else { 0 }).sum();
    let paras = list.iter().filter(|a| matches!(a, Anchor::Para { .. })).count() as u64;
    let what = if slides > 0 {
        plural(slides, "slide", "slides")
    } else if cells > 0 {
        plural(cells, "cell", "cells")
    } else if paras > 0 {
        plural(paras, "paragraph", "paragraphs")
    } else {
        return None;
    };
    Some(format!("{} changed", what))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn slide(n: u32) -> Anchor {
        Anchor::Slide { slide: n, rect: None }
    }
    fn shape(n: u32, id: &str) -> Anchor {
        Anchor::Shape { slide: n, shape: id.into(), quote: String::new() }
    }
    fn cell(sheet: &str, range: &str) -> Anchor {
        Anchor::Cell { sheet: sheet.into(), range: range.into() }
    }
    fn para(id: &str) -> Anchor {
        Anchor::Para { para: id.into(), quote: String::new() }
    }
    /// strip, and line + its link as one would read them
    fn words(working: bool, v: u32, rev: Option<&[Anchor]>, all: Option<&[Anchor]>) -> (Option<String>, Option<String>) {
        let w = live_words(&LiveState { agent: "deck", working, v, rev_changed: rev, changed: all }).unwrap_or_default();
        (w.strip, w.line.map(|l| format!("{}  {}", l, w.back.map(|b| b.text).unwrap_or_default())))
    }

    /// designer m_23868's two lines, word for word.
    #[test]
    fn the_strip_while_the_turn_runs_then_the_line() {
        let rev = [shape(2, "3")];
        let all = [shape(2, "3"), slide(5)];
        assert_eq!(words(true, 3, Some(&rev), Some(&all)), (Some("∿ deck is updating · slide 2".into()), None));
        assert_eq!(words(false, 3, Some(&rev), Some(&all)), (None, Some("v3 · 2 slides changed  ← v2".into())));
        let w = live_words(&LiveState { agent: "deck", working: false, v: 3, rev_changed: None, changed: Some(&all) }).unwrap();
        assert_eq!(w.back, Some(ArtifactBack { text: "← v2".into(), v: 2 }), "the link opens v2");
        assert_eq!(w.line.as_deref(), Some("v3 · 2 slides changed"), "the link is drawn apart, 16 px after");
    }

    #[test]
    fn a_save_that_said_nothing_shows_no_detail() {
        assert_eq!(words(true, 2, None, None).0.as_deref(), Some("∿ deck is updating"));
        assert_eq!(words(false, 4, None, None).1.as_deref(), Some("v4  ← v3"));
        assert_eq!(words(false, 4, Some(&[]), Some(&[])).1.as_deref(), Some("v4  ← v3"), "a list that names nothing");
        assert_eq!(live_words(&LiveState { agent: "deck", working: false, v: 1, rev_changed: None, changed: None }), None, "v1 at rest");
    }

    #[test]
    fn where_and_how_many_per_kind() {
        assert_eq!(where_words(&[slide(2), shape(5, "4"), shape(2, "9")]).unwrap(), "slides 2 and 5");
        assert_eq!(where_words(&[slide(1), slide(2), slide(3), slide(7), slide(9)]).unwrap(), "slides 1, 2, 3 and 2 more");
        assert_eq!(where_words(&[cell("Q3", "B4")]).unwrap(), "Q3!B4");
        assert_eq!(where_words(&[cell("Q3", "B4:D9")]).unwrap(), "Q3!B4:D9");
        assert_eq!(where_words(&[cell("Q3", "B4"), cell("Q3", "C1:C3")]).unwrap(), "4 cells");
        assert_eq!(where_words(&[para("1")]).unwrap(), "a paragraph");
        assert_eq!(where_words(&[para("1"), para("2")]).unwrap(), "2 paragraphs");
        assert_eq!(count_words(&[cell("Q3", "B1:D10"), cell("Q4", "A1")]).unwrap(), "31 cells changed");
        assert_eq!(count_words(&[para("1")]).unwrap(), "1 paragraph changed");
        assert_eq!(count_words(&[slide(4)]).unwrap(), "1 slide changed");
        assert_eq!(count_words(&[Anchor::Unknown(json!({"kind": "frame"}))]), None);
    }

    /// The request's field: a list of anchors, cut at the cap; anything
    /// else reads as none, never as a refusal.
    #[test]
    fn the_add_requests_changed_field() {
        let many: Vec<Value> = (1..=40).map(|n| json!({"kind": "slide", "slide": n})).collect();
        assert_eq!(Changed::of_value(&json!(many)).unwrap().0.len(), CHANGED_CAP);
        assert_eq!(Changed::of_value(&json!([{"kind": "para", "para": "A1"}])), Some(Changed(vec![para("A1")])));
        assert_eq!(Changed::of_value(&json!("slide 2")), None);
        // on the request: absent is none, as before
        let add = |v: Value| match crate::sb::Req::decode(v).unwrap() {
            crate::sb::Req::Artifact(crate::sb::Artifact::Add { changed, .. }) => changed.as_ref().and_then(Changed::of_value),
            r => panic!("{r:?}"),
        };
        assert_eq!(add(json!({"cmd": "artifact", "do": "add", "target": "a.docx"})), None);
        assert_eq!(add(json!({"cmd": "artifact", "do": "add", "target": "a.docx", "changed": "slide 2"})), None);
    }
}
