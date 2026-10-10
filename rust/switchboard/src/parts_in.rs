//! His message's parts as a client sends them (msg-parts, architect
//! m_17621 / m_17630): checked before anything is delivered, then the
//! model's text rendered from them (`bise_proto::parts::render`) and the
//! parts kept as JSON on his message (sb-core's opaque `Msg.parts`).
//! Pure: the image store's folder comes in as an argument.
//!
//! Refused, nothing delivered:
//! - a part this hub doesn't know (a newer client): it renders to
//!   nothing, so his words would silently leave the model's text;
//! - an image whose `b64_file` is not a `.b64` file inside the image
//!   store: a part never makes the model read another file;
//! - parts together with `files` (one list or the other).

use bise_proto::parts::{self, Part};
use std::path::{Component, Path};

/// The send a client's parts make: the model's text and the parts' JSON.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Said {
    pub text: String,
    pub parts: String,
}

/// `parts` checked and rendered; `store`: the image store's folder.
/// Err: the words of the refusal (the client's error).
pub fn said(parts: &[Part], files: &[String], store: &Path) -> Result<Said, String> {
    if !files.is_empty() {
        return Err("a message's files go as its parts, not beside them".into());
    }
    for p in parts {
        match p {
            Part::Unknown(v) => {
                let kind = v.get("kind").and_then(|k| k.as_str()).unwrap_or("?");
                return Err(format!("this bise doesn't know part {kind}: update bise"));
            }
            Part::Image { b64_file, .. } if !b64_file.is_empty() && !in_store(b64_file, store) => {
                return Err(format!("an image part must come from bise's image store: {b64_file}"));
            }
            _ => {}
        }
    }
    let text = parts::render(parts);
    let json = serde_json::to_string(parts).map_err(|e| format!("parts: {e}"))?;
    Ok(Said { text, parts: json })
}

/// `file` is a `.b64` file directly inside `store` (no `..`, no link out
/// by name).
fn in_store(file: &str, store: &Path) -> bool {
    let p = Path::new(file);
    p.is_absolute()
        && p.extension().is_some_and(|e| e == "b64")
        && p.components().all(|c| !matches!(c, Component::ParentDir))
        && p.parent() == Some(store)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn t(s: &str) -> Part {
        Part::Text { text: s.into() }
    }

    fn img(b64: &str) -> Part {
        Part::Image { name: "[Image #1]".into(), source: "/d/s.png".into(), mime: "image/png".into(), b64_file: b64.into() }
    }

    #[test]
    fn parts_render_the_models_text_and_keep_their_json() {
        let ps = [Part::Quote { from: "main".into(), text: "q".into(), file: String::new(), new: String::new(), old: String::new() }, t("why?")];
        let s = said(&ps, &[], Path::new("/h/images")).unwrap();
        assert_eq!(s.text, "<selection from=\"main\">\nq\n</selection>\nwhy?");
        let back: Vec<Part> = serde_json::from_str(&s.parts).unwrap();
        assert_eq!(back, ps);
        assert!(!s.parts.contains('\n'), "one feed line");
    }

    /// architect m_17630: an unknown part would drop words: refused.
    #[test]
    fn an_unknown_part_is_refused() {
        let ps = [t("a"), Part::Unknown(serde_json::json!({"kind": "voice", "secs": 3}))];
        assert_eq!(said(&ps, &[], Path::new("/h/images")), Err("this bise doesn't know part voice: update bise".into()));
    }

    /// architect m_17621 Q2: b64_file only inside the image store.
    #[test]
    fn an_image_outside_the_store_is_refused() {
        let store = Path::new("/h/images");
        assert!(said(&[img("/h/images/ab12.b64")], &[], store).is_ok());
        assert!(said(&[img("")], &[], store).is_ok(), "no file: a chip only");
        for bad in ["/etc/passwd", "/h/images/../secrets/k.b64", "/h/images/sub/a.b64", "rel/a.b64", "/h/images/a.png", "/h/imagesx/a.b64"] {
            assert!(said(&[img(bad)], &[], store).is_err(), "{bad}");
        }
    }

    #[test]
    fn parts_and_files_together_are_refused() {
        assert!(said(&[t("a")], &["/w/a.md".into()], Path::new("/h/images")).is_err());
    }
}
