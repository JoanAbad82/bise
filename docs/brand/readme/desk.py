# ---------- the desktop scenes: the same features, in bise desktop (designer's brief, readme-review n1) ----------
# run by make.py (exec'd after the terminal scenes: it uses make.py's TL, svg, E, MONO and ink). out: feat/<name>-{light,dark}.svg
# and demo-b-desktop-{light,dark}.svg. the terminal scenes stay as they are (bise.dev and the terminal docs use them).
# the app's own look (apps/desktop/src/ds/tokens.css, the shots in site/download/), cropped to the part that tells the
# feature, on the same paper card as the terminal scenes. the system sans (SF) like the app; mono only for code and keys.
DPAL = {
  "dark":  dict(mode="dark", bg="#141211", text="#ece6da", dim="#a39c90", faint="#857d72", rule="#4a4540", acc="#f4a6b0", ok="#b9d99a",
                raised="#1f1c1a", chip="#262220", side="#191715", line="#2b2725", sel="#33292c", accsoft="#2e2326", win="#1a1816", shadow="#00000066"),
  "light": dict(mode="light", bg="#fdfbf7", text="#1b1917", dim="#6b645a", faint="#7d766c", rule="#cfc8bd", acc="#b8416b", ok="#3f7a2a",
                raised="#f4f0e8", chip="#efe9df", side="#f7f3ec", line="#e9e3d9", sel="#fdeef2", accsoft="#f8e6ec", win="#f6f2ea", shadow="#5a4a3a33"),
}
SANS = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif"

def tw(text, size=13):
    """the width of text in the system sans, estimated per letter (no font file: GitHub draws the SVG with the system's)."""
    w = 0.0
    for ch in text:
        if ch in "iljt.,:;'!|ı ": w += .29
        elif ch in "frI()[]-": w += .36
        elif ch in "mwMW": w += .84
        elif ch.isupper() or ch in "→↗✉∿⌘⏎": w += .66
        elif ch.isdigit(): w += .56
        else: w += .53
    return w * size

def wrap(text, width, size=13):
    lines, cur = [], ""
    for word in text.split(" "):
        t = (cur + " " + word).strip()
        if cur and tw(t, size) > width: lines.append(cur); cur = word
        else: cur = t
    return lines + ([cur] if cur else [])

class Desk:
    """a crop of the desktop app: draw into s.o (or a group list), times through s.tl."""
    def __init__(s, c, T, H, W=680):
        s.c, s.T, s.H, s.W = c, T, H, W
        s.tl = TL(T); s.o = [f'<rect width="{W}" height="{H}" fill="{c["bg"]}"/>']
    def t(s, x, y, html, size=13, color="text", weight=400, mono=False, anchor="start", cls=None, extra=""):
        fam = MONO if mono else SANS
        k = f' class="{cls}"' if cls else ""
        return (f'<text{k} x="{x:.1f}" y="{y:.1f}" style="font-family:{fam}" font-size="{size}" font-weight="{weight}" fill="{s.c[color]}"'
                f' text-anchor="{anchor}" xml:space="preserve"{extra}>{html}</text>')
    def at(s, t0, t1, body, dur=0.25):
        """body shown from t0 to t1 (None: to the loop's end)."""
        return f'<g class="{s.tl.show(t0, t1, dur=dur)}">{body}</g>'
    def keyframes(s, name, frames, ease="linear"):
        s.tl.css.append(f"@keyframes {name}{{{frames}}}.{name}{{animation:{name} {s.T}s {ease} infinite}}")
    def p(s, v): return f"{max(0, min(100, v / s.T * 100)):.2f}%"
    def typing(s, x, y, text, t0, t1, size=13, color="text"):
        """text typed between t0 and t1, one letter at a time (each its own opacity keyframes)."""
        spans, chars = [], list(text)
        for i, ch in enumerate(chars):
            if ch == " ": spans.append(" "); continue
            s.tl.n += 1; k = f"q{s.tl.n}"; a = t0 + (t1 - t0) * (i + 1) / len(chars)
            s.tl.css.append(f"@keyframes {k}{{0%,{s.p(a)}{{opacity:0}}{s.p(a + .01)},100%{{opacity:1}}}}.{k}{{animation:{k} {s.T}s linear infinite}}")
            spans.append(f'<tspan class="{k}">{E(ch)}</tspan>')
        return s.t(x, y, "".join(spans), size, color)
    def words(s, x, y, text, t0, step, size=13, color="text"):
        """the words of text appear one by one from t0, step s apart (as they're said)."""
        spans = []
        for i, w in enumerate(text.split(" ")):
            s.tl.n += 1; k = f"q{s.tl.n}"; a = t0 + i * step
            s.tl.css.append(f"@keyframes {k}{{0%,{s.p(a)}{{opacity:0}}{s.p(a + .01)},100%{{opacity:1}}}}.{k}{{animation:{k} {s.T}s linear infinite}}")
            spans.append(f'<tspan class="{k}">{E(w)} </tspan>')
        return s.t(x, y, "".join(spans), size, color)
    def chip(s, x, y, html, w, fill="chip", color="dim", size=12, h=20):
        return (f'<rect x="{x}" y="{y - h + 6}" width="{w:.0f}" height="{h}" rx="5" fill="{s.c[fill]}"/>'
                + s.t(x + 7, y, html, size, color))
    def bubble(s, right, y, lines, size=13):
        """his bubble: right-aligned, raised, a hairline; lines: [str]."""
        w = max(tw(l, size) for l in lines) * 1.06 + 30; h = 16 + 19 * len(lines)
        x = right - w
        b = f'<rect x="{x:.1f}" y="{y}" width="{w:.1f}" height="{h}" rx="12" fill="{s.c["raised"]}" stroke="{s.c["line"]}"/>'
        b += "".join(s.t(x + 14, y + 22 + 19 * i, E(l), size) for i, l in enumerate(lines))
        return b, h
    def head(s, x, y, name, size=12.5):
        """an author's line in the thread: ':*' for bise, the agent's name bold."""
        mark = f'<tspan fill="{s.c["acc"]}" style="font-family:{MONO}" font-weight="700">:*</tspan> ' if name == "bise" else ""
        return s.t(x, y, f'{mark}{E(name)}', size, "text", 600)
    def key(s, x, y, label, t0, t1):
        w = tw(label, 12) + 14
        return s.at(t0, t1, f'<rect x="{x}" y="{y - 15}" width="{w:.0f}" height="21" rx="5" fill="{s.c["chip"]}" stroke="{s.c["faint"]}"/>'
                    + s.t(x + w / 2, y, E(label), 12, "text", 700, anchor="middle"), dur=.08)
    def composer(s, x, y, w, to="bise", where="storefront", placeholder=None, keys="^R dictate   ∿ voice   @ file   $ skills   / commands"):
        """the composer: the 'to …' tab, the box, the + and the send button, the key row under it. returns (body, text baseline)."""
        c = s.c; ph = placeholder or f"write to {to}, then ⏎"
        b = (f'<rect x="{x + 14}" y="{y - 22}" width="{tw("to " + to + "   " + where, 12) + 22:.0f}" height="26" rx="7" fill="{c["raised"]}" stroke="{c["line"]}"/>'
             + s.t(x + 24, y - 5, f'to {E(to)}   <tspan fill="{c["dim"]}">{E(where)}</tspan>', 12)
             + f'<rect x="{x}" y="{y}" width="{w}" height="58" rx="12" fill="{c["bg"]}" stroke="{c["rule"]}"/>'
             + s.t(x + 14, y + 50, "+", 15, "dim")
             + f'<circle cx="{x + w - 20}" cy="{y + 42}" r="10" fill="{c["chip"]}"/>' + s.t(x + w - 20, y + 46, "↑", 11, "dim", anchor="middle")
             + s.t(x + 4, y + 76, E(keys), 11.5, "faint", mono=True))
        return b, ph, (x + 14, y + 24)
    def svg(s, label):
        css = "@keyframes g{0%{opacity:.35}50%{opacity:1}100%{opacity:.35}}.g{animation:g 1.2s infinite}"
        last = max([t for t in s.tl.starts if t < s.T - 0.8] or [0])
        assert last + 2 <= s.T - 0.8, f"{label[:40]}: the last event ends at {last:.2f} s, the loop at {s.T} s: no 2 s still"
        return svg(s.W, s.H, "".join(s.o), "".join(s.tl.css) + css, label, {"mode": s.c["mode"]}, pad=16)

def placeholder_at(d, x, y, text, spans):
    """the composer's placeholder, shown where nothing is typed: spans = [(start typing, send)]."""
    ends = [0] + [b for (_, b) in spans]; starts = [a for (a, _) in spans] + [d.T]
    return "".join(d.at(a + .1, b, d.t(x, y, E(text), 13, "faint"), dur=.1) for a, b in zip(ends, starts) if b - a > .3)

def d_session(m):
    """fig. 1, bise desktop: one ask, bise starts two agents (the right bar), a question in the inbox, one key, a land."""
    c = DPAL[m]; T = 11.5
    d = Desk(c, T, 452); o = d.o; t = d.t; at = d.at
    TX, RB = 448, 680  # the thread column ends, the right bar starts
    o.append(f'<rect x="{TX}" y="0" width="{RB - TX}" height="{d.H}" fill="{c["side"]}"/><path d="M{TX} 0 V{d.H}" stroke="{c["line"]}"/>'
             f'<path d="M0 38 H{TX}" stroke="{c["line"]}"/>')
    # the thread's head: bise · storefront, and the pill while something waits on him
    o.append(t(18, 25, f'<tspan fill="{c["acc"]}" style="font-family:{MONO}" font-weight="700">:*</tspan> <tspan font-weight="600">bise</tspan> <tspan fill="{c["dim"]}">· storefront</tspan>', 13))
    pw = tw("1 waiting for you", 11.5) + 16; px_ = 18 + tw(":* bise · storefront", 13) + 14
    o.append(at(5.0, 6.4, f'<rect x="{px_:.0f}" y="12" width="{pw:.0f}" height="20" rx="10" fill="{c["accsoft"]}"/>' + t(px_ + 8, 26, "1 waiting for you", 11.5, "acc")))
    # the right bar: storefront, AGENTS, ARTIFACTS, SCHEDULED & WATCHING
    rx = TX + 16
    o.append(t(rx, 25, '<tspan font-weight="600">storefront</tspan>', 13))
    for a, b, n in [(3.5, 3.9, 1), (3.9, 7.6, 2), (7.6, None, 1)]:
        o.append(at(a, b, t(rx + tw("storefront", 13) + 10, 25, f"{n} working", 12, "dim"), dur=.1))
    lab = lambda y, s_: t(rx, y, s_, 11.5, "faint", 600, extra=' letter-spacing=".06em"')
    for a, b, n in [(0, 3.5, 0), (3.5, 3.9, 1), (3.9, None, 2)]:
        o.append(at(a, b, lab(64, f"AGENTS · {n}"), dur=.1))
    o.append(t(RB - 16, 64, "all ›", 11.5, "faint", anchor="end"))
    for i, (t0, name, what, marks) in enumerate([(3.5, "perf", "product page speed", [(3.5, "∿", "dim"), (7.6, "✓", "ok")]),
                                                  (3.9, "search", "size filter", [(3.9, "∿", "dim"), (5.0, "?", "acc"), (6.4, "∿", "dim")])]):
        y = 90 + i * 25
        o.append(at(t0, None, t(rx + 18, y, f'<tspan font-weight="500">{name}</tspan>  <tspan fill="{c["dim"]}" font-size="12">{what}</tspan>', 13)))
        for j, (a, g, col) in enumerate(marks):
            b = marks[j + 1][0] if j + 1 < len(marks) else None
            o.append(at(a, b, t(rx, y, f'<tspan class="g">{g}</tspan>' if g == "∿" else g, 13, col), dur=.08))
    o.append(lab(158, "ARTIFACTS · 0") + lab(186, "SCHEDULED &amp; WATCHING · 0"))
    # the thread
    X, R = 22, TX - 22
    o.append(d.head(X, 62, "bise"))
    o.append(t(X, 82, "morning. nothing waits on you in storefront.", 13, "dim"))
    ask = "product page is slow on phones. and search needs a size filter"
    send = 2.3
    bl, bh = d.bubble(R, 98, wrap(ask, 270))
    o.append(at(send, None, bl))
    y = 98 + bh + 24
    o.append(at(2.9, None, d.head(X, y, "bise") + t(X, y + 20, "on it. perf takes the product page, search the size filter.", 13)))
    for i, (who, what, t0) in enumerate([("perf", "make the product page fast on phones", 3.4), ("search", "add a size filter to search", 3.8)]):
        yy = y + 48 + i * 26
        cw = tw(f"✉ bise → {who}", 12) + 14
        o.append(at(t0, None, d.chip(X, yy, f'✉ <tspan font-weight="600" fill="{c["text"]}">bise</tspan> → {who}', cw) + t(X + cw + 8, yy, E(what), 12.5, "dim")))
    yq = y + 48 + 2 * 26 + 8
    o.append(at(6.5, None, t(X, yq, f'<tspan fill="{c["ok"]}">✓</tspan> you answered search · EU only', 12.5, "dim")))
    o.append(at(7.6, None, t(X, yq + 24, f'<tspan fill="{c["ok"]}">✓</tspan> perf landed on main · <tspan fill="{c["text"]}">a1b2c3d</tspan> · 3 files +42 −18', 12.5, "dim")))
    # the inbox block above the composer, while search's question waits
    iy = 280
    ib = (f'<rect x="{X - 4}" y="{iy}" width="{R - X + 8}" height="80" rx="10" fill="{c["raised"]}" stroke="{c["line"]}"/>'
          + t(X + 10, iy + 20, f'inbox <tspan fill="{c["dim"]}">1 waiting</tspan>', 12)
          + t(R - 8, iy + 20, f'<tspan style="font-family:{MONO}">^1</tspan> open', 12, "dim", anchor="end")
          + t(X + 10, iy + 44, f'<tspan fill="{c["dim"]}">1</tspan>  <tspan fill="{c["acc"]}">?</tspan>  <tspan font-weight="600">search</tspan>  which size system: EU, or US too?', 12.5)
          + t(X + 30, iy + 66, f'<tspan style="font-family:{MONO}">1</tspan> EU only     <tspan style="font-family:{MONO}">2</tspan> EU and US', 12, "dim"))
    o.append(at(5.0, 6.4, ib))
    o.append(d.key(R - 34, iy + 66, "1", 6.0, 6.35))
    # the composer: he types the ask, sends it
    cb, ph, (cx, cy) = d.composer(X - 4, 386 - 0, R - X + 8)
    o.append(cb)
    o.append(placeholder_at(d, cx, cy, ph, [(0.3, send)]))
    o.append(at(0.25, send, d.typing(cx, cy, ask, 0.3, 2.0), dur=.05))
    return d.svg("fig. 1 in bise desktop: you ask for two things; bise starts perf and search, they show in the right bar; search's question waits in the inbox, you answer with one key; perf lands on main.")


def d_artifacts(m):
    """11 · artifacts: perf's page chip in the thread; a click opens it beside the thread; a note on a line; send."""
    c = DPAL[m]; T = 11.5
    d = Desk(c, T, 452); o = d.o; t = d.t; at = d.at
    open_ = 2.2
    # phase A: the thread alone, wide
    def thread(w, x0=22):
        R = w - 22; b = []
        b.append(t(x0, 25, f'<tspan font-weight="600">product page speed</tspan>', 13))
        bw = tw("∿ working · 4 min", 11.5) + 16; bx = x0 + tw("product page speed", 13) * 1.12 + 12
        b.append(f'<rect x="{bx:.0f}" y="12" width="{bw:.0f}" height="20" rx="10" fill="{c["chip"]}"/>' + t(bx + 8, 26, "∿ working · 4 min", 11.5, "dim"))
        b.append(f'<path d="M0 38 H{w}" stroke="{c["line"]}"/>')
        y = 64
        b.append(d.head(x0, y, "perf")); y += 20
        for i, l in enumerate(["$ lighthouse staging/product --preset=mobile", "± src/product/Hero.tsx"]):
            n = int((w - 2 * x0 - 30) / 7.1)
            l = l if len(l) <= n else l[:n - 1] + "…"
            b.append(t(x0, y + i * 19, E(l) + f'  <tspan fill="{c["ok"]}">✓</tspan>', 11.5, "dim", mono=True))
        y += 50
        for l in wrap("the hero image went from 2.4 MB to 180 KB; first paint on a mid phone from 3.1 s to 0.9 s.", R - x0):
            b.append(t(x0, y, E(l), 13)); y += 20
        y += 10
        label = "↗ product page, before / after"
        cw = tw(label, 12.5) + tw("page · v2", 11.5) + 30
        b.append(f'<rect x="{x0}" y="{y - 15}" width="{cw:.0f}" height="22" rx="6" fill="{c["accsoft"]}"/>'
                 + t(x0 + 8, y, f'{E(label)}  <tspan fill="{c["dim"]}" font-size="11.5">page · v2</tspan>', 12.5, "acc"))
        return b, y
    ta, ya = thread(680)
    o.append(at(0, open_, "".join(ta), dur=.15))
    # the click on the chip
    o.append(at(1.7, open_, f'<circle cx="120" cy="{ya - 4}" r="14" fill="none" stroke="{c["acc"]}" stroke-width="2"/>', dur=.1))
    # phase B: the narrow thread, the panel beside it
    PX = 300
    tb, yb = thread(PX)
    reply = at(8.4, None, d.head(22, yb + 40, "perf") + "".join(t(22, yb + 60 + 20 * i, E(l), 13) for i, l in enumerate(wrap("on it: 14 thumbnails, same treatment. v3 in a few minutes.", PX - 44))))
    cb, ph, (cx, cy) = d.composer(18, 362, PX - 36, to="perf", where="product page, before / after", placeholder="ask perf about it, then ⏎", keys="^R dictate   ∿ voice   ctrl+c stop")
    o.append(at(open_, None, "".join(tb) + reply + cb + d.t(cx, cy, E(ph), 13, "faint"), dur=.15))
    # the panel slides in from the right
    pan = [f'<rect x="{PX}" y="0" width="{680 - PX}" height="{d.H}" fill="{c["side"]}"/><path d="M{PX} 0 V{d.H}" stroke="{c["line"]}"/>',
           t(PX + 16, 25, '<tspan font-weight="600">product page, before / after</tspan>', 13),
           t(664, 25, "page · v2 ⌄   ✕", 12, "dim", anchor="end"), f'<path d="M{PX} 38 H680" stroke="{c["line"]}"/>']
    gx, gw = PX + 14, 680 - PX - 28
    pan.append(f'<rect x="{gx}" y="50" width="{gw}" height="390" rx="12" fill="{c["bg"]}" stroke="{c["line"]}"/>')
    # the page's own bar: what changed · v2 · send, and the notes pill
    pan.append(t(gx + 14, 74, "storefront · perf · v2", 11.5, "faint"))
    pan.append(t(gx + gw - 14, 74, f'what changed   v2   <tspan fill="{c["text"]}" font-weight="600">send</tspan>', 11.5, "dim", anchor="end"))
    d_, wd = ink.text_path("product page, before / after", "serif", 22, x=gx + 14, y=132, wght=600, opsz=36, track=-.02)
    pan.append(f'<path d="{d_}" fill="{c["text"]}"/>')
    ins = wrap("the hero went from 2.4 MB to 180 KB. on a mid-range phone the page paints in 0.9 s instead of 3.1 s.", gw - 80, 12.5)
    ih = 34 + 18 * len(ins); cy0 = 146 + ih + 12
    pan.append(f'<rect x="{gx + 14}" y="146" width="{gw - 28}" height="{ih}" rx="8" fill="{c["raised"]}"/>' + t(gx + 26, 164, "in short", 11.5, "faint", mono=True))
    for i, l in enumerate(ins):
        pan.append(t(gx + 26, 184 + 18 * i, E(l), 12.5))
    cwid = (gw - 28 - 10) / 2
    for j, (head, rows) in enumerate([("before", ["hero: 2.4 MB jpeg", "first paint: 3.1 s", "page: 3.8 MB"]), ("after", ["hero: 180 KB avif", "first paint: 0.9 s", "page: 1.1 MB"])]):
        x = gx + 14 + j * (cwid + 10)
        pan.append(f'<rect x="{x:.0f}" y="{cy0}" width="{cwid:.0f}" height="96" rx="8" fill="{c["raised"]}"/>' + t(x + 12, cy0 + 22, head, 13, "text", 600))
        for i, r in enumerate(rows):
            pan.append(t(x + 12, cy0 + 44 + 20 * i, "◦ " + E(r), 12, "text"))
    # his selection on 'first paint: 0.9 s', the note, the notes pill, send
    sx = gx + 14 + cwid + 10 + 10
    pan.append(at(3.6, 7.0, f'<rect x="{sx:.0f}" y="{cy0 + 50}" width="{tw("◦ first paint: 0.9 s", 12) + 6:.0f}" height="18" rx="3" fill="{c["sel"]}"/>' + t(sx + 2, cy0 + 64, "◦ first paint: 0.9 s", 12, "text"), dur=.15))
    nx, ny = gx + 40, cy0 + 108
    note = (f'<rect x="{nx}" y="{ny}" width="{gw - 80}" height="62" rx="10" fill="{c["bg"]}" stroke="{c["rule"]}"/>'
            + t(nx + 12, ny + 20, "note on “first paint: 0.9 s”", 11.5, "faint"))
    o_note = at(4.0, 5.9, note, dur=.15)
    typed = at(4.0, 5.9, d.typing(nx + 12, ny + 44, "and the thumbnails? same treatment", 4.2, 5.4, 12.5), dur=.05)
    pin = at(5.9, 7.0, f'<circle cx="{sx + tw("◦ first paint: 0.9 s", 12) + 14:.0f}" cy="{cy0 + 59}" r="4" fill="{c["acc"]}"/>', dur=.1)
    pw = tw("notes · 1 ▸", 11.5) + 18
    pill = at(5.9, 7.0, f'<rect x="{gx + gw - 14 - pw:.0f}" y="84" width="{pw:.0f}" height="20" rx="10" fill="{c["text"]}"/>' + t(gx + gw - 14 - pw / 2, 98, "notes · 1 ▸", 11.5, "bg", anchor="middle"), dur=.1)
    press = at(6.6, 7.0, f'<rect x="{gx + gw - 46}" y="61" width="38" height="19" rx="5" fill="{c["accsoft"]}" stroke="{c["acc"]}"/>' + t(gx + gw - 27, 74, "send", 11.5, "acc", 600, anchor="middle"), dur=.08)
    sent_w = tw("1 note sent to perf", 12) + 24
    sent = at(7.0, None, f'<rect x="{gx + (gw - sent_w) / 2:.0f}" y="400" width="{sent_w:.0f}" height="26" rx="13" fill="{c["text"]}"/>' + t(gx + gw / 2, 417, "1 note sent to perf", 12, "bg", anchor="middle"), dur=.15)
    body = "".join(pan) + o_note + typed + pin + pill + press + sent
    sl = f"sl{d.tl.n + 1}"; d.tl.n += 1
    d.keyframes(sl, f"0%,{d.p(open_)}{{transform:translateX({680 - PX}px)}}{d.p(open_ + .4)},{d.p(T - .3)}{{transform:translateX(0)}}100%{{transform:translateX({680 - PX}px)}}", "cubic-bezier(.2,0,0,1)")
    o.append(at(open_, None, f'<g class="{sl}">{body}</g>', dur=.05))
    return d.svg("11 in bise desktop: perf's page 'product page, before / after' is a chip in its thread; a click opens it beside the thread; you select a line, leave a note, and send it; perf answers it's on it.")

def d_voicemode(m):
    """5 · voice to voice from any app: hold fn over a browser, say it; the corner card hears you, then answers; it lands in bise's thread."""
    c = DPAL[m]; T = 12.5
    d = Desk(c, T, 432); o = d.o; t = d.t; at = d.at
    # the browser in front: a plain window (traffic lights, a tab, the address), a docs page
    o[0] = f'<rect width="680" height="432" fill="{c["frame"] if "frame" in c else c["chip"]}"/>'
    bx, by, bw, bh = 18, 16, 644, 400
    o.append(f'<rect x="{bx}" y="{by}" width="{bw}" height="{bh}" rx="10" fill="{c["bg"]}" stroke="{c["line"]}"/>'
             f'<path d="M{bx} {by + 34} H{bx + bw}" stroke="{c["line"]}"/>')
    for i, col in enumerate(["#ff5f57", "#febc2e", "#28c840"]):
        o.append(f'<circle cx="{bx + 18 + i * 16}" cy="{by + 17}" r="5.5" fill="{col}"/>')
    o.append(f'<rect x="{bx + 180}" y="{by + 8}" width="284" height="19" rx="6" fill="{c["chip"]}"/>' + t(bx + 322, by + 22, "stripe.com/docs/billing/testing", 11.5, "dim", anchor="middle"))
    o.append(t(bx + 40, by + 80, '<tspan font-weight="700">testing subscriptions</tspan>', 20))
    for i, wdt in enumerate([520, 470, 500, 300, 0, 480, 510, 420, 260]):
        if wdt: o.append(f'<rect x="{bx + 40}" y="{by + 102 + i * 20}" width="{wdt}" height="7" rx="3.5" fill="{c["line"]}"/>')
    # fn held, bottom left
    o.append(d.key(bx + 14, by + bh - 14, "fn", 0.8, 4.3))
    # the corner card, bottom right: ':*', listening, the still chip, his words; then the answer line by line
    kx, kw = 330, 316
    ky0 = 410
    def card(h, inner):
        y = ky0 - h
        return (f'<rect x="{kx + 2}" y="{y + 4}" width="{kw}" height="{h}" rx="14" fill="{c["shadow"]}"/>'
                f'<rect x="{kx}" y="{y}" width="{kw}" height="{h}" rx="14" fill="{c["raised"]}" stroke="{c["line"]}"/>' + inner(y))
    mark = lambda y: t(kx + 14, y + 24, f'<tspan fill="{c["acc"]}" style="font-family:{MONO}" font-weight="700">:*</tspan>', 13)
    still = lambda y: (f'<rect x="{kx + 14}" y="{y + 36}" width="{tw("▣ Safari · stripe.com  ✕", 11.5) + 14:.0f}" height="20" rx="6" fill="{c["chip"]}"/>'
                       + t(kx + 21, y + 50, f'▣ Safari · stripe.com  <tspan fill="{c["faint"]}">✕</tspan>', 11.5, "dim"))
    q = "how do i test a renewal without waiting a month?"
    qlines = wrap(q, kw - 28)
    H1 = 70 + 20 * len(qlines)
    listen = card(H1, lambda y: mark(y) + t(kx + 40, y + 24, "● listening", 12, "dim") + still(y)
                  + "".join(d.words(kx + 14, y + 76 + 20 * i, l, 1.3 + sum(len(x.split()) for x in qlines[:i]) * .26, .26) for i, l in enumerate(qlines)))
    o.append(at(1.0, 4.3, listen, dur=.15))
    think = card(H1, lambda y: mark(y) + t(kx + 40, y + 24, f'<tspan class="g">∿</tspan> bise is on it', 12, "dim") + still(y)
                 + "".join(t(kx + 14, y + 76 + 20 * i, E(l), 13, "dim") for i, l in enumerate(qlines)))
    o.append(at(4.3, 5.2, think, dur=.05))
    ans = ["use a test clock: create one,", "attach the customer to it, then", "advance it 31 days. the renewal", "and its webhooks fire like in prod."]
    for n in range(1, len(ans) + 1):
        a0 = 5.2 + (n - 1) * .75; a1 = 5.2 + n * .75 if n < len(ans) else 8.8
        Hn = 44 + 20 * n
        o.append(at(a0, a1, card(Hn, lambda y, n=n: mark(y) + "".join(t(kx + 14, y + 52 + 20 * i, E(l), 13) for i, l in enumerate(ans[:n]))), dur=.05))
    # it closes; the answer is in bise's thread: bise's window comes up
    wx, wy, ww, wh = 70, 46, 540, 330
    win = (f'<rect x="{wx + 3}" y="{wy + 5}" width="{ww}" height="{wh}" rx="12" fill="{c["shadow"]}"/>'
           f'<rect x="{wx}" y="{wy}" width="{ww}" height="{wh}" rx="12" fill="{c["bg"]}" stroke="{c["line"]}"/>'
           + t(wx + 18, wy + 25, f'<tspan fill="{c["acc"]}" style="font-family:{MONO}" font-weight="700">:*</tspan> <tspan font-weight="600">bise</tspan> <tspan fill="{c["dim"]}">· every project</tspan>', 13)
           + f'<path d="M{wx} {wy + 38} H{wx + ww}" stroke="{c["line"]}"/>')
    bl, bh2 = d.bubble(wx + ww - 18, wy + 54, wrap(q, 320))
    win += bl + t(wx + ww - 18, wy + 54 + bh2 + 14, "said · 10:42", 11.5, "faint", anchor="end")
    yy = wy + 54 + bh2 + 44
    win += d.head(wx + 18, yy, "bise") + "".join(t(wx + 18, yy + 20 + 20 * i, E(l), 13) for i, l in enumerate(wrap(" ".join(ans), ww - 40)))
    o.append(at(9.2, None, win, dur=.3))
    return d.svg("5 in bise desktop: over a browser on stripe's docs you hold fn and ask how to test a renewal; the corner card shows your words and the still of the page, then bise's answer line by line; it closes, and the answer is in bise's thread.")

DESK = [("demo-b-desktop", d_session), ("artifacts-desktop", d_artifacts), ("voicemode-desktop", d_voicemode)]
