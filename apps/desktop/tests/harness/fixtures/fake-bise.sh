#!/bin/bash
# A fake `bise` for self/isolation.spec.ts, given to the app as BISE_DESKTOP_BISE: the app spawns
# `<this> ambient-core ...`. It writes the HOME and BISE_HOME it was given to $BISE_HARNESS_PROBE_OUT,
# then idles. With BISE_HARNESS_PROBE_MODE=real-hub it plays amb-mac's 22:33 case without touching
# anything of his: a process named `bise sbd` whose BISE_HOME is his real ~/.bise (a sleep, nothing
# opened, nothing written), which the harness's sentinel must catch and stop.
echo "HOME=$HOME BISE_HOME=$BISE_HOME" > "$BISE_HARNESS_PROBE_OUT"
if [ "$BISE_HARNESS_PROBE_MODE" = real-hub ]; then
  BISE_HOME="$BISE_HARNESS_PROBE_REAL/.bise" exec -a "bise sbd" /bin/sleep 30
fi
exec /bin/sleep 30
