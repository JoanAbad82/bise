from frag import *
C=[]  # (id, title, intro, keys, html)
def add(i,t,intro,keys,html): C.append((i,t,intro,keys,html))

# 1 primitives
add("prim","les primitives","boutons, puces, touches, segments, interrupteurs, champs, points d'état, barres. tout le reste est fait avec.",
 ["tab / ⇧tab : le focus suit l'ordre de lecture ; l'anneau de focus n'apparaît qu'au clavier (:focus-visible)","espace ou ⏎ : active un bouton, bascule un interrupteur","← → : change de segment quand le segment a le focus","esc : vide un champ, puis rend le focus"],
 grid([("bouton · défaut",btn("open diff")),("survol",btn("open diff","is-hover")),("focus",btn("open diff","is-focus")),("appuyé",btn("open diff","is-active")),("désactivé",btn("open diff","is-disabled")),("en cours",btn("open diff","is-loading")),
       ("principal",btn("looks good · merge","pri")),("principal en cours",btn("merge","pri is-loading")),("discret",btn("cancel","ghost")),("danger",btn("stop search","danger")),
       ("puces",'<span class="b-chip">± 3 files</span> <span class="b-chip acc">? 2</span> <span class="b-chip ok">✓ landed</span> <span class="b-chip err">▲ failed</span>'),
       ("touches",'<span class="b-kbd">⌘K</span> <span class="b-kbd">fn</span> <span class="b-kbd">⌥1</span> <span class="b-kbd">esc</span>'),
       ("segment",'<span class="b-seg"><span class="on">thread</span><span>changes ± 14</span><span>artifacts</span></span>'),
       ("interrupteur",'<span class="b-toggle on"><i></i></span> <span class="b-toggle"><i></i></span> <span class="b-toggle on is-focus"><i></i></span> <span class="b-toggle is-disabled"><i></i></span>'),
       ("champ · défaut",'<div class="b-field"><span class="ph">~/storefront</span></div>'),("champ · focus",'<div class="b-field is-focus">~/store<span class="b-kbd">tab</span></div>'),
       ("champ · erreur",'<div class="b-field is-error">~/storefrnt</div><div class="b-help err">no folder at ~/storefrnt</div>'),
       ("points d'état",f'{dot()} idle  {dot("wk")} working  {dot("nd")} needs you  {dot("ok")} done  {dot("er")} failed'),
       ("progression",bar(60)+'<div class="b-help">6 200 / 10 000 orders</div>'),("progression · inconnue",bar()),("progression · échec",bar(40,"err")),("chargement",'<span class="b-skel"></span><span class="b-skel" style=""></span>'.replace(' style=""',''))]))

# 2 window + sidebar
def side(sel="me",extra=""):
  h=['<div class="b-side"><div class="b-lights"><i></i><i></i><i></i></div>']
  h.append(f'<div class="b-row me{" on" if sel=="me" else ""}">{P(22)}<span><span class="nm">bise</span><span class="sub">every project</span></span><span class="end nd">3</span></div>')
  h.append('<div class="b-sh">projects</div>')
  h.append(row("storefront","pj"+(" on" if sel=="storefront" else ""),dot("nd",True),'<span class="end nd">1</span>'))
  for a,c in [("checkout","wk"),("search","nd"),("stock","ok")]: h.append(row(a,"ag"+(" on" if sel==a else ""),dot(c)))
  h.append(row("telemetry","pj",dot("wk",True),'<span class="end">⌘2</span>'))
  h.append(row("engine","pj",dot("",True),'<span class="end">⌘3</span>'))
  h.append(extra+'<div class="foot">+ add a project</div></div>')
  return "".join(h)
add("window","la fenêtre et la sidebar","la fenêtre est en verre (le bureau se devine derrière), la sidebar plus transparente que le contenu. en haut de la sidebar, bise, avec sa perle vivante. puis chaque projet avec sa perle d'état, son main et ses agents. un projet replié montre seulement ce qui t'attend.",
 ["⌘0 : bise · ⌘1…⌘9 : les projets dans l'ordre de la sidebar · ⌥0 : le main du projet · ⌥1…⌥9 : ses agents","↑ ↓ dans la sidebar (quand elle a le focus) · → déplie un projet, ← le replie · ⏎ ouvre","⌘[ ⌘] : le fil d'avant, d'après · ⌘\\ : cache ou montre la sidebar","clic droit sur une ligne : son menu (voir menus) · glisser un projet : change son ordre et son ⌘n"],
 grid([("fenêtre active",f'<div class="b-win"><div class="cols" style="">{side()}<div class="b-main"><div class="b-head">{P(40)}<span><span class="t1">bise</span><span class="t2">every project · 3 at work</span></span></div></div></div></div>'.replace(' style=""','')),
       ("fenêtre inactive",f'<div class="b-win is-inactive"><div class="cols">{side()}<div class="b-main"></div></div></div>')],True)
 + '<div class="b-grid" style="">'.replace(' style=""','')+"".join(st(l,pane(h)) for l,h in [
   ("ligne · défaut",row("checkout","ag",dot("wk"))),("survol",row("checkout","ag is-hover",dot("wk"))),("sélectionnée",row("checkout","ag on",dot("wk"))),("focus clavier",row("checkout","ag is-focus",dot("wk"))),
   ("attend ta réponse",row("search","ag",dot("nd"),'<span class="end nd">?</span>')),("échec",row("netcode","ag",dot("er"),'<span class="end" >▲</span>')),("archivé",row("▸ 3 archived","arch")),
   ("projet vide",row("evals","pj",dot("",True),'<span class="end">no agent</span>')),("chargement",'<span class="b-skel"></span>'),("hors ligne",row("telemetry","pj",dot("off",True),'<span class="end">offline</span>'))])+'</div>')

# 3 thread
add("thread","le fil et les messages","le fil se lit comme un document : pas de bulles, un avatar de 26 px, le nom puis l'heure, le texte à 15. tout ce qui n'est pas une phrase (outils, diffs, routage, artefacts) est un objet plat sous le message, replié par défaut quand ça vient d'un agent.",
 ["⌘E : déplie ou replie tout · espace sur un objet sélectionné : le déplie","⌘F : cherche dans le fil (↑ ↓ entre les résultats, esc ferme)","glisser dans le fil : sélectionne, et taper cite la sélection ❝ dans le composer","⌘C : copie la sélection, sinon le dernier bloc de code · fin : revient en bas"],
 grid([("ton message",pane(msg("G","you"," 14:21 · by voice, from Chrome","pourquoi le p99 d'ingest monte à 14 h ?","you"))),
       ("bise répond, en streaming",pane(msg(P(22),"bise"," 14:21","c'est telemetry. je l'ai passé à son main","is-streaming"))),
       ("le routage, en cours",pane(route(dot("wk"),"telemetry · main → alerts","p99 d'ingest à 14 h","4 min",bar(45)))),
       ("le routage, fini",pane(route(dot("ok"),"telemetry · main → alerts","p99 d'ingest à 14 h","done 14:25"))),
       ("le routage, en échec",pane(route(dot("er"),"telemetry · main","▲ stopped: the provider timed out","14:23")+'<div class="b-help">⏎ try again   ⌘. stop</div>')),
       ("un outil, replié",pane('<div class="b-tool"><span class="chev">▸</span><span class="lbl">ran 4 commands · 2 files changed</span></div>')),
       ("un outil, ouvert",pane('<div class="b-tool open"><span class="chev">▸</span><span class="lbl">cargo test -p streaming</span></div><div class="b-out">test decode_pool::keeps_order ... ok\ntest result: ok. 12 passed</div>')),
       ("un outil, en cours",pane('<div class="b-tool run"><span class="chev">▸</span><span class="lbl">running the PS5 replay</span></div>'+bar())),
       ("un outil, en échec",pane('<div class="b-tool err"><span class="chev">▸</span><span>▲ cargo test · 1 failed</span></div>')),
       ("un diff dans le fil",pane('<div class="b-diff"><div class="fh">search/synonyms.json <span class="ok">+1</span></div><div class="b-dl"><i>14</i><i>14</i><i></i>"jeans, denim",</div><div class="b-dl ad"><i></i><i>15</i><i>+</i>"tshirt, t-shirt, tee",</div></div>')),
       ("un artefact",pane(art("bars","flash sale replay","stock · 10:40"))),("un artefact, nouveau, survolé",pane(art("frames","frame times","streaming · 11:12",True).replace('b-art','b-art is-hover',1))),
       ("messages entre agents, repliés",pane('<div class="b-fold">▸ 4 messages between 2 agents</div>')),
       ("ce que main a répondu pour toi",pane('<div class="b-answered">promo asked: cumul pour les cartes cadeaux ? · i answered: non ▸ why</div>')),
       ("une question, dans le fil",pane('<div class="b-marker">? search asked you · it waits above the composer</div>')),
       ("un tour arrêté",pane(msg(dot("er",True),"checkout"," 09:52",'<span style="">▲ your ChatGPT sign-in expired. ⏎ signs you in again.</span>'.replace(' style=""',''),"is-error"))),
       ("fil vide",pane('<div class="b-empty"><b>evals n\'a pas encore d\'agent</b><span>demande à bise : « relance l\'eval rag sur le jeu d\'hier »</span></div>')),
       ("chargement",pane('<span class="b-skel"></span><br><span class="b-skel"></span>'))],True))

# 4 composer + dock
add("composer","le composer, et ce qui se pose au-dessus","la règle : tout ce qui attend ta réponse (question, approbation, inbox, erreur à reprendre) se pose dans le dock, juste au-dessus du composer, et c'est le composer qui répond. le dock monte en 220 ms avec un léger dépassement ; il ne cache jamais le texte que tu tapes.",
 ["⏎ envoie · ⇧⏎ nouvelle ligne · esc range le brouillon (↑ le rend) · ⌘Z / ⌘⇧Z","dock ouvert, composer vide : 1-9 choisit une option, ↑ ↓ puis ⏎, ← → passe à la question suivante, ⌘⌫ la ferme sans répondre","dock ouvert, tu tapes : ton texte répond à la question (une approbation : refuse, avec ton texte en note)","⌘I ouvre l'inbox dans le dock · ctrl+1-9 marche toujours · ⌘. arrête le tour en cours (le bouton envoyer devient ■)"],
 grid([("au repos",composer()),("focus",composer(box="is-focus",inner='<span class="cur"></span>')),
       ("tu tapes",composer(box="is-focus",inner='relance le replay de la flash sale<span class="cur"></span>',send="on")),
       ("avec une citation",composer("streaming",above='<div class="b-quote">❝ 1 “workers: [Worker; 4],”  decode_pool.rs:13-14 · 2 lines</div>',inner='pourquoi un pool de 4 ?<span class="cur"></span>',box="is-focus",send="on")),
       ("l'agent travaille",composer("checkout",inner='<span class="ph">steer checkout while it works</span>',send="stop")),
       ("hors ligne",composer(cls="is-disabled",inner='<span class="ph">offline · your message waits and goes when you\'re back</span>')),
       ("dock · une question",composer("bise · answering alerts",above=dock('? telemetry · alerts needs you',"passer la compaction de 14:00 à 03:00 ?",opts([("move it to 03:00",""),("leave it","")]),"1 of 3   ← →"),inner='<span class="ph">or type your answer, then ⏎</span>')),
       ("dock · option au clavier",dock('? search needs you',"réindexer ce soir à 02:00, ou maintenant ?",opts([("tonight 02:00","on"),("now","")]))),
       ("dock · choisi, envoi",dock('? search needs you',"réindexer ce soir à 02:00, ou maintenant ?",opts([("tonight 02:00","picked"),("now","is-disabled")],""),"sending…")),
       ("dock · l'inbox",'<div class="b-tabs"><span class="on">'+dot("nd")+' alerts · compaction?</span><span>'+dot("nd")+' search · reindex?</span><span>'+dot("nd")+' netcode · merge?</span></div>'+dock('? telemetry · alerts needs you',"passer la compaction de 14:00 à 03:00 ?",opts([("move it to 03:00",""),("leave it","")]),"1 of 3   ← →   esc back")),
       ("dock · la revue",dock('? streaming is done · merge it?',"merger sb/streaming dans main : 3 fichiers, 40 ms → 15 ms au replay PS5.",opts([("merge into main",""),("not yet","")]),"approval")),
       ("dock · une erreur à reprendre",dock('▲ checkout stopped',"ta connexion ChatGPT a expiré. tes agents sur ChatGPT sont arrêtés ; ils reprennent seuls une fois reconnecté.",opts([("sign in again","")],""),"bise","err")),
       ("dock · rien à répondre",dock('stock is done',"500 vendus sur 500, aucune survente.",opts([("open the report","")],""),"esc closes","plain"))],True))

# 5 board
add("board","le tableau des agents","à droite du fil d'un projet : une carte par agent, l'agent en vue cerclé d'encre. une ligne dit ce qu'il fait, en mots ; une barre seulement quand on connaît la fin. trié : ce qui t'attend, puis ce qui travaille, puis le reste.",
 ["⌥1…⌥9 : ouvre l'agent · ⌘B : cache ou montre le tableau","clic droit : le menu de l'agent (voir menus) · espace : aperçu sans quitter le fil en vue","glisser une carte sur le composer : la cite (« @checkout »)"],
 grid([(l,f'<div class="b-task {c}"><div class="a">{d} <b>{n}</b> <span class="b-kbd">⌥{k}</span>{wt}<span class="end">{e}</span></div><div class="w">{w}</div>{b}</div>') for l,c,d,n,k,wt,e,w,b in [
   ("travaille","",dot("wk"),"checkout",1," ψ","12 min","one idempotency key per order (#812)",bar(45)),
   ("travaille, sans fin connue","",dot("wk"),"promo",4,"","3 min","best of the two discounts",bar()),
   ("attend ta réponse","nd",dot("nd"),"search",2," ψ","?","reindex tonight 02:00?",""),
   ("fini","done",dot("ok"),"stock",3,"","10:40","500 of 500, no oversell",""),
   ("en échec","er",dot("er"),"netcode",5," ψ","▲","stopped: test at 150 ms failed",""),
   ("au repos","",dot(),"wallet",6," ψ","idle","Apple Pay at checkout",""),
   ("en vue","on",dot("wk"),"checkout",1," ψ","12 min","one idempotency key per order (#812)",bar(45)),
   ("survol","is-hover",dot("wk"),"checkout",1," ψ","12 min","one idempotency key per order (#812)",""),
   ("planifié","",'<span class="b-kbd">◷</span>',"search reindex",7,"","02:00","tonight, then every night",""),
   ("chargement","",'<span class="b-skel" style=""></span>'.replace(' style=""',''),"",0,"","","","")]]))

# 6 capsule
CDV='<div class="cd"><i></i></div>'
def cap(inner,r2="",hint="",cd=False,pearl=True):
  return f'<div class="b-capsule"><div class="r1">{P(56) if pearl else dot("off",True)}{inner}</div>{CDV if cd else ""}{r2}{hint}</div>'
SHOT=f'<span class="b-shot">{spark(kind="p99")}</span>'
add("capsule","la capsule de fn","elle apparaît en bas au centre de l'écran, au-dessus de l'app que tu utilises, sans lui voler le focus. c'est le composer de tout le Mac : tes mots, la capture, le contexte, puis le routage, puis la réponse au même endroit.",
 ["tenir fn : parler · relâcher : envoyer · fn esc : annuler · fn fn : mains libres (fn à nouveau pour finir)","pendant le routage (2 s) : tab passe au projet suivant, fn esc annule","carte ouverte : fn+1 / fn+2 répond, tenir fn répond à la voix, fn+⏎ ouvre dans bise, fn+esc plus tard","fn+. : silence pendant 1 h"],
 grid([("tu tiens fn, tu parles",'<div class="b-edge" style="">'.replace(' style=""','')+cap('<div class="wd">pourquoi le p99 d\'ingest monte à 14 h<span class="cur"></span></div><span class="b-wave"><i></i><i></i><i></i><i></i><i></i></span>',f'<div class="r2">{SHOT}<span class="b-chip">grafana · ingest p99</span><span class="b-chip">13:00–15:00</span><span class="b-chip">to bise</span></div>','<div class="hint">release fn to send   fn esc cancel   fn fn hands-free</div>')+'</div>'),
       ("tu relâches : le routage",cap(f'<div class="wd"><span class="lo">→</span> <b>telemetry</b> <span class="lo">· main</span><br><span class="lo">pourquoi le p99 d\'ingest monte à 14 h ?</span></div>{SHOT}',"",'<div class="hint">tab another project   fn esc cancel</div>',True)),
       ("bise répond lui-même",cap('<div class="wd">telemetry n\'a rien changé depuis hier. le pic de 14 h revient chaque jour.<br><span class="lo">bise · from telemetry\'s history</span></div>',"",'<div class="hint">fn+⏎ open in bise   esc close</div>')),
       ("mains libres",cap('<div class="wd"><span class="lo">listening… say « c\'est tout » or press fn</span></div><span class="b-wave"><i></i><i></i><i></i><i></i><i></i></span>')),
       ("pas de micro",cap('<div class="wd">bise n\'a pas accès au micro.<br><span class="lo">réglages système · confidentialité · micro</span></div>',"",'<div class="hint">⏎ open settings   esc close</div>')),
       ("hors ligne",cap('<div class="wd">hors ligne. ta question attend et part à ton retour.<br><span class="lo">pourquoi le p99 d\'ingest monte à 14 h ?</span></div><span class="b-wave off"><i></i><i></i><i></i><i></i><i></i></span>',pearl=False))],True))

# 7 spotlight
def spot(typed,rows,keys):
  r=""
  for g,items in rows:
    if g: r+=f'<div class="g">{g}</div>'
    for on,d,n,p,w,k in items: r+=f'<div class="r{" on" if on else ""}">{d}<b>{n}</b><span class="pp">{p}</span><span class="dm">{w}</span><span class="ky">{k}</span></div>'
  return f'<div class="b-spot"><div class="in">{P(40)}<span class="tx">{typed}</span><span class="to">to bise</span></div>{r}<div class="keys">{keys}</div></div>'
add("spotlight","la spotlight de fn espace","l'exception à la règle du composer : elle s'ouvre en haut de l'écran, comme celle de macOS. vide, elle montre d'abord ce qui t'attend, puis ce qui travaille, puis les environnements, avec celui de l'app devant toi en premier. ce que tu tapes va à bise ; un nom trouve un agent.",
 ["fn espace : ouvre et ferme · ↑ ↓ : choisit · ⏎ : la ligne surlignée (un nom : ouvre ; une phrase : envoie à bise)","⌘⏎ : envoie toujours à bise · tab : démarre un agent avec ces mots · esc : ferme","⌘1…⌘9 : ouvre l'environnement de ce rang"],
 grid([("vide",spot('<span class="lo">ask bise, or find an agent</span><span class="b-composer"><span class="in"><span class="cur"></span></span></span>',[("waiting for you",[(1,dot("nd"),"alerts","telemetry","compaction at 03:00?","⏎"),(0,dot("nd"),"search","storefront","reindex tonight?","")]),("at work",[(0,dot("wk"),"stock","storefront","replay · 62%","")]),("environments",[(0,dot(),"telemetry","~/telemetry","in front: grafana","⌘1")])],"⏎ open   ⌘⏎ send to bise   tab start an agent   esc close")),
       ("un nom",spot('eng',[("agents",[(1,dot("ok"),"streaming","engine","ready to merge","⏎"),(0,dot("wk"),"netcode","engine","desync at 150 ms","")]),("environments",[(0,dot(),"engine","~/engine","main · 2 agents","")])],"⏎ open streaming   ⌘⏎ send to bise   esc close")),
       ("une phrase",spot('relance le replay de la flash sale',[("",[(1,P(22),"ask bise","","relance le replay de la flash sale","⏎"),(0,dot("ok"),"stock","storefront","flash sale replay","")])],"⏎ send to bise   ↓ then ⏎ open stock   esc close")),
       ("rien ne correspond",spot('kubernetes',[("",[(1,P(22),"ask bise","","kubernetes","⏎")])],"no agent matches. ⏎ asks bise instead.")),
       ("chargement",spot('sto',[("agents",[(0,'<span class="b-skel"></span>',"","","","")])],"esc close"))],True))

# 8 side views
DIFF=('<div class="b-diff"><div class="fh">decode_pool.rs <span class="ok">+61</span></div>'
  '<div class="b-dl ad"><i></i><i>12</i><i>+</i>pub struct DecodePool {</div><div class="b-dl ad pk"><i></i><i>13</i><i>+</i>    workers: [Worker; 4],</div><div class="b-dl ad pk"><i></i><i>14</i><i>+</i>    queue: Arc&lt;SegQueue&lt;Job&gt;&gt;,</div>'
  '<div class="b-quotepop">type ask streaming about it · ⌘C copy</div><div class="b-dl rm"><i>40</i><i></i><i>−</i>let tex = decode(&amp;bytes); // on the frame</div></div>')
def sv(title,end,body): return f'<div class="b-sideview"><div class="sh2">{title}<span class="end">{end}</span></div><div class="b-files">{body}</div></div>'
add("sideviews","les vues latérales : le diff, l'artefact","elles s'ouvrent à droite du fil, sans le remplacer : le composer reste là, et ce que tu sélectionnes dedans devient une citation. une seule à la fois ; ⌘D le diff, ⏎ sur un artefact.",
 ["⌘D : le diff de l'agent en vue contre main · tab / ⇧tab : fichier suivant, précédent · ⏎ : ouvre la ligne dans ton éditeur","glisser ou ⇧↑ ↓ : sélectionne des lignes, et taper les cite dans le composer","v : les versions d'un artefact · espace : aperçu · esc : ferme la vue"],
 grid([("le diff",sv("streaming vs main",btn("open in editor","ghost")+btn("✕","ghost"),'<div class="b-row on"><span class="nm">decode_pool.rs</span><span class="end">+61</span></div><div class="b-row"><span class="nm">streamer.rs</span><span class="end">+19 −17</span></div>'+DIFF)),
       ("rien à montrer",sv("wallet vs main",btn("✕","ghost"),'<div class="b-empty"><b>aucun changement</b><span>wallet n\'a rien modifié par rapport à main.</span></div>')),
       ("l'artefact et ses versions",sv("↗ flash sale replay",'<span class="b-chip">v2 · the current one</span>',f'<div class="b-pane">{spark(kind="bars")}</div><div class="b-row"><span class="nm">v1 · 09:58</span><span class="end">stock</span></div>')),
       ("chargement",sv("streaming vs main","",'<span class="b-skel"></span><br><span class="b-skel"></span><br><span class="b-skel"></span>'))],True))

# 9 menus
def menu(items): return '<div class="b-menu">'+"".join('<div class="b-sep"></div>' if i=="-" else f'<div class="b-mi {i[2] if len(i)>2 else ""}"><span>{i[0]}</span><span class="k">{i[1]}</span></div>' for i in items)+'</div>'
add("menus","les menus","clic droit sur un agent, un projet, un message ; et le menu de la perle dans la barre de menus. les actions destructives sont en bas, en rouge, et demandent confirmation seulement quand on ne peut pas revenir en arrière.",
 ["↑ ↓ : choisit · ⏎ : lance · esc : ferme · une lettre : saute à l'entrée","les raccourcis affichés marchent aussi sans ouvrir le menu"],
 grid([("un agent",menu([("open","⏎","on"),("preview","space"),("show its diff","⌘D"),("copy the branch","⌘⇧C"),"-",("stop its turn","⌘."),("archive","⌘⌫","danger")])),
       ("un projet",menu([("open storefront's main","⌘1"),("start an agent","⌘N"),("open in Terminal",""),("open in editor",""),"-",("project settings",""),("remove from bise","","danger")])),
       ("la perle, barre de menus",menu([("3 wait for you","fn+1"),("following · stock 62%",""),"-",("open bise","⌘0"),("quiet for 1 h","fn+."),("settings…","⌘,")])),
       ("une entrée indisponible",menu([("merge into main","","dis"),("not ready: tests are running",""),"-",("open the thread","⏎")]))]))

# 10 toasts
add("toasts","les toasts","pour ce qui s'est passé et ne demande rien : copié, mergé, archivé (avec annuler). en bas à droite de la fenêtre, 4 s, un à la fois. ce qui demande une réponse n'est jamais un toast : c'est le dock.",
 ["⌘Z : annule la dernière action annulable (archiver, retirer) tant que son toast est là","survoler le toast : il reste"],
 grid([("copié",'<div class="b-toast">copied 3 lines</div>'),("une action annulable",'<div class="b-toast">search archived<span class="end">'+btn("undo","ghost")+'</span></div>'),
       ("fini",'<div class="b-toast">'+dot("ok")+' sb/streaming merged into main<span class="end">'+btn("show","ghost")+'</span></div>'),
       ("erreur",'<div class="b-toast err"><span class="m">▲</span> couldn\'t open ~/engine: no such folder<span class="end">'+btn("locate…","ghost")+'</span></div>')]))

# 11 cards over apps
add("cards","les cartes, hors de la fenêtre","quand la fenêtre n'est pas devant, ce qui t'attend vient en carte, en bas au centre, là où la capsule apparaît : la capsule est le composer du Mac. elles attendent pendant un appel, un partage d'écran ou le plein écran, puis arrivent en paquet.",
 ["fn+1 / fn+2 : répond · tenir fn : répond à la voix · fn+⏎ : ouvre dans bise · fn+esc : plus tard (elle reste dans l'inbox)","fn+i : rouvre la dernière carte"],
 grid([("une question",f'<div class="b-card"><div class="h">{P(22)}<b>telemetry · alerts</b> needs you<span class="k">4 min</span></div><div class="q">le p99 monte quand la compaction de 14 h tourne. la passer à 03:00 ?</div>'+opts([("move it to 03:00",""),("leave it","")],"")+'<div class="keys">fn+1 · fn+2   hold fn to answer   fn+⏎ open in bise</div></div>'),
       ("un paquet, après un appel",f'<div class="b-card"><div class="h">{P(22)}<b>2 questions</b> · about 1 min<span class="k">1 of 2</span></div><div class="q">search · réindexer ce soir à 02:00, ou maintenant ?</div>'+opts([("tonight 02:00",""),("now","")],"")+'</div><div class="b-stackback"></div>'),
       ("un job suivi, fini",f'<div class="b-card plain"><div class="h">{dot("ok",True)}<b>storefront · stock</b> is done<span class="k">now</span></div><div class="q">500 vendus sur 500, aucune survente.</div>'+art("bars","flash sale replay","the report")+'</div>'),
       ("pendant ton absence",f'<div class="b-card plain"><div class="h">{P(22)}<b>while you were away</b><span class="k">08:52</span></div><div class="q">3 finis · 1 question · rien de cassé</div><div class="keys">⏎ open in bise   esc close</div></div>')],True))

# 12 settings
def gi(l,s,ctl): return f'<div class="b-gi"><span class="l">{l}<span>{s}</span></span>{ctl}</div>'
T1='<span class="b-toggle on"><i></i></span>'; T0='<span class="b-toggle"><i></i></span>'
add("settings","les réglages","une fenêtre à part (⌘,), comme toute app Mac : une liste à gauche, des groupes de lignes à droite. chaque ligne dit son effet en une phrase. tout s'applique tout de suite, sans bouton « enregistrer ».",
 ["⌘, : ouvre · ↑ ↓ dans la liste · tab entre les contrôles · espace bascule · esc ferme la fenêtre"],
 grid([("un groupe",'<div class="b-group">'+gi("during a call","Zoom, Meet, FaceTime : la perle rosit, rien ne s'affiche",T1)+gi("while you share your screen","jamais une carte pendant un partage",T1)+gi("at most every","pour regrouper le reste",'<span class="b-btn">30 min ▾</span>')+'</div>'),
       ("focus, désactivé",'<div class="b-group">'+gi("the text of the window","bise voit ce que tu vois",'<span class="b-toggle on is-focus"><i></i></span>')+gi("in focus mode","suit le mode concentration de macOS · géré par macOS",'<span class="b-toggle on is-disabled"><i></i></span>')+'</div>'),
       ("un champ en erreur",'<div class="b-group">'+gi("API key","Anthropic",'<div class="b-field is-error">sk-ant-…3f9</div>')+'</div><div class="b-help err">that key was refused: check it in your Anthropic console</div>'),
       ("un compte",'<div class="b-group">'+gi("ChatGPT plan","signed in · 2 agents use it",btn("sign out","ghost"))+gi("Claude plan","not connected",btn("sign in"))+'</div>')],True))

# 13 onboarding
def onb(i,body): return '<div class="b-win"><div class="b-onb">'+body+'<div class="steps">'+"".join(f'<i class="{"on" if j==i else ""}"></i>' for j in range(5))+'</div></div></div>'
add("onboarding","le premier lancement","cinq écrans, une décision par écran, et rien ne bloque : chaque permission refusée dit ce qu'on perd et comment la rendre plus tard.",
 ["⏎ : continuer · esc : passer l'étape · ⌘Q : plus tard, on reprend au même endroit"],
 grid([("bonjour",onb(0,f'{P(120)}<div class="t">salut. moi, c\'est bise.</div><div class="s">tiens fn et parle-moi, depuis n\'importe quelle app.</div>'+btn("commencer","pri"))),
       ("les permissions",onb(1,'<div class="t">trois permissions</div><div class="b-group" style="">'.replace(' style=""','')+gi("microphone","pour parler en tenant fn",'<span class="b-chip ok">✓ allowed</span>')+gi("accessibility","fn partout, et lire l'app devant toi",'<span class="b-chip ok">✓ allowed</span>')+gi("screen recording","la capture que fn joint",btn("open settings"))+'</div>')),
       ("une permission refusée",onb(1,'<div class="t">trois permissions</div><div class="b-group">'+gi("screen recording","refusée : fn enverra tes mots sans capture",'<span class="b-chip err">denied</span>')+'</div>'+btn("continue without it"))),
       ("tes projets",onb(3,'<div class="t">tes projets</div><div class="s">4 repos trouvés dans ton dossier.</div><div class="b-group">'+"".join(gi(f'<span class="b-check {"on" if y else ""}">{"✓" if y else ""}</span> {n}',p,"") for y,n,p in [(1,"storefront","~/storefront"),(1,"telemetry","~/telemetry"),(1,"engine","~/engine"),(0,"dotfiles","~/dotfiles")])+'</div>'+btn("add 3 projects","pri"))),
       ("essaie fn",onb(4,f'{P(120)}<div class="t">essaie : tiens fn</div><div class="s">« qu\'est-ce qui a bougé dans storefront cette semaine ? »</div><span class="b-fn down">fn</span>'))],True))

def page():
  from build import block
  out=[]
  for i,t,intro,keys,html in C:
    kl="".join(f"<li>{k}</li>" for k in keys)
    out.append(f'<section data-kit="heading" data-id="h-{i}"><h3>{t}</h3></section><section data-kit="prose" data-id="p-{i}"><p>{intro}</p><ul>{kl}</ul></section>')
    out.append(block("c-"+i,html,f"{t} : tous les états, dans le thème en vue (le bouton à droite passe en clair ou en sombre). fichier : components/{i}.html"))
  return "\n".join(out)
def write_refs():
  import os
  from build import ref,D
  idx=[]
  for i,t,intro,keys,html in C:
    open(D+f'components/{i}.html','w').write(ref(i,t,html))
    idx.append(f'<li><a href="components/{i}.html">{t}</a></li>')
  open(D+'index.html','w').write(f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>bise desktop · design system</title><link rel="stylesheet" href="tokens.css"><link rel="stylesheet" href="ds.css"><style>body{{margin:0;padding:40px;background:var(--c-canvas);color:var(--c-text);font:var(--t-15) var(--font-ui)}} a{{color:var(--c-text)}}</style></head><body class="b-ui"><h1>bise desktop · design system</h1><p>tokens.css · ds.css · pearl.js + pearl-mount.js</p><ol>{"".join(idx)}</ol></body></html>')
