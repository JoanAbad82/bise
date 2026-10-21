# Landing in this repo

Land first, full gate after. Before `sb land`: `tests/gate.sh quick` GREEN on your sha, plus any check your brief or reviewer names for your area; `sb land`'s own land check must then be green (it refuses a red one). No `gate.sh full` before a land.
After the land, the tip gate runs the full gate on main's tip: put your land sha in your report and watch its result. If the tip goes red in your area, revert your land on main first, then fix and land again. Shots are signed after the land, on the landed sha. A release is cut only from a tip-green sha.
The full rule: docs/loop-speed.md §0, rule 11.
