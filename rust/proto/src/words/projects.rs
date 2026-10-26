//! The projects area's UI words (see [`super`]: the rules, how to read them):
//! the desktop sidebar's project rows since round 3 (Gabriel's pick H1 on
//! page sidebar-projects, designer m_44783): a project's plain sentence
//! under its name (what works, what is new, its last news), its week's
//! sparkline and its inbox pill, and their tips
//! (apps/desktop/src/app/projectfacts.ts). The numbers and ages are the
//! window's format; designer signs the words.

crate::words! { projects:
    /// the sentence's first part: how many of its agents work now
    working(n) = "{n} working";
    /// the sentence's second part, and the row's tip: the artifacts made
    /// since he last looked at the project
    new_artifacts(n) = one "{n} new artifact" | "{n} new artifacts";
    /// the row's tip, and the sentence when nothing else applies: what its
    /// agents and bise wrote for him since he last looked
    unread(n) = "{n} unread";
    /// the last news: an agent failed (in the error colour)
    failed(agent) = "{agent} failed";
    /// the last news: an agent's land on the trunk ('brush landed on main')
    landed(agent, target) = "{agent} landed on {target}";
    /// the last news: an artifact is ready ('report ready: evals pass')
    ready(title) = "report ready: {title}";
    /// the last news: its next scheduled run ('next run tomorrow 07:30')
    next_run(when) = "next run {when}";
    /// the row's tip, last: when its agents last worked ('last activity 3 h ago')
    last_activity(age) = "last activity {age} ago";
    /// the row's tip, last, while one of its agents works
    active_now = "active now";
    /// the week's bars, read aloud (their label; each bar has its own tip)
    week_tip = "its agents' work, last 7 days";
    /// a day bar's tip in the row's week ('today · 2 h 10 min of agent work')
    day_work(day, work) = "{day} · {work} of agent work";
    /// a day bar's tip, a day its agents did not work ('sat 24 oct · no agent work')
    day_idle(day) = "{day} · no agent work";
    /// the inbox pill's tip ('2 in your inbox')
    pill_tip(n) = "{n} in your inbox";
}
