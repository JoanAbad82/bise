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
- **bims** (render/bim.ts, outfits in render/palette.ts HOODIE / PANTS / SKIN / HAIR / HATS / KINDS; his pick D on page bims-look v6): round clay figures, a big round head (r 0.245), a bean of a torso, chunky sleeves, mitten hands, round sneakers on a thin sole. Their outfit is seeded from the name (hash), so one agent keeps one look everywhere: one of six kinds (hoodie with its hood, pocket and strings; tee with a crew neck, a chest print and bare forearms; sweater with two bands and a ribbed hem; overalls over a white tee; an open jacket over a white shirt; a puffer vest over long sleeves), its second colour from the name too.
  - the face: two round glossy eyes with a catchlight, a thin arc of a smile, an open half moon to laugh, a small round "oh". A sleeper's closed eyes are two soft arcs (‿). Cheeks are the skin warmed a step (palette.ts blushOf), never pink.
  - the clay light (render/claylight.ts), on the bims only: a small warm studio reflection and a little warmth of their own colour by day (none at night: the lamp pools light them). The world and the film's light don't change.
  - the clay itself (claylight.ts CLAY, his pick B « la pâte » on page bims-look-2; no new light, he kept today's): the merged parts' shader adds a warm glow where the key's light turns to shade (wrap lighting), a soft rim on the edges, both off on dark colours (main's black stays black), and a faint grain fixed on the part (object space, it never swims). Same draw calls, roughness 0.65.
  - main wears the ink hoodie (no strings), a gold chain and its `:*` in the neon's yellow (DAY.neon), never pink; its shape is the mono `:*` (book §5), never a hand-drawn kiss.
  - cost: each bim's rigid parts (head, body, arms, legs) are baked into one mesh each (merge.ts bakePart; bim.test.ts: the same triangles in the same colours as unmerged). Small details (cuffs, folds, hems, pocket, strings, buttons, catchlights) are drawn only from 22 css px per office unit (bim.ts nearAt: the follow zoom, not the fit at 320 or 640). The office at 320 draws 1,121 calls a frame (it drew 1,421 before the clay look).
  - Maps may dress bims (look.wear).
- **world** (render/world.ts, render/kit.ts, render/style.ts): rounded boxes, flat colors, no textures. Details under ~6 cm are their own raised meshes. No two faces share a plane (coplanar.test.ts, walls.test.ts).
- **palette** (render/palette.ts DAY and NIGHT, WORLD, and each map's palettes in render/maps/*.ts): it is joyful: warm wood, saturated plants, the map's own accents (teal, yellow, violet, orange, sky blue). Desks are the day palette in both themes since light A.
- **pills and labels** (labels.ts, tags.ts, headroom.ts):
  - one name label at a time, never over another label;
  - a `?` or `✗` pill over the head;
  - an off-frame pill sits at the nearest edge with an arrow;
  - labels and pills keep clear of the map chip and the fit chip (tags.test.ts).
- **hover card** (Office.tsx): the name in weight 600 with its pill, the state in text-2, the title on up to 3 lines. It shows over the head, or flipped under the feet, never over its own bim. A 400 ms delay, then it stays warm.

## outfits: the intent sheet (render/bim.ts, palette.ts KINDS; the character loop, Gabriel's note n4 on bims-home v8)
What each outfit is meant to be. The character designer builds to it, the reviewer (a separate agent, read only) compares each round's turnaround sheet with it, outfit by outfit, and designer signs it before any outfit changes. No intent here, no outfit in the code. Face, head and body shape are the clay look's (bims-look D, his pick B « la pâte »): only the clothes change.

For every outfit:
- **sleeves follow the arms:** a sleeve, a cuff or a hand never passes through the torso, the vest or anything worn on the torso below the shoulder cap, at any angle of any pose (the clipping law: render/outfit-clip.test.ts names the outfit, pose and frame).
- **nothing worn pierces the skin,** and nothing floats off the body (a band, a ring or a strap lies on the cloth under it).
- **the poses it must survive:** stand (idle), walk, type seated at a desk, think, raise a hand (the catch, a wave, the thumbs up), carry a crate, eat, nap lying on a bed and on a bean bag, sit on a deck chair, and the home's gags (legs swinging on a ledge, the piano, the skate, reading a book, the stretch).
- **colours** from palette.ts only (HOODIE, PANTS, SKIN, HAIR, WORLD.paper, WORLD.gold); the second colour is never the main one; no accent pink, no error red.
- **cuffs end at the wrist:** the hand is fully out of the sleeve in every pose (fingers near, the mitten far).
- **three read sizes:** near zoom (the follow camera, ≥ 22 css px per office unit) from the front, the back and 3/4; the home's islands (~200 css px), where an outfit reads by its main colour and its one **telling feature** (named in each block, what the reviewer checks first); the fit, where its silhouette and main colour are enough.

The outfits (one from the name; main always wears its own):
- **hoodie.** A soft pullover hoodie. Silhouette: a round bean with a thick hood folded on the back and shoulders. Must show: the hood (from the back and 3/4), a kangaroo pocket low on the belly, two white drawstrings, ribbed cuffs and hem. Colours: the main colour, hood and pocket a step darker, strings WORLD.paper. Telling feature: the hood. Never: the hood cuts into the head on a turn, or covers the face at 3/4.
- **main's hoodie.** The same hoodie in ink #1d1a17, without strings: a gold chain as a thin U from the collar and its :* on the chest in the neon's yellow (DAY.neon), set as the mono :* (book §5). It stays as black as today in every light. Telling feature: the black with the gold chain. Never: the chain or the :* off the cloth, or lifted toward grey.
- **tee.** A crew-neck t-shirt. Silhouette: the bean in one colour, short sleeves ending above the elbow over bare forearms. Must show: the round neck, a round print on the chest in the second colour, the bare skin of the forearms. Telling feature: the bare forearms under short sleeves. Never: the forearms in any colour but that bim's SKIN, or a gap at the shoulder where the sleeve starts.
- **sweater.** A knitted jumper. Silhouette: the bean with a rolled collar. Must show: two bands of the second colour knitted flat into the chest (never rings floating round it), a ribbed hem and ribbed cuffs a step darker. Telling feature: the two bands. Never: a band standing off the chest or an arm through it.
- **overalls.** Dungarees over a white tee. Silhouette: the white tee's top and short white sleeves above a bib and trousers in the main colour. Must show: the waist band, the bib with its small pocket, two straps over the shoulders to the back, two gold buttons; the straps lie on the shoulders, under the arms' swing. Telling feature: the straps. Never: a strap lifting off the shoulder in the wave or the stretch.
- **jacket.** An open jacket over a white shirt. Silhouette: long sleeves in the main colour, a white V of shirt down the front. Must show: two lapels, the V of the shirt, two buttons in the second colour, cuffs. Telling feature: the lapels and the white V. Never: the lapels crossing into the arms when it types seated.
- **puffer.** A quilted puffer vest over a long-sleeved shirt. Silhouette: a puffy vest (three soft quilted rings, no sleeves) in the main colour, the arms in the second colour's sleeves. Must show: the quilting, the zip line, the arm holes; the arms never pass through the vest's rings. Telling feature: the vest's rings over sleeves of another colour. Never: an arm through a ring.

What goes on a head or in a hand (bim.ts, palette.ts HATS, the maps' wears, the home's props). For each: it never goes through the hair or the head when the head turns, never hides the eyes, and sits on what it rests on:
- **cap / cap backwards.** A baseball cap in the hat colour: a round crown over the top of the head, a stiff peak to the front (or the back). Telling feature: the peak.
- **beanie.** A knitted beanie in the hat colour, folded at its rim above the brows, a white pompom on top. Telling feature: the pompom.
- **headphones.** A dark band following the head's curve over the hair, ear to ear, a cup in the hat colour on each ear over a dark cushion, a small mic arm toward the mouth. Telling feature: the two cups.
- **hair, bun, afro.** Hair in the bim's HAIR colour: a fringe of soft tufts (hair), a round bun on the back of the head (bun), a round afro never wider than the shoulders (afro). Telling feature: its shape from behind.
- **sunglasses.** A dark bar over the eyes, worn only by a pose that asks for it (the terrace); the one thing allowed over the eyes.

## women among the bims: the intent sheet (render/bim.ts hair, palette.ts CUTS; Gabriel m_42689: « ce serait cool qu'il y en ait, mais pas sexualisées »)
About half the bims are women, seeded from the name like the rest (palette.ts outfitOf `cut`, from a hash of its own so the outfit, skin and colours of today's bims stay theirs). What tells them apart is the hair, and a tie or a clip in it where the cut has one (long and curls have none: their outline is enough). Nothing else changes: the same clay body and bean, the same head, face, eyes, smile and cheeks, the same six outfits in the same colours, the same trousers and sneakers, the same poses. Never: a body shape of their own, lashes, lips, make-up or a pinker cheek, a skirt or dress as the women's outfit, a pose of their own. main keeps its own look.

For every cut:
- **in the HAIR colours** (palette.ts HAIR), a tie or a clip in the bim's hat colour or second colour; no accent pink, no error red.
- **it wraps the head:** a cap of hair over the skull, so no skin shows through the hair at any angle; nothing hangs into the face below the brows or over the eyes.
- **it never goes through the head, the collar, the hood, a strap or the headset,** at any head turn of any pose (the hair law: render/hair-clip.test.ts, every cut × every outfit × every headwear it may wear × every head angle of the outfits' poses, names the cut, outfit, pose and frame). Behind, it ends above the collar and the hood: the hood stays the hoodie's telling feature from the back. Under it, a band of hair hugs the skull all the way down under the back of the head (inside the collar at rest), so the back of her head never shows skin when she nods. The law reads hair within 12 mm of the skull (its shells, that band) as the skull, which sits into the collar by design (the bims have no neck); what stands off it (a curtain, a braid, a tail, a bun, a curl) never goes in.
- **three read sizes:** near (the follow zoom) from the front, the back and 3/4; the home's islands (~200 css px), where the cut reads by its **telling feature** from its outline; the fit, where a woman reads by her outline (a tail, two buns, hair to the shoulders).
- **cost:** baked into the head's one mesh (no new draw call); a cut's triangles stay within the existing hats' (the afro's, the headset's).

The cuts (one from the name):
- **long.** Parted in the middle (two soft swoops from the parting to the temples): the cap, and a soft curtain on each side of the face, in front of the ears, falling past the jaw toward the shoulders (never round to the back, where the hood is when she turns her head); behind, a fall to the nape. Telling feature: the parting and the curtains at the sides of the face.
- **ponytail.** The hair pulled back smooth over the cap (a high, bare forehead), a tie (hat colour) high at the back, and a tail of three soft lobes curving back and down, away from the neck. The tail turns about its tie: it hangs down when she nods, never up over her head, and it is tucked under her head when she lies back (a bed, a bean bag, a deck chair). Telling feature: the tail, in profile and 3/4.
- **braids.** Parted in the middle, two braids (four lobes each, getting smaller) from in front of the ears down in front of the shoulders, splaying a little, a tie (hat colour) at each end. Telling feature: the two braids from the front.
- **bob.** A round helmet of hair down to the jaw on the sides, the nape behind, a straight fringe above the brows, a small clip (hat colour, like the ties) on one side. Telling feature: the round helmet and its fringe.
- **buns.** The hair pulled back smooth (a high, bare forehead), two round buns high on each side of the crown, each with a tie (hat colour) round its foot. Telling feature: the two buns, from any side.
- **curls.** A round cloud of curls (soft lobes) to the jaw, never wider than the shoulders (the afro's rule). Telling feature: the bumpy outline.

What a woman wears on her head: half go bare-headed. The others wear a hat from the list above only where the cut lets it sit right: the cap or the cap backwards over long, ponytail (the tail out of the cap's back), braids or bob; the beanie over long, braids or bob, its rim over the hair; the headphones over the ponytail only (never over hair at the ears: a braid starts where the cups sit). Never a hat sunk into the hair, or hair through the headset's band or cups.
- **in the hand:** a mug, a fruit, a sheet, a marker or pencil, a magnifier, a book in both hands, a crate held in front: each held in the hand's real point, never inside the body or the sleeve.

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
  - render/outfit-clip.test.ts: the outfits' clipping law (the intent sheet above): for each outfit (outfits.testkit.ts OUTFIT_BIMS, one fixed bim per outfit) and each pose (the office's activities, the catch, the home's gags) at every sampled frame, no forearm, cuff or hand 1.6 cm inside what it wears on its torso, nothing worn on the torso through a sleeve or a hand. bim.ts clearArm keeps the arms out at every frame: a point in front rolls the shoulder forward (10 cm at most), else the arm turns the least out of the torso's girth (bim.ts GIRTH, per outfit, sides and front).
  - render/clip.test.ts: a napper inside its own bed box, beds never overlap, no foreign mesh in a bed, a desk or a napper. A bed's own meshes carry `userData.bed`.
  - render/nap.test.ts: back and heels within 3 cm of the bed, never floating, and every napper's head in view at the office camera.
  - render/standing.test.ts and render/shade.test.ts: no lamp shade or string over a head on screen at 320 or 640.
  - render/deck.test.ts: a reclined bim only on a drawn deck chair.
  - render/maps/workshop-view.test.ts: nothing over 1.0 high on the camera's right and front edges.
  - sit.test.ts.
  - walklaw.ts: walks.
  - render/pathlaw.test.ts: town paths.
  - render/objects/index.test.ts: the plugins' objects (one per family file, the registry is index.ts): each mesh inside its declared foot, no two faces seen from above in one plane (2 mm), no pink or red, glass when off (30%, no shadow), compact smaller.
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
