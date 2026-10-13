# bend/laws/wakes.bend: a watch of `sb wake` is a pause or an alarm
# (hub/wakes.bend `resumes`). Its other laws (once, gone, drop, max,
# replay) are in bend/laws/hub.bend. Closed by bend/proofs/wakes.bend; the
# gate checks every bend/proofs/*.bend: a law here with no proof there
# fails it.
import Base
import ../vendor/json.bend as J
import ../hub/model.bend as HM
import ../hub/cx.bend as HX
import ../hub/core.bend as HC
import ../hub/wakes.bend as HWK

# ---- a pause or an alarm (designer's page agent-waiting-states, pick A) ----
# A watch's `resumes` says whether its agent continues its work at the end
# (a pause, `sb wake --then`) or is free and only woken if it fires (an
# alarm, `--alarm`). Neither said: what the agent started itself (a
# backgrounded bash command, a pid) is a pause; a file, a launchd job or a
# kind this version doesn't know is an alarm. wake_replay_keeps above
# keeps it across a restart (a line from before the field gets its kind's
# default: wakes.bend `resumes.of`).

# LAW: a backgrounded bash command's watch is a pause by default.
law wake_bg_pauses:
  for +s: J.Json
  for e: {HWK.kind_of(s) == HWK.KBg{} : HWK.WatchKind}
  {HWK.resumes_of(s, None{}) == True{} : Bool}

# LAW: a pid's watch (`sb wake --on-exit`) is a pause by default.
law wake_pid_pauses:
  for +s: J.Json
  for e: {HWK.kind_of(s) == HWK.KPid{} : HWK.WatchKind}
  {HWK.resumes_of(s, None{}) == True{} : Bool}

# LAW: a file's watch (`--on-file`) is an alarm by default.
law wake_file_alarms:
  for +s: J.Json
  for e: {HWK.kind_of(s) == HWK.KFile{} : HWK.WatchKind}
  {HWK.resumes_of(s, None{}) == False{} : Bool}

# LAW: a launchd job's watch (`--on-job`) is an alarm by default.
law wake_job_alarms:
  for +s: J.Json
  for e: {HWK.kind_of(s) == HWK.KJob{} : HWK.WatchKind}
  {HWK.resumes_of(s, None{}) == False{} : Bool}

# LAW: a kind this version doesn't know is an alarm by default.
law wake_unknown_alarms:
  for +s: J.Json
  for e: {HWK.kind_of(s) == HWK.KOther{} : HWK.WatchKind}
  {HWK.resumes_of(s, None{}) == False{} : Bool}

# LAW: the agent's word wins over the default (`--then`, `--alarm`).
law wake_then_wins:
  for +s: J.Json
  for +b: Bool
  {HWK.resumes_of(s, Some{b}) == b : Bool}

# LAW: setting a watch, pause or alarm, never changes an agent's run (its
# status: an agent with only alarms stays idle) nor its record.
law wake_set_keeps_run:
  for -o: HM.St
  for ok: Bool
  for +cx: HX.Cx<o>
  for +a: String
  for +agent: String
  for +spec: J.Json
  for +max_text: String
  for +max_ms: Nat
  for +quiet: Bool
  for +then: Maybe<&2, Bool>
  {HC.rt(o, HC.wake_set.agent(o, ok, cx, agent, spec, max_text, max_ms, quiet, then), a) == HC.rt(o, cx, a) : HX.Rt}

law wake_set_keeps_agents:
  for -o: HM.St
  for ok: Bool
  for +cx: HX.Cx<o>
  for +agent: String
  for +spec: J.Json
  for +max_text: String
  for +max_ms: Nat
  for +quiet: Bool
  for +then: Maybe<&2, Bool>
  {HM.St.agents(HC.st(o, HC.wake_set.agent(o, ok, cx, agent, spec, max_text, max_ms, quiet, then))) == HM.St.agents(HC.st(o, cx)) : List<&2, HM.Agent>}

# ---- his stop (the window's wake_stop) ----
# His stop of a watch tells its agent once (`tell`: the words, Rust's
# bise_proto words `watch_stopped`): a pause it meant to continue at, an
# alarm it counted on. The agent's own `sb wake --stop` tells it nothing.

# LAW: the agent's own stop (no words) tells it nothing.
law wake_own_stop_quiet:
  for +a: Bool
  {HWK.stop_tells("", a) == False{} : Bool}

# LAW: his stop (its words) tells an active agent.
law wake_his_stop_tells:
  for +h: Char
  for +t: String
  {HWK.stop_tells(SCon{h, t}, True{}) == True{} : Bool}

# LAW: a stop of a watch that ended (or never was) changes nothing: no
# line, no message.
law wake_stop_gone_quiet:
  for -o: HM.St
  for +cx: HX.Cx<o>
  for +why: String
  for +tell: String
  {HC.wake_stop.found(o, None{}, cx, why, tell) == cx : HX.Cx<o>}

