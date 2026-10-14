//! An agent's attachments on its rows (send-parts, designer m_24147): the
//! image and file markers `sb send --attach` puts after its words, drawn
//! as his message's chips (`▣ shot.png`, `▯ deck.pptx`) in their quiet
//! form on a level-3 row and in an opened brief. Pure.

use ratatui::style::Style;
use ratatui::text::{Line, Span};

/// The markers of an attachment (bise_proto::parts' image and file
/// markers, as `parts::render` writes them).
const ATTACH_OPENS: [&str; 2] = ["<image name=\"", "<file name=\""];

/// `s` holds an image or file marker.
pub(crate) fn has(s: &str) -> bool {
    ATTACH_OPENS.iter().any(|m| s.contains(m))
}

/// A brief's words and its attachments after them (send-parts: the
/// markers come last); none: (`body`, "").
pub(crate) fn split(body: &str) -> (&str, &str) {
    match ATTACH_OPENS.iter().filter_map(|m| body.find(m)).min() {
        Some(i) => body.split_at(i),
        None => (body, ""),
    }
}

/// A level-3 line in `st`; its attachments (send-parts: the image and
/// file markers `sb send --attach` put after the words) as his message's
/// chips (`▣ shot.png`, `▯ deck.pptx`) in their quiet form: the same
/// glyphs and names, all in `st`, never the accent (designer m_24147: a
/// message between agents is not for him). A line without one: one span,
/// as before.
pub(crate) fn spans(line: &str, st: Style) -> Vec<Span<'static>> {
    match has(line) {
        true => crate::attach::chip_spans(line, st).into_iter().map(|s| Span::styled(s.content, st)).collect(),
        false => vec![Span::styled(line.to_string(), st)],
    }
}

/// A brief's rows: its words as `rows_of` draws them, then its
/// attachments as one row of quiet chips in `st` (none: its rows alone).
pub(crate) fn with_chips(body: &str, st: Style, rows_of: impl FnOnce(&str) -> Vec<Line<'static>>) -> Vec<Line<'static>> {
    let (words, chips) = split(body);
    let mut rows = rows_of(words.trim_end());
    if !chips.is_empty() {
        rows.push(Line::from(spans(chips, st)));
    }
    rows
}
