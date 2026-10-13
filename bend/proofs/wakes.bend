# bend/proofs/wakes.bend: the proofs of bend/laws/wakes.bend. The kind
# laws rewrite the spec's kind; the run and agents laws hold by unfolding
# the step (an EWake event touches only the watches).
import Base
import ../vendor/json.bend as J
import ../hub/model.bend as HM
import ../hub/cx.bend as HX
import ../hub/core.bend as HC
import ../hub/wakes.bend as HWK
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
            case HX.R{x0, x1, x2, x3, x4, x5, x6, x7, x8, x9, x10, x11, x12}:
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
