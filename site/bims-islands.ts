// the home bims (page bims-home v7, Gabriel's pick « les îles »): one little clay island per section
// (bims/<id>.webp + <id>-f.webp + islands.json, from apps/desktop/scripts/bims-sprites.mts), loaded by
// index.html everywhere but bise.dev until his go. Each sits beside its section's title, in the
// margin, never over text, a card or a button: the sides alternate (left, right, ...) and fall back
// to the other one; no room on either side (a phone): the four of ROOMS get a room of their own
// above their cards, scaled to 140 px, the others stay out. Each loads as its section nears, plays
// once per visit on screen (one at a time: a second waits for the first), then holds its pose and
// blinks every 7-9 s; off screen nothing moves; reduced motion: the held pose. Only the bims take
// pointers (a hop).
(() => {
  interface Meta { id: string; w: number; h: number; f: number[]; n: number; seq: number[]; blink: number; hit: number[]; under: number[] }
  interface Gag { m: Meta; el: HTMLElement; fr: HTMLElement; room: HTMLElement | null; shown: boolean; on: boolean; done: boolean; t: number }
  const FPS = 12;
  const KEY = 'bims-islands';
  /** the gap to the title, and the room kept around text and cards */
  const GAP = 24;
  const PAD = 12;
  /** the phone's four: the cards they get a room above */
  const ROOMS: Record<string, string> = { ways: '#ways .apps', why: '#why .beat', fun: '#fun .funs', end: '#end .apps' };
  const OBSTACLES = 'h2,h3,p,.kicker,.apps,.demo,.stage,.funs,.details,.beat,.pair,.hbox,.btn';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const px = (n: number): string => `${String(Math.round(n))}px`;
  const q = (s: string): HTMLElement | null => document.querySelector(s);
  let played: string[] = [];
  try { played = JSON.parse(sessionStorage.getItem(KEY) ?? '[]') as string[]; } catch { /* once per load */ }
  const box = document.createElement('div');
  box.className = 'bp';
  box.setAttribute('aria-hidden', 'true');
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = '/bims/islands.css';
  document.head.append(css);

  /** an element's own ink: its text's box for words, its box for a card */
  const inkOf = (e: Element): DOMRect => {
    if (!e.matches('h2,h3,p,.kicker')) return e.getBoundingClientRect();
    const r = document.createRange();
    r.selectNodeContents(e);
    return r.getBoundingClientRect();
  };
  const gags: Gag[] = [];
  const layout = (): void => {
    box.style.height = px(document.documentElement.scrollHeight);
    const taken = [...document.querySelectorAll(OBSTACLES)].map(inkOf).filter((r) => r.width > 0);
    const clear = (x: number, y: number, w: number, h: number): boolean =>
      x >= 8 && x + w <= innerWidth - 8 && taken.every((r) => x + w + PAD <= r.left || x >= r.right + PAD || y + h + PAD <= r.top || y >= r.bottom + PAD);
    gags.forEach((g, i) => {
      const { w, h, id } = g.m;
      const title = q(`#${id} h2`);
      if (!title) return;
      const t = inkOf(title);
      // left, right, left...: beside the title's words, level with them, else a little higher
      // a phone keeps to its four rooms
      const xs = innerWidth > 600 ? [t.left - GAP - w, t.right + GAP] : [];
      if (i % 2) xs.reverse();
      let at: [number, number] | null = null;
      for (const x of xs) {
        for (let dy = 0; !at && dy <= 160; dy += 16) {
          const y = t.top + t.height / 2 - h / 2 - dy;
          if (clear(x, y, w, h)) at = [x, y];
        }
        if (at) break;
      }
      let k = 1;
      const sel = ROOMS[id];
      const cards = sel ? q(sel) : null;
      if (!at && cards) {
        k = 140 / w;
        if (!g.room) { g.room = document.createElement('div'); cards.before(g.room); }
        g.room.style.height = px(h * k + 10);
        const c = cards.getBoundingClientRect();
        at = [c.right - w * k - 4, c.top - h * k - 4];
      } else {
        g.room?.remove();
        g.room = null;
      }
      g.shown = !!at;
      g.el.hidden = !at;
      if (!at) return;
      taken.push(new DOMRect(at[0], at[1], w * k, h * k));
      g.el.style.left = px(at[0] + scrollX);
      g.el.style.top = px(at[1] + scrollY);
      g.el.style.transform = k === 1 ? '' : `scale(${String(k)})`;
    });
  };

  const set = (g: Gag, i: number): void => {
    const { m } = g;
    g.fr.style.backgroundPosition = `${px(-(i === -1 ? (m.seq.at(-1) ?? 0) : i === -2 ? m.blink : i) * (m.f[2] ?? 0))} 0`;
  };
  const idle = (g: Gag): void => {
    clearTimeout(g.t);
    set(g, -1);
    if (reduced || !g.on) return;
    g.t = window.setTimeout(() => { set(g, -2); g.t = window.setTimeout(() => idle(g), 150); }, 7000 + Math.random() * 2000);
  };
  // one at a time: the gag playing, the ones waiting for it
  let busy = false;
  const waiting: Gag[] = [];
  const next = (): void => {
    const g = waiting.shift();
    if (!g) return;
    if (!g.on) { g.done = false; next(); return; }
    busy = true;
    let i = 0;
    const step = (): void => {
      if (i >= g.m.seq.length) {
        busy = false;
        played.push(g.m.id);
        try { sessionStorage.setItem(KEY, JSON.stringify(played)); } catch { /* fine */ }
        idle(g);
        next();
        return;
      }
      if (g.on) set(g, g.m.seq[i++] ?? 0);
      g.t = window.setTimeout(step, 1000 / FPS);
    };
    g.t = window.setTimeout(step, 600);
  };
  const seen = (g: Gag): void => {
    g.done = true;
    if (reduced || played.includes(g.m.id)) { idle(g); return; }
    waiting.push(g);
    if (!busy) next();
  };

  const island = (m: Meta): Gag => {
    const el = document.createElement('div');
    Object.assign(el.style, { width: px(m.w), height: px(m.h) });
    const pts = m.under.map((v, i) => `${String(i % 2 ? (v / m.h) * 100 : (v / m.w) * 100)}%`);
    const poly = Array.from({ length: 4 }, (_, i) => `${pts[i * 2] ?? ''} ${pts[i * 2 + 1] ?? ''}`).join(',');
    el.innerHTML = `<div class="sh"><b style="clip-path:polygon(${poly})"></b></div><div class="is" style="inset:0"></div>`;
    const [fx = 0, fy = 0, fw = 0, fh = 0] = m.f;
    const fr = document.createElement('div');
    fr.className = 'fr';
    Object.assign(fr.style, { left: px(fx), top: px(fy), width: px(fw), height: px(fh), backgroundSize: `${px(fw * m.n)} ${px(fh)}` });
    const hit = document.createElement('i');
    const [hx = 0, hy = 0, hw = 0, hh = 0] = m.hit;
    Object.assign(hit.style, { left: px(hx), top: px(hy), width: px(hw), height: px(hh) });
    fr.append(hit);
    el.append(fr);
    const g: Gag = { m, el, fr, room: null, shown: false, on: false, done: false, t: 0 };
    set(g, played.includes(m.id) || reduced ? -1 : (m.seq[0] ?? 0));
    // a hover or a tap on the bims hops them
    const hop = (): void => {
      if (reduced || fr.classList.contains('hopi')) return;
      fr.classList.add('hopi');
      fr.addEventListener('animationend', () => fr.classList.remove('hopi'), { once: true });
    };
    hit.addEventListener('pointerenter', hop);
    hit.addEventListener('pointerdown', hop);
    return g;
  };

  const start = (ms: Meta[]): void => {
    document.body.append(box);
    for (const m of ms) { const g = island(m); gags.push(g); box.append(g.el); }
    layout();
    const find = (e: Element): Gag | undefined => gags.find((x) => x.el === e);
    // each loads as it nears
    const near = new IntersectionObserver((es) => {
      for (const e of es) {
        const g = find(e.target);
        if (!g || !e.isIntersecting) continue;
        near.unobserve(e.target);
        (g.el.querySelector('.is') as HTMLElement).style.backgroundImage = `url(/bims/${g.m.id}.webp)`;
        g.fr.style.backgroundImage = `url(/bims/${g.m.id}-f.webp)`;
      }
    }, { rootMargin: '800px 0px' });
    const vis = new IntersectionObserver((es) => {
      for (const e of es) {
        const g = find(e.target);
        if (!g) continue;
        g.on = e.isIntersecting;
        if (g.on && !g.done) seen(g);
        else if (g.on && !waiting.includes(g)) idle(g);
        else if (!g.on && g.done && !waiting.includes(g)) clearTimeout(g.t);
      }
    }, { threshold: 0.6 });
    for (const g of gags) { near.observe(g.el); vis.observe(g.el); }
    let raf = 0;
    const again = (): void => { cancelAnimationFrame(raf); raf = requestAnimationFrame(layout); };
    addEventListener('resize', again);
    addEventListener('transitionend', again);
    new ResizeObserver(again).observe(document.body);
    // the contact sheet's shots: an island's step i (-1 held, -2 blink), every island without an id
    (window as unknown as { bimsAt: (i: number, id?: string) => void }).bimsAt = (i, id) => {
      for (const g of gags) {
        if (id && g.m.id !== id) continue;
        clearTimeout(g.t);
        g.done = true;
        set(g, i);
      }
    };
  };

  void fetch('/bims/islands.json').then((r) => r.json() as Promise<Meta[]>).then(start).catch(() => { /* the page is whole without them */ });
})();
