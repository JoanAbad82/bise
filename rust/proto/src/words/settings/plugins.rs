//! The Plugins list's words, as `bend_plugins::catalog::rows` puts them
//! in the rows (plugins-ui's screens, page plugins): the skills folders'
//! titles and places, an MCP server's status.

crate::words! { settings:
    /// Plugins list: the skills folder `skills:personal`
    plugins_personal_title = "personal skills";
    /// Plugins list: where `skills:personal` is
    plugins_personal_where = "~/.agents/skills";
    /// Plugins list: the skills folder `skills:vibe`
    plugins_vibe_title = "Vibe skills";
    /// Plugins list: where `skills:vibe` is
    plugins_vibe_where = "~/.vibe/skills";
    /// Plugins list: the project's skills folder (`skills:workspace`)
    plugins_project_title(project) = "{project} skills";
    /// Plugins list: where `skills:workspace` is
    plugins_project_where(project) = "{project}/.agents/skills · this project only";
    /// Plugins list: bise's own skills (`skills:bise`, always on)
    plugins_bise_title = "bise";
    /// Plugins list: what bise's own skills are
    plugins_bise_what = "bise's own skills: pages, notes, the group";
    /// Plugins list: an MCP server that answered
    plugins_connected(n) = one "connected · {n} tool" | "connected · {n} tools";
    /// Plugins list: a remote MCP server that said it needs a login
    plugins_part_needs_login = "needs a login";
    /// Plugins list: a remote MCP server logged in, before a session listed it
    plugins_logged_in = "logged in";
    /// Plugins list: a remote MCP server logged in, its tools counted
    plugins_logged_in_tools(n) = one "logged in · {n} tool" | "logged in · {n} tools";
    /// Plugins list: a remote MCP server not logged in yet
    plugins_not_logged_in = "not logged in";
    /// Plugins list: a remote MCP server whose login is open in his browser
    plugins_login_pending = "logging in, in your browser";
    /// Plugins list: an MCP server that failed (why: its one line)
    plugins_failed(why) = "✗ {why}";
}
