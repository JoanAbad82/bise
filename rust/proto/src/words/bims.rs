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

    // ---- the office on or off over the AGENTS rows (the AGENTS head's cube), and its width
    /// the office's name for a screen reader: the agents in it, above the list
    view_bims_tip = "the agents in their office, above the list";
    /// the AGENTS head's cube, left of 'all ›', that opens or closes the office (pressed while it shows); its tip while the office is closed (designer m_28913)
    cube_open_tip = "show the bims: your agents in their office";
    /// its tip while the office shows
    cube_close_tip = "hide the office";
    /// the cube's label beside it, in the accent (his ask, main m_28901)
    cube_label = "the bims";
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
    /// the button back to the whole office, in its bottom-right corner while zoomed
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
    // ---- each map's own pieces (page bims-maps « comment chaque map grandit », bims m_28856): the
    // tag over a new piece and the corner tip name the map's, not the loft's (maps/<id>.ts things)
    /// stage 2 on a map that grows like the loft but has no kitchen island (greenhouse, campus, workshop)
    stage_fruit = "a fruit bowl and a tree";
    /// stage 6 on those maps
    stage_more_fruit = "more fruit and flowers";
    /// kyoto, stage 1: a bonsai by the door
    stage_kyoto_1 = "a bonsai";
    /// kyoto, stage 2: a bento on the counter, the first maple
    stage_kyoto_2 = "a bento and a maple";
    /// kyoto, stage 3: two floor cushions by the kotatsu
    stage_kyoto_3 = "the zabuton";
    /// kyoto, stage 4: a slate for the brush
    stage_kyoto_4 = "the slate";
    /// kyoto, stage 5: a painted wave, a wind bell under the eave
    stage_kyoto_5 = "the wave and the wind bell";
    /// kyoto, stage 6: a matcha set on the counter, moss in the garden
    stage_kyoto_6 = "the matcha set";
    /// kyoto, stage 7: a paper umbrella over the terrace
    stage_kyoto_7 = "the paper umbrella";
    /// kyoto, stage 8: maples all round, the kotatsu full
    stage_kyoto_8 = "maples all round";
    /// kyoto, stage 9: a goban by the engawa
    stage_kyoto_9 = "the go board";
    /// kyoto, stage 10: the bamboo that tips in the garden
    stage_kyoto_10 = "the shishi-odoshi";
    /// kyoto, stage 11: an old arcade cabinet by the kotatsu
    stage_kyoto_11 = "the arcade cabinet";
    /// kyoto, stage 12: a koi pond and its orange bridge
    stage_kyoto_12 = "the koi pond";
    /// kyoto, stage 13: carp streamers on a pole
    stage_kyoto_13 = "the koinobori";
    /// kyoto, stage 14: the last one, in the garden
    stage_kyoto_14 = "the golden maneki-neko";
    /// riad, stage 1: a pot of mint by the door
    stage_riad_1 = "a pot of mint";
    /// riad, stage 2: the tea tray, the first orange tree
    stage_riad_2 = "the tea tray";
    /// riad, stage 3: two leather poufs
    stage_riad_3 = "the poufs";
    /// riad, stage 4: a slate in carved plaster
    stage_riad_4 = "the slate";
    /// riad, stage 5: a rug on the wall, a drum
    stage_riad_5 = "the Berber rug and the darbouka";
    /// riad, stage 6: a tajine on the tea table, jasmine outside
    stage_riad_6 = "a tajine and jasmine";
    /// riad, stage 7: a canvas awning over the terrace
    stage_riad_7 = "the awning";
    /// riad, stage 8: the patio's four orange trees, the poufs full
    stage_riad_8 = "the four orange trees";
    /// riad, stage 9: a draughts board in the patio
    stage_riad_9 = "the draughts table";
    /// riad, stage 10: the fountain grows
    stage_riad_10 = "the fountain's second tier";
    /// riad, stage 11: a steaming hammam in the garden
    stage_riad_11 = "the hammam";
    /// riad, stage 12: a long basin edged in zellige
    stage_riad_12 = "the zellige basin";
    /// riad, stage 13: a balloon, the Atlas behind
    stage_riad_13 = "the balloon over the Atlas";
    /// riad, stage 14: the last one, in the garden
    stage_riad_14 = "the golden lantern";
    /// nordic, stage 1: a fern by the door
    stage_nordic_1 = "a fern";
    /// nordic, stage 2: buns on the counter, the first birch
    stage_nordic_2 = "kanelbullar and a birch";
    /// nordic, stage 3: two sheepskins by the stove
    stage_nordic_3 = "the sheepskins";
    /// nordic, stage 4: a blackboard in a pine frame
    stage_nordic_4 = "the blackboard";
    /// nordic, stage 5: a rug on the wall, a record player
    stage_nordic_5 = "the rya and the record player";
    /// nordic, stage 6: fika on the counter
    stage_nordic_6 = "blueberries and coffee";
    /// nordic, stage 7: a campfire and its log benches
    stage_nordic_7 = "the campfire";
    /// nordic, stage 8: firs all round, more sheepskins
    stage_nordic_8 = "firs all round";
    /// nordic, stage 9: a kubb game in the grass
    stage_nordic_9 = "the kubb set";
    /// nordic, stage 10: a steaming wooden tub
    stage_nordic_10 = "the hot tub";
    /// nordic, stage 11: the sauna grows a porch
    stage_nordic_11 = "the sauna's porch";
    /// nordic, stage 12: a lake to plunge in
    stage_nordic_12 = "the lake and its jetty";
    /// nordic, stage 13: a pole with flowers
    stage_nordic_13 = "the midsummer pole";
    /// nordic, stage 14: the last one, in the garden
    stage_nordic_14 = "the golden Dala horse";
    /// the climbing gym, stage 1: a bucket of chalk and the brushes by the wall
    stage_climb_1 = "the chalk bucket and brushes";
    /// the climbing gym, stage 2: fruit and a blender on the café bar
    stage_climb_2 = "the smoothie corner";
    /// the climbing gym, stage 3: a wooden board to hang from by the fingers
    stage_climb_3 = "the hangboard";
    /// the climbing gym, stage 4: plants hanging from the hall's beams
    stage_climb_4 = "the hanging plants";
    /// the climbing gym, stage 5: a long wooden bench by the mats, chalk bags and shoes on it
    stage_climb_5 = "the chalk-up bench";
    /// the climbing gym, stage 6: a small low wall with big holds for kids
    stage_climb_6 = "the kids' wall";
    /// the climbing gym, stage 7: a bell at the top of each problem, rung on a top-out
    stage_climb_7 = "the bell on top";
    /// the climbing gym, stage 8: the route setters' stacked crates of spare holds, a drill on top
    stage_climb_8 = "the hold crates";
    /// the climbing gym, stage 9: planters along the pavement out front
    stage_climb_9 = "the planted terrace";
    /// the climbing gym, stage 10: a glass room for yoga in the hall
    stage_climb_10 = "the yoga room";
    /// the climbing gym, stage 11: a small wooden sauna
    stage_climb_11 = "the sauna";
    /// the climbing gym, stage 12: a big freestanding boulder in the hall
    stage_climb_12 = "the boulder";
    /// the climbing gym, stage 13: a slackline between two posts
    stage_climb_13 = "the slackline";
    /// the climbing gym, stage 14: the last one, at the top of the big wall
    stage_climb_14 = "the golden hold";
    /// the event label 3 s over the new piece as two bims carry it in
    grow_new(thing) = "new: {thing}";
    /// the tip on the ground's corner: the level, the jobs done, the next piece and when
    grow_tip(n, level, thing, at) = one "level {level} · {n} job done · next: {thing} at {at}" | "level {level} · {n} jobs done · next: {thing} at {at}";
    /// the same at the last level
    grow_tip_top(n, level) = one "level {level} · {n} job done" | "level {level} · {n} jobs done";

    // ---- the office's map (/bims in the composer, page bims-maps v7): its name, its mood
    /// a map: the island in the middle (the first one)
    map_loft = "Loft";
    /// the Loft's mood, under its name in the /bims picker
    map_loft_mood = "the kitchen island in the middle, bean bags at the back";
    /// a map: desks in a ring round a tree
    map_greenhouse = "Greenhouse";
    /// the Greenhouse's mood, under its name in the /bims picker
    map_greenhouse_mood = "desks in a ring round a tree, glass walls";
    /// a map: pods of four
    map_campus = "Campus";
    /// the Campus's mood, under its name in the /bims picker
    map_campus_mood = "pods of four, a long counter, steps to sit on";
    /// a map: a garage
    map_workshop = "Workshop";
    /// the Workshop's mood, under its name in the /bims picker
    map_workshop_mood = "a garage: a workbench, ping-pong, the door rolled up";
    /// a map: a machiya
    map_kyoto = "Kyoto";
    /// Kyoto's mood, under its name in the /bims picker
    map_kyoto_mood = "low tables on tatami round a small garden";
    /// a map: a riad
    map_riad = "Riad";
    /// the Riad's mood, under its name in the /bims picker
    map_riad_mood = "galleries round a patio and its fountain";
    /// a map: a wooden house
    map_nordic = "Nordic";
    /// Nordic's mood, under its name in the /bims picker
    map_nordic_mood = "one long wooden table, a stove, a sauna outside";
    /// a map: a Mexican patio house
    map_patio = "Patio";
    /// the Patio's mood, under its name in the /bims picker
    map_patio_mood = "coloured walls round a patio, hammocks for naps";
    /// a map: a haveli
    map_haveli = "Haveli";
    /// the Haveli's mood, under its name in the /bims picker
    map_haveli_mood = "a courtyard with arcades, a chai stall, a swing";
    /// a map: a tropical house
    map_tropical = "Tropical";
    /// Tropical's mood, under its name in the /bims picker
    map_tropical_mood = "desks on a curve, a juice bar, hammocks";
    /// a map: white cubes
    map_cyclades = "Cyclades";
    /// the Cyclades' mood, under its name in the /bims picker
    map_cyclades_mood = "little white cubes up steps, blue tables";
    /// a map: a yard round a baobab
    map_sahel = "Sahel";
    /// Sahel's mood, under its name in the /bims picker
    map_sahel_mood = "a shade hangar round a yard and its baobab";
    /// a map: the office and its skatepark
    map_california = "California";
    /// California's mood, under its name in the /bims picker
    map_california_mood = "a stucco office and a concrete skatepark";
    /// a map: a bouldering gym in a Paris hall
    map_climb = "Climbing gym";
    /// the climbing gym's mood, under its name in the /bims picker
    map_climb_mood = "a café beside a bouldering wall, a Paris street";
    /// the /bims picker's tip on its row: what picking it does
    map_pick_tip(map) = "draw this project's office as the {map}";
    /// the tip on the row of the map it has now
    map_current_tip(map) = "this project's office is the {map} now";
    /// the map chip in the office's bottom-left corner (its words are the map's name): its name for a screen reader
    map_chip_label = "Change this office's map";
    /// the map chip's tip: the menu it opens is /bims's
    map_chip_tip = "map · /bims";

    // ---- the town on bise's thread (page bims-maps v9): one office per project, a sign in front
    /// the town's own label (its canvas, for a screen reader)
    town_label = "the town: one office per project";
    /// a sign's tip: a click on it (or on its office) dives into that office
    town_sign_tip(project) = "look inside {project}";
    /// a sign's label for a screen reader: its name, its agents at work, his open questions
    town_sign_label(project, at_work, asks) = "{project}: {at_work} working, {asks} asking you";
    /// the dived office's sign: opens the project's main thread
    town_open = "open";
    /// that sign's tip: what a click on it does
    town_open_tip(project) = "open {project}";
    /// the dived office's way back to the whole town (esc does it too)
    town_back = "town";
    /// that way back's tip: what a click on it does
    town_back_tip = "back to the whole town";

    // ---- California's skatepark (apps/desktop/src/bims/skate.ts): an idle bim skates there
    /// the hover's state of a skater: how long it has been idle (`12 min`), then what it does
    state_skating(dur) = "idle {dur} · skating";
    /// the hover's state of a climber (the climbing gym): how long it has been idle, then what it does
    state_climbing(dur) = "idle {dur} · climbing";
    /// a trick's name, 1.5 s over the bim the office follows (the 2.2x zoom), never in the normal view
    trick_drop_in = "drop in";
    /// a trick's name: pumping through the bowl for speed
    trick_pump = "pumps";
    /// a trick's name: the front truck over the coping, back down fakie
    trick_rock_to_fakie = "rock to fakie";
    /// a trick's name: both trucks stalled on the coping
    trick_axle_stall = "axle stall";
    /// a trick's name: a half turn, chest first
    trick_fs_180 = "frontside 180";
    /// a trick's name: a half turn, back first
    trick_bs_180 = "backside 180";
    /// a trick's name: the board pops up with the bim
    trick_ollie = "ollie";
    /// a trick's name: the board flips under the toes
    trick_kickflip = "kickflip";
    /// a trick's name: the board flips under the heel
    trick_heelflip = "heelflip";
    /// a trick's name: the board spins a half turn under the bim
    trick_shove_it = "pop shove-it";
    /// a trick's name: a kickflip and a full spin of the board
    trick_tre_flip = "360 flip";
    /// a trick's name: a grind on both trucks
    trick_fifty = "50-50";
    /// a trick's name: a grind on the back truck
    trick_five_o = "5-0";
    /// a trick's name: a slide on the board's middle
    trick_boardslide = "boardslide";
    /// a trick's name: a grind on the front truck
    trick_nosegrind = "nosegrind";
    /// a trick's name: rolling on the back wheels
    trick_manual = "manual";
    /// a trick's name: a foot down, the board popped round it
    trick_no_comply = "no comply";
    /// a trick's name: a long turn along the bowl's wall
    trick_carve = "carve";
    /// a trick's name: in the air above the coping, chest to the wall
    trick_fs_air = "frontside air";
    /// the 900 (two and a half turns in the air, Tony Hawk 1999), tried at the 900th job
    trick_nine = "900";
}
