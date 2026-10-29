# bend/proofs/route.bend: the proofs of bend/laws/route.bend. route_ask's
# two laws unfold its match; addressed's hold by its first match (no
# project, queued) or a rewrite with resolve's answer; the instances
# compute.
import Base
import ../hub/model.bend as HM
import ../hub/gen/state.bend as HS
import ../hub/cx.bend as HX
import ../hub/core.bend as HC
import ../hub/xhub.bend as HXB
import ../hub/gen/fx.bend as HF
import ../laws/route.bend as Laws

def Laws.route_ask_not(o, cx, text, via, context, parts):
  {==}

def Laws.route_ask_held(o, cx, p, text, via, context, parts):
  {==}

def Laws.addressed_off_home(st, q, focus, text, via):
  {==}

def Laws.addressed_never_queued(p, ps, st, focus, text, via):
  {==}

def Laws.addressed_agent_wins(st, n, a, ps, e):
  %Equal.sym(Maybe<&2, String>, HM.resolve(st, n), Some{a}, e) : {HXB.addressed.free(_, n, ps) == None{} : Maybe<&2, HXB.Proj>}
  {==}

def Laws.addressed_needs_an_address(st, ps):
  {==}

def Laws.address_reads_his_at():
  {==}

def Laws.address_never_a_name_in_his_words():
  {==}

def Laws.address_needs_a_name_and_words():
  {==}

def Laws.project_named_by_its_name_only():
  {==}

def Laws.routable_only_plain_words_to_main_now():
  {==}
