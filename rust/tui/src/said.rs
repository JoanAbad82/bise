//! His message as the TUI holds it (msg-parts, architect m_17621): the
//! text the model got and its typed parts (`bise_proto::parts`), and the
//! history's view of them. When a message has parts the history draws
//! it from them, never from its text. Pure.

use crate::pasted::{Pasted, MARK_CLOSE, MARK_OPEN};
use crate::quote::{Quote, Where};
use bise_proto::parts::{self, Part};

/// His message: the model's text and its parts (none: plain words).
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub(crate) struct Said {
    pub(crate) text: String,
    pub(crate) parts: Vec<Part>,
}

impl Said {
    /// `parts` as the hub sent them; none: read back from `text` once
    /// (an older hub, a line of an old transcript, his own history).
    pub(crate) fn new(text: String, parts: Vec<Part>) -> Said {
        let parts = match parts.is_empty() {
            true => parts::of_text(&text),
            false => parts,
        };
        Said { text, parts }
    }

    /// His message from its parts: the text is theirs (the composers'
    /// one template, `parts::render`).
    pub(crate) fn of_parts(parts: Vec<Part>) -> Said {
        let parts = parts::canonical(&parts);
        let text = parts::render(&parts);
        match parts.iter().all(|p| matches!(p, Part::Text { .. })) {
            true => Said { text, parts: Vec::new() },
            false => Said { text, parts },
        }
    }

    /// His words alone (no quote, paste or image): a row's gist.
    pub(crate) fn words(&self) -> String {
        match self.parts.is_empty() {
            true => self.text.clone(),
            false => parts::words(&self.parts),
        }
    }
}

impl From<String> for Said {
    fn from(text: String) -> Said {
        Said::new(text, Vec::new())
    }
}

impl From<&str> for Said {
    fn from(text: &str) -> Said {
        Said::new(text.to_string(), Vec::new())
    }
}

impl std::ops::Deref for Said {
    type Target = String;
    fn deref(&self) -> &String {
        &self.text
    }
}

impl PartialEq<str> for Said {
    fn eq(&self, other: &str) -> bool {
        self.text == other
    }
}

impl PartialEq<String> for Said {
    fn eq(&self, other: &String) -> bool {
        self.text == *other
    }
}

impl PartialEq<&str> for Said {
    fn eq(&self, other: &&str) -> bool {
        self.text == *other
    }
}

impl std::fmt::Display for Said {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.text)
    }
}

/// His message as the history draws it: the quotes in front, the words
/// with each long paste as its chip mark (`▤ 1`) and each image as its
/// marker (`▣ name`, `attach::chip_spans`), then his files' list, and
/// the pastes for the rows under it.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub(crate) struct View {
    pub(crate) quotes: Vec<Quote>,
    pub(crate) body: String,
    pub(crate) pastes: Vec<Pasted>,
}

/// The view of `parts` (none: `text` is plain words).
pub(crate) fn view_of(text: &str, parts: &[Part]) -> View {
    if parts.is_empty() {
        return View { body: text.to_string(), ..View::default() };
    }
    let mut v = View::default();
    let mut files: Vec<&str> = Vec::new();
    for p in parts {
        match p {
            Part::Quote { from, text, file, new, old, n } => {
                let at = Where { file: file.clone(), new: new.clone(), old: old.clone() };
                v.quotes.push(Quote { from: from.clone(), text: text.clone(), at });
                // another client's quote at its place (his m_22231): its
                // chip's number where he put it, the block above as ever
                if let Some(n) = n {
                    v.body.push_str(&format!("❝ {n}"));
                }
            }
            Part::Text { text } => v.body.push_str(text),
            Part::Paste { n, text } => {
                v.body.push(MARK_OPEN);
                v.body.push_str(&n.to_string());
                v.body.push(MARK_CLOSE);
                v.pastes.push(Pasted { n: *n as usize, text: text.clone() });
            }
            Part::Image { name, source, mime, b64_file, caption } => v.body.push_str(&parts::image_marker(name, source, mime, b64_file, caption)),
            // a file chip in place, as its marker (`▯ deck.pptx`,
            // attach::chip_spans); a listed file in the list after
            Part::File { path, name, missing } if !name.is_empty() => v.body.push_str(&parts::file_marker(name, path, *missing)),
            Part::File { path, .. } => files.push(path),
            // the hub's line for the model (the capsule's), never drawn
            Part::Hint { .. } => {}
            // his notes on a page, never the hub's template
            Part::Page { notes, .. } => v.body.push_str(&page_words(notes, "\n")),
            Part::Unknown(_) => {}
        }
    }
    if !files.is_empty() {
        if !v.body.is_empty() {
            v.body.push_str("\n\n");
        }
        v.body.push_str(parts::FILES_HEADER);
        for f in files {
            v.body.push('\n');
            v.body.push_str(f);
        }
    }
    v
}

/// His message on one line (a notice's words: a message he routed to
/// another agent): his words with each chip's glyph and label in place
/// (`❝ main`, `▤ 1`, `▣ shot.png`), never a tag.
pub(crate) fn gist(parts: &[Part]) -> String {
    let mut quotes: Vec<String> = Vec::new();
    let mut words = String::new();
    for p in parts {
        match p {
            Part::Quote { n: Some(n), .. } => words.push_str(&format!("❝ {n}")),
            Part::Quote { from, .. } => quotes.push(format!("❝ {from}")),
            Part::Text { text } => words.push_str(text),
            Part::Paste { n, .. } => words.push_str(&format!("▤ {n}")),
            Part::Image { name, source, .. } => {
                let shown = std::path::Path::new(source).file_name().and_then(|f| f.to_str()).filter(|_| !name.starts_with('[')).unwrap_or(name);
                words.push_str(&format!("▣ {shown}"));
            }
            Part::File { path, name, .. } if !name.is_empty() => words.push_str(&format!("▯ {}", parts::file_name(path))),
            Part::File { path, .. } => words.push_str(&format!(" {path}")),
            Part::Page { notes, .. } => words.push_str(&page_words(notes, " · ")),
            // the hub's line for the model, never his words (m_22706)
            Part::Hint { .. } | Part::Unknown(_) => {}
        }
    }
    quotes.push(words.split_whitespace().collect::<Vec<_>>().join(" "));
    quotes.retain(|s| !s.is_empty());
    quotes.join(" ")
}

/// His notes on a page in bise-proto's words, joined by `sep`.
fn page_words(notes: &[parts::PageNote], sep: &str) -> String {
    notes.iter().map(|n| bise_proto::thread::words::page_note_words(n, true)).filter(|w| !w.is_empty()).collect::<Vec<_>>().join(sep)
}

/// The view of his message.
pub(crate) fn view(s: &Said) -> View {
    view_of(&s.text, &s.parts)
}

#[cfg(test)]
#[path = "said_tests.rs"]
mod tests;
