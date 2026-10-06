// mounts the live pearl (pearl.js, the capsule's shader) into every [data-bise-pearl=N]
(function(){const P=window.AmbPearl;if(!P)return;const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
for(const spot of document.querySelectorAll('[data-bise-pearl]')){const n=+spot.dataset.bisePearl||36;const cv=document.createElement('canvas');
cv.style.width=cv.style.height=n+'px';const p=P.create(cv);if(p.failed)continue;spot.replaceChildren(cv);
const mood=spot.dataset.mood||'rest';const tick=()=>{p.frame({mood,lvl:0,still},performance.now());setTimeout(tick,33)};tick();}})();
