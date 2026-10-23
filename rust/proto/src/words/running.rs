//! The running area's UI words (see [`super`]: the rules, how to read
//! them): the processes the agents leave running (dev servers, watchers,
//! background jobs) and the ones that ended today, in the TUI's /running
//! panel, its output and the agents panel's faint line (running.rs,
//! running_screen.rs), and the desktop's right bar RUNNING section, its
//! sidebar row and its running screen. Words from designer's page
//! running-procs. Ages (`14 min`, `1 h`) and clock times stay Rust/TS fns;
//! the glyphs (∿ ✓ ✗ –) are the clients' own.

crate::words! { running:
    // ---- names
    /// the sidebar row, the screen's title, the slash command's word
    heading = "running";
    /// a group of rows: `storefront › perf`
    group(project, agent) = "{project} › {agent}";
    /// the output's head: whose and where, `perf · storefront`
    whose(agent, project) = "{agent} · {project}";

    // ---- counts (heads, filters, the agents panel)
    /// how many run: the TUI head, the agents panel's line `∿ 2 running`
    count_running(n) = "{n} running";
    /// how many listen on a port: `2 listening`
    count_listening(n) = "{n} listening";
    /// the TUI's tab: shows the ones that ended today too
    ended_today = "ended today";

    // ---- a row
    /// its url when it listens, underlined (opens 127.0.0.1)
    url(port) = "localhost:{port} ↗";
    /// its port, short (the 80-column list, the agents panel's line)
    port_short(port) = ":{port}";
    /// it ended by itself: `ended 3 min ago`
    ended_ago(ago) = "ended {ago} ago";
    /// how long ago, short (the 80-column list): `3 min ago`
    ago_short(ago) = "{ago} ago";
    /// its exit code, after a failure: `rc 1`
    exit_rc(rc) = "rc {rc}";
    /// he asked it to stop, before it ends
    stopping = "stopping…";
    /// he stopped it, then: `stopped by you · 10:12`
    stopped_by_you_at(at) = "stopped by you · {at}";
    /// he stopped it, when the time is not known
    stopped_by_you = "stopped by you";
    /// it stopped with its agent (stopped, archived, or its hub quit)
    stopped_with(agent) = "stopped with {agent}";
    /// its state in the output's meta: running
    state_running = "running";
    /// a row's tip: `bg3 · started 13:52 · ~/…/worktrees/perf`
    tip(id, at, cwd) = "{id} · started {at} · {cwd}";
    /// a row's tip, when its folder is not known
    tip_no_cwd(id, at) = "{id} · started {at}";
    /// a detached one's tip adds where it came from
    tip_detached(agent) = "started outside {agent}'s commands (a script or nohup)";

    // ---- the output
    /// the output's meta: its root pid
    pid_of(pid) = "pid {pid}";
    /// the output's meta: cpu and memory of its tree, `cpu 12% · 340 MB`
    usage(cpu, mb) = "cpu {cpu}% · {mb} MB";
    /// the output when no file of it can be read
    no_output = "no output kept: it doesn't write to a file bise can read.";

    // ---- keys
    /// the TUI's full screen output's keys (no local file: read from the hub)
    keys_output = "↓ follows the end   / find   o open   s stop   esc back";
    /// the TUI list's keys at 150 columns
    keys_list = "⏎ its output   o open   s stop   a its agent   esc back";
    /// the TUI list's keys at 80 columns
    keys_list_short = "⏎ output   o open   s stop   esc back";
    /// the TUI head's keys at 150 columns
    keys_head = "tab ended today   / search   esc back";
    /// the TUI head's keys while it shows only the ones ended today
    keys_head_ended = "tab all   / search   esc back";

    // ---- empty, and what a key could not do
    /// the list with nothing running
    empty = "nothing running. what your agents leave running (a dev server, a watcher) shows here.";
    /// the list with nothing running nor ended today
    empty_ended = "nothing ran in the background today.";
    /// a search with no match
    none_match = "nothing running matches.";
    /// `o` on one that listens on no port
    no_port = "it listens on no port: nothing to open.";
    /// `o` when nothing answers on its port
    not_answering(port) = "not opened: nothing answers at localhost:{port} yet.";
    /// `o` opened it
    opening(port) = "opening localhost:{port}";
    /// `s` on one that has ended
    already_ended = "it has ended already.";
}
