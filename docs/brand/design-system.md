# bise UI design system

Dense reference for agents building bise's terminal UI. The exact specs are in `docs/brand/bise-book.md`, and the book wins on conflict. Human version, with mocks: bise.dev/design.

## laws (the first one wins a tie)
1. **never block**: you can always type, send and switch. the composer is never locked (⏎ steers, tab queues). nothing opens or takes keys while you type.
2. **color = attention**: only "needs you" (accent) and failure (error) get a hue. the rest is text, dim or faint.
3. **one key for the common case**: digits pick options. ctrl+N opens inbox item N, and N is the same number everywhere.
4. **show what happened**: a 2–3 s trace where your eyes already are (divider, the touched row), then it folds.
5. **never lie**: never show a key the terminal can't send, never show an unbuilt feature, and a default always says what it resolves to.
6. **every mark explains itself**: a glyph, chip, count, short age, id or state mark says what it is on hover or focus, in one line. the screen stays compact; the explanation is one step away, the full thing one more (progressive disclosure).

## tokens (dark / light)
| role | dark | light | for | never |
|---|---|---|---|---|
| text | #ece6da | #1b1917 | what you read | |
| dim | #a39c90 | #6b645a | model, agent's own work, durations | anything to act on |
| faint | #857d72 | #7d766c | key labels, numbers, ` · ` | a sentence to read |
| rule | #4a4540 | #cfc8bd | lines, borders, frame | text |
| accent | #f4a6b0 | #b8416b | needs you, `:*`, agent in view, done ✓, read ✓✓, your bar | decoration |
| error | #ff5a52 | #b3261e | ✗, failing checks | warnings, defaults (yolo is dim) |
| ok | #b9d99a | #3f7a2a | diff `+` only | success (never green) |
| ground | #141211 | #fdfbf7 | every cell (bise paints it) | |
| raised | #1f1c1a | #f4f0e8 | your space: the composer pane | agent content |
| raised2 | #26221f | #efeae0 | an inbox item open in place | |
| chip | #231f1d | #efe9df | agent→agent envelope chip | |
| pill | #3a2530 | #f0d3dc | ❝ / ▣ chips in your text | |
| selection | #33292c | #fdeef2 | selected text | |
Text you read is ≥ 4.5:1. NO_COLOR: bold replaces the accent, no tints, `[ ]` around chips. 16 colors: no tints. Light theme: auto via OSC 11.

## type, space, motion
- the user's font, one size. importance = contrast + bold speaker + a blank row. bold is rare. lowercase except proper nouns, acronyms, keys.
- whole cells only. fixed columns: frame text at col 3, composer text and key bar at col 7, panel text 28 wide (24 at 90–99 cols, grows from 165 cols, none under 90).
- prose ≤ 88 cols, code ≤ 100. 1 blank row between history blocks (level 2: one above and one below). two blank rows in a row = bug.
- numbers right-aligned in fixed columns. a column stays in place when it's blank.
- motion = alive: gust ∿ (5 cells, 110 ms/frame, 9 frames; 1 breathing cell in the panel), cursor, `:*` pop, 2–3 s flashes. it stops when focus is lost, and under reduce motion it's a static ∿. ≤ 10 fps.

## glyphs (ASCII form in parens; 1 cell wide, one meaning each)
`:*` main · `│` your message (accent, `|`) · `┃` needs you · `∿` working (`~`) · `?` needs you · `✓` done, accent (`*`) · `✓`/`✓✓` got it/read at the end of your msg (`v`/`vv`) · `✗` failed (`x`) · `○` idle (`o`) · `…` waiting (`;`) · `·` starting/sending (`.`) · `•` unread, accent (`!`) · `ψ` worktree (`Y`) · `↑` PR (`P`) · `$` bash · `ƒ` ts (`f`) · `±` edit (`%`) · `∴` thinking (`:`) · `▸`/`▾` fold (`+`/`-`) · `✉︎` agent→agent (`@`) · `▣` image (`#`) · `❝` quote · `≡` compaction (`=`) · `▲` interrupted (`^`) · `Δ` building (`A`).
Rules: the position separates look-alikes (✓ at the start of a row = done, at the end of your message = got it). a new glyph needs a font audit, a distinct ASCII form and a `/help` legend row. open bug: `@ 2` (panel) and `# 1 in the inbox` (header) clash with `@ file` and PR numbers.

## components
| component | look | rules |
|---|---|---|
| frame | `╭─ bise :* ──── ~/acme · # 1 in the inbox ─╮`, rule color | header lives in the top border. agent view: role line ≤ 60 ch after the title. no panel: short counts `∿ 3 · ? 1`. no frame under 60 cols or 16 rows |
| your message | accent `│` on every wrapped line, marks `· ✓ ✓✓` at the end | > 20 lines → `▸ n more lines`. quotes/images are inline chips |
| levels | 1 needs you: inbox, `┃` + bold accent title · 2 for you: text, bold speaker, room around · 3 agent↔agent: dim chip | a new event gets a level before it gets a look. levels 2 and 3 differ by brightness, never by hue |
| agent chip | ` ✉ a → b ` on chip tint, text under it at x0+2, dim, ≤ 2 rows then `… ▸` | no accent inside. same pair: no blank row. run → `▸ n messages between k agents` |
| tool row | `$`/`ƒ` + the model's description (user's language) + state right: `∿ 12s` / `✓ 0.3s` dim / `✗ exit 1 · 0.8s` + 1 error row | ≥ 4 done calls → `$ ▸ n commands · first ✓ total`. ≥ 3 edits → `± ▸ 3 files · a, b ✓ +7 −2`. a failure never folds and never auto-opens. click/space = box, ctrl+o = all |
| fold | `▸` closed, `▾` open, says what and how much | click/space one, ctrl+o all. search opens folds. never fold what needs action |
| agents panel | `N G name [:* @n •] … TTT  PPP  ψ` (time 3 r-aligned while working, % 3, ψ far right) | no state words or model tags at rest. ctrl held: state word (8 wide) over time+%. numbers never change. names cut with `…` only, the mark never dropped. last column = the mark of an agent alone in its worktree: `ψ` no PR · `↑` PR (dim open, faint draft, red checks fail, accent only via an inbox item) · `…` waits to land. a box only when ≥ 2 agents share a worktree (`╭─ ψ branch ── ↑ ─`, rows behind a `│` rail). order: folder rows, solo-worktree rows, boxes, inbox. held: a dim line under a solo row, the PR in words |
| divider | `├─ you → main · opus 5.5 · high · yolo · ∿∿∿ ──── 58k · 22% ─┤` | ctrl held: `working · 1m`, `58k / 262k tokens · 22%`. short on room: long ctx → short ctx → ctx → branch name → `opus·hi`, the mode last, the gust never. holds flashes: `✓ inbox clear`, `✓ copied 9 chars` |
| composer | raised pane, `│` faint when empty / accent with text, text at col 7 | never locked. markdown colored, nothing hidden. draft kept when an item opens (esc brings it back) |
| attachments | own small box above the text: `╭─ attached ─╮` rows `❝ 1 …` `▣ 2 cart.png 1440×900` | chips inline in the text, the box only lists them. backspace on a chip removes it |
| key bar | `@ file   $ skills   / commands   ctrl+1 inbox` (key text, label dim, 3 spaces) | only keys you can't guess (no ⏎ send, no ? help), only keys that work here. per mode: steer `tab queue ⏎ steer ctrl+c interrupt`, agent view `esc back to main …`, item open `1-3 answer ←→ choose ↑↓ other items esc back`. ctrl held = the full list |
| inbox | own rounded box above the divider, title `inbox · N waiting for you ── ctrl+1-3 open`, rows ` N ? who · what  age` | only what needs you: approvals > questions > merges. ≤ 3 rows + `+ n more`. no box when empty. right side: `ctrl+1-N open` / `click to open` / `/inbox opens it` |
| inbox item | opens in place, raised2, `┃` on every row: head `? t3 wants to run  1 of 2 · 2m`, command, why (dim), agent's last step (dim), options `1 allow  2 always … here  3 no`, hint faint | 1-9 pick, ←→ highlight + ⏎, ↑↓ items, type + ⏎ = answer/no with note, ctrl+o full screen, esc back. after: 2 s fold line `✓ you allowed t3: …`, next opens itself, last → `✓ inbox clear`. hard rules: no "always" |
| picker | bold question title, 1 dim line, `› type to filter`, rows | what works first (ready, `same as main`/`auto · X · id`), `now` dim, ≤ 1 `recommended` accent. enter forward, esc back one step, digits pick, skip one-choice steps, row flashes ✓ |
| popup | `/` commands, `@` file, `$` skill, a small list above the composer | tab completes, ⏎ runs, esc closes and keeps the text. typing continues |
| find | ctrl+f/cmd+f, 3-row box at the history's top-right | ⏎/⇧⏎ next/prev, searches folds, never covers the hit |
| palette | ctrl+s (cmd+k once cmd keys arrive), `/switch` | live agents first, archived dim (read-only), match in bold |
| flash / tip | flash: `✓ state` on the divider/row, 2–3 s. tip: over the thing it explains, once ever | a sentence of state, never a cheer, never a corner pop-up |

## patterns
- **rest vs held**: at rest show only what changes or needs you. holding ctrl shows ctrl keys where they act, state words, long forms and the full header/key bar. ⌥ shows `⌥N`. cmd shows only after a cmd key has really arrived. the held form replaces the rest form in the same cells, so nothing moves.
- **disclosure**: one row by default; `▸` means there's more, and folded stuff is still searchable. errors show their first line, and questions show in full.
- **explain every mark** (law 6): mark → tip → the full thing. what gets a tip: every glyph (ψ ↑ ✓ ? … ◌ ∿ ▲), chip, count, short age, `%`, mono id, icon button, pearl or badge; not text that already says it in words. the tip's words: `<what it is>: <what it says now>`, lowercase, no period, e.g. `ψ worktree: its own copy of the repo, on sb/perf`, `17% of perf's context used`; one string per mark and state, in one signed table shared by the terminal and the desktop (bise-proto words). terminal: while the mouse is over a mark, or the keyboard selection is on it, the key bar line shows its words, dim. desktop: one tip component (pointer-events none, sans 12, max 280 px, 2 lines at most, 400 ms hover delay, instant on focus, warm for 1 s after one closes, never repeats visible text). a new mark without its words doesn't ship.
- **keys**: digits pick. esc = back one step, ⏎ = do it, ctrl+o = open folds. every key has a click twin and vice versa. leave OS keys alone (ctrl+arrows on macOS). detect the terminal (kitty protocol) before showing ctrl+digits.
- **feedback**: mode switch = accent word on the divider + an explanation on the key bar (3 s). answer = fold line (2 s), also in main's thread. setting = row flash ✓. message = `· → ✓ → ✓✓`.
- **short on room**: every line has a written drop order: explanation words → short forms → whole details → names cut with `…` last. the gust while working and `?` are never dropped. test at 80 and 150 cols.
- **errors**: one line, `✗ what happened. /command fixes it.` the provider's words go dim underneath. `?` (accent) when it's the user's call (no credit). nothing is lost (draft, clip, queue), and the line says so.
- **zen**: while you type, the chrome fades 45 % toward the background (header, frame, panel, divider's right side, key bar). it comes back 5 s after the last key or at once on ⏎/esc/shortcut/mouse/needs-you. only brightness changes.
- **spaces**: raised = yours (composer, open item, attachments box), ground = theirs. what isn't your text sits in its own box.
- **defaults**: the first run asks one thing (the main model). every other role is `same as main`/`auto · resolved`. picks are remembered. name what leaves the machine the first time.
- **never block**: items wait in the inbox, never auto-open while the draft has text, and open in place with the thread visible. no modal eats keys.

## dialogs and page heroes (desktop)
Mocks: page `page-hero` (bise pages). Gabriel's ask: calmer popups, and every page and dialog says what it is, for good.
- **scrim**: the window ground at 62 % (`--c-scrim: color-mix(in srgb, var(--c-ground) 62%, transparent)`, dark and light): the page fades toward its own paper and stays sharp. never a blur behind a dialog.
- **dialog shadow**: `--e-sheet: 0 0 0 1px var(--c-line), 0 1px 2px <shadow 8%>, 0 12px 32px -12px <shadow 22%, light 12%>`. `--e-3` (the wide halo) only for what floats over other apps: spotlight, capsule, palette.
- **dialog place**: 12 % from the window top, centred across, 520 px (480 under 800), grows down. solid surface, radius 12, padding 24. in: fade + 8 px rise, 160 ms ease-out; scrim 120 ms; out 120 ms fade; reduced motion: fades only.
- **page hero**: the first block of every full page (inbox, artifacts, scheduled, processes, agents, archived, each settings section) and of every dialog or sheet; never in the thread, side panels, menus, popovers, the capsule. page: a card on `--c-raised`, radius 12, padding 20 24, 24 above the content; text left, a bims-world vignette right (220 × 132, bleeding to the card's right and bottom edges). dialog: no card, a 64 px vignette left of the title, 16 px gap, 20 px to the first field.
- **its words**: the place's name (t-22 600; dialog t-17); one sentence, t-15/1.5 text-2, ≤ 56 ch, 4 px under it, saying what this place is in his words; a facts line, t-13 text-3, 8 px under: live numbers, the accent only on what waits on him. never "welcome", "here you can…", click steps, a button.
- **permanent**: no ×, no "got it", no setting hides it; it scrolls away with the page (the title-bar crumb keeps the name). under 800 px the vignette goes, the words stay.
- **the vignette**: stills from the bims renderer at his hour's light, one per state (a letter more in the mailbox, the bim's `?` only when something waits). still at rest; a 1–2 s move only when its state changes; none under reduced motion.

## words
- bise says "i", the user is "you". four nouns: you, main (team lead), agents, the inbox; what waits in the inbox is a notification (#12 in a tight row, never "notif"), and the macOS one is a banner. never task, hub, sub-agent, orchestrator, cards.
- state words, the same everywhere: working, idle, done, waiting, asks you, failed, starting, stopped.
- picker titles are questions, flashes are `✓ state`, keys are verbs. no period on titles or labels. numbers before units: `58k · 22%`, `3m`.
- templates: error `✗ X. /cmd fixes it.` · tip `fact. key does what.` · mode `auto · safe calls run, risky ones ask you` · answered `✓ you allowed t3: …` · hard rule `it rewrites main. this one always asks.`
- no LLM tells: seamless, "X, not Y", "never deleted", let's, exclamation marks.

## the bims (desktop)
The animated office of agents (one bim = one agent, `?` accent / `✗` error the only UI colors on it, light from his hour, never a grey void): book §6b for the tone, `docs/brand/bims.md` for the spec, the laws and where the code lives.

## ship checklist
blocks typing? · the one key? · which level? · every new mark has its tip words? · rest vs held? · color only for needs-you/failure? · glyph unique + 1 cell + ASCII? · every shown key works here + fallback? · the trace after acting? · drop order at 80? · dark/light/NO_COLOR/ASCII? · words (lowercase, 4 nouns)? · failure = one line + fix + nothing lost?

## process
user's words → mock on real geometry (`site/content/*.html`, local) → variants only where unsure, pick marked → user picks → build → tmux captures 150/80, ctrl up/held → designer signs off → book updated.
