//! The first launch: the desktop's onboarding steps (setup/Onboarding.tsx)
//! and the demo's guided tips, the TUI's (tour.rs) and the desktop's
//! (setup/tour.ts). A tip's keys are holes: the TUI marks them `{⌥1}`, the
//! desktop draws them as keys.

crate::words! { settings:
    /// onboarding: the hello step's title
    onb_hello_title = "hi. i'm bise.";
    /// onboarding: the hello step's line
    onb_hello_sub = "hold fn and talk to me, from any app. i look after your projects with a team of agents, and i only ask you what needs you.";
    /// onboarding: the hello step's button
    onb_start = "start";
    /// onboarding: the permissions step's title
    onb_perms_title = "three permissions";
    /// onboarding: the permissions step's line
    onb_perms_sub = "nothing leaves unless you hold fn. you choose what i read in settings · privacy.";
    /// onboarding: a step's button
    onb_continue = "continue";
    /// onboarding: the permissions step's button, one not allowed
    onb_continue_for_now = "continue for now";
    /// onboarding: what the microphone is for
    onb_mic_sub = "to talk while you hold fn";
    /// onboarding: the microphone denied
    onb_mic_lost = "without it, fn can't hear you: you type in the spotlight instead";
    /// onboarding: what accessibility is for
    onb_accessibility_sub = "for fn everywhere, and to read the app in front (URL, file, selection)";
    /// onboarding: accessibility denied
    onb_accessibility_lost = "without it, fn works only in bise's own windows";
    /// onboarding: what screen recording is for
    onb_screen_sub = "for the capture fn adds to your question";
    /// onboarding: screen recording denied
    onb_screen_lost = "fn will send your words without a capture";
    /// onboarding: a permission allowed
    onb_allowed = "✓ allowed";
    /// onboarding: a permission denied
    onb_denied = "denied";
    /// onboarding: the model step's title
    onb_model_title = "which model?";
    /// onboarding: the model step's line
    onb_model_sub = "your subscription is enough. you can change it per project.";
    /// onboarding: the model step, not signed in
    onb_model_help = "sign in to one of them to go on";
    /// onboarding: a folder he chose by hand
    onb_chosen = "chosen";
    /// onboarding: a found repo's age
    onb_git(when) = "git · {when}";
    /// onboarding: the projects step's title
    onb_projects_title = "your projects";
    /// onboarding: the projects step, repos found
    onb_projects_found = "i found these repos in your folder. tick the ones bise should work in.";
    /// onboarding: the projects step, none found
    onb_projects_none = "bise works in your repos. choose the folder that has them.";
    /// onboarding: the projects step's button
    onb_add_projects(n) = one "add {n} project" | "add {n} projects";
    /// onboarding: the projects step's button, none ticked
    onb_no_project = "continue without a project";
    /// onboarding: the projects' filter
    onb_filter = "filter: type a name or a path";
    /// onboarding: the folder panel
    onb_choose = "choose a folder…";
    /// onboarding: no repo in the folder
    onb_no_repos = "no repos in this folder. choose a folder…, or continue without one.";
    /// onboarding: no repo matches the filter
    onb_no_match(q) = "no repo matches “{q}”. choose a folder…, or clear the filter.";
    /// onboarding: the fn step's title
    onb_fn_title = "try it: hold fn";
    /// onboarding: the fn step's line
    onb_fn_sub = "and say, for example, “what moved in storefront this week?”";
    /// onboarding: the fn step's button, tried
    onb_open = "open bise";
    /// onboarding: the fn step's button, not tried
    onb_open_untried = "open bise without trying";
    /// onboarding: the fn step, tried
    onb_fn_done = "✓ that's it: bise answers in the capsule, at the bottom of the screen.";
    /// onboarding: the fn step, not tried
    onb_fn_help = "fn space opens the spotlight · fn fn talks without holding";
    /// onboarding: a step back
    onb_back = "← back";
    /// onboarding: end it
    onb_skip = "skip for now";
    /// an age: a month ago
    age_month = "a month ago";

    /// tour: the agents appeared (key: the first one's, or the list's)
    tour_start(key, name) = "your team just started. they work on their own. {key} looks inside {name}. →";
    /// tour: inside a demo agent (others: tour_others, or nothing)
    tour_inside(name, others, esc) = "this is {name}'s own thread, live. {others}{esc} back to main.";
    /// tour: the other agents' keys
    tour_others(keys) = "{keys} the others · ";
    /// tour: who the card is about, when not a demo agent
    tour_your_team = "your team";
    /// tour: a card waits (key: the one that opens it)
    tour_card(who, key, one, two) = "{who} needs you. {key} opens the question, {one} or {two} answers. ↓";
    /// tour: a card waits, a click opens it (no ctrl digits)
    tour_card_click(who, click, one, two) = "{who} needs you. {click} the question, {one} or {two} answers. ↓";
    /// tour: the last agent waits for a word (how: tour_steer_how, or nothing)
    tour_steer(name, how, enter, got, read) = "{name} waits for a word from you: {how}type, {enter}. {got} it got it, {read} it read it.";
    /// tour: how to reach the agent that waits
    tour_steer_how(key) = "{key}, ";
    /// tour: who was archived, when not known
    tour_it = "it";
    /// tour: a demo agent was archived (rest: one of tour_end_*, or nothing)
    tour_end(gone, key, rest) = "that's it. {gone} is archived: {key} finds it.{rest}";
    /// tour: the end, one agent left
    tour_end_one(keys, name) = " {keys} opens {name}.";
    /// tour: the end, two agents left
    tour_end_two(keys) = " {keys} open the other two.";
    /// tour: the end, more agents left
    tour_end_more(keys) = " {keys} open the others.";
}
