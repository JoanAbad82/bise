# hub/codec.bend — the records inside sb-core's journal lines and its
# messages as JSON (a message, a card, a route, a timer...), in the exact
# serde format of rust/switchboard/src/model.rs, each with its round law.
# The lines themselves are generated (gen/journal.bend, from
# bise_proto::core::journal): a new journal kind is a row there, never a
# branch here.
import Base

import ../vendor/json.bend as J

import ./model.bend as M

import ./timers.bend as TM

import ./wakes.bend as WK

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

def life_str(l: M.Life) -> String:
  match l:
    case M.LActive{}:
      "active"
    case M.LStopped{}:
      "stopped"
    case M.LArchived{}:
      "archived"
    case M.LFailed{}:
      "failed"

def decl_str(d: M.Decl) -> String:
  match d:
    case M.DWorking{}:
      "working"
    case M.DDone{}:
      "done"
    case M.DBlocked{}:
      "blocked"

def jmaybe_decl(m: Maybe<&2, M.Decl>) -> J.Json:
  match m:
    case None{}:
      J.JNull{}
    case Some{+d}:
      J.JStr{decl_str(d)}

def card_json(+c: M.Card) -> J.Json:
  J.obj([J.kv("id", J.JNum{M.Card.id(c)}), J.kv("kind", J.JStr{M.Card.kind(c)}),
    J.kv("agent", J.JStr{M.Card.agent(c)}), J.kv("text", J.JStr{M.Card.text(c)}),
    J.kv("for_msg", jmaybe_nat(M.Card.for_msg(c))), J.kv("created_ms", J.JNum{M.Card.created(c)}),
    J.kv("place", jmaybe_str(M.Card.place(c))), J.kv("pr", jmaybe_nat(M.Card.pr(c)))])

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

def life.of_s(+s: String) -> M.Life:
  Bool.pick(M.Life, String.eq(s, "stopped"), M.LStopped{},
    Bool.pick(M.Life, String.eq(s, "archived"), M.LArchived{},
      Bool.pick(M.Life, String.eq(s, "failed"), M.LFailed{}, M.LActive{})))

def decl.of_s(m: Maybe<&2, String>) -> Maybe<&2, M.Decl>:
  match m:
    case None{}:
      None{}
    case Some{+s}:
      Some{Bool.pick(M.Decl, String.eq(s, "done"), M.DDone{},
        Bool.pick(M.Decl, String.eq(s, "blocked"), M.DBlocked{}, M.DWorking{}))}

def card_of(+j: J.Json) -> M.Card:
  M.Card{get_nat(j, "id"), get_s(j, "kind"), get_s(j, "agent"), get_s(j, "text"),
    opt_nat(J.get(j, "for_msg")), get_nat(j, "created_ms"), opt_str(J.get(j, "place")),
    opt_nat(J.get(j, "pr"))}

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

def what_of(+j: J.Json) -> TM.What:
  Bool.pick(TM.What, String.eq(get_s(j, "kind"), "retry"), TM.Retry{get_nat(j, "xid")}, TM.RouteSend{get_nat(j, "rid")})

def act_of(+j: J.Json) -> TM.Act:
  TM.Act{get_nat(j, "id"), get_nat(j, "due"), what_of(get_j(j, "what"))}

# an every_set's schedule, as every.rs read it: every_ms (at least 1 s),
# else daily_min (mod a day), else not a timer (the line is skipped)
def sched_of(e: Maybe<&2, Nat>, d: Maybe<&2, Nat>) -> Maybe<&2, TM.Sched>:
  match e:
    case Some{+p}:
      Some{TM.Every{Nat.max(p, 1000n)}}
    case None{}:
      Maybe.map(&2, Nat, TM.Sched, m => TM.Daily{Nat.mod(m, 1440n)}, d)

# ---- the records inside a journal line, for gen/journal.bend (one codec
# per record; journal.rs's Codec rows name them) ----

def life_of(j: J.Json) -> M.Life:
  match j:
    case J.JStr{+s}:
      life.of_s(s)
    case _:
      M.LActive{}

def life_json(l: M.Life) -> J.Json:
  J.JStr{life_str(l)}

def decl_of(j: J.Json) -> Maybe<&2, M.Decl>:
  match j:
    case J.JStr{+s}:
      decl.of_s(Some{s})
    case _:
      None{}

def decl_json(m: Maybe<&2, M.Decl>) -> J.Json:
  jmaybe_decl(m)

# an every_set's timer: its keys but `at` (the line's), its schedule as
# every.rs wrote it; no schedule: no timer (the line is skipped)
def timer.with(s: Maybe<&2, TM.Sched>, +j: J.Json) -> Maybe<&2, TM.Timer>:
  match s:
    case None{}:
      None{}
    case Some{+sc}:
      Some{TM.Timer{get_nat(j, "id"), get_s(j, "agent"), get_s(j, "by"), get_s(j, "text"), sc,
        get_nat(j, "next_ms"), opt_nat(J.get(j, "until_ms")), opt_nat(J.get(j, "times")), 0n,
        opt_str(J.get(j, "page")), 0n, Nil{}, get_s(j, "name"), get_b(j, "held")}}

def timer_of(+j: J.Json) -> Maybe<&2, TM.Timer>:
  timer.with(sched_of(opt_nat(J.get(j, "every_ms")), opt_nat(J.get(j, "daily_min"))), j)

def timer_kvs(+t: TM.Timer) -> List<&2, Sigma<&2, &2, String, _ => J.Json>>:
  List.append(&2, Sigma<&2, &2, String, _ => J.Json>,
    [J.kv("id", J.JNum{TM.Timer.id(t)}), J.kv("agent", J.JStr{TM.Timer.agent(t)}),
      J.kv("by", J.JStr{TM.Timer.by(t)}), J.kv("text", J.JStr{TM.Timer.text(t)}),
      J.kv("next_ms", J.JNum{TM.Timer.next(t)}), TM.sched_kv(TM.Timer.sched(t))],
    List.append(&2, Sigma<&2, &2, String, _ => J.Json>, TM.opt_kvs(t), TM.flag_kv("held", TM.Timer.held(t))))

def out_json(+o: XH.Out) -> J.Json:
  XH.out_json(o)

def xin_json(+i: XH.XIn) -> J.Json:
  XH.xin_json(i)

def route_json(+r: XH.Route) -> J.Json:
  XH.route_json(r)

def act_json(+a: TM.Act) -> J.Json:
  TM.act_json(a)

def watch_of(+j: J.Json) -> WK.Watch:
  WK.watch_of(j)

def watch_json(+w: WK.Watch) -> J.Json:
  WK.watch_json(w)


# ---- each record reads back what it writes (gen/journal-laws.bend's
# round laws go through these) ----

law card_round:
  for c: M.Card
  {card_of(card_json(c)) == c : M.Card}

def card_round(c):
  match c:
    case M.Card{id, k, a, tx, None{}, cr, None{}, None{}}:
      {==}
    case M.Card{id, k, a, tx, None{}, cr, None{}, Some{p}}:
      {==}
    case M.Card{id, k, a, tx, None{}, cr, Some{pl}, None{}}:
      {==}
    case M.Card{id, k, a, tx, None{}, cr, Some{pl}, Some{p}}:
      {==}
    case M.Card{id, k, a, tx, Some{f}, cr, None{}, None{}}:
      {==}
    case M.Card{id, k, a, tx, Some{f}, cr, None{}, Some{p}}:
      {==}
    case M.Card{id, k, a, tx, Some{f}, cr, Some{pl}, None{}}:
      {==}
    case M.Card{id, k, a, tx, Some{f}, cr, Some{pl}, Some{p}}:
      {==}

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

law act_round:
  for a: TM.Act
  {act_of(act_json(a)) == a : TM.Act}

def act_round(a):
  match a:
    case TM.Act{id, d, TM.RouteSend{r}}:
      {==}
    case TM.Act{id, d, TM.Retry{x}}:
      {==}

law watch_round:
  for w: WK.Watch
  {watch_of(watch_json(w)) == w : WK.Watch}

def watch_round(w):
  match w:
    case WK.Watch{id, a, sp, mt, sa, ma, q, r}:
      {==}
