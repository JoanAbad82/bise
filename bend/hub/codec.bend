# hub/codec.bend — the records inside sb-core's journal lines and its
# messages as JSON (a route...; a message, a card, a timer, an act, a watch: gen/state-codec.bend), in the exact
# serde format of rust/switchboard/src/model.rs, each with its round law.
# The lines themselves are generated (gen/journal.bend, from
# bise_proto::core::journal): a new journal kind is a row there, never a
# branch here.
import Base

import ../vendor/json.bend as J

import ./model.bend as M

import ./xhub-model.bend as XH

def jmaybe_nat(m: Maybe<&2, Nat>) -> J.Json:
  match m:
    case None{}:
      J.JNull{}
    case Some{+n}:
      J.JNum{n}

def jmaybe_str(m: Maybe<&2, String>) -> J.Json:
  match m:
    case None{}:
      J.JNull{}
    case Some{+s}:
      J.JStr{s}

# ---- decoding (the journal replayed at boot) ----

def get_nat(+j: J.Json, +k: String) -> Nat:
  J.get_num_or(j, k, 0n)

def get_s(+j: J.Json, +k: String) -> String:
  J.get_str_or(j, k, "")

def get_b(+j: J.Json, +k: String) -> Bool:
  J.get_bool_or(j, k, False{})

def get_j(+j: J.Json, +k: String) -> J.Json:
  Maybe.default(&2, J.Json, J.get(j, k), J.JNull{})

def opt_nat(m: Maybe<&2, J.Json>) -> Maybe<&2, Nat>:
  match m:
    case Some{J.JNum{+n}}:
      Some{n}
    case _:
      None{}

def opt_str(m: Maybe<&2, J.Json>) -> Maybe<&2, String>:
  match m:
    case Some{J.JStr{+s}}:
      Some{s}
    case _:
      None{}

# bise desktop S2's kinds (an older sb-core has none: KUnknown, skipped)
def out_st_of(+s: String) -> XH.OutSt:
  Bool.pick(XH.OutSt, String.eq(s, "settled"), XH.OSettled{}, Bool.pick(XH.OutSt, String.eq(s, "acked"), XH.OAcked{}, XH.OPending{}))

def out_of(+j: J.Json) -> XH.Out:
  XH.Out{get_nat(j, "xid"), get_s(j, "project"), XH.kind_of(get_s(j, "kind")), get_nat(j, "msg"), get_s(j, "text"),
    out_st_of(get_s(j, "state")), get_nat(j, "tries"), get_s(j, "context"), get_s(j, "parts")}

def xin_of(+j: J.Json) -> XH.XIn:
  XH.XIn{get_s(j, "hub"), get_nat(j, "xid"), get_nat(j, "msg"), XH.kind_of(get_s(j, "kind")), get_b(j, "replied")}

def route_of(+j: J.Json) -> XH.Route:
  XH.Route{get_nat(j, "rid"), get_s(j, "text"), get_s(j, "via"), get_s(j, "to"), get_s(j, "name"), get_nat(j, "due_ms"),
    get_nat(j, "act"), get_s(j, "why"), XH.rst_of(get_s(j, "state")), get_s(j, "context"), get_s(j, "parts")}

# ---- the records inside a journal line, for gen/journal.bend (one codec
# per record; journal.rs's Codec rows name them) ----


def out_json(+o: XH.Out) -> J.Json:
  XH.out_json(o)

def xin_json(+i: XH.XIn) -> J.Json:
  XH.xin_json(i)

def route_json(+r: XH.Route) -> J.Json:
  XH.route_json(r)



# ---- each record reads back what it writes (gen/journal-laws.bend's
# round laws go through these) ----

law out_round.k:
  for x: Nat
  for p: String
  for k: XH.XKind
  for m: Nat
  for tx: String
  for st: XH.OutSt
  for tr: Nat
  for cx: String
  for pa: String
  {out_of(out_json(XH.Out{x, p, k, m, tx, st, tr, cx, pa})) == XH.Out{x, p, k, m, tx, st, tr, cx, pa} : XH.Out}

def out_round.k(x, p, k, m, tx, st, tr, cx, pa):
  match k st pa:
    case XH.KInput{} XH.OPending{} SNil{}:
      {==}
    case XH.KInput{} XH.OPending{} SCon{h, t}:
      {==}
    case XH.KInput{} XH.OAcked{} SNil{}:
      {==}
    case XH.KInput{} XH.OAcked{} SCon{h, t}:
      {==}
    case XH.KInput{} XH.OSettled{} SNil{}:
      {==}
    case XH.KInput{} XH.OSettled{} SCon{h, t}:
      {==}
    case XH.KAsk{} XH.OPending{} SNil{}:
      {==}
    case XH.KAsk{} XH.OPending{} SCon{h, t}:
      {==}
    case XH.KAsk{} XH.OAcked{} SNil{}:
      {==}
    case XH.KAsk{} XH.OAcked{} SCon{h, t}:
      {==}
    case XH.KAsk{} XH.OSettled{} SNil{}:
      {==}
    case XH.KAsk{} XH.OSettled{} SCon{h, t}:
      {==}
    case XH.KJobEnd{} XH.OPending{} SNil{}:
      {==}
    case XH.KJobEnd{} XH.OPending{} SCon{h, t}:
      {==}
    case XH.KJobEnd{} XH.OAcked{} SNil{}:
      {==}
    case XH.KJobEnd{} XH.OAcked{} SCon{h, t}:
      {==}
    case XH.KJobEnd{} XH.OSettled{} SNil{}:
      {==}
    case XH.KJobEnd{} XH.OSettled{} SCon{h, t}:
      {==}

law out_round:
  for o: XH.Out
  {out_of(out_json(o)) == o : XH.Out}

def out_round(o):
  match o:
    case XH.Out{x, p, k, m, tx, st, tr, cx, SNil{}}:
      out_round.k(x, p, k, m, tx, st, tr, cx, SNil{})
    case XH.Out{x, p, k, m, tx, st, tr, cx, SCon{h, t}}:
      out_round.k(x, p, k, m, tx, st, tr, cx, SCon{h, t})

law xin_round:
  for i: XH.XIn
  {xin_of(xin_json(i)) == i : XH.XIn}

def xin_round(i):
  match i:
    case XH.XIn{h, x, m, XH.KInput{}, r}:
      {==}
    case XH.XIn{h, x, m, XH.KAsk{}, r}:
      {==}
    case XH.XIn{h, x, m, XH.KJobEnd{}, r}:
      {==}

law route_round:
  for r: XH.Route
  {route_of(route_json(r)) == r : XH.Route}

def route_round(r):
  match r:
    case XH.Route{id, tx, v, to, n, d, a, w, XH.RHeld{}, cx, SNil{}}:
      {==}
    case XH.Route{id, tx, v, to, n, d, a, w, XH.RHeld{}, cx, SCon{h, t}}:
      {==}
    case XH.Route{id, tx, v, to, n, d, a, w, XH.RSent{}, cx, SNil{}}:
      {==}
    case XH.Route{id, tx, v, to, n, d, a, w, XH.RSent{}, cx, SCon{h, t}}:
      {==}
    case XH.Route{id, tx, v, to, n, d, a, w, XH.RCancelled{}, cx, SNil{}}:
      {==}
    case XH.Route{id, tx, v, to, n, d, a, w, XH.RCancelled{}, cx, SCon{h, t}}:
      {==}

