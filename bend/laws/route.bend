# bend/laws/route.bend: his words' route (issue 37 #1, architect m_34720):
# whether his line to the agent in view goes to a project. xhub.bend
# `addressed` decides, core.bend's route_ask holds and answers; route.rs and
# daemon/routing.rs's decision moved here. Closed by bend/proofs/route.bend;
# the gate checks every bend/proofs/*.bend. The hold, the fire and the
# cancel that follow: bend/laws/hub.bend `route_*`.
import Base
import ../hub/model.bend as HM
import ../hub/gen/state.bend as HS
import ../hub/cx.bend as HX
import ../hub/core.bend as HC
import ../hub/xhub.bend as HXB
import ../hub/gen/fx.bend as HF


# LAW: an ask that names no project holds nothing: no event, no journal
# line, only the answer `routed: false` (the shell then steps his input
# to the agent in view, as before).
law route_ask_not:
  for -o: HS.St
  for +cx: HX.Cx<o>
  for +text: String
  for +via: String
  for +context: String
  for +parts: String
  {HC.route_ask(o, None{}, cx, text, via, context, parts) == HC.out(o, cx, HF.route_asked(False{})) : HX.Cx<o>}

# LAW: an ask that names project `p` holds his words for it (route_held:
# the event, the act, fx route), then answers `routed: true`; so the
# answer is true iff a route was held in that step.
law route_ask_held:
  for -o: HS.St
  for +cx: HX.Cx<o>
  for +p: HXB.Proj()
  for +text: String
  for +via: String
  for +context: String
  for +parts: String
  {HC.route_ask(o, Some{p}, cx, text, via, context, parts) == HC.out(o, HC.route_held(o, cx, HXB.route_for(p, text, via, context, parts)), HF.route_asked(True{})) : HX.Cx<o>}

# LAW: off bise's home hub (no project) nothing routes, his text unread.
law addressed_off_home:
  for +st: HS.St
  for q: Bool
  for +focus: String
  for +text: String
  for +via: String
  {HXB.addressed(Nil{}, st, q, focus, text, via) == None{} : Maybe<&2, HXB.Proj()>}

# LAW: queued words never route (they wait for the agent in view).
law addressed_never_queued:
  for +p: HXB.Proj()
  for +ps: List<&2, HXB.Proj()>
  for +st: HS.St
  for +focus: String
  for +text: String
  for +via: String
  {HXB.addressed(Con{p, ps}, st, True{}, focus, text, via) == None{} : Maybe<&2, HXB.Proj()>}

# LAW: an agent of this hub by that name (or alias) wins his `@name`.
law addressed_agent_wins:
  for +st: HS.St
  for +n: String
  for +a: String
  for +ps: List<&2, HXB.Proj()>
  for e: {HM.resolve(st, n) == Some{a} : Maybe<&2, String>}
  {HXB.addressed.to(Some{n}, st, ps) == None{} : Maybe<&2, HXB.Proj()>}

# LAW: no address, nothing to route.
law addressed_needs_an_address:
  for +st: HS.St
  for +ps: List<&2, HXB.Proj()>
  {HXB.addressed.to(None{}, st, ps) == None{} : Maybe<&2, HXB.Proj()>}

# The cases route.rs's tests pinned (his m_75 and 0170ed3fb: words ABOUT
# a project, a name in a path or a URL, stay with the agent in view).
law address_reads_his_at:
  {[HXB.address("@harness fix the login"), HXB.address("  @Harness: fix the login"), HXB.address("@rapid-site, the hero"), HXB.address("@checkout\nthe card form"), HXB.address("@harness: fix it")]
    == [Some{"harness"}, Some{"Harness"}, Some{"rapid-site"}, Some{"checkout"}, Some{"harness"}] : List<&2, Maybe<&2, String>>}

law address_never_a_name_in_his_words:
  {[HXB.address("je les voie pas dans harness non plus"), HXB.address("au fait demande a harness de faire en sorte que"), HXB.address("harness: is it green?"), HXB.address("tell @harness to fix it"), HXB.address("check ~/code/harness/out.txt"), HXB.address("see https://github.com/acme/harness/pull/3"), HXB.address("fix @harness now")]
    == [None{}, None{}, None{}, None{}, None{}, None{}, None{}] : List<&2, Maybe<&2, String>>}

law address_needs_a_name_and_words:
  {[HXB.address("@harness"), HXB.address("@harness   "), HXB.address("@ harness fix it"), HXB.address("@: fix it"), HXB.address("")]
    == [None{}, None{}, None{}, None{}, None{}] : List<&2, Maybe<&2, String>>}

law project_named_by_its_name_only:
  {[HXB.project_named([("harness-1a2b", "harness"), ("checkout-1a2b", "checkout")], "Harness"), HXB.project_named([("harness-1a2b", "harness")], "harnes"), HXB.project_named([("harness-1a2b", "harness")], "telemetry")]
    == [Some{("harness-1a2b", "harness")}, None{}, None{}] : List<&2, Maybe<&2, HXB.Proj()>>}

law routable_only_plain_words_to_main_now:
  {[HXB.routable(False{}, "", "@shop the checkout is slow", ""), HXB.routable(False{}, "main", "@shop the checkout is slow", "capsule"), HXB.routable(False{}, "docs", "@shop the checkout is slow", ""), HXB.routable(True{}, "main", "@shop the checkout is slow", ""), HXB.routable(False{}, "main", "/answer 3 yes", ""), HXB.routable(False{}, "main", "  ", ""), HXB.routable(False{}, "main", "@shop fix it", "capsule-start")]
    == [True{}, True{}, False{}, False{}, False{}, False{}, False{}] : List<&2, Bool>}
