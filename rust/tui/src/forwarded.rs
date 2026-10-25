//! A forwarded message on its level-3 row (msg-forward, designer m_41546):
//! under its chip, the forwarder's note in the message's own style, then
//! `↪ forwarded from you → main · 12:26` faint (his local time), then the
//! original quoted: a faint `│ ` on its left, its quotes, words, pastes
//! and chips as in his own messages (said.rs), never their markup. Drawn
//! from the entry's parts (bise_proto::parts::Part::Forwarded, architect
//! m_41547), never from the header the model reads. Closed: the note, the
//! line and the original's first rows, then `… ▸`. Pure.

use crate::theme::{dim, ellipsis, faint, glyph, G_CLOSED, G_OPEN};
use bise_proto::parts::{self, Part};
use bise_proto::words::thread;
use ratatui::style::Style;
use ratatui::text::{Line, Span};

/// The original's rows shown while the message is closed.
const CLOSED_ROWS: usize = 2;

/// A forward's pieces from its parts: the note (what comes before the
/// `forwarded` part, "" none), who wrote the original to whom and when,
/// and the original's parts (what comes after it).
#[derive(Debug, PartialEq)]
pub(crate) struct Fwd<'a> {
    pub(crate) note: String,
    pub(crate) from: &'a str,
    pub(crate) to: &'a str,
    pub(crate) at: &'a str,
    pub(crate) original: &'a [Part],
}

/// The forward in `parts`; none: not a forward.
pub(crate) fn of(parts: &[Part]) -> Option<Fwd<'_>> {
    let i = parts.iter().position(|p| matches!(p, Part::Forwarded { .. }))?;
    let Part::Forwarded { from, to, at, .. } = &parts[i] else { return None };
    Some(Fwd { note: parts::render(&parts[..i]).trim_end().to_string(), from, to, at, original: &parts[i + 1..] })
}

/// Its line: `↪ forwarded from you → main · 12:26`, `you` when he wrote
/// it, the time in his zone (`clock`: ms to `14:02`); a time that doesn't
/// read: none.
pub(crate) fn line(f: &Fwd, clock: impl Fn(u64) -> String) -> String {
    let who = |n: &str| if n == "user" { thread::forwarded_you.to_string() } else { n.to_string() };
    match bise_proto::thread::when::utc_ms(f.at) {
        Some(ms) => thread::forwarded_from(&who(f.from), &who(f.to), &clock(ms)),
        None => thread::forwarded_from_untimed(&who(f.from), &who(f.to)),
    }
}

/// The rows under the chip in `room` columns: the note (`note_rows`
/// draws it as the message's own text), the line, then the original
/// quoted; closed, its first [`CLOSED_ROWS`] rows then `… ▸`, open, all
/// of them then `▾`.
pub(crate) fn rows(
    f: &Fwd,
    open: bool,
    room: usize,
    clock: impl Fn(u64) -> String,
    note_rows: impl FnOnce(&str) -> Vec<Line<'static>>,
) -> Vec<Line<'static>> {
    let (d, fa) = (Style::default().fg(dim()), Style::default().fg(faint()));
    let mut out = if f.note.is_empty() { Vec::new() } else { note_rows(&f.note) };
    out.extend(crate::wrap_line(Line::from(Span::styled(line(f, clock), fa)), room.max(1)));
    let bar = Span::styled("│ ", fa);
    let mut body = crate::render::hung_rows(&bar, &bar, original_lines(f.original, d, room), room);
    match open {
        true => body.push(Line::from(vec![bar.clone(), Span::styled(glyph(G_OPEN), d)])),
        false if body.len() > CLOSED_ROWS => {
            body.truncate(CLOSED_ROWS);
            if let Some(last) = body.last_mut() {
                last.spans.push(Span::styled(format!("{} {}", ellipsis(), glyph(G_CLOSED)), d));
            }
        }
        false => {}
    }
    out.extend(body);
    out
}

/// The original as his message is drawn (said.rs's view): its quotes'
/// lines, then its words line by line with their chips (quiet, as a
/// level-3 row's), then each paste's chip line.
fn original_lines(original: &[Part], st: Style, room: usize) -> Vec<Line<'static>> {
    let v = crate::said::view_of(&parts::render(original), original);
    let mut lines = crate::render::quote_lines(&v.quotes, room);
    lines.extend(v.body.trim().split('\n').filter(|l| !l.trim().is_empty()).map(|l| Line::from(crate::agent_parts::spans(l, st))));
    lines
}

#[cfg(test)]
#[path = "forwarded_tests.rs"]
mod tests;
