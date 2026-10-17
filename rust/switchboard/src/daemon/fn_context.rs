//! The hub's side of the fn context (S9, architect m_9048): an input op's
//! `context` (what was on his screen at fn) framed after his words by the
//! one render (`crate::fn_context`), and his 'you' line written as his
//! words plus an `sb context : <json>` line in one append (feed).

use super::*;

/// What an attached path is, for `crate::parts_in::of_files`: an image put
/// in the image store, another file, or left out (logged).
fn look_file(path: &str) -> crate::parts_in::Look {
    use crate::parts_in::Look;
    let p = std::path::Path::new(path);
    if !p.is_absolute() || !p.is_file() {
        eprintln!("sbd: attached file left out (not an absolute path to a file): {path}");
        return Look::Skip;
    }
    match store_image(p) {
        Ok(stored) => Look::Image(stored),
        Err(_) => Look::File,
    }
}

/// Whether a file part's path is a file now (`crate::parts_in::said`).
pub(super) fn file_exists(p: &std::path::Path) -> bool {
    p.is_file()
}

/// His words and a `files` list (an older desktop's `Send.files` /
/// `Answer.files`) as his parts (`crate::parts_in::of_files` with the
/// image store): the model's text and the parts' JSON kept on his
/// message, the one render's (`bise_proto::parts::render`).
pub(super) fn files_said(text: &str, files: &[String]) -> crate::parts_in::Said {
    let parts = crate::parts_in::of_files(text, files, &mut look_file);
    crate::parts_in::Said { text: bise_proto::parts::render(&parts), parts: serde_json::to_string(&parts).unwrap_or_default() }
}

/// An image part sent with its source only, put in the image store by the
/// same storer as an attached path (`bend_images::store_file`: one FNV
/// name, one downscale), for `crate::parts_in::said`.
pub(super) fn store_image(p: &std::path::Path) -> Result<crate::parts_in::Stored, String> {
    let stored = bend_images::store_file(p)?;
    Ok(crate::parts_in::Stored { b64: stored.b64.to_string_lossy().into_owned(), mime: stored.kind.mime().into() })
}

/// A routed image whose source is gone, put in this hub's store from the
/// sender's `.b64` (its base64 text decoded, then `store_bytes`: the same
/// FNV name and downscale), for `crate::parts_in::restored` (R41 (6)).
pub(super) fn store_b64(p: &std::path::Path) -> Result<crate::parts_in::Stored, String> {
    let text = std::fs::read_to_string(p).map_err(|e| format!("{}: {e}", p.display()))?;
    let bytes = bend_images::base64_decode(text.trim()).ok_or_else(|| format!("{}: not base64", p.display()))?;
    let stored = bend_images::store_bytes(bytes)?;
    Ok(crate::parts_in::Stored { b64: stored.b64.to_string_lossy().into_owned(), mime: stored.kind.mime().into() })
}


impl Shell {
    /// His input stepped into sb-core, with its fn context when the op
    /// has one (never on a slash command): the block after his words for
    /// the model, the context kept for the 'you' line this step writes.
    /// `text` already has his attached files ([`with_files`]).
    pub(super) fn step_input(&mut self, client: ClientId, v: &Value, focus: String, text: String, queued: bool) {
        // computer use: a stopped or paused agent goes on first
        self.resume_computer_use(&focus, &text);
        let slash = text.trim_start().starts_with('/');
        let ctx = crate::fn_context::of(v.get("context")).filter(|_| !slash);
        let text = match &ctx {
            Some(c) => crate::fn_context::with_context(&text, c),
            None => text,
        };
        self.fn_ctx = ctx
            .filter(|c| !queued && *c != bise_proto::context::FnContext::default())
            .and_then(|c| serde_json::to_string(&c).ok())
            .map(|j| (self.hub.st.resolve(&focus).unwrap_or_else(|| MAIN.to_string()), j));
        // msg-parts: his parts' JSON as the op carries it (proto_input),
        // never on a slash command
        let parts = v.get("parts").and_then(Value::as_str).filter(|_| !slash).unwrap_or_default().to_string();
        // hub-tick: he talks to main: its own recycle waits (crate::recycle)
        if self.hub.st.resolve(&focus).unwrap_or_else(|| MAIN.to_string()) == MAIN {
            self.recycle.his_line_to_main(now_ms());
        }
        self.step(Input::ClientInput { client, focus, text, queued, parts });
        self.fn_ctx = None;
    }

    /// The lines a feed line becomes: the 'you' line of the input being
    /// stepped with a fn context as two records, his words (the rendered
    /// block cut off, the model got it) and his `context` (the window's
    /// thread reads it, the TUI skips it); any other line, itself.
    pub(super) fn fn_ctx_lines(&mut self, name: &str, line: &str) -> Vec<String> {
        use bise_proto::core::{feed, Feed};
        use bise_proto::thread::lines::{read, Hub, Rec};
        let Some((_, json)) = self.fn_ctx.as_ref().filter(|(a, _)| a == name) else { return vec![line.to_string()] };
        let Rec::Hub(Hub::You(said, via)) = read(line) else { return vec![line.to_string()] };
        // no block: a context with a shot only (the core's marker is in
        // his words), or a line sb-core cut before it
        let words = crate::fn_context::strip_block(&said).unwrap_or(&said).to_string();
        let context = serde_json::from_str(json).unwrap_or_default();
        let lines = vec![Feed::You(feed::You { text: words, via }).line(), Feed::Context(feed::Context { context }).line()];
        self.fn_ctx = None;
        lines
    }
}
