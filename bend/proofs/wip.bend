# bend/proofs/wip.bend: the proofs of bend/laws/wip.bend. Each holds by
# unfolding hub/wip.bend's decisions (a case on `nudged` where the
# conjunction needs it).
import Base
import ../hub/wip.bend as HW
import ../laws/wip.bend as Laws

def Laws.spawn_auto_git():
  {==}

def Laws.spawn_auto_no_git():
  {==}

def Laws.spawn_place_shared(git):
  {==}

def Laws.wip_nudges_once(n, age):
  {==}

def Laws.wip_quiet_when_clean(age, nudged):
  match nudged:
    case True{}:
      {==}
    case False{}:
      {==}

def Laws.wip_count_nudges():
  {==}

def Laws.wip_age_nudges():
  {==}

def Laws.wip_under_quiet():
  {==}

def Laws.wip_clean_ends_episode(xs, agent, go):
  {==}

def Laws.wip_nudged_stays(k, xs, agent):
  {==}
