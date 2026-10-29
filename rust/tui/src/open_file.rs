//! Open a file from the TUI (file-chips section 6, main m_21751, architect
//! m_21764): a chip in the history (an image or a file he attached) and
//! /artifacts' `space` and `r` use these two acts, no second copy.
//!
//! - [`preview`]: Quick Look over the terminal (`qlmanage -p`, macOS; the
//!   one Quick Look up at a time is closed when another opens), else the
//!   file's default app (`links::open` on its `file://` url).
//! - [`reveal`]: the file in Finder (`open -R`), else its folder
//!   (`xdg-open`).
//! - a chip's link is [`chip_url`] (`bise-file:<abs path>`): a plain click
//!   previews it, ⌥ click reveals it ([`on_chip`]); a file gone says so
//!   (designer m_21765: `deck.pptx is gone from ~/Desktop`), nothing opens.
//!
//! `BISE_OPEN_RECORD` (a test setting): each act is a line appended to
//! that file (`preview <path>`, `reveal <path>`), nothing spawned (the tmux
//! test reads it). Unit tests record in `links::OPENED` (`look:<path>`,
//! `reveal:<path>`).

use std::cell::RefCell;
use std::path::Path;

/// How a chip's link starts: `bise-file:/Users/ana/deck.pptx`.
pub(crate) const CHIP_URL: &str = "bise-file:";

/// The link of a chip for `path`.
pub(crate) fn chip_url(path: &str) -> String {
    format!("{CHIP_URL}{path}")
}

/// The path of a chip's link (None: another link).
pub(crate) fn path_of_url(url: &str) -> Option<&str> {
    url.strip_prefix(CHIP_URL).filter(|p| p.starts_with('/'))
}

/// What a click on a chip's link does: ⌥ held, the file in Finder, else
/// its preview. The words for the flash ("" none).
pub(crate) fn on_chip(path: &str, alt: bool) -> String {
    if !Path::new(path).exists() {
        return gone_words(path);
    }
    if alt {
        return match reveal(path) {
            true => String::new(),
            false => format!("could not show {}", tilde(path)),
        };
    }
    match preview(path) {
        true => String::new(),
        false => format!("could not open {}", tilde(path)),
    }
}

/// A path as he reads it (`~/Desktop`).
pub(crate) fn tilde(p: &str) -> String {
    match std::env::var("HOME") {
        Ok(h) if !h.is_empty() && p.starts_with(&h) => format!("~{}", &p[h.len()..]),
        _ => p.to_string(),
    }
}

/// `deck.pptx is gone from ~/Desktop`.
pub(crate) fn gone_words(path: &str) -> String {
    let p = Path::new(path);
    let name = p.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_else(|| path.to_string());
    let dir = p.parent().map(|d| tilde(&d.to_string_lossy())).unwrap_or_default();
    format!("{name} is gone from {dir}")
}

thread_local! {
    /// the Quick Look up (one at a time)
    static LOOK: RefCell<Option<std::process::Child>> = const { RefCell::new(None) };
}

/// Close the Quick Look a preview opened, when one is up.
pub(crate) fn close_preview() {
    if let Some(mut c) = LOOK.with(|l| l.borrow_mut().take()) {
        let _ = c.kill();
        let _ = c.wait();
    }
}

/// `preview <path>` recorded instead of acted (`BISE_OPEN_RECORD`).
fn recorded(act: &str, path: &str) -> bool {
    #[cfg(test)]
    {
        let tag = if act == "preview" { "look" } else { act };
        crate::links::OPENED.with(|o| o.borrow_mut().push(format!("{tag}:{path}")));
        true
    }
    #[cfg(not(test))]
    {
        let Some(file) = bise_home::env::test_setting("BISE_OPEN_RECORD") else { return false };
        use std::io::Write;
        let _ = std::fs::OpenOptions::new().create(true).append(true).open(file).and_then(|mut f| writeln!(f, "{act} {path}"));
        true
    }
}

/// Quick Look on `path` (macOS), else its default app. False: nothing
/// could open it.
pub(crate) fn preview(path: &str) -> bool {
    if recorded("preview", path) {
        return true;
    }
    if !cfg!(target_os = "macos") {
        let url = crate::file_links::url_of(&crate::file_links::Target { path: path.into(), line: None, col: None });
        return crate::links::open(&url);
    }
    close_preview();
    let child = std::process::Command::new("qlmanage")
        .args(["-p", path])
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn()
        .ok();
    let ok = child.is_some();
    LOOK.with(|l| *l.borrow_mut() = child);
    ok
}

/// `path` in Finder (macOS), else its folder in the default app.
pub(crate) fn reveal(path: &str) -> bool {
    if recorded("reveal", path) {
        return true;
    }
    if cfg!(target_os = "macos") {
        std::process::Command::new("open").args(["-R", path]).spawn().is_ok()
    } else {
        let dir = Path::new(path).parent().map(|p| p.to_string_lossy().into_owned()).unwrap_or_default();
        std::process::Command::new("xdg-open").arg(dir).spawn().is_ok()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_chips_link_holds_its_path() {
        assert_eq!(chip_url("/u/deck.pptx"), "bise-file:/u/deck.pptx");
        assert_eq!(path_of_url("bise-file:/u/deck.pptx"), Some("/u/deck.pptx"));
        assert_eq!(path_of_url("bise-file:rel.pptx"), None);
        assert_eq!(path_of_url("https://x"), None);
    }

    /// A click previews, ⌥ click reveals, a gone file opens nothing and
    /// says where it was.
    #[test]
    fn a_click_previews_alt_reveals_and_a_gone_file_says_so() {
        let dir = std::env::temp_dir().join(format!("open-file-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let f = dir.join("deck.pptx");
        std::fs::write(&f, "x").unwrap();
        let p = f.to_string_lossy().to_string();
        crate::links::OPENED.with(|o| o.borrow_mut().clear());
        assert_eq!(on_chip(&p, false), "");
        assert_eq!(on_chip(&p, true), "");
        let gone = dir.join("gone.csv").to_string_lossy().to_string();
        let words = on_chip(&gone, false);
        assert!(words.starts_with("gone.csv is gone from "), "{words}");
        assert_eq!(crate::links::OPENED.with(|o| o.borrow().clone()), vec![format!("look:{p}"), format!("reveal:{p}")]);
        let _ = std::fs::remove_dir_all(&dir);
    }
}
