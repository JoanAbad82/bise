//! A process's output read from the hub (`process/output`, then
//! `process/follow`'s notifications): when the TUI has no local file to
//! give `less` (a remote hub, a detached one writing to a file, an ended
//! one's kept copy). Pure: the bytes in order, cut into lines without the
//! terminal's escapes, a `\r` line keeping its last state; the window
//! that follows the end until he scrolls up; `/` find. The screen that
//! draws it and asks for it is running_screen.rs.

/// The lines kept in the view, at most (the hub keeps 2,000 of an ended
/// one; a long-running one's start goes).
pub(crate) const KEEP_LINES: usize = 5_000;

/// The output so far, as lines.
#[derive(Debug, Default, Clone, PartialEq)]
pub(crate) struct Text {
    /// the whole lines, without escapes
    pub(crate) lines: Vec<String>,
    /// the last line, not ended yet
    pub(crate) tail: String,
    /// bytes of a UTF-8 char cut by a chunk's end
    pending: Vec<u8>,
    /// inside an escape sequence cut by a chunk's end
    esc: Esc,
    /// the offset of the next byte (the next `from`)
    pub(crate) at: u64,
}

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]
enum Esc {
    #[default]
    No,
    /// after ESC
    Start,
    /// a CSI (`ESC [`): until its final byte
    Csi,
    /// an OSC or a string (`ESC ]`, `ESC P`…): until BEL or ESC \
    Str,
    /// ESC inside a string (maybe its `ESC \` end)
    InStr,
}

impl Text {
    /// The bytes at `at` (an answer or a notification). A gap (`at` past
    /// what is held: the start was not kept) starts again there; bytes
    /// already held are skipped.
    pub(crate) fn push(&mut self, at: u64, bytes: &[u8]) {
        if at > self.at {
            if self.at > 0 || !self.is_empty() {
                self.end_line();
            }
            self.at = at;
        }
        let skip = (self.at - at).min(bytes.len() as u64) as usize;
        let new = &bytes[skip..];
        self.at += new.len() as u64;
        let mut buf = std::mem::take(&mut self.pending);
        buf.extend_from_slice(new);
        let (text, rest) = match std::str::from_utf8(&buf) {
            Ok(s) => (s.to_string(), Vec::new()),
            Err(e) if e.error_len().is_none() => {
                let cut = e.valid_up_to();
                (String::from_utf8_lossy(&buf[..cut]).into_owned(), buf[cut..].to_vec())
            }
            Err(_) => (String::from_utf8_lossy(&buf).into_owned(), Vec::new()),
        };
        self.pending = rest;
        for c in text.chars() {
            self.char(c);
        }
        if self.lines.len() > KEEP_LINES {
            let drop = self.lines.len() - KEEP_LINES;
            self.lines.drain(..drop);
        }
    }

    fn is_empty(&self) -> bool {
        self.lines.is_empty() && self.tail.is_empty()
    }

    fn end_line(&mut self) {
        self.lines.push(std::mem::take(&mut self.tail));
    }

    fn char(&mut self, c: char) {
        self.esc = match (self.esc, c) {
            (Esc::No, '\x1b') => Esc::Start,
            (Esc::No, '\n') => {
                self.end_line();
                Esc::No
            }
            // a progress bar redraws its line: keep its last state
            (Esc::No, '\r') => {
                self.tail.clear();
                Esc::No
            }
            (Esc::No, '\t') => {
                self.tail.push_str("    ");
                Esc::No
            }
            (Esc::No, c) if c.is_control() => Esc::No,
            (Esc::No, c) => {
                self.tail.push(c);
                Esc::No
            }
            (Esc::Start, '[') => Esc::Csi,
            (Esc::Start, ']' | 'P' | '_' | '^' | 'X') => Esc::Str,
            (Esc::Start, _) => Esc::No,
            (Esc::Csi, c) if ('\x40'..='\x7e').contains(&c) => Esc::No,
            (Esc::Csi, _) => Esc::Csi,
            (Esc::Str, '\x07') => Esc::No,
            (Esc::Str, '\x1b') => Esc::InStr,
            (Esc::Str, _) => Esc::Str,
            (Esc::InStr, '\\') => Esc::No,
            (Esc::InStr, _) => Esc::Str,
        };
    }

    /// Every line, the unfinished last one too when it has text.
    pub(crate) fn all(&self) -> Vec<&str> {
        let mut v: Vec<&str> = self.lines.iter().map(String::as_str).collect();
        if !self.tail.is_empty() {
            v.push(&self.tail);
        }
        v
    }
}

/// The view over the lines: following the end, or `up` lines above it.
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]
pub(crate) struct View {
    /// lines between the window's last one and the end (0: it follows)
    pub(crate) up: usize,
}

impl View {
    pub(crate) fn follows(&self) -> bool {
        self.up == 0
    }

    /// Moves `d` lines (negative: up), within `len` lines in `h` rows.
    pub(crate) fn scroll(&mut self, d: isize, len: usize, h: usize) {
        let max = len.saturating_sub(h);
        self.up = (self.up as isize - d).clamp(0, max as isize) as usize;
    }

    /// The first line shown, for `len` lines in `h` rows.
    pub(crate) fn top(&self, len: usize, h: usize) -> usize {
        len.saturating_sub(h).saturating_sub(self.up)
    }

    /// Puts line `i` in the window (a find's hit), `len` lines in `h` rows.
    pub(crate) fn show(&mut self, i: usize, len: usize, h: usize) {
        let top = self.top(len, h);
        if i < top || i >= top + h {
            let want_top = i.saturating_sub(h / 2);
            let max_top = len.saturating_sub(h);
            self.up = max_top.saturating_sub(want_top.min(max_top));
        }
    }
}

/// The lines holding `q` (case-blind), in order.
pub(crate) fn hits(lines: &[&str], q: &str) -> Vec<usize> {
    let q = q.to_lowercase();
    if q.is_empty() {
        return Vec::new();
    }
    lines.iter().enumerate().filter(|(_, l)| l.to_lowercase().contains(&q)).map(|(i, _)| i).collect()
}

/// The next hit after line `from` (`back`: before it), wrapping.
pub(crate) fn next_hit(hits: &[usize], from: Option<usize>, back: bool) -> Option<usize> {
    let first = *hits.first()?;
    let last = *hits.last()?;
    Some(match (from, back) {
        (None, false) => last,
        (None, true) => last,
        (Some(f), false) => hits.iter().copied().find(|h| *h > f).unwrap_or(first),
        (Some(f), true) => hits.iter().rev().copied().find(|h| *h < f).unwrap_or(last),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lines_lose_the_escapes_and_a_progress_line_keeps_its_last_state() {
        let mut t = Text::default();
        t.push(0, b"\x1b[32m  VITE v6\x1b[0m ready\n\x1b]0;title\x07dl 10%\rdl 100%\nhalf");
        assert_eq!(t.lines, vec!["  VITE v6 ready", "dl 100%"]);
        assert_eq!(t.tail, "half");
        assert_eq!(t.all(), vec!["  VITE v6 ready", "dl 100%", "half"]);
    }

    #[test]
    fn a_char_or_an_escape_cut_by_a_chunk_comes_whole() {
        let mut t = Text::default();
        let s = "➜ Local\x1b[1m!\n".as_bytes();
        // cut inside ➜ (3 bytes), then inside the CSI
        t.push(0, &s[..1]);
        t.push(1, &s[1..10]);
        t.push(10, &s[10..]);
        assert_eq!(t.lines, vec!["➜ Local!"]);
        assert_eq!(t.at, s.len() as u64);
    }

    #[test]
    fn bytes_held_already_are_skipped_and_a_gap_starts_a_line() {
        let mut t = Text::default();
        t.push(0, b"one\ntw");
        // a follow notification that overlaps the answer
        t.push(4, b"two\n");
        assert_eq!(t.lines, vec!["one", "two"]);
        // the start was not kept: a gap
        t.push(100, b"far\n");
        assert_eq!(t.lines, vec!["one", "two", "", "far"]);
        assert_eq!(t.at, 104);
    }

    #[test]
    fn the_view_follows_until_he_scrolls_up_and_a_hit_comes_into_it() {
        let mut v = View::default();
        assert!(v.follows());
        assert_eq!(v.top(100, 10), 90);
        v.scroll(-5, 100, 10);
        assert_eq!((v.up, v.top(100, 10)), (5, 85));
        v.scroll(50, 100, 10);
        assert!(v.follows());
        v.scroll(-500, 100, 10);
        assert_eq!(v.top(100, 10), 0);
        v.show(42, 100, 10);
        let top = v.top(100, 10);
        assert!((top..top + 10).contains(&42), "{top}");
    }

    #[test]
    fn find_goes_from_hit_to_hit_and_wraps() {
        let lines = vec!["a", "Error x", "b", "error y"];
        let h = hits(&lines, "error");
        assert_eq!(h, vec![1, 3]);
        assert_eq!(next_hit(&h, None, false), Some(3));
        assert_eq!(next_hit(&h, Some(3), false), Some(1));
        assert_eq!(next_hit(&h, Some(3), true), Some(1));
        assert_eq!(next_hit(&h, Some(1), true), Some(3));
        assert_eq!(next_hit(&[], Some(1), true), None);
    }
}
