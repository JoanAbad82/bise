//! The queue drawer (BISE-89, designer m_25146, the window's
//! QueueDrawer.tsx): drawing only. The hub owns his queued messages
//! (issue 23): `tab` during a turn sends the composer's text as `mode:
//! queued`, sb-core holds it and says everything queued at the turn's
//! end, in order, in one batch (law user_queued_said_at_idle). This
//! module draws the agent in view's queue above the composer from its
//! hub row (`rows::Agent.queued`, the window's source too) as a framed
//! box, `╭─ 2 queued · sent when perf's turn ends ─╮`, one `› text…` row
//! per message, oldest first, 3 shown then it scrolls; the focused row
//! (sb/queued.rs has its keys) is a selection: ink on the chip tint, no
//! accent anywhere. It sends nothing and decides nothing.

use crate::app::App;
use crate::theme::{chip_bg, dim, faint, glyph, rule, text, G_YOU};
use ratatui::style::Style;
use ratatui::text::{Line, Span};
use unicode_width::UnicodeWidthStr;

/// Rows shown before the drawer scrolls (designer: 3).
const SHOWN: usize = 3;

/// One queued message as the drawer shows it.
struct Row {
    text: String,
    /// ` · 1 image`, faint after the words; "" none
    extra: String,
}

/// What the drawer draws: the agent's name, its rows, the focused one,
/// a fresh delete.
struct View {
    who: String,
    rows: Vec<Row>,
    focus: Option<usize>,
    deleted: bool,
}

fn view(app: &App) -> View {
    let rows = app.sb.queued_for(&app.sb.focus).into_iter().map(|q| Row { text: q.text.clone(), extra: extra(&q.parts) }).collect();
    View { who: app.sb.focus.clone(), rows, focus: app.sb.queue_focus(), deleted: app.sb.undo_shown() }
}

/// ` · 1 image`, ` · 2 images` for the images in his parts.
fn extra(parts: &[bise_proto::parts::Part]) -> String {
    match parts.iter().filter(|p| matches!(p, bise_proto::parts::Part::Image { .. })).count() {
        0 => String::new(),
        1 => " · 1 image".into(),
        n => format!(" · {n} images"),
    }
}

/// Rows the drawer takes above the composer: its edges and its rows, 0
/// with nothing queued (a fresh delete keeps its head for the undo).
pub(crate) fn height(app: &App) -> u16 {
    height_of(&view(app))
}

fn height_of(v: &View) -> u16 {
    match v.rows.len() {
        0 if !v.deleted => 0,
        n => (n.min(SHOWN) + 2) as u16,
    }
}

/// The drawer at `width` columns.
pub(crate) fn lines(app: &App, width: usize) -> Vec<Line<'static>> {
    lines_of(&view(app), width)
}

/// After the drawer is drawn in `r`: its words select (BISE-290), the
/// head's `u undo` takes a click (sb/queued.rs `click`) with the hand.
pub(crate) fn placed(app: &mut App, r: ratatui::layout::Rect) {
    crate::textlayer::text(r);
    let at = app.sb.undo_shown().then(|| ratatui::layout::Rect { x: r.x + UNDO_X, y: r.y, width: UNDO.width() as u16, height: 1 }.intersection(r));
    app.sb.queue.undo_at = at;
    if let Some(u) = at {
        crate::pointer::region(u, crate::pointer::Shape::Pointer);
    }
}

/// The head's undo words, and their column in the drawer: after
/// `╭─ deleted · `.
const UNDO: &str = "u undo";
const UNDO_X: u16 = 13;

/// The head's words: 'queued · sent when perf's turn ends' ('2 queued ·
/// …' from 2), its 'sent when…' dropped whole where it doesn't fit
/// (designer: no second phrasing); 'deleted · u undo' for 4 s.
fn head(v: &View, room: usize) -> String {
    if v.deleted {
        return format!("deleted · {UNDO}");
    }
    let n = v.rows.len();
    let count = if n > 1 { format!("{n} queued") } else { "queued".into() };
    [format!("{count} · sent when {}'s turn ends", v.who), count]
        .into_iter()
        .find(|h| h.width() <= room)
        .unwrap_or_else(|| cut(&format!("{n} queued"), room))
}

/// The first row shown: the oldest, or so the focused row shows.
fn first_shown(v: &View) -> usize {
    let n = v.rows.len();
    v.focus.map_or(0, |f| f.saturating_sub(SHOWN - 1)).min(n.saturating_sub(SHOWN))
}

fn lines_of(v: &View, width: usize) -> Vec<Line<'static>> {
    if height_of(v) == 0 || width < 8 {
        return Vec::new();
    }
    let (edge, words, quiet) = (Style::default().fg(rule()), Style::default().fg(dim()), Style::default().fg(faint()));
    let n = v.rows.len();
    let first = first_shown(v);
    let above = first;
    let below = n.saturating_sub(first + SHOWN);
    // the top edge: `╭─ head ─…─ ↑ 2 more ─╮`
    let more_up = if above > 0 { format!(" ↑ {above} more ") } else { String::new() };
    let room = width.saturating_sub(4 + 2 + more_up.width() + 1);
    let h = head(v, room);
    // `╭─ ` head ` ` fill [count `─`] `╮`
    let fill = width.saturating_sub(3 + h.width() + 1 + more_up.width() + usize::from(above > 0) + 1);
    let mut top = vec![Span::styled("╭─ ", edge), Span::styled(h, if v.deleted { Style::default().fg(text()) } else { words }), Span::styled(format!(" {}", "─".repeat(fill)), edge)];
    if !more_up.is_empty() {
        top.push(Span::styled(more_up, quiet));
        top.push(Span::styled("─", edge));
    }
    top.push(Span::styled("╮", edge));
    let mut out = vec![Line::from(top)];
    // the rows: `│ › his words…  · 1 image │`
    let lead = format!("{} ", glyph(G_YOU));
    for (i, r) in v.rows.iter().enumerate().skip(first).take(SHOWN) {
        let on = v.focus == Some(i);
        let tint = |s: Style| if on { s.bg(chip_bg()) } else { s };
        let inner = width - 4;
        let room = inner.saturating_sub(lead.width() + r.extra.width()).max(1);
        let flat = bend_images::display(&r.text).split_whitespace().collect::<Vec<_>>().join(" ");
        let t = cut(&flat, room);
        let pad = inner.saturating_sub(lead.width() + t.width() + r.extra.width());
        out.push(Line::from(vec![
            Span::styled("│ ", edge),
            Span::styled(lead.clone(), tint(Style::default().fg(if on { text() } else { faint() }))),
            Span::styled(t, tint(Style::default().fg(if on { text() } else { dim() }))),
            Span::styled(r.extra.clone(), tint(quiet)),
            Span::styled(" ".repeat(pad), tint(Style::default())),
            Span::styled(" │", edge),
        ]));
    }
    // the bottom edge: `╰─…─ ↓ 1 more ─╯`
    let more_down = if below > 0 { format!(" ↓ {below} more ") } else { String::new() };
    let fill = width.saturating_sub(2 + more_down.width() + usize::from(below > 0));
    let mut bottom = vec![Span::styled(format!("╰{}", "─".repeat(fill)), edge)];
    if below > 0 {
        bottom.push(Span::styled(more_down, quiet));
        bottom.push(Span::styled("─", edge));
    }
    bottom.push(Span::styled("╯", edge));
    out.push(Line::from(bottom));
    out
}

/// `s` in `room` columns, `…` when cut (after a whole word when one ends
/// past half the room).
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
    // after a whole word (designer m_25146), when one fits in half the room
    if let Some(at) = out.rfind(' ').filter(|&at| at >= room / 2) {
        out.truncate(at);
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

    fn v(texts: &[&str], focus: Option<usize>) -> View {
        View { who: "perf".into(), rows: texts.iter().map(|t| Row { text: t.to_string(), extra: String::new() }).collect(), focus, deleted: false }
    }

    /// designer m_25146: a framed box, the head in its top edge, one
    /// `› text` row per message, every line the drawer's width.
    #[test]
    fn the_drawer_is_a_framed_box() {
        let ls = text_of(&lines_of(&v(&["also check logout", "a much longer message that will not fit in sixty columns at all, no"], None), 60));
        assert_eq!(ls.len(), 4);
        assert!(ls[0].starts_with("╭─ 2 queued · sent when perf's turn ends ─") && ls[0].ends_with("─╮"), "{ls:#?}");
        assert_eq!(ls[1], format!("│ {G_YOU} also check logout{}│", " ".repeat(60 - 21 - 1)));
        assert!(ls[2].contains("will not fit in sixty…  ") && ls[2].ends_with(" │"), "after a whole word: {ls:#?}");
        assert!(ls[3].starts_with('╰') && ls[3].ends_with('╯'));
        for l in &ls {
            assert_eq!(l.width(), 60, "{l:?}");
        }
        assert_eq!(text_of(&lines_of(&v(&["one"], None), 60))[0].split(" ─").next(), Some("╭─ queued · sent when perf's turn ends"));
    }

    /// The head drops 'sent when…' whole where it doesn't fit.
    #[test]
    fn the_head_fits_narrow_drawers() {
        let two = v(&["a", "b"], None);
        assert_eq!(head(&two, 60), "2 queued · sent when perf's turn ends");
        assert_eq!(head(&two, 32), "2 queued", "dropped whole");
        let mut gone = v(&[], None);
        gone.deleted = true;
        assert_eq!(head(&gone, 60), "deleted · u undo");
        assert_eq!(height_of(&gone), 2, "the head stays for the undo");
        assert_eq!(height_of(&v(&[], None)), 0);
    }

    /// 3 rows, then it scrolls: the edges count what hides, the focused
    /// row always shows.
    #[test]
    fn five_rows_scroll_inside() {
        let five = ["m0", "m1", "m2", "m3", "m4"];
        let ls = text_of(&lines_of(&v(&five, None), 60));
        assert_eq!(ls.len(), 5);
        assert!(ls[1].contains("m0") && ls[3].contains("m2") && ls[4].contains("↓ 2 more"), "{ls:#?}");
        let ls = text_of(&lines_of(&v(&five, Some(4)), 60));
        assert!(ls[0].contains("↑ 2 more") && ls[1].contains("m2") && ls[3].contains("m4"), "{ls:#?}");
        assert!(!ls[4].contains("more"));
        for l in &ls {
            assert_eq!(l.width(), 60, "{l:?}");
        }
    }

    /// The focused row is a selection: `›` and words in ink on the chip
    /// tint, never accent (his taste).
    #[test]
    fn the_focused_row_is_a_selection() {
        let ls = lines_of(&v(&["one", "two"], Some(1)), 40);
        assert_eq!(ls[2].spans[1].style.fg, Some(text()));
        assert_eq!(ls[2].spans[2].style.fg, Some(text()));
        assert_eq!(ls[2].spans[2].style.bg, Some(chip_bg()));
        assert_eq!(ls[1].spans[2].style.fg, Some(dim()));
    }

    /// issue 23: the drawer is the hub's row of the agent in view, minus
    /// what is being taken back; another agent's row draws nothing here.
    #[test]
    fn the_queue_is_the_hub_row_of_the_agent_in_view() {
        let mut app = crate::sb::bench::test_app();
        crate::sb::bench::queued_rows(&mut app, "docs", &["for docs"]);
        assert!(lines(&app, 40).is_empty(), "docs isn't in view");
        crate::sb::bench::queued_rows(&mut app, "main", &["one", "two"]);
        assert_eq!(height(&app), 4);
        let newest = app.sb.queued_for("main").last().unwrap().id;
        app.sb.queue.taking.insert(newest);
        let ls = text_of(&lines(&app, 40));
        assert_eq!(ls.len(), 3);
        assert!(ls[1].contains("one"));
    }

    #[test]
    fn an_image_shows_its_label_and_count() {
        let mut one = v(&["look <image name=\"[Image #1]\" path=\"/a.png\" mime=\"image/png\" b64=\"/x.b64\">"], None);
        one.rows[0].extra = " · 1 image".into();
        let ls = text_of(&lines_of(&one, 60));
        assert!(!ls[1].contains("b64") && ls[1].contains("/a.png] · 1 image  "), "{ls:?}");
    }
}
