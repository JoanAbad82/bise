# bise desktop ds · fragments shared by the reference files and the design page
import math
DIMC=('',' sv-dim')
def P(n): return f'<span class="b-pearl s{n}" data-bise-pearl="{n}">:*</span>'
def dot(c="",lg=False): return f'<i class="b-dot {c}{" lg" if lg else ""}"></i>'
def st(lab,html): return f'<div class="b-state"><div class="b-lab">{lab}</div>{html}</div>'
def grid(items,w=False): return f'<div class="b-grid{" w" if w else ""}">'+"".join(st(l,h) for l,h in items)+'</div>'
def pane(h): return f'<div class="b-pane">{h}</div>'
def spark(w=64,h=40,kind="frames"):
  if kind=="frames":
    return f'<svg viewBox="0 0 300 80" preserveAspectRatio="none"><polyline class="sv-err" points="0,60 30,58 45,14 55,59 100,60 130,57 145,10 155,58 200,60 230,58 245,18 255,59 300,60"/><polyline class="sv-ok" points="0,64 100,63 200,64 300,63"/></svg>'
  if kind=="bars":
    s='<svg viewBox="0 0 300 80" preserveAspectRatio="none">'
    for i in range(20):
      v=20+50*abs(math.sin(i*.7)); s+=f'<rect x="{i*15+2}" y="{80-v:.0f}" width="10" height="{v:.0f}" class="sv-f{DIMC[i>=12]}"/>'
    return s+'</svg>'
  if kind=="p99":
    pts=" ".join(f'{i*300/70:.0f},{(56-4*math.sin(i*.9)) if not 30<=i<=38 else 56-46*math.sin((i-30)/8*math.pi):.0f}' for i in range(71))
    return f'<svg viewBox="0 0 300 80" preserveAspectRatio="none"><polyline class="sv-err" points="{pts}"/></svg>'
  return ''
def btn(t,cls=""): return f'<span class="b-btn {cls}">{t}</span>'
def row(t,cls="",pre="",end=""): return f'<div class="b-row {cls}">{pre}<span class="nm">{t}</span>{end}</div>'
def opt(i,t,cls=""): return f'<span class="b-opt {cls}"><b>{i}</b>{t}</span>'
def opts(xs,extra="or type your answer below"):
  return '<div class="b-opts">'+"".join(opt(i+1,x,c) for i,(x,c) in enumerate(xs))+(f'<span class="b-opt ty">{extra}</span>' if extra else '')+'</div>'
def dock(h,q,o,k="1 of 1",cls=""): return f'<div class="b-dock {cls}"><div class="h">{h}<span class="k">{k}</span></div><div class="q">{q}</div>{o}</div>'
def composer(who="bise",inner='<span class="ph">talk to bise, or hold fn</span>',above="",cls="",box="",send="off",model="opus · high"):
  s={"off":'<span class="send off">↑</span>',"on":'<span class="send">↑</span>',"stop":'<span class="send stop">■</span>'}[send]
  return (f'<div class="b-composer {cls}">{above}<div class="div">you → {who} · {model}</div><div class="box {box}"><div class="in">{inner}</div>{s}</div>'
          '<div class="keys">@ file   $ skills   / commands   ⌘I inbox</div></div>')
def msg(av,who,t,text,cls="",extra=""):
  return f'<div class="b-msg {cls}"><div class="b-av">{av}</div><div><div class="b-who"><b>{who}</b>{t}</div><div class="b-text">{text}</div>{extra}</div></div>'
def route(d,p1,p2,p3,bar=""): return f'<div class="b-route">{d}<span><span class="p1">{p1}</span> <span class="p2">{p2}</span></span><span class="p3">{p3}</span>{bar}</div>'
def bar(p=None,cls=""): return f'<div class="b-bar {cls}"><i class="w{p}"></i></div>' if p is not None else f'<div class="b-bar ind {cls}"><i></i></div>'
NEWC=' <span class="b-chip acc">new</span>'
def art(kind,n,m,new=False): return f'<div class="b-art"><span class="th">{spark(kind=kind)}</span><span><span class="an">↗ {n}</span>{NEWC if new else ""}<span class="am">{m}</span></span></div>'
