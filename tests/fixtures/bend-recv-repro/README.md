Bend's TCP.recv decodes each recv on its own: a multi-byte UTF-8 char cut by a recv boundary comes back as U+FFFD (issue 36; for Bend upstream).
Run: bend repro.bend -o repro && ./repro & python3 send.py  (sends 'aé─b' 2 bytes a write; expected a, é, ─, b; observed U+FFFD where a char is cut).
