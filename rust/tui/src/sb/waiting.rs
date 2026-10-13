//! event-wake's waiting line in the TUI (designer's desktop-status-line A,
//! architect m_22744): bise-proto's `waiting_line` with the terminal's
//! short ages, fitted to its row; the panel's header and the feed's live
//! line read it.

use super::*;
use unicode_width::UnicodeWidthStr;

impl Sb {
    /// event-wake: the live words of the agent in view when it waits for
    /// an event, in `room` columns (designer's desktop-status-line A, the
    /// TUI's ages under the hour): `waiting since 04:12 · nightly full gate
    /// (all…`, `waiting 12m · cargo test and 1 more`; the state whole, only
    /// the note cuts, after a whole word; under 3 words left it drops.
    pub(crate) fn waiting_words(&self, now: u64, room: usize) -> Option<String> {
        let a = self.agent(&self.focus).filter(|a| a.waits_event())?;
        let l = bise_proto::thread::words::waiting_line(&a.watching, now, &crate::when::offset_at, true)?;
        Some(wait_fit(&l, room))
    }
}

/// A waiting line in `room` columns: `<state> · <note><more>`, the note
/// cut after a whole word with `…`, gone under 3 words (then `<state><more>`).
pub(crate) fn wait_fit(l: &bise_proto::thread::words::WaitLine, room: usize) -> String {
    let line = |note: &str| if note.is_empty() { format!("{}{}", l.state, l.more) } else { format!("{} · {}{}", l.state, note, l.more) };
    let whole = line(&l.note);
    if whole.width() <= room {
        return whole;
    }
    let words: Vec<&str> = l.note.split_whitespace().collect();
    for k in (3..words.len()).rev() {
        let cut = line(&format!("{}…", words[..k].join(" ")));
        if cut.width() <= room {
            return cut;
        }
    }
    line("")
}

#[cfg(test)]
mod tests {
    use super::*;

    /// desktop-status-line A in the TUI: the state whole, only the note
    /// cuts, after a whole word; under 3 words left it drops.
    #[test]
    fn the_waiting_line_cuts_its_note_on_a_word() {
        let l = bise_proto::thread::words::WaitLine { state: "waiting since 04:12".into(), note: "nightly full gate (all tests, main's tip)".into(), more: String::new(), title: String::new() };
        assert_eq!(wait_fit(&l, 200), "waiting since 04:12 · nightly full gate (all tests, main's tip)");
        assert_eq!(wait_fit(&l, 50), "waiting since 04:12 · nightly full gate (all…");
        assert_eq!(wait_fit(&l, 40), "waiting since 04:12 · nightly full gate…");
        assert_eq!(wait_fit(&l, 30), "waiting since 04:12");
        let two = bise_proto::thread::words::WaitLine { more: " and 1 more".into(), ..l };
        assert_eq!(wait_fit(&two, 52), "waiting since 04:12 · nightly full gate… and 1 more");
        assert_eq!(wait_fit(&two, 20), "waiting since 04:12 and 1 more");
    }

    /// The feed's live line on a real frame at 150 and 80 columns: `…` in
    /// the glyph column, the state whole, the note cut on a word at 80.
    /// `-- --nocapture` prints both screens (designer's capture).
    #[test]
    fn the_feed_ends_on_the_waiting_line() {
        use ratatui::{backend::TestBackend, Terminal};
        let mut app = super::super::bench::test_app_drained();
        let now = crate::when::now_ms();
        let w = |id, what: &str, ago| bise_proto::rows::AgentWatch { id, kind: bise_proto::rows::WatchKind::Bg, what: what.into(), since_ms: now - ago, noted: true, resumes: false, until_ms: None };
        let watching = vec![w(9, "nightly full gate (all tests, main's tip) then the bench on every target", 3 * 3_600_000), w(10, "cargo bench", 40_000)];
        app.sb.agents = vec![Agent { main: true, name: "main".into(), status: "idle".into(), ..Agent::default() }, Agent { name: "perf".into(), status: "idle".into(), watching, ..Agent::default() }];
        app.sb.focus = "perf".into();
        for cols in [150u16, 80] {
            let mut term = Terminal::new(TestBackend::new(cols, 24)).unwrap();
            term.draw(|f| crate::ui::draw(&mut app, f)).unwrap();
            let buf = term.backend().buffer().clone();
            let rows: Vec<String> = (0..buf.area.height).map(|y| (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_string()).collect::<String>().trim_end().to_string()).collect();
            let line = rows.iter().find(|r| r.contains("waiting since")).unwrap_or_else(|| panic!("{cols}: {}", rows.join("\n")));
            assert!(line.contains("… waiting since") && line.contains(" and 1 more"), "{cols}: {line}");
            if cols == 80 {
                assert!(line.contains("…") && !line.contains("every target"), "80: the note cut: {line}");
            }
            // the screen for designer (`cargo test the_feed_ends -- --nocapture`)
            println!("== tui {cols} cols\n{}", rows.join("\n"));
        }
    }
}
