from build import block
from frag import *
def sw(var,lab,txt=False):
  return f'<div class="sw"><span class="chipc" data-c="{var}"></span><span><b>{lab}</b><span>--{var}</span></span></div>'
SWCSS=""
roles=[("canvas","le bureau derrière"),("window","la fenêtre, en verre"),("sidebar","la sidebar, plus claire"),("surface","le contenu"),("raised","cartes, composer"),("solid","options, diff, menus pleins"),("sunken","code, champs"),("overlay","capsule, spotlight, cartes"),
       ("text","le texte"),("text-2","le texte secondaire"),("text-3","les méta, les indices"),("ink","bouton principal, sélection forte"),("line","les filets"),("line-strong","bords des contrôles"),("hover","survol"),("active","sélection"),("focus","anneau de focus"),
       ("accent","ce qui t'attend, seulement"),("accent-soft","fond du dock"),("ok","fini, ajouté"),("err","échec, retiré")]
sw_html='<div class="sws">'+"".join(f'<div class="sw"><span class="cc c-{r}"></span><span><b>{u}</b><span>--c-{r}</span></span></div>' for r,u in roles)+'</div>'
swcss="".join(f".c-{r}{{background:var(--c-{r})}}" for r,u in roles)
EXTRA=("<style></style>")
def found():
  out=[]
  out.append(('h-color','la couleur, par rôle',"aucune couleur n'est écrite en dur dans un composant : chacun lit un rôle (--c-…), et le rôle lit la palette du thème. la palette est celle du terminal (theme.rs), donc la fenêtre et le terminal ont les mêmes couleurs. l'accent rose ne sert qu'à ce qui attend une réponse de toi : une question, une approbation, son compteur. jamais pour une sélection, un lien ou un bouton.",
    block('f-color',f'<div class="sws">{sw_html}</div>',"les rôles dans le thème en vue ; le bouton à droite passe en clair ou en sombre.").replace('<style>',f'<style>.sws{{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px}}.sw{{display:flex;gap:10px;align-items:center;padding:6px;border-radius:var(--r-2);background:var(--c-window)}}.sw b{{display:block;font-size:var(--t-12);font-weight:600;color:var(--c-text)}}.sw span span{{font:var(--t-11) var(--font-mono);color:var(--c-text-3)}}.cc{{width:36px;height:36px;border-radius:var(--r-2);box-shadow:inset 0 0 0 1px var(--c-line);flex:none}}{swcss}',1)))
  ty=[("--t-30 · display","Newsreader 500, -0.02em","salut. moi, c'est bise.","font:500 var(--t-30)/1.15 var(--font-display);letter-spacing:-.02em"),
      ("--t-22 · titre d'écran","sans 650, -0.015em","réglages","font:650 var(--t-22)/1.2 var(--font-ui);letter-spacing:-.015em"),
      ("--t-17 · en-tête de fil","sans 650","storefront","font:650 var(--t-17)/1.3 var(--font-ui)"),
      ("--t-15 · lecture","sans 400, 1.55","le p99 monte quand la compaction de 14 h tourne.","font:400 var(--t-15)/1.55 var(--font-read)"),
      ("--t-14 · liste","sans 400","search · reindex tonight 02:00?","font:400 var(--t-14)/1.35 var(--font-ui)"),
      ("--t-13 · interface","sans 400 / 500","open diff   stop   ← storefront","font:400 var(--t-13)/1.35 var(--font-ui)"),
      ("--t-12 · méta","sans 400, text-2","telemetry · alerts · 14:25","font:400 var(--t-12)/1.35 var(--font-ui);color:var(--c-text-2)"),
      ("--t-11 · touches, étiquettes","mono 400 / sans majuscules","@ file   $ skills   / commands","font:400 var(--t-11)/1.35 var(--font-mono);color:var(--c-text-3)"),
      ("--t-12 · code","JetBrains Mono, 1.6","+ workers: [Worker; 4],","font:400 var(--t-12)/1.6 var(--font-mono)")]
  tycss="".join(f".ty{i}{{{s}}}" for i,(a,b,c,s) in enumerate(ty))
  tyh='<div class="tys">'+"".join(f'<div class="tyr"><span class="tl"><b>{a}</b><span>{b}</span></span><span class="ty{i}">{c}</span></div>' for i,(a,b,c,s) in enumerate(ty))+'</div>'
  out.append(('h-type','la typographie',"deux familles, comme ChatGPT et Codex : la sans du système (SF Pro) pour tout, la mono pour le code, les touches et le diviseur du composer. la serif Newsreader seulement pour l'accueil et les grands moments (le premier lancement). le texte qu'on lit (messages, questions) est à 15, l'interface à 13 : c'est ce qui donne l'air calme sans perdre en densité. minuscules partout, comme le terminal.",
    block('f-type',tyh,"l'échelle, dans le thème en vue.").replace('<style>',f'<style>.tyr{{display:grid;grid-template-columns:220px minmax(0,1fr);gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px solid var(--c-line)}}.tl b{{display:block;font:500 var(--t-12) var(--font-mono);color:var(--c-text)}}.tl span{{font-size:var(--t-11);color:var(--c-text-3)}}{tycss}',1)))
  sp_h=('<div class="spx">'+"".join(f'<div class="spr"><span class="sl">--s-{n} · {v}px</span><span class="sbx s{n}"></span></div>' for n,v in [(1,4),(2,8),(3,12),(4,16),(5,20),(6,24),(8,32)])+'</div>'
        '<div class="rdx">'+"".join(f'<div class="rd r{n}"><span>--r-{n} · {v}</span><em>{u}</em></div>' for n,v,u in [("1","6","touches, menus"),("2","8","lignes, boutons"),("3","12","cartes, tâches"),("4","16","fenêtre, composer, dock"),("5","22","spotlight"),("pill","999","options, puces")])+'</div>'
        '<div class="elx">'+"".join(f'<div class="el e{n}"><b>--e-{n}</b><span>{u}</span></div>' for n,u in [("1","cartes, tâches, composer"),("2","menus, toasts, survol"),("3","fenêtre, capsule, spotlight")])+'<div class="el gl"><b>--glass</b><span>blur 30 + saturate 1.4, fond à 76–80 %</span></div></div>')
  spcss=("".join(f".s{n}{{width:{v}px}}" for n,v in [(1,4),(2,8),(3,12),(4,16),(5,20),(6,24),(8,32)])+
    ".spr{display:flex;align-items:center;gap:12px;height:22px}.sl{width:110px;font:var(--t-11) var(--font-mono);color:var(--c-text-2)}.sbx{height:12px;border-radius:3px;background:var(--c-accent)}"
    ".rdx{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin:16px 0}.rd{height:70px;padding:8px;background:var(--c-raised);box-shadow:var(--e-1);display:flex;flex-direction:column;justify-content:flex-end;font:var(--t-11) var(--font-mono)}.rd em{font:var(--t-11) var(--font-ui);font-style:normal;color:var(--c-text-3)}"
    ".r1{border-radius:6px}.r2{border-radius:8px}.r3{border-radius:12px}.r4{border-radius:16px}.r5{border-radius:22px}.rpill{border-radius:35px}"
    ".elx{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.el{height:84px;padding:10px;border-radius:var(--r-3);background:var(--c-solid);display:flex;flex-direction:column;justify-content:flex-end}.el b{font:600 var(--t-12) var(--font-mono)}.el span{font-size:var(--t-11);color:var(--c-text-2)}"
    ".e1{box-shadow:var(--e-1)}.e2{box-shadow:var(--e-2)}.e3{box-shadow:var(--e-3)}.gl{background:var(--c-overlay);backdrop-filter:var(--glass);box-shadow:var(--e-3)}")
  out.append(('h-space',"l'espace, les rayons, l'élévation, le verre","une grille de 4 px. les lignes de liste font 28 px (sidebar, menus) ou 34 (spotlight), les contrôles 28 à 30, le composer 48 au repos. les rayons grandissent avec la taille de l'objet. trois élévations seulement ; le verre est réservé à ce qui flotte au-dessus de tes autres apps (fenêtre, capsule, spotlight, cartes) : à l'intérieur de la fenêtre, tout est plein.",
    block('f-space',sp_h,"espaces, rayons, élévations et verre, dans le thème en vue.").replace('<style>',f'<style>{spcss}',1)))
  return out
MOTION='''<section data-kit="heading" data-id="h-motion"><h2>le mouvement</h2></section>
<section data-kit="prose" data-id="p-motion"><p>le mouvement dit ce qui change, jamais plus. quatre durées, trois courbes. le reste du temps, l'écran ne bouge pas, sauf la perle et les barres des jobs en cours, qui sont l'état lui-même. avec « réduire les animations », il ne reste que des fondus courts, et la perle reste immobile dans sa couleur.</p></section>
<section data-kit="table" data-id="motion"><table><thead><tr><th>jeton</th><th>valeur</th><th>pour</th></tr></thead><tbody>
<tr><td>--d-press</td><td>80 ms, ease-out</td><td>l'appui d'un bouton (scale 0,98)</td></tr>
<tr><td>--d-fast</td><td>140 ms, ease-out</td><td>survol, focus, une ligne qui change d'état</td></tr>
<tr><td>--d-base</td><td>220 ms, ease-pop</td><td>le dock qui monte au-dessus du composer, un toast, une carte, un interrupteur</td></tr>
<tr><td>--d-slow</td><td>360 ms, ease-out</td><td>la spotlight, la capsule, un panneau latéral, le changement de projet</td></tr>
<tr><td>--d-mood</td><td>900 ms (1 − e^(−t/0,3))</td><td>la perle qui change d'humeur : c'est pearl.js tel quel</td></tr>
<tr><td>--ease-out</td><td>cubic-bezier(.2, 0, 0, 1)</td><td>tout ce qui arrive</td></tr>
<tr><td>--ease-io</td><td>cubic-bezier(.4, 0, .2, 1)</td><td>ce qui respire en boucle (point de travail, bord de l'écran)</td></tr>
<tr><td>--ease-pop</td><td>cubic-bezier(.34, 1.4, .64, 1)</td><td>ce qui te demande quelque chose : le dock, une carte (un léger dépassement)</td></tr>
</tbody></table></section>
<section data-kit="table" data-id="moods"><table><thead><tr><th>humeur de la perle</th><th>quand</th><th>où</th></tr></thead><tbody>
<tr><td>au repos</td><td>rien ne tourne</td><td>sidebar, barre de menus</td></tr>
<tr><td>écoute</td><td>tu tiens fn</td><td>capsule, bord de l'écran</td></tr>
<tr><td>réfléchit (tourbillon)</td><td>bise ou un main travaille</td><td>sidebar, en-tête du fil, barre de menus</td></tr>
<tr><td>attend ta réponse (rose)</td><td>une question ou une approbation est ouverte</td><td>partout, avec son compteur</td></tr>
<tr><td>fini (vert, puis repos)</td><td>un job suivi se termine</td><td>carte, barre de menus, pendant 4 s</td></tr>
<tr><td>absent</td><td>hors ligne, ou le hub est arrêté</td><td>partout, plus sombre</td></tr>
</tbody></table></section>
<section data-kit="heading" data-id="h-icons"><h2>les icônes et les marques</h2></section>
<section data-kit="prose" data-id="p-icons"><p>les marques du terminal restent du texte, dans la mono : on les connaît déjà et elles passent partout (un fil copié, une notification). pour le reste : SF Symbols en 16 px, trait régulier, couleur du texte. pas d'emoji dans l'interface.</p></section>
<section data-kit="table" data-id="marks"><table><thead><tr><th>marque</th><th>veut dire</th><th>dans l'app</th></tr></thead><tbody>
<tr><td>point qui respire</td><td>travaille (∿ dans le terminal)</td><td>sidebar, tableau, spotlight</td></tr>
<tr><td>point rose, ?</td><td>attend ta réponse</td><td>partout ; le seul usage de l'accent</td></tr>
<tr><td>point vert, ✓</td><td>fini</td><td>tableau, cartes</td></tr>
<tr><td>▲ rouge</td><td>échec</td><td>message, tâche, toast</td></tr>
<tr><td>ψ</td><td>son propre worktree</td><td>sidebar, en-tête d'agent, environnements</td></tr>
<tr><td>↗</td><td>un artefact</td><td>fil, artefacts</td></tr>
<tr><td>◷</td><td>planifié</td><td>tableau</td></tr>
<tr><td>❝</td><td>une citation</td><td>composer, fil</td></tr>
<tr><td>▸</td><td>replié, ou archivé</td><td>fil, sidebar</td></tr>
</tbody></table></section>
<section data-kit="heading" data-id="h-density"><h2>la densité</h2></section>
<section data-kit="prose" data-id="p-density"><p>une seule densité par défaut, « confortable » : lignes de 28 px, fil de 760 px de large maximum, 22 px de marge. « compacte » (réglages · général) fait passer la lecture à 14 et les lignes à 24, pour qui garde la fenêtre en demi-écran. la fenêtre descend jusqu'à 720 px de large : en dessous de 1 000 px, le tableau des agents se replie en un bouton (⌘B), en dessous de 820 px, la sidebar se réduit aux perles des projets.</p></section>'''
