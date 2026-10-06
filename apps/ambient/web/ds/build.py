import os,sys,re
D=os.path.dirname(os.path.abspath(__file__))+'/'
sys.path.insert(0,D)
ROLES=open(D+'roles.css').read().split('*/',1)[1].strip()
DS=open(D+'ds.css').read()
PAGEMAP=("--p-bg:var(--term-bg);--p-text:var(--term-text);--p-dim:var(--term-dim);--p-faint:var(--term-faint);--p-rule:var(--term-rule);"
 "--p-accent:var(--term-accent);--p-err:var(--term-err);--p-ok:var(--term-ok);--p-raised:var(--term-raised);--p-chip:var(--term-chip);--p-frame:var(--term-frame);--p-shadow:var(--term-frame);")
PAGECSS=f".b-ui{{{PAGEMAP}{ROLES}}}\n"+DS
def block(bid,inner,cap,stage=True):
  o,c=('<div class="b-stage">','</div>') if stage else ('','')
  body=f'<div class="b-ui">{o}{inner}{c}</div>'
  return f'<section data-kit="ui" data-id="{bid}"><style>{PAGECSS}</style><figure class="k-term" data-ui="term">{body}<figcaption>{cap}</figcaption></figure></section>'
def ref(name,title,inner):
  return f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>bise desktop · {title}</title>
<link rel="stylesheet" href="../tokens.css"><link rel="stylesheet" href="../ds.css">
<style>body{{margin:0;padding:32px;background:var(--c-canvas)}} h1{{font:600 var(--t-22) var(--font-ui);color:var(--c-text);margin:0 0 16px}} .bar{{display:flex;gap:8px;margin-bottom:16px}}</style></head>
<body class="b-ui"><h1>{title}</h1><div class="bar"><button class="b-btn" onclick="document.documentElement.dataset.theme='dark'">dark</button><button class="b-btn" onclick="document.documentElement.dataset.theme='light'">light</button></div>
<div class="b-stage">{inner}</div><script src="../pearl.js"></script><script src="../pearl-mount.js"></script></body></html>'''
