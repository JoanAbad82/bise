//! An image of an old message that the image store deleted (D14,
//! docs/images.md "Retention", designer m_31912): its chip says so,
//! `▣ login.png · deleted · images are kept 7 days`, never a link to a
//! file that is not there. The check is the store file's existence, where
//! the chip resolves its path (attach.rs `image_spans`). The words state
//! today's rule, never the one it went by (no record per image, architect
//! m_31909): his setting now (`bise_home::prefs::keep_days`).

use bise_proto::words::{settings, thread};
use ratatui::style::Style;
use ratatui::text::Span;

/// The store's file of a marker is gone (an empty path is no file: an
/// older line, nothing to say).
pub(crate) fn gone(file: &str) -> bool {
    !file.is_empty() && !std::path::Path::new(file).exists()
}

/// ` · deleted · images are kept 7 days`. Pure.
pub(crate) fn words(days: u64) -> String {
    format!(" · {}", thread::image_deleted(settings::days(days)))
}

/// His setting, read from `prefs.json` (unset: what settings shows).
fn keep_days() -> u64 {
    let home = bise_home::Home::from_env();
    let prefs = std::fs::read_to_string(home.prefs_file()).ok().and_then(|t| serde_json::from_str::<serde_json::Value>(&t).ok());
    bise_home::prefs::keep_days(prefs.as_ref())
}

/// An image chip: `label` in `linked` (the chip's style with its link),
/// or, its store file gone, in `plain` (no link: nothing to preview) and
/// the words, dim.
pub(crate) fn chip(label: String, file: &str, linked: Style, plain: Style) -> Vec<Span<'static>> {
    if !gone(file) {
        return vec![Span::styled(label, linked)];
    }
    vec![Span::styled(label, plain), Span::styled(words(keep_days()), Style::default().fg(crate::theme::dim()))]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_deleted_image_says_after_how_long() {
        assert_eq!(words(7), " · deleted · images are kept 7 days");
        assert_eq!(words(1), " · deleted · images are kept 1 day");
        assert!(!gone(""), "no file named: nothing to say");
        assert!(gone("/nowhere/0123456789abcdef0123456789abcdef.png"));
        let here = std::env::temp_dir().join(format!("tui-image-gone-{}.png", std::process::id()));
        std::fs::write(&here, "x").expect("write");
        assert!(!gone(&here.to_string_lossy()));
        let _ = std::fs::remove_file(&here);
        let st = Style::default();
        assert_eq!(chip("▣ a.png".into(), &here.to_string_lossy(), st, st).len(), 2, "deleted: the label and the words");
    }
}
