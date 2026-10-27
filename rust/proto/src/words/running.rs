//! The running area's UI words (see [`super`]: the rules, how to read
//! them): the processes the agents leave running (dev servers, watchers,
//! background jobs) and the ones that ended today, in the TUI's /processes
//! panel (/running its alias), its output and the agents panel's faint line
//! (running.rs, running_screen.rs), and the desktop's right bar PROCESSES
//! section and its processes screen. Words from designer's page
//! running-procs, the noun 'processes' his m_38642 (Gabriel's ask). Ages
//! (`14 min`, `1 h`) and clock times stay Rust/TS fns; the glyphs
//! (∿ ✓ ✗ –) are the clients' own.

crate::words! { running:
    // ---- names
    /// the screen's title (both apps), the slash command's word, ⌘K's row
    heading = "processes";
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
    /// the output while a running one has printed nothing yet: `running for 3 min · nothing printed yet`
    quiet_running(age) = "running for {age} · nothing printed yet";
    /// the output of one that ended without printing anything, its code known: `… · exit 0`
    quiet_ended_rc(rc) = "it ended without printing anything · exit {rc}";
    /// the output of one that ended (or was stopped) without printing anything
    quiet_ended = "it ended without printing anything";
    /// the output's head: how long it has run, `running for 3 min`
    running_for(age) = "running for {age}";
    /// it ended less than a minute ago
    ended_now = "ended just now";
    /// a row's mark tip: it ended with that code, `ended, exit 1`
    mark_exit(rc) = "ended, exit {rc}";
    /// a row's mark tip: it ended, its code not known
    mark_ended = "ended";
    /// a row's address, short and quiet: `:5173` (the desktop draws its line icon after it)
    url_row(port) = ":{port}";
    /// its tip: `open localhost:5173`
    url_tip(port) = "open localhost:{port}";
    /// the output's head: stop asks once more before it stops
    stop_confirm = "Stop it?";
    /// the output scrolled up from its end: back to it
    jump_end = "jump to end ↓";
    /// the output beside the list when none is picked
    pick_one = "pick a process to read its output.";

    // ---- keys
    /// the TUI's full screen output's keys
    keys_output = "↓ follows the end   / find   o open   s stop   esc back";
    /// the TUI list's keys at 150 columns
    keys_list = "⏎ its output   o open   s stop   a its agent   esc back";
    /// the TUI list's keys at 80 columns
    keys_list_short = "⏎ output   o open   s stop   esc back";
    /// the TUI head's keys at 150 columns
    keys_head = "tab ended today   / search   esc back";
    /// the TUI head's keys while it shows only the ones ended today
    keys_head_ended = "tab running   / search   esc back";

    // ---- empty, and what a key could not do
    /// the list with nothing running
    empty = "nothing running. what your agents leave running (a dev server, a watcher) shows here.";
    /// the list with nothing running nor ended today
    empty_ended = "nothing ran in the background today.";
    /// a search with no match
    none_match = "nothing matches.";
    /// `o` on one that listens on no port
    no_port = "it listens on no port: nothing to open.";
    /// `o` when nothing answers on its port
    not_answering(port) = "not opened: nothing answers at localhost:{port} yet.";
    /// `o` opened it
    opening(port) = "opening localhost:{port}";
    /// `s` on one that has ended
    already_ended = "it has ended already.";
    /// `o` on one that has ended
    ended_no_open = "it has ended: nothing to open.";

    // ---- the desktop (apps/desktop/src/running, the right bar)
    /// the right bar's scope line on an agent's thread: `by perf`
    by(agent) = "by {agent}";
    /// ⌘K's row for the screen: the words it is found by too
    find_words = "running · dev servers · background";
    /// the screen's head under its title: how many run, in how many projects (`3 running in 1 project`)
    running_in(count, n) = one "{count} running in {n} project" | "{count} running in {n} projects";
    /// the search field's placeholder (`/` focuses it)
    search = "search";
    /// the output's head: open its address
    open = "Open";
    /// the tip of a thread's `$` row whose command runs in the background (`∿ 14 min`)
    tip_thread_row = "open its output";
    /// the output's head: stop it
    stop = "Stop";
    /// the output's find: its button's VoiceOver name and the find field's placeholder
    key_find = "find";
    /// the output's find button's tip, with its key
    find_tip = "find · ⌘F";
    /// the state filter, for VoiceOver (bise fait mac's segmented filter)
    filter_label = "show";

    // ---- the desktop's process panel (app/panel ProcPanel, designer's page process-panel; the
    // glyphs ∿ ✓ ✗ – · before the pills are the client's)
    /// the pill while it runs: `running · 4 min`
    pill_running(age) = "running · {age}";
    /// the pill, it ended well: `exit 0 · ran 2 min 14 s`
    pill_ok(rc, dur) = "exit {rc} · ran {dur}";
    /// the pill, it failed: `exit 1 · after 38 s`
    pill_failed(rc, dur) = "exit {rc} · after {dur}";
    /// the pill, he stopped it: `stopped by you · 14:21`
    pill_by_you(at) = "stopped by you · {at}";
    /// the pill, it stopped with its agent: `stopped with perf · 14:21`
    pill_with(agent, at) = "stopped with {agent} · {at}";
    /// the pill, it ended and its code isn't known
    pill_no_rc = "ended · no exit code";
    /// the running pill's tip
    tip_running = "running: bise checks it every 2 s while this is open";
    /// the exit 0 pill's tip
    tip_ok = "exit 0: the command ended well";
    /// a failed pill's tip: `exit 1: the command reported a failure`
    tip_failed(rc) = "exit {rc}: the command reported a failure";
    /// the stopped by you pill's tip
    tip_by_you = "you stopped it from bise";
    /// the stopped with its agent pill's tip: `it stopped when perf stopped, …`
    tip_with(agent) = "it stopped when {agent} stopped, or when its hub quit";
    /// the no exit code pill's tip
    tip_no_rc = "it ended, but bise couldn't read its exit code (it ran outside its agent's commands)";
    /// the meta line's start, before the agent's name (clickable: its thread)
    meta_by = "started by";
    /// the meta line, where it runs: `in acme › perf`
    meta_in(place) = "in {place}";
    /// the meta line, when it ended: `ended 13:42`
    meta_ended(at) = "ended {at}";
    /// the meta line, how long a stopped one ran: `ran 23 min`
    meta_ran(dur) = "ran {dur}";
    /// the meta line, its tree: `3 processes`
    meta_procs(n) = one "{n} process" | "{n} processes";
    /// the command's folder, under it: `in ~/acme/docs`
    cmd_in(cwd) = "in {cwd}";
    /// the command's copy, on hover
    copy = "copy";
    /// copied
    copied = "copied";
    /// the resources' head
    resources = "Resources";
    /// beside it while it runs
    resources_live = "every 2 s · the last 2 min";
    /// beside it once it ended (the curves at half)
    resources_ended = "while it ran";
    /// the curves' and the port's labels
    label_cpu = "CPU";
    /// the memory curve's label
    label_memory = "Memory";
    /// the port's label
    label_listening = "Listening";
    /// it listens on no port
    listening_none = "none";
    /// a curve's numbers while it runs: `12 % · peak 64 %`
    now_peak_pct(now, peak) = "{now} % · peak {peak} %";
    /// once it ended: `peak 380 %`
    peak_pct(peak) = "peak {peak} %";
    /// memory: `412 MB · peak 520 MB`
    now_peak_mem(now, peak) = "{now} · peak {peak}";
    /// memory once it ended: `peak 1.2 GB`
    peak_mem(peak) = "peak {peak}";
    /// a point's tip on a curve: `64 % · 14:05:12`
    point(v, at) = "{v} · {at}";
    /// the output's head
    output = "Output";
    /// beside it while it runs
    output_follows = "follows the end";
    /// beside it once it ended: `1,284 lines`
    output_lines(n) = one "{n} line" | "{n} lines";
    /// beside it when it failed: the output opened on its first error
    output_first_error = "scrolled to the first error";
    /// why no output is kept (by where its stdout points, Fd1, and its command)
    why_tmux = "No output kept: it writes to a tmux session, not to a file bise can read.";
    /// under the tmux why, before its command
    todo_tmux = "To see it, attach to the session in a terminal:";
    /// the tmux line's command: `tmux attach -t docs`
    tmux_attach(name) = "tmux attach -t {name}";
    /// the tmux line's button
    copy_command = "copy the command";
    /// its command sends its output to /dev/null (or fd 1 is /dev/null)
    why_null = "No output kept: it throws its output away (> /dev/null).";
    /// its command pipes into a program: `… (| grep).`
    why_pipe_to(prog) = "No output kept: its output goes into another program (| {prog}).";
    /// fd 1 is a pipe, the program not known
    why_pipe = "No output kept: its output goes into another program.";
    /// under a pipe's why
    todo_pipe = "Only what that program shows would be readable, and it writes nowhere either.";
    /// fd 1 is a terminal (not tmux)
    why_tty = "No output kept: it writes to a terminal, not to a file bise can read.";
    /// fd 1 is a socket
    why_socket = "No output kept: it writes to a network connection.";
    /// no fd 1
    why_closed = "No output kept: it has nowhere to write.";
    /// where fd 1 points isn't known
    why_unknown = "No output kept: it doesn't write to a file bise can read.";
    /// a running one that printed nothing yet
    empty_yet = "Nothing printed yet.";
    /// under it: `Running for 40 s. …`
    todo_yet(age) = "Running for {age}. Its output shows here as soon as it writes.";
    /// one that ended without printing
    silent_ended = "It ended without printing anything.";
    /// the panel when its hub no longer lists it (gone past 24 h, or its hub away)
    gone = "This process isn't listed anymore: it ended more than a day ago, or its project's hub isn't running.";
}
