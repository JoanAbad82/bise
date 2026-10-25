//! The panel area's UI words: the TUI's agents panel, its top edge and
//! the status line under the composer; the desktop's right bar, sidebar
//! and title bar (see [`super`]: the rules, how to read them). The
//! choices (which word for which state) stay with the code that draws.

crate::words! { panel:
    /// the product's name: the TUI's logo, the sidebar's top row, a card row of bise's own
    bise = "bise";
    /// the TUI panel's title; the desktop's crumb of a project's agents list
    agents = "agents";
    /// the TUI header with no agent and no card
    no_agents = "no agents yet";

    // ---- the counts: the TUI header and the bar's top
    /// a count of agents at work (the TUI header, the right bar's top and AGENTS folded)
    count_working(n) = "{n} working";
    /// the TUI header's count of agents that ask him something
    count_needs_you(n) = "{n} needs you";
    /// the TUI header's count of agents done
    count_done(n) = "{n} done";
    /// the TUI header's open PRs (ctrl held)
    count_prs(n) = one "{n} PR" | "{n} PRs";
    /// the TUI header's open cards
    count_inbox(n) = "{n} in the inbox";
    /// what came new: the TUI top edge's short form, the sidebar's and ARTIFACTS' folded end
    count_new(n) = "{n} new";
    /// the TUI top edge's new artifacts
    new_artifacts(n) = one "{n} new artifact" | "{n} new artifacts";
    /// a row of hidden rows: the TUI panel's `↑ 6 more`, the sidebar's fold
    more(n) = "{n} more";
    /// the sidebar's fold when every folded agent is from today
    more_today(n) = "{n} more today";

    // ---- an agent's state, one word
    /// it asks him something (the TUI's columns with ctrl held, the sidebar's tip)
    asks_you = "asks you";
    /// at work
    state_working = "working";
    /// waiting on an event or another agent
    state_waiting = "waiting";
    /// failed
    state_failed = "failed";
    /// done
    state_done = "done";
    /// at rest
    state_idle = "idle";
    /// stopped (an archived agent that was neither done nor failed)
    state_stopped = "stopped";
    /// archived: the TUI status line's note, the desktop's crumb of /archived
    archived = "archived";
    /// a role made of a raw tag (a model's `<think>`)
    role_thinking = "thinking";
    /// main's row at rest, beside 'bise' (page new-project-home: '○ bise  team lead')
    role_lead = "team lead";
    /// an agent's next wake, at a clock
    wakes_at(at) = "wakes at {at}";

    // ---- the TUI panel
    /// the panel's cards section title
    inbox = "inbox";
    /// the archived section's folded row; the desktop's /archived and artifacts lists
    archived_count(n) = "{n} archived";
    /// the desktop's /archived with none
    no_archived = "no archived agent";
    /// his messages held for after an agent's turn
    queued(n) = "{n} queued";
    /// the watching section's title
    watching = "watching";
    /// the watching count under the panel
    watching_count(n) = "{n} watching";
    /// the TUI header's pause mark (cost-pause)
    paused = "paused";
    /// a computer-use agent's app (ctrl held)
    driving(app) = "driving {app}";
    /// a computer-use agent's app and where (ctrl held)
    driving_in(app, place) = "driving {app} · {place}";

    // ---- the TUI status line
    /// the agent selected in preview
    preview_of(agent) = "preview of {agent}";
    /// a hub version building
    building(rev) = "building {rev}";
    /// a hub version or a feature on trial
    on_trial(rev) = "{rev} on trial";
    /// the hub's version
    version(v) = "v {v}";
    /// the hub is gone
    hub_disconnected = "hub disconnected · reconnecting…";

    // ---- the flow, a worktree, its PR (the TUI's top edge, ψ tip and PR words; the desktop's mark tips)
    /// the flow (ctrl held): through PRs
    lands_via_prs = "lands via PRs";
    /// the flow (ctrl held): straight to main
    lands_on_main = "lands on main";
    /// a PR's state: a draft
    pr_draft = "draft";
    /// a PR's review: changes requested
    pr_changes_asked = "changes asked";
    /// a PR's review: approved
    pr_approved = "approved";
    /// a PR's review: pending
    pr_in_review = "in review";
    /// a PR's checks pass
    pr_checks_pass = "checks pass";
    /// a PR's checks run
    pr_checks_running = "checks running";
    /// a PR's checks fail
    pr_checks_fail = "checks fail";
    /// a PR with nothing else to say
    pr_open = "open";
    /// the forge is late
    pr_state_from(age) = "state from {age} ago";
    /// a feature branch's tip, before its name
    wt_feature_branch(g) = "{g} feature branch ";
    /// a feature branch's tip, after its name
    wt_feature_lands = ": its agents land on it";
    /// a feature on try, before its name
    wt_feature(g) = "{g} feature ";
    /// a feature on try, after its name
    wt_feature_trying = ": its try build is running";
    /// a worktree 2 or more agents share
    wt_shared(g, n) = "{g} worktree shared by {n} agents";
    /// a worktree of one agent
    wt_own(g) = "{g} worktree: its own copy of the repo";
    /// a worktree's branch follows
    wt_on(who) = "{who}, on ";
    /// a detached worktree
    wt_no_branch(who) = "{who}, no branch";
    /// a mark's tip: the PR's or the land's words, then its branch
    wt_said_on(said, g) = "{said} · {g} worktree on ";

    // ---- the desktop's right bar
    /// the Overview tab's agents label (sentence case, bise fait mac §6)
    bar_agents = "Agents";
    /// the Overview tab's archived agents label
    bar_archived = "Archived";
    /// the Overview tab's artifacts label
    bar_artifacts = "Artifacts";
    /// the Overview tab's scheduled tasks and watches label
    bar_scheduled = "Scheduled";
    /// a long section's next page, more than a page left
    show_more_left(n, left) = "show {n} more · {left} left";
    /// a long section's last page
    show_more(n) = "show {n} more";
    /// back to the cap
    show_less = "show less";
    /// AGENTS' next page when more than a page is folded: after 'show 50 more', text-3 (designer m_39151)
    more_of(left) = "of {left}";
    /// AGENTS' folded agents at rest (idle or done), text-3
    more_idle(n) = "{n} idle";
    /// AGENTS' folded agents, none at work
    more_all_idle = "all idle";
    /// AGENTS' folded agents, all at work
    more_all_working = "all working";
    /// the tip of AGENTS' 'show N more': how many agents it folds
    more_tip(n) = one "{n} agent not shown" | "{n} agents not shown";
    /// the tip's agents at work, their first names
    more_tip_working(n, names) = "{n} working ({names})";
    /// the tip's names past the third
    more_tip_plus(n) = "+ {n}";
    /// a new artifact's chip
    new_chip = "new";
    /// a browser-only artifact's mark
    opens_in_browser = "↗ opens in your browser";
    /// an alarm's end
    until(at) = "until {at}";
    /// the bar's label for screen readers
    bar_label(name) = "what happens in {name}";
    /// ARTIFACTS on a sub-agent's thread
    scope_by(agent) = "by {agent}";
    /// its tip
    scope_by_tip(agent, project) = "only what {agent} made · all › shows {project}'s";
    /// its line at 0 rows
    scope_by_none(agent) = "{agent} made nothing yet";
    /// SCHEDULED & WATCHING on a sub-agent's thread
    scope_for(agent) = "for {agent}";
    /// its tip
    scope_for_tip(agent, project) = "only {agent}'s scheduled tasks and alarms · all › shows {project}'s";
    /// its line at 0 rows
    scope_for_none(agent) = "nothing wakes {agent}";
    /// a folded scoped SCHEDULED's count tip
    scope_count_scheduled(n, scope) = "{n} scheduled {scope}";
    /// a folded scoped ARTIFACTS' count tip
    scope_count_artifacts(n, scope) = one "{n} artifact {scope}" | "{n} artifacts {scope}";

    // ---- the hover tips of the bars' marks
    /// an agent's sign: at work
    tip_working(agent) = "{agent} is working";
    /// an agent's sign: it asks him
    tip_asks(agent) = "{agent} waits for you";
    /// an agent's sign: waiting, nothing more known
    tip_waiting(agent) = "{agent} is waiting";
    /// an agent's sign: a pause, its words
    tip_paused(agent, state, note) = "{agent} {state} {note}";
    /// an agent's sign: failed
    tip_failed(agent) = "{agent} failed";
    /// an agent's sign: done
    tip_done(agent) = "{agent} is done";
    /// an agent's sign: stopped
    tip_stopped(agent) = "{agent} stopped";
    /// an agent's sign: at rest
    tip_idle(agent) = "{agent} is idle";
    /// an agent's sign: at rest, a wake ahead
    tip_idle_wakes(agent, at) = "{agent} is idle: wakes at {at}";
    /// the time column: a pause
    tip_waiting_for(len) = "waiting for {len}";
    /// the time column: a turn
    tip_working_for(len) = "working for {len} on this turn";
    /// the % column
    tip_context(pct, agent) = "{pct} of {agent}'s context used";
    /// the % column, with the window
    tip_context_of(pct, agent, used, window) = "{pct} of {agent}'s context used: {used} of {window}";
    /// a mark's click: an orphan PR's branch
    tip_opens_branch = "click opens its branch";
    /// a mark's click: the PR
    tip_opens_pr = "click opens the PR";
    /// a mark's click: the worktree's changes
    tip_opens_changes = "click opens its changes";
    /// an archived agent's age, just now
    tip_archived_now(state) = "{state} just now";
    /// an archived agent's age
    tip_archived_ago(state, age) = "{state} {age} ago";
    /// an artifact's new chip
    tip_new_chip = "new: you haven't opened it yet";
    /// an artifact's end: today's clock
    tip_made_at(at) = "made at {at}";
    /// an artifact's end: now
    tip_made_now = "made just now";
    /// an artifact's end: its age
    tip_made_ago(age) = "made {age} ago";

    // ---- the desktop's sidebar
    /// the global screens' rows; its crumb; the panel button
    artifacts = "artifacts";
    /// the scheduled row
    scheduled = "scheduled";
    /// the sidebar's plugins row (and its crumb, its ⌘K page)
    plugins = "plugins";
    /// the projects' head
    projects = "projects";
    /// no project yet
    add_project = "add a project";
    /// a project row: its folder is gone
    folder_gone = "folder gone";
    /// a project row: its hub refused this core
    refused = "refused";
    /// two or three names
    names_and(names, last) = "{names} and {last}";
    /// four names or more
    names_more(names, n) = "{names} and {n} more";
    /// a mark's tip: what it is and what it says
    tip_of(who, what) = "{who}: {what}";
    /// bise's or a project's mark: things wait for him
    tip_things_wait(n) = one "{n} thing waits for you" | "{n} things wait for you";
    /// a project's mark: one named agent waits for him
    tip_name_waits(names) = "{names} waits for you";
    /// a project's mark: named agents wait for him
    tip_names_wait(names) = "{names} wait for you";
    /// bise's mark: at work
    tip_working_with(n) = one "working with {n} agent" | "working with {n} agents";
    /// a project's mark or count: at work
    tip_agents_working(n) = one "{n} agent working" | "{n} agents working";
    /// a project's mark: one named agent at work
    tip_name_working(names) = "{names} is working";
    /// a project's mark: named agents at work
    tip_names_working(names) = "{names} are working";
    /// a project's mark: how many agents
    tip_agents(n) = one "{n} agent" | "{n} agents";
    /// bise's pink count
    tip_waiting_you_all(n) = "{n} waiting for you, in all your projects";
    /// a gone folder's tip, its path unknown
    tip_gone = "folder gone: its folder is no longer on disk";
    /// a gone folder's tip
    tip_gone_at(path) = "folder gone: {path} is no longer on disk";
    /// the artifacts row's end
    tip_not_opened(n) = one "{n} artifact you haven't opened yet" | "{n} artifacts you haven't opened yet";
    /// the artifacts row's end, who made them
    tip_not_opened_from(what, who) = "{what}, from {who}";
    /// the scheduled row's count
    tip_scheduled(n) = one "{n} scheduled task, in all your projects" | "{n} scheduled tasks, in all your projects";

    // ---- the desktop's title bar
    /// the crumb of an agent's changes
    crumb_changes = "changes";
    /// the crumb of an agent's /debug (its history, its requests)
    crumb_debug = "debug";
    /// the crumb of settings
    crumb_settings = "settings";
    /// the crumb of an unknown route
    crumb_not_found = "not found";
    /// the crumb of the update log
    crumb_update_log = "update log";
    /// the crumb of a crash report
    crumb_crash = "crash report";
    /// the crumb of the lab
    crumb_lab = "lab";
    /// the panel button with its count
    artifacts_count(n) = "artifacts · {n}";

    // ---- the menu bar's dropdown: one line per project (designer m_27872)
    /// a project line's tip: the branch it is on
    tray_on_branch(branch) = "on {branch}";
    /// the projects left out of the menu, and where they are (a click opens bise)
    tray_more(n) = "{n} more in bise";

    // ---- the desktop's tabbed panel (bise fait mac, page native-mac §4 #2, mockups 1-4)
    /// the panel's first tab: what the right bar was (agents, archived, artifacts, scheduled, processes)
    tab_overview = "Overview";
    /// a tab of the launcher ('+', ⌘T), and its VoiceOver name
    tab_new = "New tab";
    /// a shell's tab: the project it runs in
    tab_terminal(project) = "Terminal · {project}";
    /// a project's next shell's tab
    tab_terminal_n(n, project) = "Terminal {n} · {project}";
    /// a pull request's tab
    tab_pr(number) = "PR #{number}";
    /// an agent's changes' tab
    tab_changes(agent) = "Changes · {agent}";
    /// a scheduled task's tab
    tab_scheduled = "Scheduled task";
    /// a project's office's tab
    tab_office(project) = "Office · {project}";
    /// a tab's × button: its VoiceOver name and tip, with its key
    tab_close(key) = "close tab · {key}";
    /// the '+' after the tabs: its tip, with its key
    tab_add(key) = "new tab · {key}";
    /// the overflow menu's button past six tabs
    tabs_more(n) = one "{n} more tab" | "{n} more tabs";
    /// the tab strip's VoiceOver name
    tabs_label = "panel tabs";
    /// the bar's panel button: its tip and VoiceOver name, with its key
    panel_toggle(key) = "panel · {key}";
    /// the panel's VoiceOver name
    panel_label = "panel";
    /// the panel's border: its VoiceOver name (drag to resize, double click resets)
    panel_width = "panel width";

    // ---- New tab, the launcher (mockup 3)
    /// the search field's placeholder and VoiceOver name
    launch_search = "Search artifacts, or enter a URL";
    /// the launcher's first group
    launch_open = "Open";
    /// the launcher's second group: what he opened last
    launch_recent = "Recent";
    /// an Open row: the project's folder in Finder
    launch_files = "Files";
    /// an Open row: a new shell in a tab
    launch_terminal = "Terminal";
    /// an Open row: the lead's thread beside the one in view
    launch_side = "Side thread";
    /// an Open row: the agent's changes in a tab
    launch_changes = "Changes";
    /// an Open row: the search field takes a URL
    launch_browser = "Browser";
    /// Recent with nothing opened yet
    launch_none = "nothing opened yet";
    /// what the search found: nothing
    launch_no_match = "no artifact by that name";
    /// a recent artifact's line: its kind and who made it
    launch_kind_by(kind, who) = "{kind} · {who}";

    // ---- an artifact's tab, the browser (mockup 4)
    /// the address bar's back button
    addr_back = "back";
    /// the address bar's forward button
    addr_forward = "forward";
    /// the address bar's reload button
    addr_reload = "reload";
    /// the address bar's ↗: the page in his browser
    addr_out = "open in your browser";
    /// the bar's button over an artifact's tab: the artifact in a window of its own
    addr_window = "open in a window";

    // ---- the Overview tab's sections (bise fait mac, mockup 1): the head's '…' menu
    /// a section's '…': its full list (the 'all ›' it replaces)
    ov_show_all = "Show all";
    /// the artifacts section's '…' and '+': a file of his into the project's artifacts
    ov_add_file = "Add a file…";
    /// a section label's tip: its words and how many rows it has
    ov_label_tip(label, n) = "{label} · {n}";
}
