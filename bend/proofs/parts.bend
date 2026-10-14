# bend/proofs/parts.bend: the proofs of bend/laws/parts.bend. Each holds
# by unfolding: the message keeps the request's parts, and an empty parts
# string picks the branch that writes nothing.
import Base
import ../vendor/json.bend as J
import ../hub/model.bend as HM
import ../hub/cx.bend as HX
import ../hub/core.bend as HC
import ../hub/codec.bend as HCD
import ../hub/newtask.bend as HNT
import ../laws/parts.bend as Laws

def Laws.agent_send_keeps_parts(from, to, expect, reply_to, q):
  {==}

def Laws.agent_no_parts_no_line(o, cx, agent, id, thread, from, to, reply_to, expect, auto, text, ms, plain, queued, via):
  {==}

def Laws.agent_no_parts_no_sent_line(o, cx, agent, id, thread, from, to, reply_to, expect, auto, text, ms, plain, queued, via):
  {==}

def Laws.brief_no_parts(head):
  {==}
