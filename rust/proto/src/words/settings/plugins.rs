//! The Plugins list's words: what `bend_plugins::catalog::rows` puts in
//! the rows (the skills folders' titles and places, an MCP server's
//! status), then the terminal's Plugins screen (`/plugins`, `/skills`:
//! rust/tui/src/plugins_screen.rs), from plugins-ui's screens (page
//! plugins §4-§6).

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
    /// Plugins list: a stdio MCP server whose tools are listed, not running
    /// (it starts on an agent's first call)
    plugins_listed(n) = one "{n} tool · starts when used" | "{n} tools · starts when used";
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

    // ---- the terminal's Plugins screen ----

    /// /plugins: the screen's name on the frame
    plugins_screen = "plugins";
    /// /plugins: the head's question
    plugins_question = "what can your agents use?";
    /// /plugins: under the question, wide
    plugins_all_on_wide = "all on unless you turn one off, in every project.";
    /// /plugins: under the question, narrow
    plugins_all_on = "all on unless you turn one off.";
    /// /plugins: the head's counts, right
    plugins_counts(installed, browsable) = "{installed} installed · {browsable} to browse";
    /// /plugins: the filter, empty
    plugins_filter_hint = "type to filter";
    /// /plugins: the kind tabs
    plugins_kind_all = "all";
    /// /plugins: the kind tab and group of real plugins
    plugins_kind_plugins = "plugins";
    /// /plugins: the kind tab of Mistral connectors
    plugins_kind_mistral = "Mistral";
    /// /plugins: the kind tab of MCP servers
    plugins_kind_mcp = "MCP";
    /// /plugins: the kind tab and group of skills folders
    plugins_kind_skills = "skills";
    /// /plugins: the group of Mistral connectors
    plugins_group_mistral = "Mistral connectors";
    /// /plugins: the group of MCP servers
    plugins_group_mcp = "MCP servers";
    /// /plugins: a row's mark, on
    plugins_mark_on = "on";
    /// /plugins: a row's mark, off
    plugins_mark_off = "off";
    /// /plugins: a row shipped with bise
    plugins_built_in = "built-in";
    /// /plugins: a locked row's right side
    plugins_always_on = "always on";
    /// /plugins: a row's skills
    plugins_n_skills(n) = one "{n} skill" | "{n} skills";
    /// /plugins: a row's tools
    plugins_n_tools(n) = one "{n} tool" | "{n} tools";
    /// /plugins: a row's MCP servers (their tools not counted yet)
    plugins_n_servers(n) = one "{n} server" | "{n} servers";
    /// /plugins: a connector with tools off
    plugins_on_of_tools(on, n) = "{on} of {n} tools";
    /// /plugins: tools off under a server
    plugins_n_off(n) = "{n} off";
    /// /plugins: a connector whose sign-in expired
    plugins_expired = "sign-in expired";
    /// /plugins: a connector to set up on Mistral's page
    plugins_needs_setup = "needs setting up";
    /// /plugins: a login open in his browser
    plugins_login_waiting = "your browser is open: finish the login there";
    /// /plugins: a login open, narrow
    plugins_login_waiting_short = "browser open";
    /// /plugins: the hint after an expired connector
    plugins_hint_connect_again = "c connects it again";
    /// /plugins: the hint after a connector to set up
    plugins_hint_set_up = "c opens its setup";
    /// /plugins: the hint after a server that needs a login
    plugins_hint_login = "l opens your browser";
    /// /plugins, narrow: the hint after an expired connector
    plugins_hint_connect_short = "c reconnects";
    /// /plugins, narrow: the hint after a connector to set up
    plugins_hint_set_up_short = "c sets it up";
    /// /plugins, narrow: the hint after a server that needs a login
    plugins_hint_login_short = "l logs in";
    /// /plugins: the divider's count, all on
    plugins_count_on(on) = "{on} on";
    /// /plugins: the divider's count with some off
    plugins_count_on_off(on, off) = "{on} on · {off} off";
    /// /plugins: after a toggle, off
    plugins_done_off(name, when) = "✓ {name} off · your agents lose it {when}";
    /// /plugins: after a toggle, on
    plugins_done_on(name, when) = "✓ {name} on · your agents get it {when}";
    /// /plugins: a change that reaches the prompt (a skill)
    plugins_next_turn = "at their next turn";
    /// /plugins: a change the tools see (a tool, a server, a connector)
    plugins_next_call = "at their next call";
    /// /plugins: a locked one
    plugins_locked(name) = "{name} is always on: bise's pages need it";
    /// /plugins: no row matches the filter
    plugins_none_match = "nothing matches";
    /// /plugins key bar: space
    plugins_key_toggle = "on/off";
    /// /plugins key bar: ⏎
    plugins_key_open = "open";
    /// /plugins key bar: tab
    plugins_key_kind = "kind";
    /// /plugins key bar: a
    plugins_key_add = "add";
    /// /plugins key bar: b
    plugins_key_browse = "browse";
    /// /plugins key bar: b in browse
    plugins_key_installed = "installed";
    /// /plugins key bar: esc
    plugins_key_back = "back";
    /// /plugins key bar: 1-3 on a page
    plugins_key_try = "try";
    /// /plugins key bar: ⏎ on a server
    plugins_key_fold = "fold";
    /// /plugins key bar: o on a page
    plugins_key_folder = "open folder";
    /// /plugins key bar: c
    plugins_key_connect = "connect";
    /// /plugins key bar: l
    plugins_key_login = "log in";
    /// /plugins key bar: ⏎ in a form
    plugins_key_next = "next";
    /// /plugins key bar: esc in a form
    plugins_key_cancel = "cancel";
    /// /plugins key bar: tab in a form
    plugins_key_field = "next field";
    /// /plugins key bar: ↑↓ in a list
    plugins_key_choose = "choose";

    /// a plugin's page: what it is, a real plugin
    plugins_is_plugin = "plugin";
    /// a plugin's page: what it is, a connector
    plugins_is_mistral = "Mistral connector";
    /// a plugin's page: what it is, an MCP server
    plugins_is_mcp = "MCP server";
    /// a plugin's page: what it is, a skills folder
    plugins_is_skills = "skills folder";
    /// a plugin's page: on
    plugins_on_everywhere = "on for every project";
    /// a plugin's page: off
    plugins_off_everywhere = "off for every project";
    /// a plugin's page: when a change reaches his agents
    plugins_change_when(when) = "your agents get a change {when}";
    /// a plugin's page: the try block's head, wide
    plugins_try_head_wide = "try it · 1-3 puts it in main's composer";
    /// a plugin's page: the try block's head, narrow
    plugins_try_head = "try it · 1-3";
    /// a plugin's page: its skills
    plugins_part_skills(n) = "skills · {n}";
    /// a plugin's page: its MCP servers
    plugins_part_servers(n) = "MCP servers · {n}";
    /// a plugin's page: a connector's tools
    plugins_part_tools(n) = "tools · {n}";
    /// a plugin's page: a server's tools, shown
    plugins_tools_open = "▾ tools";
    /// a plugin's page: a server's tools, folded
    plugins_tools_folded = "▸ tools";
    /// a plugin's page: the tools not shown
    plugins_more_tools(n) = "▸ {n} more";

    /// browse: the head's question
    plugins_browse_question = "what can you add?";
    /// browse: under it
    plugins_browse_sub = "Mistral's connectors first, then your marketplaces.";
    /// browse: nothing to add
    plugins_browse_empty = "nothing to browse: a marks a marketplace";
    /// browse: an item's hint, connect
    plugins_browse_connect = "c connects it";
    /// browse: an item's hint, set up
    plugins_browse_set_up = "c opens its setup";
    /// browse: an item's hint, a marketplace plugin
    plugins_browse_add = "⏎ adds it";
    /// connect: his browser opens
    plugins_connecting(name) = "connecting {name}: finish it in your browser";

    /// add: the menu's head
    plugins_add_question = "what do you want to add?";
    /// add: an MCP server
    plugins_add_mcp = "add an MCP server";
    /// add: an MCP server, what
    plugins_add_mcp_what = "a command or a URL";
    /// add: import
    plugins_add_import = "import";
    /// add: import, what
    plugins_add_import_what = "MCP servers of Claude Code, Codex and Cursor";
    /// add: import, what was found
    plugins_add_import_found(found) = "found on this Mac: {found}";
    /// add: a plugin
    plugins_add_plugin = "add a plugin";
    /// add: a plugin, what
    plugins_add_plugin_what = "a folder or a git URL";
    /// add: a marketplace
    plugins_add_market = "add a marketplace";
    /// add: a marketplace, what
    plugins_add_market_what = "a git repo of plugins, like openai/plugins";
    /// add: an agent makes one
    plugins_add_agent = "make a plugin with an agent";
    /// add: an agent makes one, what
    plugins_add_agent_what = "say what it should do; an agent builds it";
    /// add an MCP server: under the head
    plugins_mcp_sub = "a server gives your agents new tools. it runs on this Mac, or bise reaches it at a URL";
    /// add an MCP server: the name field
    plugins_field_name = "name";
    /// add an MCP server: command or URL
    plugins_field_target = "a command or a URL";
    /// add an MCP server: the environment field
    plugins_field_env = "environment";
    /// add an MCP server: the environment hint
    plugins_field_env_hint = "KEY=value, one per line, ; between them here";
    /// add an MCP server: where its secrets go
    plugins_secrets_where = "kept in bise's secrets (your keychain if you turned it on), never in the repo";
    /// add a plugin: the source field
    plugins_field_source = "a folder or a git URL";
    /// add a marketplace: the URL field
    plugins_field_market = "git URL";
    /// add a marketplace: done
    plugins_market_added(url) = "✓ {url} added: b browses it";
    /// make a plugin: under the head
    plugins_agent_sub = "an agent writes it with the plugin-creator skill, tests it and asks you before it adds it";
    /// make a plugin: the field
    plugins_agent_field = "what should it do?";
    /// make a plugin: sent
    plugins_agent_started = "✓ main starts an agent for it: it shows in your agents";
    /// import: the head
    plugins_import_head = "import MCP servers";
    /// import: under it
    plugins_import_sub = "found in your other agents' settings. each becomes a plugin in ~/.agents/plugins; bise never changes their files";
    /// import: an item already in
    plugins_import_added(name) = "already added as {name}";
    /// import: nothing found
    plugins_import_none = "no MCP server found in Claude Code, Codex or Cursor's settings";
    /// add: getting the preview (a clone, a check)
    plugins_staging = "looking at it…";
    /// the preview: its question
    plugins_preview_head(name) = "add {name}?";
    /// the preview: where from, what runs
    plugins_preview_from(from) = "from {from}. once on, this runs on your Mac with your rights:";
    /// the preview: nothing runs
    plugins_preview_nothing = "no MCP server, nothing that leaves your Mac.";
    /// the preview: its skills
    plugins_preview_skills(n) = one "{n} skill, text your agents read:" | "{n} skills, text your agents read:";
    /// the preview: a re-import replaces
    plugins_preview_replaces(name) = "replaces {name}";
    /// the preview: the skills' label
    plugins_preview_label_skills = "skills";
    /// the preview: the secrets' label
    plugins_preview_label_secrets = "secrets";
    /// the preview: the label of what the config had that bise leaves out
    plugins_preview_label_dropped = "left out";
    /// the preview: after
    plugins_preview_after = "you can turn any part off after.";
    /// the preview's key: add
    plugins_key_add_run = "add and run it";
    /// added
    plugins_added(name) = "✓ {name} added · your agents get it at their next turn";
    /// add failed: the name is taken
    plugins_err_exists(name) = "{name} is already a plugin: pick another name";
    /// add failed: a bad name
    plugins_err_bad_name(name) = "{name} can't be a plugin's name: letters, digits, - and _";
    /// add failed: no plugin there
    plugins_err_no_plugin = "no plugin.json there";
    /// add failed: its manifest is wrong
    plugins_err_invalid = "its plugin.json is wrong:";
    /// add failed: no server
    plugins_err_no_server = "no MCP server in it";
    /// add failed: the rest, with why
    plugins_err_why(why) = "it didn't work: {why}";

    /// /skills with a wrong argument
    skills_usage = "usage: /skills | /skills on ID | /skills off ID";
    /// /plugins refresh: done
    plugins_refreshed = "Mistral's connectors read again";
    /// /plugins refresh: failed, the last good ones kept
    plugins_refresh_failed(why) = "Mistral's connectors not read again ({why}): the last ones stay";
    /// the composer's /plugins on|off popup: a part's line
    plugins_choice_part(kind, owner, state) = "a {kind} of {owner} · {state}";
    /// the composer's popup: a skill
    plugins_part_skill = "skill";
    /// the composer's popup: a server
    plugins_part_server = "server";
    /// the composer's popup: a tool
    plugins_part_tool = "tool";
    /// add failed: the preview is gone
    plugins_err_gone = "that preview is gone: add it again";
    /// connect: done
    plugins_connect_done(name) = "✓ {name} connected · your agents get it at their next call";
}
