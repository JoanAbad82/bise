//! The scheduled area's UI words (see [`super`]: the rules, how to read
//! them): scheduled tasks (`sb every`) and the agents' alarms, in the
//! hub's ◷ thread lines (bise_proto::thread::scheduled), the TUI's
//! /scheduled screen (scheduled_screen.rs, scheduled_watch.rs) and the
//! desktop's scheduled screen (apps/desktop/src/scheduled). Time formats
//! (`14:22`, `tomorrow 07:30`, `in 1h 5m`, ordinals) stay Rust/TS fns.

crate::words! { scheduled:
    // ---- how often, how many, how it ended (the ◷ lines and the screens)
    /// how often: one run only
    once = "once";
    /// how often, short (the 80-column list): every day at `hm`
    daily(hm) = "daily {hm}";
    /// how often, the desktop: the hub's rhythm when it lacks 'every'
    every(when) = "every {when}";
    /// how many so far: `2 of 6`
    n_of(count, total) = "{count} of {total}";
    /// how many in all, after how often: `6 times`
    n_times(n) = "{n} times";
    /// until when it runs: `until 18:00`
    until(at) = "until {at}";
    /// its next run: `next 14:22`
    next_at(at) = "next {at}";
    /// why it ended: its one run is done
    ran_once = "ran once";
    /// why it ended: it ran its count
    ran_n_times(n) = "ran its {n} times";
    /// why it ended: it ran its count (count unknown)
    ran_its_times = "ran its times";
    /// why it ended: its end time passed
    end_time_passed = "its end time passed";
    /// why it ended: its agent is gone
    agent_gone(agent) = "{agent} is gone";
    /// why it ended: he stopped it
    stopped_by_you = "stopped by you";
    /// why it ended: stopped, by whom unknown
    stopped = "stopped";
    /// why it ended: an agent stopped it
    stopped_by(by) = "stopped by {by}";

    // ---- the ◷ lines of a thread (the hub's fold and the TUI)
    /// the ◷ line when an agent sets its own
    set_own(agent, title) = "{agent} scheduled {title}";
    /// the ◷ line when one agent sets it for another
    set_for(by, title, agent) = "{by} scheduled {title} for {agent}";
    /// the ◷ line when one ends, with why
    ended(title, why) = "{title} ended · {why}";
    /// a run's ◷ line: he ran it now
    ran_now_by_you = "ran now, by you";

    // ---- the screen's head and search (the TUI and the desktop)
    /// the screen's title (the TUI's frame and head, the desktop's head and back button)
    heading = "scheduled";
    /// what the screen is, beside its title
    subtitle = "what wakes your agents, and when";
    /// the TUI head's count: the active ones
    count_active(n) = "{n} active";
    /// the TUI head's count: the ended ones (tab)
    count_ended(n) = "{n} ended";
    /// the TUI head's count: the agents' alarms
    count_watching(n) = "{n} watching";
    /// the TUI's search line, after `/ `
    find_hint = "find: an agent, a name, the words";
    /// the desktop's search field
    search_placeholder = "search scheduled tasks";
    /// the TUI's list when the search finds none
    none_match = "nothing scheduled matches.";
    /// the desktop's list when the search finds none
    none_match_desktop = "nothing matches. esc clears the search.";
    /// the TUI's list with none (straight quotes; the desktop's has curly ones)
    empty = "nothing scheduled. ask an agent to \"check the build every 5m\" and it shows here.";
    /// the desktop's list with none (curly quotes; the TUI's has straight ones)
    empty_desktop = "nothing scheduled. ask an agent to “check the build every 5m” and it shows here.";
    /// the TUI's group head of the agents' alarms
    group_watching = "watching";
    /// the TUI's group head of the ended ones
    group_ended = "ended";

    // ---- a row
    /// an ended row: when
    ended_at(at) = "ended {at}";
    /// an ended row, narrow: when it was stopped
    stopped_at(at) = "stopped {at}";
    /// how many runs: `3 runs`
    runs(n) = one "{n} run" | "{n} runs";
    /// the desktop's runs with no count: `3 runs so far`
    runs_so_far(n) = one "{n} run so far" | "{n} runs so far";
    /// a wide row: who set it
    by(who) = "by {who}";
    /// the desktop's next-run column when none is due
    next_none = "—";
    /// the line over the TUI's key bar: the selected one
    detail(title, agent, when, by) = "{title} · wakes {agent} {when} · set by {by}";
    /// the line over the TUI's key bar: its words, after the detail
    its_words(words) = "its words: {words}";

    // ---- the keys' words (the keys themselves stay glyphs: ⏎ r x / tab esc)
    /// key: open the selected one
    key_open = "open";
    /// key: run it now
    key_run_now = "run now";
    /// key: stop it
    key_stop = "stop";
    /// key: keep it (after the stop question)
    key_keep = "keep";
    /// key: between two keys that do the same (`n or esc`)
    key_or = "or";
    /// key: the TUI's search
    key_find = "find";
    /// key: the desktop's search
    key_search = "search";
    /// key: the search is done
    key_done = "done";
    /// key: move the selection while searching
    key_choose = "choose";
    /// key: clear the search
    key_clear_search = "clear the search";
    /// key: close the screen
    key_close = "close";
    /// key: back from one opened to the list
    key_back = "back to the list";
    /// key (tab): show the ended ones too
    key_ended_too = "ended too";
    /// key (tab): the active ones only
    key_active_only = "active only";

    // ---- stop: the question and the note
    /// the TUI's question on the row, after `x`
    stop_ask(title, agent) = "stop “{title}”? it won't wake {agent} again.";
    /// the desktop's question in the pane, after stop
    stop_ask_desktop(agent) = "stop this scheduled task? it won't wake {agent} again.";
    /// the TUI's note after `r`
    ran_now_note(title, agent, at) = "{title} · ran now: {agent} is on it. the next run stays at {at}.";
    /// the TUI's note after a stop
    stopped_note(title, agent) = "{title} · stopped: it won't wake {agent} again.";
    /// the TUI's question on an alarm's row, after `x`
    watch_stop_ask(agent, note) = "stop watching? bise won't wake {agent} {note}.";
    /// the TUI's note after it stops watching
    watch_stopped_note(agent, note) = "stopped watching: bise won't wake {agent} {note}.";

    // ---- one opened (the TUI's opened view, the desktop's pane)
    /// opened: its state, active
    state_active = "active";
    /// opened: its state, ended
    state_ended = "ended";
    /// opened label (TUI): its name
    label_name = "name";
    /// opened label and column head: who it wakes
    label_wakes = "wakes";
    /// opened label: who set it
    label_set_by = "set by";
    /// opened label (TUI): how often
    label_when = "when";
    /// opened label and column head (desktop): how often
    label_how_often = "how often";
    /// opened label (TUI): when it ended
    label_ended = "ended";
    /// opened label and column head: its next run
    label_next_run = "next run";
    /// opened label (TUI): its runs so far
    label_so_far = "so far";
    /// opened label (TUI): when it ends
    label_ends = "ends";
    /// opened label (desktop): when it ends
    label_it_ends = "it ends";
    /// opened label: the page it keeps fresh
    label_keeps_fresh = "keeps fresh";
    /// the desktop list's first column head
    col_what = "what it does";
    /// opened, so far (TUI): when it last ran
    last_at(at) = "last {at}";
    /// when it ends: after its one run
    ends_after_run = "after its run";
    /// when it ends: after its nth run (`6th`)
    ends_after_nth(nth) = "after its {nth} run";
    /// when it ends: at a time
    ends_at(at) = "at {at}";
    /// when it ends: never on its own
    ends_when_stopped = "when it's stopped";
    /// the desktop's next run: `the 7th of 24`
    nth_of(nth, total) = "the {nth} of {total}";
    /// the desktop's next run, no count: `the 7th`
    nth(nth) = "the {nth}";
    /// opened: the head over its words
    words_it_sends = "the words it sends";
    /// opened: the head over its runs
    its_runs = "its runs";
    /// opened: no run yet
    none_yet = "none yet";
}
