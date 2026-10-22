# les bims: the spec

This is the dense reference for agents building or changing the bims: the animated office of agents in bise's desktop app, the town on bise's thread and the bise.dev/desktop hero film. The book's section "§6b. The bims" (docs/brand/bise-book.md) says why and in what tone. This file says what and where, and it wins on detail.

It points to the code and the checks and never copies them. When this file and the code disagree, the code's laws (the `*.test.ts` named below) are right, and this file gets fixed.

Reference shots: docs/brand/bims/ (office-noon-light, office-noon-dark, office-golden-dark, office-night-dark, workshop-30-desks-dark, kyoto-12-desks-light, california-30-desks-light).

## laws (the first one wins a tie)
1. **one bim = one agent.** a bim never stands for anything else. Its name label is the agent's name.
2. **readability beats realism.** a bim, its label and its pill read at 320 and at 640 docked, at any hour.
3. **color = attention, as in the app.** the `?` pill (accent, waits on him) and the `✗` pill (error, failed) are the only UI colors on the office. The world never uses the accent pink or the error red (palette.test.ts guards it), and no pink or mauve cast ever falls on a floor or a wall.
4. **nothing visibly disappears.** the office never shrinks or loses a piece (a high-water mark per project, grow-keep.ts), and a desk or a corner never moves when another agent arrives.
5. **paper planes are only his messages,** from one place (his send button, his feed). An agent's message to another agent is never a plane.
6. **a still office draws nothing.** at rest the office draws 0 frames, hidden or blurred too. Movement draws at the loop's rate, never at the display's.

## look
- **bims** (render/bim.ts, outfits in render/palette.ts HOODIE / PANTS / SKIN / HAIR / HATS): round clay figures, a hoodie, a hat or hair, two dot eyes. A sleeper's closed eyes are two thin lines. Their outfit is seeded from the name (hash), so one agent keeps one look everywhere.
  - main wears the ink hoodie, a gold chain and its `:*` in the neon's yellow, never pink; its shape is the mono `:*` (book §5), never a hand-drawn kiss.
  - Maps may dress bims (look.wear).
- **world** (render/world.ts, render/kit.ts, render/style.ts): rounded boxes, flat colors, no textures. Details under ~6 cm are their own raised meshes. No two faces share a plane (coplanar.test.ts, walls.test.ts).
- **palette** (render/palette.ts DAY and NIGHT, WORLD, and each map's palettes in render/maps/*.ts): it is joyful: warm wood, saturated plants, the map's own accents (teal, yellow, violet, orange, sky blue). Desks are the day palette in both themes since light A.
- **pills and labels** (labels.ts, tags.ts, headroom.ts):
  - one name label at a time, never over another label;
  - a `?` or `✗` pill over the head;
  - an off-frame pill sits at the nearest edge with an arrow;
  - labels and pills keep clear of the map chip and the fit chip (tags.test.ts).
- **hover card** (Office.tsx): the name in weight 600 with its pill, the state in text-2, the title on up to 3 lines. It shows over the head, or flipped under the feet, never over its own bim. A 400 ms delay, then it stays warm.

## light (direction A; sky.ts, render/sky-light.ts, render/index.ts lightUp, loop.ts)
- The light comes from his local hour and the weather, never from the app theme. The theme only sets the page the cube floats on (no grey veil, no fade into the background). The materials are always the day palette.
- **sun:** at 46° N (LAT). His time zone's solar hour sets its height. The key always comes from the camera's half (frontOf), so a low sun lights the floor.
- **hours:**
  - noon: key #fff3dc, white fill;
  - dawn: a pale-yellow key over a pale cool fill;
  - golden and dusk: an amber key low from the sun's side, over a blue fill (yellow-amber, never red: white walls go cream);
  - night: a cyan-blue fill (#2f78a4), the moon as a pale key with its shadow at 30%, warm lamp pools #ffcf7a.
- **night pools:** up to 4 per office over main, the island, the lounge and one desk. In the town, the 8 offices nearest the view get them (town/pools.ts POOLS_MAX). Every other office's lamps, screens and windows glow (emissive only).
- **weather:** clear, clouds, overcast, rain, snow or fog, one spell per 5-minute slot (SLOT_S 300), picked by season.
  - Rain and snow are a CSS layer clipped to the cube's outline, never over the page.
  - Snow lies only on the lawn and the terrace.
  - Fog is a haze at the edges.
- **blends:** every slot blends from the drawn sky to the next one over 30 s (SKY_FADE_S) at 10 fps (BLEND_FPS), then draws 0 frames. His drag or pinch holds a blend until he lets go. Under reduced motion there is no blend: a cut to the current hour.
- **the cube:** a soft shadow lies on the page under it (its own shape, ~24 px at 640, black 15% light / 35% dark). At night its dirt sides never go below #24324f (SIDE_MIN).
- **laws:** sky.test.ts (no mauve floor at any hour or weather, the night floor blue and saturated, floors and wall tops never violet under 0-100% pool light, the key in the camera's half) and render/town-light.test.ts (the town's lawn, roads and water).
- **the hero film** keeps its own fixed theme light (TownOpts.themed). It is signed, so don't change it in passing.

## offices and maps
- **13 maps** (maps/ids.ts MAP_IDS; names and moods in rust/proto/src/words/bims.rs): loft, greenhouse, campus, workshop, kyoto, riad, nordic, patio, haveli, tropical, cyclades, sahel, california.
  - Each map has a plan (maps/<map>.ts: desks, island, lounge, board, queue, door, terrace, walk graph, furniture boxes) and a look (render/maps/<map>.ts: shell, island, lounge, desk, main's desk, growth pieces, cozy hints).
  - The loft is the default.
- **his pick:** the map chip at the bottom left of a project's office (MapChip.tsx: the map's name + the ds caret, opening the ds Dropdown with the /bims rows) or the /bims command. Both write prefs `bims.map.<project>` (maps/ids.ts mapPrefKey). There is no chip on the town or in the film. '⤢ fit' sits at the bottom right, only while zoomed.
- **growth** (growth.ts, render/stages.ts, render/unlock.ts, grow-keep.ts):
  - jobs done build the building over 15 stages (STAGE_AT 0, 1, 3, 6, 10, 15, 25, 40, 60, 100, 150, 250, 400, 600, 1000);
  - days used grow the garden over 8 levels;
  - artifacts fill the walls: a frame per 10, 30 at most, golden from 500.
  - At 70% of the way to the next stage, cones mark where the next piece goes. An unlock is two crew bims carrying crates in from the door (3 s), then 'new: <thing>' for 3 s.
  - The corner tip says 'level N · X jobs done · next: <thing> at Y'. Each map names its 14 pieces.
- **cozy from day one** (cozy.ts, render/cozy.ts, cozy.test.ts): stage 0 already has a rug, beds, two big plants, a coffee corner, posters, a lamp and a few objects per desk. Every stage adds more and better.
- **beds** (growth.ts BEDS, maps/plan.ts napBedAt, render/nap.ts): two beds from day one, 8 at the top. One kind of bed per nap place.
- **the workshop past 18 desks** (maps/workshop.ts, render/maps/workshop.ts): the walls hold 18 desks. The rest go to pods of 6 in the middle under lamp beams, with one workshop corner per pod (lounge, band, maker bench, a two-post lift with the old yellow car up on it, racks, motorbike; the front middle's car became the side-on Vespa, bims-vespa 39b0e932c), each at a fixed place.
- **the town** on bise's thread (town/*, render/town.ts, render/townscape.ts):
  - It is made of every project's real office with its live bims, around roads and paths, with signs and tags.
  - Far away, offices are baked from their real scene. Pinching in brings up to 4 live offices.
  - A click on an office eases the camera to its framing.

## behaviour (timeline.ts, activity.ts, pose.ts, moves.ts, paths.ts, avoid.ts, pacing)
- **activities:**
  - work at the desk (typing, thinking, editing);
  - asks (`?`, standing beside the desk);
  - failed (`✗`);
  - landing (a crate carried to main's queue);
  - board;
  - snack at the island;
  - nap;
  - done (on the terrace: on a deck chair if one is drawn, else standing with a mug, paired up to chat, one in three sipping).
- **pacing for an idle bim:** a 4-7 minute cycle: one trip to the island, 30-90 s there eating (4 bites a fruit, a mug sipped), the rest napping. About 2.4% of the time is spent walking.
- **sit:** the chair slides back 0.55, the bim steps in front, does a small hop (0.26) as the chair slides in under it, and sits. Getting up is the reverse. It works on every map and pod chair.
- **nap:**
  - flat beds (mats, cushions, cots, benches): lying down, back and heels on the bed, the head on a pillow turned to the room, hands on the belly;
  - bean bags and poufs: a 52° recline, sunk at most ~0.2;
  - hammocks: in the sag.
  - The bim sits on the edge, then lies back over ~1 s. 'z z Z' is a CSS loop in the overlay (0 WebGL frames).
- **walks:** a bim never goes office to office, never crosses furniture, and keeps to the walk graph (walklaw.ts).
- **skaters** (California, skate.ts): 2 at most, lines of 8-12 s, then a rest at least as long. Nobody skates under reduced motion.
- **eggs** (eggs.ts, render/egg.ts, eggdecor.ts):
  - rolled per bim on a seeded window, a few per day, never two at once on one bim;
  - date eggs (christmas tree, eclipse, cake, midnight ghost);
  - a real circular wait shows '!' over both bims;
  - eggs never mock his work, never show private content, never sad or violent.
- **planes and the catch** (render/plane.ts, render/catch.ts, plane.spec):
  - a folded dart, white paper with an ink edge;
  - it leaves his send button or feed at the dart's size, then shrinks steadily to letter size in the hand;
  - at most 2 in the air;
  - the catch (PLANE_CATCH 2.2 s): the arm goes up 0.5 s early, the plane lands on the hand's real point, the bim reads it at its face, then lays it beside the laptop at a desk or folds it into the hip pocket elsewhere;
  - a fist-up thumbs-up follows, skipped when an egg follows;
  - main puts its own paper down while it catches.
- **pokes** (pokes.ts, render/poke.ts): a click on a bim plays one of 20 reactions; a double click or a click from the agent's row opens the agent.

## camera and interactions (zoom.ts, focus.ts, render/camera.ts, view.ts)
- **the view:** orthographic, AZ 45°, EL 30°. Fit frames the building at 320 and the whole ground at 640.
- **gestures:**
  - drag to pan, pinch or ⌘ wheel to zoom;
  - '⤢ fit', esc or a double click on the floor to go back;
  - the office takes focus on a click (tabIndex 0).
- **follow:** opening an agent's thread zooms 2.2× onto its bim, eased over ~300 ms (a cut under reduced motion), and the camera follows it. His pinch, drag, esc or fit stops it until he opens another agent. Main's thread and archived agents show the whole office.
- **row and bim link:** hovering an AGENTS row lights its bim (a ring on the floor in the text color at 28%), and hovering a bim tints its row.
- **cube in the AGENTS head** (Cube.tsx): it blinks every 6-14 s and does one hop every 2-3 min (900 ms). It never animates while the office is open, hovered, hidden or under reduced motion.

## budgets and rules learned the hard way
- **frames:**
  - no frame over 50 ms;
  - 0 frames at rest, blurred or hidden;
  - loops at LOOP_FPS 8 (eating, skating), blends at 10;
  - the checks: budget.spec, the town's fit at ≤ 16 ms.
- **clipping laws:** nothing passes through anything, on every map and stage, at 0-31 agents.
  - render/clip.test.ts: a napper inside its own bed box, beds never overlap, no foreign mesh in a bed, a desk or a napper. A bed's own meshes carry `userData.bed`.
  - render/nap.test.ts: back and heels within 3 cm of the bed, never floating, and every napper's head in view at the office camera.
  - render/standing.test.ts and render/shade.test.ts: no lamp shade or string over a head on screen at 320 or 640.
  - render/deck.test.ts: a reclined bim only on a drawn deck chair.
  - render/maps/workshop-view.test.ts: nothing over 1.0 high on the camera's right and front edges.
  - sit.test.ts.
  - walklaw.ts: walks.
  - render/pathlaw.test.ts: town paths.
- **what never to draw:** a pink or red prop, a pink or mauve light cast, a monument or brand copied badly (real cities as maps failed: maps differ by layout and mood, not landmarks), a grey void around the cube, a plane that isn't his message, a bim on a stage-up that vanishes.
- **reduced motion:** no blends, no skating, no planes in flight (the catch is a still), 'z' as one still letter, the follow as a cut, the hero as its 0:54 frame.
- **shots:** check them off screen, on fake data (FakeCore, fixtures.ts). Do heavy renders through `~/.bise/run/heavy-run`. designer signs the bims' look and the UI chrome before a land.

## how to add a map
1. **The plan:** maps/<map>.ts. Give its layout over 0-31 agents (desks with slots that never move, island, lounge spots, board, queue, door, terrace, walk graph, furniture boxes) and its cozy hints. Add it to maps/ids.ts MAP_IDS (picker order) and maps/index.ts.
2. **The look:** render/maps/<map>.ts (a MapLook: pal for day and night, shell, island, lounge, desk, main's desk, growth with its 14 named pieces, cozy, wear, pieceAt), registered in render/maps/index.ts.
3. **The words:** rust/proto/src/words/bims.rs (map_<id> name, map_<id>_mood, piece names), then regenerate the words.
4. **The laws:** run every law above on it. Add its own if it has motion, as skate.ts did. Check it in the town (its site and paths).
5. **The page:** show him real renders at 3 / 6 / 12 / 20 / 30 desks, light and dark, before building. Concepts only lead to code after his pick.

## how to add a pose or an activity
- **The rig:** a pose is a pure function of (pose, t, phase, reduced) in render/pose.ts (rigOf). Give it a still version for reduced motion and a law in pose.test.ts.
- **The activity:** a new activity goes in model.ts, timeline.ts (where and how long) and activity.ts (from the hub's state), with its walk on the graph.
- **The budget:** a looping pose runs at LOOP_FPS. Add its frames to budget.spec.

## code and checks
- **code:** apps/desktop/src/bims/ (model, timeline, layouts in maps/, three.js in render/, the town in town/, Office.tsx, MapChip.tsx, Cube.tsx, office.css) and the words in rust/proto/src/words/bims.rs.
- **the hero film:** site/desktop/hero/ (film.js, hero.js, kiln.js), built from the same code, scenario in page bims-film.
- **unit laws:** the `*.test.ts` next to each file, run by vitest in `pnpm check`.
- **end-to-end checks:** apps/desktop/tests/checks/bims/ and the Playwright shot specs.

## open items (waiting on Gabriel, for the next builder)
- **the climbing gym map** (page bims-climb v4): Paris, an industrial hall turned bouldering gym, never a brand name. One continuous folded wall (slab, vertical, overhang, roof, arêtes, volumes, one run of blue mats), the café side as desks, a Paris street in front, zinc roofs behind.
  - He liked v4 and said it can be added, with one condition: no climber clipping into the wall or a volume. A climber's hands and feet sit on holds at the surface, never inside it. Add a law for it.
  - He also wants its office unique, never the loft's plan reused. The pick sent to the builder: long wooden communal tables with benches facing the wall (the bims watch the climbing), the café bar along the front with stools, main's desk as the reception at the door with the shoe-rental shelves, the stretching zone under the glass roof as the nap place (yoga mats, foam rollers), hanging plants, the route setters' board.
  - The scratch prototype was in the bims agent's tmp: rebuild it as a real map (plan + look + growth). Task bims-climb took it.
- **the maps grid** (page bims-grid): every map at 3 / 6 / 12 / 20 / 30 desks, for his notes per map.
  - Seen so far: campus, riad and haveli leave the middle empty at 20-30 desks (workshop-style pods or corners would fix it), and the cyclades' sea fills the whole background around the cube.
