# bend/laws/hub.bend: the hub (sb-core): agents, messages, timers, watches, pause, queued input, composer, cross-hub, routing, followed jobs.
# Open claims, each one closed by bend/proofs/hub.bend (moved from
# LAWS.bend). The gate checks every bend/proofs/*.bend: a law here
# with no proof there fails it.
import Base
import ../vendor/json.bend as J
import ../hub/model.bend as HM
import ../hub/cx.bend as HX
import ../hub/core.bend as HC
import ../hub/inv.bend as HI
import ../hub/timers.bend as HTM
import ../hub/wakes.bend as HWK
import ../hub/xhub-model.bend as HXH
import ../hub/xhub.bend as HXB
import ../hub/codec.bend as HCo
import ../hub/pause.bend as HP
import ../hub/feature.bend as HFT

# ---- Switchboard hub (hub/*.bend, the sb-core process) ----
# The laws quantify over EVERY hub state, EVERY input (any JSON line the
# daemon may send) and EVERY sequence of inputs: no test could enumerate
# them. HC.step is the decision of one input, HC.commit what sb-core keeps
# of it, HC.run its loop over a list of inputs.

# LAW: after any input, the hub's state is exactly the replay of the
# journal events it emitted over the state before (the journal is a
# faithful log: a restart that replays it rebuilds the same state).
law hub_step_replays:
  for +h: HC.Hub
  for +i: J.Json
  {HX.Core.d(HC.Hub.d(h), HX.Cx.c(HC.Hub.d(h), HC.step(h, i)))
    == HM.apply_all(HX.journal(HX.Core.fx(HC.Hub.d(h), HX.Cx.c(HC.Hub.d(h), HC.step(h, i)))), HC.Hub.d(h)) : HM.St}

# LAW: over any sequence of inputs (git answers still missing included),
# the final state is the replay of the whole journal over the first one.
law hub_run_replays:
  for +ins: List<&2, J.Json>
  for +h: HC.Hub
  {HC.Hub.d(HC.RunR.hub(HC.run(ins, h))) == HM.apply_all(HC.RunR.journal(HC.run(ins, h)), HC.Hub.d(h)) : HM.St}

# LAW: every message the hub ever sends, over any sequence of inputs,
# takes the next free id of the state it is sent in: no id is reused, so
# no message overwrites (loses) another.
law msg_ids_fresh:
  for +ins: List<&2, J.Json>
  for +h: HC.Hub
  HX.Fresh(HC.RunR.journal(HC.run(ins, h)), HC.Hub.d(h))

# LAW: no message the hub ever sends is both an automatic reply and a
# question (RFC 0003 §7): automatic replies can never start a chain.
law auto_never_asks:
  for +ins: List<&2, J.Json>
  for +h: HC.Hub
  HX.Quiet(HC.RunR.journal(HC.run(ins, h)))

# LAW: after a tick, every wait still pending ends later than now: a wait
# past its deadline always gets its timeout (with the 25 s cap of `sb
# wait`, no set of agents waiting on each other blocks longer).
law tick_clears_late_waiters:
  for -o: HM.St
  for +cx: HX.Cx<o>
  HC.Later(HC.waiters_of_cx(o, HC.tick(o, cx)), HX.R.now(HX.Cx.r(o, cx)))

# LAW: stopping or dropping a task leaves no wait of it behind (each got
# its `stopped` error), whatever the state.
law stop_leaves_no_waiter:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +n: String
  for +life: HM.Life
  for +why: String
  HC.NoneOf(HC.waiters_of_cx(o, HC.stop_task(o, cx, n, life, why)), n)

# ---- the timers of `sb every` (hub/timers.bend, core.bend `timer_fire`) ----
# The timers' state is in HM.St and their lines (every_set, every_fired,
# every_run, every_stop) are events like the others: hub_run_replays,
# msg_ids_fresh and the rest cover them as they are. The two laws on the
# wake are LOCAL: they are stated on core.bend's `timer_fire`, the only
# path a timer wake takes (the tick's due wakes and /scheduled's run now),
# not over any sequence of inputs: the global form would need a fourth
# proof field in HX.Core and an obligation at every emit of the hub.

# LAW: a fire counts only when its message was queued (amb-tools m_5822: a
# one-shot timer was spent on a lost wake). After the wake's send `p`: a
# refused send adds only the retry line (a due wake: every_fired
# undelivered, fired unchanged, next in a minute; a run now: nothing), no
# count and no stop; a queued one adds exactly the fire (every_fired with
# fired + 1, or every_run for a run now) and, for its last time, the
# timer's stop.
law fire_is_a_message:
  for -o: HM.St
  for p: HX.Cx<o> & HC.SendR
  for +t: HTM.Timer
  for +due: Bool
  for +next: Nat
  {HX.journal(HX.Core.fx(o, HX.Cx.c(o, HC.timer_fire.sent(o, p, t, due, next)))) == HI.fire_journal(o, p, t, due, next) : List<&2, HM.Ev>}

# LAW: a timer never stacks wakes: while a message from bise is still
# queued for its agent, a fire (due or run now) changes nothing at all.
law wake_never_stacked:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +t: HTM.Timer
  for +text: String
  for +due: Bool
  for +next: Nat
  for q: {HC.bise_queued(HX.d(o, cx), HTM.Timer.agent(t)) == True{} : Bool}
  {HC.timer_fire(o, cx, t, text, due, next) == cx : HX.Cx<o>}

# LAW (per event): a counted fire leaves a timer below its times, or it was
# the last one (`spent`: fire_is_a_message shows the same step stops it).
# With the guard (a due wake fires only below its times, HTM.may_fire), a
# timer with times = n never fires more than n times.
law times_bound:
  for +t: HTM.Timer
  for +next: Nat
  for +at: Nat
  {HTM.under(HTM.Timer.fire(t, 1n+HTM.Timer.fired(t), next, at, False{})) == Bool.not(HTM.spent(t)) : Bool}

# LAW (sched-names, architect m_14532): a timer's name (`every_name`) is
# its name and nothing else: naming it back gives the same timer, so its
# schedule, count, next time, runs and words stay as they were.
law named_keeps_the_rest:
  for +t: HTM.Timer
  for +name: String
  {HTM.Timer.named(HTM.Timer.named(t, name), HTM.Timer.name(t)) == t : HTM.Timer}

# LAW (sched-names): naming a timer gives it that name.
law named_is_the_name:
  for +t: HTM.Timer
  for +name: String
  {HTM.Timer.name(HTM.Timer.named(t, name)) == name : String}

# LAW (sched-names, architect m_15603): a timer is announced once. The
# every_name step announces it when it is held (core.bend timer_name:
# announce = Timer.held), and its line, replayed or live, leaves it not
# held: a second every_name, after any restart, never announces again.
law named_announces_once:
  for +t: HTM.Timer
  for +name: String
  {HTM.Timer.held(HTM.Timer.name_line(t, name)) == False{} : Bool}

# LAW: dropping (archiving) a task leaves no live timer of it, in the same
# step (beside stop_leaves_no_waiter). A stop (`sb stop`) keeps them: they
# wait, as before.
law stop_leaves_no_timer:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +n: String
  for +why: String
  HI.TimerNoneOf(HTM.Tms.live(HM.St.tm(HX.d(o, HC.stop_task(o, cx, n, HM.LArchived{}, why)))), n)

# ---- the project's pause (cost-pause, hub/pause.bend) ----
# Its lines (paused, resumed) are events like the others: the replay laws
# (hub_run_replays, replay_reproduces) cover them, so a restarted hub is
# still paused; pause_line_keeps pins the line itself. LOCAL laws, on the
# steps of core.bend's pause section and its gates.

# LAW: a paused project delivers nothing: pump (every message's way to an
# agent: his, an agent's, bise's timer and event wakes, a card's answer,
# another hub's) leaves the step as it was; the message stays queued.
law paused_delivers_nothing:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +n: String
  for q: {HP.is_paused(HX.d(o, cx)) == True{} : Bool}
  {HC.pump(o, cx, n) == cx : HX.Cx<o>}

# LAW: a paused project fires no timer: a due one waits for /resume.
law timer_held_while_paused:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +t: HTM.Timer
  for +due: Bool
  for q: {HP.is_paused(HX.d(o, cx)) == True{} : Bool}
  {HC.timer_may(o, cx, t, due) == False{} : Bool}

# LAW: pause is idempotent: a second /pause only says so (no line, no
# interrupt); /resume of a running project likewise.
law pause_idempotent:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for q: {HP.is_paused(HX.d(o, cx)) == True{} : Bool}
  {HC.pause(o, cx) == HC.notice(o, cx, HP.ALREADY()) : HX.Cx<o>}

law resume_idempotent:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for q: {HP.is_paused(HX.d(o, cx)) == False{} : Bool}
  {HC.resume(o, cx) == HC.notice(o, cx, HP.NOT_PAUSED()) : HX.Cx<o>}

# LAW: the paused line pauses, the resumed line resumes, and neither
# touches a message: the queue's order is the same before and after.
law paused_line_pauses:
  for +s: HM.St
  for +at: Nat
  {HM.St.paused(HM.apply(s, HM.EPaused{at})) == Some{at} : Maybe<&2, Nat>}

law resumed_line_resumes:
  for +s: HM.St
  for +at: Nat
  {HM.St.paused(HM.apply(s, HM.EResumed{at})) == None{} : Maybe<&2, Nat>}

law pause_keeps_order:
  for +s: HM.St
  for +at: Nat
  {HM.St.msgs(HM.apply(s, HM.EPaused{at})) == HM.St.msgs(s) : List<&2, HM.MRec>}

law resume_keeps_order:
  for +s: HM.St
  for +at: Nat
  {HM.St.msgs(HM.apply(s, HM.EResumed{at})) == HM.St.msgs(s) : List<&2, HM.MRec>}

# LAW: the journal line reads back as the same event (a restart keeps it).
law pause_line_keeps:
  for +at: Nat
  {HCo.ev_of(HCo.ev_json(HM.EPaused{at})) == Some{HM.EPaused{at}} : Maybe<&2, HM.Ev>}

law resume_line_keeps:
  for +at: Nat
  {HCo.ev_of(HCo.ev_json(HM.EResumed{at})) == Some{HM.EResumed{at}} : Maybe<&2, HM.Ev>}

# ---- the watches of `sb wake` (event-wake, hub/wakes.bend) ----
# Their lines (wake_set, wake_end) are events like the others: the replay
# laws (hub_run_replays, replay_reproduces) cover them as they are, so a
# watch survives a restart and an ended one stays ended (wake_replay_keeps
# below pins the line itself). Like the timers' laws, the wake laws are
# LOCAL, on the steps of core.bend's watches section.

# LAW: a watch wakes its agent once. Its hit ends it (wake_end, in the
# same step as its message): after the end, no hit finds it.
law wake_hit_once:
  for +ws: HWK.Wakes
  for +id: Nat
  for +why: String
  for +at: Nat
  {HWK.hit(HWK.end(ws, id, why, at), id) == None{} : Maybe<&2, HWK.Watch>}

# LAW: a hit that finds no live watch (ended: hit, max, stop, or its
# agent dropped) changes nothing at all: no message, no line.
law wake_gone_never_hits:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +text: String
  {HC.wake_hit.found(o, None{}, cx, text) == cx : HX.Cx<o>}

# LAW: dropping (archiving) a task leaves no live watch of it, in the
# same step (beside stop_leaves_no_timer). A stop keeps them: they wait.
law wake_drop_ends:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +n: String
  HI.WatchNoneOf(HWK.Wakes.live(HC.wks(o, HC.wakes_gone(o, HM.LArchived{}, cx, n))), n)

# LAW: a watch past its max wakes once: the tick ends it, and an ended
# watch is never due again.
law wake_max_once:
  for +xs: List<&2, HWK.Watch>
  for +id: Nat
  for +now: Nat
  {HWK.find(HWK.due(HWK.drop(xs, id), now), id) == None{} : Maybe<&2, HWK.Watch>}

# LAW: a watch's line read back is the same watch (the journal keeps it
# across a restart: its spec, words, times and agent).
law wake_replay_keeps:
  for +x: HWK.Watch
  {HWK.watch_of(HWK.watch_json(x)) == x : HWK.Watch}

# LAW (L2, no message lost or doubled): a new hub keeps each message as
# ONE record — its text and its single delivery state; no state exists
# without its message (the state is a field of the record).
law init_unique:
  for +w: String
  HI.Unique(HM.init(w))

# LAW (L2): from a state where each message is one record, any sequence
# of inputs keeps it so: no two records ever share an id.
law msgs_unique:
  for +ins: List<&2, J.Json>
  for +h: HC.Hub
  for u: HI.Unique(HC.Hub.d(h))
  HI.Unique(HC.Hub.d(HC.RunR.hub(HC.run(ins, h))))

# LAW (L2): over any sequence of inputs, the messages of the first state
# start, in order, the messages of the last: a message once sent is never
# removed (its record, and so its state, stays).
law msgs_kept:
  for +ins: List<&2, J.Json>
  for +h: HC.Hub
  HI.Kept(HC.Hub.d(h), HC.Hub.d(HC.RunR.hub(HC.run(ins, h))))

# LAW (L3, delivered at most once, RFC 0003 §6.1): over any sequence of
# inputs, a message becomes Delivered only while it is Queued, and it goes
# back to Queued only as an explicit steer_leftover (steering the runtime
# never read). So a message is delivered once, and again only after an
# explicit steer_leftover.
law delivered_once:
  for +ins: List<&2, J.Json>
  for +h: HC.Hub
  HX.Deliv(HC.RunR.journal(HC.run(ins, h)), HC.Hub.d(h))

# LAW (L12): stopping or dropping a task, in any state where each message
# is one record (every state the hub reaches: msgs_unique) and the hot
# index is right (hot_kept_by_run), leaves no message queued for it among
# all its messages (each got recipient_unavailable). queued_for reads the
# same (hot_queued_for).
law stop_leaves_no_queue:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +n: String
  for +life: HM.Life
  for +why: String
  for u: HI.Unique(HX.d(o, cx))
  for k: {HM.hot_of(HM.St.hot(HX.d(o, cx))) == HM.hot_of(HM.St.msgs(HX.d(o, cx))) : List<&2, HM.MRec>}
  {HM.queued_in(HM.St.msgs(HX.d(o, HC.stop_task(o, cx, n, life, why))), HM.names_of(HX.d(o, HC.stop_task(o, cx, n, life, why)), n)) == Nil{} : List<&2, HM.Msg>}

# ---- queued user input (the window's "send queued", bise desktop) ----
# The user's `input {queued: true}` is a queued-mode message (Msg.queued),
# the path `sb send --mode queued` already takes. An older sb-core ignores
# the field and delivers at once (a safe degrade, no journal change).

# LAW: a queued input never answers a question card, at send: it is a
# message for the next turn. A card still open at the turn's end stays
# open; the input arrives as a message (says.card with no card).
law user_queued_never_answers_a_card:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +to: String
  for +text: String
  for +parts: String
  {HC.user_says(o, cx, to, text, True{}, parts) == HC.says.card(o, None{}, cx, to, text, True{}, parts) : HX.Cx<o>}

def any_queued(xs: List<&2, HM.Msg>) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+h, +t}:
      HM.Msg.queued(h) || any_queued(t)

# LAW: what a busy agent is handed (steered) holds no queued-mode message:
# a queued input waits for the turn's end. So a plain input sent while
# queued ones wait goes first (steered); the queued ones follow at idle,
# in id order (queued_for), in one say batch (user_queued_said_at_idle),
# each once (delivered_once).
law user_queued_waits_for_turn_end:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +name: String
  for +q: List<&2, HM.Msg>
  for +m: Bool
  {HC.pump.run(o, HM.RBusy{}, cx, name, q, m) == HC.pump.batch(o, HC.not_queued_mode(q), cx, name, True{}, m) : HX.Cx<o>}

law busy_batch_has_no_queued:
  for +xs: List<&2, HM.Msg>
  {any_queued(HC.not_queued_mode(xs)) == False{} : Bool}

# LAW: at idle, everything queued for the agent goes in one say batch, in
# its order (queued and plain alike).
law user_queued_said_at_idle:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +name: String
  for +q: List<&2, HM.Msg>
  for +m: Bool
  {HC.pump.run(o, HM.RIdle{}, cx, name, q, m) == HC.pump.batch(o, q, cx, name, False{}, m) : HX.Cx<o>}

# ---- the composer rule (lead m_8777, architect m_8801) ----
# An approval card takes one of its options, never typed words: the TUI's
# /answer and the window share it. The words leave the card open and wake
# nobody (the window sends them to the agent as a message).

# LAW: typed words on a confirm card (not 1, 2, 3 nor the TUI's explicit
# `deny: <why>`) are refused: no verdict, the card stays open.
law card_confirm_words_refused:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +c: HM.Card
  for +text: String
  for +parts: String
  for e: {HC.confirm_ok(text) == False{} : Bool}
  {HC.answer.kind(o, HC.KConfirm{}, cx, c, text, parts) == HC.words_refused(o, cx, c, HC.confirm_opts()) : HX.Cx<o>}

# LAW: `no` and `no: <why>` (any case, lead m_10900) are deny aliases: the
# card gets the same verdict path as its option 3, with his words as the
# note (the gate reads them as no, never allow: gate::answer_of).
law card_confirm_no_alias:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +c: HM.Card
  for +text: String
  for +parts: String
  for e: {HC.is_no(String.to_lower(String.trim(text))) == True{} : Bool}
  {HC.answer.kind(o, HC.KConfirm{}, cx, c, text, parts) == HC.answer.confirm(o, True{}, cx, c, text) : HX.Cx<o>}

# LAW: only `no` itself or its `no:` prefix: words that start like it stay
# words.
law card_confirm_nope_is_words:
  {HC.confirm_ok("nope") == False{} : Bool}

law card_confirm_now_is_words:
  {HC.confirm_ok("now") == False{} : Bool}

law card_confirm_no_thanks_is_words:
  {HC.confirm_ok("No thanks") == False{} : Bool}

# LAW: a hub item (merge, feature_*, update, signin) takes only one of its
# options' numbers: other words are refused, the item stays open, main is
# not woken.
law card_choice_words_refused:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +c: HM.Card
  for +text: String
  for +parts: String
  for e: {HC.is_option(HM.Card.text(c), text) == False{} : Bool}
  {HC.answer.kind(o, HC.KChoice{}, cx, c, text, parts) == HC.words_refused(o, cx, c, "one of its numbers") : HX.Cx<o>}

# ---- bise's cross-hub messages (desktop S2, hub/xhub.bend) ----
# Local laws on xhub.bend's decisions and xhub-model.bend's state: the
# core's `cross-hub` section only wires them (it decides nothing).

# LAW: only main forwards the user's words to a project.
law xhub_only_main_forwards:
  for +s: HM.St
  for +from: String
  for +id: Nat
  for e: {String.eq(from, HM.MAIN()) == False{} : Bool}
  {HXB.forward(s, from, id) == HXB.FwdErr{"only main forwards to the projects"} : HXB.Fwd}

# LAW: a message of his is forwarded once: with an outbox entry for it,
# main's forward is refused.
law xhub_forward_once:
  for +s: HM.St
  for +id: Nat
  for +ob: HXH.Out
  for e: {HXH.out_by_msg(HXH.Xs.outbox(HM.St.x(s)), id) == Some{ob} : Maybe<&2, HXH.Out>}
  {HXB.forward(s, HM.MAIN(), id) == HXB.FwdErr{String.append(String.append(HXB.mid(id), " was already forwarded to "), HXH.Out.project(ob))} : HXB.Fwd}

# LAW: only his own words go by reference (architect's B): a message not
# from the user is refused, whatever it says (bise's own question goes by
# `sb project ask`, from @bise, with no authority).
law xhub_forward_needs_his_message:
  for +m: HM.Msg
  for +id: Nat
  for e: {String.eq(HM.Msg.from(m), HM.USER()) == False{} : Bool}
  {HXB.his.go(Some{m}, id) == HXB.FwdErr{String.append(HXB.mid(id), " is not a message the user sent you: forward his own words only (your own question: sb project ask)")} : HXB.Fwd}

# LAW: bise's own question needs words: a blank one is refused, any other
# may go (architect m_8864: the core's section validates nothing itself).
law xhub_ask_needs_words:
  for +text: String
  for b: Bool
  for e: {HM.trim_is_empty(text) == b : Bool}
  {HXB.ask_ok(text) == Bool.pick(Maybe<&2, String>, b, Some{"empty question"}, None{}) : Maybe<&2, String>}

# LAW: a send settles once: after its settle, no answer opens it again
# (a second x_reply for it changes nothing: core's xanswer on None).
law xhub_outbox_settles_once:
  for +x: HXH.Xs
  for +xid: Nat
  {HXB.open(HXH.x_op(x, xid, HXH.OpSettled{}), xid) == None{} : Maybe<&2, HXH.Out>}

# LAW: a delivery is said once: once received, the same origin (hub, xid)
# is seen (core's xin acks it and says nothing).
law xhub_xin_delivered_once:
  for +x: HXH.Xs
  for +i: HXH.XIn
  {HXB.seen(HXH.x_in(x, i), HXH.XIn.hub(i), HXH.XIn.xid(i)) == True{} : Bool}

# LAW: an answered record is never due again (core's xreplied journals
# x_replied with each answer it sends back).
law xhub_xin_replied_once:
  for +i: HXH.XIn
  {HXB.reply.of(Some{HXH.XIn.done(i)}) == None{} : Maybe<&2, HXH.XIn>}

# ---- the routing hold (desktop S2 step 2, xhub.bend + core's `routing
# hold` section) ----

# LAW: a route has one outcome: once it ended (sent or cancelled), it is
# never held again, so no fire, correction or cancel acts on it twice.
law route_one_outcome:
  for +r: HXH.Route
  for s: HXH.RSt
  for e: {HXB.is_held(s) == False{} : Bool}
  {HXB.held.of(Some{HXH.route_op(HXH.REnd{s}, r)}) == None{} : Maybe<&2, HXH.Route>}

# LAW: a correction acts only on a held route: one that went or was
# cancelled gets a notice, nothing else.
law route_correct_only_held:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +rid: Nat
  for +to: String
  for +name: String
  {HC.route_correct.go(o, None{}, cx, rid, to, name) == HC.route_gone(o, cx, rid) : HX.Cx<o>}

# LAW: a correction changes the project only: its due time stays (his 2 s
# don't start again).
law route_correct_keeps_due:
  for +r: HXH.Route
  for +to: String
  for +name: String
  {HXH.Route.due(HXH.route_op(HXH.RTo{to, name}, r)) == HXH.Route.due(r) : Nat}

# LAW: a held route's act is due HOLD_MS (2 s) after the hold, so with
# act_due_only it fires at that tick or later, never before.
law route_fires_at_due_only:
  for +x: HXH.Xs
  for +tm: HTM.Tms
  for +text: String
  for +via: String
  for +to: String
  for +name: String
  for +why: String
  for +now: Nat
  for +context: String
  for +parts: String
  {HTM.Act.due(HXB.route_act(HXB.new_route(x, tm, text, via, to, name, why, now, context, parts))) == Nat.add(now, 2000n) : Nat}

# LAW (architect m_8883): a fire makes no turn: his message is journaled
# (an id for the history and `--input`) by route_said, never by a send
# (which pumps main), then delivered, settled and forwarded; main reads
# it in a note at its next turn.
law route_fire_makes_no_turn:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +r: HXH.Route
  {HC.route_fire(o, Some{r}, cx) == HC.route_fire.sent(o, HC.route_said(o, cx, r), r, HM.St.next_msg(HC.st(o, cx))) : HX.Cx<o>}

# ---- unclear routes (desktop S2 step 5, architect m_9321: his words the
# guess can't place wait PICK_MS for BISE_ROUTE_MODEL's pick in sb-core's
# hold, never in the shell) ----

# LAW: an unclear route (held, no target) whose act fires goes plain to
# bise's main (the cancel path), never to a project's outbox.
law route_unclear_goes_plain:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +r: HXH.Route
  for e: {HXB.is_unclear(r) == True{} : Bool}
  {HC.route_go(o, Some{r}, cx) == HC.route_plain(o, cx, r) : HX.Cx<o>}

# LAW: an unclear route's act is due PICK_MS (1.5 s) after the hold: the
# model's time, after which his words stay with bise.
law route_unclear_waits_pick_ms:
  for +x: HXH.Xs
  for +tm: HTM.Tms
  for +text: String
  for +via: String
  for +now: Nat
  for +context: String
  for +parts: String
  {HTM.Act.due(HXB.route_act(HXB.new_route_at(x, tm, text, via, "", "", "", Nat.add(now, HXB.PICK_MS()), context, parts))) == Nat.add(now, 1500n) : Nat}

# LAW: a pick acts only on a route still held: one that went (its due
# passed, plain to main) or got a target changes nothing.
law route_pick_only_unclear:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +to: String
  for +name: String
  for +why: String
  {HC.route_pick.go(o, None{}, cx, to, name, why) == cx : HX.Cx<o>}

# LAW: a plain input to bise's main while an unclear route of his waits is
# held behind it (no send now), due at the latest unclear due ...
law route_plain_waits_behind_unclear:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +d: Nat
  for +to: String
  for +text: String
  for +queued: Bool
  for +parts: String
  {HC.user_input.behind(o, Some{d}, cx, to, text, queued, parts) == HC.route_behind(o, cx, text, d, parts) : HX.Cx<o>}

# LAW: ... which is no earlier than any unclear route's due, so the
# unclear one fires first (acts_due keeps the acts' order) and both reach
# main in order.
law route_behind_is_latest:
  for +r: HXH.Route
  for +t: List<&2, HXH.Route>
  for e: {HXB.is_unclear(r) == True{} : Bool}
  {Nat.is_ge(Maybe.default(&2, Nat, HXB.unclear_due(r <> t), 0n), HXH.Route.due(r)) == True{} : Bool}

# ---- his parts go with his routed words (R41 (6), architect m_18164) ----

# LAW: a route's correction or pick keeps his parts (only its target
# changes), so what fires carries what he sent.
law route_to_keeps_parts:
  for +r: HXH.Route
  for +to: String
  for +name: String
  {HXH.Route.parts(HXH.route_op(HXH.RTo{to, name}, r)) == HXH.Route.parts(r) : String}

# LAW: the outbox entry a fired route makes carries its parts to the
# project (route_fire.sent's new_out).
law route_out_carries_parts:
  for +x: HXH.Xs
  for +r: HXH.Route
  for +id: Nat
  {HXH.Out.parts(HXB.new_out(x, HXH.Route.to(r), HXH.KInput{}, id, HXH.Route.text(r), HXH.Route.context(r), HXH.Route.parts(r))) == HXH.Route.parts(r) : String}

# LAW: no parts, no key: an out or a route without parts journals and is
# delivered byte for byte as before (an older core replays it unchanged).
law route_no_parts_no_key:
  {HXH.parts_kv("") == Nil{} : List<&2, Sigma<&2, &2, String, _ => J.Json>>}

# LAW: on the project, his forwarded message keeps its parts (the
# you-parts path of a direct input); bise's own question has none.
law xin_input_keeps_parts:
  for +text: String
  for +parts: String
  {HC.xin.snd(HXH.KInput{}, text, parts) == HC.Snd{HM.USER(), HM.MAIN(), text, True{}, None{}, False{}, False{}, False{}, Some{HXB.VIA_BISE()}, parts} : HC.Snd}

law xin_ask_has_no_parts:
  for +text: String
  for +parts: String
  {HC.xin.snd(HXH.KAsk{}, text, parts) == HC.Snd{HXB.FROM_BISE(), HM.MAIN(), text, True{}, None{}, False{}, False{}, False{}, None{}, ""} : HC.Snd}

# ---- followed jobs (desktop S10, core.bend's `followed jobs`) ----

# LAW: before its end a followed task's progress makes no job_end: a
# progress report changes nothing but the report itself.
law follow_quiet_before_end:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +from: String
  for +summary: String
  {HC.req_report.kind(o, cx, from, "progress", summary) == cx : HX.Cx<o>}

# LAW: its done ends the job in the same step (job_end when followed).
law follow_done_at_its_report:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +from: String
  for +summary: String
  {HC.req_report.kind(o, cx, from, "done", summary) == HC.job_end(o, HC.report_done(o, cx, from), from, "done", summary) : HX.Cx<o>}

# LAW: a failure ends it at once, in the same step as the failure.
law follow_failed_at_once:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +from: String
  for +summary: String
  {HC.req_report.kind(o, cx, from, "failed", summary) == HC.job_end(o, HC.report_failed(o, cx, from, summary), from, "failed", summary) : HX.Cx<o>}

# LAW: an agent not followed has no job_end (so a second end of the same
# job, after the first turned follow off, says nothing).
law follow_done_once:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +name: String
  for +state: String
  for +summary: String
  for +label: String
  for +hub: String
  {HC.job_end.go(o, False{}, cx, name, state, summary, label, hub) == cx : HX.Cx<o>}

# LAW (architect m_9154): one job per follow: job_end turns follow off.
law follow_one_shot:
  for +a: HM.Agent
  {HM.Agent.follow(HM.agent_op(a, HM.OFollow{None{}})) == False{} : Bool}

# LAW (J, architect m_10223): the hub that asked for a follow is kept
# with it (journaled by EFollow), so its end can go back there.
law follow_hub_journaled:
  for +a: HM.Agent
  for +hub: String
  {HM.Agent.follow_hub(HM.agent_op(a, HM.OFollow{Some{hub}})) == hub : String}

# LAW (J): the job's end clears it with the follow: a later end of the
# same agent goes back nowhere.
law follow_hub_cleared:
  for +a: HM.Agent
  {HM.Agent.follow_hub(HM.agent_op(a, HM.OFollow{None{}})) == "" : String}

# LAW (J): an end goes back only to a hub that asked: a follow of this
# hub's own main or window ("") puts nothing in the outbox.
law follow_end_back_only_to_who_asked:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +hub: String
  for +j: J.Json
  {HC.job_end.back(o, True{}, cx, hub, j) == cx : HX.Cx<o>}

# LAW (one clock): an act fires once: after its act_done, it is gone.
law act_fires_once:
  for +tm: HTM.Tms
  for +id: Nat
  {HTM.act_find(HTM.Tms.acts(HTM.act_done(tm, id)), id) == None{} : Maybe<&2, HTM.Act>}

def all_due(xs: List<&2, HTM.Act>, +now: Nat) -> Bool:
  match xs:
    case Nil{}:
      True{}
    case Con{+h, +t}:
      Nat.is_le(HTM.Act.due(h), now) && all_due(t, now)

# LAW (one clock): a tick fires only acts due by its now.
law act_due_only:
  for +xs: List<&2, HTM.Act>
  for +now: Nat
  {all_due(HTM.acts_due(xs, now), now) == True{} : Bool}

# LAW (old-core replay, architect m_8524 c.): a journal line of a kind
# this sb-core doesn't know decodes to nothing, so it is skipped, never
# misread; the script test replays a fixture journal with the base's
# sb-core for the other direction.
law unknown_kind_skipped:
  for +j: J.Json
  for +n: String
  {HCo.ev_of.kind(HCo.KUnknown{}, j, n) == None{} : Maybe<&2, HM.Ev>}

# LAW (L12): stopping or dropping a task, in any state where no two open
# cards share an id (every state the hub reaches: cards_unique), leaves no
# open card of it.
law stop_leaves_no_card:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +n: String
  for +life: HM.Life
  for +why: String
  for u: HI.UniqueCards(HX.d(o, cx))
  {HC.card_ids(HM.St.cards(HX.d(o, HC.stop_task(o, cx, n, life, why))), n, Nil{}) == Nil{} : List<&2, Nat>}

# LAW (L12 support): a new hub has no two open cards with one id...
law init_cards_unique:
  for +w: String
  HI.UniqueCards(HM.init(w))

# ...and any sequence of inputs keeps it so (each card takes the next
# free id).
law cards_unique:
  for +ins: List<&2, J.Json>
  for +h: HC.Hub
  for u: HI.UniqueCards(HC.Hub.d(h))
  HI.UniqueCards(HC.Hub.d(HC.RunR.hub(HC.run(ins, h))))

# LAW (L4 support): a new hub keeps the agents' names apart...
law init_names_apart:
  for +w: String
  HI.NamesApart(HM.init(w))

# ...and any sequence of inputs keeps them apart: no name or old name of an
# agent is ever a name or old name of another one (a message sent to an
# agent can only be for it).
law names_apart:
  for +ins: List<&2, J.Json>
  for +h: HC.Hub
  for u: HI.NamesApart(HC.Hub.d(h))
  HI.NamesApart(HC.Hub.d(HC.RunR.hub(HC.run(ins, h))))

# ---- the hot messages (issue 21): St.hot, the walks' index ----
# St.msgs keeps every message (msgs_unique, msgs_kept unchanged); St.hot
# is a part of it, in its order, with the same hot part (HM.MRec.is_hot:
# queued, or owing a reply): exactly the hot messages after a message
# event, every message after a boot replay (HM.hot_all). The walks read
# St.hot; these laws say its hot part is always msgs', and that each
# walk reads the same over it as over every message.

# LAW: any event keeps the index: if a state's index has the hot part of
# its messages, the state after the event's has too.
law hot_is_the_hot_part:
  for +s: HM.St
  for +e: HM.Ev
  for h: {HM.hot_of(HM.St.hot(s)) == HM.hot_of(HM.St.msgs(s)) : List<&2, HM.MRec>}
  {HM.hot_of(HM.St.hot(HM.apply(s, e))) == HM.hot_of(HM.St.msgs(HM.apply(s, e))) : List<&2, HM.MRec>}

# LAW: a new hub's index is right...
law hot_at_init:
  for +w: String
  {HM.hot_of(HM.St.hot(HM.init(w))) == HM.hot_of(HM.St.msgs(HM.init(w))) : List<&2, HM.MRec>}

# ...a boot replay's too (apply_rev leaves it; replay_many sets it to
# every message at the end of its batch)...
law hot_after_replay:
  for +s: HM.St
  {HM.hot_of(HM.St.hot(HM.hot_all(s))) == HM.hot_of(HM.St.msgs(HM.hot_all(s))) : List<&2, HM.MRec>}

# ...and any sequence of inputs keeps it right.
law hot_kept_by_run:
  for +ins: List<&2, J.Json>
  for +h: HC.Hub
  for u: {HM.hot_of(HM.St.hot(HC.Hub.d(h))) == HM.hot_of(HM.St.msgs(HC.Hub.d(h))) : List<&2, HM.MRec>}
  {HM.hot_of(HM.St.hot(HC.Hub.d(HC.RunR.hub(HC.run(ins, h))))) == HM.hot_of(HM.St.msgs(HC.Hub.d(HC.RunR.hub(HC.run(ins, h))))) : List<&2, HM.MRec>}

# LAW: a message event narrows the index to the hot messages exactly.
law hot_narrowed:
  for +s: HM.St
  for +m: HM.Msg
  {HM.St.hot(HM.apply(s, HM.EMsgSent{m})) == HM.hot_of(HM.St.msgs(HM.apply(s, HM.EMsgSent{m}))) : List<&2, HM.MRec>}

# LAW: with a right index, each walk over the hot messages reads what it
# would read over every message: the cold ones are inert. The queues...
law hot_queued_for:
  for +s: HM.St
  for +n: String
  for h: {HM.hot_of(HM.St.hot(s)) == HM.hot_of(HM.St.msgs(s)) : List<&2, HM.MRec>}
  {HM.queued_for(s, n) == HM.queued_in(HM.St.msgs(s), HM.names_of(s, n)) : List<&2, HM.Msg>}

# ...the replies owed...
law hot_unanswered_for:
  for +s: HM.St
  for +n: String
  for h: {HM.hot_of(HM.St.hot(s)) == HM.hot_of(HM.St.msgs(s)) : List<&2, HM.MRec>}
  {HM.unanswered_for(s, n) == HM.unanswered_in(HM.St.msgs(s), HM.names_of(s, n)) : List<&2, HM.Msg>}

# ...and the pause's counts: the messages held, the agents a resume
# wakes, the held messages that are not bise's own.
law hot_held:
  for +s: HM.St
  for h: {HM.hot_of(HM.St.hot(s)) == HM.hot_of(HM.St.msgs(s)) : List<&2, HM.MRec>}
  {HP.held(s) == HP.held.go(HM.St.msgs(s)) : Nat}

law hot_woken:
  for +s: HM.St
  for h: {HM.hot_of(HM.St.hot(s)) == HM.hot_of(HM.St.msgs(s)) : List<&2, HM.MRec>}
  {HP.woken(s) == List.length(&2, String, HP.woken.go(HM.St.msgs(s), Nil{})) : Nat}

law hot_his:
  for +s: HM.St
  for h: {HM.hot_of(HM.St.hot(s)) == HM.hot_of(HM.St.msgs(s)) : List<&2, HM.MRec>}
  {HP.his(s) == HP.his.go(HM.St.msgs(s)) : Nat}

# ---- `sb feature retire <name>` (hub/feature.bend, core.bend
# feature_retire; architect m_20561) ----
# A new input (`feature_retire`) with no new journal kind: its events are
# EWorkspace and a message's, which hub_step_replays and the message laws
# cover as they are. The laws below are LOCAL, like the timers': stated on
# feature.bend's decisions and core.bend's feature_retire.one/tell, the
# only path a retire takes (feature_retire.all runs .one over
# HFT.retirees, then one info line to main).

# LAW: a retired workspace no longer lands on the feature, whatever it was
# (every `feature` key goes): its agent's next `sb land` goes to the trunk.
law feature_retire_clears:
  for +ws: J.Json
  for +name: String
  {HFT.lands_on(HFT.unfeature(ws), name) == False{} : Bool}

# LAW: the retire keeps every other field of the workspace (path, branch,
# place, mode...): the agent stays in its worktree.
law feature_retire_keeps_ws:
  for +kvs: List<&2, Sigma<&2, &2, String, _ => J.Json>>
  for +k: String
  for e: {String.eq(k, "feature") == False{} : Bool}
  {J.get_kv(HFT.unfeature.kvs(kvs), k) == J.get_kv(kvs, k) : Maybe<&2, J.Json>}

# LAW: an archived agent is never retired, and the retire archives no
# one: what it does to an agent is its workspace (an EWorkspace event,
# never an ELifecycle), then its note.
law feature_retire_archives_none:
  for +ws: J.Json
  for +name: String
  {HFT.retiree.life(HM.LArchived{}, ws, name) == False{} : Bool}

law feature_retire_one:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +a: HM.Agent
  for +text: String
  {HC.feature_retire.one(o, cx, a, text)
    == HC.feature_retire.tell(o, HM.Agent.life(a), HC.emit(o, cx, HM.EWorkspace{HM.Agent.name(a), HFT.unfeature(HM.Agent.ws(a))}, Unit{}, Unit{}, Unit{}), HM.Agent.name(a), text) : HX.Cx<o>}

# LAW: the retire stops nothing: an agent that is not active (stopped,
# failed) gets its workspace only, never a message that would revive it
# (no spawn); no kill, no interrupt on any path.
law feature_retire_stops_nothing:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +life: HM.Life
  for +n: String
  for +text: String
  for e: {HC.is_active(life) == False{} : Bool}
  {HC.feature_retire.tell(o, life, cx, n, text) == cx : HX.Cx<o>}

# LAW: an active agent gets exactly one message, from the hub, through
# send.thread (never send's revive path), in queued mode: a busy agent
# reads it after its turn (pump keeps a queued-mode message while busy),
# its turn untouched.
law feature_retire_tells_once:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +n: String
  for +text: String
  {HC.feature_retire.tell(o, HM.LActive{}, cx, n, text)
    == HC.fst(o, HC.send.thread(o, None{}, cx, HC.Snd{HM.HUB(), n, text, False{}, None{}, True{}, False{}, True{}, None{}, ""})) : HX.Cx<o>}
