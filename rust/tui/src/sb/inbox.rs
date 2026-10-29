//! `/inbox`'s side in the shell (inbox_screen.rs draws it): its waiting
//! rows from the open notifications, and the jump to his answer
//! (inbox-record; designer m_24225 (7), m_24425 (7)).
//!
//! The jump: ⏎ on a past row of `/inbox` opens the asker's thread
//! scrolled to his answer (the record's `thread`, the hub's
//! card_answer_pos); his answer to a notification from main's view opens
//! it at its end, where his answer lands (cards.rs `asker_view`). Esc
//! goes back where he was (main, or `/inbox`). The thread may not hold
//! that line yet: its first page is on its way, or the line is older than
//! it. [`reveal`] runs after each page and asks the older ones until the
//! line is in.

use super::cards::shape;
use super::keep::Pin;
use crate::app::App;
use crate::inbox_list::Waiting;
use std::cell::RefCell;

/// The open notifications as the strip numbers them (ctrl+N), in its
/// order: `3  perf  webp or avif for the hero?`.
pub(crate) fn waiting(app: &App) -> Vec<Waiting> {
    let sb = &app.sb;
    let nums = super::card_draw::row_numbers(sb);
    let n = |id| nums.iter().find(|(c, _)| *c == id).map_or(0, |(_, n)| *n);
    sb.sorted_cards()
        .into_iter()
        .map(|c| {
            let s = shape(c);
            let agent = if matches!(c.kind.as_str(), "approval" | "confirm" | "question") { c.agent.clone() } else { s.who.clone() };
            Waiting { n: n(c.id), id: c.id, agent, text: s.summary, age: super::card_draw::short_age(c.age_now()) }
        })
        .collect()
}

/// Open notification `id` to answer it, as ctrl+N does.
pub(crate) fn open_waiting(app: &mut App, id: u64) {
    super::cards::open_view(app, Some(id));
}

#[derive(Default)]
struct Jump {
    /// the line to show once the agent's feed holds it: (agent, pos)
    want: Option<(String, usize)>,
    /// where esc goes back: (the agent jumped to, the agent in view
    /// before, `/inbox` was open)
    back: Option<(String, String, bool)>,
}

thread_local! {
    static JUMP: RefCell<Jump> = RefCell::new(Jump::default());
}

/// Open `agent`'s thread at transcript position `pos` (None: at its end);
/// esc comes back to what is in view now (`inbox`: `/inbox` was open).
/// An agent no longer here: nothing.
pub(crate) fn to_answer(app: &mut App, agent: &str, pos: Option<u64>, inbox: bool) {
    if !app.sb.agents.iter().any(|a| a.name == agent) {
        return;
    }
    let before = app.sb.focus.clone();
    if inbox {
        crate::inbox_screen::park(app);
    }
    app.inbox = None;
    // a note of the view he leaves (`✓ inbox clear`) is not the new one's
    app.flash = None;
    JUMP.with(|j| {
        let mut j = j.borrow_mut();
        j.back = Some((agent.to_string(), before, inbox));
        j.want = pos.map(|p| (agent.to_string(), p as usize));
    });
    super::focus(app, agent);
    reveal(app);
}

/// The line asked is in the feed: the view goes to it; older than the
/// feed: the page before is asked (this runs again when it comes).
pub(super) fn reveal(app: &mut App) {
    let Some((agent, pos)) = JUMP.with(|j| j.borrow().want.clone()) else { return };
    if agent != app.sb.focus {
        return;
    }
    let Some(first) = app.win.first_pos else { return };
    if pos < first {
        if !app.win.loading {
            super::feed_entries::want_older(app, first);
        }
        return;
    }
    JUMP.with(|j| j.borrow_mut().want = None);
    super::keep::repin(app, Pin { pos, off: 0, row: 0 });
}

/// Esc in the thread he jumped to, nothing else open: back where he was.
/// He moved on to another agent: forgotten. False: esc is not ours.
pub(crate) fn esc_back(app: &mut App) -> bool {
    let Some((to, before, inbox)) = JUMP.with(|j| j.borrow().back.clone()) else { return false };
    if to != app.sb.focus {
        JUMP.with(|j| j.borrow_mut().back = None);
        return false;
    }
    let busy = super::card_draw::item_open(app) || app.palette.is_some() || app.find.is_some() || !app.ed.text.is_empty() || app.feed_sel.is_some();
    if busy {
        return false;
    }
    JUMP.with(|j| *j.borrow_mut() = Jump::default());
    app.flash = None;
    super::focus(app, &before);
    app.follow = true;
    if inbox {
        crate::inbox_screen::unpark(app);
    }
    true
}
