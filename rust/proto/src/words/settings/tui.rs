//! The TUI's other settings words: `/plugins` (plugins.rs), the release
//! row (release_row.rs), `/version`'s subcommand rows (commands.rs).

crate::words! { settings:
    /// /plugins: a login already open
    plugins_login_open(name) = "the login to {name} is still open in your browser";
    /// /plugins: a login starts
    plugins_login_opening(name) = "opening your browser to log in to {name}…";
    /// /plugins: a server needs a login
    plugins_needs_login(name) = "{name} needs a login: /plugins login";
    /// /plugins login: none to log in
    plugins_no_login = "no remote MCP server that logs in (one without an Authorization header in its mcp.json)";
    /// /plugins logout: done
    plugins_logged_out(name) = "logged out of {name}.";
    /// /plugins enable|disable: done (state: enabled or disabled; unchanged: plugins_unchanged or nothing)
    plugins_set(name, state, unchanged) = "{name} {state}{unchanged} — applies at the next /reload";
    /// a plugin turned on
    plugins_enabled = "enabled";
    /// a plugin turned off
    plugins_disabled = "disabled";
    /// a plugin already in that state
    plugins_unchanged = " (unchanged)";
    /// /plugins with a wrong argument
    plugins_usage = "usage: /plugins [list] | /plugins enable NAME | /plugins disable NAME | /plugins login [NAME] | /plugins logout NAME";

    /// release row: the first release
    release_first = "the first release";
    /// release row: commits since the last tag
    release_since(n, since) = one "{n} commit since {since}" | "{n} commits since {since}";
    /// release row: its head (before the tag)
    release_head = "release ";
    /// release row: a dry run
    release_dry = " · dry run";
    /// release row: commits not listed
    release_more(n) = "and {n} more";
    /// release row: a step's folded lines
    release_more_lines(n) = one "▸ {n} more line" | "▸ {n} more lines";

    /// /version restart
    version_restart = "reload bise, nothing lost";
    /// /version update
    version_update = "look for a new bise release now";
    /// /version list
    version_list = "the installed versions";
    /// /version rollback
    version_rollback = "back to the version before";
}
