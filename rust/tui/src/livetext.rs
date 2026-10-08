//! The answer as it streams in (the hub's `partial` event, at most one
//! every 250 ms): the typing row becomes the reply itself, drawn by the
//! reply's own renderer at its final place under the feed, dim (designer
//! m_12372). The final entry replaces it in the same frame (the hub
//! sends the line, then the clear), so settling changes the color, never
//! the layout. Memory only: never an event of the feed (find, quote,
//! voice and the history never see it).

use crate::feed::{ev_visible, wants_gap_before};
use crate::render::ev_rows;
use crate::wire::Ev;
use ratatui::style::Style;
use ratatui::text::{Line, Span};

/// One agent's answer so far.
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub(crate) struct Live {
    pub(crate) call: String,
    pub(crate) text: String,
}

/// The `partial` event: the whole text so far; "" ends it.
pub(crate) fn on_event(lives: &mut std::collections::HashMap<String, Live>, agent: &str, call: &str, text: &str) {
    if text.is_empty() {
        lives.remove(agent);
    } else {
        lives.insert(agent.to_string(), Live { call: call.to_string(), text: text.to_string() });
    }
}

/// The rows of the live text after `events`: the gap the final reply
/// will have, then its rows, dim (under `NO_COLOR`, ` …` after the last
/// word instead). Cached on (text, width, feed kind, previous event).
pub(crate) fn rows(events: &[Ev], text: &str, debug: bool, tick: u32, width: usize) -> Vec<Line<'static>> {
    let prev = events.iter().rev().find(|e| ev_visible(e, debug));
    // the wire's escape: the final entry carries it, the same renderer
    // reads it
    let ev = Ev::Assistant(text.replace('\n', "\\n"));
    let gap = wants_gap_before(&ev, prev);
    let key = (text.to_string(), width, crate::render::main_feed(), gap);
    CACHE.with(|c| {
        let mut c = c.borrow_mut();
        if let Some((k, r)) = c.as_ref() {
            if *k == key {
                return r.clone();
            }
        }
        let r = build(&ev, gap, tick, width);
        *c = Some((key, r.clone()));
        r
    })
}

/// A kept answer's rows (`Ev::Kept`, its turn failed before the answer
/// came): what he read live, as it was, the failure's notice under it
/// (designer m_13334: text he has read never vanishes). The feed adds
/// the gap before it, as for a reply.
pub(crate) fn kept_rows(text: &str, tick: u32, width: usize) -> Vec<Line<'static>> {
    build(&Ev::Assistant(text.to_string()), false, tick, width)
}

type Key = (String, usize, bool, bool);

thread_local! {
    static CACHE: std::cell::RefCell<Option<(Key, Vec<Line<'static>>)>> = const { std::cell::RefCell::new(None) };
}

fn build(ev: &Ev, gap: bool, tick: u32, width: usize) -> Vec<Line<'static>> {
    let mut rows: Vec<Line<'static>> = Vec::new();
    if gap {
        rows.push(Line::from(""));
    }
    rows.extend(ev_rows(ev, tick, width));
    if crate::find::no_color() {
        mark_unsettled(&mut rows, width);
        return rows;
    }
    let dim = crate::theme::dim();
    rows.into_iter().map(|l| dimmed(l, dim)).collect()
}

/// Every span in the dim color, its modifiers kept (bold, italic: the
/// layout and the weight stay those of the final reply).
fn dimmed(l: Line<'static>, dim: ratatui::style::Color) -> Line<'static> {
    let spans: Vec<Span<'static>> = l.spans.into_iter().map(|s| Span::styled(s.content, s.style.fg(dim))).collect();
    Line { spans, style: l.style, alignment: l.alignment }
}

/// `NO_COLOR` has no dim: ` …` after the last row's text says the reply
/// is still coming (on its own row when the last one is full).
fn mark_unsettled(rows: &mut Vec<Line<'static>>, width: usize) {
    use unicode_width::UnicodeWidthStr;
    let Some(last) = rows.iter_mut().rev().find(|l| l.spans.iter().any(|s| !s.content.trim().is_empty())) else {
        return;
    };
    let w: usize = last.spans.iter().map(|s| s.content.width()).sum();
    let trimmed = w - last.spans.last().map_or(0, |s| s.content.width() - s.content.trim_end().width());
    if trimmed + 2 <= width {
        // drop the trailing blanks, then the mark
        if let Some(s) = last.spans.last_mut() {
            let t = s.content.trim_end().to_string();
            s.content = t.into();
        }
        last.spans.push(Span::styled(" …", Style::default()));
    } else {
        rows.push(Line::from(" …"));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn text_of(rows: &[Line]) -> Vec<String> {
        rows.iter().map(|l| l.spans.iter().map(|s| s.content.as_ref()).collect::<String>()).collect()
    }

    #[test]
    fn same_rows_as_the_final_reply_only_dimmer() {
        let events = vec![Ev::You("hi".into(), crate::wire::Mark::Read, false)];
        let text = "first line

- a point
- another point with `code`";
        let live = rows(&events, text, false, 0, 60);
        let mut all = events.clone();
        all.push(Ev::Assistant(text.replace('\n', "\\n")));
        let fin = crate::feed::build_rows(&all, 1, false, 60, 0);
        assert_eq!(text_of(&live), text_of(&fin), "settling never moves a row");
        let dim = crate::theme::dim();
        assert!(live.iter().flat_map(|l| &l.spans).all(|s| s.style.fg == Some(dim)));
    }

    #[test]
    fn an_unclosed_fence_is_a_code_block_in_progress() {
        let live = rows(&[], "look:
```rust
fn main() {", false, 0, 60);
        let fin = crate::feed::build_rows(&[Ev::Assistant("look:\\n```rust\\nfn main() {".into())], 0, false, 60, 0);
        assert_eq!(text_of(&live), text_of(&fin));
    }

    // a failed turn's kept text is drawn as it was live: the same rows,
    // dim, at the same place (the feed adds the reply's gap before it)
    #[test]
    fn a_kept_answer_stays_as_it_was_live() {
        let events = vec![Ev::You("hi".into(), crate::wire::Mark::Read, false)];
        let live = rows(&events, "the plan, in **three** steps", false, 0, 60);
        let mut all = events.clone();
        all.push(Ev::Kept("the plan, in **three** steps".into()));
        let kept = crate::feed::build_rows(&all, 1, false, 60, 0);
        assert_eq!(text_of(&live), text_of(&kept), "nothing moves when it is kept");
        let dim = crate::theme::dim();
        let own = kept_rows("the plan, in **three** steps", 0, 60);
        assert!(own.iter().flat_map(|l| &l.spans).all(|s| s.style.fg == Some(dim)));
    }

    #[test]
    fn the_event_ends_it() {
        let mut lives = std::collections::HashMap::new();
        on_event(&mut lives, "main", "c1.1", "hel");
        on_event(&mut lives, "main", "c1.1", "hello");
        assert_eq!(lives["main"].text, "hello");
        on_event(&mut lives, "main", "c1.1", "");
        assert!(lives.is_empty());
    }
}
