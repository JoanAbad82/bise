# Landing in this repo

A green `tests/gate.sh quick` counts only on the sha it ran on. If `sb land` rebased you over other commits, you may land without a new quick gate only when all three hold: quick GREEN on your pre-rebase sha, `sb land`'s own check green, and 0 files in common with the commits you rebased over.
Then run `gate.sh quick` on the landed sha at once and put its GATE line in your report. If it is red, revert your land on main first, then fix. One file in common: rebase, run quick on the rebased sha, then land.
The full rule: docs/loop-speed.md §0, rule 11.
