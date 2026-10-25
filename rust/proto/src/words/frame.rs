//! The frame area's UI words (see [`super`]: the rules, how to read them):
//! the desktop window's frame since bise fait mac (page native-mac §6,
//! mockup 1): its bar, its rail, its sidebar (apps/desktop/src/app's
//! Frame.tsx, SideRail.tsx, Sidebar.tsx, newagent.tsx). The places' own
//! names (inbox, scheduled, artifacts, plugins, bise) are `panel`'s, read
//! there. Sentence case as the mockups say them; designer signs them.

crate::words! { frame:
    /// the sidebar's first row and the new agent sheet's head (⌘N): start
    /// a new agent in the project in view
    new_agent = "New agent";
    /// the new agent sheet's head, under it: the project
    new_agent_in(project) = "in {project}";
    /// the sidebar's second row: the agent palette (⌘K)
    search = "Search";
    /// the sidebar's label over the agents he pinned
    pinned = "Pinned";
    /// the sidebar's label over his projects; on the artifacts library, the
    /// row that goes back to them ('← Projects')
    projects = "Projects";
    /// after a project's first 4 agents, the row that shows the rest
    show_more(n) = "Show {n} more";
    /// the same row once open: back to the first 4
    show_less = "Show less";
    /// the rail's VoiceOver name
    places = "places";
    /// a control's hover tip with its key ('inbox · ⌘I')
    tip_key(what, key) = "{what} · {key}";
    /// the bar's sidebar button, its VoiceOver name while the sidebar shows
    hide_sidebar = "hide sidebar";
    /// the same button while the sidebar is hidden
    show_sidebar = "show sidebar";
    /// the bar's back arrow (⌘[)
    back = "back";
    /// the bar's forward arrow (⌘])
    forward = "forward";
    /// the rail's last button: settings (⌘,)
    settings = "settings";
    /// the sidebar border's VoiceOver name (drag it, or ←/→)
    sidebar_width = "sidebar width";
}
