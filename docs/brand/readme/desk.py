# ---------- the desktop scenes: the same features, in bise desktop (designer's brief, readme-review n1) ----------
# run by make.py (exec'd after the terminal scenes: it uses make.py's TL, svg, E, MONO and ink). out: feat/<name>-{light,dark}.svg
# and demo-b-desktop-{light,dark}.svg. the terminal scenes stay as they are (bise.dev and the terminal docs use them).
# the app's own look (apps/desktop/src/ds/tokens.css, the shots in site/download/), cropped to the part that tells the
# feature, on the same paper card as the terminal scenes. the system sans (SF) like the app; mono only for code and keys.
DPAL = {
  "dark":  dict(mode="dark", bg="#141211", text="#ece6da", dim="#a39c90", faint="#857d72", rule="#4a4540", acc="#f4a6b0", ok="#b9d99a", err="#ff5a52",
                raised="#1f1c1a", chip="#262220", side="#191715", line="#2b2725", sel="#33292c", accsoft="#2e2326", win="#1a1816", shadow="#00000066"),
  "light": dict(mode="light", bg="#fdfbf7", text="#1b1917", dim="#6b645a", faint="#7d766c", rule="#cfc8bd", acc="#b8416b", ok="#3f7a2a", err="#b3261e",
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
             f'<path d="M0 38 H{TX}" stroke="{c["line"]}"/>'
             f'<clipPath id="col-t"><rect x="0" y="0" width="{TX - 8}" height="{d.H}"/></clipPath>'
             f'<clipPath id="col-r"><rect x="{TX + 1}" y="0" width="{RB - TX - 9}" height="{d.H}"/></clipPath>')
    # every line stays in its column: the thread's and the right bar's
    colT = lambda body: f'<g clip-path="url(#col-t)">{body}</g>'
    colR = lambda body: f'<g clip-path="url(#col-r)">{body}</g>'
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
    for i, (t0, name, what, marks) in enumerate([(3.5, "perf", "product page speed", [(3.5, "∿", "dim"), (7.6, "✓", "dim")]),
                                                  (3.9, "search", "size filter", [(3.9, "∿", "dim"), (5.0, "?", "acc"), (6.4, "∿", "dim")])]):
        y = 90 + i * 25
        o.append(colR(at(t0, None, t(rx + 18, y, f'<tspan font-weight="500">{name}</tspan>  <tspan fill="{c["dim"]}" font-size="12">{what}</tspan>', 13))))
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
    o.append(colT(at(2.9, None, d.head(X, y, "bise") + t(X, y + 20, "on it. perf takes the product page, search the size filter.", 13))))
    for i, (who, what, t0) in enumerate([("perf", "make the product page fast on phones", 3.4), ("search", "add a size filter to search", 3.8)]):
        yy = y + 48 + i * 26
        cw = tw(f"✉ bise → {who}", 12) * 1.08 + 16
        o.append(colT(at(t0, None, d.chip(X, yy, f'✉ <tspan font-weight="600" fill="{c["text"]}">bise</tspan> → {who}', cw) + t(X + cw + 8, yy, E(what), 12.5, "dim"))))
    # his answer, on his side: '✓ you answered search' (text-3) over his bubble (rows-cards)
    yq = y + 48 + 2 * 26 + 4
    ab, ah = d.bubble(R, yq + 8, ["EU only"])
    o.append(colT(at(6.5, None, t(R, yq, "✓ you answered search", 11.5, "faint", anchor="end") + ab)))
    # the land: 'perf landed on main · a1b2c3d' (thread.landed), the files as their own quiet chip; green only for the diff's +
    yl = yq + 8 + ah + 22
    lw = tw("✓ perf landed on main · a1b2c3d", 12.5) * 1.05 + 10
    fw = tw("± 3 files +42 −18", 11.5) * 1.06 + 16
    o.append(colT(at(7.6, None, t(X, yl, f'✓ perf landed on main · <tspan fill="{c["text"]}">a1b2c3d</tspan>', 12.5, "dim")
                     + d.chip(X + lw, yl, f'± 3 files <tspan fill="{c["ok"]}">+42</tspan> <tspan fill="{c["err"]}">−18</tspan>', fw, size=11.5))))
    # the inbox block above the composer, while search's question waits
    iy = 280
    ib = (f'<rect x="{X - 4}" y="{iy}" width="{R - X + 8}" height="80" rx="10" fill="{c["raised"]}" stroke="{c["line"]}"/>'
          + t(X + 10, iy + 20, f'inbox <tspan fill="{c["dim"]}">· 1 waiting</tspan>', 12)
          + t(R - 8, iy + 20, '⌃1 open', 12, "dim", anchor="end")
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
        # the head: the agent's name, its role dim, its state (thread header)
        # 16 px before the divider: the role cuts with … when the column is narrow (designer, m_40550)
        bw = tw("∿ working · 4 min", 11.5) + 16; full = "product page speed"; role = full; n = len(full)
        fits = lambda r: x0 + tw("perf  " + r, 13) * 1.1 + 12 + bw <= w - 16
        while not fits(role) and n > 4: n -= 1; role = full[:n].rstrip() + "…"
        b.append(t(x0, 25, f'<tspan font-weight="600">perf</tspan>  <tspan fill="{c["dim"]}">{role}</tspan>', 13))
        bx = x0 + tw("perf  " + role, 13) * 1.1 + 12
        b.append(f'<rect x="{bx:.0f}" y="12" width="{bw:.0f}" height="20" rx="10" fill="{c["chip"]}"/>' + t(bx + 8, 26, "∿ working · 4 min", 11.5, "dim"))
        b.append(f'<path d="M0 38 H{w}" stroke="{c["line"]}"/>')
        y = 64
        b.append(d.head(x0, y, "perf")); y += 20
        # tool rows as the app draws them: '$' + the model's description (sans, text-2), the time text-3 at the right;
        # an edit: '± Hero.tsx  +18 −6' (green only for the diff's +)
        b.append(t(x0, y, "$ run lighthouse on a mid phone", 12.5, "dim") + t(R, y, "✓ 38 s", 11.5, "faint", anchor="end"))
        b.append(t(x0, y + 20, f'± Hero.tsx  <tspan fill="{c["ok"]}">+18</tspan> <tspan fill="{c["err"]}">−6</tspan>', 12.5, "dim")
                 + t(R, y + 20, "✓ 0.3 s", 11.5, "faint", anchor="end"))
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
    o.append(at(1.7, open_, f'<circle cx="120" cy="{ya - 4}" r="14" fill="none" stroke="{c["dim"]}" stroke-width="2"/>', dur=.1))
    # phase B: the narrow thread, the panel beside it
    PX = 300
    tb, yb = thread(PX)
    reply = at(8.4, None, d.head(22, yb + 40, "perf") + "".join(t(22, yb + 60 + 20 * i, E(l), 13) for i, l in enumerate(wrap("on it: 14 thumbnails, same treatment. v3 in a few minutes.", PX - 44))))
    cb, ph, (cx, cy) = d.composer(18, 362, PX - 36, to="perf", where="product page, before / after", placeholder="ask perf about it, then ⏎", keys="tab queue   ⏎ steer   ctrl+c stop")
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
    # sent: one ink line on the page, no pill
    sent = at(7.0, None, t(gx + gw / 2, 417, "✓ 1 note sent to perf", 12, "text", anchor="middle"), dur=.15)
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
    # the paper frame is the screen: the browser is a window on it, the corner card sits at the screen's corner
    o[0] = f'<rect width="680" height="432" fill="{c["chip"]}"/>'
    bx, by, bw, bh = 18, 16, 560, 356
    o.append(f'<rect x="{bx}" y="{by}" width="{bw}" height="{bh}" rx="10" fill="{c["bg"]}" stroke="{c["line"]}"/>'
             f'<path d="M{bx} {by + 34} H{bx + bw}" stroke="{c["line"]}"/>')
    for i, col in enumerate(["#ff5f57", "#febc2e", "#28c840"]):
        o.append(f'<circle cx="{bx + 18 + i * 16}" cy="{by + 17}" r="5.5" fill="{col}"/>')
    o.append(f'<rect x="{bx + 150}" y="{by + 8}" width="260" height="19" rx="6" fill="{c["chip"]}"/>' + t(bx + 280, by + 22, "stripe.com/docs/billing/testing", 11.5, "dim", anchor="middle"))
    o.append(t(bx + 40, by + 80, '<tspan font-weight="700">testing subscriptions</tspan>', 20))
    for i, wdt in enumerate([460, 410, 440, 260, 0, 420, 450, 370, 220]):
        if wdt: o.append(f'<rect x="{bx + 40}" y="{by + 102 + i * 20}" width="{wdt}" height="7" rx="3.5" fill="{c["line"]}"/>')
    # fn held, bottom left
    o.append(d.key(bx + 14, by + bh - 14, "fn", 0.8, 4.3))
    # the corner card, bottom right: ':*', listening, the still chip, his words; then the answer line by line
    kw = 300; kx = 680 - 16 - kw  # 16 px from the screen's right and bottom, over the browser's edge
    ky0 = 432 - 16
    def card(h, inner):
        y = ky0 - h
        return (f'<rect x="{kx + 2}" y="{y + 4}" width="{kw}" height="{h}" rx="14" fill="{c["shadow"]}"/>'
                f'<rect x="{kx}" y="{y}" width="{kw}" height="{h}" rx="14" fill="{c["raised"]}" stroke="{c["line"]}"/>' + inner(y))
    mark = lambda y: t(kx + 14, y + 24, f'<tspan fill="{c["acc"]}" style="font-family:{MONO}" font-weight="700">:*</tspan>', 13)
    # the still chip as signed: a 16 px thumbnail of the page, 'Safari · stripe.com', ✕
    def still(y):
        w = tw("Safari · stripe.com", 11.5) * 1.06 + 50
        thumb = (f'<rect x="{kx + 19}" y="{y + 38}" width="16" height="16" rx="3" fill="{c["bg"]}" stroke="{c["line"]}"/>'
                 + "".join(f'<rect x="{kx + 21}" y="{y + 42 + 3 * j}" width="{12 - 3 * (j % 2)}" height="1.4" fill="{c["faint"]}"/>' for j in range(3)))
        return (f'<rect x="{kx + 14}" y="{y + 35}" width="{w:.0f}" height="22" rx="6" fill="{c["chip"]}"/>' + thumb
                + t(kx + 41, y + 50, f'Safari · stripe.com  <tspan fill="{c["faint"]}">✕</tspan>', 11.5, "dim"))
    q = "how do i test a renewal without waiting a month?"
    qlines = wrap(q, kw - 34)
    H1 = 94 + 20 * len(qlines)
    hint = lambda y: t(kx + 14, y + H1 - 14, "fn ⌫ no screenshot", 11.5, "faint")
    listen = card(H1, lambda y: mark(y) + t(kx + 40, y + 24, "● listening", 12, "dim") + still(y) + hint(y)
                  + "".join(d.words(kx + 14, y + 78 + 20 * i, l, 1.3 + sum(len(x.split()) for x in qlines[:i]) * .26, .26) for i, l in enumerate(qlines)))
    o.append(at(1.0, 4.3, listen, dur=.15))
    think = card(H1, lambda y: mark(y) + t(kx + 40, y + 24, f'<tspan class="g">∿</tspan> bise is on it', 12, "dim") + still(y) + hint(y)
                 + "".join(t(kx + 14, y + 78 + 20 * i, E(l), 13, "dim") for i, l in enumerate(qlines)))
    o.append(at(4.3, 5.2, think, dur=.05))
    ans = ["use a test clock: create one,", "attach the customer to it, then", "advance it 31 days. the renewal", "and its webhooks fire like in prod."]
    for n in range(1, len(ans) + 1):
        a0 = 5.2 + (n - 1) * .75; a1 = 5.2 + n * .75 if n < len(ans) else 8.8
        Hn = 70 + 20 * n
        # the answering card ends with its keys (signed, m_22387)
        o.append(at(a0, a1, card(Hn, lambda y, n=n, Hn=Hn: mark(y) + "".join(t(kx + 14, y + 52 + 20 * i, E(l), 13) for i, l in enumerate(ans[:n]))
                                 + t(kx + 14, y + Hn - 14, "⏎ open in bise   esc close", 11.5, "faint")), dur=.05))
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

# ---------- shared parts of the window: two columns, the right bar, an agent's head, its rows ----------
WORKING_KEYS = "tab queue   ⏎ steer   ctrl+c stop"

def cols(d, TX, RB=680):
    """the thread column and the right bar; every line stays in its column. returns (colT, colR)."""
    c = d.c
    d.o.append(f'<rect x="{TX}" y="0" width="{RB - TX}" height="{d.H}" fill="{c["side"]}"/><path d="M{TX} 0 V{d.H}" stroke="{c["line"]}"/>'
               f'<path d="M0 38 H{TX}" stroke="{c["line"]}"/>'
               f'<clipPath id="col-t"><rect x="0" y="0" width="{TX - 8}" height="{d.H}"/></clipPath>'
               f'<clipPath id="col-r"><rect x="{TX + 1}" y="0" width="{RB - TX - 9}" height="{d.H}"/></clipPath>')
    return (lambda b: f'<g clip-path="url(#col-t)">{b}</g>'), (lambda b: f'<g clip-path="url(#col-r)">{b}</g>')

def rbar(d, TX, colR, working, agents, RB=680, project="storefront"):
    """the right bar: the project and 'n working' ([(t0, t1, n)]), AGENTS with their rows ([(t0, name, what, [(t, mark, color)])]),
    ARTIFACTS and SCHEDULED & WATCHING. returns the rows' baselines."""
    c, t, at, o = d.c, d.t, d.at, d.o
    rx = TX + 16
    o.append(t(rx, 25, f'<tspan font-weight="600">{project}</tspan>', 13))
    for a, b, n in working:
        o.append(at(a, b, t(rx + tw(project, 13) + 10, 25, f"{n} working", 12, "dim"), dur=.1))
    lab = lambda y, s_: t(rx, y, s_, 11.5, "faint", 600, extra=' letter-spacing=".06em"')
    o.append(lab(64, f"AGENTS · {len(agents)}") + t(RB - 16, 64, "all ›", 11.5, "faint", anchor="end"))
    ys = []
    for i, (t0, name, what, marks) in enumerate(agents):
        y = 90 + i * 25; ys.append(y)
        o.append(colR(at(t0, None, t(rx + 18, y, f'<tspan font-weight="500">{name}</tspan>  <tspan fill="{c["dim"]}" font-size="12">{what}</tspan>', 13))))
        for j, (a, g, col) in enumerate(marks):
            b = marks[j + 1][0] if j + 1 < len(marks) else None
            o.append(at(a, b, t(rx, y, f'<tspan class="g">{g}</tspan>' if g == "∿" else g, 13, col), dur=.08))
    o.append(lab(158, "ARTIFACTS · 0") + lab(186, "SCHEDULED &amp; WATCHING · 0"))
    return ys

def ahead(d, name, role, chip=None, x=18):
    """an agent's thread head: its name, its role dim, its state chip ('∿ working · 2 h'). returns (body, where the head ends)."""
    c = d.c
    b = d.t(x, 25, f'<tspan font-weight="600">{E(name)}</tspan>  <tspan fill="{c["dim"]}">{E(role)}</tspan>', 13)
    end = x + tw(f"{name}  {role}", 13) * 1.1 + 12
    if chip:
        bw = tw(chip, 11.5) + 16
        b += f'<rect x="{end:.0f}" y="12" width="{bw:.0f}" height="20" rx="10" fill="{c["chip"]}"/>' + d.t(end + 8, 26, E(chip).replace("∿", '<tspan class="g">∿</tspan>'), 11.5, "dim")
        end += bw + 10
    return b, end

def toolrow(d, x, R, y, html, done):
    """a tool row: '$' or '±' and the model's words (text-2), its time at the right (text-3)."""
    return d.t(x, y, html, 12.5, "dim") + d.t(R, y, done, 11.5, "faint", anchor="end")

def diffs(c, plus, minus):
    return f'<tspan fill="{c["ok"]}">+{plus}</tspan> <tspan fill="{c["err"]}">−{minus}</tspan>'

def landrow(d, x, y, who="perf", sha="a1b2c3d", files="3 files", plus=42, minus=18):
    """'✓ perf landed on main · a1b2c3d', the files as their own quiet chip (green only for the diff's +)."""
    c = d.c
    lw = tw(f"✓ {who} landed on main · {sha}", 12.5) * 1.05 + 10
    fw = tw(f"± {files} +{plus} −{minus}", 11.5) * 1.06 + 16
    return (d.t(x, y, f'✓ {who} landed on main · <tspan fill="{c["text"]}">{sha}</tspan>', 12.5, "dim")
            + d.chip(x + lw, y, f'± {files} {diffs(c, plus, minus)}', fw, size=11.5))

def live(d, x, y, desc, s0, t0, t1, end=-1):
    """the working line: '∿ <what it does> · 12 s', the seconds counting from t0 to t1; held to end (None: the loop's end)."""
    out, k = [], 0
    while t0 + k < t1:
        a = t0 + k; b = min(a + 1, t1) if a + 1 < t1 else (t1 if end == -1 else end)
        out.append(d.at(a, b, d.t(x, y, f'<tspan class="g">∿</tspan> {E(desc)} <tspan fill="{d.c["faint"]}">· {s0 + k} s</tspan>', 12.5, "dim"), dur=.05))
        k += 1
    return "".join(out)

def d_resume(m):
    """2 · long-running goals: perf has worked for hours; bise restarts for an update; the window comes back, perf's thread goes on."""
    c = DPAL[m]; T = 11.5
    d = Desk(c, T, 452); o = d.o; t = d.t; at = d.at
    TX = 448; colT, colR = cols(d, TX); X, R = 22, TX - 22
    rbar(d, TX, colR, [(0, None, 1)], [(0, "perf", "product page speed", [(0, "∿", "dim")]), (0, "search", "size filter", [(0, "✓", "dim")])])
    hb, _ = ahead(d, "perf", "product page speed", "∿ working · 2 h")
    o.append(colT(hb))
    o.append(d.head(X, 64, "perf"))
    o.append(colT(toolrow(d, X, R, 84, "$ convert 14 thumbnails to avif", "✓ 12 s")
                  + toolrow(d, X, R, 104, f'± Gallery.tsx  {diffs(c, 31, 12)}', "✓ 0.2 s")))
    y = 134
    for l in wrap("thumbnails done: 2.1 MB down to 290 KB. now the fonts: two of the four aren't used anywhere.", R - X):
        o.append(t(X, y, E(l), 13)); y += 20
    y += 12
    back = 5.4
    # the row that runs through the restart: running before, done after (perf never stopped)
    o.append(colT(t(X, y, "$ find the fonts no page uses", 12.5, "dim")))
    o.append(at(0, back, t(R, y, '<tspan class="g">∿</tspan>', 12.5, "dim", anchor="end"), dur=.05))
    o.append(at(back, None, t(R, y, "✓ 9 s", 11.5, "faint", anchor="end"), dur=.05))
    o.append(colT(at(6.2, None, toolrow(d, X, R, y + 20, f'± fonts.css  {diffs(c, 2, 9)}', "✓ 0.1 s"))))
    yy = y + 52
    o.append(colT(at(7.0, None, "".join(t(X, yy + 20 * i, E(l), 13) for i, l in enumerate(wrap("two fonts gone: 140 KB less on every page. next, the checkout images.", R - X))))))
    cb, ph, (cx, cy) = d.composer(X - 4, 360, R - X + 8, to="perf", keys=WORKING_KEYS)
    o.append(cb + t(cx, cy, E(ph), 13, "faint"))
    # the restart: the update's own words, over the whole window
    rs = (f'<rect width="680" height="{d.H}" fill="{c["bg"]}"/>'
          + t(340, 196, '<tspan class="g">∿</tspan>', 18, "dim", anchor="middle")
          + t(340, 228, f'restarting on <tspan style="font-family:{MONO}">7a4c4a5</tspan>…', 14, "text", anchor="middle")
          + t(340, 252, "the window comes back in a moment. your agents keep running.", 12.5, "dim", anchor="middle"))
    o.append(at(3.2, back, rs, dur=.3))
    return d.svg("2 in bise desktop: perf has worked on the product page for two hours; bise restarts for an update and says your agents keep running; the window comes back and perf's thread goes on where it was, the command it was running now done.")

def d_worktree(m):
    """3 · automatic worktrees: perf starts; 'ψ sb/perf' on its head, its right-bar row and its composer tab, with its tip; after its land the mark goes."""
    c = DPAL[m]; T = 10
    d = Desk(c, T, 452); o = d.o; t = d.t; at = d.at
    TX, RB = 448, 680; colT, colR = cols(d, TX); X, R = 22, TX - 22
    wt0, wt1 = 0.9, 6.4
    ys = rbar(d, TX, colR, [(0, wt1, 1)], [(0, "perf", "product page speed", [(0, "∿", "dim"), (wt1, "✓", "dim")])])
    # the worktree's mark: last on its row (text-3), on its head and in its composer tab
    o.append(at(wt0, wt1, t(RB - 16, ys[0], "ψ", 13, "faint", anchor="end"), dur=.15))
    hb, end = ahead(d, "perf", "product page speed")
    o.append(colT(hb) + colT(at(wt0, wt1, t(end - 4, 25, f'<tspan fill="{c["faint"]}">ψ</tspan> sb/perf', 12.5, "dim"), dur=.15)))
    # his pointer on the row's ψ, and its tip (the app's words: 'ψ worktree: its own copy of the repo, on sb/perf')
    o.append(at(1.7, 4.6, f'<circle cx="{RB - 20}" cy="{ys[0] - 4}" r="9" fill="none" stroke="{c["dim"]}" stroke-width="1.6"/>', dur=.1))
    l1 = "ψ worktree: its own copy of the repo,"
    tw_ = tw(l1, 11.5) * 1.1 + 24; tx_ = RB - 10 - tw_; ty_ = ys[0] + 12
    tip = (f'<rect x="{tx_ + 2:.0f}" y="{ty_ + 3}" width="{tw_:.0f}" height="48" rx="8" fill="{c["shadow"]}"/>'
           f'<rect x="{tx_:.0f}" y="{ty_}" width="{tw_:.0f}" height="48" rx="8" fill="{c["raised"]}" stroke="{c["rule"]}"/>'
           + t(tx_ + 11, ty_ + 19, E(l1), 11.5, "dim") + t(tx_ + 11, ty_ + 38, f'on <tspan fill="{c["text"]}" style="font-family:{MONO}">sb/perf</tspan>', 11.5, "dim"))
    o.append(at(1.9, 4.6, tip, dur=.15))
    # perf's thread
    o.append(at(0.5, None, d.head(X, 64, "perf")))
    o.append(colT(at(1.4, None, toolrow(d, X, R, 84, f'± Hero.tsx  {diffs(c, 18, 6)}', "✓ 0.3 s"))))
    o.append(colT(at(2.6, None, toolrow(d, X, R, 104, "$ run lighthouse on a mid phone", "✓ 38 s"))))
    y = 134
    o.append(colT(at(3.8, None, "".join(t(X, y + 20 * i, E(l), 13) for i, l in enumerate(wrap("the hero is 180 KB now; first paint 0.9 s on a mid phone. landing it.", R - X))))))
    o.append(colT(at(5.2, None, landrow(d, X, y + 40))))
    # the composer: 'to perf  ψ sb/perf' while the worktree lives
    for a, b, where in [(0, wt0, "storefront"), (wt0, wt1, "ψ sb/perf"), (wt1, None, "storefront")]:
        cb, ph, (cx, cy) = d.composer(X - 4, 360, R - X + 8, to="perf", where=where, keys=WORKING_KEYS)
        o.append(at(a, b, cb + t(cx, cy, E(ph), 13, "faint"), dur=.05))
    return d.svg("3 in bise desktop: perf starts in its own worktree: 'ψ sb/perf' shows on its head, its row in the right bar and its composer tab, whose tip says it's its own copy of the repo; perf lands on main and the worktree's mark goes.")

def d_talk(m):
    """4 · main is always available: bise is working; he types; ⏎ steers; his message lands mid-turn and bise takes it in."""
    c = DPAL[m]; T = 11.5
    d = Desk(c, T, 452); o = d.o; t = d.t; at = d.at
    TX = 448; colT, colR = cols(d, TX); X, R = 22, TX - 22
    rbar(d, TX, colR, [(0, None, 2)], [(0, "perf", "product page speed", [(0, "∿", "dim")]), (0, "search", "size filter", [(0, "∿", "dim")])])
    o.append(t(18, 25, f'<tspan fill="{c["acc"]}" style="font-family:{MONO}" font-weight="700">:*</tspan> <tspan font-weight="600">bise</tspan> <tspan fill="{c["dim"]}">· storefront</tspan>', 13))
    b1, h1 = d.bubble(R, 54, ["clean up checkout: drop what we don't use"])
    o.append(b1)
    o.append(d.head(X, 114, "bise") + colT(t(X, 134, "on it. reading the checkout code first.", 13)))
    send = 4.1
    o.append(colT(live(d, X, 164, "reading the checkout code", 12, 0, send)))
    q = "keep the old discount codes, marketing still sends them"
    b2, h2 = d.bubble(R, 152, wrap(q, 270))
    o.append(at(send, None, b2))
    o.append(at(4.6, None, t(R, 152 + h2 + 16, "steered · bise read it mid-turn", 11.5, "faint", anchor="end"), dur=.2))
    ans = 5.4
    o.append(colT(live(d, X, 152 + h2 + 46, "reading the checkout code", 16, send, ans)))
    ya = 152 + h2 + 50
    o.append(colT(at(ans, None, d.head(X, ya, "bise") + t(X, ya + 20, "ok: the discount codes stay. i'm dropping the rest.", 13))))
    o.append(colT(live(d, X, ya + 48, "removing unused checkout code", 1, 5.8, 8.8, end=None)))
    cb, ph, (cx, cy) = d.composer(X - 4, 360, R - X + 8, keys=WORKING_KEYS)
    o.append(cb)
    o.append(placeholder_at(d, cx, cy, ph, [(0.9, send)]))
    o.append(at(0.85, send, d.typing(cx, cy, q, 0.9, 3.5), dur=.05))
    o.append(d.key(R - 64, 402, "⏎", 3.8, send + .1))
    return d.svg("4 in bise desktop: bise is working on the checkout; you type that the old discount codes stay and press enter: it steers, your message lands mid-turn with 'steered · bise read it mid-turn', and bise answers and goes on.")

REST_KEYS = "^R dictate   ∿ voice   @ file   $ skills   / commands"

def ring(d, x, y, t0, t1, r=9):
    """his pointer: a ring in text-2 (pink is only for what waits on him)."""
    return d.at(t0, t1, f'<circle cx="{x}" cy="{y}" r="{r}" fill="none" stroke="{d.c["dim"]}" stroke-width="1.6"/>', dur=.1)

def bise_head(d):
    c = d.c
    return d.t(18, 25, f'<tspan fill="{c["acc"]}" style="font-family:{MONO}" font-weight="700">:*</tspan> <tspan font-weight="600">bise</tspan> <tspan fill="{c["dim"]}">· storefront</tspan>', 13)

def mail(d, x, y, frm, to, what, bold=None):
    """an agent-to-agent row: '✉ perf → search' as a chip, the words after it (text-2)."""
    c = d.c; lab = f"✉ {frm} → {to}"; cw = tw(lab, 12) * 1.08 + 16
    who = f'<tspan font-weight="600" fill="{c["text"]}">{E(frm)}</tspan>'
    return d.chip(x, y, f'✉ {who} → {E(to)}', cw) + d.t(x + cw + 8, y, E(what), 12.5, "dim")

def main_view(d, colT, X, R):
    """bise's thread after one ask: his bubble, bise's answer, the two agents it started. returns (body, y below)."""
    b, h = d.bubble(R, 54, wrap("product page is slow on phones. and search needs a size filter", 270))
    y = 54 + h + 24
    b += colT(d.head(X, y, "bise") + d.t(X, y + 20, "on it. perf takes the product page, search the size filter.", 13))
    b += colT(mail(d, X, y + 48, "bise", "perf", "make the product page fast on phones") + mail(d, X, y + 74, "bise", "search", "add a size filter to search"))
    return b, y + 74

def meter(d, x, y, n=7):
    """the dictation chip's meter: n bars that move (the mic's level)."""
    if not any("@keyframes mb{" in s for s in d.tl.css):
        d.tl.css.append("@keyframes mb{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}.mb{transform-box:fill-box;transform-origin:50% 100%;animation:mb .6s ease-in-out infinite}")
    return "".join(f'<rect class="mb" x="{x + 4 * i}" y="{y - 12}" width="2.2" height="12" rx="1" fill="{d.c["dim"]}" style="animation-duration:{.42 + .09 * ((i * 5) % 4):.2f}s;animation-delay:-{.11 * i:.2f}s"/>' for i in range(n))

def d_dictation(m):
    """6 · dictation: ctrl+r in the composer: '●', the meter and the time; any key stops; his words come in; ⏎ sends."""
    c = DPAL[m]; T = 10.5
    d = Desk(c, T, 452); o = d.o; t = d.t; at = d.at
    TX = 448; colT, colR = cols(d, TX); X, R = 22, TX - 22
    rbar(d, TX, colR, [(0, None, 1)], [(0, "perf", "product page speed", [(0, "∿", "dim")])])
    o.append(bise_head(d) + d.head(X, 62, "bise") + colT(t(X, 82, "morning. perf is on the product page; nothing waits on you.", 13, "dim")))
    on, stop, words_at, send = 1.0, 4.2, 4.9, 6.4
    said = "search needs a size filter, EU sizes only"
    cb, ph, (cx, cy) = d.composer(X - 4, 360, R - X + 8, keys=REST_KEYS)
    o.append(cb)
    o.append(placeholder_at(d, cx, cy, ph, [(on, send)]))
    o.append(d.key(R - 96, 402, "ctrl+r", 0.6, on + .1))
    # the chip: '●' (accent: the mic is live), the meter, the time; then '∿' while it writes his words
    def chip_(sign, body, w=104):
        return (f'<rect x="{cx - 2}" y="{cy - 15}" width="{w}" height="21" rx="6" fill="{c["chip"]}"/>'
                + t(cx + 6, cy, sign, 11.5, "acc" if sign == "●" else "dim") + body)
    for k in range(int(stop - on) + 1):
        a = on + k; b = min(a + 1, stop)
        if a >= stop: break
        o.append(at(a, b, chip_("●", meter(d, cx + 22, cy + 1) + t(cx + 56, cy, f"0:{k:02d}", 11.5, "dim")), dur=.05))
    o.append(at(stop, words_at, chip_('<tspan class="g">∿</tspan>', meter(d, cx + 22, cy + 1), 56), dur=.05))
    o.append(d.key(R - 64, 402, "space", stop - .3, stop + .1))
    lines = wrap(said, R - X - 40)
    for i, l in enumerate(lines):
        o.append(at(words_at, send, d.words(cx, cy + 20 * i, l, words_at + i * .3, .03), dur=.05))
    o.append(d.key(R - 50, 402, "⏎", send - .4, send + .1))
    bl, bh = d.bubble(R, 104, wrap(said, 270))
    o.append(at(send, None, bl))
    yb = 104 + bh + 24
    o.append(colT(at(7.1, None, d.head(X, yb, "bise") + t(X, yb + 20, "on it. search takes the size filter, EU sizes only.", 13)
                     + mail(d, X, yb + 48, "bise", "search", "add a size filter, EU sizes only"))))
    return d.svg("6 in bise desktop: you press ctrl+r in the composer; a chip shows the mic is live, its level and the time; a key stops it, your words come into the composer; you send them and bise starts search.")

def d_card(m):
    """7 · main answers routine questions: search asks bise something routine; bise answers it for him; nothing reaches the inbox."""
    c = DPAL[m]; T = 9.5
    d = Desk(c, T, 452); o = d.o; t = d.t; at = d.at
    TX = 448; colT, colR = cols(d, TX); X, R = 22, TX - 22
    rbar(d, TX, colR, [(0, 5.2, 2), (5.2, None, 1)], [(0, "perf", "product page speed", [(0, "∿", "dim")]),
                                                     (0, "search", "size filter", [(0, "∿", "dim"), (5.2, "✓", "dim")])])
    o.append(bise_head(d))
    body, y = main_view(d, colT, X, R)
    o.append(body)
    # search asks bise (agent to agent), bise answers it for you: '↳ bise answered search for you: which sizes? → EU only', the why dim
    y += 34
    o.append(colT(at(1.2, None, mail(d, X, y, "search", "bise", "which sizes: EU, or US too?"))))
    y += 30
    o.append(colT(at(2.6, None, t(X, y, f'<tspan fill="{c["faint"]}">↳</tspan> bise answered search for you: which sizes? → <tspan font-weight="700">EU only</tspan>', 12.5)
                     + t(X + 16, y + 20, "the shop only ships to the EU (shipping.ts), so you weren't asked.", 12, "dim"))))
    y += 52
    o.append(colT(at(5.2, None, landrow(d, X, y, who="search", sha="9f3e21b", files="2 files", plus=36, minus=4))))
    cb, ph, (cx, cy) = d.composer(X - 4, 360, R - X + 8, keys=REST_KEYS)
    o.append(cb + t(cx, cy, E(ph), 13, "faint"))
    return d.svg("7 in bise desktop: search asks bise which sizes to support; bise answers it for you (EU only, the shop only ships to the EU), so nothing waits in your inbox, and search lands its filter.")

def d_sync(m):
    """8 · agent-to-agent messages: perf and search talk; their messages fold into one quiet row; a click opens it."""
    c = DPAL[m]; T = 9.5
    d = Desk(c, T, 452); o = d.o; t = d.t; at = d.at
    TX = 448; colT, colR = cols(d, TX); X, R = 22, TX - 22
    rbar(d, TX, colR, [(0, None, 2)], [(0, "perf", "product page speed", [(0, "∿", "dim")]), (0, "search", "size filter", [(0, "∿", "dim")])])
    o.append(bise_head(d))
    body, y = main_view(d, colT, X, R)
    o.append(body)
    y += 36; op = 3.6
    for a, b, n in [(1.0, 1.8, 1), (1.8, 2.6, 2), (2.6, op, 3)]:
        words = "1 message between 2 agents" if n == 1 else f"{n} messages between 2 agents"
        o.append(colT(at(a, b, t(X, y, f'<tspan fill="{c["faint"]}">▸</tspan> {words}', 12.5, "dim"), dur=.1)))
    o.append(ring(d, X + 4, y - 4, op - .5, op + .3))
    o.append(colT(at(op, None, t(X, y, f'<tspan fill="{c["faint"]}">▾</tspan> 3 messages between 2 agents', 12.5, "dim"))))
    for i, (frm, to, what) in enumerate([("perf", "search", "i'm changing ProductCard. hold your edit 2 min?"),
                                         ("search", "perf", "ok, waiting."), ("perf", "search", "done, it's yours.")]):
        o.append(colT(at(op + .1 + i * .12, None, f'<g opacity=".8">{mail(d, X + 14, y + 28 + 26 * i, frm, to, what)}</g>', dur=.2)))
    cb, ph, (cx, cy) = d.composer(X - 4, 360, R - X + 8, keys=REST_KEYS)
    o.append(cb + t(cx, cy, E(ph), 13, "faint"))
    return d.svg("8 in bise desktop: perf and search agree who edits ProductCard; their three messages fold into one quiet row in bise's thread, '3 messages between 2 agents'; a click opens them, dim, the names in chips.")

def d_direct(m):
    """9 · talk to any agent: a click on search in the right bar; its thread; he writes to it; esc: back to bise."""
    c = DPAL[m]; T = 10.5
    d = Desk(c, T, 452); o = d.o; t = d.t; at = d.at
    TX, RB = 448, 680; colT, colR = cols(d, TX); X, R = 22, TX - 22
    go, back = 1.6, 7.4
    # the row he is on, a soft fill in the right bar
    o.append(at(go, back, f'<rect x="{TX + 8}" y="{115 - 17}" width="{RB - TX - 16}" height="24" rx="6" fill="{c["chip"]}"/>', dur=.1))
    ys = rbar(d, TX, colR, [(0, None, 2)], [(0, "perf", "product page speed", [(0, "∿", "dim")]), (0, "search", "size filter", [(0, "∿", "dim")])])
    o.append(ring(d, TX + 50, ys[1] - 4, 1.0, go + .3))
    # bise's thread, before and after
    mb, _ = main_view(d, colT, X, R)
    cb, ph, (cx, cy) = d.composer(X - 4, 360, R - X + 8, keys=REST_KEYS)
    home = bise_head(d) + mb + cb + t(cx, cy, E(ph), 13, "faint")
    o.append(at(0, go, home, dur=.05)); o.append(at(back, None, home, dur=.15))
    # search's thread
    hb, _ = ahead(d, "search", "size filter", "∿ working · 6 min")
    s = [colT(hb), d.head(X, 64, "search"),
         colT(toolrow(d, X, R, 84, f'± SizeFilter.tsx  {diffs(c, 54, 0)}', "✓ 0.2 s") + toolrow(d, X, R, 104, "$ run the search tests", "✓ 21 s")),
         colT(t(X, 134, "the filter works with EU sizes. adding US sizes next.", 13))]
    q = "skip US, the shop doesn't ship there"
    cb2, ph2, (cx2, cy2) = d.composer(X - 4, 360, R - X + 8, to="search", keys=WORKING_KEYS)
    s.append(cb2)
    send = 4.6
    s.append(placeholder_at(d, cx2, cy2, ph2, [(2.3, send)]))
    s.append(at(2.25, send, d.typing(cx2, cy2, q, 2.3, 4.0), dur=.05))
    bl, bh = d.bubble(R, 156, [q])
    s.append(at(send, None, bl))
    s.append(colT(at(5.6, None, d.head(X, 156 + bh + 24, "search") + t(X, 156 + bh + 44, "ok: EU sizes only. landing it.", 13))))
    o.append(at(go, back, "".join(s), dur=.05))
    o.append(d.key(R - 50, 402, "⏎", send - .4, send + .1))
    o.append(d.key(R - 60, 402, "esc", back - .5, back + .1))
    return d.svg("9 in bise desktop: you click search in the right bar; its thread opens; you tell it to skip US sizes and it answers; esc brings you back to bise's thread.")

DESK = [("demo-b-desktop", d_session), ("artifacts-desktop", d_artifacts), ("voicemode-desktop", d_voicemode),
        ("resume-desktop", d_resume), ("worktree-desktop", d_worktree), ("talk-desktop", d_talk),
        ("voice-desktop", d_dictation), ("card-desktop", d_card), ("sync-desktop", d_sync), ("direct-desktop", d_direct)]
