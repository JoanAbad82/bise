//! The pages area's UI words (see [`super`]: the rules, how to read
//! them): the desktop's project pages of bise fait mac (nm-pages-b, page
//! native-mac §6 and §9): agents and archived, changes, pull requests,
//! environments, the crash report and the update log, and an agent's
//! sheet (Rename…, Change Model…: designer m_43315). Chrome labels in
//! sentence case (designer m_43052), bise's own words lowercase. The
//! banners' titles, sentences and facts are [`super::hero`]'s.

crate::words! { pages:
    // ---- agents and archived
    /// the agents page's filter: the live ones
    agents_live = "Live";
    /// the agents page's filter: the archived ones
    agents_archived = "Archived";
    /// the agents page's filter's VoiceOver name
    agents_show = "show";
    /// the agents page's action under its banner: opens the new agent sheet
    new_agent = "New agent";
    /// an agent row's state mark tip: it waits for his answer
    asks_you = "asks you";
    /// an agent row's state mark tip: it waits on another agent
    waits_on_agent = "waits on another agent";
    /// an agent row's state mark tip: it finished its job
    done = "done";
    /// an archived row's state mark tip: it was stopped before it finished
    stopped = "stopped";

    // ---- an agent's sheet (Rename…, Change Model…)
    /// its row: the agent's name
    tune_name = "Name";
    /// its row: the model it runs
    tune_model = "Model";
    /// its row: the reasoning effort
    tune_reasoning = "Reasoning";
    /// its row: any model id typed
    tune_or_id = "Or an id";
    /// the model id field's placeholder
    tune_id_placeholder = "provider/model";
    /// the model id field's button
    tune_use_it = "Use it";
    /// the sheet's one button: it closes
    tune_done = "Done";
    /// while the hub renames it
    tune_renaming = "renaming…";
    /// no model list yet
    tune_models_wait = "the list comes from the hub";
    /// a model with no reasoning setting
    tune_no_reasoning(model) = "{model} has no reasoning setting";

    // ---- changes
    /// a group: the project's features
    group_features = "Features";
    /// a group: the branches (the agents' worktrees and his)
    group_branches = "Branches";
    /// a group: what reached main today
    group_merged = "Merged today";
    /// the row that opens the pull requests page
    prs_row = "Pull requests";
    /// the pull requests row while GitHub answers
    prs_asking = "asking GitHub…";
    /// the pull requests row with none open
    prs_none_open = "none open";
    /// no branch: the empty state's title
    no_branches = "no branches";
    /// no branch: why
    no_branches_why = "its agents work in the shared folder";
    /// nothing merged today
    nothing_merged = "nothing merged today";
    /// a branch row with no branch name
    detached = "detached";
    /// a branch row's owner when no agent works on it: his
    yours = "yours";

    // ---- pull requests
    /// no PR open: the empty state's title
    no_pr = "no open PR";

    // ---- environments
    /// the project's checkout every agent without a worktree works in
    shared_folder = "the shared folder";
    /// nobody works here
    no_places = "no agents at work here";
    /// a server row's state mark tip
    server_up = "running";

    // ---- the crash report and the update log
    /// copies the report's text
    copy = "Copy";
    /// after the copy
    copied = "Copied";
    /// shows the report's file in Finder
    show_in_finder = "Show in Finder";
    /// no crash report
    no_crash = "no crash report: bise hasn't crashed.";
    /// no update log
    no_update_log = "no update log: this app never updated itself.";

    // ---- a branch with no agent on it (route branch)
    /// the branch page's sub head
    a_branch = "a branch";
    /// no agent works on it: the empty state's title
    branch_no_agent = "no agent works on this branch";
    /// why it can't be diffed
    branch_no_diff = "its diff needs an agent on it for now.";
    /// the link to the changes page
    see_changes = "see the changes";
}
