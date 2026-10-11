//! A long paste becomes a chip (BISE-240, book §13): a bracketed paste
//! of at least [`MIN_LINES`] lines or [`MIN_CHARS`] characters goes in
//! the composer as the chip `▤ 1` at the cursor (it replaces the
//! selection), its text an attachment: the box above the composer lists
//! it, `▤ 1 “first words of the paste…”   240 lines · 9.8 kB`. A shorter
//! paste and typed text stay inline, as before.
//!
//! Undo: the first one right after the paste puts the pasted text inline
//! (the paste is two undo steps: the text, then the text to its chip), a
//! second one takes it away. Backspace on the chip removes it, like an
//! image.
//!
//! On send, the chip becomes the whole text, where the chip was, in one
//! tag:
//!
//! ```text
//! look at this <pasted n="1" lines="240">
//! the pasted text
//! </pasted> and tell me
//! ```
//!
//! The history draws the tag as the chip again, and under your message
//! one dim row per paste, `▤ 1 “first words…” · 240 lines`; opening the
//! message (ctrl+o, a click, space: the user-message fold) shows the
//! full text there. Never the full text by default.
//!
//! A paste is an [`Attachment`](crate::attach::Attachment): its label is
//! `[Paste #N]`, its marker the tag. Its number comes from the one
//! sequence images and quotes use too (a number points at one row of the
//! box).

use crate::app::App;
use crate::attach::Attachment;

/// A paste of at least this many lines becomes a chip.
pub(crate) const MIN_LINES: usize = 12;
/// A paste of at least this many characters becomes a chip.
pub(crate) const MIN_CHARS: usize = 1200;
/// How the label of a paste starts (`[Paste #2]`).
pub(crate) const OPEN: &str = "[Paste #";


/// The label of paste `n`.
pub(crate) fn label(n: usize) -> String {
    format!("{OPEN}{n}]")
}

pub(crate) fn is_paste(label: &str) -> bool {
    label.starts_with(OPEN)
}

/// A bracketed paste this long becomes a chip.
pub(crate) fn is_long(text: &str) -> bool {
    crate::quote::line_count(text) >= MIN_LINES || text.chars().count() >= MIN_CHARS
}

/// The paste chips in `text` (first char, past it, N).
pub(crate) fn chips(text: &str) -> Vec<(usize, usize, usize)> {
    crate::attach::find_labels(text, OPEN)
}

/// The tag paste `n` sends: `<pasted n="1" lines="240">\n{text}\n</pasted>`.
/// A `</pasted>` inside the text is broken (`</pasted >`) so the tag
/// always ends where it should.
pub(crate) fn tag(n: usize, text: &str) -> String {
    // the one template (msg-parts): bise_proto's, the hub's and desktop's
    bise_proto::parts::paste_tag(u32::try_from(n).unwrap_or(u32::MAX), text)
}

/// A paste read back from its tag.
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct Pasted {
    pub(crate) n: usize,
    pub(crate) text: String,
}

/// Its tag read back (bise_proto's one read, msg-parts).
fn parse_tag(s: &str) -> Option<Pasted> {
    match bise_proto::parts::parse(s).as_slice() {
        [bise_proto::parts::Part::Paste { n, text }] => Some(Pasted { n: *n as usize, text: text.clone() }),
        _ => None,
    }
}

// ---- the history (book §6): the chip in the line, a row under it ----

/// A paste's chip in a history line: its number between two
/// private-use chars (`said::view`), drawn `▤ 1` by
/// [`crate::attach::chip_spans`]. Never typed, never sent.
pub(crate) const MARK_OPEN: char = '\u{E000}';
pub(crate) const MARK_CLOSE: char = '\u{E001}';

/// The chip marks in a history line: (byte start, byte past it, N).
pub(crate) fn marks(line: &str) -> Vec<(usize, usize, usize)> {
    let mut out = Vec::new();
    let mut from = 0usize;
    while let Some(i) = line.get(from..).and_then(|t| t.find(MARK_OPEN)) {
        let at = from + i;
        let digits = &line[at + MARK_OPEN.len_utf8()..];
        let len = digits.bytes().take_while(u8::is_ascii_digit).count();
        match digits[len..].starts_with(MARK_CLOSE).then(|| digits[..len].parse::<usize>().ok()).flatten() {
            Some(n) => {
                let end = at + MARK_OPEN.len_utf8() + len + MARK_CLOSE.len_utf8();
                out.push((at, end, n));
                from = end;
            }
            None => from = at + MARK_OPEN.len_utf8(),
        }
    }
    out
}

/// The rows under your message for its pastes. Closed (always, unless
/// the message is open): one dim row each, `▤ 1 “first words…” · 240
/// lines`, cut to `width`. Open: `▤ 1 · 240 lines`, then every line of
/// the paste in the text color.
pub(crate) fn rows(pastes: &[Pasted], open: bool, width: usize) -> Vec<ratatui::text::Line<'static>> {
    use ratatui::style::Style;
    use ratatui::text::{Line, Span};
    use unicode_width::UnicodeWidthStr;
    let d = Style::default().fg(crate::theme::dim());
    let g = crate::theme::glyph(crate::theme::G_PASTE);
    let mut out = Vec::new();
    for p in pastes {
        let n = crate::quote::line_count(&p.text);
        let count = format!("{n} line{}", if n == 1 { "" } else { "s" });
        if open {
            out.push(Line::from(Span::styled(format!("{g} {} · {count}", p.n), d)));
            let t = Style::default().fg(crate::theme::text());
            out.extend(p.text.trim_end_matches('\n').split('\n').map(|l| Line::from(Span::styled(l.trim_end_matches('\r').to_string(), t))));
        } else {
            let head = format!("{g} {} ", p.n);
            let tail = format!(" · {count}");
            let room = width.saturating_sub(head.width() + tail.width() + 2).clamp(8, 60);
            let words = crate::quote::preview(&p.text, room);
            out.push(Line::from(Span::styled(format!("{head}“{words}”{tail}"), d)));
        }
    }
    out
}

/// What the box and the history say about a paste: `240 lines · 9.8 kB`.
pub(crate) fn about(text: &str) -> String {
    let n = crate::quote::line_count(text);
    let s = if n == 1 { "" } else { "s" };
    format!("{n} line{s} · {}", crate::attach::size_text(text.len() as u64))
}

/// The paste an attachment holds (its marker is its tag).
pub(crate) fn of(a: &Attachment) -> Option<Pasted> {
    if !is_paste(&a.label) {
        return None;
    }
    parse_tag(&a.marker)
}

/// A long bracketed paste: the text in the composer, then its chip in
/// its place, two undo steps (the first undo gives the text inline back,
/// the second takes it away). Returns the chip's name for the flash.
/// The text keeps its newlines; trailing ones go.
pub(crate) fn add(app: &mut App, text: &str) -> String {
    let body = text.trim_end_matches('\n');
    let n = crate::attach::next_number(app);
    let l = label(n);
    app.attachments.push(Attachment { label: l.clone(), marker: tag(n, body), info: Default::default() });
    // step 1: the text inline, as a short paste would be
    app.ed.paste(text);
    let end = app.ed.cursor;
    let start = end.saturating_sub(text.chars().count());
    // step 2: the text becomes the chip
    app.ed.select_range(start, end);
    crate::attach::insert_chip(&mut app.ed, &l);
    crate::attach::chip_name(&l)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn lines(n: usize) -> String {
        (1..=n).map(|i| format!("line {i}\n")).collect()
    }

    #[test]
    fn the_threshold_is_12_lines_or_1200_chars() {
        assert!(!is_long(&lines(11)));
        assert!(is_long(&lines(12)));
        assert!(!is_long(&"x".repeat(1199)));
        assert!(is_long(&"x".repeat(1200)));
        // characters, not bytes
        assert!(!is_long(&"é".repeat(1000)));
    }

    #[test]
    fn a_tag_reads_back_and_a_close_tag_inside_is_broken() {
        let t = tag(3, "a\n</pasted>\nb");
        assert_eq!(t, "<pasted n=\"3\" lines=\"3\">\na\n</pasted >\nb\n</pasted>");
        assert_eq!(parse_tag(&t), Some(Pasted { n: 3, text: "a\n</pasted >\nb".into() }));
    }

    /// A sent message's pastes in place, as the history reads them
    /// (`said::view`, from its parts); a broken or typed tag is text.
    #[test]
    fn the_history_finds_each_tag_in_place() {
        let msg = format!("look {} and {}\nok", tag(1, "a\nb"), tag(2, "c"));
        let v = crate::said::view(&crate::said::Said::from(msg.as_str()));
        assert_eq!(v.body, format!("look {MARK_OPEN}1{MARK_CLOSE} and {MARK_OPEN}2{MARK_CLOSE}\nok"));
        assert_eq!(v.pastes, vec![Pasted { n: 1, text: "a\nb".into() }, Pasted { n: 2, text: "c".into() }]);
        for s in ["<pasted n=\"1\">x</pasted>", "<pasted n=\"x\" lines=\"1\">\nx\n</pasted>", "plain", ""] {
            let v = crate::said::view(&crate::said::Said::from(s));
            assert_eq!((v.body.as_str(), v.pastes.len()), (s, 0), "{s}");
        }
    }

    fn row_text(l: &ratatui::text::Line) -> String {
        l.spans.iter().map(|s| s.content.as_ref()).collect()
    }

    #[test]
    fn the_history_folds_each_tag_to_its_chip_and_one_row() {
        let msg = format!("see {} ok", tag(2, &lines(240)));
        let v = crate::said::view(&crate::said::Said::from(msg.as_str()));
        let (body, pastes) = (v.body, v.pastes);
        assert_eq!(body, "see \u{E000}2\u{E001} ok");
        assert_eq!(marks(&body), vec![(4, 4 + 3 + 1 + 3, 2)]);
        assert_eq!(pastes.len(), 1);
        let closed: Vec<String> = rows(&pastes, false, 80).iter().map(row_text).collect();
        assert_eq!(closed.len(), 1);
        assert!(closed[0].starts_with("\u{25a4} 2 \u{201c}line 1 line 2"), "{closed:?}");
        assert!(closed[0].ends_with("\u{2026}\u{201d} \u{b7} 240 lines"), "{closed:?}");
        let open: Vec<String> = rows(&pastes, true, 80).iter().map(row_text).collect();
        assert_eq!(open.len(), 241);
        assert_eq!(open[0], "\u{25a4} 2 \u{b7} 240 lines");
        assert_eq!(open[240], "line 240");
        // the chip in the line: `▤ 2` in the accent
        let spans = crate::attach::chip_spans(&body, ratatui::style::Style::default());
        let shown: Vec<&str> = spans.iter().map(|s| s.content.as_ref()).collect();
        assert_eq!(shown, ["see ", "\u{25a4} 2", " ok"]);
        // a stray mark is text
        assert!(marks("a\u{E000}x\u{E001}").is_empty());
    }

    #[test]
    fn about_counts_lines_and_bytes() {
        assert_eq!(about(&lines(240)), "240 lines · 2 kB");
        assert_eq!(about("one"), "1 line · 3 B");
    }
}
