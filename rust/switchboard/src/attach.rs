//! An agent's `--attach` as its message's parts (send-parts, architect
//! m_23962): `sb send <agent> --attach <path|m_<n>>... "text"` and the
//! same on `sb spawn` (the brief). Pure: the shell (`daemon/attach.rs`)
//! does the file system and hands the answers in.
//!
//! - [`want`]: what one `--attach` asks for: a path (the CLI made it
//!   absolute and opened it, in the sender's sandbox) or `m_<n>`;
//! - [`kind`]: what a path becomes: an image of the store (a `.b64`
//!   there), an image file (stored by the hub, which sniffs it), or a file
//!   passed by its path (never read by the hub);
//! - [`forwarded`]: the door of `m_<n>`: only a message the sender got or
//!   sent, and only its images and files (never its text without them);
//! - [`tmp_copy`]: a file under the sender's `$TMPDIR` goes to the
//!   receiver's (the sender's dies at its drop);
//! - [`parts`]: the text first, then each attachment numbered
//!   (`[Image #1]`, `[File #2]`), so `parts::render` puts the markers after
//!   the words; `parts_in::said` then checks and renders them, as for his.
//!
//! The model gets the image markers in the message's text: the runtime
//! (bend/core/image.bend) sends each as an image part, whatever the
//! provider; a file as its path, read with the agent's own tools.

use bise_proto::parts::{self, ChipKind, Part};
use std::path::{Path, PathBuf};

/// The most attachments one message carries (checked at the door).
pub const MAX: usize = 10;

/// One `--attach`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Want {
    /// the images and files of message n
    Msg(u64),
    /// an absolute path
    Path(String),
}

/// What one `--attach` asks for; a relative path is refused (the CLI
/// makes every path absolute, so it is not from `sb`).
pub fn want(s: &str) -> Result<Want, String> {
    if let Some(n) = crate::core::parse_msg_id(s) {
        return Ok(Want::Msg(n));
    }
    match Path::new(s).is_absolute() {
        true => Ok(Want::Path(s.to_string())),
        false => Err(format!("--attach needs an absolute path: {s}")),
    }
}

/// What a path becomes.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Kind {
    /// a `.b64` of the image store (what an image marker names): the
    /// shell finds its image beside it
    StoreB64,
    /// an image file: the hub stores it (and refuses a non-image)
    Image,
    /// any other file: by its path
    File,
}

/// What `path` becomes (`store`: the image store's folder).
pub fn kind(path: &str, store: &Path) -> Kind {
    let p = Path::new(path);
    if p.extension().is_some_and(|e| e == "b64") && p.parent() == Some(store) {
        return Kind::StoreB64;
    }
    match parts::chip_kind(path) {
        ChipKind::Image => Kind::Image,
        ChipKind::File => Kind::File,
    }
}

/// One attachment, found: an image in the store, or a file by its path.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Item {
    Image { source: String, mime: String, b64: String },
    File { path: String },
}

/// The message `m_<n>` names, as the door reads it.
pub struct Said<'a> {
    pub from: &'a str,
    pub to: &'a str,
    pub text: &'a str,
    /// its parts JSON ("" none: read back from its text)
    pub parts: &'a str,
}

/// The images and files of message `n` for `sender`: only one it got or
/// sent (a resolved name: `sender`), else refused; none at hand (unknown
/// or no longer kept): refused with words, never its text alone.
pub fn forwarded(sender: &str, n: u64, m: Option<Said<'_>>) -> Result<Vec<Item>, String> {
    let m = m.ok_or_else(|| format!("m_{n} is too old to forward: attach the file by its path"))?;
    if m.to != sender && m.from != sender {
        return Err(format!("m_{n} is not a message you got or sent"));
    }
    let list = match m.parts.is_empty() {
        true => parts::of_text(m.text),
        false => serde_json::from_str::<Vec<Part>>(m.parts).map_err(|e| format!("m_{n}: its parts don't read ({e})"))?,
    };
    let items: Vec<Item> = list
        .into_iter()
        .filter_map(|p| match p {
            Part::Image { source, mime, b64_file, .. } => Some(Item::Image { source, mime, b64: b64_file }),
            Part::File { path, .. } => Some(Item::File { path }),
            _ => None,
        })
        .collect();
    match items.is_empty() {
        true => Err(format!("m_{n} has no image or file to forward")),
        false => Ok(items),
    }
}

/// Where a file under the sender's tmp goes in the receiver's: its
/// `attached/` folder, the same name (a file elsewhere: None, by path).
pub fn tmp_copy(path: &str, sender_tmp: &Path, receiver_tmp: &Path) -> Option<PathBuf> {
    let p = Path::new(path);
    let inside = p.starts_with(sender_tmp) && p.components().all(|c| !matches!(c, std::path::Component::ParentDir));
    inside.then(|| receiver_tmp.join("attached").join(parts::file_name(path)))
}

/// The message's parts: `text`, then each item numbered from 1. The text
/// ends with one blank line before the markers.
pub fn parts(text: &str, items: &[Item]) -> Vec<Part> {
    let mut out = vec![Part::Text { text: format!("{}\n\n", text.trim_end()) }];
    for (i, it) in items.iter().enumerate() {
        let n = i + 1;
        out.push(match it {
            Item::Image { source, mime, b64 } => Part::Image {
                name: format!("[Image #{n}]"),
                source: source.clone(),
                mime: mime.clone(),
                b64_file: b64.clone(),
                caption: String::new(),
            },
            Item::File { path } => Part::File { path: path.clone(), name: parts::file_label(n), missing: false },
        });
    }
    out
}

/// The cap, with words.
pub fn capped(n: usize) -> Result<(), String> {
    match n > MAX {
        true => Err(format!("--attach: {n} attachments, {MAX} at most per message")),
        false => Ok(()),
    }
}

#[cfg(test)]
#[path = "attach_tests.rs"]
mod tests;
