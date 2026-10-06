import sys,os
D=os.path.dirname(os.path.abspath(__file__))+'/'
sys.path.insert(0,D)
from head import HEAD,POLISH
import found
def H(i,t,p): return f'<section data-kit="heading" data-id="{i}"><h2>{t}</h2></section><section data-kit="prose" data-id="p-{i}"><p>{p}</p></section>'
parts=sys.argv[1]
v=sys.argv[2]
out=[HEAD.format(v=v,ref=D.rstrip('/').replace(os.path.expanduser('~'),'~'))]
if 'w' in parts: out.append('<section data-kit="callout" data-id="writing"><h3>en cours…</h3><p>'+sys.argv[3]+'</p></section>')
out.append(POLISH)
out.append('<section data-kit="heading" data-id="h-found"><h2>les fondations</h2></section>')
for i,t,p,b in found.found(): out.append(f'<section data-kit="heading" data-id="{i}"><h3>{t}</h3></section><section data-kit="prose" data-id="p-{i}"><p>{p}</p></section>'+b)
out.append(found.MOTION)
if 'c' in parts:
  import comps
  out.append('<section data-kit="heading" data-id="h-comps"><h2>les composants</h2></section>')
  out.append(comps.page())
if 'p' in parts:
  import patterns
  out.append(patterns.PAT)
print("\n".join(out))
