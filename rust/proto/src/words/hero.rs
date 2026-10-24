//! The hero area's UI words (see [`super`]: the rules, how to read
//! them): the permanent hero card at the top of each of the desktop's full
//! pages (apps/desktop/src/ds/pagehero.tsx), its sentence (what the place
//! is, in his words) and its facts line (live numbers). Words from
//! designer's m_39021 (page page-hero, docs/brand/design-system.md
//! 'dialogs and page heroes'); the settings sections' sentences are their
//! `settings.page_*_sub`. Ages (`2 h`) and clock times stay TS fns.

crate::words! { hero:
    // ---- the sentences
    /// the inbox screen's hero sentence
    inbox_say = "what your agents wait on you for, from every project. answer here or in their thread; only what needs you gets in.";
    /// the artifacts screen's hero sentence
    artifacts_say = "what your agents made for you to look at: pages, docs, decks, sheets. each one keeps its versions and your notes.";
    /// the scheduled screen's hero sentence
    scheduled_say = "what runs on its own: a check every few minutes, a morning summary, a wait for a build to end. an agent sets it up; you can stop any of it.";
    /// the processes screen's hero sentence
    processes_say = "what your agents left running on this Mac: dev servers, watchers, long tests. open one to read its output, or stop it.";
    /// the agents screen's hero sentence
    agents_say = "who works on this project now: main, your lead, and the agents it started, one per job.";
    /// the archived agents screen's hero sentence
    archived_say = "agents whose work is done. their threads stay here to read; restore one to talk to it again.";

    // ---- the facts lines (parts joined by ' · ')
    /// inbox: how many wait on him (the accent)
    waiting(n) = "{n} waiting";
    /// inbox: the age of the oldest that waits, `the oldest 2 h ago`
    oldest(age) = "the oldest {age} ago";
    /// inbox: nothing waits
    nothing_waits = "nothing waits for you";
    /// artifacts: how many, `41 artifacts`
    artifacts_n(n) = one "{n} artifact" | "{n} artifacts";
    /// artifacts: none yet
    nothing_yet = "nothing yet";
    /// artifacts: how many he hasn't opened yet (the sidebar's 'new'), `3 new`
    new_ones(n) = "{n} new";
    /// scheduled: how many still run
    running(n) = "{n} running";
    /// scheduled: the next run's clock time, `next at 07:30`
    next_at(at) = "next at {at}";
    /// agents: how many work now
    working(n) = "{n} working";
    /// agents: how many wait for his answer (the accent)
    wait_for_you(n) = one "{n} waits for you" | "{n} wait for you";
    /// archived: how many
    archived(n) = "{n} archived";
    /// archived: the age of the newest, `the newest 2 h ago`
    newest(age) = "the newest {age} ago";
}
