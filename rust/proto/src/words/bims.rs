//! The bims area's UI words (see [`super`]: the rules, how to read them):
//! les bims, the right bar's AGENTS section drawn as an office
//! (apps/desktop/src/bims, spec les-bims-sc-narios-du-bureau §2): the
//! event labels over a bim, the hover tip's state, the pills' tips and the
//! bar's bims toggle and the camera's fit. Which word for which activity stays in
//! labels.ts; an ordinal (`2nd`) is a TS fn.

crate::words! { bims:
    // ---- an event over a bim, 3 s after its activity changes (`name · done`)
    /// event: it came in by the door
    ev_started = "started";
    /// event and the hover's state: at work at its desk (main at the big desk too)
    working = "working";
    /// event: its turn has run long (over 10 min)
    ev_running_hot = "running hot";
    /// event: it went to sleep on a watch (a timer, a pid, a file); the hover's state with no watch
    waiting = "waiting";
    /// event: it waits on another agent's reply
    ev_waits_on(agent) = "waits on {agent}";
    /// event and the hover's state: it asks him something (the '?' pill)
    asks_you = "asks you";
    /// event and the hover's state: first in main's land queue, it lands now
    landing = "landing";
    /// event: it joined main's land queue past the first
    ev_in_line = "waits to land";
    /// event: its work landed and it is done
    ev_landed = "landed";
    /// event and the hover's state: it is done (the terrace is the picture, the title says what it did)
    done = "done";
    /// event and the hover's state: it failed (the '✗' pill)
    failed = "failed";
    /// event and the hover's state: blocked, no card for him
    blocked = "blocked";
    /// event: he stopped it
    ev_stopped = "stopped";
    /// the hover's state: idle (in the lounge, on a snack trip, main with the paper: office life
    /// never reaches a word); event: main back to idle after it asked or failed
    idle = "idle";

    // ---- the hover card's state, its second line, between the name and the title
    /// state: a long turn, at its desk
    state_hot = "working · running hot";
    /// state: asleep at its desk until its watch ends (its first watch's name: `cargo test`)
    state_waiting_for(what) = "waiting · for {what}";
    /// state: asleep at its desk until another agent answers
    state_waits_on(agent) = "waiting on {agent}";
    /// state: asks him, a tool call waits for his yes
    state_urgent = "asks you · a tool waits for your yes";
    /// state: in main's land queue at that rank (`2nd`)
    state_in_line(nth) = "waits to land · {nth}";
    /// state: he stopped it, its lamp is off
    state_stopped = "stopped by you";
    /// state: it is coming in
    state_starting = "starting";

    // ---- the pills, the only part of the office that takes the pointer
    /// the '?' pill's tip
    pill_asks_tip(agent) = "{agent} asks you. click opens it";
    /// the '✗' pill's tip
    pill_failed_tip(agent) = "{agent} failed. click opens it";

    // ---- the bar's AGENTS head: the office on or off over the rows, and its width
    /// the toggle: the office above the rows (pressed) or the rows alone
    view_bims = "bims";
    /// the toggle's tip
    view_bims_tip = "the agents in their office, above the list";
    /// the width switch: the bar at 320 px
    width_narrow = "320";
    /// the width switch: the wide bar
    width_wide = "wide";
    /// the narrow width's tip
    width_narrow_tip = "the bar at 320 px, the office fit to it";
    /// the wide width's tip
    width_wide_tip = "the bar at 640 px while the office shows";
    /// one line over the list when the office can't draw (WebGL lost)
    lost = "can't draw the office here";

    // ---- his camera: pinch to zoom, two fingers or a drag to move
    /// the button back to the whole office, in its top-right corner while zoomed
    fit = "fit";
    /// its tip
    fit_tip = "back to the whole office";

    // ---- ctrl held: every name that has room near its bim (designer m_27799)
    /// the office's bottom-right corner when names had no room, so 'every name' never quietly lies
    held_left_out(n) = one "+{n} name · hover a bim" | "+{n} names · hover a bim";
}
