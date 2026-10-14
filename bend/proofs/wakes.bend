# bend/proofs/wakes.bend: the proofs of bend/laws/wakes.bend. The kind
# laws rewrite the spec's kind; the run and agents laws hold by unfolding
# the step (an EWake event touches only the watches).
import Base
import ../vendor/json.bend as J
import ../hub/model.bend as HM
import ../hub/cx.bend as HX
import ../hub/core.bend as HC
import ../hub/wakes.bend as HWK
import ../hub/timers.bend as HTM
import ../hub/reach.bend as HR
import ./lib/hub-1.bend as PL1
import ./lib/hub-3.bend as PL3
import ../laws/wakes.bend as Laws

def Laws.wake_bg_pauses(s, e):
  %Equal.sym(HWK.WatchKind, HWK.kind_of(s), HWK.KBg{}, e) : {HWK.kind_pauses(_) == True{} : Bool}
  {==}

def Laws.wake_pid_pauses(s, e):
  %Equal.sym(HWK.WatchKind, HWK.kind_of(s), HWK.KPid{}, e) : {HWK.kind_pauses(_) == True{} : Bool}
  {==}

def Laws.wake_file_alarms(s, e):
  %Equal.sym(HWK.WatchKind, HWK.kind_of(s), HWK.KFile{}, e) : {HWK.kind_pauses(_) == False{} : Bool}
  {==}

def Laws.wake_job_alarms(s, e):
  %Equal.sym(HWK.WatchKind, HWK.kind_of(s), HWK.KJob{}, e) : {HWK.kind_pauses(_) == False{} : Bool}
  {==}

def Laws.wake_unknown_alarms(s, e):
  %Equal.sym(HWK.WatchKind, HWK.kind_of(s), HWK.KOther{}, e) : {HWK.kind_pauses(_) == False{} : Bool}
  {==}

def Laws.wake_then_wins(s, b):
  {==}

def Laws.wake_set_keeps_run(o, ok, cx, a, agent, spec, max_text, max_ms, quiet, then):
  match ok:
    case False{}:
      {==}
    case True{}:
      match cx:
        case HX.Cx{c, r}:
          match r:
            case HX.R{x0, x1, x2, x3, x4, x5, x6, x7, x8, x9, x10, x11, x12, x13, x14}:
              {==}

def Laws.wake_set_keeps_agents(o, ok, cx, agent, spec, max_text, max_ms, quiet, then):
  match ok:
    case False{}:
      {==}
    case True{}:
      match cx:
        case HX.Cx{c, r}:
          match c:
            case HX.Core{d, fx, p, f, q, v}:
              match d:
                case HM.St{ag, ord, ms, cs, ns, nm, nc, tm, xs, pz, hot}:
                  {==}

def Laws.wake_own_stop_quiet(a):
  {==}

def Laws.wake_his_stop_tells(h, t):
  {==}

def Laws.wake_stop_gone_quiet(o, cx, why, tell):
  {==}

# ---- a reply still pending (ask-wait) ----

def Laws.wake_reply_pauses(s, e):
  %Equal.sym(HWK.WatchKind, HWK.kind_of(s), HWK.KReply{}, e) : {HWK.kind_pauses(_) == True{} : Bool}
  {==}

def Laws.ask_timeout_pauses(ws, agent, to, msg, asked_at, now):
  {==}

def Laws.ask_pause_resumes(ws, agent, to, msg, asked_at, now):
  {==}

def Laws.ask_max_tells(ws, agent, to, msg, asked_at, now):
  {==}

def ask_need_false(-o: HM.St, +cx: HX.Cx<o>, +agent: String, +orig: HM.Msg, +w: HWK.Watch,
    e: {HWK.reply_for(HWK.Wakes.live(HC.wks(o, cx)), agent, HM.Msg.id(orig)) == Some{w} : Maybe<&2, HWK.Watch>})
    -> {HC.reply_pause.need(o, cx, agent, orig) == False{} : Bool}:
  %Equal.sym(Maybe<&2, HWK.Watch>, HWK.reply_for(HWK.Wakes.live(HC.wks(o, cx)), agent, HM.Msg.id(orig)), Some{w}, e)
    : {Bool.not(Maybe.is_some(&2, HWK.Watch, _)) && Bool.not(Maybe.is_some(&2, HM.Msg, HC.reply_of(HM.St.msgs(HC.st(o, cx)), HM.Msg.id(orig), HM.Msg.to(orig)))) && HR.agent_active(HC.st(o, cx), agent) == False{} : Bool}
  {==}

def Laws.ask_once(o, cx, agent, orig, w, e):
  %Equal.sym(Bool, HC.reply_pause.need(o, cx, agent, orig), False{}, ask_need_false(o, cx, agent, orig, w, e))
    : {HC.reply_pause.go(o, _, cx, agent, orig) == cx : HX.Cx<o>}
  {==}

# the live watches after wake_ends: those of no ended id
def ask_live_ends(-o: HM.St, +ids: List<&2, Nat>, +cx: HX.Cx<o>, +why: String)
    -> {HWK.Wakes.live(HC.wks(o, HC.wake_ends(o, ids, cx, why))) == HWK.keep_out(HWK.Wakes.live(HC.wks(o, cx)), ids) : List<&2, HWK.Watch>}:
  match ids:
    case Nil{}:
      Equal.sym(List<&2, HWK.Watch>, HWK.keep_out(HWK.Wakes.live(HC.wks(o, cx)), Nil{}), HWK.Wakes.live(HC.wks(o, cx)),
        PL3.hub_wk_keep_nil(HWK.Wakes.live(HC.wks(o, cx))))
    case Con{id, rest}:
      +ev = {HM.EWake{HWK.WEnd{id, why, HC.now(o, cx)}} : HM.Ev}
      +cx2 = HC.emit(o, cx, ev, Unit{}, Unit{}, Unit{})
      +l = HWK.Wakes.live(HC.wks(o, cx))
      +l2 = HWK.Wakes.live(HC.wks(o, cx2))
      +e2 = Equal.trans(List<&2, HWK.Watch>, l2, HWK.Wakes.live(HTM.Tms.wk(HM.St.tm(HM.apply(HX.d(o, cx), ev)))), HWK.drop(l, id),
        Equal.cong(HM.St, List<&2, HWK.Watch>, s => HWK.Wakes.live(HTM.Tms.wk(HM.St.tm(s))), HX.d(o, cx2), HM.apply(HX.d(o, cx), ev), PL1.hub_d_emit(o, cx, ev, Unit{}, Unit{}, Unit{})),
        PL3.hub_wk_live_end(HX.d(o, cx), id, why, HC.now(o, cx)))
      Equal.trans(List<&2, HWK.Watch>, HWK.Wakes.live(HC.wks(o, HC.wake_ends(o, rest, cx2, why))), HWK.keep_out(l2, rest), HWK.keep_out(l, id <> rest),
        ask_live_ends(o, rest, cx2, why),
        Equal.trans(List<&2, HWK.Watch>, HWK.keep_out(l2, rest), HWK.keep_out(HWK.drop(l, id), rest), HWK.keep_out(l, id <> rest),
          Equal.cong(List<&2, HWK.Watch>, List<&2, HWK.Watch>, ys => HWK.keep_out(ys, rest), l2, HWK.drop(l, id), e2),
          PL3.hub_wk_keep_drop(l, id, rest)))

# wake_ends leaves the messages as they were
def ask_msgs_ends(-o: HM.St, +ids: List<&2, Nat>, +cx: HX.Cx<o>, +why: String)
    -> {HM.St.msgs(HX.d(o, HC.wake_ends(o, ids, cx, why))) == HM.St.msgs(HX.d(o, cx)) : List<&2, HM.MRec>}:
  match ids:
    case Nil{}:
      {==}
    case Con{id, t}:
      +ev = {HM.EWake{HWK.WEnd{id, why, HC.now(o, cx)}} : HM.Ev}
      +cx2 = HC.emit(o, cx, ev, Unit{}, Unit{}, Unit{})
      Equal.trans(List<&2, HM.MRec>, HM.St.msgs(HX.d(o, HC.wake_ends(o, t, cx2, why))), HM.St.msgs(HX.d(o, cx2)), HM.St.msgs(HX.d(o, cx)),
        ask_msgs_ends(o, t, cx2, why),
        Equal.trans(List<&2, HM.MRec>, HM.St.msgs(HX.d(o, cx2)), HM.St.msgs(HM.apply(HX.d(o, cx), ev)), HM.St.msgs(HX.d(o, cx)),
          Equal.cong(HM.St, List<&2, HM.MRec>, s => HM.St.msgs(s), HX.d(o, cx2), HM.apply(HX.d(o, cx), ev), PL1.hub_d_emit(o, cx, ev, Unit{}, Unit{}, Unit{})),
          PL1.hub_msgs_wake(HX.d(o, cx), HWK.WEnd{id, why, HC.now(o, cx)})))

def Laws.ask_reply_ends(o, cx, from, to, r):
  ask_live_ends(o, HWK.answered_of(HWK.Wakes.live(HC.wks(o, cx)), to, r, HM.names_of(HC.st(o, cx), from), String.eq(from, HM.USER())), cx, "answered")

def Laws.ask_reply_ends_quiet(o, cx, from, to, r):
  match r:
    case None{}:
      {==}
    case Some{x}:
      ask_msgs_ends(o, HWK.answered_of(HWK.Wakes.live(HC.wks(o, cx)), to, x, HM.names_of(HC.st(o, cx), from), String.eq(from, HM.USER())), cx, "answered")

def Laws.ask_done_ends(o, cx, agent):
  ask_live_ends(o, HWK.replies_of(HWK.Wakes.live(HC.wks(o, cx)), HM.names_of(HC.st(o, cx), agent)), cx, "moved on")

def Laws.ask_done_quiet(o, cx, agent):
  ask_msgs_ends(o, HWK.replies_of(HWK.Wakes.live(HC.wks(o, cx)), HM.names_of(HC.st(o, cx), agent)), cx, "moved on")

def Laws.ask_target_gone_tells(o, cx, w, e):
  +cx2 = HC.wake_end(o, cx, HWK.Watch.id(w), "gone")
  %Equal.sym(Bool, HR.agent_active(HC.st(o, cx2), HWK.Watch.agent(w)), True{}, e)
    : {HC.replies_gone.each(o, Nil{}, HC.pick_lazy(HX.Cx<o>, _, u => HC.wake_say(o, cx2, HWK.Watch.agent(w), HWK.reply_gone_text(w)), u => cx2))
      == HC.wake_say(o, cx2, HWK.Watch.agent(w), HWK.reply_gone_text(w)) : HX.Cx<o>}
  {==}
