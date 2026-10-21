# Landing in this repo

Land first, end-to-end after, on main only. Before `sb land`: the fast checks only, `tests/gate.sh quick` GREEN on your sha (clippy, your crates' tests, PROOF, typecheck, lint, vitest); `sb land`'s own land check must then be green (it refuses a red one). No end-to-end before a land: no `*_e2e.py`, `*_tmux.py`, `pnpm test:land`, Playwright or desktop harness check, as-he-does row, nor `gate.sh full`, even when a brief names one.
After the land, the tip gate runs every end-to-end test on main's tip (and a release's full gate): put your land sha in your report. A red there names you in tip-red, which main forwards: revert your land on main first, then fix and land again. Shots are signed after the land, on the landed sha. A release is cut only from a tip-green sha.
The full rule: docs/loop-speed.md §0, rule 11.
