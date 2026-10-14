//! Queued messages (BISE-89, book §13, after Codex's pending input
//! preview): drawing only. The hub owns them (issue 23): `tab` during a
//! turn sends the composer's text as `mode: queued` (input.rs), sb-core
//! holds it and says everything queued at the turn's end, in order, in
//! one batch (law user_queued_said_at_idle); `↑` in an empty composer
//! takes the newest back with `turn/unqueue` (sb/queued.rs). This module
//! draws the agent in view's queue above the composer from its hub row
//! (`rows::Agent.queued`, the window's source too), so every client shows
//! the same queue. It sends nothing and decides nothing.

use crate::app::App;
use crate::theme::{dim, faint, glyph, G_YOU};
use ratatui::style::Style;
use ratatui::text::{Line, Span};

/// The faint line under the queued messages (book §17).
pub(crate) const HINT: &str = "queued · sent when this turn ends · ↑ edit";
/// At most this many queued lines show; the older ones are counted.
const SHOWN: usize = 5;

/// His queued messages for the agent in view, oldest first (their text).
fn texts(app: &App) -> Vec<String> {
    app.sb.queued_for(&app.sb.focus).into_iter().map(|q| q.text.clone()).collect()
}

/// Rows the queue takes above the composer (0 when empty).
pub(crate) fn height(app: &App) -> u16 {
    match texts(app).len() {
        0 => 0,
        n => (n.min(SHOWN) + usize::from(n > SHOWN) + 1) as u16,
    }
}

/// The queue at `width` columns: ` › text…` dim per message (one line,
/// cut), the newest last, then the faint hint.
pub(crate) fn lines(app: &App, width: usize) -> Vec<Line<'static>> {
    lines_of(&texts(app), width)
}

fn lines_of(queued: &[String], width: usize) -> Vec<Line<'static>> {
    use unicode_width::UnicodeWidthStr;
    let n = queued.len();
    if n == 0 {
        return Vec::new();
    }
    let d = Style::default().fg(dim());
    let mut out = Vec::new();
    if n > SHOWN {
        out.push(Line::from(Span::styled(format!("   + {} more", n - SHOWN), d)));
    }
    let lead = format!(" {} ", glyph(G_YOU));
    let room = width.saturating_sub(lead.width()).max(1);
    for q in &queued[n.saturating_sub(SHOWN)..] {
        let flat = bend_images::display(q).split_whitespace().collect::<Vec<_>>().join(" ");
        out.push(Line::from(vec![Span::styled(lead.clone(), d), Span::styled(cut(&flat, room), d)]));
    }
    out.push(Line::from(Span::styled(format!("   {}", HINT), Style::default().fg(faint()))));
    out
}

/// `s` in `room` columns, `…` when cut.
fn cut(s: &str, room: usize) -> String {
    use unicode_width::UnicodeWidthChar;
    let mut w = 0;
    let mut out = String::new();
    let total: usize = s.chars().map(|c| c.width().unwrap_or(0)).sum();
    if total <= room {
        return s.to_string();
    }
    for c in s.chars() {
        let cw = c.width().unwrap_or(0);
        if w + cw + 1 > room {
            break;
        }
        w += cw;
        out.push(c);
    }
    out.push('…');
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn text_of(ls: &[Line]) -> Vec<String> {
        ls.iter().map(|l| l.spans.iter().map(|s| s.content.as_ref()).collect()).collect()
    }

    #[test]
    fn the_queue_shows_above_the_composer() {
        let mut app = crate::sb::bench::test_app();
        assert_eq!(height(&app), 0);
        assert!(lines(&app, 40).is_empty());
        crate::sb::bench::queued_rows(&mut app, "main", &["also check logout", "a much longer message that will not fit in forty columns at all"]);
        let ls = text_of(&lines(&app, 40));
        assert_eq!(height(&app), 3);
        assert_eq!(ls[0], format!(" {} also check logout", G_YOU));
        assert!(ls[1].ends_with('…') && unicode_width::UnicodeWidthStr::width(ls[1].as_str()) <= 40, "{ls:#?}");
        assert_eq!(ls[2], format!("   {}", HINT));
        // many: the newest five, the older ones counted
        let many: Vec<String> = ["also check logout", "two", "three"].iter().map(|s| s.to_string()).chain((0..6).map(|i| format!("m{i}"))).collect();
        let many: Vec<&str> = many.iter().map(String::as_str).collect();
        crate::sb::bench::queued_rows(&mut app, "main", &many);
        let ls = text_of(&lines(&app, 40));
        assert_eq!(ls[0], "   + 4 more");
        assert_eq!(ls[5], format!(" {} m5", G_YOU));
        assert_eq!(height(&app) as usize, ls.len());
    }

    /// issue 23: the queue is the hub's row of the agent in view, minus
    /// what ↑ is taking back; another agent's row draws nothing here.
    #[test]
    fn the_queue_is_the_hub_row_of_the_agent_in_view() {
        let mut app = crate::sb::bench::test_app();
        crate::sb::bench::queued_rows(&mut app, "docs", &["for docs"]);
        assert!(lines(&app, 40).is_empty(), "docs isn't in view");
        crate::sb::bench::queued_rows(&mut app, "main", &["one", "two"]);
        assert_eq!(height(&app), 3);
        let newest = app.sb.queued_for("main").last().unwrap().id;
        app.sb.taking.insert(newest);
        let ls = text_of(&lines(&app, 40));
        assert_eq!(ls, [format!(" {} one", G_YOU), format!("   {}", HINT)]);
    }

    #[test]
    fn an_image_shows_its_label() {
        let ls = text_of(&lines_of(&["look <image name=\"[Image #1]\" path=\"/a.png\" mime=\"image/png\" b64=\"/x.b64\">".into()], 60));
        assert!(!ls[0].contains("b64"), "{ls:?}");
    }
}
