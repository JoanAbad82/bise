//! The menus area's UI words (see [`super`]: the rules, how to read them):
//! the desktop's native menus (bise fait mac, page native-mac mockup 9 and
//! decision d4): the '…' and the right click on an agent, a project, a
//! panel tab, an artifact, a process, a scheduled task, and the menu bar's
//! Agent menu (apps/desktop/src/app/menus/registry.ts builds them, macOS
//! draws them). English, as macOS's own menus; designer signs them.

crate::words! { menus:
    // ---- the menu bar
    /// the menu bar's menu of the agent in view (main/menu.ts)
    agent_menu = "Agent";

    // ---- an agent (d4's order)
    /// rename the agent (its thread head takes the new name)
    rename = "Rename";
    /// keep the agent at the top of the sidebar (a view state of the app)
    pin = "Pin";
    /// take it off the top of the sidebar
    unpin = "Unpin";
    /// the agent's changes, the review
    changes = "Changes";
    /// the submenu of what can be copied
    copy = "Copy";
    /// Copy › the agent's or the project's name
    copy_name = "Name";
    /// Copy › its folder (the worktree, the project's folder)
    copy_path = "Path";
    /// Copy › its git branch
    copy_branch = "Branch";
    /// Copy › the agent's last answer, as text
    copy_reply = "Last reply";
    /// Copy › an artifact's or a process's link
    copy_link = "Link";
    /// open it in a tab of the panel on the right
    move_right = "Move to right pane";
    /// open it in a window of its own
    new_window = "Open in new window";
    /// the submenu of the Mac apps it opens in
    open_in = "Open in";
    /// Open in › the Finder
    finder = "Finder";
    /// Open in › his code editor
    editor = "Editor";
    /// stop the agent's turn
    stop = "Stop";
    /// archive the agent (restore undoes it)
    archive = "Archive";
    /// bring an archived agent back
    restore = "Restore";

    // ---- an artifact, a process, a scheduled task
    /// macOS's Quick Look on its file
    quick_look = "Quick Look";
    /// its file selected in a Finder window
    show_in_finder = "Show in Finder";
    /// a process's page in his browser
    open_browser = "Open in browser";
    /// a process: stop it
    stop_process = "Stop process";
    /// a scheduled task: stop it
    stop_scheduled = "Stop schedule";

    // ---- a panel tab
    /// close the tab
    close_tab = "Close tab";
    /// close every other tab
    close_others = "Close other tabs";
    /// the terminal tab goes back to the bottom panel
    move_bottom = "Move to bottom";
}
