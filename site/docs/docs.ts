// bise.dev/docs: theme, the desktop / terminal switch, copy buttons, search, the phone menu, "on this page".
(() => {
  const r = document.documentElement;

  // the reader's app (page.tmpl's head script set app-desktop or app-terminal): the switch, a
  // folded block's line, and an 'in bise terminal: … ›' link flip it; the block keeps its place
  const app = () => (r.classList.contains('app-terminal') ? 'terminal' : 'desktop');
  // (setAttribute writes a boolean as its string; the page's markup is always there)
  const pick = (a: string | undefined, keep?: Element | null) => {
    r.classList.toggle('app-desktop', a === 'desktop');
    r.classList.toggle('app-terminal', a === 'terminal');
    try { localStorage.setItem('bise-docs-app', a as string); } catch {}
    for (const b of document.querySelectorAll<HTMLElement>('.appswitch button')) b.setAttribute('aria-pressed', (b.dataset.app === a) as unknown as string);
    if (keep) {
      const before = keep.getBoundingClientRect().top;
      scrollBy(0, keep.getBoundingClientRect().top - before);
    }
  };
  pick(app());
  for (const b of document.querySelectorAll<HTMLElement>('.appswitch button')) b.onclick = () => pick(b.dataset.app);
  for (const b of document.querySelectorAll<HTMLElement>('.scoped .fold')) b.onclick = () => pick(b.dataset.to, b.closest('.scoped'));

  // ◐ and the d key, the same stored choice as the landing (bise-theme)
  const dark = (on: boolean, keep?: boolean) => {
    r.classList.toggle('pd', on);
    if (keep) try { localStorage.setItem('bise-theme', on ? '1' : '0'); } catch {}
    document.querySelector<HTMLMetaElement>('meta[name=theme-color]')!.content = on ? '#171513' : '#f2ede2';
  };
  dark(r.classList.contains('pd'));
  document.getElementById('theme')!.onclick = () => dark(!r.classList.contains('pd'), true);
  const typing = () => /INPUT|TEXTAREA/.test(document.activeElement?.tagName || '');

  // copy: the code of a block, or the page's markdown
  const copied = (b: HTMLElement, word: string) => { const was = b.textContent; b.textContent = word; b.classList.add('done'); setTimeout(() => { b.textContent = was; b.classList.remove('done'); }, 1500); };
  const write = (t: string) => navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject();
  for (const b of document.querySelectorAll<HTMLElement>('.copy')) {
    b.onclick = () => write(b.parentElement!.querySelector('code')!.innerText.replace(/\n$/, '')).then(() => copied(b, 'copied'), () => copied(b, 'select it'));
  }
  // the fade on a code block's right edge, while there's more to scroll
  for (const pre of document.querySelectorAll('.code pre')) {
    const box = pre.parentElement!;
    const more = () => box.classList.toggle('more', pre.scrollLeft + pre.clientWidth < pre.scrollWidth - 1);
    pre.addEventListener('scroll', more, { passive: true });
    addEventListener('resize', more);
    more();
  }
  const md = document.querySelector<HTMLElement>('.copymd');
  if (md) md.onclick = () => fetch(md.dataset.md as string).then((x) => x.text()).then(write).then(() => copied(md, 'copied'), () => copied(md, "couldn't copy"));

  // the phone menu
  const menu = document.querySelector<HTMLElement>('.menu')!;
  menu.onclick = () => { const on = document.body.classList.toggle('nav-open'); menu.setAttribute('aria-expanded', on as unknown as string); };
  document.querySelector('.wrap')!.addEventListener('click', (e) => { if (document.body.classList.contains('nav-open') && !(e.target as Element).closest('.side')) { document.body.classList.remove('nav-open'); menu.setAttribute('aria-expanded', false as unknown as string); } });

  // search: search.json, loaded at the first focus
  // a search.json row: page, anchor, heading, title, text, app
  type Row = { p: string; a?: string; h?: string; t: string; x: string; app?: string };
  const input = document.querySelector<HTMLInputElement>('.search input')!, box = document.querySelector<HTMLElement>('.results')!;
  let index: Promise<Row[]> | null = null, hits: { e: Row; score: number }[] = [], on = 0;
  const load = (): Promise<Row[]> => index || (index = fetch('/docs/search.json').then((x) => x.json()));
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as Record<string, string>)[c]);
  const snippet = (text: string, words: string[]) => {
    const low = text.toLowerCase();
    let at = Math.max(0, ...words.map((w) => low.indexOf(w)).filter((i) => i >= 0).slice(0, 1));
    at = Math.max(0, at - 40);
    let s = esc((at ? '…' : '') + text.slice(at, at + 150) + (text.length > at + 150 ? '…' : ''));
    for (const w of words) s = s.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<b>$1</b>');
    return s;
  };
  const find = async (q: string) => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) { box.hidden = true; return; }
    const all = await load();
    hits = all.map((e) => {
      const h = (e.h + ' ' + e.t).toLowerCase(), x = e.x.toLowerCase();
      let score = 0;
      for (const w of words) {
        if (h.includes(w)) score += 10;
        else if (x.includes(w)) score += 1 + Math.min(3, x.split(w).length - 1) / 2;
        else return null;
      }
      // the reader's app first: a hit of the other app only after the rest
      if (e.app && e.app !== app()) score -= 100;
      return { e, score };
    }).filter((x): x is { e: Row; score: number } => Boolean(x)).sort((a, b) => b.score - a.score).slice(0, 8);
    on = 0;
    box.innerHTML = hits.length
      ? hits.map(({ e }, i) => `<a href="${e.p}${e.a ? '#' + e.a : ''}" class="${i === 0 ? 'on' : ''}"><span>${esc(e.h || e.t)}</span>${e.h ? ` <span class="where">· ${esc(e.t)}</span>` : ''}${e.app ? ` <span class="tag">bise ${e.app}</span>` : ''}<span class="snip">${snippet(e.x, words)}</span></a>`).join('')
      : '<div class="none">nothing found. try another word.</div>';
    box.hidden = false;
  };
  input.addEventListener('focus', load);
  input.addEventListener('input', () => find(input.value));
  input.addEventListener('keydown', (e) => {
    const rows = [...box.querySelectorAll('a')];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!rows.length) return;
      on = (on + (e.key === 'ArrowDown' ? 1 : rows.length - 1)) % rows.length;
      rows.forEach((a, i) => a.classList.toggle('on', i === on));
      rows[on].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && rows[on]) { location.href = rows[on].href; box.hidden = true; }
    else if (e.key === 'Escape') { input.value = ''; box.hidden = true; input.blur(); }
  });
  document.addEventListener('click', (e) => { if (!(e.target as Element).closest('.search')) box.hidden = true; });
  addEventListener('keydown', (e) => {
    if (typing()) return;
    if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); input.focus(); input.select(); }
    else if (e.key === 'd' && !e.metaKey && !e.ctrlKey && !e.altKey) dark(!r.classList.contains('pd'), true);
  });

  // on this page: the section in view
  const links = [...document.querySelectorAll<HTMLAnchorElement>('.toc a')];
  if (links.length && 'IntersectionObserver' in window) {
    const heads = links.map((a) => document.getElementById(a.hash.slice(1))).filter((h): h is HTMLElement => Boolean(h));
    const mark = () => {
      const shown = heads.filter((h) => h.offsetParent !== null);
      let cur = shown[0];
      if (!cur) return;
      for (const h of shown) if (h.getBoundingClientRect().top < 120) cur = h;
      links.forEach((a) => a.classList.toggle('on', a.hash === '#' + cur.id));
    };
    addEventListener('scroll', mark, { passive: true });
    mark();
  }
})();
