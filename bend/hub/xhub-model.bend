# hub/xhub-model.bend — the hub's cross-hub message state (bise desktop S2):
# the home hub's outbox to the project hubs and a project hub's record of
# what it received from the home hub. A field of model.bend's St (`x`),
# owned by sb-core and rebuilt from the journal like the rest.
#
# Empty for now: S2's step 1 fills it (outbox, inbox) with its journal
# kinds and laws. Imported by model.bend, so it imports neither model nor
# core (Bend has no import cycles), like timers.bend.
import Base

type Xs is Data:
  Xs{}

def empty() -> Xs:
  Xs{}
