//! The side area's UI words (see [`super`]: the rules, how to read them):
//! the desktop's folded right side (bise fait mac, page native-mac §7):
//! the bims' world floating at the window's top right, the 3D bubbles
//! under it and their 360 cards (apps/desktop/src/app/side3d, nm-side).
//! Read only there; designer signs them.

crate::words! { side:
    /// the agents bubble and its card's head
    agents = "Agents";
    /// the artifacts bubble and its card's head
    artifacts = "Artifacts";
    /// the scheduled bubble and its card's head
    scheduled = "Scheduled";
    /// the processes bubble and its card's head
    processes = "Processes";
    /// the 5th bubble when the window has no room for the world: the office
    world = "the office";
    /// a bubble's VoiceOver name and hover tip: its name, then what it counts
    /// ('agents · 3 working, 1 asks')
    bubble_tip(name, says) = "{name} · {says}";
    /// what a bubble counts when it has nothing
    bubble_none = "nothing";
    /// a count of working agents (a bubble's tip, the agents card's head)
    working(n) = "{n} working";
    /// a count of agents that ask him something
    asks(n) = "{n} asking";
    /// a count of new artifacts
    new_count(n) = "{n} new";
    /// a count of artifacts (the artifacts bubble's tip)
    artifact_count(n) = one "{n} artifact" | "{n} artifacts";
    /// a count of running processes
    running(n) = "{n} running";
    /// a count of running processes that listen on a port (the processes card's head)
    listening(n) = "{n} listening";
    /// the agents bubble's bottom pill and its tip: the live agents working or
    /// waiting (on another agent or on him); main, idle, done, archived out
    active(n) = "{n} active";
    /// the agents bubble's top pill (the accent) and its tip: this scope's inbox
    waiting_you(n) = "{n} waiting for you";
    /// a count of timers (scheduled tasks)
    timers(n) = one "{n} timer" | "{n} timers";
    /// a count of watches (an agent waiting on a file or a process)
    watches(n) = one "{n} watch" | "{n} watches";
    /// the agents card's foot, left: the archived ones
    archived(n) = "{n} archived";
    /// the artifacts card's foot, left: how many, in how many projects (two
    /// or more; one project says artifact_count)
    in_projects(n, p) = "{n} in {p} projects";
    /// the agents card's foot: its full page
    all_agents = "all agents ›";
    /// the artifacts card's foot: its full page
    all_artifacts = "all artifacts ›";
    /// the processes card's foot: its full page
    all_processes = "all processes ›";
    /// the scheduled card's foot: its full page
    all_scheduled = "all scheduled ›";
    /// a card's head button: the same thing as a tab of the panel
    pin_tab = "open as a tab";
    /// the agents card's head '+': a new agent
    new_agent = "new agent";
    /// an agent's bubble in the agents card: it asks him something
    state_asks = "asks";
    /// an agent's bubble: it says something (its last report)
    state_talks = "talks";
    /// an agent's bubble: it works on something (what it says it does)
    state_thinks = "thinks";
    /// an agent's bubble: it waits, with nothing to say
    state_idle = "idle";
    /// the button of an asking agent's bubble that opens the question in the inbox, to answer in words
    answer = "answer…";
    /// the '?' on an asking agent's head, its tip
    asks_tip(agent) = "{agent} asks you something";
    /// the dot of a new artifact, its tip
    new_tip = "new";
    /// the dot of a running process, its tip
    running_tip = "running";
    /// the agents card with no agent in it
    no_agents = "no agents here yet";
    /// the artifacts card with nothing in it
    no_artifacts = "no artifacts yet";
    /// the processes card with nothing running
    no_processes = "nothing running.";
    /// the scheduled card with nothing in it
    no_scheduled = "nothing scheduled.";
    /// the world's legend: how many bims sit at their desks
    at_desks(n) = "{n} at their desks";
    /// the world's VoiceOver name, and its click's tip
    world_open(project) = "open {project}'s office in a tab";
    /// the world's legend's '↗', its tip
    world_open_tip = "open the office in a tab";
}
