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

    // ---- the office on or off over the AGENTS rows (the title bar's icon), and its width (the AGENTS head)
    /// the office's name for a screen reader: the agents in it, above the list
    view_bims_tip = "the agents in their office, above the list";
    /// the title bar's icon that opens or closes the office (pressed while it shows); its tip (designer m_28198)
    title_bims_tip = "bims: your agents in their office";
    /// the width switch: the bar at 320 px
    width_narrow = "320";
    /// the width switch: the wide bar
    width_wide = "wide";
    /// the narrow width's tip
    width_narrow_tip = "the bar at 320 px, the office fit to it";
    /// the wide width's tip
    width_wide_tip = "the bar at 640 px while the office shows";
    /// the AGENTS head's control that hides the office while it shows, after the width switch (his ask, bims-fix: he couldn't find how to hide it)
    hide = "hide";
    /// its tip: the title bar's cube opens it again (designer m_28303)
    hide_tip = "hide the office · the cube in the title bar brings it back";
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

    // ---- the office grows with the project (page bims-office v14 "un bureau qui grandit"): what
    // each building stage brings (growth.ts's table: stage 1 at 1 job done ... stage 14 at 1000)
    /// stage 1: a plant, and a first deck chair outside
    stage_1 = "a plant and a deck chair";
    /// stage 2: the short island with a fruit bowl, a first tree
    stage_2 = "the kitchen island";
    /// stage 3: a rug and two bean bags
    stage_3 = "the lounge";
    /// stage 4: the whiteboard, a 2nd plant, a 2nd deck chair
    stage_4 = "the whiteboard";
    /// stage 5: the "bise :*" mural, the boombox, 4 bean bags
    stage_5 = "the mural and the boombox";
    /// stage 6: the island grows, a 2nd fruit bowl, flowers
    stage_6 = "a longer island";
    /// stage 7: the parasol, the palm, 4 deck chairs
    stage_7 = "the terrace";
    /// stage 8: trees all round, 8 bean bags
    stage_8 = "trees all round";
    /// stage 9
    stage_9 = "the skate ramp";
    /// stage 10: a bigger ground, the fountain, 8 deck chairs
    stage_10 = "the fountain";
    /// stage 11: in the lounge
    stage_11 = "the arcade cabinet";
    /// stage 12: a pond with a little dock
    stage_12 = "the pond";
    /// stage 13: floating by the office
    stage_13 = "the balloon";
    /// stage 14: the last one, in the garden
    stage_14 = "main's golden statue";
    /// the event label 3 s over the new piece as two bims carry it in
    grow_new(thing) = "new: {thing}";
    /// the tip on the ground's corner: the level, the jobs done, the next piece and when
    grow_tip(n, level, thing, at) = one "level {level} · {n} job done · next: {thing} at {at}" | "level {level} · {n} jobs done · next: {thing} at {at}";
    /// the same at the last level
    grow_tip_top(n, level) = one "level {level} · {n} job done" | "level {level} · {n} jobs done";

    // ---- the office's map (/bims in the composer, page bims-maps v7): its name, its mood
    /// a map: the island in the middle (the first one)
    map_loft = "Loft";
    map_loft_mood = "the kitchen island in the middle, bean bags at the back";
    /// a map: desks in a ring round a tree
    map_greenhouse = "Greenhouse";
    map_greenhouse_mood = "desks in a ring round a tree, glass walls";
    /// a map: pods of four
    map_campus = "Campus";
    map_campus_mood = "pods of four, a long counter, steps to sit on";
    /// a map: a garage
    map_workshop = "Workshop";
    map_workshop_mood = "a garage: a workbench, ping-pong, the door rolled up";
    /// a map: a machiya
    map_kyoto = "Kyoto";
    map_kyoto_mood = "low tables on tatami round a small garden";
    /// a map: a riad
    map_riad = "Riad";
    map_riad_mood = "galleries round a patio and its fountain";
    /// a map: a wooden house
    map_nordic = "Nordic";
    map_nordic_mood = "one long wooden table, a stove, a sauna outside";
    /// a map: a Mexican patio house
    map_patio = "Patio";
    map_patio_mood = "coloured walls round a patio, hammocks for naps";
    /// a map: a haveli
    map_haveli = "Haveli";
    map_haveli_mood = "a courtyard with arcades, a chai stall, a swing";
    /// a map: a tropical house
    map_tropical = "Tropical";
    map_tropical_mood = "desks on a curve, a juice bar, hammocks";
    /// a map: white cubes
    map_cyclades = "Cyclades";
    map_cyclades_mood = "little white cubes up steps, blue tables";
    /// a map: a yard round a baobab
    map_sahel = "Sahel";
    map_sahel_mood = "a shade hangar round a yard and its baobab";
    /// a map: the office and its skatepark
    map_california = "California";
    map_california_mood = "a stucco office and a concrete skatepark";
    /// the /bims picker's tip on its row: what picking it does
    map_pick_tip(map) = "draw this project's office as the {map}";
    /// the tip on the row of the map it has now
    map_current_tip(map) = "this project's office is the {map} now";
}
