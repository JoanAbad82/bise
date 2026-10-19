# bend/proofs/lib/hub-names.bend: name-free (architect m_31139), law L4
# support for a take of an old name. A task_created or a renamed takes a
# name no agent has (HX.FreshEv: HM.name_held), and apply strips it from
# every agent's old names (HM.strip): the names stay apart, and the name
# is free among what is left. Layered after hub-1 and hub-2; hub-3's
# hub_apply_names calls it.
import Base
import ../../vendor/json.bend as J
import ../../hub/model.bend as HM
import ../../hub/gen/state.bend as HS
import ../../hub/gen/state-laws.bend as HSL
import ../../hub/cx.bend as HX
import ../../hub/inv.bend as HI
import ../../hub/names.bend as HN
import ../../hub/lazy.bend as HLZ
import ./hub-1.bend as PL1
import ./hub-2.bend as PL2

# ---- drop_str: a list of old names without one ----

def nm_out.keep(c: Bool, +h: String, +rest: List<&2, String>, +m: String, eh: {String.eq(h, m) == False{} : Bool}, er: {HM.str_in(rest, m) == False{} : Bool})
    -> {HM.str_in(HN.drop_str.keep(c, h, rest), m) == False{} : Bool}:
  match c:
    case True{}:
      er
    case False{}:
      PL1.hub_lor_false(String.eq(h, m), HM.str_in(rest, m), eh, er)

# a name not in the list is not in it after a drop
def nm_out(+al: List<&2, String>, +n: String, +m: String, +e: {HM.str_in(al, m) == False{} : Bool}) -> {HM.str_in(HN.drop_str(al, n), m) == False{} : Bool}:
  match al:
    case Nil{}:
      {==}
    case Con{h, t}:
      nm_out.keep(String.eq(h, n), h, HN.drop_str(t, n), m, PL1.hub_lor_false_l(String.eq(h, m), HM.str_in(t, m), e),
        nm_out(t, n, m, PL1.hub_lor_false_r(String.eq(h, m), HM.str_in(t, m), e)))

def nm_gone.keep(c: Bool, +h: String, +rest: List<&2, String>, +n: String, ec: {String.eq(h, n) == c : Bool}, er: {HM.str_in(rest, n) == False{} : Bool})
    -> {HM.str_in(HN.drop_str.keep(c, h, rest), n) == False{} : Bool}:
  match c:
    case True{}:
      er
    case False{}:
      PL1.hub_lor_false(String.eq(h, n), HM.str_in(rest, n), ec, er)

# the dropped name is gone
def nm_gone(+al: List<&2, String>, +n: String) -> {HM.str_in(HN.drop_str(al, n), n) == False{} : Bool}:
  match al:
    case Nil{}:
      {==}
    case Con{h, t}:
      nm_gone.keep(String.eq(h, n), h, HN.drop_str(t, n), n, {==}, nm_gone(t, n))

# ---- the strip keeps the names apart ----

def nm_apart(+nm: String, +al: List<&2, String>, +m: String, +bl: List<&2, String>, +n: String, a: HI.Apart(nm <> al, m <> bl))
    -> HI.Apart(nm <> HN.drop_str(al, n), m <> HN.drop_str(bl, n)):
  match a:
    case HX.Both{+a1, a2}:
      HX.Both{PL1.hub_lor_false(String.eq(m, nm), HM.str_in(HN.drop_str(bl, n), nm), PL1.hub_lor_false_l(String.eq(m, nm), HM.str_in(bl, nm), a1),
          nm_out(bl, n, nm, PL1.hub_lor_false_r(String.eq(m, nm), HM.str_in(bl, nm), a1))),
        nm_out(al, n, m, a2)}

def nm_apart_ag(+a: HS.Agent, +b: HS.Agent, +n: String, ap: HI.Apart(HI.names(a), HI.names(b)))
    -> HI.Apart(HI.names(HM.Agent.strip(a, n)), HI.names(HM.Agent.strip(b, n))):
  %HSL.Agent.aliases.eta(a, HN.drop_str(HS.Agent.aliases(a), n)) : HI.Apart(HI.names(_), HI.names(HM.Agent.strip(b, n)))
  %HSL.Agent.aliases.eta(b, HN.drop_str(HS.Agent.aliases(b), n)) : HI.Apart(HS.Agent.name(a) <> HN.drop_str(HS.Agent.aliases(a), n), HI.names(_))
  nm_apart(HS.Agent.name(a), HS.Agent.aliases(a), HS.Agent.name(b), HS.Agent.aliases(b), n, ap)

def nm_aa(+a: HS.Agent, +t: List<&2, HS.Agent>, +n: String, aa: HI.ApartAll(HI.names(a), HI.profile(t)))
    -> HI.ApartAll(HI.names(HM.Agent.strip(a, n)), HI.profile(HM.strip(t, n))):
  match t:
    case Nil{}:
      Unit{}
    case Con{b, r}:
      match aa:
        case HX.Both{a1, a2}:
          HX.Both{nm_apart_ag(a, b, n, a1), nm_aa(a, r, n, a2)}

# the agents' names stay apart once an old name is stripped
def nm_ok(+xs: List<&2, HS.Agent>, +n: String, ok: HI.NamesOK(HI.profile(xs))) -> HI.NamesOK(HI.profile(HM.strip(xs, n))):
  match xs:
    case Nil{}:
      Unit{}
    case Con{a, t}:
      match ok:
        case HX.Both{o1, o2}:
          HX.Both{nm_aa(a, t, n, o1), nm_ok(t, n, o2)}

# ---- the name is free once stripped ----

def nm_free_head(+a: HS.Agent, +n: String, e: {String.eq(HS.Agent.name(a), n) == False{} : Bool})
    -> {HM.str_in(HI.names(HM.Agent.strip(a, n)), n) == False{} : Bool}:
  %HSL.Agent.aliases.eta(a, HN.drop_str(HS.Agent.aliases(a), n)) : {HM.str_in(HI.names(_), n) == False{} : Bool}
  PL1.hub_lor_false(String.eq(HS.Agent.name(a), n), HM.str_in(HN.drop_str(HS.Agent.aliases(a), n), n), e, nm_gone(HS.Agent.aliases(a), n))

def nm_free.absurd(-a: HS.Agent, -t: List<&2, HS.Agent>, -n: String, x: Empty) -> PL2.hub_free(HI.profile(HM.strip(a <> t, n)), n):
  match x:

def nm_free.pick(c: Bool, +a: HS.Agent, +t: List<&2, HS.Agent>, +n: String, +e: {String.eq(HS.Agent.name(a), n) == c : Bool},
    hn: {HLZ.pick(Maybe<&2, HS.Agent>, c, u => Some{a}, u => HM.agent_named(t, n)) == None{} : Maybe<&2, HS.Agent>},
    k: @p: {HM.agent_named(t, n) == None{} : Maybe<&2, HS.Agent>} -> PL2.hub_free(HI.profile(HM.strip(t, n)), n))
    -> PL2.hub_free(HI.profile(HM.strip(a <> t, n)), n):
  match c:
    case True{}:
      nm_free.absurd(a, t, n, PL2.hub_some_none(a, hn))
    case False{}:
      HX.Both{nm_free_head(a, n, e), k(hn)}

# a name no agent has as its name is free among the stripped agents' names
def nm_free(+xs: List<&2, HS.Agent>, +n: String, hn: {HM.agent_named(xs, n) == None{} : Maybe<&2, HS.Agent>})
    -> PL2.hub_free(HI.profile(HM.strip(xs, n)), n):
  match xs:
    case Nil{}:
      Unit{}
    case Con{a, t}:
      nm_free.pick(String.eq(HS.Agent.name(a), n), a, t, n, {==}, hn, p => nm_free(t, n, p))

def nm_none(m: Maybe<&2, HS.Agent>, e: {Maybe.is_some(&2, HS.Agent, m) == False{} : Bool}) -> {m == None{} : Maybe<&2, HS.Agent>}:
  match m:
    case None{}:
      {==}
    case Some{x}:
      PL1.hub_absurd_eq(PL1.hub_tf_absurd(e), Maybe<&2, HS.Agent>, Some{x}, None{})

# a name no agent holds (FreshEv): no agent has it as its name
def nm_held(+s: HM.St, +n: String, k: {HM.name_held(s, n) == False{} : Bool}) -> {HM.agent_named(HM.St.agents(s), n) == None{} : Maybe<&2, HS.Agent>}:
  nm_none(HM.agent_named(HM.St.agents(s), n),
    PL1.hub_or_false_r(HM.reserved(n), Maybe.is_some(&2, HS.Agent, HM.agent_named(HM.St.agents(s), n)), k))
