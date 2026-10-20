# bend/proofs/say_from.bend: the proofs of bend/laws/say_from.bend. Each
# holds by unfolding: an empty `from` picks the branch that writes
# nothing, a live other thread the one that writes the route row.
import Base
import ../hub/model.bend as HM
import ../hub/gen/state.bend as HS
import ../hub/cx.bend as HX
import ../hub/core.bend as HC
import ../hub/lazy.bend as HLZ
import ../hub/gen/feed.bend as HFD
import ../laws/say_from.bend as Laws

def Laws.say_from_none_no_row(o, cx, to, id, text, parts):
  {==}

def Laws.say_from_leaves_one_route_row(o, cx, from, to, id, text, parts, e):
  +row = HC.route_parts.at(o, HC.feed(o, cx, from, HFD.route(to, None{}, text, Some{id}, None{}, None{})), from, parts)
  %Equal.sym(Bool, String.is_empty(from) || String.eq(from, to) || Bool.not(HM.live_agent(HM.get_agent(HC.st(o, cx), from))), False{}, e) : {HLZ.pick(HX.Cx<o>, _, u => cx, u => row) == row : HX.Cx<o>}
  {==}

def Laws.say_from_changes_nothing_else(o, cx, m, to, text, from, parts):
  {==}
