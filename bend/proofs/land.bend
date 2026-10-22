# bend/proofs/land.bend: the proofs of bend/laws/land.bend. The line's
# laws rewrite with their premise (held, an unknown ticket); the check's
# law reads both picks; the instances and the words compute.
import Base
import ../vendor/json.bend as J
import ../hub/land.bend as HL
import ../hub/lazy.bend as HLZ
import ../laws/land.bend as Laws

def Laws.one_go_per_target(ls, target, e):
  %Equal.sym(Bool, HL.held(ls, target), True{}, e) : {HLZ.pick(List<&2, J.Json> & Maybe<&2, Nat>, _, u => (ls, None{}), u => HL.grant.go(HL.first_of(ls, target), ls)) == (ls, None{}) : List<&2, J.Json> & Maybe<&2, Nat>}
  {==}

def Laws.unknown_end_noop(ls, n, e):
  %Equal.sym(Maybe<&2, String>, HL.target_of(ls, n), None{}, e) : {HL.end.go(_, HL.drop(ls, n)) == (HL.drop(ls, n), None{}) : List<&2, J.Json> & Maybe<&2, Nat>}
  {==}

def Laws.line_fifo():
  {==}

def Laws.line_second_waits():
  {==}

def Laws.end_frees():
  {==}

def Laws.lines_per_target():
  {==}

def Laws.claim_once():
  {==}

def Laws.claim_ended():
  {==}

def Laws.claim_here_per_agent():
  {==}

def land_pick_tt(c: Bool) -> {Bool.pick(Bool, c, True{}, True{}) == True{} : Bool}:
  match c:
    case True{}:
      {==}
    case False{}:
      {==}

def Laws.busy_words():
  {==}

def Laws.lids():
  {==}
