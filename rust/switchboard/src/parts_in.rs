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
//! - parts together with `files` (one list or the other);
//! - an image part sent with its source only (no `b64_file`) whose source
//!   isn't absolute, or that the store can't take (not an image, too big,
//!   unreadable). Taken, the hub fills its `b64_file` and mime.

use bise_proto::parts::{self, Part};
use std::path::{Component, Path};

/// The send a client's parts make: the model's text and the parts' JSON.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Said {
    pub text: String,
    pub parts: String,
}

/// An image the hub put in its store for a part sent with its source only.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Stored {
    /// its `.b64` file in the store
    pub b64: String,
    pub mime: String,
}

/// `parts` checked, completed and rendered; `store`: the image store's
/// folder; `put`: how an image part sent with its source only (no
/// `b64_file`: the window's pasted or dropped file) gets into that store
/// (the hub: `bend_images::store_file`, Send.files' storer). Its `.b64`
/// and mime fill the part once, then the kept parts and the rendered text
/// are both made from that one list (they name the same file). Err: the
/// words of the refusal (the client's error), nothing delivered.
pub fn said(parts: &[Part], files: &[String], store: &Path, put: &dyn Fn(&Path) -> Result<Stored, String>) -> Result<Said, String> {
    if !files.is_empty() {
        return Err("a message's files go as its parts, not beside them".into());
    }
    let mut parts = parts.to_vec();
    for p in &mut parts {
        match p {
            Part::Unknown(v) => {
                let kind = v.get("kind").and_then(|k| k.as_str()).unwrap_or("?");
                return Err(format!("this bise doesn't know part {kind}: update bise"));
            }
            Part::Image { b64_file, .. } if !b64_file.is_empty() && !in_store(b64_file, store) => {
                return Err(format!("an image part must come from bise's image store: {b64_file}"));
            }
            Part::Image { source, mime, b64_file, .. } if b64_file.is_empty() => {
                if !Path::new(source.as_str()).is_absolute() {
                    return Err(format!("an image part needs an absolute source: {source}"));
                }
                let s = put(Path::new(source.as_str())).map_err(|e| format!("image {source}: {e}"))?;
                (*b64_file, *mime) = (s.b64, s.mime);
            }
            _ => {}
        }
    }
    let text = parts::render(&parts);
    let json = serde_json::to_string(&parts).map_err(|e| format!("parts: {e}"))?;
    Ok(Said { text, parts: json })
}

/// A routed message as the project hub delivers it (R41 (6)): the text its
/// model reads and his parts' JSON ("" none). `note`: one log line when
/// something could not be done (the words still go).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Restored {
    pub text: String,
    pub parts: String,
    pub note: Option<String>,
}

/// His routed message on the project hub (architect m_18164): `parts` the
/// JSON bise's home hub forwarded ("" none: an older home hub, or the
/// terminal's text-only send, read back from `text` like the fold does).
/// Each image is completed in THIS hub's store: a `b64_file` already in
/// it is kept, nothing written (the normal case: one bise home, one
/// store); else stored from its source by `put_file` (the one storer), or
/// from the sender's `.b64` by `put_b64`; neither: left as is and noted
/// (the runtime says unavailable, the forward never refuses). The text is
/// the completed parts' render, so it and the parts name the same file;
/// with a kind this hub doesn't know, the sender's text is kept unchanged
/// (render drops unknown kinds, it would lose his words), noted. No image
/// to complete in a text-only message: everything unchanged.
pub fn restored(text: &str, parts: &str, store: &Path, put_file: &dyn Fn(&Path) -> Result<Stored, String>, put_b64: &dyn Fn(&Path) -> Result<Stored, String>) -> Restored {
    let same = |note: Option<String>| Restored { text: text.to_string(), parts: parts.to_string(), note };
    let (mut list, sent) = match parts.is_empty() {
        true => (parts::of_text(text), false),
        false => match serde_json::from_str::<Vec<Part>>(parts) {
            Ok(l) => (l, true),
            Err(e) => return same(Some(format!("routed parts not read ({e}): his text as sent"))),
        },
    };
    if list.iter().any(|p| matches!(p, Part::Unknown(_))) {
        return same(Some("a routed part of a kind this bise doesn't know: his text as sent".into()));
    }
    let mut changed = false;
    let mut notes = Vec::new();
    for p in &mut list {
        let Part::Image { name, source, mime, b64_file } = p else { continue };
        if !b64_file.is_empty() && Path::new(b64_file.as_str()).is_file() && in_store(b64_file, store) {
            continue;
        }
        let src = Path::new(source.as_str());
        let got = match (src.is_absolute() && src.is_file(), !b64_file.is_empty() && Path::new(b64_file.as_str()).is_file()) {
            (true, _) => put_file(src),
            (false, true) => put_b64(Path::new(b64_file.as_str())),
            (false, false) => Err("neither its source nor its .b64 is there".into()),
        };
        match got {
            Ok(s) => {
                (*b64_file, *mime) = (s.b64, s.mime);
                changed = true;
            }
            Err(e) => notes.push(format!("routed image {name} not stored here: {e}")),
        }
    }
    let note = (!notes.is_empty()).then(|| notes.join("; "));
    if !sent && !changed {
        return same(note);
    }
    match serde_json::to_string(&list) {
        Ok(json) => Restored { text: parts::render(&list), parts: json, note },
        Err(e) => same(Some(format!("parts: {e}"))),
    }
}

/// `file` is a `.b64` file directly inside `store` (no `..`), and stays
/// there once its links are followed (architect m_17749: a `.b64` link in
/// the store pointing outside is refused). A file that doesn't exist yet
/// is judged by its name only (nothing to read).
fn in_store(file: &str, store: &Path) -> bool {
    let p = Path::new(file);
    let named = p.is_absolute()
        && p.extension().is_some_and(|e| e == "b64")
        && p.components().all(|c| !matches!(c, Component::ParentDir))
        && p.parent() == Some(store);
    if !named {
        return false;
    }
    match (p.canonicalize(), store.canonicalize()) {
        (Ok(real), Ok(dir)) => real.parent() == Some(dir.as_path()),
        // a link that leads nowhere: refused; no such file: by its name
        _ => std::fs::symlink_metadata(p).is_err(),
    }
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

    /// a store that takes nothing (the tests whose parts need none)
    fn none(_: &Path) -> Result<Stored, String> {
        Err("no store here".into())
    }

    /// a store that takes /d/s.png as a JPEG into /h/images/f00d.b64
    fn fake(p: &Path) -> Result<Stored, String> {
        match p.to_str() {
            Some("/d/s.png") => Ok(Stored { b64: "/h/images/f00d.b64".into(), mime: "image/jpeg".into() }),
            _ => Err("not a PNG, JPEG, GIF or WebP image".into()),
        }
    }

    /// Laws (architect m_17974): an image part sent with its source only is
    /// stored once and its b64_file + mime filled; the rendered text and
    /// the kept parts name that same file; a set b64_file is left as is (no
    /// store call); a store failure or a relative source refuses the whole
    /// message with the store's words.
    #[test]
    fn an_image_sent_by_its_source_is_stored_once_and_named_alike() {
        let store = Path::new("/h/images");
        let calls = std::cell::Cell::new(0);
        let counted = |p: &Path| {
            calls.set(calls.get() + 1);
            fake(p)
        };
        let s = said(&[t("look"), img("")], &[], store, &counted).unwrap();
        assert_eq!(calls.get(), 1, "one store call");
        let back: Vec<Part> = serde_json::from_str(&s.parts).unwrap();
        assert_eq!(back[1], Part::Image { name: "[Image #1]".into(), source: "/d/s.png".into(), mime: "image/jpeg".into(), b64_file: "/h/images/f00d.b64".into() });
        assert!(s.text.contains("b64=\"/h/images/f00d.b64\"") && s.text.contains("mime=\"image/jpeg\""), "{}", s.text);
        assert_eq!(s.text, parts::render(&back), "the text is the kept parts' render");
        // a stored one: untouched, no store call
        calls.set(0);
        assert!(said(&[img("/h/images/ab12.b64")], &[], store, &counted).is_ok());
        assert_eq!(calls.get(), 0);
        // refused, with the store's words
        let bad = Part::Image { name: "[Image #1]".into(), source: "/d/notes.txt".into(), mime: String::new(), b64_file: String::new() };
        assert_eq!(said(&[t("a"), bad], &[], store, &fake), Err("image /d/notes.txt: not a PNG, JPEG, GIF or WebP image".into()));
        let rel = Part::Image { name: "[Image #1]".into(), source: "shot.png".into(), mime: String::new(), b64_file: String::new() };
        assert_eq!(said(&[rel], &[], store, &fake), Err("an image part needs an absolute source: shot.png".into()));
    }

    #[test]
    fn parts_render_the_models_text_and_keep_their_json() {
        let ps = [Part::Quote { from: "main".into(), text: "q".into(), file: String::new(), new: String::new(), old: String::new() }, t("why?")];
        let s = said(&ps, &[], Path::new("/h/images"), &none).unwrap();
        assert_eq!(s.text, "<selection from=\"main\">\nq\n</selection>\nwhy?");
        let back: Vec<Part> = serde_json::from_str(&s.parts).unwrap();
        assert_eq!(back, ps);
        assert!(!s.parts.contains('\n'), "one feed line");
    }

    /// architect m_17630: an unknown part would drop words: refused.
    #[test]
    fn an_unknown_part_is_refused() {
        let ps = [t("a"), Part::Unknown(serde_json::json!({"kind": "voice", "secs": 3}))];
        assert_eq!(said(&ps, &[], Path::new("/h/images"), &none), Err("this bise doesn't know part voice: update bise".into()));
    }

    /// architect m_17621 Q2: b64_file only inside the image store.
    #[test]
    fn an_image_outside_the_store_is_refused() {
        let store = Path::new("/h/images");
        assert!(said(&[img("/h/images/ab12.b64")], &[], store, &none).is_ok());
        assert!(said(&[img("")], &[], store, &fake).is_ok(), "no b64 yet: stored by the hub");
        for bad in ["/etc/passwd", "/h/images/../secrets/k.b64", "/h/images/sub/a.b64", "rel/a.b64", "/h/images/a.png", "/h/imagesx/a.b64"] {
            assert!(said(&[img(bad)], &[], store, &fake).is_err(), "{bad}");
        }
    }

    /// architect m_17749: a `.b64` link inside the store that points
    /// outside is refused; a real file in the store passes.
    #[cfg(unix)]
    #[test]
    fn a_link_out_of_the_store_is_refused() {
        let root = std::env::temp_dir().join(format!("parts-in-{}", std::process::id()));
        let store = root.join("images");
        std::fs::create_dir_all(&store).unwrap();
        let secret = root.join("secret.txt");
        std::fs::write(&secret, "key").unwrap();
        let real = store.join("ok.b64");
        std::fs::write(&real, "aGk=").unwrap();
        let link = store.join("evil.b64");
        let _ = std::fs::remove_file(&link);
        std::os::unix::fs::symlink(&secret, &link).unwrap();
        let dangling = store.join("gone.b64");
        let _ = std::fs::remove_file(&dangling);
        std::os::unix::fs::symlink(root.join("nothing"), &dangling).unwrap();
        assert!(said(&[img(real.to_str().unwrap())], &[], &store, &none).is_ok());
        assert!(said(&[img(link.to_str().unwrap())], &[], &store, &none).is_err(), "a link out");
        assert!(said(&[img(dangling.to_str().unwrap())], &[], &store, &none).is_err(), "a dangling link");
        let _ = std::fs::remove_dir_all(&root);
    }

    /// Laws of `restored` (R41 (6), architect m_18164), on a real folder:
    /// an image already in this hub's store is kept and nothing written
    /// (the shared store, the normal case); one from another store is
    /// stored from its source, else from its .b64; neither: left as is
    /// with a note; the text is the completed parts' render; an unknown
    /// kind keeps the sender's text; a text with no image is unchanged.
    #[cfg(unix)]
    #[test]
    fn a_routed_image_is_completed_in_this_hubs_store() {
        let root = std::env::temp_dir().join(format!("parts-restored-{}", std::process::id()));
        let (store, other) = (root.join("images"), root.join("other"));
        std::fs::create_dir_all(&store).unwrap();
        std::fs::create_dir_all(&other).unwrap();
        let (shared, theirs, src) = (store.join("ab.b64"), other.join("cd.b64"), root.join("s.png"));
        for f in [&shared, &theirs, &src] {
            std::fs::write(f, "aGk=").unwrap();
        }
        let put = |dir: &'static str| {
            let store = store.clone();
            move |_: &Path| -> Result<Stored, String> { Ok(Stored { b64: store.join(format!("{dir}.b64")).to_string_lossy().into(), mime: "image/png".into() }) }
        };
        let (by_file, by_b64) = (put("from-file"), put("from-b64"));
        let image = |source: &Path, b64: &Path| Part::Image { name: "[Image #1]".into(), source: source.to_string_lossy().into(), mime: "image/png".into(), b64_file: b64.to_string_lossy().into() };
        let json = |ps: &[Part]| serde_json::to_string(ps).unwrap();
        // in this store: kept, no store call, text = render
        let ps = vec![t("look "), image(&src, &shared)];
        let r = restored("look", &json(&ps), &store, &none, &none);
        assert_eq!((r.text.as_str(), r.parts.as_str(), r.note), (parts::render(&ps).as_str(), json(&ps).as_str(), None));
        // another store: from its source
        let r = restored("x", &json(&[image(&src, &theirs)]), &store, &by_file, &none);
        let back: Vec<Part> = serde_json::from_str(&r.parts).unwrap();
        assert!(matches!(&back[0], Part::Image { b64_file, .. } if b64_file.ends_with("from-file.b64")), "{back:?}");
        assert_eq!(r.text, parts::render(&back), "the text names the stored file");
        // its source gone: from the sender's .b64
        let gone = root.join("gone.png");
        let r = restored("x", &json(&[image(&gone, &theirs)]), &store, &none, &by_b64);
        assert!(r.parts.contains("from-b64.b64") && r.note.is_none(), "{r:?}");
        // neither: as is, noted, never refused
        let r = restored("x", &json(&[image(&gone, &other.join("none.b64"))]), &store, &none, &none);
        assert!(r.note.is_some() && r.parts.contains("none.b64"), "{r:?}");
        // an unknown kind: the sender's text and parts unchanged, noted
        let odd = r#"[{"kind":"voice","ms":3},{"kind":"text","text":"hi"}]"#;
        let r = restored("hi [voice]", odd, &store, &none, &none);
        assert_eq!((r.text.as_str(), r.parts.as_str()), ("hi [voice]", odd));
        assert!(r.note.is_some());
        // no parts and no image in the text: unchanged
        let r = restored("plain words", "", &store, &none, &none);
        assert_eq!(r, Restored { text: "plain words".into(), parts: String::new(), note: None });
        // no parts, a marker of this store (an older home hub): unchanged
        let text = parts::render(&[t("see "), image(&src, &shared)]);
        let r = restored(&text, "", &store, &none, &none);
        assert_eq!((r.text.as_str(), r.parts.as_str()), (text.as_str(), ""));
        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn parts_and_files_together_are_refused() {
        assert!(said(&[t("a")], &["/w/a.md".into()], Path::new("/h/images"), &none).is_err());
    }
}
