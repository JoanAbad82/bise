//! The inbox's UI words: its rows, its history (the TUI's inbox and the
//! desktop's; see [`super`]: the rules, how to read them).

crate::words! { inbox:
    /// a row's place: he answered it in the inbox
    where_inbox = "in the inbox";
    /// a row's place: he answered it in an agent's thread
    where_thread(agent) = "in {agent}'s thread";
    /// a row's place: he answered it on a page
    where_page = "on a page";
    /// an answered row's second line, with where
    answered_at(said, place) = "you: {said} · {place}";
    /// an answered row's second line, place unknown
    answered(said) = "you: {said}";
    /// a withdrawn row's second line
    withdrawn(why) = "withdrawn: {why}";
    /// why a row was withdrawn: its agent stopped
    reason_agent_stopped = "its agent stopped";
    /// why a row was withdrawn: he closed it
    reason_closed = "you closed it";
    /// why a row was withdrawn: its call was interrupted
    reason_interrupted = "its call was interrupted";
    /// why a row was withdrawn: main closed it
    reason_closed_by_main = "closed by main";
    /// the history's day head: today
    day_today = "today";
    /// the history's day head: yesterday
    day_yesterday = "yesterday";
}
