//! Where a note sits on an artifact (office-artifacts plan §5, architect
//! m_23701 §9.5): one type for every target, wire from the start.
//!
//! An [`Anchor`] is an object tagged `"kind"`:
//!
//! - `block`: a block of a bise page or an html artifact, `{block, quote?}`;
//! - `cell`: a range of a sheet, `{sheet, range}` (`B4`, `B4:D9`);
//! - `slide`: a slide of a deck, or a box on it, `{slide, rect?}`;
//! - `shape`: a shape of a slide, `{slide, shape, quote?}` (`shape` is the
//!   shape's `p:cNvPr/@id`, as the SDK's `inspect()` says it);
//! - `para`: a paragraph of a document, `{para, quote?}` (its `w14:paraId`);
//! - `region`: a box on an image or a pdf page, `{page?, rect, quote?}`
//!   (a pdf passage: its words' box and its words);
//! - `text`: a line of any text file, `{line, quote?}`.
//!
//! Slides, pages and lines count from 1. A [`Rect`] is in % of the
//! frame (the slide, the image, the page): `0..=100` each.
//!
//! The wire rule (lib.rs): fields are only added; a kind this version does
//! not know reads as [`Anchor::Unknown`] with its whole object, and writes
//! back unchanged, so a note an older bise keeps loses nothing. A known kind
//! with bad fields reads as `Unknown` too (a store never drops a note).
//! The TS (`anchor.ts` in apps/desktop/src/proto, and
//! `office/sdk/src/anchor.gen.ts` for the SDK) is made by `tests/ts.rs`;
//! `Unknown` is not in it: the SDK's `at()` refuses a kind it does not know.

use serde::{Deserialize, Serialize};
use serde_json::Value;

/// A box in % of its frame (the slide, the image, the page).
#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct Rect {
    pub x: f64,
    pub y: f64,
    pub w: f64,
    pub h: f64,
}

/// Where a note sits (the module's doc says each kind).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum Anchor {
    /// a block of a page or an html artifact
    Block {
        block: String,
        #[serde(default, skip_serializing_if = "String::is_empty")]
        quote: String,
    },
    /// a range of a sheet: `B4`, `B4:D9`
    Cell { sheet: String, range: String },
    /// a slide, or a box drawn on it
    Slide {
        slide: u32,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        #[cfg_attr(feature = "ts", ts(optional))]
        rect: Option<Rect>,
    },
    /// a shape of a slide, by its id (`p:cNvPr/@id`)
    Shape {
        slide: u32,
        shape: String,
        #[serde(default, skip_serializing_if = "String::is_empty")]
        quote: String,
    },
    /// a paragraph of a document, by its `w14:paraId`
    Para {
        para: String,
        #[serde(default, skip_serializing_if = "String::is_empty")]
        quote: String,
    },
    /// a box on an image, or on a page of a pdf; a passage of a pdf is
    /// its words' box with the words in `quote` (pdf-notes, architect m_24668)
    Region {
        #[serde(default, skip_serializing_if = "Option::is_none")]
        #[cfg_attr(feature = "ts", ts(optional))]
        page: Option<u32>,
        rect: Rect,
        #[serde(default, skip_serializing_if = "String::is_empty")]
        quote: String,
    },
    /// a line of a text file
    Text {
        line: u32,
        #[serde(default, skip_serializing_if = "String::is_empty")]
        quote: String,
    },
    /// a kind this version doesn't know (or a known one with bad fields):
    /// the whole object, written back as it came
    #[serde(untagged)]
    #[cfg_attr(feature = "ts", ts(skip))]
    Unknown(Value),
}

impl Rect {
    /// A box in % of its frame, each number clamped to `0..=100` (a NaN
    /// becomes 0): the one way Rust code builds a rect.
    pub fn new(x: f64, y: f64, w: f64, h: f64) -> Rect {
        let pct = |v: f64| if v.is_nan() { 0.0 } else { v.clamp(0.0, 100.0) };
        Rect { x: pct(x), y: pct(y), w: pct(w), h: pct(h) }
    }
}

// Equality is total: a rect comes from JSON, where serde refuses NaN, or
// from [`Rect::new`], which never makes one; Rust code never builds a Rect
// with NaN otherwise. So an anchor can sit in a message part
// (`parts::Part::Anchor`, which is Eq).
impl Eq for Rect {}
impl Eq for Anchor {}

/// What a chip and a note's line call an anchor (designer signs the
/// words, designer m_24098: never a machine id): `Q3!B4:D9`, `slide 2`,
/// `slide 2 · a box`, `slide 2 · "Revenue"`, `slide 2 · a shape`,
/// `"net revenue…"` (a paragraph by its words), `page 1 · a box`,
/// `page 1 · "net revenue…"` (a pdf passage), `line 40`. Both apps draw it from this rule (fixture anchor_label.json).
pub fn label(a: &Anchor) -> String {
    let quoted = |q: &str| format!("\"{}\"", short(q, 40));
    match a {
        Anchor::Block { block, quote } if quote.trim().is_empty() => format!("block {block}"),
        Anchor::Block { quote, .. } => quoted(quote),
        Anchor::Cell { sheet, range } => format!("{}!{range}", sheet_ref(sheet)),
        Anchor::Slide { slide, rect: None } => format!("slide {slide}"),
        Anchor::Slide { slide, rect: Some(_) } => format!("slide {slide} · a box"),
        Anchor::Shape { slide, quote, .. } if !quote.trim().is_empty() => format!("slide {slide} · {}", quoted(quote)),
        Anchor::Shape { slide, .. } => format!("slide {slide} · a shape"),
        Anchor::Para { quote, .. } if !quote.trim().is_empty() => quoted(quote),
        Anchor::Para { .. } => "a paragraph".into(),
        Anchor::Region { page: Some(p), quote, .. } if !quote.trim().is_empty() => format!("page {p} · {}", quoted(quote)),
        Anchor::Region { page: None, quote, .. } if !quote.trim().is_empty() => quoted(quote),
        Anchor::Region { page: Some(p), .. } => format!("page {p} · a box"),
        Anchor::Region { page: None, .. } => "a box".into(),
        Anchor::Text { line, .. } => format!("line {line}"),
        Anchor::Unknown(_) => "a part".into(),
    }
}

/// A sheet's name as a reference says it: `Q3`, `'My sheet'` (Excel's
/// rule: quoted unless letters, digits, `_` and `.`, not starting with a
/// digit; a `'` inside doubled).
fn sheet_ref(sheet: &str) -> String {
    let plain = !sheet.is_empty() && !sheet.starts_with(|c: char| c.is_ascii_digit()) && sheet.chars().all(|c| c.is_alphanumeric() || c == '_' || c == '.');
    match plain {
        true => sheet.to_string(),
        false => format!("'{}'", sheet.replace('\'', "''")),
    }
}

/// One line, at most `max` characters, `…` when cut.
fn short(s: &str, max: usize) -> String {
    let one = s.split_whitespace().collect::<Vec<_>>().join(" ");
    match one.chars().count() <= max {
        true => one,
        false => format!("{}…", one.chars().take(max - 1).collect::<String>().trim_end()),
    }
}

impl Anchor {
    /// The kinds this version knows, as on the wire.
    pub const KINDS: &'static [&'static str] = &["block", "cell", "slide", "shape", "para", "region", "text"];

    /// The kind as on the wire (an unknown one's own, `""` when it has none).
    pub fn kind(&self) -> &str {
        match self {
            Anchor::Block { .. } => "block",
            Anchor::Cell { .. } => "cell",
            Anchor::Slide { .. } => "slide",
            Anchor::Shape { .. } => "shape",
            Anchor::Para { .. } => "para",
            Anchor::Region { .. } => "region",
            Anchor::Text { .. } => "text",
            Anchor::Unknown(v) => v.get("kind").and_then(Value::as_str).unwrap_or(""),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn read(v: Value) -> Anchor {
        serde_json::from_value(v).unwrap()
    }

    #[test]
    fn each_kind_reads_and_writes_back() {
        let lines = [
            json!({"kind": "block", "block": "b3", "quote": "the plan"}),
            json!({"kind": "cell", "sheet": "Q3", "range": "B4:D9"}),
            json!({"kind": "slide", "slide": 2, "rect": {"x": 10.0, "y": 20.0, "w": 30.0, "h": 5.5}}),
            json!({"kind": "shape", "slide": 3, "shape": "12"}),
            json!({"kind": "para", "para": "3F2A1B00", "quote": "net revenue"}),
            json!({"kind": "region", "page": 1, "rect": {"x": 0.0, "y": 0.0, "w": 50.0, "h": 50.0}}),
            json!({"kind": "region", "page": 2, "rect": {"x": 10.0, "y": 30.0, "w": 60.0, "h": 4.0}, "quote": "net revenue grew"}),
            json!({"kind": "text", "line": 40}),
        ];
        let mut seen = std::collections::BTreeSet::new();
        for l in lines {
            let a = read(l.clone());
            assert!(!matches!(a, Anchor::Unknown(_)), "{l}");
            assert!(Anchor::KINDS.contains(&a.kind()));
            assert_eq!(serde_json::to_value(&a).unwrap(), l);
            seen.insert(a.kind().to_string());
        }
        // KINDS is every variant, no more (the TS's ANCHOR_KINDS is made from it)
        assert_eq!(seen.len(), Anchor::KINDS.len());
    }

    #[test]
    fn an_unknown_kind_keeps_its_whole_object() {
        let l = json!({"kind": "frame", "frame": 7, "t": 1.5});
        let a = read(l.clone());
        assert_eq!(a, Anchor::Unknown(l.clone()));
        assert_eq!(a.kind(), "frame");
        assert_eq!(serde_json::to_value(&a).unwrap(), l);
        // a known kind with a field missing is kept the same way, not refused
        let bad = json!({"kind": "cell", "sheet": "Q3"});
        assert_eq!(read(bad.clone()), Anchor::Unknown(bad));
    }

    /// architect m_23734: a known kind with bad fields is Unknown and its
    /// line comes back byte for byte (art-notes says "bad cell anchor" for it).
    #[test]
    fn a_known_kind_with_bad_fields_writes_back_byte_equal() {
        for line in [r#"{"kind":"cell","range":"B4","sheet":7}"#, r#"{"kind":"slide","slide":"two"}"#, r#"{"kind":"region","page":1}"#] {
            let a: Anchor = serde_json::from_str(line).unwrap();
            assert!(matches!(a, Anchor::Unknown(_)), "{line}");
            assert!(Anchor::KINDS.contains(&a.kind()), "{line}");
            assert_eq!(serde_json::to_string(&a).unwrap(), line);
        }
    }

    #[test]
    fn a_rect_is_clamped_to_its_frame() {
        assert_eq!(Rect::new(-5.0, 20.0, 130.0, f64::NAN), Rect { x: 0.0, y: 20.0, w: 100.0, h: 0.0 });
        assert!(serde_json::from_str::<Rect>(r#"{"x":NaN,"y":0,"w":1,"h":1}"#).is_err(), "JSON has no NaN");
    }

    #[test]
    fn inside_a_note_too() {
        #[derive(Serialize, Deserialize)]
        struct Note {
            text: String,
            at: Anchor,
        }
        let l = json!({"text": "why?", "at": {"kind": "voxel", "x": 1}});
        let n: Note = serde_json::from_value(l.clone()).unwrap();
        assert_eq!(n.at.kind(), "voxel");
        assert_eq!(serde_json::to_value(&n).unwrap(), l);
    }
}
