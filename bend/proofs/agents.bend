# bend/proofs/agents.bend: the proofs of bend/laws/agents.bend (the
# agents split). Each event keeps the split, Fresh or not
# (lib/hub-agents.bend lv_apply); a run is its journal's replay.
import Base
import ../vendor/json.bend as J
import ../hub/model.bend as HM
import ../hub/gen/state.bend as HS
import ../hub/core.bend as HC
import ../hub/inv.bend as HI
import ../hub/cx.bend as HX
import ../hub/cold.bend as CO
import ../hub/agents.bend as HAG
import ./lib/hub-1.bend as PL1
import ./lib/hub-agents.bend as PLA
import ../laws/agents.bend as Laws

def Laws.split_agents_at_init(w):
  HX.Both{HX.Both{{==}, Unit{}}, Unit{}}

def Laws.split_agents_kept_by_run(ins, h, u):
  PLA.lv_tr(HC.Hub.d(HC.RunR.hub(HC.run(ins, h))), HM.apply_all(HC.RunR.journal(HC.run(ins, h)), HC.Hub.d(h)), PL1.hub_run_replays(ins, h),
    PLA.lv_apply_all(HC.RunR.journal(HC.run(ins, h)), HC.Hub.d(h), u))

def Laws.split_agents_after_replay(ms, st, i, sk, u):
  PLA.lv_replay_batch(ms, st, i, sk, u)

def Laws.agents_apart_sides(s, n, u):
  PLA.sd_sides(s, n, u)
